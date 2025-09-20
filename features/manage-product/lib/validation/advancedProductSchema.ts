/**
 * Advanced-Only Product Validation Schemas
 *
 * Clean validation schemas for advanced size management system without legacy baggage.
 * These schemas enforce the advanced size management model where every product MUST have sizes.
 */

import { z } from 'zod'

// ============== ENUM SCHEMAS ==============

/**
 * Advanced Age Category enum validation
 */
export const advancedAgeCategorySchema = z.enum(['ADULT', 'CHILD', 'UNIVERSAL'], {
  errorMap: () => ({ message: 'Kategori umur harus ADULT, CHILD, atau UNIVERSAL' }),
})

/**
 * Advanced Size enum validation
 */
export const advancedSizeEnumSchema = z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL'], {
  errorMap: () => ({ message: 'Ukuran harus XS, S, M, L, XL, atau XXL' }),
})

/**
 * Product status enum validation
 */
export const advancedProductStatusSchema = z.enum(['AVAILABLE', 'RENTED', 'MAINTENANCE'], {
  errorMap: () => ({ message: 'Status produk harus AVAILABLE, RENTED, atau MAINTENANCE' }),
})

// ============== BASE SCHEMAS ==============

/**
 * Advanced Product Size validation schema
 */
export const advancedProductSizeSchema = z.object({
  ageCategory: advancedAgeCategorySchema,
  size: advancedSizeEnumSchema,
  quantity: z
    .number()
    .int('Jumlah harus berupa bilangan bulat')
    .min(1, 'Jumlah minimal 1')
    .max(9999, 'Jumlah maksimal 9999'),
  isActive: z.boolean().optional().default(true),
})

/**
 * Update Product Size validation schema (includes optional id)
 */
export const updateAdvancedProductSizeSchema = advancedProductSizeSchema.extend({
  id: z.string().uuid('ID ukuran tidak valid').optional(),
})

/**
 * Advanced Product base schema - core fields without legacy baggage
 */
export const advancedProductBaseSchema = z.object({
  code: z
    .string()
    .min(1, 'Kode produk wajib diisi')
    .max(4, 'Kode maksimal 4 karakter')
    .regex(/^[A-Z0-9]{4}$/, 'Kode harus 4 digit alfanumerik uppercase'),
  name: z.string().min(1, 'Nama produk wajib diisi').max(100, 'Nama maksimal 100 karakter'),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional(),
  modalAwal: z
    .number()
    .positive('Modal awal harus positif')
    .max(999999999, 'Modal maksimal 999,999,999'),
  currentPrice: z
    .number()
    .positive('Harga sewa harus positif')
    .max(999999999, 'Harga sewa maksimal 999,999,999'),
  categoryId: z.string().uuid('ID kategori tidak valid'),
  colorId: z.string().uuid('ID warna tidak valid').optional(),
  materialId: z.string().uuid('ID material tidak valid').optional(),
  materialQuantity: z
    .number()
    .int('Jumlah material harus berupa bilangan bulat')
    .min(1, 'Jumlah material minimal 1')
    .max(99999, 'Jumlah material maksimal 99,999')
    .optional(),
})

/**
 * Image file validation schema
 */
export const advancedImageFileSchema = z
  .union([z.instanceof(File), z.undefined(), z.null()])
  .refine((file) => {
    if (!file) return true // Allow undefined/null
    if (!(file instanceof File)) return false
    return file.size <= 5 * 1024 * 1024
  }, 'Ukuran file maksimal 5MB')
  .refine((file) => {
    if (!file) return true
    if (!(file instanceof File)) return false
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    return allowedTypes.includes(file.type)
  }, 'File harus berformat JPEG, PNG, WebP, atau JPG')

// ============== REQUEST SCHEMAS ==============

/**
 * Create Advanced Product request validation
 *
 * REQUIREMENTS:
 * - Must provide at least 1 size in sizes array
 * - No duplicate size+ageCategory combinations
 * - All sizes must have valid enums and positive quantities
 */
export const createAdvancedProductSchema = advancedProductBaseSchema.extend({
  sizes: z
    .array(advancedProductSizeSchema)
    .min(1, 'Minimal 1 ukuran harus ditambahkan')
    .max(50, 'Maksimal 50 ukuran per produk')
    .refine(
      (sizes) => {
        // Check for duplicate size+ageCategory combinations
        const combinations = sizes.map(s => `${s.ageCategory}-${s.size}`)
        const uniqueCombinations = new Set(combinations)
        return combinations.length === uniqueCombinations.size
      },
      {
        message: 'Tidak boleh ada ukuran duplikat dalam kategori umur yang sama',
      }
    ),
  image: advancedImageFileSchema.optional(),
  imageUrl: z.string().url('URL gambar tidak valid').optional(),
})

/**
 * Update Advanced Product request validation
 */
