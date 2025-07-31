/**
 * Error Handling Utilities
 * Provides utilities for handling different types of errors
 */

import { showError, showWarning, showInfo } from '@/lib/notifications'

export type ErrorType = 'network' | 'api' | 'validation' | 'authentication' | 'authorization' | 'not-found' | 'conflict' | 'server' | 'unknown'

export interface AppError {
  type: ErrorType
  message: string
  originalError?: Error
  statusCode?: number
  retryable?: boolean
}

/**
 * Determines the error type based on the error object
 */
export function categorizeError(error: unknown): AppError {
  if (!error) {
    return {
      type: 'unknown',
      message: 'Terjadi kesalahan tidak diketahui',
      retryable: false,
    }
  }

  // Handle Response/Fetch errors
  if (error instanceof Response) {
    return {
      type: getErrorTypeFromStatus(error.status),
      message: getErrorMessageFromStatus(error.status),
      statusCode: error.status,
      retryable: isRetryableStatus(error.status),
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
      return {
        type: 'network',
        message: 'Koneksi internet bermasalah. Periksa koneksi Anda.',
        originalError: error,
        retryable: true,
      }
    }

    // Timeout errors
    if (error.message.includes('timeout') || error.message.includes('AbortError')) {
      return {
        type: 'network',
        message: 'Request timeout. Coba lagi dalam beberapa saat.',
        originalError: error,
        retryable: true,
      }
    }

    return {
      type: 'unknown',
      message: error.message || 'Terjadi kesalahan tidak terduga',
      originalError: error,
      retryable: false,
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      type: 'unknown',
      message: error,
      retryable: false,
    }
  }

  // Handle API error objects
  if (typeof error === 'object' && error !== null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorObj = error as any
    
    if (errorObj.status) {
      return {
        type: getErrorTypeFromStatus(errorObj.status),
        message: errorObj.message || getErrorMessageFromStatus(errorObj.status),
        statusCode: errorObj.status,
        retryable: isRetryableStatus(errorObj.status),
      }
    }

    if (errorObj.message) {
      return {
        type: 'api',
        message: errorObj.message,
        retryable: false,
      }
    }
  }

  return {
    type: 'unknown',
    message: 'Terjadi kesalahan tidak diketahui',
    retryable: false,
  }
}

/**
 * Maps HTTP status codes to error types
 */
function getErrorTypeFromStatus(status: number): ErrorType {
  if (status >= 400 && status < 500) {
    switch (status) {
      case 401:
        return 'authentication'
      case 403:
        return 'authorization'
      case 404:
        return 'not-found'
      case 409:
        return 'conflict'
      case 422:
        return 'validation'
      default:
        return 'api'
    }
  }

  if (status >= 500) {
    return 'server'
  }

  if (status === 0 || !navigator.onLine) {
    return 'network'
  }

  return 'unknown'
}

/**
 * Gets user-friendly error messages for HTTP status codes
 */
function getErrorMessageFromStatus(status: number): string {
  switch (status) {
    case 400:
      return 'Permintaan tidak valid. Periksa data yang Anda masukkan.'
    case 401:
      return 'Sesi Anda telah berakhir. Silakan login kembali.'
    case 403:
      return 'Anda tidak memiliki izin untuk melakukan tindakan ini.'
    case 404:
      return 'Data yang diminta tidak ditemukan.'
    case 409:
      return 'Data sudah ada atau konflik dengan data lain.'
    case 422:
      return 'Data yang Anda masukkan tidak valid.'
    case 429:
      return 'Terlalu banyak permintaan. Coba lagi dalam beberapa saat.'
    case 500:
      return 'Terjadi kesalahan pada server. Tim teknis sedang menangani.'
    case 502:
    case 503:
    case 504:
      return 'Server sedang mengalami gangguan. Coba lagi nanti.'
    default:
      if (status >= 400 && status < 500) {
        return 'Terjadi kesalahan pada permintaan Anda.'
      }
      if (status >= 500) {
        return 'Terjadi kesalahan pada server.'
      }
      return 'Terjadi kesalahan tidak terduga.'
  }
}

/**
 * Determines if an error is retryable based on status code
 */
function isRetryableStatus(status: number): boolean {
  // Network errors and server errors are usually retryable
  return status === 0 || status === 408 || status === 429 || status >= 500
}

/**
 * Handles errors with appropriate user notifications
 */
export function handleError(error: unknown, context?: string): AppError {
  const appError = categorizeError(error)
  
  // Log error for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 Error in ${context || 'Unknown Context'}`)
    console.error('Original Error:', error)
    console.error('Categorized Error:', appError)
    console.groupEnd()
  }

  // Show appropriate notification
  switch (appError.type) {
    case 'network':
      showWarning('Koneksi Bermasalah', appError.message)
      break
    case 'authentication':
      showError('Autentikasi Gagal', appError.message)
      break
    case 'authorization':
      showError('Akses Ditolak', appError.message)
      break
    case 'not-found':
      showInfo('Data Tidak Ditemukan', appError.message)
      break
    case 'validation':
      showWarning('Data Tidak Valid', appError.message)
      break
    case 'server':
      showError('Kesalahan Server', appError.message)
      break
    default:
      showError('Terjadi Kesalahan', appError.message)
  }

  return appError
}

/**
 * Creates a retry function with exponential backoff
 */
export function createRetryFunction<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): () => Promise<T> {
  return async (): Promise<T> => {
    let lastError: unknown
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        
        const appError = categorizeError(error)
        
        // Don't retry non-retryable errors
        if (!appError.retryable) {
          throw error
        }
        
        // Don't retry on last attempt
        if (attempt === maxRetries) {
          throw error
        }
        
        // Calculate delay with exponential backoff
        const delay = initialDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw lastError
  }
}

/**
 * Network connectivity checker
 */
export function checkNetworkConnectivity(): boolean {
  return navigator.onLine
}

/**
 * Enhanced error handler with retry support
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelay?: number
    context?: string
    onRetry?: (attempt: number, error: AppError) => void
  } = {}
): Promise<T> {
  const { maxRetries = 3, initialDelay = 1000, context, onRetry } = options
  
  let lastError: unknown
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const appError = categorizeError(error)
      
      // Don't retry non-retryable errors
      if (!appError.retryable) {
        handleError(error, context)
        throw error
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        handleError(error, context)
        throw error
      }
      
      // Call retry callback
      onRetry?.(attempt + 1, appError)
      
      // Calculate delay with exponential backoff
      const delay = initialDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  handleError(lastError, context)
  throw lastError
}