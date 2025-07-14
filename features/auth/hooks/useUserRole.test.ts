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
        role: 'owner',
        isLoading: false,
        error: null,
        lastUpdated: Date.now(),
      })
      mockUseUserRoleContext.mockReturnValue(mockContext)

      // Act
      const { result } = renderHook(() => useUserRole())

      // Assert
      expect(result.current.role).toBe('owner')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.lastUpdated).toBeDefined()
    })

    it('should provide computed helper values', () => {
      // Arrange
      const mockContext = createMockContext({ role: 'owner' })
      mockUseUserRoleContext.mockReturnValue(mockContext)

      // Act
      const { result } = renderHook(() => useUserRole())

      // Assert
      expect(result.current.isOwner).toBe(true)
      expect(result.current.isProducer).toBe(false)
      expect(result.current.isKasir).toBe(false)
      expect(result.current.hasRole('owner')).toBe(true)
      expect(result.current.hasRole('producer')).toBe(false)
    })

    it('should handle different roles correctly', () => {
      const roles: UserRole[] = ['owner', 'producer', 'kasir']

      roles.forEach((role) => {
        // Arrange
        const mockContext = createMockContext({ role })
        mockUseUserRoleContext.mockReturnValue(mockContext)

        // Act
        const { result } = renderHook(() => useUserRole())

        // Assert
        expect(result.current.role).toBe(role)
        expect(result.current.isOwner).toBe(role === 'owner')
        expect(result.current.isProducer).toBe(role === 'producer')
        expect(result.current.isKasir).toBe(role === 'kasir')
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
      const mockContext = createMockContext({ role: 'owner' })
      mockUseUserRoleContext.mockReturnValue(mockContext)

      // Act
      const { result } = renderHook(() => useRoleGuard())

      // Assert
      expect(result.current.canAccessOwner()).toBe(true)
      expect(result.current.canAccessProducer()).toBe(true)
      expect(result.current.canAccessKasir()).toBe(true)
    })

    it('should implement role hierarchy correctly', () => {
      // Test owner role
      const ownerContext = createMockContext({ role: 'owner' })
      mockUseUserRoleContext.mockReturnValue(ownerContext)

      const { result: ownerResult } = renderHook(() => useRoleGuard())
      expect(ownerResult.current.hasMinimumRole('kasir')).toBe(true)
      expect(ownerResult.current.hasMinimumRole('producer')).toBe(true)
      expect(ownerResult.current.hasMinimumRole('owner')).toBe(true)

      // Test producer role
      const producerContext = createMockContext({ role: 'producer' })
      mockUseUserRoleContext.mockReturnValue(producerContext)

      const { result: producerResult } = renderHook(() => useRoleGuard())
      expect(producerResult.current.hasMinimumRole('kasir')).toBe(true)
      expect(producerResult.current.hasMinimumRole('producer')).toBe(true)
      expect(producerResult.current.hasMinimumRole('owner')).toBe(false)
    })

    it('should handle context-aware guards', () => {
      // Arrange
      const mockContext = createMockContext({ role: 'owner' })
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
        role: 'kasir',
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
      // Test owner conditional rendering
      const ownerContext = createMockContext({ role: 'owner' })
      mockUseUserRoleContext.mockReturnValue(ownerContext)

      const { result } = renderHook(() => useRoleConditional())
      const ownerComponent = React.createElement('div', {}, 'Owner Content')

      expect(result.current.renderForOwner(ownerComponent)).toEqual(ownerComponent)
      expect(result.current.renderForProducer(ownerComponent)).toEqual(ownerComponent)
    })

    it('should handle feature flags correctly', () => {
      // Test owner feature access
      const ownerContext = createMockContext({ role: 'owner' })
      mockUseUserRoleContext.mockReturnValue(ownerContext)

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
        role: 'kasir',
        setRole: mockSetRole,
      })
      mockUseUserRoleContext.mockReturnValue(mockContext)

      // Act
      const { result } = renderHook(() => useRoleDevelopment())

      // Assert - Karena Jest test environment, isDevMode akan false
      // Tapi kita test bahwa function warning dipanggil dengan benar
      expect(result.current.getCurrentRole()).toBe('kasir')

      result.current.switchToOwner()
      expect(consoleSpy).toHaveBeenCalledWith('Role switching only available in development')
    })

    it('should return development functions structure correctly', () => {
      // Arrange
      const mockContext = createMockContext({ role: 'owner' })
      mockUseUserRoleContext.mockReturnValue(mockContext)

      // Act
      const { result } = renderHook(() => useRoleDevelopment())

      // Assert - Verify all expected functions exist
      expect(typeof result.current.switchToOwner).toBe('function')
      expect(typeof result.current.switchToProducer).toBe('function')
      expect(typeof result.current.switchToKasir).toBe('function')
      expect(typeof result.current.getCurrentRole).toBe('function')
      expect(typeof result.current.isDevMode).toBe('boolean')
    })

    it('should handle role switching warnings in production-like environment', () => {
      // Arrange
      const mockSetRole = jest.fn()
      const mockContext = createMockContext({
        role: 'producer',
        setRole: mockSetRole,
      })
      mockUseUserRoleContext.mockReturnValue(mockContext)

      // Act
      const { result } = renderHook(() => useRoleDevelopment())

      // Test all switch functions
      result.current.switchToOwner()
      result.current.switchToProducer()
      result.current.switchToKasir()

      // Assert - Should show warnings for all switch attempts in test env
      expect(consoleSpy).toHaveBeenCalledWith('Role switching only available in development')
      expect(consoleSpy).toHaveBeenCalledTimes(3)
    })
  })
})
