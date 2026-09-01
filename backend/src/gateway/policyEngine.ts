import { createHash } from 'node:crypto';
import { TransactionProposal, TransactionProposalSchema } from '../agent/proposalTypes.js';
import { catalogDb } from '../catalog/catalogDb.js';
import { Product } from '../catalog/catalogTypes.js';

/**
 * RailFence Policy Engine Configuration Interface
 * Defines merchant-controlled guardrails for transaction evaluation.
 */
export interface RailFencePolicyConfig {
  /** Maximum allowed overall discount percentage relative to public list prices (0 - 100) */
  maxDiscountPercent: number;
  /** Maximum allowed total price for a single transaction in INR */
  maxTransactionAmount: number;
  /** Rolling velocity limit: maximum approved orders per session */
  maxOrdersPerSession: number;
  /** Rolling velocity limit: maximum cumulative spend per session in INR */
  maxSpendPerSession: number;
  /** Enable strict floor price validation against merchant catalog private floor prices */
  strictFloorPriceCheck: boolean;
}

/**
 * Default merchant policy parameters for RailFence.
 */
export const DEFAULT_RAILFENCE_POLICY: RailFencePolicyConfig = {
  maxDiscountPercent: 25,
  maxTransactionAmount: 200000,
  maxOrdersPerSession: 3,
  maxSpendPerSession: 300000,
  strictFloorPriceCheck: true,
};

/**
 * Breakdown of individual policy checks executed during evaluation.
 */
export interface PolicyCheckDetails {
  schemaValid: boolean;
  skusValid: boolean;
  mathValid: boolean;
  floorPriceValid: boolean;
  discountValid: boolean;
  velocityValid: boolean;
}

/**
 * Outcome of a RailFence policy evaluation.
 */
export interface PolicyEvaluationResult {
  status: 'APPROVED' | 'BLOCKED';
  transactionId: string;
  contractHash?: string;
  reasons: string[];
  recalculatedTotal: number;
  evaluatedAt: string;
  checks: PolicyCheckDetails;
}

/**
 * In-memory rolling session velocity record.
 */
export interface SessionVelocityState {
  orderCount: number;
  totalSpend: number;
  approvedTransactions: string[];
}

/**
 * Utility to generate a deterministic SHA-256 contract hash for an approved proposal.
 * Bound to downstream payment execution (M8).
 */
export function generateContractHash(proposal: TransactionProposal): string {
  const canonicalPayload = JSON.stringify({
    transactionId: proposal.transactionId,
    sessionId: proposal.sessionId,
    buyerId: proposal.buyerId,
    items: proposal.items.map((item) => ({
      sku: item.sku,
      quantity: item.quantity,
      proposedUnitPrice: item.proposedUnitPrice,
      originalUnitPrice: item.originalUnitPrice,
    })),
    proposedDiscountPercent: proposal.proposedDiscountPercent,
    proposedTotal: proposal.proposedTotal,
    currency: proposal.currency,
  });
  return createHash('sha256').update(canonicalPayload).digest('hex');
}

/**
 * RailFence Policy Engine
 * Deterministic security boundary enforcing merchant policies before payment execution.
 */
export class RailFencePolicyEngine {
  private sessionVelocityMap: Map<string, SessionVelocityState> = new Map();

  /**
   * Retrieves or initializes velocity state for a session.
   */
  public getSessionVelocity(sessionId: string): SessionVelocityState {
    let state = this.sessionVelocityMap.get(sessionId);
    if (!state) {
      state = { orderCount: 0, totalSpend: 0, approvedTransactions: [] };
      this.sessionVelocityMap.set(sessionId, state);
    }
    return state;
  }

  /**
   * Resets session velocity tracking (primarily for testing and session management).
   */
  public resetSessionVelocity(sessionId?: string): void {
    if (sessionId) {
      this.sessionVelocityMap.delete(sessionId);
    } else {
      this.sessionVelocityMap.clear();
    }
  }

