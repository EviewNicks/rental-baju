/**
 * Enhanced PriceCalculator Unit Tests
 * Tests for discount system and duration packages
 */

import { describe, it, expect } from '@jest/globals'
import { PriceCalculator } from '@/features/kasir/lib/utils/priceCalculator'
import type { ProductSelection } from '@/features/kasir/types'

describe('PriceCalculator Enhanced Tests', () => {
  const mockItems: ProductSelection[] = [
    {
      product: {
        id: 'product-1',
        name: 'Test Product 1',
        pricePerDay: 50000, // Rp 50,000 per day
        category: 'Test Category',
        size: 'M',
        color: 'Blue',
        image: '/test.jpg',
        available: true,
      },
      quantity: 2,
      duration: 4,
      productSizeId: 'size-1',
    },
    {
      product: {
        id: 'product-2',
        name: 'Test Product 2',
        pricePerDay: 30000, // Rp 30,000 per day
        category: 'Test Category',
        size: 'L',
        color: 'Red',
        image: '/test2.jpg',
        available: true,
      },
      quantity: 1,
      duration: 4,
      productSizeId: 'size-2',
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
      expect(result.subtotal).toBe(130000) // (2×50k + 1×30k) × 1.0
      expect(result.discountAmount).toBe(0)
      expect(result.finalTotal).toBe(130000)
      
      // Check item calculations
      expect(result.itemCalculations).toHaveLength(2)
      expect(result.itemCalculations[0].adjustedPrice).toBe(100000) // 2×50k×1.0
      expect(result.itemCalculations[1].adjustedPrice).toBe(30000)  // 1×30k×1.0
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
      expect(result.subtotal).toBe(195000) // (2×50k + 1×30k) × 1.5
      expect(result.discountAmount).toBe(0)
      expect(result.finalTotal).toBe(195000)
      
      // Check item calculations
      expect(result.itemCalculations).toHaveLength(2)
      expect(result.itemCalculations[0].adjustedPrice).toBe(150000) // 2×50k×1.5
      expect(result.itemCalculations[1].adjustedPrice).toBe(45000)  // 1×30k×1.5
    })

    it('should calculate 4-day package with 10% discount', () => {
      const params = {
        items: mockItems,
        duration: 4 as 4 | 7,
        discountType: 'percent' as const,
        discountValue: 10,
      }

      const result = PriceCalculator.calculateTransactionTotalWithEnhancements(params)

      expect(result.duration).toBe(4)
      expect(result.durationMultiplier).toBe(1.0)
      expect(result.subtotal).toBe(130000)
      expect(result.discountAmount).toBe(13000) // 10% of 130k
      expect(result.finalTotal).toBe(117000) // 130k - 13k
    })

    it('should calculate 7-day package with 15% discount', () => {
      const params = {
        items: mockItems,
        duration: 7 as 4 | 7,
        discountType: 'percent' as const,
        discountValue: 15,
      }

      const result = PriceCalculator.calculateTransactionTotalWithEnhancements(params)

      expect(result.duration).toBe(7)
      expect(result.durationMultiplier).toBe(1.5)
      expect(result.subtotal).toBe(195000)
      expect(result.discountAmount).toBe(29250) // 15% of 195k
      expect(result.finalTotal).toBe(165750) // 195k - 29.25k
    })

    it('should calculate 4-day package with nominal discount', () => {
      const params = {
        items: mockItems,
        duration: 4 as 4 | 7,
        discountType: 'nominal' as const,
        discountValue: 20000,
      }

      const result = PriceCalculator.calculateTransactionTotalWithEnhancements(params)

      expect(result.duration).toBe(4)
      expect(result.subtotal).toBe(130000)
      expect(result.discountAmount).toBe(20000)
      expect(result.finalTotal).toBe(110000) // 130k - 20k
    })

    it('should calculate 7-day package with nominal discount', () => {
      const params = {
        items: mockItems,
        duration: 7 as 4 | 7,
        discountType: 'nominal' as const,
        discountValue: 25000,
      }

      const result = PriceCalculator.calculateTransactionTotalWithEnhancements(params)

      expect(result.duration).toBe(7)
      expect(result.subtotal).toBe(195000)
      expect(result.discountAmount).toBe(25000)
      expect(result.finalTotal).toBe(170000) // 195k - 25k
    })

    it('should prevent negative totals with excessive nominal discount', () => {
      const params = {
        items: mockItems,
        duration: 4 as 4 | 7,
        discountType: 'nominal' as const,
        discountValue: 200000, // More than subtotal
      }

      const result = PriceCalculator.calculateTransactionTotalWithEnhancements(params)

      expect(result.subtotal).toBe(130000)
      expect(result.discountAmount).toBe(130000) // Capped at subtotal
      expect(result.finalTotal).toBe(0) // Minimum 0
    })

    it('should handle zero discount value', () => {
      const params = {
        items: mockItems,
        duration: 4 as 4 | 7,
        discountType: 'percent' as const,
        discountValue: 0,
      }

      const result = PriceCalculator.calculateTransactionTotalWithEnhancements(params)

      expect(result.discountAmount).toBe(0)
      expect(result.finalTotal).toBe(130000)
    })

    it('should handle 100% discount', () => {
      const params = {
        items: mockItems,
        duration: 4 as 4 | 7,
        discountType: 'percent' as const,
        discountValue: 100,
      }

      const result = PriceCalculator.calculateTransactionTotalWithEnhancements(params)

      expect(result.discountAmount).toBe(130000)
      expect(result.finalTotal).toBe(0)
    })

    it('should handle single item transaction', () => {
      const singleItem: ProductSelection[] = [mockItems[0]]
      
      const params = {
        items: singleItem,
        duration: 4 as 4 | 7,
        discountType: null,
        discountValue: undefined,
      }

      const result = PriceCalculator.calculateTransactionTotalWithEnhancements(params)

      expect(result.subtotal).toBe(100000) // 2×50k×1.0
      expect(result.itemCalculations).toHaveLength(1)
    })

    it('should validate discount parameters', () => {
      const validation1 = PriceCalculator.validateDiscount('percent', 150, 100000)
      expect(validation1.isValid).toBe(false)
      expect(validation1.error).toContain('100%')

      const validation2 = PriceCalculator.validateDiscount('nominal', 150000, 100000)
      expect(validation2.isValid).toBe(false)
      expect(validation2.error).toContain('melebihi')

      const validation3 = PriceCalculator.validateDiscount('percent', -10, 100000)
      expect(validation3.isValid).toBe(false)
      expect(validation3.error).toContain('negatif')
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

      expect(result.subtotal).toBe(0)
      expect(result.finalTotal).toBe(0)
      expect(result.itemCalculations).toHaveLength(0)
    })

    it('should handle very large quantities', () => {
      const largeQuantityItems: ProductSelection[] = [{
        ...mockItems[0],
        quantity: 1000,
      }]

      const params = {
        items: largeQuantityItems,
        duration: 4 as 4 | 7,
        discountType: null,
        discountValue: undefined,
      }

      const result = PriceCalculator.calculateTransactionTotalWithEnhancements(params)

      expect(result.subtotal).toBe(50000000) // 1000×50k×1.0
    })

    it('should handle decimal prices correctly', () => {
      const decimalPriceItems: ProductSelection[] = [{
        product: {
          ...mockItems[0].product,
          pricePerDay: 33333.33,
        },
        quantity: 3,
        duration: 4,
        productSizeId: 'size-1',
      }]

      const params = {
        items: decimalPriceItems,
        duration: 4 as 4 | 7,
        discountType: null,
        discountValue: undefined,
      }

      const result = PriceCalculator.calculateTransactionTotalWithEnhancements(params)

      expect(result.subtotal).toBeCloseTo(99999.99, 2) // 3×33333.33×1.0
    })
  })
})