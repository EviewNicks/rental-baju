/**
 * EnhancedAvailabilityService - Availability Product View
 * Extends existing AvailabilityService with date-aware availability checking
 * Supports date range overlap detection and reservation-based inventory
 */

import { PrismaClient } from '@prisma/client'
import { AvailabilityService } from './availabilityService'
import type { 
  DateRangeAvailabilityCheck,
  AvailabilityResult,
  DateRange,
  OverlapResult,
  ConflictDetail
} from '../types/availability'

export class EnhancedAvailabilityService extends AvailabilityService {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /**
   * Check availability for multiple product sizes with date range support
   * This is the main method for date-aware availability checking
   */
  async checkProductSizeDateRangeAvailability(
    checks: DateRangeAvailabilityCheck[]
  ): Promise<AvailabilityResult[]> {
    const results: AvailabilityResult[] = []

    for (const check of checks) {
      try {
        const result = await this.checkSingleDateRangeAvailability(check)
        results.push(result)
      } catch (error) {
        console.error('Failed to check date range availability:', {
          productSizeId: check.productSizeId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })

        // Return unavailable result on error
        results.push({
          productSizeId: check.productSizeId,
          totalStock: 0,
          availableQuantity: 0,
          reservedQuantity: 0,
          conflicts: [],
          canBook: false
        })
      }
    }

    return results
  }

  /**
   * Check availability for a single product size with date range
   */
  private async checkSingleDateRangeAvailability(
    check: DateRangeAvailabilityCheck
  ): Promise<AvailabilityResult> {
    const { productSizeId, requestedQuantity, startDate, endDate } = check

    // Get overlapping transactions for this date range
    const overlappingTransactions = await this.getProductSizeOverlappingTransactions(
      productSizeId,
      startDate,
      endDate
    )

    // Get total stock from ProductSize
    const productSize = await this.prisma.productSize.findUnique({
      where: { id: productSizeId },
      select: {
        originalQuantity: true,
        availableQuantity: true,
        rentedQuantity: true
      }
    })

    if (!productSize) {
      throw new Error(`ProductSize with id ${productSizeId} not found`)
    }

    // Calculate reserved quantity (booked but not picked up yet)
    const reservedQuantity = overlappingTransactions
      .filter(tx => tx.status === 'active') // Only active reservations
      .reduce((sum, tx) => sum + tx.quantity, 0)

    // Calculate conflicts
    const conflicts: ConflictDetail[] = overlappingTransactions.map(tx => ({
      transactionCode: tx.transactionCode,
      conflictQuantity: tx.quantity,
      conflictPeriod: {
        startDate: tx.startDate,
        endDate: tx.endDate
      }
    }))

    // Calculate available quantity considering reservations
    const totalReserved = overlappingTransactions.reduce((sum, tx) => sum + tx.quantity, 0)
    const availableForBooking = Math.max(0, productSize.originalQuantity - totalReserved)

    const canBook = availableForBooking >= requestedQuantity

    return {
      productSizeId,
      totalStock: productSize.originalQuantity,
      availableQuantity: availableForBooking,
      reservedQuantity,
      conflicts,
      canBook
    }
  }

