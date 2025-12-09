/**
 * ProductSizeAggregationService - Size Aggregation Business Logic
 * Provides aggregated size views while preserving detailed business logic
 *
 * Core Purpose: Transform detailed ProductSize records into aggregated display data
 * Business Intelligence: Preserve detailed tracking for rental, analytics, inventory
 *
 * Examples:
 * - Input: [{ ageCategory: 'ADULT', size: 'M', quantity: 2 }, { ageCategory: 'CHILD', size: 'M', quantity: 3 }]
 * - Output: [{ size: 'M', totalQuantity: 5, breakdown: { adult: 2, child: 3 }, hasMultipleCategories: true }]
 */

import { PrismaClient } from '@prisma/client'
import { inventoryService } from '@/features/kasir/services/inventoryService'
import type {
  Product,
  ProductSize,
  AggregatedSizeView,
  ProductSizeAggregation,
  CategoryBreakdown,
  AggregationConfig,
  AggregationServiceResponse,
  SizeEnum,
  AgeCategory,
} from '../types'

/**
 * In-memory cache for aggregation results
 * Simple caching strategy for performance optimization
 */
interface CacheEntry<T> {
  data: T
  calculatedAt: Date
  expiryAt: Date
}

/**
 * Enhanced cache entry with performance monitoring
 */
interface AdvancedCacheEntry<T> {
  data: T
  calculatedAt: Date
  expiryAt: Date
  accessCount: number
  lastAccessed: Date
  performance: PerformanceMetrics
}

/**
 * Performance metrics for monitoring aggregation performance
 */
interface PerformanceMetrics {
  calculationTimeMs: number
  cacheHitRatio: number
  memoryUsageMB: number
  complexity: 'low' | 'medium' | 'high'
}

/**
 * Enhanced aggregation configuration with advanced options
 */
interface AdvancedAggregationConfig {
  enableCaching: boolean
  cacheExpiryMinutes: number
  includeBreakdown: boolean
  includeRentalTracking: boolean
  performanceThresholdMs: number
  maxCacheSize: number
}

export class ProductSizeAggregationService {
  private cache = new Map<string, CacheEntry<unknown>>()
  private advancedCache = new Map<string, AdvancedCacheEntry<unknown>>()
  private config: AggregationConfig
  private advancedConfig: AdvancedAggregationConfig
  private performanceHistory: PerformanceMetrics[] = []

  constructor(
    private readonly prisma: PrismaClient,
    config?: Partial<AggregationConfig>,
    advancedConfig?: Partial<AdvancedAggregationConfig>,
  ) {
    this.config = {
      enableCaching: true,
      cacheExpiryMinutes: 15,
      includeBreakdown: true,
      ...config,
    }

    this.advancedConfig = {
      enableCaching: true,
      cacheExpiryMinutes: 10,
      includeBreakdown: true,
      includeRentalTracking: true,
      performanceThresholdMs: 50,
      maxCacheSize: 1000,
      ...advancedConfig,
    }
  }

  // ============== CORE AGGREGATION METHODS ==============

  /**
   * Get aggregated size views for a product
   * Main method for UI consumption - returns size-first aggregated data
   */
  async getAggregatedSizes(
    productId: string,
    optionsOrIncludeBreakdown: boolean | { includeBreakdown?: boolean; includeRentalTracking?: boolean; forceRefresh?: boolean } = true,
  ): Promise<AggregationServiceResponse<AggregatedSizeView[]>> {
    // Handle both legacy boolean parameter and new options object
    let includeBreakdown: boolean
    let includeRentalTracking: boolean | undefined
    let forceRefresh: boolean | undefined

    if (typeof optionsOrIncludeBreakdown === 'boolean') {
      // Legacy: backward compatibility
      includeBreakdown = optionsOrIncludeBreakdown
    } else {
      // New: options object
      includeBreakdown = optionsOrIncludeBreakdown.includeBreakdown ?? true
      includeRentalTracking = optionsOrIncludeBreakdown.includeRentalTracking
      forceRefresh = optionsOrIncludeBreakdown.forceRefresh
    }
    const startTime = Date.now()
    const cacheKey = `aggregated_sizes_${productId}_${includeBreakdown}_${includeRentalTracking ?? false}_${forceRefresh ?? false}`

    // Check cache first
    if (this.config.enableCaching && !forceRefresh) {
      const cached = this.getFromCache<AggregatedSizeView[]>(cacheKey)
      if (cached) {
        return {
          data: cached,
          metadata: {
            calculatedAt: new Date(),
            fromCache: true,
            calculationTimeMs: Date.now() - startTime,
          },
        }
      }
    }

    // Fetch detailed size data
    const productSizes = await this.getProductSizes(productId)

    // Transform to aggregated view
    const aggregatedSizes = this.aggregateSizesBySize(productSizes, includeBreakdown)

    // Cache result (only if not force refresh)
    if (this.config.enableCaching && !forceRefresh) {
      this.setCache(cacheKey, aggregatedSizes)
    }

    return {
      data: aggregatedSizes,
      metadata: {
        calculatedAt: new Date(),
        fromCache: false,
        calculationTimeMs: Date.now() - startTime,
      },
    }
  }

