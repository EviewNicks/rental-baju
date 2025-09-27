/**
 * Advanced-Only Product Service
 *
 * Clean service implementation for advanced size management system without legacy baggage.
 * This service will replace hybrid methods in Phase 4 implementation.
 *
 * Key Principles:
 * - ALL products MUST have sizes (minimum 1 size required)
 * - No legacy size field support
 * - Enhanced validation and business logic
 * - Advanced aggregation integration
 * - Type-safe operations with advanced-only interfaces
 */

import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { ConflictError, NotFoundError, ValidationError } from '../lib/errors/AppError'
import {
  advancedProductParamsSchema,
  advancedProductQuerySchema,
  createAdvancedProductSchema,
  updateAdvancedProductSchema,
} from '../lib/validation/advancedProductSchema'
import type {
  // Core Types
  AdvancedProduct,
  AdvancedProductSize,
  AdvancedCategory,

  // Request Types
  CreateAdvancedProductRequest,
  UpdateAdvancedProductRequest,
  CreateAdvancedProductSizeRequest,

  // Response Types
  AdvancedProductSizeAggregation,
  AdvancedAggregatedSizeView,
  AdvancedBusinessValidationResult,
  AdvancedProductCapabilities,

  // Utility Types
  AgeCategory,
  SizeEnum,
  ProductStatus,
} from '../types/advanced'
import { validateAdvancedSizeArraySchema } from '../lib/validation/advancedProductSchema'
import { AdvancedProductSizeAggregationService } from './advancedProductSizeAggregationService'

export interface AdvancedProductListResponse {
  products: AdvancedProduct[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AdvancedProductResponseWithAggregation extends AdvancedProduct {
  aggregation?: AdvancedProductSizeAggregation
}

/**
 * Advanced-Only Product Service Implementation
 *
 * This service enforces the advanced size management model where:
 * - Every product MUST have at least one size
 * - No legacy `size` field support
 * - Enhanced validation and business logic
 * - Full integration with advanced aggregation services
 */
export class AdvancedProductService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly userId: string,
  ) {}

  // ============== CORE ADVANCED PRODUCT METHODS ==============

  /**
   * Create product with advanced size management
   *
   * REQUIREMENTS:
   * - Must provide at least 1 size in sizes array
   * - No duplicate size+ageCategory combinations
   * - All sizes must have valid enums and positive quantities
   * - Legacy `size` field is ignored/not supported
   */
  async createProductAdvanced(request: CreateAdvancedProductRequest): Promise<AdvancedProduct> {
    // Validate input with advanced-only schema
    const validatedData = createAdvancedProductSchema.parse(request)

    // Advanced size validation
    const sizeValidation = validateAdvancedSizeArraySchema(validatedData.sizes)
    if (!sizeValidation.success) {
      throw new ValidationError('Size validation failed', sizeValidation.error)
    }

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

    // Validate related entities
    await this.validateCategoryExists(validatedData.categoryId)

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
      // Create the product (NO legacy size field)
      const product = await tx.product.create({
        data: {
          code: validatedData.code,
          name: validatedData.name,
          description: validatedData.description,
          modalAwal: new Decimal(validatedData.modalAwal),
          currentPrice: new Decimal(validatedData.currentPrice),
          quantity: 0, // Will be calculated from sizes
          rentedStock: 0,
          categoryId: validatedData.categoryId,
          // NO size field for advanced products
          size: null,
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

      // Create sizes (REQUIRED - always present)
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

      // Calculate total quantity from sizes
      const totalQuantity = validatedData.sizes.reduce((sum, size) => sum + size.quantity, 0)

      // Update product with calculated quantity
      await tx.product.update({
        where: { id: product.id },
        data: { quantity: totalQuantity },
      })

      return product
    })

    // Fetch complete product with relationships
    return this.getProductAdvanced(result.id)
  }

  /**
   * Update product with advanced size management
   *
   * REQUIREMENTS:
   * - If sizes are updated, must maintain at least 1 size
   * - No duplicate size+ageCategory combinations
   * - Quantity is recalculated from sizes
   * - Legacy `size` field is ignored/not supported
   */
  async updateProductAdvanced(
    id: string,
    request: UpdateAdvancedProductRequest,
  ): Promise<AdvancedProduct> {
    // Validate input
    const { id: validatedId } = advancedProductParamsSchema.parse({ id })
    const validatedData = updateAdvancedProductSchema.parse(request)

    // Check if product exists
    const existingProduct = await this.prisma.product.findUnique({
      where: {
        id: validatedId,
        isActive: true,
      },
      include: {
        sizes: { where: { isActive: true } },
      },
    })

    if (!existingProduct) {
      throw new NotFoundError('Produk tidak ditemukan')
    }

    // Ensure product has advanced size system
    if (!existingProduct.sizes || existingProduct.sizes.length === 0) {
      throw new ValidationError('Produk belum menggunakan sistem ukuran advanced')
    }

    // Validate sizes if provided
    if (validatedData.sizes) {
      const sizeValidation = validateAdvancedSizeArraySchema(validatedData.sizes)
      if (!sizeValidation.success) {
        throw new ValidationError('Size validation failed', sizeValidation.error)
      }
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
      // Prepare update data
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      }

      // Basic field updates
      if (validatedData.name !== undefined) updateData.name = validatedData.name
      if (validatedData.description !== undefined)
        updateData.description = validatedData.description
      if (validatedData.categoryId !== undefined) updateData.categoryId = validatedData.categoryId
      if (validatedData.colorId !== undefined) updateData.colorId = validatedData.colorId
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

      // Handle sizes update if provided
      if (validatedData.sizes !== undefined) {
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

        // Calculate and update total quantity
        const totalQuantity = validatedData.sizes.reduce((sum, size) => sum + size.quantity, 0)
        updateData.quantity = totalQuantity
      }

      // Update the product
      await tx.product.update({
        where: { id: validatedId },
        data: updateData,
      })
    })

