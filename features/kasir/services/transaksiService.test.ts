/**
 * Unit Tests for TransaksiService - RPK-26
 * Testing transaction CRUD operations with TDD approach
 * 
 * Coverage:
 * - Create transaksi with auto code generation
 * - Get transaksi by ID and code
 * - Get transaksi list with pagination and filters
 * - Update transaksi status
 * - Price calculation and business logic
 * - Product availability validation
 * - Error handling scenarios
 */

import { TransaksiService } from './transaksiService'
import { PrismaClient } from '@prisma/client'
import { CreateTransaksiRequest, UpdateTransaksiRequest } from '../lib/validation/kasirSchema'

// Mock Decimal to avoid circular dependency issues
const createMockDecimal = (value: number) => ({
  toNumber: () => value,
  toString: () => value.toString(),
  valueOf: () => value
})

// Mock dependencies
jest.mock('./penyewaService')
// Create a mock that we can control per test
const mockValidateTransactionItems = jest.fn()
jest.mock('./availabilityService', () => ({
  createAvailabilityService: jest.fn(() => ({
    validateTransactionItems: mockValidateTransactionItems
  }))
}))
jest.mock('../lib/utils/codeGenerator', () => ({
  TransactionCodeGenerator: jest.fn().mockImplementation(() => ({
    generateTransactionCode: jest.fn().mockResolvedValue('TXN-20250726-001')
  }))
}))
jest.mock('../lib/utils/priceCalculator', () => ({
  PriceCalculator: {
    calculateTransactionTotal: jest.fn().mockReturnValue({
      totalHarga: { toNumber: () => 300000, toString: () => '300000' },
      itemCalculations: [{
        produkId: 'produk-1',
        jumlah: 2,
        durasi: 3,
        hargaSewa: { toNumber: () => 50000, toString: () => '50000' },
        subtotal: { toNumber: () => 300000, toString: () => '300000' }
      }]
    })
  }
}))

const mockPrisma = {
  $transaction: jest.fn(),
  transaksi: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    groupBy: jest.fn()
  },
  transaksiItem: {
    createMany: jest.fn(),
    findMany: jest.fn()
  },
  product: {
    findUnique: jest.fn(),
    findMany: jest.fn()
  },
  produk: {
    findUnique: jest.fn(),
    findMany: jest.fn()
  },
  aktivitasTransaksi: {
    create: jest.fn()
  },
  product: {
    findMany: jest.fn()
  },
  penyewa: {
    findUnique: jest.fn()
  }
} as unknown as jest.Mocked<PrismaClient>

