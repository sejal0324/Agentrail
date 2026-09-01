import { randomUUID } from 'node:crypto';
import { railFencePolicyEngine, RailFencePolicyEngine, generateContractHash } from '../src/gateway/index.js';
import { TransactionProposal } from '../src/agent/proposalTypes.js';
import { catalogDb } from '../src/catalog/catalogDb.js';

async function runRailFenceVerification() {
  console.log('--- START RAILFENCE POLICY ENGINE VERIFICATION ---');

  // Reset velocity tracking before running tests
  railFencePolicyEngine.resetSessionVelocity();

  // 1. Test Valid Proposal (APPROVED)
  console.log('\n1. Testing valid proposal evaluation (APPROVED)...');
  const validProposal: TransactionProposal = {
    transactionId: randomUUID(),
    sessionId: 'session_rf_001',
    buyerId: 'buyer_rf_001',
    items: [
      {
        sku: 'HW-LAPTOP',
        quantity: 1,
        proposedUnitPrice: 75000,
        originalUnitPrice: 80000,
      },
      {
        sku: 'HW-DOCK',
        quantity: 1,
        proposedUnitPrice: 10000,
        originalUnitPrice: 12000,
      },
    ],
    proposedDiscountPercent: 7.61,
    proposedTotal: 85000,
    currency: 'INR',
    appliedGrowthActions: ['bundle'],
    negotiationContext: 'Approved bundle discount for Laptop + Docking station.',
  };

  const result1 = railFencePolicyEngine.evaluateProposal(validProposal, {}, 'hardware');
  console.log(`Evaluation Status: ${result1.status}`);
  console.log(`Contract Hash: ${result1.contractHash}`);
  console.log(`Recalculated Total: ${result1.recalculatedTotal}`);

  if (result1.status !== 'APPROVED') {
    throw new Error(`Expected APPROVED status, got ${result1.status} with reasons: ${result1.reasons.join('; ')}`);
  }
  if (!result1.contractHash || result1.contractHash.length !== 64) {
    throw new Error('Expected valid 64-character SHA-256 contract hash for approved proposal');
  }
  if (result1.recalculatedTotal !== 85000) {
    throw new Error(`Expected recalculated total 85000, got ${result1.recalculatedTotal}`);
  }
  console.log('Valid proposal test PASSED.');

  // 2. Test Invalid Schema (BLOCKED)
  console.log('\n2. Testing schema violation rejection (BLOCKED)...');
  const invalidSchemaProposal = {
    ...validProposal,
    transactionId: 'invalid-uuid-string',
  };
  const result2 = railFencePolicyEngine.evaluateProposal(invalidSchemaProposal);
  console.log(`Evaluation Status: ${result2.status}`);
  console.log(`Reasons: ${result2.reasons.join('; ')}`);
  if (result2.status !== 'BLOCKED' || result2.checks.schemaValid) {
    throw new Error('Expected schema violation block');
  }
  console.log('Schema violation test PASSED.');

  // 3. Test Unknown SKU (BLOCKED)
  console.log('\n3. Testing unknown SKU rejection (BLOCKED)...');
  const unknownSkuProposal: TransactionProposal = {
    ...validProposal,
    transactionId: randomUUID(),
    items: [
      {
        sku: 'HW-NONEXISTENT-ITEM',
        quantity: 1,
        proposedUnitPrice: 5000,
        originalUnitPrice: 5000,
      },
    ],
    proposedTotal: 5000,
  };
  const result3 = railFencePolicyEngine.evaluateProposal(unknownSkuProposal);
  console.log(`Evaluation Status: ${result3.status}`);
  console.log(`Reasons: ${result3.reasons.join('; ')}`);
  if (result3.status !== 'BLOCKED' || result3.checks.skusValid) {
    throw new Error('Expected unknown SKU block');
  }
  console.log('Unknown SKU test PASSED.');

  // 4. Test Recalculation Mismatch (BLOCKED)
  console.log('\n4. Testing mathematical recalculation mismatch (BLOCKED)...');
  const mathMismatchProposal: TransactionProposal = {
    ...validProposal,
    transactionId: randomUUID(),
    proposedTotal: 50000, // True recalculated sum is 85000
  };
  const result4 = railFencePolicyEngine.evaluateProposal(mathMismatchProposal);
  console.log(`Evaluation Status: ${result4.status}`);
  console.log(`Reasons: ${result4.reasons.join('; ')}`);
  if (result4.status !== 'BLOCKED' || result4.checks.mathValid) {
    throw new Error('Expected recalculation mismatch block');
  }
  console.log('Recalculation mismatch test PASSED.');

  // 5. Test Private Floor Price Violation (BLOCKED with Zero Data Leakage)
  console.log('\n5. Testing private merchant floor price violation (BLOCKED & Zero Leakage)...');
  // Laptop public list = 80,000; private floor = 70,000
  const floorViolationProposal: TransactionProposal = {
    ...validProposal,
    transactionId: randomUUID(),
    items: [
      {
        sku: 'HW-LAPTOP',
        quantity: 1,
        proposedUnitPrice: 60000, // Below floor of 70,000!
        originalUnitPrice: 80000,
      },
    ],
    proposedTotal: 60000,
    proposedDiscountPercent: 25.0,
  };
  const result5 = railFencePolicyEngine.evaluateProposal(floorViolationProposal, {}, 'hardware');
  console.log(`Evaluation Status: ${result5.status}`);
  console.log(`Reasons: ${result5.reasons.join('; ')}`);
  if (result5.status !== 'BLOCKED' || result5.checks.floorPriceValid) {
    throw new Error('Expected floor price violation block');
  }
  // Check zero numerical floor price leakage in reason output
  const laptopProduct = catalogDb.getProduct('HW-LAPTOP', 'hardware');
  const privateFloor = laptopProduct?.floorPrice?.toString() || '70000';
  for (const reason of result5.reasons) {
    if (reason.includes(privateFloor)) {
      throw new Error(`SECURITY LEAK DETECTED: Reason '${reason}' exposes merchant private floor price '${privateFloor}'!`);
    }
  }
  console.log('Floor price violation test PASSED (Zero data leakage confirmed).');

  // 6. Test Max Discount Exceeded (BLOCKED)
  console.log('\n6. Testing max discount limit exceeded (BLOCKED)...');
  // Dock list = 12000; proposing 5000 => ~58.3% discount (max allowed default = 25%)
  const discountExceededProposal: TransactionProposal = {
    ...validProposal,
    transactionId: randomUUID(),
    items: [
      {
        sku: 'HW-DOCK',
        quantity: 1,
        proposedUnitPrice: 5000,
        originalUnitPrice: 12000,
      },
    ],
    proposedTotal: 5000,
    proposedDiscountPercent: 58.33,
  };
  const result6 = railFencePolicyEngine.evaluateProposal(discountExceededProposal, { maxDiscountPercent: 25 }, 'hardware');
  console.log(`Evaluation Status: ${result6.status}`);
  console.log(`Reasons: ${result6.reasons.join('; ')}`);
  if (result6.status !== 'BLOCKED' || result6.checks.discountValid) {
    throw new Error('Expected discount limit exceeded block');
  }
  console.log('Max discount limit test PASSED.');

  // 7. Test Session Order Velocity Limit (BLOCKED)
  console.log('\n7. Testing session order velocity limit (BLOCKED)...');
  const engine = new RailFencePolicyEngine();
  const sessionVel = 'session_order_limit_test';
  
  // Submit 3 valid orders under maxOrdersPerSession = 3 limit
  for (let i = 0; i < 3; i++) {
    const p: TransactionProposal = {
      ...validProposal,
      transactionId: randomUUID(),
      sessionId: sessionVel,
      items: [{ sku: 'HW-DOCK', quantity: 1, proposedUnitPrice: 10000, originalUnitPrice: 12000 }],
      proposedTotal: 10000,
    };
    const res = engine.evaluateProposal(p, { maxOrdersPerSession: 3 }, 'hardware');
    if (res.status !== 'APPROVED') {
      throw new Error(`Order ${i + 1} expected APPROVED, got ${res.status}`);
    }
  }

  // 4th order should be BLOCKED by order count velocity cap
  const fourthOrder: TransactionProposal = {
    ...validProposal,
    transactionId: randomUUID(),
    sessionId: sessionVel,
    items: [{ sku: 'HW-DOCK', quantity: 1, proposedUnitPrice: 10000, originalUnitPrice: 12000 }],
    proposedTotal: 10000,
  };
  const result7 = engine.evaluateProposal(fourthOrder, { maxOrdersPerSession: 3 }, 'hardware');
  console.log(`Evaluation Status (4th order): ${result7.status}`);
  console.log(`Reasons: ${result7.reasons.join('; ')}`);
  if (result7.status !== 'BLOCKED' || result7.checks.velocityValid) {
    throw new Error('Expected velocity order count block on 4th order');
  }
  console.log('Session order velocity limit test PASSED.');

  // 8. Test Session Spend Velocity Limit (BLOCKED)
  console.log('\n8. Testing session spend velocity limit (BLOCKED)...');
  const sessionSpend = 'session_spend_limit_test';
  const spendEngine = new RailFencePolicyEngine();

  // Order 1: 75,000 INR (Under 100,000 INR spend limit)
  const spendOrder1: TransactionProposal = {
    ...validProposal,
    transactionId: randomUUID(),
    sessionId: sessionSpend,
    items: [{ sku: 'HW-LAPTOP', quantity: 1, proposedUnitPrice: 75000, originalUnitPrice: 80000 }],
    proposedTotal: 75000,
  };
  const resSpend1 = spendEngine.evaluateProposal(spendOrder1, { maxSpendPerSession: 100000, maxTransactionAmount: 200000 }, 'hardware');
  if (resSpend1.status !== 'APPROVED') {
    throw new Error(`Spend order 1 expected APPROVED, got ${resSpend1.status}`);
  }

  // Order 2: 35,000 INR (Cumulative 110,000 exceeds 100,000 spend cap)
  const spendOrder2: TransactionProposal = {
    ...validProposal,
    transactionId: randomUUID(),
    sessionId: sessionSpend,
    items: [{ sku: 'HW-DOCK', quantity: 3, proposedUnitPrice: 10000, originalUnitPrice: 12000 }],
    proposedTotal: 30000,
  };
  const resSpend2 = spendEngine.evaluateProposal(spendOrder2, { maxSpendPerSession: 100000, maxTransactionAmount: 200000 }, 'hardware');
  console.log(`Evaluation Status (Spend order 2): ${resSpend2.status}`);
  console.log(`Reasons: ${resSpend2.reasons.join('; ')}`);
  if (resSpend2.status !== 'BLOCKED' || resSpend2.checks.velocityValid) {
    throw new Error('Expected session spend velocity block');
  }
  console.log('Session spend velocity limit test PASSED.');

  // 9. Deterministic Contract Hash Verification
  console.log('\n9. Testing SHA-256 contract hash determinism...');
  const hash1 = generateContractHash(validProposal);
  const hash2 = generateContractHash(validProposal);
  if (hash1 !== hash2) {
    throw new Error('Contract hash is not deterministic!');
  }
  console.log(`Deterministic hash verified: ${hash1}`);
  console.log('Contract hash determinism test PASSED.');

  console.log('\n--- ALL RAILFENCE POLICY ENGINE VERIFICATIONS PASSED ---');
}

runRailFenceVerification().catch((err) => {
  console.error('\nVerification Failed with Error:', err.message || err);
  process.exit(1);
});
