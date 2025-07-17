// Note: Unit test ProductService - TDD dengan file upload support
import { ProductService } from './productService'
import { CreateProductRequest, Product } from '../types'
import { ProductStatus } from '@prisma/client'

// Mock storageUtils
jest.mock('@/lib/supabase', () => ({
  storageUtils: {
    uploadProductImage: jest.fn(),
    deleteProductImage: jest.fn(),
    extractFilePathFromUrl: jest.fn(),
  },
}))

import { storageUtils } from '../../../lib/supabase'

function uuidv4() {
  // Simple UUID v4 generator for test
  return '123e4567-e89b-12d3-a456-426614174000'
}

// Helper untuk membuat mock File object
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createMockFile(name: string = 'test.jpg', size: number = 1024): File {
  return new File(['test'], name, { type: 'image/jpeg' })
}

describe('ProductService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any
  let service: ProductService

  beforeEach(() => {
    prisma = {
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      category: {
        findUnique: jest.fn(),
      },
    }
    service = new ProductService(prisma)
    jest.clearAllMocks()
  })

  it('should return paginated list of products with filters', async () => {
    const mockProducts = [
      {
        id: '1',
        code: 'PRD1',
        name: 'Test',
        categoryId: uuidv4(),
        modalAwal: 1000,
        hargaSewa: 100,
        quantity: 1,
      },
    ]

    prisma.product.findMany.mockResolvedValueOnce(mockProducts)
    prisma.product.count.mockResolvedValueOnce(1)

    const result = await service.getProducts({ page: 1, limit: 10 })

    expect(result.products).toBeDefined()
    expect(result.pagination).toBeDefined()
    expect(result.products).toEqual(mockProducts)
    expect(result.pagination.page).toBe(1)
    expect(result.pagination.limit).toBe(10)
    expect(result.pagination.total).toBe(1)
    expect(result.pagination.totalPages).toBe(1)
  })

  it('should return product detail by id', async () => {
    prisma.product.findUnique.mockResolvedValueOnce({
      id: '1',
      code: 'PRD1',
      name: 'Test',
      categoryId: uuidv4(),
      modalAwal: 1000,
      hargaSewa: 100,
      quantity: 1,
      status: 'AVAILABLE',
      totalPendapatan: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user1',
      category: {},
      description: '',
      imageUrl: '',
    })
    const result = await service.getProductById('1')
    expect(result).toBeDefined()
    expect(result?.id).toBe('1')
  })

  describe('createProduct', () => {
    it('should create product with valid data without image', async () => {
      const data = {
        code: 'PRD2',
        name: 'New',
        categoryId: uuidv4(),
        modalAwal: 1000,
        hargaSewa: 100,
        quantity: 1,
        description: 'desc',
      }

      // Mock findUnique untuk kategori
      prisma.category.findUnique.mockResolvedValueOnce({ id: data.categoryId, name: 'Cat' })

      // Mock findUnique untuk kode produk (null berarti unik)
      prisma.product.findUnique.mockResolvedValueOnce(null)

      // Mock create product
      prisma.product.create.mockResolvedValueOnce({
        ...data,
        id: '2',
        status: ProductStatus.AVAILABLE,
        totalPendapatan: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user1',
        category: {},
        imageUrl: undefined,
      })

      const result = await service.createProduct(data as CreateProductRequest, 'user1')
      expect(result.code).toBe('PRD2')
      expect(storageUtils.uploadProductImage).not.toHaveBeenCalled()
    })

    it('should create product with image upload', async () => {
      const mockFile = createMockFile('product.jpg', 1024)
      const data = {
        code: 'PRD2',
        name: 'New',
        categoryId: uuidv4(),
        modalAwal: 1000,
        hargaSewa: 100,
        quantity: 1,
        description: 'desc',
        image: mockFile,
      }

      const mockImageUrl = 'https://supabase.com/storage/products/test.jpg'

      // Mock findUnique untuk kategori
      prisma.category.findUnique.mockResolvedValueOnce({ id: data.categoryId, name: 'Cat' })

      // Mock findUnique untuk kode produk (null berarti unik)
      prisma.product.findUnique.mockResolvedValueOnce(null)

      // Mock upload image
      ;(storageUtils.uploadProductImage as jest.Mock).mockResolvedValueOnce(mockImageUrl)

      // Mock create product
      prisma.product.create.mockResolvedValueOnce({
        ...data,
        id: '2',
        status: ProductStatus.AVAILABLE,
        totalPendapatan: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user1',
        category: {},
        imageUrl: mockImageUrl,
      })

      const result = await service.createProduct(
        data as CreateProductRequest & { image?: File },
        'user1',
      )

      expect(result.code).toBe('PRD2')
      expect(result.imageUrl).toBe(mockImageUrl)
      expect(storageUtils.uploadProductImage).toHaveBeenCalledWith(mockFile)
    })

    it('should throw error when image upload fails', async () => {
      const mockFile = createMockFile('product.jpg', 1024)
      const data = {
        code: 'PRD2',
        name: 'New',
        categoryId: uuidv4(),
        modalAwal: 1000,
        hargaSewa: 100,
        quantity: 1,
        image: mockFile,
      }

      // Mock findUnique untuk kategori
      prisma.category.findUnique.mockResolvedValueOnce({ id: data.categoryId, name: 'Cat' })

      // Mock findUnique untuk kode produk (null berarti unik)
      prisma.product.findUnique.mockResolvedValueOnce(null)

      // Mock upload image failure
      ;(storageUtils.uploadProductImage as jest.Mock).mockRejectedValueOnce(
        new Error('Upload failed'),
      )

      await expect(
        service.createProduct(data as CreateProductRequest & { image?: File }, 'user1'),
      ).rejects.toThrow('Gagal mengupload file')
    })

    it('should not create product with duplicate code', async () => {
      prisma.product.findUnique.mockResolvedValueOnce({ id: '1', code: 'PRD1' })
      await expect(
        service.createProduct(
          {
            code: 'PRD1',
            name: 'Dup',
            categoryId: uuidv4(),
            modalAwal: 1000,
            hargaSewa: 100,
            quantity: 1,
          } as Product,
          'user1',
        ),
      ).rejects.toThrow()
    })

    it('should throw validation error for invalid data', async () => {
      await expect(
        service.createProduct(
          {
            code: '',
            name: '',
            categoryId: '',
            modalAwal: -1,
            hargaSewa: -1,
            quantity: -1,
          } as Product,
          'user1',
        ),
      ).rejects.toThrow()
    })
  })

  describe('updateProduct', () => {
    it('should update product with valid data without image', async () => {
      const existingProduct = {
        id: '1',
        code: 'PRD1',
        name: 'Old Name',
        categoryId: uuidv4(),
        modalAwal: 1000,
        hargaSewa: 100,
        quantity: 1,
        status: 'AVAILABLE',
        totalPendapatan: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user1',
        category: {},
        description: '',
        imageUrl: 'https://old-image.jpg',
      }

      prisma.product.findUnique.mockResolvedValueOnce(existingProduct)
      prisma.product.update.mockResolvedValueOnce({
        ...existingProduct,
        name: 'Updated',
      })

      const result = await service.updateProduct('1', { name: 'Updated' })
      expect(result.name).toBe('Updated')
      expect(storageUtils.uploadProductImage).not.toHaveBeenCalled()
    })

    it('should update product with new image and cleanup old image', async () => {
      const existingProduct = {
        id: '1',
        code: 'PRD1',
        name: 'Old Name',
        categoryId: uuidv4(),
        modalAwal: 1000,
        hargaSewa: 100,
        quantity: 1,
        status: 'AVAILABLE',
        totalPendapatan: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user1',
        category: {},
        description: '',
        imageUrl: 'https://supabase.com/storage/products/old-image.jpg',
      }

      const mockFile = createMockFile('new-product.jpg', 1024)
      const newImageUrl = 'https://supabase.com/storage/products/new-image.jpg'

      prisma.product.findUnique.mockResolvedValueOnce(existingProduct)
      ;(storageUtils.uploadProductImage as jest.Mock).mockResolvedValueOnce(newImageUrl)
      ;(storageUtils.extractFilePathFromUrl as jest.Mock).mockReturnValueOnce('old-image.jpg')
      ;(storageUtils.deleteProductImage as jest.Mock).mockResolvedValueOnce(undefined)

      prisma.product.update.mockResolvedValueOnce({
        ...existingProduct,
        name: 'Updated',
        imageUrl: newImageUrl,
      })

      const result = await service.updateProduct('1', {
        name: 'Updated',
        image: mockFile,
      })

      expect(result.name).toBe('Updated')
      expect(result.imageUrl).toBe(newImageUrl)
      expect(storageUtils.uploadProductImage).toHaveBeenCalledWith(mockFile)
      expect(storageUtils.extractFilePathFromUrl).toHaveBeenCalledWith(existingProduct.imageUrl)
      expect(storageUtils.deleteProductImage).toHaveBeenCalledWith('old-image.jpg')
    })

    it('should handle image upload failure during update', async () => {
      const existingProduct = {
        id: '1',
        code: 'PRD1',
        name: 'Old Name',
        categoryId: uuidv4(),
        modalAwal: 1000,
        hargaSewa: 100,
        quantity: 1,
        status: 'AVAILABLE',
        totalPendapatan: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user1',
        category: {},
        description: '',
        imageUrl: 'https://old-image.jpg',
      }

      const mockFile = createMockFile('new-product.jpg', 1024)

      prisma.product.findUnique.mockResolvedValueOnce(existingProduct)
      ;(storageUtils.uploadProductImage as jest.Mock).mockRejectedValueOnce(
        new Error('Upload failed'),
      )

      await expect(
        service.updateProduct('1', {
          name: 'Updated',
          image: mockFile,
        }),
      ).rejects.toThrow('Gagal mengupload file')
    })

    it('should not update non-existent product', async () => {
      prisma.product.findUnique.mockResolvedValueOnce(null)
      await expect(service.updateProduct('999', { name: 'X' })).rejects.toThrow()
    })
  })

  describe('deleteProduct', () => {
    it('should soft delete product without image', async () => {
      const existingProduct = {
        id: '1',
        code: 'PRD1',
        name: 'Test Product',
        categoryId: uuidv4(),
        modalAwal: 1000,
        hargaSewa: 100,
        quantity: 1,
        status: 'AVAILABLE',
        totalPendapatan: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user1',
        category: {},
        description: '',
        imageUrl: null,
      }

      prisma.product.findUnique.mockResolvedValueOnce(existingProduct)
      prisma.product.update.mockResolvedValueOnce({ isActive: false })

      const result = await service.deleteProduct('1')
      expect(result).toBe(true)
      expect(storageUtils.deleteProductImage).not.toHaveBeenCalled()
    })

    it('should soft delete product with image cleanup', async () => {
      const existingProduct = {
        id: '1',
        code: 'PRD1',
        name: 'Test Product',
        categoryId: uuidv4(),
        modalAwal: 1000,
        hargaSewa: 100,
        quantity: 1,
        status: 'AVAILABLE',
        totalPendapatan: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user1',
        category: {},
        description: '',
        imageUrl: 'https://supabase.com/storage/products/test-image.jpg',
      }

      prisma.product.findUnique.mockResolvedValueOnce(existingProduct)
      prisma.product.update.mockResolvedValueOnce({ isActive: false })
      ;(storageUtils.extractFilePathFromUrl as jest.Mock).mockReturnValueOnce('test-image.jpg')
      ;(storageUtils.deleteProductImage as jest.Mock).mockResolvedValueOnce(undefined)

      const result = await service.deleteProduct('1')
      expect(result).toBe(true)
      expect(storageUtils.extractFilePathFromUrl).toHaveBeenCalledWith(existingProduct.imageUrl)
      expect(storageUtils.deleteProductImage).toHaveBeenCalledWith('test-image.jpg')
    })

    it('should handle image cleanup failure gracefully', async () => {
      const existingProduct = {
        id: '1',
        code: 'PRD1',
        name: 'Test Product',
        categoryId: uuidv4(),
        modalAwal: 1000,
        hargaSewa: 100,
        quantity: 1,
        status: 'AVAILABLE',
        totalPendapatan: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user1',
        category: {},
        description: '',
        imageUrl: 'https://supabase.com/storage/products/test-image.jpg',
      }

      prisma.product.findUnique.mockResolvedValueOnce(existingProduct)
      prisma.product.update.mockResolvedValueOnce({ isActive: false })
      ;(storageUtils.extractFilePathFromUrl as jest.Mock).mockReturnValueOnce('test-image.jpg')
      ;(storageUtils.deleteProductImage as jest.Mock).mockRejectedValueOnce(
        new Error('Delete failed'),
      )

      // Should not throw error even if image cleanup fails
      const result = await service.deleteProduct('1')
      expect(result).toBe(true)
    })
  })

  it('should validate unique product code', async () => {
    prisma.product.findUnique.mockResolvedValueOnce(null)
    const isUnique = await service.validateProductCode('PRD3')
    expect(isUnique).toBe(true)
  })

  it('should update product status', async () => {
    // Tambahkan mock untuk findUnique sebelum update
    const mockProduct = {
      id: '1',
      code: 'PRD1',
      name: 'Test Product',
      status: 'AVAILABLE' as ProductStatus,
    }
    prisma.product.findUnique.mockResolvedValueOnce(mockProduct)
    prisma.product.update.mockResolvedValueOnce({
      ...mockProduct,
      status: 'RENTED' as ProductStatus,
    })

    const result = await service.updateProductStatus('1', 'RENTED')
    expect(result.status).toBe('RENTED')
  })

  it('should update total pendapatan', async () => {
    // Tambahkan mock untuk findUnique sebelum update
    const mockProduct = {
      id: '1',
      code: 'PRD1',
      name: 'Test Product',
      totalPendapatan: 0,
    }
    prisma.product.findUnique.mockResolvedValueOnce(mockProduct)
    prisma.product.update.mockResolvedValueOnce({
      ...mockProduct,
      totalPendapatan: 1000,
    })

    const result = await service.updateTotalPendapatan('1', 1000)
    expect(result.totalPendapatan).toBe(1000)
  })
})
