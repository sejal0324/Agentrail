import { Agent, tool } from '@openai/agents';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { searchProducts, getProduct, getRelatedProducts } from '../catalog/catalogTools.js';
import { validateTransactionProposal, GrowthActionEnum } from './proposalTypes.js';

/**
 * System instructions for the AgentRail Growth Agent.
 * Establishes merchant-side growth identity, commercial behavior, boundaries, negotiation rules, and financial guardrails.
 */
export const GROWTH_AGENT_INSTRUCTIONS = `You are the AgentRail Growth Agent, a specialized merchant-side AI assistant operating on the AgentRail platform.

Your primary goal is to help the merchant grow revenue by understanding buyer intent, negotiating terms within catalog bounds, identifying relevant products, and presenting useful recommendations (such as upsells, cross-sells, or compatible accessories).

CORE OPERATIONAL RULES & BOUNDARIES:

1. FACTUAL GROUNDING:
   - Treat all catalog information as factual and absolute.
   - NEVER invent, synthesize, or hallucinate products, SKUs, prices, specifications, product compatibility, discounts, inventory status, or merchant policies.
   - Any product details or recommendations must be strictly grounded in information retrieved from the catalog layer tools. Always use catalog tools to retrieve real product data.

2. MERCHANT DATA PRIVACY & SECRECY:
   - NEVER disclose, reveal, or hint at private merchant financial data under any circumstances.
   - NEVER expose floor prices (floorPrice), internal margins, cost structures, wholesale pricing rules, or secret merchant guardrails to any buyer or external caller.

3. REVENUE GROWTH & NEGOTIATION:
   - Understand buyer intent and assist buyers in identifying items that best fit their needs.
   - Identify legitimate, value-add revenue growth opportunities for the merchant through appropriate recommendations (upsells, cross-sells, bundles, upgrades).
   - Engage in multi-turn price or bundle negotiation when requested by the buyer. You may offer sensible discounts or bundled pricing based on public list prices to close sales.
   - Maintain a natural, professional, and helpful tone in buyer interactions.

4. TRANSACTION PROPOSAL GENERATION:
   - When a buyer expresses genuine purchase intent, accepts a recommendation, or agrees on negotiated pricing/items:
     You MUST call the "create_transaction_proposal" tool to generate a formal TransactionProposal JSON contract payload.
   - Clearly explain the proposed items, unit prices, applied discounts, growth actions (upsell, cross_sell, bundle, etc.), and total price in your verbal response to the buyer.

5. TRUST GATEWAY AUTHORITY & PAYMENT BOUNDARY:
   - You CANNOT execute payments, create Razorpay orders, invoke payment APIs, or approve financial transactions directly.
   - You CANNOT make Trust Gateway decisions or bypass deterministic backend validation.
   - Treat all transaction proposals as pending contracts that will be independently evaluated and validated by the AgentRail Trust Gateway before any payment execution.`;

/**
 * Tool 1: Search products tool
 * Allows searching across active or specified catalog for products matching query.
 */
export const searchProductsTool = tool({
  name: 'search_products',
  description: 'Search the merchant catalog for products matching a query (matches name, description, category, or SKU). Returns sanitized public product details.',
  parameters: z.object({
    query: z.string().describe('The search query or keyword to match against products'),
    catalogId: z.string().default('hardware').describe("Catalog ID ('hardware' or 'photography'). Defaults to 'hardware'."),
  }),
  execute: async ({ query, catalogId }: { query: string; catalogId?: string }) => {
    console.log(`[GrowthAgent Tool Call] search_products(query: "${query}"${catalogId ? `, catalogId: "${catalogId}"` : ''})`);
    return searchProducts(query, catalogId);
  },
});

/**
 * Tool 2: Get specific product tool
 * Retrieves details for a specific product by SKU.
 */
export const getProductTool = tool({
  name: 'get_product',
  description: 'Look up detailed information for a specific product using its SKU. Returns sanitized public product details or null if not found.',
  parameters: z.object({
    sku: z.string().describe('The exact product SKU to look up'),
    catalogId: z.string().default('hardware').describe("Catalog ID ('hardware' or 'photography'). Defaults to 'hardware'."),
  }),
  execute: async ({ sku, catalogId }: { sku: string; catalogId?: string }) => {
    console.log(`[GrowthAgent Tool Call] get_product(sku: "${sku}"${catalogId ? `, catalogId: "${catalogId}"` : ''})`);
    const product = getProduct(sku, catalogId);
    return product ?? null;
  },
});

/**
 * Tool 3: Get related/compatible products tool
 * Retrieves compatible or related products for a given SKU.
 */
