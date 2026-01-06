/**
 * Unit Tests for Refund Calculator
 * Testing business logic for refund policy implementation
 */

import { 
  calculateRefundEligibility, 
  getDaysUntilPickup, 
  formatRefundInfo,
  validateRefundInputs 
} from '../refundCalculator'

describe('RefundCalculator', () => {
  // Mock current date for consistent testing
  const mockToday = new Date('2026-01-06T00:00:00.000Z') // Monday, Jan 6, 2026
  
  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(mockToday)
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  describe('calculateRefundEligibility', () => {
    it('should return 30% refund for cancellation ≥7 days before pickup', () => {
      const pickupDate = new Date('2026-01-15T00:00:00.000Z') // 9 days from mock today
      const amountPaid = 280000

      const result = calculateRefundEligibility(pickupDate, amountPaid)

      expect(result.isEligible).toBe(true)
      expect(result.refundPercentage).toBe(30)
      expect(result.refundAmount).toBe(84000) // 30% of 280000
      expect(result.daysUntilPickup).toBe(9)
      expect(result.originalAmount).toBe(280000)
    })

    it('should return no refund for cancellation <7 days before pickup', () => {
      const pickupDate = new Date('2026-01-10T00:00:00.000Z') // 4 days from mock today
      const amountPaid = 280000

      const result = calculateRefundEligibility(pickupDate, amountPaid)

      expect(result.isEligible).toBe(false)
      expect(result.refundPercentage).toBe(0)
      expect(result.refundAmount).toBe(0)
      expect(result.daysUntilPickup).toBe(4)
      expect(result.originalAmount).toBe(280000)
    })

    it('should return no refund for same day cancellation', () => {
      const pickupDate = new Date('2026-01-06T00:00:00.000Z') // Same as mock today
      const amountPaid = 150000

      const result = calculateRefundEligibility(pickupDate, amountPaid)

      expect(result.isEligible).toBe(false)
      expect(result.refundPercentage).toBe(0)
      expect(result.refundAmount).toBe(0)
      expect(result.daysUntilPickup).toBe(0)
    })

    it('should handle exactly 7 days (boundary case)', () => {
      const pickupDate = new Date('2026-01-13T00:00:00.000Z') // Exactly 7 days from mock today
      const amountPaid = 100000

      const result = calculateRefundEligibility(pickupDate, amountPaid)

      expect(result.isEligible).toBe(true)
      expect(result.refundPercentage).toBe(30)
      expect(result.refundAmount).toBe(30000) // 30% of 100000
      expect(result.daysUntilPickup).toBe(7)
    })

    it('should handle past pickup dates', () => {
      const pickupDate = new Date('2026-01-01T00:00:00.000Z') // 5 days ago
      const amountPaid = 200000

      const result = calculateRefundEligibility(pickupDate, amountPaid)

      expect(result.isEligible).toBe(false)
      expect(result.refundPercentage).toBe(0)
      expect(result.refundAmount).toBe(0)
      expect(result.daysUntilPickup).toBe(-5)
      expect(result.reason).toContain('sudah lewat')
    })

    it('should round refund amount correctly', () => {
      const pickupDate = new Date('2026-01-15T00:00:00.000Z')
      const amountPaid = 333333 // 30% = 99999.9, should round to 100000

      const result = calculateRefundEligibility(pickupDate, amountPaid)

      expect(result.refundAmount).toBe(100000) // Rounded
    })
  })

  describe('getDaysUntilPickup', () => {
    it('should calculate days correctly', () => {
      const pickupDate = new Date('2026-01-10T00:00:00.000Z')
      const days = getDaysUntilPickup(pickupDate)
      expect(days).toBe(4)
    })

    it('should handle string dates', () => {
      const days = getDaysUntilPickup('2026-01-13T00:00:00.000Z')
      expect(days).toBe(7)
    })
  })

  describe('formatRefundInfo', () => {
    it('should format eligible refund correctly', () => {
      const refundData = {
        isEligible: true,
        daysUntilPickup: 8,
        refundPercentage: 30,
        refundAmount: 84000,
        originalAmount: 280000,
        reason: 'Pembatalan 8 hari sebelum pengambilan',
        calculationDate: mockToday,
        pickupDate: new Date('2026-01-14T00:00:00.000Z')
      }

      const formatted = formatRefundInfo(refundData)

      expect(formatted.eligibilityBadge.text).toBe('Refund 30%')
      expect(formatted.eligibilityBadge.variant).toBe('success')
      expect(formatted.amountDisplay).toBe('Rp 84.000')
      expect(formatted.daysText).toBe('8 hari lagi')
    })

    it('should format ineligible refund correctly', () => {
      const refundData = {
        isEligible: false,
        daysUntilPickup: 3,
        refundPercentage: 0,
        refundAmount: 0,
        originalAmount: 280000,
        reason: 'Pembatalan kurang dari 7 hari sebelum pengambilan (3 hari)',
        calculationDate: mockToday,
        pickupDate: new Date('2026-01-09T00:00:00.000Z')
      }

      const formatted = formatRefundInfo(refundData)

      expect(formatted.eligibilityBadge.text).toBe('Tidak Ada Refund')
      expect(formatted.eligibilityBadge.variant).toBe('destructive')
      expect(formatted.amountDisplay).toBe('Rp 0')
      expect(formatted.daysText).toBe('3 hari lagi')
    })
  })

  describe('validateRefundInputs', () => {
    it('should validate correct inputs', () => {
      const result = validateRefundInputs('2026-01-15T00:00:00.000Z', 280000)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject invalid date', () => {
      const result = validateRefundInputs('invalid-date', 280000)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid pickup date')
    })

    it('should reject negative amount', () => {
      const result = validateRefundInputs('2026-01-15T00:00:00.000Z', -100)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid amount paid')
    })
  })
})