  /**
   * Get total quantity across all sizes and age categories
   */
  async getTotalQuantity(productId: string): Promise<number> {
    const cacheKey = `total_quantity_${productId}`

    if (this.config.enableCaching) {
      const cached = this.getFromCache<number>(cacheKey)
      if (cached !== null) return cached
    }

    const productSizes = await this.getProductSizes(productId)
    const total = productSizes.reduce((sum, size) => sum + size.quantity, 0)

    if (this.config.enableCaching) {
      this.setCache(cacheKey, total)
    }

    return total
  }

  /**
   * Get breakdown for a specific size across age categories
   */
  async getSizeBreakdown(productId: string, size: SizeEnum): Promise<CategoryBreakdown> {
    const cacheKey = `size_breakdown_${productId}_${size}`

    if (this.config.enableCaching) {
      const cached = this.getFromCache<CategoryBreakdown>(cacheKey)
      if (cached) return cached
    }

    const productSizes = await this.getProductSizes(productId)
    const sizeSpecificData = productSizes.filter((ps) => ps.size === size)

    const breakdown: CategoryBreakdown = {
      adult: 0,
      child: 0,
      universal: 0,
      total: 0,
    }

    sizeSpecificData.forEach((ps) => {
      switch (ps.ageCategory) {
        case 'ADULT':
          breakdown.adult += ps.quantity
          break
        case 'CHILD':
          breakdown.child += ps.quantity
          break
        case 'UNIVERSAL':
          breakdown.universal += ps.quantity
          break
      }
      breakdown.total += ps.quantity
    })

    if (this.config.enableCaching) {
      this.setCache(cacheKey, breakdown)
    }

    return breakdown
  }

  /**
   * Get complete aggregation data for a product
   */
  async getProductAggregation(productId: string): Promise<ProductSizeAggregation> {
    const startTime = Date.now()
    const cacheKey = `product_aggregation_${productId}`

    if (this.config.enableCaching) {
      const cached = this.getFromCache<ProductSizeAggregation>(cacheKey)
      if (cached) return cached
    }

    const productSizes = await this.getProductSizes(productId)
    const aggregatedSizes = this.aggregateSizesBySize(productSizes, true)
    const totalQuantity = productSizes.reduce((sum, size) => sum + size.quantity, 0)
    const categoryBreakdown = this.calculateCategoryBreakdown(productSizes)

    const aggregation: ProductSizeAggregation = {
      productId,
      totalQuantity,
      aggregatedSizes,
      hasAdvancedSizing: productSizes.length > 0,
      categoryBreakdown,
      lastCalculated: new Date(),
    }

    if (this.config.enableCaching) {
      this.setCache(cacheKey, aggregation)
    }

    // Log performance if calculation took more than 50ms
    const calculationTime = Date.now() - startTime
    if (calculationTime > 50) {
      console.warn(`Slow aggregation calculation for product ${productId}: ${calculationTime}ms`)
    }

    return aggregation
  }

  // ============== AGGREGATION LOGIC HELPERS ==============

