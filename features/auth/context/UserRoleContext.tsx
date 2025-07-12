'use client'

/**
 * User Role Context Provider
 *
 * React Context untuk mengelola user role state dengan:
 * - Error boundary untuk graceful failure handling
 * - Cross-tab synchronization
 * - Caching dengan TTL
 * - Development mode support
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
} from 'react'
import { useAuth, useSession } from '@clerk/nextjs'
import type { UserRoleContextType, UserRoleState, UserRoleProviderProps, UserRole } from '../types'
import {
  getRoleFromToken,
  createRoleError,
  RoleCacheManager,
  RoleSyncManager,
  DEFAULT_ROLE,
  retryOperation,
  debounce,
} from '../lib/roleUtils'

/**
 * Action types untuk role reducer
 * Menggunakan discriminated union untuk type safety
 */
type RoleAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ROLE'; payload: UserRole }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ROLE' }
  | { type: 'UPDATE_CACHE'; payload: { role: UserRole; timestamp: number } }

/**
 * Initial state untuk role management
 * Default ke loading state sambil menunggu role fetching
 */
const initialState: UserRoleState = {
  role: null,
  isLoading: true,
  error: null,
  lastUpdated: null,
}

/**
 * Reducer untuk mengelola role state
 * Menggunakan immutable updates untuk predictable state changes
 *
 * @param state - Current role state
 * @param action - Action yang akan diproses
 * @returns New state berdasarkan action type
 */
const roleReducer = (state: UserRoleState, action: RoleAction): UserRoleState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ROLE':
      return {
        ...state,
        role: action.payload,
        isLoading: false,
        error: null,
        lastUpdated: Date.now(),
      }
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      }
    case 'CLEAR_ROLE':
      return {
        ...state,
        role: null,
        isLoading: false,
        error: null,
        lastUpdated: null,
      }
    case 'UPDATE_CACHE':
      return {
        ...state,
        role: action.payload.role,
        lastUpdated: action.payload.timestamp,
      }
    default:
      return state
  }
}

/**
 * React Context untuk role management
 * Undefined sebagai default untuk memaksa penggunaan dalam Provider
 */
const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined)

/**
 * Error Boundary Component untuk graceful error handling
 * Menangkap errors di role management dan menampilkan fallback UI
 * Sesuai dengan designing-for-failure principles
 */
class RoleErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Role management error:', error, errorInfo)
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}

/**
 * UserRoleProvider - Main provider component untuk role management
 *
 * Features:
 * - JWT token parsing dari Clerk session
 * - Caching dengan TTL untuk performance
 * - Cross-tab synchronization dengan BroadcastChannel
 * - Error boundary integration
 * - Development mode dengan role switcher
 * - Retry mechanism dengan exponential backoff
 *
 * @param children - Child components
 * @param devMode - Development mode configuration
 * @param cacheConfig - Cache configuration (TTL, sessionStorage)
 */
