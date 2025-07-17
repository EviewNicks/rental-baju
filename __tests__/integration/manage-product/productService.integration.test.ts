import {
  ProductService,
  ERROR_MESSAGES,
} from '../../../features/manage-product/services/productService'
import { CategoryService } from '../../../features/manage-product/services/categoryService'
import { ProductStatus } from '@prisma/client'

// Mock Supabase storageUtils untuk integration testing
jest.mock('../../../lib/supabase', () => ({
  storageUtils: {
    uploadProductImage: jest.fn(),
    deleteProductImage: jest.fn(),
    extractFilePathFromUrl: jest.fn(),
  },
}))

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
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { storageUtils } = require('../../../lib/supabase')

// Helper untuk membuat mock File object
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createMockFile(name: string = 'test.jpg', size: number = 1024): File {
  return new File(['test'], name, { type: 'image/jpeg' })
}

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
    test('should create product and assign to category without image', async () => {
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
        modalAwal: { toNumber: () => 1000 }, // Decimal mock
        hargaSewa: { toNumber: () => 100 }, // Decimal mock
        quantity: 1,
        status: ProductStatus.AVAILABLE,
        imageUrl: null,
        totalPendapatan: { toNumber: () => 0 }, // Decimal mock
        isActive: true,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        category: mockCategory,
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
      expect(storageUtils.uploadProductImage).not.toHaveBeenCalled()
    })

    test('should create product with image upload', async () => {
      // Siapkan mock kategori dengan UUID valid
      const mockCategory = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Category',
        color: '#123456',
        createdBy: 'user-1',
      }

      const mockFile = createMockFile('product.jpg', 1024)
      const mockImageUrl = 'https://supabase.com/storage/products/test.jpg'

      // Siapkan mock produk dengan imageUrl
      const mockProduct = {
        id: 'product-1',
        code: 'PRD1',
        name: 'Test Product',
        categoryId: mockCategory.id,
        modalAwal: { toNumber: () => 1000 },
        hargaSewa: { toNumber: () => 100 },
        quantity: 1,
        status: ProductStatus.AVAILABLE,
        imageUrl: mockImageUrl,
        totalPendapatan: { toNumber: () => 0 },
        isActive: true,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        category: mockCategory,
      }

      // Mock findUnique untuk kategori dan kode produk
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory)
      mockPrisma.product.findUnique.mockResolvedValue(null)
      mockPrisma.product.create.mockResolvedValue(mockProduct)

      // Mock upload image
      storageUtils.uploadProductImage.mockResolvedValue(mockImageUrl)

      // Buat produk dengan image
      const result = await productService.createProduct(
        {
          code: 'PRD1',
          name: 'Test Product',
          categoryId: mockCategory.id,
          modalAwal: 1000,
          hargaSewa: 100,
          quantity: 1,
          image: mockFile,
        },
        'user-1',
      )

      // Verifikasi
      expect(result).toEqual(mockProduct)
      expect(result.imageUrl).toBe(mockImageUrl)
      expect(storageUtils.uploadProductImage).toHaveBeenCalledWith(mockFile)
    })

    test('should handle image upload failure during product creation', async () => {
      // Siapkan mock kategori
      const mockCategory = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Category',
        color: '#123456',
        createdBy: 'user-1',
      }

      const mockFile = createMockFile('product.jpg', 1024)

      // Mock findUnique untuk kategori dan kode produk
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory)
      mockPrisma.product.findUnique.mockResolvedValue(null)

      // Mock upload image failure
      storageUtils.uploadProductImage.mockRejectedValue(new Error('Upload failed'))

      // Coba buat produk dengan image yang gagal upload
      await expect(
        productService.createProduct(
          {
            code: 'PRD1',
            name: 'Test Product',
            categoryId: mockCategory.id,
            modalAwal: 1000,
            hargaSewa: 100,
            quantity: 1,
            image: mockFile,
          },
          'user-1',
        ),
      ).rejects.toThrow('Gagal mengupload file')
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
        modalAwal: { toNumber: () => 1000 },
        hargaSewa: { toNumber: () => 100 },
        quantity: 1,
        status: ProductStatus.AVAILABLE,
        imageUrl: null,
        totalPendapatan: { toNumber: () => 0 },
        isActive: true,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        category: mockCategory,
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
    test('should update product and reflect changes without image', async () => {
      // Siapkan mock produk awal
      const initialProduct = {
        id: 'product-1',
        code: 'PRDT',
        name: 'Original Product',
        categoryId: 'category-1',
        modalAwal: { toNumber: () => 1000 },
        hargaSewa: { toNumber: () => 100 },
        quantity: 1,
        status: ProductStatus.AVAILABLE,
        imageUrl: 'https://old-image.jpg',
        totalPendapatan: { toNumber: () => 0 },
        isActive: true,
        createdBy: 'user-1',
        category: { id: 'category-1', name: 'Test Category' },
      }

      // Siapkan mock produk yang diupdate
      const updatedProduct = {
        ...initialProduct,
        name: 'Updated Product',
        modalAwal: { toNumber: () => 2000 },
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
      expect(result.modalAwal.toNumber()).toBe(2000)
      expect(storageUtils.uploadProductImage).not.toHaveBeenCalled()
    })

    test('should update product with new image and cleanup old image', async () => {
      // Siapkan mock produk awal
      const initialProduct = {
        id: 'product-1',
        code: 'PRDT',
        name: 'Original Product',
        categoryId: 'category-1',
        modalAwal: { toNumber: () => 1000 },
        hargaSewa: { toNumber: () => 100 },
        quantity: 1,
        status: ProductStatus.AVAILABLE,
        imageUrl: 'https://supabase.com/storage/products/old-image.jpg',
        totalPendapatan: { toNumber: () => 0 },
        isActive: true,
        createdBy: 'user-1',
        category: { id: 'category-1', name: 'Test Category' },
      }

      const mockFile = createMockFile('new-product.jpg', 1024)
      const newImageUrl = 'https://supabase.com/storage/products/new-image.jpg'

      // Siapkan mock produk yang diupdate
      const updatedProduct = {
        ...initialProduct,
        name: 'Updated Product',
        imageUrl: newImageUrl,
      }

      // Mock pencarian produk
      mockPrisma.product.findUnique.mockResolvedValue(initialProduct)
      mockPrisma.product.update.mockResolvedValue(updatedProduct)

      // Mock storage operations
      storageUtils.uploadProductImage.mockResolvedValue(newImageUrl)
      storageUtils.extractFilePathFromUrl.mockReturnValue('old-image.jpg')
      storageUtils.deleteProductImage.mockResolvedValue(undefined)

      // Update produk dengan image baru
      const result = await productService.updateProduct(initialProduct.id, {
        name: 'Updated Product',
        image: mockFile,
      })

      // Verifikasi
      expect(result.name).toBe('Updated Product')
      expect(result.imageUrl).toBe(newImageUrl)
      expect(storageUtils.uploadProductImage).toHaveBeenCalledWith(mockFile)
      expect(storageUtils.extractFilePathFromUrl).toHaveBeenCalledWith(initialProduct.imageUrl)
      expect(storageUtils.deleteProductImage).toHaveBeenCalledWith('old-image.jpg')
    })

    test('should handle image upload failure during update', async () => {
      // Siapkan mock produk awal
      const initialProduct = {
        id: 'product-1',
        code: 'PRDT',
        name: 'Original Product',
        categoryId: 'category-1',
        modalAwal: { toNumber: () => 1000 },
        hargaSewa: { toNumber: () => 100 },
        quantity: 1,
        status: ProductStatus.AVAILABLE,
        imageUrl: 'https://old-image.jpg',
        totalPendapatan: { toNumber: () => 0 },
        isActive: true,
        createdBy: 'user-1',
        category: { id: 'category-1', name: 'Test Category' },
      }

      const mockFile = createMockFile('new-product.jpg', 1024)

      // Mock pencarian produk
      mockPrisma.product.findUnique.mockResolvedValue(initialProduct)

      // Mock upload image failure
      storageUtils.uploadProductImage.mockRejectedValue(new Error('Upload failed'))

      // Coba update produk dengan image yang gagal upload
      await expect(
        productService.updateProduct(initialProduct.id, {
          name: 'Updated Product',
          image: mockFile,
        }),
      ).rejects.toThrow('Gagal mengupload file')
    })

    test('should soft delete product without image cleanup', async () => {
      // Siapkan mock produk
      const existingProduct = {
        id: 'product-1',
        code: 'PRDT',
        name: 'Test Product',
        categoryId: 'category-1',
        modalAwal: { toNumber: () => 1000 },
        hargaSewa: { toNumber: () => 100 },
        quantity: 1,
        status: ProductStatus.AVAILABLE,
        imageUrl: null,
        totalPendapatan: { toNumber: () => 0 },
        isActive: true,
        createdBy: 'user-1',
        category: { id: 'category-1', name: 'Test Category' },
      }

      // Mock pencarian produk
      mockPrisma.product.findUnique.mockResolvedValue(existingProduct)
      mockPrisma.product.update.mockResolvedValue({ ...existingProduct, isActive: false })

      // Soft delete produk
      const result = await productService.deleteProduct(existingProduct.id)

      // Verifikasi
      expect(result).toBe(true)
      expect(storageUtils.deleteProductImage).not.toHaveBeenCalled()
    })

    test('should soft delete product with image cleanup', async () => {
      // Siapkan mock produk dengan image
      const existingProduct = {
        id: 'product-1',
        code: 'PRDT',
        name: 'Test Product',
        categoryId: 'category-1',
        modalAwal: { toNumber: () => 1000 },
        hargaSewa: { toNumber: () => 100 },
        quantity: 1,
        status: ProductStatus.AVAILABLE,
        imageUrl: 'https://supabase.com/storage/products/test-image.jpg',
        totalPendapatan: { toNumber: () => 0 },
        isActive: true,
        createdBy: 'user-1',
        category: { id: 'category-1', name: 'Test Category' },
      }

      // Mock pencarian produk
      mockPrisma.product.findUnique.mockResolvedValue(existingProduct)
      mockPrisma.product.update.mockResolvedValue({ ...existingProduct, isActive: false })

      // Mock storage operations
      storageUtils.extractFilePathFromUrl.mockReturnValue('test-image.jpg')
      storageUtils.deleteProductImage.mockResolvedValue(undefined)

      // Soft delete produk
      const result = await productService.deleteProduct(existingProduct.id)

      // Verifikasi
      expect(result).toBe(true)
      expect(storageUtils.extractFilePathFromUrl).toHaveBeenCalledWith(existingProduct.imageUrl)
      expect(storageUtils.deleteProductImage).toHaveBeenCalledWith('test-image.jpg')
    })

    test('should handle image cleanup failure gracefully during delete', async () => {
      // Siapkan mock produk dengan image
      const existingProduct = {
        id: 'product-1',
        code: 'PRDT',
        name: 'Test Product',
        categoryId: 'category-1',
        modalAwal: { toNumber: () => 1000 },
        hargaSewa: { toNumber: () => 100 },
        quantity: 1,
        status: ProductStatus.AVAILABLE,
        imageUrl: 'https://supabase.com/storage/products/test-image.jpg',
        totalPendapatan: { toNumber: () => 0 },
        isActive: true,
        createdBy: 'user-1',
        category: { id: 'category-1', name: 'Test Category' },
      }

      // Mock pencarian produk
      mockPrisma.product.findUnique.mockResolvedValue(existingProduct)
      mockPrisma.product.update.mockResolvedValue({ ...existingProduct, isActive: false })

      // Mock storage operations dengan failure
      storageUtils.extractFilePathFromUrl.mockReturnValue('test-image.jpg')
      storageUtils.deleteProductImage.mockRejectedValue(new Error('Delete failed'))

      // Soft delete produk - should not throw error even if cleanup fails
      const result = await productService.deleteProduct(existingProduct.id)

      // Verifikasi
      expect(result).toBe(true)
      expect(storageUtils.extractFilePathFromUrl).toHaveBeenCalledWith(existingProduct.imageUrl)
      expect(storageUtils.deleteProductImage).toHaveBeenCalledWith('test-image.jpg')
    })
  })
})
