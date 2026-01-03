/**
 * Unit Tests for Kasir Helper Functions
 * Task 2.1: Test kasir validation and lookup functionality
 */

import { getKasirFromUser, validateKasir } from './kasirHelper'
import { PrismaClient } from '@prisma/client'

// Mock Prisma for controlled testing
const mockPrisma = {
  kasir: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
  },
} as unknown as PrismaClient

describe('Kasir Helper Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getKasirFromUser', () => {
    test('should return kasir info when found', async () => {
      // Arrange
      const userId = 'user-123'
      const mockKasir = {
        id: 'kasir-456',
        nama: 'Test Kasir',
      }

      mockPrisma.kasir.findFirst = jest.fn().mockResolvedValue(mockKasir)

      // Act
      const result = await getKasirFromUser(mockPrisma, userId)

      // Assert
      expect(result).toEqual(mockKasir)
      expect(mockPrisma.kasir.findFirst).toHaveBeenCalledWith({
        where: {
          createdBy: userId,
          isActive: true,
        },
        select: {
          id: true,
          nama: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    })

    test('should return null when kasir not found', async () => {
      // Arrange
      const userId = 'user-123'
      mockPrisma.kasir.findFirst = jest.fn().mockResolvedValue(null)

      // Act
      const result = await getKasirFromUser(mockPrisma, userId)

      // Assert
      expect(result).toBeNull()
    })

    test('should return null when database error occurs', async () => {
      // Arrange
      const userId = 'user-123'
      mockPrisma.kasir.findFirst = jest.fn().mockRejectedValue(new Error('Database error'))

      // Act
      const result = await getKasirFromUser(mockPrisma, userId)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('validateKasir', () => {
    test('should return true for active kasir', async () => {
      // Arrange
      const kasirId = 'kasir-456'
      mockPrisma.kasir.findUnique = jest.fn().mockResolvedValue({ isActive: true })

      // Act
      const result = await validateKasir(mockPrisma, kasirId)

      // Assert
      expect(result).toBe(true)
      expect(mockPrisma.kasir.findUnique).toHaveBeenCalledWith({
        where: { id: kasirId },
        select: { isActive: true },
      })
    })

    test('should return false for inactive kasir', async () => {
      // Arrange
      const kasirId = 'kasir-456'
      mockPrisma.kasir.findUnique = jest.fn().mockResolvedValue({ isActive: false })

      // Act
      const result = await validateKasir(mockPrisma, kasirId)

      // Assert
      expect(result).toBe(false)
    })

    test('should return false when kasir not found', async () => {
      // Arrange
      const kasirId = 'kasir-456'
      mockPrisma.kasir.findUnique = jest.fn().mockResolvedValue(null)

      // Act
      const result = await validateKasir(mockPrisma, kasirId)

      // Assert
      expect(result).toBe(false)
    })

    test('should return false when database error occurs', async () => {
      // Arrange
      const kasirId = 'kasir-456'
      mockPrisma.kasir.findUnique = jest.fn().mockRejectedValue(new Error('Database error'))

      // Act
      const result = await validateKasir(mockPrisma, kasirId)

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('Error Handling', () => {
    test('getKasirFromUser should handle various error types gracefully', async () => {
      const userId = 'user-123'
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      // Test different error scenarios
      const errors = [
        new Error('Connection timeout'),
        new Error('Invalid query'),
        'String error',
        { message: 'Object error' },
      ]

      for (const error of errors) {
        mockPrisma.kasir.findFirst = jest.fn().mockRejectedValue(error)
        const result = await getKasirFromUser(mockPrisma, userId)
        expect(result).toBeNull()
      }

      consoleSpy.mockRestore()
    })

    test('validateKasir should handle various error types gracefully', async () => {
      const kasirId = 'kasir-456'
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      // Test different error scenarios
      const errors = [
        new Error('Connection timeout'),
        new Error('Invalid query'),
        'String error',
        { message: 'Object error' },
      ]

      for (const error of errors) {
        mockPrisma.kasir.findUnique = jest.fn().mockRejectedValue(error)
        const result = await validateKasir(mockPrisma, kasirId)
        expect(result).toBe(false)
      }

      consoleSpy.mockRestore()
    })
  })
})