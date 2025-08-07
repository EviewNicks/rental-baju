/**
 * Multi-Condition Return Validation Schemas - TSK-24
 * Enhanced validation for multi-condition return processing
 * Building on existing returnSchema.ts with backward compatibility
 */

import { z } from 'zod'

// Base utility functions for return validation
export const isLostItemCondition = (kondisiAkhir: string): boolean => {
  const normalized = kondisiAkhir.toLowerCase();
  return normalized.includes('hilang') || normalized.includes('tidak dikembalikan');
}

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

// Return Item Schema (original)
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
  const isLostItem = data.kondisiAkhir.toLowerCase().includes('hilang') || 
                     data.kondisiAkhir.toLowerCase().includes('tidak dikembalikan');
  
  if (isLostItem) {
    return data.jumlahKembali === 0;
  } else {
    return data.jumlahKembali >= 1;
  }
}, {
  message: "Jumlah kembali tidak sesuai dengan kondisi barang. Barang hilang harus 0, barang normal minimal 1",
  path: ["jumlahKembali"]
})

// Return Request Schema
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
      
      if (returnDate <= today) return true
      
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
      
      const minPastDate = new Date(today.getTime() - (365 * 24 * 60 * 60 * 1000))
      return returnDate >= minPastDate
    }, {
      message: 'Tanggal kembali tidak boleh lebih dari 1 tahun yang lalu. Periksa kembali tanggal yang dimasukkan.'
    })
}).refine((data) => {
  const itemIds = data.items.map(item => item.itemId)
  const uniqueIds = new Set(itemIds)
  return uniqueIds.size === itemIds.length
}, {
  message: 'Tidak boleh ada duplikasi item dalam satu permintaan pengembalian',
  path: ['items']
})

// Extended TransactionStatus to include 'dikembalikan'
export const extendedTransactionStatusSchema = z.enum([
  'active', 
  'selesai', 
  'terlambat', 
  'cancelled', 
  'dikembalikan'
])

// Export aliases for backward compatibility
export const returnItemRequestSchema = returnItemSchema
export type ReturnItemRequest = z.infer<typeof returnItemSchema>
export type ReturnRequest = z.infer<typeof returnRequestSchema>
export type ExtendedTransactionStatus = z.infer<typeof extendedTransactionStatusSchema>

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

// Base condition split schema
export const conditionSplitSchema = z.object({
  kondisiAkhir: z
    .string()
    .min(5, 'Kondisi akhir minimal 5 karakter')
    .max(500, 'Kondisi akhir maksimal 500 karakter'),
  jumlahKembali: z
    .number()
    .int()
    .min(0, 'Jumlah kembali tidak boleh negatif')
    .max(999, 'Jumlah kembali maksimal 999'),
  isLostItem: z.boolean().optional(),
  modalAwal: z.number().positive().optional(),
}).refine(
  (data) => {
    const expected = getExpectedReturnQuantity(data.kondisiAkhir)
    
    return data.jumlahKembali >= expected.min && data.jumlahKembali <= expected.max
  },
  {
    message: 'Jumlah kembali tidak sesuai dengan kondisi barang',
    path: ['jumlahKembali'],
  }
)

// Multi-condition return item schema
export const multiConditionReturnItemSchema = z
  .object({
    itemId: z.string().uuid('ID item harus berupa UUID yang valid'),
    
    // Single-condition mode (backward compatibility)
    kondisiAkhir: z.string().optional(),
    jumlahKembali: z.number().int().min(0).optional(),
    
    // Multi-condition mode (enhanced)
    conditions: z.array(conditionSplitSchema).optional(),
  })
  .refine(
    (data) => {
      // Must have either single condition OR multi-condition data, not both
      const hasSingle = data.kondisiAkhir && data.jumlahKembali !== undefined
      const hasMulti = data.conditions && data.conditions.length > 0
      
      return (hasSingle && !hasMulti) || (!hasSingle && hasMulti)
    },
    {
      message: 'Item must have either single condition OR multiple conditions, not both',
      path: ['conditions'],
    }
  )
  .refine(
    (data) => {
      // If multi-condition mode, validate total quantities make sense
      if (data.conditions && data.conditions.length > 0) {
        const totalQuantity = data.conditions.reduce((sum, c) => sum + c.jumlahKembali, 0)
        return totalQuantity > 0
      }
      return true
    },
    {
      message: 'Total jumlah kembali harus lebih dari 0 untuk multi-condition',
      path: ['conditions'],
    }
  )

