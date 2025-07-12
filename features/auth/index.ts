/**
 * Auth Feature Exports
 *
 * Centralized exports untuk features/auth module
 * Menyediakan clean interface untuk role management system
 */

// Main exports
export { UserRoleProvider, useUserRoleContext } from './context/UserRoleContext'
export { RoleDisplay } from './components/RoleDisplay'
export {
  useUserRole as default,
  useRoleGuard,
  useRoleLoadingState,
  useRoleDevelopment,
  useRoleConditional,
  useRoleErrorHandling,
} from './hooks/useUserRole'

// Types
export type {
  UserRole,
  UserRoleState,
  UserRoleContextType,
  UserRoleProviderProps,
  UseUserRoleReturn,
  DevModeConfig,
  RoleError,
  ClerkTokenPayload,
  RoleGuard,
  RoleValidator,
} from './types'

// Utilities
export {
  isValidRole,
  parseJWT,
  getRoleFromToken,
  extractRoleFromPayload,
  createRoleError,
  RoleCacheManager,
  RoleSyncManager,
  retryOperation,
  debounce,
  DEFAULT_ROLE,
  ROLE_CACHE_TTL,
  SESSION_STORAGE_KEY,
  BROADCAST_CHANNEL_NAME,
} from './lib/roleUtils'

// Re-export main hook as named export
export { useUserRole } from './hooks/useUserRole'
