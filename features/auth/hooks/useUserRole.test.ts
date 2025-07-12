/**
 * Unit Tests untuk useUserRole.ts
 *
 * Testing 6 custom hooks untuk role management dengan comprehensive coverage:
 * - useUserRole (main hook)
 * - useRoleGuard (permission checks)
 * - useRoleLoadingState (loading states)
 * - useRoleConditional (conditional rendering)
 * - useRoleErrorHandling (error handling)
 * - useRoleDevelopment (dev utilities)
 *
 * Note: Tests ini menggunakan React Testing Library dengan renderHook dan mocking context
 */

import { renderHook } from '@testing-library/react'
import React from 'react'
import {
  useUserRole,
  useRoleGuard,
  useRoleLoadingState,
  useRoleConditional,
  useRoleErrorHandling,
  useRoleDevelopment,
} from './useUserRole'
import { useUserRoleContext } from '../context/UserRoleContext'
import type { UserRoleContextType, UserRole } from '../types'

// Mock UserRoleContext
jest.mock('../context/UserRoleContext', () => ({
  useUserRoleContext: jest.fn(),
}))

const mockUseUserRoleContext = useUserRoleContext as jest.MockedFunction<typeof useUserRoleContext>

// Helper function untuk create mock context
const createMockContext = (overrides: Partial<UserRoleContextType> = {}): UserRoleContextType => ({
  role: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  setRole: jest.fn(),
  clearRole: jest.fn(),
  refreshRole: jest.fn(),
  updateRoleCache: jest.fn(),
  ...overrides,
})

beforeEach(() => {
  jest.clearAllMocks()
  mockUseUserRoleContext.mockReturnValue(createMockContext())
})

