import { z } from 'zod';

export const CreateReviewSchema = z.object({
  orderId: z.string().uuid(),
  productId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export type CreateReviewDto = z.infer<typeof CreateReviewSchema>;
