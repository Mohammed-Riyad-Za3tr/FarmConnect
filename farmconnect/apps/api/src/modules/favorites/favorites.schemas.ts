import { z } from 'zod';

export const ToggleFavoriteProductSchema = z.object({
  productId: z.string().uuid(),
});

export const ToggleFavoriteProducerSchema = z.object({
  producerId: z.string().uuid(),
});
