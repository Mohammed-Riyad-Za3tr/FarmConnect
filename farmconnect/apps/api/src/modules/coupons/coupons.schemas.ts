import { z } from 'zod';

const CouponBaseSchema = z.object({
  code: z.string().trim().min(3).max(40).toUpperCase(),
  type: z.enum(['PERCENT', 'FIXED']),
  amount: z.coerce.number().positive(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  usageLimit: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().optional().default(true),
});

export const CreateCouponSchema = CouponBaseSchema.superRefine((value, ctx) => {
  if (value.startsAt >= value.endsAt) {
    ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'endsAt must be after startsAt' });
  }
});

export const UpdateCouponSchema = CouponBaseSchema.partial().superRefine((value, ctx) => {
  if (Object.keys(value).length === 0) {
    ctx.addIssue({ code: 'custom', message: 'At least one field is required' });
  }
});

export type CreateCouponDto = z.infer<typeof CreateCouponSchema>;
export type UpdateCouponDto = z.infer<typeof UpdateCouponSchema>;
