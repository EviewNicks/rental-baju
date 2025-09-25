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
  productSizeSchema,
  updateProductSizeSchema,
} from '../lib/validation/productSchema'
import { NotFoundError, ConflictError } from '../lib/errors/AppError'
import type {
  Product,
  Category,
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
  ProductSizeAggregation,
  ProductResponseWithAggregation,
  AggregatedSizeView,
  CategoryBreakdown,
  BusinessLogicValidationResult,
  BusinessCapabilitiesReport,
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
import { ProductSizeAggregationService } from './productSizeAggregationService'

export class ProductService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly userId: string,
  ) {}

  // Legacy createProduct method removed - advanced-only architecture
  // All products now require sizes via createProduct() method

  // Legacy updateProduct method removed - advanced-only architecture
  // All products now require sizes via updateProduct() method

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
   * Create a new product (advanced-only architecture)
   * All products now require sizes - no legacy single-size support
   */
  async createProduct(request: CreateProductWithSizesRequest): Promise<Product> {
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

      // Create sizes - REQUIRED for all products in advanced-only architecture
      if (validatedData.sizes && validatedData.sizes.length > 0) {
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
   * Update an existing product (advanced-only architecture)
   * All products now support sizes - no legacy single-size support
   */
  async updateProduct(id: string, request: UpdateProductWithSizesRequest): Promise<Product> {
    // Validate input
    const { id: validatedId } = productParamsSchema.parse({ id })
    const validatedData = updateProductSchema.parse(request)

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
      if (validatedData.description !== undefined)
        updateData.description = validatedData.description
      if (validatedData.quantity !== undefined) updateData.quantity = validatedData.quantity
      if (validatedData.categoryId !== undefined) updateData.categoryId = validatedData.categoryId
      if (validatedData.size !== undefined) updateData.size = validatedData.size
      if (validatedData.colorId !== undefined) updateData.colorId = validatedData.colorId
      if (validatedData.rentedStock !== undefined)
        updateData.rentedStock = validatedData.rentedStock
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

      // Handle sizes update - advanced-only architecture
      if (validatedData.sizes !== undefined) {
        if (validatedData.sizes.length > 0) {
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
        } else {
          // Remove all sizes if empty array provided
          await tx.productSize.deleteMany({
            where: { productId: validatedId },
          })
        }
      }
    })

    // Clear aggregation cache since sizes were potentially updated
    this.clearProductAggregationCache(validatedId)

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
      throw new ConflictError(`Ukuran berikut sudah ada: ${existingCombinations.join(', ')}`)
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

    // Clear aggregation cache since new sizes were created
    this.clearProductAggregationCache(validatedId)

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

    // Clear aggregation cache since sizes were updated
    this.clearProductAggregationCache(validatedId)

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

    // Clear aggregation cache since sizes were deleted
    this.clearProductAggregationCache(validatedId)

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
  async migrateLegacyProductToAdvanced(productId: string): Promise<Product> {
    const { id: validatedId } = productParamsSchema.parse({ id: productId })

    // Get current product
    const product = await this.getProductById(validatedId)
    const sizeMode = getProductSizeMode(product)

    if (sizeMode !== 'legacy') {
      throw new ConflictError('Produk bukan menggunakan sistem ukuran lama')
    }

    // Create advanced sizes from legacy data
    const newSizes = migrateLegacySizeToAdvanced()

    if (newSizes.length === 0) {
      throw new ConflictError('Ukuran lama tidak dapat dikonversi ke sistem baru')
    }

    // Update product with new sizes
    return this.updateProduct(validatedId, {
      sizes: newSizes.map((size) => ({
        ageCategory: size.ageCategory,
        size: size.size,
        quantity: size.quantity,
        isActive: size.isActive,
      })),
      // Note: Legacy size property no longer exists
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
    newSizes?: UpdateProductSizeRequest[],
  ): Promise<{ isCompatible: boolean; warnings: string[] }> {
    const product = await this.getProductById(productId)

    // Convert UpdateProductSizeRequest to ProductSize for validation
    const sizesForValidation: ProductSize[] =
      newSizes?.map((size) => ({
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
    products: Array<
      Product & {
        sizeMode: 'legacy' | 'advanced' | 'none'
        sizeSummary: { count: number; display: string; hasStock: boolean }
        totalQuantity: number
      }
    >
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }> {
    const result = await this.getProducts(query)

    const enhancedProducts = result.products.map((product) => {
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
  async bulkMigrateLegacyProducts(productIds: string[]): Promise<{
    migrated: Product[]
    failed: Array<{ id: string; reason: string }>
  }> {
    const migrated: Product[] = []
    const failed: Array<{ id: string; reason: string }> = []

    for (const productId of productIds) {
      try {
        const product = await this.migrateLegacyProductToAdvanced(productId)
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

  // ============== AGGREGATION INTEGRATION METHODS ==============

  /**
   * Get product with optional aggregation data
   */
  async getProductWithAggregation(
    id: string,
    includeAggregation: boolean = false,
    includeBreakdown: boolean = true,
  ): Promise<ProductResponseWithAggregation> {
    const product = await this.getProductById(id)

    if (!includeAggregation) {
      return product
    }

    const aggregationService = this.getAggregationService(includeBreakdown)

    try {
      const aggregation = await aggregationService.getProductAggregation(product.id)
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
   * Get products with optional aggregation data
   */
  async getProductsWithAggregation(
    query: Record<string, unknown> & {
      includeAggregation?: boolean
      includeBreakdown?: boolean
    },
  ): Promise<
    ProductListResponse & {
      products: ProductResponseWithAggregation[]
    }
  > {
    const { includeAggregation = false, includeBreakdown = true, ...productQuery } = query
    const result = await this.getProducts(productQuery)

    if (!includeAggregation) {
      return result as ProductListResponse & { products: ProductResponseWithAggregation[] }
    }

    const aggregationService = this.getAggregationService(includeBreakdown)

    const productsWithAggregation = await Promise.all(
      result.products.map(async (product) => {
        try {
          const aggregation = await aggregationService.getProductAggregation(product.id)
          return {
            ...product,
            aggregation,
          }
        } catch (error) {
          console.warn(`Failed to get aggregation for product ${product.id}:`, error)
          return product
        }
      }),
    )

    return {
      ...result,
      products: productsWithAggregation,
    }
  }

  /**
   * Get aggregated sizes for a product
   */
  async getProductAggregatedSizes(
    productId: string,
    includeBreakdown: boolean = true,
  ): Promise<AggregatedSizeView[]> {
    // Validate product exists
    await this.getProductById(productId)

    const aggregationService = this.getAggregationService(includeBreakdown)
    const result = await aggregationService.getAggregatedSizes(productId, includeBreakdown)

    return result.data
  }

  /**
   * Get complete aggregation data for a product
   */
  async getProductAggregation(
    productId: string,
    includeBreakdown: boolean = true,
  ): Promise<ProductSizeAggregation> {
    // Validate product exists
    await this.getProductById(productId)

    const aggregationService = this.getAggregationService(includeBreakdown)
    return aggregationService.getProductAggregation(productId)
  }

  /**
   * Get category breakdown for a product
   */
  async getProductCategoryBreakdown(productId: string): Promise<CategoryBreakdown> {
    // Validate product exists
    await this.getProductById(productId)

    const aggregationService = this.getAggregationService(true)
    return aggregationService
      .getAgeCategoryDistribution(productId)
      .then((result) => result.categoryPercentages)
  }

  /**
   * Clear aggregation cache for a product (called after updates)
   */
  private clearProductAggregationCache(productId: string): void {
    const aggregationService = this.getAggregationService()
    aggregationService.clearProductCache(productId)
  }

  /**
   * Validate business logic preservation for a product
   */
  async validateBusinessLogicPreservation(
    productId: string,
  ): Promise<BusinessLogicValidationResult> {
    // Validate product exists
    await this.getProductById(productId)

    const aggregationService = this.getAggregationService(true)

    // Run all validation checks in parallel for efficiency
    const [aggregationConsistency, rentalTracking, analyticsCapabilities, inventoryManagement] =
      await Promise.all([
        aggregationService.validateAggregationConsistency(productId),
        aggregationService.validateRentalTrackingCapabilities(productId),
        aggregationService.validateAnalyticsCapabilities(productId),
        aggregationService.validateInventoryCapabilities(productId),
      ])

    // Determine overall health and recommendations
    const recommendations: string[] = []
    let overallHealth: 'excellent' | 'good' | 'needs_attention' | 'critical' = 'excellent'

    // Check aggregation consistency
    if (!aggregationConsistency.isConsistent) {
      overallHealth = 'critical'
      recommendations.push('Data inconsistency detected - immediate attention required')
    }

    // Check rental tracking capabilities
    if (!rentalTracking.canTrackByAgeCategory) {
      if (overallHealth !== 'critical') overallHealth = 'needs_attention'
      recommendations.push('Consider adding age category tracking for better rental management')
    }

    // Check analytics capabilities
    if (!analyticsCapabilities.canGenerateReports) {
      if (overallHealth === 'excellent') overallHealth = 'good'
      recommendations.push('Limited analytics available - consider expanding size variety')
    }

    // Check inventory health
    if (inventoryManagement.inventoryHealth === 'critical') {
      overallHealth = 'critical'
      recommendations.push('Critical inventory issues detected - review restocking recommendations')
    } else if (inventoryManagement.inventoryHealth === 'needs_attention') {
      if (overallHealth === 'excellent') overallHealth = 'needs_attention'
      recommendations.push('Some inventory items need attention')
    }

    // Business capability recommendations
    if (rentalTracking.businessCapabilities.length < 2) {
      recommendations.push('Expand size portfolio for enhanced business capabilities')
    }

    if (analyticsCapabilities.analyticsBreakdown.complexityScore < 3) {
      recommendations.push('Consider adding more age categories or sizes for better analytics')
    }

    // If no issues found
    if (recommendations.length === 0) {
      recommendations.push('All business logic capabilities are well-preserved')
    }

    return {
      aggregationConsistency,
      rentalTracking,
      analyticsCapabilities,
      inventoryManagement,
      overallHealth,
      recommendations,
    }
  }

  /**
   * Get comprehensive business capabilities report
   */
  async getBusinessCapabilitiesReport(productId: string): Promise<BusinessCapabilitiesReport> {
    const product = await this.getProductById(productId)
    const validation = await this.validateBusinessLogicPreservation(productId)

    // Build capability matrix
    const capabilityMatrix = {
      rental: {
        ageCategoryTracking: validation.rentalTracking.canTrackByAgeCategory,
        sizeSpecificTracking: validation.rentalTracking.canTrackBySpecificSize,
        multiGenerationalSupport: validation.rentalTracking.businessCapabilities.includes(
          'Multi-generational rental support',
        ),
      },
      analytics: {
        reportGeneration: validation.analyticsCapabilities.canGenerateReports,
        trendAnalysis: validation.analyticsCapabilities.availableMetrics.length > 3,
        performanceMetrics: validation.analyticsCapabilities.businessInsights.length > 2,
      },
      inventory: {
        categoryRestocking: validation.inventoryManagement.canRestockByCategory,
        utilizationTracking: validation.inventoryManagement.canTrackUtilization,
        healthMonitoring: validation.inventoryManagement.inventoryHealth !== 'critical',
      },
    }

    // Calculate business value score
    const capabilities = [
      capabilityMatrix.rental.ageCategoryTracking,
      capabilityMatrix.rental.sizeSpecificTracking,
      capabilityMatrix.rental.multiGenerationalSupport,
      capabilityMatrix.analytics.reportGeneration,
      capabilityMatrix.analytics.trendAnalysis,
      capabilityMatrix.analytics.performanceMetrics,
      capabilityMatrix.inventory.categoryRestocking,
      capabilityMatrix.inventory.utilizationTracking,
      capabilityMatrix.inventory.healthMonitoring,
    ]

    const score = capabilities.filter(Boolean).length
    let level: 'basic' | 'intermediate' | 'advanced' | 'enterprise' = 'basic'

    if (score >= 8) level = 'enterprise'
    else if (score >= 6) level = 'advanced'
    else if (score >= 4) level = 'intermediate'

    // Identify strengths and improvement areas
    const strengths: string[] = []
    const improvementAreas: string[] = []

    if (
      capabilityMatrix.rental.ageCategoryTracking &&
      capabilityMatrix.rental.sizeSpecificTracking
    ) {
      strengths.push('Comprehensive rental tracking capabilities')
    }

    if (capabilityMatrix.analytics.reportGeneration && capabilityMatrix.analytics.trendAnalysis) {
      strengths.push('Advanced analytics and reporting capabilities')
    }

    if (
      capabilityMatrix.inventory.categoryRestocking &&
      capabilityMatrix.inventory.utilizationTracking
    ) {
      strengths.push('Robust inventory management system')
    }

    if (!capabilityMatrix.rental.multiGenerationalSupport) {
      improvementAreas.push('Consider adding multi-generational product support')
    }

    if (!capabilityMatrix.analytics.performanceMetrics) {
      improvementAreas.push('Expand metrics collection for better business insights')
    }

    if (!capabilityMatrix.inventory.healthMonitoring) {
      improvementAreas.push('Address inventory health issues for optimal operations')
    }

    return {
      productId,
      productName: product.name,
      capabilityMatrix,
      businessValue: {
        score,
        level,
        strengths,
        improvementAreas,
      },
    }
  }

  /**
   * Get or create aggregation service instance
   */
  private getAggregationService(includeBreakdown: boolean = true): ProductSizeAggregationService {
    return new ProductSizeAggregationService(this.prisma, {
      includeBreakdown,
      enableCaching: true,
      cacheExpiryMinutes: 15,
    })
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
      // Note: Legacy size property no longer exists in Product interface
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
            pricePerUnit: (prismaProduct.material as Record<string, unknown>)
              .pricePerUnit as Decimal,
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
      sizes:
        (prismaProduct.sizes as Array<Record<string, unknown>>)?.map((size) => ({
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
