/**
 * Date-Aware Availability Validation Tests - Task 4.1
 * Tests the new date-aware availability checking functionality
 */

import { PrismaClient } from '@prisma/client'
import { AvailabilityService } from '../../../../features/kasir/services/availabilityService'

// Mock Prisma Client
const mockPrisma = {
  transaksiItem: {
    findMany: jest.fn(),
  },
  product: {
    findUnique: jest.fn(),
  },
} as unknown as PrismaClient

// Mock InventoryService
jest.mock('../../../../features/kasir/services/inventoryService', () => ({
  inventoryService: {
    getProductStockStatus: jest.fn(),
  },
}))

describe('AvailabilityService - Date-Aware Functionality', () => {
  let availabilityService: AvailabilityService

  beforeEach(() => {
    availabilityService = new AvailabilityService(mockPrisma)
    jest.clearAllMocks()
  })

  describe('checkDateRangeAvailability', () => {
    it('should detect date range conflicts correctly', async () => {
      // Mock overlapping transactions
      const mockOverlappingTransactions = [
        {
          transaksi: {
            id: 'txn-1',
            kode: 'TXN-001',
            status: 'active',
            tglMulai: new Date('2024-01-01'),
            tglSelesai: new Date('2024-01-05'),
          },
          jumlah: 2,
        },
      ]

      ;(mockPrisma.transaksiItem.findMany as jest.Mock).mockResolvedValue(
        mockOverlappingTransactions
      )

      // Mock inventory service
      const inventoryService = await import('../../../../features/kasir/services/inventoryService')
      jest.spyOn(inventoryService.inventoryService, 'getProductStockStatus').mockResolvedValue({
        totalQuantity: 5,
        availableQuantity: 3,
        rentedQuantity: 2,
      })

      const result = await availabilityService.checkDateRangeAvailability(
        [{ productId: 'product-1', quantity: 4 }],
        new Date('2024-01-03'), // Overlaps with existing booking
        new Date('2024-01-07')
      )

      expect(result.available).toBe(false)
      expect(result.conflicts).toHaveLength(1)
      expect(result.conflicts[0].shortage).toBe(1) // Need 4, only 3 available (5 total - 2 reserved)
      expect(result.conflicts[0].overlappingTransactions).toHaveLength(1)
      expect(result.conflicts[0].overlappingTransactions[0].transactionCode).toBe('TXN-001')
    })

    it('should allow booking when no conflicts exist', async () => {
      // Mock no overlapping transactions
      ;(mockPrisma.transaksiItem.findMany as jest.Mock).mockResolvedValue([])

      // Mock inventory service
      const inventoryService = await import('../../../../features/kasir/services/inventoryService')
      jest.spyOn(inventoryService.inventoryService, 'getProductStockStatus').mockResolvedValue({
        totalQuantity: 5,
        availableQuantity: 5,
        rentedQuantity: 0,
      })

      const result = await availabilityService.checkDateRangeAvailability(
        [{ productId: 'product-1', quantity: 3 }],
        new Date('2024-02-01'),
        new Date('2024-02-05')
      )

      expect(result.available).toBe(true)
      expect(result.conflicts).toHaveLength(0)
    })
  })

  describe('getOverlappingTransactions', () => {
    it('should find transactions that overlap with date range', async () => {
      const mockTransactions = [
        {
          transaksi: {
            id: 'txn-1',
            kode: 'TXN-001',
            status: 'active',
            tglMulai: new Date('2024-01-01'),
            tglSelesai: new Date('2024-01-05'),
          },
          jumlah: 2,
        },
        {
          transaksi: {
            id: 'txn-2',
            kode: 'TXN-002',
            status: 'diambil',
            tglMulai: new Date('2024-01-04'),
            tglSelesai: new Date('2024-01-08'),
          },
          jumlah: 1,
        },
      ]

      ;(mockPrisma.transaksiItem.findMany as jest.Mock).mockResolvedValue(mockTransactions)

      const result = await availabilityService.getOverlappingTransactions(
        'product-1',
        new Date('2024-01-03'),
        new Date('2024-01-06')
      )

      expect(result).toHaveLength(2)
      expect(result[0].transactionCode).toBe('TXN-001')
      expect(result[1].transactionCode).toBe('TXN-002')
      expect(result[0].quantity).toBe(2)
      expect(result[1].quantity).toBe(1)
    })

    it('should handle ongoing rentals (null end date)', async () => {
      const mockTransactions = [
        {
          transaksi: {
            id: 'txn-1',
            kode: 'TXN-001',
            status: 'active',
            tglMulai: new Date('2024-01-01'),
            tglSelesai: null, // Ongoing rental
          },
          jumlah: 1,
        },
      ]

      ;(mockPrisma.transaksiItem.findMany as jest.Mock).mockResolvedValue(mockTransactions)

      const result = await availabilityService.getOverlappingTransactions(
        'product-1',
        new Date('2024-01-15'),
        new Date('2024-01-20')
      )

      expect(result).toHaveLength(1)
      expect(result[0].endDate).toEqual(new Date('2099-12-31')) // Far future date for ongoing
    })
  })

  describe('checkRentalAvailability with date range', () => {
    it('should use date-aware checking when endDate is provided', async () => {
      // Mock the checkDateRangeAvailability method
      const spy = jest.spyOn(availabilityService, 'checkDateRangeAvailability')
      spy.mockResolvedValue({
        available: true,
        conflicts: [],
      })

      await availabilityService.checkRentalAvailability(
        [{ productId: 'product-1', quantity: 2 }],
        new Date('2024-01-01'),
        new Date('2024-01-05') // endDate provided
      )

      expect(spy).toHaveBeenCalledWith(
        [{ productId: 'product-1', quantity: 2 }],
        new Date('2024-01-01'),
        new Date('2024-01-05')
      )

      spy.mockRestore()
    })

    it('should use legacy checking when endDate is not provided', async () => {
      // Mock getProductAvailability for legacy behavior
      const spy = jest.spyOn(availabilityService, 'getProductAvailability')
      spy.mockResolvedValue({
        productId: 'product-1',
        totalStock: 5,
        rentedQuantity: 1,
        availableQuantity: 4,
        activeRentals: [],
      })

      const result = await availabilityService.checkRentalAvailability(
        [{ productId: 'product-1', quantity: 2 }],
        new Date('2024-01-01')
        // No endDate provided
      )

      expect(spy).toHaveBeenCalled()
      expect(result.available).toBe(true)

      spy.mockRestore()
    })
  })
})