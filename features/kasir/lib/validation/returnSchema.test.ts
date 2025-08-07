/**
 * Unit tests for Return Schema Validation
 * Tests the enhanced conditional logic for lost items vs normal items
 */

import { returnItemSchema, isLostItemCondition, getExpectedReturnQuantity } from './returnSchema'

describe('Return Schema Validation', () => {
  describe('returnItemSchema', () => {
    describe('Lost Item Validation', () => {
      it('should accept lost items with jumlahKembali = 0', () => {
        const validLostItem = {
          itemId: '677301a6-89a5-4127-b319-42287de0faaa',
          kondisiAkhir: 'Hilang/tidak dikembalikan',
          jumlahKembali: 0
        }

        expect(() => returnItemSchema.parse(validLostItem)).not.toThrow()
      })

      it('should reject lost items with jumlahKembali > 0', () => {
        const invalidLostItem = {
          itemId: '677301a6-89a5-4127-b319-42287de0faaa',
          kondisiAkhir: 'Hilang/tidak dikembalikan',
          jumlahKembali: 1
        }

        expect(() => returnItemSchema.parse(invalidLostItem)).toThrow(
          'Jumlah kembali tidak sesuai dengan kondisi barang'
        )
      })

      it('should handle case insensitive lost item conditions', () => {
        const validLostItemUpperCase = {
          itemId: '677301a6-89a5-4127-b319-42287de0faaa',
          kondisiAkhir: 'BARANG HILANG DAN TIDAK BISA DIKEMBALIKAN',
          jumlahKembali: 0
        }

        expect(() => returnItemSchema.parse(validLostItemUpperCase)).not.toThrow()
      })
    })

    describe('Normal Item Validation', () => {
      it('should accept normal items with jumlahKembali >= 1', () => {
        const validNormalItem = {
          itemId: '677301a6-89a5-4127-b319-42287de0faaa',
          kondisiAkhir: 'Baik - tidak ada kerusakan',
          jumlahKembali: 1
        }

        expect(() => returnItemSchema.parse(validNormalItem)).not.toThrow()
      })

      it('should reject normal items with jumlahKembali = 0', () => {
        const invalidNormalItem = {
          itemId: '677301a6-89a5-4127-b319-42287de0faaa',
          kondisiAkhir: 'Baik - tidak ada kerusakan',
          jumlahKembali: 0
        }

        expect(() => returnItemSchema.parse(invalidNormalItem)).toThrow(
          'Jumlah kembali tidak sesuai dengan kondisi barang'
        )
      })

      it('should accept damaged items with jumlahKembali >= 1', () => {
        const validDamagedItem = {
          itemId: '677301a6-89a5-4127-b319-42287de0faaa',
          kondisiAkhir: 'Buruk - ada kerusakan besar',
          jumlahKembali: 2
        }

        expect(() => returnItemSchema.parse(validDamagedItem)).not.toThrow()
      })
    })

    describe('Edge Cases', () => {
      it('should reject invalid UUID', () => {
        const invalidUUID = {
          itemId: 'invalid-uuid',
          kondisiAkhir: 'Baik - tidak ada kerusakan',
          jumlahKembali: 1
        }

        expect(() => returnItemSchema.parse(invalidUUID)).toThrow('ID item transaksi tidak valid')
      })

      it('should reject negative jumlahKembali', () => {
        const negativeQuantity = {
          itemId: '677301a6-89a5-4127-b319-42287de0faaa',
          kondisiAkhir: 'Baik - tidak ada kerusakan',
          jumlahKembali: -1
        }

        expect(() => returnItemSchema.parse(negativeQuantity)).toThrow('Jumlah kembali tidak boleh negatif')
      })

      it('should reject excessive jumlahKembali', () => {
        const excessiveQuantity = {
          itemId: '677301a6-89a5-4127-b319-42287de0faaa',
          kondisiAkhir: 'Baik - tidak ada kerusakan',
          jumlahKembali: 1000
        }

        expect(() => returnItemSchema.parse(excessiveQuantity)).toThrow('Jumlah kembali maksimal 999')
      })
    })
  })

  describe('Utility Functions', () => {
    describe('isLostItemCondition', () => {
      it('should identify lost item conditions (lowercase)', () => {
        expect(isLostItemCondition('Hilang/tidak dikembalikan')).toBe(true)
        expect(isLostItemCondition('Barang hilang')).toBe(true)
        expect(isLostItemCondition('Item tidak dikembalikan')).toBe(true)
      })

      it('should identify lost item conditions (case insensitive)', () => {
        expect(isLostItemCondition('BARANG HILANG')).toBe(true)
        expect(isLostItemCondition('TIDAK DIKEMBALIKAN')).toBe(true)
      })

      it('should not identify normal conditions as lost', () => {
        expect(isLostItemCondition('Baik - tidak ada kerusakan')).toBe(false)
        expect(isLostItemCondition('Buruk - ada kerusakan')).toBe(false)
        expect(isLostItemCondition('Cukup - ada noda ringan')).toBe(false)
      })
    })

    describe('getExpectedReturnQuantity', () => {
      it('should return 0 for lost items', () => {
        const result = getExpectedReturnQuantity('Hilang/tidak dikembalikan')
        expect(result.min).toBe(0)
        expect(result.max).toBe(0)
        expect(result.message).toContain('hilang')
      })

      it('should return 1-999 for normal items', () => {
        const result = getExpectedReturnQuantity('Baik - tidak ada kerusakan')
        expect(result.min).toBe(1)
        expect(result.max).toBe(999)
        expect(result.message).toContain('minimal 1')
      })
    })
  })

  describe('Original Failing Case (RPK-23)', () => {
    it('should now pass the original failing request', () => {
      // This is the exact request that was failing in the logs
      const originalFailingRequest = {
        itemId: '677301a6-89a5-4127-b319-42287de0faaa',
        kondisiAkhir: 'Hilang/tidak dikembalikan',
        jumlahKembali: 0
      }

      // This should now pass validation
      expect(() => returnItemSchema.parse(originalFailingRequest)).not.toThrow()
      
      // Verify the parsed result
      const result = returnItemSchema.parse(originalFailingRequest)
      expect(result.itemId).toBe('677301a6-89a5-4127-b319-42287de0faaa')
      expect(result.kondisiAkhir).toBe('Hilang/tidak dikembalikan')
      expect(result.jumlahKembali).toBe(0)
    })
  })
})