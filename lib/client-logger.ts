/**
 * Simple Client-Side Logger for Debugging
 * Usage: import { logger } from '@/lib/client-logger'
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
  component?: string
  userId?: string
}

class ClientLogger {
  private isEnabled: boolean
  private logLevel: LogLevel
  private logs: LogEntry[] = []
  private maxLogs = 100 // Batasi maksimal log yang disimpan

  constructor() {
    this.isEnabled = process.env.NEXT_PUBLIC_ENABLE_LOGGING === 'true'
    this.logLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || 'error'
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.isEnabled) return false

    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    }

    return levels[level] >= levels[this.logLevel]
  }

  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  private formatMessage(level: LogLevel, message: string, data?: any, component?: string): string {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`
    const componentPrefix = component ? ` [${component}]` : ''
    const dataStr = data ? ` | Data: ${JSON.stringify(data)}` : ''

    return `${prefix}${componentPrefix} ${message}${dataStr}`
  }

  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  private saveLog(level: LogLevel, message: string, data?: any, component?: string) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      component,
      userId: this.getCurrentUserId(),
    }

    this.logs.push(logEntry)

    // Hapus log lama jika melebihi batas
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Simpan ke localStorage untuk debugging (opsional)
    if (typeof window !== 'undefined' && this.isEnabled) {
      try {
        localStorage.setItem('client-logs', JSON.stringify(this.logs.slice(-20))) // Simpan 20 log terakhir
      } catch {
        // Ignore localStorage errors
      }
    }
  }

  private getCurrentUserId(): string | undefined {
    // Anda bisa sesuaikan ini dengan sistem auth Anda (Clerk)
    if (typeof window !== 'undefined') {
      try {
        // Contoh untuk Clerk (sesuaikan dengan implementasi Anda)
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (window as any).__clerk_user?.id
      } catch {
        return undefined
      }
    }
    return undefined
  }

  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug(message: string, data?: any, component?: string) {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, data, component))
      this.saveLog('debug', message, data, component)
    }
  }

  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  info(message: string, data?: any, component?: string) {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, data, component))
      this.saveLog('info', message, data, component)
    }
  }

  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn(message: string, data?: any, component?: string) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data, component))
      this.saveLog('warn', message, data, component)
    }
  }

  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(message: string, data?: any, component?: string) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, data, component))
      this.saveLog('error', message, data, component)
    }
  }

  // Utility methods untuk debugging
  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  getLogsAsString(): string {
    return this.logs
      .map(
        (log) =>
          `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.component ? `[${log.component}] ` : ''}${log.message}`,
      )
      .join('\n')
  }

  clearLogs() {
    this.logs = []
    if (typeof window !== 'undefined') {
      localStorage.removeItem('client-logs')
    }
  }

  // Export logs untuk debugging atau support
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  // Download logs sebagai file
  downloadLogs() {
    if (typeof window === 'undefined') return

    const dataStr = this.exportLogs()
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = `client-logs-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

// Singleton instance
export const logger = new ClientLogger()

// React Hook untuk debugging components
export function useLogger(componentName: string) {
  return {
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    debug: (message: string, data?: any) => logger.debug(message, data, componentName),
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    info: (message: string, data?: any) => logger.info(message, data, componentName),
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    warn: (message: string, data?: any) => logger.warn(message, data, componentName),
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: (message: string, data?: any) => logger.error(message, data, componentName),
  }
}

// Development helper - global access
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).clientLogger = logger
}
