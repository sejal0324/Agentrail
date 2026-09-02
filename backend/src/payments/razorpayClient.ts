import Razorpay from 'razorpay';
import { TransactionProposal } from '../agent/proposalTypes.js';
import { PolicyEvaluationResult as RailFenceEvaluationResult } from '../gateway/policyEngine.js';
import { config } from '../config.js';

export interface RazorpayOrderResult {
  success: boolean;
  orderId?: string;
  amount?: number;
  currency?: string;
  receipt?: string;
  status?: string;
  contractHash?: string;
  notes?: Record<string, string>;
  rawOrder?: any;
  error?: string;
}

export interface CreateOrderOptions {
  keyId?: string;
  keySecret?: string;
  receipt?: string;
  customNotes?: Record<string, string>;
  razorpayInstance?: Razorpay;
}

/**
 * Converts standard currency amounts to smallest subunit (e.g. INR -> paise).
 */
export function convertToSubunits(amount: number, currency: string = 'INR'): number {
  const zeroDecimalCurrencies = [
    'JPY', 'KRW', 'VND', 'CLP', 'BIF', 'DJF', 'GNF', 'KMF',
    'MGA', 'PYG', 'RWF', 'UGX', 'VUV'
  ];
  const upperCurrency = (currency || 'INR').toUpperCase();
  if (zeroDecimalCurrencies.includes(upperCurrency)) {
    return Math.round(amount);
  }
  return Math.round(amount * 100);
}

/**
 * Generates a clean receipt ID within Razorpay's 40-character limit.
 */
export function generateReceiptId(transactionId: string): string {
  const cleanId = (transactionId || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 30);
  return `rcpt_${cleanId || Date.now().toString()}`;
}

export class RazorpayClient {
  private razorpayInstance?: Razorpay;

  constructor(options?: { keyId?: string; keySecret?: string; razorpayInstance?: Razorpay }) {
    if (options?.razorpayInstance) {
      this.razorpayInstance = options.razorpayInstance;
    } else {
      const keyId = options?.keyId ?? config.RAZORPAY_KEY_ID;
      const keySecret = options?.keySecret ?? config.RAZORPAY_KEY_SECRET;
      if (keyId && keySecret) {
        this.razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret });
      }
    }
  }

  /**
   * Create a Razorpay TEST-mode order from an approved proposal & RailFence evaluation.
   * Enforces 0 SDK calls for BLOCKED proposals.
   */
  public async createOrder(
    proposal: TransactionProposal,
    evaluationResult: RailFenceEvaluationResult,
    options?: CreateOrderOptions
  ): Promise<RazorpayOrderResult> {
    // 1. Strict RailFence Policy Validation Check
    if (evaluationResult.status !== 'APPROVED') {
      throw new Error(
        `Cannot create Razorpay order: Transaction proposal was BLOCKED by RailFence Policy Gateway. (0 SDK calls executed)`
      );
    }

    const contractHash = evaluationResult.contractHash;
    if (!contractHash || contractHash.trim() === '') {
      throw new Error('Cannot create Razorpay order: Missing contractHash from RailFence evaluation.');
    }

    // 2. Prepare Order Payload & Notes Metadata (contractHash, transactionId, growthActions)
    const totalAmount = evaluationResult.recalculatedTotal ?? proposal.proposedTotal;
    const currency = proposal.currency || 'INR';
    const amountSubunits = convertToSubunits(totalAmount, currency);
    const receipt = options?.receipt || generateReceiptId(proposal.transactionId);

    const growthActionsStr = Array.isArray(proposal.appliedGrowthActions)
      ? proposal.appliedGrowthActions.join(',')
      : String(proposal.appliedGrowthActions || '');

    const notes: Record<string, string> = {
      contractHash: contractHash,
      transactionId: proposal.transactionId,
      growthActions: growthActionsStr,
      sessionId: proposal.sessionId,
      buyerId: proposal.buyerId,
      evaluatedAt: evaluationResult.evaluatedAt || new Date().toISOString(),
    };

    if (options?.customNotes) {
      for (const [k, v] of Object.entries(options.customNotes)) {
        notes[k] = String(v);
      }
    }

    // 3. Resolve Razorpay Instance
    let activeInstance = options?.razorpayInstance || this.razorpayInstance;
    if (!activeInstance && (options?.keyId || options?.keySecret)) {
      const kId = options.keyId || config.RAZORPAY_KEY_ID;
      const kSecret = options.keySecret || config.RAZORPAY_KEY_SECRET;
      if (kId && kSecret) {
        activeInstance = new Razorpay({ key_id: kId, key_secret: kSecret });
      }
    }

    // 4. Missing Credentials Check
    if (!activeInstance) {
      throw new Error(
        'Razorpay API credentials missing or not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment.'
      );
    }

    // 5. Official SDK Execution
    try {
      const sdkOrder = await activeInstance.orders.create({
        amount: amountSubunits,
        currency: currency.toUpperCase(),
        receipt: receipt,
        notes: notes,
      });

      return {
        success: true,
        orderId: sdkOrder.id,
        amount: Number(sdkOrder.amount),
        currency: sdkOrder.currency,
        receipt: sdkOrder.receipt || receipt,
        status: sdkOrder.status,
        contractHash: contractHash,
        notes: (sdkOrder.notes as Record<string, string>) || notes,
        rawOrder: sdkOrder,
      };
    } catch (err: any) {
      return {
        success: false,
        contractHash: contractHash,
        error: err.message || 'Razorpay SDK order creation failed',
      };
    }
  }
}

// Singleton default client instance
export const razorpayClient = new RazorpayClient();

/**
 * Convenience helper function to create a Razorpay test order from proposal & RailFence evaluation.
 */
export async function createRazorpayOrder(
  proposal: TransactionProposal,
  evaluationResult: RailFenceEvaluationResult,
  options?: CreateOrderOptions
): Promise<RazorpayOrderResult> {
  const client = options?.razorpayInstance
    ? new RazorpayClient({ razorpayInstance: options.razorpayInstance })
    : razorpayClient;
  return client.createOrder(proposal, evaluationResult, options);
}
