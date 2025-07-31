/**
 * PenyewaService - RPK-26
 * Service layer for customer (penyewa) CRUD operations
 * Following TDD approach and existing patterns from manage-product
 */

import { PrismaClient, Penyewa } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { 
  CreatePenyewaRequest, 
  UpdatePenyewaRequest, 
  PenyewaQueryParams 
} from '../lib/validation/kasirSchema'
import { createAuditService, AuditService } from './auditService'

export interface PenyewaWithTransactions extends Penyewa {
  transaksi?: Array<{
    id: string
    kode: string
    status: string
    totalHarga: number | Decimal
    createdAt: Date
  }>
}

export interface PenyewaListResponse {
  data: Penyewa[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export class PenyewaService {
  private auditService: AuditService

  constructor(
    private prisma: PrismaClient,
    private userId: string,
    private userRole?: string
  ) {
    this.auditService = createAuditService(prisma, userId, userRole)
  }

  /**
   * Create new penyewa (customer)
   * Validates phone number uniqueness
   */
  async createPenyewa(data: CreatePenyewaRequest): Promise<Penyewa> {
    // Check if phone number already exists
    const existingPenyewa = await this.prisma.penyewa.findUnique({
      where: { telepon: data.telepon }
    })

    if (existingPenyewa) {
      throw new Error('Nomor telepon sudah terdaftar')
    }

    // Create new penyewa
    const penyewa = await this.prisma.penyewa.create({
      data: {
        nama: data.nama,
        telepon: data.telepon,
        alamat: data.alamat,
        email: data.email || null,
        nik: data.nik || null,
        foto: data.foto || null,
        catatan: data.catatan || null
      }
    })

    // Log audit trail
    await this.auditService.logPenyewaActivity(
      'create',
      penyewa.id,
      undefined,
      penyewa,
      { 
        operation: 'customer_registration',
        requestData: data
      }
    )

    return penyewa
  }

  /**
   * Get penyewa by ID with recent transactions
   */
  async getPenyewaById(id: string): Promise<PenyewaWithTransactions> {
    const penyewa = await this.prisma.penyewa.findUnique({
      where: { id },
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
          take: 5 // Get last 5 transactions
        }
      }
    })

    if (!penyewa) {
      throw new Error('Penyewa tidak ditemukan')
    }

    return penyewa
  }

  /**
   * Get paginated list of penyewa with optional search
   */
  async getPenyewaList(params: PenyewaQueryParams): Promise<PenyewaListResponse> {
    const { page, limit, search } = params
    const skip = (page - 1) * limit

    // Build where clause for search
    let whereClause: Record<string, unknown> | undefined = undefined
    if (search) {
      whereClause = {
        OR: [
          { nama: { contains: search, mode: 'insensitive' } },
          { telepon: { contains: search, mode: 'insensitive' } }
        ]
      }
    }

    // Get paginated data and total count
    const [data, total] = await Promise.all([
      this.prisma.penyewa.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        where: whereClause
      }),
      this.prisma.penyewa.count({ where: whereClause })
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }
  }

  /**
   * Update penyewa data
   */
  async updatePenyewa(id: string, data: UpdatePenyewaRequest): Promise<Penyewa> {
    // Check if penyewa exists
    const existingPenyewa = await this.prisma.penyewa.findUnique({
      where: { id }
    })

    if (!existingPenyewa) {
      throw new Error('Penyewa tidak ditemukan')
    }

    // If updating phone number, check uniqueness
    if (data.telepon) {
      const existingPhone = await this.prisma.penyewa.findUnique({
        where: { telepon: data.telepon }
      })

      if (existingPhone && existingPhone.id !== id) {
        throw new Error('Nomor telepon sudah terdaftar')
      }
    }

    // Update penyewa
    const updatedPenyewa = await this.prisma.penyewa.update({
      where: { id },
      data: {
        ...(data.nama && { nama: data.nama }),
        ...(data.telepon && { telepon: data.telepon }),
        ...(data.alamat && { alamat: data.alamat }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.nik !== undefined && { nik: data.nik || null }),
        ...(data.foto !== undefined && { foto: data.foto || null }),
        ...(data.catatan !== undefined && { catatan: data.catatan || null })
      }
    })

    // Log audit trail
    await this.auditService.logPenyewaActivity(
      'update',
      id,
      existingPenyewa,
      updatedPenyewa,
      {
        operation: 'customer_update',
        changedFields: Object.keys(data),
        requestData: data
      }
    )

    return updatedPenyewa
  }

  /**
   * Find penyewa by phone number
   * Used for quick lookup during transaction creation
   */
  async findPenyewaByPhone(telepon: string): Promise<Penyewa | null> {
    return await this.prisma.penyewa.findUnique({
      where: { telepon }
    })
  }

  /**
   * Delete penyewa (soft delete by making inactive)
   * Note: This is not implemented in the current requirements
   * but keeping for future extensibility
   */
  async deletePenyewa(id: string): Promise<void> {
    const existingPenyewa = await this.prisma.penyewa.findUnique({
      where: { id },
      include: {
        transaksi: {
          where: { status: 'active' }
        }
      }
    })

    if (!existingPenyewa) {
      throw new Error('Penyewa tidak ditemukan')
    }

    // Check if penyewa has active transactions
    if (existingPenyewa.transaksi.length > 0) {
      throw new Error('Tidak dapat menghapus penyewa yang memiliki transaksi aktif')
    }

    // For now, we'll do a hard delete since there's no isActive field
    // In production, consider adding isActive field for soft deletes
    await this.prisma.penyewa.delete({
      where: { id }
    })
  }

  /**
   * Get penyewa statistics
   */
  async getPenyewaStats(): Promise<{
    totalPenyewa: number
    newThisMonth: number
    activeTransactions: number
  }> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [totalPenyewa, newThisMonth, activeTransactions] = await Promise.all([
      this.prisma.penyewa.count(),
      this.prisma.penyewa.count({
        where: {
          createdAt: { gte: startOfMonth }
        }
      }),
      this.prisma.penyewa.count({
        where: {
          transaksi: {
            some: { status: 'active' }
          }
        }
      })
    ])

    return {
      totalPenyewa,
      newThisMonth,
      activeTransactions
    }
  }
}