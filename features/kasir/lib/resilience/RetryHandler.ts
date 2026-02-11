/**
 * RetryHandler - Simplified retry mechanism for database operations
 *
 * Provides exponential backoff retry logic for transient database errors.
 * Focus on practical retry for database queries in transaction creation.
 *
 * Scope (SIMPLIFIED):
 * - No Circuit Breaker implementation (deferred to Phase 2)
 * - No complex configuration (use hardcoded defaults)
 * - No state persistence
 *
 * Requirements: Task 3 (SIMPLIFIED) - Retry Handler for Transaction Creation
 */

/**
 * Retry handler configuration
 */
export interface RetryHandlerConfig {
  maxAttempts?: number  // Default: 3
  baseDelay?: number    // Default: 100ms
  maxDelay?: number     // Default: 1000ms
}

/**
 * Retry result metadata
 */
export interface RetryResult<T> {
  data: T
  attempts: number
  totalDelay: number
}

/**
 * Retry error with metadata
 */
export class RetryError extends Error {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly lastError: Error,
    public readonly totalDelay: number
  ) {
    super(message)
    this.name = 'RetryError'
  }
}

/**
 * RetryHandler - Simple exponential backoff retry mechanism
 *
 * Features:
 * - Exponential backoff: 100ms → 200ms → 400ms
 * - Custom retry logic via callback
 * - Simple and focused implementation
 */
export class RetryHandler {
  private readonly maxAttempts: number
  private readonly baseDelay: number
  private readonly maxDelay: number

  constructor(config: RetryHandlerConfig = {}) {
    this.maxAttempts = config.maxAttempts ?? 3
    this.baseDelay = config.baseDelay ?? 100
    this.maxDelay = config.maxDelay ?? 1000
  }

  /**
   * Execute operation with retry logic
   *
   * @param operation - Async operation to execute
   * @param isRetryableFn - Optional custom retry logic (returns true if error is retryable)
   * @returns Operation result with retry metadata
   * @throws RetryError if all attempts fail
   */
  async execute<T>(
    operation: () => Promise<T>,
    isRetryableFn?: (error: Error) => boolean
  ): Promise<T> {
    let lastError: Error | null = null
    let totalDelay = 0

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        // Execute operation
        const result = await operation()

        // Log successful retry if not first attempt
        if (attempt > 1) {
          console.log('[RetryHandler] Operation succeeded after retry', {
            attempt,
            totalDelay,
            timestamp: new Date().toISOString(),
          })
        }

        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // Check if error is retryable
        const isRetryable = isRetryableFn
          ? isRetryableFn(lastError)
          : this.isDefaultRetryable(lastError)

        // If not retryable or last attempt, throw immediately
        if (!isRetryable || attempt === this.maxAttempts) {
          break
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt)
        totalDelay += delay

        // Log retry attempt
        console.warn('[RetryHandler] Retrying operation', {
          attempt,
          maxAttempts: this.maxAttempts,
          delay,
          totalDelay,
          error: lastError.message,
          timestamp: new Date().toISOString(),
        })

        // Wait before next attempt
        await this.sleep(delay)
      }
    }

    // All attempts failed
    throw new RetryError(
      `Operation failed after ${this.maxAttempts} attempts`,
      this.maxAttempts,
      lastError!,
      totalDelay
    )
  }

  /**
   * Calculate delay with exponential backoff
   * Pattern: 100ms → 200ms → 400ms (capped at maxDelay)
   *
   * @param attempt - Current attempt number (1-based)
   * @returns Delay in milliseconds
   */
  private calculateDelay(attempt: number): number {
    // Exponential backoff: baseDelay * (2 ^ (attempt - 1))
    const exponentialDelay = this.baseDelay * Math.pow(2, attempt - 1)

    // Cap at maxDelay
    return Math.min(exponentialDelay, this.maxDelay)
  }

  /**
   * Default retryable error detection
   * Retries on transient database errors (timeout, connection, lock)
   *
   * @param error - Error to check
   * @returns True if error is retryable
   */
  private isDefaultRetryable(error: Error): boolean {
    const message = error.message.toLowerCase()

    // Retry on transient database errors
    const retryablePatterns = [
      'timeout',
      'connection',
      'database',
      'network',
      'temporarily',
      'unavailable',
      'lock',
      'deadlock',
    ]

    return retryablePatterns.some((pattern) => message.includes(pattern))
  }

  /**
   * Sleep for specified milliseconds
   *
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Get current configuration
   */
  getConfig(): RetryHandlerConfig {
    return {
      maxAttempts: this.maxAttempts,
      baseDelay: this.baseDelay,
      maxDelay: this.maxDelay,
    }
  }
}

/**
 * Helper function to create RetryHandler instance
 *
 * @param config - Optional configuration
 * @returns Configured RetryHandler instance
 */
export function createRetryHandler(config?: RetryHandlerConfig): RetryHandler {
  return new RetryHandler(config)
}
