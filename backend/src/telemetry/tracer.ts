import { promises as fs } from 'node:fs';
import path from 'node:path';
import { TransactionProposal } from '../agent/proposalTypes.js';
import { PolicyEvaluationResult, PolicyCheckDetails } from '../gateway/policyEngine.js';
import { RazorpayOrderResult } from '../payments/razorpayClient.js';
import { config } from '../config.js';

export interface AOVUplift {
  baseTotal: number;
  proposedTotal: number;
  upliftAmount: number;
  upliftPercent: number;
}

export interface DecisionTrace {
  traceId: string;
  transactionId: string;
  sessionId: string;
  buyerId: string;
  evaluatedAt: string;
  negotiationTimeMs: number;
  proposal: {
    items: Array<{
      sku: string;
      quantity: number;
      proposedUnitPrice: number;
      originalUnitPrice: number;
    }>;
    proposedDiscountPercent: number;
    proposedTotal: number;
    baseTotal: number;
    currency: string;
    appliedGrowthActions: string[];
    negotiationContext: string;
  };
  evaluationStatus: 'APPROVED' | 'BLOCKED';
  checks: PolicyCheckDetails;
  reasons: string[];
  contractHash?: string;
  razorpayResult?: RazorpayOrderResult;
  razorpayCallsCount: number;
  growthActions: string[];
  aovUplift: AOVUplift;
}

export interface CreateTraceInput {
  proposal: TransactionProposal;
  evaluationResult: PolicyEvaluationResult;
  razorpayResult?: RazorpayOrderResult;
  negotiationTimeMs?: number;
}

const DEFAULT_TRACE_DIR = path.join(process.cwd(), 'data', 'traces');

export function getTraceDirectory(customDir?: string): string {
  return customDir || process.env.TRACE_DIR || DEFAULT_TRACE_DIR;
}

/**
 * Sanitizes a object to recursively remove any private pricing/floorPrice fields.
 */
export function sanitizeTrace<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeTrace(item)) as unknown as T;
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.toLowerCase().includes('floorprice') || key.toLowerCase().includes('merchantcost')) {
      continue; // Omit private merchant pricing data
    }
    sanitized[key] = sanitizeTrace(value);
  }
  return sanitized as T;
}

/**
 * Records an immutable decision trace log to disk as a JSON file.
 */
export async function recordTrace(
  input: CreateTraceInput,
  customDir?: string
): Promise<DecisionTrace> {
  const { proposal, evaluationResult, razorpayResult, negotiationTimeMs = 0 } = input;
  const traceDir = getTraceDirectory(customDir);

  // Ensure trace directory exists
  await fs.mkdir(traceDir, { recursive: true });

  const hasGrowthExpansion = proposal.appliedGrowthActions.some(
    (action) => action === 'bundle' || action === 'cross_sell'
  );
  const hasNoGrowthAction = proposal.appliedGrowthActions.includes('none') || proposal.appliedGrowthActions.length === 0;

  let baseTotal: number;
  if (hasGrowthExpansion && proposal.items.length > 1) {
    // Primary item (items[0]) represents the buyer's original purchase baseline
    baseTotal = proposal.items[0].originalUnitPrice * proposal.items[0].quantity;
  } else if (hasNoGrowthAction) {
    // No growth expansion occurred; baseline equals proposedTotal (zero growth uplift)
    baseTotal = proposal.proposedTotal;
  } else {
    // Default fallback: total original list price of proposal items
    // Note: For single-item upgrades, the proposal contract does not store the pre-upgrade SKU's baseline price.
    baseTotal = proposal.items.reduce(
      (sum, item) => sum + item.originalUnitPrice * item.quantity,
      0
    );
  }

  const proposedTotal = proposal.proposedTotal;
  const upliftAmount = proposedTotal - baseTotal;
  const upliftPercent = baseTotal > 0 ? Number(((upliftAmount / baseTotal) * 100).toFixed(2)) : 0;

  // Enforce zero Razorpay calls for BLOCKED proposals
  const razorpayCallsCount = evaluationResult.status === 'BLOCKED'
    ? 0
    : razorpayResult
    ? 1
    : 0;

  const traceId = `trace_${proposal.transactionId}`;

  const trace: DecisionTrace = {
    traceId,
    transactionId: proposal.transactionId,
    sessionId: proposal.sessionId,
    buyerId: proposal.buyerId,
    evaluatedAt: evaluationResult.evaluatedAt || new Date().toISOString(),
    negotiationTimeMs,
    proposal: {
      items: proposal.items.map((i) => ({
        sku: i.sku,
        quantity: i.quantity,
        proposedUnitPrice: i.proposedUnitPrice,
        originalUnitPrice: i.originalUnitPrice,
      })),
      proposedDiscountPercent: proposal.proposedDiscountPercent,
      proposedTotal: proposal.proposedTotal,
      baseTotal,
      currency: proposal.currency || 'INR',
      appliedGrowthActions: [...proposal.appliedGrowthActions],
      negotiationContext: proposal.negotiationContext,
    },
    evaluationStatus: evaluationResult.status,
    checks: { ...evaluationResult.checks },
    reasons: [...evaluationResult.reasons],
    contractHash: evaluationResult.contractHash,
    razorpayResult: razorpayResult ? sanitizeTrace(razorpayResult) : undefined,
    razorpayCallsCount,
    growthActions: [...proposal.appliedGrowthActions],
    aovUplift: {
      baseTotal,
      proposedTotal,
      upliftAmount,
      upliftPercent,
    },
  };

  const sanitized = sanitizeTrace(trace);
  const fileName = `${trace.transactionId}.json`;
  const filePath = path.join(traceDir, fileName);

  await fs.writeFile(filePath, JSON.stringify(sanitized, null, 2), 'utf-8');
  return sanitized;
}

/**
 * Reads all trace records from disk cleanly and safely.
 */
export async function getAllTraces(customDir?: string): Promise<DecisionTrace[]> {
  const traceDir = getTraceDirectory(customDir);
  try {
    const files = await fs.readdir(traceDir);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    const traces: DecisionTrace[] = [];
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(traceDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(content);
        traces.push(sanitizeTrace(parsed));
      } catch (err) {
        // Ignore unparseable files safely
      }
    }

    // Sort chronologically by evaluatedAt
    return traces.sort((a, b) => new Date(a.evaluatedAt).getTime() - new Date(b.evaluatedAt).getTime());
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}
