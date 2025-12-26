/**
 * Optimization hooks for transaction search performance
 * 
 * This module contains hooks and utilities for:
 * - Search debouncing
 * - Intelligent caching
 * - Performance monitoring
 * - Auto-refresh optimization
 */

export { useDebounce, useSearchDebounce } from './useDebounce'
export { 
  useCacheManager,
  generateTransactionCacheKey,
  generateTransactionDetailCacheKey,
  generateInvalidationPattern
} from './useCacheManager'
export { usePerformanceMonitor } from './usePerformanceMonitor'
export { useAutoRefresh } from './useAutoRefresh'

// Types
export type {
  DebounceOptions,
  UseDebounceReturn,
  CacheManagerOptions,
  CacheStats,
  StorageStrategy,
  PerformanceMetrics,
  AutoRefreshOptions,
  SearchParams,
  NetworkCondition,
  UserActivity
} from './types'