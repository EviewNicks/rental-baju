/**
 * Transaction Code Generator - RPK-26
 * Generates unique transaction codes in format: TXN-YYYYMMDD-XXX
 */

import { PrismaClient } from '@prisma/client'

export class TransactionCodeGenerator {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate unique transaction code
   * Format: TXN-YYYYMMDD-XXX (e.g., TXN-20250725-001)
   */
  async generateTransactionCode(date: Date = new Date()): Promise<string> {
    const dateStr = this.formatDate(date)
    const prefix = `TXN-${dateStr}`

    // Get the latest transaction code for today
    const latestTransaction = await this.prisma.transaksi.findFirst({
      where: {
        kode: {
          startsWith: prefix
        }
      },
      orderBy: {
        kode: 'desc'
      },
      select: {
        kode: true
      }
    })

    let nextSequence = 1

    if (latestTransaction) {
      // Extract sequence number from the latest code
      const parts = latestTransaction.kode.split('-')
      if (parts.length === 3) {
        const currentSequence = parseInt(parts[2], 10)
        if (!isNaN(currentSequence)) {
          nextSequence = currentSequence + 1
        }
      }
    }

    // Ensure sequence is 3 digits with leading zeros
    const sequenceStr = nextSequence.toString().padStart(3, '0')
    const transactionCode = `${prefix}-${sequenceStr}`

    // Verify uniqueness (defensive programming)
    const exists = await this.prisma.transaksi.findUnique({
      where: { kode: transactionCode },
      select: { id: true }
    })

    if (exists) {
      // In case of collision, recursively generate next code
      return this.generateTransactionCode(date)
    }

    return transactionCode
  }

  /**
   * Format date to YYYYMMDD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}${month}${day}`
  }

  /**
   * Validate transaction code format
   */
  static validateTransactionCode(code: string): boolean {
    const pattern = /^TXN-\d{8}-\d{3}$/
    return pattern.test(code)
  }

  /**
   * Extract date from transaction code
   */
  static extractDateFromCode(code: string): Date | null {
    if (!this.validateTransactionCode(code)) {
      return null
    }

    const parts = code.split('-')
    const dateStr = parts[1] // YYYYMMDD
    
    const year = parseInt(dateStr.substring(0, 4), 10)
    const month = parseInt(dateStr.substring(4, 6), 10) - 1 // Month is 0-indexed
    const day = parseInt(dateStr.substring(6, 8), 10)

    const date = new Date(year, month, day)
    
    // Validate the constructed date
    if (
      date.getFullYear() === year &&
      date.getMonth() === month &&
      date.getDate() === day
    ) {
      return date
    }

    return null
  }

  /**
   * Extract sequence number from transaction code
   */
  static extractSequenceFromCode(code: string): number | null {
    if (!this.validateTransactionCode(code)) {
      return null
    }

    const parts = code.split('-')
    const sequence = parseInt(parts[2], 10)
    
    return isNaN(sequence) ? null : sequence
  }

  /**
   * Validate UUID format (v4)
   */
  static validateUUID(uuid: string): boolean {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidPattern.test(uuid)
  }

  /**
   * Detect parameter type: 'uuid', 'code', or 'invalid'
   */
  static detectParameterType(param: string): 'uuid' | 'code' | 'invalid' {
    if (this.validateUUID(param)) {
      return 'uuid'
    }
    
    if (this.validateTransactionCode(param)) {
      return 'code'
    }
    
    return 'invalid'
  }
}