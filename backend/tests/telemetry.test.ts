import { promises as fs } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { TransactionProposal } from '../src/agent/proposalTypes.js';
import { PolicyEvaluationResult } from '../src/gateway/policyEngine.js';
import { RazorpayOrderResult } from '../src/payments/razorpayClient.js';
import {
  recordTrace,
  getAllTraces,
  sanitizeTrace,
  calculateMetricsFromTraces,
  getTelemetryMetrics,
  DecisionTrace
} from '../src/telemetry/index.js';

async function runTelemetryTests() {
  console.log('--- START TELEMETRY & GROWTH METRICS (M9) VERIFICATION ---\n');

  const testTraceDir = path.join(process.cwd(), 'data', 'test_traces_m9');

  // Clean up any pre-existing test directory
  try {
    await fs.rm(testTraceDir, { recursive: true, force: true });
  } catch (err) {
    // Ignore
  }

  // 1. Test missing/empty trace directory handling
  console.log('1. Testing missing/empty trace directory handling...');
  const emptyTraces = await getAllTraces(testTraceDir);
  assert.strictEqual(emptyTraces.length, 0, 'Expected 0 traces for non-existent directory');

  const emptyMetrics = await getTelemetryMetrics(testTraceDir);
  assert.strictEqual(emptyMetrics.totalAgentActions, 0);
  assert.strictEqual(emptyMetrics.aov, 0);
  assert.strictEqual(emptyMetrics.growthUplift.absoluteAmount, 0);
  assert.strictEqual(emptyMetrics.growthUplift.percentage, 0);
  assert.strictEqual(emptyMetrics.razorpayCallsCount, 0);
  assert.strictEqual(emptyMetrics.averageTimeToAgreementMs, 0);
  console.log('Missing/empty directory handling test PASSED.\n');

  // 2. Setup mock data: 1 APPROVED proposal with Razorpay order, 2 BLOCKED proposals
  console.log('2. Recording APPROVED proposal trace...');
  const approvedProposal: TransactionProposal = {
    transactionId: '11111111-1111-4111-a111-111111111111',
    sessionId: 'session_m9_test_1',
    buyerId: 'buyer_m9_1',
    items: [
      {
        sku: 'HW-LAPTOP',
        quantity: 1,
        proposedUnitPrice: 92000,
        originalUnitPrice: 100000,
      },
      {
        sku: 'HW-DOCK',
        quantity: 1,
        proposedUnitPrice: 18000,
        originalUnitPrice: 20000,
      },
    ],
    proposedDiscountPercent: 8.33,
    proposedTotal: 110000,
    currency: 'INR',
    appliedGrowthActions: ['bundle', 'cross_sell'],
    negotiationContext: 'Buyer agreed to laptop + dock bundle.',
  };

  const approvedEvalResult: PolicyEvaluationResult = {
    status: 'APPROVED',
    transactionId: approvedProposal.transactionId,
    contractHash: '881b4722dc7e0dcb8fab7751c892a211a69d3b932f4d273ba096dc2d270270bb',
    reasons: [],
    recalculatedTotal: 110000,
    evaluatedAt: new Date(Date.now() - 5000).toISOString(),
    checks: {
      schemaValid: true,
      skusValid: true,
      mathValid: true,
      floorPriceValid: true,
      discountValid: true,
      velocityValid: true,
    },
  };

  const approvedRazorpayResult: RazorpayOrderResult = {
    success: true,
    orderId: 'order_M9TestOrder123',
    amount: 11000000,
    currency: 'INR',
    receipt: 'rcpt_111111111111',
    status: 'created',
    contractHash: approvedEvalResult.contractHash,
    notes: {
      contractHash: approvedEvalResult.contractHash!,
      transactionId: approvedProposal.transactionId,
      growthActions: 'bundle,cross_sell',
    },
  };

  const trace1 = await recordTrace(
    {
      proposal: approvedProposal,
      evaluationResult: approvedEvalResult,
      razorpayResult: approvedRazorpayResult,
      negotiationTimeMs: 1500,
    },
    testTraceDir
  );

  assert.strictEqual(trace1.evaluationStatus, 'APPROVED');
  assert.strictEqual(trace1.razorpayCallsCount, 1);
  assert.strictEqual(trace1.contractHash, approvedEvalResult.contractHash);
  assert.strictEqual(trace1.aovUplift.baseTotal, 100000);
  assert.strictEqual(trace1.aovUplift.proposedTotal, 110000);
  assert.strictEqual(trace1.aovUplift.upliftAmount, 10000);
  assert.strictEqual(trace1.aovUplift.upliftPercent, 10);
  console.log('APPROVED trace recording test PASSED.\n');

  // 3. Record BLOCKED trace (Floor price violation)
  console.log('3. Recording BLOCKED proposal trace (Floor price violation)...');
  const blockedProposal1: TransactionProposal = {
    transactionId: '22222222-2222-4222-a222-222222222222',
    sessionId: 'session_m9_test_1',
    buyerId: 'buyer_m9_1',
    items: [
      {
        sku: 'HW-LAPTOP',
        quantity: 1,
        proposedUnitPrice: 40000, // Below floor price
        originalUnitPrice: 100000,
      },
    ],
    proposedDiscountPercent: 60,
    proposedTotal: 40000,
    currency: 'INR',
    appliedGrowthActions: ['upsell'],
    negotiationContext: 'Unsafe price offer',
  };

  const blockedEvalResult1: PolicyEvaluationResult = {
    status: 'BLOCKED',
    transactionId: blockedProposal1.transactionId,
    reasons: [
      "FLOOR_PRICE_VIOLATION: Proposed unit price for item 'HW-LAPTOP' is below the merchant minimum threshold.",
      'DISCOUNT_LIMIT_EXCEEDED: Calculated discount of 60.00% exceeds maximum allowed limit of 25%.',
    ],
    recalculatedTotal: 40000,
    evaluatedAt: new Date(Date.now() - 3000).toISOString(),
    checks: {
      schemaValid: true,
      skusValid: true,
      mathValid: true,
      floorPriceValid: false,
      discountValid: false,
      velocityValid: true,
    },
  };

  const trace2 = await recordTrace(
    {
      proposal: blockedProposal1,
      evaluationResult: blockedEvalResult1,
      razorpayResult: undefined, // 0 calls
      negotiationTimeMs: 800,
    },
    testTraceDir
  );

  assert.strictEqual(trace2.evaluationStatus, 'BLOCKED');
  assert.strictEqual(trace2.razorpayCallsCount, 0, 'BLOCKED trace must have 0 Razorpay calls');
  assert.strictEqual(trace2.reasons.length, 2);
  console.log('BLOCKED trace recording test PASSED.\n');

  // 4. Record second BLOCKED trace (Velocity violation)
  console.log('4. Recording second BLOCKED proposal trace (Velocity limit exceeded)...');
  const blockedProposal2: TransactionProposal = {
    transactionId: '33333333-3333-4333-a333-333333333333',
    sessionId: 'session_m9_test_1',
    buyerId: 'buyer_m9_1',
    items: [
      {
        sku: 'HW-LAPTOP',
        quantity: 1,
        proposedUnitPrice: 90000,
        originalUnitPrice: 100000,
      },
    ],
    proposedDiscountPercent: 10,
    proposedTotal: 90000,
    currency: 'INR',
    appliedGrowthActions: ['none'],
    negotiationContext: 'Excess velocity purchase attempt',
  };

  const blockedEvalResult2: PolicyEvaluationResult = {
    status: 'BLOCKED',
    transactionId: blockedProposal2.transactionId,
    reasons: [
      "VELOCITY_LIMIT_EXCEEDED: Session 'session_m9_test_1' has reached maximum allowed order limit of 3 orders.",
    ],
    recalculatedTotal: 90000,
    evaluatedAt: new Date().toISOString(),
    checks: {
      schemaValid: true,
      skusValid: true,
      mathValid: true,
      floorPriceValid: true,
      discountValid: true,
      velocityValid: false,
    },
  };

  const trace3 = await recordTrace(
    {
      proposal: blockedProposal2,
      evaluationResult: blockedEvalResult2,
      negotiationTimeMs: 1200,
    },
    testTraceDir
  );

  assert.strictEqual(trace3.evaluationStatus, 'BLOCKED');
  assert.strictEqual(trace3.razorpayCallsCount, 0);
  console.log('Second BLOCKED trace recording test PASSED.\n');

  // 5. Test trace retrieval from disk
  console.log('5. Testing trace retrieval from disk (getAllTraces)...');
  const allTraces = await getAllTraces(testTraceDir);
  assert.strictEqual(allTraces.length, 3, 'Expected 3 traces retrieved from disk');
  console.log('Trace retrieval test PASSED.\n');

  // 6. Test private floor price non-leakage
  console.log('6. Testing private merchant floor price non-leakage...');
  for (const t of allTraces) {
    const jsonString = JSON.stringify(t);
    assert.strictEqual(
      jsonString.includes('floorPrice'),
      false,
      'Trace JSON must NOT contain floorPrice field'
    );
    assert.strictEqual(
      jsonString.includes('merchantCost'),
      false,
      'Trace JSON must NOT contain merchantCost field'
    );
  }

  // Also test sanitizeTrace explicitly
  const dirtyObject = {
    publicItem: 'HW-LAPTOP',
    floorPrice: 65000,
    merchantCost: 50000,
    nested: {
      floorPrice: 65000,
      validField: 'allowed',
    },
  };
  const sanitized = sanitizeTrace(dirtyObject);
  assert.strictEqual((sanitized as any).floorPrice, undefined);
  assert.strictEqual((sanitized as any).merchantCost, undefined);
  assert.strictEqual((sanitized as any).nested.floorPrice, undefined);
  assert.strictEqual((sanitized as any).nested.validField, 'allowed');
  console.log('Floor price non-leakage test PASSED.\n');

  // 7. Test metrics calculations
  console.log('7. Testing growth metrics aggregation (getTelemetryMetrics)...');
  const metrics = await getTelemetryMetrics(testTraceDir);

  console.log('Calculated Metrics Output:', JSON.stringify(metrics, null, 2));

  assert.strictEqual(metrics.totalAgentActions, 3, 'Total agent actions must be 3');
  assert.strictEqual(metrics.aov, 110000, 'AOV must equal 110000 (average of 1 approved proposal)');
  assert.strictEqual(metrics.growthUplift.absoluteAmount, 10000, 'Growth uplift absolute amount must be 10000');
  assert.strictEqual(metrics.growthUplift.percentage, 10, 'Growth uplift percentage must be 10%');
  assert.strictEqual(metrics.razorpayCallsCount, 1, 'Total Razorpay calls must be 1');
  assert.strictEqual(metrics.averageTimeToAgreementMs, 1500, 'Average time-to-agreement must be 1500ms');

  assert.strictEqual(metrics.categorizedBlockCounts.FLOOR_PRICE_VIOLATION, 1);
  assert.strictEqual(metrics.categorizedBlockCounts.DISCOUNT_LIMIT_EXCEEDED, 1);
  assert.strictEqual(metrics.categorizedBlockCounts.VELOCITY_LIMIT_EXCEEDED, 1);
  assert.strictEqual(metrics.categorizedBlockCounts.SCHEMA_VIOLATION, 0);

  console.log('Metrics aggregation test PASSED.\n');

  // Clean up test directory
  await fs.rm(testTraceDir, { recursive: true, force: true });

  console.log('--- ALL TELEMETRY & GROWTH METRICS (M9) VERIFICATIONS PASSED ---');
}

runTelemetryTests().catch((err) => {
  console.error('Telemetry test failed:', err);
  process.exit(1);
});