export function UserRoleProvider({
  children,
  devMode = { enabled: false, allowRoleSwitching: false },
  cacheConfig = { ttl: 5 * 60 * 1000, enableSessionStorage: true },
}: UserRoleProviderProps) {
  const [state, dispatch] = useReducer(roleReducer, initialState)
  const { isSignedIn, userId } = useAuth()
  const { session } = useSession()

  /**
   * Singleton instances untuk cache dan sync management
   * Menggunakan useMemo untuk memastikan instance yang sama across renders
   */
  const cacheManager = useMemo(() => RoleCacheManager.getInstance(), [])
  const syncManager = useMemo(() => RoleSyncManager.getInstance(), [])

  /**
   * Debounced role fetching function
   * Mencegah excessive API calls dengan 300ms debounce
   * Includes cache checking, retry mechanism, dan error handling
   */
  const debouncedFetchRole = useMemo(
    () =>
      debounce(async () => {
        if (!isSignedIn || !session || !userId) {
          dispatch({ type: 'CLEAR_ROLE' })
          return
        }

        try {
          dispatch({ type: 'SET_LOADING', payload: true })

          // Check cache first
          const cachedRole = cacheManager.getRole(userId)
          if (cachedRole) {
            dispatch({ type: 'SET_ROLE', payload: cachedRole })
            return
          }

          // Fetch role dari Clerk session dengan retry
          const role = await retryOperation(async () => {
            const token = await session.getToken()
            if (!token) {
              throw new Error('No session token available')
            }
            return getRoleFromToken(token)
          })

          // Update cache dan state
          cacheManager.setRole(userId, role, cacheConfig.ttl)
          dispatch({ type: 'SET_ROLE', payload: role })

          // Broadcast ke tabs lain
          syncManager.broadcastRoleUpdate(role)
        } catch (error) {
          const roleError = createRoleError(
            'SESSION_NOT_FOUND',
            'Failed to fetch user role',
            error as Error,
          )

          dispatch({ type: 'SET_ERROR', payload: roleError.message })

          // Fallback ke default role
          const fallbackRole = DEFAULT_ROLE
          dispatch({ type: 'SET_ROLE', payload: fallbackRole })

          // Cache fallback role dengan shorter TTL
          cacheManager.setRole(userId, fallbackRole, 60 * 1000) // 1 minute
        }
      }, 300),
    [isSignedIn, session, userId, cacheManager, syncManager, cacheConfig.ttl],
  )

  /**
   * Action functions untuk role management
   * Menggunakan useCallback untuk optimization dan dependency tracking
   */

  /**
   * Set role untuk user tertentu
   * Updates cache, state, dan broadcast ke tabs lain
   *
   * @param role - Role yang akan di-set
   */
  const setRole = useCallback(
    (role: UserRole) => {
      if (!userId) return

      cacheManager.setRole(userId, role, cacheConfig.ttl)
      dispatch({ type: 'SET_ROLE', payload: role })
      syncManager.broadcastRoleUpdate(role)
    },
    [userId, cacheManager, syncManager, cacheConfig.ttl],
  )

  /**
   * Clear role untuk user saat ini
   * Removes dari cache, clears state, dan notify tabs lain
   */
  const clearRole = useCallback(() => {
    if (!userId) return

    cacheManager.clearRole(userId)
    dispatch({ type: 'CLEAR_ROLE' })
    syncManager.broadcastRoleUpdate(null)
  }, [userId, cacheManager, syncManager])

  /**
   * Refresh role dari server
   * Clears cache dan fetch ulang dari Clerk session
   */
  const refreshRole = useCallback(async () => {
    if (!userId) return

    // Clear cache dan fetch ulang
    cacheManager.clearRole(userId)
    await debouncedFetchRole()
  }, [userId, cacheManager, debouncedFetchRole])

  /**
   * Update role cache manually
   * Used untuk sync dari cross-tab messages
   *
   * @param role - Role untuk update
   * @param timestamp - Timestamp update
   */
  const updateRoleCache = useCallback((role: UserRole, timestamp: number) => {
    dispatch({ type: 'UPDATE_CACHE', payload: { role, timestamp } })
  }, [])

  /**
   * Effects untuk lifecycle management
   */

  /**
   * Initialize sync manager dan setup cross-tab communication
   */
  useEffect(() => {
    // Initialize sync manager
    syncManager.init()

    // Subscribe ke cross-tab role changes
    const unsubscribe = syncManager.subscribe((role) => {
      if (role) {
        dispatch({ type: 'SET_ROLE', payload: role })
      } else {
        dispatch({ type: 'CLEAR_ROLE' })
      }
    })

    return () => {
      unsubscribe()
      syncManager.destroy()
    }
  }, [syncManager])

  /**
   * Fetch role saat auth state berubah
   */
  useEffect(() => {
    // Fetch role saat auth state berubah
    debouncedFetchRole()
  }, [debouncedFetchRole])

  /**
   * Development mode override untuk testing
   */
  useEffect(() => {
    // Development mode override
    if (devMode.enabled && devMode.mockRole) {
      dispatch({ type: 'SET_ROLE', payload: devMode.mockRole })
    }
  }, [devMode])

  /**
   * Memoized context value untuk performance optimization
   * Prevents unnecessary re-renders pada consumer components
   */
  const contextValue: UserRoleContextType = useMemo(
    () => ({
      ...state,
      setRole,
      clearRole,
      refreshRole,
      updateRoleCache,
    }),
    [state, setRole, clearRole, refreshRole, updateRoleCache],
  )

  /**
   * Fallback component untuk error boundary
   * Menampilkan pesan user-friendly saat terjadi error
   */
  const ErrorFallback = (
    <div className="role-error-fallback">
      <p>Role management tidak tersedia. Menggunakan role default: user</p>
    </div>
  )

  return (
    <RoleErrorBoundary fallback={ErrorFallback}>
      <UserRoleContext.Provider value={contextValue}>
        {children}
        {devMode.enabled && devMode.allowRoleSwitching && (
          <DevRoleSwitcher currentRole={state.role} onRoleChange={setRole} />
        )}
      </UserRoleContext.Provider>
    </RoleErrorBoundary>
  )
}

