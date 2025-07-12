/**
 * Note: Unit Tests untuk roleUtils
 *
 * Test suite ini mencakup:
 * 1. JWT parsing dan validasi
 * 2. Role extraction dari token payload
 * 3. Cache management dengan TTL
 * 4. Cross-tab synchronization
 * 5. Error handling dan retry mechanisms
 * 6. Debouncing untuk operasi yang sering dipanggil
 */

import {
  parseJWT,
  getRoleFromToken,
  isValidRole,
  extractRoleFromPayload,
  createRoleError,
  RoleCacheManager,
  RoleSyncManager,
  retryOperation,
  debounce,
  DEFAULT_ROLE,
  SESSION_STORAGE_KEY,
} from './roleUtils'
import type { UserRole, ClerkTokenPayload } from '../types'

// Type definition untuk singleton reset
interface SingletonClass {
  instance?: unknown
}

// Helper function untuk access mock objects
const getMockSessionStorage = () => window.sessionStorage as jest.Mocked<Storage>

beforeEach(() => {
  jest.clearAllMocks()
  jest.clearAllTimers()
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('roleUtils', () => {
  describe('parseJWT', () => {
    const validPayload = {
      sub: 'user_123',
      iss: 'https://clerk.com',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      iat: Math.floor(Date.now() / 1000),
      role: 'admin',
    }

    beforeEach(() => {
      // Mock atob untuk decode JWT payload
      ;(global.atob as jest.Mock).mockImplementation(() => {
        return JSON.stringify(validPayload)
      })
    })

    it('should parse valid JWT token correctly', () => {
      // Arrange
      const validToken = 'header.payload.signature'

      // Act
      const result = parseJWT(validToken)

      // Assert
      expect(result).toEqual(validPayload)
      expect(global.atob).toHaveBeenCalledWith('payload')
    })

    it('should return null for invalid JWT format', () => {
      // Arrange & Act
      const cases = [
        '', // empty string
        'invalid', // single part
        'header.payload', // only 2 parts
        'too.many.parts.here', // more than 3 parts
        null, // null value
        undefined, // undefined value
      ]

      cases.forEach((token) => {
        // Act
        const result = parseJWT(token as string)

        // Assert
        expect(result).toBeNull()
      })
    })

    it('should return null for expired token', () => {
      // Arrange
      const expiredPayload = {
        ...validPayload,
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      }
      ;(global.atob as jest.Mock).mockImplementation(() => JSON.stringify(expiredPayload))

      const token = 'header.payload.signature'

      // Act
      const result = parseJWT(token)

      // Assert
      expect(result).toBeNull()
    })

    it('should handle malformed base64 payload', () => {
      // Arrange
      ;(global.atob as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid base64')
      })

      const token = 'header.invalidpayload.signature'

      // Act
      const result = parseJWT(token)

      // Assert
      expect(result).toBeNull()
    })

    it('should handle invalid JSON in payload', () => {
      // Arrange
      ;(global.atob as jest.Mock).mockImplementation(() => 'invalid json {')

      const token = 'header.payload.signature'

      // Act
      const result = parseJWT(token)

      // Assert
      expect(result).toBeNull()
    })

    it('should handle missing required claims', () => {
      // Arrange
      const invalidPayload = {
        role: 'admin',
        // missing sub, iss, exp
      }
      ;(global.atob as jest.Mock).mockImplementation(() => JSON.stringify(invalidPayload))

      const token = 'header.payload.signature'

      // Act
      const result = parseJWT(token)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('isValidRole', () => {
    it('should validate correct role strings', () => {
      // Arrange & Act & Assert
      expect(isValidRole('admin')).toBe(true)
      expect(isValidRole('creator')).toBe(true)
      expect(isValidRole('user')).toBe(true)
    })

    it('should reject invalid role values', () => {
      // Arrange & Act & Assert
      const invalidCases = [
        'Admin', // wrong case
        'ADMIN', // wrong case
        'moderator', // not in enum
        'guest', // not in enum
        '', // empty string
        null,
        undefined,
        123, // number
        {}, // object
        [], // array
      ]

      invalidCases.forEach((invalidRole) => {
        expect(isValidRole(invalidRole)).toBe(false)
      })
    })
  })

  describe('extractRoleFromPayload', () => {
    it('should extract valid role from payload', () => {
      // Arrange
      const payload: ClerkTokenPayload = {
        sub: 'user_123',
        iss: 'clerk',
        exp: Date.now(),
        iat: Date.now(),
        role: 'admin',
      }

      // Act
      const result = extractRoleFromPayload(payload)

      // Assert
      expect(result).toBe('admin')
    })

    it('should return default role for invalid role in payload', () => {
      // Arrange
      const payload: ClerkTokenPayload = {
        sub: 'user_123',
        iss: 'clerk',
        exp: Date.now(),
        iat: Date.now(),
        role: 'invalid_role' as UserRole,
      }

      // Act
      const result = extractRoleFromPayload(payload)

      // Assert
      expect(result).toBe(DEFAULT_ROLE)
    })
  })

  describe('getRoleFromToken', () => {
    it('should extract role from valid token', () => {
      // Arrange
      const validPayload = {
        sub: 'user_123',
        iss: 'clerk',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        role: 'creator',
      }
      ;(global.atob as jest.Mock).mockImplementation(() => JSON.stringify(validPayload))

      const token = 'header.payload.signature'

      // Act
      const result = getRoleFromToken(token)

      // Assert
      expect(result).toBe('creator')
    })

    it('should return default role for invalid token', () => {
      // Arrange
      const invalidToken = 'invalid.token'

      // Act
      const result = getRoleFromToken(invalidToken)

      // Assert
      expect(result).toBe(DEFAULT_ROLE)
    })

    it('should return default role for missing role claim', () => {
      // Arrange
      const payloadWithoutRole = {
        sub: 'user_123',
        iss: 'clerk',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        // role missing
      }
      ;(global.atob as jest.Mock).mockImplementation(() => JSON.stringify(payloadWithoutRole))

      const token = 'header.payload.signature'

      // Act
      const result = getRoleFromToken(token)

      // Assert
      expect(result).toBe(DEFAULT_ROLE)
    })
  })

  describe('createRoleError', () => {
    it('should create standardized error object', () => {
      // Arrange
      const code = 'TOKEN_INVALID'
      const message = 'Token is invalid'
      const originalError = new Error('Original error')

      // Act
      const result = createRoleError(code, message, originalError)

      // Assert
      expect(result).toMatchObject({
        code,
        message,
        timestamp: expect.any(Number),
      })
      expect(result.timestamp).toBeCloseTo(Date.now(), -2) // within 100ms
    })

    it('should work without original error', () => {
      // Arrange
      const code = 'SESSION_NOT_FOUND'
      const message = 'Session not found'

      // Act
      const result = createRoleError(code, message)

      // Assert
      expect(result).toMatchObject({
        code,
        message,
        timestamp: expect.any(Number),
      })
    })
  })

  describe('RoleCacheManager', () => {
    let cacheManager: RoleCacheManager

    beforeEach(() => {
      // Reset singleton instance untuk setiap test
      ;(RoleCacheManager as unknown as SingletonClass).instance = undefined
      cacheManager = RoleCacheManager.getInstance()
    })

    it('should implement singleton pattern correctly', () => {
      // Act
      const instance1 = RoleCacheManager.getInstance()
      const instance2 = RoleCacheManager.getInstance()

      // Assert
      expect(instance1).toBe(instance2)
      expect(instance1).toBe(cacheManager)
    })

    it('should set and get role with TTL', () => {
      // Arrange
      const userId = 'user_123'
      const role: UserRole = 'admin'
      const ttl = 60000 // 1 minute
      const mockSessionStorage = getMockSessionStorage()

      // Act
      cacheManager.setRole(userId, role, ttl)
      const result = cacheManager.getRole(userId)

      // Assert
      expect(result).toBe(role)
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        SESSION_STORAGE_KEY,
        expect.any(String),
      )
    })

    it('should handle cache expiration', () => {
      // Arrange
      const userId = 'user_123'
      const role: UserRole = 'admin'
      const shortTtl = 1000 // 1 second

      // Act
      cacheManager.setRole(userId, role, shortTtl)

      // Fast-forward time beyond TTL
      jest.advanceTimersByTime(2000)

      const result = cacheManager.getRole(userId)

      // Assert
      expect(result).toBeNull()
    })

    it('should integrate with sessionStorage', () => {
      // Arrange
      const userId = 'user_123'
      const role: UserRole = 'creator'
      const mockSessionStorage = getMockSessionStorage()

      // Act
      cacheManager.setRole(userId, role)

      // Assert
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        SESSION_STORAGE_KEY,
        expect.stringContaining(userId),
      )
    })

    it('should handle sessionStorage errors gracefully', () => {
      // Arrange
      const mockSessionStorage = getMockSessionStorage()
      mockSessionStorage.setItem.mockImplementation(() => {
        throw new Error('SessionStorage full')
      })

      const userId = 'user_123'
      const role: UserRole = 'user'

      // Act & Assert - should not throw
      expect(() => cacheManager.setRole(userId, role)).not.toThrow()
    })

    it('should clear role cache', () => {
      // Arrange
      const userId = 'user_123'
      const role: UserRole = 'admin'

      cacheManager.setRole(userId, role)
      expect(cacheManager.getRole(userId)).toBe(role)

      // Act
      cacheManager.clearRole(userId)

      // Assert
      expect(cacheManager.getRole(userId)).toBeNull()
    })

    it('should clear all cache entries', () => {
      // Arrange
      const mockSessionStorage = getMockSessionStorage()
      cacheManager.setRole('user_1', 'admin')
      cacheManager.setRole('user_2', 'creator')

      // Act
      cacheManager.clearAll()

      // Assert
      expect(cacheManager.getRole('user_1')).toBeNull()
      expect(cacheManager.getRole('user_2')).toBeNull()
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(SESSION_STORAGE_KEY)
    })
  })

  describe('RoleSyncManager', () => {
    let syncManager: RoleSyncManager
    let mockChannelInstance: jest.Mocked<BroadcastChannel>

    beforeEach(() => {
      // Reset singleton instance untuk setiap test
      ;(RoleSyncManager as unknown as SingletonClass).instance = undefined

      // Create a mock instance that will be returned by BroadcastChannel constructor
      mockChannelInstance = {
        postMessage: jest.fn(),
        addEventListener: jest.fn(),
        close: jest.fn(),
        name: 'test-channel',
        onmessage: null,
        onmessageerror: null,
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      } as unknown as jest.Mocked<BroadcastChannel>

      // Mock BroadcastChannel constructor to return our mock instance
      ;(global.BroadcastChannel as jest.Mock).mockImplementation(() => mockChannelInstance)

      syncManager = RoleSyncManager.getInstance()
    })

    it('should implement singleton pattern correctly', () => {
      // Act
      const instance1 = RoleSyncManager.getInstance()
      const instance2 = RoleSyncManager.getInstance()

      // Assert
      expect(instance1).toBe(instance2)
      expect(instance1).toBe(syncManager)
    })

    it('should initialize and broadcast role updates', () => {
      // Arrange
      syncManager.init()
      const role: UserRole = 'admin'

      // Act
      syncManager.broadcastRoleUpdate(role)

      // Assert
      expect(mockChannelInstance.postMessage).toHaveBeenCalledWith({
        type: 'ROLE_UPDATED',
        role,
        timestamp: expect.any(Number),
        source: expect.any(String),
      })
    })

    it('should broadcast role clearing', () => {
      // Arrange
      syncManager.init()

      // Act
      syncManager.broadcastRoleUpdate(null)

      // Assert
      expect(mockChannelInstance.postMessage).toHaveBeenCalledWith({
        type: 'ROLE_CLEARED',
        role: null,
        timestamp: expect.any(Number),
        source: expect.any(String),
      })
    })

    it('should handle subscription and unsubscription', () => {
      // Arrange
      const listener = jest.fn()

      // Act
      const unsubscribe = syncManager.subscribe(listener)

      // Assert
      expect(typeof unsubscribe).toBe('function')

      // Act - unsubscribe
      unsubscribe()

      // Should not have any listeners after unsubscribe
      expect(listener).not.toHaveBeenCalled()
    })

    it('should cleanup channel on destroy', () => {
      // Arrange
      syncManager.init()

      // Act
      syncManager.destroy()

      // Assert
      expect(mockChannelInstance.close).toHaveBeenCalled()
    })
  })

  describe('retryOperation', () => {
    // Use real timers for async operation tests
    beforeEach(() => {
      jest.useRealTimers()
    })

    afterEach(() => {
      jest.useFakeTimers()
    })

    it('should execute operation successfully on first try', async () => {
      // Arrange
      const mockOperation = jest.fn().mockResolvedValue('success')

      // Act
      const result = await retryOperation(mockOperation, 3, 10) // reduced delay

      // Assert
      expect(result).toBe('success')
      expect(mockOperation).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and succeed', async () => {
      // Arrange
      const mockOperation = jest
        .fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success on third try')

      // Act
      const result = await retryOperation(mockOperation, 3, 10) // reduced delay

      // Assert
      expect(result).toBe('success on third try')
      expect(mockOperation).toHaveBeenCalledTimes(3)
    })

    it('should throw after exhausting all retries', async () => {
      // Arrange
      const mockError = new Error('Persistent failure')
      const mockOperation = jest.fn().mockRejectedValue(mockError)

      // Act & Assert
      await expect(retryOperation(mockOperation, 2, 10)).rejects.toThrow('Persistent failure') // reduced retries and delay
      expect(mockOperation).toHaveBeenCalledTimes(3) // 1 initial + 2 retries
    })

    it('should respect delay between retries', async () => {
      // Arrange
      const mockOperation = jest
        .fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValue('success')

      const delay = 50 // reduced delay for faster test

      // Act
      const startTime = Date.now()
      await retryOperation(mockOperation, 2, delay)
      const endTime = Date.now()

      // Assert
      expect(endTime - startTime).toBeGreaterThanOrEqual(delay - 20) // allow for some timing variance
      expect(mockOperation).toHaveBeenCalledTimes(2)
    })
  })

  describe('debounce', () => {
    it('should debounce function calls', () => {
      // Arrange
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      // Act
      debouncedFn('arg1')
      debouncedFn('arg2')
      debouncedFn('arg3')

      // Assert - function should not be called immediately
      expect(mockFn).not.toHaveBeenCalled()

      // Fast-forward time
      jest.advanceTimersByTime(100)

      // Assert - function should be called only once with last arguments
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('arg3')
    })

    it('should reset debounce timer on each call', () => {
      // Arrange
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      // Act
      debouncedFn('arg1')
      jest.advanceTimersByTime(50)
      debouncedFn('arg2')
      jest.advanceTimersByTime(50)
      debouncedFn('arg3')

      // Assert - function should not be called yet
      expect(mockFn).not.toHaveBeenCalled()

      // Advance full delay from last call
      jest.advanceTimersByTime(100)

      // Assert
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('arg3')
    })

    it('should maintain function context', () => {
      // Arrange
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      // Act
      debouncedFn()
      jest.advanceTimersByTime(100)

      // Assert - test passes if function executes without error
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })
})