  /**
   * Get transactions that overlap with the specified date range for a specific product size
   * REVISED: Only considers 'active' and 'diambil' status transactions
   */
  async getProductSizeOverlappingTransactions(
    productSizeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{
    transactionCode: string
    quantity: number
    startDate: Date
    endDate: Date
    status: string
  }>> {
    try {
      // Query transactions that overlap with the date range
      const transactions = await this.prisma.transaksi.findMany({
        where: {
          status: {
            in: ['active', 'diambil'] // REVISED: Only active and diambil
          },
          // Date range overlap condition
          AND: [
            {
              tglMulai: {
                lte: endDate // Transaction starts before or on our end date
              }
            },
            {
              OR: [
                {
                  tglSelesai: {
                    gte: startDate // Transaction ends after or on our start date
                  }
                },
                {
                  tglSelesai: null // Ongoing transaction (no end date)
                }
              ]
            }
          ],
          items: {
            some: {
              kondisiAwal: {
                startsWith: productSizeId // Check if this product size is used
              }
            }
          }
        },
        include: {
          items: {
            where: {
              kondisiAwal: {
                startsWith: productSizeId
              }
            }
          }
        }
      })

      // Transform to overlap result format
      const overlappingTransactions = []

      for (const transaction of transactions) {
        for (const item of transaction.items) {
          overlappingTransactions.push({
            transactionCode: transaction.kode,
            quantity: item.jumlah,
            startDate: transaction.tglMulai,
            endDate: transaction.tglSelesai || new Date(),
            status: transaction.status
          })
        }
      }

      return overlappingTransactions

    } catch (error) {
      console.error('Failed to get overlapping transactions:', {
        productSizeId,
        startDate,
        endDate,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return []
    }
  }

  /**
   * Detect if two date ranges overlap
   * Utility method for date overlap detection
   */
  private detectDateOverlap(range1: DateRange, range2: DateRange): boolean {
    // Two ranges overlap if:
    // range1.start <= range2.end AND range2.start <= range1.end
    return range1.startDate <= range2.endDate && range2.startDate <= range1.endDate
  }

  /**
   * Calculate detailed overlap information between two date ranges
   */
  calculateOverlapDetails(range1: DateRange, range2: DateRange): OverlapResult {
    const hasOverlap = this.detectDateOverlap(range1, range2)

    if (!hasOverlap) {
      return {
        hasOverlap: false,
        conflictingTransactions: []
      }
    }

    // Calculate overlap period
    const overlapStart = new Date(Math.max(range1.startDate.getTime(), range2.startDate.getTime()))
    const overlapEnd = new Date(Math.min(range1.endDate.getTime(), range2.endDate.getTime()))

    return {
      hasOverlap: true,
      overlapStart,
      overlapEnd,
      conflictingTransactions: [] // Will be populated by caller with transaction codes
    }
  }

  /**
   * Validate availability for transaction creation with date awareness
   * This method integrates with existing transaction creation workflow
   */
  async validateDateAwareAvailability(
    items: Array<{
      productSizeId: string
      quantity: number
    }>,
    startDate: Date,
    endDate: Date
  ): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
    availabilityResults: AvailabilityResult[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    // Prepare availability checks
    const checks: DateRangeAvailabilityCheck[] = items.map(item => ({
      productSizeId: item.productSizeId,
      requestedQuantity: item.quantity,
      startDate,
      endDate
    }))

    // Check availability for all items
    const availabilityResults = await this.checkProductSizeDateRangeAvailability(checks)

    // Validate each result
    for (let i = 0; i < availabilityResults.length; i++) {
      const result = availabilityResults[i]
      const item = items[i]

      if (!result.canBook) {
        errors.push(
          `Product size ${result.productSizeId} tidak tersedia untuk periode ini. ` +
          `Tersedia: ${result.availableQuantity}, Diminta: ${item.quantity}`
        )
      }

      // Add warnings for conflicts
      if (result.conflicts.length > 0) {
        const conflictCodes = result.conflicts.map(c => c.transactionCode).join(', ')
        warnings.push(
          `Product size ${result.productSizeId} memiliki konflik dengan transaksi: ${conflictCodes}`
        )
      }

      // Add warning for low stock after booking
      const remainingAfterBooking = result.availableQuantity - item.quantity
      if (remainingAfterBooking <= 1 && remainingAfterBooking >= 0) {
        warnings.push(
          `Product size ${result.productSizeId} akan hampir habis setelah booking ini ` +
          `(sisa: ${remainingAfterBooking})`
        )
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      availabilityResults
    }
  }
}

/**
 * Factory function to create SizeAvailabilityService instance
 */
export const createEnhancedAvailabilityService = (prisma: PrismaClient): EnhancedAvailabilityService => {
  return new EnhancedAvailabilityService(prisma)
}