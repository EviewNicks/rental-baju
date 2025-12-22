/**
 * Transaction History Service Unit Tests - Task 2.4 (CORRECTED)
 * Tests for ItemHistoryService (dedicated service for transaction history)
 * 
 * ARCHITECTURE FIX:
 * - Tests ItemHistoryService instead of TransaksiService
 * - Removes duplicate functionality testing
 * - Focuses on the proper service architecture
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { TransactionHistoryService } from '@/features/kasir/services/ItemHistoryService'

// Mock Prisma Client
const mockPrisma = {
  transaksi: {
    findMany: jest.fn(),
  },
} as unknown as PrismaClient

describe('ItemHistoryService (TransactionHistoryService)', () => {
  let historyService: ItemHistoryService
  
  beforeEach(() => {
    jest.clearAllMocks()
    historyService = new TransactionHistoryService(mockPrisma)
  })

  describe('getProductSizeHistory', () => {
    const mockProductSizeId = 'test-product-size-id'
    
    const mockTransactions = [
      {
        id: '1',
        kode: 'TXN-001',
        status: 'active',
        tglMulai: new Date('2024-02-01'),
        tglSelesai: new Date('2024-02-05'),
        items: [
          {
            id: 'item-1',
            jumlah: 2,
            kondisiAwal: `${mockProductSizeId}|L|dewasa|baik`,
            produk: {
              name: 'Test Product'
            }
          }
        ]
      },
      {
        id: '2',
        kode: 'TXN-002',
        status: 'diambil',
        tglMulai: new Date('2024-02-03'),
        tglSelesai: new Date('2024-02-07'),
        items: [
          {
            id: 'item-2',
            jumlah: 1,
            kondisiAwal: `${mockProductSizeId}|M|dewasa|baik`,
            produk: {
              name: 'Test Product'
            }
          }
        ]
      }
    ]

    it('should return transaction history for a product size', async () => {
      // Mock database response
      ;(mockPrisma.transaksi.findMany as jest.Mock).mockResolvedValue(mockTransactions)

      const result = await historyService.getProductSizeHistory(mockProductSizeId)

      expect(result).toHaveLength(2)
      // Check that both transactions are present (order may vary due to sorting)
      const transactionCodes = result.map(r => r.transactionCode)
      expect(transactionCodes).toContain('TXN-001')
      expect(transactionCodes).toContain('TXN-002')
      
      // Check structure of first result
      expect(result[0]).toHaveProperty('transactionCode')
      expect(result[0]).toHaveProperty('quantity')
      expect(result[0]).toHaveProperty('status')
      expect(result[0]).toHaveProperty('displayText')
    })

    it('should filter by status correctly', async () => {
      ;(mockPrisma.transaksi.findMany as jest.Mock).mockResolvedValue([mockTransactions[0]])

      const result = await historyService.getProductSizeHistory(
        mockProductSizeId,
        { statuses: ['active'] }
      )

      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('active')
      
      // Verify the query was called with correct status filter
      expect(mockPrisma.transaksi.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['active'] }
          })
        })
      )
    })

    it('should format display text correctly', async () => {
      ;(mockPrisma.transaksi.findMany as jest.Mock).mockResolvedValue([mockTransactions[0]])

      const result = await historyService.getProductSizeHistory(mockProductSizeId)

      expect(result[0].displayText).toBe('TXN-001 (2 item) untuk 1 Feb-5 Feb')
    })

    it('should handle date proximity sorting', async () => {
      const now = new Date()
      const recentTransaction = {
        ...mockTransactions[0],
        tglMulai: new Date(now.getTime() - 24 * 60 * 60 * 1000) // 1 day ago
      }
      const olderTransaction = {
        ...mockTransactions[1],
        tglMulai: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      }

      ;(mockPrisma.transaksi.findMany as jest.Mock).mockResolvedValue([
        olderTransaction,
        recentTransaction
      ])

      const result = await historyService.getProductSizeHistory(
        mockProductSizeId,
        { sortBy: 'date_proximity' }
      )

      // Should be sorted by proximity to current date (recent first)
      expect(result[0].transactionCode).toBe('TXN-001') // More recent
      expect(result[1].transactionCode).toBe('TXN-002') // Older
    })

    it('should handle empty results gracefully', async () => {
      ;(mockPrisma.transaksi.findMany as jest.Mock).mockResolvedValue([])

      const result = await historyService.getProductSizeHistory(mockProductSizeId)

      expect(result).toEqual([])
    })

    it('should handle database errors gracefully', async () => {
      ;(mockPrisma.transaksi.findMany as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      const result = await historyService.getProductSizeHistory(mockProductSizeId)

      expect(result).toEqual([])
    })

    it('should respect limit parameter', async () => {
      ;(mockPrisma.transaksi.findMany as jest.Mock).mockResolvedValue(mockTransactions)

      await historyService.getProductSizeHistory(
        mockProductSizeId,
        { limit: 1 }
      )

      expect(mockPrisma.transaksi.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1
        })
      )
    })

    it('should use correct default options', async () => {
      ;(mockPrisma.transaksi.findMany as jest.Mock).mockResolvedValue([])

      await historyService.getProductSizeHistory(mockProductSizeId)

      expect(mockPrisma.transaksi.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['active', 'diambil'] } // REVISED: Only active and diambil
          }),
          take: 50 // Default limit
        })
      )
    })
  })

  describe('Cache functionality', () => {
    it('should cache results for 5 minutes', async () => {
      const mockProductSizeId = 'test-cache-id'
      const mockData = [
        {
          id: '1',
          kode: 'TXN-CACHE',
          status: 'active',
          tglMulai: new Date('2024-02-01'),
          tglSelesai: new Date('2024-02-05'),
          items: [
            {
              id: 'item-1',
              jumlah: 1,
              kondisiAwal: `${mockProductSizeId}|L|dewasa|baik`,
              produk: { name: 'Test Product' }
            }
          ]
        }
      ]

      ;(mockPrisma.transaksi.findMany as jest.Mock).mockResolvedValue(mockData)

      // First call - should hit database
      const result1 = await historyService.getProductSizeHistory(mockProductSizeId)
      expect(mockPrisma.transaksi.findMany).toHaveBeenCalledTimes(1)

      // Second call - should use cache
      const result2 = await historyService.getProductSizeHistory(mockProductSizeId)
      expect(mockPrisma.transaksi.findMany).toHaveBeenCalledTimes(1) // Still 1, not 2

      expect(result1).toEqual(result2)
    })

    it('should provide cache statistics', () => {
      const stats = historyService.getCacheStats()
      
      expect(stats).toHaveProperty('totalEntries')
      expect(stats).toHaveProperty('expiredEntries')
      expect(stats).toHaveProperty('validEntries')
      expect(typeof stats.totalEntries).toBe('number')
    })
  })
})