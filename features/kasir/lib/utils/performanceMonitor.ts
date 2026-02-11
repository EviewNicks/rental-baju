/**
 * Performance Monitor Utility - TASK 2: Database Optimization
 *
 * Provides performance tracking capabilities for database queries and
 * transaction operations. Helps identify slow queries and measure
 * operation times to meet p95 < 10 seconds requirement.
 *
 * Features:
 * - Query performance tracking with automatic timing
 * - Slow query detection and reporting
 * - Transaction-level performance metrics
 * - Environment-based enabling/disabling
 *
 * @module features/kasir/lib/utils/performanceMonitor
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Query timer for tracking individual query execution
 */
export interface QueryTimer {
  queryName: string
  startTime: number
  metadata?: Record<string, unknown>
}

/**
 * Slow query report with performance details
 */
export interface SlowQueryReport {
  queryName: string
  durationMs: number
  timestamp: Date
  metadata?: Record<string, unknown>
}

/**
 * Transaction performance metrics
 */
export interface TransactionMetrics {
  validationTime: number // Time spent on validation
  stockCheckTime: number // Time spent on stock availability checks
  databaseTime: number // Time spent on database operations
  totalTime: number // Total operation time
  queryCount: number // Number of queries executed
  slowQueries: number // Number of queries exceeding threshold
}

/**
 * Performance monitor configuration
 */
export interface PerformanceMonitorConfig {
  enabled: boolean // Enable/disable monitoring
  slowQueryThreshold: number // Threshold in ms for slow query detection (default: 3000ms)
  logSlowQueries: boolean // Whether to log slow queries to console
  logAllQueries: boolean // Whether to log all queries (useful for debugging)
}

// ============================================================================
// Performance Monitor Class
// ============================================================================

/**
 * Query Performance Monitor
 *
 * Tracks query execution times and identifies slow queries that may
 * need optimization.
 *
 * @example
 * ```typescript
 * const monitor = new QueryPerformanceMonitor({ enabled: true })
 * const timer = monitor.startQuery('getProductSizes')
 * // ... execute query ...
 * monitor.endQuery(timer)
 * const slowQueries = monitor.getSlowQueries(3000)
 * ```
 */
export class QueryPerformanceMonitor {
  private queryTimers: Map<string, QueryTimer[]> = new Map()
  private completedQueries: SlowQueryReport[] = []
  private config: PerformanceMonitorConfig

  constructor(config?: Partial<PerformanceMonitorConfig>) {
    this.config = {
      enabled: config?.enabled ?? process.env.NODE_ENV !== 'production',
      slowQueryThreshold: config?.slowQueryThreshold ?? 3000,
      logSlowQueries: config?.logSlowQueries ?? true,
      logAllQueries: config?.logAllQueries ?? false,
    }
  }

  /**
   * Start timing a query
   *
   * @param queryName - Name/identifier for the query
   * @param metadata - Optional metadata to attach to the query
   * @returns Query timer object
   */
  startQuery(queryName: string, metadata?: Record<string, unknown>): QueryTimer {
    if (!this.config.enabled) {
      return { queryName, startTime: 0, metadata }
    }

    const timer: QueryTimer = {
      queryName,
      startTime: Date.now(),
      metadata,
    }

    // Store timer for later retrieval
    if (!this.queryTimers.has(queryName)) {
      this.queryTimers.set(queryName, [])
    }
    this.queryTimers.get(queryName)!.push(timer)

    return timer
  }

  /**
   * End timing a query and record its duration
   *
   * @param timer - Timer object returned from startQuery
   * @returns Duration in milliseconds
   */
  endQuery(timer: QueryTimer): number {
    if (!this.config.enabled || timer.startTime === 0) {
      return 0
    }

    const duration = Date.now() - timer.startTime

    const report: SlowQueryReport = {
      queryName: timer.queryName,
      durationMs: duration,
      timestamp: new Date(),
      metadata: timer.metadata,
    }

    this.completedQueries.push(report)

    // Log if configured
    if (this.config.logAllQueries) {
      console.log(`[Query] ${timer.queryName}: ${duration}ms`)
    } else if (this.config.logSlowQueries && duration > this.config.slowQueryThreshold) {
      console.warn(
        `[Slow Query] ${timer.queryName}: ${duration}ms (threshold: ${this.config.slowQueryThreshold}ms)`
      )
    }

    return duration
  }

  /**
   * Get all slow queries exceeding the threshold
   *
   * @param thresholdMs - Threshold in milliseconds (default: config value)
   * @returns Array of slow query reports
   */
  getSlowQueries(thresholdMs?: number): SlowQueryReport[] {
    const threshold = thresholdMs ?? this.config.slowQueryThreshold
    return this.completedQueries.filter((q) => q.durationMs > threshold)
  }

