/**
 * Return Processing Validation Schemas - TSK-23
 * Zod schemas for pengembalian (return) request validation
 * Following existing patterns from kasirSchema.ts with Indonesian field names
 */

import { z } from 'zod'

// Return Item Validation Schema with Smart Conditional Logic
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
    .min(0, 'Jumlah kembali tidak boleh negatif')
    .max(999, 'Jumlah kembali maksimal 999')
}).refine((data) => {
  // Smart validation: Check if item is lost/not returned
  const isLostItem = data.kondisiAkhir.toLowerCase().includes('hilang') || 
                     data.kondisiAkhir.toLowerCase().includes('tidak dikembalikan');
  
  if (isLostItem) {
    // Lost items must have jumlahKembali = 0
    return data.jumlahKembali === 0;
  } else {
    // Normal items must have jumlahKembali >= 1
    return data.jumlahKembali >= 1;
  }
}, {
  message: "Jumlah kembali tidak sesuai dengan kondisi barang. Barang hilang harus 0, barang normal minimal 1",
  path: ["jumlahKembali"]
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
      
      // Business Rule 1: Allow past dates (late returns with penalty)
      if (returnDate <= today) return true
      
      // Business Rule 2: Allow future dates up to 30 days for scheduling
      const maxFutureDate = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000))
      if (returnDate <= maxFutureDate) return true
      
      return false
    }, {
      message: 'Tanggal kembali tidak boleh lebih dari 30 hari ke depan. Untuk pengembalian terlambat, gunakan tanggal masa lalu.'
    })
    .refine((date) => {
      if (!date) return true
      
      const returnDate = new Date(date)
      const today = new Date()
      
      // Business Rule 3: Reasonable past date limit (prevent data entry errors)
      const minPastDate = new Date(today.getTime() - (365 * 24 * 60 * 60 * 1000)) // 1 year ago max
      return returnDate >= minPastDate
    }, {
      message: 'Tanggal kembali tidak boleh lebih dari 1 tahun yang lalu. Periksa kembali tanggal yang dimasukkan.'
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
  return actual >= new Date(expected.getTime() - (24 * 60 * 60 * 1000))
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
  message: 'Pilih kondisi barang yang valid'
})

// Business Rules Validation Schema
export const returnBusinessRulesSchema = z.object({
  allowPartialReturns: z.boolean().default(true),
  maxLateDays: z.number().min(1).max(365).default(30),
  penaltyPerDay: z.number().min(0).max(1000000).default(5000),
  requireConditionNotes: z.boolean().default(true),
  allowFutureReturnDate: z.boolean().default(true),
  maxFutureDays: z.number().min(1).max(365).default(30),
  maxPastDays: z.number().min(1).max(1095).default(365), // 3 years max for data integrity
  allowPastReturns: z.boolean().default(true)
})

// Contextual Validation Schemas for Different Return Scenarios
export const lateReturnDateSchema = z
  .string()
  .datetime('Format tanggal kembali tidak valid (ISO 8601)')
  .optional()
  .refine((date) => {
    if (!date) return true
    const returnDate = new Date(date)
    const today = new Date()
    
    // Only allow past dates for late returns
    return returnDate <= today
  }, {
    message: 'Untuk pengembalian terlambat, tanggal harus di masa lalu'
  })

export const scheduledReturnDateSchema = z
  .string()
  .datetime('Format tanggal kembali tidak valid (ISO 8601)')
  .optional()
  .refine((date) => {
    if (!date) return true
    const returnDate = new Date(date)
    const today = new Date()
    
    // Only allow future dates within scheduling window
    const maxFutureDate = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000))
    return returnDate > today && returnDate <= maxFutureDate
  }, {
    message: 'Untuk pengembalian terjadwal, tanggal harus di masa depan (maksimal 30 hari)'
  })

// Utility function to check if an item condition indicates lost/missing item
export const isLostItemCondition = (kondisiAkhir: string): boolean => {
  const normalized = kondisiAkhir.toLowerCase();
  return normalized.includes('hilang') || normalized.includes('tidak dikembalikan');
}

// Utility function to get expected jumlahKembali based on condition
export const getExpectedReturnQuantity = (kondisiAkhir: string): { min: number; max: number; message: string } => {
  if (isLostItemCondition(kondisiAkhir)) {
    return {
      min: 0,
      max: 0,
      message: "Barang hilang atau tidak dikembalikan harus memiliki jumlah kembali = 0"
    };
  }
  return {
    min: 1,
    max: 999,
    message: "Barang yang dikembalikan harus memiliki jumlah kembali minimal 1"
  };
}

