/**
 * Audit Service - RPK-26
 * Comprehensive audit logging for all CRUD operations
 * Following security best practices and compliance requirements
 */

import { PrismaClient } from '@prisma/client'

// Define audit data types for type safety - JSON compatible
export type AuditData = 
  | Record<string, unknown>
  | unknown
  | null
  | undefined

export interface AuditLogEntry {
  entityType: 'penyewa' | 'transaksi' | 'pembayaran' | 'produk'
  entityId: string
  action: 'create' | 'read' | 'update' | 'delete'
  userId: string
  userRole?: string
  timestamp: Date
  oldData?: AuditData
  newData?: AuditData
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export interface AuditQueryParams {
  entityType?: string
  entityId?: string
  action?: string
  userId?: string
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
}

export class AuditService {
  constructor(
    private prisma: PrismaClient,
    private userId: string,
    private userRole?: string
  ) {}

  /**
   * Log audit entry for any operation
   */
  async logActivity(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
    try {
      // Create audit log entry in database
      // Note: We'll use a simple JSON storage approach since audit table wasn't in original schema
      // In production, consider dedicated audit table
      
      const auditData = {
        ...entry,
        timestamp: new Date(),
        userId: this.userId,
        userRole: this.userRole || 'unknown'
      }

      // Store in aktivitas_transaksi table as a workaround for now
      // In production, create dedicated audit_log table
      if (entry.entityType === 'transaksi') {
        await this.prisma.aktivitasTransaksi.create({
          data: {
            transaksiId: entry.entityId,
            tipe: `audit_${entry.action}`,
            deskripsi: `${entry.action.toUpperCase()} operation on ${entry.entityType}`,
            data: JSON.parse(JSON.stringify({
              auditLog: {
                ...auditData,
                timestamp: auditData.timestamp.toISOString()
              },
              oldData: entry.oldData,
              newData: entry.newData,
              metadata: entry.metadata
            })),
            createdBy: this.userId
          }
        })
      } else {
        // For non-transaction entities, log to console for now
        // In production, implement proper audit table
        console.log('[AUDIT]', JSON.stringify(auditData, null, 2))
      }
    } catch (error) {
      // Audit logging should never break the main operation
      console.error('Audit logging failed:', error)
    }
  }

  /**
   * Log customer (penyewa) operations
   */
  async logPenyewaActivity(
    action: 'create' | 'read' | 'update' | 'delete',
    entityId: string,
    oldData?: AuditData,
    newData?: AuditData,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logActivity({
      entityType: 'penyewa',
      entityId,
      action,
      oldData,
      newData,
      metadata,
      userId: this.userId,
      userRole: this.userRole
    })
  }

  /**
   * Log transaction operations
   */
  async logTransaksiActivity(
    action: 'create' | 'read' | 'update' | 'delete',
    entityId: string,
    oldData?: AuditData,
    newData?: AuditData,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logActivity({
      entityType: 'transaksi',
      entityId,
      action,
      oldData,
      newData,
      metadata,
      userId: this.userId,
      userRole: this.userRole
    })
  }

  /**
   * Log payment operations
   */
  async logPembayaranActivity(
    action: 'create' | 'read' | 'update' | 'delete',
    entityId: string,
    oldData?: AuditData,
    newData?: AuditData,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logActivity({
      entityType: 'pembayaran',
      entityId,
      action,
      oldData,
      newData,
      metadata,
      userId: this.userId,
      userRole: this.userRole
    })
  }

