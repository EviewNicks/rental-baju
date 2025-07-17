// Note: Integration test CategoryService - TDD
import {
  CategoryService,
  ERROR_MESSAGES,
} from '../../../features/manage-product/services/categoryService'
import { ProductService } from '../../../features/manage-product/services/productService'

// Mock Prisma untuk integration testing
jest.mock('@/lib/prisma', () => ({
  prisma: {
    category: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    product: {
      count: jest.fn(),
    },
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockPrisma = require('@/lib/prisma').prisma

describe('CategoryService ↔ Database Integration', () => {
  let categoryService: CategoryService
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let productService: ProductService

  beforeEach(() => {
    jest.clearAllMocks()
    categoryService = new CategoryService(mockPrisma)
    productService = new ProductService(mockPrisma)
  })

  describe('Database Connection Handling', () => {
    test('should handle database connection failure gracefully', async () => {
      mockPrisma.category.findMany.mockRejectedValue(new Error('Database connection failed'))

      await expect(categoryService.getCategories()).rejects.toThrow(
        ERROR_MESSAGES.DATABASE_CONNECTION,
      )
    })
  })

  describe('Transaction Management', () => {
    test('should handle transaction rollback on partial failure', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null) // Nama kategori unik
      mockPrisma.category.create.mockRejectedValue(new Error('Transaction failed'))

      await expect(
        categoryService.createCategory({ name: 'Test Category', color: '#123456' }, 'user-1'),
      ).rejects.toThrow('Transaction failed')
    })

    test('should handle successful transaction completion', async () => {
      const mockCategory = {
        id: 'category-1',
        name: 'Test Category',
        color: '#123456',
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.category.findUnique.mockResolvedValue(null) // Nama kategori unik
      mockPrisma.category.create.mockResolvedValue(mockCategory)

      const result = await categoryService.createCategory(
        { name: 'Test Category', color: '#123456' },
        'user-1',
      )

      expect(result).toEqual(mockCategory)
    })
  })

  describe('Concurrent Access Handling', () => {
    test('should handle concurrent category updates', async () => {
      const categoryId = 'category-1'
      const mockCategory = {
        id: categoryId,
        name: 'Original Category',
        color: '#111111',
        createdBy: 'user-1',
      }

      mockPrisma.category.findUnique.mockResolvedValue(mockCategory)
      mockPrisma.category.update.mockResolvedValue(mockCategory)

      const updatePromises = [
        categoryService.updateCategory(categoryId, { name: 'Update 1', color: '#222222' }),
        categoryService.updateCategory(categoryId, { name: 'Update 2', color: '#333333' }),
        categoryService.updateCategory(categoryId, { name: 'Update 3', color: '#444444' }),
      ]

      const results = await Promise.allSettled(updatePromises)
      expect(results.every((result) => result.status === 'fulfilled')).toBe(true)
      expect(mockPrisma.category.update).toHaveBeenCalledTimes(3)
    })
  })

  describe('Constraint Violation Handling', () => {
    test('should handle unique category name constraint', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'existing-category' })

      await expect(
        categoryService.createCategory({ name: 'Duplicate Category', color: '#ABCDEF' }, 'user-1'),
      ).rejects.toThrow(ERROR_MESSAGES.UNIQUE_CONSTRAINT)
    })

    test('should prevent deleting category with associated products', async () => {
      mockPrisma.product.count.mockResolvedValue(1)

      await expect(categoryService.deleteCategory('category-with-products')).rejects.toThrow(
        ERROR_MESSAGES.CATEGORY_IN_USE,
      )
    })
  })

  describe('Error Propagation', () => {
    test('should propagate database errors with meaningful messages', async () => {
      const databaseErrors = [
        {
          error: new Error('Connection timeout'),
          expectedMessage: ERROR_MESSAGES.DATABASE_CONNECTION,
        },
        { error: new Error('Query timeout'), expectedMessage: ERROR_MESSAGES.DATABASE_CONNECTION },
        {
          error: new Error('Deadlock detected'),
          expectedMessage: ERROR_MESSAGES.DATABASE_CONNECTION,
        },
      ]

      for (const { error, expectedMessage } of databaseErrors) {
        mockPrisma.category.findMany.mockRejectedValue(error)

        await expect(categoryService.getCategories()).rejects.toThrow(expectedMessage)
      }
    })
  })
})
