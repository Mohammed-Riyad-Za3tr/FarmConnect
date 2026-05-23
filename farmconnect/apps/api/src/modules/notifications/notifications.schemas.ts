import { z } from 'zod';

const unreadOnlyQuery = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((value) => value === true || value === 'true');

export const ListNotificationsQuerySchema = z.object({
  unreadOnly: unreadOnlyQuery.default(false),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListNotificationsQueryDto = z.infer<typeof ListNotificationsQuerySchema>;
