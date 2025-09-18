/**
 * Comprehensive Test Scenarios for New Penalty System
 * Testing flat 20k penalty and manual pricing functionality
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { PenaltyCalculator } from '../../../features/kasir/lib/utils/penaltyCalculator'
import type { ConditionCategory, ConditionSplit } from '../../../features/kasir/types'

// Mock data setup
const mockTransactionItem = {
  id: 'item-1',
  productName: 'Kebaya Tradisional',
  modalAwal: 150000,
  expectedReturnDate: new Date('2025-09-01'),
  actualReturnDate: new Date('2025-09-16'), // 15 days late
}

describe('Penalty System - Flat 20k Late Fee', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Flat Late Penalty Calculation', () => {
    it('should apply flat 20k penalty for late returns regardless of item count', () => {
      const result = PenaltyCalculator.calculateFlatLatePenalty(
        mockTransactionItem.expectedReturnDate,
        mockTransactionItem.actualReturnDate
      )

      expect(result.isLate).toBe(true)
      expect(result.lateDays).toBe(15)
      expect(result.flatPenalty).toBe(20000)
    })

    it('should return zero penalty for on-time returns', () => {
      const onTimeReturnDate = new Date('2025-08-30') // 2 days early
      const result = PenaltyCalculator.calculateFlatLatePenalty(
        mockTransactionItem.expectedReturnDate,
        onTimeReturnDate
      )

      expect(result.isLate).toBe(false)
      expect(result.lateDays).toBe(0)
      expect(result.flatPenalty).toBe(0)
    })

    it('should handle same-day returns correctly', () => {
      const sameDayReturn = new Date('2025-09-01')
      const result = PenaltyCalculator.calculateFlatLatePenalty(
        mockTransactionItem.expectedReturnDate,
        sameDayReturn
      )

      expect(result.isLate).toBe(false)
      expect(result.lateDays).toBe(0)
      expect(result.flatPenalty).toBe(0)
    })
  })

  describe('Enhanced Penalty Calculation', () => {
    it('should combine flat late penalty with condition penalties', () => {
      const conditions: ConditionSplit[] = [
        {
          kondisiAkhir: 'Kotor ringan',
          jumlahKembali: 1,
          conditionCategory: 'KOTOR' as ConditionCategory,
          useManualPricing: false,
          manualPrice: 5000
        }
      ]

      const result = PenaltyCalculator.calculateEnhancedPenalty(
        mockTransactionItem,
        conditions,
        true // is late
      )

      expect(result.totalPenalty).toBe(25000) // 20k late + 5k condition
      expect(result.flatLatePenalty).toBe(20000)
      expect(result.conditionPenalty).toBe(5000)
      expect(result.penaltyBreakdown).toHaveLength(2)
    })

    it('should handle only condition penalties for on-time returns', () => {
      const onTimeItem = {
        ...mockTransactionItem,
        actualReturnDate: new Date('2025-08-30')
      }

      const conditions: ConditionSplit[] = [
        {
          kondisiAkhir: 'Rusak ringan',
          jumlahKembali: 1,
          conditionCategory: 'RUSAK_RINGAN' as ConditionCategory,
          useManualPricing: false,
          manualPrice: 15000
        }
      ]

      const result = PenaltyCalculator.calculateEnhancedPenalty(
        onTimeItem,
        conditions,
        false // not late
      )

      expect(result.totalPenalty).toBe(15000) // Only condition penalty
      expect(result.flatLatePenalty).toBe(0)
      expect(result.conditionPenalty).toBe(15000)
    })
  })
})

describe('Manual Pricing System', () => {
  describe('Manual Price Override', () => {
    it('should use manual price when useManualPricing is true', () => {
      const manualCondition: ConditionSplit = {
        kondisiAkhir: 'Noda membandel',
        jumlahKembali: 2,
        conditionCategory: 'KOTOR' as ConditionCategory,
        useManualPricing: true,
        manualPrice: 12000 // Custom price instead of default 5000
      }

      const penalty = PenaltyCalculator.calculateManualPricingPenalty(manualCondition)

      expect(penalty).toBe(24000) // 12000 * 2 items
    })

    it('should use suggested price when useManualPricing is false', () => {
      const automaticCondition: ConditionSplit = {
        kondisiAkhir: 'Kotor normal',
        jumlahKembali: 3,
        conditionCategory: 'KOTOR' as ConditionCategory,
        useManualPricing: false,
        manualPrice: 12000 // This should be ignored
      }

      const penalty = PenaltyCalculator.calculateManualPricingPenalty(automaticCondition)

      expect(penalty).toBe(15000) // 5000 (suggested for KOTOR) * 3 items
    })

    it('should handle lost items with modal awal pricing', () => {
      const lostCondition: ConditionSplit = {
        kondisiAkhir: 'Item hilang',
        jumlahKembali: 1,
        conditionCategory: 'HILANG' as ConditionCategory,
        useManualPricing: false,
        manualPrice: 0,
        modalAwal: 150000
      }

      const penalty = PenaltyCalculator.calculateManualPricingPenalty(lostCondition)

      expect(penalty).toBe(150000) // Full modal awal
    })
  })

  describe('Condition Category Mapping', () => {
    const testCases = [
      {
        category: 'BAIK' as ConditionCategory,
        expectedPrice: 0,
        description: 'Perfect condition'
      },
      {
        category: 'KOTOR' as ConditionCategory,
        expectedPrice: 5000,
        description: 'Dirty condition'
      },
      {
        category: 'RUSAK_RINGAN' as ConditionCategory,
        expectedPrice: 15000,
        description: 'Minor damage'
      },
      {
        category: 'RUSAK_BERAT' as ConditionCategory,
        expectedPrice: 50000,
        description: 'Major damage'
      }
    ]

    testCases.forEach(({ category, expectedPrice, description }) => {
      it(`should return correct suggested price for ${description}`, () => {
        const condition: ConditionSplit = {
          kondisiAkhir: description,
          jumlahKembali: 1,
          conditionCategory: category,
          useManualPricing: false,
          manualPrice: 0
        }

        const penalty = PenaltyCalculator.calculateManualPricingPenalty(condition)

        expect(penalty).toBe(expectedPrice)
      })
    })
  })
})

describe('Integration Scenarios', () => {
  describe('Complex Multi-Condition Return', () => {
    it('should handle mixed condition types with manual and automatic pricing', () => {
      const conditions: ConditionSplit[] = [
        {
          kondisiAkhir: 'Kondisi baik',
          jumlahKembali: 2,
          conditionCategory: 'BAIK' as ConditionCategory,
          useManualPricing: false,
          manualPrice: 0
        },
        {
          kondisiAkhir: 'Kotor dengan noda khusus',
          jumlahKembali: 1,
          conditionCategory: 'KOTOR' as ConditionCategory,
          useManualPricing: true,
          manualPrice: 8000 // Custom price
        },
        {
          kondisiAkhir: 'Sobek kecil di bagian lengan',
          jumlahKembali: 1,
          conditionCategory: 'RUSAK_RINGAN' as ConditionCategory,
          useManualPricing: false,
          manualPrice: 15000 // Will be ignored
        }
      ]

      const result = PenaltyCalculator.calculateEnhancedPenalty(
        mockTransactionItem,
        conditions,
        true // is late
      )

      const expectedConditionPenalty = 0 + 8000 + 15000 // BAIK + manual KOTOR + automatic RUSAK_RINGAN
      const expectedTotal = 20000 + expectedConditionPenalty // flat late + conditions

      expect(result.totalPenalty).toBe(expectedTotal)
      expect(result.conditionPenalty).toBe(expectedConditionPenalty)
      expect(result.flatLatePenalty).toBe(20000)
    })

    it('should calculate penalties for multiple lost items correctly', () => {
      const conditions: ConditionSplit[] = [
        {
          kondisiAkhir: 'Item 1 hilang',
          jumlahKembali: 1,
          conditionCategory: 'HILANG' as ConditionCategory,
          useManualPricing: false,
          manualPrice: 0,
          modalAwal: 150000
        },
        {
          kondisiAkhir: 'Item 2 hilang',
          jumlahKembali: 1,
          conditionCategory: 'HILANG' as ConditionCategory,
          useManualPricing: true,
          manualPrice: 120000, // Manual override
        }
      ]

      const result = PenaltyCalculator.calculateEnhancedPenalty(
        mockTransactionItem,
        conditions,
        false // not late (items lost)
      )

      const expectedConditionPenalty = 150000 + 120000 // modal awal + manual price
      expect(result.conditionPenalty).toBe(expectedConditionPenalty)
      expect(result.flatLatePenalty).toBe(0) // No late penalty
      expect(result.totalPenalty).toBe(expectedConditionPenalty)
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero quantity conditions', () => {
      const condition: ConditionSplit = {
        kondisiAkhir: 'Test condition',
        jumlahKembali: 0,
        conditionCategory: 'KOTOR' as ConditionCategory,
        useManualPricing: false,
        manualPrice: 5000
      }

      const penalty = PenaltyCalculator.calculateManualPricingPenalty(condition)

      expect(penalty).toBe(0)
    })

    it('should handle negative manual prices gracefully', () => {
      const condition: ConditionSplit = {
        kondisiAkhir: 'Invalid price test',
        jumlahKembali: 1,
        conditionCategory: 'KOTOR' as ConditionCategory,
        useManualPricing: true,
        manualPrice: -1000 // Invalid negative price
      }

      const penalty = PenaltyCalculator.calculateManualPricingPenalty(condition)

      expect(penalty).toBe(0) // Should fallback to 0 or throw validation error
    })

    it('should handle very large manual prices', () => {
      const condition: ConditionSplit = {
        kondisiAkhir: 'Expensive custom repair',
        jumlahKembali: 1,
        conditionCategory: 'RUSAK_BERAT' as ConditionCategory,
        useManualPricing: true,
        manualPrice: 1000000 // 1 million IDR
      }

      const penalty = PenaltyCalculator.calculateManualPricingPenalty(condition)

      expect(penalty).toBe(1000000)
    })
  })

  describe('Business Rules Validation', () => {
    it('should enforce maximum penalty caps if business rules require', () => {
      // This test assumes business rules might cap penalties
      const expensiveConditions: ConditionSplit[] = [
        {
          kondisiAkhir: 'Expensive damage',
          jumlahKembali: 10,
          conditionCategory: 'RUSAK_BERAT' as ConditionCategory,
          useManualPricing: true,
          manualPrice: 100000 // Very expensive
        }
      ]

      const result = PenaltyCalculator.calculateEnhancedPenalty(
        mockTransactionItem,
        expensiveConditions,
        true
      )

      // Business rule: penalty shouldn't exceed 10x modal awal
      const maxAllowedPenalty = mockTransactionItem.modalAwal * 10

      // This test might need adjustment based on actual business rules
      expect(result.totalPenalty).toBeLessThanOrEqual(maxAllowedPenalty)
    })

    it('should provide detailed penalty breakdown for transparency', () => {
      const conditions: ConditionSplit[] = [
        {
          kondisiAkhir: 'Mixed condition test',
          jumlahKembali: 1,
          conditionCategory: 'RUSAK_RINGAN' as ConditionCategory,
          useManualPricing: true,
          manualPrice: 25000
        }
      ]

      const result = PenaltyCalculator.calculateEnhancedPenalty(
        mockTransactionItem,
        conditions,
        true
      )

      expect(result.penaltyBreakdown).toBeDefined()
      expect(result.penaltyBreakdown.length).toBeGreaterThan(0)

      // Check breakdown contains both late and condition penalties
      const lateBreakdown = result.penaltyBreakdown.find(b => b.type === 'late')
      const conditionBreakdown = result.penaltyBreakdown.find(b => b.type === 'condition')

      expect(lateBreakdown).toBeDefined()
      expect(conditionBreakdown).toBeDefined()
      expect(lateBreakdown?.amount).toBe(20000)
      expect(conditionBreakdown?.amount).toBe(25000)
    })
  })
})

describe('Performance and Reliability', () => {
  it('should handle large numbers of conditions efficiently', () => {
    const startTime = Date.now()

    // Create 100 conditions
    const manyConditions: ConditionSplit[] = Array.from({ length: 100 }, (_, index) => ({
      kondisiAkhir: `Condition ${index}`,
      jumlahKembali: 1,
      conditionCategory: 'KOTOR' as ConditionCategory,
      useManualPricing: index % 2 === 0, // Alternate manual/automatic
      manualPrice: index % 2 === 0 ? 5000 + index : 0
    }))

    const result = PenaltyCalculator.calculateEnhancedPenalty(
      mockTransactionItem,
      manyConditions,
      true
    )

    const executionTime = Date.now() - startTime

    expect(result.totalPenalty).toBeGreaterThan(0)
    expect(executionTime).toBeLessThan(1000) // Should complete within 1 second
  })

  it('should be deterministic with same inputs', () => {
    const conditions: ConditionSplit[] = [
      {
        kondisiAkhir: 'Deterministic test',
        jumlahKembali: 5,
        conditionCategory: 'RUSAK_RINGAN' as ConditionCategory,
        useManualPricing: true,
        manualPrice: 12000
      }
    ]

    const result1 = PenaltyCalculator.calculateEnhancedPenalty(
      mockTransactionItem,
      conditions,
      true
    )

    const result2 = PenaltyCalculator.calculateEnhancedPenalty(
      mockTransactionItem,
      conditions,
      true
    )

    expect(result1.totalPenalty).toBe(result2.totalPenalty)
    expect(result1.conditionPenalty).toBe(result2.conditionPenalty)
    expect(result1.flatLatePenalty).toBe(result2.flatLatePenalty)
  })
})

describe('API Integration Compatibility', () => {
  it('should produce output compatible with existing API response format', () => {
    const conditions: ConditionSplit[] = [
      {
        kondisiAkhir: 'API compatibility test',
        jumlahKembali: 2,
        conditionCategory: 'KOTOR' as ConditionCategory,
        useManualPricing: true,
        manualPrice: 7500
      }
    ]

    const result = PenaltyCalculator.calculateEnhancedPenalty(
      mockTransactionItem,
      conditions,
      true
    )

    // Check all required fields for API compatibility
    expect(result).toHaveProperty('totalPenalty')
    expect(result).toHaveProperty('flatLatePenalty')
    expect(result).toHaveProperty('conditionPenalty')
    expect(result).toHaveProperty('penaltyBreakdown')

    expect(typeof result.totalPenalty).toBe('number')
    expect(typeof result.flatLatePenalty).toBe('number')
    expect(typeof result.conditionPenalty).toBe('number')
    expect(Array.isArray(result.penaltyBreakdown)).toBe(true)
  })
})