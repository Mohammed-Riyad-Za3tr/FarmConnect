import { z } from 'zod';

import { PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX, PAGE_SIZE_MIN } from '../constants';
import { BuyerBusinessType } from '../enums';

// ─── Pagination Query ─────────────────────────────────────────────────────────

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(PAGE_SIZE_MIN)
    .max(PAGE_SIZE_MAX)
    .default(PAGE_SIZE_DEFAULT),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

// ─── UUID Param ───────────────────────────────────────────────────────────────

export const uuidParamSchema = z.object({
  id: z.string().uuid({ message: 'Invalid ID format' }),
});

export type UuidParam = z.infer<typeof uuidParamSchema>;

// ─── Locale Header ────────────────────────────────────────────────────────────

export const localeSchema = z.enum(['en', 'ar']).default('en');

export type Locale = z.infer<typeof localeSchema>;

export const buyerBusinessTypeSchema = z.nativeEnum(BuyerBusinessType);
export type BuyerBusinessTypeValue = z.infer<typeof buyerBusinessTypeSchema>;

export const categoryDtoSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().trim().min(1),
  nameEn: z.string().trim().min(1),
  nameAr: z.string().trim().min(1),
  parentId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const categoryListSchema = z.array(categoryDtoSchema);
export type CategoryDtoValue = z.infer<typeof categoryDtoSchema>;