// Enhanced return request schema with multi-condition support
export const enhancedReturnRequestSchema = z.object({
  items: z
    .array(multiConditionReturnItemSchema)
    .min(1, 'Minimal satu item harus diisi')
    .max(50, 'Maksimal 50 item per transaksi'),
  catatan: z.string().max(1000, 'Catatan maksimal 1000 karakter').optional(),
  tglKembali: z
    .string()
    .datetime()
    .optional()
    .refine(
      (dateStr) => {
        if (!dateStr) return true
        const date = new Date(dateStr)
        const oneYearAgo = new Date()
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
        
        return date >= oneYearAgo && date <= thirtyDaysFromNow
      },
      {
        message: 'Tanggal kembali harus dalam rentang 1 tahun lalu hingga 30 hari ke depan'
      }
    )
})

// Validation context types for smart validation
export type ValidationContext = 'late' | 'scheduled' | 'flexible' | 'multi-condition'

// Contextual validation schemas
export function createEnhancedContextualReturnSchema(context: ValidationContext) {
  const baseSchema = enhancedReturnRequestSchema

  switch (context) {
    case 'late':
      // Late return: stricter validation on conditions and penalties
      return baseSchema.extend({
        items: z.array(
          multiConditionReturnItemSchema.refine(
            (item) => {
              // For late returns, ensure all conditions are properly documented
              if (item.conditions) {
                return item.conditions.every(c => c.kondisiAkhir.length >= 10)
              }
              return item.kondisiAkhir && item.kondisiAkhir.length >= 10
            },
            {
              message: 'Kondisi akhir harus lebih detail untuk pengembalian terlambat',
              path: ['kondisiAkhir']
            }
          )
        )
      })

    case 'scheduled':
      // Scheduled return: more flexible validation
      return baseSchema

    case 'multi-condition':
      // Force multi-condition validation
      return baseSchema.extend({
        items: z.array(
          multiConditionReturnItemSchema.refine(
            (item) => item.conditions && item.conditions.length > 1,
            {
              message: 'Multi-condition mode requires at least 2 conditions per item',
              path: ['conditions']
            }
          )
        )
      })

    case 'flexible':
    default:
      return baseSchema
  }
}

// Smart processing mode detection
export function detectProcessingMode(request: z.infer<typeof enhancedReturnRequestSchema>) {
  let hasSimple = 0
  let hasComplex = 0

  for (const item of request.items) {
    if (item.conditions && item.conditions.length > 1) {
      hasComplex++
    } else {
      hasSimple++
    }
  }

  if (hasComplex === 0) return 'single-condition'
  if (hasSimple === 0) return 'multi-condition'
  return 'mixed'
}

