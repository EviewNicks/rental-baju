/**
 * Unit Tests untuk ProductService
 * Testing CRUD operations, business logic, and error handling
 *
 * Coverage:
 * - Create product with validation
 * - Update product with partial data
 * - Get products with pagination and filtering
 * - Get product by ID
 * - Soft delete product
 * - Status management
 * - Error handling scenarios
 * - Code uniqueness validation
 */

import { ProductService } from './productService'
import { PrismaClient } from '@prisma/client'
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  productParamsSchema,
} from '../lib/validation/productSchema'
import type {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductListResponse,
  ProductStatus,
} from '../types'
import { Decimal } from '@prisma/client/runtime/library'

// Mocks
jest.mock('@prisma/client')
jest.mock('../lib/validation/productSchema')

const mockPrisma = {
  product: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
  },
  category: {
    findUnique: jest.fn(),
  },
  color: {
    findUnique: jest.fn(),
  },
  material: {
    findUnique: jest.fn(),
  },
} as unknown as jest.Mocked<PrismaClient>

describe('ProductService', () => {
  let productService: ProductService
  const mockUserId = 'user-123'

  beforeEach(() => {
    jest.clearAllMocks()
    productService = new ProductService(mockPrisma, mockUserId)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('createProduct', () => {
    const mockCreateRequest: CreateProductRequest = {
      code: 'DRS1',
      name: 'Dress Elegant',
      description: 'Dress untuk acara formal',
      modalAwal: 150000,
      currentPrice: 50000,
      quantity: 5,
      categoryId: 'cat-123',
      image: undefined,
    }

    const mockCreatedProduct: Product = {
      id: 'prod-123',
      code: 'DRS1',
      name: 'Dress Elegant',
      description: 'Dress untuk acara formal',
      modalAwal: new Decimal(150000),
      currentPrice: new Decimal(50000),
      quantity: 5,
      rentedStock: 0,
      categoryId: 'cat-123',
      category: {
        id: 'cat-123',
        name: 'Dress',
        color: '#FF5733',
        products: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
      },
      status: 'AVAILABLE' as ProductStatus,
      imageUrl: undefined,
      totalPendapatan: new Decimal(0),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: mockUserId,
    }

    it('should create product successfully - happy path', async () => {
      // Arrange
      ;(createProductSchema.parse as jest.Mock).mockReturnValue(mockCreateRequest)
      ;(mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(null) // Code tidak duplicate
      ;(mockPrisma.category.findUnique as jest.Mock).mockResolvedValue({ id: 'cat-123' }) // Category exists
      ;(mockPrisma.product.create as jest.Mock).mockResolvedValue(mockCreatedProduct)

      // Act
      const result = await productService.createProduct(mockCreateRequest)

      // Assert
      expect(createProductSchema.parse).toHaveBeenCalledWith(mockCreateRequest)
      expect(mockPrisma.product.findFirst).toHaveBeenCalledWith({
        where: { code: 'DRS1', isActive: true },
      })
      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: {
          code: 'DRS1',
          name: 'Dress Elegant',
          description: 'Dress untuk acara formal',
          modalAwal: new Decimal(150000),
          currentPrice: new Decimal(50000),
          quantity: 5,
          rentedStock: 0,
          categoryId: 'cat-123',
          size: undefined,
          colorId: undefined,
          materialId: undefined,
          materialCost: undefined,
          materialQuantity: undefined,
          imageUrl: undefined,
          status: 'AVAILABLE',
          isActive: true,
          createdBy: mockUserId,
        },
        include: {
          category: true,
          color: true,
          material: true,
        },
      })
      expect(result).toEqual(mockCreatedProduct)
    })

    it('should throw error when product code already exists', async () => {
      // Arrange
      ;(createProductSchema.parse as jest.Mock).mockReturnValue(mockCreateRequest)
      ;(mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(mockCreatedProduct)
      ;(mockPrisma.category.findUnique as jest.Mock).mockResolvedValue({ id: 'cat-123' }) // Category exists

      // Act & Assert
      await expect(productService.createProduct(mockCreateRequest)).rejects.toThrow(
        'Kode produk DRS1 sudah digunakan',
      )
      expect(mockPrisma.product.create).not.toHaveBeenCalled()
    })

    it('should handle validation error gracefully', async () => {
      // Arrange
      const invalidRequest = { ...mockCreateRequest, code: 'INVALID_CODE' }
      ;(createProductSchema.parse as jest.Mock).mockImplementation(() => {
        throw new Error('Kode harus 4 digit alfanumerik uppercase')
      })
      ;(mockPrisma.category.findUnique as jest.Mock).mockResolvedValue({ id: 'cat-123' }) // Category exists

      // Act & Assert
      await expect(productService.createProduct(invalidRequest)).rejects.toThrow(
        'Kode harus 4 digit alfanumerik uppercase',
      )
      expect(mockPrisma.product.findFirst).not.toHaveBeenCalled()
      expect(mockPrisma.product.create).not.toHaveBeenCalled()
    })

    it('should handle database error during creation', async () => {
      // Arrange
      ;(createProductSchema.parse as jest.Mock).mockReturnValue(mockCreateRequest)
      ;(mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(null)
      ;(mockPrisma.category.findUnique as jest.Mock).mockResolvedValue({ id: 'cat-123' }) // Category exists
      ;(mockPrisma.product.create as jest.Mock).mockRejectedValue(
        new Error('Database connection failed'),
      )

      // Act & Assert
      await expect(productService.createProduct(mockCreateRequest)).rejects.toThrow(
        'Database connection failed',
      )
    })

    // Material Management Integration Tests - RPK-45
    it('should create product dengan material integration successfully', async () => {
      // Arrange
      const mockMaterialRequest: CreateProductRequest = {
        code: 'DRS2',
        name: 'Dress dengan Material',
        description: 'Dress dengan material premium',
        modalAwal: 200000,
        currentPrice: 75000,
        quantity: 3,
        categoryId: 'cat-123',
        materialId: 'material-123',
        materialQuantity: 2,
        image: undefined,
      }

      const mockMaterial = {
        id: 'material-123',
        name: 'Satin Premium',
        pricePerUnit: new Decimal(50000),
        unit: 'meter',
        isActive: true,
      }

      const mockCreatedProductWithMaterial: Product = {
        ...mockCreatedProduct,
        id: 'prod-124',
        code: 'DRS2',
        name: 'Dress dengan Material',
        description: 'Dress dengan material premium',
        modalAwal: new Decimal(200000),
        currentPrice: new Decimal(75000),
        quantity: 3,
        materialId: 'material-123',
        materialCost: new Decimal(100000), // 50000 * 2
        materialQuantity: 2,
        material: {
          id: 'material-123',
          name: 'Satin Premium',
          pricePerUnit: 50000,
          unit: 'meter',
          isActive: true,
          products: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: mockUserId,
        },
      }

      ;(createProductSchema.parse as jest.Mock).mockReturnValue(mockMaterialRequest)
      ;(mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(null)
      ;(mockPrisma.category.findUnique as jest.Mock).mockResolvedValue({ id: 'cat-123' })
      ;(mockPrisma.material.findUnique as jest.Mock).mockResolvedValue(mockMaterial)
      ;(mockPrisma.product.create as jest.Mock).mockResolvedValue(mockCreatedProductWithMaterial)

      // Act
      const result = await productService.createProduct(mockMaterialRequest)

      // Assert
      expect(mockPrisma.material.findUnique).toHaveBeenCalledWith({
        where: { id: 'material-123', isActive: true },
      })
      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: {
          code: 'DRS2',
          name: 'Dress dengan Material',
          description: 'Dress dengan material premium',
          modalAwal: new Decimal(200000),
          currentPrice: new Decimal(75000),
          quantity: 3,
          rentedStock: 0,
          categoryId: 'cat-123',
          size: undefined,
          colorId: undefined,
          materialId: 'material-123',
          materialCost: new Decimal(100000), // 50000 * 2 = 100000
          materialQuantity: 2,
          imageUrl: undefined,
          status: 'AVAILABLE',
          isActive: true,
          createdBy: mockUserId,
        },
        include: {
          category: true,
          color: true,
          material: true,
        },
      })
      expect(result).toEqual(mockCreatedProductWithMaterial)
    })

    it('should throw error jika material tidak ditemukan', async () => {
      // Arrange
      const invalidMaterialRequest: CreateProductRequest = {
        ...mockCreateRequest,
        materialId: 'non-existent-material',
        materialQuantity: 2,
      }

      ;(createProductSchema.parse as jest.Mock).mockReturnValue(invalidMaterialRequest)
      ;(mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(null)
      ;(mockPrisma.category.findUnique as jest.Mock).mockResolvedValue({ id: 'cat-123' })
      ;(mockPrisma.material.findUnique as jest.Mock).mockResolvedValue(null)

      // Act & Assert
      await expect(productService.createProduct(invalidMaterialRequest)).rejects.toThrow(
        'Material dengan ID non-existent-material tidak ditemukan',
      )
      expect(mockPrisma.product.create).not.toHaveBeenCalled()
    })
  })

  describe('updateProduct', () => {
    const productId = 'prod-123'
    const mockUpdateRequest: UpdateProductRequest = {
      name: 'Updated Dress Name',
      currentPrice: 60000,
    }

    const mockExistingProduct = {
      id: productId,
      code: 'DRS1',
      name: 'Old Dress Name',
      isActive: true,
    }

    const mockUpdatedProduct: Product = {
      id: productId,
      code: 'DRS1',
      name: 'Updated Dress Name',
      description: 'Dress untuk acara formal',
      modalAwal: new Decimal(150000),
      hargaSewa: new Decimal(60000),
      quantity: 5,
      categoryId: 'cat-123',
      category: {
        id: 'cat-123',
        name: 'Dress',
        color: '#FF5733',
        products: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
      },
      status: 'AVAILABLE' as ProductStatus,
      imageUrl: undefined,
      totalPendapatan: new Decimal(0),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: mockUserId,
    }

    it('should update product successfully - happy path', async () => {
      // Arrange
      ;(productParamsSchema.parse as jest.Mock).mockReturnValue({ id: productId })
      ;(updateProductSchema.parse as jest.Mock).mockReturnValue(mockUpdateRequest)
      ;(mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(mockExistingProduct)
      ;(mockPrisma.product.update as jest.Mock).mockResolvedValue(mockUpdatedProduct)

      // Act
      const result = await productService.updateProduct(productId, mockUpdateRequest)

      // Assert
      expect(productParamsSchema.parse).toHaveBeenCalledWith({ id: productId })
      expect(updateProductSchema.parse).toHaveBeenCalledWith(mockUpdateRequest)
      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId, isActive: true },
        include: { category: true },
      })
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: {
          name: 'Updated Dress Name',
          hargaSewa: new Decimal(60000),
          updatedAt: expect.any(Date),
        },
        include: {
          category: true,
        },
      })
      expect(result).toEqual(mockUpdatedProduct)
    })

    it('should throw error when product not found', async () => {
      // Arrange
      ;(productParamsSchema.parse as jest.Mock).mockReturnValue({ id: productId })
      ;(updateProductSchema.parse as jest.Mock).mockReturnValue(mockUpdateRequest)
      ;(mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(null)

      // Act & Assert
      await expect(productService.updateProduct(productId, mockUpdateRequest)).rejects.toThrow(
        'Produk tidak ditemukan',
      )
      expect(mockPrisma.product.update).not.toHaveBeenCalled()
    })

    it('should handle empty update request gracefully', async () => {
      // Arrange
      const emptyUpdate = {}
      ;(productParamsSchema.parse as jest.Mock).mockReturnValue({ id: productId })
      ;(updateProductSchema.parse as jest.Mock).mockReturnValue(emptyUpdate)
      ;(mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(mockExistingProduct)
      ;(mockPrisma.product.update as jest.Mock).mockResolvedValue(mockUpdatedProduct)

      // Act
      const result = await productService.updateProduct(productId, emptyUpdate)

      // Assert
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: {
          updatedAt: expect.any(Date),
        },
        include: {
          category: true,
        },
      })
      expect(result).toEqual(mockUpdatedProduct)
    })
  })

  describe('getProducts', () => {
    const mockQuery = {
      page: 1,
      limit: 10,
      search: 'dress',
      categoryId: 'cat-123',
      status: 'AVAILABLE' as ProductStatus,
      isActive: true,
    }

    const mockProducts: Product[] = [
      {
        id: 'prod-1',
        code: 'DRS1',
        name: 'Dress 1',
        description: 'Dress cantik',
        modalAwal: new Decimal(150000),
        hargaSewa: new Decimal(50000),
        quantity: 5,
        categoryId: 'cat-123',
        category: {
          id: 'cat-123',
          name: 'Dress',
          color: '#FF5733',
          products: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: mockUserId,
        },
        status: 'AVAILABLE' as ProductStatus,
        imageUrl: 'http://example.com/image1.jpg',
        totalPendapatan: new Decimal(100000),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
      },
    ]

    const mockResponse: ProductListResponse = {
      products: mockProducts,
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    }

    it('should get products with pagination and filters - happy path', async () => {
      // Arrange
      ;(productQuerySchema.parse as jest.Mock).mockReturnValue(mockQuery)
      ;(mockPrisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts)
      ;(mockPrisma.product.count as jest.Mock).mockResolvedValue(1)

      // Act
      const result = await productService.getProducts(mockQuery)

      // Assert
      expect(productQuerySchema.parse).toHaveBeenCalledWith(mockQuery)
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          categoryId: 'cat-123',
          status: 'AVAILABLE',
          OR: [
            { name: { contains: 'dress', mode: 'insensitive' } },
            { description: { contains: 'dress', mode: 'insensitive' } },
            { code: { contains: 'dress', mode: 'insensitive' } },
          ],
        },
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: 0,
        take: 10,
      })
      expect(mockPrisma.product.count).toHaveBeenCalledWith({
        where: {
          isActive: true,
          categoryId: 'cat-123',
          status: 'AVAILABLE',
          OR: [
            { name: { contains: 'dress', mode: 'insensitive' } },
            { description: { contains: 'dress', mode: 'insensitive' } },
            { code: { contains: 'dress', mode: 'insensitive' } },
          ],
        },
      })
      expect(result).toEqual(mockResponse)
    })

    it('should handle query without filters', async () => {
      // Arrange
      const simpleQuery = { page: 1, limit: 10 }
      ;(productQuerySchema.parse as jest.Mock).mockReturnValue(simpleQuery)
      ;(mockPrisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts)
      ;(mockPrisma.product.count as jest.Mock).mockResolvedValue(1)

      // Act
      await productService.getProducts(simpleQuery)

      // Assert
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
        },
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: 0,
        take: 10,
      })
    })

    it('should handle empty results', async () => {
      // Arrange
      ;(productQuerySchema.parse as jest.Mock).mockReturnValue(mockQuery)
      ;(mockPrisma.product.findMany as jest.Mock).mockResolvedValue([])
      ;(mockPrisma.product.count as jest.Mock).mockResolvedValue(0)

      // Act
      const result = await productService.getProducts(mockQuery)

      // Assert
      expect(result).toEqual({
        products: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      })
    })
  })

  describe('getProductById', () => {
    const productId = 'prod-123'
    const mockProduct: Product = {
      id: productId,
      code: 'DRS1',
      name: 'Dress Elegant',
      description: 'Dress untuk acara formal',
      modalAwal: new Decimal(150000),
      hargaSewa: new Decimal(50000),
      quantity: 5,
      categoryId: 'cat-123',
      category: {
        id: 'cat-123',
        name: 'Dress',
        color: '#FF5733',
        products: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
      },
      status: 'AVAILABLE' as ProductStatus,
      imageUrl: 'http://example.com/image.jpg',
      totalPendapatan: new Decimal(100000),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: mockUserId,
    }

    it('should get product by ID successfully - happy path', async () => {
      // Arrange
      ;(productParamsSchema.parse as jest.Mock).mockReturnValue({ id: productId })
      ;(mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct)

      // Act
      const result = await productService.getProductById(productId)

      // Assert
      expect(productParamsSchema.parse).toHaveBeenCalledWith({ id: productId })
      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId, isActive: true },
        include: {
          category: true,
        },
      })
      expect(result).toEqual(mockProduct)
    })

    it('should throw error when product not found', async () => {
      // Arrange
      ;(productParamsSchema.parse as jest.Mock).mockReturnValue({ id: productId })
      ;(mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(null)

      // Act & Assert
      await expect(productService.getProductById(productId)).rejects.toThrow(
        'Produk tidak ditemukan',
      )
    })

    it('should handle invalid ID format', async () => {
      // Arrange
      const invalidId = 'invalid-id'
      ;(productParamsSchema.parse as jest.Mock).mockImplementation(() => {
        throw new Error('ID produk tidak valid')
      })

      // Act & Assert
      await expect(productService.getProductById(invalidId)).rejects.toThrow(
        'ID produk tidak valid',
      )
      expect(mockPrisma.product.findUnique).not.toHaveBeenCalled()
    })
  })

  describe('deleteProduct', () => {
    const productId = 'prod-123'
    const mockProduct = {
      id: productId,
      code: 'DRS1',
      name: 'Dress Elegant',
      isActive: true,
    }

    it('should soft delete product successfully - happy path', async () => {
      // Arrange
      ;(productParamsSchema.parse as jest.Mock).mockReturnValue({ id: productId })
      ;(mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct)
      ;(mockPrisma.product.update as jest.Mock).mockResolvedValue({
        ...mockProduct,
        isActive: false,
      })

      // Act
      const result = await productService.deleteProduct(productId)

      // Assert
      expect(productParamsSchema.parse).toHaveBeenCalledWith({ id: productId })
      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId, isActive: true },
      })
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: {
          isActive: false,
          updatedAt: expect.any(Date),
        },
      })
      expect(result).toBe(true)
    })

    it('should throw error when product not found', async () => {
      // Arrange
      ;(productParamsSchema.parse as jest.Mock).mockReturnValue({ id: productId })
      ;(mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(null)

      // Act & Assert
      await expect(productService.deleteProduct(productId)).rejects.toThrow(
        'Produk tidak ditemukan',
      )
      expect(mockPrisma.product.update).not.toHaveBeenCalled()
    })
  })

  describe('updateProductStatus', () => {
    const productId = 'prod-123'
    const newStatus: ProductStatus = 'MAINTENANCE'
    const mockProduct: Product = {
      id: productId,
      code: 'DRS1',
      name: 'Dress Elegant',
      description: 'Dress untuk acara formal',
      modalAwal: new Decimal(150000),
      hargaSewa: new Decimal(50000),
      quantity: 5,
      categoryId: 'cat-123',
      category: {
        id: 'cat-123',
        name: 'Dress',
        color: '#FF5733',
        products: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
      },
      status: 'AVAILABLE' as ProductStatus,
      imageUrl: undefined,
      totalPendapatan: new Decimal(0),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: mockUserId,
    }

    it('should update product status successfully - happy path', async () => {
      // Arrange
      ;(productParamsSchema.parse as jest.Mock).mockReturnValue({ id: productId })
      ;(mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct)
      ;(mockPrisma.product.update as jest.Mock).mockResolvedValue({
        ...mockProduct,
        status: newStatus,
      })

      // Act
      const result = await productService.updateProductStatus(productId, newStatus)

      // Assert
      expect(productParamsSchema.parse).toHaveBeenCalledWith({ id: productId })
      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId, isActive: true },
      })
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: {
          status: newStatus,
          updatedAt: expect.any(Date),
        },
        include: {
          category: true,
        },
      })
      expect(result).toEqual({
        ...mockProduct,
        status: newStatus,
      })
    })

    it('should throw error when trying to set same status', async () => {
      // Arrange
      const sameStatus: ProductStatus = 'AVAILABLE'
      ;(productParamsSchema.parse as jest.Mock).mockReturnValue({ id: productId })
      ;(mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct)

      // Act & Assert
      await expect(productService.updateProductStatus(productId, sameStatus)).rejects.toThrow(
        'Status produk sudah sama',
      )
      expect(mockPrisma.product.update).not.toHaveBeenCalled()
    })

    it('should handle invalid status value', async () => {
      // Arrange
      const invalidStatus = 'INVALID_STATUS' as ProductStatus
      ;(productParamsSchema.parse as jest.Mock).mockReturnValue({ id: productId })

      // Act & Assert
      await expect(productService.updateProductStatus(productId, invalidStatus)).rejects.toThrow()
    })
  })
})
