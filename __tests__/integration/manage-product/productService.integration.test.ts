import {
  ProductService,
  ERROR_MESSAGES,
} from '../../../features/manage-product/services/productService'
import { CategoryService } from '../../../features/manage-product/services/categoryService'
import { ProductStatus } from '@prisma/client'

// Mock Prisma untuk integration testing
jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    category: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockPrisma = require('@/lib/prisma').prisma

describe('ProductService ↔ Database Integration', () => {
  let productService: ProductService
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let categoryService: CategoryService

  beforeEach(() => {
    jest.clearAllMocks()
    productService = new ProductService(mockPrisma)
    categoryService = new CategoryService(mockPrisma)
  })

  describe('Product-Category Integration', () => {
    test('should create product and assign to category', async () => {
      // Siapkan mock kategori dengan UUID valid
      const mockCategory = {
        id: '123e4567-e89b-12d3-a456-426614174000', // UUID valid
        name: 'Test Category',
        color: '#123456',
        createdBy: 'user-1',
      }

      // Siapkan mock produk dengan data yang valid sesuai skema
      const mockProduct = {
        id: 'product-1',
        code: 'PRD1', // 4 karakter uppercase
        name: 'Test Product', // Nama yang valid
        categoryId: mockCategory.id,
        modalAwal: 1000,
        hargaSewa: 100,
        quantity: 1,
        status: ProductStatus.AVAILABLE,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Mock findUnique untuk kategori dan kode produk
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory)
      mockPrisma.product.findUnique.mockResolvedValue(null)
      mockPrisma.product.create.mockResolvedValue(mockProduct)

      // Buat produk dengan data yang valid
      const result = await productService.createProduct(
        {
          code: 'PRD1', // 4 karakter uppercase
          name: 'Test Product', // Nama yang valid
          categoryId: mockCategory.id,
          modalAwal: 1000,
          hargaSewa: 100,
          quantity: 1,
        },
        'user-1',
      )

      // Verifikasi
      expect(result).toEqual(mockProduct)
      expect(result.categoryId).toBe(mockCategory.id)
    })
  })

  describe('Constraint Violation Handling', () => {
    test('should not create product with non-existent category', async () => {
      // Mock kategori tidak ditemukan
      mockPrisma.category.findUnique.mockResolvedValue(null)

      // Coba buat produk dengan kategori yang tidak ada
      await expect(
        productService.createProduct(
          {
            code: 'PRDT',
            name: 'Test Product',
            categoryId: 'non-existent-category',
            modalAwal: 1000,
            hargaSewa: 100,
            quantity: 1,
          },
          'user-1',
        ),
      ).rejects.toThrow(ERROR_MESSAGES.CATEGORY_NOT_FOUND)
    })

    test('should not create product with duplicate code', async () => {
      // Siapkan mock kategori
      const mockCategory = {
        id: 'category-1',
        name: 'Test Category',
        color: '#123456',
        createdBy: 'user-1',
      }

      // Mock kategori ditemukan
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory)

      // Mock produk dengan kode yang sama sudah ada
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'existing-product',
        code: 'PRDT',
      })

      // Coba buat produk dengan kode yang sudah ada
      await expect(
        productService.createProduct(
          {
            code: 'PRDT',
            name: 'Duplicate Product',
            categoryId: mockCategory.id,
            modalAwal: 1000,
            hargaSewa: 100,
            quantity: 1,
          },
          'user-1',
        ),
      ).rejects.toThrow(ERROR_MESSAGES.UNIQUE_CONSTRAINT)
    })
  })

  describe('Concurrent Operation Handling', () => {
    test('should handle concurrent product creation with same code', async () => {
      // Siapkan mock kategori dengan UUID valid
      const mockCategory = {
        id: '123e4567-e89b-12d3-a456-426614174000', // UUID valid
        name: 'Test Category',
        color: '#123456',
        createdBy: 'user-1',
      }

      // Siapkan mock produk
      const mockProduct = {
        id: 'product-1',
        code: 'PRD1',
        name: 'Test Product',
        categoryId: mockCategory.id,
        modalAwal: 1000,
        hargaSewa: 100,
        quantity: 1,
        status: ProductStatus.AVAILABLE,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Mock kategori ditemukan
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory)

      // Simulasi race condition yang lebih realistis
      const findUniqueSequence = jest
        .fn()
        .mockResolvedValueOnce(null) // Pertama, kode produk tersedia
        .mockResolvedValueOnce({ id: 'existing-product' }) // Kedua, kode produk sudah digunakan

      const createSequence = jest
        .fn()
        .mockResolvedValueOnce(mockProduct) // Pertama berhasil
        .mockRejectedValueOnce(new Error('Unique constraint violation')) // Kedua gagal

      mockPrisma.product.findUnique = findUniqueSequence
      mockPrisma.product.create = createSequence

      // Jalankan concurrent creation
      const createPromises = [
        productService.createProduct(
          {
            code: 'PRD1',
            name: 'Test Product 1',
            categoryId: mockCategory.id,
            modalAwal: 1000,
            hargaSewa: 100,
            quantity: 1,
          },
          'user-1',
        ),
        productService.createProduct(
          {
            code: 'PRD1',
            name: 'Test Product 2',
            categoryId: mockCategory.id,
            modalAwal: 1000,
            hargaSewa: 100,
            quantity: 1,
          },
          'user-1',
        ),
      ]

      const results = await Promise.allSettled(createPromises)

      // Pastikan satu berhasil dan satu gagal
      const successfulResults = results.filter((r) => r.status === 'fulfilled')
      const failedResults = results.filter((r) => r.status === 'rejected')

      expect(successfulResults.length).toBe(1)
      expect(failedResults.length).toBe(1)
      expect(failedResults[0].reason.message).toBe(ERROR_MESSAGES.UNIQUE_CONSTRAINT)
    })
  })

  describe('Update and Delete Operations', () => {
    test('should update product and reflect changes', async () => {
      // Siapkan mock produk awal
      const initialProduct = {
        id: 'product-1',
        code: 'PRDT',
        name: 'Original Product',
        categoryId: 'category-1',
        modalAwal: 1000,
        hargaSewa: 100,
        quantity: 1,
        status: ProductStatus.AVAILABLE,
        createdBy: 'user-1',
      }

      // Siapkan mock produk yang diupdate
      const updatedProduct = {
        ...initialProduct,
        name: 'Updated Product',
        modalAwal: 2000,
      }

      // Mock pencarian produk
      mockPrisma.product.findUnique.mockResolvedValue(initialProduct)
      mockPrisma.product.update.mockResolvedValue(updatedProduct)

      // Update produk
      const result = await productService.updateProduct(initialProduct.id, {
        name: 'Updated Product',
        modalAwal: 2000,
      })

      // Verifikasi
      expect(result.name).toBe('Updated Product')
      expect(result.modalAwal).toBe(2000)
    })
  })
})
