/**
 * Unit Tests for Price Calculator Pairing Logic
 * Tests specific pairing scenarios and edge cases
 */

import { PriceCalculator } from '../priceCalculator'
import type { ProductSelection, Product, ProductSize } from '../../../types'

// Mock product data for testing
const mockJasProduct: Product = {
  id: 'jas-1',
  name: 'Jas Premium',
  code: 'JP001',
  category: 'jas-premium',
  categoryType: 'clothing',
  size: 'L',
  color: 'Black',
  pricePerDay: 50000,
  image: 'jas.jpg',
  available: true,
  availableQuantity: 10
}

const mockNonJasProduct: Product = {
  id: 'kemeja-1',
  name: 'Kemeja Putih',
  code: 'KP001',
  category: 'kemeja',
  categoryType: 'clothing',
  size: 'L',
  color: 'White',
  pricePerDay: 30000,
  image: 'kemeja.jpg',
  available: true,
  availableQuantity: 8
}

const mockProductSize: ProductSize = {
  id: 'size-1',
  productId: 'sarung-1',
  ageCategory: 'ADULT',
  size: 'UNIVERSAL',
  quantity: 5,
  availableQuantity: 5,
  rentedStock: 0,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

describe('PriceCalculator Pairing Logic', () => {
  describe('calculatePairingPrice', () => {
    it('should calculate jas price only for 4-day duration', () => {
      const jasItem: ProductSelection = {
        product: mockJasProduct,
        quantity: 2,
        duration: 4,
        linkedSarung: {
          productId: 'sarung-1',
          productSizeId: 'size-1',
          quantity: 2,
          selectedSize: mockProductSize
        }
      }

      const result = PriceCalculator.calculatePairingPrice(jasItem, 4)
      
      // Should only charge for jas: 50000 * 2 * 1.0 = 100000
      expect(result).toBe(100000)
    })

    it('should calculate jas price only for 7-day duration with multiplier', () => {
      const jasItem: ProductSelection = {
        product: mockJasProduct,
        quantity: 1,
        duration: 7,
        linkedSarung: {
          productId: 'sarung-1',
          productSizeId: 'size-1',
          quantity: 1,
          selectedSize: mockProductSize
        }
      }

      const result = PriceCalculator.calculatePairingPrice(jasItem, 7)
      
      // Should only charge for jas: 50000 * 1 * 1.5 = 75000
      expect(result).toBe(75000)
    })

    it('should work without linked sarung', () => {
      const jasItem: ProductSelection = {
        product: mockJasProduct,
        quantity: 1,
        duration: 4
      }

      const result = PriceCalculator.calculatePairingPrice(jasItem, 4)
      
      // Should charge for jas only: 50000 * 1 * 1.0 = 50000
      expect(result).toBe(50000)
    })
  })

  describe('validatePairingData', () => {
    it('should validate valid pairing data', () => {
      const validItem: ProductSelection = {
        product: mockJasProduct,
        quantity: 2,
        duration: 4,
        linkedSarung: {
          productId: 'sarung-1',
          productSizeId: 'size-1',
          quantity: 2,
          selectedSize: mockProductSize
        }
      }

      const result = PriceCalculator.validatePairingData(validItem)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject sarung paired with non-jas product', () => {
      const invalidItem: ProductSelection = {
        product: mockNonJasProduct,
        quantity: 1,
        duration: 4,
        linkedSarung: {
          productId: 'sarung-1',
          productSizeId: 'size-1',
          quantity: 1,
          selectedSize: mockProductSize
        }
      }

      const result = PriceCalculator.validatePairingData(invalidItem)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Sarung hanya dapat dipasangkan dengan produk jas')
    })

    it('should reject sarung quantity exceeding jas quantity', () => {
      const invalidItem: ProductSelection = {
        product: mockJasProduct,
        quantity: 1,
        duration: 4,
        linkedSarung: {
          productId: 'sarung-1',
          productSizeId: 'size-1',
          quantity: 3, // More than jas quantity
          selectedSize: mockProductSize
        }
      }

      const result = PriceCalculator.validatePairingData(invalidItem)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Jumlah sarung tidak boleh melebihi jumlah jas')
    })

    it('should reject zero sarung quantity', () => {
      const invalidItem: ProductSelection = {
        product: mockJasProduct,
        quantity: 2,
        duration: 4,
        linkedSarung: {
          productId: 'sarung-1',
          productSizeId: 'size-1',
          quantity: 0,
          selectedSize: mockProductSize
        }
      }

      const result = PriceCalculator.validatePairingData(invalidItem)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Jumlah sarung harus lebih dari 0')
    })

    it('should accept item without linked sarung', () => {
      const validItem: ProductSelection = {
        product: mockJasProduct,
        quantity: 1,
        duration: 4
      }

      const result = PriceCalculator.validatePairingData(validItem)
      expect(result.isValid).toBe(true)
    })
  })

  describe('calculateSubtotalExcludingSarung', () => {
    it('should exclude sarung prices from subtotal', () => {
      const items: ProductSelection[] = [
        {
          product: mockJasProduct,
          quantity: 1,
          duration: 4,
          linkedSarung: {
            productId: 'sarung-1',
            productSizeId: 'size-1',
            quantity: 1,
            selectedSize: mockProductSize
          }
        },
        {
          product: mockNonJasProduct,
          quantity: 2,
          duration: 4
        }
      ]

      const result = PriceCalculator.calculateSubtotalExcludingSarung(items, 4)
      
      // Should only include: jas (50000 * 1) + kemeja (30000 * 2) = 110000
      // Sarung should be excluded even though it's in linkedSarung
      expect(result).toBe(110000)
    })

    it('should apply duration multiplier correctly', () => {
      const items: ProductSelection[] = [
        {
          product: mockJasProduct,
          quantity: 1,
          duration: 7,
          linkedSarung: {
            productId: 'sarung-1',
            productSizeId: 'size-1',
            quantity: 1,
            selectedSize: mockProductSize
          }
        }
      ]

      const result = PriceCalculator.calculateSubtotalExcludingSarung(items, 7)
      
      // Should include: jas (50000 * 1 * 1.5) = 75000
      expect(result).toBe(75000)
    })
  })

  describe('getPairingSummary', () => {
    it('should correctly categorize items and count pairings', () => {
      const items: ProductSelection[] = [
        {
          product: mockJasProduct,
          quantity: 1,
          duration: 4,
          linkedSarung: {
            productId: 'sarung-1',
            productSizeId: 'size-1',
            quantity: 1,
            selectedSize: mockProductSize
          }
        },
        {
          product: mockNonJasProduct,
          quantity: 1,
          duration: 4
        }
      ]

      const result = PriceCalculator.getPairingSummary(items)
      
      expect(result.totalPairings).toBe(1)
      expect(result.jasItems).toHaveLength(1)
      expect(result.nonJasItems).toHaveLength(1)
      expect(result.pairingDetails).toHaveLength(1)
      expect(result.pairingDetails[0].sarungProduct).toBeTruthy()
    })

    it('should handle jas without sarung pairing', () => {
      const items: ProductSelection[] = [
        {
          product: mockJasProduct,
          quantity: 1,
          duration: 4
          // No linkedSarung
        }
      ]

      const result = PriceCalculator.getPairingSummary(items)
      
      expect(result.totalPairings).toBe(0)
      expect(result.jasItems).toHaveLength(1)
      expect(result.pairingDetails).toHaveLength(1)
      expect(result.pairingDetails[0].sarungProduct).toBeNull()
    })
  })

  describe('validateAllPairings', () => {
    it('should validate multiple items successfully', () => {
      const items: ProductSelection[] = [
        {
          product: mockJasProduct,
          quantity: 1,
          duration: 4,
          linkedSarung: {
            productId: 'sarung-1',
            productSizeId: 'size-1',
            quantity: 1,
            selectedSize: mockProductSize
          }
        },
        {
          product: mockNonJasProduct,
          quantity: 1,
          duration: 4
        }
      ]

      const result = PriceCalculator.validateAllPairings(items)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should collect multiple validation errors', () => {
      const items: ProductSelection[] = [
        {
          product: mockNonJasProduct, // Non-jas with sarung - invalid
          quantity: 1,
          duration: 4,
          linkedSarung: {
            productId: 'sarung-1',
            productSizeId: 'size-1',
            quantity: 1,
            selectedSize: mockProductSize
          }
        },
        {
          product: mockJasProduct,
          quantity: 1,
          duration: 4,
          linkedSarung: {
            productId: 'sarung-1',
            productSizeId: 'size-1',
            quantity: 3, // Exceeds jas quantity - invalid
            selectedSize: mockProductSize
          }
        }
      ]

      const result = PriceCalculator.validateAllPairings(items)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(2)
      expect(result.errors[0]).toContain('Sarung hanya dapat dipasangkan dengan produk jas')
      expect(result.errors[1]).toContain('Jumlah sarung tidak boleh melebihi jumlah jas')
    })

    it('should generate warnings for jas without sarung', () => {
      const items: ProductSelection[] = [
        {
          product: mockJasProduct,
          quantity: 1,
          duration: 4
          // No linkedSarung - should generate warning
        }
      ]

      const result = PriceCalculator.validateAllPairings(items)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toContain('tidak dipasangkan dengan sarung')
    })
  })

  describe('calculatePairingBreakdown', () => {
    it('should provide detailed breakdown for pairing', () => {
      const items: ProductSelection[] = [
        {
          product: mockJasProduct,
          quantity: 1,
          duration: 4,
          linkedSarung: {
            productId: 'sarung-1',
            productSizeId: 'size-1',
            quantity: 1,
            selectedSize: mockProductSize
          }
        }
      ]

      const result = PriceCalculator.calculatePairingBreakdown(items, 4)
      
      expect(result.jasTotal).toBe(50000)
      expect(result.sarungTotal).toBe(0) // Always 0 for linked sarung
      expect(result.grandTotal).toBe(50000) // Only jas counts
      expect(result.itemBreakdowns).toHaveLength(1)
      expect(result.itemBreakdowns[0].linkedSarung?.finalPrice).toBe(0)
    })

    it('should handle mixed items correctly', () => {
      const items: ProductSelection[] = [
        {
          product: mockJasProduct,
          quantity: 1,
          duration: 7,
          linkedSarung: {
            productId: 'sarung-1',
            productSizeId: 'size-1',
            quantity: 1,
            selectedSize: mockProductSize
          }
        },
        {
          product: mockNonJasProduct,
          quantity: 2,
          duration: 7
        }
      ]

      const result = PriceCalculator.calculatePairingBreakdown(items, 7)
      
      // Jas: 50000 * 1 * 1.5 = 75000
      // Kemeja: 30000 * 2 * 1.5 = 90000
      // Total: 165000 (sarung is free)
      expect(result.jasTotal).toBe(75000)
      expect(result.grandTotal).toBe(165000)
      expect(result.itemBreakdowns).toHaveLength(2)
    })
  })
})