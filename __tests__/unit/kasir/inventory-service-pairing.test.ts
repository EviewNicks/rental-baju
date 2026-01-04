/**
 * Test for InventoryService Pairing Integration
 * Focuses on dual stock deduction and transaction context handling
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { InventoryService } from '../../../features/kasir/services/inventoryService'

// Mock PrismaClient for testing
const mockPrismaClient = {
  productSize: {
    update: jest.fn(),
    findUnique: jest.fn(),
  },
  constructor: {
    name: 'PrismaTransactionClient'
  }
} as any

describe('InventoryService - Pairing Integration', () => {
  let inventoryService: InventoryService
  
  beforeEach(() => {
    jest.clearAllMocks()
    inventoryService = new InventoryService(mockPrismaClient)
    
    // Setup default mock responses
    mockPrismaClient.productSize.update.mockResolvedValue({})
  })

  describe('updateStockOnCreate - Single Item', () => {
    it('should update stock for single item without linkedSarung', async () => {
      const sizeId = 'test-size-id'
      const quantity = 2

      await inventoryService.updateStockOnCreate(sizeId, quantity)

      expect(mockPrismaClient.productSize.update).toHaveBeenCalledTimes(1)
      expect(mockPrismaClient.productSize.update).toHaveBeenCalledWith({
        where: { id: sizeId },
        data: {
          rentedQuantity: { increment: quantity },
          availableQuantity: { decrement: quantity },
        },
      })
    })

    it('should throw error for invalid quantity', async () => {
      await expect(inventoryService.updateStockOnCreate('test-id', 0))
        .rejects.toThrow('Quantity must be greater than 0')
      
      await expect(inventoryService.updateStockOnCreate('test-id', -1))
        .rejects.toThrow('Quantity must be greater than 0')
    })
  })

  describe('updateStockOnCreate - Dual Deduction (Jas + Sarung)', () => {
    it('should perform dual stock deduction for jas-sarung pairing', async () => {
      const jasProductSizeId = 'jas-size-id'
      const sarungProductSizeId = 'sarung-size-id'
      const quantity = 1

      await inventoryService.updateStockOnCreate(
        jasProductSizeId, 
        quantity, 
        sarungProductSizeId
      )

      // Should call update twice - once for jas, once for sarung
      expect(mockPrismaClient.productSize.update).toHaveBeenCalledTimes(2)
      
      // First call: jas stock deduction
      expect(mockPrismaClient.productSize.update).toHaveBeenNthCalledWith(1, {
        where: { id: jasProductSizeId },
        data: {
          rentedQuantity: { increment: quantity },
          availableQuantity: { decrement: quantity },
        },
      })
      
      // Second call: sarung stock deduction
      expect(mockPrismaClient.productSize.update).toHaveBeenNthCalledWith(2, {
        where: { id: sarungProductSizeId },
        data: {
          rentedQuantity: { increment: quantity },
          availableQuantity: { decrement: quantity },
        },
      })
    })

    it('should handle dual deduction with multiple quantities', async () => {
      const jasProductSizeId = 'jas-size-id'
      const sarungProductSizeId = 'sarung-size-id'
      const quantity = 3

      await inventoryService.updateStockOnCreate(
        jasProductSizeId, 
        quantity, 
        sarungProductSizeId
      )

      expect(mockPrismaClient.productSize.update).toHaveBeenCalledTimes(2)
      
      // Both calls should use the same quantity (1:1 ratio)
      expect(mockPrismaClient.productSize.update).toHaveBeenNthCalledWith(1, 
        expect.objectContaining({
          data: {
            rentedQuantity: { increment: quantity },
            availableQuantity: { decrement: quantity },
          }
        })
      )
      
      expect(mockPrismaClient.productSize.update).toHaveBeenNthCalledWith(2, 
        expect.objectContaining({
          data: {
            rentedQuantity: { increment: quantity },
            availableQuantity: { decrement: quantity },
          }
        })
      )
    })

    it('should handle database errors gracefully in dual deduction', async () => {
      const jasProductSizeId = 'jas-size-id'
      const sarungProductSizeId = 'sarung-size-id'
      const quantity = 1

      // Mock first update (jas) to succeed, second update (sarung) to fail
      mockPrismaClient.productSize.update
        .mockResolvedValueOnce({}) // jas update succeeds
        .mockRejectedValueOnce(new Error('Database connection failed')) // sarung update fails

      await expect(inventoryService.updateStockOnCreate(
        jasProductSizeId, 
        quantity, 
        sarungProductSizeId
      )).rejects.toThrow('Failed to update stock on create: Database connection failed')

      // Should still attempt both updates
      expect(mockPrismaClient.productSize.update).toHaveBeenCalledTimes(2)
    })
  })

  describe('processStockForPickup - Integration Test', () => {
    it('should process stock for pickup with JSON kondisiAwal format', async () => {
      const kondisiAwal = JSON.stringify({
        productSizeId: 'test-product-size-id',
        size: 'M',
        ageCategory: 'ADULT',
        condition: 'baik',
        linkedSarung: {
          productId: 'sarung-product-id',
          productSizeId: 'sarung-size-id',
          quantity: 1
        }
      })

      const quantity = 1
      const itemId = 'test-item-id'
      const mockLogger = {
        warn: jest.fn(),
        info: jest.fn(),
        error: jest.fn()
      }

      await inventoryService.processStockForPickup(
        kondisiAwal,
        quantity,
        itemId,
        mockLogger
      )

      // Should perform dual deduction
      expect(mockPrismaClient.productSize.update).toHaveBeenCalledTimes(2)
      
      // Should log successful dual deduction
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Dual stock deduction completed for jas-sarung pairing',
        expect.objectContaining({
          itemId,
          jasProductSizeId: 'test-product-size-id',
          sarungProductSizeId: 'sarung-size-id',
          quantity
        })
      )
    })

    it('should process stock for pickup with regular item (no pairing)', async () => {
      const kondisiAwal = JSON.stringify({
        productSizeId: 'regular-product-size-id',
        size: 'L',
        ageCategory: 'ADULT',
        condition: 'baik',
        linkedSarung: null
      })

      const quantity = 2
      const itemId = 'regular-item-id'
      const mockLogger = {
        warn: jest.fn(),
        info: jest.fn(),
        error: jest.fn()
      }

      await inventoryService.processStockForPickup(
        kondisiAwal,
        quantity,
        itemId,
        mockLogger
      )

      // Should perform single deduction
      expect(mockPrismaClient.productSize.update).toHaveBeenCalledTimes(1)
      expect(mockPrismaClient.productSize.update).toHaveBeenCalledWith({
        where: { id: 'regular-product-size-id' },
        data: {
          rentedQuantity: { increment: quantity },
          availableQuantity: { decrement: quantity },
        },
      })

      // Should log successful regular item processing
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Stock deduction completed for regular item',
        expect.objectContaining({
          itemId,
          productSizeId: 'regular-product-size-id',
          quantity
        })
      )
    })

    it('should handle invalid kondisiAwal gracefully', async () => {
      const kondisiAwal = 'invalid-json-data'
      const quantity = 1
      const itemId = 'test-item-id'
      const mockLogger = {
        warn: jest.fn(),
        info: jest.fn(),
        error: jest.fn()
      }

      await inventoryService.processStockForPickup(
        kondisiAwal,
        quantity,
        itemId,
        mockLogger
      )

      // Should not perform any stock deduction
      expect(mockPrismaClient.productSize.update).not.toHaveBeenCalled()
      
      // Should log warning about parsing failure
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Could not extract productSizeId from kondisiAwal',
        expect.objectContaining({
          itemId,
          kondisiAwal,
          reason: 'parsing_failed'
        })
      )
    })

    it('should continue pickup process even if stock deduction fails', async () => {
      const kondisiAwal = JSON.stringify({
        productSizeId: 'test-product-size-id',
        size: 'M',
        ageCategory: 'ADULT',
        condition: 'baik',
        linkedSarung: null
      })

      const quantity = 1
      const itemId = 'test-item-id'
      const mockLogger = {
        warn: jest.fn(),
        info: jest.fn(),
        error: jest.fn()
      }

      // Mock stock deduction to fail
      mockPrismaClient.productSize.update.mockRejectedValue(
        new Error('Stock deduction failed')
      )

      // Should not throw error - should continue pickup process
      await expect(inventoryService.processStockForPickup(
        kondisiAwal,
        quantity,
        itemId,
        mockLogger
      )).resolves.not.toThrow()

      // Should log error but continue
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Stock deduction failed',
        expect.objectContaining({
          itemId,
          productSizeId: 'test-product-size-id',
          quantity,
          error: 'Failed to update stock on create: Stock deduction failed'
        })
      )
    })
  })

  describe('Transaction Context Handling', () => {
    it('should work with transaction context (no nested $transaction calls)', async () => {
      // This test verifies that the service works with transaction context
      // and doesn't attempt to call $transaction (which would fail)
      
      const jasProductSizeId = 'jas-size-id'
      const sarungProductSizeId = 'sarung-size-id'
      const quantity = 1

      // The key fix: using sequential updates instead of nested transactions
      await inventoryService.updateStockOnCreate(
        jasProductSizeId, 
        quantity, 
        sarungProductSizeId
      )

      // Should successfully complete dual deduction using sequential updates
      expect(mockPrismaClient.productSize.update).toHaveBeenCalledTimes(2)
      
      // Verify no attempt to call $transaction (which doesn't exist on transaction context)
      expect(mockPrismaClient.$transaction).toBeUndefined()
    })
  })
})