/**
 * Error Service
 *
 * Main error service class for unified error handling.
 * Provides error creation, transformation, and utility functions.
 *
 * Requirements: 1.1, 1.2, 9.1, 9.2, 9.3, 13.1, 13.2, 13.3, 13.4, 13.5
 */

import { NextResponse } from 'next/server'
import {
  ErrorCode,
  ErrorCategory,
  StructuredError,
  ErrorResponse,
  ErrorContext,
} from './errorTypes'
import { getErrorTemplate, isRetryable, getRetryConfig, calculateRetryDelay, generateErrorMessage } from './errorTemplates'

// Re-export ErrorCode and types for convenience
export { ErrorCode }
export type { ErrorCategory, StructuredError, ErrorResponse, ErrorContext }

/**
 * Error Service Class
 *
 * Static methods for error creation, transformation, and utilities
 */
export class ErrorService {
  /**
   * Create a structured error from error code and context
   *
   * @param code - Error code from ErrorCode enum
   * @param context - Dynamic context variables
   * @param additionalContext - Additional context like technical details, transaction ID
   * @returns StructuredError object
   *
   * Example:
   * ```typescript
   * const error = ErrorService.createError(
   *   ErrorCode.ERR_STK_001,
   *   { productName: 'Jas M Hitam', size: 'L', available: 2, requested: 5 }
   * )
   * ```
   */
  static createError(
    code: ErrorCode,
    context: ErrorContext = {},
    additionalContext: {
      technical?: string
      transactionId?: string
    } = {}
  ): StructuredError {
    const template = getErrorTemplate(code)

    const structuredError: StructuredError = {
      code,
      message: template.message(context),
      context,
      category: template.category,
      actions: template.actions(context),
      timestamp: new Date().toISOString(),
    }

    // Add optional fields
    if (additionalContext.technical) {
      structuredError.technical = additionalContext.technical
    }
    if (additionalContext.transactionId) {
      structuredError.transactionId = additionalContext.transactionId
    }

    return structuredError
  }

  /**
   * Create API error response
   *
   * @param code - Error code from ErrorCode enum
   * @param context - Dynamic context variables
   * @param additionalContext - Additional context like technical details, transaction ID
   * @returns NextResponse with standardized error format
   *
   * Example:
   * ```typescript
   * return ErrorService.createErrorResponse(
   *   ErrorCode.ERR_STK_001,
   *   { productName: 'Jas M Hitam', size: 'L', available: 2, requested: 5 }
   * )
   * ```
   */
  static createErrorResponse(
    code: ErrorCode,
    context: ErrorContext = {},
    additionalContext: {
      technical?: string
      transactionId?: string
    } = {}
  ): NextResponse<ErrorResponse> {
    const error = this.createError(code, context, additionalContext)
    const statusCode = this.getStatusCode(code)

    const response: ErrorResponse = {
      success: false,
      error,
    }

    return NextResponse.json(response, { status: statusCode })
  }

  /**
   * Transform generic error to structured error
   *
   * Provides backward compatibility with existing error throwing patterns
   *
   * @param error - Any error object
   * @param defaultCode - Default error code if detection fails
   * @returns StructuredError object
   *
   * Example:
   * ```typescript
   * try {
   *   await someOperation()
   * } catch (error) {
   *   const structuredError = ErrorService.fromError(error)
   *   throw structuredError
   * }
   * ```
   */
  static fromError(error: unknown, defaultCode: ErrorCode = ErrorCode.ERR_SYS_001): StructuredError {
    // Already a StructuredError
    if (this.isStructuredError(error)) {
      return error
    }

    // Error object with message
    if (error instanceof Error) {
      const detectedCode = this.detectErrorCodeFromMessage(error.message)
      const code = detectedCode || defaultCode

      return this.createError(code, {}, {
        technical: error.message,
      })
    }

    // String error
    if (typeof error === 'string') {
      const detectedCode = this.detectErrorCodeFromMessage(error)
      const code = detectedCode || defaultCode

      return this.createError(code, {}, {
        technical: error,
      })
    }

    // Unknown error type
    return this.createError(defaultCode, {}, {
      technical: JSON.stringify(error),
    })
  }

