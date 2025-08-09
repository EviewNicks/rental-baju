/**
 * Kasir Frontend Logger Service
 * Client-side logging optimized for kasir feature debugging
 * Extends base logger with kasir-specific contexts and controlled output
 */

import { logger as baseLogger } from '../../../services/logger'

// Environment-based debug control
const isDevelopment = process.env.NODE_ENV === 'development'
const isDebugEnabled = isDevelopment && (
  process.env.NEXT_PUBLIC_KASIR_DEBUG === 'true' ||
  typeof window !== 'undefined' && localStorage?.getItem('kasir-debug') === 'true'
)

// Log levels for kasir feature
const KASIR_LOG_LEVELS = {
  ERROR: 0,
  WARN: 1, 
  INFO: 2,
  DEBUG: 3
} as const

type LogLevel = keyof typeof KASIR_LOG_LEVELS

// Current log level (INFO in development, ERROR in production)
const currentLogLevel: LogLevel = isDevelopment ? 'DEBUG' : 'ERROR'

// Check if log level should be output
const shouldLog = (level: LogLevel): boolean => {
  return KASIR_LOG_LEVELS[level] <= KASIR_LOG_LEVELS[currentLogLevel]
}

// Kasir-specific contexts
export const KASIR_CONTEXTS = {
  RETURN_PROCESS: 'kasir:return-process',
  PENALTY_CALC: 'kasir:penalty-calc', 
  API_CALLS: 'kasir:api-calls',
  USER_INTERACTION: 'kasir:ui-interaction',
  STATE_MANAGEMENT: 'kasir:state-mgmt',
  VALIDATION: 'kasir:validation',
  PERFORMANCE: 'kasir:performance'
} as const

// Performance tracking utilities
interface PerformanceTimer {
  end: (message?: string, data?: Record<string, unknown>) => number
}

// Kasir logger interface
interface KasirLogger {
  debug: (context: string, functionName: string, message: string, data?: Record<string, unknown>) => void
  info: (context: string, functionName: string, message: string, data?: Record<string, unknown>) => void
  warn: (context: string, functionName: string, message: string, data?: Record<string, unknown>) => void
  error: (context: string, functionName: string, message: string, error?: Error | Record<string, unknown>) => void
  startTimer: (context: string, functionName: string, label: string) => PerformanceTimer
  
  // Kasir-specific convenience methods
  returnProcess: KasirContextLogger
  penaltyCalc: KasirContextLogger
  apiCalls: KasirContextLogger
  userInteraction: KasirContextLogger
  stateManagement: KasirContextLogger
  validation: KasirContextLogger
  performance: KasirContextLogger
}

interface KasirContextLogger {
  debug: (functionName: string, message: string, data?: Record<string, unknown>) => void
  info: (functionName: string, message: string, data?: Record<string, unknown>) => void
  warn: (functionName: string, message: string, data?: Record<string, unknown>) => void
  error: (functionName: string, message: string, error?: Error | Record<string, unknown>) => void
  startTimer: (functionName: string, label: string) => PerformanceTimer
}

// Filter sensitive data from logs
const sanitizeLogData = (data?: Record<string, unknown>): Record<string, unknown> | undefined => {
  if (!data) return undefined
  
  const sanitized = { ...data }
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'auth', 'key', 'secret']
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]'
    }
  })
  
  return sanitized
}

// Create kasir logger implementation
export const kasirLogger: KasirLogger = {
  debug(context: string, functionName: string, message: string, data?: Record<string, unknown>): void {
    if (!shouldLog('DEBUG') || !isDebugEnabled) return
    baseLogger.debug(context, functionName, `[KASIR] ${message}`, sanitizeLogData(data))
  },

  info(context: string, functionName: string, message: string, data?: Record<string, unknown>): void {
    if (!shouldLog('INFO')) return
    baseLogger.info(context, functionName, `[KASIR] ${message}`, sanitizeLogData(data))
  },

  warn(context: string, functionName: string, message: string, data?: Record<string, unknown>): void {
    if (!shouldLog('WARN')) return
    baseLogger.warn(context, functionName, `[KASIR] ${message}`, sanitizeLogData(data))
  },

  error(context: string, functionName: string, message: string, error?: Error | Record<string, unknown>): void {
    if (!shouldLog('ERROR')) return
    baseLogger.error(context, functionName, `[KASIR] ${message}`, error)
  },

  startTimer(context: string, functionName: string, label: string): PerformanceTimer {
    if (!shouldLog('DEBUG')) {
      return { end: () => 0 } // No-op timer
    }
    
    const timer = baseLogger.startTimer(context, functionName, `[KASIR] ${label}`)
    return {
      end: (message?: string, data?: Record<string, unknown>) => {
        const duration = timer.end(message)
        if (isDebugEnabled && data) {
          this.debug(context, functionName, `Performance: ${label}`, {
            duration: `${duration}ms`,
            ...sanitizeLogData(data)
          })
        }
        return duration
      }
    }
  },

  // Context-specific loggers
  returnProcess: createContextLogger(KASIR_CONTEXTS.RETURN_PROCESS),
  penaltyCalc: createContextLogger(KASIR_CONTEXTS.PENALTY_CALC),
  apiCalls: createContextLogger(KASIR_CONTEXTS.API_CALLS),
  userInteraction: createContextLogger(KASIR_CONTEXTS.USER_INTERACTION),
  stateManagement: createContextLogger(KASIR_CONTEXTS.STATE_MANAGEMENT),
  validation: createContextLogger(KASIR_CONTEXTS.VALIDATION),
  performance: createContextLogger(KASIR_CONTEXTS.PERFORMANCE)
}

// Helper function to create context-specific loggers
function createContextLogger(context: string): KasirContextLogger {
  return {
    debug: (functionName: string, message: string, data?: Record<string, unknown>) =>
      kasirLogger.debug(context, functionName, message, data),
    info: (functionName: string, message: string, data?: Record<string, unknown>) =>
      kasirLogger.info(context, functionName, message, data),
    warn: (functionName: string, message: string, data?: Record<string, unknown>) =>
      kasirLogger.warn(context, functionName, message, data),
    error: (functionName: string, message: string, error?: Error | Record<string, unknown>) =>
      kasirLogger.error(context, functionName, message, error),
    startTimer: (functionName: string, label: string) =>
      kasirLogger.startTimer(context, functionName, label)
  }
}

// Debug utilities for development
export const kasirDebugUtils = {
  /**
   * Enable debug logging in browser console
   */
  enableDebug(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kasir-debug', 'true')
      console.info('🔍 Kasir debug logging enabled. Refresh page to apply.')
    }
  },

  /**
   * Disable debug logging in browser console
   */
  disableDebug(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kasir-debug')
      console.info('🔇 Kasir debug logging disabled. Refresh page to apply.')
    }
  },

  /**
   * Check if debug mode is currently enabled
   */
  isDebugEnabled(): boolean {
    return isDebugEnabled
  },

  /**
   * Get current log level
   */
  getCurrentLogLevel(): LogLevel {
    return currentLogLevel
  }
}

// Export context constants for use in components (already exported above)

// Development helper - expose debug utils globally
if (isDevelopment && typeof window !== 'undefined') {
  // @ts-expect-error - Development only global
  window.kasirDebug = kasirDebugUtils
}