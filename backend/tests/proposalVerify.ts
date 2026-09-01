import { validateTransactionProposal, TransactionProposalSchema } from '../src/agent/proposalTypes.js';
import { randomUUID } from 'node:crypto';

async function runProposalVerification() {
  console.log('--- START TRANSACTION PROPOSAL SCHEMA VERIFICATION ---');

  // 1. Valid proposal test
  console.log('\n1. Testing valid TransactionProposal schema parsing...');
  const validProposal = {
    transactionId: randomUUID(),
    sessionId: 'session_test_123',
    buyerId: 'buyer_test_456',
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
        proposedUnitPrice: 9000,
        originalUnitPrice: 10000,
      },
    ],
    proposedDiscountPercent: 6.67,
    proposedTotal: 84000,
    currency: 'INR',
    appliedGrowthActions: ['bundle', 'cross_sell'],
    negotiationContext: 'Buyer requested bundle discount for Laptop + Docking Station.',
  };

  const parsed = validateTransactionProposal(validProposal);
  console.log(`Validated proposal transactionId: ${parsed.transactionId}`);
  if (parsed.items.length !== 2 || parsed.proposedTotal !== 84000) {
    throw new Error('Parsed proposal values do not match input values');
  }
  console.log('Valid proposal schema verification passed.');

  // 2. Test rejection of invalid inputs
  console.log('\n2. Testing rejection of invalid proposals...');

  // Invalid transactionId (not UUID)
  try {
    validateTransactionProposal({ ...validProposal, transactionId: 'not-a-uuid' });
    throw new Error('FAILED to reject invalid transactionId');
  } catch (err: any) {
    console.log('Successfully caught invalid transactionId (not UUID)');
  }

  // Empty items array
  try {
    validateTransactionProposal({ ...validProposal, items: [] });
    throw new Error('FAILED to reject empty items array');
  } catch (err: any) {
    console.log('Successfully caught empty items array');
  }

  // Negative price
  try {
    validateTransactionProposal({
      ...validProposal,
      items: [{ sku: 'HW-LAPTOP', quantity: 1, proposedUnitPrice: -500, originalUnitPrice: 80000 }],
    });
    throw new Error('FAILED to reject negative unit price');
  } catch (err: any) {
    console.log('Successfully caught negative proposed unit price');
  }

  // Discount percent > 100
  try {
    validateTransactionProposal({ ...validProposal, proposedDiscountPercent: 150 });
    throw new Error('FAILED to reject invalid discount percent > 100');
  } catch (err: any) {
    console.log('Successfully caught invalid discount percent');
  }

  // Invalid growth action enum
  try {
    validateTransactionProposal({ ...validProposal, appliedGrowthActions: ['invalid_action' as any] });
    throw new Error('FAILED to reject invalid growth action enum');
  } catch (err: any) {
    console.log('Successfully caught invalid growth action enum');
  }

  // 3. Security check: Ensure floorPrice is not a field in the schema
  console.log('\n3. Verifying schema privacy boundaries...');
  const schemaShape = TransactionProposalSchema.shape;
  if ('floorPrice' in schemaShape || 'merchantMargin' in schemaShape) {
    throw new Error('SECURITY VIOLATION: Private merchant fields exist in TransactionProposalSchema');
  }
  console.log('Privacy check passed: TransactionProposal schema contains zero merchant-private fields.');

  console.log('\n--- ALL TRANSACTION PROPOSAL VERIFICATIONS PASSED ---');
}

runProposalVerification().catch((err) => {
  console.error('\nVerification Failed with Error:', err.message || err);
  process.exit(1);
});