// Context-aware schema creation function
export const createContextualReturnSchema = (context: 'late' | 'scheduled' | 'flexible' = 'flexible') => {
  const baseSchema = returnRequestSchema.omit({ tglKembali: true })
  
  switch (context) {
    case 'late':
      return baseSchema.extend({
        tglKembali: lateReturnDateSchema
      })
    case 'scheduled':
      return baseSchema.extend({
        tglKembali: scheduledReturnDateSchema
      })
    default:
      return returnRequestSchema // Uses the enhanced flexible validation
  }
}

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

// Service Layer Integration Interface
export interface ReturnValidationError {
  field: string
  message: string
  code: string
}

export interface ServiceValidationResult {
  isValid: boolean
  errors: ReturnValidationError[]
}

// Enhanced service integration function for business validation
export const validateReturnItemContext = (
  item: ReturnItemRequest,
  transactionItem: { 
    produk: { 
      name: string
      modalAwal?: number | string | null 
    }
  }
): ServiceValidationResult => {
  const errors: ReturnValidationError[] = []
  
  // Use existing smart logic from schema
  const isLost = isLostItemCondition(item.kondisiAkhir)
  
  if (isLost && item.jumlahKembali !== 0) {
    const modalAwalFormatted = transactionItem.produk.modalAwal 
      ? Number(transactionItem.produk.modalAwal).toLocaleString('id-ID')
      : '150,000'
    
    errors.push({
      field: 'jumlahKembali',
      message: `Barang hilang "${transactionItem.produk.name}" harus memiliki jumlah kembali = 0. Penalty akan dihitung menggunakan modal awal produk (Rp ${modalAwalFormatted})`,
      code: 'LOST_ITEM_INVALID_QUANTITY'
    })
  }
  
  if (!isLost && item.jumlahKembali < 1) {
    errors.push({
      field: 'jumlahKembali',
      message: `Barang normal "${transactionItem.produk.name}" harus memiliki jumlah kembali minimal 1. Untuk barang hilang, ubah kondisi ke "Hilang/tidak dikembalikan"`,
      code: 'NORMAL_ITEM_INVALID_QUANTITY'
    })
  }
  
  // Additional business rule: validate excessive return quantity
  if (item.jumlahKembali > 999) {
    errors.push({
      field: 'jumlahKembali',
      message: `Jumlah kembali untuk "${transactionItem.produk.name}" tidak boleh melebihi 999`,
      code: 'EXCESSIVE_RETURN_QUANTITY'
    })
  }
  
  return { 
    isValid: errors.length === 0, 
    errors 
  }
}

// Enhanced context message generation for error handling
export const getValidationContextMessage = (
  item: ReturnItemRequest,
  transactionItem?: { produk: { name: string; modalAwal?: number | string | null } }
): { message: string; suggestions: string[] } => {
  const isLost = isLostItemCondition(item.kondisiAkhir)
  const expected = getExpectedReturnQuantity(item.kondisiAkhir)
  
  if (isLost) {
    const modalAwal = transactionItem?.produk.modalAwal ? Number(transactionItem.produk.modalAwal) : null
    const penaltyInfo = modalAwal 
      ? `Rp ${modalAwal.toLocaleString('id-ID')} (modal awal)`
      : 'Rp 150,000 (standar)'
    
    return {
      message: `Kondisi: "${item.kondisiAkhir}" → Jumlah kembali harus ${expected.min}`,
      suggestions: [
        `Penalty akan dihitung sebesar ${penaltyInfo}`,
        'Pastikan kondisi barang mencantumkan "Hilang" atau "tidak dikembalikan"',
        'Jumlah kembali = 0 karena barang tidak dapat dikembalikan'
      ]
    }
  } else {
    return {
      message: `Kondisi: "${item.kondisiAkhir}" → Jumlah kembali minimal ${expected.min}`,
      suggestions: [
        'Untuk barang hilang/tidak dapat dikembalikan, ubah kondisi dan set jumlah = 0',
        'Untuk barang normal yang dikembalikan, jumlah minimal 1',
        'Periksa kembali kondisi dan jumlah barang yang dikembalikan'
      ]
    }
  }
}

// Business rule validation for lost item scenarios
export const isValidLostItemScenario = (kondisiAkhir: string, jumlahKembali: number): boolean => {
  const isLost = isLostItemCondition(kondisiAkhir)
  
  if (isLost) {
    return jumlahKembali === 0
  } else {
    return jumlahKembali >= 1
  }
}

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