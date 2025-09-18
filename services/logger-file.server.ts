/**
 * Server-only file logger functionality
 * This module handles file logging operations using Node.js fs and path modules
 * It should only be imported on the server-side to avoid webpack bundling issues
 */

import fs from 'fs'
import path from 'path'

// Interface for file logger
export interface FileLogger {
  saveToFile(level: string, message: string): void
}

// Create the file logger implementation
class FileLoggerImpl implements FileLogger {
  private logDir: string

  constructor() {
    // Set up log directory
    this.logDir = path.join(process.cwd(), 'services', 'logger-detailed')
    this.ensureLogDirectory()
  }

  private ensureLogDirectory(): void {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true })
      }
    } catch (error) {
      console.error('Failed to create log directory:', error)
    }
  }

  public saveToFile(level: string, message: string): void {
    try {
      const today = new Date().toISOString().split('T')[0]
      const combinedLogPath = path.join(this.logDir, 'combined.log')
      const dailyLogPath = path.join(this.logDir, `app-${today}.log`)
      const errorLogPath = path.join(this.logDir, 'error.log')

      // Append to combined.log
      fs.appendFileSync(combinedLogPath, message + '\n')

      // Append to daily log
      fs.appendFileSync(dailyLogPath, message + '\n')

      // If level error, append also to error.log
      if (level === 'error') {
        fs.appendFileSync(errorLogPath, message + '\n')
      }
    } catch (err) {
      console.error('Failed to write log to file:', err)
    }
  }
}

// Export singleton instance
export const fileLogger: FileLogger = new FileLoggerImpl()