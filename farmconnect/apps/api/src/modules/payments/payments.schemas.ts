import { z } from 'zod';

export const PaymentProviderSchema = z.enum(['STRIPE', 'BARIDIMOB']);

export const CreatePaymentIntentSchema = z.object({
  provider: PaymentProviderSchema.default('STRIPE'),
  returnUrl: z.string().url().optional(),
});

export type CreatePaymentIntentDto = z.infer<typeof CreatePaymentIntentSchema>;
