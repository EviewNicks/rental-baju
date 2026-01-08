/**
 * Cost Item Validation Schemas
 * Zod schemas for cost item operations
 */

import { z } from 'zod'

/**
 * Schema for creating a new cost item
 */
export const createCostItemSchema = z.object({
  name: z
    .string()
    .min(1, 'Nama cost item tidak boleh kosong')
    .max(255, 'Nama cost item maksimal 255 karakter')
    .trim()
    .refine((val) => val.length > 0, {
      message: 'Nama cost item tidak boleh hanya berisi spasi',
    }),
})

/**
 * Schema for updating a cost item
 */
export const updateCostItemSchema = z.object({
  name: z
    .string()
    .min(1, 'Nama cost item tidak boleh kosong')
    .max(255, 'Nama cost item maksimal 255 karakter')
    .trim()
    .refine((val) => val.length > 0, {
      message: 'Nama cost item tidak boleh hanya spasi',
    })
    .optional(),
})

/**
 * Schema for cost item query parameters
 */
export const costItemQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, { message: 'Page harus lebih dari 0' }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, {
      message: 'Limit harus antara 1-100',
    }),
  search: z.string().optional(),
})

/**
 * Schema for cost item ID parameter
 */
export const costItemParamsSchema = z.object({
  id: z.string().uuid('ID cost item harus berupa UUID yang valid'),
})

/**
 * Schema for product cost creation
 */
export const createProductCostSchema = z.object({
  costItemId: z.string().uuid('Cost item ID harus berupa UUID yang valid'),
  amount: z
    .number()
    .positive('Jumlah biaya harus lebih dari 0')
    .max(999999999.99, 'Jumlah biaya terlalu besar'),
  notes: z.string().max(500, 'Catatan maksimal 500 karakter').optional(),
})

/**
 * Schema for product cost update
 */
export const updateProductCostSchema = z.object({
  amount: z
    .number()
    .positive('Jumlah biaya harus lebih dari 0')
    .max(999999999.99, 'Jumlah biaya terlalu besar')
    .optional(),
  notes: z.string().max(500, 'Catatan maksimal 500 karakter').optional(),
})

/**
 * Schema for product cost ID parameter
 */
export const productCostParamsSchema = z.object({
  id: z.string().uuid('ID product cost harus berupa UUID yang valid'),
})

/**
 * Type exports
 */
export type CreateCostItemRequest = z.infer<typeof createCostItemSchema>
export type UpdateCostItemRequest = z.infer<typeof updateCostItemSchema>
export type CostItemQueryParams = z.infer<typeof costItemQuerySchema>
export type CreateProductCostRequest = z.infer<typeof createProductCostSchema>
export type UpdateProductCostRequest = z.infer<typeof updateProductCostSchema>