/**
 * Test for PairingReturnValidator
 * Validates jas-sarung pairing return logic and error handling
 */

import { describe, it, expect } from '@jest/globals'
import { PairingReturnValidator } from '../../../features/kasir/lib/validation/pairingReturnValidation'
import type { ReturnItem, TransactionItem } from '../../../features/kasir/lib/validation/pairingReturnValidation'

describe('PairingReturnValidator', () => {
  // Test data setup
  const createJasTransactionItem = (itemId: string, sarungProductSizeId?: string): TransactionItem => ({
    id: itemId,
    kondisiAwal: JSON.stringify({
      productSizeId: `${itemId}-product-size`,
      size: 'M',
      ageCategory: 'ADULT',
      condition: 'baik',
      linkedSarung: sarungProductSizeId ? {
        productId: 'sarung-product-id',
        productSizeId: sarungProductSizeId,
        quantity: 1,
      } : null,
    }),
    jumlahDiambil: 2,
    produk: {
      id: `${itemId}-product`,
      name: `Jas ${itemId}`,
      code: `JAS-${itemId}`,
    },
  })

  const createSarungTransactionItem = (itemId: string): TransactionItem => ({
    id: itemId,
    kondisiAwal: JSON.stringify({
      productSizeId: `${itemId}-product-size`,
      size: 'M',
      ageCategory: 'ADULT',
      condition: 'baik',
    }),
    jumlahDiambil: 2,
    produk: {
      id: `${itemId}-product`,
      name: `Sarung ${itemId}`,
      code: `SARUNG-${itemId}`,
    },
  })

  const createReturnItem = (itemId: string, quantity: number): ReturnItem => ({
    itemId,
    kondisiAwal: null, // Not used in validation, comes from transaction items
    conditions: [{
      kondisiAkhir: 'baik',
      jumlahKembali: quantity,
      conditionCategory: 'BAIK',
    }],
  })

  describe('validatePairedReturn - No Pairing', () => {
    it('should pass validation when no paired items are being returned', () => {
      const returnItems: ReturnItem[] = [
        createReturnItem('regular-item-1', 1),
        createReturnItem('regular-item-2', 2),
      ]

      const transactionItems: TransactionItem[] = [
        createJasTransactionItem('regular-item-1'), // No linkedSarung
        createJasTransactionItem('regular-item-2'), // No linkedSarung
      ]

      const result = PairingReturnValidator.validatePairedReturn(returnItems, transactionItems)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
      expect(result.pairingInfo).toBeUndefined()
    })
  })

  describe('validatePairedReturn - Valid Pairing', () => {
    it('should pass validation when both jas and sarung are returned with correct quantities', () => {
      const jasItemId = 'jas-item-1'
      const sarungItemId = 'sarung-item-1'
      const sarungProductSizeId = `${sarungItemId}-product-size`

      const returnItems: ReturnItem[] = [
        createReturnItem(jasItemId, 1),
        createReturnItem(sarungItemId, 1),
      ]

      const transactionItems: TransactionItem[] = [
        createJasTransactionItem(jasItemId, sarungProductSizeId),
        createSarungTransactionItem(sarungItemId),
      ]

      const result = PairingReturnValidator.validatePairedReturn(returnItems, transactionItems)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toContain('Pairing terdeteksi')
      expect(result.pairingInfo).toEqual({
        jasItemId,
        sarungItemId,
        jasProductSizeId: `${jasItemId}-product-size`,
        sarungProductSizeId,
        requiredRatio: '1:1',
      })
    })

    it('should pass validation with multiple quantities (maintaining 1:1 ratio)', () => {
      const jasItemId = 'jas-item-1'
      const sarungItemId = 'sarung-item-1'
      const sarungProductSizeId = `${sarungItemId}-product-size`

      const returnItems: ReturnItem[] = [
        createReturnItem(jasItemId, 2),
        createReturnItem(sarungItemId, 2),
      ]

      const transactionItems: TransactionItem[] = [
        createJasTransactionItem(jasItemId, sarungProductSizeId),
        createSarungTransactionItem(sarungItemId),
      ]

      const result = PairingReturnValidator.validatePairedReturn(returnItems, transactionItems)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings[0]).toContain('Pairing terdeteksi')
      expect(result.warnings[0]).toContain('(2 set)')
    })
  })

  describe('validatePairedReturn - Invalid Pairing', () => {
    it('should fail validation when jas is returned without sarung', () => {
      const jasItemId = 'jas-item-1'
      const sarungItemId = 'sarung-item-1'
      const sarungProductSizeId = `${sarungItemId}-product-size`

      const returnItems: ReturnItem[] = [
        createReturnItem(jasItemId, 1),
        // Missing sarung return item
      ]

      const transactionItems: TransactionItem[] = [
        createJasTransactionItem(jasItemId, sarungProductSizeId),
        createSarungTransactionItem(sarungItemId),
      ]

      const result = PairingReturnValidator.validatePairedReturn(returnItems, transactionItems)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('tidak dapat dikembalikan tanpa sarung pasangannya')
      expect(result.errors[0]).toContain('Kedua item harus dikembalikan bersamaan')
    })

    it('should fail validation when sarung is returned without jas', () => {
      const jasItemId = 'jas-item-1'
      const sarungItemId = 'sarung-item-1'
      const sarungProductSizeId = `${sarungItemId}-product-size`

      const returnItems: ReturnItem[] = [
        // Missing jas return item
        createReturnItem(sarungItemId, 1),
      ]

      const transactionItems: TransactionItem[] = [
        createJasTransactionItem(jasItemId, sarungProductSizeId),
        createSarungTransactionItem(sarungItemId),
      ]

      const result = PairingReturnValidator.validatePairedReturn(returnItems, transactionItems)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('Sarung tidak dapat dikembalikan tanpa jas pasangannya')
      expect(result.errors[0]).toContain('Kedua item harus dikembalikan bersamaan')
    })

    it('should fail validation when quantities do not match (1:1 ratio violation)', () => {
      const jasItemId = 'jas-item-1'
      const sarungItemId = 'sarung-item-1'
      const sarungProductSizeId = `${sarungItemId}-product-size`

      const returnItems: ReturnItem[] = [
        createReturnItem(jasItemId, 2),
        createReturnItem(sarungItemId, 1), // Different quantity
      ]

      const transactionItems: TransactionItem[] = [
        createJasTransactionItem(jasItemId, sarungProductSizeId),
        createSarungTransactionItem(sarungItemId),
      ]

      const result = PairingReturnValidator.validatePairedReturn(returnItems, transactionItems)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('Jumlah pengembalian tidak sesuai untuk pairing jas-sarung')
      expect(result.errors[0]).toContain('Jas: 2, Sarung: 1')
      expect(result.errors[0]).toContain('rasio 1:1')
    })

    it('should fail validation when return quantity exceeds available quantity', () => {
      const jasItemId = 'jas-item-1'
      const sarungItemId = 'sarung-item-1'
      const sarungProductSizeId = `${sarungItemId}-product-size`

      const returnItems: ReturnItem[] = [
        createReturnItem(jasItemId, 3), // Exceeds jumlahDiambil (2)
        createReturnItem(sarungItemId, 3), // Exceeds jumlahDiambil (2)
      ]

      const transactionItems: TransactionItem[] = [
        createJasTransactionItem(jasItemId, sarungProductSizeId),
        createSarungTransactionItem(sarungItemId),
      ]

      const result = PairingReturnValidator.validatePairedReturn(returnItems, transactionItems)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(2)
      expect(result.errors[0]).toContain('Jumlah pengembalian jas (3) melebihi jumlah yang tersedia (2)')
      expect(result.errors[1]).toContain('Jumlah pengembalian sarung (3) melebihi jumlah yang tersedia (2)')
    })
  })

  describe('isItemPaired', () => {
    it('should return true for jas item with linkedSarung', () => {
      const jasItemId = 'jas-item-1'
      const sarungItemId = 'sarung-item-1'
      const sarungProductSizeId = `${sarungItemId}-product-size`

      const transactionItems: TransactionItem[] = [
        createJasTransactionItem(jasItemId, sarungProductSizeId),
        createSarungTransactionItem(sarungItemId),
      ]

      const result = PairingReturnValidator.isItemPaired(jasItemId, transactionItems)
      expect(result).toBe(true)
    })

    it('should return true for sarung item linked to jas', () => {
      const jasItemId = 'jas-item-1'
      const sarungItemId = 'sarung-item-1'
      const sarungProductSizeId = `${sarungItemId}-product-size`

      const transactionItems: TransactionItem[] = [
        createJasTransactionItem(jasItemId, sarungProductSizeId),
        createSarungTransactionItem(sarungItemId),
      ]

      const result = PairingReturnValidator.isItemPaired(sarungItemId, transactionItems)
      expect(result).toBe(true)
    })

    it('should return false for regular item without pairing', () => {
      const regularItemId = 'regular-item-1'

      const transactionItems: TransactionItem[] = [
        createJasTransactionItem(regularItemId), // No linkedSarung
      ]

      const result = PairingReturnValidator.isItemPaired(regularItemId, transactionItems)
      expect(result).toBe(false)
    })

    it('should return false for non-existent item', () => {
      const transactionItems: TransactionItem[] = [
        createJasTransactionItem('existing-item'),
      ]

      const result = PairingReturnValidator.isItemPaired('non-existent-item', transactionItems)
      expect(result).toBe(false)
    })
  })

  describe('getPairingInfo', () => {
    it('should return correct pairing info for jas item', () => {
      const jasItemId = 'jas-item-1'
      const sarungItemId = 'sarung-item-1'
      const sarungProductSizeId = `${sarungItemId}-product-size`

      const transactionItems: TransactionItem[] = [
        createJasTransactionItem(jasItemId, sarungProductSizeId),
        createSarungTransactionItem(sarungItemId),
      ]

      const result = PairingReturnValidator.getPairingInfo(jasItemId, transactionItems)

      expect(result).toEqual({
        isPaired: true,
        role: 'jas',
        pairedItemId: sarungItemId,
        pairedProductSizeId: sarungProductSizeId,
      })
    })

    it('should return correct pairing info for sarung item', () => {
      const jasItemId = 'jas-item-1'
      const sarungItemId = 'sarung-item-1'
      const sarungProductSizeId = `${sarungItemId}-product-size`

      const transactionItems: TransactionItem[] = [
        createJasTransactionItem(jasItemId, sarungProductSizeId),
        createSarungTransactionItem(sarungItemId),
      ]

      const result = PairingReturnValidator.getPairingInfo(sarungItemId, transactionItems)

      expect(result).toEqual({
        isPaired: true,
        role: 'sarung',
        pairedItemId: jasItemId,
        pairedProductSizeId: sarungProductSizeId,
      })
    })

    it('should return not paired for regular item', () => {
      const regularItemId = 'regular-item-1'

      const transactionItems: TransactionItem[] = [
        createJasTransactionItem(regularItemId), // No linkedSarung
      ]

      const result = PairingReturnValidator.getPairingInfo(regularItemId, transactionItems)

      expect(result).toEqual({
        isPaired: false,
      })
    })
  })

  describe('generatePairingErrorMessage', () => {
    it('should return empty string when no errors', () => {
      const result = PairingReturnValidator.generatePairingErrorMessage([])
      expect(result).toBe('')
    })

    it('should generate comprehensive error message with pairing info', () => {
      const errors = [
        'Jas tidak dapat dikembalikan tanpa sarung pasangannya',
        'Jumlah pengembalian tidak sesuai untuk pairing jas-sarung',
      ]

      const pairingInfo = {
        jasItemId: 'jas-1',
        sarungItemId: 'sarung-1',
        jasProductSizeId: 'jas-size-1',
        sarungProductSizeId: 'sarung-size-1',
        requiredRatio: '1:1',
      }

      const result = PairingReturnValidator.generatePairingErrorMessage(errors, pairingInfo)

      expect(result).toContain('Validasi pairing gagal:')
      expect(result).toContain('1. Jas tidak dapat dikembalikan tanpa sarung pasangannya')
      expect(result).toContain('2. Jumlah pengembalian tidak sesuai untuk pairing jas-sarung')
      expect(result).toContain('Informasi Pairing:')
      expect(result).toContain('Rasio yang diperlukan: 1:1')
      expect(result).toContain('Jas Item ID: jas-1')
      expect(result).toContain('Sarung Item ID: sarung-1')
      expect(result).toContain('Petunjuk: Pastikan jas dan sarung dikembalikan bersamaan')
    })

    it('should generate error message without pairing info when not provided', () => {
      const errors = ['Some validation error']

      const result = PairingReturnValidator.generatePairingErrorMessage(errors)

      expect(result).toContain('Validasi pairing gagal:')
      expect(result).toContain('1. Some validation error')
      expect(result).not.toContain('Informasi Pairing:')
      expect(result).toContain('Petunjuk: Pastikan jas dan sarung dikembalikan bersamaan')
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed kondisiAwal gracefully', () => {
      const returnItems: ReturnItem[] = [
        createReturnItem('item-1', 1),
      ]

      const transactionItems: TransactionItem[] = [{
        id: 'item-1',
        kondisiAwal: 'invalid-json', // Malformed JSON
        jumlahDiambil: 2,
        produk: {
          id: 'product-1',
          name: 'Test Product',
        },
      }]

      const result = PairingReturnValidator.validatePairedReturn(returnItems, transactionItems)

      // Should not crash and should pass validation (no pairing detected)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle missing transaction items gracefully', () => {
      const returnItems: ReturnItem[] = [
        createReturnItem('non-existent-item', 1),
      ]

      const transactionItems: TransactionItem[] = [
        createJasTransactionItem('different-item'),
      ]

      const result = PairingReturnValidator.validatePairedReturn(returnItems, transactionItems)

      // Should not crash and should pass validation (no pairing detected)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })
})