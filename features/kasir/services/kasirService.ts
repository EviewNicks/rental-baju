/**
 * KasirService - Kasir Management System
 * Service layer for cashier (kasir) CRUD operations
 * Following TDD approach and existing patterns from PenyewaService
 */

import { PrismaClient, Kasir } from '@prisma/client'
import type {
  CreateKasirRequest,
  UpdateKasirRequest,
  KasirQueryParams
} from '../types'
import { createAuditService, AuditService } from './auditService'

export interface KasirWithTransactions extends Kasir {
  transaksi?: Array<{
    id: string
    kode: string
    createdAt: Date
  }>
}

export interface KasirListResponse {
  data: Kasir[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  summary: {
    total: number
    active: number
    inactive: number
  }
}

export class KasirService {
  private auditService: AuditService

  constructor(
    private prisma: PrismaClient,
    private userId: string,
    private userRole?: string
  ) {
    this.auditService = createAuditService(prisma, userId, userRole)
  }

  /**
   * Create new kasir (cashier)
   */
  async createKasir(data: CreateKasirRequest): Promise<Kasir> {
    // Create new kasir
    const kasir = await this.prisma.kasir.create({
      data: {
        nama: data.nama,
        isActive: data.isActive ?? true,
        createdBy: this.userId
      }
    })

    // Log audit trail
    await this.auditService.logKasirActivity(
      'create',
      kasir.id,
      undefined,
      kasir,
      {
        operation: 'cashier_registration',
        requestData: data
      }
    )

    return kasir
  }


  /**
   * Get paginated list of kasir with optional search and filters
   */
  async getKasirList(params: KasirQueryParams): Promise<KasirListResponse> {
    const { page, limit, search, isActive } = params
    const skip = (page - 1) * limit

    // Build where clause for search and filters
    let whereClause: Record<string, unknown> | undefined = undefined
    const andConditions: Record<string, unknown>[] = []

    if (search) {
      andConditions.push({
        OR: [
          { nama: { contains: search, mode: 'insensitive' } }
        ]
      })
    }

    if (isActive !== undefined) {
      andConditions.push({ isActive })
    }

    if (andConditions.length > 0) {
      whereClause = { AND: andConditions }
    }

    // Get paginated data, total count, and summary stats
    const [data, total, activeCount, inactiveCount] = await Promise.all([
      this.prisma.kasir.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        where: whereClause
      }),
      this.prisma.kasir.count({ where: whereClause }),
      this.prisma.kasir.count({
        where: whereClause ? { ...whereClause, isActive: true } : { isActive: true }
      }),
      this.prisma.kasir.count({
        where: whereClause ? { ...whereClause, isActive: false } : { isActive: false }
      })
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      summary: {
        total,
        active: activeCount,
        inactive: inactiveCount
      }
    }
  }

  /**
   * Update kasir data
   */
  async updateKasir(id: string, data: UpdateKasirRequest): Promise<Kasir> {
    // Check if kasir exists
    const existingKasir = await this.prisma.kasir.findUnique({
      where: { id }
    })

    if (!existingKasir) {
      throw new Error('Kasir tidak ditemukan')
    }

    // Update kasir
    const updatedKasir = await this.prisma.kasir.update({
      where: { id },
      data: {
        ...(data.nama && { nama: data.nama }),
        ...(data.isActive !== undefined && { isActive: data.isActive })
      }
    })

    // Log audit trail
    await this.auditService.logKasirActivity(
      'update',
      id,
      existingKasir,
      updatedKasir,
      {
        operation: 'cashier_update',
        changedFields: Object.keys(data),
        requestData: data
      }
    )

    return updatedKasir
  }

  /**
   * Find kasir by name
   * Used for quick lookup during transaction creation
   */
  async findKasirByName(nama: string): Promise<Kasir | null> {
    return await this.prisma.kasir.findFirst({
      where: { nama: { contains: nama, mode: 'insensitive' } }
    })
  }

