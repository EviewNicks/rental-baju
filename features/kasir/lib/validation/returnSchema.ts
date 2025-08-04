/**
 * Return Processing Validation Schemas - TSK-23
 * Zod schemas for pengembalian (return) request validation
 * Following existing patterns from kasirSchema.ts with Indonesian field names
 */

import { z } from 'zod'

// Return Item Validation Schema
export const returnItemSchema = z.object({
  itemId: z.string().uuid('ID item transaksi tidak valid'),
  kondisiAkhir: z
    .string()
    .min(5, 'Kondisi akhir minimal 5 karakter')
    .max(500, 'Kondisi akhir maksimal 500 karakter')
    .regex(
      /^[a-zA-Z0-9\s.,;:()\-—–_!?'"\/]+$/,
      'Kondisi akhir hanya boleh mengandung huruf, angka, dan tanda baca'
    ),
  jumlahKembali: z
    .number()
    .int('Jumlah kembali harus berupa bilangan bulat')
    .min(1, 'Jumlah kembali minimal 1')
    .max(999, 'Jumlah kembali maksimal 999')
})

// Return Request Validation Schema
export const returnRequestSchema = z.object({
  items: z
    .array(returnItemSchema)
    .min(1, 'Minimal harus ada 1 item yang dikembalikan')
    .max(50, 'Maksimal 50 item dapat diproses sekaligus'),
  catatan: z
    .string()
    .max(1000, 'Catatan maksimal 1000 karakter')
    .optional()
    .or(z.literal('')),
  tglKembali: z
    .string()
    .datetime('Format tanggal kembali tidak valid (ISO 8601)')
    .optional()
    .refine((date) => {
      if (!date) return true
      const returnDate = new Date(date)
      const today = new Date()
      // Allow return date up to 24 hours in the future for scheduling
      const maxAllowedDate = new Date(today.getTime() + 24 * 60 * 60 * 1000)
      return returnDate <= maxAllowedDate
    }, {
      message: 'Tanggal kembali tidak boleh lebih dari 24 jam ke depan'
    })
}).refine((data) => {
  // Ensure no duplicate item IDs in return request
  const itemIds = data.items.map(item => item.itemId)
  const uniqueIds = new Set(itemIds)
  return uniqueIds.size === itemIds.length
}, {
  message: 'Tidak boleh ada duplikasi item dalam satu permintaan pengembalian',
  path: ['items']
})

// Return Eligibility Check Schema
export const returnEligibilitySchema = z.object({
  transaksiId: z.string().uuid('ID transaksi tidak valid')
})

// Penalty Calculation Schema
export const penaltyCalculationSchema = z.object({
  expectedDate: z
    .string()
    .datetime('Format tanggal selesai tidak valid (ISO 8601)'),
  actualDate: z
    .string()
    .datetime('Format tanggal kembali tidak valid (ISO 8601)'),
  dailyRate: z
    .number()
    .min(0, 'Tarif harian tidak boleh negatif')
    .max(1000000, 'Tarif harian maksimal Rp 1.000.000')
    .default(5000)
}).refine((data) => {
  const expected = new Date(data.expectedDate)
  const actual = new Date(data.actualDate)
  // Allow same day returns (no penalty)
  return actual >= expected.getTime() - (24 * 60 * 60 * 1000)
}, {
  message: 'Tanggal kembali tidak valid terhadap tanggal yang diharapkan',
  path: ['actualDate']
})

// Return Processing Response Schema
export const returnResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    transaksiId: z.string().uuid(),
    totalPenalty: z.number().min(0),
    processedItems: z.array(z.object({
      itemId: z.string().uuid(),
      penalty: z.number().min(0),
      kondisiAkhir: z.string(),
      statusKembali: z.enum(['lengkap'])
    })),
    updatedTransaction: z.object({
      id: z.string().uuid(),
      status: z.literal('dikembalikan'),
      tglKembali: z.string().datetime(),
      sisaBayar: z.number()
    })
  }),
  message: z.string()
})

// Condition Options Schema (for frontend dropdown/selection)
export const itemConditionSchema = z.enum([
  'Baik - tidak ada kerusakan',
  'Baik - sedikit kotor/kusut',
  'Cukup - ada noda ringan',
  'Cukup - ada kerusakan kecil',
  'Buruk - ada noda berat',
  'Buruk - ada kerusakan besar',
  'Hilang/tidak dikembalikan'
], {
  errorMap: () => ({ message: 'Pilih kondisi barang yang valid' })
})

// Business Rules Validation Schema
export const returnBusinessRulesSchema = z.object({
  allowPartialReturns: z.boolean().default(true),
  maxLateDays: z.number().min(1).max(365).default(30),
  penaltyPerDay: z.number().min(0).max(1000000).default(5000),
  requireConditionNotes: z.boolean().default(true),
  allowFutureReturnDate: z.boolean().default(false)
})

// Search/Query Schema for return processing
export const returnQuerySchema = z.object({
  transaksiKode: z
    .string()
    .min(1, 'Kode transaksi tidak boleh kosong')
    .max(50, 'Kode transaksi maksimal 50 karakter')
    .regex(
      /^[A-Z0-9\-]+$/,
      'Kode transaksi hanya boleh mengandung huruf kapital, angka, dan tanda hubung'
    )
})

// Common validation utilities for return processing
export const validateReturnAmount = (returned: number, total: number) => {
  const schema = z.object({
    returned: z.number().int().min(1),
    total: z.number().int().min(1)
  }).refine((data) => data.returned <= data.total, {
    message: 'Jumlah yang dikembalikan tidak boleh melebihi jumlah yang disewa'
  })
  
  return schema.parse({ returned, total })
}

export const validateReturnDate = (returnDate: Date, expectedDate: Date) => {
  const schema = z.object({
    returnDate: z.date(),
    expectedDate: z.date()
  }).refine((data) => {
    // Allow returns from rental start date onwards
    return data.returnDate >= new Date(data.expectedDate.getTime() - (365 * 24 * 60 * 60 * 1000))
  }, {
    message: 'Tanggal pengembalian tidak valid'
  })
  
  return schema.parse({ returnDate, expectedDate })
}

// Type exports for use in services and API routes
export type ReturnItemRequest = z.infer<typeof returnItemSchema>
export type ReturnRequest = z.infer<typeof returnRequestSchema>
export type ReturnEligibilityRequest = z.infer<typeof returnEligibilitySchema>
export type PenaltyCalculationRequest = z.infer<typeof penaltyCalculationSchema>
export type ReturnResponse = z.infer<typeof returnResponseSchema>
export type ItemCondition = z.infer<typeof itemConditionSchema>
export type ReturnBusinessRules = z.infer<typeof returnBusinessRulesSchema>
export type ReturnQueryParams = z.infer<typeof returnQuerySchema>

// Extended TransactionStatus to include 'dikembalikan'
export const extendedTransactionStatusSchema = z.enum([
  'active', 
  'selesai', 
  'terlambat', 
  'cancelled', 
  'dikembalikan'
])

export type ExtendedTransactionStatus = z.infer<typeof extendedTransactionStatusSchema>