  /**
   * Get performance statistics
   *
   * @returns Performance statistics
   */
  getStats() {
    const queries = this.completedQueries
    const totalQueries = queries.length
    const totalTime = queries.reduce((sum, q) => sum + q.durationMs, 0)
    const avgTime = totalQueries / (totalQueries || 1)
    const maxTime = Math.max(0, ...queries.map((q) => q.durationMs))
    const minTime = Math.min(Infinity, ...queries.map((q) => q.durationMs))

    // Group by query name
    const byQueryName = new Map<string, number[]>()
    for (const query of queries) {
      if (!byQueryName.has(query.queryName)) {
        byQueryName.set(query.queryName, [])
      }
      byQueryName.get(query.queryName)!.push(query.durationMs)
    }

    // Calculate stats per query
    const queryStats = Array.from(byQueryName.entries()).map(([name, durations]) => {
      const sum = durations.reduce((a, b) => a + b, 0)
      return {
        queryName: name,
        count: durations.length,
        totalTime: sum,
        avgTime: sum / durations.length,
        maxTime: Math.max(...durations),
      }
    })

    return {
      totalQueries,
      totalTime,
      avgTime,
      maxTime,
      minTime: minTime === Infinity ? 0 : minTime,
      slowQueries: this.getSlowQueries().length,
      queryStats,
    }
  }

  /**
   * Clear all recorded queries
   */
  clear(): void {
    this.queryTimers.clear()
    this.completedQueries = []
  }

  /**
   * Check if monitoring is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled
  }
}

// ============================================================================
// Transaction Timer Class
// ============================================================================

/**
 * Transaction Performance Timer
 *
 * Tracks individual operation timings for a complete transaction.
 * Helps identify which operations are bottlenecks.
 *
 * @example
 * ```typescript
 * const timer = new TransactionTimer()
 * timer.startValidation()
 * // ... perform validation ...
 * timer.endValidation()
 * timer.startStockCheck()
 * // ... check stock ...
 * timer.endStockCheck()
 * const metrics = timer.getMetrics()
 * ```
 */
export class TransactionTimer {
  private timings: Map<string, number> = new Map()
  private queryCount: number = 0
  private slowQueryCount: number = 0
  private startTime: number = 0
  private monitor?: QueryPerformanceMonitor

  constructor(monitor?: QueryPerformanceMonitor) {
    this.monitor = monitor
    this.startTime = Date.now()
  }

  /**
   * Start timing validation operation
   */
  startValidation(): void {
    this.timings.set('validation_start', Date.now())
  }

  /**
   * End timing validation operation
   */
  endValidation(): void {
    const start = this.timings.get('validation_start')
    if (start) {
      this.timings.set('validation', Date.now() - start)
    }
  }

  /**
   * Start timing stock check operation
   */
  startStockCheck(): void {
    this.timings.set('stock_check_start', Date.now())
  }

  /**
   * End timing stock check operation
   */
  endStockCheck(): void {
    const start = this.timings.get('stock_check_start')
    if (start) {
      this.timings.set('stock_check', Date.now() - start)
    }
  }

  /**
   * Start timing database operation
   */
  startDatabase(): void {
    this.timings.set('database_start', Date.now())
  }

  /**
   * End timing database operation
   */
  endDatabase(): void {
    const start = this.timings.get('database_start')
    if (start) {
      this.timings.set('database', Date.now() - start)
    }
  }

  /**
   * Record a query execution
   */
  recordQuery(durationMs: number): void {
    this.queryCount++
    if (durationMs > 3000) {
      this.slowQueryCount++
    }
  }

  /**
   * Get total transaction time
   */
  getTotalTime(): number {
    return Date.now() - this.startTime
  }

  /**
   * Get complete metrics for this transaction
   */
  getMetrics(): TransactionMetrics {
    const validationTime = this.timings.get('validation') || 0
    const stockCheckTime = this.timings.get('stock_check') || 0
    const databaseTime = this.timings.get('database') || 0
    const totalTime = this.getTotalTime()

    return {
      validationTime,
      stockCheckTime,
      databaseTime,
      totalTime,
      queryCount: this.queryCount,
      slowQueries: this.slowQueryCount,
    }
  }

  /**
   * Get a summary string for logging
   */
  getSummary(): string {
    const metrics = this.getMetrics()
    return `Transaction completed in ${metrics.totalTime}ms ` +
      `(validation: ${metrics.validationTime}ms, ` +
      `stock: ${metrics.stockCheckTime}ms, ` +
      `database: ${metrics.databaseTime}ms, ` +
      `queries: ${metrics.queryCount}, ` +
      `slow: ${metrics.slowQueries})`
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Measure performance of an async operation
 *
 * @param operation - Async function to measure
 * @param monitor - Optional performance monitor
 * @param operationName - Name of the operation for tracking
 * @returns Result with timing information
 */
export async function measureOperation<T>(
  operation: () => Promise<T>,
  monitor?: QueryPerformanceMonitor,
  operationName?: string
): Promise<{ result: T; duration: number }> {
  const timer = monitor?.startQuery(operationName || 'operation')
  const startTime = Date.now()

  try {
    const result = await operation()
    const duration = Date.now() - startTime

    if (timer && monitor) {
      monitor.endQuery(timer)
    }

    return { result, duration }
  } catch (error) {
    if (timer && monitor) {
      monitor.endQuery(timer)
    }
    throw error
  }
}

/**
 * Create a performance monitor instance with default config
 *
 * @param config - Optional partial config
 * @returns QueryPerformanceMonitor instance
 */
export function createPerformanceMonitor(
  config?: Partial<PerformanceMonitorConfig>
): QueryPerformanceMonitor {
  return new QueryPerformanceMonitor(config)
}

/**
 * Create a transaction timer instance
 *
 * @param monitor - Optional performance monitor to attach
 * @returns TransactionTimer instance
 */
export function createTransactionTimer(
  monitor?: QueryPerformanceMonitor
): TransactionTimer {
  return new TransactionTimer(monitor)
}
