/**
 * Resilience Module - Public API Exports
 *
 * Provides resilience utilities for kasir feature operations.
 * Simplified implementation focused on retry mechanism for database operations.
 *
 * Module: features/kasir/lib/resilience
 * Purpose: Task 3 - Retry Handler for Transaction Creation (SIMPLIFIED)
 */

export { RetryHandler, RetryError, createRetryHandler } from './RetryHandler'
export type { RetryHandlerConfig, RetryResult } from './RetryHandler'

/**
 * Helper for easy integration
 *
 * Usage:
 * ```typescript
 * import { createRetryHandler } from './lib/resilience'
 *
 * const retryHandler = createRetryHandler({ maxAttempts: 3 })
 * ```
 */
