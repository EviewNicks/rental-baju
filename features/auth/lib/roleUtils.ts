/**
 * Role Management Utilities
 *
 * Utility functions untuk parsing JWT tokens, validasi role,
 * dan error handling dengan designing-for-failure principles
 */

import type { UserRole, ClerkTokenPayload, RoleError, RoleCache } from '../types'

// Constants
export const DEFAULT_ROLE: UserRole = 'user'
export const ROLE_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
export const SESSION_STORAGE_KEY = 'maguru_user_role_cache'
export const BROADCAST_CHANNEL_NAME = 'maguru_role_sync'

/**
 * Type guard untuk validasi UserRole
 */
export const isValidRole: (role: unknown) => role is UserRole = (role): role is UserRole => {
  return typeof role === 'string' && ['admin', 'creator', 'user'].includes(role)
}

/**
 * Parse JWT token secara aman dengan error handling
 */
export const parseJWT = (token: string): ClerkTokenPayload | null => {
  try {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token format')
    }

    // Split JWT token
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format')
    }

    // Decode payload (base64url)
    const payload = parts[1]
    const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const parsedPayload = JSON.parse(decodedPayload) as ClerkTokenPayload

    // Validate required claims
    if (!parsedPayload.sub || !parsedPayload.iss || !parsedPayload.exp) {
      throw new Error('Missing required JWT claims')
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000)
    if (parsedPayload.exp < now) {
      throw new Error('Token expired')
    }

    return parsedPayload
  } catch (error) {
    console.error('JWT parsing error:', error)
    return null
  }
}

/**
 * Ekstrak role dari JWT payload dengan fallback
 */
export const extractRoleFromPayload = (payload: ClerkTokenPayload): UserRole => {
  const { role } = payload

  if (isValidRole(role)) {
    return role
  }

  // Fallback ke default role jika invalid
  return DEFAULT_ROLE
}

/**
 * Validate dan ekstrak role dari JWT token
 */
export const getRoleFromToken = (token: string): UserRole => {
  try {
    const payload = parseJWT(token)
    if (!payload) {
      return DEFAULT_ROLE
    }

    return extractRoleFromPayload(payload)
  } catch (error) {
    console.error('Error getting role from token:', error)
    return DEFAULT_ROLE
  }
}

/**
 * Create standardized error object
 */
export const createRoleError = (
  code: RoleError['code'],
  message: string,
  originalError?: Error,
): RoleError => {
  console.error(`Role Error [${code}]:`, message, originalError)

  return {
    code,
    message,
    timestamp: Date.now(),
  }
}

/**
 * Role cache management dengan TTL
 */
export class RoleCacheManager {
  private static instance: RoleCacheManager
  private cache: Map<string, RoleCache> = new Map()

  public static getInstance(): RoleCacheManager {
    if (!RoleCacheManager.instance) {
      RoleCacheManager.instance = new RoleCacheManager()
    }
    return RoleCacheManager.instance
  }

  /**
   * Set role dalam cache dengan TTL
   */
  setRole(userId: string, role: UserRole, ttl: number = ROLE_CACHE_TTL): void {
    const timestamp = Date.now()
    this.cache.set(userId, {
      role,
      timestamp,
      ttl,
    })

    // Optional: save to sessionStorage
    this.saveToSessionStorage(userId, role, timestamp, ttl)
  }

  /**
   * Get role dari cache dengan TTL check
   */
  getRole(userId: string): UserRole | null {
    const cached = this.cache.get(userId)

    if (!cached) {
      // Try to load from sessionStorage
      return this.loadFromSessionStorage(userId)
    }

    // Check if cache expired
    const now = Date.now()
    if (now > cached.timestamp + cached.ttl) {
      this.cache.delete(userId)
      this.removeFromSessionStorage(userId)
      return null
    }

    return cached.role
  }

