import { DecisionTrace, getAllTraces } from './tracer.js';

export interface GrowthUpliftMetrics {
  absoluteAmount: number;
  percentage: number;
}

export interface CategorizedBlockCounts {
  FLOOR_PRICE_VIOLATION: number;
  DISCOUNT_LIMIT_EXCEEDED: number;
  VELOCITY_LIMIT_EXCEEDED: number;
  SCHEMA_VIOLATION: number;
  UNKNOWN_SKU: number;
  RECALCULATION_MISMATCH: number;
  [key: string]: number;
}

export interface TelemetryMetrics {
  aov: number;
  growthUplift: GrowthUpliftMetrics;
  totalAgentActions: number;
  categorizedBlockCounts: CategorizedBlockCounts;
  averageTimeToAgreementMs: number;
  razorpayCallsCount: number;
}

/**
 * Calculates aggregated growth metrics from a list of decision trace objects.
 */
export function calculateMetricsFromTraces(traces: DecisionTrace[]): TelemetryMetrics {
  const totalAgentActions = traces.length;

  const approvedTraces = traces.filter((t) => t.evaluationStatus === 'APPROVED');
  const blockedTraces = traces.filter((t) => t.evaluationStatus === 'BLOCKED');

  // AOV: Average Order Value across APPROVED proposals
  const totalApprovedRevenue = approvedTraces.reduce(
    (sum, t) => sum + t.proposal.proposedTotal,
    0
  );
  const aov = approvedTraces.length > 0
    ? Number((totalApprovedRevenue / approvedTraces.length).toFixed(2))
    : 0;

  // Growth Uplift: calculated across APPROVED proposals
  const totalBaseValue = approvedTraces.reduce((sum, t) => sum + t.aovUplift.baseTotal, 0);
  const totalProposedValue = approvedTraces.reduce((sum, t) => sum + t.aovUplift.proposedTotal, 0);
  const absoluteUplift = totalProposedValue - totalBaseValue;
  const percentageUplift = totalBaseValue > 0
    ? Number(((absoluteUplift / totalBaseValue) * 100).toFixed(2))
    : 0;

  // Categorized Block Counts
  const categorizedBlockCounts: CategorizedBlockCounts = {
    FLOOR_PRICE_VIOLATION: 0,
    DISCOUNT_LIMIT_EXCEEDED: 0,
    VELOCITY_LIMIT_EXCEEDED: 0,
    SCHEMA_VIOLATION: 0,
    UNKNOWN_SKU: 0,
    RECALCULATION_MISMATCH: 0,
  };

  for (const trace of blockedTraces) {
    for (const reason of trace.reasons) {
      if (reason.includes('FLOOR_PRICE_VIOLATION')) {
        categorizedBlockCounts.FLOOR_PRICE_VIOLATION += 1;
      } else if (reason.includes('DISCOUNT_LIMIT_EXCEEDED')) {
        categorizedBlockCounts.DISCOUNT_LIMIT_EXCEEDED += 1;
      } else if (reason.includes('VELOCITY_LIMIT_EXCEEDED')) {
        categorizedBlockCounts.VELOCITY_LIMIT_EXCEEDED += 1;
      } else if (reason.includes('SCHEMA_VIOLATION')) {
        categorizedBlockCounts.SCHEMA_VIOLATION += 1;
      } else if (reason.includes('UNKNOWN_SKU')) {
        categorizedBlockCounts.UNKNOWN_SKU += 1;
      } else if (reason.includes('RECALCULATION_MISMATCH')) {
        categorizedBlockCounts.RECALCULATION_MISMATCH += 1;
      } else {
        // Extract prefix if present (e.g., REASON_CODE: description)
        const prefixMatch = reason.match(/^([A_Z0-9_]+):/);
        const category = prefixMatch ? prefixMatch[1] : 'OTHER';
        categorizedBlockCounts[category] = (categorizedBlockCounts[category] || 0) + 1;
      }
    }
  }

  // Average time-to-agreement (negotiationTimeMs across APPROVED proposals)
  const totalNegotiationTime = approvedTraces.reduce(
    (sum, t) => sum + (t.negotiationTimeMs || 0),
    0
  );
  const averageTimeToAgreementMs = approvedTraces.length > 0
    ? Math.round(totalNegotiationTime / approvedTraces.length)
    : 0;

  // Total Razorpay calls executed
  const razorpayCallsCount = traces.reduce(
    (sum, t) => sum + (t.razorpayCallsCount || 0),
    0
  );

  return {
    aov,
    growthUplift: {
      absoluteAmount: absoluteUplift,
      percentage: percentageUplift,
    },
    totalAgentActions,
    categorizedBlockCounts,
    averageTimeToAgreementMs,
    razorpayCallsCount,
  };
}

/**
 * Convenience function to fetch metrics directly from trace storage.
 * Handles missing directory cleanly by returning default metrics.
 */
export async function getTelemetryMetrics(customDir?: string): Promise<TelemetryMetrics> {
  const traces = await getAllTraces(customDir);
  return calculateMetricsFromTraces(traces);
}
