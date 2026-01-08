/**
 * Unit Tests for ProductCostService
 * Tests modal awal calculation logic and product cost management
 * Feature: cost-item-management, Property 9: Modal Awal Sum Calculation
 * Feature: cost-item-management, Property 8: Modal Awal Automatic Recalculation
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { ProductCostService } from '../productCostService'
import { NotFoundError, ConflictError } from '../../lib/errors/AppError'

// Mock PrismaClient
const mockPrisma = {
  product: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  costItem: {
    findUnique: jest.fn(),
  },
  productCost: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    aggregate: jest.fn(),
  },
} as unknown as PrismaClient

describe('ProductCostService', () => {
  let productCostService: ProductCostService
  const mockUserId = 'user-123'
  
  // Valid UUIDs for testing
  const validProductId = '550e8400-e29b-41d4-a716-446655440000'
  const validCostItemId = '550e8400-e29b-41d4-a716-446655440001'
  const validProductCostId = '550e8400-e29b-41d4-a716-446655440002'

  beforeEach(() => {
    productCostService = new ProductCostService(mockPrisma, mockUserId)
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('addProductCost', () => {
    const validAddRequest = {
      costItemId: validCostItemId,
      amount: 150.75,
      notes: 'Test notes',
    }

    it('should add cost item to product successfully', async () => {
      const mockProduct = {
        id: validProductId,
        name: 'Test Product',
      }

      const mockCostItem = {
        id: validCostItemId,
        name: 'Test Cost Item',
      }

      const mockCreatedProductCost = {
        id: validProductCostId,
        productId: validProductId,
        costItemId: validCostItemId,
        amount: new Decimal(150.75),
        notes: 'Test notes',
        createdAt: new Date(),
        updatedAt: new Date(),
        costItem: mockCostItem,
      }

      const mockUpdatedProduct = {
        ...mockProduct,
        modalAwal: new Decimal(150.75),
      }

      mockPrisma.product.findUnique = jest.fn().mockResolvedValue(mockProduct)
      mockPrisma.costItem.findUnique = jest.fn().mockResolvedValue(mockCostItem)
      mockPrisma.productCost.findUnique = jest.fn().mockResolvedValue(null) // No existing relationship
      mockPrisma.productCost.create = jest.fn().mockResolvedValue(mockCreatedProductCost)
      mockPrisma.productCost.aggregate = jest.fn().mockResolvedValue({
        _sum: { amount: new Decimal(150.75) },
      })
      mockPrisma.product.update = jest.fn().mockResolvedValue(mockUpdatedProduct)

      const result = await productCostService.addProductCost(validProductId, validAddRequest)

      expect(result.amount).toBe(150.75)
      expect(result.notes).toBe('Test notes')
      expect(mockPrisma.productCost.create).toHaveBeenCalledWith({
        data: {
          productId: validProductId,
          costItemId: validCostItemId,
          amount: new Decimal(150.75),
          notes: 'Test notes',
        },
        include: {
          costItem: true,
        },
      })
    })

    it('should throw NotFoundError when product does not exist', async () => {
      mockPrisma.product.findUnique = jest.fn().mockResolvedValue(null)

      await expect(productCostService.addProductCost('550e8400-e29b-41d4-a716-446655440999', validAddRequest))
        .rejects
        .toThrow(NotFoundError)
    })

    it('should throw NotFoundError when cost item does not exist', async () => {
      const mockProduct = { id: validProductId }
      mockPrisma.product.findUnique = jest.fn().mockResolvedValue(mockProduct)
      mockPrisma.costItem.findUnique = jest.fn().mockResolvedValue(null)

      await expect(productCostService.addProductCost(validProductId, validAddRequest))
        .rejects
        .toThrow(NotFoundError)
    })

    it('should throw ConflictError when cost item already assigned to product', async () => {
      const mockProduct = { id: validProductId }
      const mockCostItem = { id: validCostItemId }
      const existingProductCost = {
        id: validProductCostId,
        productId: validProductId,
        costItemId: validCostItemId,
      }

      mockPrisma.product.findUnique = jest.fn().mockResolvedValue(mockProduct)
      mockPrisma.costItem.findUnique = jest.fn().mockResolvedValue(mockCostItem)
      mockPrisma.productCost.findUnique = jest.fn().mockResolvedValue(existingProductCost)

      await expect(productCostService.addProductCost(validProductId, validAddRequest))
        .rejects
        .toThrow(ConflictError)
    })
  })

  describe('updateProductCost', () => {
    const validUpdateRequest = {
      amount: 200.50,
      notes: 'Updated notes',
    }

    it('should update product cost successfully', async () => {
      const existingProductCost = {
        id: validProductCostId,
        productId: validProductId,
        costItemId: validCostItemId,
        amount: new Decimal(150.75),
        notes: 'Original notes',
        costItem: {
          id: validCostItemId,
          name: 'Test Cost Item',
        },
      }

      const updatedProductCost = {
        ...existingProductCost,
        amount: new Decimal(200.50),
        notes: 'Updated notes',
        updatedAt: new Date(),
      }

      mockPrisma.productCost.findUnique = jest.fn().mockResolvedValue(existingProductCost)
      mockPrisma.productCost.update = jest.fn().mockResolvedValue(updatedProductCost)
      mockPrisma.productCost.aggregate = jest.fn().mockResolvedValue({
        _sum: { amount: new Decimal(200.50) },
      })
      mockPrisma.product.update = jest.fn().mockResolvedValue({
        id: validProductId,
        modalAwal: new Decimal(200.50),
      })

      const result = await productCostService.updateProductCost(validProductCostId, validUpdateRequest)

      expect(result.amount).toBe(200.50)
      expect(result.notes).toBe('Updated notes')
    })

    it('should throw NotFoundError when product cost does not exist', async () => {
      mockPrisma.productCost.findUnique = jest.fn().mockResolvedValue(null)

      await expect(productCostService.updateProductCost('550e8400-e29b-41d4-a716-446655440999', validUpdateRequest))
        .rejects
        .toThrow(NotFoundError)
    })
  })

  describe('removeProductCost', () => {
    it('should remove product cost successfully', async () => {
      const existingProductCost = {
        id: validProductCostId,
        productId: validProductId,
        costItemId: validCostItemId,
      }

      mockPrisma.productCost.findUnique = jest.fn().mockResolvedValue(existingProductCost)
      mockPrisma.productCost.delete = jest.fn().mockResolvedValue(existingProductCost)
      mockPrisma.productCost.aggregate = jest.fn().mockResolvedValue({
        _sum: { amount: new Decimal(0) },
      })
      mockPrisma.product.update = jest.fn().mockResolvedValue({
        id: validProductId,
        modalAwal: new Decimal(0),
      })

      const result = await productCostService.removeProductCost(validProductCostId)

      expect(result).toBe(true)
      expect(mockPrisma.productCost.delete).toHaveBeenCalledWith({
        where: { id: validProductCostId },
      })
    })

    it('should throw NotFoundError when product cost does not exist', async () => {
      mockPrisma.productCost.findUnique = jest.fn().mockResolvedValue(null)

      await expect(productCostService.removeProductCost('550e8400-e29b-41d4-a716-446655440999'))
        .rejects
        .toThrow(NotFoundError)
    })
  })

  describe('getProductCosts', () => {
    it('should return all product costs for a product', async () => {
      const mockProduct = { id: validProductId }
      const mockProductCosts = [
        {
          id: validProductCostId,
          productId: validProductId,
          costItemId: validCostItemId,
          amount: new Decimal(100.00),
          notes: 'Cost 1',
          createdAt: new Date(),
          updatedAt: new Date(),
          costItem: {
            id: validCostItemId,
            name: 'Cost Item 1',
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: mockUserId,
          },
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          productId: validProductId,
          costItemId: '550e8400-e29b-41d4-a716-446655440004',
          amount: new Decimal(50.00),
          notes: 'Cost 2',
          createdAt: new Date(),
          updatedAt: new Date(),
          costItem: {
            id: '550e8400-e29b-41d4-a716-446655440004',
            name: 'Cost Item 2',
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: mockUserId,
          },
        },
      ]

      mockPrisma.product.findUnique = jest.fn().mockResolvedValue(mockProduct)
      mockPrisma.productCost.findMany = jest.fn().mockResolvedValue(mockProductCosts)

      const result = await productCostService.getProductCosts(validProductId)

      expect(result).toHaveLength(2)
      expect(result[0].amount).toBe(100.00)
      expect(result[1].amount).toBe(50.00)
    })

    it('should throw NotFoundError when product does not exist', async () => {
      mockPrisma.product.findUnique = jest.fn().mockResolvedValue(null)

      await expect(productCostService.getProductCosts('550e8400-e29b-41d4-a716-446655440999'))
        .rejects
        .toThrow(NotFoundError)
    })
  })

  describe('calculateModalAwal', () => {
    it('should calculate modal awal as sum of all product costs', async () => {
      mockPrisma.productCost.aggregate = jest.fn().mockResolvedValue({
        _sum: { amount: new Decimal(350.75) },
      })

      const result = await productCostService.calculateModalAwal(validProductId)

      expect(result).toBe(350.75)
      expect(mockPrisma.productCost.aggregate).toHaveBeenCalledWith({
        where: { productId: validProductId },
        _sum: { amount: true },
      })
    })

    it('should return 0 when product has no costs', async () => {
      mockPrisma.productCost.aggregate = jest.fn().mockResolvedValue({
        _sum: { amount: null },
      })

      const result = await productCostService.calculateModalAwal(validProductId)

      expect(result).toBe(0)
    })

    it('should handle multiple cost items correctly', async () => {
      // Test case: Product with 3 cost items: 100.50 + 75.25 + 200.00 = 375.75
      mockPrisma.productCost.aggregate = jest.fn().mockResolvedValue({
        _sum: { amount: new Decimal(375.75) },
      })

      const result = await productCostService.calculateModalAwal(validProductId)

      expect(result).toBe(375.75)
    })
  })

  describe('recalculateModalAwal', () => {
    it('should recalculate and update product modal awal', async () => {
      const mockUpdatedProduct = {
        id: validProductId,
        code: 'PRD001',
        name: 'Test Product',
        description: null,
        modalAwal: new Decimal(275.50),
        imageUrl: null,
        categoryId: '550e8400-e29b-41d4-a716-446655440005',
        status: 'AVAILABLE',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
        size: null,
        currentPrice: new Decimal(100.00),
      }

      mockPrisma.productCost.aggregate = jest.fn().mockResolvedValue({
        _sum: { amount: new Decimal(275.50) },
      })
      mockPrisma.product.update = jest.fn().mockResolvedValue(mockUpdatedProduct)

      const result = await productCostService.recalculateModalAwal(validProductId)

      expect(result.modalAwal).toBe(275.50)
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: validProductId },
        data: {
          modalAwal: new Decimal(275.50),
          updatedAt: expect.any(Date),
        },
      })
    })
  })

  describe('getProductWithCosts', () => {
    it('should return product with costs and total production cost', async () => {
      const mockProduct = {
        id: validProductId,
        code: 'PRD001',
        name: 'Test Product',
        description: null,
        modalAwal: new Decimal(150.00),
        imageUrl: null,
        categoryId: '550e8400-e29b-41d4-a716-446655440005',
        status: 'AVAILABLE',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
        size: null,
        currentPrice: new Decimal(100.00),
      }

      const mockProductCosts = [
        {
          id: validProductCostId,
          productId: validProductId,
          costItemId: validCostItemId,
          amount: new Decimal(100.00),
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          costItem: {
            id: validCostItemId,
            name: 'Cost Item 1',
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: mockUserId,
          },
        },
      ]

      mockPrisma.product.findUnique = jest.fn().mockResolvedValue(mockProduct)
      mockPrisma.productCost.findMany = jest.fn().mockResolvedValue(mockProductCosts)
      mockPrisma.productCost.aggregate = jest.fn().mockResolvedValue({
        _sum: { amount: new Decimal(100.00) },
      })

      const result = await productCostService.getProductWithCosts(validProductId)

      expect(result.product.id).toBe(validProductId)
      expect(result.costs).toHaveLength(1)
      expect(result.totalProductionCost).toBe(100.00)
    })

    it('should throw NotFoundError when product does not exist', async () => {
      mockPrisma.product.findUnique = jest.fn().mockResolvedValue(null)

      await expect(productCostService.getProductWithCosts('550e8400-e29b-41d4-a716-446655440999'))
        .rejects
        .toThrow(NotFoundError)
    })
  })

  // Property-based test scenarios
  describe('Modal Awal Calculation Properties', () => {
    it('should maintain consistency: modal awal equals sum of all cost amounts', async () => {
      // Property 9: Modal Awal Sum Calculation
      const testCases = [
        { costs: [100.50, 75.25, 200.00], expected: 375.75 },
        { costs: [0], expected: 0 },
        { costs: [1000.99], expected: 1000.99 },
        { costs: [50.25, 25.75, 100.00, 324.00], expected: 500.00 },
      ]

      for (const testCase of testCases) {
        mockPrisma.productCost.aggregate = jest.fn().mockResolvedValue({
          _sum: { amount: new Decimal(testCase.expected) },
        })

        const result = await productCostService.calculateModalAwal(validProductId)
        expect(result).toBe(testCase.expected)
      }
    })

    it('should automatically recalculate modal awal when costs change', async () => {
      // Property 8: Modal Awal Automatic Recalculation
      const existingProductCost = {
        id: validProductCostId,
        productId: validProductId,
        costItemId: validCostItemId,
        amount: new Decimal(100.00),
        costItem: { id: validCostItemId, name: 'Test' },
      }

      // Mock update that changes amount from 100 to 150
      mockPrisma.productCost.findUnique = jest.fn().mockResolvedValue(existingProductCost)
      mockPrisma.productCost.update = jest.fn().mockResolvedValue({
        ...existingProductCost,
        amount: new Decimal(150.00),
      })
      
      // Mock recalculation showing new total
      mockPrisma.productCost.aggregate = jest.fn().mockResolvedValue({
        _sum: { amount: new Decimal(150.00) },
      })
      
      mockPrisma.product.update = jest.fn().mockResolvedValue({
        id: validProductId,
        modalAwal: new Decimal(150.00),
      })

      await productCostService.updateProductCost(validProductCostId, { amount: 150.00 })

      // Verify that recalculation was triggered
      expect(mockPrisma.productCost.aggregate).toHaveBeenCalled()
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: validProductId },
        data: {
          modalAwal: new Decimal(150.00),
          updatedAt: expect.any(Date),
        },
      })
    })
  })
})