// Business rules validation
export function validateMultiConditionBusinessRules(
  request: z.infer<typeof enhancedReturnRequestSchema>
): { isValid: boolean; errors: Array<{ field: string; message: string; code: string }> } {
  const errors: Array<{ field: string; message: string; code: string }> = []

  request.items.forEach((item, itemIndex) => {
    if (!item.conditions || item.conditions.length === 0) return

    // Validate condition consistency
    const lostConditions = item.conditions.filter(c => isLostItemCondition(c.kondisiAkhir))
    const returnedConditions = item.conditions.filter(c => !isLostItemCondition(c.kondisiAkhir))

    // Business rule: Lost items should have jumlahKembali = 0
    lostConditions.forEach((condition, condIndex) => {
      if (condition.jumlahKembali > 0) {
        errors.push({
          field: `items[${itemIndex}].conditions[${condIndex}].jumlahKembali`,
          message: 'Barang yang hilang harus memiliki jumlah kembali = 0',
          code: 'LOST_ITEM_INVALID_QUANTITY'
        })
      }
    })

    // Business rule: Returned items should have jumlahKembali > 0
    returnedConditions.forEach((condition, condIndex) => {
      if (condition.jumlahKembali === 0) {
        errors.push({
          field: `items[${itemIndex}].conditions[${condIndex}].jumlahKembali`,
          message: 'Barang yang dikembalikan harus memiliki jumlah kembali > 0',
          code: 'RETURNED_ITEM_INVALID_QUANTITY'
        })
      }
    })

    // Business rule: Validate modal awal consistency
    const modalAwalValues = item.conditions
      .filter(c => c.modalAwal !== undefined)
      .map(c => c.modalAwal)

    if (modalAwalValues.length > 1) {
      const uniqueValues = [...new Set(modalAwalValues)]
      if (uniqueValues.length > 1) {
        errors.push({
          field: `items[${itemIndex}].conditions`,
          message: 'Modal awal harus konsisten untuk semua kondisi dalam satu item',
          code: 'INCONSISTENT_MODAL_AWAL'
        })
      }
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Convert between single-condition and multi-condition formats
export function convertSingleToMultiCondition(
  singleConditionItem: z.infer<typeof returnItemRequestSchema>
): z.infer<typeof multiConditionReturnItemSchema> {
  return {
    itemId: singleConditionItem.itemId,
    conditions: [{
      kondisiAkhir: singleConditionItem.kondisiAkhir,
      jumlahKembali: singleConditionItem.jumlahKembali,
    }]
  }
}

export function convertMultiToSingleCondition(
  multiConditionItem: z.infer<typeof multiConditionReturnItemSchema>
): z.infer<typeof returnItemRequestSchema> | null {
  // Can only convert if there's exactly one condition
  if (multiConditionItem.conditions && multiConditionItem.conditions.length === 1) {
    const condition = multiConditionItem.conditions[0]
    return {
      itemId: multiConditionItem.itemId,
      kondisiAkhir: condition.kondisiAkhir,
      jumlahKembali: condition.jumlahKembali,
    }
  }

  // Fallback to single-condition format if available
  if (multiConditionItem.kondisiAkhir && multiConditionItem.jumlahKembali !== undefined) {
    return {
      itemId: multiConditionItem.itemId,
      kondisiAkhir: multiConditionItem.kondisiAkhir,
      jumlahKembali: multiConditionItem.jumlahKembali,
    }
  }

  return null
}

// Enhanced validation error messages
export function getEnhancedValidationMessage(
  error: z.ZodIssue,
  context: ValidationContext = 'flexible'
): { message: string; suggestions: string[] } {
  const suggestions: string[] = []
  let message = error.message

  if (error.path.includes('conditions')) {
    if (context === 'multi-condition') {
      message = 'Multi-condition validation failed'
      suggestions.push('Pastikan setiap item memiliki minimal 2 kondisi')
      suggestions.push('Periksa jumlah kembali untuk setiap kondisi')
      suggestions.push('Validasi konsistensi kondisi akhir')
    } else {
      message = 'Format kondisi tidak valid'
      suggestions.push('Gunakan format single-condition ATAU multi-condition, tidak keduanya')
      suggestions.push('Untuk multi-condition: gunakan array conditions[]')
      suggestions.push('Untuk single-condition: gunakan kondisiAkhir + jumlahKembali')
    }
  }

  if (error.path.includes('jumlahKembali')) {
    if (error.message.includes('kondisi barang')) {
      suggestions.push('Barang hilang: set jumlahKembali = 0')
      suggestions.push('Barang dikembalikan: set jumlahKembali ≥ 1')
      suggestions.push('Periksa kesesuaian kondisi dengan jumlah kembali')
    }
  }

  return { message, suggestions }
}

// Export types for use in other modules
export type ConditionSplit = z.infer<typeof conditionSplitSchema>
export type MultiConditionReturnItem = z.infer<typeof multiConditionReturnItemSchema>
export type EnhancedReturnRequest = z.infer<typeof enhancedReturnRequestSchema>