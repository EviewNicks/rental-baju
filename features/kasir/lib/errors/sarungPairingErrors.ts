/**
 * Comprehensive Error Handling for Jas-Sarung Pairing System
 * Task 11: Implement comprehensive error handling
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { 
  AvailabilityError, 
  AvailabilityErrorType
} from './availabilityErrors'

export enum SarungPairingErrorType {
  // Sarung availability errors
  SARUNG_NOT_AVAILABLE = 'SARUNG_NOT_AVAILABLE',
  SARUNG_INSUFFICIENT_STOCK = 'SARUNG_INSUFFICIENT_STOCK',
  SARUNG_CATEGORY_INVALID = 'SARUNG_CATEGORY_INVALID',
  
  // Modal and UI errors
  MODAL_LOAD_FAILED = 'MODAL_LOAD_FAILED',
  MODAL_TIMEOUT = 'MODAL_TIMEOUT',
  MODAL_CONFLICT = 'MODAL_CONFLICT',
  
  // Pairing validation errors
  PAIRING_VALIDATION_FAILED = 'PAIRING_VALIDATION_FAILED',
  QUANTITY_MISMATCH = 'QUANTITY_MISMATCH',
  INVALID_JAS_PRODUCT = 'INVALID_JAS_PRODUCT',
  
  // Inventory management errors
  INVENTORY_SYNC_FAILED = 'INVENTORY_SYNC_FAILED',
  DUAL_INVENTORY_ERROR = 'DUAL_INVENTORY_ERROR',
  TRANSACTION_ROLLBACK_FAILED = 'TRANSACTION_ROLLBACK_FAILED',
  
  // Network and API errors specific to pairing
  PAIRING_API_ERROR = 'PAIRING_API_ERROR',
  SARUNG_DATA_FETCH_ERROR = 'SARUNG_DATA_FETCH_ERROR'
}

export interface SarungPairingError extends AvailabilityError {
  pairingType: SarungPairingErrorType
  jasProductId?: string
  sarungProductId?: string
  fallbackAction?: 'ADD_JAS_ONLY' | 'RETRY_MODAL' | 'REFRESH_DATA' | 'CONTACT_ADMIN'
}

/**
 * User-friendly error messages for sarung pairing scenarios
 * Requirement 9.4: User-friendly error messages untuk non-it
 */