  /**
   * Detect error code from error message
   *
   * Pattern matching for backward compatibility with existing error messages
   *
   * @param message - Error message to analyze
   * @returns Detected error code or null
   */
  static detectErrorCodeFromMessage(message: string): ErrorCode | null {
    const normalizedMessage = message.toLowerCase()

    // Stock errors
    if (
      normalizedMessage.includes('tidak mencukupi') ||
      normalizedMessage.includes('insufficient') ||
      normalizedMessage.includes('stok tidak')
    ) {
      return ErrorCode.ERR_STK_001
    }

    if (
      normalizedMessage.includes('tidak tersedia') &&
      (normalizedMessage.includes('stok') || normalizedMessage.includes('habis'))
    ) {
      return ErrorCode.ERR_STK_002
    }

    // Customer errors
    if (
      normalizedMessage.includes('penyewa tidak ditemukan') ||
      normalizedMessage.includes('pelanggan tidak ditemukan') ||
      normalizedMessage.includes('customer not found')
    ) {
      return ErrorCode.ERR_CUST_001
    }

    // Product errors
    if (
      normalizedMessage.includes('produk tidak ditemukan') ||
      normalizedMessage.includes('produk tidak aktif') ||
      normalizedMessage.includes('product not found')
    ) {
      return ErrorCode.ERR_PROD_001
    }

    if (normalizedMessage.includes('ukuran tidak ditemukan') || normalizedMessage.includes('ukuran tidak aktif')) {
      return ErrorCode.ERR_SIZE_001
    }

    // Date errors
    if (
      normalizedMessage.includes('tanggal tidak valid') ||
      normalizedMessage.includes('invalid date')
    ) {
      return ErrorCode.ERR_DATE_001
    }

    if (
      normalizedMessage.includes('konflik tanggal') ||
      normalizedMessage.includes('date conflict') ||
      normalizedMessage.includes('tanggal sudah dipesan')
    ) {
      return ErrorCode.ERR_DATE_002
    }

    // Pairing errors
    if (normalizedMessage.includes('pasangan') || normalizedMessage.includes('pairing')) {
      return ErrorCode.ERR_PAIR_001
    }

    // Database errors
    if (
      normalizedMessage.includes('timeout') ||
      normalizedMessage.includes('connection') ||
      normalizedMessage.includes('koneksi')
    ) {
      return ErrorCode.ERR_DB_001
    }

    if (
      normalizedMessage.includes('database') ||
      normalizedMessage.includes('query failed')
    ) {
      return ErrorCode.ERR_DB_002
    }

    // Payment errors
    if (
      normalizedMessage.includes('pembayaran gagal') ||
      normalizedMessage.includes('payment failed')
    ) {
      return ErrorCode.ERR_PAY_001
    }

    // Network errors
    if (
      normalizedMessage.includes('network') ||
      normalizedMessage.includes('fetch') ||
      normalizedMessage.includes('jaringan')
    ) {
      return ErrorCode.ERR_NET_001
    }

    // Authentication errors
    if (
      normalizedMessage.includes('unauthorized') ||
      normalizedMessage.includes('forbidden') ||
      normalizedMessage.includes('otentikasi gagal') ||
      normalizedMessage.includes('otorisasi gagal')
    ) {
      return ErrorCode.ERR_AUTH_001
    }

    // Kasir validation errors
    if (normalizedMessage.includes('kasir tidak ditemukan') || normalizedMessage.includes('kasir tidak aktif')) {
      return ErrorCode.ERR_AUTH_001
    }

    // Validation errors
    if (
      normalizedMessage.includes('validasi') ||
      normalizedMessage.includes('validation') ||
      normalizedMessage.includes('tidak valid')
    ) {
      return ErrorCode.ERR_VAL_001
    }

    return null
  }

  /**
   * Check if error is retryable
   *
   * @param code - Error code
   * @returns Whether the error should be retried
   */
  static isRetryable(code: ErrorCode): boolean {
    return isRetryable(code)
  }

  /**
   * Get retry configuration for error code
   *
   * @param code - Error code
   * @returns Retry configuration or null if not retryable
   */
  static getRetryConfig(code: ErrorCode) {
    return getRetryConfig(code)
  }

  /**
   * Calculate retry delay for specific attempt
   *
   * @param code - Error code
   * @param attempt - Attempt number (1-based)
   * @returns Delay in milliseconds or null if not retryable
   *
   * Example:
   * ```typescript
   * const delay = ErrorService.calculateRetryDelay(ErrorCode.ERR_NET_001, 1) // First retry
   * await new Promise(resolve => setTimeout(resolve, delay))
   * ```
   */
  static calculateRetryDelay(code: ErrorCode, attempt: number): number | null {
    return calculateRetryDelay(code, attempt)
  }

  /**
   * Get user-friendly error message
   *
   * @param code - Error code
   * @param context - Dynamic context variables
   * @returns User-friendly Indonesian message
   */
  static getUserMessage(code: ErrorCode, context: ErrorContext = {}): string {
    return generateErrorMessage(code, context)
  }

