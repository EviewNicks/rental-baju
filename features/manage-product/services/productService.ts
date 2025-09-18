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
  createProductWithSizesSchema,
  updateProductWithSizesSchema,
  productSizeSchema,
  updateProductSizeSchema,
} from '../lib/validation/productSchema'
import { NotFoundError, ConflictError } from '../lib/errors/AppError'
import type {
  Product,
  Category,
  CreateProductRequest,
  UpdateProductRequest,
  ProductListResponse,
  ProductStatus,
  CreateProductWithSizesRequest,
  UpdateProductWithSizesRequest,
  CreateProductSizeRequest,
  UpdateProductSizeRequest,
  ProductSize,
  SizeValidationResult,
  AgeCategory,
  SizeEnum,
  ClientProduct,
  EnhancedClientProduct,
} from '../types'
import { Decimal } from '@prisma/client/runtime/library'
import {
  getProductSizeMode,
  getDisplaySizes,
  getFormattedSizeDisplay,
  getTotalQuantity,
  hasProductSizes,
  enhanceClientProduct,
  createSizeSummary,
  validateSizeCompatibility,
  migrateLegacySizeToAdvanced,
} from '../lib/utils/sizeManagementUtils'

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
          sizes: {
            where: { isActive: true },
            orderBy: [{ ageCategory: 'asc' }, { size: 'asc' }],
          }, // Include product sizes
          // Include transaction items for total revenue calculation
          transaksiItems: {
            select: {
              subtotal: true, // Only select subtotal field for performance
            },
          },
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
        sizes: {
          where: { isActive: true },
          orderBy: [{ ageCategory: 'asc' }, { size: 'asc' }],
        }, // Include product sizes
        // Include transaction items for total revenue calculation
        transaksiItems: {
          select: {
            subtotal: true, // Only select subtotal field for performance
          },
        },
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

  // ============== SIZE MANAGEMENT METHODS ==============

  /**
   * Create product with sizes - Enhanced version of createProduct
   */
  async createProductWithSizes(request: CreateProductWithSizesRequest): Promise<Product> {
    // Validate input
    const validatedData = createProductWithSizesSchema.parse(request)

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
    await this.validateCategoryExists(validatedData.categoryId)

    // Validate color and material if provided
    if (validatedData.colorId) {
      await this.validateColorExists(validatedData.colorId)
    }

    let materialCost: Decimal | undefined
    if (validatedData.materialId) {
      materialCost = await this.validateAndCalculateMaterialCost(
        validatedData.materialId,
        validatedData.materialQuantity,
      )
    }

    // Create product with sizes in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create the product first
      const product = await tx.product.create({
        data: {
          code: validatedData.code,
          name: validatedData.name,
          description: validatedData.description,
          modalAwal: new Decimal(validatedData.modalAwal),
          currentPrice: new Decimal(validatedData.currentPrice),
          quantity: validatedData.quantity,
          rentedStock: 0,
          categoryId: validatedData.categoryId,
          size: validatedData.size,
          colorId: validatedData.colorId,
          materialId: validatedData.materialId || undefined,
          materialCost: materialCost || undefined,
          materialQuantity: validatedData.materialQuantity || undefined,
          imageUrl: request.imageUrl || undefined,
          status: 'AVAILABLE',
          isActive: true,
          createdBy: this.userId,
        },
      })

      // Create sizes if provided
      if (validatedData.hasSizes && validatedData.sizes && validatedData.sizes.length > 0) {
        await tx.productSize.createMany({
          data: validatedData.sizes.map((size) => ({
            productId: product.id,
            ageCategory: size.ageCategory,
            size: size.size,
            quantity: size.quantity,
            isActive: size.isActive ?? true,
            createdBy: this.userId,
          })),
        })
      }

      return product
    })

    // Fetch complete product with relationships
    return this.getProductById(result.id)
  }

  /**
   * Update product with sizes - Enhanced version of updateProduct
   */
  async updateProductWithSizes(
    id: string,
    request: UpdateProductWithSizesRequest,
  ): Promise<Product> {
    // Validate input
    const { id: validatedId } = productParamsSchema.parse({ id })
    const validatedData = updateProductWithSizesSchema.parse(request)

    // Check if product exists
    const existingProduct = await this.prisma.product.findUnique({
      where: {
        id: validatedId,
        isActive: true,
      },
      include: {
        sizes: true,
      },
    })

    if (!existingProduct) {
      throw new NotFoundError('Produk tidak ditemukan')
    }

    // Validate related entities if being updated
    if (validatedData.categoryId && validatedData.categoryId !== existingProduct.categoryId) {
      await this.validateCategoryExists(validatedData.categoryId)
    }

    if (validatedData.colorId && validatedData.colorId !== existingProduct.colorId) {
      await this.validateColorExists(validatedData.colorId)
    }

    let materialCost: Decimal | undefined
    if (validatedData.materialId && validatedData.materialId !== existingProduct.materialId) {
      materialCost = await this.validateAndCalculateMaterialCost(
        validatedData.materialId,
        validatedData.materialQuantity,
      )
    }

    // Update product with sizes in transaction
    await this.prisma.$transaction(async (tx) => {
      // Update the product
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
      if (validatedData.materialId !== undefined) updateData.materialId = validatedData.materialId
      if (validatedData.materialQuantity !== undefined)
        updateData.materialQuantity = validatedData.materialQuantity
      if (materialCost !== undefined) updateData.materialCost = materialCost

      if ('imageUrl' in request && request.imageUrl !== undefined) {
        updateData.imageUrl = request.imageUrl
      }

      if (validatedData.modalAwal !== undefined) {
        updateData.modalAwal = new Decimal(validatedData.modalAwal)
      }
      if (validatedData.currentPrice !== undefined) {
        updateData.currentPrice = new Decimal(validatedData.currentPrice)
      }

      await tx.product.update({
        where: { id: validatedId },
        data: updateData,
      })

      // Handle sizes update if provided
      if (validatedData.hasSizes !== undefined && validatedData.sizes !== undefined) {
        if (validatedData.hasSizes && validatedData.sizes.length > 0) {
          // Delete existing sizes
          await tx.productSize.deleteMany({
            where: { productId: validatedId },
          })

          // Create new sizes
          await tx.productSize.createMany({
            data: validatedData.sizes.map((size) => ({
              productId: validatedId,
              ageCategory: size.ageCategory,
              size: size.size,
              quantity: size.quantity,
              isActive: size.isActive ?? true,
              createdBy: this.userId,
            })),
          })
        } else if (!validatedData.hasSizes) {
          // Remove all sizes if hasSizes is false
          await tx.productSize.deleteMany({
            where: { productId: validatedId },
          })
        }
      }
    })

    // Fetch updated product with relationships
    return this.getProductById(validatedId)
  }

  /**
   * Get product sizes for a specific product
   */
  async getProductSizes(productId: string): Promise<ProductSize[]> {
    const { id: validatedId } = productParamsSchema.parse({ id: productId })

    const sizes = await this.prisma.productSize.findMany({
      where: {
        productId: validatedId,
        isActive: true,
      },
      include: {
        product: {
          include: {
            category: true,
            color: true,
            material: true,
          },
        },
      },
      orderBy: [{ ageCategory: 'asc' }, { size: 'asc' }],
    })

    return sizes.map((size) => this.convertPrismaProductSizeToProductSize(size))
  }

  /**
   * Create sizes for an existing product
   */
  async createProductSizes(
    productId: string,
    sizes: CreateProductSizeRequest[],
  ): Promise<ProductSize[]> {
    const { id: validatedId } = productParamsSchema.parse({ id: productId })

    // Validate product exists
    const product = await this.prisma.product.findUnique({
      where: { id: validatedId, isActive: true },
    })

    if (!product) {
      throw new NotFoundError('Produk tidak ditemukan')
    }

    // Validate sizes data
    const validatedSizes = sizes.map((size) => productSizeSchema.parse(size))

    // Check for duplicates within the request
    const combinations = validatedSizes.map((s) => `${s.ageCategory}-${s.size}`)
    const uniqueCombinations = new Set(combinations)
    if (combinations.length !== uniqueCombinations.size) {
      throw new ConflictError('Tidak boleh ada ukuran duplikat dalam kategori umur yang sama')
    }

    // Check for existing duplicates in database
    const existingSizes = await this.prisma.productSize.findMany({
      where: {
        productId: validatedId,
        isActive: true,
        OR: validatedSizes.map((size) => ({
          ageCategory: size.ageCategory,
          size: size.size,
        })),
      },
    })

    if (existingSizes.length > 0) {
      const existingCombinations = existingSizes.map((s) => `${s.ageCategory}-${s.size}`)
      throw new ConflictError(
        `Ukuran berikut sudah ada: ${existingCombinations.join(', ')}`,
      )
    }

    // Create sizes
    await this.prisma.productSize.createMany({
      data: validatedSizes.map((size) => ({
        productId: validatedId,
        ageCategory: size.ageCategory,
        size: size.size,
        quantity: size.quantity,
        isActive: size.isActive ?? true,
        createdBy: this.userId,
      })),
    })

    return this.getProductSizes(validatedId)
  }

  /**
   * Update multiple sizes for a product
   */
  async updateProductSizes(
    productId: string,
    sizes: UpdateProductSizeRequest[],
  ): Promise<ProductSize[]> {
    const { id: validatedId } = productParamsSchema.parse({ id: productId })

    // Validate sizes data
    const validatedSizes = sizes.map((size) => updateProductSizeSchema.parse(size))

    await this.prisma.$transaction(async (tx) => {
      for (const size of validatedSizes) {
        if (size.id) {
          // Update existing size
          await tx.productSize.update({
            where: { id: size.id },
            data: {
              ageCategory: size.ageCategory,
              size: size.size,
              quantity: size.quantity,
              isActive: size.isActive ?? true,
              updatedAt: new Date(),
            },
          })
        } else {
          // Create new size
          await tx.productSize.create({
            data: {
              productId: validatedId,
              ageCategory: size.ageCategory,
              size: size.size,
              quantity: size.quantity,
              isActive: size.isActive ?? true,
              createdBy: this.userId,
            },
          })
        }
      }
    })

    return this.getProductSizes(validatedId)
  }

  /**
   * Delete specific sizes
   */
  async deleteProductSizes(productId: string, sizeIds: string[]): Promise<boolean> {
    const { id: validatedId } = productParamsSchema.parse({ id: productId })

    // Validate that all size IDs exist and belong to the product
    const existingSizes = await this.prisma.productSize.findMany({
      where: {
        id: { in: sizeIds },
        productId: validatedId,
      },
    })

    if (existingSizes.length !== sizeIds.length) {
      throw new NotFoundError('Beberapa ukuran tidak ditemukan')
    }

    // Soft delete sizes
    await this.prisma.productSize.updateMany({
      where: {
        id: { in: sizeIds },
        productId: validatedId,
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    })

    return true
  }

  // ============== BACKWARD COMPATIBILITY METHODS ==============

  /**
   * Get product with enhanced size information (unified interface)
   */
  async getEnhancedProductById(id: string): Promise<EnhancedClientProduct> {
    const product = await this.getProductById(id)
    return enhanceClientProduct(product as unknown as ClientProduct)
  }

  /**
   * Migrate legacy product to advanced sizing
   */
  async migrateLegacyProductToAdvanced(
    productId: string,
    defaultAgeCategory: AgeCategory = 'ADULT'
  ): Promise<Product> {
    const { id: validatedId } = productParamsSchema.parse({ id: productId })

    // Get current product
    const product = await this.getProductById(validatedId)
    const sizeMode = getProductSizeMode(product)

    if (sizeMode !== 'legacy') {
      throw new ConflictError('Produk bukan menggunakan sistem ukuran lama')
    }

    // Create advanced sizes from legacy data
    const newSizes = migrateLegacySizeToAdvanced(product, defaultAgeCategory)

    if (newSizes.length === 0) {
      throw new ConflictError('Ukuran lama tidak dapat dikonversi ke sistem baru')
    }

    // Update product with new sizes
    return this.updateProductWithSizes(validatedId, {
      hasSizes: true,
      sizes: newSizes.map(size => ({
        ageCategory: size.ageCategory,
        size: size.size,
        quantity: size.quantity,
        isActive: size.isActive,
      })),
      size: undefined, // Remove legacy size
    })
  }

  /**
   * Get product size summary (unified interface for listing)
   */
  async getProductSizeSummary(productId: string): Promise<{
    mode: 'legacy' | 'advanced' | 'none'
    count: number
    display: string
    hasStock: boolean
    totalQuantity: number
  }> {
    const product = await this.getProductById(productId)
    const summary = createSizeSummary(product)
    const totalQuantity = getTotalQuantity(product)

    return {
      ...summary,
      totalQuantity,
    }
  }

  /**
   * Validate size compatibility for updates
   */
  async validateProductSizeUpdate(
    productId: string,
    newSizes?: UpdateProductSizeRequest[]
  ): Promise<{ isCompatible: boolean; warnings: string[] }> {
    const product = await this.getProductById(productId)

    // Convert UpdateProductSizeRequest to ProductSize for validation
    const sizesForValidation: ProductSize[] = newSizes?.map(size => ({
      id: size.id || '',
      productId: productId,
      ageCategory: size.ageCategory,
      size: size.size,
      quantity: size.quantity,
      isActive: size.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: this.userId,
      product: {} as Product,
    })) || []

    return validateSizeCompatibility(product, sizesForValidation)
  }

  /**
   * Get unified size display for any product
   */
  async getProductSizeDisplay(productId: string): Promise<{
    sizes: string[]
    formatted: string
    mode: 'legacy' | 'advanced' | 'none'
  }> {
    const product = await this.getProductById(productId)
    const sizes = getDisplaySizes(product)
    const formatted = getFormattedSizeDisplay(product)
    const mode = getProductSizeMode(product)

    return { sizes, formatted, mode }
  }

  /**
   * Check if product has any sizing information
   */
  async hasProductSizing(productId: string): Promise<boolean> {
    const product = await this.getProductById(productId)
    return hasProductSizes(product)
  }

  /**
   * Get products with enhanced size information (for listing)
   */
  async getProductsWithSizeInfo(query: Record<string, unknown>): Promise<{
    products: Array<Product & {
      sizeMode: 'legacy' | 'advanced' | 'none'
      sizeSummary: { count: number; display: string; hasStock: boolean }
      totalQuantity: number
    }>
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }> {
    const result = await this.getProducts(query)

    const enhancedProducts = result.products.map(product => {
      const sizeMode = getProductSizeMode(product)
      const sizeSummary = createSizeSummary(product)
      const totalQuantity = getTotalQuantity(product)

      return {
        ...product,
        sizeMode,
        sizeSummary,
        totalQuantity,
      }
    })

    return {
      products: enhancedProducts,
      pagination: result.pagination,
    }
  }

  /**
   * Bulk migrate legacy products to advanced sizing
   */
  async bulkMigrateLegacyProducts(
    productIds: string[],
    defaultAgeCategory: AgeCategory = 'ADULT'
  ): Promise<{
    migrated: Product[]
    failed: Array<{ id: string; reason: string }>
  }> {
    const migrated: Product[] = []
    const failed: Array<{ id: string; reason: string }> = []

    for (const productId of productIds) {
      try {
        const product = await this.migrateLegacyProductToAdvanced(productId, defaultAgeCategory)
        migrated.push(product)
      } catch (error) {
        failed.push({
          id: productId,
          reason: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return { migrated, failed }
  }

  // ============== HELPER METHODS ==============

  /**
   * Validate size data with business rules
   */
  private validateSizeData(sizes: CreateProductSizeRequest[]): SizeValidationResult {
    const errors: Array<{ field: string; message: string }> = []

    // Check for duplicates
    const combinations = sizes.map((s) => `${s.ageCategory}-${s.size}`)
    const uniqueCombinations = new Set(combinations)
    if (combinations.length !== uniqueCombinations.size) {
      errors.push({
        field: 'sizes',
        message: 'Tidak boleh ada ukuran duplikat dalam kategori umur yang sama',
      })
    }

    // Check quantities
    const invalidQuantities = sizes.filter((s) => s.quantity <= 0)
    if (invalidQuantities.length > 0) {
      errors.push({
        field: 'quantities',
        message: 'Semua kuantitas ukuran harus lebih dari 0',
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Helper method to validate category exists
   */
  private async validateCategoryExists(categoryId: string): Promise<void> {
    const categoryExists = await this.prisma.category.findUnique({
      where: { id: categoryId },
    })

    if (!categoryExists) {
      throw new NotFoundError(`Category dengan ID ${categoryId} tidak ditemukan`)
    }
  }

  /**
   * Helper method to validate color exists
   */
  private async validateColorExists(colorId: string): Promise<void> {
    const colorExists = await this.prisma.color.findUnique({
      where: { id: colorId },
    })

    if (!colorExists) {
      throw new NotFoundError(`Warna dengan ID ${colorId} tidak ditemukan`)
    }
  }

  /**
   * Helper method to validate material and calculate cost
   */
  private async validateAndCalculateMaterialCost(
    materialId: string,
    materialQuantity?: number,
  ): Promise<Decimal | undefined> {
    const materialExists = await this.prisma.material.findUnique({
      where: { id: materialId },
    })

    if (!materialExists) {
      throw new NotFoundError(`Material dengan ID ${materialId} tidak ditemukan`)
    }

    if (materialQuantity && materialQuantity > 0) {
      return new Decimal(materialExists.pricePerUnit).mul(materialQuantity)
    }

    return undefined
  }

  /**
   * Convert Prisma ProductSize to application ProductSize type
   */
  private convertPrismaProductSizeToProductSize(prismaSize: Record<string, unknown>): ProductSize {
    return {
      id: prismaSize.id as string,
      productId: prismaSize.productId as string,
      ageCategory: prismaSize.ageCategory as AgeCategory,
      size: prismaSize.size as SizeEnum,
      quantity: prismaSize.quantity as number,
      isActive: prismaSize.isActive as boolean,
      createdAt: prismaSize.createdAt as Date,
      updatedAt: prismaSize.updatedAt as Date,
      createdBy: prismaSize.createdBy as string,
      product: this.convertPrismaProductToProduct(prismaSize.product as Record<string, unknown>),
    }
  }

  /**
   * Calculate total revenue from transaction items
   * Aggregates subtotal from all related transaction items
   */
  private calculateTotalRevenue(prismaProduct: Record<string, unknown>): Decimal {
    const transaksiItems = prismaProduct.transaksiItems as Array<{ subtotal: Decimal | number }>
    
    if (!transaksiItems?.length) {
      return new Decimal(0)
    }
    
    const total = transaksiItems.reduce((sum, item) => {
      const itemRevenue = Number(item.subtotal) || 0
      return sum + itemRevenue
    }, 0)
    
    return new Decimal(total)
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
      totalPendapatan: this.calculateTotalRevenue(prismaProduct),
      sizes: (prismaProduct.sizes as Array<Record<string, unknown>>)?.map((size) => ({
        id: size.id as string,
        productId: size.productId as string,
        ageCategory: size.ageCategory as AgeCategory,
        size: size.size as SizeEnum,
        quantity: size.quantity as number,
        isActive: size.isActive as boolean,
        createdAt: size.createdAt as Date,
        updatedAt: size.updatedAt as Date,
        createdBy: size.createdBy as string,
        product: {} as Product, // Avoid circular reference
      })) || [],
      isActive: prismaProduct.isActive as boolean,
      createdAt: prismaProduct.createdAt as Date,
      updatedAt: prismaProduct.updatedAt as Date,
      createdBy: prismaProduct.createdBy as string,
    }
  }
}