export const SARUNG_PAIRING_ERROR_MESSAGES = {
  SARUNG_NOT_AVAILABLE: (sarungName?: string) => ({
    userMessage: `Sarung ${sarungName || 'yang dipilih'} sudah tidak tersedia. Silakan pilih sarung lain atau lanjutkan tanpa sarung.`,
    technicalMessage: `Selected sarung product is no longer available`,
    fallbackAction: 'RETRY_MODAL' as const
  }),
  
  SARUNG_INSUFFICIENT_STOCK: (available: number, requested: number, sarungName?: string) => ({
    userMessage: `Stok sarung ${sarungName || ''} tidak mencukupi. Tersedia: ${available}, Diminta: ${requested}. Silakan kurangi jumlah atau pilih sarung lain.`,
    technicalMessage: `Insufficient sarung stock: available=${available}, requested=${requested}`,
    fallbackAction: 'RETRY_MODAL' as const
  }),
  
  SARUNG_CATEGORY_INVALID: (productName?: string) => ({
    userMessage: `Produk ${productName || 'yang dipilih'} bukan kategori sarung yang valid. Silakan pilih produk sarung yang benar.`,
    technicalMessage: `Invalid sarung category for pairing`,
    fallbackAction: 'RETRY_MODAL' as const
  }),
  
  MODAL_LOAD_FAILED: () => ({
    userMessage: 'Gagal memuat pilihan sarung. Jas akan ditambahkan tanpa sarung. Anda bisa menambahkan sarung secara terpisah nanti.',
    technicalMessage: 'Sarung selection modal failed to load',
    fallbackAction: 'ADD_JAS_ONLY' as const
  }),
  
  MODAL_TIMEOUT: () => ({
    userMessage: 'Waktu tunggu habis saat memuat sarung. Jas akan ditambahkan tanpa sarung. Silakan coba tambahkan sarung secara terpisah.',
    technicalMessage: 'Modal loading timeout exceeded',
    fallbackAction: 'ADD_JAS_ONLY' as const
  }),
  
  MODAL_CONFLICT: () => ({
    userMessage: 'Terjadi konflik tampilan. Silakan tutup popup yang terbuka dan coba lagi.',
    technicalMessage: 'Modal state conflict detected',
    fallbackAction: 'RETRY_MODAL' as const
  }),
  
  PAIRING_VALIDATION_FAILED: (reason?: string) => ({
    userMessage: `Gagal memvalidasi pairing jas-sarung${reason ? `: ${reason}` : ''}. Silakan coba lagi atau tambahkan produk secara terpisah.`,
    technicalMessage: `Pairing validation failed: ${reason || 'unknown reason'}`,
    fallbackAction: 'ADD_JAS_ONLY' as const
  }),
  
  QUANTITY_MISMATCH: (jasQty: number, sarungQty: number) => ({
    userMessage: `Jumlah jas (${jasQty}) dan sarung (${sarungQty}) tidak sesuai. Silakan sesuaikan jumlah atau pilih sarung lain.`,
    technicalMessage: `Quantity mismatch: jas=${jasQty}, sarung=${sarungQty}`,
    fallbackAction: 'RETRY_MODAL' as const
  }),
  
  INVALID_JAS_PRODUCT: (productName?: string) => ({
    userMessage: `Produk ${productName || 'yang dipilih'} bukan kategori jas yang valid untuk pairing sarung.`,
    technicalMessage: `Invalid jas product for sarung pairing`,
    fallbackAction: 'ADD_JAS_ONLY' as const
  }),
  
  INVENTORY_SYNC_FAILED: () => ({
    userMessage: 'Gagal sinkronisasi stok. Data mungkin tidak akurat. Silakan refresh halaman dan coba lagi.',
    technicalMessage: 'Inventory synchronization failed',
    fallbackAction: 'REFRESH_DATA' as const
  }),
  
  DUAL_INVENTORY_ERROR: (jasName?: string, sarungName?: string) => ({
    userMessage: `Gagal mengelola stok untuk jas ${jasName || ''} dan sarung ${sarungName || ''}. Silakan coba lagi atau hubungi admin.`,
    technicalMessage: 'Dual inventory management error',
    fallbackAction: 'CONTACT_ADMIN' as const
  }),
  
  TRANSACTION_ROLLBACK_FAILED: () => ({
    userMessage: 'Terjadi kesalahan serius dalam pemrosesan transaksi. Silakan hubungi admin untuk memverifikasi data.',
    technicalMessage: 'Transaction rollback mechanism failed',
    fallbackAction: 'CONTACT_ADMIN' as const
  }),
  
  PAIRING_API_ERROR: (statusCode?: number) => ({
    userMessage: 'Terjadi kesalahan server saat memproses pairing. Silakan coba lagi atau tambahkan produk secara terpisah.',
    technicalMessage: `Pairing API error with status: ${statusCode || 'unknown'}`,
    fallbackAction: 'ADD_JAS_ONLY' as const
  }),
  
  SARUNG_DATA_FETCH_ERROR: () => ({
    userMessage: 'Gagal memuat data sarung. Jas akan ditambahkan tanpa sarung. Silakan coba tambahkan sarung secara terpisah.',
    technicalMessage: 'Failed to fetch sarung product data',
    fallbackAction: 'ADD_JAS_ONLY' as const
  })
} as const

/**
 * Create sarung pairing specific error
 * Requirement 9.1: Sarung availability validation
 */
