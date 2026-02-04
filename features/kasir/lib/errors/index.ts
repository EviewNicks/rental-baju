/**
 * Error Handling System - Barrel Export
 *
 * Unified error handling for kasir feature.
 * Provides 16 standardized error codes with Indonesian localization.
 *
 * Requirements: 1.1, 1.2, 9.1, 9.2, 9.3, 13.1, 13.2, 13.3, 13.4, 13.5
 *
 * @example
 * ```typescript
 * import { ErrorService, ErrorCode } from '@/features/kasir/lib/errors'
 *
 * // Create error
 * const error = ErrorService.createError(ErrorCode.ERR_STK_001, {
 *   productName: 'Jas M Hitam',
 *   size: 'L',
 *   available: 2,
 *   requested: 5
 * })
 *
 * // Create API response
 * return ErrorService.createErrorResponse(ErrorCode.ERR_STK_001, {
 *   productName: 'Jas M Hitam',
 *   size: 'L',
 *   available: 2,
 *   requested: 5
 * })
 * ```
 */

// ============================================================================
// Types & Enums (from errorTypes.ts)
// ============================================================================

// Export all from errorTypes
export {
  ErrorCode,
  ERROR_STATUS_CODES,
  ERROR_CATEGORIES,
  isErrorCode,
  getErrorCategory,
  getErrorStatusCode,
} from './errorTypes'

// Export types from errorTypes
export type {
  ErrorCategory,
  ErrorContext,
  StructuredError,
  ErrorResponse,
} from './errorTypes'

// ============================================================================
// Error Templates (from errorTemplates.ts)
// ============================================================================

// Export all from errorTemplates
export {
  getErrorTemplate,
  generateErrorMessage,
  generateErrorActions,
  ERROR_TEMPLATES,
  RETRY_CONFIGS,
  isRetryable,
  getRetryConfig,
  calculateRetryDelay,
} from './errorTemplates'

// ============================================================================
// Error Service (from ErrorService.ts)
// ============================================================================

// Export all from ErrorService
export {
  ErrorService,
  createInsufficientStockError,
  createCustomerNotFoundError,
  createDatabaseTimeoutError,
  createDateConflictError,
  createValidationError,
  createMissingFieldError,
} from './ErrorService'

// ============================================================================
// Legacy Compatibility (availabilityErrors.ts)
// ============================================================================

// Re-export from legacy availabilityErrors for backward compatibility
export {
  AvailabilityErrorType,
  createAvailabilityError,
  determineErrorType,
  calculateRetryDelay as legacyCalculateRetryDelay,
  shouldRetry,
} from './availabilityErrors'

export type { AvailabilityError, RetryConfig } from './availabilityErrors'

// Export ERROR_MESSAGES from legacy
export { ERROR_MESSAGES } from './availabilityErrors'

// Export RETRY_CONFIGS from legacy with different name to avoid conflict
export { RETRY_CONFIGS as LEGACY_AVAILABILITY_RETRY_CONFIGS } from './availabilityErrors'
