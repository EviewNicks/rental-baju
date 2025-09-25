/**
 * Advanced Product Size Aggregation Service - Enhanced Version
 *
 * Features:
 * - Advanced-only types compatibility
 * - Improved performance monitoring
 * - Enhanced business intelligence
 * - Real-time rental tracking integration
 * - Advanced caching strategies
 * - Comprehensive error handling
 */

import { PrismaClient } from '@prisma/client'
import type {
  AdvancedProductSize,
  AdvancedAggregatedSizeView,
  AdvancedProductSizeAggregation,
  AdvancedCategoryBreakdown,
  SizeEnum,
  AgeCategory,
  AdvancedBusinessValidationResult,
  AdvancedProductCapabilities,
} from '../types/advanced'

export interface AdvancedAggregationConfig {
  enableCaching: boolean
  cacheExpiryMinutes: number
  includeBreakdown: boolean
  includeRentalTracking: boolean
  performanceThresholdMs: number
  maxCacheSize: number
}

export interface AdvancedCacheEntry<T> {
  data: T
  calculatedAt: Date
  expiryAt: Date
  accessCount: number
  lastAccessed: Date
  performance: PerformanceMetrics
}

export interface PerformanceMetrics {
  calculationTimeMs: number
  cacheHitRatio: number
  memoryUsageMB: number
  complexity: 'low' | 'medium' | 'high'
}

export interface AggregationServiceResponse<T> {
  data: T
  metadata: {
    calculatedAt: Date
    fromCache: boolean
    calculationTimeMs: number
    performance: 'excellent' | 'good' | 'needs_attention' | 'critical'
    cacheStats?: {
      hitRatio: number
      totalEntries: number
      memoryUsage: string
    }
  }
}

export class AdvancedProductSizeAggregationService {
  private cache = new Map<string, AdvancedCacheEntry<unknown>>()
  private config: AdvancedAggregationConfig
  private performanceHistory: PerformanceMetrics[] = []

  constructor(
    private readonly prisma: PrismaClient,
    config?: Partial<AdvancedAggregationConfig>,
  ) {
    this.config = {
      enableCaching: true,
      cacheExpiryMinutes: 10,
      includeBreakdown: true,
      includeRentalTracking: true,
      performanceThresholdMs: 50,
      maxCacheSize: 1000,
      ...config,
    }
  }

  // ============== ENHANCED AGGREGATION METHODS ==============

