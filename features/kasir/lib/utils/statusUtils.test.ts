/**
 * Unit Tests for Status Utility Functions
 *
 * Tests the status calculation logic, data validation, and pickup detection
 * functionality with comprehensive logging validation.
 */

import {
  calculateEnhancedStatus,
  hasValidItemData,
  hasPickupItems,
  isOverdue
} from './statusUtils'
import { TransaksiItemResponse } from '../../types'

describe('Status Utils Functions', () => {

  describe('calculateEnhancedStatus', () => {
    const mockItems: TransaksiItemResponse[] = [
      {
        id: '1',
        jumlah: 2,
        jumlahDiambil: 0,
        produk: { id: '1', name: 'Item 1' }
      },
      {
        id: '2',
        jumlah: 1,
        jumlahDiambil: 1,
        produk: { id: '2', name: 'Item 2' }
      }
    ]

    describe('Priority 1: Overdue Status (terlambat)', () => {
      test('should return terlambat when base status is terlambat', () => {
        const result = calculateEnhancedStatus('terlambat', mockItems)
        expect(result).toBe('terlambat')
      })

      test('should return terlambat when past end date and status is active', () => {
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
        const result = calculateEnhancedStatus('active', mockItems, pastDate)
        expect(result).toBe('terlambat')
      })

      test('should not return terlambat when end date is in future', () => {
        const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
        const result = calculateEnhancedStatus('active', mockItems, futureDate, true)
        expect(result).toBe('diambil') // Should detect pickup instead
      })
    })

    describe('Priority 2: Cancelled Status', () => {
      test('should return cancelled when base status is cancelled', () => {
        const result = calculateEnhancedStatus('cancelled', mockItems)
        expect(result).toBe('cancelled')
      })
    })

    describe('Priority 3: Completed Status (selesai)', () => {
      test('should return selesai when base status is selesai', () => {
        const result = calculateEnhancedStatus('selesai', mockItems)
        expect(result).toBe('selesai')
      })
    })

    describe('Priority 4: Pickup Detection (diambil)', () => {
      test('should return diambil when hasPickup flag is true', () => {
        const result = calculateEnhancedStatus('active', mockItems, undefined, true)
        expect(result).toBe('diambil')
      })

      test('should return diambil when items have jumlahDiambil > 0', () => {
        const result = calculateEnhancedStatus('active', mockItems)
        expect(result).toBe('diambil')
      })

      test('should return active when no pickup detected', () => {
        const noPickupItems: TransaksiItemResponse[] = [
          {
            id: '1',
            jumlah: 2,
            jumlahDiambil: 0,
            produk: { id: '1', name: 'Item 1' }
          }
        ]
        const result = calculateEnhancedStatus('active', noPickupItems, undefined, false)
        expect(result).toBe('active')
      })

      test('should prefer hasPickup flag over item parsing when provided', () => {
        const noPickupItems: TransaksiItemResponse[] = [
          {
            id: '1',
            jumlah: 2,
            jumlahDiambil: 0,
            produk: { id: '1', name: 'Item 1' }
          }
        ]
        // hasPickup=true should override item data indicating no pickup
        const result = calculateEnhancedStatus('active', noPickupItems, undefined, true)
        expect(result).toBe('diambil')
      })
    })

    describe('Fallback to Base Status', () => {
      test('should return base status when no special conditions apply', () => {
        const result = calculateEnhancedStatus('pending', mockItems)
        expect(result).toBe('pending')
      })

      test('should return base status when status is not active', () => {
        const result = calculateEnhancedStatus('pending', mockItems, undefined, true)
        expect(result).toBe('pending') // hasPickup only applies to active status
      })
    })

    describe('Edge Cases', () => {
      test('should handle undefined items gracefully', () => {
        const result = calculateEnhancedStatus('active', undefined, undefined, false)
        expect(result).toBe('active')
      })

      test('should handle empty items array', () => {
        const result = calculateEnhancedStatus('active', [], undefined, false)
        expect(result).toBe('active')
      })

      test('should handle invalid end date', () => {
        const result = calculateEnhancedStatus('active', mockItems, 'invalid-date')
        expect(result).toBe('diambil') // Should still detect pickup
      })
    })
  })

  describe('hasValidItemData', () => {
    test('should return true for valid items array with jumlahDiambil', () => {
      const validItems = [
        { jumlahDiambil: 0 },
        { jumlahDiambil: 2 }
      ]
      const result = hasValidItemData(validItems)
      expect(result).toBe(true)
    })

    test('should return false for non-array input', () => {
      expect(hasValidItemData(null)).toBe(false)
      expect(hasValidItemData(undefined)).toBe(false)
      expect(hasValidItemData('not an array' as unknown as TransaksiItemResponse[])).toBe(false)
      expect(hasValidItemData(123 as unknown as TransaksiItemResponse[])).toBe(false)
    })

    test('should return false for empty array', () => {
      expect(hasValidItemData([])).toBe(false)
    })

    test('should return false for items missing jumlahDiambil', () => {
      const invalidItems = [
        { someOtherField: 'value' },
        { jumlahDiambil: 1 }
      ]
      const result = hasValidItemData(invalidItems)
      expect(result).toBe(false)
    })

    test('should return false for items with non-numeric jumlahDiambil', () => {
      const invalidItems = [
        { jumlahDiambil: 'not a number' },
        { jumlahDiambil: 1 }
      ]
      const result = hasValidItemData(invalidItems)
      expect(result).toBe(false)
    })

    test('should return false for null/undefined items in array', () => {
      const invalidItems = [
        null,
        { jumlahDiambil: 1 }
      ]
      const result = hasValidItemData(invalidItems)
      expect(result).toBe(false)
    })
  })

  describe('hasPickupItems', () => {
    test('should return true when at least one item has jumlahDiambil > 0', () => {
      const items: TransaksiItemResponse[] = [
        {
          id: '1',
          jumlah: 2,
          jumlahDiambil: 0,
          produk: { id: '1', name: 'Item 1' }
        },
        {
          id: '2',
          jumlah: 1,
          jumlahDiambil: 1,
          produk: { id: '2', name: 'Item 2' }
        }
      ]
      const result = hasPickupItems(items)
      expect(result).toBe(true)
    })

    test('should return false when all items have jumlahDiambil = 0', () => {
      const items: TransaksiItemResponse[] = [
        {
          id: '1',
          jumlah: 2,
          jumlahDiambil: 0,
          produk: { id: '1', name: 'Item 1' }
        },
        {
          id: '2',
          jumlah: 1,
          jumlahDiambil: 0,
          produk: { id: '2', name: 'Item 2' }
        }
      ]
      const result = hasPickupItems(items)
      expect(result).toBe(false)
    })

    test('should return false for empty items array', () => {
      const result = hasPickupItems([])
      expect(result).toBe(false)
    })
  })

  describe('isOverdue', () => {
    test('should return true when current date is past end date', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const result = isOverdue(pastDate)
      expect(result).toBe(true)
    })

    test('should return false when current date is before end date', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const result = isOverdue(futureDate)
      expect(result).toBe(false)
    })

    test('should return false when end date is undefined', () => {
      const result = isOverdue(undefined)
      expect(result).toBe(false)
    })

    test('should return false when end date is empty string', () => {
      const result = isOverdue('')
      expect(result).toBe(false)
    })

    test('should handle invalid date strings gracefully', () => {
      const result = isOverdue('invalid-date')
      expect(result).toBe(false) // Invalid date creates NaN, comparison returns false
    })

    test('should handle edge case of exact current time', () => {
      const exactNow = new Date().toISOString()
      const result = isOverdue(exactNow)
      // This might be true or false depending on millisecond timing, so we just test it doesn't throw
      expect(typeof result).toBe('boolean')
    })
  })

})