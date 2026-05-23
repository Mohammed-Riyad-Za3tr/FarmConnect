import { z } from 'zod';

const ProductImageSourceSchema = z
  .string()
  .trim()
  .max(2_000_000)
  .refine(
    (value) => /^https?:\/\//i.test(value) || /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value),
    'Image source must be a URL or uploaded image data',
  );

export const CreateProductImageSchema = z.object({
  sourceUrl: ProductImageSourceSchema,
  altText: z.string().trim().max(200).optional(),
  position: z.coerce.number().int().min(0).max(1000).optional().default(0),
});

export type CreateProductImageDto = z.infer<typeof CreateProductImageSchema>;

export const UpdateProductImageSchema = z
  .object({
    altText: z.string().trim().max(200).nullable().optional(),
    position: z.coerce.number().int().min(0).max(1000).optional(),
  })
  .superRefine((value, ctx) => {
    if (Object.keys(value).length === 0) {
      ctx.addIssue({ code: 'custom', message: 'At least one field must be provided' });
    }
  });

export type UpdateProductImageDto = z.infer<typeof UpdateProductImageSchema>;