  /**
   * Core aggregation algorithm: Group by size, sum quantities across age categories
   */
  private aggregateSizesBySize(
    productSizes: ProductSize[],
    includeBreakdown: boolean,
  ): AggregatedSizeView[] {
    const sizeMap = new Map<
      SizeEnum,
      {
        totalQuantity: number
        breakdown: { adult: number; child: number; universal: number }
        categories: Set<AgeCategory>
      }
    >()

    // Group and sum by size
    productSizes.forEach((ps) => {
      if (!sizeMap.has(ps.size)) {
        sizeMap.set(ps.size, {
          totalQuantity: 0,
          breakdown: { adult: 0, child: 0, universal: 0 },
          categories: new Set(),
        })
      }

      const entry = sizeMap.get(ps.size)!
      entry.totalQuantity += ps.quantity
      entry.categories.add(ps.ageCategory)

      // Update breakdown
      switch (ps.ageCategory) {
        case 'ADULT':
          entry.breakdown.adult += ps.quantity
          break
        case 'CHILD':
          entry.breakdown.child += ps.quantity
          break
        case 'UNIVERSAL':
          entry.breakdown.universal += ps.quantity
          break
      }
    })

    // Convert to AggregatedSizeView array
    return Array.from(sizeMap.entries())
      .map(([size, data]) => ({
        size,
        totalQuantity: data.totalQuantity,
        breakdown: includeBreakdown
          ? {
              ...(data.breakdown.adult > 0 && { adult: data.breakdown.adult }),
              ...(data.breakdown.child > 0 && { child: data.breakdown.child }),
              ...(data.breakdown.universal > 0 && { universal: data.breakdown.universal }),
            }
          : {},
        hasMultipleCategories: data.categories.size > 1,
      }))
      .sort((a, b) => {
        // Sort by size order: XS, S, M, L, XL, XXL
        const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
        return sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size)
      })
  }

  /**
   * Calculate category breakdown totals
   */
  private calculateCategoryBreakdown(productSizes: ProductSize[]): CategoryBreakdown {
    const breakdown: CategoryBreakdown = {
      adult: 0,
      child: 0,
      universal: 0,
      total: 0,
    }

    productSizes.forEach((ps) => {
      switch (ps.ageCategory) {
        case 'ADULT':
          breakdown.adult += ps.quantity
          break
        case 'CHILD':
          breakdown.child += ps.quantity
          break
        case 'UNIVERSAL':
          breakdown.universal += ps.quantity
          break
      }
      breakdown.total += ps.quantity
    })

    return breakdown
  }

  // ============== DATA ACCESS HELPERS ==============

  /**
   * Fetch ProductSize records for a product with Enhanced ProductSize fields
   */
  private async getProductSizes(productId: string): Promise<ProductSize[]> {
    const productSizes = await this.prisma.productSize.findMany({
      where: {
        productId,
        isActive: true,
      },
      orderBy: [{ ageCategory: 'asc' }, { size: 'asc' }],
      include: {
        product: {
          include: {
            category: true,
            material: true,
          },
        },
      },
    })

    return productSizes.map((size) => ({
      id: size.id,
      productId: size.productId,
      ageCategory: size.ageCategory as AgeCategory,
      size: size.size as SizeEnum,
      // ENHANCED: Use Enhanced ProductSize fields
      quantity: size.originalQuantity || 0, // Legacy field for backward compatibility
      originalQuantity: size.originalQuantity || 0,
      availableQuantity: size.availableQuantity || 0,
      rentedQuantity: size.rentedQuantity || 0,
      isActive: size.isActive,
      createdAt: size.createdAt,
      updatedAt: size.updatedAt,
      createdBy: size.createdBy,
      product: {
        ...size.product,
        modalAwal: size.product.modalAwal,
        currentPrice: size.product.currentPrice,
        totalPendapatan: 0, // Calculated field - not available in this context
        category: {
          ...size.product.category,
          products: [], // Required by Category type but not needed in this context
        },
        material: size.product.material
          ? {
              ...size.product.material,
              products: [], // Required by Material type but not needed in this context
            }
          : undefined,
        sizes: [],
      } as unknown as Product,
    }))
  }

  /**
   * Get comprehensive inventory data for a product using InventoryService
   * NEW METHOD: Integrates with Enhanced ProductSize schema
   * Lost Item Management (Task 1): Added lostQuantity field to sizeDetails
   */
  async getComprehensiveInventory(productId: string): Promise<
    ProductSizeAggregation & {
      inventoryStatus: {
        totalOriginal: number
        totalAvailable: number
        totalRented: number
        totalLost: number  // ✅ Lost Item Management
        utilizationRate: number
        isHealthy: boolean
      }
      sizeDetails: Array<{
        id: string
        ageCategory: AgeCategory
        size: SizeEnum
        originalQuantity: number
        availableQuantity: number
        rentedQuantity: number
        lostQuantity: number  // ✅ Lost Item Management
        utilizationRate: number
        isAvailable: boolean
      }>
    }
  > {
    // Get base aggregation
    const baseAggregation = await this.getProductAggregation(productId)

    // Get detailed inventory status using InventoryService
    const productStockStatus = await inventoryService.getProductStockStatus(productId)

    // ✅ Lost Item Management: Calculate total lost quantity
    const totalLost = productStockStatus.sizes.reduce((sum, size) => sum + (size.lostQuantity || 0), 0)

    // Enhanced inventory analysis
    const inventoryStatus = {
      totalOriginal: productStockStatus.totalQuantity,
      totalAvailable: productStockStatus.availableQuantity,
      totalRented: productStockStatus.rentedQuantity,
      totalLost,  // ✅ Lost Item Management
      utilizationRate:
        productStockStatus.totalQuantity > 0
          ? (productStockStatus.rentedQuantity / productStockStatus.totalQuantity) * 100
          : 0,
      isHealthy: productStockStatus.availableQuantity > 0 || productStockStatus.totalQuantity === 0,
    }

    // Enhanced size details with real-time data
    // ✅ Lost Item Management: Added lostQuantity field
    const sizeDetails = productStockStatus.sizes.map((size) => ({
      id: size.id,
      ageCategory: size.ageCategory as AgeCategory,
      size: size.size as SizeEnum,
      originalQuantity: size.originalQuantity,
      availableQuantity: size.availableQuantity,
      rentedQuantity: size.rentedQuantity,
      lostQuantity: size.lostQuantity || 0,  // ✅ Lost Item Management
      utilizationRate:
        size.originalQuantity > 0 ? (size.rentedQuantity / size.originalQuantity) * 100 : 0,
      isAvailable: size.isAvailable,
    }))

    return {
      ...baseAggregation,
      // Override totalQuantity with Enhanced ProductSize data
      totalQuantity: productStockStatus.totalQuantity,
      inventoryStatus,
      sizeDetails,
      // Enhanced calculation time
      lastCalculated: new Date(),
    }
  }

  // ============== CACHE MANAGEMENT ==============

  /**
   * Get data from cache if valid
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (new Date() > entry.expiryAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set data in cache with expiry
   */
  private setCache<T>(key: string, data: T): void {
    const now = new Date()
    const expiryAt = new Date(now.getTime() + this.config.cacheExpiryMinutes * 60 * 1000)

    this.cache.set(key, {
      data,
      calculatedAt: now,
      expiryAt,
    })
  }

  /**
   * Clear cache for a specific product
   */
  public clearProductCache(productId: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter((key) => key.includes(productId))

    keysToDelete.forEach((key) => this.cache.delete(key))
  }

  /**
   * Clear all cache
   */
  public clearAllCache(): void {
    this.cache.clear()
  }

  // ============== BUSINESS LOGIC PRESERVATION & VALIDATION ==============

  /**
   * Validate aggregated data matches detailed data (consistency check)
   */
  async validateAggregationConsistency(productId: string): Promise<{
    isConsistent: boolean
    errors: string[]
    detailedTotal: number
    aggregatedTotal: number
  }> {
    const errors: string[] = []

    // Get detailed data
    const productSizes = await this.getProductSizes(productId)
    const detailedTotal = productSizes.reduce((sum, size) => sum + size.quantity, 0)

    // Get aggregated data
    const aggregatedData = await this.getAggregatedSizes(productId, true)
    const aggregatedTotal = aggregatedData.data.reduce((sum, size) => sum + size.totalQuantity, 0)

    // Validate totals match
    if (detailedTotal !== aggregatedTotal) {
      errors.push(
        `Total quantity mismatch: detailed=${detailedTotal}, aggregated=${aggregatedTotal}`,
      )
    }

    // Validate size-by-size consistency
    for (const aggregatedSize of aggregatedData.data) {
      const detailedForSize = productSizes.filter((ps) => ps.size === aggregatedSize.size)
      const detailedSizeTotal = detailedForSize.reduce((sum, ps) => sum + ps.quantity, 0)

      if (detailedSizeTotal !== aggregatedSize.totalQuantity) {
        errors.push(
          `Size ${aggregatedSize.size} mismatch: detailed=${detailedSizeTotal}, aggregated=${aggregatedSize.totalQuantity}`,
        )
      }

      // Validate breakdown consistency
      if (aggregatedSize.breakdown) {
        const breakdownTotal = Object.values(aggregatedSize.breakdown).reduce(
          (sum, qty) => sum + (qty || 0),
          0,
        )
        if (breakdownTotal !== aggregatedSize.totalQuantity) {
          errors.push(
            `Size ${aggregatedSize.size} breakdown inconsistent: breakdown=${breakdownTotal}, total=${aggregatedSize.totalQuantity}`,
          )
        }
      }
    }

    return {
      isConsistent: errors.length === 0,
      errors,
      detailedTotal,
      aggregatedTotal,
    }
  }

  /**
   * Validate rental tracking capabilities (business logic preservation)
   */
  async validateRentalTrackingCapabilities(productId: string): Promise<{
    canTrackByAgeCategory: boolean
    canTrackBySpecificSize: boolean
    availableForRental: {
      adult: { [size: string]: number }
      child: { [size: string]: number }
      universal: { [size: string]: number }
    }
    businessCapabilities: string[]
  }> {
    const productSizes = await this.getProductSizes(productId)
    const businessCapabilities: string[] = []

    // Check age category tracking
    const ageCategories = new Set(productSizes.map((ps) => ps.ageCategory))
    const canTrackByAgeCategory = ageCategories.size > 0

    if (canTrackByAgeCategory) {
      businessCapabilities.push('Age-specific rental tracking')
      businessCapabilities.push('Category-based inventory management')
    }

    // Check size-specific tracking
    const sizes = new Set(productSizes.map((ps) => ps.size))
    const canTrackBySpecificSize = sizes.size > 0

    if (canTrackBySpecificSize) {
      businessCapabilities.push('Size-specific availability')
      businessCapabilities.push('Granular inventory control')
    }

    // Build availability matrix for rental operations
    const availableForRental = {
      adult: {} as { [size: string]: number },
      child: {} as { [size: string]: number },
      universal: {} as { [size: string]: number },
    }

    productSizes.forEach((ps) => {
      const categoryKey = ps.ageCategory.toLowerCase() as keyof typeof availableForRental
      availableForRental[categoryKey][ps.size] = ps.quantity
    })

    // Add business capabilities based on data structure
    const hasAdult = productSizes.some((ps) => ps.ageCategory === 'ADULT')
    const hasChild = productSizes.some((ps) => ps.ageCategory === 'CHILD')
    if (hasAdult && hasChild) {
      businessCapabilities.push('Multi-generational rental support')
    }

    if (productSizes.length > 5) {
      businessCapabilities.push('Complex inventory management')
    }

    return {
      canTrackByAgeCategory,
      canTrackBySpecificSize,
      availableForRental,
      businessCapabilities,
    }
  }

  /**
   * Validate analytics access capabilities (business intelligence preservation)
   */
  async validateAnalyticsCapabilities(productId: string): Promise<{
    canGenerateReports: boolean
    availableMetrics: string[]
    analyticsBreakdown: {
      totalItems: number
      uniqueSizes: number
      ageCategories: number
      complexityScore: number
    }
    businessInsights: string[]
  }> {
    const productSizes = await this.getProductSizes(productId)
    const availableMetrics: string[] = []
    const businessInsights: string[] = []

    // Calculate analytics breakdown
    const totalItems = productSizes.reduce((sum, ps) => sum + ps.quantity, 0)
    const uniqueSizes = new Set(productSizes.map((ps) => ps.size)).size
    const ageCategories = new Set(productSizes.map((ps) => ps.ageCategory)).size
    const complexityScore = uniqueSizes * ageCategories

    // Determine available metrics
    if (totalItems > 0) {
      availableMetrics.push('Total inventory count')
      availableMetrics.push('Size distribution analysis')
    }

    if (ageCategories > 1) {
      availableMetrics.push('Age category performance')
      availableMetrics.push('Demographic usage patterns')
      businessInsights.push('Multi-demographic product appeal')
    }

    if (uniqueSizes > 3) {
      availableMetrics.push('Size popularity trends')
      availableMetrics.push('Inventory optimization recommendations')
      businessInsights.push('Diverse size portfolio')
    }

    if (complexityScore > 6) {
      availableMetrics.push('Cross-category correlation analysis')
      businessInsights.push('Complex inventory requiring strategic management')
    }

    // Business intelligence capabilities
    const sizeCoverage = uniqueSizes / 6 // Assuming 6 standard sizes
    if (sizeCoverage > 0.5) {
      businessInsights.push('Good size coverage for market demand')
    }

    if (productSizes.some((ps) => ps.quantity > 10)) {
      businessInsights.push('High-volume product suitable for events')
    }

    return {
      canGenerateReports: availableMetrics.length > 0,
      availableMetrics,
      analyticsBreakdown: {
        totalItems,
        uniqueSizes,
        ageCategories,
        complexityScore,
      },
      businessInsights,
    }
  }

  /**
   * Validate inventory management capabilities
   */
  async validateInventoryCapabilities(productId: string): Promise<{
    canRestockByCategory: boolean
    canTrackUtilization: boolean
    restockingRecommendations: Array<{
      ageCategory: AgeCategory
      size: SizeEnum
      currentStock: number
      recommendedAction: 'increase' | 'decrease' | 'maintain'
      reason: string
    }>
    inventoryHealth: 'good' | 'needs_attention' | 'critical'
  }> {
    const productSizes = await this.getProductSizes(productId)
    const restockingRecommendations: Array<{
      ageCategory: AgeCategory
      size: SizeEnum
      currentStock: number
      recommendedAction: 'increase' | 'decrease' | 'maintain'
      reason: string
    }> = []

    const canRestockByCategory = productSizes.length > 0
    const canTrackUtilization = productSizes.some((ps) => ps.quantity > 0)

    // Generate restocking recommendations
    const avgQuantity = productSizes.reduce((sum, ps) => sum + ps.quantity, 0) / productSizes.length

    productSizes.forEach((ps) => {
      let recommendedAction: 'increase' | 'decrease' | 'maintain' = 'maintain'
      let reason = 'Stock level is optimal'

      if (ps.quantity === 0) {
        recommendedAction = 'increase'
        reason = 'Out of stock - immediate restocking needed'
      } else if (ps.quantity < avgQuantity * 0.5) {
        recommendedAction = 'increase'
        reason = 'Below average stock level'
      } else if (ps.quantity > avgQuantity * 2) {
        recommendedAction = 'decrease'
        reason = 'Excess inventory - consider redistribution'
      }

      restockingRecommendations.push({
        ageCategory: ps.ageCategory,
        size: ps.size,
        currentStock: ps.quantity,
        recommendedAction,
        reason,
      })
    })

    // Determine inventory health
    const outOfStock = productSizes.filter((ps) => ps.quantity === 0).length
    const lowStock = productSizes.filter((ps) => ps.quantity < avgQuantity * 0.5).length
    const totalSizes = productSizes.length

    let inventoryHealth: 'good' | 'needs_attention' | 'critical' = 'good'

    if (outOfStock > 0 || lowStock / totalSizes > 0.5) {
      inventoryHealth = 'critical'
    } else if (lowStock > 0 || outOfStock > 0) {
      inventoryHealth = 'needs_attention'
    }

    return {
      canRestockByCategory,
      canTrackUtilization,
      restockingRecommendations,
      inventoryHealth,
    }
  }

  // ============== BUSINESS INTELLIGENCE HELPERS ==============

  /**
   * Get age category distribution for analytics
   */
  async getAgeCategoryDistribution(productId: string): Promise<{
    totalAdult: number
    totalChild: number
    totalUniversal: number
    categoryPercentages: CategoryBreakdown
  }> {
    const productSizes = await this.getProductSizes(productId)
    const breakdown = this.calculateCategoryBreakdown(productSizes)

    const percentages: CategoryBreakdown = {
      adult: breakdown.total > 0 ? (breakdown.adult / breakdown.total) * 100 : 0,
      child: breakdown.total > 0 ? (breakdown.child / breakdown.total) * 100 : 0,
      universal: breakdown.total > 0 ? (breakdown.universal / breakdown.total) * 100 : 0,
      total: 100,
    }

    return {
      totalAdult: breakdown.adult,
      totalChild: breakdown.child,
      totalUniversal: breakdown.universal,
      categoryPercentages: percentages,
    }
  }
}
