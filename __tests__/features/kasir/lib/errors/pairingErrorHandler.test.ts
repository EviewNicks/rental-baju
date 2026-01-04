/**
 * Property Tests for PairingErrorHandler - Task 4.1
 * 
 * Property 6: Contextual error messaging
 * Validates: Requirements 4.1, 4.4
 */

import fc from 'fast-check'
import { PairingErrorHandler, ErrorType, PairingErrorContext, StockContext } from '../../../../../features/kasir/lib/errors/pairingErrorHandler'

describe('PairingErrorHandler Property Tests', () => {
  // Generators for test data
  const errorMessageArb = fc.oneof(
    fc.constant('JSON parsing failed'),
    fc.constant('Stock operation failed'),
    fc.constant('Item filtering error'),
    fc.constant('Database connection timeout'),
    fc.constant('No record was found for an update'),
    fc.constant('Insufficient stock available'),
    fc.constant('Transaction already closed'),
    fc.constant('Permission denied'),
    fc.constant('Item transaksi tidak ditemukan')
  )

  const pairingContextArb = fc.record({
    transactionId: fc.uuid(),
    itemId: fc.option(fc.uuid()),
    kondisiAwal: fc.option(fc.string()),
    detectedFormat: fc.option(fc.constantFrom('json', 'pipe', 'unknown')),
    pairingData: fc.option(fc.record({
      hasLinkedSarung: fc.boolean(),
      linkedSarungId: fc.option(fc.uuid())
    }))
  })

  const stockContextArb = fc.record({
    productSizeId: fc.uuid(),
    quantity: fc.integer({ min: 1, max: 10 }),
    itemId: fc.uuid(),
    linkedSarungSizeId: fc.option(fc.uuid())
  })

  // Feature: pickup-pairing-integration, Property 6: Contextual error messaging
  test('Property 6: All error messages should contain actionable recovery steps', () => {
    fc.assert(fc.property(
      errorMessageArb,
      pairingContextArb,
      (errorMessage, context) => {
        const error = new Error(errorMessage)
        const contextualMessage = PairingErrorHandler.generateContextualErrorMessage(error, context)
        
        // Property: All error messages should contain actionable guidance
        const hasActionableGuidance = 
          contextualMessage.includes('Silakan') ||
          contextualMessage.includes('coba lagi') ||
          contextualMessage.includes('refresh') ||
          contextualMessage.includes('hubungi administrator') ||
          contextualMessage.includes('periksa')
        
        expect(hasActionableGuidance).toBe(true)
        expect(contextualMessage.length).toBeGreaterThan(10) // Should be descriptive
        expect(contextualMessage).not.toContain('undefined')
        expect(contextualMessage).not.toContain('null')
      }
    ), { numRuns: 100 })
  })

  test('Property 6.1: Error classification should be consistent and deterministic', () => {
    fc.assert(fc.property(
      errorMessageArb,
      pairingContextArb,
      (errorMessage, context) => {
        const error = new Error(errorMessage)
        
        // Property: Same error should always classify to same type
        const classification1 = PairingErrorHandler.classifyError(error, context)
        const classification2 = PairingErrorHandler.classifyError(error, context)
        
        expect(classification1).toBe(classification2)
        expect(Object.values(ErrorType)).toContain(classification1)
      }
    ), { numRuns: 100 })
  })

  test('Property 6.2: Data format errors should allow graceful degradation', () => {
    fc.assert(fc.property(
      fc.string(),
      fc.option(fc.uuid()),
      (kondisiAwal, itemId) => {
        const error = new Error('JSON parsing failed')
        
        // Property: Data format errors should not throw, just log
        expect(() => {
          PairingErrorHandler.handleDataFormatError(error, kondisiAwal, itemId)
        }).not.toThrow()
        
        // Should classify as data format error
        const errorType = PairingErrorHandler.classifyError(error)
        expect(errorType).toBe(ErrorType.DATA_FORMAT_ERROR)
        
        // Should not cause pickup failure
        const shouldFail = PairingErrorHandler.shouldFailPickup(error)
        expect(shouldFail).toBe(false)
      }
    ), { numRuns: 100 })
  })

  test('Property 6.3: Stock errors should continue pickup process', () => {
    fc.assert(fc.property(
      stockContextArb,
      (context) => {
        const error = new Error('Stock operation failed')
        
        // Property: Stock errors should not throw, just log
        expect(() => {
          PairingErrorHandler.handleStockError(error, context)
        }).not.toThrow()
        
        // Should classify as stock management error
        const errorType = PairingErrorHandler.classifyError(error)
        expect(errorType).toBe(ErrorType.STOCK_MANAGEMENT_ERROR)
        
        // Should not cause pickup failure
        const shouldFail = PairingErrorHandler.shouldFailPickup(error)
        expect(shouldFail).toBe(false)
      }
    ), { numRuns: 100 })
  })

  test('Property 6.4: Item filtering errors should cause immediate failure', () => {
    fc.assert(fc.property(
      fc.uuid(),
      (itemId) => {
        const error = new Error('Item filtering error')
        
        // Property: Item filtering errors should throw
        expect(() => {
          PairingErrorHandler.handleItemFilteringError(error, itemId)
        }).toThrow()
        
        // Should classify as item filtering error
        const errorType = PairingErrorHandler.classifyError(error)
        expect(errorType).toBe(ErrorType.ITEM_FILTERING_ERROR)
        
        // Should cause pickup failure
        const shouldFail = PairingErrorHandler.shouldFailPickup(error)
        expect(shouldFail).toBe(true)
      }
    ), { numRuns: 100 })
  })

  test('Property 6.5: Error context creation should preserve all input data', () => {
    fc.assert(fc.property(
      fc.uuid(),
      fc.array(fc.record({
        id: fc.uuid(),
        jumlahDiambil: fc.integer({ min: 1, max: 5 })
      }), { minLength: 1, maxLength: 10 }),
      errorMessageArb,
      (transactionId, items, errorMessage) => {
        const error = new Error(errorMessage)
        const context = PairingErrorHandler.createPairingErrorContext(error, transactionId, items)
        
        // Property: Context should preserve all input data
        expect(context.transactionId).toBe(transactionId)
        expect(context.items).toHaveLength(items.length)
        expect(context.timestamp).toBeDefined()
        expect(context.error).toBeDefined()
        expect(context.pairingContext).toBeDefined()
        
        // Should contain pairing-specific context
        expect(context.pairingContext.hasPairingData).toBe(true)
        expect(context.pairingContext.formatSupport).toContain('JSON')
        expect(context.pairingContext.formatSupport).toContain('pipe-separated')
        expect(context.pairingContext.stockManagement).toBe('pairing-aware')
      }
    ), { numRuns: 100 })
  })

  test('Property 6.6: Critical errors should fail pickup, non-critical should allow continuation', () => {
    fc.assert(fc.property(
      fc.oneof(
        fc.constant('Item filtering error'), // Critical
        fc.constant('Permission denied'), // Critical
        fc.constant('JSON parsing failed'), // Non-critical
        fc.constant('Stock operation failed'), // Non-critical
        fc.constant('Database connection timeout') // Critical
      ),
      (errorMessage) => {
        const error = new Error(errorMessage)
        const shouldFail = PairingErrorHandler.shouldFailPickup(error)
        const errorType = PairingErrorHandler.classifyError(error)
        
        // Property: Error handling decision should be consistent with error type
        if (errorType === ErrorType.ITEM_FILTERING_ERROR || errorType === ErrorType.VALIDATION_ERROR) {
          expect(shouldFail).toBe(true)
        } else if (errorType === ErrorType.DATA_FORMAT_ERROR || errorType === ErrorType.STOCK_MANAGEMENT_ERROR) {
          expect(shouldFail).toBe(false)
        }
        
        // Should always return a boolean
        expect(typeof shouldFail).toBe('boolean')
      }
    ), { numRuns: 100 })
  })
})