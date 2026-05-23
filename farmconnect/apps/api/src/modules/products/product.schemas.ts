import { z } from 'zod';
import { PREDEFINED_PRODUCT_TAGS } from '@farmconnect/shared';

const ProductStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'ARCHIVED']);
const ProductUnitSchema = z.enum(['KG', 'PIECE', 'BOX']);
const ProductLogTypeSchema = z.enum(['WATERING', 'HARVEST', 'FERTILIZE', 'OTHER']);
const ProductTagSchema = z.enum(PREDEFINED_PRODUCT_TAGS);
const BooleanQuerySchema = z.preprocess((value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return value;
}, z.boolean());

const LocalizedTextSchema = z
  .object({
    en: z.string().trim().min(1).max(200).optional(),
    ar: z.string().trim().min(1).max(200).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.en && !value.ar) {
      ctx.addIssue({ code: 'custom', message: 'Provide at least one locale (en or ar)' });
    }
  });

export const CreateProductSchema = z
  .object({
    categoryId: z.string().uuid().optional(),
    title: LocalizedTextSchema,
    description: LocalizedTextSchema,
    slug: z.string().trim().min(3).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    price: z.coerce.number().positive().max(100000000),
    currency: z.string().trim().min(3).max(8).default('DZD'),
    unit: ProductUnitSchema.default('KG'),
    recipePdfUrl: z.string().url().max(1000).optional(),
    harvestDate: z.coerce.date().optional(),
    harvestWindowStart: z.coerce.date().optional(),
    harvestWindowEnd: z.coerce.date().optional(),
    isSeasonal: z.boolean().optional().default(false),
    seasonStartMonth: z.coerce.number().int().min(1).max(12).optional(),
    seasonEndMonth: z.coerce.number().int().min(1).max(12).optional(),
    stock: z.coerce.number().int().min(0).default(0),
    minOrderQty: z.coerce.number().int().min(1).default(1),
    maxOrderQty: z.coerce.number().int().min(1).default(10000),
    status: ProductStatusSchema.default('DRAFT'),
    tags: z.array(ProductTagSchema).max(20).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.minOrderQty > value.maxOrderQty) {
      ctx.addIssue({
        code: 'custom',
        path: ['minOrderQty'],
        message: 'minOrderQty cannot be greater than maxOrderQty',
      });
    }
    if ((value.harvestWindowStart && !value.harvestWindowEnd) || (!value.harvestWindowStart && value.harvestWindowEnd)) {
      ctx.addIssue({
        code: 'custom',
        path: ['harvestWindowStart'],
        message: 'harvestWindowStart and harvestWindowEnd must be provided together',
      });
    }
  });

export type CreateProductDto = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = z
  .object({
    categoryId: z.string().uuid().nullable().optional(),
    title: LocalizedTextSchema.optional(),
    description: LocalizedTextSchema.optional(),
    slug: z.string().trim().min(3).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    price: z.coerce.number().positive().max(100000000).optional(),
    currency: z.string().trim().min(3).max(8).optional(),
    unit: ProductUnitSchema.optional(),
    recipePdfUrl: z.string().url().max(1000).nullable().optional(),
    harvestDate: z.coerce.date().nullable().optional(),
    harvestWindowStart: z.coerce.date().nullable().optional(),
    harvestWindowEnd: z.coerce.date().nullable().optional(),
    isSeasonal: z.boolean().optional(),
    seasonStartMonth: z.coerce.number().int().min(1).max(12).nullable().optional(),
    seasonEndMonth: z.coerce.number().int().min(1).max(12).nullable().optional(),
    stock: z.coerce.number().int().min(0).optional(),
    minOrderQty: z.coerce.number().int().min(1).optional(),
    maxOrderQty: z.coerce.number().int().min(1).optional(),
    status: ProductStatusSchema.optional(),
    tags: z.array(ProductTagSchema).max(20).optional(),
  })
  .superRefine((value, ctx) => {
    const min = value.minOrderQty;
    const max = value.maxOrderQty;
    if (min !== undefined && max !== undefined && min > max) {
      ctx.addIssue({
        code: 'custom',
        path: ['minOrderQty'],
        message: 'minOrderQty cannot be greater than maxOrderQty',
      });
    }
    if (Object.keys(value).length === 0) {
      ctx.addIssue({ code: 'custom', message: 'At least one field must be provided' });
    }
  });

export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;

export const ListOwnProductsQuerySchema = z.object({
  status: ProductStatusSchema.optional(),
  categoryId: z.string().uuid().optional(),
  includeArchived: BooleanQuerySchema.optional().default(false),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type ListOwnProductsQueryDto = z.infer<typeof ListOwnProductsQuerySchema>;

const PublicSortSchema = z.enum([
  'newest',
  'price_asc',
  'price_desc',
  'rating_desc',
  'distance_asc',
]);

export const ListPublicProductsQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(100).optional(),
    categoryId: z.string().uuid().optional(),
    categorySlug: z.string().trim().min(1).max(120).optional(),
    wilaya: z.string().trim().min(1).max(50).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    buyerLat: z.coerce.number().min(-90).max(90).optional(),
    buyerLng: z.coerce.number().min(-180).max(180).optional(),
    inStockOnly: BooleanQuerySchema.optional().default(false),
    onlyOffers: BooleanQuerySchema.optional().default(false),
    onlyFavoriteProducers: BooleanQuerySchema.optional().default(false),
    tags: z.union([z.string(), z.array(z.string())]).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    offset: z.coerce.number().int().min(0).optional().default(0),
    sort: PublicSortSchema.optional().default('newest'),
  })
  .superRefine((value, ctx) => {
    if (value.categoryId && value.categorySlug) {
      ctx.addIssue({
        code: 'custom',
        path: ['categorySlug'],
        message: 'Provide either categoryId or categorySlug, not both',
      });
    }
    if (value.minPrice !== undefined && value.maxPrice !== undefined && value.minPrice > value.maxPrice) {
      ctx.addIssue({
        code: 'custom',
        path: ['minPrice'],
        message: 'minPrice cannot be greater than maxPrice',
      });
    }
    if ((value.buyerLat !== undefined) !== (value.buyerLng !== undefined)) {
      ctx.addIssue({
        code: 'custom',
        path: ['buyerLat'],
        message: 'buyerLat and buyerLng must be provided together',
      });
    }
  })
  .transform((value) => ({
    ...value,
    tags:
      value.tags === undefined
        ? undefined
        : (Array.isArray(value.tags) ? value.tags : value.tags.split(',')).map((tag) => tag.trim()).filter(Boolean),
  }));

export type ListPublicProductsQueryDto = z.infer<typeof ListPublicProductsQuerySchema>;

export const CreateProductLogSchema = z.object({
  type: ProductLogTypeSchema,
  note: z.string().trim().min(1).max(1000),
  happenedAt: z.coerce.date(),
});

export type CreateProductLogDto = z.infer<typeof CreateProductLogSchema>;
