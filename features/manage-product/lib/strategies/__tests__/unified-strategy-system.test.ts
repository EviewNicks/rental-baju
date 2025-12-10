/**
 * Test: Unified Strategy System
 * 
 * This test verifies that the unified strategy system works correctly
 * for both create and edit modes, replacing the old InlineSizeManagement approach.
 */

import { describe, it, expect } from '@jest/globals'
import { FormStrategyFactory } from '../StrategyFactory'
import { UniversalFallbackStrategy } from '../UniversalFallbackStrategy'
import type { CategoryType } from '../CategoryFormStrategy'

describe('Unified Strategy System', () => {
  describe('FormStrategyFactory', () => {
    it('should create UniversalFallbackStrategy for unknown category types', () => {
      const strategy = FormStrategyFactory.create('unknown_category' as CategoryType)
      
      expect(strategy).toBeInstanceOf(UniversalFallbackStrategy)
      expect(strategy.type).toBe('universal_fallback')
    })

    it('should create strategy with context for edit mode', () => {
      const context = {
        categoryId: 'cat-1',
        categoryName: 'Test Category',
        isEditMode: true,
        existingData: [
          {
            ageCategory: 'ADULT',
            size: 'M',
            quantity: 5,
            originalQuantity: 5,
            availableQuantity: 3,
            rentedQuantity: 2,
            lostQuantity: 0,
          }
        ]
      }

      const strategy = FormStrategyFactory.createWithContext('universal_fallback', context)
      
      expect(strategy).toBeInstanceOf(UniversalFallbackStrategy)
      expect(strategy.categoryId).toBe('cat-1')
      expect(strategy.categoryName).toBe('Test Category')
      expect(strategy.isEditMode).toBe(true)
    })

    it('should provide fallback for all category types', () => {
      const categoryTypes: CategoryType[] = ['clothing', 'accessories_age_based', 'accessories_universal', 'universal_fallback']
      
      categoryTypes.forEach(categoryType => {
        const strategy = FormStrategyFactory.create(categoryType)
        expect(strategy).toBeDefined()
        expect(strategy.type).toBeDefined()
      })
    })
  })

  describe('UniversalFallbackStrategy', () => {
    it('should generate form fields for size management', () => {
      const strategy = new UniversalFallbackStrategy({
        categoryId: 'cat-1',
        categoryName: 'Test Category',
        isEditMode: false,
      })

      const formFields = strategy.getFormFields()
      
      expect(formFields).toHaveLength(1)
      expect(formFields[0].title).toBe('Pilih Ukuran & Stok')
      expect(formFields[0].fields.length).toBeGreaterThan(1) // sizes + quantity fields
    })

    it('should transform form data to product sizes', () => {
      const strategy = new UniversalFallbackStrategy({
        categoryId: 'cat-1',
        categoryName: 'Test Category',
        isEditMode: false,
      })

      const formData = {
        categoryId: 'cat-1',
        sizes: ['M', 'L'],
        quantity_M: 5,
        quantity_L: 3,
      }

      const productSizes = strategy.transformToProductSizes(formData)
      
      expect(productSizes).toHaveLength(2)
      expect(productSizes[0]).toMatchObject({
        ageCategory: 'ADULT',
        size: 'M',
        quantity: 5,
        originalQuantity: 5,
        availableQuantity: 5,
        rentedQuantity: 0,
        lostQuantity: 0,
      })
      expect(productSizes[1]).toMatchObject({
        ageCategory: 'ADULT',
        size: 'L',
        quantity: 3,
        originalQuantity: 3,
        availableQuantity: 3,
        rentedQuantity: 0,
        lostQuantity: 0,
      })
    })

    it('should transform existing product sizes to form data (edit mode)', () => {
      const strategy = new UniversalFallbackStrategy({
        categoryId: 'cat-1',
        categoryName: 'Test Category',
        isEditMode: true,
        existingData: [
          {
            ageCategory: 'ADULT',
            size: 'M',
            quantity: 5,
            originalQuantity: 5,
            availableQuantity: 3,
            rentedQuantity: 2,
            lostQuantity: 0,
          },
          {
            ageCategory: 'ADULT',
            size: 'L',
            quantity: 8,
            originalQuantity: 8,
            availableQuantity: 6,
            rentedQuantity: 1,
            lostQuantity: 1,
          }
        ]
      })

      const existingSizes = [
        {
          ageCategory: 'ADULT' as const,
          size: 'M' as const,
          quantity: 5,
          originalQuantity: 5,
          availableQuantity: 3,
          rentedQuantity: 2,
          lostQuantity: 0,
          isActive: true,
        },
        {
          ageCategory: 'ADULT' as const,
          size: 'L' as const,
          quantity: 8,
          originalQuantity: 8,
          availableQuantity: 6,
          rentedQuantity: 1,
          lostQuantity: 1,
          isActive: true,
        }
      ]

      const formData = strategy.transformFromProductSizes(existingSizes)
      
      expect(formData.categoryId).toBe('cat-1')
      expect(formData.sizes).toEqual(['M', 'L'])
      expect(formData.quantity_M).toBe(5)
      expect(formData.quantity_L).toBe(8)
    })

    it('should validate product sizes correctly', () => {
      const strategy = new UniversalFallbackStrategy({
        categoryId: 'cat-1',
        categoryName: 'Test Category',
        isEditMode: false,
      })

      // Valid sizes
      const validSizes = [
        {
          ageCategory: 'ADULT' as const,
          size: 'M' as const,
          quantity: 5,
          originalQuantity: 5,
          availableQuantity: 5,
          rentedQuantity: 0,
          lostQuantity: 0,
          isActive: true,
        }
      ]

      const validResult = strategy.validateProductSizes(validSizes)
      expect(validResult.isValid).toBe(true)
      expect(validResult.errors).toHaveLength(0)

      // Invalid sizes (empty)
      const invalidResult = strategy.validateProductSizes([])
      expect(invalidResult.isValid).toBe(false)
      expect(invalidResult.errors).toContain('Minimal satu ukuran harus dipilih dengan stok > 0')

      // Invalid sizes (zero quantity)
      const zeroQuantitySizes = [
        {
          ageCategory: 'ADULT' as const,
          size: 'M' as const,
          quantity: 0,
          originalQuantity: 0,
          availableQuantity: 0,
          rentedQuantity: 0,
          lostQuantity: 0,
          isActive: true,
        }
      ]

      const zeroResult = strategy.validateProductSizes(zeroQuantitySizes)
      expect(zeroResult.isValid).toBe(false)
      expect(zeroResult.errors).toContain('Stok untuk ukuran M harus lebih dari 0')
    })
  })

  describe('Strategy System Integration', () => {
    it('should work consistently for both create and edit modes', () => {
      // Create mode
      const createStrategy = FormStrategyFactory.createWithContext('universal_fallback', {
        categoryId: 'cat-1',
        categoryName: 'Test Category',
        isEditMode: false,
      })

      // Edit mode
      const editStrategy = FormStrategyFactory.createWithContext('universal_fallback', {
        categoryId: 'cat-1',
        categoryName: 'Test Category',
        isEditMode: true,
        existingData: []
      })

      // Both should have same interface
      expect(createStrategy.getFormFields()).toEqual(editStrategy.getFormFields())
      expect(createStrategy.getFormDescription()).toEqual(editStrategy.getFormDescription())
      
      // Both should handle form data transformation consistently
      const testFormData = {
        categoryId: 'cat-1',
        sizes: ['M'],
        quantity_M: 5,
      }

      const createSizes = createStrategy.transformToProductSizes(testFormData)
      const editSizes = editStrategy.transformToProductSizes(testFormData)
      
      expect(createSizes).toEqual(editSizes)
    })
  })
})