describe('TransaksiService', () => {
  let transaksiService: TransaksiService
  const mockUserId = 'user-123'
  
  beforeEach(() => {
    transaksiService = new TransaksiService(mockPrisma, mockUserId)
    jest.clearAllMocks()
  })

  describe('createTransaksi', () => {
    const validCreateRequest: CreateTransaksiRequest = {
      penyewaId: 'penyewa-1',
      items: [
        {
          produkId: 'produk-1',
          jumlah: 2,
          durasi: 3,
          kondisiAwal: 'Baik'
        }
      ],
      tglMulai: '2025-07-26T00:00:00.000Z',
      tglSelesai: '2025-07-29T00:00:00.000Z',
      metodeBayar: 'tunai',
      catatan: 'Test transaction'
    }

    const mockPenyewa = {
      id: 'penyewa-1',
      nama: 'John Doe',
      telepon: '08123456789',
      alamat: 'Jl. Merdeka No. 123'
    }

    const mockProduct = {
      id: 'produk-1',
      code: 'PRD1',
      name: 'Baju Test',
      hargaSewa: createMockDecimal(50000),
      quantity: 10,
      status: 'AVAILABLE'
    }

    const mockCreatedTransaksi = {
      id: 'transaksi-1',
      kode: 'TXN-20250726-001',
      penyewaId: 'penyewa-1',
      status: 'active',
      totalHarga: createMockDecimal(300000),
      jumlahBayar: createMockDecimal(0),
      sisaBayar: createMockDecimal(300000),
      tglMulai: new Date('2025-07-26T00:00:00.000Z'),
      tglSelesai: new Date('2025-07-29T00:00:00.000Z'),
      tglKembali: null,
      metodeBayar: 'tunai',
      catatan: 'Test transaction',
      createdBy: mockUserId,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    it('should create transaksi successfully with auto-generated code', async () => {
      // Mock dependencies
      mockPrisma.penyewa.findUnique.mockResolvedValue(mockPenyewa as never)
      mockPrisma.product.findMany.mockResolvedValue([mockProduct] as never)
      mockValidateTransactionItems.mockResolvedValue({
        valid: true,
        errors: []
      })
      
      // Mock transaction execution
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma)
      })

      // Mock the transaction creation
      mockPrisma.transaksi.create.mockResolvedValue(mockCreatedTransaksi as never)
      mockPrisma.transaksiItem.createMany.mockResolvedValue({ count: 1 })
      mockPrisma.aktivitasTransaksi.create.mockResolvedValue({} as never)

      const result = await transaksiService.createTransaksi(validCreateRequest)

      expect(mockPrisma.penyewa.findUnique).toHaveBeenCalledWith({
        where: { id: validCreateRequest.penyewaId }
      })
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['produk-1'] },
          isActive: true,
          status: 'AVAILABLE'
        }
      })
      expect(result).toEqual(mockCreatedTransaksi)
    })

    it('should throw error if penyewa not found', async () => {
      mockPrisma.penyewa.findUnique.mockResolvedValue(null)

      await expect(transaksiService.createTransaksi(validCreateRequest))
        .rejects.toThrow('Penyewa tidak ditemukan')
    })

    it('should throw error if product not available', async () => {
      mockPrisma.penyewa.findUnique.mockResolvedValue(mockPenyewa as never)
      mockPrisma.product.findMany.mockResolvedValue([])
      mockValidateTransactionItems.mockResolvedValue({
        valid: false,
        errors: ['Produk dengan ID produk-1 tidak tersedia']
      })

      await expect(transaksiService.createTransaksi(validCreateRequest))
        .rejects.toThrow('Produk dengan ID produk-1 tidak tersedia')
    })

    it('should throw error if insufficient product quantity', async () => {
      const insufficientProduct = {
        ...mockProduct,
        quantity: 1 // Less than requested quantity (2)
      }

      mockPrisma.penyewa.findUnique.mockResolvedValue(mockPenyewa as never)
      mockPrisma.product.findMany.mockResolvedValue([insufficientProduct] as never)
      mockValidateTransactionItems.mockResolvedValue({
        valid: false,
        errors: ['Stok produk Baju Test tidak mencukupi. Tersedia: 1, Diminta: 2']
      })

      await expect(transaksiService.createTransaksi(validCreateRequest))
        .rejects.toThrow('Stok produk Baju Test tidak mencukupi. Tersedia: 1, Diminta: 2')
    })
  })

  describe('getTransaksiById', () => {
    const transaksiId = 'transaksi-1'
    const mockTransaksi = {
      id: transaksiId,
      kode: 'TXN-20250726-001',
      status: 'active',
      totalHarga: createMockDecimal(300000),
      penyewa: {
        id: 'penyewa-1',
        nama: 'John Doe',
        telepon: '08123456789'
      },
      items: [{
        id: 'item-1',
        produk: {
          id: 'produk-1',
          name: 'Baju Test'
        },
        jumlah: 2,
        durasi: 3,
        subtotal: createMockDecimal(300000)
      }],
      pembayaran: [],
      aktivitas: []
    }

    it('should return transaksi by ID', async () => {
      mockPrisma.transaksi.findUnique.mockResolvedValue(mockTransaksi as never)

      const result = await transaksiService.getTransaksiById(transaksiId)

      expect(mockPrisma.transaksi.findUnique).toHaveBeenCalledWith({
        where: { id: transaksiId },
        include: {
          penyewa: {
            select: {
              id: true,
              nama: true,
              telepon: true,
              alamat: true
            }
          },
          items: {
            include: {
              produk: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  imageUrl: true
                }
              }
            }
          },
          pembayaran: {
            orderBy: { createdAt: 'desc' }
          },
          aktivitas: {
            orderBy: { createdAt: 'desc' }
          }
        }
      })
      expect(result).toEqual(mockTransaksi)
    })

    it('should throw error if transaksi not found', async () => {
      mockPrisma.transaksi.findUnique.mockResolvedValue(null)

      await expect(transaksiService.getTransaksiById(transaksiId))
        .rejects.toThrow('Transaksi tidak ditemukan')
    })
  })

  describe('getTransaksiByCode', () => {
    const kodeTransaksi = 'TXN-20250726-001'

    it('should return transaksi by code', async () => {
      const mockTransaksi = { id: 'transaksi-1', kode: kodeTransaksi }
      mockPrisma.transaksi.findUnique.mockResolvedValue(mockTransaksi as never)

      const result = await transaksiService.getTransaksiByCode(kodeTransaksi)

      expect(mockPrisma.transaksi.findUnique).toHaveBeenCalledWith({
        where: { kode: kodeTransaksi },
        include: expect.any(Object)
      })
      expect(result).toEqual(mockTransaksi)
    })
  })

  describe('getTransaksiList', () => {
    const mockTransaksiList = [
      {
        id: 'transaksi-1',
        kode: 'TXN-20250726-001',
        status: 'active',
        totalHarga: createMockDecimal(300000),
        penyewa: { nama: 'John Doe' },
        createdAt: new Date()
      },
      {
        id: 'transaksi-2',
        kode: 'TXN-20250726-002',
        status: 'selesai',
        totalHarga: createMockDecimal(150000),
        penyewa: { nama: 'Jane Smith' },
        createdAt: new Date()
      }
    ]

    it('should return paginated transaksi list', async () => {
      const queryParams = { page: 1, limit: 10 }
      
      mockPrisma.transaksi.findMany.mockResolvedValue(mockTransaksiList as never)
      mockPrisma.transaksi.count.mockResolvedValue(2)
      mockPrisma.transaksi.groupBy.mockResolvedValue([
        { status: 'active', _count: { status: 1 } },
        { status: 'selesai', _count: { status: 1 } }
      ] as never)

      const result = await transaksiService.getTransaksiList(queryParams)

      expect(mockPrisma.transaksi.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        where: undefined,
        include: expect.any(Object)
      })
      expect(result.data).toEqual(mockTransaksiList)
      expect(result.pagination.total).toBe(2)
    })

    it('should filter by status', async () => {
      const queryParams = { page: 1, limit: 10, status: 'active' as const }
      
      mockPrisma.transaksi.findMany.mockResolvedValue([mockTransaksiList[0]] as never)
      mockPrisma.transaksi.count.mockResolvedValue(1)
      mockPrisma.transaksi.groupBy.mockResolvedValue([
        { status: 'active', _count: { status: 1 } }
      ] as never)

      await transaksiService.getTransaksiList(queryParams)

      expect(mockPrisma.transaksi.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        where: { status: 'active' },
        include: expect.any(Object)
      })
    })

    it('should search by code or penyewa name', async () => {
      const queryParams = { page: 1, limit: 10, search: 'TXN-001' }
      
      mockPrisma.transaksi.findMany.mockResolvedValue([mockTransaksiList[0]] as never)
      mockPrisma.transaksi.count.mockResolvedValue(1)
      mockPrisma.transaksi.groupBy.mockResolvedValue([
        { status: 'active', _count: { status: 1 } }
      ] as never)

      await transaksiService.getTransaksiList(queryParams)

      expect(mockPrisma.transaksi.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        where: {
          OR: [
            { kode: { contains: 'TXN-001', mode: 'insensitive' } },
            { penyewa: { nama: { contains: 'TXN-001', mode: 'insensitive' } } },
            { penyewa: { telepon: { contains: 'TXN-001', mode: 'insensitive' } } }
          ]
        },
        include: expect.any(Object)
      })
    })
  })

  describe('updateTransaksiStatus', () => {
    const transaksiId = 'transaksi-1'
    const updateRequest: UpdateTransaksiRequest = {
      status: 'selesai',
      tglKembali: '2025-07-29T10:00:00.000Z',
      catatan: 'Returned in good condition'
    }

    const mockExistingTransaksi = {
      id: transaksiId,
      status: 'active',
      kode: 'TXN-20250726-001'
    }

    it('should update transaksi status successfully', async () => {
      const mockUpdatedTransaksi = {
        ...mockExistingTransaksi,
        ...updateRequest,
        updatedAt: new Date()
      }

      mockPrisma.transaksi.findUnique.mockResolvedValue(mockExistingTransaksi as never)
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma)
      })
      mockPrisma.transaksi.update.mockResolvedValue(mockUpdatedTransaksi as never)
      mockPrisma.aktivitasTransaksi.create.mockResolvedValue({} as never)

      const result = await transaksiService.updateTransaksiStatus(transaksiId, updateRequest)

      expect(mockPrisma.transaksi.findUnique).toHaveBeenCalledWith({
        where: { id: transaksiId }
      })
      expect(result).toEqual(mockUpdatedTransaksi)
    })

    it('should throw error if transaksi not found', async () => {
      mockPrisma.transaksi.findUnique.mockResolvedValue(null)

      await expect(transaksiService.updateTransaksiStatus(transaksiId, updateRequest))
        .rejects.toThrow('Transaksi tidak ditemukan')
    })

    it('should validate status transitions', async () => {
      const completedTransaksi = {
        ...mockExistingTransaksi,
        status: 'selesai'
      }

      mockPrisma.transaksi.findUnique.mockResolvedValue(completedTransaksi as never)

      await expect(transaksiService.updateTransaksiStatus(transaksiId, { status: 'active' }))
        .rejects.toThrow('Tidak dapat mengubah status dari selesai ke active')
    })
  })

  describe('getTransaksiStats', () => {
    it('should return transaction statistics', async () => {
      const mockStats = [
        { status: 'active', _count: { status: 5 } },
        { status: 'selesai', _count: { status: 10 } },
        { status: 'terlambat', _count: { status: 2 } },
        { status: 'cancelled', _count: { status: 1 } }
      ]

      mockPrisma.transaksi.groupBy.mockResolvedValue(mockStats as never)

      const result = await transaksiService.getTransaksiStats()

      expect(result).toEqual({
        totalActive: 5,
        totalSelesai: 10,
        totalTerlambat: 2,
        totalCancelled: 1
      })
    })
  })
})