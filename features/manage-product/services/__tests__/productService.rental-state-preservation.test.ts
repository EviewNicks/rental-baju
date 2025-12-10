/**
 * Test: Product Quantity Update with Rental State Preservation
 * 
 * This test verifies that the critical fix for product quantity updates
 * properly preserves rental state and lost item tracking.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { ProductService } from '../productService'

// Mock Prisma for testing
const mockPrisma = {
  $transaction: jest.fn(),
  product: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  productSize: {
    findMany: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  category: {
    findUnique: jest.fn(),
  },
} as unknown as PrismaClient

describe('ProductService - Rental State Preservation', () => {
  let productService: ProductService
  const mockUserId = 'test-user-id'

  beforeEach(() => {
    productService = new ProductService(mockPrisma, mockUserId)
    jest.clearAllMocks()
    
    // Mock getProductById method that's called at the end of updateProduct
    jest.spyOn(productService, 'getProductById').mockResolvedValue({
      id: 'mocked-product',
      name: 'Mocked Product',
      sizes: [],
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('updateProduct with rental state preservation', () => {
    it('should preserve rentedQuantity when updating quantity', async () => {
      // Setup: Mock existing product with rented items (using valid UUIDs)
      const productId = '550e8400-e29b-41d4-a716-446655440000'
      const categoryId = '550e8400-e29b-41d4-a716-446655440001'
      const sizeId = '550e8400-e29b-41d4-a716-446655440002'
      
      const existingProduct = {
        id: productId,
        name: 'Test Product',
        categoryId: categoryId,
        isActive: true,
        sizes: [
          {
            id: sizeId,
            ageCategory: 'ADULT',
            size: 'M',
            originalQuantity: 5,
            rentedQuantity: 3,
            lostQuantity: 1,
            availableQuantity: 1,
          },
        ],
      }

      const mockCategory = {
        id: categoryId,
        name: 'Test Category',
        type: 'clothing',
      }

      // Mock Prisma calls
      mockPrisma.product.findUnique = jest.fn().mockResolvedValue(existingProduct)
      mockPrisma.category.findUnique = jest.fn().mockResolvedValue(mockCategory)

      // Mock transaction
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          product: { update: jest.fn() },
          productSize: {
            findMany: jest.fn().mockResolvedValue([
              {
                id: sizeId,
                ageCategory: 'ADULT',
                size: 'M',
                rentedQuantity: 3,
                lostQuantity: 1,
              },
            ]),
            update: jest.fn(),
          },
        }
        return callback(mockTx)
      })
      mockPrisma.$transaction = mockTransaction

      // Act: Update quantity from 5 to 10
      const updateRequest = {
        sizes: [
          {
            ageCategory: 'ADULT' as const,
            size: 'M' as const,
            quantity: 10,
            originalQuantity: 10,
          },
        ],
      }

      await productService.updateProduct(productId, updateRequest)

      // Assert: Verify transaction was called
      expect(mockTransaction).toHaveBeenCalled()

      // Get the transaction callback and verify the update call
      const transactionCallback = mockTransaction.mock.calls[0][0]
      const mockTx = {
        product: { update: jest.fn() },
        productSize: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: sizeId,
              ageCategory: 'ADULT',
              size: 'M',
              rentedQuantity: 3,
              lostQuantity: 1,
            },
          ]),
          update: jest.fn(),
        },
      }

      await transactionCallback(mockTx)

      // Verify that ProductSize.update was called with preserved rental state
      expect(mockTx.productSize.update).toHaveBeenCalledWith({
        where: { id: sizeId },
        data: {
          quantity: 10,
          originalQuantity: 10,
          availableQuantity: 6, // 10 - 3 (rented) - 1 (lost) = 6
          updatedAt: expect.any(Date),
        },
      })
    })

    it('should reject quantity reduction below rented + lost items', async () => {
      // Setup: Mock existing product with rented and lost items (using valid UUIDs)
      const productId = '550e8400-e29b-41d4-a716-446655440010'
      const categoryId = '550e8400-e29b-41d4-a716-446655440011'
      const sizeId = '550e8400-e29b-41d4-a716-446655440012'
      
      const existingProduct = {
        id: productId,
        name: 'Test Product',
        categoryId: categoryId,
        isActive: true,
        sizes: [
          {
            id: sizeId,
            ageCategory: 'ADULT',
            size: 'M',
            originalQuantity: 5,
            rentedQuantity: 3,
            lostQuantity: 1,
            availableQuantity: 1,
          },
        ],
      }

      const mockCategory = {
        id: categoryId,
        name: 'Test Category',
        type: 'clothing',
      }

      // Mock Prisma calls
      mockPrisma.product.findUnique = jest.fn().mockResolvedValue(existingProduct)
      mockPrisma.category.findUnique = jest.fn().mockResolvedValue(mockCategory)

      // Mock transaction that will throw error
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          product: { update: jest.fn() },
          productSize: {
            findMany: jest.fn().mockResolvedValue([
              {
                id: sizeId,
                ageCategory: 'ADULT',
                size: 'M',
                rentedQuantity: 3,
                lostQuantity: 1,
              },
            ]),
            update: jest.fn(),
          },
        }
        return callback(mockTx)
      })
      mockPrisma.$transaction = mockTransaction

      // Act & Assert: Try to reduce quantity below minimum required
      const updateRequest = {
        sizes: [
          {
            ageCategory: 'ADULT' as const,
            size: 'M' as const,
            quantity: 3, // Less than 4 (3 rented + 1 lost)
            originalQuantity: 3,
          },
        ],
      }

      await expect(
        productService.updateProduct(productId, updateRequest)
      ).rejects.toThrow(
        'Cannot reduce quantity below rented (3) + lost (1) items for size ADULT-M'
      )
    })

    it('should handle new sizes without rental state', async () => {
      // Setup: Mock existing product (using valid UUIDs)
      const productId = '550e8400-e29b-41d4-a716-446655440020'
      const categoryId = '550e8400-e29b-41d4-a716-446655440021'
      
      const existingProduct = {
        id: productId,
        name: 'Test Product',
        categoryId: categoryId,
        isActive: true,
        sizes: [],
      }

      const mockCategory = {
        id: categoryId,
        name: 'Test Category',
        type: 'clothing',
      }

      // Mock Prisma calls
      mockPrisma.product.findUnique = jest.fn().mockResolvedValue(existingProduct)
      mockPrisma.category.findUnique = jest.fn().mockResolvedValue(mockCategory)

      // Mock transaction
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          product: { update: jest.fn() },
          productSize: {
            findMany: jest.fn().mockResolvedValue([]), // No existing sizes
            create: jest.fn(),
          },
        }
        return callback(mockTx)
      })
      mockPrisma.$transaction = mockTransaction

      // Act: Add new size
      const updateRequest = {
        sizes: [
          {
            ageCategory: 'ADULT' as const,
            size: 'L' as const,
            quantity: 5,
            originalQuantity: 5,
          },
        ],
      }

      await productService.updateProduct(productId, updateRequest)

      // Assert: Verify new size was created with default values
      expect(mockTransaction).toHaveBeenCalled()

      const transactionCallback = mockTransaction.mock.calls[0][0]
      const mockTx = {
        product: { update: jest.fn() },
        productSize: {
          findMany: jest.fn().mockResolvedValue([]),
          create: jest.fn(),
        },
      }

      await transactionCallback(mockTx)

      expect(mockTx.productSize.create).toHaveBeenCalledWith({
        data: {
          productId: productId,
          ageCategory: 'ADULT',
          size: 'L',
          quantity: 5,
          originalQuantity: 5,
          availableQuantity: 5,
          rentedQuantity: 0,
          lostQuantity: 0,
          isActive: true,
          createdBy: mockUserId,
        },
      })
    })
  })
})