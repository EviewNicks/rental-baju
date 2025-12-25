/**
 * Optimization hooks for transaction search performance
 * 
 * This module contains hooks and utilities for:
 * - Search debouncing
 * - Intelligent caching
 * - Performance monitoring
 * - Auto-refresh optimization
 */

export { useDebounce } from './useDebounce'
export { useCacheManager } from './useCacheManager'
export { usePerformanceMonitor } from './usePerformanceMonitor'
export { useAutoRefresh } from './useAutoRefresh'

// Types
export type {
  DebounceOptions,
  CacheManagerOptions,
  PerformanceMetrics,
  AutoRefreshOptions
} from './types'