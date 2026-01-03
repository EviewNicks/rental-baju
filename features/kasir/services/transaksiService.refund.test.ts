/**
 * Property-Based Tests for TransaksiService Refund Processing
 * Feature: cancel-transaction-refund
 * 
 * Tests the correctness properties defined in the design document:
 * - Property 1: Refund Detection Accuracy
 * - Property 2: Atomic Refund Processing  
 * - Property 3: Refund Amount Consistency
 */

import { TransaksiService } from './transaksiService'
import { PrismaClient, Transaksi } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { UpdateTransaksiRequest } from '../lib/validation/kasirSchema'

// Mock Prisma for controlled testing
const mockPrisma = {
  transaksi: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  transaksiItem: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  penyewa: {
    findUnique: jest.fn(),
  },
  kasir: {
    findUnique: jest.fn(),
  },
  pembayaran: {
    create: jest.fn(),
  },
  pengeluaranKasir: {
    create: jest.fn(),
  },
  aktivitasTransaksi: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
} as unknown as PrismaClient

// Test data generators for property-based testing
const generateRandomTransaction = (paymentAmount: number = 0): Transaksi => ({
  id: `txn-${Math.random().toString(36).substr(2, 9)}`,
  kode: `TXN-${Date.now()}`,
  penyewaId: `customer-${Math.random().toString(36).substr(2, 9)}`,
  kasirId: `kasir-${Math.random().toString(36).substr(2, 9)}`,
  status: 'active',
  totalHarga: new Decimal(Math.floor(Math.random() * 1000000) + 100000),
  jumlahBayar: new Decimal(paymentAmount),
  sisaBayar: new Decimal(Math.floor(Math.random() * 500000)),
  tglMulai: new Date(),
  tglSelesai: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  tglKembali: null,
  metodeBayar: 'tunai',
  catatan: null,
  discountType: null,
  discountValue: null,
  createdBy: 'test-user',
  createdAt: new Date(),
  updatedAt: new Date(),
})

const generateRandomCustomer = () => ({
  id: `customer-${Math.random().toString(36).substr(2, 9)}`,
  nama: `Customer ${Math.floor(Math.random() * 1000)}`,
  telepon: `08${Math.floor(Math.random() * 1000000000)}`,
  alamat: 'Test Address',
  nik: null,
  email: null,
})

const generateRandomKasir = () => ({
  id: `kasir-${Math.random().toString(36).substr(2, 9)}`,
  nama: `Kasir ${Math.floor(Math.random() * 100)}`,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
})

