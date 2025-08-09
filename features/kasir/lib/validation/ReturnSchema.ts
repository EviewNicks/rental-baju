/**
 * Unified Return Validation Schema - TSK-24 Phase 1
 * Single validation schema that handles all return scenarios through unified architecture
 * Replaces dual-mode validation with simplified, consistent approach
 */

import { z } from 'zod'

// Utility functions for unified return validation
export const isLostItemCondition = (kondisiAkhir: string): boolean => {
  const normalized = kondisiAkhir.toLowerCase()
  return (
    normalized.includes('hilang') ||
    normalized.includes('tidak dikembalikan') ||
    normalized.includes('lost')
  )
}

export const getExpectedReturnQuantity = (
  kondisiAkhir: string,
): { min: number; max: number; message: string } => {
  if (isLostItemCondition(kondisiAkhir)) {
    return {
      min: 0,
      max: 0,
      message: 'Barang hilang atau tidak dikembalikan harus memiliki jumlah kembali = 0',
    }
  }
  return {
    min: 1,
    max: 999,
    message: 'Barang yang dikembalikan harus memiliki jumlah kembali minimal 1',
  }
}

// Unified condition schema - handles single condition within unified structure
export const unifiedConditionSchema = z
  .object({
    kondisiAkhir: z
      .string()
      .min(5, 'Kondisi akhir minimal 5 karakter untuk deskripsi yang jelas')
      .max(500, 'Kondisi akhir maksimal 500 karakter')
      .regex(
        /^[a-zA-Z0-9\s.,;:()\-—–_!?'"\/]+$/,
        'Kondisi akhir hanya boleh mengandung huruf, angka, dan tanda baca',
      ),
    jumlahKembali: z
      .number()
      .int('Jumlah kembali harus berupa bilangan bulat')
      .min(0, 'Jumlah kembali tidak boleh negatif')
      .max(999, 'Jumlah kembali maksimal 999'),
    modalAwal: z.number().positive('Modal awal harus bernilai positif').optional(), // Optional, will use product modalAwal if not provided
  })
  .refine(
    (data) => {
      // Unified validation logic - works for all scenarios
      const isLostItem = isLostItemCondition(data.kondisiAkhir)

      if (isLostItem) {
        return data.jumlahKembali === 0
      } else {
        return data.jumlahKembali >= 1
      }
    },
    {
      message:
        'Jumlah kembali tidak sesuai dengan kondisi barang. Barang hilang harus 0, barang yang dikembalikan minimal 1',
      path: ['jumlahKembali'],
    },
  )

// Unified return item schema - treats all items as multi-condition (even single conditions)
export const unifiedReturnItemSchema = z.object({
  itemId: z.string().uuid('ID item transaksi tidak valid'),
  conditions: z
    .array(unifiedConditionSchema)
    .min(1, 'Setiap item harus memiliki minimal 1 kondisi')
    .max(10, 'Maksimal 10 kondisi per item untuk menghindari kompleksitas berlebihan')
    .refine(
      (conditions) => {
        // Ensure no duplicate condition descriptions within same item
        const descriptions = conditions.map((c) => c.kondisiAkhir.toLowerCase().trim())
        const uniqueDescriptions = new Set(descriptions)
        return descriptions.length === uniqueDescriptions.size
      },
      {
        message: 'Kondisi yang sama tidak boleh diduplikasi dalam satu item',
      },
    )
    .refine(
      (conditions) => {
        // Validate total quantity logic for multi-condition scenarios
        const totalReturned = conditions.reduce((sum, c) => sum + c.jumlahKembali, 0)
        const hasLostItems = conditions.some((c) => isLostItemCondition(c.kondisiAkhir))
        const hasReturnedItems = conditions.some((c) => !isLostItemCondition(c.kondisiAkhir))

        // Allow mixed scenarios (some lost, some returned) but validate quantities
        if (hasLostItems && hasReturnedItems) {
          return conditions.every((c) => {
            const isLost = isLostItemCondition(c.kondisiAkhir)
            return isLost ? c.jumlahKembali === 0 : c.jumlahKembali > 0
          })
        }

        return true
      },
      {
        message:
          'Untuk skenario mixed (sebagian hilang, sebagian dikembalikan): barang hilang harus jumlah = 0, barang yang dikembalikan harus jumlah > 0',
      },
    ),
})

// Unified return request schema - single schema for all scenarios
export const unifiedReturnRequestSchema = z.object({
  items: z
    .array(unifiedReturnItemSchema)
    .min(1, 'Minimal harus ada 1 item yang dikembalikan')
    .max(50, 'Maksimal 50 item dapat diproses sekaligus untuk performa optimal'),
  catatan: z.string().max(1000, 'Catatan maksimal 1000 karakter').optional().or(z.literal('')),
  tglKembali: z
    .string()
    .datetime('Format tanggal kembali tidak valid (ISO 8601)')
    .optional()
    .refine(
      (date) => {
        if (!date) return true

        const returnDate = new Date(date)
        const today = new Date()

        // Allow past dates (late returns) and reasonable future dates (scheduled returns)
        if (returnDate <= today) return true

        const maxFutureDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
        if (returnDate <= maxFutureDate) return true

        return false
      },
      {
        message:
          'Tanggal kembali tidak boleh lebih dari 30 hari ke depan. Untuk pengembalian terlambat, gunakan tanggal masa lalu.',
      },
    )
    .refine(
      (date) => {
        if (!date) return true

        const returnDate = new Date(date)
        const today = new Date()

        // Don't allow dates too far in the past (data integrity)
        const minPastDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)
        return returnDate >= minPastDate
      },
      {
        message:
          'Tanggal kembali tidak boleh lebih dari 1 tahun yang lalu. Periksa kembali tanggal yang dimasukkan.',
      },
    ),
})

