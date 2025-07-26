/**
 * Unit Tests for AuditService - RPK-26
 * Testing audit logging functionality with TDD approach
 * 
 * Coverage:
 * - Activity logging for different entity types
 * - Audit trail retrieval and filtering
 * - Data sanitization for sensitive information
 * - Decorator integration for automatic logging
 * - Error handling scenarios
 * - JSON serialization for Prisma compatibility
 */

import { AuditService, createAuditService } from './auditService'
import { PrismaClient } from '@prisma/client'

// Mock Prisma Client
const mockPrisma = {
  aktivitasTransaksi: {
    create: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn()
  }
} as unknown as jest.Mocked<PrismaClient>

describe('AuditService', () => {
  let auditService: AuditService
  const mockUserId = 'user-123'
  const mockUserRole = 'kasir'

  beforeEach(() => {
    jest.clearAllMocks()
    auditService = createAuditService(mockPrisma, mockUserId, mockUserRole)
  })

  describe('logActivity', () => {
    it('should log transaksi activity successfully', async () => {
      const mockCreatedActivity = {
        id: 'activity-1',
        transaksiId: 'transaksi-1',
        tipe: 'audit_create',
        deskripsi: 'CREATE operation on transaksi',
        data: {
          auditLog: {
            entityType: 'transaksi',
            entityId: 'transaksi-1',
            action: 'create'
          }
        },
        createdBy: mockUserId
      }

      mockPrisma.aktivitasTransaksi.create.mockResolvedValue(mockCreatedActivity as never)

      await auditService.logActivity({
        entityType: 'transaksi',
        entityId: 'transaksi-1',
        action: 'create',
        newData: { kode: 'TXN-001', status: 'active' },
        metadata: { operation: 'transaction_creation' }
      })

      expect(mockPrisma.aktivitasTransaksi.create).toHaveBeenCalledWith({
        data: {
          transaksiId: 'transaksi-1',
          tipe: 'audit_create',
          deskripsi: 'CREATE operation on transaksi',
          data: expect.any(Object),
          createdBy: mockUserId
        }
      })
    })

    it('should log sensitive data without automatic sanitization in logActivity', async () => {
      const sensitiveData = {
        kode: 'TXN-001',
        password: 'secret123',
        nik: '1234567890123456',
        token: 'bearer-token'
      }

      mockPrisma.aktivitasTransaksi.create.mockResolvedValue({} as never)

      await auditService.logActivity({
        entityType: 'transaksi',
        entityId: 'transaksi-1',
        action: 'create',
        newData: sensitiveData
      })

      const callArgs = mockPrisma.aktivitasTransaksi.create.mock.calls[0][0]
      const loggedData = JSON.parse(JSON.stringify(callArgs.data.data))
      
      // logActivity doesn't automatically sanitize - this is by design
      // Sanitization happens in the wrapper or manually via sanitizeData
      expect(loggedData.newData.password).toBe('secret123')
      expect(loggedData.newData.nik).toBe('1234567890123456')
      expect(loggedData.newData.token).toBe('bearer-token')
      
      // Non-sensitive fields should remain
      expect(loggedData.newData.kode).toBe('TXN-001')
    })

    it('should handle non-transaksi entity types', async () => {
      // For non-transaksi entities, should handle gracefully
      // In production, this would use a dedicated audit table
      await auditService.logActivity({
        entityType: 'produk',
        entityId: 'produk-1',
        action: 'create'
      })

      // Should not call aktivitasTransaksi.create for non-transaksi entities
      expect(mockPrisma.aktivitasTransaksi.create).not.toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.aktivitasTransaksi.create.mockRejectedValue(new Error('Database error'))

      // Should not throw, just log the error
      await expect(auditService.logActivity({
        entityType: 'transaksi',
        entityId: 'transaksi-1',
        action: 'create'
      })).resolves.not.toThrow()
    })
  })

  describe('specific activity loggers', () => {
    beforeEach(() => {
      // Mock the base logActivity method
      jest.spyOn(auditService, 'logActivity').mockResolvedValue()
    })

    it('should log penyewa activity with correct parameters', async () => {
      const oldData = { nama: 'Old Name' }
      const newData = { nama: 'New Name' }
      const metadata = { operation: 'update' }

      await auditService.logPenyewaActivity('update', 'penyewa-1', oldData, newData, metadata)

      expect(auditService.logActivity).toHaveBeenCalledWith({
        entityType: 'penyewa',
        entityId: 'penyewa-1',
        action: 'update',
        oldData,
        newData,
        metadata,
        userId: mockUserId,
        userRole: mockUserRole
      })
    })

    it('should log transaksi activity with correct parameters', async () => {
      const newData = { kode: 'TXN-001', status: 'active' }

      await auditService.logTransaksiActivity('create', 'transaksi-1', undefined, newData)

      expect(auditService.logActivity).toHaveBeenCalledWith({
        entityType: 'transaksi',
        entityId: 'transaksi-1',
        action: 'create',
        oldData: undefined,
        newData,
        metadata: undefined,
        userId: mockUserId,
        userRole: mockUserRole
      })
    })

    it('should log pembayaran activity with correct parameters', async () => {
      const newData = { jumlah: 100000, metode: 'tunai' }

      await auditService.logPembayaranActivity('create', 'pembayaran-1', undefined, newData)

      expect(auditService.logActivity).toHaveBeenCalledWith({
        entityType: 'pembayaran',
        entityId: 'pembayaran-1',
        action: 'create',
        oldData: undefined,
        newData,
        metadata: undefined,
        userId: mockUserId,
        userRole: mockUserRole
      })
    })
  })

  describe('getAuditTrail', () => {
    it('should return audit trail for transaksi entity', async () => {
      const mockActivities = [
        {
          id: 'activity-1',
          tipe: 'audit_create',
          deskripsi: 'CREATE operation',
          data: { auditLog: { action: 'create' } },
          createdBy: mockUserId,
          createdAt: new Date()
        },
        {
          id: 'activity-2',
          tipe: 'audit_update',
          deskripsi: 'UPDATE operation',
          data: { auditLog: { action: 'update' } },
          createdBy: mockUserId,
          createdAt: new Date()
        }
      ]

      mockPrisma.aktivitasTransaksi.findMany.mockResolvedValue(mockActivities as never)

      const result = await auditService.getAuditTrail('transaksi', 'transaksi-1')

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        entityType: 'transaksi',
        entityId: 'transaksi-1',
        action: 'create',
        userId: mockUserId,
        timestamp: mockActivities[0].createdAt,
        oldData: null,
        newData: { auditLog: { action: 'create' } },
        metadata: undefined
      })

      expect(mockPrisma.aktivitasTransaksi.findMany).toHaveBeenCalledWith({
        where: {
          transaksiId: 'transaksi-1',
          tipe: { startsWith: 'audit_' }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    })

    it('should return empty array for non-transaksi entities', async () => {
      const result = await auditService.getAuditTrail('penyewa', 'penyewa-1')
      
      expect(result).toEqual([])
      expect(mockPrisma.aktivitasTransaksi.findMany).not.toHaveBeenCalled()
    })

    it('should limit results based on provided limit', async () => {
      mockPrisma.aktivitasTransaksi.findMany.mockResolvedValue([])

      await auditService.getAuditTrail('transaksi', 'transaksi-1', 10)

      expect(mockPrisma.aktivitasTransaksi.findMany).toHaveBeenCalledWith({
        where: {
          transaksiId: 'transaksi-1',
          tipe: { startsWith: 'audit_' }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    })
  })

  describe('getAuditSummary', () => {
    it('should return audit summary statistics', async () => {
      const mockActivities = [
        {
          tipe: 'audit_create',
          createdBy: 'user-1',
          data: {
            auditLog: { entityType: 'penyewa' }
          }
        },
        {
          tipe: 'audit_update',
          createdBy: 'user-1',
          data: {
            auditLog: { entityType: 'transaksi' }
          }
        },
        {
          tipe: 'audit_create',
          createdBy: 'user-2',
          data: {
            auditLog: { entityType: 'penyewa' }
          }
        }
      ]

      mockPrisma.aktivitasTransaksi.findMany.mockResolvedValue(mockActivities as never)

      const stats = await auditService.getAuditSummary()

      expect(stats.totalActivities).toBe(3)
      expect(stats.activitiesByAction.create).toBe(2)
      expect(stats.activitiesByAction.update).toBe(1)
      expect(stats.activitiesByType.penyewa).toBe(2)
      expect(stats.activitiesByType.transaksi).toBe(1)
      expect(stats.topUsers).toContainEqual({ userId: 'user-1', count: 2 })
      expect(stats.topUsers).toContainEqual({ userId: 'user-2', count: 1 })
    })

    it('should filter summary by date range', async () => {
      const startDate = new Date('2025-07-01')
      const endDate = new Date('2025-07-31')

      mockPrisma.aktivitasTransaksi.findMany.mockResolvedValue([])

      await auditService.getAuditSummary(startDate, endDate)

      expect(mockPrisma.aktivitasTransaksi.findMany).toHaveBeenCalledWith({
        where: {
          tipe: { startsWith: 'audit_' },
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          tipe: true,
          createdBy: true,
          data: true
        }
      })
    })
  })

  describe('createAuditWrapper', () => {
    it('should create audit wrapper that logs successful operations', async () => {
      const mockOperation = jest.fn().mockResolvedValue({ id: 'result-1', nama: 'Test' })
      
      // Mock the logActivity method
      jest.spyOn(auditService, 'logActivity').mockResolvedValue()

      const wrappedOperation = auditService.createAuditWrapper(
        mockOperation,
        'penyewa',
        'create'
      )

      const result = await wrappedOperation('arg1', 'arg2')

      expect(result).toEqual({ id: 'result-1', nama: 'Test' })
      expect(mockOperation).toHaveBeenCalledWith('arg1', 'arg2')
      expect(auditService.logActivity).toHaveBeenCalledWith({
        entityType: 'penyewa',
        action: 'create',
        entityId: 'result-1',
        newData: expect.any(Object),
        metadata: expect.objectContaining({
          duration: expect.any(Number),
          success: true
        }),
        userId: mockUserId,
        userRole: mockUserRole
      })
    })

    it('should create audit wrapper that logs failed operations', async () => {
      const mockError = new Error('Operation failed')
      const mockOperation = jest.fn().mockRejectedValue(mockError)
      
      // Mock the logActivity method
      jest.spyOn(auditService, 'logActivity').mockResolvedValue()

      const wrappedOperation = auditService.createAuditWrapper(
        mockOperation,
        'penyewa',
        'create'
      )

      await expect(wrappedOperation('arg1')).rejects.toThrow('Operation failed')

      expect(auditService.logActivity).toHaveBeenCalledWith({
        entityType: 'penyewa',
        action: 'create',
        entityId: 'unknown',
        metadata: expect.objectContaining({
          duration: expect.any(Number),
          success: false,
          error: 'Operation failed'
        }),
        userId: mockUserId,
        userRole: mockUserRole
      })
    })
  })

  describe('data sanitization', () => {
    it('should sanitize sensitive fields', () => {
      const sensitiveData = {
        nama: 'John',
        password: 'secret',
        token: 'bearer-123',
        secret: 'api-key',
        nik: '1234567890',
        normalField: 'normal-value'
      }

      // Access private method for testing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sanitized = (auditService as any).sanitizeData(sensitiveData)

      expect(sanitized.nama).toBe('John')
      expect(sanitized.normalField).toBe('normal-value')
      expect(sanitized.password).toBe('[REDACTED]')
      expect(sanitized.token).toBe('[REDACTED]')
      expect(sanitized.secret).toBe('[REDACTED]')
      expect(sanitized.nik).toBe('[REDACTED]')
    })

    it('should handle non-object data', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((auditService as any).sanitizeData(null)).toBe(null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((auditService as any).sanitizeData('string')).toBe('string')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((auditService as any).sanitizeData(123)).toBe(123)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((auditService as any).sanitizeData([])).toEqual([])
    })
  })
})

describe('createAuditService factory', () => {
  it('should create audit service with correct parameters', () => {
    const service = createAuditService(mockPrisma, 'user-123', 'admin')
    
    expect(service).toBeInstanceOf(AuditService)
  })
})