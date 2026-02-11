/**
 * Error Type Definitions
 *
 * Core type definitions for the unified error handling system.
 * Provides 16 standardized error codes and structured error interfaces.
 *
 * Requirements: 1.1, 1.2, 9.1, 9.2, 9.3, 13.1, 13.2, 13.3, 13.4, 13.5
 */

/**
 * Standard Error Codes
 *
 * 16 error codes covering all transaction error scenarios from R9
 */
export enum ErrorCode {
  // Validation Errors
  ERR_VAL_001 = 'ERR_VAL_001', // Field validation failed
  ERR_VAL_002 = 'ERR_VAL_002', // Required field missing

  // Stock Errors
  ERR_STK_001 = 'ERR_STK_001', // Insufficient stock for requested quantity
  ERR_STK_002 = 'ERR_STK_002', // Product out of stock

  // Customer Errors
  ERR_CUST_001 = 'ERR_CUST_001', // Customer not found

  // Product Errors
  ERR_PROD_001 = 'ERR_PROD_001', // Product not found or inactive
  ERR_SIZE_001 = 'ERR_SIZE_001', // Product size not found or inactive

  // Date Errors
  ERR_DATE_001 = 'ERR_DATE_001', // Invalid date selected
  ERR_DATE_002 = 'ERR_DATE_002', // Date conflict with existing transaction

  // Pairing Errors
  ERR_PAIR_001 = 'ERR_PAIR_001', // Jas-Sarung pairing validation failed

  // Database Errors
  ERR_DB_001 = 'ERR_DB_001', // Database connection timeout
  ERR_DB_002 = 'ERR_DB_002', // Database query failed

  // Payment Errors
  ERR_PAY_001 = 'ERR_PAY_001', // Payment processing failed

  // System Errors
  ERR_SYS_001 = 'ERR_SYS_001', // Internal system error

  // Network Errors
  ERR_NET_001 = 'ERR_NET_001', // Network request failed

  // Authentication Errors
  ERR_AUTH_001 = 'ERR_AUTH_001', // Authentication or authorization failed
}

/**
 * Error Category
 *
 * Classifies errors by severity and user impact
 */
export type ErrorCategory = 'CRITICAL' | 'WARNING' | 'INFO'

/**
 * Error Context
 *
 * Dynamic variables that can be included in error messages
 */
export interface ErrorContext {
  // Product related
  productName?: string
  productId?: string
  size?: string
  available?: number
  requested?: number

  // Transaction related
  transactionCode?: string
  transactionId?: string
  startDate?: string
  endDate?: string
  minDate?: string

  // Customer related
  customerId?: string
  customerName?: string

  // Field related
  field?: string
  fields?: string[]

  // System related
  operation?: string
  duration?: number
  reason?: string

  // Pairing related
  jasName?: string
  sarungName?: string

  // Additional context
  [key: string]: unknown
}

/**
 * Structured Error
 *
 * Complete error information with context, category, and actions
 */
export interface StructuredError {
  code: string
  message: string // User-friendly Indonesian message
  technical?: string // Dev-only details
  context: ErrorContext
  category: ErrorCategory
  actions?: string[]
  transactionId?: string
  timestamp: string
}

/**
 * API Error Response Format
 *
 * Standardized error response for all API endpoints
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
 */
export interface ErrorResponse {
  success: false
  error: StructuredError
}

/**
 * HTTP Status Code Mapping
 *
 * Maps each error code to appropriate HTTP status code
 */
export const ERROR_STATUS_CODES: Record<ErrorCode, number> = {
  // Validation Errors → 400 Bad Request
  [ErrorCode.ERR_VAL_001]: 400,
  [ErrorCode.ERR_VAL_002]: 400,

  // Stock Errors → 409 Conflict (business logic constraint)
  [ErrorCode.ERR_STK_001]: 409,
  [ErrorCode.ERR_STK_002]: 409,

  // Customer Not Found → 404 Not Found
  [ErrorCode.ERR_CUST_001]: 404,

  // Product Errors → 404 Not Found
  [ErrorCode.ERR_PROD_001]: 404,
  [ErrorCode.ERR_SIZE_001]: 404,

  // Date Errors → 400 Bad Request (invalid input) or 409 Conflict
  [ErrorCode.ERR_DATE_001]: 400,
  [ErrorCode.ERR_DATE_002]: 409,

  // Pairing Error → 400 Bad Request
  [ErrorCode.ERR_PAIR_001]: 400,

  // Database Errors → 503 Service Unavailable
  [ErrorCode.ERR_DB_001]: 503,
  [ErrorCode.ERR_DB_002]: 503,

  // Payment Error → 502 Bad Gateway (payment service)
  [ErrorCode.ERR_PAY_001]: 502,

  // System Error → 500 Internal Server Error
  [ErrorCode.ERR_SYS_001]: 500,

  // Network Error → 503 Service Unavailable
  [ErrorCode.ERR_NET_001]: 503,

  // Authentication Error → 401 Unauthorized
  [ErrorCode.ERR_AUTH_001]: 401,
} as const

/**
 * Error Category Mapping
 *
 * Maps each error code to its default category
 */
export const ERROR_CATEGORIES: Record<ErrorCode, ErrorCategory> = {
  // Validation Errors → WARNING (user can fix)
  [ErrorCode.ERR_VAL_001]: 'WARNING',
  [ErrorCode.ERR_VAL_002]: 'WARNING',

  // Stock Errors → CRITICAL (blocks transaction)
  [ErrorCode.ERR_STK_001]: 'CRITICAL',
  [ErrorCode.ERR_STK_002]: 'CRITICAL',

  // Customer Not Found → CRITICAL (blocks transaction)
  [ErrorCode.ERR_CUST_001]: 'CRITICAL',

  // Product Errors → CRITICAL (blocks transaction)
  [ErrorCode.ERR_PROD_001]: 'CRITICAL',
  [ErrorCode.ERR_SIZE_001]: 'CRITICAL',

  // Date Errors → WARNING (user can change dates)
  [ErrorCode.ERR_DATE_001]: 'WARNING',
  [ErrorCode.ERR_DATE_002]: 'WARNING',

  // Pairing Error → WARNING (user can fix)
  [ErrorCode.ERR_PAIR_001]: 'WARNING',

  // Database Errors → CRITICAL (system issue)
  [ErrorCode.ERR_DB_001]: 'CRITICAL',
  [ErrorCode.ERR_DB_002]: 'CRITICAL',

  // Payment Error → CRITICAL (transaction impact)
  [ErrorCode.ERR_PAY_001]: 'CRITICAL',

  // System Error → CRITICAL (system issue)
  [ErrorCode.ERR_SYS_001]: 'CRITICAL',

  // Network Error → CRITICAL (connectivity issue)
  [ErrorCode.ERR_NET_001]: 'CRITICAL',

  // Authentication Error → CRITICAL (access issue)
  [ErrorCode.ERR_AUTH_001]: 'CRITICAL',
} as const

/**
 * Type guard for ErrorCode
 */
export function isErrorCode(value: string): value is ErrorCode {
  return Object.values(ErrorCode).includes(value as ErrorCode)
}

/**
 * Get category for error code
 */
export function getErrorCategory(code: ErrorCode): ErrorCategory {
  return ERROR_CATEGORIES[code]
}

/**
 * Get HTTP status code for error code
 */
export function getErrorStatusCode(code: ErrorCode): number {
  return ERROR_STATUS_CODES[code]
}
