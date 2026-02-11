/**
 * Stock Validation Service Tests - Bug Fix Verification
 *
 * Tests the fix for the critical bug where overlapping transactions were not detected
 * due to the `startsWith` query failing on JSON format in kondisiAwal field.
 *
 * Root Cause: The query used `startsWith: id` but kondisiAwal contains JSON like:
 * {"productSizeId":"uuid-123",...} which starts with '{', not the UUID.
 *
 * Fix: Changed to `contains: "productSizeId":"${id}"` to search within the JSON string.
 */

import { PrismaClient } from '@prisma/client'
import { StockValidationService, createStockValidationService } from '../../../../features/kasir/services/stockValidationService'

describe('StockValidationService - Bug Fix Verification', () => {
  let stockValidationService: StockValidationService
  let mockPrisma: jest.Mocked<PrismaClient>

  beforeEach(() => {
    mockPrisma = {
      productSize: {
        findMany: jest.fn(),
      },
      transaksiItem: {
        findMany: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaClient>

    stockValidationService = createStockValidationService(mockPrisma)
    jest.clearAllMocks()
  })

  /**
   * TEST CASE 1: Verify overlapping transactions with identical date ranges are blocked
   */
  describe('identical date range overlap', () => {
    it('should detect overlap when dates are identical', async () => {
      const existingTransaction = {
        id: 'txn-item-1',
        jumlah: 2,
        kondisiAwal: '{"productSizeId":"size-uuid-123","size":"L","ageCategory":"ADULT","condition":"baik"}',
        transaksi: {
          kode: 'TXN-20260209-002',
          status: 'active',
          tglMulai: new Date('2026-02-27'),
          tglSelesai: new Date('2026-03-02'),
        },
      }

      ;(mockPrisma.transaksiItem.findMany as jest.Mock).mockResolvedValueOnce([existingTransaction])

      ;(mockPrisma.productSize.findMany as jest.Mock).mockResolvedValue({
        then: (callback: any) =>
          callback([
            {
              id: 'size-uuid-123',
              productId: 'product-1',
              ageCategory: 'ADULT',
              size: 'L',
              originalQuantity: 4,
              rentedQuantity: 0,
              lostQuantity: 0,
              availableQuantity: 4,
              isActive: true,
              product: {
                id: 'product-1',
                code: 'PRD-001',
                name: 'Jaw Hitam',
                currentPrice: 50000,
                category: { id: 'cat-1', name: 'Jas' },
              },
            },
          ]),
      })

      const result = await stockValidationService.validateBulkStockAvailability(
        [{ productSizeId: 'size-uuid-123', quantity: 2 }],
        new Date('2026-02-27'),
        new Date('2026-03-02')
      )

      // ✅ VERIFIES THE FIX: Query uses contains, not startsWith
      expect(mockPrisma.transaksiItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                kondisiAwal: expect.objectContaining({
                  contains: '"productSizeId":"size-uuid-123"',
                }),
              }),
            ]),
          }),
        })
      )

      expect(result.valid).toBe(false)
      expect(result.items[0].isValid).toBe(false)
      expect(result.items[0].overlappingTransactions).toHaveLength(1)
    })
  })

  /**
   * TEST CASE 2: Verify partially overlapping transactions are blocked
   */
  describe('partial date range overlap', () => {
    it('should detect overlap when dates partially overlap', async () => {
      const existingTransaction = {
        id: 'txn-item-1',
        jumlah: 2,
        kondisiAwal: '{"productSizeId":"size-uuid-123","size":"L","ageCategory":"ADULT","condition":"baik"}',
        transaksi: {
          kode: 'TXN-20260210-003',
          status: 'active',
          tglMulai: new Date('2026-02-27'),
          tglSelesai: new Date('2026-03-02'),
        },
      }

      ;(mockPrisma.transaksiItem.findMany as jest.Mock).mockResolvedValueOnce([existingTransaction])

      ;(mockPrisma.productSize.findMany as jest.Mock).mockResolvedValue({
        then: (callback: any) =>
          callback([
            {
              id: 'size-uuid-123',
              productId: 'product-1',
              ageCategory: 'ADULT',
              size: 'L',
              originalQuantity: 4,
              rentedQuantity: 0,
              lostQuantity: 0,
              availableQuantity: 4,
              isActive: true,
              product: {
                id: 'product-1',
                code: 'PRD-001',
                name: 'Jaw Hitam',
                currentPrice: 50000,
                category: { id: 'cat-1', name: 'Jas' },
              },
            },
          ]),
      })

      const result = await stockValidationService.validateBulkStockAvailability(
        [{ productSizeId: 'size-uuid-123', quantity: 2 }],
        new Date('2026-02-28'),
        new Date('2026-03-03')
      )

      expect(result.valid).toBe(false)
      expect(result.items[0].isValid).toBe(false)
    })
  })

  /**
   * TEST CASE 3: Verify non-overlapping transactions are allowed
   */
  describe('non-overlapping date ranges', () => {
    it('should allow booking when dates do not overlap', async () => {
      ;(mockPrisma.transaksiItem.findMany as jest.Mock).mockResolvedValueOnce([])

      ;(mockPrisma.productSize.findMany as jest.Mock).mockResolvedValue({
        then: (callback: any) =>
          callback([
            {
              id: 'size-uuid-123',
              productId: 'product-1',
              ageCategory: 'ADULT',
              size: 'L',
              originalQuantity: 4,
              rentedQuantity: 0,
              lostQuantity: 0,
              availableQuantity: 4,
              isActive: true,
              product: {
                id: 'product-1',
                code: 'PRD-001',
                name: 'Jaw Hitam',
                currentPrice: 50000,
                category: { id: 'cat-1', name: 'Jas' },
              },
            },
          ]),
      })

      const result = await stockValidationService.validateBulkStockAvailability(
        [{ productSizeId: 'size-uuid-123', quantity: 2 }],
        new Date('2026-03-03'),
        new Date('2026-03-05')
      )

      expect(result.valid).toBe(true)
      expect(result.items[0].isValid).toBe(true)
    })
  })

  /**
   * TEST CASE 4: Verify the contains query works with JSON format
   */
  describe('JSON query fix verification', () => {
    it('should find productSizeId in kondisiAwal JSON string', async () => {
      const itemsWithJsonKondisiAwal = [
        {
          id: 'txn-item-1',
          jumlah: 1,
          kondisiAwal: '{"productSizeId":"size-uuid-456","size":"L","ageCategory":"ADULT"}',
          transaksi: {
            kode: 'TXN-001',
            status: 'active',
            tglMulai: new Date('2026-02-01'),
            tglSelesai: new Date('2026-02-05'),
          },
        },
      ]

      ;(mockPrisma.transaksiItem.findMany as jest.Mock).mockResolvedValueOnce(itemsWithJsonKondisiAwal)

      ;(mockPrisma.productSize.findMany as jest.Mock).mockResolvedValue({
        then: (callback: any) =>
          callback([
            {
              id: 'size-uuid-456',
              productId: 'product-1',
              ageCategory: 'ADULT',
              size: 'L',
              originalQuantity: 2,
              rentedQuantity: 0,
              lostQuantity: 0,
              availableQuantity: 2,
              isActive: true,
              product: {
                id: 'product-1',
                code: 'PRD-001',
                name: 'Jaw Hitam',
                currentPrice: 50000,
                category: { id: 'cat-1', name: 'Jas' },
              },
            },
          ]),
      })

      await stockValidationService.validateBulkStockAvailability(
        [{ productSizeId: 'size-uuid-456', quantity: 1 }],
        new Date('2026-02-01'),
        new Date('2026-02-05')
      )

      // ✅ CRITICAL VERIFICATION
      expect(mockPrisma.transaksiItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                kondisiAwal: expect.objectContaining({
                  contains: '"productSizeId":"size-uuid-456"',
                }),
              }),
            ]),
          }),
        })
      )
    })

    it('should document why startsWith fails on JSON', () => {
      const jsonKondisiAwal = '{"productSizeId":"size-uuid-123","size":"L"}'

      // This test documents the bug
      expect(jsonKondisiAwal.startsWith('size-uuid-123')).toBe(false) // ❌ Bug
      expect(jsonKondisiAwal.contains('"productSizeId":"size-uuid-123"')).toBe(true) // ✅ Fix
      expect(jsonKondisiAwal.startsWith('{')).toBe(true) // JSON starts with curly brace
    })
  })
})
