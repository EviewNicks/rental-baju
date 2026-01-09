/**
 * ProductService - Business Logic Layer
 * Handles CRUD operations, validation, and business rules for products
 */

import { PrismaClient } from '@prisma/client'
import { SizeEnum } from '../types'
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
  ClientProduct,
  EnhancedClientProduct,
  ProductSizeAggregation,
  ProductResponseWithAggregation,
  AggregatedSizeView,
  CategoryBreakdown,
  BusinessLogicValidationResult,
  BusinessCapabilitiesReport,
  CategoryType,
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
import { ProductCostService } from './productCostService'

export class ProductService {
  private readonly productCostService: ProductCostService

  constructor(
    private readonly prisma: PrismaClient,
    private readonly userId: string,
  ) {
    // Initialize ProductCostService for cost item management
    this.productCostService = new ProductCostService(this.prisma, this.userId)
  }

  /**
   * Get ProductCostService instance for cost item operations
   */
  private getProductCostService(): ProductCostService {
    return this.productCostService
  }
  

  
  /**
   * Get products with pagination and filtering
   */
  async getProducts(query: Record<string, unknown>): Promise<ProductListResponse> {
    // Validate and parse query parameters
    const validatedQuery = productQuerySchema.parse(query)
    const { page, limit, search, categoryId, status, isActive, size } = validatedQuery

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
          sizes: {
            where: { isActive: true },
            orderBy: [{ ageCategory: 'asc' }, { size: 'asc' }],
          }, // Include product sizes
          productCosts: {
            include: {
              costItem: true,
            },
            orderBy: { createdAt: 'desc' },
          }, // Include cost items
          // transaksiItems include REMOVED - causing TimeoutError
          // Performance optimization: Don't load transaction history in product listing
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
        sizes: {
          where: { isActive: true },
          orderBy: [{ ageCategory: 'asc' }, { size: 'asc' }],
        }, // Include product sizes
        productCosts: {
          include: {
            costItem: true,
          },
          orderBy: { createdAt: 'desc' },
        }, // Include cost items
        // transaksiItems include REMOVED - causing TimeoutError
        // Performance optimization: Don't load transaction history in product listing
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

  // ============== SIZE MANAGEMENT METHODS ==============

  /**
   * Create a new product (advanced-only architecture)
   * All products now require sizes - no legacy single-size support
   * ENHANCED: Integrated with Cost Item Management System
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

    // Get category with type information
    const category = await this.getCategoryWithTypes(validatedData.categoryId)

    // Validate sizes based on category type
    if (validatedData.sizes && validatedData.sizes.length > 0) {
      await this.validateSizesForCategoryType(validatedData.sizes, category.type)
    }

    // Process sizes based on category type
    const processedSizes = validatedData.sizes
      ? this.processSizesByCategoryType(validatedData.sizes, category.type)
      : []

    // Calculate modal awal from cost items (replaces material cost calculation)
    // Support producer flow with modalAwal = 0
    let calculatedModalAwal = validatedData.modalAwal ?? 0 // Fallback to 0 for producer
    if (validatedData.selectedCosts && validatedData.selectedCosts.length > 0) {
      calculatedModalAwal = validatedData.selectedCosts.reduce((total, cost) => total + cost.amount, 0)
    }

    // Create product with sizes and cost items in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      try {
        // Create the product first
        const product = await tx.product.create({
          data: {
            code: validatedData.code,
            name: validatedData.name,
            description: validatedData.description,
            modalAwal: new Decimal(calculatedModalAwal), // Use calculated modal awal
            currentPrice: new Decimal(validatedData.currentPrice),
            categoryId: validatedData.categoryId,
            // Note: size field kept for backward compatibility with legacy systems
            size: validatedData.size,
            imageUrl: request.imageUrl || undefined,
            status: 'AVAILABLE',
            isActive: true,
            createdBy: this.userId,
          },
        })

        // Create sizes - REQUIRED for all products in advanced-only architecture
        if (processedSizes && processedSizes.length > 0) {
          await tx.productSize.createMany({
            data: processedSizes.map((size) => ({
              productId: product.id,
              ageCategory: size.ageCategory,
              size: size.size,
              quantity: size.quantity,
              // Enhanced ProductSize fields
              originalQuantity: size.originalQuantity || size.quantity,
              availableQuantity: size.availableQuantity || size.quantity,
              rentedQuantity: size.rentedQuantity || 0,
              isActive: size.isActive ?? true,
              createdBy: this.userId,
            })),
          })
        }

        // Create cost items if provided
        if (validatedData.selectedCosts && validatedData.selectedCosts.length > 0) {
          // Create cost items individually within the transaction
          for (const cost of validatedData.selectedCosts) {
            await tx.productCost.create({
              data: {
                productId: product.id,
                costItemId: cost.costItemId,
                amount: new Decimal(cost.amount),
                notes: cost.notes || undefined,
              },
            })
          }
        }

        return product
      } catch (error) {
        throw error
      }
    })

    // Fetch complete product with relationships
    return this.getProductById(result.id)
  }

  /**
   * Update an existing product (advanced-only architecture)
   * All products now support sizes - no legacy single-size support
   * FIXED: Preserves rental state and lost item tracking during quantity updates
   * ENHANCED: Integrated with Cost Item Management System with Producer/Owner Flow Support
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
        productCosts: {
          include: {
            costItem: true,
          },
        },
      },
    })

    if (!existingProduct) {
      throw new NotFoundError('Produk tidak ditemukan')
    }

    // Validate related entities if being updated
    let category: Category | undefined
    if (validatedData.categoryId && validatedData.categoryId !== existingProduct.categoryId) {
      category = await this.getCategoryWithTypes(validatedData.categoryId)
    } else {
      // Get existing category for size validation
      category = await this.getCategoryWithTypes(existingProduct.categoryId)
    }

    // Validate and process sizes if being updated
    let processedSizes: CreateProductSizeRequest[] | undefined
    if (validatedData.sizes !== undefined) {
      if (validatedData.sizes.length > 0) {
        // Validate sizes based on category type
        await this.validateSizesForCategoryType(validatedData.sizes, category!.type)
        // Process sizes based on category type
        processedSizes = this.processSizesByCategoryType(validatedData.sizes, category!.type)
      } else {
        // Empty array means remove all sizes
        processedSizes = []
      }
    }

    // Enhanced: Calculate modal awal with Producer/Owner flow logic
    let calculatedModalAwal = validatedData.modalAwal
    const currentModalAwal = Number(existingProduct.modalAwal)
    const hasExistingCosts = existingProduct.productCosts && existingProduct.productCosts.length > 0
    
    if (validatedData.selectedCosts && validatedData.selectedCosts.length > 0) {
      // OWNER FLOW: Calculate from cost items
      calculatedModalAwal = validatedData.selectedCosts.reduce((total, cost) => total + cost.amount, 0)
    } else if (validatedData.selectedCosts !== undefined && validatedData.selectedCosts.length === 0) {
      // Explicit removal of cost items - reset to producer flow
      calculatedModalAwal = 0
    } else if (calculatedModalAwal === undefined && currentModalAwal === 0 && !hasExistingCosts) {
      // Producer flow maintenance - keep modalAwal = 0
      calculatedModalAwal = 0
    }

    // Update product with sizes and cost items in transaction
    await this.prisma.$transaction(async (tx) => {
      try {
        // Update the product
        const updateData: Record<string, unknown> = {
          updatedAt: new Date(),
        }

      // Add fields with proper type conversion
      if (validatedData.name !== undefined) updateData.name = validatedData.name
      if (validatedData.description !== undefined)
        updateData.description = validatedData.description
      if (validatedData.categoryId !== undefined) updateData.categoryId = validatedData.categoryId
      if (validatedData.size !== undefined) updateData.size = validatedData.size

      if ('imageUrl' in request && request.imageUrl !== undefined) {
        updateData.imageUrl = request.imageUrl
      }

      if (calculatedModalAwal !== undefined) {
        updateData.modalAwal = new Decimal(calculatedModalAwal) // Use calculated modal awal
      } else if (validatedData.modalAwal !== undefined) {
        updateData.modalAwal = new Decimal(validatedData.modalAwal)
      }
      if (validatedData.currentPrice !== undefined) {
        updateData.currentPrice = new Decimal(validatedData.currentPrice)
      }

      await tx.product.update({
        where: { id: validatedId },
        data: updateData,
      })

      // Update cost items if provided
      if (validatedData.selectedCosts !== undefined) {
        // Remove existing cost items
        await tx.productCost.deleteMany({
          where: { productId: validatedId },
        })
        
        // Add new cost items
        if (validatedData.selectedCosts.length > 0) {
          for (const cost of validatedData.selectedCosts) {
            await tx.productCost.create({
              data: {
                productId: validatedId,
                costItemId: cost.costItemId,
                amount: new Decimal(cost.amount),
                notes: cost.notes || undefined,
              },
            })
          }
        }
      }

      // FIXED: Handle sizes update - PRESERVE RENTAL STATE
      if (processedSizes !== undefined) {
        // Get existing sizes with current rental state
        const existingSizes = await tx.productSize.findMany({
          where: { productId: validatedId },
          select: {
            id: true,
            ageCategory: true,
            size: true,
            rentedQuantity: true,
            lostQuantity: true,
          },
        })

        // Create a map for quick lookup
        const existingSizeMap = new Map(
          existingSizes.map(s => [`${s.ageCategory}-${s.size}`, s])
        )

        for (const newSize of processedSizes) {
          const key = `${newSize.ageCategory}-${newSize.size}`
          const existing = existingSizeMap.get(key)

          if (existing) {
            // UPDATE existing size - PRESERVE rental state
            const newOriginalQty = newSize.originalQuantity || newSize.quantity
            const currentRented = existing.rentedQuantity
            const currentLost = existing.lostQuantity || 0

            // Validate: new quantity must cover existing rentals + lost items
            if (newOriginalQty < currentRented + currentLost) {
              throw new ConflictError(
                `Cannot reduce quantity below rented (${currentRented}) + lost (${currentLost}) items for size ${newSize.ageCategory}-${newSize.size}`
              )
            }

            // Calculate new available quantity
            const newAvailable = newOriginalQty - currentRented - currentLost

            await tx.productSize.update({
              where: { id: existing.id },
              data: {
                quantity: newSize.quantity,
                originalQuantity: newOriginalQty,
                availableQuantity: newAvailable,
                // rentedQuantity: PRESERVED (not updated)
                // lostQuantity: PRESERVED (not updated)
                updatedAt: new Date(),
              },
            })

            // Remove from map (processed)
            existingSizeMap.delete(key)
          } else {
            // CREATE new size
            await tx.productSize.create({
              data: {
                productId: validatedId,
                ageCategory: newSize.ageCategory,
                size: newSize.size,
                quantity: newSize.quantity,
                originalQuantity: newSize.originalQuantity || newSize.quantity,
                availableQuantity: newSize.availableQuantity || newSize.quantity,
                rentedQuantity: 0,
                lostQuantity: 0,
                isActive: true,
                createdBy: this.userId,
              },
            })
          }
        }

        // Soft-delete sizes that were removed (if any remain in map)
        const sizesToDelete = Array.from(existingSizeMap.values())
        for (const size of sizesToDelete) {
          // Validate: cannot delete size with active rentals or lost items
          if (size.rentedQuantity > 0 || (size.lostQuantity && size.lostQuantity > 0)) {
            throw new ConflictError(
              `Cannot remove size ${size.ageCategory}-${size.size} with active rentals (${size.rentedQuantity}) or lost items (${size.lostQuantity || 0})`
            )
          }

          await tx.productSize.update({
            where: { id: size.id },
            data: { isActive: false },
          })
        }
      }
      } catch (error) {
        throw error
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
        // Enhanced ProductSize fields
        originalQuantity: size.originalQuantity ?? size.quantity,
        availableQuantity: size.availableQuantity ?? size.quantity,
        rentedQuantity: size.rentedQuantity ?? 0,
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
              // Enhanced ProductSize fields
              originalQuantity: size.originalQuantity ?? size.quantity,
              availableQuantity: size.availableQuantity ?? size.quantity,
              rentedQuantity: size.rentedQuantity ?? 0,
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
              // Enhanced ProductSize fields
              originalQuantity: size.originalQuantity ?? size.quantity,
              availableQuantity: size.availableQuantity ?? size.quantity,
              rentedQuantity: size.rentedQuantity ?? 0,
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
        quantity: size.quantity, // Legacy field
        // Enhanced ProductSize fields
        originalQuantity: size.originalQuantity || size.quantity || 0,
        rentedQuantity: size.rentedQuantity || 0,
        availableQuantity: size.availableQuantity || (size.originalQuantity || size.quantity || 0) - (size.rentedQuantity || 0),
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

  /**
   * Get product costs for a specific product
   */
  async getProductCosts(productId: string): Promise<Array<{
    costItemId: string
    amount: number
    notes?: string
    costItem: {
      id: string
      name: string
    }
  }>> {
    const { id: validatedId } = productParamsSchema.parse({ id: productId })

    // Validate product exists
    await this.getProductById(validatedId)

    const productCostService = this.getProductCostService()
    const costs = await productCostService.getProductCosts(validatedId)
    
    // Transform to the expected format
    return costs.map(cost => ({
      costItemId: cost.costItemId,
      amount: cost.amount,
      notes: cost.notes,
      costItem: {
        id: cost.costItem?.id || cost.costItemId,
        name: cost.costItem?.name || 'Unknown Cost Item',
      }
    }))
  }

  /**
   * Update product costs
   */
  async updateProductCosts(
    productId: string,
    costs: Array<{ costItemId: string; amount: number; notes?: string }>
  ): Promise<void> {
    const { id: validatedId } = productParamsSchema.parse({ id: productId })

    // Validate product exists
    await this.getProductById(validatedId)

    const productCostService = this.getProductCostService()
    await productCostService.replaceProductCosts(validatedId, costs)
  }

  /**
   * Calculate modal awal from product costs
   */
  async calculateProductModalAwal(productId: string): Promise<number> {
    const { id: validatedId } = productParamsSchema.parse({ id: productId })

    const productCostService = this.getProductCostService()
    return productCostService.calculateModalAwal(validatedId)
  }

  // ============== HELPER METHODS ==============

  /**
   * Validate that product update is safe regarding active rentals
   */
  private async validateProductUpdateSafety(productId: string): Promise<{
    hasActiveRentals: boolean
    hasLostItems: boolean
    rentalSummary: Array<{ ageCategory: string; size: string; rentedQuantity: number; lostQuantity: number }>
  }> {
    const sizesWithRentals = await this.prisma.productSize.findMany({
      where: {
        productId,
        OR: [
          { rentedQuantity: { gt: 0 } },
          { lostQuantity: { gt: 0 } },
        ],
      },
      select: {
        ageCategory: true,
        size: true,
        rentedQuantity: true,
        lostQuantity: true,
      },
    })

    return {
      hasActiveRentals: sizesWithRentals.some(s => s.rentedQuantity > 0),
      hasLostItems: sizesWithRentals.some(s => (s.lostQuantity || 0) > 0),
      rentalSummary: sizesWithRentals.map(s => ({
        ageCategory: s.ageCategory,
        size: s.size,
        rentedQuantity: s.rentedQuantity,
        lostQuantity: s.lostQuantity || 0,
      })),
    }
  }

  /**
   * Validate inventory consistency after update
   */
  private async validateInventoryConsistency(productId: string): Promise<{
    isConsistent: boolean
    errors: string[]
  }> {
    const sizes = await this.prisma.productSize.findMany({
      where: { productId, isActive: true },
      select: {
        id: true,
        ageCategory: true,
        size: true,
        originalQuantity: true,
        rentedQuantity: true,
        lostQuantity: true,
        availableQuantity: true,
      },
    })

    const errors: string[] = []

    for (const size of sizes) {
      const expectedAvailable = size.originalQuantity - size.rentedQuantity - (size.lostQuantity || 0)
      
      // Check inventory invariant
      if (size.originalQuantity < size.rentedQuantity + (size.lostQuantity || 0)) {
        errors.push(
          `Size ${size.ageCategory}-${size.size}: originalQuantity (${size.originalQuantity}) < rentedQuantity (${size.rentedQuantity}) + lostQuantity (${size.lostQuantity || 0})`
        )
      }

      // Check available quantity calculation
      if (size.availableQuantity !== expectedAvailable) {
        errors.push(
          `Size ${size.ageCategory}-${size.size}: availableQuantity (${size.availableQuantity}) should be ${expectedAvailable}`
        )
      }
    }

    return {
      isConsistent: errors.length === 0,
      errors,
    }
  }

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
   * Helper method to get category with type information
   * Enhanced version of validateCategoryExists() that returns category object
   */
  private async getCategoryWithTypes(categoryId: string): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      throw new NotFoundError(`Category dengan ID ${categoryId} tidak ditemukan`)
    }