  /**
   * Clear role cache
   */
  clearRole(userId: string): void {
    this.cache.delete(userId)
    this.removeFromSessionStorage(userId)
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear()
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }

  /**
   * Save to sessionStorage (browser only)
   */
  private saveToSessionStorage(
    userId: string,
    role: UserRole,
    timestamp: number,
    ttl: number,
  ): void {
    if (typeof window === 'undefined') return

    try {
      const cacheData = {
        [userId]: { role, timestamp, ttl },
      }

      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(cacheData))
    } catch (error) {
      console.error('Failed to save role cache to sessionStorage:', error)
    }
  }

  /**
   * Load from sessionStorage (browser only)
   */
  private loadFromSessionStorage(userId: string): UserRole | null {
    if (typeof window === 'undefined') return null

    try {
      const cached = sessionStorage.getItem(SESSION_STORAGE_KEY)
      if (!cached) return null

      const cacheData = JSON.parse(cached)
      const userCache = cacheData[userId]

      if (!userCache) return null

      // Check TTL
      const now = Date.now()
      if (now > userCache.timestamp + userCache.ttl) {
        this.removeFromSessionStorage(userId)
        return null
      }

      return isValidRole(userCache.role) ? userCache.role : null
    } catch (error) {
      console.error('Failed to load role cache from sessionStorage:', error)
      return null
    }
  }

  /**
   * Remove from sessionStorage
   */
  private removeFromSessionStorage(userId: string): void {
    if (typeof window === 'undefined') return

    try {
      const cached = sessionStorage.getItem(SESSION_STORAGE_KEY)
      if (!cached) return

      const cacheData = JSON.parse(cached)
      delete cacheData[userId]

      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(cacheData))
    } catch (error) {
      console.error('Failed to remove role cache from sessionStorage:', error)
    }
  }
}

/**
 * Cross-tab sync utilities using BroadcastChannel
 */
export class RoleSyncManager {
  private static instance: RoleSyncManager
  private channel: BroadcastChannel | null = null
  private listeners: Array<(role: UserRole | null) => void> = []

  public static getInstance(): RoleSyncManager {
    if (!RoleSyncManager.instance) {
      RoleSyncManager.instance = new RoleSyncManager()
    }
    return RoleSyncManager.instance
  }

  /**
   * Initialize BroadcastChannel untuk cross-tab sync
   */
  init(): void {
    if (typeof window === 'undefined') return

    try {
      this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
      this.channel.addEventListener('message', this.handleMessage.bind(this))
    } catch (error) {
      console.error('Failed to initialize BroadcastChannel:', error)
    }
  }

  /**
   * Broadcast role update ke tabs lain
   */
  broadcastRoleUpdate(role: UserRole | null): void {
    if (!this.channel) return

    try {
      this.channel.postMessage({
        type: role ? 'ROLE_UPDATED' : 'ROLE_CLEARED',
        role,
        timestamp: Date.now(),
        source: this.generateTabId(),
      })
    } catch (error) {
      console.error('Failed to broadcast role update:', error)
    }
  }

  /**
   * Subscribe ke role changes dari tabs lain
   */
  subscribe(listener: (role: UserRole | null) => void): () => void {
    this.listeners.push(listener)

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  /**
   * Handle messages dari BroadcastChannel
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const { type, role, source } = event.data

      // Ignore messages from same tab
      if (source === this.generateTabId()) return

      if (type === 'ROLE_UPDATED' || type === 'ROLE_CLEARED') {
        this.listeners.forEach((listener) => {
          listener(role || null)
        })
      }
    } catch (error) {
      console.error('Error handling BroadcastChannel message:', error)
    }
  }

  /**
   * Generate unique tab identifier
   */
  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.channel) {
      this.channel.close()
      this.channel = null
    }
    this.listeners = []
  }
}

/**
 * Retry function dengan exponential backoff
 */
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> => {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      if (attempt === maxRetries) {
        throw lastError
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

/**
 * Debounce function untuk role fetching
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