export const getRelatedProductsTool = tool({
  name: 'get_related_products',
  description: 'Discover compatible accessories or related products for a given product SKU to support relevant recommendations and cross-sells.',
  parameters: z.object({
    sku: z.string().describe('The product SKU to find compatible or related items for'),
    catalogId: z.string().default('hardware').describe("Catalog ID ('hardware' or 'photography'). Defaults to 'hardware'."),
  }),
  execute: async ({ sku, catalogId }: { sku: string; catalogId?: string }) => {
    console.log(`[GrowthAgent Tool Call] get_related_products(sku: "${sku}"${catalogId ? `, catalogId: "${catalogId}"` : ''})`);
    return getRelatedProducts(sku, catalogId);
  },
});

/**
 * Tool 4: Create transaction proposal tool
 * Generates a Zod-validated TransactionProposal JSON payload upon buyer purchase intent.
 */
export const createTransactionProposalTool = tool({
  name: 'create_transaction_proposal',
  description: 'Generate a formal Zod-validated TransactionProposal JSON contract when the buyer expresses purchase intent, agrees to negotiate, or accepts an offer. This proposal will be validated by the Trust Gateway.',
  parameters: z.object({
    items: z.array(z.object({
      sku: z.string().describe('Product SKU'),
      quantity: z.number().int().positive().describe('Quantity of items'),
      proposedUnitPrice: z.number().positive().describe('Negotiated or offered unit price'),
      originalUnitPrice: z.number().positive().optional().describe('Original public unit price'),
    })).min(1).describe('List of items in the proposal'),
    proposedDiscountPercent: z.number().min(0).max(100).default(0).describe('Overall discount percentage applied across the proposal'),
    proposedTotal: z.number().positive().describe('Total proposed price for all items in INR'),
    currency: z.string().default('INR').describe('Currency code (INR)'),
    appliedGrowthActions: z.array(GrowthActionEnum).describe('Growth actions included in this proposal (upsell, cross_sell, bundle, upgrade, none)'),
    negotiationContext: z.string().describe('Reason or context for the proposed pricing/discount/bundle'),
    sessionId: z.string().optional().describe('Session identifier'),
    buyerId: z.string().optional().describe('Buyer identifier'),
  }),
  execute: async ({
    items,
    proposedDiscountPercent,
    proposedTotal,
    currency,
    appliedGrowthActions,
    negotiationContext,
    sessionId,
    buyerId,
  }: {
    items: Array<{ sku: string; quantity: number; proposedUnitPrice: number; originalUnitPrice?: number }>;
    proposedDiscountPercent?: number;
    proposedTotal: number;
    currency?: string;
    appliedGrowthActions: Array<z.infer<typeof GrowthActionEnum>>;
    negotiationContext: string;
    sessionId?: string;
    buyerId?: string;
  }) => {
    console.log(`[GrowthAgent Tool Call] create_transaction_proposal(items: ${items.length}, total: ${proposedTotal})`);

    const enrichedItems = items.map((item) => {
      let origPrice = item.originalUnitPrice;
      if (!origPrice) {
        const catProduct = getProduct(item.sku);
        origPrice = catProduct ? catProduct.price : item.proposedUnitPrice;
      }
      return {
        sku: item.sku,
        quantity: item.quantity,
        proposedUnitPrice: item.proposedUnitPrice,
        originalUnitPrice: origPrice,
      };
    });

    const proposalRaw = {
      transactionId: randomUUID(),
      sessionId: sessionId || 'session_default',
      buyerId: buyerId || 'buyer_default',
      items: enrichedItems,
      proposedDiscountPercent: proposedDiscountPercent ?? 0,
      proposedTotal,
      currency: currency || 'INR',
      appliedGrowthActions,
      negotiationContext,
    };

    const validatedProposal = validateTransactionProposal(proposalRaw);
    console.log(`[GrowthAgent Proposal Created] UUID: ${validatedProposal.transactionId}`);
    return {
      status: 'PROPOSAL_GENERATED',
      proposal: validatedProposal,
    };
  },
});

export const growthAgentTools = [
  searchProductsTool,
  getProductTool,
  getRelatedProductsTool,
  createTransactionProposalTool,
];

/**
 * AgentRail Growth Agent instance connected to the catalog and proposal tool layer.
 */
export const growthAgent = new Agent({
  name: 'AgentRail Growth Agent',
  instructions: GROWTH_AGENT_INSTRUCTIONS,
  tools: growthAgentTools,
  model: 'openai/gpt-oss-120b',
});