    return this.convertPrismaCategoryToCategory(category)
  }

  /**
   * Convert Prisma category result to application Category type
   * Duplicated from CategoryService for internal use
   */
  private convertPrismaCategoryToCategory(prismaCategory: Record<string, unknown>): Category {
    return {
      id: prismaCategory.id as string,
      name: prismaCategory.name as string,
      color: prismaCategory.color as string,
      type: prismaCategory.type as CategoryType,
      products: [], // Avoid circular reference - empty array for ProductService use
      createdAt: prismaCategory.createdAt as Date,
      updatedAt: prismaCategory.updatedAt as Date,
      createdBy: prismaCategory.createdBy as string,
    }
  }

  /**
   * Validate sizes based on category type requirements
   */
  private async validateSizesForCategoryType(
    sizes: CreateProductSizeRequest[],
    categoryType: CategoryType
  ): Promise<void> {
    if (!sizes || sizes.length === 0) {
      throw new Error('Minimal satu ukuran harus ditambahkan')
    }

    switch (categoryType) {
      case 'accessories_age_based':
        this.validateAgeBasedSizes(sizes)
        break
      case 'accessories_universal':
        this.validateUniversalSizes(sizes)
        break
      case 'clothing':
        this.validateClothingSizes(sizes)
        break
      default:
        // Fallback to clothing validation for unknown types
        this.validateClothingSizes(sizes)
        break
    }
  }

  /**
   * Validate accessories with age-based sizing (Dewasa/Anak)
   * Expected pattern: ADULT/CHILD age categories with quantities
   */
  private validateAgeBasedSizes(sizes: CreateProductSizeRequest[]): void {
    const ageCategories = new Set(sizes.map(s => s.ageCategory))

    // Check for required age categories
    if (ageCategories.size === 0) {
      throw new Error('Aksesoris age-based harus memiliki kategori umur (Dewasa/Anak)')
    }

    // Validate each size entry
    for (const size of sizes) {
      if (size.quantity <= 0) {
        throw new Error(`Kuantitas untuk ${size.ageCategory} harus lebih dari 0`)
      }

      // For age-based accessories, size should be UNIVERSAL or standard sizes
      if (size.size && !['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(size.size)) {
        // Allow custom sizes but log warning
        console.warn(`Custom size "${size.size}" detected for age-based accessories`)
      }
    }
  }

  /**
   * Validate accessories with universal sizing
   * Expected pattern: Single quantity or UNIVERSAL age category
   */
  private validateUniversalSizes(sizes: CreateProductSizeRequest[]): void {
    if (sizes.length > 1) {
      throw new Error('Aksesoris universal seharusnya hanya memiliki satu jenis ukuran')
    }

    const size = sizes[0]

    // Universal accessories should use UNIVERSAL age category
    if (size.ageCategory !== 'UNIVERSAL') {
      throw new Error('Aksesoris universal harus menggunakan kategori umur UNIVERSAL')
    }

    if (size.quantity <= 0) {
      throw new Error('Kuantitas aksesoris universal harus lebih dari 0')
    }
  }

  /**
   * Validate clothing with standard sizing
   * Expected pattern: Multiple sizes (S, M, L, XL, etc.) with ADULT age category
   */
  private validateClothingSizes(sizes: CreateProductSizeRequest[]): void {
    const validSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'UNIVERSAL']

    for (const size of sizes) {
      // Validate size enum
      if (!validSizes.includes(size.size)) {
        throw new Error(`Ukuran "${size.size}" tidak valid. Gunakan: ${validSizes.join(', ')}`)
      }

      // Validate age category (should be ADULT for clothing, but allow CHILD for kids clothing)
      if (!['ADULT', 'CHILD'].includes(size.ageCategory)) {
        throw new Error(`Kategori umur "${size.ageCategory}" tidak valid untuk pakaian`)
      }

      // Validate quantity
      if (size.quantity <= 0) {
        throw new Error(`Kuantitas untuk ukuran ${size.size} harus lebih dari 0`)
      }
    }

    // Check for duplicate sizes within same age category
    const combinations = sizes.map(s => `${s.ageCategory}-${s.size}`)
    const uniqueCombinations = new Set(combinations)
    if (combinations.length !== uniqueCombinations.size) {
      throw new Error('Tidak boleh ada ukuran duplikat dalam kategori umur yang sama')
    }
  }

  /**
   * Process sizes based on category type requirements
   * Transforms and optimizes size data for storage
   */
  private processSizesByCategoryType(
    sizes: CreateProductSizeRequest[],
    categoryType: CategoryType
  ): CreateProductSizeRequest[] {
    switch (categoryType) {
      case 'accessories_age_based':
        return this.processAgeBasedSizes(sizes)
      case 'accessories_universal':
        return this.processUniversalSizes(sizes)
      case 'clothing':
        return this.processClothingSizes(sizes)
      default:
        // Fallback to standard processing for unknown types
        return this.processClothingSizes(sizes)
    }
  }

  /**
   * Process age-based accessories sizes
   * Optimizes for ADULT/CHILD categories
   */
  private processAgeBasedSizes(sizes: CreateProductSizeRequest[]): CreateProductSizeRequest[] {
    return sizes.map(size => ({
      ...size,
      // Ensure size is standardized for age-based accessories
      size: (size.size as SizeEnum) || ('UNIVERSAL' as const),
      isActive: size.isActive ?? true,
      // Enhanced ProductSize fields for new products
      originalQuantity: size.originalQuantity || size.quantity || 0,
      availableQuantity: size.availableQuantity || size.quantity || 0,
      rentedQuantity: size.rentedQuantity || 0,
      lostQuantity: size.lostQuantity || 0,
    }))
  }

  /**
   * Process universal accessories sizes
   * Ensures single UNIVERSAL entry
   */
  private processUniversalSizes(sizes: CreateProductSizeRequest[]): CreateProductSizeRequest[] {
    if (sizes.length === 0) {
      throw new Error('Universal accessories must have at least one size entry')
    }

    // If multiple sizes provided, sum them into one UNIVERSAL entry
    const totalQuantity = sizes.reduce((sum, size) => sum + size.quantity, 0)
    const totalOriginalQuantity = sizes.reduce((sum, size) => sum + (size.originalQuantity || size.quantity), 0)

    return [{
      ageCategory: 'UNIVERSAL' as const,
      size: 'UNIVERSAL' as const,
      quantity: totalQuantity,
      isActive: true,
      // Enhanced ProductSize fields for new products
      originalQuantity: totalOriginalQuantity,
      availableQuantity: totalOriginalQuantity,
      rentedQuantity: 0,
      lostQuantity: 0,
    }]
  }

  /**
   * Process clothing sizes
   * Maintains standard size structure
   */
  private processClothingSizes(sizes: CreateProductSizeRequest[]): CreateProductSizeRequest[] {
    return sizes.map(size => ({
      ...size,
      // Enhanced ProductSize fields for new products
      originalQuantity: size.originalQuantity || size.quantity || 0,
      availableQuantity: size.availableQuantity || size.quantity || 0,
      rentedQuantity: size.rentedQuantity || 0,
      lostQuantity: size.lostQuantity || 0,
      isActive: size.isActive ?? true,
      // Ensure size is uppercase for consistency
      size: size.size.toUpperCase() as SizeEnum,
    }))
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
      quantity: prismaSize.quantity as number, // Legacy field
      // Enhanced ProductSize fields
      originalQuantity: (prismaSize.originalQuantity as number) || 0,
      rentedQuantity: (prismaSize.rentedQuantity as number) || 0,
      lostQuantity: (prismaSize.lostQuantity as number) || 0,
      availableQuantity: (prismaSize.availableQuantity as number) || 0,
      isActive: prismaSize.isActive as boolean,
      createdAt: prismaSize.createdAt as Date,
      updatedAt: prismaSize.updatedAt as Date,
      createdBy: prismaSize.createdBy as string,
      product: this.convertPrismaProductToProduct(prismaSize.product as Record<string, unknown>),
    }
  }

  /**
   * Calculate total revenue from transaction items - REMOVED
   * Performance optimization: moved to separate endpoint
   * Use dedicated revenue calculation endpoint for detail views
   */

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
      category: prismaProduct.category
        ? {
            id: (prismaProduct.category as Record<string, unknown>).id as string,
            name: (prismaProduct.category as Record<string, unknown>).name as string,
            color: (prismaProduct.category as Record<string, unknown>).color as string,
            type: (prismaProduct.category as Record<string, unknown>).type as CategoryType,
            products: [], // Avoid circular reference in conversion
            createdAt: (prismaProduct.category as Record<string, unknown>).createdAt as Date,
            updatedAt: (prismaProduct.category as Record<string, unknown>).updatedAt as Date,
            createdBy: (prismaProduct.category as Record<string, unknown>).createdBy as string,
          }
        : ({} as Category),
      modalAwal: prismaProduct.modalAwal as Decimal,
      currentPrice: prismaProduct.currentPrice as Decimal, // ✅ Fixed: return currentPrice instead of hargaSewa
      // Simplified cost items for display (only name and amount)
      simplifiedCosts: (prismaProduct.productCosts as Array<Record<string, unknown>>)?.map((cost) => ({
        name: (cost.costItem as Record<string, unknown>)?.name as string || 'Unknown',
        amount: Number(cost.amount as Decimal),
      })) || [],
      status: prismaProduct.status as ProductStatus,
      imageUrl: prismaProduct.imageUrl as string | undefined,
      // totalPendapatan removed - performance optimization
      // Revenue calculation moved to separate endpoint for detail view
      sizes:
        (prismaProduct.sizes as Array<Record<string, unknown>>)?.map((size) => ({
          id: size.id as string,
          productId: size.productId as string,
          ageCategory: size.ageCategory as AgeCategory,
          size: size.size as SizeEnum,
          quantity: size.quantity as number, // Legacy field - keep for backward compatibility
          // Enhanced ProductSize fields
          originalQuantity: (size.originalQuantity as number) || 0,
          rentedQuantity: (size.rentedQuantity as number) || 0,
          lostQuantity: (size.lostQuantity as number) || 0,
          availableQuantity: (size.availableQuantity as number) || 0,
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