export function createSarungPairingError(
  type: SarungPairingErrorType,
  details?: Record<string, unknown>
): SarungPairingError {
  let message: { 
    userMessage: string
    technicalMessage: string
    fallbackAction: 'ADD_JAS_ONLY' | 'RETRY_MODAL' | 'REFRESH_DATA' | 'CONTACT_ADMIN'
  }
  let retryable = false

  switch (type) {
    case SarungPairingErrorType.SARUNG_NOT_AVAILABLE:
      message = SARUNG_PAIRING_ERROR_MESSAGES.SARUNG_NOT_AVAILABLE(details?.sarungName as string)
      retryable = true
      break
      
    case SarungPairingErrorType.SARUNG_INSUFFICIENT_STOCK:
      message = SARUNG_PAIRING_ERROR_MESSAGES.SARUNG_INSUFFICIENT_STOCK(
        (details?.available as number) || 0,
        (details?.requested as number) || 0,
        details?.sarungName as string
      )
      retryable = true
      break
      
    case SarungPairingErrorType.SARUNG_CATEGORY_INVALID:
      message = SARUNG_PAIRING_ERROR_MESSAGES.SARUNG_CATEGORY_INVALID(details?.productName as string)
      retryable = false
      break
      
    case SarungPairingErrorType.MODAL_LOAD_FAILED:
      message = SARUNG_PAIRING_ERROR_MESSAGES.MODAL_LOAD_FAILED()
      retryable = true
      break
      
    case SarungPairingErrorType.MODAL_TIMEOUT:
      message = SARUNG_PAIRING_ERROR_MESSAGES.MODAL_TIMEOUT()
      retryable = true
      break
      
    case SarungPairingErrorType.MODAL_CONFLICT:
      message = SARUNG_PAIRING_ERROR_MESSAGES.MODAL_CONFLICT()
      retryable = true
      break
      
    case SarungPairingErrorType.PAIRING_VALIDATION_FAILED:
      message = SARUNG_PAIRING_ERROR_MESSAGES.PAIRING_VALIDATION_FAILED(details?.reason as string)
      retryable = true
      break
      
    case SarungPairingErrorType.QUANTITY_MISMATCH:
      message = SARUNG_PAIRING_ERROR_MESSAGES.QUANTITY_MISMATCH(
        (details?.jasQuantity as number) || 0,
        (details?.sarungQuantity as number) || 0
      )
      retryable = true
      break
      
    case SarungPairingErrorType.INVALID_JAS_PRODUCT:
      message = SARUNG_PAIRING_ERROR_MESSAGES.INVALID_JAS_PRODUCT(details?.productName as string)
      retryable = false
      break
      
    case SarungPairingErrorType.INVENTORY_SYNC_FAILED:
      message = SARUNG_PAIRING_ERROR_MESSAGES.INVENTORY_SYNC_FAILED()
      retryable = true
      break
      
    case SarungPairingErrorType.DUAL_INVENTORY_ERROR:
      message = SARUNG_PAIRING_ERROR_MESSAGES.DUAL_INVENTORY_ERROR(
        details?.jasName as string,
        details?.sarungName as string
      )
      retryable = false
      break
      
    case SarungPairingErrorType.TRANSACTION_ROLLBACK_FAILED:
      message = SARUNG_PAIRING_ERROR_MESSAGES.TRANSACTION_ROLLBACK_FAILED()
      retryable = false
      break
      
    case SarungPairingErrorType.PAIRING_API_ERROR:
      message = SARUNG_PAIRING_ERROR_MESSAGES.PAIRING_API_ERROR(details?.statusCode as number)
      retryable = true
      break
      
    case SarungPairingErrorType.SARUNG_DATA_FETCH_ERROR:
      message = SARUNG_PAIRING_ERROR_MESSAGES.SARUNG_DATA_FETCH_ERROR()
      retryable = true
      break
      
    default:
      message = {
        userMessage: 'Terjadi kesalahan tidak terduga dalam pairing jas-sarung.',
        technicalMessage: 'Unknown sarung pairing error',
        fallbackAction: 'ADD_JAS_ONLY' as const
      }
      retryable = true
      break
  }

  // Convert to base AvailabilityErrorType for compatibility
  const baseErrorType = mapToAvailabilityErrorType(type)

  return {
    type: baseErrorType,
    pairingType: type,
    message: message.userMessage,
    details,
    retryable,
    userMessage: message.userMessage,
    technicalMessage: message.technicalMessage,
    jasProductId: details?.jasProductId as string,
    sarungProductId: details?.sarungProductId as string,
    fallbackAction: message.fallbackAction
  }
}

/**
 * Map sarung pairing error types to base availability error types
 */
