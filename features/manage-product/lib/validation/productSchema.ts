import { z } from 'zod'

// ============== BASE SCHEMAS ==============

/**
 * Base schema untuk produk yang bisa di-extend
 * Berisi validasi dasar yang digunakan di semua operasi produk
 */
export const productBaseSchema = z.object({
  code: z
    .string()
    .min(1, 'Kode produk wajib diisi')
    .max(5, 'Kode maksimal 5 karakter')
    .regex(/^[A-Z0-9]{4,5}$/, 'Kode harus 4-5 digit alfanumerik uppercase'),
  name: z.string().min(1, 'Nama produk wajib diisi').max(100, 'Nama maksimal 100 karakter'),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional(),
  modalAwal: z
    .number()
    .min(0, 'Modal awal tidak boleh negatif') // ✅ FIXED: Allow 0 for producer flow
    .max(999999999, 'Modal maksimal 999,999,999')
    .optional() // ✅ FIXED: Make optional
    .default(0), // ✅ FIXED: Default 0 for producer
  currentPrice: z
    .number()
    .positive('Harga sewa harus positif')
    .max(999999999, 'Harga sewa maksimal 999,999,999'),
  quantity: z.number().int().min(0, 'Jumlah minimal 0').max(9999, 'Jumlah maksimal 9999'),
  rentedStock: z.number().int().min(0, 'Stok tersewa minimal 0').optional().default(0),
  categoryId: z.string().uuid('ID kategori tidak valid'),
  size: z.string().max(10, 'Ukuran maksimal 10 karakter').optional(),
  // Cost Item Management - replaces Material Management
  selectedCosts: z.array(z.object({
    costItemId: z.string().uuid('ID cost item tidak valid'),
    amount: z.number().positive('Jumlah biaya harus positif'),
    notes: z.string().optional(),
  })).optional().default([]),
})

/**
 * Schema untuk file validation yang bisa digunakan di berbagai tempat
 * Perbaikan: Handle undefined dan null dengan lebih baik
 */
export const imageFileSchema = z
  .union([z.instanceof(File), z.undefined(), z.null()])
  .refine((file) => {
    if (!file) return true // Allow undefined/null
    if (!(file instanceof File)) return false
    return file.size <= 5 * 1024 * 1024
  }, 'Ukuran file maksimal 5MB')
  .refine((file) => {
    if (!file) return true // Allow undefined/null
    if (!(file instanceof File)) return false
    return ['image/jpeg', 'image/png', 'image/webp', 'image/heic'].includes(file.type)
  }, 'Format file harus JPG, PNG, WebP, atau HEIC')

// ============== PRODUCT SCHEMAS ==============

/**
 * Schema untuk produk dengan imageUrl (hasil dari database)
 * Digunakan untuk response dan validasi data yang sudah ada
 */
export const productSchema = productBaseSchema.extend({
  imageUrl: z.string().url('URL gambar tidak valid').optional(),
})

/**
 * Schema untuk create product dengan file upload
 * Perbaikan: Gunakan union type untuk handle optional file dengan lebih baik
 */
// DEPRECATED: Legacy createProductSchema removed
// Use createProductWithSizesSchema for advanced-only architecture

/**
 * Schema untuk update product dengan file upload
 * Digunakan untuk multipart form data saat update
 */
// DEPRECATED: Legacy updateProductSchema removed
// Use updateProductWithSizesSchema for advanced-only architecture

// ============== CATEGORY SCHEMAS ==============

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Nama kategori wajib diisi')
    .max(50, 'Nama kategori maksimal 50 karakter'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Warna harus dalam format hex (#RRGGBB)'),
  type: z
    .enum(['clothing', 'accessories_age_based', 'accessories_universal'], {
      message: 'Tipe kategori harus salah satu dari: clothing, accessories_age_based, accessories_universal',
    })
    .default('clothing'), // Add default back as safety net
})

export const updateCategorySchema = categorySchema.partial()

// ============== SIZE MANAGEMENT SCHEMAS ==============

/**
 * Schema untuk enum AgeCategory
 */
export const ageCategorySchema = z.enum(['ADULT', 'CHILD', 'UNIVERSAL'], {
  message: 'Kategori umur harus ADULT, CHILD, atau UNIVERSAL',
})

/**
 * Schema untuk enum SizeEnum
 */
export const sizeEnumSchema = z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'UNIVERSAL'], {
  message: 'Ukuran harus XS, S, M, L, XL, XXL, atau UNIVERSAL',
})

/**
 * Schema untuk single ProductSize
 */
export const productSizeSchema = z.object({
  ageCategory: ageCategorySchema,
  size: sizeEnumSchema,
  quantity: z
    .number()
    .int('Kuantitas harus berupa bilangan bulat')
    .min(1, 'Kuantitas minimal 1')
    .max(9999, 'Kuantitas maksimal 9999'),
  // Enhanced ProductSize fields
  originalQuantity: z.number().int().min(0).optional(),
  rentedQuantity: z.number().int().min(0).default(0),
  availableQuantity: z.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
})

/**
 * Schema untuk update ProductSize (dengan id optional)
 */
export const updateProductSizeSchema = productSizeSchema.extend({
  id: z.string().uuid('ID ukuran produk tidak valid').optional(),
})

/**
 * Schema untuk array of sizes dengan business rules validation
 */
export const productSizesArraySchema = z
  .array(productSizeSchema)
  .refine(
    (sizes) => {
      // Business Rule: No duplicate size within same age category
      const combinations = sizes.map((s) => `${s.ageCategory}-${s.size}`)
      const uniqueCombinations = new Set(combinations)
      return combinations.length === uniqueCombinations.size
    },
    {
      message: 'Tidak boleh ada ukuran duplikat dalam kategori umur yang sama',
    },
  )
  .refine(
    (sizes) => {
      // Business Rule: All quantities must be positive
      return sizes.every((s) => s.quantity > 0)
    },
    {
      message: 'Semua kuantitas ukuran harus lebih dari 0',
    },
  )

