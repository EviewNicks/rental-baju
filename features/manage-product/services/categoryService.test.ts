/**
 * Unit Tests untuk CategoryService
 * Testing CRUD operations, validation, and business rules
 * 
 * Coverage:
 * - Create category with validation
 * - Update category with partial data
 * - Get all categories with optional product inclusion
 * - Get category by ID
 * - Delete category with dependency check
 * - Name uniqueness validation
 * - Error handling scenarios
 */

import { CategoryService } from './categoryService'
import { PrismaClient } from '@prisma/client'
import {
  categorySchema,
  updateCategorySchema,
  categoryQuerySchema,
  categoryParamsSchema,
} from '../lib/validation/productSchema'
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  ProductStatus,
} from '../types'
import { Decimal } from '@prisma/client/runtime/library'

// Mocks
jest.mock('@prisma/client')
jest.mock('../lib/validation/productSchema')

const mockPrisma = {
  category: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
  },
} as unknown as jest.Mocked<PrismaClient>

describe('CategoryService', () => {
  let categoryService: CategoryService
  const mockUserId = 'user-123'

  beforeEach(() => {
    jest.clearAllMocks()
    categoryService = new CategoryService(mockPrisma, mockUserId)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('createCategory', () => {
    const mockCreateRequest: CreateCategoryRequest = {
      name: 'Dress Formal',
      color: '#FF5733',
    }

    const mockCreatedCategory: Category = {
      id: 'cat-123',
      name: 'Dress Formal',
      color: '#FF5733',
      products: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: mockUserId,
    }

    it('should create category successfully - happy path', async () => {
      // Arrange
      ;(categorySchema.parse as jest.Mock).mockReturnValue(mockCreateRequest)
      ;(mockPrisma.category.findFirst as jest.Mock).mockResolvedValue(null) // Name tidak duplicate
      ;(mockPrisma.category.create as jest.Mock).mockResolvedValue(mockCreatedCategory)

      // Act
      const result = await categoryService.createCategory(mockCreateRequest)

      // Assert
      expect(categorySchema.parse).toHaveBeenCalledWith(mockCreateRequest)
      expect(mockPrisma.category.findFirst).toHaveBeenCalledWith({
        where: { 
          name: {
            equals: 'Dress Formal',
            mode: 'insensitive'
          }
        },
      })
      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: {
          name: 'Dress Formal',
          color: '#FF5733',
          createdBy: mockUserId,
        },
      })
      expect(result).toEqual(mockCreatedCategory)
    })

    it('should throw error when category name already exists', async () => {
      // Arrange
      ;(categorySchema.parse as jest.Mock).mockReturnValue(mockCreateRequest)
      ;(mockPrisma.category.findFirst as jest.Mock).mockResolvedValue(mockCreatedCategory)

      // Act & Assert
      await expect(categoryService.createCategory(mockCreateRequest)).rejects.toThrow(
        'Nama kategori "Dress Formal" sudah digunakan'
      )
      expect(mockPrisma.category.create).not.toHaveBeenCalled()
    })

    it('should handle case-insensitive name checking', async () => {
      // Arrange
      const requestWithDifferentCase = {
        name: 'dress formal', // lowercase
        color: '#FF5733',
      }
      ;(categorySchema.parse as jest.Mock).mockReturnValue(requestWithDifferentCase)
      ;(mockPrisma.category.findFirst as jest.Mock).mockResolvedValue(mockCreatedCategory)

      // Act & Assert
      await expect(categoryService.createCategory(requestWithDifferentCase)).rejects.toThrow(
        'Nama kategori "dress formal" sudah digunakan'
      )
    })

    it('should handle validation error gracefully', async () => {
      // Arrange
      const invalidRequest = { name: '', color: 'invalid-color' }
      ;(categorySchema.parse as jest.Mock).mockImplementation(() => {
        throw new Error('Nama kategori wajib diisi')
      })

      // Act & Assert
      await expect(categoryService.createCategory(invalidRequest)).rejects.toThrow(
        'Nama kategori wajib diisi'
      )
      expect(mockPrisma.category.findFirst).not.toHaveBeenCalled()
      expect(mockPrisma.category.create).not.toHaveBeenCalled()
    })

    it('should handle database error during creation', async () => {
      // Arrange
      ;(categorySchema.parse as jest.Mock).mockReturnValue(mockCreateRequest)
      ;(mockPrisma.category.findFirst as jest.Mock).mockResolvedValue(null)
      ;(mockPrisma.category.create as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      // Act & Assert
      await expect(categoryService.createCategory(mockCreateRequest)).rejects.toThrow(
        'Database connection failed'
      )
    })
  })

  describe('updateCategory', () => {
    const categoryId = 'cat-123'
    const mockUpdateRequest: UpdateCategoryRequest = {
      name: 'Updated Category Name',
      color: '#00FF00',
    }

    const mockExistingCategory: Category = {
      id: categoryId,
      name: 'Old Category Name',
      color: '#FF5733',
      products: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: mockUserId,
    }

    const mockUpdatedCategory: Category = {
      ...mockExistingCategory,
      name: 'Updated Category Name',
      color: '#00FF00',
      updatedAt: new Date(),
    }

    it('should update category successfully - happy path', async () => {
      // Arrange
      ;(categoryParamsSchema.parse as jest.Mock).mockReturnValue({ id: categoryId })
      ;(updateCategorySchema.parse as jest.Mock).mockReturnValue(mockUpdateRequest)
      ;(mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(mockExistingCategory)
      ;(mockPrisma.category.findFirst as jest.Mock).mockResolvedValue(null) // Name tidak duplicate
      ;(mockPrisma.category.update as jest.Mock).mockResolvedValue(mockUpdatedCategory)

      // Act
      const result = await categoryService.updateCategory(categoryId, mockUpdateRequest)

      // Assert
      expect(categoryParamsSchema.parse).toHaveBeenCalledWith({ id: categoryId })
      expect(updateCategorySchema.parse).toHaveBeenCalledWith(mockUpdateRequest)
      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: categoryId },
      })
      expect(mockPrisma.category.findFirst).toHaveBeenCalledWith({
        where: { 
          name: {
            equals: 'Updated Category Name',
            mode: 'insensitive'
          },
          id: { not: categoryId }
        },
      })
      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: {
          name: 'Updated Category Name',
          color: '#00FF00',
          updatedAt: expect.any(Date),
        },
      })
      expect(result).toEqual(mockUpdatedCategory)
    })

    it('should throw error when category not found', async () => {
      // Arrange
      ;(categoryParamsSchema.parse as jest.Mock).mockReturnValue({ id: categoryId })
      ;(updateCategorySchema.parse as jest.Mock).mockReturnValue(mockUpdateRequest)
      ;(mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(null)

      // Act & Assert
      await expect(categoryService.updateCategory(categoryId, mockUpdateRequest)).rejects.toThrow(
        'Kategori tidak ditemukan'
      )
      expect(mockPrisma.category.update).not.toHaveBeenCalled()
    })

    it('should throw error when updated name conflicts with existing category', async () => {
      // Arrange
      const conflictingCategory = { id: 'other-cat', name: 'Updated Category Name' }
      ;(categoryParamsSchema.parse as jest.Mock).mockReturnValue({ id: categoryId })
      ;(updateCategorySchema.parse as jest.Mock).mockReturnValue(mockUpdateRequest)
      ;(mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(mockExistingCategory)
      ;(mockPrisma.category.findFirst as jest.Mock).mockResolvedValue(conflictingCategory)

      // Act & Assert
      await expect(categoryService.updateCategory(categoryId, mockUpdateRequest)).rejects.toThrow(
        'Nama kategori "Updated Category Name" sudah digunakan'
      )
      expect(mockPrisma.category.update).not.toHaveBeenCalled()
    })

    it('should handle partial update (only color)', async () => {
      // Arrange
      const partialUpdate = { color: '#00FF00' }
      ;(categoryParamsSchema.parse as jest.Mock).mockReturnValue({ id: categoryId })
      ;(updateCategorySchema.parse as jest.Mock).mockReturnValue(partialUpdate)
      ;(mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(mockExistingCategory)
      ;(mockPrisma.category.update as jest.Mock).mockResolvedValue({
        ...mockExistingCategory,
        color: '#00FF00',
      })

      // Act
      await categoryService.updateCategory(categoryId, partialUpdate)

      // Assert
      expect(mockPrisma.category.findFirst).not.toHaveBeenCalled() // No name update, no uniqueness check
      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: {
          color: '#00FF00',
          updatedAt: expect.any(Date),
        },
      })
    })

    it('should handle empty update request gracefully', async () => {
      // Arrange
      const emptyUpdate = {}
      ;(categoryParamsSchema.parse as jest.Mock).mockReturnValue({ id: categoryId })
      ;(updateCategorySchema.parse as jest.Mock).mockReturnValue(emptyUpdate)
      ;(mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(mockExistingCategory)
      ;(mockPrisma.category.update as jest.Mock).mockResolvedValue(mockExistingCategory)

      // Act
      await categoryService.updateCategory(categoryId, emptyUpdate)

      // Assert
      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: {
          updatedAt: expect.any(Date),
        },
      })
    })
  })

  describe('getCategories', () => {
    const mockCategories: Category[] = [
      {
        id: 'cat-1',
        name: 'Dress',
        color: '#FF5733',
        products: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
      },
      {
        id: 'cat-2',
        name: 'Suit',
        color: '#00FF00',
        products: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
      },
    ]

    it('should get all categories without products - happy path', async () => {
      // Arrange
      const query = { includeProducts: false }
      ;(categoryQuerySchema.parse as jest.Mock).mockReturnValue(query)
      ;(mockPrisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories)

      // Act
      const result = await categoryService.getCategories(query)

      // Assert
      expect(categoryQuerySchema.parse).toHaveBeenCalledWith(query)
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          products: false,
        },
        orderBy: {
          name: 'asc',
        },
      })
      expect(result).toEqual(mockCategories)
    })

    it('should get categories with products when requested', async () => {
      // Arrange
      const query = { includeProducts: true }
      const categoriesWithProducts = mockCategories.map(cat => ({
        ...cat,
        products: [
          {
            id: 'prod-1',
            name: 'Sample Product',
            code: 'SMPL',
            description: 'Sample description',
            modalAwal: new Decimal(100000),
            hargaSewa: new Decimal(25000),
            quantity: 3,
            status: 'AVAILABLE' as ProductStatus,
            imageUrl: undefined,
            totalPendapatan: new Decimal(0),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: mockUserId,
            categoryId: cat.id,
            category: {
              id: cat.id,
              name: cat.name,
              color: cat.color,
              createdAt: cat.createdAt,
              updatedAt: cat.updatedAt,
              createdBy: cat.createdBy,
              products: [],
            },
          },
        ],
      }))
      ;(categoryQuerySchema.parse as jest.Mock).mockReturnValue(query)
      ;(mockPrisma.category.findMany as jest.Mock).mockResolvedValue(categoriesWithProducts)

      // Act
      const result = await categoryService.getCategories(query)

      // Assert
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          products: true,
        },
        orderBy: {
          name: 'asc',
        },
      })
      expect(result).toHaveLength(categoriesWithProducts.length)
      expect(result[0]).toEqual(expect.objectContaining({
        id: categoriesWithProducts[0].id,
        name: categoriesWithProducts[0].name,
        color: categoriesWithProducts[0].color,
        products: expect.arrayContaining([
          expect.objectContaining({
            id: 'prod-1',
            name: 'Sample Product',
            code: 'SMPL',
            categoryId: categoriesWithProducts[0].id,
          })
        ])
      }))
    })

    it('should filter categories by search term', async () => {
      // Arrange
      const query = { search: 'dress', includeProducts: false }
      ;(categoryQuerySchema.parse as jest.Mock).mockReturnValue(query)
      ;(mockPrisma.category.findMany as jest.Mock).mockResolvedValue([mockCategories[0]])

      // Act
      const result = await categoryService.getCategories(query)

      // Assert
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            contains: 'dress',
            mode: 'insensitive',
          },
        },
        include: {
          products: false,
        },
        orderBy: {
          name: 'asc',
        },
      })
      expect(result).toEqual([mockCategories[0]])
    })

    it('should handle empty results', async () => {
      // Arrange
      const query = { includeProducts: false }
      ;(categoryQuerySchema.parse as jest.Mock).mockReturnValue(query)
      ;(mockPrisma.category.findMany as jest.Mock).mockResolvedValue([])

      // Act
      const result = await categoryService.getCategories(query)

      // Assert
      expect(result).toEqual([])
    })

    it('should handle query without parameters', async () => {
      // Arrange
      const query = {}
      const defaultQuery = { includeProducts: false }
      ;(categoryQuerySchema.parse as jest.Mock).mockReturnValue(defaultQuery)
      ;(mockPrisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories)

      // Act
      await categoryService.getCategories(query)

      // Assert
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          products: false,
        },
        orderBy: {
          name: 'asc',
        },
      })
    })
  })

  describe('getCategoryById', () => {
    const categoryId = 'cat-123'
    const mockCategory: Category = {
      id: categoryId,
      name: 'Dress Formal',
      color: '#FF5733',
      products: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: mockUserId,
    }

    it('should get category by ID successfully - happy path', async () => {
      // Arrange
      ;(categoryParamsSchema.parse as jest.Mock).mockReturnValue({ id: categoryId })
      ;(mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(mockCategory)

      // Act
      const result = await categoryService.getCategoryById(categoryId)

      // Assert
      expect(categoryParamsSchema.parse).toHaveBeenCalledWith({ id: categoryId })
      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: categoryId },
        include: {
          products: true,
        },
      })
      expect(result).toEqual(mockCategory)
    })

    it('should throw error when category not found', async () => {
      // Arrange
      ;(categoryParamsSchema.parse as jest.Mock).mockReturnValue({ id: categoryId })
      ;(mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(null)

      // Act & Assert
      await expect(categoryService.getCategoryById(categoryId)).rejects.toThrow(
        'Kategori tidak ditemukan'
      )
    })

    it('should handle invalid ID format', async () => {
      // Arrange
      const invalidId = 'invalid-id'
      ;(categoryParamsSchema.parse as jest.Mock).mockImplementation(() => {
        throw new Error('ID kategori tidak valid')
      })

      // Act & Assert
      await expect(categoryService.getCategoryById(invalidId)).rejects.toThrow(
        'ID kategori tidak valid'
      )
      expect(mockPrisma.category.findUnique).not.toHaveBeenCalled()
    })
  })

  describe('deleteCategory', () => {
    const categoryId = 'cat-123'
    const mockCategory = {
      id: categoryId,
      name: 'Dress Formal',
      products: [],
    }

    it('should delete category successfully when no products exist - happy path', async () => {
      // Arrange
      ;(categoryParamsSchema.parse as jest.Mock).mockReturnValue({ id: categoryId })
      ;(mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(mockCategory)
      ;(mockPrisma.category.delete as jest.Mock).mockResolvedValue(mockCategory)

      // Act
      const result = await categoryService.deleteCategory(categoryId)

      // Assert
      expect(categoryParamsSchema.parse).toHaveBeenCalledWith({ id: categoryId })
      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: categoryId },
        include: {
          products: {
            where: { isActive: true },
          },
        },
      })
      expect(mockPrisma.category.delete).toHaveBeenCalledWith({
        where: { id: categoryId },
      })
      expect(result).toBe(true)
    })

    it('should throw error when category not found', async () => {
      // Arrange
      ;(categoryParamsSchema.parse as jest.Mock).mockReturnValue({ id: categoryId })
      ;(mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(null)

      // Act & Assert
      await expect(categoryService.deleteCategory(categoryId)).rejects.toThrow(
        'Kategori tidak ditemukan'
      )
      expect(mockPrisma.category.delete).not.toHaveBeenCalled()
    })

    it('should throw error when category has active products', async () => {
      // Arrange
      const categoryWithProducts = {
        ...mockCategory,
        products: [
          { id: 'prod-1', name: 'Product 1', isActive: true },
          { id: 'prod-2', name: 'Product 2', isActive: true },
        ],
      }
      ;(categoryParamsSchema.parse as jest.Mock).mockReturnValue({ id: categoryId })
      ;(mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(categoryWithProducts)

      // Act & Assert
      await expect(categoryService.deleteCategory(categoryId)).rejects.toThrow(
        'Kategori tidak dapat dihapus karena masih memiliki 2 produk aktif'
      )
      expect(mockPrisma.category.delete).not.toHaveBeenCalled()
    })

    it('should allow deletion when category has only inactive products', async () => {
      // Arrange
      const categoryWithInactiveProducts = {
        ...mockCategory,
        products: [], // findUnique dengan where: { isActive: true } akan return empty array
      }
      ;(categoryParamsSchema.parse as jest.Mock).mockReturnValue({ id: categoryId })
      ;(mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(categoryWithInactiveProducts)
      ;(mockPrisma.category.delete as jest.Mock).mockResolvedValue(categoryWithInactiveProducts)

      // Act
      const result = await categoryService.deleteCategory(categoryId)

      // Assert
      expect(mockPrisma.category.delete).toHaveBeenCalledWith({
        where: { id: categoryId },
      })
      expect(result).toBe(true)
    })

    it('should handle database error during deletion', async () => {
      // Arrange
      ;(categoryParamsSchema.parse as jest.Mock).mockReturnValue({ id: categoryId })
      ;(mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(mockCategory)
      ;(mockPrisma.category.delete as jest.Mock).mockRejectedValue(
        new Error('Database constraint violation')
      )

      // Act & Assert
      await expect(categoryService.deleteCategory(categoryId)).rejects.toThrow(
        'Database constraint violation'
      )
    })
  })
})