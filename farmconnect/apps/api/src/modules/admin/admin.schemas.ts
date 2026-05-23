import { z } from 'zod';

const UserRoleSchema = z.enum(['BUYER', 'PRODUCER', 'ADMIN']);
const UserStatusSchema = z.enum(['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION', 'DELETED']);
const ProductStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'ARCHIVED']);
const OrderStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
]);
const PaymentStatusSchema = z.enum([
  'UNPAID',
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
]);
const AuditActionSchema = z.enum(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VERIFY', 'REJECT', 'SUSPEND', 'UNSUSPEND']);

export const ListAdminUsersQuerySchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  role: UserRoleSchema.optional(),
  status: UserStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const ListAdminProductsQuerySchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  status: ProductStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const ListAdminOrdersQuerySchema = z.object({
  status: OrderStatusSchema.optional(),
  paymentStatus: PaymentStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const ListAdminAuditLogsQuerySchema = z.object({
  q: z.string().trim().min(1).max(120).optional(),
  action: AuditActionSchema.optional(),
  actorId: z.string().uuid().optional(),
  targetType: z.string().trim().min(1).max(60).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const ModerateProductSchema = z.object({
  status: ProductStatusSchema,
  reason: z.string().trim().max(500).optional(),
});

export const ModerateUserSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']),
  reason: z.string().trim().max(500).optional(),
});

export type ListAdminUsersQueryDto = z.infer<typeof ListAdminUsersQuerySchema>;
export type ListAdminProductsQueryDto = z.infer<typeof ListAdminProductsQuerySchema>;
export type ListAdminOrdersQueryDto = z.infer<typeof ListAdminOrdersQuerySchema>;
export type ListAdminAuditLogsQueryDto = z.infer<typeof ListAdminAuditLogsQuerySchema>;
export type ModerateProductDto = z.infer<typeof ModerateProductSchema>;
export type ModerateUserDto = z.infer<typeof ModerateUserSchema>;
