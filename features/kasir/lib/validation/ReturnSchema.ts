/**
 * Unified Return Validation Schema - TSK-24 Phase 1 + RPK-51 Size-Aware
 * Single validation schema that handles all return scenarios through unified architecture
 * Enhanced with size-aware validation support for product size aggregation
 */

import { z } from 'zod'
import { parseKondisiAwal } from '../utils/kondisiAwalParser'
import { ConditionCategory } from '../../types'

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
  // ✅ FIX: HILANG items now require quantity > 0 (user input for penalty calculation)
  // Backend will set jumlahKembali = 0 when processing
  return {
    min: 1,
    max: 999,
    message: 'Jumlah harus minimal 1 (untuk HILANG: jumlah barang yang hilang)',
  }
}

// Unified condition schema - handles single condition within unified structure
export const unifiedConditionSchema = z
  .object({
    kondisiAkhir: z
      .string()
      .min(4, 'Kondisi akhir minimal 4 karakter')
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

    // ✅ ADDED: Manual pricing fields (RPK-PENALTY-001 fix)
    conditionCategory: z
      .enum([
        ConditionCategory.BAIK,
        ConditionCategory.KOTOR,
        ConditionCategory.RUSAK_RINGAN,
        ConditionCategory.RUSAK_BERAT,
        ConditionCategory.HILANG,
      ])
      .optional(),
    manualPrice: z.number().min(0, 'Manual price tidak boleh negatif').optional(),
    useManualPricing: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // ✅ FIX: Simplified validation - all categories require quantity >= 1
      // For HILANG: quantity represents number of lost items (for penalty calculation)
      // Backend will handle setting jumlahKembali = 0 for HILANG items
      return data.jumlahKembali >= 1
    },
    {
      message: 'Jumlah harus minimal 1',
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
        // ✅ FIX: Simplified validation - all conditions require quantity > 0
        // No special case for HILANG - backend handles the logic
        return conditions.every((c) => c.jumlahKembali > 0)
      },
      {
        message: 'Semua kondisi harus memiliki jumlah > 0',
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
      'Gunakan deskripsi yang jelas seperti "baik", "kotor", "rusak ringan"',
      'Untuk barang hilang gunakan "hilang" atau "tidak dikembalikan"',
      'Minimal 4 karakter untuk deskripsi yang memadai',
      'Contoh kondisi valid: "baik", "kotor", "rusak ringan", "rusak berat", "hilang"',
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

// RPK-51: Size-aware validation utilities
export const validateSizeAvailability = (
  transactionItems: Array<{
    id: string
    kondisiAwal?: string | null
    produk: {
      id: string
      name: string
    }
  }>,
): Array<{ itemId: string; field: string; message: string; code: string }> => {
  const errors: Array<{ itemId: string; field: string; message: string; code: string }> = []

  for (const item of transactionItems) {
    if (!item.kondisiAwal) continue

    const parsed = parseKondisiAwal(item.kondisiAwal)

    // Skip validation for legacy format items
    if (parsed.isLegacyFormat) {
      continue
    }

    // Validate size information exists for size-aware items
    if (!parsed.productSizeId) {
      errors.push({
        itemId: item.id,
        field: `items[${item.id}].productSizeId`,
        message: `Informasi ukuran tidak lengkap untuk produk ${item.produk.name}`,
        code: 'SIZE_INFO_MISSING',
      })
    }
  }

  return errors
}

// Enhanced error message generator for size-related validation errors
export const getSizeValidationErrorMessage = (error: {
  field: string
  message: string
  code: string
}): { message: string; suggestions: string[] } => {
  switch (error.code) {
    case 'SIZE_NOT_AVAILABLE':
      return {
        message: `Validasi ukuran gagal: ${error.message}`,
        suggestions: [
          'Periksa kembali ukuran yang tersedia untuk produk ini',
          'Pastikan ukuran yang dipilih tersedia dalam inventaris',
          'Gunakan ukuran yang sesuai dengan produk yang disewa',
        ],
      }
    case 'SIZE_INFO_MISSING':
      return {
        message: `Informasi ukuran tidak valid: ${error.message}`,
        suggestions: [
          'Refresh halaman dan coba kembali',
          'Pastikan data transaksi memiliki informasi ukuran yang lengkap',
          'Hubungi admin jika masalah berlanjut',
        ],
      }
    case 'SIZE_VALIDATION_ERROR':
      return {
        message: `Gagal memvalidasi ukuran: ${error.message}`,
        suggestions: [
          'Coba lagi beberapa saat',
          'Periksa koneksi internet Anda',
          'Hubungi admin jika masalah berlanjut',
        ],
      }
    default:
      return {
        message: error.message,
        suggestions: ['Periksa kembali data yang dimasukkan'],
      }
  }
}

// Export main validation schema for API usage
export { unifiedReturnRequestSchema as mainReturnSchema }
