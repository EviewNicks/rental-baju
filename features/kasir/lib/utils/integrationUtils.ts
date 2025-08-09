/**
 * Integration Utilities for TSK-24 Multi-Condition Return System
 * Production-ready utilities for data validation, transformation, and monitoring
 */

import type { 
  EnhancedItemCondition, 
  MultiConditionPenaltyResult,
  ProcessingMode,
  ReturnProcessingResult 
} from '../../types/multiConditionReturn'
import type { TransaksiDetail } from '../../types'

// ====================
// DATA VALIDATION
// ====================

/**
 * Validate multi-condition return data before processing
 */
export function validateReturnData(
  transaction: TransaksiDetail,
  itemConditions: Record<string, EnhancedItemCondition>
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  // Basic transaction validation
  if (!transaction || !transaction.id) {
    errors.push('Transaksi tidak valid atau tidak ditemukan')
    return { isValid: false, errors, warnings }
  }

  if (!transaction.items || transaction.items.length === 0) {
    errors.push('Transaksi tidak memiliki item yang dapat dikembalikan')
    return { isValid: false, errors, warnings }
  }

  // Item conditions validation
  const returnableItems = transaction.items.filter(
    item => item.jumlahDiambil > 0 && item.statusKembali !== 'lengkap'
  )

  if (returnableItems.length === 0) {
    errors.push('Tidak ada item yang dapat dikembalikan')
    return { isValid: false, errors, warnings }
  }

  // Validate each item condition
  for (const item of returnableItems) {
    const condition = itemConditions[item.id]
    
    if (!condition) {
      errors.push(`Kondisi untuk item ${item.produk.name} belum ditentukan`)
      continue
    }

    // Validate condition structure
    if (!condition.conditions || condition.conditions.length === 0) {
      errors.push(`Kondisi untuk item ${item.produk.name} tidak valid`)
      continue
    }

    // Validate quantities
    const totalReturned = condition.conditions.reduce((sum, c) => sum + (c.jumlahKembali || 0), 0)
    
    if (totalReturned > item.jumlahDiambil) {
      errors.push(`Item ${item.produk.name}: Jumlah kembali (${totalReturned}) melebihi jumlah diambil (${item.jumlahDiambil})`)
    }

    if (totalReturned === 0) {
      errors.push(`Item ${item.produk.name}: Minimal harus mengembalikan 1 unit atau tandai sebagai hilang`)
    }

    // Check for empty conditions
    const hasEmptyConditions = condition.conditions.some(c => !c.kondisiAkhir || c.jumlahKembali === undefined)
    if (hasEmptyConditions) {
      errors.push(`Item ${item.produk.name}: Semua kondisi harus diisi dengan lengkap`)
    }

    // Performance warning for too many conditions
    if (condition.conditions.length > 5) {
      warnings.push(`Item ${item.produk.name}: Terlalu banyak kondisi berbeda, pertimbangkan untuk menggabungkan`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// ====================
// DATA TRANSFORMATION
// ====================

/**
 * Transform enhanced conditions to API request format
 */
export function transformToApiRequest(
  transaction: TransaksiDetail,
  itemConditions: Record<string, EnhancedItemCondition>,
  notes?: string
) {
  const items = Object.entries(itemConditions)
    .filter(([itemId]) => {
      // Only include items that belong to this transaction
      return transaction.items?.some(item => item.id === itemId)
    })
    .map(([itemId, condition]) => {
      if (condition.mode === 'multi' && condition.conditions.length > 1) {
        // Multi-condition format
        return {
          itemId,
          conditions: condition.conditions.map(c => ({
            kondisiAkhir: c.kondisiAkhir,
            jumlahKembali: c.jumlahKembali,
            modalAwal: c.modalAwal
          }))
        }
      } else {
        // Single-condition format (backward compatible)
        const singleCondition = condition.conditions[0]
        return {
          itemId,
          kondisiAkhir: singleCondition.kondisiAkhir,
          jumlahKembali: singleCondition.jumlahKembali
        }
      }
    })

  return {
    items,
    tglKembali: new Date().toISOString(),
    catatan: notes
  }
}

/**
 * Determine processing mode based on conditions
 */
export function determineProcessingMode(
  itemConditions: Record<string, EnhancedItemCondition>
): ProcessingMode {
  if (Object.keys(itemConditions).length === 0) {
    return 'single-condition'
  }

  let hasSimple = 0
  let hasMulti = 0

  for (const condition of Object.values(itemConditions)) {
    if (condition.mode === 'multi' && condition.conditions.length > 1) {
      hasMulti++
    } else {
      hasSimple++
    }
  }

  if (hasMulti === 0) return 'single-condition'
  if (hasSimple === 0) return 'multi-condition'
  return 'mixed'
}

// ====================
// MONITORING & LOGGING
// ====================

/**
 * Log multi-condition return processing for debugging
 */
export function logReturnProcessing(
  transaction: TransaksiDetail,
  itemConditions: Record<string, EnhancedItemCondition>,
  processingMode: ProcessingMode,
  result?: ReturnProcessingResult | null,
  error?: Error | null
) {
  const logData = {
    timestamp: new Date().toISOString(),
    transactionId: transaction.id,
    transactionCode: transaction.kode,
    processingMode,
    itemCount: Object.keys(itemConditions).length,
    conditionCount: Object.values(itemConditions).reduce(
      (sum, condition) => sum + condition.conditions.length, 
      0
    ),
    success: !!result && !error,
    error: error?.message,
    processingResult: result ? {
      success: result.success,
      processingMode: result.processingMode,
      itemsProcessed: result.itemsProcessed || 0
    } : null
  }

  if (error) {
    console.error('🔴 Multi-Condition Return Failed:', logData)
  } else if (result) {
    console.log('✅ Multi-Condition Return Successful:', logData)
  } else {
    console.log('🎯 Multi-Condition Return Processing:', logData)
  }

  return logData
}

/**
 * Track penalty calculation performance
 */
export function trackPenaltyCalculation(
  startTime: number,
  endTime: number,
  penalty: MultiConditionPenaltyResult | null,
  error?: Error | null
) {
  const duration = endTime - startTime
  const logData = {
    timestamp: new Date().toISOString(),
    duration: `${duration}ms`,
    success: !!penalty && !error,
    penaltyAmount: penalty?.totalPenalty || 0,
    itemCount: penalty?.breakdown?.length || 0,
    conditionCount: penalty?.summary?.totalConditions || 0,
    processingMode: penalty?.calculationMetadata?.processingMode,
    error: error?.message
  }

  if (duration > 300) {
    console.warn('⚠️ Penalty Calculation Slow:', logData)
  } else if (error) {
    console.error('🔴 Penalty Calculation Failed:', logData)
  } else {
    console.log('💰 Penalty Calculation Completed:', logData)
  }

  return logData
}

// ====================
// ERROR HANDLING
// ====================

/**
 * Enhanced error handling for multi-condition operations
 */
export class MultiConditionError extends Error {
  public readonly code: string
  public readonly details?: Record<string, unknown>
  public readonly timestamp: string

  constructor(
    message: string, 
    code: string = 'MULTI_CONDITION_ERROR',
    details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'MultiConditionError'
    this.code = code
    this.details = details
    this.timestamp = new Date().toISOString()
  }

  static validation(message: string, validationErrors: string[]) {
    return new MultiConditionError(
      message,
      'VALIDATION_ERROR',
      { validationErrors }
    )
  }

  static apiError(message: string, apiResponse?: unknown) {
    return new MultiConditionError(
      message,
      'API_ERROR',
      { apiResponse }
    )
  }

  static processingError(message: string, processingDetails?: Record<string, unknown>) {
    return new MultiConditionError(
      message,
      'PROCESSING_ERROR',
      processingDetails
    )
  }
}

/**
 * Graceful error recovery for multi-condition operations
 */
export function handleMultiConditionError(
  error: Error | MultiConditionError,
  context: {
    transactionId: string
    operation: string
    itemCount?: number
  }
): {
  userMessage: string
  technicalMessage: string
  shouldRetry: boolean
  fallbackAction?: string
} {
  const baseContext = {
    ...context,
    timestamp: new Date().toISOString(),
    errorType: error.name
  }

  // Handle specific error types
  if (error instanceof MultiConditionError) {
    console.error('🔴 Multi-Condition Error:', { ...baseContext, ...error.details })
    
    switch (error.code) {
      case 'VALIDATION_ERROR':
        return {
          userMessage: 'Data pengembalian tidak valid. Periksa kembali kondisi barang.',
          technicalMessage: error.message,
          shouldRetry: false,
          fallbackAction: 'redirect_to_conditions_step'
        }
      
      case 'API_ERROR':
        return {
          userMessage: 'Terjadi kesalahan pada server. Coba lagi dalam beberapa saat.',
          technicalMessage: error.message,
          shouldRetry: true,
          fallbackAction: 'retry_with_exponential_backoff'
        }
      
      case 'PROCESSING_ERROR':
        return {
          userMessage: 'Gagal memproses pengembalian. Tim teknis akan menangani masalah ini.',
          technicalMessage: error.message,
          shouldRetry: false,
          fallbackAction: 'log_for_manual_review'
        }
      
      default:
        return {
          userMessage: 'Terjadi kesalahan yang tidak diketahui. Hubungi administrator.',
          technicalMessage: error.message,
          shouldRetry: false
        }
    }
  }

  // Handle network errors
  if (error.message.includes('fetch') || error.message.includes('network')) {
    console.error('🔴 Network Error:', baseContext)
    return {
      userMessage: 'Koneksi terputus. Periksa koneksi internet Anda.',
      technicalMessage: error.message,
      shouldRetry: true,
      fallbackAction: 'retry_with_exponential_backoff'
    }
  }

  // Handle timeout errors
  if (error.message.includes('timeout') || error.message.includes('abort')) {
    console.error('🔴 Timeout Error:', baseContext)
    return {
      userMessage: 'Proses memakan waktu terlalu lama. Coba lagi.',
      technicalMessage: error.message,
      shouldRetry: true,
      fallbackAction: 'retry_with_longer_timeout'
    }
  }

  // Generic error handling
  console.error('🔴 Unexpected Error:', { ...baseContext, message: error.message })
  return {
    userMessage: 'Terjadi kesalahan yang tidak terduga. Coba lagi atau hubungi administrator.',
    technicalMessage: error.message,
    shouldRetry: true
  }
}

// ====================
// FEATURE FLAGS
// ====================

/**
 * Feature flag support for gradual rollout
 */
export const featureFlags = {
  MULTI_CONDITION_ENABLED: true,
  PROGRESSIVE_ENHANCEMENT: true,
  ENHANCED_PENALTY_CALCULATION: true,
  REAL_TIME_VALIDATION: true,
  DETAILED_LOGGING: true
} as const

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof featureFlags): boolean {
  return featureFlags[feature] === true
}

/**
 * Get processing mode with feature flag consideration
 */
export function getEffectiveProcessingMode(
  requestedMode: ProcessingMode
): ProcessingMode {
  if (!isFeatureEnabled('MULTI_CONDITION_ENABLED')) {
    return 'single-condition'
  }
  
  return requestedMode
}