import { z } from 'zod';

const roleSchema = z.enum(['BUYER', 'PRODUCER', 'ADMIN']);

export const RecommendPriceInputSchema = z
  .object({
    productId: z.string().uuid().optional(),
    currentPrice: z.coerce.number().positive().optional(),
    costPrice: z.coerce.number().min(0).optional(),
    stockLevel: z.coerce.number().int().min(0).optional(),
    recentOrders7d: z.coerce.number().int().min(0).optional(),
    seasonalityIndex: z.coerce.number().positive().optional(),
    currency: z.string().trim().min(3).max(8).optional(),
  })
  .refine((value) => Boolean(value.productId || value.currentPrice), {
    message: 'Either productId or currentPrice is required',
    path: ['productId'],
  });

export const ForecastDemandInputSchema = z.object({
  productId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  horizonDays: z.coerce.number().int().min(1).max(90).optional().default(7),
  historicalDailyDemand: z.array(z.coerce.number().min(0)).max(365).optional().default([]),
  activeListings: z.coerce.number().int().min(0).optional(),
  stockLevel: z.coerce.number().int().min(0).optional(),
  seasonalityIndex: z.coerce.number().positive().optional(),
  modelVersion: z.string().trim().min(1).max(32).optional(),
});

export const ChatbotRelayInputSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  role: roleSchema.optional(),
  context: z.record(z.unknown()).optional(),
});

export type RecommendPriceInputDto = z.infer<typeof RecommendPriceInputSchema>;
export type ForecastDemandInputDto = z.infer<typeof ForecastDemandInputSchema>;
export type ChatbotRelayInputDto = z.infer<typeof ChatbotRelayInputSchema>;
