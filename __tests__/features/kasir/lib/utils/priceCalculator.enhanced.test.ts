/**
 * Enhanced PriceCalculator Unit Tests
 * Tests for discount system and duration packages
 */

import { describe, it, expect } from '@jest/globals'
import { Decimal } from '@prisma/client/runtime/library'
import { PriceCalculator } from '@/features/kasir/lib/utils/priceCalculator'

describe('PriceCalculator Enhanced Tests', () => {
  const mockItems = [
    {
      produkId: 'product-1',
      productSizeId: 'size-1',
      jumlah: 2,
      hargaSewa: new Decimal(50000), // Rp 50,000 per day
    },
    {
      produkId: 'product-2',
      productSizeId: 'size-2',
      jumlah: 1,
      hargaSewa: new Decimal(30000), // Rp 30,000 per day
    },
  ]

  describe('calculateTransactionTotalWithEnhancements', () => {
    it('should calculate 4-day package without discount', () => {
      const params = {
        items: mockItems,
        duration: 4 as 4 | 7,
        discountType: null,
        discountValue: undefined,
      }

      const result = PriceCalculator.calculateTransactionTotalWithEnhancements(params)

      expect(result.duration).toBe(4)
      expect(result.durationMultiplier).toBe(1.0)
      expect(Number(result.subtotal)).toBe(130000) // (2×50k + 1×30k) × 1.0
      expect(Number(result.discountAmount)).toBe(0)
      expect(Number(result.finalTotal)).toBe(130000)
      
      // Check item calculations
      expect(result.itemCalculations).toHaveLength(2)
      expect(Number(result.itemCalculations[0].adjustedPrice)).toBe(100000) // 2×50k×1.0
      expect(Number(result.itemCalculations[1].adjustedPrice)).toBe(30000)  // 1×30k×1.0
    })

    it('should calculate 7-day package without discount', () => {
      const params = {
        items: mockItems,
        duration: 7 as 4 | 7,
        discountType: null,
        discountValue: undefined,
      }

      const result = PriceCalculator.calculateTransactionTotalWithEnhancements(params)

      expect(result.duration).toBe(7)
      expect(result.durationMultiplier).toBe(1.5)
      expect(Number(result.subtotal)).toBe(195000) // (2×50k + 1×30k) × 1.5
      expect(Number(result.discountAmount)).toBe(0)
      expect(Number(result.finalTotal)).toBe(195000)
      
      // Check item calculations
      expect(Number(result.itemCalculations[0].adjustedPrice)).toBe(150000) // 2×50k×1.5
      expect(Number(result.itemCalculations[1].adjustedPrice)).toBe(45000)  // 1×30k×1.5
    })

    it('should calculate 4-day package with 10% discount', () => {
      const params = {
        items: mockItems,
        duration: 4 as 4 | 7,
        discountType: 'percent' as const,
        discountValue: 10,
      }

      const result = PriceCalculator.calculateTransactionTotalWithEnhancements(params)

      expect(Number(result.subtotal)).toBe(130000)
      expect(Number(result.discountAmount)).toBe(13000) // 10% of 130,000
      expect(Number(result.finalTotal)).toBe(117000) // 130,000 - 13,000
    })

    it('should calculate 7-day package with 15% discount', () => {
      const params = {
        items: mockItems,
        duration: 7 as 4 | 7,
        discountType: 'percent' as const,
        discountValue: 15,
      }

      const result = PriceCalculator.calculateTransactionTotalWithEnhancements(params)

      expect(Number(result.subtotal)).toBe(195000) // (130k × 1.5)
      expect(Number(result.discountAmount)).toBe(29250) // 15% of 195,000
      expect(Number(result.finalTotal)).toBe(165750) // 195,000 - 29,250
    })

    it('should calculate 4-day package with nominal discount', () => {
      const params = {
        items: mockItems,
        duration: 4 as 4 | 7,
        discountType: 'nominal' as const,
        discountValue: 25000,
      }

      const result = PriceCalculator.calculateTransactionTotalWithEnhancements(params)

      expect(Number(result.subtotal)).toBe(130000)
      expect(Number(result.discountAmount)).toBe(25000)
      expect(Number(result.finalTotal)).toBe(105000) // 130,000 - 25,000
    })

    it('should calculate 7-day package with nominal discount', () => {
      const params = {
        items: mockItems,
        duration: 7 as 4 | 7,
        discountType: 'nominal' as const,
        discountValue: 50000,
      }

      const result = PriceCalculator.calculateTransactionTotalWithEnhancements(params)

      expect(Number(result.subtotal)).toBe(195000)
      expect(Number(result.discountAmount)).toBe(50000)
      expect(Number(result.finalTotal)).toBe(145000) // 195,000 - 50,000
    })

    it('should prevent negative totals with excessive nominal discount', () => {
      const params = {
        items: mockItems,
        duration: 4 as 4 | 7,
        discountType: 'nominal' as const,
        discountValue: 200000, // More than subtotal
      }

      const result = PriceCalculator.calculateTransactionTotalWithEnhancements(params)

      expect(Number(result.subtotal)).toBe(130000)
      expect(Number(result.discountAmount)).toBe(130000) // Capped at subtotal
      expect(Number(result.finalTotal)).toBe(0) // Minimum is 0
    })

    it('should handle zero discount value', () => {
      const params = {
        items: mockItems,
        duration: 4 as 4 | 7,
        discountType: 'percent' as const,
        discountValue: 0,
      }

      const result = PriceCalculator.calculateTransactionTotalWithEnhancements(params)

      expect(Number(result.discountAmount)).toBe(0)
      expect(Number(result.finalTotal)).toBe(130000) // Same as subtotal
    })

    it('should handle 100% discount', () => {
      const params = {
        items: mockItems,
        duration: 4 as 4 | 7,
        discountType: 'percent' as const,
        discountValue: 100,
      }

      const result = PriceCalculator.calculateTransactionTotalWithEnhancements(params)

      expect(Number(result.discountAmount)).toBe(130000) // 100% of subtotal
      expect(Number(result.finalTotal)).toBe(0)
    })

    it('should handle single item transaction', () => {
      const singleItem = [
        {
          produkId: 'product-1',
          productSizeId: 'size-1',
          jumlah: 1,
          hargaSewa: new Decimal(75000),
        },
      ]

      const params = {
        items: singleItem,
        duration: 7 as 4 | 7,
        discountType: 'percent' as const,
        discountValue: 20,
      }

      const result = PriceCalculator.calculateTransactionTotalWithEnhancements(params)

      expect(Number(result.subtotal)).toBe(112500) // 75k × 1.5
      expect(Number(result.discountAmount)).toBe(22500) // 20% of 112,500
      expect(Number(result.finalTotal)).toBe(90000)
    })

    it('should validate discount parameters', () => {
      // Test with discount type but no value
      const params1 = {
        items: mockItems,
        duration: 4 as 4 | 7,
        discountType: 'percent' as const,
        discountValue: undefined,
      }

      const result1 = PriceCalculator.calculateTransactionTotalWithEnhancements(params1)
      expect(Number(result1.discountAmount)).toBe(0) // No discount applied

      // Test with discount value but no type
      const params2 = {
        items: mockItems,
        duration: 4 as 4 | 7,
        discountType: null,
        discountValue: 10,
      }

      const result2 = PriceCalculator.calculateTransactionTotalWithEnhancements(params2)
      expect(Number(result2.discountAmount)).toBe(0) // No discount applied
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty items array', () => {
      const params = {
        items: [],
        duration: 4 as 4 | 7,
        discountType: null,
        discountValue: undefined,
      }

      const result = PriceCalculator.calculateTransactionTotalWithEnhancements(params)

      expect(Number(result.subtotal)).toBe(0)
      expect(Number(result.discountAmount)).toBe(0)
      expect(Number(result.finalTotal)).toBe(0)
      expect(result.itemCalculations).toHaveLength(0)
    })

    it('should handle very large quantities', () => {
      const largeQuantityItems = [
        {
          produkId: 'product-1',
          productSizeId: 'size-1',
          jumlah: 100,
          hargaSewa: new Decimal(10000),
        },
      ]

      const params = {
        items: largeQuantityItems,
        duration: 7 as 4 | 7,
        discountType: 'percent' as const,
        discountValue: 5,
      }

      const result = PriceCalculator.calculateTransactionTotalWithEnhancements(params)

      expect(Number(result.subtotal)).toBe(1500000) // 100 × 10k × 1.5
      expect(Number(result.discountAmount)).toBe(75000) // 5% of 1,500,000
      expect(Number(result.finalTotal)).toBe(1425000)
    })

    it('should handle decimal prices correctly', () => {
      const decimalItems = [
        {
          produkId: 'product-1',
          productSizeId: 'size-1',
          jumlah: 3,
          hargaSewa: new Decimal(33333.33), // Price with decimals
        },
      ]

      const params = {
        items: decimalItems,
        duration: 4 as 4 | 7,
        discountType: 'percent' as const,
        discountValue: 10,
      }

      const result = PriceCalculator.calculateTransactionTotalWithEnhancements(params)

      expect(Number(result.subtotal)).toBeCloseTo(99999.99, 2)
      expect(Number(result.discountAmount)).toBeCloseTo(10000, 2)
      expect(Number(result.finalTotal)).toBeCloseTo(89999.99, 2)
    })
  })
})