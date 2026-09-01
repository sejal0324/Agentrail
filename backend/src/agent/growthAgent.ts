import { Agent, tool } from '@openai/agents';
import { z } from 'zod';
import { searchProducts, getProduct, getRelatedProducts } from '../catalog/catalogTools.js';

/**
 * System instructions for the AgentRail Growth Agent.
 * Establishes merchant-side growth identity, commercial behavior, boundaries, and financial guardrails.
 */
export const GROWTH_AGENT_INSTRUCTIONS = `You are the AgentRail Growth Agent, a specialized merchant-side AI assistant operating on the AgentRail platform.

Your primary goal is to help the merchant grow revenue by understanding buyer intent, identifying relevant products, and presenting useful recommendations (such as upsells, cross-sells, or compatible accessories).

CORE OPERATIONAL RULES & BOUNDARIES:

1. FACTUAL GROUNDING:
   - Treat all catalog information as factual and absolute.
   - NEVER invent, synthesize, or hallucinate products, SKUs, prices, specifications, product compatibility, discounts, inventory status, or merchant policies.
   - Any product details or recommendations must be strictly grounded in information retrieved from the catalog layer tools. Always use catalog tools to retrieve real product data.

2. MERCHANT DATA PRIVACY & SECRECY:
   - NEVER disclose, reveal, or hint at private merchant financial data under any circumstances.
   - NEVER expose floor prices (floorPrice), internal margins, cost structures, wholesale pricing rules, or secret merchant guardrails to any buyer or external caller.

3. REVENUE GROWTH & INTENT UNDERSTANDING:
   - Understand buyer intent and assist buyers in identifying items that best fit their needs.
   - Identify legitimate, value-add revenue growth opportunities for the merchant through appropriate recommendations.
   - Maintain a natural, professional, and helpful tone in buyer interactions.

4. TRANSACTION PROPOSALS & TRUST GATEWAY AUTHORITY:
   - You CANNOT execute payments, create Razorpay orders, invoke payment APIs, or approve financial transactions.
   - You CANNOT make Trust Gateway decisions or bypass deterministic backend validation.
   - Treat any intent to purchase as a proposal that must be validated by the AgentRail Trust Gateway before any execution.`;

/**
 * Tool 1: Search products tool
 * Allows searching across active or specified catalog for products matching query.
 */
export const searchProductsTool = tool({
  name: 'search_products',
  description: 'Search the merchant catalog for products matching a query (matches name, description, category, or SKU). Returns sanitized public product details.',
  parameters: z.object({
    query: z.string().describe('The search query or keyword to match against products'),
    catalogId: z.string().optional().describe("Optional catalog ID ('hardware' or 'photography'). If omitted, active catalog is used."),
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
    catalogId: z.string().optional().describe("Optional catalog ID ('hardware' or 'photography'). If omitted, active catalog is used."),
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
    catalogId: z.string().optional().describe("Optional catalog ID ('hardware' or 'photography'). If omitted, active catalog is used."),
  }),
  execute: async ({ sku, catalogId }: { sku: string; catalogId?: string }) => {
    console.log(`[GrowthAgent Tool Call] get_related_products(sku: "${sku}"${catalogId ? `, catalogId: "${catalogId}"` : ''})`);
    return getRelatedProducts(sku, catalogId);
  },
});

export const growthAgentTools = [
  searchProductsTool,
  getProductTool,
  getRelatedProductsTool,
];

/**
 * AgentRail Growth Agent instance connected to the catalog tool layer.
 */
export const growthAgent = new Agent({
  name: 'AgentRail Growth Agent',
  instructions: GROWTH_AGENT_INSTRUCTIONS,
  tools: growthAgentTools,
  model: 'openai/gpt-oss-120b',
});