/**
 * Enhanced product creation schema dengan size management
 */
export const createProductWithSizesSchema = productBaseSchema.extend({
  image: z.union([z.instanceof(File), z.undefined(), z.null()]).optional(),
  sizes: productSizesArraySchema.min(1, 'Minimal 1 ukuran harus ditambahkan'),
})

/**
 * Enhanced product update schema dengan size management
 */
export const updateProductWithSizesSchema = productBaseSchema.partial().extend({
  image: imageFileSchema.optional(),
  sizes: z.array(updateProductSizeSchema).optional(),
})

// ============== CATEGORY-SPECIFIC SIZE SCHEMAS ==============

/**
 * Schema untuk accessories age-based sizes (Dewasa/Anak)
 * Digunakan untuk produk seperti Sarung, Songket yang memerlukan pembagian umur
 */
export const accessoriesAgeBasedSizeSchema = z.array(
  productSizeSchema.extend({
    ageCategory: z.enum(['ADULT', 'CHILD'], {
      message: 'Aksesoris age-based harus menggunakan kategori ADULT atau CHILD',
    }),
    size: z.enum(['UNIVERSAL', 'XS', 'S', 'M', 'L', 'XL', 'XXL']).optional().default('UNIVERSAL'),
  })
).refine(
  (sizes) => {
    // Minimal satu age category harus ada
    const ageCategories = new Set(sizes.map(s => s.ageCategory))
    return ageCategories.size > 0
  },
  {
    message: 'Minimal satu kategori umur (Dewasa/Anak) harus ditambahkan',
  }
).refine(
  (sizes) => {
    // Tidak boleh duplikat age category yang sama
    const ageCategories = sizes.map(s => s.ageCategory)
    const uniqueCategories = new Set(ageCategories)
    return ageCategories.length === uniqueCategories.size
  },
  {
    message: 'Tidak boleh ada duplikat kategori umur yang sama',
  }
)

/**
 * Schema untuk accessories universal sizes
 * Digunakan untuk produk seperti Anting, Gelang yang hanya perlu satu kuantitas
 */
export const accessoriesUniversalSizeSchema = z.array(
  productSizeSchema.extend({
    ageCategory: z.literal('UNIVERSAL'),
    size: z.literal('UNIVERSAL'),
  })
).refine(
  (sizes) => sizes.length === 1,
  {
    message: 'Aksesoris universal seharusnya hanya memiliki satu entri ukuran',
  }
)

/**
 * Schema untuk clothing sizes (S/M/L/XL)
 * Digunakan untuk produk pakaian standar dengan ukuran S, M, L, XL, dll
 */
export const clothingSizeSchema = z.array(
  productSizeSchema.extend({
    ageCategory: z.enum(['ADULT', 'CHILD'], {
      message: 'Pakaian harus menggunakan kategori ADULT atau CHILD',
    }),
    size: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'UNIVERSAL'], {
      message: 'Ukuran pakaian harus salah satu dari: XS, S, M, L, XL, XXL, UNIVERSAL',
    }),
  })
).refine(
  (sizes) => {
    // Tidak boleh duplikat kombinasi age category dan size
    const combinations = sizes.map(s => `${s.ageCategory}-${s.size}`)
    const uniqueCombinations = new Set(combinations)
    return combinations.length === uniqueCombinations.size
  },
  {
    message: 'Tidak boleh ada ukuran duplikat dalam kategori umur yang sama',
  }
)

/**
 * Enhanced size array validation dengan category type context
 * Schema dinamis yang berubah berdasarkan category type
 */
export const createCategoryAwareSizeSchema = (categoryType: 'clothing' | 'accessories_age_based' | 'accessories_universal') => {
  switch (categoryType) {
    case 'accessories_age_based':
      return accessoriesAgeBasedSizeSchema
    case 'accessories_universal':
      return accessoriesUniversalSizeSchema
    case 'clothing':
    default:
      return clothingSizeSchema
  }
}

// ============== QUERY & PARAMS SCHEMAS ==============

/**
 * Skema validasi query parameter untuk endpoint produk
 * Memastikan tipe dan batasan parameter yang diterima
 */
export const productQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(['AVAILABLE', 'RENTED', 'MAINTENANCE']).optional(),
  isActive: z.coerce.boolean().optional(),
  size: z.union([z.string(), z.array(z.string())]).optional(),
})

/**
 * Skema validasi parameter route untuk produk
 * Memastikan ID produk valid
 */
export const productParamsSchema = z.object({
  id: z.string().uuid('ID produk tidak valid'),
})

/**
 * Skema validasi query parameter untuk endpoint kategori
 * Memastikan tipe dan batasan parameter yang diterima
 */
export const categoryQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional().default(true),
  includeProducts: z.coerce.boolean().optional().default(false),
})

/**
 * Skema validasi parameter route untuk kategori
 * Memastikan ID kategori valid
 */
export const categoryParamsSchema = z.object({
  id: z.string().uuid('ID kategori tidak valid'),
})

// ============== ADVANCED-ONLY ALIASES ==============

/**
 * Simplified aliases for advanced-only architecture
 * These provide cleaner imports for the unified advanced schema
 */
export const createProductSchema = createProductWithSizesSchema
export const updateProductSchema = updateProductWithSizesSchema

/**
 * Validation helper for advanced size arrays
 */
export const validateAdvancedSizeArraySchema = (sizes: unknown[]) => {
  return productSizesArraySchema.safeParse(sizes)
}