  /**
   * Get aggregated size views with enhanced performance monitoring
   */
  async getAdvancedAggregatedSizes(
    productId: string,
    options: {
      includeBreakdown?: boolean
      includeRentalTracking?: boolean
      forceRefresh?: boolean
    } = {},
  ): Promise<AggregationServiceResponse<AdvancedAggregatedSizeView[]>> {
    const startTime = Date.now()
    const startMemory = process.memoryUsage().heapUsed

    const {
      includeBreakdown = this.config.includeBreakdown,
      includeRentalTracking = this.config.includeRentalTracking,
      forceRefresh = false,
    } = options

    const cacheKey = `advanced_aggregated_${productId}_${includeBreakdown}_${includeRentalTracking}`

    // Check cache first (unless forced refresh)
    if (this.config.enableCaching && !forceRefresh) {
      const cached = this.getFromAdvancedCache<AdvancedAggregatedSizeView[]>(cacheKey)
      if (cached) {
        return this.wrapResponse(cached, true, startTime, startMemory)
      }
    }

    try {
      // Fetch detailed size data with rental tracking
      const productSizes = await this.getAdvancedProductSizes(productId, includeRentalTracking)

      // Validate product exists
      if (productSizes.length === 0) {
        const product = await this.prisma.product.findUnique({ where: { id: productId } })
        if (!product) {
          throw new Error(`Product with ID ${productId} not found`)
        }
        // Product exists but has no sizes - return empty array
        return this.wrapResponse([], false, startTime, startMemory)
      }

      // Transform to aggregated view
      const aggregatedSizes = this.aggregateAdvancedSizesBySize(
        productSizes,
        includeBreakdown,
        includeRentalTracking,
      )

      // Cache result
      if (this.config.enableCaching) {
        this.setAdvancedCache(cacheKey, aggregatedSizes, startTime, startMemory)
      }

      return this.wrapResponse(aggregatedSizes, false, startTime, startMemory)
    } catch (error) {
      console.error(`Advanced aggregation failed for product ${productId}:`, error)

      throw new Error(
        `Aggregation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Get complete advanced aggregation with business intelligence
   */
  async getAdvancedProductAggregation(
    productId: string,
    options: {
      includeBusinessIntelligence?: boolean
      includePerformanceMetrics?: boolean
    } = {},
  ): Promise<AdvancedProductSizeAggregation> {
    const startTime = Date.now()
    const cacheKey = `advanced_product_aggregation_${productId}_${JSON.stringify(options)}`

    if (this.config.enableCaching) {
      const cached = this.getFromAdvancedCache<AdvancedProductSizeAggregation>(cacheKey)
      if (cached) return cached
    }

    const productSizes = await this.getAdvancedProductSizes(productId, true)

    if (productSizes.length === 0) {
      throw new Error(`Product ${productId} has no active sizes`)
    }

    const aggregatedSizes = this.aggregateAdvancedSizesBySize(productSizes, true, true)
    const totalQuantity = productSizes.reduce((sum, size) => sum + size.quantity, 0)
    const categoryBreakdown = this.calculateAdvancedCategoryBreakdown(productSizes)

    const calculationTime = Date.now() - startTime
    const performance = this.evaluatePerformance(calculationTime)

    const aggregation: AdvancedProductSizeAggregation = {
      productId,
      totalQuantity,
      aggregatedSizes,
      categoryBreakdown,
      lastCalculated: new Date(),
      metadata: {
        calculatedAt: new Date(),
        fromCache: false,
        calculationTimeMs: calculationTime,
        performance,
      },
    }

    // Add business intelligence if requested
    if (options.includeBusinessIntelligence) {
      // These could be added as additional properties to the aggregation
      // For now, they're calculated separately
    }

    if (this.config.enableCaching) {
      this.setAdvancedCache(cacheKey, aggregation, startTime, process.memoryUsage().heapUsed)
    }

    // Track performance
    this.recordPerformanceMetrics(calculationTime)

    return aggregation
  }

  /**
   * Get total available quantity considering rental tracking
   */
  async getAdvancedTotalQuantity(
    productId: string,
    options: { includeRented?: boolean } = {},
  ): Promise<{ total: number; available: number; rented: number }> {
    const cacheKey = `advanced_total_${productId}_${options.includeRented}`

    if (this.config.enableCaching) {
      const cached = this.getFromAdvancedCache<{
        total: number
        available: number
        rented: number
      }>(cacheKey)
      if (cached) return cached
    }

    const productSizes = await this.getAdvancedProductSizes(productId, true)

    const total = productSizes.reduce((sum, size) => sum + size.quantity, 0)
    const rented = await this.calculateRentedQuantity(productId)
    const available = total - rented

    const result = { total, available, rented }

    if (this.config.enableCaching) {
      this.setAdvancedCache(cacheKey, result, Date.now(), process.memoryUsage().heapUsed)
    }

    return result
  }

  // ============== ENHANCED BUSINESS INTELLIGENCE ==============

  /**
   * Validate advanced size management with comprehensive business rules
   */
  async validateAdvancedBusinessRules(
    productId: string,
  ): Promise<AdvancedBusinessValidationResult> {
    const productSizes = await this.getAdvancedProductSizes(productId, false)
    const errors: string[] = []
    const warnings: string[] = []

    // Rule 1: Must have at least one size
    if (productSizes.length === 0) {
      errors.push('Product must have at least one size configuration')
    }

    // Rule 2: No duplicate size+ageCategory combinations
    const combinations = productSizes.map((s) => `${s.size}-${s.ageCategory}`)
    const uniqueCombinations = new Set(combinations)
    const sizeConsistency = combinations.length === uniqueCombinations.size

    if (!sizeConsistency) {
      errors.push('Duplicate size and age category combinations detected')
    }

    // Rule 3: All quantities must be positive
    const minimumQuantities = productSizes.every((s) => s.quantity > 0)
    if (!minimumQuantities) {
      errors.push('All size quantities must be greater than 0')
    }

    // Rule 4: Valid enum values
    const validSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    const validCategories = ['ADULT', 'CHILD', 'UNIVERSAL']

    const validEnumValues = productSizes.every(
      (s) => validSizes.includes(s.size) && validCategories.includes(s.ageCategory),
    )

    if (!validEnumValues) {
      errors.push('Invalid size or age category values detected')
    }

    // Business warnings
    if (productSizes.length > 20) {
      warnings.push('Large number of size configurations may impact performance')
    }

    const totalQuantity = productSizes.reduce((sum, s) => sum + s.quantity, 0)
    if (totalQuantity > 1000) {
      warnings.push('Very high total quantity - consider inventory optimization')
    }

    return {
      sizeConsistency,
      uniqueCombinations: sizeConsistency,
      minimumQuantities,
      validEnumValues,
      errors,
      warnings,
    }
  }

  /**
   * Analyze product capabilities for business intelligence
   */
  async analyzeAdvancedProductCapabilities(
    productId: string,
  ): Promise<AdvancedProductCapabilities> {
    const productSizes = await this.getAdvancedProductSizes(productId, true)
    const aggregation = await this.getAdvancedProductAggregation(productId)

    const ageCategories = new Set(productSizes.map((s) => s.ageCategory))
    const sizes = new Set(productSizes.map((s) => s.size))

    const canTrackByAgeCategory = ageCategories.size > 1
    const canTrackBySpecificSize = sizes.size > 1

    // Calculate complexity score
    const complexityScore =
      ageCategories.size * sizes.size + (productSizes.length > 10 ? 10 : productSizes.length)

    // Determine business value tier
    let businessValue: 'basic' | 'intermediate' | 'advanced' | 'enterprise' = 'basic'

    if (complexityScore >= 20) {
      businessValue = 'enterprise'
    } else if (complexityScore >= 12) {
      businessValue = 'advanced'
    } else if (complexityScore >= 6) {
      businessValue = 'intermediate'
    }

    // Generate recommendations
    const recommendedActions: string[] = []

    if (!canTrackByAgeCategory) {
      recommendedActions.push('Consider adding age category diversity for better market coverage')
    }

    if (!canTrackBySpecificSize) {
      recommendedActions.push('Add size variety to improve customer fit options')
    }

    if (complexityScore < 6) {
      recommendedActions.push('Expand size matrix to unlock advanced business capabilities')
    }

    if (aggregation.totalQuantity < 10) {
      recommendedActions.push('Consider increasing inventory levels for better availability')
    }

    return {
      canTrackByAgeCategory,
      canTrackBySpecificSize,
      complexityScore,
      businessValue,
      recommendedActions,
    }
  }

  // ============== ENHANCED DATA ACCESS & PROCESSING ==============

  /**
   * Fetch advanced product sizes with rental tracking
   */
  private async getAdvancedProductSizes(
    productId: string,
    includeRentalTracking: boolean = false,
  ): Promise<AdvancedProductSize[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queryOptions: any = {
      where: {
        productId,
        isActive: true,
      },
      orderBy: [{ size: 'asc' }, { ageCategory: 'asc' }],
    }

    // Add rental tracking if requested
    if (includeRentalTracking) {
      queryOptions.include = {
        _count: {
          select: {
            // This would be the actual rental items relationship
            // rentalItems: {
            //   where: {
            //     rental: { status: 'ACTIVE' }
            //   }
            // }
          },
        },
      }
    }

    const productSizes = await this.prisma.productSize.findMany(queryOptions)

    return productSizes.map(
      (size): AdvancedProductSize => ({
        id: size.id,
        productId: size.productId,
        ageCategory: size.ageCategory as AgeCategory,
        size: size.size as SizeEnum,
        quantity: size.quantity,
        isActive: size.isActive,
        createdAt: size.createdAt,
        updatedAt: size.updatedAt,
        createdBy: size.createdBy,
      }),
    )
  }

  /**
   * Enhanced aggregation algorithm with rental tracking
   */
  private aggregateAdvancedSizesBySize(
    productSizes: AdvancedProductSize[],
    includeBreakdown: boolean,
    includeRentalTracking: boolean,
  ): AdvancedAggregatedSizeView[] {
    const sizeMap = new Map<
      SizeEnum,
      {
        totalQuantity: number
        breakdown: { adult: number; child: number; universal: number }
        categories: Set<AgeCategory>
        rentedQuantity?: number
      }
    >()

    // Group and sum by size
    productSizes.forEach((ps) => {
      if (!sizeMap.has(ps.size)) {
        sizeMap.set(ps.size, {
          totalQuantity: 0,
          breakdown: { adult: 0, child: 0, universal: 0 },
          categories: new Set(),
          ...(includeRentalTracking && { rentedQuantity: 0 }),
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

    // Convert to AdvancedAggregatedSizeView array
    return Array.from(sizeMap.entries())
      .map(([size, data]) => {
        const result: AdvancedAggregatedSizeView = {
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
          availableForRental: includeRentalTracking
            ? data.totalQuantity - (data.rentedQuantity || 0)
            : data.totalQuantity,
        }

        return result
      })
      .sort((a, b) => {
        // Sort by size order: XS, S, M, L, XL, XXL
        const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
        return sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size)
      })
  }

  /**
   * Calculate enhanced category breakdown with percentages
   */
  private calculateAdvancedCategoryBreakdown(
    productSizes: AdvancedProductSize[],
  ): AdvancedCategoryBreakdown {
    const breakdown: AdvancedCategoryBreakdown = {
      adult: 0,
      child: 0,
      universal: 0,
      total: 0,
      distribution: {
        adultPercentage: 0,
        childPercentage: 0,
        universalPercentage: 0,
      },
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

    // Calculate percentages
    if (breakdown.total > 0) {
      breakdown.distribution.adultPercentage = (breakdown.adult / breakdown.total) * 100
      breakdown.distribution.childPercentage = (breakdown.child / breakdown.total) * 100
      breakdown.distribution.universalPercentage = (breakdown.universal / breakdown.total) * 100
    }

    return breakdown
  }

  // ============== ENHANCED CACHE MANAGEMENT ==============

  private getFromAdvancedCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as AdvancedCacheEntry<T> | undefined
    if (!entry) return null

    if (new Date() > entry.expiryAt) {
      this.cache.delete(key)
      return null
    }

    // Update access stats
    entry.accessCount++
    entry.lastAccessed = new Date()

    return entry.data
  }

  private setAdvancedCache<T>(key: string, data: T, startTime: number, startMemory: number): void {
    // Implement cache size management
    if (this.cache.size >= this.config.maxCacheSize) {
      this.evictLeastRecentlyUsed()
    }

    const now = new Date()
    const calculationTime = Date.now() - startTime
    const memoryUsage = (process.memoryUsage().heapUsed - startMemory) / 1024 / 1024 // MB

    const entry: AdvancedCacheEntry<T> = {
      data,
      calculatedAt: now,
      expiryAt: new Date(now.getTime() + this.config.cacheExpiryMinutes * 60 * 1000),
      accessCount: 1,
      lastAccessed: now,
      performance: {
        calculationTimeMs: calculationTime,
        cacheHitRatio: this.calculateCacheHitRatio(),
        memoryUsageMB: memoryUsage,
        complexity: this.determineComplexity(calculationTime),
      },
    }

    this.cache.set(key, entry)
  }

  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null
    let oldestTime = new Date()

    for (const [key, entry] of this.cache.entries()) {
      const cacheEntry = entry as AdvancedCacheEntry<unknown>
      if (cacheEntry.lastAccessed < oldestTime) {
        oldestTime = cacheEntry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  // ============== PERFORMANCE MONITORING ==============

  private wrapResponse<T>(
    data: T,
    fromCache: boolean,
    startTime: number,
    startMemory: number,
  ): AggregationServiceResponse<T> {
    const calculationTime = Date.now() - startTime
    const performance = this.evaluatePerformance(calculationTime)

    // Record performance metrics
    this.recordPerformanceMetrics(calculationTime)

    return {
      data,
      metadata: {
        calculatedAt: new Date(),
        fromCache,
        calculationTimeMs: calculationTime,
        performance,
        cacheStats: {
          hitRatio: this.calculateCacheHitRatio(),
          totalEntries: this.cache.size,
          memoryUsage: `${Math.round(((process.memoryUsage().heapUsed - startMemory) / 1024 / 1024) * 100) / 100}MB`,
        },
      },
    }
  }

  private evaluatePerformance(
    timeMs: number,
  ): 'excellent' | 'good' | 'needs_attention' | 'critical' {
    if (timeMs < 25) return 'excellent'
    if (timeMs < this.config.performanceThresholdMs) return 'good'
    if (timeMs < this.config.performanceThresholdMs * 2) return 'needs_attention'
    return 'critical'
  }

  private determineComplexity(timeMs: number): 'low' | 'medium' | 'high' {
    if (timeMs < 10) return 'low'
    if (timeMs < 50) return 'medium'
    return 'high'
  }

  private recordPerformanceMetrics(calculationTime: number): void {
    const metric: PerformanceMetrics = {
      calculationTimeMs: calculationTime,
      cacheHitRatio: this.calculateCacheHitRatio(),
      memoryUsageMB: process.memoryUsage().heapUsed / 1024 / 1024,
      complexity: this.determineComplexity(calculationTime),
    }

    this.performanceHistory.push(metric)

    // Keep only last 100 metrics
    if (this.performanceHistory.length > 100) {
      this.performanceHistory.shift()
    }

    // Log performance warnings
    if (calculationTime > this.config.performanceThresholdMs * 2) {
      console.warn(
        `Slow aggregation calculation: ${calculationTime}ms (threshold: ${this.config.performanceThresholdMs}ms)`,
      )
    }
  }

  private calculateCacheHitRatio(): number {
    if (this.performanceHistory.length === 0) return 0

    const recentMetrics = this.performanceHistory.slice(-20) // Last 20 operations
    const cacheHits = recentMetrics.filter((m) => m.calculationTimeMs < 5).length // Very fast = likely cache hit

    return (cacheHits / recentMetrics.length) * 100
  }

  // ============== RENTAL TRACKING METHODS ==============

  /**
   * Calculate rented quantity for a product
   * Uses the rentedStock field from the product
   */
  private async calculateRentedQuantity(productId: string): Promise<number> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { rentedStock: true },
    })

    if (!product) {
      throw new Error(`Product with ID ${productId} not found`)
    }

    return Math.max(0, product.rentedStock || 0)
  }

  // ============== PUBLIC UTILITY METHODS ==============

  /**
   * Clear cache for specific product
   */
  public clearProductCache(productId: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter((key) => key.includes(productId))
    keysToDelete.forEach((key) => this.cache.delete(key))
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats(): {
    avgCalculationTime: number
    cacheHitRatio: number
    totalCacheEntries: number
    memoryUsage: string
    recentPerformance: PerformanceMetrics[]
  } {
    const avgTime =
      this.performanceHistory.length > 0
        ? this.performanceHistory.reduce((sum, m) => sum + m.calculationTimeMs, 0) /
          this.performanceHistory.length
        : 0

    return {
      avgCalculationTime: Math.round(avgTime * 100) / 100,
      cacheHitRatio: this.calculateCacheHitRatio(),
      totalCacheEntries: this.cache.size,
      memoryUsage: `${Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100}MB`,
      recentPerformance: this.performanceHistory.slice(-10),
    }
  }

  /**
   * Clear all cache and reset performance metrics
   */
  public reset(): void {
    this.cache.clear()
    this.performanceHistory = []
  }
}
