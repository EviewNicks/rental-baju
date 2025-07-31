/**
 * Unit Tests for PenyewaService - RPK-26
 * Testing customer CRUD operations with TDD approach
 * 
 * Coverage:
 * - Create penyewa with validation
 * - Get penyewa by ID
 * - Get penyewa list with pagination and search
 * - Update penyewa data
 * - Phone number uniqueness validation
 * - Error handling scenarios
 */

import { PenyewaService } from './penyewaService'
import { PrismaClient } from '@prisma/client'
import { CreatePenyewaRequest, UpdatePenyewaRequest } from '../lib/validation/kasirSchema'

// Mock Prisma Client
jest.mock('@prisma/client')
const mockPrisma = {
  penyewa: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
} as unknown as jest.Mocked<PrismaClient>

describe('PenyewaService', () => {
  let penyewaService: PenyewaService
  const mockUserId = 'user-123'
  
  beforeEach(() => {
    penyewaService = new PenyewaService(mockPrisma, mockUserId)
    jest.clearAllMocks()
  })

  describe('createPenyewa', () => {
    const validCreateRequest: CreatePenyewaRequest = {
      nama: 'John Doe',
      telepon: '08123456789',
      alamat: 'Jl. Merdeka No. 123, Jakarta',
      email: 'john@example.com',
      nik: '1234567890123456'
    }

    it('should create penyewa successfully', async () => {
      const mockCreatedPenyewa = {
        id: 'penyewa-1',
        ...validCreateRequest,
        foto: null,
        catatan: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.penyewa.findUnique.mockResolvedValue(null) // Phone not exists
      mockPrisma.penyewa.create.mockResolvedValue(mockCreatedPenyewa)

      const result = await penyewaService.createPenyewa(validCreateRequest)

      expect(mockPrisma.penyewa.findUnique).toHaveBeenCalledWith({
        where: { telepon: validCreateRequest.telepon }
      })
      expect(mockPrisma.penyewa.create).toHaveBeenCalledWith({
        data: {
          nama: validCreateRequest.nama,
          telepon: validCreateRequest.telepon,
          alamat: validCreateRequest.alamat,
          email: validCreateRequest.email,
          nik: validCreateRequest.nik,
          foto: null,
          catatan: null
        }
      })
      expect(result).toEqual(mockCreatedPenyewa)
    })

    it('should throw error if phone number already exists', async () => {
      const existingPenyewa = {
        id: 'existing-penyewa',
        telepon: validCreateRequest.telepon
      }

      mockPrisma.penyewa.findUnique.mockResolvedValue(existingPenyewa as never)

      await expect(penyewaService.createPenyewa(validCreateRequest))
        .rejects.toThrow('Nomor telepon sudah terdaftar')
    })

    it('should handle database errors', async () => {
      mockPrisma.penyewa.findUnique.mockResolvedValue(null)
      mockPrisma.penyewa.create.mockRejectedValue(new Error('Database error'))

      await expect(penyewaService.createPenyewa(validCreateRequest))
        .rejects.toThrow('Database error')
    })
  })

  describe('getPenyewaById', () => {
    const penyewaId = 'penyewa-1'
    const mockPenyewa = {
      id: penyewaId,
      nama: 'John Doe',
      telepon: '08123456789',
      alamat: 'Jl. Merdeka No. 123',
      email: 'john@example.com',
      nik: '1234567890123456',
      foto: null,
      catatan: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    it('should return penyewa by ID', async () => {
      mockPrisma.penyewa.findUnique.mockResolvedValue(mockPenyewa)

      const result = await penyewaService.getPenyewaById(penyewaId)

      expect(mockPrisma.penyewa.findUnique).toHaveBeenCalledWith({
        where: { id: penyewaId },
        include: {
          transaksi: {
            select: {
              id: true,
              kode: true,
              status: true,
              totalHarga: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      })
      expect(result).toEqual(mockPenyewa)
    })

    it('should throw error if penyewa not found', async () => {
      mockPrisma.penyewa.findUnique.mockResolvedValue(null)

      await expect(penyewaService.getPenyewaById(penyewaId))
        .rejects.toThrow('Penyewa tidak ditemukan')
    })
  })

  describe('getPenyewaList', () => {
    const mockPenyewaList = [
      {
        id: 'penyewa-1',
        nama: 'John Doe',
        telepon: '08123456789',
        alamat: 'Jl. Merdeka No. 123',
        email: 'john@example.com',
        nik: null,
        foto: null,
        catatan: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'penyewa-2',
        nama: 'Jane Smith',
        telepon: '08987654321',
        alamat: 'Jl. Sudirman No. 456',
        email: null,
        nik: null,
        foto: null,
        catatan: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    it('should return paginated penyewa list', async () => {
      const queryParams = { page: 1, limit: 10 }
      
      mockPrisma.penyewa.findMany.mockResolvedValue(mockPenyewaList)
      mockPrisma.penyewa.count.mockResolvedValue(2)

      const result = await penyewaService.getPenyewaList(queryParams)

      expect(mockPrisma.penyewa.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        where: undefined
      })
      expect(mockPrisma.penyewa.count).toHaveBeenCalledWith({
        where: undefined
      })
      expect(result).toEqual({
        data: mockPenyewaList,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1
        }
      })
    })

    it('should search penyewa by name or phone', async () => {
      const queryParams = { page: 1, limit: 10, search: 'John' }
      
      mockPrisma.penyewa.findMany.mockResolvedValue([mockPenyewaList[0]])
      mockPrisma.penyewa.count.mockResolvedValue(1)

      await penyewaService.getPenyewaList(queryParams)

      expect(mockPrisma.penyewa.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        where: {
          OR: [
            { nama: { contains: 'John', mode: 'insensitive' } },
            { telepon: { contains: 'John', mode: 'insensitive' } }
          ]
        }
      })
    })

    it('should handle empty results', async () => {
      const queryParams = { page: 1, limit: 10 }
      
      mockPrisma.penyewa.findMany.mockResolvedValue([])
      mockPrisma.penyewa.count.mockResolvedValue(0)

      const result = await penyewaService.getPenyewaList(queryParams)

      expect(result).toEqual({
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      })
    })
  })

  describe('updatePenyewa', () => {
    const penyewaId = 'penyewa-1'
    const updateRequest: UpdatePenyewaRequest = {
      nama: 'John Doe Updated',
      alamat: 'Jl. New Address No. 789'
    }

    const mockExistingPenyewa = {
      id: penyewaId,
      nama: 'John Doe',
      telepon: '08123456789',
      alamat: 'Jl. Old Address',
      email: 'john@example.com',
      nik: null,
      foto: null,
      catatan: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    it('should update penyewa successfully', async () => {
      const mockUpdatedPenyewa = {
        ...mockExistingPenyewa,
        ...updateRequest,
        updatedAt: new Date()
      }

      mockPrisma.penyewa.findUnique.mockResolvedValue(mockExistingPenyewa)
      mockPrisma.penyewa.update.mockResolvedValue(mockUpdatedPenyewa)

      const result = await penyewaService.updatePenyewa(penyewaId, updateRequest)

      expect(mockPrisma.penyewa.findUnique).toHaveBeenCalledWith({
        where: { id: penyewaId }
      })
      expect(mockPrisma.penyewa.update).toHaveBeenCalledWith({
        where: { id: penyewaId },
        data: updateRequest
      })
      expect(result).toEqual(mockUpdatedPenyewa)
    })

    it('should throw error if penyewa not found', async () => {
      mockPrisma.penyewa.findUnique.mockResolvedValue(null)

      await expect(penyewaService.updatePenyewa(penyewaId, updateRequest))
        .rejects.toThrow('Penyewa tidak ditemukan')
    })

    it('should validate phone uniqueness when updating phone', async () => {
      const updateWithPhone: UpdatePenyewaRequest = {
        telepon: '08999888777'
      }

      const existingPenyewaWithSamePhone = {
        id: 'other-penyewa',
        telepon: '08999888777'
      }

      mockPrisma.penyewa.findUnique
        .mockResolvedValueOnce(mockExistingPenyewa) // First call: check if penyewa exists
        .mockResolvedValueOnce(existingPenyewaWithSamePhone as never) // Second call: check phone uniqueness

      await expect(penyewaService.updatePenyewa(penyewaId, updateWithPhone))
        .rejects.toThrow('Nomor telepon sudah terdaftar')
    })
  })

  describe('findPenyewaByPhone', () => {
    const phoneNumber = '08123456789'
    const mockPenyewa = {
      id: 'penyewa-1',
      nama: 'John Doe',
      telepon: phoneNumber,
      alamat: 'Jl. Merdeka No. 123',
      email: null,
      nik: null,
      foto: null,
      catatan: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    it('should find penyewa by phone number', async () => {
      mockPrisma.penyewa.findUnique.mockResolvedValue(mockPenyewa)

      const result = await penyewaService.findPenyewaByPhone(phoneNumber)

      expect(mockPrisma.penyewa.findUnique).toHaveBeenCalledWith({
        where: { telepon: phoneNumber }
      })
      expect(result).toEqual(mockPenyewa)
    })

    it('should return null if penyewa not found', async () => {
      mockPrisma.penyewa.findUnique.mockResolvedValue(null)

      const result = await penyewaService.findPenyewaByPhone(phoneNumber)

      expect(result).toBeNull()
    })
  })
})