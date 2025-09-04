/**
 * Unit Tests for MaterialService
 * Tests business logic, validation, and error handling
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { MaterialService } from '../materialService'
import { NotFoundError, ConflictError } from '../../lib/errors/AppError'
import { Decimal } from '@prisma/client/runtime/library'

// Mock PrismaClient
const mockPrisma = {
  material: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
  },
  product: {
    count: jest.fn(),
  },
  $transaction: jest.fn(),
} as unknown as PrismaClient

describe('MaterialService', () => {
  let materialService: MaterialService
  const mockUserId = 'user-123'

  beforeEach(() => {
    materialService = new MaterialService(mockPrisma, mockUserId)
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('createMaterial', () => {
    const validCreateRequest = {
      name: 'Test Material',
      pricePerUnit: 100.0,
      unit: 'meter',
    }

    it('should create material successfully dengan valid data', async () => {
      // Mock: No existing material with same name
      ;(mockPrisma.material.findFirst as jest.Mock).mockResolvedValue(null)

      // Mock: Successful creation
      const mockCreatedMaterial = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Material',
        pricePerUnit: new Decimal(100.0),
        unit: 'meter',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
      }
      ;(mockPrisma.material.create as jest.Mock).mockResolvedValue(mockCreatedMaterial)

      const result = await materialService.createMaterial(validCreateRequest)

      expect(result).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Material',
        pricePerUnit: 100.0,
        unit: 'meter',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        createdBy: mockUserId,
      })

      expect(mockPrisma.material.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Material',
          pricePerUnit: new Decimal(100.0),
          unit: 'meter',
          createdBy: mockUserId,
        },
      })
    })

    it('should throw ConflictError jika material name sudah ada', async () => {
      // Mock: Existing material with same name
      ;(mockPrisma.material.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-material',
        name: 'Test Material',
      })

      await expect(materialService.createMaterial(validCreateRequest)).rejects.toThrow(
        ConflictError,
      )
      await expect(materialService.createMaterial(validCreateRequest)).rejects.toThrow(
        'Material dengan nama "Test Material" sudah ada',
      )

      expect(mockPrisma.material.create).not.toHaveBeenCalled()
    })

    it('should validate input dan throw error untuk invalid data', async () => {
      const invalidRequests = [
        { name: '', pricePerUnit: 100, unit: 'meter' }, // Empty name
        { name: 'Valid Name', pricePerUnit: 0, unit: 'meter' }, // Invalid price
        { name: 'Valid Name', pricePerUnit: -10, unit: 'meter' }, // Negative price
        { name: 'Valid Name', pricePerUnit: 100, unit: '' }, // Empty unit
      ]

      for (const invalidRequest of invalidRequests) {
        await expect(materialService.createMaterial(invalidRequest)).rejects.toThrow()
      }
    })
  })

  describe('updateMaterial', () => {
    const materialId = '123e4567-e89b-12d3-a456-426614174000'
    const validUpdateRequest = {
      name: 'Updated Material',
      pricePerUnit: 150.0,
      unit: 'kilogram',
      isActive: true,
    }

    beforeEach(() => {
      // Mock: Existing material
      ;(mockPrisma.material.findUnique as jest.Mock).mockResolvedValue({
        id: materialId,
        name: 'Old Material',
        pricePerUnit: new Decimal(100.0),
        unit: 'meter',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
      })
    })

    it('should update material successfully dengan valid data', async () => {
      // Mock: No name conflict
      ;(mockPrisma.material.findFirst as jest.Mock).mockResolvedValue(null)

      // Mock: Successful update
      const mockUpdatedMaterial = {
        id: materialId,
        name: 'Updated Material',
        pricePerUnit: new Decimal(150.0),
        unit: 'kilogram',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
      }
      ;(mockPrisma.material.update as jest.Mock).mockResolvedValue(mockUpdatedMaterial)

      const result = await materialService.updateMaterial(materialId, validUpdateRequest)

      expect(result).toEqual({
        id: materialId,
        name: 'Updated Material',
        pricePerUnit: 150.0,
        unit: 'kilogram',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        createdBy: mockUserId,
      })

      expect(mockPrisma.material.update).toHaveBeenCalledWith({
        where: { id: materialId },
        data: {
          name: 'Updated Material',
          pricePerUnit: new Decimal(150.0),
          unit: 'kilogram',
            updatedAt: expect.any(Date),
        },
      })
    })

    it('should throw NotFoundError jika material tidak ada', async () => {
      ;(mockPrisma.material.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(
        materialService.updateMaterial('123e4567-e89b-12d3-a456-426614174999', validUpdateRequest),
      ).rejects.toThrow(NotFoundError)
      await expect(
        materialService.updateMaterial('123e4567-e89b-12d3-a456-426614174999', validUpdateRequest),
      ).rejects.toThrow('Material tidak ditemukan')
    })

    it('should throw ConflictError jika new name sudah digunakan', async () => {
      // Mock: Name conflict with another material
      ;(mockPrisma.material.findFirst as jest.Mock).mockResolvedValue({
        id: 'other-material-id',
        name: 'Updated Material',
      })

      await expect(
        materialService.updateMaterial(materialId, validUpdateRequest),
      ).rejects.toThrow(ConflictError)
      await expect(
        materialService.updateMaterial(materialId, validUpdateRequest),
      ).rejects.toThrow('Material dengan nama "Updated Material" sudah ada')
    })
  })

  describe('getMaterialById', () => {
    const materialId = '123e4567-e89b-12d3-a456-426614174000'

    it('should return material jika ada', async () => {
      const mockMaterial = {
        id: materialId,
        name: 'Test Material',
        pricePerUnit: new Decimal(100.0),
        unit: 'meter',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
      }
      ;(mockPrisma.material.findUnique as jest.Mock).mockResolvedValue(mockMaterial)

      const result = await materialService.getMaterialById(materialId)

      expect(result).toEqual({
        id: materialId,
        name: 'Test Material',
        pricePerUnit: 100.0,
        unit: 'meter',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        createdBy: mockUserId,
      })
    })

    it('should throw NotFoundError jika material tidak ada', async () => {
      ;(mockPrisma.material.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(materialService.getMaterialById('123e4567-e89b-12d3-a456-426614174999')).rejects.toThrow(
        NotFoundError,
      )
      await expect(materialService.getMaterialById('123e4567-e89b-12d3-a456-426614174999')).rejects.toThrow(
        'Material tidak ditemukan',
      )
    })
  })

  describe('deleteMaterial', () => {
    const materialId = '123e4567-e89b-12d3-a456-426614174000'

    beforeEach(() => {
      // Mock: Existing material
      ;(mockPrisma.material.findUnique as jest.Mock).mockResolvedValue({
        id: materialId,
        name: 'Test Material',
      })
    })

    it('should delete material successfully jika tidak digunakan', async () => {
      // Mock: No products using this material
      ;(mockPrisma.product.count as jest.Mock).mockResolvedValue(0)
      ;(mockPrisma.material.delete as jest.Mock).mockResolvedValue({})

      const result = await materialService.deleteMaterial(materialId)

      expect(result).toBe(true)
      expect(mockPrisma.material.delete).toHaveBeenCalledWith({
        where: { id: materialId },
      })
    })

    it('should throw ConflictError jika material sedang digunakan', async () => {
      // Mock: Material is being used by products
      ;(mockPrisma.product.count as jest.Mock).mockResolvedValue(5)

      await expect(materialService.deleteMaterial(materialId)).rejects.toThrow(ConflictError)
      await expect(materialService.deleteMaterial(materialId)).rejects.toThrow(
        'Material tidak dapat dihapus karena sedang digunakan oleh 5 produk',
      )

      expect(mockPrisma.material.update).not.toHaveBeenCalled()
    })

    it('should throw NotFoundError jika material tidak ada', async () => {
      ;(mockPrisma.material.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(materialService.deleteMaterial('123e4567-e89b-12d3-a456-426614174999')).rejects.toThrow(
        NotFoundError,
      )
    })
  })

  describe('getMaterials', () => {
    const mockMaterials = [
      {
        id: 'material-1',
        name: 'Material 1',
        pricePerUnit: new Decimal(100.0),
        unit: 'meter',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
      },
      {
        id: 'material-2',
        name: 'Material 2',
        pricePerUnit: new Decimal(200.0),
        unit: 'kilogram',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
      },
    ]

    it('should return paginated materials dengan default parameters', async () => {
      ;(mockPrisma.material.findMany as jest.Mock).mockResolvedValue(mockMaterials)
      ;(mockPrisma.material.count as jest.Mock).mockResolvedValue(2)

      const result = await materialService.getMaterials({})

      expect(result).toEqual({
        materials: expect.arrayContaining([
          expect.objectContaining({
            id: 'material-1',
            name: 'Material 1',
            pricePerUnit: 100.0,
          }),
          expect.objectContaining({
            id: 'material-2',
            name: 'Material 2',
            pricePerUnit: 200.0,
          }),
        ]),
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      })
    })

    it('should apply search filter correctly', async () => {
      ;(mockPrisma.material.findMany as jest.Mock).mockResolvedValue([mockMaterials[0]])
      ;(mockPrisma.material.count as jest.Mock).mockResolvedValue(1)

      await materialService.getMaterials({ search: 'Material 1' })

      expect(mockPrisma.material.findMany).toHaveBeenCalledWith({
        where: {
            OR: [
            { name: { contains: 'Material 1', mode: 'insensitive' } },
            { unit: { contains: 'Material 1', mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      })
    })
  })


  describe('getActiveMaterials', () => {
    it('should return only active materials ordered by name', async () => {
      const mockActiveMaterials = [
        {
          id: 'material-1',
          name: 'A Material',
          pricePerUnit: new Decimal(100.0),
          unit: 'meter',
            createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: mockUserId,
        },
        {
          id: 'material-2',
          name: 'B Material',
          pricePerUnit: new Decimal(200.0),
          unit: 'kilogram',
            createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: mockUserId,
        },
      ]

      ;(mockPrisma.material.findMany as jest.Mock).mockResolvedValue(mockActiveMaterials)

      const result = await materialService.getActiveMaterials()

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('A Material')
      expect(result[1].name).toBe('B Material')

      expect(mockPrisma.material.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { name: 'asc' },
      })
    })
  })
})