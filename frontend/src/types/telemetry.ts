export interface AOVUplift {
  baseTotal: number;
  proposedTotal: number;
  upliftAmount: number;
  upliftPercent: number;
}

export interface ProposalItem {
  sku: string;
  quantity: number;
  proposedUnitPrice: number;
  originalUnitPrice: number;
}

export interface TraceProposal {
  items: ProposalItem[];
  proposedDiscountPercent: number;
  proposedTotal: number;
  baseTotal: number;
  currency: string;
  appliedGrowthActions: string[];
  negotiationContext: string;
}

export interface PolicyCheckDetails {
  schemaValid: boolean;
  skusValid: boolean;
  mathValid: boolean;
  floorPriceValid: boolean;
  discountValid: boolean;
  velocityValid: boolean;
}

export interface DecisionTrace {
  traceId: string;
  transactionId: string;
  sessionId: string;
  buyerId: string;
  evaluatedAt: string;
  negotiationTimeMs: number;
  proposal: TraceProposal;
  evaluationStatus: 'APPROVED' | 'BLOCKED';
  checks: PolicyCheckDetails;
  reasons: string[];
  contractHash?: string;
  razorpayResult?: any;
  razorpayCallsCount: number;
  growthActions: string[];
  aovUplift: AOVUplift;
}

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