export const updateAdvancedProductSchema = advancedProductBaseSchema
  .partial()
  .extend({
    sizes: z
      .array(updateAdvancedProductSizeSchema)
      .min(1, 'Minimal 1 ukuran harus ada')
      .max(50, 'Maksimal 50 ukuran per produk')
      .refine(
        (sizes) => {
          // Check for duplicate size+ageCategory combinations
          const combinations = sizes.map(s => `${s.ageCategory}-${s.size}`)
          const uniqueCombinations = new Set(combinations)
          return combinations.length === uniqueCombinations.size
        },
        {
          message: 'Tidak boleh ada ukuran duplikat dalam kategori umur yang sama',
        }
      )
      .optional(),
    image: advancedImageFileSchema.optional(),
    imageUrl: z.string().url('URL gambar tidak valid').optional(),
  })

// ============== QUERY SCHEMAS ==============

/**
 * Advanced Product query parameters validation
 */
export const advancedProductQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'Halaman minimal 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit minimal 1').max(100, 'Limit maksimal 100').default(10),
  search: z.string().max(100, 'Pencarian maksimal 100 karakter').optional(),
  categoryId: z.string().uuid('ID kategori tidak valid').optional(),
  status: advancedProductStatusSchema.optional(),
  isActive: z.coerce.boolean().optional().default(true),
  colorId: z
    .union([
      z.string().uuid('ID warna tidak valid'),
      z.array(z.string().uuid('ID warna tidak valid')),
    ])
    .optional(),
  // Advanced filtering options
  ageCategory: advancedAgeCategorySchema.optional(),
  size: advancedSizeEnumSchema.optional(),
  hasMultipleAgeCategories: z.coerce.boolean().optional(),
  hasMultipleSizes: z.coerce.boolean().optional(),
  minComplexityScore: z.coerce.number().min(0).max(10).optional(),
})

/**
 * Advanced Product params validation (for URL parameters)
 */
export const advancedProductParamsSchema = z.object({
  id: z.string().uuid('ID produk tidak valid'),
})

/**
 * Advanced Product Size query parameters
 */
export const advancedProductSizeQuerySchema = z.object({
  productId: z.string().uuid('ID produk tidak valid'),
  ageCategory: advancedAgeCategorySchema.optional(),
  size: advancedSizeEnumSchema.optional(),
  isActive: z.coerce.boolean().optional().default(true),
})

/**
 * Advanced Product Size params validation
 */
export const advancedProductSizeParamsSchema = z.object({
  id: z.string().uuid('ID ukuran tidak valid'),
  productId: z.string().uuid('ID produk tidak valid'),
})

// ============== AGGREGATION SCHEMAS ==============

/**
 * Advanced Aggregation query options
 */
export const advancedAggregationOptionsSchema = z.object({
  includeBreakdown: z.coerce.boolean().optional().default(true),
  includeRentalTracking: z.coerce.boolean().optional().default(true),
  forceRefresh: z.coerce.boolean().optional().default(false),
  performanceThreshold: z.coerce.number().min(1).max(1000).optional().default(50),
})

/**
 * Advanced Business Logic validation options
 */
export const advancedBusinessValidationOptionsSchema = z.object({
  strictValidation: z.coerce.boolean().optional().default(true),
  includeWarnings: z.coerce.boolean().optional().default(true),
  validateBusinessCapabilities: z.coerce.boolean().optional().default(true),
})

// ============== BULK OPERATION SCHEMAS ==============

/**
 * Bulk Advanced Product creation schema
 */
export const bulkCreateAdvancedProductSchema = z.object({
  products: z
    .array(createAdvancedProductSchema)
    .min(1, 'Minimal 1 produk untuk operasi bulk')
    .max(50, 'Maksimal 50 produk untuk operasi bulk'),
  validateAll: z.boolean().optional().default(true),
  stopOnFirstError: z.boolean().optional().default(false),
})

/**
 * Bulk Advanced Product update schema
 */
export const bulkUpdateAdvancedProductSchema = z.object({
  updates: z
    .array(
      z.object({
        id: z.string().uuid('ID produk tidak valid'),
        data: updateAdvancedProductSchema,
      })
    )
    .min(1, 'Minimal 1 produk untuk operasi bulk')
    .max(50, 'Maksimal 50 produk untuk operasi bulk'),
  validateAll: z.boolean().optional().default(true),
  stopOnFirstError: z.boolean().optional().default(false),
})

// ============== MIGRATION SCHEMAS ==============

/**
 * Advanced Product migration options
 */
export const advancedMigrationOptionsSchema = z.object({
  defaultAgeCategory: advancedAgeCategorySchema.optional().default('ADULT'),
  preserveLegacySize: z.boolean().optional().default(false),
  validateAfterMigration: z.boolean().optional().default(true),
  dryRun: z.boolean().optional().default(false),
})

/**
 * Bulk migration request schema
 */
export const bulkMigrationSchema = z.object({
  productIds: z
    .array(z.string().uuid('ID produk tidak valid'))
    .min(1, 'Minimal 1 produk untuk migrasi')
    .max(100, 'Maksimal 100 produk untuk migrasi bulk'),
  options: advancedMigrationOptionsSchema.optional(),
})

