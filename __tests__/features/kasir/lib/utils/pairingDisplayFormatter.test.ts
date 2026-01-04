/**
 * Property Tests for PairingDisplayFormatter - Task 5.1
 * 
 * Property 5: Item filtering consistency and display formatting
 * Validates: Requirements 3.1, 3.2, 3.5
 */

import fc from 'fast-check'
import { PairingDisplayFormatter, PairingDisplayInfo, PickupDisplayItem } from '../../../../../features/kasir/lib/utils/pairingDisplayFormatter'

describe('PairingDisplayFormatter Property Tests', () => {
  // Generators for test data
  const jasNameArb = fc.string({ minLength: 1, maxLength: 50 })
  
  const linkedSarungArb = fc.record({
    productId: fc.uuid(),
    productSizeId: fc.uuid(),
    quantity: fc.integer({ min: 1, max: 5 }),
    product: fc.option(fc.record({
      name: fc.string({ minLength: 1, maxLength: 30 }),
      code: fc.string({ minLength: 1, maxLength: 10 })
    }))
  })

  const jsonKondisiAwalArb = fc.record({
    productSizeId: fc.uuid(),
    size: fc.option(fc.constantFrom('S', 'M', 'L', 'XL')),
    ageCategory: fc.option(fc.constantFrom('ADULT', 'CHILD', 'TODDLER')),
    condition: fc.option(fc.constantFrom('baik', 'rusak')),
    linkedSarung: fc.option(linkedSarungArb)
  }).map(data => JSON.stringify(data))

  const pipeKondisiAwalArb = fc.tuple(
    fc.uuid(),
    fc.constantFrom('S', 'M', 'L', 'XL'),
    fc.constantFrom('ADULT', 'CHILD', 'TODDLER'),
    fc.constantFrom('baik', 'rusak')
  ).map(([id, size, age, condition]) => `${id}|${size}|${age}|${condition}`)

  const kondisiAwalArb = fc.oneof(
    jsonKondisiAwalArb,
    pipeKondisiAwalArb,
    fc.constant(null),
    fc.constant('')
  )

  const pickupDisplayItemArb = fc.record({
    jasName: jasNameArb,
    kondisiAwal: kondisiAwalArb,
    quantity: fc.integer({ min: 1, max: 10 })
  })

  // Feature: pickup-pairing-integration, Property 5: Item filtering consistency and display formatting
  test('Property 5: Display formatting should be consistent and reversible', () => {
    fc.assert(fc.property(
      jasNameArb,
      kondisiAwalArb,
      (jasName, kondisiAwal) => {
        const displayInfo = PairingDisplayFormatter.formatItemDisplayName(jasName, kondisiAwal)
        
        // Property: Display info should always contain original jas name
        expect(displayInfo.originalJasName).toBe(jasName)
        expect(displayInfo.displayName).toContain(jasName)
        
        // Property: isPaired should be consistent with linkedSarungName presence
        if (displayInfo.isPaired) {
          expect(displayInfo.linkedSarungName).toBeDefined()
          expect(displayInfo.pairingDescription).toBeDefined()
          expect(displayInfo.displayName).toContain('+')
        } else {
          expect(displayInfo.linkedSarungName).toBeUndefined()
          expect(displayInfo.pairingDescription).toBeUndefined()
          expect(displayInfo.displayName).toBe(jasName)
        }
        
        // Property: Display name should never be empty
        expect(displayInfo.displayName.length).toBeGreaterThan(0)
      }
    ), { numRuns: 100 })
  })

  test('Property 5.1: Pickup description generation should preserve all item information', () => {
    fc.assert(fc.property(
      fc.array(pickupDisplayItemArb, { minLength: 1, maxLength: 10 }),
      (items) => {
        const description = PairingDisplayFormatter.generatePickupDescription(items)
        
        // Property: Description should contain all item names
        items.forEach(item => {
          expect(description).toContain(item.jasName)
        })
        
        // Property: Description should be non-empty and readable
        expect(description.length).toBeGreaterThan(0)
        expect(description).not.toContain('undefined')
        expect(description).not.toContain('null')
        
        // Property: Multiple items should be separated by commas
        if (items.length > 1) {
          expect(description).toContain(',')
        }
      }
    ), { numRuns: 100 })
  })

  test('Property 5.2: Pairing information extraction should be deterministic', () => {
    fc.assert(fc.property(
      kondisiAwalArb,
      (kondisiAwal) => {
        const pairingInfo1 = PairingDisplayFormatter.extractPairingInfo(kondisiAwal)
        const pairingInfo2 = PairingDisplayFormatter.extractPairingInfo(kondisiAwal)
        
        // Property: Same input should always produce same output
        expect(pairingInfo1).toEqual(pairingInfo2)
        
        // Property: Pairing type should be consistent with hasPairing
        if (pairingInfo1.hasPairing) {
          expect(pairingInfo1.pairingType).toBe('jas-sarung')
          expect(pairingInfo1.linkedSarungId).toBeDefined()
        } else {
          expect(pairingInfo1.pairingType).toBe('none')
          expect(pairingInfo1.linkedSarungId).toBeUndefined()
        }
      }
    ), { numRuns: 100 })
  })

  test('Property 5.3: Modal formatting should provide complete display information', () => {
    fc.assert(fc.property(
      jasNameArb,
      kondisiAwalArb,
      (jasName, kondisiAwal) => {
        const modalInfo = PairingDisplayFormatter.formatPairingInfoForModal(jasName, kondisiAwal)
        
        // Property: Title should always be present and contain jas name
        expect(modalInfo.title).toBeDefined()
        expect(modalInfo.title.length).toBeGreaterThan(0)
        expect(modalInfo.title).toContain(jasName)
        
        // Property: Paired items should have additional information
        const displayInfo = PairingDisplayFormatter.formatItemDisplayName(jasName, kondisiAwal)
        if (displayInfo.isPaired) {
          expect(modalInfo.subtitle).toBeDefined()
          expect(modalInfo.badge).toBeDefined()
          expect(modalInfo.badge?.text).toBe('Paket')
          expect(modalInfo.badge?.variant).toBe('success')
        } else {
          expect(modalInfo.title).toBe(jasName)
        }
      }
    ), { numRuns: 100 })
  })

  test('Property 5.4: Confirmation formatting should correctly categorize items', () => {
    fc.assert(fc.property(
      fc.array(pickupDisplayItemArb, { minLength: 1, maxLength: 10 }),
      (items) => {
        const confirmation = PairingDisplayFormatter.formatItemsForConfirmation(items)
        
        // Property: Total counts should match input
        expect(confirmation.totalItems).toBe(items.length)
        expect(confirmation.totalQuantity).toBe(
          items.reduce((sum, item) => sum + item.quantity, 0)
        )
        
        // Property: All items should be categorized (paired or regular)
        const totalCategorized = confirmation.pairedItems.length + confirmation.regularItems.length
        expect(totalCategorized).toBe(items.length)
        
        // Property: Paired items should have both jas and sarung names
        confirmation.pairedItems.forEach(pairedItem => {
          expect(pairedItem.jasName).toBeDefined()
          expect(pairedItem.sarungName).toBeDefined()
          expect(pairedItem.displayName).toContain(pairedItem.jasName)
          expect(pairedItem.displayName).toContain(pairedItem.sarungName)
          expect(pairedItem.displayName).toContain('+')
          expect(pairedItem.quantity).toBeGreaterThan(0)
        })
        
        // Property: Regular items should have simple display names
        confirmation.regularItems.forEach(regularItem => {
          expect(regularItem.displayName).toBeDefined()
          expect(regularItem.quantity).toBeGreaterThan(0)
        })
      }
    ), { numRuns: 100 })
  })

  test('Property 5.5: Pickup summary should provide accurate statistics', () => {
    fc.assert(fc.property(
      fc.array(pickupDisplayItemArb, { minLength: 1, maxLength: 10 }),
      fc.string({ minLength: 1, maxLength: 20 }),
      (items, transactionCode) => {
        const summary = PairingDisplayFormatter.formatPickupSummary(items, transactionCode)
        
        // Property: Item count should match input
        expect(summary.itemCount).toBe(items.length)
        
        // Property: Pairing count should be non-negative and <= item count
        expect(summary.pairingCount).toBeGreaterThanOrEqual(0)
        expect(summary.pairingCount).toBeLessThanOrEqual(items.length)
        
        // Property: Descriptions should be non-empty and informative
        expect(summary.shortDescription.length).toBeGreaterThan(0)
        expect(summary.detailedDescription.length).toBeGreaterThan(0)
        
        // Property: Short description should reflect content type
        if (summary.pairingCount > 0) {
          expect(summary.shortDescription).toContain('paket')
        }
        
        // Property: Detailed description should contain all item names
        items.forEach(item => {
          expect(summary.detailedDescription).toContain(item.jasName)
        })
      }
    ), { numRuns: 100 })
  })

  test('Property 5.6: Pickup button text should reflect selection state', () => {
    fc.assert(fc.property(
      fc.array(pickupDisplayItemArb, { minLength: 0, maxLength: 10 }),
      (selectedItems) => {
        const buttonText = PairingDisplayFormatter.generatePickupButtonText(selectedItems)
        
        // Property: Button text should always be non-empty
        expect(buttonText.length).toBeGreaterThan(0)
        
        if (selectedItems.length === 0) {
          expect(buttonText).toBe('Pilih Item')
        } else {
          expect(buttonText).toContain('Pickup')
          
          const totalQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0)
          const confirmation = PairingDisplayFormatter.formatItemsForConfirmation(selectedItems)
          
          // Property: Button text should reflect item types
          if (confirmation.pairedItems.length > 0) {
            expect(buttonText).toContain('Paket')
          }
          
          // Property: Button text should contain quantity information
          if (confirmation.pairedItems.length === 0) {
            expect(buttonText).toContain(totalQuantity.toString())
          }
        }
      }
    ), { numRuns: 100 })
  })

  test('Property 5.7: Item filtering should preserve all valid items', () => {
    fc.assert(fc.property(
      fc.array(fc.record({
        id: fc.uuid(),
        kondisiAwal: kondisiAwalArb
      }), { minLength: 0, maxLength: 10 }),
      (items) => {
        const filtered = PairingDisplayFormatter.filterPickupableItems(items)
        
        // Property: Filtering should not remove items (for now, all items are pickupable)
        expect(filtered.length).toBe(items.length)
        
        // Property: Filtered items should maintain original structure
        filtered.forEach((filteredItem, index) => {
          expect(filteredItem.id).toBe(items[index].id)
          expect(filteredItem.kondisiAwal).toBe(items[index].kondisiAwal)
        })
      }
    ), { numRuns: 100 })
  })
})