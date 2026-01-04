/**
 * Return Service Pairing Integration Tests - Task 7.1
 * 
 * Tests format compatibility and backward compatibility for return-pairing integration
 * Property 1: Format compatibility and backward compatibility
 * Validates: Requirements 1.1, 1.3, 1.5, 11.1, 11.2
 */

import { describe, it, expect } from '@jest/globals'
import { PairingReturnValidator } from '../../../../features/kasir/lib/validation/pairingReturnValidation'
import { parseKondisiAwalEnhanced } from '../../../../features/kasir/lib/utils/kondisiAwalParser'

describe('ReturnService Pairing Integration - Format Compatibility', () => {

  describe('Property 1: Format compatibility and backward compatibility', () => {
    /**
     * **Property 1: Format compatibility and backward compatibility**
     * *For any* kondisiAwal string in either JSON format (with or without linkedSarung) 
     * or pipe-separated format, the enhanced parser should successfully extract productSizeId 
     * or return null gracefully, maintaining backward compatibility with existing transactions
     * **Validates: Requirements 1.1, 1.3, 1.5, 11.1, 11.2**
     */
    it('should handle JSON format with linkedSarung data', () => {
      const jsonKondisiAwal = JSON.stringify({
        productSizeId: 'jas-size-123',
        size: 'M',
        ageCategory: 'ADULT',
        condition: 'baik',
        linkedSarung: {
          productId: 'sarung-product-456',
          productSizeId: 'sarung-size-789',
          quantity: 1
        }
      })

      const result = parseKondisiAwalEnhanced(jsonKondisiAwal)

      expect(result).toBeTruthy()
      expect(result.productSizeId).toBe('jas-size-123')
      expect(result.linkedSarung).toBeTruthy()
      expect(result.linkedSarung?.productSizeId).toBe('sarung-size-789')
      expect(result.isLegacyFormat).toBe(false)
    })

    it('should handle JSON format without linkedSarung data', () => {
      const jsonKondisiAwal = JSON.stringify({
        productSizeId: 'regular-size-123',
        size: 'L',
        ageCategory: 'ADULT',
        condition: 'baik'
      })

      const result = parseKondisiAwalEnhanced(jsonKondisiAwal)

      expect(result).toBeTruthy()
      expect(result.productSizeId).toBe('regular-size-123')
      expect(result.linkedSarung).toBeUndefined()
      expect(result.isLegacyFormat).toBe(false)
    })

    it('should handle pipe-separated format (legacy)', () => {
      // Create a valid UUID for testing
      const validUUID = '85a7a3b8-4e13-45bf-b413-ff24ffdf1af9'
      const pipeKondisiAwal = `${validUUID}|M|ADULT|baik`

      const result = parseKondisiAwalEnhanced(pipeKondisiAwal)

      expect(result).toBeTruthy()
      expect(result.productSizeId).toBe(validUUID)
      expect(result.size).toBe('M')
      expect(result.ageCategory).toBe('ADULT')
      expect(result.condition).toBe('baik')
      expect(result.linkedSarung).toBeUndefined()
      expect(result.isLegacyFormat).toBe(false) // UUID format is not legacy
    })

    it('should handle malformed or null kondisiAwal gracefully', () => {
      // Test null input
      const nullResult = parseKondisiAwalEnhanced(null)
      expect(nullResult.productSizeId).toBeUndefined()
      expect(nullResult.isLegacyFormat).toBe(true)

      // Test empty string
      const emptyResult = parseKondisiAwalEnhanced('')
      expect(emptyResult.productSizeId).toBeUndefined()
      expect(emptyResult.isLegacyFormat).toBe(true)

      // Test malformed JSON
      const malformedResult = parseKondisiAwalEnhanced('{"invalid": json}')
      expect(malformedResult.productSizeId).toBeUndefined()
      expect(malformedResult.isLegacyFormat).toBe(true)

      // Test malformed pipe format (no UUID)
      const malformedPipeResult = parseKondisiAwalEnhanced('incomplete|pipe')
      expect(malformedPipeResult.productSizeId).toBeUndefined()
      expect(malformedPipeResult.isLegacyFormat).toBe(true)
      expect(malformedPipeResult.condition).toBe('incomplete|pipe')
    })

    it('should maintain backward compatibility with existing transactions', () => {
      // Test various legacy formats that might exist in the database
      // Use the same UUID that works in other tests
      const validUUID = '85a7a3b8-4e13-45bf-b413-ff24ffdf1af9'
      
      const legacyFormats = [
        `${validUUID}|S|CHILD|baik`,
        `${validUUID}|XL|ADULT|rusak`,
        `${validUUID}|M|ADULT|kotor`
      ]

      legacyFormats.forEach((format) => {
        const result = parseKondisiAwalEnhanced(format)
        expect(result).toBeTruthy()
        expect(result.productSizeId).toBeTruthy()
        expect(result.productSizeId).toBe(validUUID)
        expect(result.isLegacyFormat).toBe(false) // UUID format is not legacy
      })
    })
  })

  describe('Pairing Validation Integration', () => {
    it('should validate paired items correctly', () => {
      const returnItems = [
        {
          itemId: 'jas-item-1',
          kondisiAwal: JSON.stringify({
            productSizeId: 'jas-size-123',
            linkedSarung: { productSizeId: 'sarung-size-789' }
          }),
          conditions: [{ kondisiAkhir: 'baik', jumlahKembali: 1 }]
        },
        {
          itemId: 'sarung-item-1',
          kondisiAwal: JSON.stringify({
            productSizeId: 'sarung-size-789'
          }),
          conditions: [{ kondisiAkhir: 'baik', jumlahKembali: 1 }]
        }
      ]

      const transactionItems = [
        {
          id: 'jas-item-1',
          kondisiAwal: JSON.stringify({
            productSizeId: 'jas-size-123',
            linkedSarung: { productSizeId: 'sarung-size-789' }
          }),
          jumlahDiambil: 1,
          produk: { id: 'jas-prod', name: 'Jas Hitam', code: 'JAS001' }
        },
        {
          id: 'sarung-item-1',
          kondisiAwal: JSON.stringify({
            productSizeId: 'sarung-size-789'
          }),
          jumlahDiambil: 1,
          produk: { id: 'sarung-prod', name: 'Sarung Hitam', code: 'SAR001' }
        }
      ]

      const validation = PairingReturnValidator.validatePairedReturn(returnItems, transactionItems)

      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
      expect(validation.pairingInfo).toBeTruthy()
      expect(validation.pairingInfo?.requiredRatio).toBe('1:1')
    })

    it('should detect pairing violations', () => {
      // ✅ FIX: Test case updated to reflect new pairing logic
      // Since sarung is now metadata in jas item, we need to test different violation scenarios
      
      // Test case 1: Jas with pairing but trying to return more than available
      const returnItems = [
        {
          itemId: 'jas-item-1',
          kondisiAwal: JSON.stringify({
            productSizeId: 'jas-size-123',
            linkedSarung: { productSizeId: 'sarung-size-789' }
          }),
          conditions: [{ kondisiAkhir: 'baik', jumlahKembali: 2 }] // Trying to return 2 but only 1 available
        }
      ]

      const transactionItems = [
        {
          id: 'jas-item-1',
          kondisiAwal: JSON.stringify({
            productSizeId: 'jas-size-123',
            linkedSarung: { productSizeId: 'sarung-size-789' }
          }),
          jumlahDiambil: 1, // Only 1 available
          produk: { id: 'jas-prod', name: 'Jas Hitam', code: 'JAS001' }
        }
      ]

      const validation = PairingReturnValidator.validatePairedReturn(returnItems, transactionItems)

      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
      expect(validation.errors[0]).toContain('melebihi jumlah yang tersedia')
    })
  })

  describe('Format Compatibility Edge Cases', () => {
    it('should handle mixed format scenarios', () => {
      // Scenario: Transaction has both legacy and new format items
      const validUUID1 = '85a7a3b8-4e13-45bf-b413-ff24ffdf1af9'
      const validUUID2 = '95b8b4c9-5f24-56cf-c524-0f35ffef2bf0'
      const validUUID3 = 'a5c9c5da-6f35-47df-8635-1f46ffff3cf1'
      
      const mixedFormats = [
        `${validUUID1}|M|ADULT|baik`, // UUID pipe format
        JSON.stringify({ // New JSON format
          productSizeId: validUUID2,
          size: 'L',
          ageCategory: 'ADULT',
          condition: 'baik'
        }),
        JSON.stringify({ // New JSON format with pairing
          productSizeId: validUUID3,
          size: 'XL',
          ageCategory: 'ADULT',
          condition: 'baik',
          linkedSarung: {
            productSizeId: 'sarung-size-4'
          }
        })
      ]

      mixedFormats.forEach((format, index) => {
        const result = parseKondisiAwalEnhanced(format)
        expect(result).toBeTruthy()
        expect(result.productSizeId).toBeTruthy()
        
        if (index === 0) {
          expect(result.isLegacyFormat).toBe(false) // UUID format is not legacy
          expect(result.linkedSarung).toBeUndefined()
        } else {
          expect(result.isLegacyFormat).toBe(false)
          if (index === 2) {
            expect(result.linkedSarung).toBeTruthy()
          }
        }
      })
    })

    it('should handle corrupted pairing data gracefully', () => {
      const corruptedPairingData = JSON.stringify({
        productSizeId: 'jas-size-123',
        linkedSarung: {
          // Missing productSizeId - corrupted data
          productId: 'sarung-product-456'
        }
      })

      const result = parseKondisiAwalEnhanced(corruptedPairingData)

      expect(result).toBeTruthy()
      expect(result.productSizeId).toBe('jas-size-123')
      // Should handle corrupted linkedSarung gracefully
      expect(result.linkedSarung?.productSizeId).toBeFalsy()
    })
  })
})