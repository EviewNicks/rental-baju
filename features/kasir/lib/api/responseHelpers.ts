/**
 * API Response Helpers
 * Centralized response formatting for consistent API responses
 *
 * Enhanced with unified ErrorService integration for standardized error responses
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { createSuccessResponse } from '../../types'
import { ErrorService, ErrorCode } from '../errors/ErrorService'
import type { ErrorContext } from '../errors/errorTypes'

export function unauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,
      error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
    },
    { status: 401 },
  )
}

export function successResponse(data: unknown, message = 'Success', statusCode = 200) {
  const { response, status } = createSuccessResponse(data, message, statusCode)
  return NextResponse.json(response, { status })
}

export function validationErrorResponse(error: ZodError) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'Data tidak valid',
        code: 'VALIDATION_ERROR',
        details: error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      },
    },
    { status: 400 },
  )
}

export function notFoundResponse(message: string) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code: 'NOT_FOUND',
      },
    },
    { status: 404 },
  )
}

export function businessErrorResponse(message: string, code = 'BUSINESS_ERROR') {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
      },
    },
    { status: 400 },
  )
}

export function availabilityErrorResponse(message: string) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code: 'AVAILABILITY_ERROR',
      },
    },
    { status: 409 },
  )
}

export function connectionErrorResponse() {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'Database connection timeout. Please try again.',
        code: 'CONNECTION_ERROR',
      },
    },
    { status: 503 },
  )
}

export function internalErrorResponse() {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    },
    { status: 500 },
  )
}

/**
 * Unified error handler for transaction operations
 *
 * Enhanced with ErrorService integration for standardized error responses
 * Maintains backward compatibility with existing error patterns
 *
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
 */
export function handleTransaksiError(error: unknown) {
  // Validation errors from Zod
  if (error instanceof ZodError) {
    return validationErrorResponse(error)
  }

  // Convert to structured error using ErrorService
  const structuredError = ErrorService.fromError(error)

  // Return standardized error response
  return ErrorService.createErrorResponse(
    structuredError.code as ErrorCode,
    structuredError.context,
    {
      technical: structuredError.technical,
      transactionId: structuredError.transactionId,
    }
  )
}

// ============================================================================
// NEW CONVENIENCE HELPERS
// ============================================================================

/**
 * Generic error response using ErrorService
 *
 * @param code - Error code from ErrorCode enum
 * @param context - Dynamic context variables
 * @param additionalContext - Optional technical details and transaction ID
 *
 * Example:
 * ```typescript
 * return errorResponse(ErrorCode.ERR_STK_001, {
 *   productName: 'Jas M Hitam',
 *   size: 'L',
 *   available: 2,
 *   requested: 5
 * })
 * ```
 */
export function errorResponse(
  code: ErrorCode,
  context: ErrorContext = {},
  additionalContext?: { technical?: string; transactionId?: string }
) {
  return ErrorService.createErrorResponse(code, context, additionalContext)
}

/**
 * Stock insufficient error response
 *
 * @param productName - Product name
 * @param size - Product size
 * @param available - Available quantity
 * @param requested - Requested quantity
 *
 * Example:
 * ```typescript
 * if (stock < requested) {
 *   return stockInsufficientError('Jas M Hitam', 'L', 2, 5)
 * }
 * ```
 */
export function stockInsufficientError(
  productName: string,
  size: string,
  available: number,
  requested: number
) {
  return ErrorService.createErrorResponse(ErrorCode.ERR_STK_001, {
    productName,
    size,
    available,
    requested,
  })
}

/**
 * Customer not found error response
 *
 * @param customerId - Optional customer ID for technical details
 *
 * Example:
 * ```typescript
 * if (!customer) {
 *   return customerNotFoundError(customerId)
 * }
 * ```
 */
export function customerNotFoundError(customerId?: string) {
  return ErrorService.createErrorResponse(
    ErrorCode.ERR_CUST_001,
    {},
    { technical: customerId ? `Customer ID: ${customerId}` : undefined }
  )
}

/**
 * Database timeout error response
 *
 * @param operation - Operation that timed out
 * @param duration - Timeout duration in milliseconds
 *
 * Example:
 * ```typescript
 * try {
 *   await db.transaction()
 * } catch (error) {
 *   return databaseTimeoutError('createTransaction', 20000)
 * }
 * ```
 */
export function databaseTimeoutError(operation: string, duration: number) {
  return ErrorService.createErrorResponse(ErrorCode.ERR_DB_001, {
    operation,
    duration,
  })
}

/**
 * Date conflict error response
 *
 * @param transactionCode - Conflicting transaction code
 * @param startDate - Conflict start date
 * @param endDate - Conflict end date
 *
 * Example:
 * ```typescript
 * if (hasDateConflict) {
 *   return dateConflictError('TRX-001', '01/08/2025', '05/08/2025')
 * }
 * ```
 */
export function dateConflictError(transactionCode: string, startDate: string, endDate: string) {
  return ErrorService.createErrorResponse(ErrorCode.ERR_DATE_002, {
    transactionCode,
    startDate,
    endDate,
  })
}

/**
 * Validation error response for single field
 *
 * @param field - Field name that failed validation
 * @param message - Optional validation error message
 *
 * Example:
 * ```typescript
 * if (!email) {
 *   return fieldValidationError('email', 'Email is required')
 * }
 * ```
 */
export function fieldValidationError(field: string, message?: string) {
  return ErrorService.createErrorResponse(
    ErrorCode.ERR_VAL_001,
    { field },
    { technical: message }
  )
}

/**
 * Missing required field error response
 *
 * @param field - Missing field name
 *
 * Example:
 * ```typescript
 * if (!customerName) {
 *   return missingFieldError('customerName')
 * }
 * ```
 */
export function missingFieldError(field: string) {
  return ErrorService.createErrorResponse(ErrorCode.ERR_VAL_002, { field })
}

/**
 * Product not found error response
 *
 * @param productName - Product name
 *
 * Example:
 * ```typescript
 * if (!product) {
 *   return productNotFoundError('Jas M Hitam')
 * }
 * ```
 */
export function productNotFoundError(productName?: string) {
  return ErrorService.createErrorResponse(
    ErrorCode.ERR_PROD_001,
    { productName: productName ?? 'Produk' }
  )
}

/**
 * Product size not found error response
 *
 * @param size - Size name
 * @param productName - Product name
 *
 * Example:
 * ```typescript
 * if (!productSize) {
 *   return sizeNotFoundError('L', 'Jas M Hitam')
 * }
 * ```
 */
export function sizeNotFoundError(size: string, productName?: string) {
  return ErrorService.createErrorResponse(ErrorCode.ERR_SIZE_001, {
    size,
    productName: productName ?? 'Produk',
  })
}

/**
 * Payment failed error response
 *
 * @param reason - Failure reason
 *
 * Example:
 * ```typescript
 * if (paymentFailed) {
 *   return paymentFailedError('Connection timeout')
 * }
 * ```
 */
export function paymentFailedError(reason: string) {
  return ErrorService.createErrorResponse(ErrorCode.ERR_PAY_001, { reason })
}

/**
 * Network error response
 *
 * Example:
 * ```typescript
 * } catch (error) {
 *   return networkError()
 * }
 * ```
 */
export function networkError() {
  return ErrorService.createErrorResponse(ErrorCode.ERR_NET_001, {})
}
