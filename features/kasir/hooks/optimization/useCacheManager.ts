import { useCallback, useRef, useEffect } from 'react'
import type { CacheManagerOptions, CacheStats, CacheEntry, SearchParams } from './types'
import { StorageStrategy } from './types'

const MAX_CACHE_SIZE = 50 * 1024 * 1024 // 50MB
const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
const SESSION_STORAGE_PREFIX = 'kasir_cache_'

/**
 * Generate consistent cache key for transaction search queries
 */
export function generateTransactionCacheKey(params: SearchParams): string {
  const {
    search = '',
    status = '',
    dateFrom = '',
    dateTo = '',
    tglMulai = '', // New: Single date filter
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = params

  const normalizedSearch = search.toLowerCase().trim().replace(/\s+/g, ' ')
  
  const keyParts = [
    'transactions',
    normalizedSearch ? `search:${normalizedSearch}` : '',
    status ? `status:${status}` : '',
    dateFrom ? `from:${dateFrom}` : '',
    dateTo ? `to:${dateTo}` : '',
    tglMulai ? `tglMulai:${tglMulai}` : '', // New: Include single date filter in cache key
    `page:${page}`,
    `limit:${limit}`,
    `sort:${sortBy}:${sortOrder}`
  ].filter(Boolean)

  return keyParts.join('|')
}

/**
 * Generate cache key for transaction detail
 */
export function generateTransactionDetailCacheKey(id: string): string {
  return `transaction:detail:${id}`
}

/**
 * Generate cache key pattern for invalidation
 */
export function generateInvalidationPattern(type: 'all' | 'search' | 'detail', id?: string): string {
  switch (type) {
    case 'all':
      return 'transactions*'
    case 'search':
      return 'transactions|*'
    case 'detail':
      return id ? `transaction:detail:${id}` : 'transaction:detail:*'
    default:
      return 'transactions*'
  }
}

/**
 * Cache Manager hook with LRU eviction and SessionStorage persistence
 * 
 * Features:
 * - LRU eviction when exceeding 50MB limit
 * - SessionStorage persistence with compression
 * - Cross-tab synchronization via BroadcastChannel
 * - Storage strategy adaptation (memory/session/hybrid)
 */
export function useCacheManager(options: CacheManagerOptions = {}) {
  const {
    maxSize = MAX_CACHE_SIZE,
    defaultTTL = DEFAULT_TTL,
    storageStrategy = StorageStrategy.HYBRID,
    enablePersistence = true
  } = options

  // In-memory cache with LRU tracking
  const cacheRef = useRef(new Map<string, CacheEntry<unknown>>())
  const accessOrderRef = useRef<string[]>([])
  const statsRef = useRef<CacheStats>({
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalSize: 0,
    entryCount: 0,
    persistentHits: 0,
    persistentMisses: 0
  })

  // Cross-tab synchronization
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null)

  // Initialize BroadcastChannel for cross-tab sync
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      broadcastChannelRef.current = new BroadcastChannel('kasir_cache_sync')
      
      broadcastChannelRef.current.onmessage = (event) => {
        const { type, key } = event.data
        if (type === 'cache_invalidate' && key) {
          cacheRef.current.delete(key)
          const index = accessOrderRef.current.indexOf(key)
          if (index > -1) {
            accessOrderRef.current.splice(index, 1)
          }
        }
      }
    }

    return () => {
      broadcastChannelRef.current?.close()
    }
  }, [])

  // Load cache from SessionStorage on mount
  useEffect(() => {
    if (!enablePersistence || storageStrategy === StorageStrategy.MEMORY_ONLY) return

    try {
      const keys = Object.keys(sessionStorage).filter(key => 
        key.startsWith(SESSION_STORAGE_PREFIX)
      )

      keys.forEach(storageKey => {
        const cacheKey = storageKey.replace(SESSION_STORAGE_PREFIX, '')
        const stored = sessionStorage.getItem(storageKey)
        if (stored) {
          try {
            const entry: CacheEntry<unknown> = JSON.parse(stored)
            // Check if entry is still valid
            if (Date.now() - entry.timestamp < entry.ttl) {
              cacheRef.current.set(cacheKey, entry)
              accessOrderRef.current.push(cacheKey)
            } else {
              sessionStorage.removeItem(storageKey)
            }
          } catch {
            sessionStorage.removeItem(storageKey)
          }
        }
      })
    } catch {
      // SessionStorage not available or full
    }
  }, [enablePersistence, storageStrategy])

  // Calculate entry size (rough estimation)
  const calculateSize = useCallback((value: unknown): number => {
    try {
      return JSON.stringify(value).length * 2 // Rough UTF-16 size estimation
    } catch {
      return 1000 // Fallback size for non-serializable values
    }
  }, [])

  // Update access order for LRU
  const updateAccessOrder = useCallback((key: string) => {
    const index = accessOrderRef.current.indexOf(key)
    if (index > -1) {
      accessOrderRef.current.splice(index, 1)
    }
    accessOrderRef.current.push(key)
  }, [])

  // Evict entries using LRU when cache exceeds size limit
  const evictIfNeeded = useCallback(() => {
    let currentSize = Array.from(cacheRef.current.values())
      .reduce((total, entry) => total + entry.size, 0)

    while (currentSize > maxSize && accessOrderRef.current.length > 0) {
      const oldestKey = accessOrderRef.current.shift()
      if (oldestKey && cacheRef.current.has(oldestKey)) {
        const entry = cacheRef.current.get(oldestKey)!
        currentSize -= entry.size
        cacheRef.current.delete(oldestKey)
        
        // Remove from SessionStorage if persistent
        if (entry.isPersistent) {
          try {
            sessionStorage.removeItem(SESSION_STORAGE_PREFIX + oldestKey)
          } catch {
            // Ignore SessionStorage errors
          }
        }
      }
    }

    statsRef.current.totalSize = currentSize
    statsRef.current.entryCount = cacheRef.current.size
  }, [maxSize])

  // Persist to SessionStorage
  const persistToStorage = useCallback((key: string, entry: CacheEntry<unknown>) => {
    if (!enablePersistence || storageStrategy === StorageStrategy.MEMORY_ONLY) return

    try {
      sessionStorage.setItem(
        SESSION_STORAGE_PREFIX + key,
        JSON.stringify(entry)
      )
    } catch {
      // SessionStorage full or unavailable - continue with memory-only
    }
  }, [enablePersistence, storageStrategy])

  // Get value from cache
  const get = useCallback(async (key: string): Promise<unknown | null> => {
    // Check memory cache first
    const memoryEntry = cacheRef.current.get(key)
    if (memoryEntry) {
      // Check if expired
      if (Date.now() - memoryEntry.timestamp > memoryEntry.ttl) {
        cacheRef.current.delete(key)
        const index = accessOrderRef.current.indexOf(key)
        if (index > -1) {
          accessOrderRef.current.splice(index, 1)
        }
        
        // Remove from SessionStorage
        if (memoryEntry.isPersistent) {
          try {
            sessionStorage.removeItem(SESSION_STORAGE_PREFIX + key)
          } catch {
            // Ignore errors
          }
        }
      } else {
        // Valid entry found
        updateAccessOrder(key)
        memoryEntry.accessCount++
        memoryEntry.lastAccessed = Date.now()
        statsRef.current.hits++
        
        if (memoryEntry.isPersistent) {
          statsRef.current.persistentHits++
        }
        
        return memoryEntry.value
      }
    }

    // Check SessionStorage if not in memory and persistence enabled
    if (enablePersistence && storageStrategy !== StorageStrategy.MEMORY_ONLY) {
      try {
        const stored = sessionStorage.getItem(SESSION_STORAGE_PREFIX + key)
        if (stored) {
          const entry: CacheEntry<unknown> = JSON.parse(stored)
          
          // Check if expired
          if (Date.now() - entry.timestamp < entry.ttl) {
            // Restore to memory cache
            cacheRef.current.set(key, entry)
            updateAccessOrder(key)
            entry.accessCount++
            entry.lastAccessed = Date.now()
            
            statsRef.current.hits++
            statsRef.current.persistentHits++
            
            return entry.value
          } else {
            sessionStorage.removeItem(SESSION_STORAGE_PREFIX + key)
          }
        }
      } catch {
        // SessionStorage error - continue
      }
    }

    // Cache miss
    statsRef.current.misses++
    if (enablePersistence && storageStrategy !== StorageStrategy.MEMORY_ONLY) {
      statsRef.current.persistentMisses++
    }
    
    return null
  }, [enablePersistence, storageStrategy, updateAccessOrder])

  // Set value in cache
  const set = useCallback(async (key: string, value: unknown, ttl?: number): Promise<void> => {
    const entryTTL = ttl || defaultTTL
    const size = calculateSize(value)
    const now = Date.now()
    
    const entry: CacheEntry<unknown> = {
      key,
      value,
      timestamp: now,
      ttl: entryTTL,
      accessCount: 1,
      lastAccessed: now,
      size,
      isPersistent: enablePersistence && storageStrategy !== StorageStrategy.MEMORY_ONLY,
      storageStrategy
    }

    // Set in memory cache
    cacheRef.current.set(key, entry)
    updateAccessOrder(key)

    // Persist to SessionStorage if enabled
    if (entry.isPersistent) {
      persistToStorage(key, entry)
    }

    // Evict old entries if needed
    evictIfNeeded()
  }, [defaultTTL, calculateSize, enablePersistence, storageStrategy, updateAccessOrder, persistToStorage, evictIfNeeded])

  // Invalidate cache entries by pattern
  const invalidate = useCallback(async (pattern: string): Promise<void> => {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    const keysToDelete: string[] = []

    // Find matching keys
    for (const key of cacheRef.current.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    }

    // Delete matching entries
    keysToDelete.forEach(key => {
      const entry = cacheRef.current.get(key)
      cacheRef.current.delete(key)
      
      const index = accessOrderRef.current.indexOf(key)
      if (index > -1) {
        accessOrderRef.current.splice(index, 1)
      }

      // Remove from SessionStorage
      if (entry?.isPersistent) {
        try {
          sessionStorage.removeItem(SESSION_STORAGE_PREFIX + key)
        } catch {
          // Ignore errors
        }
      }

      // Broadcast invalidation to other tabs
      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.postMessage({
            type: 'cache_invalidate',
            key
          })
        } catch {
          // Ignore broadcast errors
        }
      }
    })

    // Update stats
    statsRef.current.entryCount = cacheRef.current.size
    statsRef.current.totalSize = Array.from(cacheRef.current.values())
      .reduce((total, entry) => total + entry.size, 0)
  }, [])

  // Get cache statistics
  const getStats = useCallback((): CacheStats => {
    const total = statsRef.current.hits + statsRef.current.misses
    return {
      ...statsRef.current,
      hitRate: total > 0 ? statsRef.current.hits / total : 0
    }
  }, [])

  return {
    get,
    set,
    invalidate,
    getStats
  }
}