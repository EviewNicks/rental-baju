/**
 * TransaksiService - RPK-26
 * Service layer for transaction (transaksi) CRUD operations
 * Following TDD approach and business logic requirements
 */

import { PrismaClient, Transaksi } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { 
  CreateTransaksiRequest, 
  UpdateTransaksiRequest, 
  TransaksiQueryParams 
} from '../lib/validation/kasirSchema'
import { TransactionCodeGenerator } from '../lib/utils/codeGenerator'
import { PriceCalculator } from '../lib/utils/priceCalculator'
import { createAvailabilityService, AvailabilityService } from './availabilityService'

export interface TransaksiWithDetails extends Transaksi {
  penyewa: {
    id: string
    nama: string
    telepon: string
    alamat: string
  }
  items: Array<{
    id: string
    produk: {
      id: string
      code: string
      name: string
      imageUrl?: string | null
    }
    jumlah: number
    hargaSewa: Decimal
    durasi: number
    subtotal: Decimal
    kondisiAwal?: string | null
    kondisiAkhir?: string | null
    statusKembali: string
  }>
  pembayaran: Array<{
    id: string
    jumlah: Decimal
    metode: string
    referensi?: string | null
    catatan?: string | null
    createdBy: string
    createdAt: Date
  }>
  aktivitas: Array<{
    id: string
    tipe: string
    deskripsi: string
    data?: Record<string, unknown>
    createdBy: string
    createdAt: Date
  }>
}

export interface TransaksiListResponse {
  data: TransaksiWithDetails[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  summary: {
    totalActive: number
    totalSelesai: number
    totalTerlambat: number
    totalCancelled: number
  }
}

export class TransaksiService {
  private codeGenerator: TransactionCodeGenerator
  private availabilityService: AvailabilityService

  constructor(
    private prisma: PrismaClient,
    private userId: string
  ) {
    this.codeGenerator = new TransactionCodeGenerator(prisma)
    this.availabilityService = createAvailabilityService(prisma)
  }

