/**
 * PickupService Test Suite - TSK-22
 * Comprehensive testing for error handling scenarios
 */

import { PrismaClient } from '@prisma/client'
import { PickupService } from './pickupService'
import { PickupItemRequest } from '../lib/validation/kasirSchema'

// Mock Prisma client
const mockPrisma = {
  transaksi: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  transaksiItem: {
    update: jest.fn(),
  },
  aktivitasTransaksi: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
} as any

describe('PickupService', () => {
  let pickupService: PickupService
  const mockUserId = 'test-user-123'

  beforeEach(() => {
    jest.clearAllMocks()
    pickupService = new PickupService(mockPrisma, mockUserId)
  })

  describe('validatePickupRequest', () => {
    const validTransactionId = 'valid-transaction-id'
    const validItems: PickupItemRequest[] = [
      { id: 'item-1', jumlahDiambil: 2 }
    ]

    it('should validate successfully for valid request', async () => {
      // Arrange
      mockPrisma.transaksi.findUnique.mockResolvedValue({
        id: validTransactionId,
        status: 'active',
        kode: 'TXN-001',
        items: [
          { id: 'item-1', jumlah: 5, jumlahDiambil: 0, produk: { id: 'prod-1', name: 'Test Product', code: 'TP001' } }
        ]
      })

      // Act
      const result = await pickupService.validatePickupRequest(validTransactionId, validItems)

      // Assert
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return error for non-existent transaction', async () => {
      // Arrange
      mockPrisma.transaksi.findUnique.mockResolvedValue(null)

      // Act
      const result = await pickupService.validatePickupRequest('invalid-id', validItems)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Transaksi tidak ditemukan')
    })

    it('should handle database connection errors', async () => {
      // Arrange
      mockPrisma.transaksi.findUnique.mockRejectedValue(new Error('Database connection timeout'))

      // Act
      const result = await pickupService.validatePickupRequest(validTransactionId, validItems)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('Database connection error')
    })

    it('should handle unexpected errors gracefully', async () => {
      // Arrange
      mockPrisma.transaksi.findUnique.mockRejectedValue(new Error('Unexpected database error'))

      // Act
      const result = await pickupService.validatePickupRequest(validTransactionId, validItems)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('Validasi error: Unexpected database error')
    })
  })

  describe('processPickup', () => {
    const validTransactionId = 'valid-transaction-id'
    const validItems: PickupItemRequest[] = [
      { id: 'item-1', jumlahDiambil: 2 }
    ]

    it('should process pickup successfully', async () => {
      // Arrange
      const mockTransaction = {
        id: validTransactionId,
        kode: 'TXN-001',
        items: [
          { id: 'item-1', jumlah: 5, jumlahDiambil: 0, produk: { id: 'prod-1', name: 'Test Product', code: 'TP001' } }
        ],
        penyewa: { id: 'customer-1', nama: 'Test Customer', telepon: '08123456789', alamat: 'Test Address' },
        pembayaran: [],
        aktivitas: []
      }

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma)
      })
      mockPrisma.transaksiItem.update.mockResolvedValue({})
      mockPrisma.aktivitasTransaksi.create.mockResolvedValue({})
      mockPrisma.transaksi.findUnique.mockResolvedValue(mockTransaction)

      // Act
      const result = await pickupService.processPickup(validTransactionId, validItems)

      // Assert
      expect(result.success).toBe(true)
      expect(result.message).toContain('Berhasil memproses pickup 2 item')
      expect(result.transaction).toBeDefined()
    })

    it('should handle database connection errors', async () => {
      // Arrange
      mockPrisma.$transaction.mockRejectedValue(new Error('Database connection lost'))

      // Act & Assert
      await expect(pickupService.processPickup(validTransactionId, validItems))
        .rejects.toThrow('Database connection error. Silakan coba lagi beberapa saat.')
    })

    it('should handle constraint violation errors', async () => {
      // Arrange
      mockPrisma.$transaction.mockRejectedValue(new Error('Unique constraint violated'))

      // Act & Assert
      await expect(pickupService.processPickup(validTransactionId, validItems))
        .rejects.toThrow('Data conflict detected. Item mungkin telah diambil oleh proses lain.')
    })

    it('should handle transaction rollback errors', async () => {
      // Arrange
      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction rollback due to conflict'))

      // Act & Assert
      await expect(pickupService.processPickup(validTransactionId, validItems))
        .rejects.toThrow('Transaksi gagal diproses. Silakan coba lagi.')
    })

    it('should handle permission errors', async () => {
      // Arrange
      mockPrisma.$transaction.mockRejectedValue(new Error('User does not have permission'))

      // Act & Assert
      await expect(pickupService.processPickup(validTransactionId, validItems))
        .rejects.toThrow('Anda tidak memiliki izin untuk melakukan pickup pada transaksi ini.')
    })

    it('should handle item not found errors', async () => {
      // Arrange
      mockPrisma.$transaction.mockRejectedValue(new Error('Transaksi item tidak ditemukan'))

      // Act & Assert
      await expect(pickupService.processPickup(validTransactionId, validItems))
        .rejects.toThrow('Item transaksi tidak ditemukan. Transaksi mungkin telah diubah.')
    })

    it('should handle generic errors with specific message', async () => {
      // Arrange
      mockPrisma.$transaction.mockRejectedValue(new Error('Custom business logic error'))

      // Act & Assert
      await expect(pickupService.processPickup(validTransactionId, validItems))
        .rejects.toThrow('Gagal memproses pickup: Custom business logic error')
    })

    it('should handle unknown error types', async () => {
      // Arrange
      mockPrisma.$transaction.mockRejectedValue('String error')

      // Act & Assert
      await expect(pickupService.processPickup(validTransactionId, validItems))
        .rejects.toThrow('Gagal memproses pickup karena kesalahan sistem yang tidak diketahui.')
    })
  })

  describe('updateTransactionPickupStatus', () => {
    const validTransactionId = 'valid-transaction-id'

    it('should update status successfully', async () => {
      // Arrange
      mockPrisma.transaksi.findUnique.mockResolvedValue({
        id: validTransactionId,
        items: [
          { id: 'item-1', jumlah: 5, jumlahDiambil: 2 }
        ]
      })
      mockPrisma.aktivitasTransaksi.create.mockResolvedValue({})

      // Act
      await expect(pickupService.updateTransactionPickupStatus(validTransactionId))
        .resolves.not.toThrow()

      // Assert
      expect(mockPrisma.aktivitasTransaksi.create).toHaveBeenCalled()
    })

    it('should handle errors gracefully without throwing', async () => {
      // Arrange
      mockPrisma.transaksi.findUnique.mockRejectedValue(new Error('Database error'))

      // Act & Assert - Should not throw
      await expect(pickupService.updateTransactionPickupStatus(validTransactionId))
        .resolves.not.toThrow()
    })
  })

  describe('getPickupSummary', () => {
    const validTransactionId = 'valid-transaction-id'

    it('should return pickup summary', async () => {
      // Arrange
      mockPrisma.transaksi.findUnique.mockResolvedValue({
        id: validTransactionId,
        items: [
          {
            id: 'item-1',
            jumlah: 5,
            jumlahDiambil: 2,
            produk: { id: 'prod-1', name: 'Test Product', code: 'TP001' }
          }
        ]
      })

      // Act
      const result = await pickupService.getPickupSummary(validTransactionId)

      // Assert
      expect(result).not.toBeNull()
      expect(result?.totalItems).toBe(1)
      expect(result?.totalQuantity).toBe(5)
      expect(result?.pickedUpQuantity).toBe(2)
      expect(result?.remainingQuantity).toBe(3)
      expect(result?.pickupPercentage).toBe(40)
    })

    it('should return null for non-existent transaction', async () => {
      // Arrange
      mockPrisma.transaksi.findUnique.mockResolvedValue(null)

      // Act
      const result = await pickupService.getPickupSummary(validTransactionId)

      // Assert
      expect(result).toBeNull()
    })

    it('should handle errors gracefully', async () => {
      // Arrange
      mockPrisma.transaksi.findUnique.mockRejectedValue(new Error('Database error'))

      // Act
      const result = await pickupService.getPickupSummary(validTransactionId)

      // Assert
      expect(result).toBeNull()
    })
  })
})

