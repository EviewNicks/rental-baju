/**
 * ProductService - Business Logic Layer
 * Handles CRUD operations, validation, and business rules for products
 */

import { PrismaClient } from '@prisma/client'
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  productParamsSchema,
} from '../lib/validation/productSchema'
import { NotFoundError, ConflictError } from '../lib/errors/AppError'
import type {
  Product,
  Category,
  CreateProductRequest,
  UpdateProductRequest,
  ProductListResponse,
  ProductStatus,
} from '../types'
import { Decimal } from '@prisma/client/runtime/library'

export class ProductService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly userId: string,
  ) {}

  /**
   * Create a new product
   */
  async createProduct(request: CreateProductRequest): Promise<Product> {
    // Validate input
    const validatedData = createProductSchema.parse(request)

    // Check if product code already exists
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        code: validatedData.code,
        isActive: true,
      },
    })

    if (existingProduct) {
      throw new ConflictError(`Kode produk ${validatedData.code} sudah digunakan`)
    }

    // Create product
    const prismaProduct = await this.prisma.product.create({
      data: {
        code: validatedData.code,
        name: validatedData.name,
        description: validatedData.description,
        modalAwal: validatedData.modalAwal,
        hargaSewa: validatedData.hargaSewa,
        quantity: validatedData.quantity,
        categoryId: validatedData.categoryId,
        imageUrl: validatedData.image ? undefined : undefined, // Will be updated after file upload
        status: 'AVAILABLE',
        totalPendapatan: new Decimal(0),
        isActive: true,
        createdBy: this.userId,
      },
      include: {
        category: true,
      },
    })

    // Convert Prisma types to application types
    return this.convertPrismaProductToProduct(prismaProduct)
  }

  /**
   * Update an existing product
   */
  async updateProduct(id: string, request: UpdateProductRequest): Promise<Product> {
    // Validate input
    const { id: validatedId } = productParamsSchema.parse({ id })
    const validatedData = updateProductSchema.parse(request)

    // Check if product exists
    const existingProduct = await this.prisma.product.findUnique({
      where: {
        id: validatedId,
        isActive: true,
      },
    })

    if (!existingProduct) {
      throw new NotFoundError('Produk tidak ditemukan')
    }

    // Update product
    const updatedProduct = await this.prisma.product.update({
      where: { id: validatedId },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
      include: {
        category: true,
      },
    })

    return this.convertPrismaProductToProduct(updatedProduct)
  }

  /**
   * Get products with pagination and filtering
   */
  async getProducts(query: Record<string, unknown>): Promise<ProductListResponse> {
    // Validate and parse query parameters
    const validatedQuery = productQuerySchema.parse(query)
    const { page, limit, search, categoryId, status, isActive } = validatedQuery

    // Build where clause
    const where: Record<string, unknown> = {
      isActive: isActive ?? true,
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit
    const take = limit

    // Execute queries in parallel
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      this.prisma.product.count({ where }),
    ])

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit)

    return {
      products: products.map((product) => this.convertPrismaProductToProduct(product)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  }

  /**
   * Get a single product by ID
   */
  async getProductById(id: string): Promise<Product> {
    // Validate input
    const { id: validatedId } = productParamsSchema.parse({ id })

    const product = await this.prisma.product.findUnique({
      where: {
        id: validatedId,
        isActive: true,
      },
      include: {
        category: true,
      },
    })

    if (!product) {
      throw new NotFoundError('Produk tidak ditemukan')
    }

    return this.convertPrismaProductToProduct(product)
  }

  /**
   * Soft delete a product
   */
  async deleteProduct(id: string): Promise<boolean> {
    // Validate input
    const { id: validatedId } = productParamsSchema.parse({ id })

    // Check if product exists
    const existingProduct = await this.prisma.product.findUnique({
      where: {
        id: validatedId,
        isActive: true,
      },
    })

    if (!existingProduct) {
      throw new NotFoundError('Produk tidak ditemukan')
    }

    // Soft delete
    await this.prisma.product.update({
      where: { id: validatedId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    })

    return true
  }

  /**
   * Update product status
   */
  async updateProductStatus(id: string, status: ProductStatus): Promise<Product> {
    // Validate input
    const { id: validatedId } = productParamsSchema.parse({ id })

    // Validate status enum
    const validStatuses: ProductStatus[] = ['AVAILABLE', 'RENTED', 'MAINTENANCE']
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status value')
    }

    // Check if product exists
    const existingProduct = await this.prisma.product.findUnique({
      where: {
        id: validatedId,
        isActive: true,
      },
    })

    if (!existingProduct) {
      throw new NotFoundError('Produk tidak ditemukan')
    }

    // Check if status is different
    if (existingProduct.status === status) {
      throw new ConflictError('Status produk sudah sama')
    }

    // Update status
    const updatedProduct = await this.prisma.product.update({
      where: { id: validatedId },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        category: true,
      },
    })

    return this.convertPrismaProductToProduct(updatedProduct)
  }

  /**
   * Convert Prisma product result to application Product type
   */
  private convertPrismaProductToProduct(prismaProduct: Record<string, unknown>): Product {
    return {
      id: prismaProduct.id as string,
      code: prismaProduct.code as string,
      name: prismaProduct.name as string,
      description: prismaProduct.description as string,
      categoryId: prismaProduct.categoryId as string,
      category: prismaProduct.category
        ? {
            id: (prismaProduct.category as Record<string, unknown>).id as string,
            name: (prismaProduct.category as Record<string, unknown>).name as string,
            color: (prismaProduct.category as Record<string, unknown>).color as string,
            products: [], // Avoid circular reference in conversion
            createdAt: (prismaProduct.category as Record<string, unknown>).createdAt as Date,
            updatedAt: (prismaProduct.category as Record<string, unknown>).updatedAt as Date,
            createdBy: (prismaProduct.category as Record<string, unknown>).createdBy as string,
          }
        : ({} as Category),
      modalAwal: prismaProduct.modalAwal as Decimal,
      hargaSewa: prismaProduct.hargaSewa as Decimal,
      quantity: prismaProduct.quantity as number,
      status: prismaProduct.status as ProductStatus,
      imageUrl: prismaProduct.imageUrl as string | undefined,
      totalPendapatan: prismaProduct.totalPendapatan as Decimal,
      isActive: prismaProduct.isActive as boolean,
      createdAt: prismaProduct.createdAt as Date,
      updatedAt: prismaProduct.updatedAt as Date,
      createdBy: prismaProduct.createdBy as string,
    }
  }
}
