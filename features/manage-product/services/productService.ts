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

    // Validate category existence
    const categoryExists = await this.prisma.category.findUnique({
      where: { id: validatedData.categoryId },
    })

    if (!categoryExists) {
      throw new NotFoundError(`Category dengan ID ${validatedData.categoryId} tidak ditemukan`)
    }

    // Validate colorId if provided
    if (validatedData.colorId) {
      const colorExists = await this.prisma.color.findUnique({
        where: { id: validatedData.colorId },
      })

      if (!colorExists) {
        throw new NotFoundError(`Warna dengan ID ${validatedData.colorId} tidak ditemukan`)
      }
    }

    // Validate materialId if provided - RPK-45
    let materialCost: Decimal | undefined
    if (validatedData.materialId) {
      const materialExists = await this.prisma.material.findUnique({
        where: { id: validatedData.materialId },
      })

      if (!materialExists) {
        throw new NotFoundError(`Material dengan ID ${validatedData.materialId} tidak ditemukan`)
      }

      // Calculate material cost if materialQuantity is provided
      if (validatedData.materialQuantity && validatedData.materialQuantity > 0) {
        materialCost = new Decimal(materialExists.pricePerUnit).mul(validatedData.materialQuantity)
      }
    }

    // Create product with Decimal conversion
    const prismaProduct = await this.prisma.product.create({
      data: {
        code: validatedData.code,
        name: validatedData.name,
        description: validatedData.description,
        modalAwal: new Decimal(validatedData.modalAwal), // ✅ Konversi number ke Decimal
        currentPrice: new Decimal(validatedData.currentPrice), // ✅ Fixed: use currentPrice from validated data
        quantity: validatedData.quantity,
        rentedStock: 0, // ✅ Initialize rentedStock to 0 for new products
        categoryId: validatedData.categoryId,
        size: validatedData.size,
        colorId: validatedData.colorId,
        // Material Management fields - RPK-45
        materialId: validatedData.materialId || undefined,
        materialCost: materialCost || undefined,
        materialQuantity: validatedData.materialQuantity || undefined,
        imageUrl: request.imageUrl || undefined, // ✅ Gunakan imageUrl dari request
        status: 'AVAILABLE',
        // totalPendapatan removed - now calculated from transaction history
        isActive: true,
        createdBy: this.userId,
      },
      include: {
        category: true,
        color: true, // Include color relation
        material: true, // Include material relation - RPK-45
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

    // Check if product exists and get current data in one query
    const existingProduct = await this.prisma.product.findUnique({
      where: {
        id: validatedId,
        isActive: true,
      },
      include: {
        category: true,
      },
    })

    if (!existingProduct) {
      throw new NotFoundError('Produk tidak ditemukan')
    }

    // Validate category existence if categoryId is being updated
    if (validatedData.categoryId && validatedData.categoryId !== existingProduct.categoryId) {
      const categoryExists = await this.prisma.category.findUnique({
        where: { id: validatedData.categoryId },
      })

      if (!categoryExists) {
        throw new NotFoundError(`Category dengan ID ${validatedData.categoryId} tidak ditemukan`)
      }
    }

    // Validate colorId existence if colorId is being updated
    if (validatedData.colorId && validatedData.colorId !== existingProduct.colorId) {
      const colorExists = await this.prisma.color.findUnique({
        where: { id: validatedData.colorId },
      })

      if (!colorExists) {
        throw new NotFoundError(`Warna dengan ID ${validatedData.colorId} tidak ditemukan`)
      }
    }

    // Validate materialId and calculate material cost if provided - RPK-45
    let materialCost: Decimal | undefined
    if (validatedData.materialId && validatedData.materialId !== existingProduct.materialId) {
      const materialExists = await this.prisma.material.findUnique({
        where: { id: validatedData.materialId },
      })

      if (!materialExists) {
        throw new NotFoundError(`Material dengan ID ${validatedData.materialId} tidak ditemukan`)
      }

      // Calculate material cost if materialQuantity is provided or exists
      const quantityToUse = validatedData.materialQuantity ?? existingProduct.materialQuantity ?? 0
      if (quantityToUse > 0) {
        materialCost = new Decimal(materialExists.pricePerUnit).mul(quantityToUse)
      }
    } else if (validatedData.materialQuantity && existingProduct.materialId) {
      // Recalculate cost if quantity changed but material stayed the same
      const materialExists = await this.prisma.material.findUnique({
        where: { id: existingProduct.materialId },
      })

      if (materialExists && validatedData.materialQuantity > 0) {
        materialCost = new Decimal(materialExists.pricePerUnit).mul(validatedData.materialQuantity)
      }
    }

    // Prepare update data with Decimal conversion
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    // Add fields with proper type conversion
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.quantity !== undefined) updateData.quantity = validatedData.quantity
    if (validatedData.categoryId !== undefined) updateData.categoryId = validatedData.categoryId
    if (validatedData.size !== undefined) updateData.size = validatedData.size
    if (validatedData.colorId !== undefined) updateData.colorId = validatedData.colorId
    if (validatedData.rentedStock !== undefined) updateData.rentedStock = validatedData.rentedStock

    // Material Management fields - RPK-45
    if (validatedData.materialId !== undefined) updateData.materialId = validatedData.materialId
    if (validatedData.materialQuantity !== undefined) updateData.materialQuantity = validatedData.materialQuantity
    if (materialCost !== undefined) updateData.materialCost = materialCost

    // Handle imageUrl update (added from API layer)
    if ('imageUrl' in request && request.imageUrl !== undefined) {
      updateData.imageUrl = request.imageUrl
    }

    // Convert number to Decimal for monetary fields
    if (validatedData.modalAwal !== undefined) {
      updateData.modalAwal = new Decimal(validatedData.modalAwal) // ✅ Konversi number ke Decimal
    }
    if (validatedData.currentPrice !== undefined) {
      updateData.currentPrice = new Decimal(validatedData.currentPrice) // ✅ Fixed: use currentPrice instead of hargaSewa
    }

    // Update product
    const updatedProduct = await this.prisma.product.update({
      where: { id: validatedId },
      data: updateData,
      include: {
        category: true,
        color: true, // Include color relation
        material: true, // Include material relation - RPK-45
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
    const { page, limit, search, categoryId, status, isActive, size, colorId } = validatedQuery

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

    // Handle size filtering (support multiple values)
    if (size) {
      if (Array.isArray(size)) {
        where.size = { in: size }
      } else {
        where.size = size
      }
    }

    // Handle colorId filtering (support multiple values)
    if (colorId) {
      if (Array.isArray(colorId)) {
        where.colorId = { in: colorId }
      } else {
        where.colorId = colorId
      }
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
          color: true, // Include color relation
          material: true, // Include material relation - RPK-45
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
      products: products.map((product: Record<string, unknown>) =>
        this.convertPrismaProductToProduct(product),
      ),
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
        color: true, // Include color relation
        material: true, // Include material relation - RPK-45
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
        color: true, // Include color relation
        material: true, // Include material relation - RPK-45
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
      size: prismaProduct.size as string | undefined,
      colorId: prismaProduct.colorId as string | undefined,
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
      color: prismaProduct.color
        ? {
            id: (prismaProduct.color as Record<string, unknown>).id as string,
            name: (prismaProduct.color as Record<string, unknown>).name as string,
            hexCode: (prismaProduct.color as Record<string, unknown>).hexCode as string | undefined,
            description: (prismaProduct.color as Record<string, unknown>).description as
              | string
              | undefined,
            isActive: (prismaProduct.color as Record<string, unknown>).isActive as boolean,
            products: [], // Avoid circular reference in conversion
            createdAt: (prismaProduct.color as Record<string, unknown>).createdAt as Date,
            updatedAt: (prismaProduct.color as Record<string, unknown>).updatedAt as Date,
            createdBy: (prismaProduct.color as Record<string, unknown>).createdBy as string,
          }
        : undefined,
      modalAwal: prismaProduct.modalAwal as Decimal,
      currentPrice: prismaProduct.currentPrice as Decimal, // ✅ Fixed: return currentPrice instead of hargaSewa
      quantity: prismaProduct.quantity as number,
      rentedStock: (prismaProduct.rentedStock as number) || 0, // ✅ Added rentedStock field
      // Material Management fields - RPK-45
      materialId: prismaProduct.materialId as string | undefined,
      materialCost: prismaProduct.materialCost as Decimal | undefined,
      materialQuantity: prismaProduct.materialQuantity as number | undefined,
      material: prismaProduct.material
        ? {
            id: (prismaProduct.material as Record<string, unknown>).id as string,
            name: (prismaProduct.material as Record<string, unknown>).name as string,
            pricePerUnit: (prismaProduct.material as Record<string, unknown>).pricePerUnit as Decimal,
            unit: (prismaProduct.material as Record<string, unknown>).unit as string,
            isActive: (prismaProduct.material as Record<string, unknown>).isActive as boolean,
            products: [], // Avoid circular reference in conversion
            createdAt: (prismaProduct.material as Record<string, unknown>).createdAt as Date,
            updatedAt: (prismaProduct.material as Record<string, unknown>).updatedAt as Date,
            createdBy: (prismaProduct.material as Record<string, unknown>).createdBy as string,
          }
        : undefined,
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