function mapToAvailabilityErrorType(pairingType: SarungPairingErrorType): AvailabilityErrorType {
  switch (pairingType) {
    case SarungPairingErrorType.SARUNG_NOT_AVAILABLE:
      return AvailabilityErrorType.PRODUCT_NOT_FOUND
    case SarungPairingErrorType.SARUNG_INSUFFICIENT_STOCK:
      return AvailabilityErrorType.INSUFFICIENT_STOCK
    case SarungPairingErrorType.SARUNG_CATEGORY_INVALID:
    case SarungPairingErrorType.PAIRING_VALIDATION_FAILED:
    case SarungPairingErrorType.QUANTITY_MISMATCH:
    case SarungPairingErrorType.INVALID_JAS_PRODUCT:
      return AvailabilityErrorType.VALIDATION_ERROR
    case SarungPairingErrorType.MODAL_TIMEOUT:
      return AvailabilityErrorType.NETWORK_TIMEOUT
    case SarungPairingErrorType.PAIRING_API_ERROR:
    case SarungPairingErrorType.SARUNG_DATA_FETCH_ERROR:
      return AvailabilityErrorType.API_ERROR
    case SarungPairingErrorType.INVENTORY_SYNC_FAILED:
    case SarungPairingErrorType.DUAL_INVENTORY_ERROR:
    case SarungPairingErrorType.TRANSACTION_ROLLBACK_FAILED:
      return AvailabilityErrorType.CACHE_ERROR
    default:
      return AvailabilityErrorType.UNKNOWN_ERROR
  }
}

/**
 * Determine sarung pairing error type from error object
 * Requirement 9.2: Inventory validation checks
 */
export function determineSarungPairingErrorType(error: unknown): SarungPairingErrorType {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    
    if (message.includes('sarung') && message.includes('not available')) {
      return SarungPairingErrorType.SARUNG_NOT_AVAILABLE
    }
    
    if (message.includes('sarung') && message.includes('insufficient')) {
      return SarungPairingErrorType.SARUNG_INSUFFICIENT_STOCK
    }
    
    if (message.includes('invalid') && message.includes('category')) {
      return SarungPairingErrorType.SARUNG_CATEGORY_INVALID
    }
    
    if (message.includes('modal') && message.includes('timeout')) {
      return SarungPairingErrorType.MODAL_TIMEOUT
    }
    
    if (message.includes('modal') && (message.includes('load') || message.includes('failed'))) {
      return SarungPairingErrorType.MODAL_LOAD_FAILED
    }
    
    if (message.includes('quantity') && message.includes('mismatch')) {
      return SarungPairingErrorType.QUANTITY_MISMATCH
    }
    
    if (message.includes('pairing') && message.includes('validation')) {
      return SarungPairingErrorType.PAIRING_VALIDATION_FAILED
    }
    
    if (message.includes('inventory') && message.includes('sync')) {
      return SarungPairingErrorType.INVENTORY_SYNC_FAILED
    }
    
    if (message.includes('dual') && message.includes('inventory')) {
      return SarungPairingErrorType.DUAL_INVENTORY_ERROR
    }
    
    if (message.includes('rollback')) {
      return SarungPairingErrorType.TRANSACTION_ROLLBACK_FAILED
    }
  }
  
  // Check for API errors
  if (typeof error === 'object' && error !== null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorObj = error as any
    
    if (errorObj.status && errorObj.message?.includes('sarung')) {
      return SarungPairingErrorType.SARUNG_DATA_FETCH_ERROR
    }
    
    if (errorObj.status && errorObj.message?.includes('pairing')) {
      return SarungPairingErrorType.PAIRING_API_ERROR
    }
  }
  
  return SarungPairingErrorType.PAIRING_VALIDATION_FAILED
}

/**
 * Validate sarung selection for pairing
 * Requirement 9.3: Graceful degradation
 */
