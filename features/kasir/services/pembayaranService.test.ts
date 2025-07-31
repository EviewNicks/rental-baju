/**
 * Unit Tests for PembayaranService - RPK-26
 * Testing payment CRUD operations with TDD approach
 * 
 * Coverage:
 * - Create payment with transaction validation
 * - Payment amount validation and business rules
 * - Get payments by transaction and individual payment
 * - Payment summary calculations
 * - Payment listing with pagination and filters
 * - Payment cancellation/reversal
 * - Payment statistics and reporting
 * - Error handling scenarios
 * - Audit logging integration
 */

import { PembayaranService } from './pembayaranService'
import { PrismaClient } from '@prisma/client'
import { CreatePembayaranRequest } from '../lib/validation/kasirSchema'

// Mock Decimal to avoid circular dependency issues
const createMockDecimal = (value: number) => {
  const mockDecimal = {
    toNumber: () => value,
    toString: () => value.toString(),
    valueOf: () => value,
    add: (other: number | { toNumber: () => number }) => {
      const otherValue = typeof other === 'number' ? other : 
                        (other && typeof other.toNumber === 'function') ? other.toNumber() : 
                        Number(other)
      return createMockDecimal(value + otherValue)
    },
    sub: (other: number | { toNumber: () => number }) => {
      const otherValue = typeof other === 'number' ? other : 
                        (other && typeof other.toNumber === 'function') ? other.toNumber() : 
                        Number(other)
      return createMockDecimal(value - otherValue)
    },
    div: (other: number | { toNumber: () => number }) => {
      const otherValue = typeof other === 'number' ? other : 
                        (other && typeof other.toNumber === 'function') ? other.toNumber() : 
                        Number(other)
      return createMockDecimal(value / otherValue)
    }
  }
  return mockDecimal
}

// Mock Decimal constructor
jest.mock('@prisma/client/runtime/library', () => ({
  Decimal: jest.fn().mockImplementation((value) => createMockDecimal(Number(value)))
}))

// Mock dependencies
jest.mock('./auditService', () => ({
  createAuditService: jest.fn(() => ({
    logPembayaranActivity: jest.fn().mockResolvedValue(undefined)
  }))
}))

jest.mock('../lib/utils/priceCalculator', () => ({
  PriceCalculator: {
    validatePaymentAmount: jest.fn(),
    calculateRemainingPayment: jest.fn(),
    calculatePaymentPercentage: jest.fn(),
    isFullyPaid: jest.fn(),
    formatToRupiah: jest.fn((amount) => `Rp ${amount.toLocaleString('id-ID')}`)
  }
}))

// Mock Prisma Client
const mockPrisma = {
  $transaction: jest.fn(),
  transaksi: {
    findUnique: jest.fn(),
    update: jest.fn()
  },
  pembayaran: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    delete: jest.fn()
  },
  aktivitasTransaksi: {
    create: jest.fn()
  }
} as unknown as jest.Mocked<PrismaClient>

// Import mocked modules
import { PriceCalculator } from '../lib/utils/priceCalculator'