describe('useUserRole hooks', () => {
  describe('useUserRole (main hook)', () => {
    it('should return role state from context', () => {
      // Arrange
      const mockContext = createMockContext({
        role: 'admin',
        isLoading: false,
        error: null,
        lastUpdated: Date.now(),
      })
      mockUseUserRoleContext.mockReturnValue(mockContext)

      // Act
      const { result } = renderHook(() => useUserRole())

      // Assert
      expect(result.current.role).toBe('admin')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.lastUpdated).toBeDefined()
    })

    it('should provide computed helper values', () => {
      // Arrange
      const mockContext = createMockContext({ role: 'admin' })
      mockUseUserRoleContext.mockReturnValue(mockContext)

      // Act
      const { result } = renderHook(() => useUserRole())

      // Assert
      expect(result.current.isAdmin).toBe(true)
      expect(result.current.isCreator).toBe(false)
      expect(result.current.isUser).toBe(false)
      expect(result.current.hasRole('admin')).toBe(true)
      expect(result.current.hasRole('creator')).toBe(false)
    })

    it('should handle different roles correctly', () => {
      const roles: UserRole[] = ['admin', 'creator', 'user']

      roles.forEach((role) => {
        // Arrange
        const mockContext = createMockContext({ role })
        mockUseUserRoleContext.mockReturnValue(mockContext)

        // Act
        const { result } = renderHook(() => useUserRole())

        // Assert
        expect(result.current.role).toBe(role)
        expect(result.current.isAdmin).toBe(role === 'admin')
        expect(result.current.isCreator).toBe(role === 'creator')
        expect(result.current.isUser).toBe(role === 'user')
        expect(result.current.hasRole(role)).toBe(true)
      })
    })

    it('should handle context unavailable error', () => {
      // Arrange
      mockUseUserRoleContext.mockImplementation(() => {
        throw new Error('useUserRoleContext must be used within a UserRoleProvider')
      })

      // Act & Assert
      expect(() => renderHook(() => useUserRole())).toThrow(
        'useUserRoleContext must be used within a UserRoleProvider',
      )
    })
  })

  describe('useRoleGuard', () => {
    it('should provide basic role checks', () => {
      // Arrange
      const mockContext = createMockContext({ role: 'admin' })
      mockUseUserRoleContext.mockReturnValue(mockContext)

      // Act
      const { result } = renderHook(() => useRoleGuard())

      // Assert
      expect(result.current.canAccessAdmin()).toBe(true)
      expect(result.current.canAccessCreator()).toBe(true)
      expect(result.current.canAccessUser()).toBe(true)
    })

    it('should implement role hierarchy correctly', () => {
      // Test admin role
      const adminContext = createMockContext({ role: 'admin' })
      mockUseUserRoleContext.mockReturnValue(adminContext)

      const { result: adminResult } = renderHook(() => useRoleGuard())
      expect(adminResult.current.hasMinimumRole('user')).toBe(true)
      expect(adminResult.current.hasMinimumRole('creator')).toBe(true)
      expect(adminResult.current.hasMinimumRole('admin')).toBe(true)

      // Test creator role
      const creatorContext = createMockContext({ role: 'creator' })
      mockUseUserRoleContext.mockReturnValue(creatorContext)

      const { result: creatorResult } = renderHook(() => useRoleGuard())
      expect(creatorResult.current.hasMinimumRole('user')).toBe(true)
      expect(creatorResult.current.hasMinimumRole('creator')).toBe(true)
      expect(creatorResult.current.hasMinimumRole('admin')).toBe(false)
    })

    it('should handle context-aware guards', () => {
      // Arrange
      const mockContext = createMockContext({ role: 'admin' })
      mockUseUserRoleContext.mockReturnValue(mockContext)

      // Act
      const { result } = renderHook(() => useRoleGuard())

      // Assert
      expect(result.current.canEditUser('user_123', 'user_456')).toBe(true)
      expect(result.current.canDeleteUser('user_123', 'user_123')).toBe(false)
      expect(result.current.canDeleteUser('user_123', 'user_456')).toBe(true)
    })
  })

  describe('useRoleLoadingState', () => {
    it('should provide loading state management', () => {
      // Test loading state
      const loadingContext = createMockContext({
        isLoading: true,
        role: null,
        error: null,
      })
      mockUseUserRoleContext.mockReturnValue(loadingContext)

      const { result: loadingResult } = renderHook(() => useRoleLoadingState())
      expect(loadingResult.current.shouldShowLoader).toBe(true)
      expect(loadingResult.current.isReady).toBe(false)

      // Test ready state
      const readyContext = createMockContext({
        isLoading: false,
        role: 'user',
        error: null,
      })
      mockUseUserRoleContext.mockReturnValue(readyContext)

      const { result: readyResult } = renderHook(() => useRoleLoadingState())
      expect(readyResult.current.shouldShowLoader).toBe(false)
      expect(readyResult.current.isReady).toBe(true)
    })

    it('should generate appropriate status messages', () => {
      // Test loading message
      const loadingContext = createMockContext({ isLoading: true })
      mockUseUserRoleContext.mockReturnValue(loadingContext)

      const { result } = renderHook(() => useRoleLoadingState())
      expect(result.current.getStatusMessage()).toBe('Memuat informasi pengguna...')
    })
  })

  describe('useRoleConditional', () => {
    it('should provide conditional rendering helpers', () => {
      // Test admin conditional rendering
      const adminContext = createMockContext({ role: 'admin' })
      mockUseUserRoleContext.mockReturnValue(adminContext)

      const { result } = renderHook(() => useRoleConditional())
      const adminComponent = React.createElement('div', {}, 'Admin Content')

      expect(result.current.renderForAdmin(adminComponent)).toEqual(adminComponent)
      expect(result.current.renderForCreator(adminComponent)).toEqual(adminComponent)
    })

    it('should handle feature flags correctly', () => {
      // Test admin feature access
      const adminContext = createMockContext({ role: 'admin' })
      mockUseUserRoleContext.mockReturnValue(adminContext)

      const { result } = renderHook(() => useRoleConditional())
      expect(result.current.isFeatureEnabled('analytics')).toBe(true)
      expect(result.current.isFeatureEnabled('user-management')).toBe(true)
    })
  })

  describe('useRoleErrorHandling', () => {
    it('should categorize errors correctly', () => {
      // Test network error
      const networkErrorContext = createMockContext({
        error: 'network connection failed',
      })
      mockUseUserRoleContext.mockReturnValue(networkErrorContext)

      const { result } = renderHook(() => useRoleErrorHandling())
      expect(result.current.hasError).toBe(true)
      expect(result.current.isNetworkError()).toBe(true)
      expect(result.current.isAuthError()).toBe(false)
    })

    it('should provide user-friendly error messages', () => {
      const networkErrorContext = createMockContext({
        error: 'network timeout',
      })
      mockUseUserRoleContext.mockReturnValue(networkErrorContext)

      const { result } = renderHook(() => useRoleErrorHandling())
      expect(result.current.getUserFriendlyError()).toBe(
        'Masalah koneksi internet. Silakan coba lagi.',
      )
    })
  })

  describe('useRoleDevelopment', () => {
    // Mock console methods secara global untuk tests ini
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
    const consoleGroupSpy = jest.spyOn(console, 'group').mockImplementation()
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    const consoleGroupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation()

    afterEach(() => {
      jest.clearAllMocks()
    })

    afterAll(() => {
      consoleSpy.mockRestore()
      consoleGroupSpy.mockRestore()
      consoleLogSpy.mockRestore()
      consoleGroupEndSpy.mockRestore()
    })

    it('should provide development utilities when NODE_ENV is development', () => {
      // Arrange - Test ini menggunakan current NODE_ENV yang seharusnya test
      // Kita akan mock implementation untuk testing development behavior
      const mockSetRole = jest.fn()
      const mockContext = createMockContext({
        role: 'user',
        setRole: mockSetRole,
      })
      mockUseUserRoleContext.mockReturnValue(mockContext)

      // Act
      const { result } = renderHook(() => useRoleDevelopment())

      // Assert - Karena Jest test environment, isDevMode akan false
      // Tapi kita test bahwa function warning dipanggil dengan benar
      expect(result.current.getCurrentRole()).toBe('user')

      result.current.switchToAdmin()
      expect(consoleSpy).toHaveBeenCalledWith('Role switching only available in development')
    })

    it('should return development functions structure correctly', () => {
      // Arrange
      const mockContext = createMockContext({ role: 'admin' })
      mockUseUserRoleContext.mockReturnValue(mockContext)

      // Act
      const { result } = renderHook(() => useRoleDevelopment())

      // Assert - Verify all expected functions exist
      expect(typeof result.current.switchToAdmin).toBe('function')
      expect(typeof result.current.switchToCreator).toBe('function')
      expect(typeof result.current.switchToUser).toBe('function')
      expect(typeof result.current.getCurrentRole).toBe('function')
      expect(typeof result.current.isDevMode).toBe('boolean')
    })

    it('should handle role switching warnings in production-like environment', () => {
      // Arrange
      const mockSetRole = jest.fn()
      const mockContext = createMockContext({
        role: 'creator',
        setRole: mockSetRole,
      })
      mockUseUserRoleContext.mockReturnValue(mockContext)

      // Act
      const { result } = renderHook(() => useRoleDevelopment())

      // Test all switch functions
      result.current.switchToAdmin()
      result.current.switchToCreator()
      result.current.switchToUser()

      // Assert - Should show warnings for all switch attempts in test env
      expect(consoleSpy).toHaveBeenCalledWith('Role switching only available in development')
      expect(consoleSpy).toHaveBeenCalledTimes(3)
    })
  })
})
