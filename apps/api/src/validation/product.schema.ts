import { z } from 'zod';

export const createProductSchema = z.object({
  externalProductId: z.string().min(1, 'External product id is required'),
  name: z.string().min(3, 'Product name must be more than 3 characters long'),
  slug: z.string().min(3, 'Product slug must be more than 3 characters long'),
  description: z.string().optional(),
  active: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(3, 'Product name must be more than 3 characters long'),
  slug: z.string().min(3, 'Product slug must be more than 3 characters long'),
  description: z.string().optional(),
  active: z.boolean({ error: 'Active must be a boolean value' }),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const bulkProductItemSchema = z.object({
  externalProductId: z
    .string()
    .trim()
    .min(1, 'External product id is required'),
  name: z
    .string()
    .trim()
    .min(3, 'Product name must be more than 3 characters long'),
  slug: z
    .string()
    .trim()
    .min(3, 'Product slug must be more than 3 characters long'),
  description: z.string().optional(),
  active: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const bulkProductSchema = z.object({
  products: z
    .array(bulkProductItemSchema)
    .min(1, 'Products array is required')
    .max(500, 'Products array cannot exceed 500 items'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type BulkProductInput = z.infer<typeof bulkProductItemSchema>;
