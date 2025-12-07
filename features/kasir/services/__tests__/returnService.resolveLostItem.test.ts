/**
 * Unit Tests for resolveLostItem Method
 * 
 * Tests the lost item resolution functionality with two options:
 * 1. customer_replaced: Refund deposit + restore stock
 * 2. deposit_kept: Keep deposit + mark as lost
 */

import { PrismaClient } from '@prisma/client'
import { UnifiedReturnService } from '../returnService'
import { Decimal } from '@prisma/client/runtime/library'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    transaksiItemReturn: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    productSize: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    pembayaran: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

// Mock logger
jest.mock('../../lib/logger', () => ({
  kasirLogger: {
    returnProcess: {
      info: jest.fn(),
      error: jest.fn(),
    },
  },
}))

// Mock inventory service
jest.mock('../inventoryService', () => ({
  createInventoryService: jest.fn(() => ({
    updateStockOnReturn: jest.fn(),
  })),
}))

describe('UnifiedReturnService - resolveLostItem', () => {
  let prisma: jest.Mocked<PrismaClient>
  let service: UnifiedReturnService
  const userId = 'test-user-123'

  beforeEach(() => {
    jest.clearAllMocks()
    prisma = require('@/lib/prisma').prisma
    service = new UnifiedReturnService(prisma as unknown as PrismaClient, userId)
  })

  describe('Validation', () => {
    it('should throw error if return record not found', async () => {
      prisma.transaksiItemReturn.findUnique.mockResolvedValue(null)

      await expect(
        service.resolveLostItem({
          transaksiId: 'txn_123',
          returnRecordId: 'ret_456',
          resolutionType: 'customer_replaced',
        }),
      ).rejects.toThrow('Return record not found')
    })

    it('should throw error if condition is not HILANG', async () => {
      prisma.transaksiItemReturn.findUnique.mockResolvedValue({
        id: 'ret_456',
        conditionCategory: 'RUSAK',
        resolutionStatus: null,
        transaksiItem: {
          kondisiAwal: '85a7a3b8-4e13-45bf-b413-ff24ffdf1af9|M|ADULT|baik',
          produk: { name: 'Gaun Pengantin' },
        },
      } as any)

      await expect(
        service.resolveLostItem({
          transaksiId: 'txn_123',
          returnRecordId: 'ret_456',
          resolutionType: 'customer_replaced',
        }),
      ).rejects.toThrow('Can only resolve HILANG items')
    })

    it('should throw error if already resolved', async () => {
      prisma.transaksiItemReturn.findUnique.mockResolvedValue({
        id: 'ret_456',
        conditionCategory: 'HILANG',
        resolutionStatus: 'resolved_replaced',
        resolutionDate: new Date('2025-12-01'),
        transaksiItem: {
          kondisiAwal: '85a7a3b8-4e13-45bf-b413-ff24ffdf1af9|M|ADULT|baik',
          produk: { name: 'Gaun Pengantin' },
        },
      } as any)

      await expect(
        service.resolveLostItem({
          transaksiId: 'txn_123',
          returnRecordId: 'ret_456',
          resolutionType: 'customer_replaced',
        }),
      ).rejects.toThrow('Item already resolved')
    })

    it('should throw error if product size not found', async () => {
      prisma.transaksiItemReturn.findUnique.mockResolvedValue({
        id: 'ret_456',
        conditionCategory: 'HILANG',
        resolutionStatus: null,
        transaksiItem: {
          kondisiAwal: '85a7a3b8-4e13-45bf-b413-ff24ffdf1af9|M|ADULT|baik',
          produk: { name: 'Gaun Pengantin' },
        },
      } as any)

      prisma.productSize.findUnique.mockResolvedValue(null)

      await expect(
        service.resolveLostItem({
          transaksiId: 'txn_123',
          returnRecordId: 'ret_456',
          resolutionType: 'customer_replaced',
        }),
      ).rejects.toThrow('Product size not found')
    })

    it('should throw error if no rented quantity', async () => {
      prisma.transaksiItemReturn.findUnique.mockResolvedValue({
        id: 'ret_456',
        conditionCategory: 'HILANG',
        resolutionStatus: null,
        transaksiItem: {
          kondisiAwal: '85a7a3b8-4e13-45bf-b413-ff24ffdf1af9|M|ADULT|baik',
          produk: { name: 'Gaun Pengantin' },
        },
      } as any)

      prisma.productSize.findUnique.mockResolvedValue({
        id: '85a7a3b8-4e13-45bf-b413-ff24ffdf1af9',
        rentedQuantity: 0,
        availableQuantity: 10,
        lostQuantity: 0,
      } as any)

      await expect(
        service.resolveLostItem({
          transaksiId: 'txn_123',
          returnRecordId: 'ret_456',
          resolutionType: 'customer_replaced',
        }),
      ).rejects.toThrow('No rented quantity to resolve')
    })
  })

  describe('Customer Replacement Resolution', () => {
    it('should process customer replacement correctly', async () => {
      const mockReturnRecord = {
        id: 'ret_456',
        conditionCategory: 'HILANG',
        resolutionStatus: null,
        penaltyAmount: new Decimal(500000),
        transaksiItem: {
          kondisiAwal: '85a7a3b8-4e13-45bf-b413-ff24ffdf1af9|M|ADULT|baik',
          produk: { name: 'Gaun Pengantin' },
        },
      }

      const mockProductSize = {
        id: '85a7a3b8-4e13-45bf-b413-ff24ffdf1af9',
        rentedQuantity: 3,
        availableQuantity: 7,
        lostQuantity: 0,
      }

      const mockUpdatedStock = {
        rentedQuantity: 2,
        availableQuantity: 8,
        lostQuantity: 0,
      }

      prisma.transaksiItemReturn.findUnique.mockResolvedValue(mockReturnRecord as any)
      prisma.productSize.findUnique.mockResolvedValue(mockProductSize as any)

      // Mock transaction
      prisma.$transaction.mockImplementation(async (callback: any) => {
        const txMock = {
          pembayaran: { create: jest.fn() },
          transaksiItemReturn: { update: jest.fn() },
          productSize: {
            findUnique: jest.fn().mockResolvedValue(mockUpdatedStock),
          },
        }
        return await callback(txMock)
      })

      const result = await service.resolveLostItem({
        transaksiId: 'txn_123',
        returnRecordId: 'ret_456',
        resolutionType: 'customer_replaced',
        notes: 'Customer membeli gaun baru',
      })

      expect(result.success).toBe(true)
      expect(result.resolutionType).toBe('customer_replaced')
      expect(result.refundAmount).toBe(500000)
      expect(result.stockUpdates.rentedQuantity).toBe(2)
      expect(result.stockUpdates.availableQuantity).toBe(8)
      expect(result.stockUpdates.lostQuantity).toBe(0)
      expect(result.message).toContain('Rp 500.000')
    })
  })

  describe('Deposit Retention Resolution', () => {
    it('should process deposit retention correctly', async () => {
      const mockReturnRecord = {
        id: 'ret_456',
        conditionCategory: 'HILANG',
        resolutionStatus: null,
        penaltyAmount: new Decimal(500000),
        transaksiItem: {
          kondisiAwal: '85a7a3b8-4e13-45bf-b413-ff24ffdf1af9|M|ADULT|baik',
          produk: { name: 'Gaun Pengantin' },
        },
      }

      const mockProductSize = {
        id: '85a7a3b8-4e13-45bf-b413-ff24ffdf1af9',
        rentedQuantity: 3,
        availableQuantity: 7,
        lostQuantity: 0,
      }

      const mockUpdatedStock = {
        rentedQuantity: 2,
        availableQuantity: 7,
        lostQuantity: 1,
      }

      prisma.transaksiItemReturn.findUnique.mockResolvedValue(mockReturnRecord as any)
      prisma.productSize.findUnique.mockResolvedValue(mockProductSize as any)

      // Mock transaction
      prisma.$transaction.mockImplementation(async (callback: any) => {
        const txMock = {
          productSize: {
            update: jest.fn(),
            findUnique: jest.fn().mockResolvedValue(mockUpdatedStock),
          },
          transaksiItemReturn: { update: jest.fn() },
        }
        return await callback(txMock)
      })

      const result = await service.resolveLostItem({
        transaksiId: 'txn_123',
        returnRecordId: 'ret_456',
        resolutionType: 'deposit_kept',
        notes: 'Customer tidak bisa mengganti',
      })

      expect(result.success).toBe(true)
      expect(result.resolutionType).toBe('deposit_kept')
      expect(result.refundAmount).toBeUndefined()
      expect(result.stockUpdates.rentedQuantity).toBe(2)
      expect(result.stockUpdates.availableQuantity).toBe(7)
      expect(result.stockUpdates.lostQuantity).toBe(1)
      expect(result.message).toContain('Dana jaminan ditahan')
    })
  })

  describe('Error Handling', () => {
    it('should handle transaction failures', async () => {
      const mockReturnRecord = {
        id: 'ret_456',
        conditionCategory: 'HILANG',
        resolutionStatus: null,
        penaltyAmount: new Decimal(500000),
        transaksiItem: {
          kondisiAwal: '85a7a3b8-4e13-45bf-b413-ff24ffdf1af9|M|ADULT|baik',
          produk: { name: 'Gaun Pengantin' },
        },
      }

      const mockProductSize = {
        id: '85a7a3b8-4e13-45bf-b413-ff24ffdf1af9',
        rentedQuantity: 3,
        availableQuantity: 7,
        lostQuantity: 0,
      }

      prisma.transaksiItemReturn.findUnique.mockResolvedValue(mockReturnRecord as any)
      prisma.productSize.findUnique.mockResolvedValue(mockProductSize as any)

      // Mock transaction failure
      prisma.$transaction.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        service.resolveLostItem({
          transaksiId: 'txn_123',
          returnRecordId: 'ret_456',
          resolutionType: 'customer_replaced',
        }),
      ).rejects.toThrow('Gagal menyelesaikan barang hilang')
    })

    it('should throw error for invalid resolution type', async () => {
      const mockReturnRecord = {
        id: 'ret_456',
        conditionCategory: 'HILANG',
        resolutionStatus: null,
        penaltyAmount: new Decimal(500000),
        transaksiItem: {
          kondisiAwal: '85a7a3b8-4e13-45bf-b413-ff24ffdf1af9|M|ADULT|baik',
          produk: { name: 'Gaun Pengantin' },
        },
      }

      const mockProductSize = {
        id: '85a7a3b8-4e13-45bf-b413-ff24ffdf1af9',
        rentedQuantity: 3,
        availableQuantity: 7,
        lostQuantity: 0,
      }

      prisma.transaksiItemReturn.findUnique.mockResolvedValue(mockReturnRecord as any)
      prisma.productSize.findUnique.mockResolvedValue(mockProductSize as any)

      // Mock transaction with invalid type
      prisma.$transaction.mockImplementation(async (callback: any) => {
        const txMock = {}
        return await callback(txMock)
      })

      await expect(
        service.resolveLostItem({
          transaksiId: 'txn_123',
          returnRecordId: 'ret_456',
          resolutionType: 'invalid_type' as any,
        }),
      ).rejects.toThrow()
    })
  })
})
