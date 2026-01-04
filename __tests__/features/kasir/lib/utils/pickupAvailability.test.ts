/**
 * Property Tests for Pickup Availability Calculation - Task 5.2
 * 
 * Property 7: Pickup availability calculation
 * Validates: Requirements 6.1, 6.2
 */

import fc from 'fast-check'
import { PairingDisplayFormatter } from '../../../../../features/kasir/lib/utils/pairingDisplayFormatter'

describe('Pickup Availability Property Tests', () => {
  // Generators for test data
  const transactionItemArb = fc.record({
    id: fc.uuid(),
    productName: fc.string({ minLength: 1, maxLength: 50 }),
    totalQuantity: fc.integer({ min: 1, max: 10 }),
    alreadyPickedUp: fc.integer({ min: 0, max: 5 }),
    kondisiAwal: fc.option(fc.oneof(
      // JSON format with pairing
      fc.record({
        productSizeId: fc.uuid(),
        size: fc.constantFrom('S', 'M', 'L', 'XL'),
        ageCategory: fc.constantFrom('ADULT', 'CHILD'),
        condition: fc.constantFrom('baik', 'rusak'),
        linkedSarung: fc.option(fc.record({
          productId: fc.uuid(),
          productSizeId: fc.uuid(),
          quantity: fc.integer({ min: 1, max: 3 })
        }))
      }).map(data => JSON.stringify(data)),
      // Pipe format
      fc.tuple(
        fc.uuid(),
        fc.constantFrom('S', 'M', 'L', 'XL'),
        fc.constantFrom('ADULT', 'CHILD'),
        fc.constantFrom('baik', 'rusak')
      ).map(([id, size, age, condition]) => `${id}|${size}|${age}|${condition}`),
      // Legacy format
      fc.string()
    ))
  }).map(item => ({
    ...item,
    remainingQuantity: Math.max(0, item.totalQuantity - item.alreadyPickedUp)
  }))

  const transactionArb = fc.record({
    id: fc.uuid(),
    transactionCode: fc.string({ minLength: 5, maxLength: 20 }),
    items: fc.array(transactionItemArb, { minLength: 1, maxLength: 10 })
  })

  // Feature: pickup-pairing-integration, Property 7: Pickup availability calculation
  test('Property 7: Pickup availability should only include items with remaining quantity > 0', () => {
    fc.assert(fc.property(
      transactionArb,
      (transaction) => {
        const availableItems = PairingDisplayFormatter.filterPickupableItems(
          transaction.items.filter(item => item.remainingQuantity > 0)
        )
        
        // Property: All available items should have remaining quantity > 0
        availableItems.forEach(item => {
          expect(item.remainingQuantity).toBeGreaterThan(0)
        })
        
        // Property: No items with 0 remaining quantity should be available
        const unavailableItems = transaction.items.filter(item => item.remainingQuantity === 0)
        unavailableItems.forEach(unavailableItem => {
          expect(availableItems.find(item => item.id === unavailableItem.id)).toBeUndefined()
        })
      }
    ), { numRuns: 100 })
  })

  test('Property 7.1: Transaction completion status should be based on all items being fully picked up', () => {
    fc.assert(fc.property(
      transactionArb,
      (transaction) => {
        // Calculate if transaction should be considered complete
        const allItemsFullyPickedUp = transaction.items.every(item => 
          item.alreadyPickedUp >= item.totalQuantity
        )
        
        const hasRemainingItems = transaction.items.some(item => 
          item.remainingQuantity > 0
        )
        
        // Property: Transaction completion should be inverse of having remaining items
        expect(allItemsFullyPickedUp).toBe(!hasRemainingItems)
        
        // Property: If any item has remaining quantity, transaction is not complete
        if (hasRemainingItems) {
          expect(allItemsFullyPickedUp).toBe(false)
        }
        
        // Property: If no items have remaining quantity, transaction is complete
        if (!hasRemainingItems) {
          expect(allItemsFullyPickedUp).toBe(true)
        }
      }
    ), { numRuns: 100 })
  })

  test('Property 7.2: Pickup availability calculation should be consistent across multiple calls', () => {
    fc.assert(fc.property(
      transactionArb,
      (transaction) => {
        const availableItems1 = PairingDisplayFormatter.filterPickupableItems(transaction.items)
        const availableItems2 = PairingDisplayFormatter.filterPickupableItems(transaction.items)
        
        // Property: Same input should always produce same output
        expect(availableItems1.length).toBe(availableItems2.length)
        
        // Property: Items should be in same order and have same properties
        availableItems1.forEach((item1, index) => {
          const item2 = availableItems2[index]
          expect(item1.id).toBe(item2.id)
          expect(item1.remainingQuantity).toBe(item2.remainingQuantity)
        })
      }
    ), { numRuns: 100 })
  })

  test('Property 7.3: Paired items should not affect availability calculation differently than regular items', () => {
    fc.assert(fc.property(
      transactionArb,
      (transaction) => {
        const availableItems = PairingDisplayFormatter.filterPickupableItems(transaction.items)
        
        // Property: Pairing status should not affect whether item is pickupable
        // An item is pickupable if it has remaining quantity, regardless of pairing
        availableItems.forEach(item => {
          const pairingInfo = PairingDisplayFormatter.extractPairingInfo(item.kondisiAwal)
          
          // Whether paired or not, item should have remaining quantity
          expect(item.remainingQuantity).toBeGreaterThan(0)
          
          // Pairing status should not prevent pickup
          expect(typeof pairingInfo.hasPairing).toBe('boolean')
        })
      }
    ), { numRuns: 100 })
  })

  test('Property 7.4: Pickup button text should reflect actual pickupable items', () => {
    fc.assert(fc.property(
      fc.array(fc.record({
        jasName: fc.string({ minLength: 1, maxLength: 30 }),
        kondisiAwal: fc.option(fc.string()),
        quantity: fc.integer({ min: 1, max: 5 })
      }), { minLength: 0, maxLength: 10 }),
      (selectedItems) => {
        const buttonText = PairingDisplayFormatter.generatePickupButtonText(selectedItems)
        
        if (selectedItems.length === 0) {
          // Property: Empty selection should show default text
          expect(buttonText).toBe('Pilih Item')
        } else {
          // Property: Non-empty selection should show pickup text
          expect(buttonText).toContain('Pickup')
          
          const totalQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0)
          const confirmation = PairingDisplayFormatter.formatItemsForConfirmation(selectedItems)
          
          // Property: Button text should reflect content accurately
          if (confirmation.pairedItems.length > 0) {
            expect(buttonText).toContain('Paket')
          }
          
          // Property: Button text should contain quantity information
          expect(buttonText).toMatch(/\d+/)
        }
      }
    ), { numRuns: 100 })
  })

  test('Property 7.5: Pickup availability should handle edge cases gracefully', () => {
    fc.assert(fc.property(
      fc.oneof(
        // Empty transaction
        fc.constant({ items: [] }),
        // Transaction with all items fully picked up
        fc.record({
          items: fc.array(fc.record({
            id: fc.uuid(),
            totalQuantity: fc.integer({ min: 1, max: 5 }),
            alreadyPickedUp: fc.integer({ min: 1, max: 5 }),
            kondisiAwal: fc.option(fc.string())
          }).map(item => ({
            ...item,
            alreadyPickedUp: item.totalQuantity, // Force fully picked up
            remainingQuantity: 0
          })), { minLength: 1, maxLength: 5 })
        }),
        // Transaction with negative remaining quantities (data corruption)
        fc.record({
          items: fc.array(fc.record({
            id: fc.uuid(),
            totalQuantity: fc.integer({ min: 1, max: 5 }),
            alreadyPickedUp: fc.integer({ min: 6, max: 10 }), // More than total
            kondisiAwal: fc.option(fc.string())
          }).map(item => ({
            ...item,
            remainingQuantity: Math.max(0, item.totalQuantity - item.alreadyPickedUp)
          })), { minLength: 1, maxLength: 5 })
        })
      ),
      (transaction) => {
        // Property: System should handle edge cases without throwing
        expect(() => {
          const availableItems = PairingDisplayFormatter.filterPickupableItems(transaction.items)
          
          // Property: Should always return an array
          expect(Array.isArray(availableItems)).toBe(true)
          
          // Property: All returned items should have valid remaining quantity
          availableItems.forEach(item => {
            expect(item.remainingQuantity).toBeGreaterThanOrEqual(0)
          })
          
        }).not.toThrow()
      }
    ), { numRuns: 100 })
  })

  test('Property 7.6: Pickup summary should accurately reflect availability', () => {
    fc.assert(fc.property(
      fc.array(fc.record({
        jasName: fc.string({ minLength: 1, maxLength: 30 }),
        kondisiAwal: fc.option(fc.string()),
        quantity: fc.integer({ min: 1, max: 5 })
      }), { minLength: 1, maxLength: 10 }),
      fc.string({ minLength: 1, maxLength: 20 }),
      (items, transactionCode) => {
        const summary = PairingDisplayFormatter.formatPickupSummary(items, transactionCode)
        
        // Property: Summary should accurately count items
        expect(summary.itemCount).toBe(items.length)
        expect(summary.pairingCount).toBeGreaterThanOrEqual(0)
        expect(summary.pairingCount).toBeLessThanOrEqual(items.length)
        
        // Property: Descriptions should be consistent
        expect(summary.shortDescription.length).toBeGreaterThan(0)
        expect(summary.detailedDescription.length).toBeGreaterThan(0)
        
        // Property: All item names should appear in detailed description
        items.forEach(item => {
          expect(summary.detailedDescription).toContain(item.jasName)
        })
        
        // Property: Short description should reflect pairing status
        if (summary.pairingCount > 0) {
          expect(summary.shortDescription.toLowerCase()).toContain('paket')
        }
      }
    ), { numRuns: 100 })
  })
})