/**
 * Validation Schemas for Kasir Feature - RPK-26
 * Zod schemas for request validation with Indonesian field names
 * Following existing patterns from manage-product feature
 */

import { z } from 'zod'

// Indonesian phone number validation
const indonesianPhoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,11}$/

// Penyewa (Customer) Validation Schemas
export const createPenyewaSchema = z.object({
  nama: z
    .string()
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter')
    .regex(/^[a-zA-Z\s.,'-]+$/, 'Nama hanya boleh mengandung huruf dan tanda baca'),
  telepon: z
    .string()
    .regex(indonesianPhoneRegex, 'Format nomor telepon tidak valid (contoh: 08123456789)')
    .transform((val) => {
      // Normalize phone number format
      if (val.startsWith('+62')) return val.replace('+62', '0')
      if (val.startsWith('62')) return val.replace('62', '0')
      return val
    }),
  alamat: z
    .string()
    .min(10, 'Alamat minimal 10 karakter')
    .max(500, 'Alamat maksimal 500 karakter'),
  email: z
    .string()
    .email('Format email tidak valid')
    .optional()
    .or(z.literal('')),
  nik: z
    .string()
    .optional()
    .refine((val) => {
      // Allow empty string or undefined (optional field)
      if (!val || val === '') return true
      // If provided, must be exactly 16 digits
      return /^\d{16}$/.test(val)
    }, {
      message: 'NIK harus 16 digit angka'
    })
    .or(z.literal('')),
  foto: z
    .string()
    .url('URL foto tidak valid')
    .optional()
    .or(z.literal('')),
  catatan: z
    .string()
    .max(1000, 'Catatan maksimal 1000 karakter')
    .optional()
    .or(z.literal(''))
})

export const updatePenyewaSchema = createPenyewaSchema.partial()

export const penyewaQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional()
})

// Transaksi (Transaction) Validation Schemas
export const createTransaksiItemSchema = z.object({
  produkId: z.string().uuid('ID produk tidak valid'),
  jumlah: z.number().int().min(1, 'Jumlah minimal 1').max(100, 'Jumlah maksimal 100'),
  durasi: z.number().int().min(1, 'Durasi minimal 1 hari').max(365, 'Durasi maksimal 365 hari'),
  kondisiAwal: z.string().max(500, 'Kondisi awal maksimal 500 karakter').optional()
})

export const createTransaksiSchema = z.object({
  penyewaId: z.string().uuid('ID penyewa tidak valid'),
  items: z
    .array(createTransaksiItemSchema)
    .min(1, 'Minimal harus ada 1 item')
    .max(50, 'Maksimal 50 item per transaksi'),
  tglMulai: z
    .string()
    .datetime('Format tanggal mulai tidak valid (ISO 8601)')
    .refine((date) => new Date(date) >= new Date(), {
      message: 'Tanggal mulai tidak boleh di masa lalu'
    }),
  tglSelesai: z
    .string()
    .datetime('Format tanggal selesai tidak valid (ISO 8601)')
    .optional(),
  metodeBayar: z.enum(['tunai', 'transfer', 'kartu']).default('tunai'),
  catatan: z.string().max(1000, 'Catatan maksimal 1000 karakter').optional()
}).refine((data) => {
  if (data.tglSelesai) {
    return new Date(data.tglSelesai) > new Date(data.tglMulai)
  }
  return true
}, {
  message: 'Tanggal selesai harus setelah tanggal mulai',
  path: ['tglSelesai']
})

export const updateTransaksiItemSchema = z.object({
  id: z.string().uuid('ID item tidak valid'),
  kondisiAkhir: z.string().max(500, 'Kondisi akhir maksimal 500 karakter').optional(),
  statusKembali: z.enum(['belum', 'sebagian', 'lengkap']).optional()
})

export const updateTransaksiSchema = z.object({
  status: z.enum(['active', 'selesai', 'terlambat', 'cancelled']).optional(),
  tglKembali: z.string().datetime('Format tanggal kembali tidak valid (ISO 8601)').optional(),
  catatan: z.string().max(1000, 'Catatan maksimal 1000 karakter').optional(),
  items: z.array(updateTransaksiItemSchema).optional()
})

export const transaksiQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.enum(['active', 'selesai', 'terlambat', 'cancelled']).optional(),
  search: z.string().optional(),
  penyewaId: z.string().uuid().optional(),
  dateStart: z.string().datetime().optional(),
  dateEnd: z.string().datetime().optional()
}).refine((data) => {
  if (data.dateStart && data.dateEnd) {
    return new Date(data.dateEnd) >= new Date(data.dateStart)
  }
  return true
}, {
  message: 'Tanggal akhir harus setelah atau sama dengan tanggal mulai',
  path: ['dateEnd']
})

// Payment Validation Schema
export const createPembayaranSchema = z.object({
  transaksiId: z.string().uuid('ID transaksi tidak valid'),
  jumlah: z.number().positive('Jumlah pembayaran harus lebih dari 0'),
  metode: z.enum(['tunai', 'transfer', 'kartu']),
  referensi: z.string().max(100, 'Referensi maksimal 100 karakter').optional(),
  catatan: z.string().max(500, 'Catatan maksimal 500 karakter').optional()
})

// Product Availability Query Schema
export const productAvailabilityQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  available: z.coerce.boolean().default(true),
  size: z.union([z.string(), z.array(z.string())]).optional(),
  colorId: z.union([z.string(), z.array(z.string())]).optional()
}).transform((data) => ({
  ...data,
  size: Array.isArray(data.size) ? data.size : data.size ? [data.size] : undefined,
  colorId: Array.isArray(data.colorId) ? data.colorId : data.colorId ? [data.colorId] : undefined
}))

// Transaction Code Generation Schema
export const generateTransactionCodeSchema = z.object({
  date: z.date().default(() => new Date())
})

// Common validation utilities
export const validateUUID = (value: string, fieldName: string) => {
  const uuidSchema = z.string().uuid(`${fieldName} tidak valid`)
  return uuidSchema.parse(value)
}

export const validatePagination = (page?: string, limit?: string) => {
  const paginationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10)
  })
  
  return paginationSchema.parse({
    page: page || '1',
    limit: limit || '10'
  })
}

// Type exports for use in services and API routes
export type CreatePenyewaRequest = z.infer<typeof createPenyewaSchema>
export type UpdatePenyewaRequest = z.infer<typeof updatePenyewaSchema>
export type PenyewaQueryParams = z.infer<typeof penyewaQuerySchema>

export type CreateTransaksiRequest = z.infer<typeof createTransaksiSchema>
export type UpdateTransaksiRequest = z.infer<typeof updateTransaksiSchema>
export type TransaksiQueryParams = z.infer<typeof transaksiQuerySchema>

export type CreatePembayaranRequest = z.infer<typeof createPembayaranSchema>
export type ProductAvailabilityQueryParams = z.infer<typeof productAvailabilityQuerySchema>