/**
 * PenaltyCalculator Test Suite - TSK-23 Enhancement
 * Testing modalAwal-based penalty calculations for lost items
 * Following TDD approach and comprehensive coverage
 */

import { PenaltyCalculator, PenaltyDetails, PenaltyCalculationResult } from './penaltyCalculator'

describe('PenaltyCalculator', () => {
  const testDate = new Date('2025-01-01T10:00:00.000Z')
  const lateDate = new Date('2025-01-04T10:00:00.000Z') // 3 days late
  const veryLateDate = new Date('2025-01-11T10:00:00.000Z') // 10 days late

  describe('calculateLatePenalty', () => {
    it('should calculate no penalty for on-time return', () => {
      const penalty = PenaltyCalculator.calculateLatePenalty(lateDate, testDate, 5000)
      expect(penalty).toBe(0)
    })

    it('should calculate penalty for late return with default rate', () => {
      const penalty = PenaltyCalculator.calculateLatePenalty(testDate, lateDate, 5000)
      expect(penalty).toBe(15000) // 3 days * 5000
    })

    it('should cap penalty at maximum days (365)', () => {
      const veryLateDate = new Date('2026-01-02T10:00:00.000Z') // 366 days late
      const penalty = PenaltyCalculator.calculateLatePenalty(testDate, veryLateDate, 5000)
      expect(penalty).toBe(1825000) // 365 days * 5000 (capped)
    })

    it('should handle fractional days by rounding up', () => {
      const halfDayLate = new Date('2025-01-01T22:00:00.000Z') // ~12 hours late
      const penalty = PenaltyCalculator.calculateLatePenalty(testDate, halfDayLate, 5000)
      expect(penalty).toBe(5000) // Rounded up to 1 day
    })
  })

  describe('calculateConditionPenalty', () => {
    describe('good conditions - no penalty', () => {
      it('should return zero penalty for perfect condition', () => {
        const result = PenaltyCalculator.calculateConditionPenalty('Baik - tidak ada kerusakan', 5000)
        expect(result.penalty).toBe(0)
        expect(result.reasonCode).toBe('on_time')
        expect(result.description).toContain('baik')
      })
    })

    describe('minor damage conditions', () => {
      it('should apply 1x daily rate for light dirt', () => {
        const result = PenaltyCalculator.calculateConditionPenalty('Baik - sedikit kotor/kusut', 5000)
        expect(result.penalty).toBe(5000) // 1x daily rate
        expect(result.reasonCode).toBe('damaged')
        expect(result.description).toContain('kerusakan ringan')
      })

      it('should apply 1x daily rate for light stains', () => {
        const result = PenaltyCalculator.calculateConditionPenalty('Cukup - ada noda ringan', 5000)
        expect(result.penalty).toBe(5000)
        expect(result.reasonCode).toBe('damaged')
      })
    })

    describe('moderate damage conditions', () => {
      it('should apply 2x daily rate for small damage', () => {
        const result = PenaltyCalculator.calculateConditionPenalty('Cukup - ada kerusakan kecil', 5000)
        expect(result.penalty).toBe(10000) // 2x daily rate
        expect(result.reasonCode).toBe('damaged')
        expect(result.description).toContain('kerusakan sedang')
      })

      it('should apply 2x daily rate for heavy stains', () => {
        const result = PenaltyCalculator.calculateConditionPenalty('Buruk - ada noda berat', 5000)
        expect(result.penalty).toBe(10000)
        expect(result.reasonCode).toBe('damaged')
      })
    })

    describe('severe damage conditions', () => {
      it('should apply 4x daily rate for major damage', () => {
        const result = PenaltyCalculator.calculateConditionPenalty('Buruk - ada kerusakan besar', 5000)
        expect(result.penalty).toBe(20000) // 4x daily rate
        expect(result.reasonCode).toBe('damaged')
        expect(result.description).toContain('kerusakan berat')
      })
    })

    describe('lost item conditions - modalAwal integration', () => {
      it('should use modalAwal when provided for lost items', () => {
        const modalAwal = 75000
        const result = PenaltyCalculator.calculateConditionPenalty(
          'Hilang/tidak dikembalikan', 
          5000, 
          modalAwal
        )
        expect(result.penalty).toBe(75000) // Uses modalAwal instead of 150K
        expect(result.reasonCode).toBe('lost')
        expect(result.description).toContain('modal awal produk')
        expect(result.description).toContain('75.000')
      })

      it('should use modalAwal for different lost conditions', () => {
        const modalAwal = 120000
        const result = PenaltyCalculator.calculateConditionPenalty(
          'Item hilang dan tidak dapat dikembalikan', 
          5000, 
          modalAwal
        )
        expect(result.penalty).toBe(120000)
        expect(result.reasonCode).toBe('lost')
      })

      it('should fallback to old calculation when modalAwal not provided', () => {
        const result = PenaltyCalculator.calculateConditionPenalty('Hilang/tidak dikembalikan', 5000)
        expect(result.penalty).toBe(150000) // 30 days * 5000 (old calculation)
        expect(result.reasonCode).toBe('lost')
        expect(result.description).not.toContain('modal awal')
      })

      it('should handle zero modalAwal gracefully', () => {
        const result = PenaltyCalculator.calculateConditionPenalty(
          'Hilang/tidak dikembalikan', 
          5000, 
          0
        )
        expect(result.penalty).toBe(150000) // Fallback to old calculation
        expect(result.description).not.toContain('modal awal')
      })
    })

    describe('unrecognized conditions', () => {
      it('should apply default moderate penalty for unknown conditions', () => {
        const result = PenaltyCalculator.calculateConditionPenalty('Kondisi tidak dikenal', 5000)
        expect(result.penalty).toBe(10000) // 2x daily rate
        expect(result.reasonCode).toBe('damaged')
        expect(result.description).toContain('tidak standar')
      })
    })
  })

  describe('calculateItemPenalty', () => {
    const baseItem = {
      id: 'item-1',
      productName: 'Baju Test',
      expectedReturnDate: testDate,
      condition: 'Baik - tidak ada kerusakan',
      quantity: 1
    }

    it('should calculate penalty for on-time return with good condition', () => {
      const item = { ...baseItem, actualReturnDate: testDate }
      const result = PenaltyCalculator.calculateItemPenalty(item, 5000)
      
      expect(result.totalPenalty).toBe(0)
      expect(result.reasonCode).toBe('on_time')
      expect(result.lateDays).toBe(0)
      expect(result.modalAwal).toBeUndefined()
    })

    it('should calculate penalty for late return with good condition', () => {
      const item = { ...baseItem, actualReturnDate: lateDate }
      const result = PenaltyCalculator.calculateItemPenalty(item, 5000)
      
      expect(result.totalPenalty).toBe(15000) // 3 days * 5000
      expect(result.reasonCode).toBe('late')
      expect(result.lateDays).toBe(3)
      expect(result.description).toContain('Keterlambatan pengembalian 3 hari')
    })

    it('should calculate penalty for lost item with modalAwal', () => {
      const modalAwal = 85000
      const item = { 
        ...baseItem, 
        actualReturnDate: testDate,
        condition: 'Hilang/tidak dikembalikan',
        modalAwal
      }
      const result = PenaltyCalculator.calculateItemPenalty(item, 5000)
      
      expect(result.totalPenalty).toBe(85000) // Uses modalAwal
      expect(result.reasonCode).toBe('lost')
      expect(result.modalAwal).toBe(85000)
      expect(result.description).toContain('modal awal produk')
    })

    it('should calculate combined penalty for late + damaged item', () => {
      const item = { 
        ...baseItem, 
        actualReturnDate: lateDate,
        condition: 'Cukup - ada kerusakan kecil'
      }
      const result = PenaltyCalculator.calculateItemPenalty(item, 5000)
      
      expect(result.totalPenalty).toBe(25000) // (3 days * 5000) + (2x * 5000)
      expect(result.reasonCode).toBe('damaged') // Damage takes priority
      expect(result.lateDays).toBe(3)
      expect(result.description).toContain('Kombinasi keterlambatan 3 hari')
    })

    it('should multiply penalty by quantity', () => {
      const item = { 
        ...baseItem, 
        actualReturnDate: lateDate,
        quantity: 3
      }
      const result = PenaltyCalculator.calculateItemPenalty(item, 5000)
      
      expect(result.totalPenalty).toBe(45000) // 3 days * 5000 * 3 items
      expect(result.lateDays).toBe(3)
    })

    it('should prioritize lost over damaged in reason code', () => {
      const modalAwal = 90000
      const item = { 
        ...baseItem, 
        actualReturnDate: lateDate, // Also late
        condition: 'Hilang/tidak dikembalikan',
        modalAwal
      }
      const result = PenaltyCalculator.calculateItemPenalty(item, 5000)
      
      expect(result.reasonCode).toBe('lost') // Lost takes highest priority
      expect(result.totalPenalty).toBe((15000 + 90000) * 1) // Late + lost
    })
  })

  describe('calculateTransactionPenalties', () => {
    const items = [
      {
        id: 'item-1',
        productName: 'Baju A',
        expectedReturnDate: testDate,
        actualReturnDate: testDate,
        condition: 'Baik - tidak ada kerusakan',
        quantity: 1
      },
      {
        id: 'item-2', 
        productName: 'Baju B',
        expectedReturnDate: testDate,
        actualReturnDate: lateDate,
        condition: 'Cukup - ada noda ringan',
        quantity: 2
      },
      {
        id: 'item-3',
        productName: 'Baju C',
        expectedReturnDate: testDate,
        actualReturnDate: testDate,
        condition: 'Hilang/tidak dikembalikan',
        quantity: 1,
        modalAwal: 95000
      }
    ]

    it('should calculate penalties for multiple items', () => {
      const result = PenaltyCalculator.calculateTransactionPenalties(items, 5000)
      
      // Item 1: 0 (on time, good condition)
      // Item 2: (3 days * 5000 + 1x * 5000) * 2 = 40000  
      // Item 3: 95000 (modalAwal for lost item)
      // Total: 135000
      expect(result.totalPenalty).toBe(135000)
      expect(result.totalLateDays).toBe(3) // Only item 2 is late
      expect(result.itemPenalties).toHaveLength(3)
    })

    it('should provide correct summary statistics', () => {
      const result = PenaltyCalculator.calculateTransactionPenalties(items, 5000)
      
      expect(result.summary.onTimeItems).toBe(0) // Item 1 has no penalty but item 2 is late+damaged
      expect(result.summary.lateItems).toBe(0) // Item 2 is damaged (priority)
      expect(result.summary.damagedItems).toBe(1) // Item 2
      expect(result.summary.lostItems).toBe(1) // Item 3
    })

    it('should handle empty items array', () => {
      const result = PenaltyCalculator.calculateTransactionPenalties([], 5000)
      
      expect(result.totalPenalty).toBe(0)
      expect(result.totalLateDays).toBe(0)
      expect(result.itemPenalties).toHaveLength(0)
      expect(result.summary.onTimeItems).toBe(0)
      expect(result.summary.lateItems).toBe(0)
      expect(result.summary.damagedItems).toBe(0)
      expect(result.summary.lostItems).toBe(0)
    })
  })

  describe('utility methods', () => {
    describe('formatPenaltyAmount', () => {
      it('should format penalty amount to Indonesian Rupiah', () => {
        expect(PenaltyCalculator.formatPenaltyAmount(75000)).toBe('Rp 75.000')
        expect(PenaltyCalculator.formatPenaltyAmount(1500000)).toBe('Rp 1.500.000')
        expect(PenaltyCalculator.formatPenaltyAmount(0)).toBe('Rp 0')
      })
    })

    describe('generatePenaltyDescription', () => {
      it('should generate description for zero penalty', () => {
        const penalty: PenaltyDetails = {
          itemId: 'item-1',
          productName: 'Test Item',
          expectedReturnDate: testDate,
          actualReturnDate: testDate,
          lateDays: 0,
          dailyPenaltyRate: 5000,
          totalPenalty: 0,
          reasonCode: 'on_time',
          description: 'No penalty'
        }
        
        const result = PenaltyCalculator.generatePenaltyDescription(penalty)
        expect(result).toContain('Tidak ada penalty')
        expect(result).toContain('tepat waktu')
      })

      it('should generate description with formatted amount', () => {
        const penalty: PenaltyDetails = {
          itemId: 'item-1',
          productName: 'Test Item',
          expectedReturnDate: testDate,
          actualReturnDate: lateDate,
          lateDays: 3,
          dailyPenaltyRate: 5000,
          modalAwal: 75000,
          totalPenalty: 75000,
          reasonCode: 'lost',
          description: 'Item lost'
        }
        
        const result = PenaltyCalculator.generatePenaltyDescription(penalty)
        expect(result).toContain('Rp 75.000')
        expect(result).toContain('Item lost')
      })
    })

    describe('validatePenaltyInputs', () => {
      it('should validate correct inputs', () => {
        const result = PenaltyCalculator.validatePenaltyInputs(
          testDate,
          lateDate,
          'Baik - tidak ada kerusakan',
          2
        )
        
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should detect invalid dates', () => {
        const invalidDate = new Date('invalid')
        const result = PenaltyCalculator.validatePenaltyInputs(
          invalidDate,
          lateDate,
          'Good condition',
          1
        )
        
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Tanggal yang diharapkan tidak valid')
      })

      it('should detect empty condition', () => {
        const result = PenaltyCalculator.validatePenaltyInputs(
          testDate,
          lateDate,
          '',
          1
        )
        
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Kondisi barang harus diisi')
      })

      it('should detect invalid quantity', () => {
        const result = PenaltyCalculator.validatePenaltyInputs(
          testDate,
          lateDate,
          'Good condition',
          0
        )
        
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Jumlah barang harus berupa bilangan bulat positif')
      })

      it('should detect very old return dates', () => {
        const oldDate = new Date('2023-01-01') // More than 1 year ago
        const result = PenaltyCalculator.validatePenaltyInputs(
          testDate,
          oldDate,
          'Good condition',
          1
        )
        
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Tanggal pengembalian tidak boleh lebih dari 1 tahun yang lalu')
      })

      it('should accumulate multiple errors', () => {
        const result = PenaltyCalculator.validatePenaltyInputs(
          new Date('invalid'),
          new Date('invalid'),
          '',
          -1
        )
        
        expect(result.isValid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(1)
      })
    })

    describe('getBusinessRules', () => {
      it('should return current business rules configuration', () => {
        const rules = PenaltyCalculator.getBusinessRules()
        
        expect(rules.defaultDailyRate).toBe(5000)
        expect(rules.damagePenaltyMultiplier).toBe(2)
        expect(rules.lostItemPenaltyDays).toBe(30)
        expect(rules.maxPenaltyDays).toBe(365)
        expect(rules.supportedConditions).toHaveLength(7)
        expect(rules.supportedConditions).toContain('Hilang/tidak dikembalikan')
      })
    })
  })

  describe('edge cases and boundary conditions', () => {
    it('should handle very large modalAwal values', () => {
      const largeModalAwal = 10000000 // 10 million
      const result = PenaltyCalculator.calculateConditionPenalty(
        'Hilang/tidak dikembalikan',
        5000,
        largeModalAwal
      )
      
      expect(result.penalty).toBe(largeModalAwal)
      expect(result.reasonCode).toBe('lost')
    })

    it('should handle leap year date calculations', () => {
      const leapYearStart = new Date('2024-02-28T10:00:00.000Z')
      const leapYearEnd = new Date('2024-03-01T10:00:00.000Z') // 2 days in leap year
      
      const penalty = PenaltyCalculator.calculateLatePenalty(leapYearStart, leapYearEnd, 5000)
      expect(penalty).toBe(10000) // 2 days * 5000
    })

    it('should handle timezone differences correctly', () => {
      const utcDate = new Date('2025-01-01T00:00:00.000Z')
      const jakartaDate = new Date('2025-01-01T07:00:00.000Z') // Same day in Jakarta
      
      const penalty = PenaltyCalculator.calculateLatePenalty(utcDate, jakartaDate, 5000)
      expect(penalty).toBe(5000) // Should be 1 day difference
    })

    it('should handle case-insensitive condition matching', () => {
      const conditions = [
        'HILANG/TIDAK DIKEMBALIKAN',
        'hilang/tidak dikembalikan', 
        'Hilang/Tidak Dikembalikan'
      ]
      
      conditions.forEach(condition => {
        const result = PenaltyCalculator.calculateConditionPenalty(condition, 5000, 50000)
        expect(result.penalty).toBe(50000)
        expect(result.reasonCode).toBe('lost')
      })
    })
  })
})