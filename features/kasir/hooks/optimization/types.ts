/**
 * TypeScript interfaces for optimization components
 */

// Debounce types
export interface DebounceOptions {
  delay?: number
  immediate?: boolean
  maxWait?: number
  onPending?: (isPending: boolean) => void
  onExecute?: (value: unknown) => void
}

export interface UseDebounceReturn<T> {
  debouncedValue: T
  isPending: boolean
  cancel: () => void
  flush: () => void
  execute: () => void
}

// Cache Manager types
export interface CacheManagerOptions {
  maxSize?: number
  defaultTTL?: number
  storageStrategy?: StorageStrategy
  enablePersistence?: boolean
}

export enum StorageStrategy {
  MEMORY_ONLY = 'memory',
  SESSION_STORAGE = 'session',
  HYBRID = 'hybrid'
}

export interface CacheEntry<T> {
  key: string
  value: T
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
  size: number
  isPersistent: boolean
  storageStrategy: StorageStrategy
}

export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  totalSize: number
  entryCount: number
  persistentHits: number
  persistentMisses: number
}

// Search parameters for cache key generation
export interface SearchParams {
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  tglMulai?: string // New: Single date filter for rental start date
  dateCreated?: string // New: Single date filter for transaction created date
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Performance Monitor types
export interface PerformanceMetrics {
  apiResponseTimes: ResponseTimeMetrics
  cachePerformance: CachePerformanceMetrics
  searchMetrics: SearchMetrics
  userExperience: UserExperienceMetrics
}

export interface ResponseTimeMetrics {
  average: number
  min: number
  max: number
  p95: number
  p99: number
}

export interface CachePerformanceMetrics {
  hitRate: number
  missRate: number
  evictionCount: number
  totalSize: number
}

export interface SearchMetrics {
  totalSearches: number
  averageResponseTime: number
  popularTerms: string[]
  failedSearches: number
}

export interface UserExperienceMetrics {
  searchLatency: number
  cacheHitLatency: number
  errorRate: number
  retryCount: number
}

// Auto Refresh types
export interface AutoRefreshOptions {
  interval?: number
  pauseOnTyping?: boolean
  pauseOnInactive?: boolean
  adaptToNetwork?: boolean
  maxInterval?: number
  minInterval?: number
}

export enum NetworkCondition {
  FAST = 'fast',
  SLOW = 'slow',
  OFFLINE = 'offline'
}

export enum UserActivity {
  ACTIVE = 'active',
  TYPING = 'typing',
  IDLE = 'idle',
  AWAY = 'away'
}