/**
 * Hook untuk menggunakan UserRole context
 * Throws error jika digunakan di luar UserRoleProvider
 *
 * @returns UserRoleContextType - Context value dengan state dan actions
 * @throws Error jika tidak dalam UserRoleProvider
 */
export function useUserRoleContext(): UserRoleContextType {
  const context = useContext(UserRoleContext)

  if (context === undefined) {
    throw new Error('useUserRoleContext must be used within a UserRoleProvider')
  }

  return context
}

/**
 * Helper function untuk mengecek apakah DevRoleSwitcher harus ditampilkan
 *
 * Kondisi untuk menampilkan DevRoleSwitcher:
 * 1. NODE_ENV harus 'development'
 * 2. Tidak sedang dalam mode testing Jest (NODE_ENV !== 'test')
 */
function shouldShowDevRoleSwitcher(): boolean {
  // Jangan tampilkan jika APP_ENV adalah production
  if (process.env.APP_ENV === 'prod') {
    return false
  }

  // Jangan tampilkan jika sedang testing (Jest atau Playwright)
  // if (process.env.APP_ENV === 'test') {
  //   return false
  // }

  // Hanya tampilkan jika NODE_ENV development
  return process.env.APP_ENV === 'dev'
}

/**
 * Development Role Switcher Component
 *
 * Komponen ini akan muncul hanya jika:
 * - APP_ENV = 'development'
 *
 * Provides UI untuk testing role transitions dalam development
 *
 * @param currentRole - Role saat ini
 * @param onRoleChange - Callback untuk change role
 */
function DevRoleSwitcher({
  currentRole,
  onRoleChange,
}: {
  currentRole: UserRole | null
  onRoleChange: (role: UserRole) => void
}) {
  // Check kondisi untuk menampilkan DevRoleSwitcher
  if (!shouldShowDevRoleSwitcher()) {
    return null
  }

  const roles: UserRole[] = ['admin', 'creator', 'user']

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg shadow-lg z-50">
      <div className="text-sm font-medium text-yellow-800 mb-2">Dev Mode: Role Switcher</div>
      <div className="text-xs text-yellow-700 mb-2">Current: {currentRole || 'null'}</div>
      <div className="text-xs text-yellow-600 mb-2">
        APP_ENV: {process.env.APP_ENV || 'undefined'}
      </div>
      <div className="flex gap-2">
        {roles.map((role) => (
          <button
            key={role}
            onClick={() => onRoleChange(role)}
            className={`px-2 py-1 text-xs rounded cursor-pointer ${
              currentRole === role
                ? 'bg-yellow-300 text-yellow-900'
                : 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'
            }`}
          >
            {role}
          </button>
        ))}
      </div>
    </div>
  )
}

// Export types untuk external usage
export type { UserRoleContextType, UserRoleState, UserRole }
