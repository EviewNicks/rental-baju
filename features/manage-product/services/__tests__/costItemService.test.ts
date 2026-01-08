/**
 * Unit Tests for CostItemService
 * Tests business logic, validation, and error handling
 * Feature: cost-item-management, Property 2: Cost Item Creation with Name Only
 * Feature: cost-item-management, Property 5: Deletion Prevention for Used Cost Items
 * Feature: cost-item-management, Property 21: Cost Item Name Uniqueness
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { CostItemService } from '../costItemService'
import { NotFoundError, ConflictError } from '../../lib/errors/AppError'

// Mock PrismaClient
const mockPrisma = {
  costItem: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  productCost: {
    count: jest.fn(),
    aggregate: jest.fn(),
  },
} as unknown as PrismaClient

describe('CostItemService', () => {
  let costItemService: CostItemService
  const mockUserId = 'user-123'
  
  // Valid UUIDs for testing
  const validCostItemId = '550e8400-e29b-41d4-a716-446655440000'

  beforeEach(() => {
    costItemService = new CostItemService(mockPrisma, mockUserId)
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('createCostItem', () => {
    const validCreateRequest = {
      name: 'Kain Katun Premium',
    }

    it('should create cost item successfully with valid data', async () => {
      // Mock: no existing cost item with same name
      mockPrisma.costItem.findFirst = jest.fn().mockResolvedValue(null)
      
      // Mock: successful creation
      const mockCreatedCostItem = {
        id: validCostItemId,
        name: 'Kain Katun Premium',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
      }
      mockPrisma.costItem.create = jest.fn().mockResolvedValue(mockCreatedCostItem)

      const result = await costItemService.createCostItem(validCreateRequest)

      expect(mockPrisma.costItem.findFirst).toHaveBeenCalledWith({
        where: {
          name: {
            equals: 'Kain Katun Premium',
            mode: 'insensitive',
          },
        },
      })
      expect(mockPrisma.costItem.create).toHaveBeenCalledWith({
        data: {
          name: 'Kain Katun Premium',
          createdBy: mockUserId,
        },
      })
      expect(result).toEqual(mockCreatedCostItem)
    })

    it('should throw ConflictError when cost item name already exists', async () => {
      // Mock: existing cost item with same name
      const existingCostItem = {
        id: validCostItemId,
        name: 'Kain Katun Premium',
      }
      mockPrisma.costItem.findFirst = jest.fn().mockResolvedValue(existingCostItem)

      await expect(costItemService.createCostItem(validCreateRequest))
        .rejects
        .toThrow(ConflictError)

      expect(mockPrisma.costItem.create).not.toHaveBeenCalled()
    })

    it('should handle case-insensitive name checking', async () => {
      const requestWithDifferentCase = {
        name: 'KAIN KATUN PREMIUM',
      }

      // Mock: existing cost item with different case
      const existingCostItem = {
        id: validCostItemId,
        name: 'kain katun premium',
      }
      mockPrisma.costItem.findFirst = jest.fn().mockResolvedValue(existingCostItem)

      await expect(costItemService.createCostItem(requestWithDifferentCase))
        .rejects
        .toThrow(ConflictError)
    })

    it('should reject empty name', async () => {
      const invalidRequest = {
        name: '',
      }

      await expect(costItemService.createCostItem(invalidRequest))
        .rejects
        .toThrow()
    })

    it('should reject whitespace-only name', async () => {
      const invalidRequest = {
        name: '   ',
      }

      await expect(costItemService.createCostItem(invalidRequest))
        .rejects
        .toThrow()
    })

    it('should reject name exceeding maximum length', async () => {
      const invalidRequest = {
        name: 'a'.repeat(256), // Exceeds 255 character limit
      }

      await expect(costItemService.createCostItem(invalidRequest))
        .rejects
        .toThrow()
    })
  })

  describe('updateCostItem', () => {
    const validUpdateRequest = {
      name: 'Updated Cost Item Name',
    }

    it('should update cost item successfully', async () => {
      const existingCostItem = {
        id: validCostItemId,
        name: 'Original Name',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
      }

      const updatedCostItem = {
        ...existingCostItem,
        name: 'Updated Cost Item Name',
        updatedAt: new Date(),
      }

      mockPrisma.costItem.findUnique = jest.fn().mockResolvedValue(existingCostItem)
      mockPrisma.costItem.findFirst = jest.fn().mockResolvedValue(null) // No conflict
      mockPrisma.costItem.update = jest.fn().mockResolvedValue(updatedCostItem)

      const result = await costItemService.updateCostItem(validCostItemId, validUpdateRequest)

      expect(result.name).toBe('Updated Cost Item Name')
    })

    it('should throw NotFoundError when cost item does not exist', async () => {
      mockPrisma.costItem.findUnique = jest.fn().mockResolvedValue(null)

      await expect(costItemService.updateCostItem('550e8400-e29b-41d4-a716-446655440999', validUpdateRequest))
        .rejects
        .toThrow(NotFoundError)
    })

    it('should throw ConflictError when updated name conflicts with existing cost item', async () => {
      const existingCostItem = {
        id: validCostItemId,
        name: 'Original Name',
      }

      const conflictingCostItem = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Updated Cost Item Name',
      }

      mockPrisma.costItem.findUnique = jest.fn().mockResolvedValue(existingCostItem)
      mockPrisma.costItem.findFirst = jest.fn().mockResolvedValue(conflictingCostItem)

      await expect(costItemService.updateCostItem(validCostItemId, validUpdateRequest))
        .rejects
        .toThrow(ConflictError)
    })
  })

  describe('getCostItems', () => {
    it('should return paginated cost items with search', async () => {
      const mockCostItems = [
        {
          id: validCostItemId,
          name: 'Kain Katun',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: mockUserId,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          name: 'Transport Jakarta',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: mockUserId,
        },
      ]

      mockPrisma.costItem.findMany = jest.fn().mockResolvedValue(mockCostItems)
      mockPrisma.costItem.count = jest.fn().mockResolvedValue(2)

      const result = await costItemService.getCostItems({
        page: '1',
        limit: '10',
        search: 'kain',
      })

      expect(result.costItems).toHaveLength(2)
      expect(result.pagination.total).toBe(2)
      expect(mockPrisma.costItem.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            contains: 'kain',
            mode: 'insensitive',
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: 0,
        take: 10,
      })
    })

    it('should handle pagination correctly', async () => {
      mockPrisma.costItem.findMany = jest.fn().mockResolvedValue([])
      mockPrisma.costItem.count = jest.fn().mockResolvedValue(25)

      const result = await costItemService.getCostItems({
        page: '3',
        limit: '10',
      })

      expect(result.pagination.page).toBe(3)
      expect(result.pagination.limit).toBe(10)
      expect(result.pagination.total).toBe(25)
      expect(result.pagination.totalPages).toBe(3)
      expect(mockPrisma.costItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (page 3 - 1) * limit 10
          take: 10,
        })
      )
    })
  })

  describe('getCostItemById', () => {
    it('should return cost item when found', async () => {
      const mockCostItem = {
        id: validCostItemId,
        name: 'Test Cost Item',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
      }

      mockPrisma.costItem.findUnique = jest.fn().mockResolvedValue(mockCostItem)

      const result = await costItemService.getCostItemById(validCostItemId)

      expect(result).toEqual(mockCostItem)
    })

    it('should throw NotFoundError when cost item not found', async () => {
      mockPrisma.costItem.findUnique = jest.fn().mockResolvedValue(null)

      await expect(costItemService.getCostItemById('550e8400-e29b-41d4-a716-446655440999'))
        .rejects
        .toThrow(NotFoundError)
    })
  })

  describe('deleteCostItem', () => {
    it('should delete cost item successfully when not in use', async () => {
      const existingCostItem = {
        id: validCostItemId,
        name: 'Test Cost Item',
      }

      mockPrisma.costItem.findUnique = jest.fn().mockResolvedValue(existingCostItem)
      mockPrisma.productCost.count = jest.fn().mockResolvedValue(0) // Not in use
      mockPrisma.costItem.delete = jest.fn().mockResolvedValue(existingCostItem)

      const result = await costItemService.deleteCostItem(validCostItemId)

      expect(result).toBe(true)
      expect(mockPrisma.costItem.delete).toHaveBeenCalledWith({
        where: { id: validCostItemId },
      })
    })

    it('should throw NotFoundError when cost item does not exist', async () => {
      mockPrisma.costItem.findUnique = jest.fn().mockResolvedValue(null)

      await expect(costItemService.deleteCostItem('550e8400-e29b-41d4-a716-446655440999'))
        .rejects
        .toThrow(NotFoundError)
    })

    it('should throw ConflictError when cost item is in use by products', async () => {
      const existingCostItem = {
        id: validCostItemId,
        name: 'Test Cost Item',
      }

      mockPrisma.costItem.findUnique = jest.fn().mockResolvedValue(existingCostItem)
      mockPrisma.productCost.count = jest.fn().mockResolvedValue(3) // Used by 3 products

      await expect(costItemService.deleteCostItem(validCostItemId))
        .rejects
        .toThrow(ConflictError)

      expect(mockPrisma.costItem.delete).not.toHaveBeenCalled()
    })
  })

  describe('getActiveCostItems', () => {
    it('should return all cost items ordered by name', async () => {
      const mockCostItems = [
        {
          id: validCostItemId,
          name: 'A Cost Item',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: mockUserId,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          name: 'B Cost Item',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: mockUserId,
        },
      ]

      mockPrisma.costItem.findMany = jest.fn().mockResolvedValue(mockCostItems)

      const result = await costItemService.getActiveCostItems()

      expect(result).toHaveLength(2)
      expect(mockPrisma.costItem.findMany).toHaveBeenCalledWith({
        orderBy: {
          name: 'asc',
        },
      })
    })
  })

  describe('getCostItemUsage', () => {
    it('should return cost item with usage statistics', async () => {
      const mockCostItem = {
        id: validCostItemId,
        name: 'Test Cost Item',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
      }

      mockPrisma.costItem.findUnique = jest.fn().mockResolvedValue(mockCostItem)
      mockPrisma.productCost.count = jest.fn().mockResolvedValue(5)
      mockPrisma.productCost.aggregate = jest.fn().mockResolvedValue({
        _sum: { amount: 1500.50 },
      })

      const result = await costItemService.getCostItemUsage(validCostItemId)

      expect(result.usageCount).toBe(5)
      expect(result.totalValue).toBe(1500.50)
      expect(result.name).toBe('Test Cost Item')
    })
  })
})