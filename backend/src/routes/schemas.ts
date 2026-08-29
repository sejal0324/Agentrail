import { z } from 'zod';

export const TransactionProposalSchema = z.object({
  transactionId: z.string().uuid(),
  sessionId: z.string(),
  buyerId: z.string(),
  items: z.array(
    z.object({
      sku: z.string(),
      quantity: z.number().int().positive(),
      proposedUnitPrice: z.number().positive(),
      originalUnitPrice: z.number().positive(),
    })
  ),
  proposedDiscountPercent: z.number().min(0).max(100),
  proposedTotal: z.number().positive(),
  currency: z.string().default('INR'),
  appliedGrowthActions: z.array(
    z.enum(['upsell', 'cross_sell', 'bundle', 'upgrade', 'none'])
  ),
  negotiationContext: z.string(),
});

export type TransactionProposal = z.infer<typeof TransactionProposalSchema>;
