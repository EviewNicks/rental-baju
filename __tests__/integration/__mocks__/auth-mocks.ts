/**
 * Authentication Mocks untuk Integration Testing
 *
 * File ini berisi mock utilities untuk testing authentication dan authorization
 * system dengan Clerk integration dan browser APIs.
 */

import { UserRole } from '@/features/auth/types'

// Mock Clerk hooks
export const mockUseAuth = jest.fn()
export const mockUseSession = jest.fn()
export const mockUseUser = jest.fn()

// Mock Clerk session object
export const createMockSession = (role: UserRole | null = null) => ({
  id: 'session_123',
  status: 'active',
  getToken: jest
    .fn()
    .mockResolvedValue(role ? `mock.jwt.token.with.${role}.role` : 'mock.jwt.token.no.role'),
  createdAt: Date.now(),
  updatedAt: Date.now(),
})

// Mock Clerk user object
export const createMockUser = (role: UserRole | null = null, firstName = 'Test User') => ({
  id: `user_${role || 'unknown'}_123`,
  firstName,
  lastName: 'User',
  emailAddresses: [{ emailAddress: `${role || 'test'}@example.com` }],
  createdAt: Date.now(),
  updatedAt: Date.now(),
})

// Mock BroadcastChannel for cross-tab testing
export const createMockBroadcastChannel = () => {
  const listeners: Array<(event: MessageEvent) => void> = []

  return {
    postMessage: jest.fn((message: unknown) => {
      // Simulate message reception in other tabs
      setTimeout(() => {
        listeners.forEach((listener) => {
          listener({ data: message } as MessageEvent)
        })
      }, 0)
    }),
    addEventListener: jest.fn((type: string, listener: (event: MessageEvent) => void) => {
      if (type === 'message') {
        listeners.push(listener)
      }
    }),
    removeEventListener: jest.fn((type: string, listener: (event: MessageEvent) => void) => {
      if (type === 'message') {
        const index = listeners.indexOf(listener)
        if (index > -1) {
          listeners.splice(index, 1)
        }
      }
    }),
    close: jest.fn(() => {
      listeners.length = 0
    }),
    name: 'role-sync',
  }
}

// Mock sessionStorage with error simulation capabilities
export const createMockSessionStorage = () => {
  const storage: Record<string, string> = {}
  let shouldThrowError = false

  return {
    getItem: jest.fn((key: string) => {
      if (shouldThrowError) throw new Error('SessionStorage unavailable')
      return storage[key] || null
    }),
    setItem: jest.fn((key: string, value: string) => {
      if (shouldThrowError) throw new Error('SessionStorage quota exceeded')
      storage[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      if (shouldThrowError) throw new Error('SessionStorage unavailable')
      delete storage[key]
    }),
    clear: jest.fn(() => {
      if (shouldThrowError) throw new Error('SessionStorage unavailable')
      Object.keys(storage).forEach((key) => delete storage[key])
    }),
    // Test utilities
    __setError: (error: boolean) => {
      shouldThrowError = error
    },
    __getStorage: () => ({ ...storage }),
    __clearStorage: () => Object.keys(storage).forEach((key) => delete storage[key]),
  }
}

// Setup global mocks
export const setupGlobalMocks = () => {
  // Mock Clerk
  jest.mock('@clerk/nextjs', () => ({
    useAuth: mockUseAuth,
    useSession: mockUseSession,
    useUser: mockUseUser,
  }))

  // Mock BroadcastChannel
  const globalWindow = global as typeof global & {
    BroadcastChannel: typeof BroadcastChannel
  }
  globalWindow.BroadcastChannel = jest.fn().mockImplementation(createMockBroadcastChannel)

  // Mock Date.now for time-based testing
  const originalDateNow = Date.now
  const globalWithMock = global as typeof global & {
    __mockDateNow: (timestamp?: number) => void
  }
  globalWithMock.__mockDateNow = (timestamp?: number) => {
    if (timestamp) {
      Date.now = jest.fn(() => timestamp)
    } else {
      Date.now = originalDateNow
    }
  }
}

// Cleanup mocks
export const cleanupGlobalMocks = () => {
  jest.clearAllMocks()
  // Restore Date.now
  const globalWithMock = global as typeof global & {
    __mockDateNow: (timestamp?: number) => void
  }
  globalWithMock.__mockDateNow()
}
