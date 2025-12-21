/**
 * Error Suppression Utility
 * Mengurangi spam error logging untuk error yang berulang
 */

interface ErrorCacheEntry {
  count: number
  lastSeen: number
  firstSeen: number
}

class ErrorSuppressor {
  private cache = new Map<string, ErrorCacheEntry>()
  private readonly CACHE_DURATION = 30000 // 30 detik
  private readonly MAX_SAME_ERROR_COUNT = 3 // Maksimal 3 kali error yang sama
  private readonly CLEANUP_INTERVAL = 60000 // Cleanup setiap 1 menit

  constructor() {
    // Cleanup cache secara berkala
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanupCache(), this.CLEANUP_INTERVAL)
    }
  }

  /**
   * Cek apakah error harus di-suppress
   */
  shouldSuppress(error: Error | string): boolean {
    const errorMessage = typeof error === 'string' ? error : error.message
    const errorName = typeof error === 'string' ? 'Error' : error.name

    // Khusus untuk TimeoutError
    if (errorName === 'TimeoutError' || errorMessage.includes('timeout') || errorMessage.includes('abort')) {
      return this.checkAndUpdateCache(`timeout_${errorMessage.substring(0, 100)}`)
    }

    // Untuk error lain yang berulang
    if (this.isRepetitiveError(errorMessage)) {
      return this.checkAndUpdateCache(`generic_${errorMessage.substring(0, 100)}`)
    }

    return false
  }

  /**
   * Cek apakah error termasuk repetitive
   */
  private isRepetitiveError(message: string): boolean {
    const repetitivePatterns = [
      'The operation was aborted due to timeout',
      'fetch failed',
      'network error',
      'connection timeout',
      'ECONNRESET',
      'ETIMEDOUT'
    ]

    return repetitivePatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    )
  }

  /**
   * Cek cache dan update jika perlu
   */
  private checkAndUpdateCache(cacheKey: string): boolean {
    const now = Date.now()
    const cached = this.cache.get(cacheKey)

    if (cached) {
      // Jika masih dalam periode cache dan sudah mencapai batas maksimal
      if (now - cached.firstSeen < this.CACHE_DURATION && cached.count >= this.MAX_SAME_ERROR_COUNT) {
        // Update lastSeen tapi jangan tambah count
        this.cache.set(cacheKey, { 
          ...cached,
          lastSeen: now 
        })
        return true // Suppress error ini
      }
      
      // Update cache
      this.cache.set(cacheKey, { 
        count: cached.count + 1, 
        lastSeen: now,
        firstSeen: cached.firstSeen
      })
    } else {
      // Tambah ke cache
      this.cache.set(cacheKey, { 
        count: 1, 
        lastSeen: now,
        firstSeen: now
      })
    }

    return false
  }

  /**
   * Bersihkan cache yang sudah expired
   */
  private cleanupCache(): void {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now - value.lastSeen > this.CACHE_DURATION) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get statistics untuk debugging
   */
  getStats(): { totalCached: number; suppressedErrors: string[] } {
    const suppressedErrors: string[] = []
    const now = Date.now()

    for (const [key, value] of this.cache.entries()) {
      if (value.count >= this.MAX_SAME_ERROR_COUNT && now - value.firstSeen < this.CACHE_DURATION) {
        suppressedErrors.push(key)
      }
    }

    return {
      totalCached: this.cache.size,
      suppressedErrors
    }
  }

  /**
   * Reset cache (untuk testing)
   */
  reset(): void {
    this.cache.clear()
  }
}

// Singleton instance
export const errorSuppressor = new ErrorSuppressor()

/**
 * Wrapper untuk console.error yang mengurangi spam
 */
export function suppressedConsoleError(error: Error | string, ...args: unknown[]): void {
  if (!errorSuppressor.shouldSuppress(error)) {
    console.error(error, ...args)
  }
}

/**
 * Wrapper untuk logger.error yang mengurangi spam
 */
export function suppressedLoggerError(
  logger: { error: (context: string, functionName: string, message: string, error?: Error) => void },
  context: string,
  functionName: string,
  message: string,
  error?: Error
): void {
  if (error && !errorSuppressor.shouldSuppress(error)) {
    logger.error(context, functionName, message, error)
  } else if (!error) {
    logger.error(context, functionName, message)
  }
}