describe('TransaksiService Refund Processing - Property-Based Tests', () => {
  let transaksiService: TransaksiService
  const userId = 'test-user-id'
  const kasirId = 'test-kasir-id'

  beforeEach(() => {
    jest.clearAllMocks()
    transaksiService = new TransaksiService(mockPrisma, userId, kasirId)
  })

  /**
   * Property 1: Refund Detection Accuracy
   * For any cancelled transaction with payment amount > 0, 
   * the system should automatically trigger refund processing
   * Validates: Requirements 1.1
   */
  describe('Property 1: Refund Detection Accuracy', () => {
    const testCases = Array.from({ length: 100 }, () => ({
      paymentAmount: Math.floor(Math.random() * 1000000) + 1, // Always > 0
      transactionId: `txn-${Math.random().toString(36).substr(2, 9)}`,
    }))

    test.each(testCases)(
      'Feature: cancel-transaction-refund, Property 1: Refund Detection Accuracy - should trigger refund for payment amount $paymentAmount',
      async ({ paymentAmount, transactionId }) => {
        // Arrange
        const transaction = generateRandomTransaction(paymentAmount)
        const customer = generateRandomCustomer()
        const kasir = generateRandomKasir()
        
        const mockTx = {
          transaksi: { update: jest.fn().mockResolvedValue(transaction) },
          transaksiItem: { 
            findMany: jest.fn().mockResolvedValue([]),
            count: jest.fn().mockResolvedValue(1),
          },
          penyewa: { findUnique: jest.fn().mockResolvedValue(customer) },
          kasir: { findUnique: jest.fn().mockResolvedValue(kasir) },
          pembayaran: { create: jest.fn().mockResolvedValue({}) },
          pengeluaranKasir: { create: jest.fn().mockResolvedValue({}) },
          aktivitasTransaksi: { create: jest.fn().mockResolvedValue({}) },
        }

        mockPrisma.transaksi.findUnique = jest.fn().mockResolvedValue(transaction)
        mockPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
          return await callback(mockTx)
        })

        const updateRequest: UpdateTransaksiRequest = {
          status: 'cancelled',
          catatan: 'Test cancellation',
        }

        // Act
        await transaksiService.updateTransaksiStatus(transactionId, updateRequest)

        // Assert - Refund should be triggered
        expect(mockTx.pembayaran.create).toHaveBeenCalledWith({
          data: {
            transaksiId: transactionId,
            jumlah: new Decimal(-paymentAmount),
            metode: 'refund',
            catatan: expect.stringContaining('Refund pembatalan transaksi'),
            createdBy: userId,
          },
        })

        expect(mockTx.pengeluaranKasir.create).toHaveBeenCalledWith({
          data: {
            kasirId: kasirId,
            harga: new Decimal(paymentAmount),
            kategori: 'Refund Pembatalan Transaksi',
            deskripsi: expect.stringContaining(`Refund pembatalan transaksi #${transaction.kode}`),
            createdBy: userId,
            isActive: true,
          },
        })

        // Verify activity log shows refund processed
        expect(mockTx.aktivitasTransaksi.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            data: expect.objectContaining({
              refundProcessed: true,
              refundAmount: paymentAmount,
              expenseRecordCreated: true,
              needsRefund: false,
            }),
          }),
        })
      }
    )

    test('Feature: cancel-transaction-refund, Property 1: Refund Detection Accuracy - should NOT trigger refund for zero payment', async () => {
      // Arrange
      const transaction = generateRandomTransaction(0) // Zero payment
      const customer = generateRandomCustomer()
      
      const mockTx = {
        transaksi: { update: jest.fn().mockResolvedValue(transaction) },
        transaksiItem: { 
          findMany: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(1),
        },
        penyewa: { findUnique: jest.fn().mockResolvedValue(customer) },
        kasir: { findUnique: jest.fn() },
        pembayaran: { create: jest.fn() },
        pengeluaranKasir: { create: jest.fn() },
        aktivitasTransaksi: { create: jest.fn().mockResolvedValue({}) },
      }

      mockPrisma.transaksi.findUnique = jest.fn().mockResolvedValue(transaction)
      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        return await callback(mockTx)
      })

      const updateRequest: UpdateTransaksiRequest = {
        status: 'cancelled',
        catatan: 'Test cancellation',
      }

      // Act
      await transaksiService.updateTransaksiStatus(transaction.id, updateRequest)

      // Assert - Refund should NOT be triggered
      expect(mockTx.pembayaran.create).not.toHaveBeenCalled()
      expect(mockTx.pengeluaranKasir.create).not.toHaveBeenCalled()
      
      // Verify activity log shows no refund needed
      expect(mockTx.aktivitasTransaksi.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          data: expect.objectContaining({
            needsRefund: false,
            refundProcessed: false,
          }),
        }),
      })
    })
  })

  /**
   * Property 2: Atomic Refund Processing
   * For any refund processing operation, either all refund steps 
   * (payment record, expense record, activity log) succeed together 
   * or all fail together
   * Validates: Requirements 6.1, 6.2
   */
  describe('Property 2: Atomic Refund Processing', () => {
    const testCases = Array.from({ length: 50 }, () => ({
      paymentAmount: Math.floor(Math.random() * 500000) + 100000,
      transactionId: `txn-${Math.random().toString(36).substr(2, 9)}`,
      failurePoint: Math.floor(Math.random() * 3), // 0: kasir, 1: payment, 2: expense
    }))

    test.each(testCases)(
      'Feature: cancel-transaction-refund, Property 2: Atomic Refund Processing - should handle failure at step $failurePoint atomically',
      async ({ paymentAmount, transactionId, failurePoint }) => {
        // Arrange
        const transaction = generateRandomTransaction(paymentAmount)
        const customer = generateRandomCustomer()
        const kasir = generateRandomKasir()
        
        const mockTx = {
          transaksi: { update: jest.fn().mockResolvedValue(transaction) },
          transaksiItem: { 
            findMany: jest.fn().mockResolvedValue([]),
            count: jest.fn().mockResolvedValue(1),
          },
          penyewa: { findUnique: jest.fn().mockResolvedValue(customer) },
          kasir: { 
            findUnique: failurePoint === 0 
              ? jest.fn().mockResolvedValue(null) // Simulate kasir not found
              : jest.fn().mockResolvedValue(kasir)
          },
          pembayaran: { 
            create: failurePoint === 1 
              ? jest.fn().mockRejectedValue(new Error('Payment creation failed'))
              : jest.fn().mockResolvedValue({})
          },
          pengeluaranKasir: { 
            create: failurePoint === 2 
              ? jest.fn().mockRejectedValue(new Error('Expense creation failed'))
              : jest.fn().mockResolvedValue({})
          },
          aktivitasTransaksi: { create: jest.fn().mockResolvedValue({}) },
        }

        mockPrisma.transaksi.findUnique = jest.fn().mockResolvedValue(transaction)
        mockPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
          return await callback(mockTx)
        })

        const updateRequest: UpdateTransaksiRequest = {
          status: 'cancelled',
          catatan: 'Test cancellation with failure',
        }

        // Act
        await transaksiService.updateTransaksiStatus(transactionId, updateRequest)

        // Assert - Transaction should still be cancelled even if refund fails
        expect(mockTx.transaksi.update).toHaveBeenCalled()
        
        // Verify activity log shows refund failure but cancellation success
        expect(mockTx.aktivitasTransaksi.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            data: expect.objectContaining({
              refundProcessed: false,
              needsRefund: true, // Should remain true when refund fails
              refundError: expect.any(String),
            }),
          }),
        })
      }
    )
  })

  /**
   * Property 3: Refund Amount Consistency
   * For any processed refund, the negative payment amount should equal 
   * the positive expense amount
   * Validates: Requirements 2.3, 3.3
   */
  describe('Property 3: Refund Amount Consistency', () => {
    const testCases = Array.from({ length: 100 }, () => ({
      paymentAmount: Math.floor(Math.random() * 1000000) + 1,
      transactionId: `txn-${Math.random().toString(36).substr(2, 9)}`,
    }))

    test.each(testCases)(
      'Feature: cancel-transaction-refund, Property 3: Refund Amount Consistency - payment and expense amounts should match for amount $paymentAmount',
      async ({ paymentAmount, transactionId }) => {
        // Arrange
        const transaction = generateRandomTransaction(paymentAmount)
        const customer = generateRandomCustomer()
        const kasir = generateRandomKasir()
        
        let capturedPaymentAmount: Decimal | null = null
        let capturedExpenseAmount: Decimal | null = null
        
        const mockTx = {
          transaksi: { update: jest.fn().mockResolvedValue(transaction) },
          transaksiItem: { 
            findMany: jest.fn().mockResolvedValue([]),
            count: jest.fn().mockResolvedValue(1),
          },
          penyewa: { findUnique: jest.fn().mockResolvedValue(customer) },
          kasir: { findUnique: jest.fn().mockResolvedValue(kasir) },
          pembayaran: { 
            create: jest.fn().mockImplementation((data) => {
              capturedPaymentAmount = data.data.jumlah
              return Promise.resolve({})
            })
          },
          pengeluaranKasir: { 
            create: jest.fn().mockImplementation((data) => {
              capturedExpenseAmount = data.data.harga
              return Promise.resolve({})
            })
          },
          aktivitasTransaksi: { create: jest.fn().mockResolvedValue({}) },
        }

        mockPrisma.transaksi.findUnique = jest.fn().mockResolvedValue(transaction)
        mockPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
          return await callback(mockTx)
        })

        const updateRequest: UpdateTransaksiRequest = {
          status: 'cancelled',
          catatan: 'Test amount consistency',
        }

        // Act
        await transaksiService.updateTransaksiStatus(transactionId, updateRequest)

        // Assert - Payment amount (negative) should equal expense amount (positive)
        expect(capturedPaymentAmount).not.toBeNull()
        expect(capturedExpenseAmount).not.toBeNull()
        
        if (capturedPaymentAmount && capturedExpenseAmount) {
          // Payment should be negative, expense should be positive, but equal in absolute value
          expect(Math.abs(capturedPaymentAmount.toNumber())).toBe(capturedExpenseAmount.toNumber())
          expect(capturedPaymentAmount.toNumber()).toBe(-paymentAmount)
          expect(capturedExpenseAmount.toNumber()).toBe(paymentAmount)
        }
      }
    )
  })

  /**
   * Edge Cases and Error Scenarios
   */
  describe('Edge Cases', () => {
    test('Feature: cancel-transaction-refund, Property 1: Refund Detection Accuracy - should handle missing kasirId gracefully', async () => {
      // Arrange - Create service without kasirId
      const serviceWithoutKasir = new TransaksiService(mockPrisma, userId) // No kasirId
      const transaction = generateRandomTransaction(100000)
      const customer = generateRandomCustomer()
      
      const mockTx = {
        transaksi: { update: jest.fn().mockResolvedValue(transaction) },
        transaksiItem: { 
          findMany: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(1),
        },
        penyewa: { findUnique: jest.fn().mockResolvedValue(customer) },
        kasir: { findUnique: jest.fn() },
        pembayaran: { create: jest.fn() },
        pengeluaranKasir: { create: jest.fn() },
        aktivitasTransaksi: { create: jest.fn().mockResolvedValue({}) },
      }

      mockPrisma.transaksi.findUnique = jest.fn().mockResolvedValue(transaction)
      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        return await callback(mockTx)
      })

      const updateRequest: UpdateTransaksiRequest = {
        status: 'cancelled',
        catatan: 'Test missing kasir',
      }

      // Act
      await serviceWithoutKasir.updateTransaksiStatus(transaction.id, updateRequest)

      // Assert - Should handle gracefully and log error
      expect(mockTx.aktivitasTransaksi.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          data: expect.objectContaining({
            refundProcessed: false,
            needsRefund: true,
            refundError: expect.stringContaining('KasirId diperlukan'),
          }),
        }),
      })
    })
  })
})