/**
 * InventoryService - Centralized Inventory Management for Enhanced ProductSize Schema
 *
 * Core Purpose: Single source of truth for inventory operations using Enhanced ProductSize schema
 * Architecture: Atomic operations with real-time stock tracking and validation
 *
 * Enhanced ProductSize Fields:
 * - originalQuantity: Total initial stock quantity (baseline)
 * - rentedQuantity: Currently rented/rented out quantity
 * - availableQuantity: Available for rent (calculated: original - rented)
 *
 * Usage Examples:
 * await inventoryService.updateStockOnCreate(sizeId, 2)     // Rent 2 items
 * await inventoryService.updateStockOnReturn(sizeId, 1)     // Return 1 item
 * const isAvailable = await inventoryService.checkAvailability(sizeId, 5)  // Check if 5 items available
 * const status = await inventoryService.getStockStatus(sizeId)   // Get comprehensive status
 */

import { PrismaClient } from '@prisma/client'
import { kasirLogger } from '../lib/logger'

export interface StockStatus {
  originalQuantity: number
  availableQuantity: number
  rentedQuantity: number
  isAvailable: boolean
  utilizationRate: number // percentage of original stock that is rented
}

export interface AvailabilityResult {
  productId: string
  size: string
  available: boolean
  stockStatus?: StockStatus
}

export interface ProductStockStatus {
  productId: string
  totalQuantity: number
  availableQuantity: number
  rentedQuantity: number
  sizes: Array<{
    id: string
    ageCategory: string
    size: string
    originalQuantity: number
    availableQuantity: number
    rentedQuantity: number
    isAvailable: boolean
  }>
}

export interface ConsistencyValidation {
  isConsistent: boolean
  originalQuantity: number
  calculatedTotal: number
  difference: number
}

/**
 * InventoryService provides centralized inventory management with atomic operations
 * and real-time stock tracking using the Enhanced ProductSize schema
 */
