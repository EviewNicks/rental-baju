import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

// ============== BASE SCHEMAS ==============

/**
 * Base schema untuk produk yang bisa di-extend
 * Berisi validasi dasar yang digunakan di semua operasi produk
 */
export const productBaseSchema = z.object({
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
    .max(999999999, 'Modal maksimal 999,999,999')
    .transform(val => new Decimal(val)),
  hargaSewa: z
    .number()
    .positive('Harga sewa harus positif')
    .max(999999999, 'Harga sewa maksimal 999,999,999')
    .transform(val => new Decimal(val)),
  quantity: z.number().int().min(0, 'Jumlah minimal 0').max(9999, 'Jumlah maksimal 9999'),
  categoryId: z.string().uuid('ID kategori tidak valid'),
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
    return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  }, 'Format file harus JPG, PNG, atau WebP')

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
export const createProductSchema = productBaseSchema.extend({
  image: z.union([z.instanceof(File), z.undefined(), z.null()]).optional(),
})

/**
 * Schema untuk update product dengan file upload
 * Digunakan untuk multipart form data saat update
 */
export const updateProductSchema = productBaseSchema.partial().extend({
  image: imageFileSchema.optional(),
})

// ============== CATEGORY SCHEMAS ==============

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Nama kategori wajib diisi')
    .max(50, 'Nama kategori maksimal 50 karakter'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Warna harus dalam format hex (#RRGGBB)'),
})

export const updateCategorySchema = categorySchema.partial()

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
  includeProducts: z.coerce.boolean().optional().default(false),
})

/**
 * Skema validasi parameter route untuk kategori
 * Memastikan ID kategori valid
 */
export const categoryParamsSchema = z.object({
  id: z.string().uuid('ID kategori tidak valid'),
})
