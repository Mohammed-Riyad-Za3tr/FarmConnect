import { z } from 'zod';

const ReportTargetTypeSchema = z.enum(['USER', 'PRODUCT', 'ORDER']);
const ReportReasonSchema = z.enum(['SPAM', 'FRAUD', 'ABUSE', 'INAPPROPRIATE_CONTENT', 'OTHER']);
const ReportStatusSchema = z.enum(['OPEN', 'REVIEWING', 'RESOLVED', 'REJECTED']);

export const CreateReportSchema = z.object({
  targetType: ReportTargetTypeSchema,
  targetId: z.string().uuid(),
  reason: ReportReasonSchema,
  description: z.string().trim().min(3).max(1000),
});

export const ListAdminReportsQuerySchema = z.object({
  status: ReportStatusSchema.optional(),
  targetType: ReportTargetTypeSchema.optional(),
  reporterId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const UpdateAdminReportSchema = z.object({
  status: ReportStatusSchema,
  internalNote: z.string().trim().max(1500).optional(),
});

export type CreateReportDto = z.infer<typeof CreateReportSchema>;
export type ListAdminReportsQueryDto = z.infer<typeof ListAdminReportsQuerySchema>;
export type UpdateAdminReportDto = z.infer<typeof UpdateAdminReportSchema>;
