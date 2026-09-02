import assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import {
  RazorpayClient,
  createRazorpayOrder,
  convertToSubunits,
  generateReceiptId,
} from '../src/payments/razorpayClient.js';
import { railFencePolicyEngine } from '../src/gateway/policyEngine.js';
import { TransactionProposal } from '../src/agent/proposalTypes.js';

async function runRazorpayClientTests() {
  console.log('--- START RAZORPAY CLIENT TEST MODE VERIFICATION ---');

  // 1. Test Subunit Conversion Helper
  console.log('\n1. Testing currency subunit conversion...');
  assert.strictEqual(convertToSubunits(100, 'INR'), 10000, '100 INR should be 10000 paise');
  assert.strictEqual(convertToSubunits(75000, 'INR'), 7500000, '75000 INR should be 7500000 paise');
  assert.strictEqual(convertToSubunits(49.99, 'USD'), 4999, '49.99 USD should be 4999 cents');
  assert.strictEqual(convertToSubunits(1000, 'JPY'), 1000, '1000 JPY should be 1000 (zero-decimal)');
  console.log('Subunit conversion test PASSED.');

  // 2. Test Receipt ID Generation Helper
  console.log('\n2. Testing receipt ID formatting...');
  const rcpt = generateReceiptId('test-tx-uuid-12345');
  assert.ok(rcpt.startsWith('rcpt_'), 'Receipt ID should start with rcpt_');
  assert.ok(rcpt.length <= 40, 'Receipt ID must be <= 40 chars');
  console.log('Receipt ID formatting test PASSED.');

  // 3. Test APPROVED Proposal -> Razorpay Order Creation & Notes Metadata Verification
  console.log('\n3. Testing APPROVED proposal order payload & notes metadata (contractHash, transactionId, growthActions)...');
  const validProposal: TransactionProposal = {
    transactionId: randomUUID(),
    sessionId: 'session_rzp_001',
    buyerId: 'buyer_rzp_001',
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
    appliedGrowthActions: ['bundle', 'cross_sell'],
    negotiationContext: 'Approved bundle proposal for Razorpay order test.',
  };

  const evaluationApproved = railFencePolicyEngine.evaluateProposal(validProposal, {}, 'hardware');
  assert.strictEqual(evaluationApproved.status, 'APPROVED', 'Proposal must be APPROVED by RailFence');
  assert.ok(evaluationApproved.contractHash, 'Approved evaluation must have contractHash');

  let passedPayload: any = null;
  const mockSdkInstance: any = {
    orders: {
      create: async (params: any) => {
        passedPayload = params;
        return {
          id: 'order_test_rzp_998877',
          entity: 'order',
          amount: params.amount,
          currency: params.currency,
          receipt: params.receipt,
          status: 'created',
          notes: params.notes,
        };
      },
    },
  };

  const injectedClient = new RazorpayClient({ razorpayInstance: mockSdkInstance });
  const orderResult = await injectedClient.createOrder(validProposal, evaluationApproved);

  assert.strictEqual(orderResult.success, true, 'Order creation should succeed via injected SDK');
  assert.strictEqual(orderResult.orderId, 'order_test_rzp_998877');
  assert.strictEqual(orderResult.amount, 8500000, 'Amount must be in paise (85000 * 100 = 8500000)');
  assert.strictEqual(orderResult.currency, 'INR');

  // Verify locked M8 notes metadata requirements: contractHash, transactionId, growthActions
  assert.ok(passedPayload, 'SDK must receive order payload');
  assert.strictEqual(passedPayload.notes.contractHash, evaluationApproved.contractHash, 'notes.contractHash MUST match evaluation contractHash');
  assert.strictEqual(passedPayload.notes.transactionId, validProposal.transactionId, 'notes.transactionId MUST match proposal transactionId');
  assert.strictEqual(passedPayload.notes.growthActions, 'bundle,cross_sell', 'notes.growthActions MUST contain applied growth actions');

  console.log('Notes metadata verified:');
  console.log(`- contractHash: ${passedPayload.notes.contractHash}`);
  console.log(`- transactionId: ${passedPayload.notes.transactionId}`);
  console.log(`- growthActions: ${passedPayload.notes.growthActions}`);
  console.log('APPROVED proposal order creation & notes metadata test PASSED.');

  // 4. Test BLOCKED Proposal -> Zero SDK Calls / Immediate Rejection
  console.log('\n4. Testing BLOCKED proposal rejection (0 SDK calls)...');
  const floorViolationProposal: TransactionProposal = {
    ...validProposal,
    transactionId: randomUUID(),
    items: [
      {
        sku: 'HW-LAPTOP',
        quantity: 1,
        proposedUnitPrice: 50000, // Below floor price of 70000!
        originalUnitPrice: 80000,
      },
    ],
    proposedTotal: 50000,
  };

  const evaluationBlocked = railFencePolicyEngine.evaluateProposal(floorViolationProposal, {}, 'hardware');
  assert.strictEqual(evaluationBlocked.status, 'BLOCKED', 'Proposal must be BLOCKED by RailFence');

  let sdkCallsMade = 0;
  const spySdkInstance: any = {
    orders: {
      create: async () => {
        sdkCallsMade++;
        return { id: 'should_not_be_called' };
      },
    },
  };

  const spyClient = new RazorpayClient({ razorpayInstance: spySdkInstance });

  let errorThrown = false;
  try {
    await spyClient.createOrder(floorViolationProposal, evaluationBlocked);
  } catch (err: any) {
    errorThrown = true;
    assert.ok(
      err.message.includes('BLOCKED'),
      `Error message should state proposal was BLOCKED. Got: ${err.message}`
    );
  }

  assert.strictEqual(errorThrown, true, 'createOrder must throw error for BLOCKED proposal');
  assert.strictEqual(sdkCallsMade, 0, 'Zero Razorpay SDK calls must be executed for BLOCKED proposals');
  console.log('BLOCKED proposal rejection test PASSED (0 SDK calls confirmed).');

  // 5. Test Missing Credentials Configuration Error
  console.log('\n5. Testing missing credentials configuration safety...');
  const emptyClient = new RazorpayClient({ keyId: '', keySecret: '' });
  let missingCredsError = false;
  try {
    await emptyClient.createOrder(validProposal, evaluationApproved);
  } catch (err: any) {
    missingCredsError = true;
    assert.ok(err.message.includes('credentials missing'), `Error should mention missing credentials: ${err.message}`);
  }
  assert.strictEqual(missingCredsError, true, 'createOrder must fail cleanly when credentials are missing');
  console.log('Missing credentials configuration safety test PASSED.');

  // 6. Test SDK API Error Handling (No automatic fake order generation)
  console.log('\n6. Testing SDK API Error handling (dummy/invalid keys return clean failure, no mock fallback)...');
  const mockErrorSdk: any = {
    orders: {
      create: async () => {
        throw new Error('Authentication failed: Invalid API key');
      },
    },
  };

  const errorSdkClient = new RazorpayClient({ razorpayInstance: mockErrorSdk });
  const apiErrorResult = await errorSdkClient.createOrder(validProposal, evaluationApproved);

  assert.strictEqual(apiErrorResult.success, false, 'Invalid SDK credentials/API errors must return success: false');
  assert.ok(apiErrorResult.error?.includes('Authentication failed'), 'Should capture SDK error message');
  assert.strictEqual(apiErrorResult.contractHash, evaluationApproved.contractHash);
  console.log('SDK API error handling test PASSED.');

  console.log('\n--- ALL RAZORPAY CLIENT TEST MODE VERIFICATIONS PASSED ---');
}

runRazorpayClientTests().catch((err) => {
  console.error('\nVerification Failed with Error:', err);
  process.exit(1);
});
