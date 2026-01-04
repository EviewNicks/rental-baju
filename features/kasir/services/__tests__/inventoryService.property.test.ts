/**
 * Property-based tests for InventoryService - Pickup-Pairing Integration
 * Tests dual stock management and backward compatibility properties
 */

import { fc } from '@fast-check/jest'
import { PrismaClient } from '@prisma/client'
import { InventoryService } from '../inventoryService'

// Mock Prisma for property tests
const mockPrisma = {
  productSize: {
    update: jest.fn(),
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
} as unknown as PrismaClient

// Data generators
const uuidArb = fc.uuid()
const positiveIntArb = fc.integer({ min: 1, max: 100 })
const stockDataArb = fc.record({
  originalQuantity: fc.integer({ min: 10, max: 1000 }),
  availableQuantity: fc.integer({ min: 5, max: 500 }),
  rentedQuantity: fc.integer({ min: 0, max: 500 }),
})

// Generate kondisiAwal data for testing
const jasWithSarungArb = fc.record({
  productSizeId: uuidArb,
  size: fc.constantFrom('S', 'M', 'L', 'XL'),
  ageCategory: fc.constantFrom('ADULT', 'CHILD'),
  condition: fc.constantFrom('baik', 'rusak'),
  linkedSarung: fc.record({
    productId: uuidArb,
    productSizeId: uuidArb,
    quantity: fc.integer({ min: 1, max: 5 }),
    product: fc.option(fc.record({
      name: fc.string({ minLength: 1, maxLength: 50 }),
      code: fc.string({ minLength: 1, maxLength: 20 })
    }))
  })
})

const regularItemArb = fc.record({
  productSizeId: uuidArb,
  size: fc.constantFrom('S', 'M', 'L', 'XL'),
  ageCategory: fc.constantFrom('ADULT', 'CHILD'),
  condition: fc.constantFrom('baik', 'rusak'),
  // No linkedSarung for regular items
})

describe('InventoryService Property Tests - Pickup-Pairing Integration', () => {
  let inventoryService: InventoryService

  beforeEach(() => {
    jest.clearAllMocks()
    inventoryService = new InventoryService(mockPrisma)
  })

  describe('Property 3: Dual stock management for pairings', () => {
    test('updateStockOnCreate with linkedSarungSizeId performs dual deduction', () => {
      fc.assert(fc.property(
        uuidArb, // main item sizeId
        uuidArb, // linked sarung sizeId
        positiveIntArb, // quantity
        async (mainSizeId, linkedSizeId, quantity) => {
          // Ensure different IDs for main and linked items
          fc.pre(mainSizeId !== linkedSizeId)

          // Mock successful transaction
          ;(mockPrisma.$transaction as jest.Mock).mockResolvedValueOnce([{}, {}])

          await inventoryService.updateStockOnCreate(mainSizeId, quantity, linkedSizeId)

          // Should call $transaction with array of two updates
          expect(mockPrisma.$transaction).toHaveBeenCalledWith([
            expect.objectContaining({
              // Main item update
            }),
            expect.objectContaining({
              // Linked sarung update
            })
          ])

          // Verify transaction was called exactly once
          expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)
        }
      ), { numRuns: 50 })
    })

    test('processStockForPickup handles jas-sarung pairing correctly', () => {
      fc.assert(fc.property(
        jasWithSarungArb,
        positiveIntArb, // quantity
        fc.string(), // itemId
        async (jasData, quantity, itemId) => {
          const kondisiAwal = JSON.stringify(jasData)
          const mockLogger = {
            warn: jest.fn(),
            info: jest.fn(),
            error: jest.fn(),
          }

          // Mock successful dual deduction
          ;(mockPrisma.$transaction as jest.Mock).mockResolvedValueOnce([{}, {}])

          await inventoryService.processStockForPickup(kondisiAwal, quantity, itemId, mockLogger)

          // Should log successful dual deduction
          expect(mockLogger.info).toHaveBeenCalledWith(
            'Dual stock deduction completed for jas-sarung pairing',
            expect.objectContaining({
              itemId,
              jasProductSizeId: jasData.productSizeId,
              sarungProductSizeId: jasData.linkedSarung.productSizeId,
              quantity
            })
          )

          // Should not log any warnings or errors for valid data
          expect(mockLogger.warn).not.toHaveBeenCalled()
          expect(mockLogger.error).not.toHaveBeenCalled()
        }
      ), { numRuns: 50 })
    })

    test('dual deduction uses 1:1 ratio consistently', () => {
      fc.assert(fc.property(
        uuidArb, // main sizeId
        uuidArb, // linked sizeId  
        positiveIntArb, // quantity
        async (mainSizeId, linkedSizeId, quantity) => {
          fc.pre(mainSizeId !== linkedSizeId)

          // Capture the transaction calls
          const transactionCalls: any[] = []
          ;(mockPrisma.$transaction as jest.Mock).mockImplementationOnce((operations) => {
            transactionCalls.push(...operations)
            return Promise.resolve([{}, {}])
          })

          await inventoryService.updateStockOnCreate(mainSizeId, quantity, linkedSizeId)

          // Should have exactly 2 operations
          expect(transactionCalls).toHaveLength(2)

          // Both operations should use the same quantity (1:1 ratio)
          const mainUpdate = transactionCalls[0]
          const linkedUpdate = transactionCalls[1]

          // Verify both updates use same quantity increments/decrements
          expect(mainUpdate.data.rentedQuantity.increment).toBe(quantity)
          expect(mainUpdate.data.availableQuantity.decrement).toBe(quantity)
          expect(linkedUpdate.data.rentedQuantity.increment).toBe(quantity)
          expect(linkedUpdate.data.availableQuantity.decrement).toBe(quantity)
        }
      ), { numRuns: 50 })
    })
  })

  describe('Property 4: Backward compatibility stock management', () => {
    test('updateStockOnCreate without linkedSarungSizeId works as before', () => {
      fc.assert(fc.property(
        uuidArb, // sizeId
        positiveIntArb, // quantity
        async (sizeId, quantity) => {
          // Mock successful single update
          ;(mockPrisma.productSize.update as jest.Mock).mockResolvedValueOnce({})

          await inventoryService.updateStockOnCreate(sizeId, quantity)

          // Should call single update, not transaction
          expect(mockPrisma.productSize.update).toHaveBeenCalledWith({
            where: { id: sizeId },
            data: {
              rentedQuantity: { increment: quantity },
              availableQuantity: { decrement: quantity },
            },
          })

          // Should not call $transaction for single items
          expect(mockPrisma.$transaction).not.toHaveBeenCalled()
        }
      ), { numRuns: 50 })
    })

    test('processStockForPickup handles regular items normally', () => {
      fc.assert(fc.property(
        regularItemArb,
        positiveIntArb, // quantity
        fc.string(), // itemId
        async (regularData, quantity, itemId) => {
          const kondisiAwal = JSON.stringify(regularData)
          const mockLogger = {
            warn: jest.fn(),
            info: jest.fn(),
            error: jest.fn(),
          }

          // Mock successful single update
          ;(mockPrisma.productSize.update as jest.Mock).mockResolvedValueOnce({})

          await inventoryService.processStockForPickup(kondisiAwal, quantity, itemId, mockLogger)

          // Should log single item processing
          expect(mockLogger.info).toHaveBeenCalledWith(
            'Stock deduction completed for regular item',
            expect.objectContaining({
              itemId,
              productSizeId: regularData.productSizeId,
              quantity
            })
          )

          // Should use single update, not transaction
          expect(mockPrisma.productSize.update).toHaveBeenCalled()
          expect(mockPrisma.$transaction).not.toHaveBeenCalled()
        }
      ), { numRuns: 50 })
    })

    test('pipe format kondisiAwal works with existing logic', () => {
      fc.assert(fc.property(
        uuidArb,
        fc.constantFrom('S', 'M', 'L', 'XL'),
        fc.constantFrom('ADULT', 'CHILD'),
        fc.constantFrom('baik', 'rusak'),
        positiveIntArb,
        fc.string(),
        async (productSizeId, size, ageCategory, condition, quantity, itemId) => {
          const pipeFormat = `${productSizeId}|${size}|${ageCategory}|${condition}`
          const mockLogger = {
            warn: jest.fn(),
            info: jest.fn(),
            error: jest.fn(),
          }

          // Mock successful single update
          ;(mockPrisma.productSize.update as jest.Mock).mockResolvedValueOnce({})

          await inventoryService.processStockForPickup(pipeFormat, quantity, itemId, mockLogger)

          // Should process as regular item (no linkedSarung in pipe format)
          expect(mockLogger.info).toHaveBeenCalledWith(
            'Stock deduction completed for regular item',
            expect.objectContaining({
              itemId,
              productSizeId,
              quantity
            })
          )

          // Should use single update for pipe format
          expect(mockPrisma.productSize.update).toHaveBeenCalled()
          expect(mockPrisma.$transaction).not.toHaveBeenCalled()
        }
      ), { numRuns: 50 })
    })
  })

  describe('Property 5: Error handling and resilience', () => {
    test('processStockForPickup handles invalid kondisiAwal gracefully', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.constant(''), // empty string
          fc.constant('invalid-json'), // invalid JSON
          fc.constant(null), // null
          fc.constant(undefined), // undefined
          fc.constant('{"incomplete": true}') // JSON without productSizeId
        ),
        positiveIntArb,
        fc.string(),
        async (invalidKondisiAwal, quantity, itemId) => {
          const mockLogger = {
            warn: jest.fn(),
            info: jest.fn(),
            error: jest.fn(),
          }

          // Should not throw for invalid data
          await expect(
            inventoryService.processStockForPickup(invalidKondisiAwal as any, quantity, itemId, mockLogger)
          ).resolves.not.toThrow()

          // Should log warning for unparseable data
          expect(mockLogger.warn).toHaveBeenCalledWith(
            'Could not extract productSizeId from kondisiAwal',
            expect.objectContaining({
              itemId,
              kondisiAwal: invalidKondisiAwal,
              reason: 'parsing_failed'
            })
          )

          // Should not attempt any stock operations
          expect(mockPrisma.productSize.update).not.toHaveBeenCalled()
          expect(mockPrisma.$transaction).not.toHaveBeenCalled()
        }
      ), { numRuns: 50 })
    })

    test('stock operation failures do not throw errors', () => {
      fc.assert(fc.property(
        jasWithSarungArb,
        positiveIntArb,
        fc.string(),
        async (jasData, quantity, itemId) => {
          const kondisiAwal = JSON.stringify(jasData)
          const mockLogger = {
            warn: jest.fn(),
            info: jest.fn(),
            error: jest.fn(),
          }

          // Mock database failure
          ;(mockPrisma.$transaction as jest.Mock).mockRejectedValueOnce(new Error('Database error'))

          // Should not throw despite database error
          await expect(
            inventoryService.processStockForPickup(kondisiAwal, quantity, itemId, mockLogger)
          ).resolves.not.toThrow()

          // Should log error but continue
          expect(mockLogger.error).toHaveBeenCalledWith(
            'Stock deduction failed',
            expect.objectContaining({
              itemId,
              error: 'Database error'
            })
          )
        }
      ), { numRuns: 30 })
    })
  })

  describe('Property 6: Input validation', () => {
    test('updateStockOnCreate rejects non-positive quantities', () => {
      fc.assert(fc.property(
        uuidArb,
        fc.integer({ max: 0 }), // non-positive quantity
        async (sizeId, invalidQuantity) => {
          await expect(
            inventoryService.updateStockOnCreate(sizeId, invalidQuantity)
          ).rejects.toThrow('Quantity must be greater than 0')

          // Should not call any database operations
          expect(mockPrisma.productSize.update).not.toHaveBeenCalled()
          expect(mockPrisma.$transaction).not.toHaveBeenCalled()
        }
      ), { numRuns: 30 })
    })

    test('dual deduction also validates quantity', () => {
      fc.assert(fc.property(
        uuidArb, // main sizeId
        uuidArb, // linked sizeId
        fc.integer({ max: 0 }), // invalid quantity
        async (mainSizeId, linkedSizeId, invalidQuantity) => {
          fc.pre(mainSizeId !== linkedSizeId)

          await expect(
            inventoryService.updateStockOnCreate(mainSizeId, invalidQuantity, linkedSizeId)
          ).rejects.toThrow('Quantity must be greater than 0')

          // Should not call any database operations
          expect(mockPrisma.productSize.update).not.toHaveBeenCalled()
          expect(mockPrisma.$transaction).not.toHaveBeenCalled()
        }
      ), { numRuns: 30 })
    })
  })
})