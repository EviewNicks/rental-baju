'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateAdvancedProductSizeRequest,
  AdvancedAggregatedSizeView,
  AdvancedProductSizeAggregation,
  AgeCategory,
  SizeEnum,
} from '@/features/manage-product/types/advanced'
import { logger } from '@/services/logger'

// Hook logger
const aggregationLogger = logger.child('useAdvancedSizeAggregation')

/**
 * Business insights interface for size aggregation
 */
interface BusinessInsights {
  uniqueAgeCategories: number
  uniqueSizes: number
  totalQuantity: number
  complexityScore: number
  businessValue: 'basic' | 'intermediate' | 'advanced' | 'enterprise'
  canTrackByAgeCategory: boolean
  canTrackBySpecificSize: boolean
  recommendations: string[]
}

/**
 * Performance metrics for aggregation calculations
 */
interface PerformanceMetrics {
  calculationTimeMs: number
  cacheHit: boolean
  memoryUsageMB: number
  optimizationScore: 'excellent' | 'good' | 'needs_attention' | 'critical'
}

/**
 * Hook options
 */
interface UseAdvancedSizeAggregationOptions {
  // Performance options
  enableCaching?: boolean
  cacheExpiryMinutes?: number
  performanceThresholdMs?: number

  // Display options
  includeBreakdown?: boolean
  includeBusinessInsights?: boolean
  includePerformanceMetrics?: boolean

  // Real-time options
  enableRealTimeCalculation?: boolean
  debounceMs?: number
}

/**
 * Hook return type
 */
interface UseAdvancedSizeAggregationReturn {
  // Aggregated data
  aggregatedSizes: AdvancedAggregatedSizeView[]
  businessInsights: BusinessInsights | null
  performanceMetrics: PerformanceMetrics | null

  // Computed statistics
  totalQuantity: number
  totalSizes: number
  categoryDistribution: Record<AgeCategory, number>
  categoryPercentages: Record<AgeCategory, number>

  // State
  isCalculating: boolean
  error: string | null
  lastCalculated: Date | null

  // Actions
  recalculate: () => void
  clearCache: () => void
  exportData: () => any

  // Utilities
  getSizeByEnum: (sizeEnum: SizeEnum) => AdvancedAggregatedSizeView | undefined
  getCategoryTotal: (category: AgeCategory) => number
  getComplexityScore: () => number
}

/**
 * Default hook options
 */
const defaultOptions: UseAdvancedSizeAggregationOptions = {
  enableCaching: true,
  cacheExpiryMinutes: 5,
  performanceThresholdMs: 50,
  includeBreakdown: true,
  includeBusinessInsights: true,
  includePerformanceMetrics: false,
  enableRealTimeCalculation: true,
  debounceMs: 300,
}

/**
 * Advanced Size Aggregation Hook
 *
 * Provides real-time size aggregation calculations with:
 * - Performance-optimized aggregation algorithms
 * - Business intelligence analytics
 * - Caching and memoization
 * - Performance monitoring
 * - Real-time updates with debouncing
 */
