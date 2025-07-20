/**
 * Unit tests for manage-product types and utilities
 */

import {
  isValidProductStatus,
  normalizeStatusFilter,
  normalizeCategoryFilter,
  type ProductStatus,
  type CategoryFilterValue,
  type StatusFilterValue,
} from './index'

describe('Type Guards and Utilities', () => {
  describe('isValidProductStatus', () => {
    it('should return true for valid product statuses', () => {
      expect(isValidProductStatus('AVAILABLE')).toBe(true)
      expect(isValidProductStatus('RENTED')).toBe(true)
      expect(isValidProductStatus('MAINTENANCE')).toBe(true)
    })

    it('should return false for invalid product statuses', () => {
      expect(isValidProductStatus('INVALID')).toBe(false)
      expect(isValidProductStatus('active')).toBe(false)
      expect(isValidProductStatus('available')).toBe(false) // case sensitive
      expect(isValidProductStatus('')).toBe(false)
      expect(isValidProductStatus('Semua')).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(isValidProductStatus('AVAILABLE ')).toBe(false) // with space
      expect(isValidProductStatus(' AVAILABLE')).toBe(false) // with leading space
      expect(isValidProductStatus('Available')).toBe(false) // different case
    })
  })

  describe('normalizeStatusFilter', () => {
    it('should return undefined for "Semua" status', () => {
      expect(normalizeStatusFilter('Semua')).toBeUndefined()
    })

    it('should return undefined for empty string', () => {
      expect(normalizeStatusFilter('')).toBeUndefined()
    })

    it('should return undefined for undefined input', () => {
      expect(normalizeStatusFilter(undefined)).toBeUndefined()
    })

    it('should return valid status for valid inputs', () => {
      expect(normalizeStatusFilter('AVAILABLE')).toBe('AVAILABLE')
      expect(normalizeStatusFilter('RENTED')).toBe('RENTED')
      expect(normalizeStatusFilter('MAINTENANCE')).toBe('MAINTENANCE')
    })

    it('should return undefined for invalid status strings', () => {
      expect(normalizeStatusFilter('INVALID')).toBeUndefined()
      expect(normalizeStatusFilter('active')).toBeUndefined()
      expect(normalizeStatusFilter('available')).toBeUndefined()
    })

    it('should handle edge cases', () => {
      expect(normalizeStatusFilter(' AVAILABLE ')).toBeUndefined() // with spaces
      expect(normalizeStatusFilter('null')).toBeUndefined()
      expect(normalizeStatusFilter('false')).toBeUndefined()
    })
  })

  describe('normalizeCategoryFilter', () => {
    it('should return undefined for empty string', () => {
      expect(normalizeCategoryFilter('')).toBeUndefined()
    })

    it('should return undefined for undefined input', () => {
      expect(normalizeCategoryFilter(undefined)).toBeUndefined()
    })

    it('should return undefined for "all" keyword', () => {
      expect(normalizeCategoryFilter('all')).toBeUndefined()
    })

    it('should return the category ID for valid inputs', () => {
      expect(normalizeCategoryFilter('123')).toBe('123')
      expect(normalizeCategoryFilter('category-1')).toBe('category-1')
      expect(normalizeCategoryFilter('uuid-v4-id')).toBe('uuid-v4-id')
    })

    it('should handle special cases', () => {
      expect(normalizeCategoryFilter('0')).toBe('0') // should not treat 0 as falsy
      expect(normalizeCategoryFilter('false')).toBe('false') // string "false" is valid
      expect(normalizeCategoryFilter(' ')).toBe(' ') // space is a valid category ID
    })

    it('should preserve valid category IDs', () => {
      const validIds = [
        '1',
        '999',
        'category-dress',
        'cat_formal_wear',
        'uuid-1234-5678-9abc-def0',
      ]

      validIds.forEach(id => {
        expect(normalizeCategoryFilter(id)).toBe(id)
      })
    })
  })

  describe('Type Definitions', () => {
    it('should define ProductStatus correctly', () => {
      const validStatuses: ProductStatus[] = ['AVAILABLE', 'RENTED', 'MAINTENANCE']
      
      // This test ensures the type definition is correct
      // If the type definition changes, this test will fail
      validStatuses.forEach(status => {
        expect(['AVAILABLE', 'RENTED', 'MAINTENANCE']).toContain(status)
      })
    })

    it('should define CategoryFilterValue correctly', () => {
      // Test that CategoryFilterValue accepts string and undefined
      const validValues: CategoryFilterValue[] = [
        undefined,
        '',
        'category-1',
        'all',
        '123',
      ]

      validValues.forEach(value => {
        expect(typeof value === 'string' || value === undefined).toBe(true)
      })
    })

    it('should define StatusFilterValue correctly', () => {
      // Test that StatusFilterValue accepts ProductStatus, undefined, and "Semua"
      const validValues: StatusFilterValue[] = [
        undefined,
        'AVAILABLE',
        'RENTED',
        'MAINTENANCE',
        'Semua',
      ]

      validValues.forEach(value => {
        expect(
          value === undefined || 
          ['AVAILABLE', 'RENTED', 'MAINTENANCE', 'Semua'].includes(value)
        ).toBe(true)
      })
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete filter workflow for status', () => {
      // Simulate user selecting "Semua" -> should normalize to undefined
      const semaStatus = normalizeStatusFilter('Semua')
      expect(semaStatus).toBeUndefined()

      // Simulate user selecting a valid status -> should return the status
      const availableStatus = normalizeStatusFilter('AVAILABLE')
      expect(availableStatus).toBe('AVAILABLE')

      // Simulate empty/reset state -> should normalize to undefined
      const emptyStatus = normalizeStatusFilter('')
      expect(emptyStatus).toBeUndefined()
    })

    it('should handle complete filter workflow for category', () => {
      // Simulate user selecting "Semua" (all) -> should normalize to undefined
      const allCategory = normalizeCategoryFilter('all')
      expect(allCategory).toBeUndefined()

      // Simulate user selecting a specific category -> should return the ID
      const specificCategory = normalizeCategoryFilter('category-123')
      expect(specificCategory).toBe('category-123')

      // Simulate empty/reset state -> should normalize to undefined
      const emptyCategory = normalizeCategoryFilter('')
      expect(emptyCategory).toBeUndefined()
    })

    it('should handle API contract expectations', () => {
      // API expects undefined for "all" filters, not empty strings
      expect(normalizeStatusFilter('Semua')).toBeUndefined()
      expect(normalizeStatusFilter('')).toBeUndefined()
      expect(normalizeCategoryFilter('all')).toBeUndefined()
      expect(normalizeCategoryFilter('')).toBeUndefined()

      // API expects actual values for specific filters
      expect(normalizeStatusFilter('AVAILABLE')).toBe('AVAILABLE')
      expect(normalizeCategoryFilter('123')).toBe('123')
    })
  })

  describe('Error Prevention', () => {
    it('should prevent invalid status from reaching API', () => {
      const invalidInputs = [
        'invalid-status',
        'active',
        'available', // lowercase
        'AVAILABLE ', // with space
        'null',
        'false',
        '123',
      ]

      invalidInputs.forEach(input => {
        const result = normalizeStatusFilter(input)
        expect(result).toBeUndefined()
        expect(result === undefined || isValidProductStatus(result)).toBe(true)
      })
    })

    it('should handle null-like values gracefully', () => {
      // Test various falsy values
      expect(normalizeStatusFilter(undefined)).toBeUndefined()
      expect(normalizeCategoryFilter(undefined)).toBeUndefined()
      
      // These should work with proper type casting in real usage
      expect(normalizeStatusFilter(null as unknown as string)).toBeUndefined()
      expect(normalizeCategoryFilter(null as unknown as string)).toBeUndefined()
    })
  })
})