/**
 * Centralized Error Handling System for Availability Checks
 * Task 7.1: Create error handling system for availability checks
 * Requirements: 5.1, 5.2, 5.4, 5.5
 */

export enum AvailabilityErrorType {
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  DATE_OVERLAP_CONFLICT = 'DATE_OVERLAP_CONFLICT',
  CACHE_ERROR = 'CACHE_ERROR',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface AvailabilityError {
  type: AvailabilityErrorType
  message: string
  details?: Record<string, unknown>
  retryable: boolean
  userMessage: string
  technicalMessage?: string
}

/**
 * User-friendly error message templates
 * Requirement 5.1: Display popup error message with specific details
 */
export const ERROR_MESSAGES = {
  PRODUCT_NOT_FOUND: () => ({
    userMessage: 'Produk tidak ditemukan atau sudah tidak tersedia',
    technicalMessage: 'Product or product size not found in database'
  }),
  
  INSUFFICIENT_STOCK: (available: number, requested: number) => ({
    userMessage: `Stok tidak mencukupi. Tersedia: ${available}, Diminta: ${requested}`,
    technicalMessage: `Insufficient stock: available=${available}, requested=${requested}`
  }),
  
  DATE_OVERLAP_CONFLICT: (conflictingTransactions: string[]) => ({
    userMessage: `Produk sudah dibooking untuk periode ini: ${conflictingTransactions.join(', ')}`,
    technicalMessage: `Date overlap with transactions: ${conflictingTransactions.join(', ')}`
  }),
  
  CACHE_ERROR: () => ({
    userMessage: 'Terjadi masalah saat memuat data. Silakan coba lagi.',
    technicalMessage: 'Cache operation failed'
  }),
  
  NETWORK_TIMEOUT: () => ({
    userMessage: 'Koneksi bermasalah atau server tidak merespons. Silakan coba lagi.',
    technicalMessage: 'Network request timeout'
  }),
  
  API_ERROR: (statusCode?: number) => ({
    userMessage: 'Terjadi kesalahan server. Silakan coba lagi atau hubungi admin.',
    technicalMessage: `API error with status code: ${statusCode || 'unknown'}`
  }),
  
  VALIDATION_ERROR: (field?: string) => ({
    userMessage: `Data tidak valid${field ? ` pada field: ${field}` : ''}. Silakan periksa kembali.`,
    technicalMessage: `Validation failed${field ? ` for field: ${field}` : ''}`
  }),
  
  UNKNOWN_ERROR: () => ({
    userMessage: 'Terjadi kesalahan tidak terduga. Silakan refresh halaman dan coba lagi.',
    technicalMessage: 'Unknown error occurred'
  })
} as const

/**
 * Create standardized availability error
 * Requirement 5.2: Show specific error details including available quantity
 */
export function createAvailabilityError(
  type: AvailabilityErrorType,
  details?: Record<string, unknown>
): AvailabilityError {
  let message: { userMessage: string; technicalMessage: string }
  let retryable = false

  switch (type) {
    case AvailabilityErrorType.PRODUCT_NOT_FOUND:
      message = ERROR_MESSAGES.PRODUCT_NOT_FOUND()
      retryable = false
      break
      
    case AvailabilityErrorType.INSUFFICIENT_STOCK:
      message = ERROR_MESSAGES.INSUFFICIENT_STOCK(
        (details?.available as number) || 0,
        (details?.requested as number) || 0
      )
      retryable = false
      break
      
    case AvailabilityErrorType.DATE_OVERLAP_CONFLICT:
      message = ERROR_MESSAGES.DATE_OVERLAP_CONFLICT(
        (details?.conflictingTransactions as string[]) || []
      )
      retryable = false
      break
      
    case AvailabilityErrorType.CACHE_ERROR:
      message = ERROR_MESSAGES.CACHE_ERROR()
      retryable = true
      break
      
    case AvailabilityErrorType.NETWORK_TIMEOUT:
      message = ERROR_MESSAGES.NETWORK_TIMEOUT()
      retryable = true
      break
      
    case AvailabilityErrorType.API_ERROR:
      message = ERROR_MESSAGES.API_ERROR(details?.statusCode as number)
      retryable = true
      break
      
    case AvailabilityErrorType.VALIDATION_ERROR:
      message = ERROR_MESSAGES.VALIDATION_ERROR(details?.field as string)
      retryable = false
      break
      
    default:
      message = ERROR_MESSAGES.UNKNOWN_ERROR()
      retryable = true
      break
  }

  return {
    type,
    message: message.userMessage,
    details,
    retryable,
    userMessage: message.userMessage,
    technicalMessage: message.technicalMessage
  }
}

/**
 * Determine error type from HTTP response or error object
 * Requirement 5.4: Handle API errors with user-friendly messages
 */
export function determineErrorType(error: unknown): AvailabilityErrorType {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    
    if (message.includes('not found') || message.includes('tidak ditemukan')) {
      return AvailabilityErrorType.PRODUCT_NOT_FOUND
    }
    
    if (message.includes('insufficient') || message.includes('tidak mencukupi')) {
      return AvailabilityErrorType.INSUFFICIENT_STOCK
    }
    
    if (message.includes('overlap') || message.includes('conflict')) {
      return AvailabilityErrorType.DATE_OVERLAP_CONFLICT
    }
    
    if (message.includes('timeout') || message.includes('network')) {
      return AvailabilityErrorType.NETWORK_TIMEOUT
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return AvailabilityErrorType.VALIDATION_ERROR
    }
    
    if (message.includes('cache')) {
      return AvailabilityErrorType.CACHE_ERROR
    }
  }
  
