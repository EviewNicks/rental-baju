/**
 * Material Validation Schemas - RPK-45
 * Zod validation schemas untuk Material management
 */

import { z } from 'zod'

// ===============================
// BASIC VALIDATION SCHEMAS
// ===============================

/**
 * Material Name Validation
 */
const materialNameSchema = z
  .string()
  .min(1, 'Nama material tidak boleh kosong')
  .max(100, 'Nama material maksimal 100 karakter')
  .trim()

/**
 * Price Per Unit Validation
 */
const pricePerUnitSchema = z
  .number({
    required_error: 'Harga per unit wajib diisi',
    invalid_type_error: 'Harga per unit harus berupa angka',
  })
  .positive('Harga per unit harus lebih besar dari 0')
  .max(999999.99, 'Harga per unit maksimal 999,999.99')

/**
 * Unit Validation
 */
const unitSchema = z
  .string()
  .min(1, 'Satuan tidak boleh kosong')
  .max(20, 'Satuan maksimal 20 karakter')
  .trim()

/**
 * Material ID Validation
 */
const materialIdSchema = z
  .string()
  .uuid('Format ID material tidak valid')

// ===============================
// REQUEST SCHEMAS
// ===============================

/**
 * Create Material Schema
 */
export const createMaterialSchema = z.object({
  name: materialNameSchema,
  pricePerUnit: pricePerUnitSchema,
  unit: unitSchema,
})

/**
 * Update Material Schema
 */
export const updateMaterialSchema = z.object({
  name: materialNameSchema.optional(),
  pricePerUnit: pricePerUnitSchema.optional(),
  unit: unitSchema.optional(),
  isActive: z.boolean().optional(),
})

/**
 * Material Params Schema (untuk URL params)
 */
export const materialParamsSchema = z.object({
  id: materialIdSchema,
})

// ===============================
// QUERY SCHEMAS
// ===============================

/**
 * Material Query Schema
 */
export const materialQuerySchema = z.object({
  page: z
    .number()
    .int('Page harus berupa bilangan bulat')
    .min(1, 'Page minimal 1')
    .default(1),
  limit: z
    .number()
    .int('Limit harus berupa bilangan bulat')
    .min(1, 'Limit minimal 1')
    .max(100, 'Limit maksimal 100')
    .default(10),
  search: z
    .string()
    .max(100, 'Search maksimal 100 karakter')
    .trim()
    .optional(),
  isActive: z
    .boolean()
    .default(true),
  unit: z
    .union([z.string(), z.array(z.string())])
    .optional(),
})

// ===============================
// FORM SCHEMAS
// ===============================

/**
 * Material Form Schema (untuk frontend forms)
 */
export const materialFormSchema = z.object({
  name: materialNameSchema,
  pricePerUnit: z
    .union([
      pricePerUnitSchema,
      z
        .string()
        .min(1, 'Harga per unit tidak boleh kosong')
        .transform((val) => {
          const num = parseFloat(val)
          if (isNaN(num)) {
            throw new Error('Harga per unit harus berupa angka')
          }
          return num
        })
        .pipe(pricePerUnitSchema),
    ]),
  unit: unitSchema,
})

// ===============================
// COST CALCULATION SCHEMAS
// ===============================

/**
 * Material Cost Calculation Schema
 */
export const materialCostCalculationSchema = z.object({
  materialId: materialIdSchema,
  quantity: z
    .number()
    .int('Jumlah harus berupa bilangan bulat')
    .positive('Jumlah harus lebih besar dari 0')
    .max(99999, 'Jumlah maksimal 99,999'),
})

// ===============================
// TYPE EXPORTS
// ===============================

export type CreateMaterialRequest = z.infer<typeof createMaterialSchema>
export type UpdateMaterialRequest = z.infer<typeof updateMaterialSchema>
export type MaterialParams = z.infer<typeof materialParamsSchema>
export type MaterialQuery = z.infer<typeof materialQuerySchema>
export type MaterialFormData = z.infer<typeof materialFormSchema>
export type MaterialCostCalculation = z.infer<typeof materialCostCalculationSchema>

// ===============================
// VALIDATION HELPERS
// ===============================

/**
 * Validate Material Name
 */
export function validateMaterialName(name: string): string | null {
  try {
    materialNameSchema.parse(name)
    return null
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Nama material tidak valid'
    }
    return 'Nama material tidak valid'
  }
}

/**
 * Validate Price Per Unit
 */
export function validatePricePerUnit(price: number): string | null {
  try {
    pricePerUnitSchema.parse(price)
    return null
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Harga per unit tidak valid'
    }
    return 'Harga per unit tidak valid'
  }
}

/**
 * Validate Unit
 */
export function validateUnit(unit: string): string | null {
  try {
    unitSchema.parse(unit)
    return null
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Satuan tidak valid'
    }
    return 'Satuan tidak valid'
  }
}