  /**
   * Create new transaction with auto-generated code
   */
  async createTransaksi(data: CreateTransaksiRequest): Promise<Transaksi> {
    // 1. Validate penyewa exists
    const penyewa = await this.prisma.penyewa.findUnique({
      where: { id: data.penyewaId }
    })

    if (!penyewa) {
      throw new Error('Penyewa tidak ditemukan')
    }

    // 2. Validate product availability using availability service
    const availabilityCheck = await this.availabilityService.validateTransactionItems(
      data.items.map(item => ({
        productId: item.produkId,
        quantity: item.jumlah
      })),
      new Date(data.tglMulai)
    )

    if (!availabilityCheck.valid) {
      throw new Error(availabilityCheck.errors[0])
    }

    // 3. Get product data for pricing
    const productIds = data.items.map(item => item.produkId)
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
        status: 'AVAILABLE'
      }
    })

    if (products.length !== productIds.length) {
      const foundIds = products.map(p => p.id)
      const missingIds = productIds.filter(id => !foundIds.includes(id))
      throw new Error(`Produk dengan ID ${missingIds[0]} tidak tersedia`)
    }

    // 4. Calculate prices
    const itemsWithPrices = data.items.map(item => {
      const product = products.find(p => p.id === item.produkId)!
      return {
        produkId: item.produkId,
        jumlah: item.jumlah,
        durasi: item.durasi,
        hargaSewa: product.hargaSewa
      }
    })

    const priceCalculation = PriceCalculator.calculateTransactionTotal(itemsWithPrices)

    // 5. Generate transaction code
    const kode = await this.codeGenerator.generateTransactionCode()

    // 6. Create transaction with items in a database transaction
    const transaksi = await this.prisma.$transaction(async (tx) => {
      // Create main transaction
      const createdTransaksi = await tx.transaksi.create({
        data: {
          kode,
          penyewaId: data.penyewaId,
          status: 'active',
          totalHarga: priceCalculation.totalHarga,
          jumlahBayar: new Decimal(0),
          sisaBayar: priceCalculation.totalHarga,
          tglMulai: new Date(data.tglMulai),
          tglSelesai: data.tglSelesai ? new Date(data.tglSelesai) : null,
          metodeBayar: data.metodeBayar || 'tunai',
          catatan: data.catatan || null,
          createdBy: this.userId
        }
      })

      // Create transaction items
      const itemsData = data.items.map((item, index) => {
        const calculation = priceCalculation.itemCalculations[index]
        return {
          transaksiId: createdTransaksi.id,
          produkId: item.produkId,
          jumlah: item.jumlah,
          hargaSewa: calculation.hargaSewa,
          durasi: item.durasi,
          subtotal: calculation.subtotal,
          kondisiAwal: item.kondisiAwal || null
        }
      })

      await tx.transaksiItem.createMany({
        data: itemsData
      })

      // Create activity log
      await tx.aktivitasTransaksi.create({
        data: {
          transaksiId: createdTransaksi.id,
          tipe: 'dibuat',
          deskripsi: `Transaksi ${kode} dibuat`,
          data: {
            items: data.items.length,
            totalHarga: priceCalculation.totalHarga.toString()
          },
          createdBy: this.userId
        }
      })

      return createdTransaksi
    })

    return transaksi
  }

  /**
   * Get transaction by ID with full details
   */
  async getTransaksiById(id: string): Promise<TransaksiWithDetails> {
    const transaksi = await this.prisma.transaksi.findUnique({
      where: { id },
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

    if (!transaksi) {
      throw new Error('Transaksi tidak ditemukan')
    }

    return transaksi as TransaksiWithDetails
  }

  /**
   * Get transaction by code
   */
  async getTransaksiByCode(kode: string): Promise<TransaksiWithDetails> {
    const transaksi = await this.prisma.transaksi.findUnique({
      where: { kode },
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

    if (!transaksi) {
      throw new Error('Transaksi tidak ditemukan')
    }

    return transaksi as TransaksiWithDetails
  }

  /**
   * Get paginated list of transactions with filters
   */
  async getTransaksiList(params: TransaksiQueryParams): Promise<TransaksiListResponse> {
    const { page, limit, status, search, penyewaId, dateStart, dateEnd } = params
    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: Record<string, unknown> = {}

    if (status) {
      whereClause.status = status
    }

    if (penyewaId) {
      whereClause.penyewaId = penyewaId
    }

    if (dateStart || dateEnd) {
      whereClause.createdAt = {}
      if (dateStart) (whereClause.createdAt as Record<string, Date>).gte = new Date(dateStart)
      if (dateEnd) (whereClause.createdAt as Record<string, Date>).lte = new Date(dateEnd)
    }

    if (search) {
      whereClause.OR = [
        { kode: { contains: search, mode: 'insensitive' } },
        { penyewa: { nama: { contains: search, mode: 'insensitive' } } },
        { penyewa: { telepon: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Get data and summary in parallel
    const [data, total, summary] = await Promise.all([
      this.prisma.transaksi.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
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
      }),
      this.prisma.transaksi.count({
        where: Object.keys(whereClause).length > 0 ? whereClause : undefined
      }),
      this.getTransaksiStats()
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: data as TransaksiWithDetails[],
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      summary
    }
  }

  /**
   * Update transaction status and related data
   */
  async updateTransaksiStatus(id: string, data: UpdateTransaksiRequest): Promise<Transaksi> {
    // Check if transaction exists
    const existingTransaksi = await this.prisma.transaksi.findUnique({
      where: { id }
    })

    if (!existingTransaksi) {
      throw new Error('Transaksi tidak ditemukan')
    }

    // Validate status transitions
    if (data.status) {
      this.validateStatusTransition(existingTransaksi.status, data.status)
    }

    // Update transaction in a database transaction
    const updatedTransaksi = await this.prisma.$transaction(async (tx) => {
      // Update main transaction
      const updated = await tx.transaksi.update({
        where: { id },
        data: {
          ...(data.status && { status: data.status }),
          ...(data.tglKembali && { tglKembali: new Date(data.tglKembali) }),
          ...(data.catatan !== undefined && { catatan: data.catatan })
        }
      })

      // Create activity log
      if (data.status && data.status !== existingTransaksi.status) {
        await tx.aktivitasTransaksi.create({
          data: {
            transaksiId: id,
            tipe: this.getActivityTypeFromStatus(data.status),
            deskripsi: `Status transaksi diubah menjadi ${data.status}`,
            data: {
              previousStatus: existingTransaksi.status,
              newStatus: data.status
            },
            createdBy: this.userId
          }
        })
      }

      return updated
    })

    return updatedTransaksi
  }

  /**
   * Get transaction statistics
   */
  async getTransaksiStats(): Promise<{
    totalActive: number
    totalSelesai: number
    totalTerlambat: number
    totalCancelled: number
  }> {
    const stats = await this.prisma.transaksi.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })

    const result = {
      totalActive: 0,
      totalSelesai: 0,
      totalTerlambat: 0,
      totalCancelled: 0
    }

    stats.forEach(stat => {
      switch (stat.status) {
        case 'active':
          result.totalActive = stat._count.status
          break
        case 'selesai':
          result.totalSelesai = stat._count.status
          break
        case 'terlambat':
          result.totalTerlambat = stat._count.status
          break
        case 'cancelled':
          result.totalCancelled = stat._count.status
          break
      }
    })

    return result
  }

  /**
   * Validate status transitions according to business rules
   */
  private validateStatusTransition(currentStatus: string, newStatus: string): void {
    const validTransitions: Record<string, string[]> = {
      'active': ['selesai', 'terlambat', 'cancelled'],
      'terlambat': ['selesai', 'cancelled'],
      // 'selesai' and 'cancelled' are final states
      'selesai': [],
      'cancelled': []
    }

    const allowedTransitions = validTransitions[currentStatus] || []
    
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(`Tidak dapat mengubah status dari ${currentStatus} ke ${newStatus}`)
    }
  }

  /**
   * Get activity type based on status change
   */
  private getActivityTypeFromStatus(status: string): string {
    const activityMap: Record<string, string> = {
      'active': 'dibuat',
      'selesai': 'dikembalikan',
      'terlambat': 'terlambat',
      'cancelled': 'dibatalkan'
    }

    return activityMap[status] || 'diperbarui'
  }
}