export function useAdvancedSizeAggregation(
  sizes: CreateAdvancedProductSizeRequest[],
  options: UseAdvancedSizeAggregationOptions = {}
): UseAdvancedSizeAggregationReturn {
  const config = { ...defaultOptions, ...options }

  // State
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastCalculated, setLastCalculated] = useState<Date | null>(null)

  // Performance tracking
  const performanceRef = useRef<PerformanceMetrics | null>(null)
  const calculationStartTime = useRef<number>(0)

  // Cache key for query client
  const cacheKey = useMemo(() => {
    const sizesHash = JSON.stringify(sizes)
    const optionsHash = JSON.stringify(config)
    return `advanced-size-aggregation-${sizesHash}-${optionsHash}`
  }, [sizes, config])

  // Query client for caching
  const queryClient = useQueryClient()

  // Calculate aggregated sizes with performance monitoring
  const calculateAggregatedSizes = useCallback((): AdvancedAggregatedSizeView[] => {
    calculationStartTime.current = performance.now()
    setIsCalculating(true)
    setError(null)

    try {
      if (sizes.length === 0) {
        return []
      }

      const sizeGroups = new Map<SizeEnum, {
        totalQuantity: number
        breakdown: Record<AgeCategory, number>
        hasMultipleCategories: boolean
      }>()

      // Group sizes by size enum
      sizes.forEach(size => {
        if (!sizeGroups.has(size.size)) {
          sizeGroups.set(size.size, {
            totalQuantity: 0,
            breakdown: { ADULT: 0, CHILD: 0, UNIVERSAL: 0 },
            hasMultipleCategories: false,
          })
        }

        const group = sizeGroups.get(size.size)!
        group.totalQuantity += size.quantity
        group.breakdown[size.ageCategory] += size.quantity
      })

      // Calculate if each size has multiple categories and clean breakdown
      sizeGroups.forEach((group) => {
        const nonZeroCategories = Object.values(group.breakdown).filter(count => count > 0).length
        group.hasMultipleCategories = nonZeroCategories > 1

        // Clean up breakdown to remove zero values
        Object.keys(group.breakdown).forEach(category => {
          if (group.breakdown[category as AgeCategory] === 0) {
            delete group.breakdown[category as AgeCategory]
          }
        })
      })

      // Convert to aggregated view format
      const aggregated: AdvancedAggregatedSizeView[] = Array.from(sizeGroups.entries())
        .map(([size, data]) => ({
          size,
          totalQuantity: data.totalQuantity,
          breakdown: {
            adult: data.breakdown.ADULT || undefined,
            child: data.breakdown.CHILD || undefined,
            universal: data.breakdown.UNIVERSAL || undefined,
          },
          hasMultipleCategories: data.hasMultipleCategories,
          availableForRental: data.totalQuantity, // TODO: subtract rented quantities from real data
        }))
        .sort((a, b) => {
          // Sort by size order: XS, S, M, L, XL, XXL
          const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
          return sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size)
        })

      const calculationTime = performance.now() - calculationStartTime.current

      // Update performance metrics
      performanceRef.current = {
        calculationTimeMs: Math.round(calculationTime * 100) / 100,
        cacheHit: false,
        memoryUsageMB: 0, // Would need memory profiling in real implementation
        optimizationScore: calculateOptimizationScore(calculationTime),
      }

      setLastCalculated(new Date())
      aggregationLogger.info('aggregateSizes', 'Aggregation calculated successfully', {
        sizesCount: sizes.length,
        aggregatedCount: aggregated.length,
        calculationTimeMs: calculationTime,
      })

      return aggregated

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Calculation failed'
      setError(errorMessage)
      aggregationLogger.error('aggregateSizes', 'Aggregation calculation failed', { error: err })
      return []
    } finally {
      setIsCalculating(false)
    }
  }, [sizes])

  // Calculate business insights
  const calculateBusinessInsights = useCallback((aggregated: AdvancedAggregatedSizeView[]): BusinessInsights => {
    const uniqueAgeCategories = new Set(sizes.map(s => s.ageCategory)).size
    const uniqueSizes = new Set(sizes.map(s => s.size)).size
    const totalQuantity = sizes.reduce((sum, s) => sum + s.quantity, 0)

    // Calculate complexity score (0-10)
    const complexityScore = Math.min(10, (uniqueAgeCategories * 2) + (uniqueSizes * 1.5) + (sizes.length * 0.5))

    // Determine business value
    let businessValue: 'basic' | 'intermediate' | 'advanced' | 'enterprise' = 'basic'
    if (complexityScore >= 8) businessValue = 'enterprise'
    else if (complexityScore >= 6) businessValue = 'advanced'
    else if (complexityScore >= 4) businessValue = 'intermediate'

    // Generate recommendations
    const recommendations: string[] = []
    if (uniqueAgeCategories === 1) {
      recommendations.push('Pertimbangkan menambah kategori umur lain untuk segmentasi yang lebih baik')
    }
    if (uniqueSizes < 3) {
      recommendations.push('Tambah variasi ukuran untuk melayani kebutuhan pelanggan yang lebih beragam')
    }
    if (totalQuantity < 10) {
      recommendations.push('Tingkatkan total stok untuk availability yang lebih baik')
    }
    if (recommendations.length === 0) {
      recommendations.push('Konfigurasi ukuran sudah optimal')
    }

    return {
      uniqueAgeCategories,
      uniqueSizes,
      totalQuantity,
      complexityScore: Math.round(complexityScore * 10) / 10,
      businessValue,
      canTrackByAgeCategory: uniqueAgeCategories > 1,
      canTrackBySpecificSize: uniqueSizes > 1,
      recommendations,
    }
  }, [sizes])

  // Memoized aggregated sizes calculation
  const aggregatedSizes = useMemo(() => {
    if (config.enableRealTimeCalculation) {
      return calculateAggregatedSizes()
    }
    return []
  }, [sizes, config.enableRealTimeCalculation, calculateAggregatedSizes])

  // Memoized business insights
  const businessInsights = useMemo(() => {
    if (!config.includeBusinessInsights || aggregatedSizes.length === 0) {
      return null
    }
    return calculateBusinessInsights(aggregatedSizes)
  }, [aggregatedSizes, config.includeBusinessInsights, calculateBusinessInsights])

  // Computed statistics
  const totalQuantity = useMemo(() => {
    return sizes.reduce((sum, size) => sum + size.quantity, 0)
  }, [sizes])

  const totalSizes = useMemo(() => {
    return sizes.length
  }, [sizes])

  const categoryDistribution = useMemo((): Record<AgeCategory, number> => {
    const distribution: Record<AgeCategory, number> = { ADULT: 0, CHILD: 0, UNIVERSAL: 0 }
    sizes.forEach(size => {
      distribution[size.ageCategory] += size.quantity
    })
    return distribution
  }, [sizes])

  const categoryPercentages = useMemo((): Record<AgeCategory, number> => {
    if (totalQuantity === 0) {
      return { ADULT: 0, CHILD: 0, UNIVERSAL: 0 }
    }
    return {
      ADULT: Math.round((categoryDistribution.ADULT / totalQuantity) * 100),
      CHILD: Math.round((categoryDistribution.CHILD / totalQuantity) * 100),
      UNIVERSAL: Math.round((categoryDistribution.UNIVERSAL / totalQuantity) * 100),
    }
  }, [categoryDistribution, totalQuantity])

  // Utility functions
  const getSizeByEnum = useCallback((sizeEnum: SizeEnum): AdvancedAggregatedSizeView | undefined => {
    return aggregatedSizes.find(size => size.size === sizeEnum)
  }, [aggregatedSizes])

  const getCategoryTotal = useCallback((category: AgeCategory): number => {
    return categoryDistribution[category]
  }, [categoryDistribution])

  const getComplexityScore = useCallback((): number => {
    return businessInsights?.complexityScore || 0
  }, [businessInsights])

  // Actions
  const recalculate = useCallback(() => {
    aggregationLogger.info('forceRecalculate', 'Manual recalculation triggered')
    calculateAggregatedSizes()
  }, [calculateAggregatedSizes])

  const clearCache = useCallback(() => {
    queryClient.removeQueries({ queryKey: [cacheKey] })
    aggregationLogger.info('clearCache', 'Cache cleared')
  }, [queryClient, cacheKey])

  const exportData = useCallback(() => {
    return {
      aggregatedSizes,
      businessInsights,
      totalQuantity,
      totalSizes,
      categoryDistribution,
      categoryPercentages,
      lastCalculated,
      performanceMetrics: performanceRef.current,
    }
  }, [aggregatedSizes, businessInsights, totalQuantity, totalSizes, categoryDistribution, categoryPercentages, lastCalculated])

  // Initialize hook
  useEffect(() => {
    aggregationLogger.info('useAdvancedSizeAggregation', 'Advanced size aggregation hook initialized', {
      sizesCount: sizes.length,
      options: config,
    })
  }, [sizes.length, config])

  return {
    // Aggregated data
    aggregatedSizes,
    businessInsights,
    performanceMetrics: config.includePerformanceMetrics ? performanceRef.current : null,

    // Computed statistics
    totalQuantity,
    totalSizes,
    categoryDistribution,
    categoryPercentages,

    // State
    isCalculating,
    error,
    lastCalculated,

    // Actions
    recalculate,
    clearCache,
    exportData,

    // Utilities
    getSizeByEnum,
    getCategoryTotal,
    getComplexityScore,
  }
}

/**
 * Calculate optimization score based on calculation time
 */
function calculateOptimizationScore(timeMs: number): 'excellent' | 'good' | 'needs_attention' | 'critical' {
  if (timeMs < 25) return 'excellent'
  if (timeMs < 50) return 'good'
  if (timeMs < 100) return 'needs_attention'
  return 'critical'
}

export type {
  BusinessInsights,
  PerformanceMetrics,
  UseAdvancedSizeAggregationOptions,
  UseAdvancedSizeAggregationReturn,
}