  // Check for fetch/HTTP errors
  if (typeof error === 'object' && error !== null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorObj = error as any
    
    if (errorObj.status >= 400 && errorObj.status < 500) {
      if (errorObj.status === 404) {
        return AvailabilityErrorType.PRODUCT_NOT_FOUND
      }
      if (errorObj.status === 400) {
        return AvailabilityErrorType.VALIDATION_ERROR
      }
      return AvailabilityErrorType.API_ERROR
    }
    
    if (errorObj.status >= 500) {
      return AvailabilityErrorType.API_ERROR
    }
    
    if (errorObj.name === 'TimeoutError' || errorObj.code === 'TIMEOUT') {
      return AvailabilityErrorType.NETWORK_TIMEOUT
    }
  }
  
  return AvailabilityErrorType.UNKNOWN_ERROR
}

/**
 * Retry configuration for different error types
 * Requirement 5.5: Provide retry options where applicable
 */
export interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
}

export const RETRY_CONFIGS: Record<AvailabilityErrorType, RetryConfig | null> = {
  [AvailabilityErrorType.PRODUCT_NOT_FOUND]: null, // Not retryable
  [AvailabilityErrorType.INSUFFICIENT_STOCK]: null, // Not retryable
  [AvailabilityErrorType.DATE_OVERLAP_CONFLICT]: null, // Not retryable
  [AvailabilityErrorType.VALIDATION_ERROR]: null, // Not retryable
  [AvailabilityErrorType.CACHE_ERROR]: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 4000,
    backoffMultiplier: 2
  },
  [AvailabilityErrorType.NETWORK_TIMEOUT]: {
    maxAttempts: 3,
    baseDelay: 2000,
    maxDelay: 8000,
    backoffMultiplier: 2
  },
  [AvailabilityErrorType.API_ERROR]: {
    maxAttempts: 2,
    baseDelay: 1500,
    maxDelay: 3000,
    backoffMultiplier: 2
  },
  [AvailabilityErrorType.UNKNOWN_ERROR]: {
    maxAttempts: 2,
    baseDelay: 1000,
    maxDelay: 2000,
    backoffMultiplier: 2
  }
}

/**
 * Calculate retry delay with exponential backoff
 * Requirement 5.5: Retry mechanisms for network errors
 */
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig
): number {
  const delay = Math.min(
    config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
    config.maxDelay
  )
  
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.1 * delay
  return Math.floor(delay + jitter)
}

/**
 * Check if error should be retried
 */
export function shouldRetry(
  error: AvailabilityError,
  currentAttempt: number
): boolean {
  if (!error.retryable) return false
  
  const config = RETRY_CONFIGS[error.type]
  if (!config) return false
  
  return currentAttempt < config.maxAttempts
}