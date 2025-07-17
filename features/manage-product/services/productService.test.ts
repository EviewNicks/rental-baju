// Note: Unit test ProductService - TDD
import { ProductService } from './productService'
import { CreateProductRequest, Product } from '../types'
import { ProductStatus } from '@prisma/client'

function uuidv4() {
  // Simple UUID v4 generator for test
  return '123e4567-e89b-12d3-a456-426614174000'
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

  it('should create product with valid data', async () => {
    const data = {
      code: 'PRD2',
      name: 'New',
      categoryId: uuidv4(),
      modalAwal: 1000,
      hargaSewa: 100,
      quantity: 1,
      description: 'desc',
      imageUrl: 'img.png',
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
    })

    const result = await service.createProduct(data as CreateProductRequest, 'user1')
    expect(result.code).toBe('PRD2')
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

  it('should update product with valid data', async () => {
    prisma.product.findUnique.mockResolvedValueOnce({ id: '1', code: 'PRD1' })
    prisma.product.update.mockResolvedValueOnce({
      id: '1',
      code: 'PRD1',
      name: 'Updated',
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
    const result = await service.updateProduct('1', { name: 'Updated' })
    expect(result.name).toBe('Updated')
  })

  it('should not update non-existent product', async () => {
    prisma.product.findUnique.mockResolvedValueOnce(null)
    await expect(service.updateProduct('999', { name: 'X' })).rejects.toThrow()
  })

  it('should soft delete product', async () => {
    prisma.product.findUnique.mockResolvedValueOnce({ id: '1' })
    prisma.product.update.mockResolvedValueOnce({ isActive: false })
    const result = await service.deleteProduct('1')
    expect(result).toBe(true)
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
