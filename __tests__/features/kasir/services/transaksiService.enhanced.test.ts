/**
 * Enhanced TransaksiService Unit Tests
 * Tests for discount system and duration packages functionality
 * 
 * Focus: Testing the enhanced createTransaksiSizeAware method with discount support
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { TransaksiService } from '@/features/kasir/services/transaksiService'
import { PriceCalculator } from '@/features/kasir/lib/utils/priceCalculator'
import { DateCalculator } from '@/features/kasir/lib/utils/dateCalculator'
// import { createInventoryService } from '@/features/kasir/services/inventoryService'

// Mock Prisma Client
const mockPrisma = {
  penyewa: {
    findUnique: jest.fn(),
  },
  productSize: {
    findMany: jest.fn(),
    findUnique: jest.fn(), // Add for inventory service
    update: jest.fn(), // Add for inventory service
  },
  transaksi: {
    create: jest.fn(),
    findFirst: jest.fn(), // For TransactionCodeGenerator
    findUnique: jest.fn(), // For TransactionCodeGenerator uniqueness check
  },
  transaksiItem: {
    createMany: jest.fn(),
    findMany: jest.fn(),
  },
  pembayaran: {
    findMany: jest.fn(),
  },
  aktivitasTransaksi: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
} as unknown as PrismaClient

// Mock InventoryService
const mockInventoryService = {
  checkAvailability: jest.fn().mockResolvedValue(true),
  getStockStatus: jest.fn().mockResolvedValue({
    originalQuantity: 10,
    availableQuantity: 8,
    rentedQuantity: 2,
    isAvailable: true,
    utilizationRate: 20,
  }),
  updateStockOnCreate: jest.fn().mockResolvedValue(undefined),
  updateStockOnReturn: jest.fn().mockResolvedValue(undefined),
}

jest.mock('@/features/kasir/services/inventoryService', () => ({
  createInventoryService: jest.fn(() => mockInventoryService),
}))

// Mock AvailabilityService for date-aware validation
const mockAvailabilityService = {
  checkDateRangeAvailability: jest.fn().mockResolvedValue({
    available: true,
    conflicts: [],
  }),
  getOverlappingTransactions: jest.fn().mockResolvedValue([]),
  checkRentalAvailability: jest.fn().mockResolvedValue({
    available: true,
    conflicts: [],
  }),
}

jest.mock('@/features/kasir/services/availabilityService', () => ({
  createAvailabilityService: jest.fn(() => mockAvailabilityService),
  AvailabilityService: jest.fn().mockImplementation(() => mockAvailabilityService),
}))

// Mock PriceCalculator and DateCalculator
jest.mock('@/features/kasir/lib/utils/priceCalculator', () => ({
  PriceCalculator: {
    calculateTransactionTotalWithEnhancements: jest.fn(),
  },
}))

jest.mock('@/features/kasir/lib/utils/dateCalculator', () => ({
  DateCalculator: {
    calculateReturnDate: jest.fn(),
  },
}))

// Mock data
const mockPenyewa = {
  id: 'penyewa-123',
  nama: 'John Doe',
  telepon: '08123456789',
  alamat: 'Jl. Test No. 123',
  nik: '1234567890123456',
  email: 'john@example.com',
}

const mockProductSize = {
  id: 'size-123',
  size: 'M',
  ageCategory: 'ADULT',
  isActive: true,
  product: {
    id: 'product-123',
    name: 'Test Product',
    currentPrice: new Decimal(50000), // Rp 50,000 per day
  },
}

const mockKasir = {
  id: 'kasir-123',
  nama: 'Jane Kasir',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('TransaksiService Enhanced Tests', () => {
  let transaksiService: TransaksiService
  const userId = 'user-123'

  beforeEach(() => {
    jest.clearAllMocks()
    transaksiService = new TransaksiService(mockPrisma, userId)
    
    // Reset inventory service mocks
    mockInventoryService.checkAvailability.mockResolvedValue(true)
    mockInventoryService.getStockStatus.mockResolvedValue({
      originalQuantity: 10,
      availableQuantity: 8,
      rentedQuantity: 2,
      isAvailable: true,
      utilizationRate: 20,
    })
  })

  describe('createTransaksiSizeAware with Discount System', () => {
    const baseTransactionData = {
      penyewaId: 'penyewa-123',
      kasirId: 'kasir-123',
      items: [
        {
          produkId: 'product-123',
          productSizeId: 'size-123',
          jumlah: 2,
          durasi: 4 as 4 | 7,
          kondisiAwal: 'Baik',
        },
      ],
      tglMulai: '2024-12-21T00:00:00.000Z',
      metodeBayar: 'tunai' as const,
      catatan: 'Test transaction',
    }

    beforeEach(() => {
      // Setup common mocks
      mockPrisma.penyewa.findUnique = jest.fn().mockResolvedValue(mockPenyewa)
      mockPrisma.productSize.findMany = jest.fn().mockResolvedValue([mockProductSize])
      
      // Mock ProductSize.findUnique for inventory service
      mockPrisma.productSize.findUnique = jest.fn().mockResolvedValue({
        id: 'size-123',
        size: 'M',
        ageCategory: 'ADULT',
        isActive: true,
        originalQuantity: 10,
        availableQuantity: 8,
        rentedQuantity: 2,
        lostQuantity: 0,
      })
      
      // Mock ProductSize.update for inventory service
      mockPrisma.productSize.update = jest.fn().mockResolvedValue({
        id: 'size-123',
        size: 'M',
        ageCategory: 'ADULT',
        isActive: true,
        originalQuantity: 10,
        availableQuantity: 6, // After renting 2 items
        rentedQuantity: 4,
        lostQuantity: 0,
      })
      
      // Mock TransactionCodeGenerator
      mockPrisma.transaksi.findFirst = jest.fn().mockResolvedValue(null) // No existing transactions
      
      // Setup default PriceCalculator mock
      jest.spyOn(PriceCalculator, 'calculateTransactionTotalWithEnhancements').mockReturnValue({
        subtotal: new Decimal(100000),
        discountAmount: new Decimal(0),
        finalTotal: new Decimal(100000),
        duration: 4 as 4 | 7,
        durationMultiplier: 1.0,
        itemCalculations: [
          {
            produkId: 'product-123',
            productSizeId: 'size-123',
            jumlah: 2,
            durasi: 4 as 4 | 7,
            basePrice: new Decimal(100000),
            adjustedPrice: new Decimal(100000),
          },
        ],
      })
      
      // Setup default DateCalculator mock
      jest.spyOn(DateCalculator, 'calculateReturnDate').mockReturnValue('2024-12-24')
      
      // Mock transaction creation
      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          penyewa: {
            findUnique: jest.fn().mockResolvedValue(mockPenyewa),
          },
          productSize: {
            findMany: jest.fn().mockResolvedValue([mockProductSize]),
            findUnique: jest.fn().mockResolvedValue({
              id: 'size-123',
              size: 'M',
              ageCategory: 'ADULT',
              isActive: true,
              originalQuantity: 10,
              availableQuantity: 8,
              rentedQuantity: 2,
              lostQuantity: 0,
            }),
            update: jest.fn().mockResolvedValue({
              id: 'size-123',
              size: 'M',
              ageCategory: 'ADULT',
              isActive: true,
              originalQuantity: 10,
              availableQuantity: 6,
              rentedQuantity: 4,
              lostQuantity: 0,
            }),
          },
          transaksi: {
            create: jest.fn().mockResolvedValue({
              id: 'transaction-123',
              kode: 'TXN-20241221-001',
              ...baseTransactionData,
              totalHarga: new Decimal(100000),
              jumlahBayar: new Decimal(0),
              sisaBayar: new Decimal(100000),
              tglSelesai: new Date('2024-12-24T00:00:00.000Z'),
              discountType: null,
              discountValue: null,
              createdBy: userId,
              createdAt: new Date(),
              updatedAt: new Date(),
              penyewa: mockPenyewa,
              kasir: mockKasir,
            }),
          },
          transaksiItem: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
            findMany: jest.fn().mockResolvedValue([
              {
                id: 'item-123',
                produkId: 'product-123',
                jumlah: 2,
                hargaSewa: new Decimal(50000),
                durasi: 4,
                subtotal: new Decimal(100000),
                kondisiAwal: 'size-123|M|ADULT|Baik',
                produk: {
                  id: 'product-123',
                  code: 'PRD-001',
                  name: 'Test Product',
                  modalAwal: new Decimal(100000),
                  imageUrl: null,
                  size: 'M',
                  category: { id: 'cat-1', name: 'Category 1' },
                },
                returnConditions: [],
              },
            ]),
          },
          pembayaran: {
            findMany: jest.fn().mockResolvedValue([]),
          },
          aktivitasTransaksi: {
            findMany: jest.fn().mockResolvedValue([]),
            create: jest.fn().mockResolvedValue({}),
          },
        }
        
        return callback(mockTx)
      })

      mockPrisma.pembayaran.findMany = jest.fn().mockResolvedValue([])
      mockPrisma.aktivitasTransaksi.findMany = jest.fn().mockResolvedValue([])
      mockPrisma.aktivitasTransaksi.create = jest.fn().mockResolvedValue({})
    })

    it('should create transaction without discount (4-day package)', async () => {
      const transactionData = {
        ...baseTransactionData,
        discountType: null,
        discountValue: null,
      }

      const result = await transaksiService.createTransaksiSizeAware(transactionData)

      expect(result).toBeDefined()
      expect(result.kode).toBe('TXN-20241221-001')
      expect(result.discountType).toBeNull()
      expect(result.discountValue).toBeNull()
      expect(Number(result.totalHarga)).toBe(100000) // 2 items × Rp 50,000 × 1.0 multiplier
    })

    it('should create transaction with 10% discount (4-day package)', async () => {
      const transactionData = {
        ...baseTransactionData,
        discountType: 'percent' as const,
        discountValue: 10,
      }

      // Mock enhanced price calculation
      const mockPriceCalculation = {
        subtotal: new Decimal(100000),
        discountAmount: new Decimal(10000), // 10% of 100,000
        finalTotal: new Decimal(90000),
        duration: 4 as 4 | 7,
        durationMultiplier: 1.0,
        itemCalculations: [
          {
            produkId: 'product-123',
            productSizeId: 'size-123',
            jumlah: 2,
            durasi: 4 as 4 | 7,
            basePrice: new Decimal(100000),
            adjustedPrice: new Decimal(100000), // 2 × 50,000 × 1.0
          },
        ],
      }

      jest.spyOn(PriceCalculator, 'calculateTransactionTotalWithEnhancements')
        .mockReturnValue(mockPriceCalculation)

      // Update transaction mock to include discount
      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          transaksi: {
            create: jest.fn().mockResolvedValue({
              id: 'transaction-123',
              kode: 'TXN-20241221-001',
              ...transactionData,
              totalHarga: new Decimal(90000), // After 10% discount
              discountType: 'percent',
              discountValue: new Decimal(10),
              penyewa: mockPenyewa,
              kasir: mockKasir,
            }),
          },
          transaksiItem: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
            findMany: jest.fn().mockResolvedValue([]),
          },
        }
        return callback(mockTx)
      })

      const result = await transaksiService.createTransaksiSizeAware(transactionData)

      expect(result.discountType).toBe('percent')
      expect(Number(result.discountValue)).toBe(10)
      expect(Number(result.totalHarga)).toBe(90000) // After discount
    })

    it('should create transaction with nominal discount (7-day package)', async () => {
      const transactionData = {
        ...baseTransactionData,
        items: [
          {
            ...baseTransactionData.items[0],
            durasi: 7 as 4 | 7, // 7-day package
          },
        ],
        discountType: 'nominal' as const,
        discountValue: 25000, // Rp 25,000 discount
      }

      // Mock enhanced price calculation for 7-day package
      const mockPriceCalculation = {
        subtotal: new Decimal(150000), // 2 × 50,000 × 1.5 multiplier
        discountAmount: new Decimal(25000),
        finalTotal: new Decimal(125000),
        duration: 7 as 4 | 7,
        durationMultiplier: 1.5,
        itemCalculations: [
          {
            produkId: 'product-123',
            productSizeId: 'size-123',
            jumlah: 2,
            durasi: 7 as 4 | 7,
            basePrice: new Decimal(100000),
            adjustedPrice: new Decimal(150000), // 2 × 50,000 × 1.5
          },
        ],
      }

      jest.spyOn(PriceCalculator, 'calculateTransactionTotalWithEnhancements')
        .mockReturnValue(mockPriceCalculation)

      // Mock date calculation for 7-day package
      jest.spyOn(DateCalculator, 'calculateReturnDate')
        .mockReturnValue('2024-12-27') // 21 + 7 - 1 = 27

      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          transaksi: {
            create: jest.fn().mockResolvedValue({
              id: 'transaction-123',
              kode: 'TXN-20241221-001',
              ...transactionData,
              totalHarga: new Decimal(125000),
              discountType: 'nominal',
              discountValue: new Decimal(25000),
              tglSelesai: new Date('2024-12-27T00:00:00.000Z'),
              penyewa: mockPenyewa,
              kasir: mockKasir,
            }),
          },
          transaksiItem: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
            findMany: jest.fn().mockResolvedValue([]),
          },
        }
        return callback(mockTx)
      })

      const result = await transaksiService.createTransaksiSizeAware(transactionData)

      expect(result.discountType).toBe('nominal')
      expect(Number(result.discountValue)).toBe(25000)
      expect(Number(result.totalHarga)).toBe(125000)
      expect(result.tglSelesai?.toISOString()).toBe('2024-12-27T00:00:00.000Z')
    })

    it('should validate discount consistency', async () => {
      const invalidData = {
        ...baseTransactionData,
        discountType: 'percent' as const,
        discountValue: null, // Invalid: type without value
      }

      // This should be caught by Zod validation before reaching the service
      // But we test the service behavior if invalid data somehow gets through
      await expect(transaksiService.createTransaksiSizeAware(invalidData))
        .rejects.toThrow()
    })

    it('should handle duration multiplier correctly', async () => {
      // Test 4-day package (1.0x multiplier)
      const data4Day = {
        ...baseTransactionData,
        items: [{ ...baseTransactionData.items[0], durasi: 4 as 4 | 7 }],
      }

      const mockCalc4Day = {
        subtotal: new Decimal(100000),
        discountAmount: new Decimal(0),
        finalTotal: new Decimal(100000),
        duration: 4 as 4 | 7,
        durationMultiplier: 1.0,
        itemCalculations: [
          {
            produkId: 'product-123',
            productSizeId: 'size-123',
            jumlah: 2,
            durasi: 4 as 4 | 7,
            basePrice: new Decimal(100000),
            adjustedPrice: new Decimal(100000),
          },
        ],
      }

      jest.spyOn(PriceCalculator, 'calculateTransactionTotalWithEnhancements')
        .mockReturnValue(mockCalc4Day)

      await transaksiService.createTransaksiSizeAware(data4Day)

      expect(PriceCalculator.calculateTransactionTotalWithEnhancements)
        .toHaveBeenCalledWith(expect.objectContaining({
          duration: 4,
        }))
    })

    it('should calculate return date correctly', async () => {
      const transactionData = {
        ...baseTransactionData,
        items: [{ ...baseTransactionData.items[0], durasi: 7 as 4 | 7 }],
        tglMulai: '2024-12-27T00:00:00.000Z', // Test month boundary
      }

      jest.spyOn(DateCalculator, 'calculateReturnDate')
        .mockReturnValue('2025-01-02') // 27 + 7 - 1 = 33 → 2nd next month

      await transaksiService.createTransaksiSizeAware(transactionData)

      expect(DateCalculator.calculateReturnDate)
        .toHaveBeenCalledWith('2024-12-27T00:00:00.000Z', 7)
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      // Setup TransactionCodeGenerator mock for error tests
      mockPrisma.transaksi.findFirst = jest.fn().mockResolvedValue(null)
    })

    it('should handle penyewa not found', async () => {
      mockPrisma.penyewa.findUnique = jest.fn().mockResolvedValue(null)

      const transactionData = {
        penyewaId: 'invalid-id',
        items: [],
        tglMulai: '2024-12-21T00:00:00.000Z',
      }

      await expect(transaksiService.createTransaksiSizeAware(transactionData))
        .rejects.toThrow('Penyewa tidak ditemukan')
    })

    it('should handle product size not found', async () => {
      mockPrisma.penyewa.findUnique = jest.fn().mockResolvedValue(mockPenyewa)
      mockPrisma.productSize.findMany = jest.fn().mockResolvedValue([]) // No sizes found
      mockPrisma.transaksi.findFirst = jest.fn().mockResolvedValue(null)

      const transactionData = {
        penyewaId: 'penyewa-123',
        items: [
          {
            produkId: 'product-123',
            productSizeId: 'invalid-size',
            jumlah: 1,
            durasi: 4 as 4 | 7,
          },
        ],
        tglMulai: '2024-12-21T00:00:00.000Z',
      }

      // The error should occur during the price calculation phase
      // when trying to find the productSize for price calculation
      await expect(transaksiService.createTransaksiSizeAware(transactionData))
        .rejects.toThrow() // The actual error will be about missing product data
    })

    it('should handle price calculation failure', async () => {
      mockPrisma.penyewa.findUnique = jest.fn().mockResolvedValue(mockPenyewa)
      mockPrisma.productSize.findMany = jest.fn().mockResolvedValue([mockProductSize])

      jest.spyOn(PriceCalculator, 'calculateTransactionTotalWithEnhancements')
        .mockReturnValue(null as unknown as ReturnType<typeof PriceCalculator.calculateTransactionTotalWithEnhancements>) // Simulate calculation failure

      const transactionData = {
        penyewaId: 'penyewa-123',
        items: [
          {
            produkId: 'product-123',
            productSizeId: 'size-123',
            jumlah: 1,
            durasi: 4 as 4 | 7,
          },
        ],
        tglMulai: '2024-12-21T00:00:00.000Z',
      }

      await expect(transaksiService.createTransaksiSizeAware(transactionData))
        .rejects.toThrow('Failed to calculate enhanced transaction pricing')
    })
  })
})