export class InventoryService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  /**
   * Update stock when creating a rental transaction
   * Decrements availableQuantity and increments rentedQuantity atomically
   *
   * @param sizeId - ProductSize ID to update
   * @param quantity - Number of items being rented (must be > 0)
   * @throws Error if quantity <= 0 or database operation fails
   */
  async updateStockOnCreate(sizeId: string, quantity: number): Promise<void> {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0')
    }

    try {
      kasirLogger.info('Updating stock on create', { sizeId, quantity })

      await this.prisma.productSize.update({
        where: { id: sizeId },
        data: {
          rentedQuantity: { increment: quantity },
          availableQuantity: { decrement: quantity }
        }
      })

      kasirLogger.info('Stock updated on create successfully', { sizeId, quantity })
    } catch (error) {
      kasirLogger.error('Failed to update stock on create', { sizeId, quantity, error })
      throw new Error(`Failed to update stock on create: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update stock when processing a return
   * Increments availableQuantity and decrements rentedQuantity atomically
   *
   * @param sizeId - ProductSize ID to update
   * @param quantity - Number of items being returned (must be > 0)
   * @throws Error if quantity <= 0 or database operation fails
   */
  async updateStockOnReturn(sizeId: string, quantity: number): Promise<void> {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0')
    }

    try {
      kasirLogger.info('Updating stock on return', { sizeId, quantity })

      await this.prisma.productSize.update({
        where: { id: sizeId },
        data: {
          rentedQuantity: { decrement: quantity },
          availableQuantity: { increment: quantity }
        }
      })

      kasirLogger.info('Stock updated on return successfully', { sizeId, quantity })
    } catch (error) {
      kasirLogger.error('Failed to update stock on return', { sizeId, quantity, error })
      throw new Error(`Failed to update stock on return: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Check if sufficient stock is available for rental
   * Uses real-time database data for accurate validation
   *
   * @param sizeId - ProductSize ID to check
   * @param requestedQty - Quantity being requested (must be > 0)
   * @returns boolean indicating if requested quantity is available
   */
  async checkAvailability(sizeId: string, requestedQty: number): Promise<boolean> {
    if (requestedQty <= 0) {
      return false
    }

    try {
      const productSize = await this.prisma.productSize.findUnique({
        where: { id: sizeId },
        select: {
          availableQuantity: true,
          rentedQuantity: true,
          originalQuantity: true
        }
      })

      if (!productSize) {
        kasirLogger.warn('ProductSize not found for availability check', { sizeId })
        return false
      }

      // Ensure availableQuantity is not negative due to any inconsistency
      const availableQuantity = Math.max(0, productSize.availableQuantity || 0)
      const isAvailable = availableQuantity >= requestedQty

      kasirLogger.debug('Availability check result', {
        sizeId,
        requestedQty,
        availableQuantity,
        isAvailable
      })

      return isAvailable
    } catch (error) {
      kasirLogger.error('Failed to check availability', { sizeId, requestedQty, error })
      // Return false on error to prevent overselling
      return false
    }
  }

  /**
   * Get comprehensive stock status for a specific size
   * Returns detailed inventory information including utilization rate
   *
   * @param sizeId - ProductSize ID to query
   * @returns StockStatus with detailed inventory information
   * @throws Error if ProductSize not found
   */
  async getStockStatus(sizeId: string): Promise<StockStatus> {
    try {
      const productSize = await this.prisma.productSize.findUnique({
        where: { id: sizeId },
        select: {
          originalQuantity: true,
          availableQuantity: true,
          rentedQuantity: true
        }
      })

      if (!productSize) {
        throw new Error(`ProductSize with id ${sizeId} not found`)
      }

      // Handle potential null values and ensure non-negative numbers
      const originalQuantity = Math.max(0, productSize.originalQuantity || 0)
      const availableQuantity = Math.max(0, productSize.availableQuantity || 0)
      const rentedQuantity = Math.max(0, productSize.rentedQuantity || 0)

      const isAvailable = availableQuantity > 0
      const utilizationRate = originalQuantity > 0 ? (rentedQuantity / originalQuantity) * 100 : 0

      const status: StockStatus = {
        originalQuantity,
        availableQuantity,
        rentedQuantity,
        isAvailable,
        utilizationRate: Math.round(utilizationRate * 100) / 100 // Round to 2 decimal places
      }

      kasirLogger.debug('Stock status retrieved', {
        sizeId,
        status
      })

      return status
    } catch (error) {
      kasirLogger.error('Failed to get stock status', { sizeId, error })

      // Return default status on error to prevent system failure
      return {
        originalQuantity: 0,
        availableQuantity: 0,
        rentedQuantity: 0,
        isAvailable: false,
        utilizationRate: 0
      }
    }
  }

  /**
   * Check availability by finding ProductSize using productId and size
   * Convenient method for API endpoints that have productId and size parameters
   *
   * @param productId - Product ID to search
   * @param size - Size string (e.g., 'M', 'L', 'XL')
   * @param requestedQty - Quantity being requested
   * @returns AvailabilityResult with stock status if found
   */
  async checkAvailabilityByProductAndSize(
    productId: string,
    size: string,
    requestedQty: number
  ): Promise<AvailabilityResult> {
    try {
      const productSize = await this.prisma.productSize.findFirst({
        where: {
          productId,
          size,
          isActive: true
        },
        select: {
          id: true,
          availableQuantity: true,
          rentedQuantity: true,
          originalQuantity: true
        }
      })

      if (!productSize) {
        return {
          productId,
          size,
          available: false
        }
      }

      const isAvailable = await this.checkAvailability(productSize.id, requestedQty)
      const stockStatus = isAvailable ? await this.getStockStatus(productSize.id) : undefined

      return {
        productId,
        size,
        available: isAvailable,
        stockStatus
      }
    } catch (error) {
      kasirLogger.error('Failed to check availability by product and size', {
        productId,
        size,
        requestedQty,
        error
      })

      return {
        productId,
        size,
        available: false
      }
    }
  }

  /**
   * Get comprehensive stock status for all sizes of a product
   * Useful for product pages and inventory reporting
   *
   * @param productId - Product ID to query
   * @returns ProductStockStatus with detailed inventory for all sizes
   */
  async getProductStockStatus(productId: string): Promise<ProductStockStatus> {
    try {
      const productSizes = await this.prisma.productSize.findMany({
        where: {
          productId,
          isActive: true
        },
        select: {
          id: true,
          ageCategory: true,
          size: true,
          originalQuantity: true,
          availableQuantity: true,
          rentedQuantity: true
        },
        orderBy: [
          { ageCategory: 'asc' },
          { size: 'asc' }
        ]
      })

      const sizes = productSizes.map(size => {
        const originalQuantity = Math.max(0, size.originalQuantity || 0)
        const availableQuantity = Math.max(0, size.availableQuantity || 0)
        const rentedQuantity = Math.max(0, size.rentedQuantity || 0)
        const isAvailable = availableQuantity > 0

        return {
          id: size.id,
          ageCategory: size.ageCategory,
          size: size.size,
          originalQuantity,
          availableQuantity,
          rentedQuantity,
          isAvailable
        }
      })

      const totalQuantity = sizes.reduce((sum, size) => sum + size.originalQuantity, 0)
      const availableQuantity = sizes.reduce((sum, size) => sum + size.availableQuantity, 0)
      const rentedQuantity = sizes.reduce((sum, size) => sum + size.rentedQuantity, 0)

      const status: ProductStockStatus = {
        productId,
        totalQuantity,
        availableQuantity,
        rentedQuantity,
        sizes
      }

      kasirLogger.debug('Product stock status retrieved', {
        productId,
        totalSizes: sizes.length,
        totalQuantity,
        availableQuantity,
        rentedQuantity
      })

      return status
    } catch (error) {
      kasirLogger.error('Failed to get product stock status', { productId, error })

      // Return default status on error
      return {
        productId,
        totalQuantity: 0,
        availableQuantity: 0,
        rentedQuantity: 0,
        sizes: []
      }
    }
  }

  /**
   * Validate data consistency for a specific ProductSize
   * Ensures originalQuantity = rentedQuantity + availableQuantity
   *
   * @param sizeId - ProductSize ID to validate
   * @returns ConsistencyValidation with validation results
   */
  async validateConsistency(sizeId: string): Promise<ConsistencyValidation> {
    try {
      const productSize = await this.prisma.productSize.findUnique({
        where: { id: sizeId },
        select: {
          originalQuantity: true,
          availableQuantity: true,
          rentedQuantity: true
        }
      })

      if (!productSize) {
        throw new Error(`ProductSize with id ${sizeId} not found`)
      }

      const originalQuantity = Math.max(0, productSize.originalQuantity || 0)
      const availableQuantity = Math.max(0, productSize.availableQuantity || 0)
      const rentedQuantity = Math.max(0, productSize.rentedQuantity || 0)
      const calculatedTotal = availableQuantity + rentedQuantity
      const difference = originalQuantity - calculatedTotal

      const validation: ConsistencyValidation = {
        isConsistent: difference === 0,
        originalQuantity,
        calculatedTotal,
        difference
      }

      if (!validation.isConsistent) {
        kasirLogger.warn('Inventory consistency issue detected', {
          sizeId,
          originalQuantity,
          calculatedTotal,
          difference
        })
      }

      return validation
    } catch (error) {
      kasirLogger.error('Failed to validate consistency', { sizeId, error })

      // Return inconsistent status on error
      return {
        isConsistent: false,
        originalQuantity: 0,
        calculatedTotal: 0,
        difference: 0
      }
    }
  }

  /**
   * Batch validate consistency for multiple ProductSizes
   * Useful for data integrity checks and reporting
   *
   * @param sizeIds - Array of ProductSize IDs to validate
   * @returns Array of ConsistencyValidation results
   */
  async validateBatchConsistency(sizeIds: string[]): Promise<ConsistencyValidation[]> {
    const results = await Promise.all(
      sizeIds.map(sizeId => this.validateConsistency(sizeId))
    )

    const inconsistentCount = results.filter(r => !r.isConsistent).length
    if (inconsistentCount > 0) {
      kasirLogger.warn('Batch consistency validation completed with issues', {
        totalSizes: sizeIds.length,
        inconsistentCount,
        inconsistentSizeIds: results
          .filter((r, index) => !r.isConsistent)
          .map((_, index) => sizeIds[index])
      })
    } else {
      kasirLogger.info('Batch consistency validation completed successfully', {
        totalSizes: sizeIds.length
      })
    }

    return results
  }

  /**
   * Clean up database connections
   * Call this method when shutting down the service
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }
}

// Export singleton instance for easy usage across the application
export const inventoryService = new InventoryService()