  /**
   * Get HTTP status code for error code
   *
   * @param code - Error code
   * @returns HTTP status code
   */
  static getStatusCode(code: ErrorCode): number {
    const statusCodes: Record<ErrorCode, number> = {
      [ErrorCode.ERR_VAL_001]: 400,
      [ErrorCode.ERR_VAL_002]: 400,
      [ErrorCode.ERR_STK_001]: 409,
      [ErrorCode.ERR_STK_002]: 409,
      [ErrorCode.ERR_CUST_001]: 404,
      [ErrorCode.ERR_PROD_001]: 404,
      [ErrorCode.ERR_SIZE_001]: 404,
      [ErrorCode.ERR_DATE_001]: 400,
      [ErrorCode.ERR_DATE_002]: 409,
      [ErrorCode.ERR_PAIR_001]: 400,
      [ErrorCode.ERR_DB_001]: 503,
      [ErrorCode.ERR_DB_002]: 503,
      [ErrorCode.ERR_PAY_001]: 502,
      [ErrorCode.ERR_SYS_001]: 500,
      [ErrorCode.ERR_NET_001]: 503,
      [ErrorCode.ERR_AUTH_001]: 401,
    }

    return statusCodes[code]
  }

  /**
   * Get error category
   *
   * @param code - Error code
   * @returns Error category
   */
  static getCategory(code: ErrorCode): ErrorCategory {
    const categories: Record<ErrorCode, ErrorCategory> = {
      [ErrorCode.ERR_VAL_001]: 'WARNING',
      [ErrorCode.ERR_VAL_002]: 'WARNING',
      [ErrorCode.ERR_STK_001]: 'CRITICAL',
      [ErrorCode.ERR_STK_002]: 'CRITICAL',
      [ErrorCode.ERR_CUST_001]: 'CRITICAL',
      [ErrorCode.ERR_PROD_001]: 'CRITICAL',
      [ErrorCode.ERR_SIZE_001]: 'CRITICAL',
      [ErrorCode.ERR_DATE_001]: 'WARNING',
      [ErrorCode.ERR_DATE_002]: 'WARNING',
      [ErrorCode.ERR_PAIR_001]: 'WARNING',
      [ErrorCode.ERR_DB_001]: 'CRITICAL',
      [ErrorCode.ERR_DB_002]: 'CRITICAL',
      [ErrorCode.ERR_PAY_001]: 'CRITICAL',
      [ErrorCode.ERR_SYS_001]: 'CRITICAL',
      [ErrorCode.ERR_NET_001]: 'CRITICAL',
      [ErrorCode.ERR_AUTH_001]: 'CRITICAL',
    }

    return categories[code]
  }

  /**
   * Type guard for StructuredError
   */
  private static isStructuredError(error: unknown): error is StructuredError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error &&
      'context' in error &&
      'category' in error &&
      'timestamp' in error
    )
  }
}

/**
 * Convenience functions for common error scenarios
 *
 * These provide shorthand methods for frequently used errors
 */

/**
 * Create insufficient stock error
 */
export function createInsufficientStockError(
  productName: string,
  size: string,
  available: number,
  requested: number,
  additionalContext?: { technical?: string; transactionId?: string }
): StructuredError {
  return ErrorService.createError(
    ErrorCode.ERR_STK_001,
    { productName, size, available, requested },
    additionalContext
  )
}

/**
 * Create customer not found error
 */
export function createCustomerNotFoundError(
  additionalContext?: { technical?: string; transactionId?: string }
): StructuredError {
  return ErrorService.createError(ErrorCode.ERR_CUST_001, {}, additionalContext)
}

/**
 * Create database timeout error
 */
export function createDatabaseTimeoutError(
  operation: string,
  duration: number,
  additionalContext?: { technical?: string; transactionId?: string }
): StructuredError {
  return ErrorService.createError(
    ErrorCode.ERR_DB_001,
    { operation, duration },
    additionalContext
  )
}

/**
 * Create date conflict error
 */
export function createDateConflictError(
  transactionCode: string,
  startDate: string,
  endDate: string,
  additionalContext?: { technical?: string; transactionId?: string }
): StructuredError {
  return ErrorService.createError(
    ErrorCode.ERR_DATE_002,
    { transactionCode, startDate, endDate },
    additionalContext
  )
}

/**
 * Create validation error
 */
export function createValidationError(
  field: string,
  additionalContext?: { technical?: string; transactionId?: string }
): StructuredError {
  return ErrorService.createError(ErrorCode.ERR_VAL_001, { field }, additionalContext)
}

/**
 * Create missing required field error
 */
export function createMissingFieldError(
  field: string,
  additionalContext?: { technical?: string; transactionId?: string }
): StructuredError {
  return ErrorService.createError(ErrorCode.ERR_VAL_002, { field }, additionalContext)
}
