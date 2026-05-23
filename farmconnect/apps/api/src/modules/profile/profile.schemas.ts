import { z } from 'zod';
import { buyerBusinessTypeSchema, PREDEFINED_BUSINESS_TYPES } from '@farmconnect/shared';

const AvatarSourceSchema = z
  .string()
  .trim()
  .max(2_000_000)
  .refine(
    (value) => /^https?:\/\//i.test(value) || /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value),
    'Avatar must be an image URL or uploaded image data',
  );

export const UpdateCurrentUserSchema = z
  .object({
    fullName: z.string().min(2).max(100).optional(),
    avatarUrl: AvatarSourceSchema.nullable().optional(),
    phone: z.string().min(6).max(30).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdateCurrentUserDto = z.infer<typeof UpdateCurrentUserSchema>;

export const UpsertBuyerProfileSchema = z.object({
  businessType: buyerBusinessTypeSchema.nullable().optional(),
});
export type UpsertBuyerProfileDto = z.infer<typeof UpsertBuyerProfileSchema>;

export const UpsertProducerProfileSchema = z.object({
  businessName: z.string().min(2).max(100),
  businessType: z.enum(PREDEFINED_BUSINESS_TYPES).nullable().optional(),
  bio: z.string().max(2000).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  wilaya: z.string().min(1).max(50),
  commune: z.string().min(1).max(50),
  nif: z.string().min(5).max(50).nullable().optional(),
  nis: z
    .string()
    .trim()
    .regex(/^\d{15}$/, 'NIS must be exactly 15 digits')
    .nullable()
    .optional(),
  nifDocumentUrl: z.string().url().max(500).nullable().optional(),
});

export type UpsertProducerProfileDto = z.infer<typeof UpsertProducerProfileSchema>;

export const SubmitProducerVerificationSchema = z.object({
  notes: z.string().max(2000).optional(),
  documents: z.array(z.string().url()).min(1, 'At least one document is required').max(10),
});

export type SubmitProducerVerificationDto = z.infer<typeof SubmitProducerVerificationSchema>;

export const ReviewProducerVerificationSchema = z
  .object({
    action: z.enum(['APPROVE', 'REJECT']),
    notes: z.string().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action === 'REJECT' && !data.notes?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['notes'], message: 'Rejection reason is required' });
    }
  });

export type ReviewProducerVerificationDto = z.infer<typeof ReviewProducerVerificationSchema>;

export const ListVerificationRequestsQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
});

export type ListVerificationRequestsQueryDto = z.infer<typeof ListVerificationRequestsQuerySchema>;
