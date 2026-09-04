import { growthAgent, growthAgentTools, searchProductsTool, getProductTool, getRelatedProductsTool, createTransactionProposalTool } from '../src/agent/growthAgent.js';
import { PublicProduct } from '../src/catalog/catalogTypes.js';

async function runAgentToolsVerification() {
  console.log('--- START AGENT TOOLS WIRING VERIFICATION ---');

  // 1. Verify Agent metadata & tools registration
  console.log('\n1. Verifying Agent metadata and tools registration...');
  if (growthAgent.name !== 'AgentRail Growth Agent') {
    throw new Error(`Expected agent name 'AgentRail Growth Agent', got '${growthAgent.name}'`);
  }

  if (growthAgentTools.length !== 4) {
    throw new Error(`Expected 4 tools registered, got ${growthAgentTools.length}`);
  }

  const toolNames = growthAgentTools.map(t => t.name);
  console.log(`Registered tools: ${toolNames.join(', ')}`);
  
  if (
    !toolNames.includes('search_products') ||
    !toolNames.includes('get_product') ||
    !toolNames.includes('get_related_products') ||
    !toolNames.includes('create_transaction_proposal')
  ) {
    throw new Error(`Tool names mismatch. Got: ${toolNames.join(', ')}`);
  }
  console.log('Agent metadata and tool registration verified.');

  // 2. Test search_products tool invocation (Hardware, Photography & Cross-catalog)
  console.log('\n2. Testing search_products tool invocation...');
  const searchResultHardware = await searchProductsTool.invoke({} as any, JSON.stringify({ query: 'laptop', catalogId: 'hardware' })) as PublicProduct[];
  if (!Array.isArray(searchResultHardware) || searchResultHardware.length < 1 || !searchResultHardware.some(p => p.sku === 'HW-LAPTOP')) {
    throw new Error(`Hardware search failed. Got: ${JSON.stringify(searchResultHardware)}`);
  }

  const searchResultPhoto = await searchProductsTool.invoke({} as any, JSON.stringify({ query: 'camera', catalogId: 'photography' })) as PublicProduct[];
  if (!Array.isArray(searchResultPhoto) || searchResultPhoto.length < 1 || !searchResultPhoto.some(p => p.sku === 'PHOTO-CAMERA')) {
    throw new Error(`Photography search failed. Got: ${JSON.stringify(searchResultPhoto)}`);
  }

  const searchResultCross = await searchProductsTool.invoke({} as any, JSON.stringify({ query: 'camera' })) as PublicProduct[];
  if (!Array.isArray(searchResultCross) || searchResultCross.length < 1 || !searchResultCross.some(p => p.sku === 'PHOTO-CAMERA')) {
    throw new Error(`Cross-catalog search failed. Got: ${JSON.stringify(searchResultCross)}`);
  }
  console.log('search_products tool execution verified for hardware, photography, and cross-catalog searches.');

  // 3. Test get_product tool invocation (Hardware & Photography)
  console.log('\n3. Testing get_product tool invocation...');
  const getProdHardware = await getProductTool.invoke({} as any, JSON.stringify({ sku: 'HW-LAPTOP', catalogId: 'hardware' })) as PublicProduct | null;
  if (!getProdHardware || getProdHardware.sku !== 'HW-LAPTOP') {
    throw new Error(`Hardware get_product failed. Got: ${JSON.stringify(getProdHardware)}`);
  }

  const getProdPhoto = await getProductTool.invoke({} as any, JSON.stringify({ sku: 'PHOTO-CAMERA', catalogId: 'photography' })) as PublicProduct | null;
  if (!getProdPhoto || getProdPhoto.sku !== 'PHOTO-CAMERA') {
    throw new Error(`Photography get_product failed. Got: ${JSON.stringify(getProdPhoto)}`);
  }

  const getProdInvalid = await getProductTool.invoke({} as any, JSON.stringify({ sku: 'NON-EXISTENT', catalogId: 'hardware' }));
  if (getProdInvalid !== null) {
    throw new Error(`Invalid SKU get_product expected null, got: ${JSON.stringify(getProdInvalid)}`);
  }
  console.log('get_product tool execution verified.');

  // 4. Test get_related_products tool invocation (Hardware & Photography)
  console.log('\n4. Testing get_related_products tool invocation...');
  const relatedHardware = await getRelatedProductsTool.invoke({} as any, JSON.stringify({ sku: 'HW-LAPTOP', catalogId: 'hardware' })) as PublicProduct[];
  if (!Array.isArray(relatedHardware) || relatedHardware.length !== 1 || relatedHardware[0].sku !== 'HW-DOCK') {
    throw new Error(`Hardware related products failed. Got: ${JSON.stringify(relatedHardware)}`);
  }

  const relatedPhoto = await getRelatedProductsTool.invoke({} as any, JSON.stringify({ sku: 'PHOTO-CAMERA', catalogId: 'photography' })) as PublicProduct[];
  const photoRelatedSkus = relatedPhoto.map(p => p.sku);
  if (photoRelatedSkus.length !== 2 || !photoRelatedSkus.includes('PHOTO-TRIPOD') || !photoRelatedSkus.includes('PHOTO-BATTERY')) {
    throw new Error(`Photography related products failed. Got: ${JSON.stringify(relatedPhoto)}`);
  }
  console.log('get_related_products tool execution verified for both catalogs.');

  // 5. Test create_transaction_proposal tool invocation
  console.log('\n5. Testing create_transaction_proposal tool invocation...');
  const proposalResult = await createTransactionProposalTool.invoke({} as any, JSON.stringify({
    items: [
      { sku: 'HW-LAPTOP', quantity: 1, proposedUnitPrice: 75000, originalUnitPrice: 80000 },
      { sku: 'HW-DOCK', quantity: 1, proposedUnitPrice: 9000, originalUnitPrice: 10000 }
    ],
    proposedDiscountPercent: 6.67,
    proposedTotal: 84000,
    currency: 'INR',
    appliedGrowthActions: ['bundle', 'cross_sell'],
    negotiationContext: 'Negotiated hardware bundle discount'
  })) as any;

  if (!proposalResult || proposalResult.status !== 'PROPOSAL_GENERATED' || !proposalResult.proposal) {
    throw new Error(`create_transaction_proposal failed. Got: ${JSON.stringify(proposalResult)}`);
  }
  if (proposalResult.proposal.items.length !== 2 || proposalResult.proposal.proposedTotal !== 84000) {
    throw new Error(`Proposal payload mismatch: ${JSON.stringify(proposalResult.proposal)}`);
  }
  console.log('create_transaction_proposal tool execution verified.');

  // 6. Verify no floorPrice appears in any tool output
  console.log('\n6. Verifying sanitization across all tool outputs...');
  const allOutputs = [
    ...searchResultHardware,
    ...searchResultPhoto,
    getProdHardware,
    getProdPhoto,
    ...relatedHardware,
    ...relatedPhoto
  ];

  for (const item of allOutputs) {
    if (item && 'floorPrice' in item) {
      throw new Error(`SECURITY VIOLATION: Tool output contains floorPrice: ${JSON.stringify(item)}`);
    }
  }
  if ('floorPrice' in proposalResult.proposal) {
    throw new Error(`SECURITY VIOLATION: Proposal contains floorPrice`);
  }
  console.log('Sanitization check passed: zero tool outputs contain floorPrice.');

  console.log('\n--- ALL AGENT TOOLS WIRING VERIFICATIONS PASSED ---');
}

runAgentToolsVerification().catch((err) => {
  console.error('\nVerification Failed with Error:', err.message);
  process.exit(1);
});

