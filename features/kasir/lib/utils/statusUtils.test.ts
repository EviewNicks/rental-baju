/**
 * Unit Tests for Transaction Status Single Source of Truth (statusUtils.ts)
 *
 * Covers Must-Have (M2) & Should-Have (S1, S2) status rules:
 * - Final states (cancelled, selesai)
 * - Unresolved lost items (pending_resolution)
 * - Returned items overriding terlambat (including TXN-20261115-006 scenario with unpicked/bonus item)
 * - Dynamic overdue only for picked-up transactions (S1)
 * - Unified ANY-item pickup rule (S2)
 * - Date-only normalization (same-day return is not overdue)
 */

import {
  resolveTransactionStatus,
  calculateEnhancedStatus,
  hasValidItemData,
  hasPickupItems,
  hasUnresolvedLostItems,
  areAllPickedUpItemsReturned,
  isOverdue,
  type StatusCalculableItem,
} from './statusUtils'
import type { TransaksiItemResponse } from '../../types'

describe('Status Utils - Single Source of Truth', () => {
  const fixedNow = new Date('2026-11-19T14:00:00.000Z')
  const yesterday = '2026-11-18T00:00:00.000Z'
  const today = '2026-11-19T00:00:00.000Z'
  const tomorrow = '2026-11-20T00:00:00.000Z'

  describe('resolveTransactionStatus / calculateEnhancedStatus', () => {
    describe('Priority 1: Final Terminal States', () => {
      test('cancelled always stays cancelled regardless of dates or items', () => {
        const items: StatusCalculableItem[] = [
          { jumlah: 1, jumlahDiambil: 1, statusKembali: 'lengkap' },
        ]
        expect(resolveTransactionStatus('cancelled', items, yesterday, fixedNow)).toBe('cancelled')
      })

      test('selesai always stays selesai regardless of past due date', () => {
        const items: StatusCalculableItem[] = [
          { jumlah: 1, jumlahDiambil: 1, statusKembali: 'lengkap' },
        ]
        expect(resolveTransactionStatus('selesai', items, yesterday, fixedNow)).toBe('selesai')
      })
    })

    describe('Priority 2: Unresolved Lost Items (pending_resolution)', () => {
      test('returns pending_resolution when any item has unresolved HILANG returnCondition', () => {
        const items: StatusCalculableItem[] = [
          {
            jumlah: 1,
            jumlahDiambil: 1,
            statusKembali: 'lengkap',
            returnConditions: [{ kondisiAkhir: 'Hilang saat acara', resolutionStatus: null }],
          },
        ]
        expect(resolveTransactionStatus('diambil', items, yesterday, fixedNow)).toBe(
          'pending_resolution',
        )
        expect(resolveTransactionStatus('terlambat', items, yesterday, fixedNow)).toBe(
          'pending_resolution',
        )
      })

      test('preserves pending_resolution when item returnConditions are not loaded (list view)', () => {
        const items: StatusCalculableItem[] = [
          { jumlah: 1, jumlahDiambil: 1, statusKembali: 'lengkap' },
        ]
        expect(resolveTransactionStatus('pending_resolution', items, yesterday, fixedNow)).toBe(
          'pending_resolution',
        )
      })

      test('transitions to selesai once all HILANG items have resolutionStatus and all picked-up items are lengkap', () => {
        const items: StatusCalculableItem[] = [
          {
            jumlah: 1,
            jumlahDiambil: 1,
            statusKembali: 'lengkap',
            returnConditions: [
              { kondisiAkhir: 'Hilang', resolutionStatus: 'resolved_replaced' },
            ],
          },
        ]
        expect(resolveTransactionStatus('pending_resolution', items, yesterday, fixedNow)).toBe(
          'selesai',
        )
      })
    })

    describe('Priority 3 (M2): All Picked-Up Items Returned -> selesai (overrides terlambat)', () => {
      test('TXN-20261115-006 scenario: DB status terlambat + all picked-up items lengkap -> selesai', () => {
        const items: StatusCalculableItem[] = [
          { jumlah: 1, jumlahDiambil: 1, statusKembali: 'lengkap' },
          { jumlah: 1, jumlahDiambil: 1, statusKembali: 'lengkap' },
        ]
        expect(resolveTransactionStatus('terlambat', items, yesterday, fixedNow)).toBe('selesai')
      })

      test('TXN-20261115-006 pairing/unpicked scenario: picked-up Jas lengkap + unpicked/bonus Sarung (jumlahDiambil=0, statusKembali=belum) past due -> selesai', () => {
        const items: StatusCalculableItem[] = [
          { jumlah: 1, jumlahDiambil: 1, statusKembali: 'lengkap' },
          { jumlah: 1, jumlahDiambil: 0, statusKembali: 'belum' },
        ]
        expect(resolveTransactionStatus('diambil', items, yesterday, fixedNow)).toBe('selesai')
        expect(resolveTransactionStatus('terlambat', items, yesterday, fixedNow)).toBe('selesai')
        expect(resolveTransactionStatus('active', items, yesterday, fixedNow)).toBe('selesai')
      })

      test('partial return past due date (1 of 2 picked-up items still belum/sebagian) -> terlambat', () => {
        const items: StatusCalculableItem[] = [
          { jumlah: 1, jumlahDiambil: 1, statusKembali: 'lengkap' },
          { jumlah: 1, jumlahDiambil: 1, statusKembali: 'sebagian' },
        ]
        expect(resolveTransactionStatus('diambil', items, yesterday, fixedNow)).toBe('terlambat')
      })
    })

    describe('Priority 4 (S1): Dynamic Overdue Check (terlambat)', () => {
      test('picked-up transaction past due date (H+1) -> terlambat', () => {
        const items: StatusCalculableItem[] = [
          { jumlah: 1, jumlahDiambil: 1, statusKembali: 'belum' },
        ]
        expect(resolveTransactionStatus('diambil', items, yesterday, fixedNow)).toBe('terlambat')
        expect(resolveTransactionStatus('active', items, yesterday, fixedNow)).toBe('terlambat')
      })

      test('picked-up transaction on exact due date (same day) is NOT overdue -> diambil', () => {
        const items: StatusCalculableItem[] = [
          { jumlah: 1, jumlahDiambil: 1, statusKembali: 'belum' },
        ]
        expect(resolveTransactionStatus('diambil', items, today, fixedNow)).toBe('diambil')
        expect(resolveTransactionStatus('active', items, today, fixedNow)).toBe('diambil')
      })

      test('S1: active booking NEVER picked up (jumlahDiambil=0) past due date -> stays active (NOT terlambat)', () => {
        const items: StatusCalculableItem[] = [
          { jumlah: 1, jumlahDiambil: 0, statusKembali: 'belum' },
          { jumlah: 2, jumlahDiambil: 0, statusKembali: 'belum' },
        ]
        expect(resolveTransactionStatus('active', items, yesterday, fixedNow)).toBe('active')
      })

      test('explicit DB terlambat without returned items stays terlambat', () => {
        const items: StatusCalculableItem[] = [
          { jumlah: 1, jumlahDiambil: 1, statusKembali: 'belum' },
        ]
        expect(resolveTransactionStatus('terlambat', items, yesterday, fixedNow)).toBe('terlambat')
        expect(resolveTransactionStatus('terlambat', [], undefined, fixedNow)).toBe('terlambat')
      })
    })

    describe('Priority 5 (S2): Unified ANY-Item Pickup Rule (diambil)', () => {
      test('active with partial pickup (1 of 2 items picked up, not overdue) -> diambil', () => {
        const items: StatusCalculableItem[] = [
          { jumlah: 2, jumlahDiambil: 0, statusKembali: 'belum' },
          { jumlah: 1, jumlahDiambil: 1, statusKembali: 'belum' },
        ]
        expect(resolveTransactionStatus('active', items, tomorrow, fixedNow)).toBe('diambil')
      })

      test('active with single item partially picked up (1 of 2 qty) -> diambil', () => {
        const items: StatusCalculableItem[] = [
          { jumlah: 2, jumlahDiambil: 1, statusKembali: 'belum' },
        ]
        expect(resolveTransactionStatus('active', items, tomorrow, fixedNow)).toBe('diambil')
      })

      test('active with no items picked up -> stays active', () => {
        const items: StatusCalculableItem[] = [
          { jumlah: 2, jumlahDiambil: 0, statusKembali: 'belum' },
        ]
        expect(resolveTransactionStatus('active', items, tomorrow, fixedNow)).toBe('active')
      })

      test('calculateEnhancedStatus alias matches resolveTransactionStatus', () => {
        const items: StatusCalculableItem[] = [
          { jumlah: 1, jumlahDiambil: 1, statusKembali: 'lengkap' },
        ]
        expect(calculateEnhancedStatus('terlambat', items, yesterday)).toBe('selesai')
      })
    })

    describe('Edge Cases', () => {
      test('handles undefined/empty items and invalid endDate gracefully', () => {
        expect(resolveTransactionStatus('active', undefined, undefined, fixedNow)).toBe('active')
        expect(resolveTransactionStatus('active', [], undefined, fixedNow)).toBe('active')
        expect(
          resolveTransactionStatus(
            'active',
            [{ jumlah: 1, jumlahDiambil: 1, statusKembali: 'belum' }],
            'invalid-date',
            fixedNow,
          ),
        ).toBe('diambil')
      })
    })
  })

  describe('Helper Functions', () => {
    test('hasUnresolvedLostItems detects unresolved HILANG in returnConditions and conditionBreakdown', () => {
      expect(
        hasUnresolvedLostItems([
          { returnConditions: [{ kondisiAkhir: 'Barang Hilang', resolutionStatus: null }] },
        ]),
      ).toBe(true)
      expect(
        hasUnresolvedLostItems([
          { conditionBreakdown: [{ kondisiAkhir: 'hilang', resolutionStatus: undefined }] },
        ]),
      ).toBe(true)
      expect(
        hasUnresolvedLostItems([
          { returnConditions: [{ kondisiAkhir: 'Hilang', resolutionStatus: 'resolved_lost' }] },
        ]),
      ).toBe(false)
      expect(
        hasUnresolvedLostItems([
          { returnConditions: [{ kondisiAkhir: 'Baik', resolutionStatus: null }] },
        ]),
      ).toBe(false)
    })

    test('areAllPickedUpItemsReturned evaluates only picked-up items', () => {
      expect(
        areAllPickedUpItemsReturned([
          { jumlahDiambil: 1, statusKembali: 'lengkap' },
          { jumlahDiambil: 0, statusKembali: 'belum' },
        ]),
      ).toBe(true)
      expect(
        areAllPickedUpItemsReturned([
          { jumlahDiambil: 1, statusKembali: 'lengkap' },
          { jumlahDiambil: 1, statusKembali: 'belum' },
        ]),
      ).toBe(false)
      expect(areAllPickedUpItemsReturned([{ jumlahDiambil: 0, statusKembali: 'belum' }])).toBe(false)
    })

    test('hasValidItemData validates array structure', () => {
      expect(hasValidItemData([{ jumlahDiambil: 0 }, { jumlahDiambil: 2 }] as TransaksiItemResponse[])).toBe(true)
      expect(hasValidItemData(undefined)).toBe(false)
      expect(hasValidItemData([])).toBe(false)
    })

    test('hasPickupItems checks any jumlahDiambil > 0', () => {
      expect(
        hasPickupItems([{ jumlahDiambil: 0 }, { jumlahDiambil: 1 }] as TransaksiItemResponse[]),
      ).toBe(true)
      expect(
        hasPickupItems([{ jumlahDiambil: 0 }, { jumlahDiambil: 0 }] as TransaksiItemResponse[]),
      ).toBe(false)
      expect(hasPickupItems([])).toBe(false)
    })

    test('isOverdue normalizes dates to date-only comparison (same day is not overdue)', () => {
      expect(isOverdue(yesterday, fixedNow)).toBe(true)
      expect(isOverdue(today, fixedNow)).toBe(false)
      expect(isOverdue(tomorrow, fixedNow)).toBe(false)
      expect(isOverdue(undefined, fixedNow)).toBe(false)
      expect(isOverdue('invalid-date', fixedNow)).toBe(false)
    })
  })
})
