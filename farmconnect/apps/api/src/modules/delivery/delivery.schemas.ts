import { z } from 'zod';

export const DeliveryStatusSchema = z.enum([
  'NOT_SHIPPED',
  'PREPARING',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'FAILED_DELIVERY',
  'RETURNED',
]);

export const CreateDeliveryUpdateSchema = z.object({
  status: DeliveryStatusSchema,
  location: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().min(2).max(500).optional(),
});

export type CreateDeliveryUpdateDto = z.infer<typeof CreateDeliveryUpdateSchema>;
