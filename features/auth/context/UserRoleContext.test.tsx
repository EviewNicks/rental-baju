/**
 * Unit Tests untuk UserRoleContext.tsx
 *
 * Testing React Context Provider dengan:
 * - UserRoleProvider component
 * - Role reducer logic
 * - Error boundary integration
 * - Context actions dan lifecycle
 * - Cross-tab synchronization
 * - Development mode support
 *
 * Note: Tests ini menggunakan React Testing Library dan mocking Clerk hooks
 */

import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import { UserRoleProvider, useUserRoleContext } from './UserRoleContext'
import { useAuth, useSession } from '@clerk/nextjs'
import type { UserRole, UserRoleProviderProps } from '../types'

// Mock Clerk hooks
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(),
  useSession: jest.fn(),
}))

// Setup mock objects first
const mockCacheManager = {
  getRole: jest.fn(),
  setRole: jest.fn(),
  clearRole: jest.fn(),
  clearAll: jest.fn(),
}

const mockSyncManager = {
  init: jest.fn(),
  subscribe: jest.fn(),
  broadcastRoleUpdate: jest.fn(),
  destroy: jest.fn(),
}

// Mock roleUtils dengan implementasi yang lengkap
jest.mock('../lib/roleUtils', () => ({
  getRoleFromToken: jest.fn(),
  createRoleError: jest.fn(),
  RoleCacheManager: {
    getInstance: jest.fn(() => mockCacheManager),
  },
  RoleSyncManager: {
    getInstance: jest.fn(() => mockSyncManager),
  },
  retryOperation: jest.fn((fn) => fn()),
  debounce: jest.fn((fn) => fn),
  DEFAULT_ROLE: 'user',
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

// Import mocked functions after module is mocked
const { getRoleFromToken } = jest.requireMock('../lib/roleUtils')

// Helper component untuk test context
const TestConsumer = () => {
  const context = useUserRoleContext()
  return (
    <div>
      <div data-testid="role">{context.role || 'null'}</div>
      <div data-testid="loading">{context.isLoading.toString()}</div>
      <div data-testid="error">{context.error || 'null'}</div>
      <button onClick={() => context.setRole('admin')} data-testid="set-admin">
        Set Admin
      </button>
      <button onClick={() => context.clearRole()} data-testid="clear-role">
        Clear Role
      </button>
      <button onClick={() => context.refreshRole()} data-testid="refresh-role">
        Refresh Role
      </button>
    </div>
  )
}

// Helper function untuk render dengan provider
const renderWithProvider = (
  ui: React.ReactElement,
  providerProps: Partial<UserRoleProviderProps> = {},
) => {
  const defaultProps: UserRoleProviderProps = {
    children: ui,
    devMode: { enabled: false, allowRoleSwitching: false },
    cacheConfig: { ttl: 5 * 60 * 1000, enableSessionStorage: true },
    ...providerProps,
  }

  return render(<UserRoleProvider {...defaultProps} />)
}

beforeEach(() => {
  jest.clearAllMocks()

  // Reset all mock implementations to clean state
  mockCacheManager.getRole.mockReturnValue(null)
  mockCacheManager.setRole.mockImplementation(() => {})
  mockCacheManager.clearRole.mockImplementation(() => {})
  mockCacheManager.clearAll.mockImplementation(() => {})

  mockSyncManager.init.mockImplementation(() => {})
  mockSyncManager.subscribe.mockReturnValue(jest.fn())
  mockSyncManager.broadcastRoleUpdate.mockImplementation(() => {})
  mockSyncManager.destroy.mockImplementation(() => {})

  // Default mock implementations - menggunakan type assertion yang lebih simple
  mockUseAuth.mockReturnValue({
    isSignedIn: true,
    userId: 'user_123',
    sessionId: 'session_123',
    orgId: null,
    orgRole: null,
    orgSlug: null,
    has: jest.fn(),
    isLoaded: true,
    sessionClaims: {},
    actor: null,
    signOut: jest.fn(),
    getToken: jest.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)

  mockUseSession.mockReturnValue({
    session: {
      getToken: jest.fn().mockResolvedValue('mock.jwt.token'),
    },
    isLoaded: true,
    isSignedIn: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)
})

describe('UserRoleContext', () => {
  describe('UserRoleProvider', () => {
    it('should initialize with loading state', async () => {
      // Act
      renderWithProvider(<TestConsumer />)

      // Assert - initial loading state
      expect(screen.getByTestId('loading')).toHaveTextContent('true')
      expect(screen.getByTestId('role')).toHaveTextContent('null')
    })

    it('should fetch role from Clerk session on mount', async () => {
      // Arrange
      getRoleFromToken.mockReturnValue('admin')

      // Act
      renderWithProvider(<TestConsumer />)

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
        expect(screen.getByTestId('role')).toHaveTextContent('admin')
      })

      expect(getRoleFromToken).toHaveBeenCalledWith('mock.jwt.token')
    })

    it('should handle Clerk session unavailable', async () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        userId: null,
        isLoaded: true,
        sessionClaims: {},
        actor: null,
        signOut: jest.fn(),
        getToken: jest.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      // Act
      renderWithProvider(<TestConsumer />)

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
        expect(screen.getByTestId('role')).toHaveTextContent('null')
      })
    })

    it('should integrate with cache manager', async () => {
      // Arrange
      mockCacheManager.getRole.mockReturnValue('creator')

      // Act
      renderWithProvider(<TestConsumer />)

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('role')).toHaveTextContent('creator')
      })

      expect(mockCacheManager.getRole).toHaveBeenCalledWith('user_123')
    })

    it('should handle cross-tab synchronization', async () => {
      // Arrange
      let subscriberCallback: (role: UserRole) => void

      mockSyncManager.subscribe.mockImplementation((callback: (role: UserRole) => void) => {
        subscriberCallback = callback
        return jest.fn() // unsubscribe function
      })

      // Act
      renderWithProvider(<TestConsumer />)

      // Simulate cross-tab role update
      act(() => {
        subscriberCallback('creator')
      })

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('role')).toHaveTextContent('creator')
      })

      expect(mockSyncManager.init).toHaveBeenCalled()
      expect(mockSyncManager.subscribe).toHaveBeenCalled()
    })

    it('should handle error boundary with fallback UI', () => {
      // Arrange - Mock internal component method untuk throw error
      const ErrorThrowingComponent = () => {
        React.useEffect(() => {
          throw new Error('Test error for boundary')
        }, [])
        return <TestConsumer />
      }

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      // Act
      renderWithProvider(<ErrorThrowingComponent />)

      // Assert - should show fallback UI
      expect(screen.getByText(/Role management tidak tersedia/i)).toBeInTheDocument()
      expect(screen.getByText(/Menggunakan role default: user/i)).toBeInTheDocument()

      consoleSpy.mockRestore()
    })

    it('should support development mode', () => {
      // Arrange
      const devModeProps = {
        devMode: {
          enabled: true,
          allowRoleSwitching: true,
          mockRole: 'admin' as UserRole,
        },
      }

      // Act
      renderWithProvider(<TestConsumer />, devModeProps)

      // Assert - Test tersebut tidak akan show dev switcher karena NODE_ENV bukan development
      // Tapi kita test bahwa role mock berfungsi
      expect(screen.getByTestId('role')).toHaveTextContent('admin')
    })
  })

  describe('Context Actions', () => {
    it('should provide setRole action', async () => {
      // Arrange
      renderWithProvider(<TestConsumer />)

      // Act
      const setAdminButton = screen.getByTestId('set-admin')
      act(() => {
        setAdminButton.click()
      })

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('role')).toHaveTextContent('admin')
      })

      expect(mockCacheManager.setRole).toHaveBeenCalledWith('user_123', 'admin', 5 * 60 * 1000)
      expect(mockSyncManager.broadcastRoleUpdate).toHaveBeenCalledWith('admin')
    })

    it('should provide clearRole action', async () => {
      // Arrange
      renderWithProvider(<TestConsumer />)

      // First set a role, then clear it
      const setAdminButton = screen.getByTestId('set-admin')
      act(() => {
        setAdminButton.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('role')).toHaveTextContent('admin')
      })

      // Act - clear role
      const clearRoleButton = screen.getByTestId('clear-role')
      act(() => {
        clearRoleButton.click()
      })

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('role')).toHaveTextContent('null')
      })

      expect(mockCacheManager.clearRole).toHaveBeenCalledWith('user_123')
      expect(mockSyncManager.broadcastRoleUpdate).toHaveBeenCalledWith(null)
    })

    it('should provide refreshRole action', async () => {
      // Arrange
      renderWithProvider(<TestConsumer />)

      // Act
      const refreshRoleButton = screen.getByTestId('refresh-role')
      act(() => {
        refreshRoleButton.click()
      })

      // Assert
      await waitFor(() => {
        expect(mockCacheManager.clearRole).toHaveBeenCalledWith('user_123')
      })
    })
  })

  describe('useUserRoleContext hook', () => {
    it('should throw error when used outside provider', () => {
      // Arrange
      const TestComponent = () => {
        useUserRoleContext()
        return <div>Test</div>
      }

      // Suppress console.error untuk test ini
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      // Act & Assert
      expect(() => render(<TestComponent />)).toThrow(
        'useUserRoleContext must be used within a UserRoleProvider',
      )

      consoleSpy.mockRestore()
    })

    it('should return context value when used within provider', () => {
      // Arrange
      const TestComponent = () => {
        const context = useUserRoleContext()
        return (
          <div>
            <div data-testid="context-role">{context.role || 'null'}</div>
            <div data-testid="context-loading">{context.isLoading.toString()}</div>
            <div data-testid="context-error">{context.error || 'null'}</div>
          </div>
        )
      }

      // Act
      renderWithProvider(<TestComponent />)

      // Assert
      expect(screen.getByTestId('context-role')).toBeInTheDocument()
      expect(screen.getByTestId('context-loading')).toBeInTheDocument()
      expect(screen.getByTestId('context-error')).toBeInTheDocument()
    })
  })

  //   describe('Error Handling', () => {
  //     it('should handle session token fetch errors', async () => {
  //       // Arrange
  //       // Ensure cache returns null so it doesn't interfere
  //       mockCacheManager.getRole.mockReturnValue(null)

  //       const mockSession = {
  //         getToken: jest.fn().mockRejectedValue(new Error('Token fetch failed')),
  //       }
  //       mockUseSession.mockReturnValue({
  //         session: mockSession,
  //         isLoaded: true,
  //         isSignedIn: true,
  //       } as any)

  //       // Mock retryOperation to reject to trigger error path
  //       retryOperation.mockRejectedValue(new Error('Token fetch failed'))

  //       createRoleError.mockReturnValue({
  //         code: 'SESSION_NOT_FOUND',
  //         message: 'Failed to fetch user role',
  //         timestamp: Date.now(),
  //       })

  //       // Act
  //       renderWithProvider(<TestConsumer />)

  //       // Assert - Wait for async operations and check that error was set
  //       await waitFor(
  //         () => {
  //           expect(screen.getByTestId('loading')).toHaveTextContent('false')
  //           expect(screen.getByTestId('role')).toHaveTextContent('user') // fallback role
  //         },
  //         { timeout: 2000 },
  //       )

  //       // Check that error message is displayed (can be async)
  //       await waitFor(
  //         () => {
  //           const errorElement = screen.getByTestId('error')
  //           expect(errorElement.textContent).not.toBe('null')
  //         },
  //         { timeout: 1000 },
  //       )
  //     })

  //     it('should handle retry operation failures', async () => {
  //       // Arrange
  //       // Ensure cache returns null so it doesn't interfere
  //       mockCacheManager.getRole.mockReturnValue(null)

  //       // Mock session to work but retryOperation to fail
  //       mockUseSession.mockReturnValue({
  //         session: {
  //           getToken: jest.fn().mockResolvedValue('mock.jwt.token'),
  //         },
  //         isLoaded: true,
  //         isSignedIn: true,
  //       } as any)

  //       retryOperation.mockRejectedValue(new Error('All retries failed'))

  //       createRoleError.mockReturnValue({
  //         code: 'NETWORK_ERROR',
  //         message: 'All retries failed',
  //         timestamp: Date.now(),
  //       })

  //       // Act
  //       renderWithProvider(<TestConsumer />)

  //       // Assert
  //       await waitFor(
  //         () => {
  //           expect(screen.getByTestId('loading')).toHaveTextContent('false')
  //         },
  //         { timeout: 2000 },
  //       )

  //       // Check that error message is displayed
  //       await waitFor(
  //         () => {
  //           const errorElement = screen.getByTestId('error')
  //           expect(errorElement.textContent).not.toBe('null')
  //         },
  //         { timeout: 1000 },
  //       )
  //     })
  //   })

  // describe('Development Features', () => {
  //   let nodeEnvBackup: string | undefined

  //   beforeAll(() => {
  //     nodeEnvBackup = process.env.NODE_ENV
  //     Object.defineProperty(process.env, 'NODE_ENV', {
  //       value: 'development',
  //       configurable: true,
  //     })
  //   })

  //   afterAll(() => {
  //     Object.defineProperty(process.env, 'NODE_ENV', {
  //       value: nodeEnvBackup,
  //       configurable: true,
  //     })
  //   })

  //   it('should not show dev role switcher in production', () => {
  //     // Arrange - Test environment sudah bukan development
  //     const devModeProps = {
  //       devMode: {
  //         enabled: true,
  //         allowRoleSwitching: true,
  //       },
  //     }

  //     // Act
  //     renderWithProvider(<TestConsumer />, devModeProps)

  //     // Assert
  //     expect(screen.queryByText(/Dev Mode: Role Switcher/i)).not.toBeInTheDocument()
  //   })
  // })

  describe('Lifecycle and Cleanup', () => {
    it('should cleanup resources on unmount', () => {
      // Arrange
      const mockUnsubscribe = jest.fn()
      mockSyncManager.subscribe.mockReturnValue(mockUnsubscribe)

      // Act
      const { unmount } = renderWithProvider(<TestConsumer />)
      unmount()

      // Assert
      expect(mockUnsubscribe).toHaveBeenCalled()
      expect(mockSyncManager.destroy).toHaveBeenCalled()
    })

    it('should handle auth state changes', async () => {
      // Arrange
      const { rerender } = renderWithProvider(<TestConsumer />)

      // Simulate auth state change to signed out
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        userId: null,
        isLoaded: true,
        sessionClaims: {},
        actor: null,
        signOut: jest.fn(),
        getToken: jest.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      // Act - re-render with new auth state
      rerender(
        <UserRoleProvider>
          <TestConsumer />
        </UserRoleProvider>,
      )

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('role')).toHaveTextContent('null')
      })
    })
  })
})
