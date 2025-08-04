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
  TransaksiQueryParams,
} from '../lib/validation/kasirSchema'
import { TransactionCodeGenerator } from '../lib/utils/codeGenerator'
import { PriceCalculator } from '../lib/utils/server'
import { createAvailabilityService, AvailabilityService } from './availabilityService'
import { calculateAvailableStock } from '../lib/typeUtils'

export interface TransaksiWithDetails extends Transaksi {
  penyewa: {
    id: string
    nama: string
    telepon: string
    alamat: string
  }
  items: Array<{
    id: string
    produkId: string
    produk: {
      id: string
      code: string
      name: string
      modalAwal: Decimal // Added for penalty calculation
      imageUrl?: string | null
      size?: string | null
      color?: {
        id: string
        name: string
      } | null
      category?: {
        id: string
        name: string
      } | null
    }
    jumlah: number
    jumlahDiambil: number
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
    private userId: string,
  ) {
    this.codeGenerator = new TransactionCodeGenerator(prisma)
    this.availabilityService = createAvailabilityService(prisma)
  }

  /**
   * Create new transaction with auto-generated code
   */
  async createTransaksi(data: CreateTransaksiRequest): Promise<Transaksi> {
    // 🔍 LOG: Transaction creation start
    console.log('[TransaksiService] 🚀 Starting transaction creation', {
      penyewaId: data.penyewaId,
      itemCount: data.items.length,
      items: data.items.map((item) => ({
        produkId: item.produkId,
        jumlah: item.jumlah,
        durasi: item.durasi,
      })),
      tglMulai: data.tglMulai,
      metodeBayar: data.metodeBayar,
      timestamp: new Date().toISOString(),
    })

    // 1. Validate penyewa exists
    const penyewa = await this.prisma.penyewa.findUnique({
      where: { id: data.penyewaId },
    })

    if (!penyewa) {
      console.log('[TransaksiService] ❌ Penyewa not found', { penyewaId: data.penyewaId })
      throw new Error('Penyewa tidak ditemukan')
    }

    // 🔍 LOG: Penyewa validation success
    console.log('[TransaksiService] ✅ Penyewa validated', {
      penyewaId: penyewa.id,
      penyewaNama: penyewa.nama,
      timestamp: new Date().toISOString(),
    })

    // 2. Validate product availability using availability service
    // 🔍 LOG: Starting availability validation
    console.log('[TransaksiService] 🔄 Validating product availability', {
      items: data.items.map((item) => ({
        productId: item.produkId,
        requestedQuantity: item.jumlah,
      })),
      checkDate: new Date(data.tglMulai).toISOString(),
      timestamp: new Date().toISOString(),
    })

    const availabilityCheck = await this.availabilityService.validateTransactionItems(
      data.items.map((item) => ({
        productId: item.produkId,
        quantity: item.jumlah,
      })),
      new Date(data.tglMulai),
    )

    // 🔍 LOG: Availability validation result
    console.log('[TransaksiService] 📊 Availability validation result', {
      isValid: availabilityCheck.valid,
      errors: availabilityCheck.errors,
      warnings: availabilityCheck.warnings,
      timestamp: new Date().toISOString(),
    })

    if (!availabilityCheck.valid) {
      console.log('[TransaksiService] ❌ Availability validation failed', {
        errors: availabilityCheck.errors,
      })
      throw new Error(availabilityCheck.errors[0])
    }

    // 3. Get product data for pricing
    const productIds = data.items.map((item) => item.produkId)
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
        status: 'AVAILABLE',
      },
    })

    if (products.length !== productIds.length) {
      const foundIds = products.map((p) => p.id)
      const missingIds = productIds.filter((id) => !foundIds.includes(id))
      throw new Error(`Produk dengan ID ${missingIds[0]} tidak tersedia`)
    }

    // 4. Calculate prices
    const itemsWithPrices = data.items.map((item) => {
      const product = products.find((p) => p.id === item.produkId)!
      return {
        produkId: item.produkId,
        jumlah: item.jumlah,
        durasi: item.durasi,
        hargaSewa: product.currentPrice,
      }
    })

    const priceCalculation = PriceCalculator.calculateTransactionTotal(itemsWithPrices)

    // 5. Generate transaction code
    const kode = await this.codeGenerator.generateTransactionCode()

    // 6. Create transaction with items in a database transaction
    // 🔍 LOG: Starting database transaction
    console.log('[TransaksiService] 🗄️ Starting database transaction', {
      transactionCode: kode,
      totalHarga: priceCalculation.totalHarga.toString(),
      itemCount: data.items.length,
      timestamp: new Date().toISOString(),
    })

    const transaksi = await this.prisma.$transaction(async (tx) => {
      // 🔍 LOG: Creating main transaction record
      console.log('[TransaksiService] 📝 Creating transaksi record', {
        kode,
        penyewaId: data.penyewaId,
        totalHarga: priceCalculation.totalHarga.toString(),
        timestamp: new Date().toISOString(),
      })

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
          createdBy: this.userId,
        },
      })

      // 🔍 LOG: Main transaction created
      console.log('[TransaksiService] ✅ Transaksi record created', {
        transaksiId: createdTransaksi.id,
        kode: createdTransaksi.kode,
        timestamp: new Date().toISOString(),
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
          kondisiAwal: item.kondisiAwal || null,
        }
      })

      // 🔍 LOG: Creating transaction items
      console.log('[TransaksiService] 📋 Creating transaction items', {
        itemsCount: itemsData.length,
        items: itemsData.map((item) => ({
          produkId: item.produkId,
          jumlah: item.jumlah,
          hargaSewa: item.hargaSewa.toString(),
        })),
        timestamp: new Date().toISOString(),
      })

      await tx.transaksiItem.createMany({
        data: itemsData,
      })

      // 🔍 LOG: Transaction items created
      console.log('[TransaksiService] ✅ Transaction items created successfully', {
        itemsCount: itemsData.length,
        timestamp: new Date().toISOString(),
      })

      // ✅ FIXED: Implement stock reduction logic
      console.log('[TransaksiService] 🔄 Now implementing stock reduction logic', {
        message: 'Executing product quantity updates for rented items',
        items: data.items.map((item) => ({
          productId: item.produkId,
          rentedQuantity: item.jumlah,
        })),
        timestamp: new Date().toISOString(),
      })

      // Update product quantities - THIS IS THE FIX!
      await this.updateProductQuantities(tx, data.items)

      // Create activity log
      await tx.aktivitasTransaksi.create({
        data: {
          transaksiId: createdTransaksi.id,
          tipe: 'dibuat',
          deskripsi: `Transaksi ${kode} dibuat`,
          data: {
            items: data.items.length,
            totalHarga: priceCalculation.totalHarga.toString(),
          },
          createdBy: this.userId,
        },
      })

      // 🔍 LOG: Activity log created
      console.log('[TransaksiService] 📝 Activity log created', {
        transaksiId: createdTransaksi.id,
        activityType: 'dibuat',
        timestamp: new Date().toISOString(),
      })

      return createdTransaksi
    })

    // 🔍 LOG: Database transaction completed
    console.log('[TransaksiService] ✅ Database transaction completed successfully', {
      transaksiId: transaksi.id,
      kode: transaksi.kode,
      status: transaksi.status,
      timestamp: new Date().toISOString(),
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
            alamat: true,
          },
        },
        items: {
          include: {
            produk: {
              select: {
                id: true,
                code: true,
                name: true,
                modalAwal: true, // Added for penalty calculation
                imageUrl: true,
                size: true,
                color: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        pembayaran: {
          orderBy: { createdAt: 'desc' },
        },
        aktivitas: {
          orderBy: { createdAt: 'desc' },
        },
      },
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
            alamat: true,
          },
        },
        items: {
          include: {
            produk: {
              select: {
                id: true,
                code: true,
                name: true,
                modalAwal: true, // Added for penalty calculation
                imageUrl: true,
                size: true,
                color: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        pembayaran: {
          orderBy: { createdAt: 'desc' },
        },
        aktivitas: {
          orderBy: { createdAt: 'desc' },
        },
      },
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
        { penyewa: { telepon: { contains: search, mode: 'insensitive' } } },
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
              alamat: true,
            },
          },
          items: {
            include: {
              produk: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  imageUrl: true,
                },
              },
            },
          },
          pembayaran: {
            orderBy: { createdAt: 'desc' },
          },
          aktivitas: {
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      this.prisma.transaksi.count({
        where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      }),
      this.getTransaksiStats(),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: data as unknown as TransaksiWithDetails[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      summary,
    }
  }

  /**
   * Update transaction status and related data
   */
  async updateTransaksiStatus(id: string, data: UpdateTransaksiRequest): Promise<Transaksi> {
    // Check if transaction exists
    const existingTransaksi = await this.prisma.transaksi.findUnique({
      where: { id },
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
          ...(data.catatan !== undefined && { catatan: data.catatan }),
        },
      })

      // Handle stock restoration for cancelled or completed transactions
      if (data.status && data.status !== existingTransaksi.status) {
        if (data.status === 'cancelled') {
          // 🔍 LOG: Transaction cancelled, restoring stock
          console.log('[TransaksiService] 🔄 Transaction cancelled, restoring product quantities', {
            transaksiId: id,
            previousStatus: existingTransaksi.status,
            newStatus: data.status,
            timestamp: new Date().toISOString(),
          })

          await this.restoreProductQuantities(tx, id, 'cancelled')
        } else if (data.status === 'selesai') {
          // 🔍 LOG: Transaction completed, checking for partial returns
          console.log('[TransaksiService] 🔄 Transaction completed, processing returns', {
            transaksiId: id,
            previousStatus: existingTransaksi.status,
            newStatus: data.status,
            timestamp: new Date().toISOString(),
          })

          await this.restoreProductQuantities(tx, id, 'returned')
        }

        // Create activity log
        await tx.aktivitasTransaksi.create({
          data: {
            transaksiId: id,
            tipe: this.getActivityTypeFromStatus(data.status),
            deskripsi: `Status transaksi diubah menjadi ${data.status}`,
            data: {
              previousStatus: existingTransaksi.status,
              newStatus: data.status,
            },
            createdBy: this.userId,
          },
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
        status: true,
      },
    })

    const result = {
      totalActive: 0,
      totalSelesai: 0,
      totalTerlambat: 0,
      totalCancelled: 0,
    }

    stats.forEach((stat) => {
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
      active: ['selesai', 'terlambat', 'cancelled'],
      terlambat: ['selesai', 'cancelled'],
      // 'selesai' and 'cancelled' are final states
      selesai: [],
      cancelled: [],
    }

    const allowedTransitions = validTransitions[currentStatus] || []

    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(`Tidak dapat mengubah status dari ${currentStatus} ke ${newStatus}`)
    }
  }

  /**
   * Update product quantities when items are rented
   * @private
   */
  private async updateProductQuantities(
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: any, // Prisma transaction type
    items: CreateTransaksiRequest['items'],
  ): Promise<void> {
    // 🔍 LOG: Starting stock reduction
    console.log('[TransaksiService] 🔄 Starting product quantity updates', {
      itemCount: items.length,
      items: items.map((item) => ({
        productId: item.produkId,
        quantityToReduce: item.jumlah,
      })),
      timestamp: new Date().toISOString(),
    })

    for (const item of items) {
      // 🔍 LOG: Processing individual product
      console.log('[TransaksiService] 📦 Processing product quantity update', {
        productId: item.produkId,
        quantityToReduce: item.jumlah,
        timestamp: new Date().toISOString(),
      })

      // Get current product state for validation (including new inventory fields)
      const currentProduct = await tx.product.findUnique({
        where: { id: item.produkId },
        select: {
          id: true,
          quantity: true, // Total inventory (unchanged)
          rentedStock: true, // Currently rented out
          name: true,
        },
      })

      if (!currentProduct) {
        const error = `Product ${item.produkId} not found during stock update`
        console.log('[TransaksiService] ❌ Product not found', {
          productId: item.produkId,
          error,
        })
        throw new Error(error)
      }

      // Double-check availability using calculated availableStock (race condition protection)
      const availableStock = calculateAvailableStock(currentProduct.quantity, currentProduct.rentedStock)
      if (availableStock < item.jumlah) {
        const error = `Insufficient stock for product ${currentProduct.name}. Available: ${availableStock}, Requested: ${item.jumlah}`
        console.log('[TransaksiService] ❌ Insufficient stock during update', {
          productId: item.produkId,
          productName: currentProduct.name,
          available: availableStock,
          requested: item.jumlah,
          error,
        })
        throw new Error(error)
      }

      // UPDATED: Use rentedStock field only (availableStock calculated)
      // quantity field remains unchanged (total inventory)
      // Only update rentedStock, availableStock calculated as (quantity - rentedStock)
      const updateResult = await tx.product.updateMany({
        where: {
          id: item.produkId,
          rentedStock: { lte: currentProduct.quantity - item.jumlah }, // Ensure sufficient stock
        },
        data: {
          rentedStock: {
            increment: item.jumlah, // Increase rented stock
          },
          // quantity field stays the same (total inventory unchanged)
          // availableStock now calculated as (quantity - rentedStock)
        },
      })

      // Verify the update was successful
      if (updateResult.count === 0) {
        const error = `Failed to update quantity for product ${currentProduct.name}. Product may have been modified by another transaction.`
        console.log('[TransaksiService] ❌ Stock update failed (race condition)', {
          productId: item.produkId,
          productName: currentProduct.name,
          requestedReduction: item.jumlah,
          error,
        })
        throw new Error(error)
      }

      // 🔍 LOG: Successful inventory tracking update
      const previousAvailable = calculateAvailableStock(currentProduct.quantity, currentProduct.rentedStock)
      console.log('[TransaksiService] ✅ Product inventory updated successfully', {
        productId: item.produkId,
        productName: currentProduct.name,
        totalInventory: currentProduct.quantity, // Unchanged
        previousAvailable,  // Calculated
        previousRented: currentProduct.rentedStock,
        rentedQuantity: item.jumlah,
        newAvailable: previousAvailable - item.jumlah,  // Calculated
        newRented: currentProduct.rentedStock + item.jumlah,
        timestamp: new Date().toISOString(),
      })
    }

    // 🔍 LOG: All stock reductions completed
    console.log('[TransaksiService] ✅ All product quantities updated successfully', {
      totalProductsUpdated: items.length,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Restore product quantities when items are returned or transaction is cancelled
   * @private
   */
  private async restoreProductQuantities(
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: any, // Prisma transaction type
    transaksiId: string,
    reason: 'cancelled' | 'returned' = 'returned',
  ): Promise<void> {
    // 🔍 LOG: Starting stock restoration
    console.log('[TransaksiService] 🔄 Starting product quantity restoration', {
      transaksiId,
      reason,
      timestamp: new Date().toISOString(),
    })

    // Get transaction items to restore
    const transaksiItems = await tx.transaksiItem.findMany({
      where: { transaksiId },
      include: {
        produk: {
          select: {
            id: true,
            name: true,
            quantity: true, // Total inventory (unchanged)
            rentedStock: true, // Currently rented
          },
        },
      },
    })

    for (const item of transaksiItems) {
      const quantityToRestore =
        reason === 'cancelled'
          ? item.jumlah // Restore full quantity if cancelled
          : item.jumlah - (item.jumlahDiambil || 0) // Only restore non-returned items

      if (quantityToRestore > 0) {
        // UPDATED: Restore inventory using rentedStock field only
        // quantity field remains unchanged (total inventory)
        // Only update rentedStock, availableStock calculated as (quantity - rentedStock)
        await tx.product.update({
          where: { id: item.produkId },
          data: {
            rentedStock: {
              decrement: quantityToRestore, // Reduce rented stock
            },
            // quantity field stays the same (total inventory unchanged)
          },
        })

        // 🔍 LOG: Stock restored
        console.log('[TransaksiService] ✅ Product quantity restored', {
          productId: item.produkId,
          productName: item.produk.name,
          restoredQuantity: quantityToRestore,
          reason,
          timestamp: new Date().toISOString(),
        })
      }
    }

    console.log('[TransaksiService] ✅ Product quantity restoration completed', {
      transaksiId,
      itemsProcessed: transaksiItems.length,
      reason,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Get activity type based on status change
   */
  private getActivityTypeFromStatus(status: string): string {
    const activityMap: Record<string, string> = {
      active: 'dibuat',
      selesai: 'dikembalikan',
      terlambat: 'terlambat',
      cancelled: 'dibatalkan',
    }

    return activityMap[status] || 'diperbarui'
  }
}
