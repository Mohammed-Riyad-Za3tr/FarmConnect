import { z } from 'zod';

export const ProducerAnalyticsQuerySchema = z
  .object({
    range: z.enum(['today', 'week', 'month', 'custom']).optional().default('week'),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    lowStockThreshold: z.coerce.number().int().min(0).max(100000).optional().default(10),
    lowSalesBottomN: z.coerce.number().int().min(1).max(20).optional().default(5),
  })
  .superRefine((value, ctx) => {
    if (value.range === 'custom') {
      if (!value.from || !value.to) {
        ctx.addIssue({
          code: 'custom',
          path: ['from'],
          message: 'from and to are required for custom range',
        });
      } else if (value.from > value.to) {
        ctx.addIssue({
          code: 'custom',
          path: ['from'],
          message: 'from must be before or equal to to',
        });
      }
    }
  });

export type ProducerAnalyticsQueryDto = z.infer<typeof ProducerAnalyticsQuerySchema>;