describe('PickupService Error Logging', () => {
  let pickupService: PickupService
  const mockUserId = 'test-user-123'
  let consoleSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    pickupService = new PickupService(mockPrisma, mockUserId)
    consoleSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('should log validation errors with context', async () => {
    // Arrange
    mockPrisma.transaksi.findUnique.mockRejectedValue(new Error('Connection timeout'))

    // Act
    await pickupService.validatePickupRequest('test-id', [{ id: 'item-1', jumlahDiambil: 1 }])

    // Assert
    expect(consoleSpy).toHaveBeenCalledWith('Pickup validation failed:', {
      error: 'Connection timeout',
      transactionId: 'test-id',
      itemCount: 1,
      userId: mockUserId,
      timestamp: expect.any(String)
    })
  })

  it('should log processing errors with detailed context', async () => {
    // Arrange
    mockPrisma.$transaction.mockRejectedValue(new Error('Database connection lost'))

    // Act & Assert
    try {
      await pickupService.processPickup('test-id', [{ id: 'item-1', jumlahDiambil: 1 }])
    } catch (error) {
      // Expected to throw
    }

    // Assert
    expect(consoleSpy).toHaveBeenCalledWith('Pickup processing failed:', {
      transactionId: 'test-id',
      items: [{ id: 'item-1', jumlahDiambil: 1 }],
      userId: mockUserId,
      timestamp: expect.any(String),
      error: {
        message: 'Database connection lost',
        stack: expect.any(String),
        name: 'Error'
      }
    })
  })
})

describe('PickupService Factory Function', () => {
  it('should create PickupService instance', () => {
    // Act
    const service = createPickupService(mockPrisma, mockUserId)

    // Assert
    expect(service).toBeInstanceOf(PickupService)
  })
})