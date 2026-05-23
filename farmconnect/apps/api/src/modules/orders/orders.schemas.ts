import { z } from 'zod';

export const CheckoutSchema = z.object({
  deliveryMethod: z.enum(['PICKUP', 'DELIVERY']).default('PICKUP'),
  couponCode: z.string().trim().min(3).max(40).optional(),
  addressId: z.string().uuid().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export type CheckoutDto = z.infer<typeof CheckoutSchema>;

const OrderStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
]);

export const ListOrdersQuerySchema = z.object({
  status: OrderStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListOrdersQueryDto = z.infer<typeof ListOrdersQuerySchema>;

export const TransitionOrderStatusSchema = z.object({
  status: OrderStatusSchema,
});

export type TransitionOrderStatusDto = z.infer<typeof TransitionOrderStatusSchema>;

export const VerifyDeliveryTokenSchema = z.object({
  orderId: z.string().uuid(),
  token: z.string().trim().min(16).max(256),
});

export type VerifyDeliveryTokenDto = z.infer<typeof VerifyDeliveryTokenSchema>;