// Type definitions for unified validation
export type UnifiedReturnCondition = z.infer<typeof unifiedConditionSchema>
export type UnifiedReturnItem = z.infer<typeof unifiedReturnItemSchema>
export type UnifiedReturnRequest = z.infer<typeof unifiedReturnRequestSchema>

// Legacy compatibility types (for backward compatibility during migration)
export type ReturnItemRequest = {
  itemId: string
  kondisiAkhir: string
  jumlahKembali: number
}

export type ReturnRequest = {
  items: ReturnItemRequest[]
  catatan?: string
  tglKembali?: string
}

// Utility function to convert legacy format to unified format
export const convertLegacyToUnified = (legacyRequest: ReturnRequest): UnifiedReturnRequest => {
  return {
    items: legacyRequest.items.map((item) => ({
      itemId: item.itemId,
      conditions: [
        {
          kondisiAkhir: item.kondisiAkhir,
          jumlahKembali: item.jumlahKembali,
        },
      ],
    })),
    catatan: legacyRequest.catatan,
    tglKembali: legacyRequest.tglKembali,
  }
}

// Utility function to convert unified format to legacy format (for backward compatibility)
export const convertUnifiedToLegacy = (unifiedRequest: UnifiedReturnRequest): ReturnRequest => {
  return {
    items: unifiedRequest.items.map((item) => {
      // For legacy compatibility, use first condition only
      const firstCondition = item.conditions[0]
      return {
        itemId: item.itemId,
        kondisiAkhir: firstCondition.kondisiAkhir,
        jumlahKembali: firstCondition.jumlahKembali,
      }
    }),
    catatan: unifiedRequest.catatan,
    tglKembali: unifiedRequest.tglKembali,
  }
}

// Validation context for enhanced error messages
export interface UnifiedValidationError {
  field: string
  message: string
  code: string
  suggestions?: string[]
}

export interface UnifiedValidationResult {
  isValid: boolean
  errors: UnifiedValidationError[]
  processedItemCount: number
  totalConditionCount: number
}

// Enhanced validation function with business rule checks
export const validateUnifiedReturnRequest = (
  request: UnifiedReturnRequest,
  transactionItems?: Array<{
    id: string
    jumlahDiambil: number
    produk: { name: string; modalAwal?: number }
  }>,
): UnifiedValidationResult => {
  const errors: UnifiedValidationError[] = []
  let processedItemCount = 0
  let totalConditionCount = 0

  try {
    // Schema validation
    unifiedReturnRequestSchema.parse(request)
  } catch (validationError) {
    if (validationError instanceof z.ZodError) {
      validationError.issues.forEach((issue) => {
        errors.push({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
          suggestions: getValidationSuggestions(issue),
        })
      })
    }
  }

  // Business rule validation if transaction items are provided
  if (transactionItems) {
    request.items.forEach((item, itemIndex) => {
      const transactionItem = transactionItems.find((ti) => ti.id === item.itemId)

      if (!transactionItem) {
        errors.push({
          field: `items[${itemIndex}].itemId`,
          message: `Item dengan ID ${item.itemId} tidak ditemukan dalam transaksi`,
          code: 'ITEM_NOT_FOUND',
          suggestions: [
            'Periksa kembali ID item',
            'Pastikan item merupakan bagian dari transaksi ini',
          ],
        })
        return
      }

      const totalReturnQuantity = item.conditions.reduce((sum, c) => sum + c.jumlahKembali, 0)

      if (totalReturnQuantity > transactionItem.jumlahDiambil) {
        errors.push({
          field: `items[${itemIndex}].conditions`,
          message: `Total jumlah kembali (${totalReturnQuantity}) melebihi jumlah yang diambil (${transactionItem.jumlahDiambil})`,
          code: 'EXCESS_TOTAL_QUANTITY',
          suggestions: [
            'Kurangi jumlah kembali pada beberapa kondisi',
            'Tandai sebagian barang sebagai hilang (jumlahKembali = 0)',
            'Periksa kembali pembagian quantity antar kondisi',
          ],
        })
      }

      processedItemCount++
      totalConditionCount += item.conditions.length
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    processedItemCount,
    totalConditionCount,
  }
}

// Helper function to provide validation suggestions
const getValidationSuggestions = (issue: z.ZodIssue): string[] => {
  const suggestions: string[] = []

  if (issue.path.includes('kondisiAkhir')) {
    suggestions.push(
      'Gunakan deskripsi yang jelas seperti "Baik - dikembalikan tepat waktu"',
      'Untuk barang hilang gunakan "Hilang/tidak dikembalikan"',
      'Minimal 5 karakter untuk deskripsi yang memadai',
    )
  }

  if (issue.path.includes('jumlahKembali')) {
    suggestions.push(
      'Barang yang dikembalikan harus jumlah ≥ 1',
      'Barang hilang harus jumlah = 0',
      'Pastikan total tidak melebihi jumlah yang diambil',
    )
  }

  if (issue.path.includes('tglKembali')) {
    suggestions.push(
      'Format tanggal: ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)',
      'Untuk pengembalian terlambat gunakan tanggal masa lalu',
      'Maksimal 30 hari ke depan untuk pengembalian terjadwal',
    )
  }

  return suggestions
}

// Export main validation schema for API usage
export { unifiedReturnRequestSchema as mainReturnSchema }
