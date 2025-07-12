/**
 * User Role Management Types
 *
 * Types untuk sistem Role-Based Access Control (RBAC)
 * yang terintegrasi dengan Clerk authentication
 */

// Core Role Types
export type UserRole = 'admin' | 'creator' | 'user'

// Role State Interface
export interface UserRoleState {
  role: UserRole | null
  isLoading: boolean
  error: string | null
  lastUpdated: number | null
}

// Role Context Actions
export interface UserRoleActions {
  setRole: (role: UserRole) => void
  clearRole: () => void
  refreshRole: () => Promise<void>
  updateRoleCache: (role: UserRole, timestamp: number) => void
}

// Combined Context Type
export interface UserRoleContextType extends UserRoleState, UserRoleActions {}

// Clerk Session Token Payload (relevant parts)
export interface ClerkTokenPayload {
  sub: string // user ID
  role?: UserRole // custom claim
  iss: string // issuer
  exp: number // expiration
  iat: number // issued at
  [key: string]: unknown // other claims
}

// Role Cache Interface
export interface RoleCache {
  role: UserRole
  timestamp: number
  ttl: number // time to live in milliseconds
}

// Error Types
export interface RoleError {
  code: 'TOKEN_INVALID' | 'SESSION_NOT_FOUND' | 'NETWORK_ERROR' | 'PARSING_ERROR' | 'UNKNOWN_ERROR'
  message: string
  timestamp: number
}

// Hook Return Type
export interface UseUserRoleReturn extends UserRoleState, UserRoleActions {
  isAdmin: boolean
  isCreator: boolean
  isUser: boolean
  hasRole: (role: UserRole) => boolean
}

// Development Mode Types
export interface DevModeConfig {
  enabled: boolean
  mockRole?: UserRole
  allowRoleSwitching: boolean
}

// Concurrent Session Sync
export interface RoleSyncMessage {
  type: 'ROLE_UPDATED' | 'ROLE_CLEARED' | 'SESSION_INVALIDATED'
  role?: UserRole
  timestamp: number
  source: string // tab identifier
}

// Provider Props
export interface UserRoleProviderProps {
  children: React.ReactNode
  devMode?: DevModeConfig
  cacheConfig?: {
    ttl: number // cache TTL in milliseconds
    enableSessionStorage: boolean
  }
}

// Utility Types
export type RoleGuard = (userRole: UserRole | null) => boolean
export type RoleValidator = (role: unknown) => role is UserRole
