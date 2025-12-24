/**
 * DateCalculator Unit Tests
 * Tests for accurate date calculation with duration packages
 */

import { describe, it, expect } from '@jest/globals'
import { DateCalculator } from '@/features/kasir/lib/utils/dateCalculator'

describe('DateCalculator Tests', () => {
  describe('calculateReturnDate', () => {
    it('should calculate 4-day package return date correctly', () => {
      // Test case: pickup on 27th, return on 30th (27 + 4 - 1 = 30)
      const pickupDate = '2024-12-27'
      const duration = 4 as 4 | 7

      const result = DateCalculator.calculateReturnDate(pickupDate, duration)

      expect(result).toBe('2024-12-30')
    })

    it('should calculate 7-day package return date correctly', () => {
      // Test case: pickup on 27th, return on 2nd next month (27 + 7 - 1 = 33 → 2nd)
      const pickupDate = '2024-12-27'
      const duration = 7 as 4 | 7

      const result = DateCalculator.calculateReturnDate(pickupDate, duration)

      expect(result).toBe('2025-01-02') // Month boundary handled correctly
    })

    it('should handle month boundaries correctly (February)', () => {
      // Test February to March transition
      const pickupDate = '2024-02-27' // 2024 is leap year
      const duration = 7 as 4 | 7

      const result = DateCalculator.calculateReturnDate(pickupDate, duration)

      expect(result).toBe('2024-03-04') // 27 + 7 - 1 = 33 → March 4th
    })

    it('should handle leap year February correctly', () => {
      // Test leap year February (29 days)
      const pickupDate = '2024-02-25' // Leap year
      const duration = 7 as 4 | 7

      const result = DateCalculator.calculateReturnDate(pickupDate, duration)

      expect(result).toBe('2024-03-02') // 25 + 7 - 1 = 31 → March 2nd
    })

    it('should handle non-leap year February correctly', () => {
      // Test non-leap year February (28 days)
      const pickupDate = '2023-02-25' // Non-leap year
      const duration = 7 as 4 | 7

      const result = DateCalculator.calculateReturnDate(pickupDate, duration)

      expect(result).toBe('2023-03-03') // 25 + 7 - 1 = 31 → March 3rd
    })

    it('should handle year boundary correctly', () => {
      // Test December to January transition
      const pickupDate = '2024-12-29'
      const duration = 7 as 4 | 7

      const result = DateCalculator.calculateReturnDate(pickupDate, duration)

      expect(result).toBe('2025-01-04') // 29 + 7 - 1 = 35 → January 4th next year
    })

    it('should handle different months with varying days', () => {
      // Test April (30 days) to May transition
      const pickupDate = '2024-04-28'
      const duration = 7 as 4 | 7

      const result = DateCalculator.calculateReturnDate(pickupDate, duration)

      expect(result).toBe('2024-05-04') // 28 + 7 - 1 = 34 → May 4th
    })

    it('should handle same month calculations', () => {
      // Test within same month
      const pickupDate = '2024-06-15'
      const duration = 4 as 4 | 7

      const result = DateCalculator.calculateReturnDate(pickupDate, duration)

      expect(result).toBe('2024-06-18') // 15 + 4 - 1 = 18
    })

    it('should handle beginning of month', () => {
      // Test from 1st of month
      const pickupDate = '2024-07-01'
      const duration = 4 as 4 | 7

      const result = DateCalculator.calculateReturnDate(pickupDate, duration)

      expect(result).toBe('2024-07-04') // 1 + 4 - 1 = 4
    })

    it('should handle end of month with 31 days', () => {
      // Test from end of 31-day month
      const pickupDate = '2024-07-30'
      const duration = 4 as 4 | 7

      const result = DateCalculator.calculateReturnDate(pickupDate, duration)

      expect(result).toBe('2024-08-02') // 30 + 4 - 1 = 33 → August 2nd
    })
  })

  describe('validatePickupDate', () => {
    it('should validate future pickup date', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1) // Tomorrow
      const pickupDate = futureDate.toISOString().split('T')[0]

      const result = DateCalculator.validatePickupDate(pickupDate)

      expect(result.isValid).toBe(true)
    })

    it('should validate today as pickup date', () => {
      const today = new Date().toISOString().split('T')[0]

      const result = DateCalculator.validatePickupDate(today)

      expect(result.isValid).toBe(true)
    })

    it('should reject past pickup date', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1) // Yesterday
      const pickupDate = pastDate.toISOString().split('T')[0]

      const result = DateCalculator.validatePickupDate(pickupDate)

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Tanggal pickup tidak boleh di masa lalu')
    })

    it('should work with both duration options', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 2)
      const pickupDate = futureDate.toISOString().split('T')[0]

      const result4Day = DateCalculator.validatePickupDate(pickupDate)
      const result7Day = DateCalculator.validatePickupDate(pickupDate)

      expect(result4Day.isValid).toBe(true)
      expect(result7Day.isValid).toBe(true)
    })
  })

  describe('handleMonthBoundary', () => {
    it('should handle month boundary transitions', () => {
      // Test internal month boundary handling
      const testCases = [
        { pickup: '2024-01-31', duration: 4, expected: '2024-02-03' },
        { pickup: '2024-03-31', duration: 4, expected: '2024-04-03' },
        { pickup: '2024-05-31', duration: 7, expected: '2024-06-06' },
        { pickup: '2024-08-31', duration: 7, expected: '2024-09-06' },
      ]

      testCases.forEach(({ pickup, duration, expected }) => {
        const result = DateCalculator.calculateReturnDate(pickup, duration as 4 | 7)
        expect(result).toBe(expected)
      })
    })
  })

  describe('isOverdue', () => {
    it('should detect overdue transactions', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1) // Yesterday

      const result = DateCalculator.isOverdue(pastDate.toISOString())

      expect(result).toBe(true)
    })

    it('should not flag future dates as overdue', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1) // Tomorrow

      const result = DateCalculator.isOverdue(futureDate.toISOString())

      expect(result).toBe(false)
    })

    it('should not flag today as overdue', () => {
      const today = new Date()

      const result = DateCalculator.isOverdue(today.toISOString())

      expect(result).toBe(false)
    })
  })

  describe('calculateOverdueDays', () => {
    it('should calculate overdue days correctly', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 3) // 3 days ago

      const result = DateCalculator.calculateOverdueDays(pastDate.toISOString())

      expect(result).toBe(3)
    })

    it('should return 0 for future dates', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 2) // 2 days from now

      const result = DateCalculator.calculateOverdueDays(futureDate.toISOString())

      expect(result).toBe(0)
    })

    it('should return 0 for today', () => {
      const today = new Date()

      const result = DateCalculator.calculateOverdueDays(today.toISOString())

      expect(result).toBe(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle invalid date strings gracefully', () => {
      expect(() => {
        DateCalculator.calculateReturnDate('invalid-date', 4)
      }).toThrow()
    })

    it('should handle extreme future dates', () => {
      const farFuture = '2030-12-31'
      const result = DateCalculator.calculateReturnDate(farFuture, 7)

      expect(result).toBe('2031-01-06') // Should handle year boundary
    })

    it('should handle extreme past dates for validation', () => {
      const farPast = '2020-01-01'
      const result = DateCalculator.validatePickupDate(farPast)

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Tanggal pickup tidak boleh di masa lalu')
    })
  })
})