export function validateSarungSelection(
  jasProduct: { id: string; name: string; category: string },
  sarungProduct: { id: string; name: string; category: string; availableQuantity?: number },
  jasQuantity: number,
  sarungQuantity: number
): SarungPairingError | null {
  // Validate jas product
  if (!jasProduct.category.toLowerCase().startsWith('jas-')) {
    return createSarungPairingError(SarungPairingErrorType.INVALID_JAS_PRODUCT, {
      productName: jasProduct.name,
      jasProductId: jasProduct.id
    })
  }
  
  // Validate sarung category
  if (sarungProduct.category.toLowerCase() !== 'sarung') {
    return createSarungPairingError(SarungPairingErrorType.SARUNG_CATEGORY_INVALID, {
      productName: sarungProduct.name,
      sarungProductId: sarungProduct.id
    })
  }
  
  // Validate quantities
  if (jasQuantity !== sarungQuantity) {
    return createSarungPairingError(SarungPairingErrorType.QUANTITY_MISMATCH, {
      jasQuantity,
      sarungQuantity,
      jasProductId: jasProduct.id,
      sarungProductId: sarungProduct.id
    })
  }
  
  // Validate sarung availability
  if (sarungProduct.availableQuantity !== undefined && sarungProduct.availableQuantity < sarungQuantity) {
    return createSarungPairingError(SarungPairingErrorType.SARUNG_INSUFFICIENT_STOCK, {
      available: sarungProduct.availableQuantity,
      requested: sarungQuantity,
      sarungName: sarungProduct.name,
      sarungProductId: sarungProduct.id
    })
  }
  
  return null // No errors
}

/**
 * Execute fallback action based on error type
 * Requirement 9.4: Fallback options
 */
export function executeFallbackAction(
  error: SarungPairingError,
  context: {
    jasProduct: { id: string; name: string; category: string }
    jasQuantity: number
    jasProductSizeId?: string
    onAddJasOnly: (product: { id: string; name: string; category: string }, quantity: number, productSizeId?: string) => void
    onRetryModal: () => void
    onRefreshData: () => void
    onContactAdmin: (error: SarungPairingError) => void
  }
): void {
  switch (error.fallbackAction) {
    case 'ADD_JAS_ONLY':
      console.warn('Executing fallback: Adding jas without sarung', {
        jasProductId: error.jasProductId,
        error: error.technicalMessage
      })
      context.onAddJasOnly(context.jasProduct, context.jasQuantity, context.jasProductSizeId)
      break
      
    case 'RETRY_MODAL':
      console.info('Executing fallback: Retrying modal', {
        error: error.technicalMessage
      })
      context.onRetryModal()
      break
      
    case 'REFRESH_DATA':
      console.warn('Executing fallback: Refreshing data', {
        error: error.technicalMessage
      })
      context.onRefreshData()
      break
      
    case 'CONTACT_ADMIN':
      console.error('Executing fallback: Contact admin required', {
        error: error.technicalMessage,
        details: error.details
      })
      context.onContactAdmin(error)
      break
      
    default:
      console.warn('Unknown fallback action, defaulting to add jas only', {
        fallbackAction: error.fallbackAction,
        error: error.technicalMessage
      })
      context.onAddJasOnly(context.jasProduct, context.jasQuantity, context.jasProductSizeId)
      break
  }
}

/**
 * Retry configuration for sarung pairing errors
 * Requirement 9.5: Retry mechanisms
 */
export const SARUNG_PAIRING_RETRY_CONFIGS = {
  [SarungPairingErrorType.SARUNG_NOT_AVAILABLE]: {
    maxAttempts: 2,
    baseDelay: 1000,
    maxDelay: 2000,
    backoffMultiplier: 1.5
  },
  [SarungPairingErrorType.MODAL_LOAD_FAILED]: {
    maxAttempts: 3,
    baseDelay: 500,
    maxDelay: 2000,
    backoffMultiplier: 2
  },
  [SarungPairingErrorType.MODAL_TIMEOUT]: {
    maxAttempts: 2,
    baseDelay: 1000,
    maxDelay: 3000,
    backoffMultiplier: 2
  },
  [SarungPairingErrorType.PAIRING_API_ERROR]: {
    maxAttempts: 3,
    baseDelay: 1500,
    maxDelay: 5000,
    backoffMultiplier: 2
  },
  [SarungPairingErrorType.SARUNG_DATA_FETCH_ERROR]: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 4000,
    backoffMultiplier: 2
  }
} as const

/**
 * Check if sarung pairing error should be retried
 */
export function shouldRetrySarungPairingError(
  error: SarungPairingError,
  currentAttempt: number
): boolean {
  if (!error.retryable) return false
  
  const config = SARUNG_PAIRING_RETRY_CONFIGS[error.pairingType as keyof typeof SARUNG_PAIRING_RETRY_CONFIGS]
  if (!config) return false
  
  return currentAttempt < config.maxAttempts
}