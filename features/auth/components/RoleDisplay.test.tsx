/**
 * Unit Tests untuk RoleDisplay.tsx
 *
 * Testing React component untuk displaying role information dan demo functionality:
 * - Component rendering dengan berbagai states
 * - User interactions (buttons, refresh, retry)
 * - Permission examples display
 * - Feature flags status
 * - Conditional content rendering
 *
 * Note: Tests ini menggunakan React Testing Library dengan proper mocking
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { RoleDisplay } from './RoleDisplay'
import * as hooks from '../hooks/useUserRole'
import type { UserRole } from '../types'

// Mock all useUserRole hooks
jest.mock('../hooks/useUserRole', () => ({
  useUserRole: jest.fn(),
  useRoleGuard: jest.fn(),
  useRoleLoadingState: jest.fn(),
  useRoleConditional: jest.fn(),
  useRoleErrorHandling: jest.fn(),
}))

// Define proper types for mock overrides
interface MockOverrides {
  useUserRole?: Partial<ReturnType<typeof hooks.useUserRole>>
  useRoleGuard?: Partial<ReturnType<typeof hooks.useRoleGuard>>
  useRoleLoadingState?: Partial<ReturnType<typeof hooks.useRoleLoadingState>>
  useRoleConditional?: Partial<ReturnType<typeof hooks.useRoleConditional>>
  useRoleErrorHandling?: Partial<ReturnType<typeof hooks.useRoleErrorHandling>>
}

// Helper function untuk create mock hook returns
const createMockHookReturns = (overrides: MockOverrides = {}) => {
  const defaultReturns = {
    useUserRole: {
      role: 'user' as UserRole,
      isAdmin: false,
      isCreator: false,
      isUser: true,
      refreshRole: jest.fn(),
    },
    useRoleGuard: {
      canAccessAdmin: jest.fn(() => false),
      canManageUsers: jest.fn(() => false),
      canCreateContent: jest.fn(() => false),
      canAccessDashboard: jest.fn(() => false),
      canAccessAnalytics: jest.fn(() => false),
    },
    useRoleLoadingState: {
      isLoading: false,
      shouldShowLoader: false,
      getStatusMessage: jest.fn(() => 'Role aktif: user'),
    },
    useRoleConditional: {
      renderForAdmin: jest.fn(() => null),
      renderForCreator: jest.fn(() => null),
      isFeatureEnabled: jest.fn(() => false),
    },
    useRoleErrorHandling: {
      hasError: false,
      getUserFriendlyError: jest.fn(() => null),
      retryRoleFetch: jest.fn(),
    },
  }

  // Deep merge overrides dengan defaults
  const mergedReturns = {
    useUserRole: { ...defaultReturns.useUserRole, ...overrides.useUserRole },
    useRoleGuard: { ...defaultReturns.useRoleGuard, ...overrides.useRoleGuard },
    useRoleLoadingState: {
      ...defaultReturns.useRoleLoadingState,
      ...overrides.useRoleLoadingState,
    },
    useRoleConditional: { ...defaultReturns.useRoleConditional, ...overrides.useRoleConditional },
    useRoleErrorHandling: {
      ...defaultReturns.useRoleErrorHandling,
      ...overrides.useRoleErrorHandling,
    },
  }

  // Setup mocks
  ;(hooks.useUserRole as jest.Mock).mockReturnValue(mergedReturns.useUserRole)
  ;(hooks.useRoleGuard as jest.Mock).mockReturnValue(mergedReturns.useRoleGuard)
  ;(hooks.useRoleLoadingState as jest.Mock).mockReturnValue(mergedReturns.useRoleLoadingState)
  ;(hooks.useRoleConditional as jest.Mock).mockReturnValue(mergedReturns.useRoleConditional)
  ;(hooks.useRoleErrorHandling as jest.Mock).mockReturnValue(mergedReturns.useRoleErrorHandling)

  return mergedReturns
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('RoleDisplay', () => {
  describe('Component Rendering', () => {
    it('should render loading state correctly', () => {
      // Arrange
      createMockHookReturns({
        useRoleLoadingState: {
          isLoading: true,
          shouldShowLoader: true,
          getStatusMessage: jest.fn(() => 'Memuat informasi pengguna...'),
        },
      })

      // Act
      const { container } = render(<RoleDisplay />)

      // Assert - Look for loading skeleton element with CSS class
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
      expect(screen.queryByText('Informasi Role')).not.toBeInTheDocument()
    })

    it('should render error state with retry button', () => {
      // Arrange
      const mockRetryRoleFetch = jest.fn()
      createMockHookReturns({
        useRoleLoadingState: {
          shouldShowLoader: false,
        },
        useRoleErrorHandling: {
          hasError: true,
          getUserFriendlyError: jest.fn(() => 'Masalah koneksi internet. Silakan coba lagi.'),
          retryRoleFetch: mockRetryRoleFetch,
        },
      })

      // Act
      render(<RoleDisplay />)

      // Assert
      expect(screen.getByText('Error Role Management')).toBeInTheDocument()
      expect(screen.getByText('Masalah koneksi internet. Silakan coba lagi.')).toBeInTheDocument()

      const retryButton = screen.getByText('Coba Lagi')
      expect(retryButton).toBeInTheDocument()

      // Test retry button functionality
      fireEvent.click(retryButton)
      expect(mockRetryRoleFetch).toHaveBeenCalled()
    })

    it('should display role information correctly for admin', () => {
      // Arrange
      createMockHookReturns({
        useUserRole: {
          role: 'admin',
          isAdmin: true,
          isCreator: false,
          isUser: false,
          refreshRole: jest.fn(),
        },
        useRoleLoadingState: {
          getStatusMessage: jest.fn(() => 'Role aktif: admin'),
        },
      })

      // Act
      render(<RoleDisplay />)

      // Assert
      expect(screen.getByText('Informasi Role')).toBeInTheDocument()
      expect(screen.getByText('admin')).toBeInTheDocument()
      expect(screen.getByText('Role aktif: admin')).toBeInTheDocument()

      // Check role flags
      const adminFlags = screen.getAllByText('✓')
      expect(adminFlags).toHaveLength(1) // Only admin should be checked

      const nonAdminFlags = screen.getAllByText('✗')
      expect(nonAdminFlags).toHaveLength(2) // Creator and User should be unchecked
    })

    it('should display role information correctly for creator', () => {
      // Arrange
      createMockHookReturns({
        useUserRole: {
          role: 'creator',
          isAdmin: false,
          isCreator: true,
          isUser: false,
          refreshRole: jest.fn(),
        },
        useRoleLoadingState: {
          getStatusMessage: jest.fn(() => 'Role aktif: creator'),
        },
      })

      // Act
      render(<RoleDisplay />)

      // Assert
      expect(screen.getByText('creator')).toBeInTheDocument()
      expect(screen.getByText('Role aktif: creator')).toBeInTheDocument()
    })

    it('should display role information correctly for user', () => {
      // Arrange
      createMockHookReturns({
        useUserRole: {
          role: 'user',
          isAdmin: false,
          isCreator: false,
          isUser: true,
          refreshRole: jest.fn(),
        },
        useRoleLoadingState: {
          getStatusMessage: jest.fn(() => 'Role aktif: user'),
        },
      })

      // Act
      render(<RoleDisplay />)

      // Assert
      expect(screen.getByText('user')).toBeInTheDocument()
      expect(screen.getByText('Role aktif: user')).toBeInTheDocument()
    })

    it('should show role status and flags correctly', () => {
      // Arrange
      createMockHookReturns({
        useUserRole: {
          role: 'admin',
          isAdmin: true,
          isCreator: false,
          isUser: false,
        },
        useRoleLoadingState: {
          getStatusMessage: jest.fn(() => 'Role aktif: admin'),
        },
      })

      // Act
      render(<RoleDisplay />)

      // Assert
      expect(screen.getByText('Role aktif: admin')).toBeInTheDocument()

      // Check admin flag is checked
      const roleSection = screen.getByText('Admin:').parentElement
      expect(roleSection).toContainHTML('✓')

      // Check creator flag is unchecked
      const creatorSection = screen.getByText('Creator:').parentElement
      expect(creatorSection).toContainHTML('✗')
    })
  })

  describe('User Interactions', () => {
    it('should handle refresh role button', async () => {
      // Arrange
      const mockRefreshRole = jest.fn()
      createMockHookReturns({
        useUserRole: {
          role: 'user',
          refreshRole: mockRefreshRole,
        },
        useRoleLoadingState: {
          isLoading: false,
          shouldShowLoader: false,
          getStatusMessage: jest.fn(() => 'Role aktif: user'),
        },
      })

      // Act
      render(<RoleDisplay />)
      const refreshButton = screen.getByText('Refresh Role')
      fireEvent.click(refreshButton)

      // Assert
      expect(mockRefreshRole).toHaveBeenCalled()
    })

    it('should disable refresh button when loading', () => {
      // Arrange
      createMockHookReturns({
        useRoleLoadingState: {
          isLoading: true,
          shouldShowLoader: false,
          getStatusMessage: jest.fn(() => 'Loading...'),
        },
      })

      // Act
      render(<RoleDisplay />)
      const refreshButton = screen.getByText('Refreshing...')

      // Assert
      expect(refreshButton).toBeDisabled()
    })

    it('should handle retry on error', () => {
      // Arrange
      const mockRetryRoleFetch = jest.fn()
      createMockHookReturns({
        useRoleErrorHandling: {
          hasError: true,
          getUserFriendlyError: jest.fn(() => 'Masalah koneksi internet. Silakan coba lagi.'),
          retryRoleFetch: mockRetryRoleFetch,
        },
      })

      // Act
      render(<RoleDisplay />)
      const retryButton = screen.getByText('Coba Lagi')
      fireEvent.click(retryButton)

      // Assert
      expect(mockRetryRoleFetch).toHaveBeenCalled()
    })
  })

  describe('Permission Examples Display', () => {
    it('should display permission examples correctly for admin', () => {
      // Arrange
      createMockHookReturns({
        useUserRole: {
          role: 'admin',
        },
        useRoleGuard: {
          canAccessAdmin: jest.fn(() => true),
          canManageUsers: jest.fn(() => true),
          canCreateContent: jest.fn(() => true),
          canAccessDashboard: jest.fn(() => true),
          canAccessAnalytics: jest.fn(() => true),
        },
      })

      // Act
      render(<RoleDisplay />)

      // Assert
      expect(screen.getByText('Permission Examples')).toBeInTheDocument()
      expect(screen.getByText('Akses Admin Panel')).toBeInTheDocument()
      expect(screen.getByText('Kelola Pengguna')).toBeInTheDocument()
      expect(screen.getByText('Buat Konten')).toBeInTheDocument()
      expect(screen.getByText('Akses Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Lihat Analytics')).toBeInTheDocument()

      // All permissions should be "Diizinkan" untuk admin
      const allowedPermissions = screen.getAllByText('Diizinkan')
      expect(allowedPermissions).toHaveLength(5)
    })

    it('should display permission examples correctly for user', () => {
      // Arrange
      createMockHookReturns({
        useUserRole: {
          role: 'user',
        },
        useRoleGuard: {
          canAccessAdmin: jest.fn(() => false),
          canManageUsers: jest.fn(() => false),
          canCreateContent: jest.fn(() => false),
          canAccessDashboard: jest.fn(() => false),
          canAccessAnalytics: jest.fn(() => false),
        },
      })

      // Act
      render(<RoleDisplay />)

      // Assert
      const deniedPermissions = screen.getAllByText('Ditolak')
      expect(deniedPermissions).toHaveLength(5) // All should be denied for regular user
    })
  })

  describe('Feature Flags Status', () => {
    it('should show feature flags status correctly for admin', () => {
      // Arrange
      createMockHookReturns({
        useUserRole: {
          role: 'admin',
        },
        useRoleConditional: {
          renderForAdmin: jest.fn(() => null),
          renderForCreator: jest.fn(() => null),
          isFeatureEnabled: jest.fn((feature) => {
            const adminFeatures = [
              'analytics',
              'content-management',
              'user-management',
              'dashboard',
            ]
            return adminFeatures.includes(feature)
          }),
        },
      })

      // Act
      render(<RoleDisplay />)

      // Assert
      expect(screen.getByText('Feature Access')).toBeInTheDocument()
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Content Management')).toBeInTheDocument()
      expect(screen.getByText('User Management')).toBeInTheDocument()
      expect(screen.getByText('Main Dashboard')).toBeInTheDocument()

      // Check that features are enabled
      const activeFeatures = screen.getAllByText('Aktif')
      expect(activeFeatures).toHaveLength(4) // All admin features should be active
    })

    it('should show feature flags status correctly for user', () => {
      // Arrange
      createMockHookReturns({
        useUserRole: {
          role: 'user',
        },
        useRoleConditional: {
          renderForAdmin: jest.fn(() => null),
          renderForCreator: jest.fn(() => null),
          isFeatureEnabled: jest.fn(() => false), // No features enabled for regular user
        },
      })

      // Act
      render(<RoleDisplay />)

      // Assert
      const inactiveFeatures = screen.getAllByText('Nonaktif')
      expect(inactiveFeatures).toHaveLength(4) // All features should be inactive
    })
  })

  describe('Conditional Content Rendering', () => {
    it('should render role-specific content for admin', () => {
      // Arrange
      createMockHookReturns({
        useUserRole: {
          role: 'admin',
        },
        useRoleConditional: {
          renderForAdmin: jest.fn((component) => component),
          renderForCreator: jest.fn((component) => component),
          isFeatureEnabled: jest.fn(() => true),
        },
      })

      // Act
      render(<RoleDisplay />)

      // Assert
      expect(screen.getByText('Conditional Content')).toBeInTheDocument()
      expect(screen.getByText('Admin-Only Content')).toBeInTheDocument()
      expect(screen.getByText('Creator Content')).toBeInTheDocument()
      expect(screen.getByText('Public Content')).toBeInTheDocument()
    })

    it('should render role-specific content for creator', () => {
      // Arrange
      createMockHookReturns({
        useUserRole: {
          role: 'creator',
        },
        useRoleConditional: {
          renderForAdmin: jest.fn(() => null), // Admin content hidden
          renderForCreator: jest.fn((component) => component),
          isFeatureEnabled: jest.fn(() => true),
        },
      })

      // Act
      render(<RoleDisplay />)

      // Assert
      expect(screen.queryByText('Admin-Only Content')).not.toBeInTheDocument()
      expect(screen.getByText('Creator Content')).toBeInTheDocument()
      expect(screen.getByText('Public Content')).toBeInTheDocument()
    })

    it('should display public content for all users', () => {
      // Arrange
      createMockHookReturns({
        useUserRole: {
          role: 'user',
        },
        useRoleConditional: {
          renderForAdmin: jest.fn(() => null),
          renderForCreator: jest.fn(() => null),
          isFeatureEnabled: jest.fn(() => true),
        },
      })

      // Act
      render(<RoleDisplay />)

      // Assert
      expect(screen.queryByText('Admin-Only Content')).not.toBeInTheDocument()
      expect(screen.queryByText('Creator Content')).not.toBeInTheDocument()
      expect(screen.getByText('Public Content')).toBeInTheDocument()
    })
  })

  describe('Helper Components', () => {
    it('should render PermissionItem with correct allowed state', () => {
      // Arrange
      createMockHookReturns({
        useRoleGuard: {
          canAccessAdmin: jest.fn(() => true),
          canManageUsers: jest.fn(() => false),
          canCreateContent: jest.fn(() => false),
          canAccessDashboard: jest.fn(() => false),
          canAccessAnalytics: jest.fn(() => false),
        },
      })

      // Act
      render(<RoleDisplay />)

      // Assert
      const adminPermission = screen.getByText('Akses Admin Panel').parentElement
      expect(adminPermission).toContainHTML('Diizinkan')
    })

    it('should render PermissionItem with correct denied state', () => {
      // Arrange
      createMockHookReturns({
        useRoleGuard: {
          canAccessAdmin: jest.fn(() => false),
          canManageUsers: jest.fn(() => false),
          canCreateContent: jest.fn(() => false),
          canAccessDashboard: jest.fn(() => false),
          canAccessAnalytics: jest.fn(() => false),
        },
      })

      // Act
      render(<RoleDisplay />)

      // Assert
      const adminPermission = screen.getByText('Akses Admin Panel').parentElement
      expect(adminPermission).toContainHTML('Ditolak')
    })

    it('should render FeatureFlag with correct enabled state', () => {
      // Arrange
      createMockHookReturns({
        useRoleConditional: {
          renderForAdmin: jest.fn(() => null),
          renderForCreator: jest.fn(() => null),
          isFeatureEnabled: jest.fn((feature) => feature === 'analytics'),
        },
      })

      // Act
      render(<RoleDisplay />)

      // Assert
      // Check untuk analytics yang enabled
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Aktif')).toBeInTheDocument()

      // Check untuk user management yang disabled
      expect(screen.getByText('User Management')).toBeInTheDocument()
      const nonaktifElements = screen.getAllByText('Nonaktif')
      expect(nonaktifElements.length).toBeGreaterThan(0) // Pastikan ada elements nonaktif
    })
  })
})