  /**
   * Evaluates a TransactionProposal payload against deterministic merchant policies.
   *
   * @param rawProposal Raw proposal object or parsed TransactionProposal.
   * @param customPolicy Optional merchant policy configuration overrides.
   * @param catalogId Optional catalog ID override ('hardware' or 'photography').
   */
  public evaluateProposal(
    rawProposal: unknown,
    customPolicy: Partial<RailFencePolicyConfig> = {},
    catalogId?: string
  ): PolicyEvaluationResult {
    const policy: RailFencePolicyConfig = { ...DEFAULT_RAILFENCE_POLICY, ...customPolicy };
    const evaluatedAt = new Date().toISOString();
    const reasons: string[] = [];

    const checks: PolicyCheckDetails = {
      schemaValid: true,
      skusValid: true,
      mathValid: true,
      floorPriceValid: true,
      discountValid: true,
      velocityValid: true,
    };

    // 1. Schema Validation Check
    const schemaResult = TransactionProposalSchema.safeParse(rawProposal);
    if (!schemaResult.success) {
      checks.schemaValid = false;
      const formattedErrors = schemaResult.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
      reasons.push(`SCHEMA_VIOLATION: Payload failed Zod schema validation (${formattedErrors})`);
      return {
        status: 'BLOCKED',
        transactionId: (rawProposal as any)?.transactionId || 'unknown',
        reasons,
        recalculatedTotal: 0,
        evaluatedAt,
        checks,
      };
    }

    const proposal: TransactionProposal = schemaResult.data;
    const { transactionId, sessionId, items, proposedTotal } = proposal;

    // 2. SKU Existence & Product Catalog Verification
    const productMap = new Map<string, Product>();
    for (const item of items) {
      // Lookup product in specified catalog or across all registered catalogs
      let product: Product | undefined;
      if (catalogId) {
        product = catalogDb.getProduct(item.sku, catalogId);
      } else {
        product = catalogDb.getProduct(item.sku, catalogDb.getActiveCatalogId()) ||
                  catalogDb.getProduct(item.sku, 'hardware') ||
                  catalogDb.getProduct(item.sku, 'photography');
      }

      if (!product) {
        checks.skusValid = false;
        reasons.push(`UNKNOWN_SKU: Item with SKU '${item.sku}' does not exist in active merchant catalog.`);
      } else {
        productMap.set(item.sku, product);
      }
    }

    // 3. Mathematical Recalculation Check
    let recalculatedTotal = 0;
    let totalPublicListPrice = 0;

    for (const item of items) {
      const itemSubtotal = item.quantity * item.proposedUnitPrice;
      recalculatedTotal += itemSubtotal;

      const product = productMap.get(item.sku);
      if (product) {
        totalPublicListPrice += item.quantity * product.price;
      } else {
        totalPublicListPrice += item.quantity * (item.originalUnitPrice || item.proposedUnitPrice);
      }
    }

    // Floating-point comparison with epsilon tolerance (0.01)
    if (Math.abs(proposedTotal - recalculatedTotal) > 0.01) {
      checks.mathValid = false;
      reasons.push(`RECALCULATION_MISMATCH: Proposed total (${proposedTotal}) does not match recalculated sum of items (${recalculatedTotal}).`);
    }

    // 4. Floor Price Validation (Strict Private Merchant Boundary)
    if (policy.strictFloorPriceCheck) {
      for (const item of items) {
        const product = productMap.get(item.sku);
        if (product && product.floorPrice !== undefined) {
          if (item.proposedUnitPrice < product.floorPrice) {
            checks.floorPriceValid = false;
            // CRITICAL PRIVACY GUARDRAIL: Do NOT expose actual floorPrice numerical value in public reason!
            reasons.push(`FLOOR_PRICE_VIOLATION: Proposed unit price for item '${item.sku}' is below the merchant minimum threshold.`);
          }
        }
      }
    }

    // 5. Discount Limit Validation
    const effectiveDiscountPercent = totalPublicListPrice > 0
      ? Math.max(0, ((totalPublicListPrice - recalculatedTotal) / totalPublicListPrice) * 100)
      : 0;

    if (effectiveDiscountPercent > policy.maxDiscountPercent + 0.01) {
      checks.discountValid = false;
      reasons.push(`DISCOUNT_LIMIT_EXCEEDED: Calculated discount of ${effectiveDiscountPercent.toFixed(2)}% exceeds maximum allowed limit of ${policy.maxDiscountPercent}%.`);
    }

    // 6. Velocity & Transaction Limit Validation
    if (recalculatedTotal > policy.maxTransactionAmount) {
      checks.velocityValid = false;
      reasons.push(`TRANSACTION_AMOUNT_EXCEEDED: Proposal total (${recalculatedTotal} INR) exceeds single transaction limit of ${policy.maxTransactionAmount} INR.`);
    }

    const sessionVelocity = this.getSessionVelocity(sessionId);
    if (sessionVelocity.orderCount + 1 > policy.maxOrdersPerSession) {
      checks.velocityValid = false;
      reasons.push(`VELOCITY_LIMIT_EXCEEDED: Session '${sessionId}' has reached maximum allowed order limit of ${policy.maxOrdersPerSession} orders.`);
    }

    if (sessionVelocity.totalSpend + recalculatedTotal > policy.maxSpendPerSession) {
      checks.velocityValid = false;
      reasons.push(`VELOCITY_LIMIT_EXCEEDED: Cumulative spend for session '${sessionId}' (${sessionVelocity.totalSpend + recalculatedTotal} INR) exceeds session spend cap of ${policy.maxSpendPerSession} INR.`);
    }

    // Determine Final Decision
    const isApproved = checks.schemaValid &&
                      checks.skusValid &&
                      checks.mathValid &&
                      checks.floorPriceValid &&
                      checks.discountValid &&
                      checks.velocityValid;

    if (isApproved) {
      // Record approved order in session velocity tracker
      sessionVelocity.orderCount += 1;
      sessionVelocity.totalSpend += recalculatedTotal;
      sessionVelocity.approvedTransactions.push(transactionId);

      const contractHash = generateContractHash(proposal);
      return {
        status: 'APPROVED',
        transactionId,
        contractHash,
        reasons: [],
        recalculatedTotal,
        evaluatedAt,
        checks,
      };
    } else {
      return {
        status: 'BLOCKED',
        transactionId,
        reasons,
        recalculatedTotal,
        evaluatedAt,
        checks,
      };
    }
  }
}

/**
 * Singleton instance of the RailFence Policy Engine.
 */
export const railFencePolicyEngine = new RailFencePolicyEngine();

/**
 * Functional wrapper for evaluating proposals against RailFence.
 */
export function evaluateProposal(
  rawProposal: unknown,
  customPolicy?: Partial<RailFencePolicyConfig>,
  catalogId?: string
): PolicyEvaluationResult {
  return railFencePolicyEngine.evaluateProposal(rawProposal, customPolicy, catalogId);
}