// ============== EXPORT SCHEMAS ==============

/**
 * Product export for advanced products
 */
export const advancedProductExportSchema = z.object({
  format: z.enum(['json', 'csv', 'xlsx'], {
    errorMap: () => ({ message: 'Format harus json, csv, atau xlsx' }),
  }),
  includeAggregation: z.boolean().optional().default(false),
  includeBusinessCapabilities: z.boolean().optional().default(false),
  filters: advancedProductQuerySchema.partial().optional(),
})

// ============== TYPE EXPORTS ==============

// Export inferred types for TypeScript usage
export type CreateAdvancedProductData = z.infer<typeof createAdvancedProductSchema>
export type UpdateAdvancedProductData = z.infer<typeof updateAdvancedProductSchema>
export type AdvancedProductQueryData = z.infer<typeof advancedProductQuerySchema>
export type AdvancedProductParamsData = z.infer<typeof advancedProductParamsSchema>
export type AdvancedProductSizeData = z.infer<typeof advancedProductSizeSchema>
export type UpdateAdvancedProductSizeData = z.infer<typeof updateAdvancedProductSizeSchema>
export type AdvancedAggregationOptionsData = z.infer<typeof advancedAggregationOptionsSchema>
export type BulkCreateAdvancedProductData = z.infer<typeof bulkCreateAdvancedProductSchema>
export type BulkUpdateAdvancedProductData = z.infer<typeof bulkUpdateAdvancedProductSchema>
export type AdvancedMigrationOptionsData = z.infer<typeof advancedMigrationOptionsSchema>
export type BulkMigrationData = z.infer<typeof bulkMigrationSchema>
export type AdvancedProductExportData = z.infer<typeof advancedProductExportSchema>

// ============== VALIDATION UTILITIES ==============

/**
 * Validate size array with enhanced business rules
 */
export function validateAdvancedSizeArraySchema(sizes: unknown[]) {
  const schema = z
    .array(advancedProductSizeSchema)
    .min(1, 'Minimal 1 ukuran harus ditambahkan')
    .refine(
      (sizes) => {
        const combinations = sizes.map(s => `${s.ageCategory}-${s.size}`)
        const uniqueCombinations = new Set(combinations)
        return combinations.length === uniqueCombinations.size
      },
      {
        message: 'Tidak boleh ada ukuran duplikat dalam kategori umur yang sama',
      }
    )

  return schema.safeParse(sizes)
}

/**
 * Validate product code format with advanced requirements
 */
export function validateAdvancedProductCode(code: string) {
  const schema = z
    .string()
    .min(4, 'Kode produk harus 4 karakter')
    .max(4, 'Kode produk harus 4 karakter')
    .regex(/^[A-Z0-9]{4}$/, 'Kode harus 4 digit alfanumerik uppercase')

  return schema.safeParse(code)
}

/**
 * Validate business capability requirements
 */
export function validateBusinessCapabilityRequirements(product: {
  sizes: Array<{ ageCategory: string; size: string; quantity: number }>
}) {
  const uniqueAgeCategories = new Set(product.sizes.map(s => s.ageCategory)).size
  const uniqueSizes = new Set(product.sizes.map(s => s.size)).size
  const totalQuantity = product.sizes.reduce((sum, s) => sum + s.quantity, 0)

  const requirements = {
    hasMultipleAgeCategories: uniqueAgeCategories > 1,
    hasMultipleSizes: uniqueSizes > 1,
    hasAdequateStock: totalQuantity >= 3,
    meetsMinimumComplexity: (uniqueAgeCategories + uniqueSizes) >= 3,
  }

  const score = Object.values(requirements).filter(Boolean).length
  const level = score >= 4 ? 'excellent' : score >= 3 ? 'good' : score >= 2 ? 'basic' : 'insufficient'

  return {
    requirements,
    score,
    level,
    recommendations: generateCapabilityRecommendations(requirements),
  }
}

/**
 * Generate capability improvement recommendations
 */
function generateCapabilityRecommendations(requirements: Record<string, boolean>): string[] {
  const recommendations: string[] = []

  if (!requirements.hasMultipleAgeCategories) {
    recommendations.push('Tambahkan kategori umur lain untuk segmentasi pelanggan yang lebih baik')
  }

  if (!requirements.hasMultipleSizes) {
    recommendations.push('Tambahkan variasi ukuran untuk melayani kebutuhan pelanggan yang lebih beragam')
  }

  if (!requirements.hasAdequateStock) {
    recommendations.push('Tingkatkan stok untuk memenuhi permintaan pelanggan')
  }

  if (!requirements.meetsMinimumComplexity) {
    recommendations.push('Perluas portfolio ukuran untuk meningkatkan kemampuan analisis bisnis')
  }

  if (recommendations.length === 0) {
    recommendations.push('Produk sudah memiliki kemampuan bisnis yang excellent')
  }

  return recommendations
}