  /**
   * Deactivate kasir (soft delete by setting isActive to false)
   * Kasir with active transactions cannot be deactivated
   */
  async deactivateKasir(id: string): Promise<Kasir> {
    const existingKasir = await this.prisma.kasir.findUnique({
      where: { id },
      include: {
        transaksi: {
          where: { status: 'active' }
        }
      }
    })

    if (!existingKasir) {
      throw new Error('Kasir tidak ditemukan')
    }

    // Check if kasir has active transactions
    if (existingKasir.transaksi.length > 0) {
      throw new Error('Tidak dapat menonaktifkan kasir yang memiliki transaksi aktif')
    }

    // Deactivate kasir
    const deactivatedKasir = await this.prisma.kasir.update({
      where: { id },
      data: { isActive: false }
    })

    // Log audit trail
    await this.auditService.logKasirActivity(
      'update',
      id,
      existingKasir,
      deactivatedKasir,
      {
        operation: 'cashier_deactivation',
        reason: 'Soft delete by setting isActive to false'
      }
    )

    return deactivatedKasir
  }

  /**
   * Reactivate kasir (set isActive back to true)
   */
  async reactivateKasir(id: string): Promise<Kasir> {
    const existingKasir = await this.prisma.kasir.findUnique({
      where: { id }
    })

    if (!existingKasir) {
      throw new Error('Kasir tidak ditemukan')
    }

    // Reactivate kasir
    const reactivatedKasir = await this.prisma.kasir.update({
      where: { id },
      data: { isActive: true }
    })

    // Log audit trail
    await this.auditService.logKasirActivity(
      'update',
      id,
      existingKasir,
      reactivatedKasir,
      {
        operation: 'cashier_reactivation',
        reason: 'Restoring kasir access'
      }
    )

    return reactivatedKasir
  }

  /**
   * Get kasir statistics
   */
  async getKasirStats(): Promise<{
    totalKasir: number
    activeKasir: number
    inactiveKasir: number
    newThisMonth: number
    totalTransactions: number
  }> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [totalKasir, activeKasir, inactiveKasir, newThisMonth, totalTransactions] = await Promise.all([
      this.prisma.kasir.count(),
      this.prisma.kasir.count({ where: { isActive: true } }),
      this.prisma.kasir.count({ where: { isActive: false } }),
      this.prisma.kasir.count({
        where: {
          createdAt: { gte: startOfMonth }
        }
      }),
      this.prisma.transaksi.count({
        where: {
          kasirId: { not: null }
        }
      })
    ])

    return {
      totalKasir,
      activeKasir,
      inactiveKasir,
      newThisMonth,
      totalTransactions
    }
  }

  /**
   * Get active kasir list for dropdown/selection (limited data based on user role)
   */
  async getActiveKasir(): Promise<Array<{
    id: string
    nama: string
    isActive: boolean
  }>> {
    return await this.prisma.kasir.findMany({
      where: { isActive: true },
      orderBy: { nama: 'asc' },
      select: {
        id: true,
        nama: true,
        isActive: true
      }
    })
  }

  /**
   * Get kasir by ID for individual operations
   */
  async getKasirById(id: string): Promise<Kasir | null> {
    return await this.prisma.kasir.findUnique({
      where: { id }
    })
  }

  /**
   * Validate if kasir has active transactions (business rule protection)
   */
  async validateNoActiveTransactions(kasirId: string): Promise<void> {
    const activeTransactionCount = await this.prisma.transaksi.count({
      where: {
        kasirId,
        status: { in: ['active', 'diambil'] }
      }
    })

    if (activeTransactionCount > 0) {
      throw new Error(
        `Tidak dapat menonaktifkan kasir. Masih ada ${activeTransactionCount} transaksi aktif.`
      )
    }
  }

  /**
   * Delete kasir (hard delete with protection)
   */
  async deleteKasir(id: string): Promise<void> {
    // Validate kasir exists
    const kasir = await this.getKasirById(id)
    if (!kasir) {
      throw new Error('Kasir tidak ditemukan')
    }

    // Validate no active transactions
    await this.validateNoActiveTransactions(id)

    // Delete related data (audit logs will be preserved)
    await this.prisma.kasir.delete({
      where: { id }
    })

    // Log audit trail before deletion
    await this.auditService.logKasirActivity(
      'delete',
      id,
      kasir,
      null,
      {
        operation: 'cashier_deletion',
        reason: 'Permanent deletion of kasir record'
      }
    )
  }

  /**
   * Get kasir list for selection with role-based data filtering
   * - Full data for admin/producer/owner
   * - Limited data for kasir role (privacy protection)
   */
  async getKasirForSelection(): Promise<Array<{
    id: string
    nama: string
    isActive: boolean
  }>> {
    return await this.prisma.kasir.findMany({
      where: { isActive: true },
      orderBy: { nama: 'asc' },
      select: {
        id: true,
        nama: true,
        isActive: true
      }
    })
  }
}