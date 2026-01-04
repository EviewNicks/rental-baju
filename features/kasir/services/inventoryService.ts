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
import type { SizeEnum } from '@/features/manage-product/types'

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
  lostQuantity: number // ✅ Lost Item Management
  sizes: Array<{
    id: string
    ageCategory: string
    size: string
    originalQuantity: number
    availableQuantity: number
    rentedQuantity: number
    lostQuantity: number // ✅ Lost Item Management
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
 *
 * PERFORMANCE FIX: Accepts Prisma instance to avoid connection pool exhaustion
 */
export class InventoryService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Update stock when creating a rental transaction with dual deduction support
   * Supports both single item and dual deduction for jas-sarung pairings
   * Decrements availableQuantity and increments rentedQuantity atomically
   *
   * @param sizeId - ProductSize ID to update
   * @param quantity - Number of items being rented (must be > 0)
   * @param linkedSarungSizeId - Optional linked sarung ProductSize ID for dual deduction
   * @throws Error if quantity <= 0 or database operation fails
   */
  async updateStockOnCreate(sizeId: string, quantity: number, linkedSarungSizeId?: string): Promise<void> {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0')
    }

    // ✅ TASK 6: Additional audit trail point 1 - Transaction context validation
    console.info('🔧 Stock deduction initiated', {
      sizeId,
      linkedSarungSizeId,
      quantity,
      isDualDeduction: !!linkedSarungSizeId,
      transactionContext: this.prisma.constructor.name,
      timestamp: new Date().toISOString()
    })

    try {
      // If no linked sarung, use existing single deduction logic
      if (!linkedSarungSizeId) {
        await this.prisma.productSize.update({
          where: { id: sizeId },
          data: {
            rentedQuantity: { increment: quantity },
            availableQuantity: { decrement: quantity },
          },
        })
        return
      }

      // ✅ FIXED: For dual deduction, use sequential updates instead of nested transaction
      // Since we're already inside a transaction context, we can't use $transaction again
      
      // ✅ TASK 6: Additional audit trail point 2 - Dual deduction process tracking
      console.info('🔄 Executing dual stock deduction', {
        jasProductSizeId: sizeId,
        sarungProductSizeId: linkedSarungSizeId,
        quantity,
        step: 'sequential_updates',
        timestamp: new Date().toISOString()
      })
      
      // Deduct stock for main item (jas)
      await this.prisma.productSize.update({
        where: { id: sizeId },
        data: {
          rentedQuantity: { increment: quantity },
          availableQuantity: { decrement: quantity },
        },
      })
      
      // Deduct stock for linked sarung (1:1 ratio)
      await this.prisma.productSize.update({
        where: { id: linkedSarungSizeId },
        data: {
          rentedQuantity: { increment: quantity },
          availableQuantity: { decrement: quantity },
        },
      })
      
    } catch (error) {
      throw new Error(
        `Failed to update stock on create: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Process stock deduction with pairing awareness
   * Handles both regular items and jas-sarung pairings with comprehensive logging
   *
   * @param kondisiAwal - kondisiAwal field containing item data
   * @param quantity - Number of items being processed
   * @param itemId - Transaction item ID for logging
   * @param logger - Logger instance for audit trail
   */
  async processStockForPickup(
    kondisiAwal: string | null,
    quantity: number,
    itemId: string,
    logger?: { warn: (msg: string, context?: any) => void; info: (msg: string, context?: any) => void; error: (msg: string, context?: any) => void }
  ): Promise<void> {
    // Import here to avoid circular dependency
    const { parseKondisiAwalEnhanced } = await import('../lib/utils/kondisiAwalParser')
    
    // ✅ TASK 6: Strategic logging point 3 - Data format detection with pairing context
    const detectedFormat = kondisiAwal ? (kondisiAwal.startsWith('{') ? 'JSON' : 'pipe') : 'null'
    
    const kondisiData = parseKondisiAwalEnhanced(kondisiAwal)
    
    if (!kondisiData?.productSizeId) {
      logger?.warn('Could not extract productSizeId from kondisiAwal', {
        itemId,
        kondisiAwal,
        reason: 'parsing_failed'
      })
      return // Skip stock deduction but continue pickup
    }
    
    try {
      // Check if this item has linkedSarung for dual deduction
      const linkedSarungSizeId = kondisiData.linkedSarung?.productSizeId
      
      if (linkedSarungSizeId) {
        // Dual deduction for jas-sarung pairing
        await this.updateStockOnCreate(kondisiData.productSizeId, quantity, linkedSarungSizeId)
        
        logger?.info('Dual stock deduction completed for jas-sarung pairing', {
          itemId,
          jasProductSizeId: kondisiData.productSizeId,
          sarungProductSizeId: linkedSarungSizeId,
          quantity
        })
      } else {
        // Single deduction for regular items
        await this.updateStockOnCreate(kondisiData.productSizeId, quantity)
        
        logger?.info('Stock deduction completed for regular item', {
          itemId,
          productSizeId: kondisiData.productSizeId,
          quantity
        })
      }
    } catch (error) {
      logger?.error('Stock deduction failed', {
        itemId,
        productSizeId: kondisiData.productSizeId,
        linkedSarungSizeId: kondisiData.linkedSarung?.productSizeId,
        quantity,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Don't throw error - continue pickup process
      // Stock inconsistency is better than failed pickup
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
      await this.prisma.productSize.update({
        where: { id: sizeId },
        data: {
          rentedQuantity: { decrement: quantity },
          availableQuantity: { increment: quantity },
        },
      })
    } catch (error) {
      throw new Error(
        `Failed to update stock on return: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
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
          originalQuantity: true,
        },
      })

      if (!productSize) {
        return false
      }

      // Ensure availableQuantity is not negative due to any inconsistency
      const availableQuantity = Math.max(0, productSize.availableQuantity || 0)
      return availableQuantity >= requestedQty
    } catch {
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
          rentedQuantity: true,
        },
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

      return {
        originalQuantity,
        availableQuantity,
        rentedQuantity,
        isAvailable,
        utilizationRate: Math.round(utilizationRate * 100) / 100, // Round to 2 decimal places
      }
    } catch {
      // Return default status on error to prevent system failure
      return {
        originalQuantity: 0,
        availableQuantity: 0,
        rentedQuantity: 0,
        isAvailable: false,
        utilizationRate: 0,
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
    size: SizeEnum,
    requestedQty: number,
  ): Promise<AvailabilityResult> {
    try {
      const productSize = await this.prisma.productSize.findFirst({
        where: {
          productId,
          size,
          isActive: true,
        },
        select: {
          id: true,
          availableQuantity: true,
          rentedQuantity: true,
          originalQuantity: true,
        },
      })

      if (!productSize) {
        return {
          productId,
          size,
          available: false,
        }
      }

      const isAvailable = await this.checkAvailability(productSize.id, requestedQty)
      const stockStatus = isAvailable ? await this.getStockStatus(productSize.id) : undefined

      return {
        productId,
        size,
        available: isAvailable,
        stockStatus,
      }
    } catch {
      return {
        productId,
        size,
        available: false,
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
          isActive: true,
        },
        select: {
          id: true,
          ageCategory: true,
          size: true,
          originalQuantity: true,
          availableQuantity: true,
          rentedQuantity: true,
          lostQuantity: true, // ✅ Lost Item Management
        },
        orderBy: [{ ageCategory: 'asc' }, { size: 'asc' }],
      })

      const sizes = productSizes.map((size) => {
        const originalQuantity = Math.max(0, size.originalQuantity || 0)
        const availableQuantity = Math.max(0, size.availableQuantity || 0)
        const rentedQuantity = Math.max(0, size.rentedQuantity || 0)
        const lostQuantity = Math.max(0, size.lostQuantity || 0) // ✅ Lost Item Management
        const isAvailable = availableQuantity > 0

        return {
          id: size.id,
          ageCategory: size.ageCategory,
          size: size.size,
          originalQuantity,
          availableQuantity,
          rentedQuantity,
          lostQuantity, // ✅ Lost Item Management
          isAvailable,
        }
      })

      const totalQuantity = sizes.reduce((sum, size) => sum + size.originalQuantity, 0)
      const availableQuantity = sizes.reduce((sum, size) => sum + size.availableQuantity, 0)
      const rentedQuantity = sizes.reduce((sum, size) => sum + size.rentedQuantity, 0)
      const lostQuantity = sizes.reduce((sum, size) => sum + (size.lostQuantity || 0), 0) // ✅ Lost Item Management

      return {
        productId,
        totalQuantity,
        availableQuantity,
        rentedQuantity,
        lostQuantity, // ✅ Lost Item Management
        sizes,
      }
    } catch {
      // Return default status on error
      return {
        productId,
        totalQuantity: 0,
        availableQuantity: 0,
        rentedQuantity: 0,
        lostQuantity: 0, // ✅ Lost Item Management
        sizes: [],
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
          rentedQuantity: true,
        },
      })

      if (!productSize) {
        throw new Error(`ProductSize with id ${sizeId} not found`)
      }

      const originalQuantity = Math.max(0, productSize.originalQuantity || 0)
      const availableQuantity = Math.max(0, productSize.availableQuantity || 0)
      const rentedQuantity = Math.max(0, productSize.rentedQuantity || 0)
      const calculatedTotal = availableQuantity + rentedQuantity
      const difference = originalQuantity - calculatedTotal

      return {
        isConsistent: difference === 0,
        originalQuantity,
        calculatedTotal,
        difference,
      }
    } catch {
      // Return inconsistent status on error
      return {
        isConsistent: false,
        originalQuantity: 0,
        calculatedTotal: 0,
        difference: 0,
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
    return await Promise.all(sizeIds.map((sizeId) => this.validateConsistency(sizeId)))
  }
}

// Export factory function for creating inventory service with Prisma instance
export const createInventoryService = (prisma: PrismaClient) => {
  return new InventoryService(prisma)
}

// Export singleton instance for backward compatibility (uses global prisma)
// NOTE: For performance-critical operations, use createInventoryService with transaction prisma
import { prisma as globalPrisma } from '@/lib/prisma'
export const inventoryService = new InventoryService(globalPrisma)