    // Clear aggregation cache since sizes were potentially updated
    this.clearProductAggregationCache(validatedId)

    // Fetch updated product with relationships
    return this.getProductAdvanced(validatedId)
  }

  /**
   * Get single product with advanced typing
   *
   * GUARANTEES:
   * - Product will always have sizes array
   * - Uses advanced-only type definitions
   * - Enhanced relations and calculated fields
   */
  async getProductAdvanced(id: string): Promise<AdvancedProduct> {
    // Validate input
    const { id: validatedId } = advancedProductParamsSchema.parse({ id })

    const product = await this.prisma.product.findUnique({
      where: {
        id: validatedId,
        isActive: true,
      },
      include: {
        category: true,
        color: true,
        material: true,
        sizes: {
          where: { isActive: true },
          orderBy: [{ ageCategory: 'asc' }, { size: 'asc' }],
        },
        // Include transaction items for revenue calculation
        transaksiItems: {
          select: {
            subtotal: true,
          },
        },
      },
    })

    if (!product) {
      throw new NotFoundError('Produk tidak ditemukan')
    }

    // Ensure product has advanced size system
    if (!product.sizes || product.sizes.length === 0) {
      throw new ValidationError('Produk belum menggunakan sistem ukuran advanced')
    }

    return this.convertPrismaProductToAdvancedProduct(product)
  }

  /**
   * Get products with advanced typing and filtering
   *
   * GUARANTEES:
   * - All returned products will have sizes
   * - Advanced-only type definitions
   * - Enhanced filtering capabilities
   */
  async getProductsAdvanced(query: Record<string, unknown>): Promise<AdvancedProductListResponse> {
    // Validate and parse query parameters
    const validatedQuery = advancedProductQuerySchema.parse(query)
    const { page, limit, search, categoryId, status, isActive, colorId } = validatedQuery

    // Build where clause
    const where: Record<string, unknown> = {
      isActive: isActive ?? true,
      // Only include products with sizes (advanced products)
      sizes: {
        some: {
          isActive: true,
        },
      },
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (status) {
      where.status = status
    }

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
          color: true,
          material: true,
          sizes: {
            where: { isActive: true },
            orderBy: [{ ageCategory: 'asc' }, { size: 'asc' }],
          },
          transaksiItems: {
            select: {
              subtotal: true,
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
        this.convertPrismaProductToAdvancedProduct(product),
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
   * Delete product (soft delete)
   *
   * Advanced products can be safely deleted as they don't have legacy dependencies
   */
  async deleteProductAdvanced(id: string): Promise<boolean> {
    // Validate input
    const { id: validatedId } = advancedProductParamsSchema.parse({ id })

    // Check if product exists and has advanced size system
    const existingProduct = await this.prisma.product.findUnique({
      where: {
        id: validatedId,
        isActive: true,
      },
      include: {
        sizes: { where: { isActive: true } },
      },
    })

    if (!existingProduct) {
      throw new NotFoundError('Produk tidak ditemukan')
    }

    if (!existingProduct.sizes || existingProduct.sizes.length === 0) {
      throw new ValidationError('Produk belum menggunakan sistem ukuran advanced')
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

  // ============== ADVANCED SIZE MANAGEMENT ==============

  /**
   * Get product sizes with advanced typing
   */
  async getProductSizesAdvanced(productId: string): Promise<AdvancedProductSize[]> {
    const { id: validatedId } = advancedProductParamsSchema.parse({ id: productId })

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

    return sizes.map((size) => this.convertPrismaProductSizeToAdvancedProductSize(size))
  }

  /**
   * Create sizes for existing advanced product
   */
  async createProductSizesAdvanced(
    productId: string,
    sizes: CreateAdvancedProductSizeRequest[],
  ): Promise<AdvancedProductSize[]> {
    const { id: validatedId } = advancedProductParamsSchema.parse({ id: productId })

    // Validate product exists and is advanced
    const product = await this.prisma.product.findUnique({
      where: { id: validatedId, isActive: true },
      include: { sizes: { where: { isActive: true } } },
    })

    if (!product) {
      throw new NotFoundError('Produk tidak ditemukan')
    }

    if (!product.sizes || product.sizes.length === 0) {
      throw new ValidationError('Produk belum menggunakan sistem ukuran advanced')
    }

    // Validate sizes data
    const sizeValidation = validateAdvancedSizeArraySchema(sizes)
    if (!sizeValidation.success) {
      throw new ValidationError('Size validation failed', sizeValidation.error)
    }

    // Check for existing duplicates in database
    const existingSizes = await this.prisma.productSize.findMany({
      where: {
        productId: validatedId,
        isActive: true,
        OR: sizes.map((size) => ({
          ageCategory: size.ageCategory,
          size: size.size,
        })),
      },
    })

    if (existingSizes.length > 0) {
      const existingCombinations = existingSizes.map((s) => `${s.ageCategory}-${s.size}`)
      throw new ConflictError(`Ukuran berikut sudah ada: ${existingCombinations.join(', ')}`)
    }

    // Create sizes and update product quantity
    await this.prisma.$transaction(async (tx) => {
      // Create new sizes
      await tx.productSize.createMany({
        data: sizes.map((size) => ({
          productId: validatedId,
          ageCategory: size.ageCategory,
          size: size.size,
          quantity: size.quantity,
          isActive: size.isActive ?? true,
          createdBy: this.userId,
        })),
      })

      // Recalculate total quantity
      const allSizes = await tx.productSize.findMany({
        where: { productId: validatedId, isActive: true },
      })

      const totalQuantity = allSizes.reduce((sum, size) => sum + size.quantity, 0)

      await tx.product.update({
        where: { id: validatedId },
        data: { quantity: totalQuantity },
      })
    })

    // Clear aggregation cache
    this.clearProductAggregationCache(validatedId)

    return this.getProductSizesAdvanced(validatedId)
  }

  // ============== ADVANCED AGGREGATION INTEGRATION ==============

  /**
   * Get product with advanced aggregation data
   */
  async getProductWithAdvancedAggregation(
    id: string,
    options: {
      includeBreakdown?: boolean
      includeRentalTracking?: boolean
    } = {},
  ): Promise<AdvancedProductResponseWithAggregation> {
    const product = await this.getProductAdvanced(id)

    const { includeBreakdown = true, includeRentalTracking = true } = options

    const aggregationService = this.getAdvancedAggregationService()

    try {
      const aggregation = await aggregationService.getAdvancedProductAggregation(product.id, {
        includeBusinessIntelligence: includeBreakdown,
        includePerformanceMetrics: includeRentalTracking,
      })

      return {
        ...product,
        aggregation,
      }
    } catch (error) {
      console.warn(`Failed to get aggregation for product ${product.id}:`, error)
      return product
    }
  }

  /**
   * Get advanced aggregated sizes for a product
   */
  async getAdvancedAggregatedSizes(
    productId: string,
    options: {
      includeBreakdown?: boolean
      includeRentalTracking?: boolean
    } = {},
  ): Promise<AdvancedAggregatedSizeView[]> {
    // Validate product exists and is advanced
    await this.getProductAdvanced(productId)

    const aggregationService = this.getAdvancedAggregationService()
    const result = await aggregationService.getAdvancedAggregatedSizes(productId, options)

    return result.data
  }

  /**
   * Validate advanced business logic for a product
   */
  async validateAdvancedBusinessLogic(
    productId: string,
  ): Promise<AdvancedBusinessValidationResult> {
    const product = await this.getProductAdvanced(productId)

    const sizeConsistency = product.sizes.length > 0
    const uniqueCombinations = this.validateUniqueSizeCombinations(product.sizes)
    const minimumQuantities = product.sizes.every((size) => size.quantity > 0)
    const validEnumValues = product.sizes.every(
      (size) =>
        ['ADULT', 'CHILD', 'UNIVERSAL'].includes(size.ageCategory) &&
        ['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(size.size),
    )

    const errors: string[] = []
    const warnings: string[] = []

    if (!sizeConsistency) {
      errors.push('Product must have at least one size')
    }

    if (!uniqueCombinations) {
      errors.push('Duplicate size and age category combinations found')
    }

    if (!minimumQuantities) {
      errors.push('All sizes must have positive quantities')
    }

    if (!validEnumValues) {
      errors.push('Invalid age category or size enum values')
    }

    if (product.sizes.length === 1) {
      warnings.push('Consider adding more size variations for better business capabilities')
    }

    const uniqueAgeCategories = new Set(product.sizes.map((s) => s.ageCategory)).size
    if (uniqueAgeCategories === 1) {
      warnings.push('Consider adding multiple age categories for broader market reach')
    }

    return {
      sizeConsistency,
      uniqueCombinations,
      minimumQuantities,
      validEnumValues,
      errors,
      warnings,
    }
  }

  /**
   * Analyze advanced product capabilities
   */
  async analyzeAdvancedProductCapabilities(
    productId: string,
  ): Promise<AdvancedProductCapabilities> {
    const product = await this.getProductAdvanced(productId)

    const uniqueAgeCategories = new Set(product.sizes.map((s) => s.ageCategory)).size
    const uniqueSizes = new Set(product.sizes.map((s) => s.size)).size

    const canTrackByAgeCategory = uniqueAgeCategories > 1
    const canTrackBySpecificSize = uniqueSizes > 1

    // Calculate complexity score (0-10)
    const complexityScore = Math.min(
      10,
      uniqueAgeCategories * 2 + uniqueSizes * 1.5 + product.sizes.length * 0.5,
    )

    let businessValue: 'basic' | 'intermediate' | 'advanced' | 'enterprise' = 'basic'
    if (complexityScore >= 8) businessValue = 'enterprise'
    else if (complexityScore >= 6) businessValue = 'advanced'
    else if (complexityScore >= 4) businessValue = 'intermediate'

    const recommendedActions: string[] = []

    if (!canTrackByAgeCategory) {
      recommendedActions.push('Add different age categories for better customer segmentation')
    }

    if (!canTrackBySpecificSize) {
      recommendedActions.push('Add more size options to serve diverse customer needs')
    }

    if (product.sizes.length < 3) {
      recommendedActions.push('Expand size portfolio for improved inventory management')
    }

    if (recommendedActions.length === 0) {
      recommendedActions.push('Product has excellent size management capabilities')
    }

    return {
      canTrackByAgeCategory,
      canTrackBySpecificSize,
      complexityScore,
      businessValue,
      recommendedActions,
    }
  }

  // ============== HELPER METHODS ==============

  /**
   * Validate category exists
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
   * Validate color exists
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
   * Validate material and calculate cost
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
   * Validate unique size combinations
   */
  private validateUniqueSizeCombinations(sizes: AdvancedProductSize[]): boolean {
    const combinations = sizes.map((s) => `${s.ageCategory}-${s.size}`)
    return combinations.length === new Set(combinations).size
  }

  /**
   * Calculate total revenue from transaction items
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
   * Clear aggregation cache for a product
   */
  private clearProductAggregationCache(productId: string): void {
    const aggregationService = this.getAdvancedAggregationService()
    aggregationService.clearProductCache(productId)
  }

  /**
   * Get advanced aggregation service instance
   */
  private getAdvancedAggregationService(): AdvancedProductSizeAggregationService {
    return new AdvancedProductSizeAggregationService(this.prisma, {
      enableCaching: true,
      cacheExpiryMinutes: 10,
      includeRentalTracking: true,
      performanceThresholdMs: 50,
      maxCacheSize: 1000,
    })
  }

  // ============== TYPE CONVERSION UTILITIES ==============

  /**
   * Convert Prisma product to AdvancedProduct type
   */
  private convertPrismaProductToAdvancedProduct(
    prismaProduct: Record<string, unknown>,
  ): AdvancedProduct {
    return {
      id: prismaProduct.id as string,
      code: prismaProduct.code as string,
      name: prismaProduct.name as string,
      description: prismaProduct.description as string,
      categoryId: prismaProduct.categoryId as string,
      colorId: prismaProduct.colorId as string | undefined,
      materialId: prismaProduct.materialId as string | undefined,
      materialQuantity: prismaProduct.materialQuantity as number | undefined,
      currentPrice: Number(prismaProduct.currentPrice as Decimal),
      modalAwal: Number(prismaProduct.modalAwal as Decimal),
      status: prismaProduct.status as ProductStatus,
      imageUrl: prismaProduct.imageUrl as string | undefined,
      isActive: prismaProduct.isActive as boolean,
      createdAt: prismaProduct.createdAt as Date,
      updatedAt: prismaProduct.updatedAt as Date,
      createdBy: prismaProduct.createdBy as string,

      // REQUIRED: Always has sizes (guaranteed by getProductAdvanced validation)
      sizes: (prismaProduct.sizes as Array<Record<string, unknown>>).map((size) => ({
        id: size.id as string,
        productId: size.productId as string,
        ageCategory: size.ageCategory as AgeCategory,
        size: size.size as SizeEnum,
        quantity: size.quantity as number,
        isActive: size.isActive as boolean,
        createdAt: size.createdAt as Date,
        updatedAt: size.updatedAt as Date,
        createdBy: size.createdBy as string,
      })),

      // Relations
      category: prismaProduct.category
        ? {
            id: (prismaProduct.category as Record<string, unknown>).id as string,
            name: (prismaProduct.category as Record<string, unknown>).name as string,
            color: (prismaProduct.category as Record<string, unknown>).color as string,
            createdAt: (prismaProduct.category as Record<string, unknown>).createdAt as Date,
            updatedAt: (prismaProduct.category as Record<string, unknown>).updatedAt as Date,
            createdBy: (prismaProduct.category as Record<string, unknown>).createdBy as string,
            products: [], // Avoid circular reference
          }
        : ({} as AdvancedCategory),

      color: prismaProduct.color
        ? {
            id: (prismaProduct.color as Record<string, unknown>).id as string,
            name: (prismaProduct.color as Record<string, unknown>).name as string,
            hexCode: (prismaProduct.color as Record<string, unknown>).hexCode as string | undefined,
            description: (prismaProduct.color as Record<string, unknown>).description as
              | string
              | undefined,
            isActive: (prismaProduct.color as Record<string, unknown>).isActive as boolean,
            createdAt: (prismaProduct.color as Record<string, unknown>).createdAt as Date,
            updatedAt: (prismaProduct.color as Record<string, unknown>).updatedAt as Date,
            createdBy: (prismaProduct.color as Record<string, unknown>).createdBy as string,
            products: [], // Avoid circular reference
          }
        : undefined,

      material: prismaProduct.material
        ? {
            id: (prismaProduct.material as Record<string, unknown>).id as string,
            name: (prismaProduct.material as Record<string, unknown>).name as string,
            pricePerUnit: Number(
              (prismaProduct.material as Record<string, unknown>).pricePerUnit as Decimal,
            ),
            unit: (prismaProduct.material as Record<string, unknown>).unit as string,
            isActive: (prismaProduct.material as Record<string, unknown>).isActive as boolean,
            createdAt: (prismaProduct.material as Record<string, unknown>).createdAt as Date,
            updatedAt: (prismaProduct.material as Record<string, unknown>).updatedAt as Date,
            createdBy: (prismaProduct.material as Record<string, unknown>).createdBy as string,
            products: [], // Avoid circular reference
          }
        : undefined,
    }
  }

  /**
   * Convert Prisma ProductSize to AdvancedProductSize type
   */
  private convertPrismaProductSizeToAdvancedProductSize(
    prismaSize: Record<string, unknown>,
  ): AdvancedProductSize {
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
    }
  }
}