  /**
   * Log return processing activity with detailed penalty information
   * Enhanced for troubleshooting pengembalian issues
   */
  async logReturnActivity(
    transaksiId: string,
    returnData: {
      items: Array<{
        itemId: string
        kondisiAkhir: string
        jumlahKembali: number
      }>
      totalPenalty: number
      totalLateDays: number
      catatan?: string
      stage: string // 'validation' | 'calculation' | 'processing' | 'completed' | 'failed'
    },
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.prisma.aktivitasTransaksi.create({
        data: {
          transaksiId,
          tipe: `return_${returnData.stage}`,
          deskripsi: `Pengembalian ${returnData.stage}: ${returnData.items.length} item dengan penalty ${returnData.totalPenalty}`,
          data: JSON.parse(JSON.stringify({
            returnProcessing: {
              items: returnData.items,
              penaltyDetails: {
                totalPenalty: returnData.totalPenalty,
                totalLateDays: returnData.totalLateDays,
              },
              catatan: returnData.catatan,
              stage: returnData.stage,
              timestamp: new Date().toISOString(),
            },
            metadata: metadata || {},
            performance: {
              timestamp: new Date().toISOString(),
            },
          })),
          createdBy: this.userId,
        },
      })
    } catch (error) {
      console.error('Failed to log return activity:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transaksiId,
        stage: returnData.stage,
      })
    }
  }

  /**
   * Log penalty calculation details for troubleshooting
   */
  async logPenaltyCalculation(
    transaksiId: string,
    penaltyData: {
      calculationDuration: number
      totalPenalty: number
      lateDays: number
      itemBreakdown: Array<{
        itemId: string
        productName: string
        penalty: number
        reason: string
      }>
      errors?: string[]
    }
  ): Promise<void> {
    try {
      await this.prisma.aktivitasTransaksi.create({
        data: {
          transaksiId,
          tipe: 'penalty_calculated',
          deskripsi: `Penalty calculation completed: ${penaltyData.totalPenalty} (${penaltyData.lateDays} hari terlambat)`,
          data: JSON.parse(JSON.stringify({
            penaltyCalculation: penaltyData,
            performance: {
              calculationDuration: penaltyData.calculationDuration,
              timestamp: new Date().toISOString(),
            },
          })),
          createdBy: this.userId,
        },
      })
    } catch (error) {
      console.error('Failed to log penalty calculation:', error)
    }
  }

  /**
   * Log return processing error for troubleshooting
   */
  async logReturnError(
    transaksiId: string,
    errorData: {
      error: string
      stage: string
      stack?: string
      context?: Record<string, unknown>
      duration?: number
    }
  ): Promise<void> {
    try {
      await this.prisma.aktivitasTransaksi.create({
        data: {
          transaksiId,
          tipe: 'return_error',
          deskripsi: `Pengembalian gagal pada ${errorData.stage}: ${errorData.error}`,
          data: JSON.parse(JSON.stringify({
            errorDetails: {
              error: errorData.error,
              stage: errorData.stage,
              stack: errorData.stack,
              context: errorData.context,
              timestamp: new Date().toISOString(),
            },
            performance: {
              duration: errorData.duration,
            },
          })),
          createdBy: this.userId,
        },
      })
    } catch (error) {
      console.error('Failed to log return error:', error)
    }
  }

  /**
   * Async (fire-and-forget) logging methods for performance optimization
   * These methods don't block the main execution flow
   */

  /**
   * Log return activity asynchronously (non-blocking)
   */
  logReturnActivityAsync(
    transaksiId: string,
    returnData: {
      items: Array<{
        itemId: string
        kondisiAkhir: string
        jumlahKembali: number
      }>
      totalPenalty: number
      totalLateDays: number
      catatan?: string
      stage: string
    },
    metadata?: Record<string, unknown>
  ): void {
    // Fire and forget - don't await this
    this.logReturnActivity(transaksiId, returnData, metadata).catch(error => {
      console.error('Background audit logging failed:', error)
    })
  }

  /**
   * Log penalty calculation asynchronously (non-blocking)
   */
  logPenaltyCalculationAsync(
    transaksiId: string,
    penaltyData: {
      calculationDuration: number
      totalPenalty: number
      lateDays: number
      itemBreakdown: Array<{
        itemId: string
        productName: string
        penalty: number
        reason: string
      }>
      errors?: string[]
    }
  ): void {
    // Fire and forget - don't await this
    this.logPenaltyCalculation(transaksiId, penaltyData).catch(error => {
      console.error('Background penalty calculation logging failed:', error)
    })
  }

  /**
   * Get audit trail for specific entity
   */
  async getAuditTrail(
    entityType: string,
    entityId: string,
    limit: number = 50
  ): Promise<AuditLogEntry[]> {
    try {
      if (entityType === 'transaksi') {
        const activities = await this.prisma.aktivitasTransaksi.findMany({
          where: {
            transaksiId: entityId,
            tipe: {
              startsWith: 'audit_'
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        })

        return activities.map(activity => ({
          entityType: 'transaksi' as const,
          entityId,
          action: activity.tipe.replace('audit_', '') as 'create' | 'read' | 'update' | 'delete',
          userId: activity.createdBy,
          timestamp: activity.createdAt,
          oldData: null,
          newData: activity.data as AuditData,
          metadata: undefined
        }))
      }

      // For other entity types, return empty array for now
      // In production, query dedicated audit table
      return []
    } catch (error) {
      console.error('Failed to get audit trail:', error)
      return []
    }
  }

  /**
   * Get audit summary for reporting
   */
  async getAuditSummary(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalActivities: number
    activitiesByType: Record<string, number>
    activitiesByAction: Record<string, number>
    topUsers: Array<{ userId: string; count: number }>
  }> {
    try {
      const whereClause: Record<string, unknown> = {
        tipe: { startsWith: 'audit_' }
      }

      if (startDate || endDate) {
        whereClause.createdAt = {}
        if (startDate) (whereClause.createdAt as Record<string, Date>).gte = startDate
        if (endDate) (whereClause.createdAt as Record<string, Date>).lte = endDate
      }

      const activities = await this.prisma.aktivitasTransaksi.findMany({
        where: whereClause,
        select: {
          tipe: true,
          createdBy: true,
          data: true
        }
      })

      const totalActivities = activities.length
      const activitiesByType: Record<string, number> = {}
      const activitiesByAction: Record<string, number> = {}
      const userCounts: Record<string, number> = {}

      activities.forEach(activity => {
        // Count by action
        const action = activity.tipe.replace('audit_', '')
        activitiesByAction[action] = (activitiesByAction[action] || 0) + 1

        // Count by entity type (from audit data)
        if (activity.data && typeof activity.data === 'object') {
          const auditData = activity.data as Record<string, unknown>
          const auditLog = auditData.auditLog as Record<string, unknown> | undefined
          if (auditLog && typeof auditLog.entityType === 'string') {
            const entityType = auditLog.entityType
            activitiesByType[entityType] = (activitiesByType[entityType] || 0) + 1
          }
        }

        // Count by user
        userCounts[activity.createdBy] = (userCounts[activity.createdBy] || 0) + 1
      })

      const topUsers = Object.entries(userCounts)
        .map(([userId, count]) => ({ userId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      return {
        totalActivities,
        activitiesByType,
        activitiesByAction,
        topUsers
      }
    } catch (error) {
      console.error('Failed to get audit summary:', error)
      return {
        totalActivities: 0,
        activitiesByType: {},
        activitiesByAction: {},
        topUsers: []
      }
    }
  }

  /**
   * Sanitize sensitive data before logging
   */
  private sanitizeData(data: AuditData): AuditData {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return data

    const sensitiveFields = ['password', 'token', 'secret', 'nik']
    const sanitized = { ...data } as Record<string, unknown>

    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]'
      }
    })

    return sanitized
  }

  /**
   * Create audit middleware for service integration
   */
  createAuditWrapper<T extends (...args: unknown[]) => Promise<unknown>>(
    operation: T,
    entityType: 'penyewa' | 'transaksi' | 'pembayaran',
    action: 'create' | 'read' | 'update' | 'delete'
  ) {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      const startTime = Date.now()
      let result: unknown
      let error: unknown

      try {
        result = await operation(...args)
        
        // Log successful operation
        const resultData = result as Record<string, unknown> | null
        await this.logActivity({
          entityType,
          action,
          entityId: resultData?.id as string || 'unknown',
          newData: action === 'create' ? this.sanitizeData(JSON.parse(JSON.stringify(result))) : undefined,
          metadata: {
            duration: Date.now() - startTime,
            success: true
          },
          userId: this.userId,
          userRole: this.userRole
        })

        return result as ReturnType<T>
      } catch (err) {
        error = err
        
        // Log failed operation
        const errorData = error as Error | null
        await this.logActivity({
          entityType,
          action,
          entityId: 'unknown',
          metadata: {
            duration: Date.now() - startTime,
            success: false,
            error: errorData?.message || 'Unknown error'
          },
          userId: this.userId,
          userRole: this.userRole
        })

        throw error
      }
    }
  }
}

/**
 * Create audit service instance with user context
 */
export function createAuditService(
  prisma: PrismaClient,
  userId: string,
  userRole?: string
): AuditService {
  return new AuditService(prisma, userId, userRole)
}

/**
 * Audit decorator for service methods
 */
export function auditOperation(
  entityType: 'penyewa' | 'transaksi' | 'pembayaran',
  action: 'create' | 'read' | 'update' | 'delete'
) {
  return function (target: unknown, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (this: { prisma: PrismaClient; userId: string; userRole: string }, ...args: unknown[]) {
      const auditService = new AuditService(this.prisma, this.userId, this.userRole)
      const wrappedMethod = auditService.createAuditWrapper(method.bind(this), entityType, action)
      return wrappedMethod(...args)
    }
  }
}