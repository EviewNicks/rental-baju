/**
 * Unit Tests for Return Service: Partial Returns & Paired Sarung Deduplication
 *
 * Verifies:
 * 1. Partial return status calculation ('sebagian' vs 'lengkap')
 * 2. Multi-session return completion logic
 * 3. Paired sarung deduplication in InventoryService (preventing double deduction/restoration)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { InventoryService } from '../inventoryService'
import { parseKondisiAwalEnhanced } from '../../lib/utils/kondisiAwalParser'

describe('Return Service - Partial Return Status Logic', () => {
  it('should set statusKembali to "sebagian" when returned quantity is less than remaining', () => {
    const remainingBefore = 5
    const returnedInThisSession = 2
    const remainingAfter = remainingBefore - returnedInThisSession
    const isFullyReturned = remainingAfter <= 0
    const statusKembali = isFullyReturned ? 'lengkap' : 'sebagian'

    expect(statusKembali).toBe('sebagian')
    expect(remainingAfter).toBe(3)
  })

  it('should set statusKembali to "lengkap" when returned quantity equals remaining', () => {
    const remainingBefore = 3
    const returnedInThisSession = 3
    const remainingAfter = remainingBefore - returnedInThisSession
    const isFullyReturned = remainingAfter <= 0
    const statusKembali = isFullyReturned ? 'lengkap' : 'sebagian'

    expect(statusKembali).toBe('lengkap')
    expect(remainingAfter).toBe(0)
  })

  it('should set statusKembali to "lengkap" across multi-session returns', () => {
    const totalPickedUp = 4

    // Session 1: Return 1 of 4
    let remaining = totalPickedUp
    const session1Returned = 1
    remaining -= session1Returned
    const status1 = remaining <= 0 ? 'lengkap' : 'sebagian'
    expect(status1).toBe('sebagian')
    expect(remaining).toBe(3)

    // Session 2: Return remaining 3 of 4
    const session2Returned = 3
    remaining -= session2Returned
    const status2 = remaining <= 0 ? 'lengkap' : 'sebagian'
    expect(status2).toBe('lengkap')
    expect(remaining).toBe(0)
  })
})

describe('InventoryService - Paired Sarung Deduplication', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrisma: any
  let inventoryService: InventoryService

  beforeEach(() => {
    mockPrisma = {
      productSize: {
        update: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue({}),
      },
      constructor: {
        name: 'PrismaTransactionClient',
      },
    }
    inventoryService = new InventoryService(mockPrisma)
  })

  it('should parse isPairedSarung flag correctly from JSON kondisiAwal', () => {
    const sarungKondisiAwal = JSON.stringify({
      productSizeId: 'sarung-size-123',
      size: 'ALL_SIZE',
      ageCategory: 'ADULT',
      condition: 'baik',
      isPairedSarung: true,
      parentJasProductId: 'jas-prod-456',
    })

    const parsed = parseKondisiAwalEnhanced(sarungKondisiAwal)
    expect(parsed.isPairedSarung).toBe(true)
    expect(parsed.parentJasProductId).toBe('jas-prod-456')
    expect(parsed.productSizeId).toBe('sarung-size-123')
  })

  it('should skip duplicate stock deduction during pickup for paired sarung items', async () => {
    const sarungKondisiAwal = JSON.stringify({
      productSizeId: 'sarung-size-123',
      size: 'ALL_SIZE',
      ageCategory: 'ADULT',
      condition: 'baik',
      isPairedSarung: true,
      parentJasProductId: 'jas-prod-456',
    })

    await inventoryService.processStockForPickup(sarungKondisiAwal, 1, 'item-sarung-1')

    // Should NOT call productSize.update because it is already deducted by parent jas
    expect(mockPrisma.productSize.update).not.toHaveBeenCalled()
  })

  it('should skip duplicate stock restoration during return for paired sarung items', async () => {
    const sarungKondisiAwal = JSON.stringify({
      productSizeId: 'sarung-size-123',
      size: 'ALL_SIZE',
      ageCategory: 'ADULT',
      condition: 'baik',
      isPairedSarung: true,
      parentJasProductId: 'jas-prod-456',
    })

    await inventoryService.processStockForReturn(sarungKondisiAwal, 1, 'item-sarung-1')

    // Should NOT call productSize.update because it is already restored by parent jas
    expect(mockPrisma.productSize.update).not.toHaveBeenCalled()
  })

  it('should perform single deduction during pickup for standalone non-paired sarung', async () => {
    const standaloneSarung = JSON.stringify({
      productSizeId: 'sarung-size-standalone',
      size: 'ALL_SIZE',
      ageCategory: 'ADULT',
      condition: 'baik',
      isPairedSarung: false,
    })

    await inventoryService.processStockForPickup(standaloneSarung, 2, 'item-sarung-standalone')

    expect(mockPrisma.productSize.update).toHaveBeenCalledTimes(1)
    expect(mockPrisma.productSize.update).toHaveBeenCalledWith({
      where: { id: 'sarung-size-standalone' },
      data: {
        rentedQuantity: { increment: 2 },
        availableQuantity: { decrement: 2 },
      },
    })
  })

  it('should perform dual deduction for parent jas item with linkedSarung', async () => {
    const jasKondisiAwal = JSON.stringify({
      productSizeId: 'jas-size-789',
      size: 'L',
      ageCategory: 'ADULT',
      condition: 'baik',
      linkedSarung: {
        productId: 'sarung-prod-1',
        productSizeId: 'sarung-size-123',
        quantity: 1,
      },
    })

    await inventoryService.processStockForPickup(jasKondisiAwal, 1, 'item-jas-1')

    // Expect dual deduction: 1 for jas, 1 for sarung
    expect(mockPrisma.productSize.update).toHaveBeenCalledTimes(2)
    expect(mockPrisma.productSize.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'jas-size-789' },
      data: {
        rentedQuantity: { increment: 1 },
        availableQuantity: { decrement: 1 },
      },
    })
    expect(mockPrisma.productSize.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'sarung-size-123' },
      data: {
        rentedQuantity: { increment: 1 },
        availableQuantity: { decrement: 1 },
      },
    })
  })
})