describe('PembayaranService', () => {
  let pembayaranService: PembayaranService
  const mockUserId = 'user-123'
  const mockUserRole = 'kasir'

  beforeEach(() => {
    jest.clearAllMocks()
    pembayaranService = new PembayaranService(mockPrisma, mockUserId, mockUserRole)
  })

  describe('createPembayaran', () => {
    const validCreateRequest: CreatePembayaranRequest = {
      transaksiId: 'transaksi-1',
      jumlah: 100000,
      metode: 'tunai',
      referensi: 'REF-001',
      catatan: 'Pembayaran pertama'
    }

    const mockTransaksi = {
      id: 'transaksi-1',
      kode: 'TXN-001',
      status: 'active',
      totalHarga: createMockDecimal(300000),
      jumlahBayar: createMockDecimal(0),
      sisaBayar: createMockDecimal(300000),
      penyewa: {
        nama: 'John Doe',
        telepon: '08123456789'
      }
    }

    const mockCreatedPembayaran = {
      id: 'pembayaran-1',
      transaksiId: 'transaksi-1',
      jumlah: createMockDecimal(100000),
      metode: 'tunai',
      referensi: 'REF-001',
      catatan: 'Pembayaran pertama',
      createdBy: mockUserId,
      createdAt: new Date(),
      transaksi: {
        id: 'transaksi-1',
        kode: 'TXN-001',
        penyewa: {
          nama: 'John Doe',
          telepon: '08123456789'
        },
        totalHarga: createMockDecimal(300000),
        jumlahBayar: createMockDecimal(100000),
        sisaBayar: createMockDecimal(200000),
        status: 'active'
      }
    }

    it('should create payment successfully', async () => {
      // Mock transaction lookup
      mockPrisma.transaksi.findUnique.mockResolvedValue(mockTransaksi as never)

      // Mock payment validation
      PriceCalculator.validatePaymentAmount.mockReturnValue({
        isValid: true,
        error: null
      })

      // Mock price calculations
      PriceCalculator.calculateRemainingPayment.mockReturnValue(createMockDecimal(200000))

      // Mock database transaction
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma)
      })

      mockPrisma.pembayaran.create.mockResolvedValue({
        id: 'pembayaran-1',
        transaksiId: 'transaksi-1',
        jumlah: createMockDecimal(100000),
        metode: 'tunai',
        referensi: 'REF-001',
        catatan: 'Pembayaran pertama',
        createdBy: mockUserId
      })

      mockPrisma.transaksi.update.mockResolvedValue({} as never)
      mockPrisma.aktivitasTransaksi.create.mockResolvedValue({} as never)
      mockPrisma.pembayaran.findUnique.mockResolvedValue(mockCreatedPembayaran as never)

      const result = await pembayaranService.createPembayaran(validCreateRequest)

      expect(mockPrisma.transaksi.findUnique).toHaveBeenCalledWith({
        where: { id: validCreateRequest.transaksiId },
        include: {
          penyewa: {
            select: { nama: true, telepon: true }
          }
        }
      })

      expect(PriceCalculator.validatePaymentAmount).toHaveBeenCalledWith(
        validCreateRequest.jumlah,
        mockTransaksi.totalHarga,
        mockTransaksi.jumlahBayar
      )

      expect(result).toEqual(mockCreatedPembayaran)
    })

    it('should throw error if transaction not found', async () => {
      mockPrisma.transaksi.findUnique.mockResolvedValue(null)

      await expect(pembayaranService.createPembayaran(validCreateRequest))
        .rejects.toThrow('Transaksi tidak ditemukan')
    })

    it('should throw error if transaction is cancelled', async () => {
      const cancelledTransaksi = {
        ...mockTransaksi,
        status: 'cancelled'
      }

      mockPrisma.transaksi.findUnique.mockResolvedValue(cancelledTransaksi as never)

      await expect(pembayaranService.createPembayaran(validCreateRequest))
        .rejects.toThrow('Tidak dapat menambahkan pembayaran ke transaksi yang dibatalkan')
    })

    it('should throw error if transaction is completed', async () => {
      const completedTransaksi = {
        ...mockTransaksi,
        status: 'selesai'
      }

      mockPrisma.transaksi.findUnique.mockResolvedValue(completedTransaksi as never)

      await expect(pembayaranService.createPembayaran(validCreateRequest))
        .rejects.toThrow('Transaksi sudah selesai, tidak dapat menambahkan pembayaran')
    })

    it('should throw error if payment amount is invalid', async () => {
      mockPrisma.transaksi.findUnique.mockResolvedValue(mockTransaksi as never)

      PriceCalculator.validatePaymentAmount.mockReturnValue({
        isValid: false,
        error: 'Jumlah pembayaran melebihi sisa tagihan'
      })

      await expect(pembayaranService.createPembayaran(validCreateRequest))
        .rejects.toThrow('Jumlah pembayaran melebihi sisa tagihan')
    })

    it('should handle overpayment validation', async () => {
      const overpaymentRequest = {
        ...validCreateRequest,
        jumlah: 400000 // More than total transaction amount
      }

      mockPrisma.transaksi.findUnique.mockResolvedValue(mockTransaksi as never)

      PriceCalculator.validatePaymentAmount.mockReturnValue({
        isValid: false,
        error: 'Jumlah pembayaran tidak boleh melebihi total tagihan'
      })

      await expect(pembayaranService.createPembayaran(overpaymentRequest))
        .rejects.toThrow('Jumlah pembayaran tidak boleh melebihi total tagihan')
    })
  })

  describe('getTransactionPayments', () => {
    it('should return payments for a transaction', async () => {
      const transaksiId = 'transaksi-1'
      const mockPayments = [
        {
          id: 'pembayaran-1',
          transaksiId,
          jumlah: createMockDecimal(100000),
          metode: 'tunai',
          createdAt: new Date('2025-07-25T10:00:00.000Z'),
          transaksi: {
            id: transaksiId,
            kode: 'TXN-001',
            penyewa: { nama: 'John Doe', telepon: '08123456789' },
            totalHarga: createMockDecimal(300000),
            jumlahBayar: createMockDecimal(100000),
            sisaBayar: createMockDecimal(200000),
            status: 'active'
          }
        },
        {
          id: 'pembayaran-2',
          transaksiId,
          jumlah: createMockDecimal(50000),
          metode: 'transfer',
          createdAt: new Date('2025-07-25T11:00:00.000Z'),
          transaksi: {
            id: transaksiId,
            kode: 'TXN-001',
            penyewa: { nama: 'John Doe', telepon: '08123456789' },
            totalHarga: createMockDecimal(300000),
            jumlahBayar: createMockDecimal(150000),
            sisaBayar: createMockDecimal(150000),
            status: 'active'
          }
        }
      ]

      mockPrisma.pembayaran.findMany.mockResolvedValue(mockPayments as never)

      const result = await pembayaranService.getTransactionPayments(transaksiId)

      expect(mockPrisma.pembayaran.findMany).toHaveBeenCalledWith({
        where: { transaksiId },
        include: {
          transaksi: {
            select: {
              id: true,
              kode: true,
              penyewa: {
                select: { nama: true, telepon: true }
              },
              totalHarga: true,
              jumlahBayar: true,
              sisaBayar: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      expect(result).toEqual(mockPayments)
      expect(result).toHaveLength(2)
    })
  })

  describe('getPembayaranById', () => {
    it('should return payment by ID', async () => {
      const paymentId = 'pembayaran-1'
      const mockPayment = {
        id: paymentId,
        transaksiId: 'transaksi-1',
        jumlah: createMockDecimal(100000),
        metode: 'tunai',
        transaksi: {
          id: 'transaksi-1',
          kode: 'TXN-001',
          penyewa: { nama: 'John Doe', telepon: '08123456789' },
          totalHarga: createMockDecimal(300000),
          jumlahBayar: createMockDecimal(100000),
          sisaBayar: createMockDecimal(200000),
          status: 'active'
        }
      }

      mockPrisma.pembayaran.findUnique.mockResolvedValue(mockPayment as never)

      const result = await pembayaranService.getPembayaranById(paymentId)

      expect(mockPrisma.pembayaran.findUnique).toHaveBeenCalledWith({
        where: { id: paymentId },
        include: {
          transaksi: {
            select: {
              id: true,
              kode: true,
              penyewa: {
                select: { nama: true, telepon: true }
              },
              totalHarga: true,
              jumlahBayar: true,
              sisaBayar: true,
              status: true
            }
          }
        }
      })

      expect(result).toEqual(mockPayment)
    })

    it('should throw error if payment not found', async () => {
      mockPrisma.pembayaran.findUnique.mockResolvedValue(null)

      await expect(pembayaranService.getPembayaranById('nonexistent'))
        .rejects.toThrow('Pembayaran tidak ditemukan')
    })
  })

  describe('getPaymentSummary', () => {
    it('should return payment summary for transaction', async () => {
      const transaksiId = 'transaksi-1'

      // Mock transaction data
      mockPrisma.transaksi.findUnique.mockResolvedValue({
        totalHarga: createMockDecimal(300000),
        jumlahBayar: createMockDecimal(150000),
        sisaBayar: createMockDecimal(150000)
      })

      // Mock last payment date
      mockPrisma.pembayaran.findMany.mockResolvedValue([{
        createdAt: new Date('2025-07-25T10:00:00.000Z')
      }])

      // Mock payment count
      mockPrisma.pembayaran.count.mockResolvedValue(2)

      // Mock price calculator functions
      PriceCalculator.calculatePaymentPercentage.mockReturnValue(50)
      PriceCalculator.isFullyPaid.mockReturnValue(false)

      const result = await pembayaranService.getPaymentSummary(transaksiId)

      expect(result.totalPaid.toNumber()).toBe(150000)
      expect(result.remainingAmount.toNumber()).toBe(150000)
      expect(result.paymentPercentage).toBe(50)
      expect(result.isFullyPaid).toBe(false)
      expect(result.paymentCount).toBe(2)
      expect(result.lastPaymentDate).toEqual(new Date('2025-07-25T10:00:00.000Z'))
    })

    it('should throw error if transaction not found for summary', async () => {
      mockPrisma.transaksi.findUnique.mockResolvedValue(null)

      await expect(pembayaranService.getPaymentSummary('nonexistent'))
        .rejects.toThrow('Transaksi tidak ditemukan')
    })

    it('should handle transaction with no payments', async () => {
      const transaksiId = 'transaksi-1'

      mockPrisma.transaksi.findUnique.mockResolvedValue({
        totalHarga: createMockDecimal(300000),
        jumlahBayar: createMockDecimal(0),
        sisaBayar: createMockDecimal(300000)
      })

      mockPrisma.pembayaran.findMany.mockResolvedValue([])
      mockPrisma.pembayaran.count.mockResolvedValue(0)

      PriceCalculator.calculatePaymentPercentage.mockReturnValue(0)
      PriceCalculator.isFullyPaid.mockReturnValue(false)

      const result = await pembayaranService.getPaymentSummary(transaksiId)

      expect(result.paymentCount).toBe(0)
      expect(result.lastPaymentDate).toBeUndefined()
      expect(result.paymentPercentage).toBe(0)
    })
  })

  describe('getPaymentList', () => {
    it('should return paginated payment list', async () => {
      const mockPayments = [
        {
          id: 'pembayaran-1',
          transaksiId: 'transaksi-1',
          jumlah: createMockDecimal(100000),
          metode: 'tunai',
          createdAt: new Date(),
          transaksi: {
            id: 'transaksi-1',
            kode: 'TXN-001',
            penyewa: { nama: 'John Doe', telepon: '08123456789' },
            totalHarga: createMockDecimal(300000),
            jumlahBayar: createMockDecimal(100000),
            sisaBayar: createMockDecimal(200000),
            status: 'active'
          }
        }
      ]

      mockPrisma.pembayaran.findMany.mockResolvedValue(mockPayments as never)
      mockPrisma.pembayaran.count.mockResolvedValue(1)

      const result = await pembayaranService.getPaymentList({ page: 1, limit: 10 })

      expect(result.data).toEqual(mockPayments)
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1
      })
    })

    it('should filter payments by transaction ID', async () => {
      const params = { page: 1, limit: 10, transaksiId: 'transaksi-1' }

      mockPrisma.pembayaran.findMany.mockResolvedValue([])
      mockPrisma.pembayaran.count.mockResolvedValue(0)

      await pembayaranService.getPaymentList(params)

      expect(mockPrisma.pembayaran.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: { transaksiId: 'transaksi-1' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should filter payments by method', async () => {
      const params = { page: 1, limit: 10, metode: 'tunai' }

      mockPrisma.pembayaran.findMany.mockResolvedValue([])
      mockPrisma.pembayaran.count.mockResolvedValue(0)

      await pembayaranService.getPaymentList(params)

      expect(mockPrisma.pembayaran.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: { metode: 'tunai' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should filter payments by date range', async () => {
      const startDate = new Date('2025-07-01')
      const endDate = new Date('2025-07-31')
      const params = { page: 1, limit: 10, startDate, endDate }

      mockPrisma.pembayaran.findMany.mockResolvedValue([])
      mockPrisma.pembayaran.count.mockResolvedValue(0)

      await pembayaranService.getPaymentList(params)

      expect(mockPrisma.pembayaran.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      })
    })
  })

  describe('cancelPayment', () => {
    const mockPayment = {
      id: 'pembayaran-1',
      transaksiId: 'transaksi-1',
      jumlah: createMockDecimal(100000),
      metode: 'tunai',
      transaksi: {
        id: 'transaksi-1',
        kode: 'TXN-001',
        status: 'active',
        totalHarga: createMockDecimal(300000),
        jumlahBayar: createMockDecimal(100000),
        sisaBayar: createMockDecimal(200000)
      }
    }

    it('should cancel payment successfully', async () => {
      mockPrisma.pembayaran.findUnique.mockResolvedValue(mockPayment as never)

      PriceCalculator.calculateRemainingPayment.mockReturnValue(createMockDecimal(300000))

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma)
      })

      mockPrisma.transaksi.update.mockResolvedValue({} as never)
      mockPrisma.pembayaran.delete.mockResolvedValue({} as never)
      mockPrisma.aktivitasTransaksi.create.mockResolvedValue({} as never)

      await pembayaranService.cancelPayment('pembayaran-1', 'Customer request')

      expect(mockPrisma.pembayaran.findUnique).toHaveBeenCalledWith({
        where: { id: 'pembayaran-1' },
        include: { transaksi: true }
      })

      expect(mockPrisma.pembayaran.delete).toHaveBeenCalledWith({
        where: { id: 'pembayaran-1' }
      })
    })

    it('should throw error if payment not found for cancellation', async () => {
      mockPrisma.pembayaran.findUnique.mockResolvedValue(null)

      await expect(pembayaranService.cancelPayment('nonexistent', 'reason'))
        .rejects.toThrow('Pembayaran tidak ditemukan')
    })

    it('should throw error if transaction is already cancelled', async () => {
      const cancelledPayment = {
        ...mockPayment,
        transaksi: {
          ...mockPayment.transaksi,
          status: 'cancelled'
        }
      }

      mockPrisma.pembayaran.findUnique.mockResolvedValue(cancelledPayment as never)

      await expect(pembayaranService.cancelPayment('pembayaran-1', 'reason'))
        .rejects.toThrow('Tidak dapat membatalkan pembayaran dari transaksi yang sudah dibatalkan')
    })
  })

  describe('getPaymentStats', () => {
    it('should return payment statistics', async () => {
      const mockPayments = [
        { jumlah: createMockDecimal(100000), metode: 'tunai' },
        { jumlah: createMockDecimal(150000), metode: 'transfer' },
        { jumlah: createMockDecimal(75000), metode: 'tunai' },
        { jumlah: createMockDecimal(200000), metode: 'transfer' }
      ]

      mockPrisma.pembayaran.findMany.mockResolvedValue(mockPayments as never)

      const result = await pembayaranService.getPaymentStats()

      expect(result.totalPayments).toBe(4)
      expect(result.totalAmount.toNumber()).toBe(525000) // 100k + 150k + 75k + 200k
      expect(result.paymentsByMethod.tunai.count).toBe(2)
      expect(result.paymentsByMethod.tunai.amount.toNumber()).toBe(175000)
      expect(result.paymentsByMethod.transfer.count).toBe(2)
      expect(result.paymentsByMethod.transfer.amount.toNumber()).toBe(350000)
      expect(result.averagePaymentAmount.toNumber()).toBe(131250) // 525000 / 4
    })

    it('should filter statistics by date range', async () => {
      const startDate = new Date('2025-07-01')
      const endDate = new Date('2025-07-31')

      mockPrisma.pembayaran.findMany.mockResolvedValue([])

      await pembayaranService.getPaymentStats(startDate, endDate)

      expect(mockPrisma.pembayaran.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          jumlah: true,
          metode: true
        }
      })
    })

    it('should handle empty payment data', async () => {
      mockPrisma.pembayaran.findMany.mockResolvedValue([])

      const result = await pembayaranService.getPaymentStats()

      expect(result.totalPayments).toBe(0)
      expect(result.totalAmount.toNumber()).toBe(0)
      expect(result.paymentsByMethod).toEqual({})
      expect(result.averagePaymentAmount.toNumber()).toBe(0)
    })

    it('should aggregate payments by method correctly', async () => {
      const mockPayments = [
        { jumlah: createMockDecimal(100000), metode: 'tunai' },
        { jumlah: createMockDecimal(50000), metode: 'tunai' },
        { jumlah: createMockDecimal(200000), metode: 'transfer' }
      ]

      mockPrisma.pembayaran.findMany.mockResolvedValue(mockPayments as never)

      const result = await pembayaranService.getPaymentStats()

      expect(result.paymentsByMethod.tunai).toEqual({
        count: 2,
        amount: expect.objectContaining({
          toNumber: expect.any(Function)
        })
      })
      expect(result.paymentsByMethod.tunai.amount.toNumber()).toBe(150000)

      expect(result.paymentsByMethod.transfer).toEqual({
        count: 1,
        amount: expect.objectContaining({
          toNumber: expect.any(Function)
        })
      })
      expect(result.paymentsByMethod.transfer.amount.toNumber()).toBe(200000)
    })
  })
})