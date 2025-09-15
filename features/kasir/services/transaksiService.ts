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
import type { TransactionStatus, TransaksiItemResponse } from '../types'
import { logger } from '@/services/logger'

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
    // TSK-24: Multi-condition return enhancements
    isMultiCondition?: boolean
    multiConditionSummary?: Record<string, unknown> | null
    totalReturnPenalty?: Decimal
    returnConditions?: Array<{
      id: string
      kondisiAkhir: string
      jumlahKembali: number
      penaltyAmount: Decimal
      modalAwalUsed?: Decimal | null
      createdAt: Date
      createdBy: string
    }>
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

// Minimal type for validation operations - only fields needed for return processing
export interface TransaksiForValidation {
  id: string
  kode: string
  status: string
  tglMulai: Date
  tglSelesai: Date | null
  sisaBayar: Decimal
  createdAt: Date
  updatedAt: Date
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
      modalAwal: Decimal
    }
    jumlah: number
    jumlahDiambil: number
    hargaSewa: Decimal
    durasi: number
    subtotal: Decimal
    kondisiAwal?: string | null
    statusKembali: string
  }>
  pembayaran: never[] // Empty for validation
  aktivitas: never[] // Empty for validation
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
    totalDiambil: number
    totalSelesai: number
    totalTerlambat: number
    totalCancelled: number
  }
}

/**
 * Calculate enhanced transaction status based on pickup status and business rules
 * Moved from frontend statusUtils to backend for consistent status processing
 * Priority: terlambat > cancelled > selesai > diambil > active
 *
 * @param baseStatus - Original status from database
 * @param items - Transaction items array to check pickup status
 * @param endDate - Optional end date to check for overdue status
 * @param hasPickup - Optional server-provided pickup flag for performance
 * @returns Enhanced status based on business logic
 */
function calculateEnhancedStatus(
  baseStatus: TransactionStatus,
  items: Array<{ jumlahDiambil: number; statusKembali?: string }> | undefined,
  endDate?: string | Date,
  hasPickup?: boolean
): TransactionStatus {
  const log = logger.child('transaksiService')

  log.debug('calculateEnhancedStatus', 'Starting backend status calculation', {
    baseStatus,
    itemsCount: items?.length || 0,
    endDate,
    endDateExists: !!endDate,
    hasPickupFlag: hasPickup,
    hasItems: !!items?.length,
    currentTime: new Date().toISOString()
  })

  // Priority 1: Check if explicit overdue status (terlambat)
  if (baseStatus === 'terlambat') {
    log.debug('calculateEnhancedStatus', 'Backend: Status is terlambat', { result: 'terlambat' })
    return 'terlambat'
  }

  // Priority 2: Check if cancelled
  if (baseStatus === 'cancelled') {
    log.debug('calculateEnhancedStatus', 'Backend: Status is cancelled', { result: 'cancelled' })
    return 'cancelled'
  }

  // Priority 3: Check if explicit completed status (selesai)
  if (baseStatus === 'selesai') {
    log.debug('calculateEnhancedStatus', 'Backend: Status is selesai', { result: 'selesai' })
    return 'selesai'
  }

  log.debug('calculateEnhancedStatus', 'Backend: Checking completion status FIRST (before overdue)')

  // Priority 4: Check if all items have been returned (auto-complete logic)
  // This runs BEFORE overdue check to prioritize completion over timing
  if (baseStatus === 'active' || baseStatus === 'diambil' || baseStatus === 'dikembalikan') {
    if (items && items.length > 0) {
      const itemStatuses = items.map(item => ({
        statusKembali: item.statusKembali,
        jumlahDiambil: item.jumlahDiambil
      }))

      const allItemsReturned = items.every(item => {
        // Check if this item has been fully returned using statusKembali
        return item.statusKembali === 'lengkap'
      })

      log.debug('calculateEnhancedStatus', 'Backend: Checking completion status', {
        baseStatus,
        totalItems: items.length,
        itemStatuses,
        allItemsReturned
      })

      if (allItemsReturned) {
        log.info('calculateEnhancedStatus', 'Backend: All items returned, marking as selesai (HIGHEST PRIORITY)', {
          result: 'selesai',
          baseStatus,
          totalItems: items.length,
          returnStatuses: items.map(item => item.statusKembali),
          businessRule: 'backend-completion-overrides-all-status'
        })
        return 'selesai'
      } else {
        log.debug('calculateEnhancedStatus', 'Backend: Not all items returned, continuing status checks', {
          totalItems: items.length,
          itemDetails: items.map(item => ({
            statusKembali: item.statusKembali,
            jumlahDiambil: item.jumlahDiambil
          }))
        })
      }
    }
  }

  // Priority 5: Check if current date is past end date (manual overdue check)
  // This runs AFTER completion check to allow completed transactions to show as 'selesai'
  if (endDate && (baseStatus === 'active' || baseStatus === 'diambil')) {
    const now = new Date()
    const dueDate = typeof endDate === 'string' ? new Date(endDate) : endDate
    const isOverdue = now > dueDate

    log.debug('calculateEnhancedStatus', 'Backend: Checking overdue status', {
      endDate,
      currentDate: now.toISOString(),
      dueDate: !isNaN(dueDate.getTime()) ? dueDate.toISOString() : 'Invalid Date',
      isOverdue,
      daysDifference: Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    })

    if (isOverdue && !isNaN(dueDate.getTime())) {
      log.info('calculateEnhancedStatus', 'Backend: Detected overdue transaction (AFTER completion check)', {
        endDate: dueDate.toISOString(),
        result: 'terlambat',
        reasonCompleted: false,
        statusFlow: 'backend-overdue-detection-after-completion'
      })
      return 'terlambat'
    }
  }

  // Priority 6: Check if any items have been picked up
  if (baseStatus === 'active') {
    // Use server flag if available, fallback to item parsing
    const pickupDetected = hasPickup ?? (items?.some(item => item.jumlahDiambil > 0) || false)

    log.debug('calculateEnhancedStatus', 'Backend: Checking pickup status', {
      hasPickupFlag: hasPickup,
      itemsAvailable: !!items?.length,
      itemBasedPickup: items?.some(item => item.jumlahDiambil > 0),
      finalPickupDetected: pickupDetected
    })

    if (pickupDetected) {
      log.info('calculateEnhancedStatus', 'Backend: Pickup detected, changing to diambil', {
        result: 'diambil',
        source: hasPickup !== undefined ? 'server-flag' : 'item-parsing'
      })
      return 'diambil'
    }
  }

  log.debug('calculateEnhancedStatus', 'Backend: Using base status', { result: baseStatus })
  return baseStatus
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
    // 1. Validate penyewa exists
    const penyewa = await this.prisma.penyewa.findUnique({
      where: { id: data.penyewaId },
    })

    if (!penyewa) {
      throw new Error('Penyewa tidak ditemukan')
    }

    const availabilityCheck = await this.availabilityService.validateTransactionItems(
      data.items.map((item) => ({
        productId: item.produkId,
        quantity: item.jumlah,
      })),
      new Date(data.tglMulai),
    )

    if (!availabilityCheck.valid) {
      console.error('[TransaksiService] ❌ Availability validation failed', {
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
          createdBy: this.userId,
        },
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

      await tx.transaksiItem.createMany({
        data: itemsData,
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

      return createdTransaksi
    })

    return transaksi
  }

  /**
   * Get transaction by ID with minimal data for return validation
   * Ultra-lean query to reduce validation time by ~70%
   */
  async getTransaksiForValidation(id: string): Promise<TransaksiForValidation> {
    const transaksi = await this.prisma.transaksi.findUnique({
      where: { id },
      select: {
        id: true,
        kode: true,
        status: true,
        tglMulai: true,
        tglSelesai: true,
        penyewa: {
          select: {
            id: true,
            nama: true,
            telepon: true,
            alamat: true,
          },
        },
        items: {
          select: {
            id: true,
            produkId: true,
            produk: {
              select: {
                id: true,
                code: true,
                name: true,
                modalAwal: true, // Only for penalty calculation
              },
            },
            jumlah: true,
            jumlahDiambil: true,
            hargaSewa: true,
            durasi: true,
            subtotal: true,
            kondisiAwal: true,
            statusKembali: true,
          },
        },
        // Minimal required fields for validation only
        sisaBayar: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!transaksi) {
      throw new Error('Transaksi tidak ditemukan')
    }

    // Cast to TransaksiForValidation with minimal required fields
    return {
      ...transaksi,
      pembayaran: [], // Not needed for validation
      aktivitas: [], // Not needed for validation
    } as TransaksiForValidation
  }

  /**
   * Get transaction by ID with minimal data for penalty calculation
   * Ultra-optimized query - only fields needed for penalty calculation (~80% faster)
   */
  async getTransaksiForPenaltyCalculation(id: string) {
    const transaksi = await this.prisma.transaksi.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        tglSelesai: true, // Required for late penalty calculation
        items: {
          select: {
            id: true,
            produk: {
              select: {
                name: true,
                modalAwal: true, // Required for lost item penalty calculation
              },
            },
            // No other fields needed for penalty calculation
          },
          // Include all items that were rented (either picked up or not)
          // This supports scenarios where items are returned without being picked up (cancellation)
          where: {
            OR: [
              { jumlahDiambil: { gt: 0 } }, // Items that were picked up
              { jumlah: { gt: 0 } }, // Items that were rented (supports cancellation scenario)
            ],
          },
        },
      },
    })

    if (!transaksi) {
      throw new Error('Transaksi tidak ditemukan')
    }

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
            // TSK-24: Include multi-condition return data
            returnConditions: {
              orderBy: { createdAt: 'asc' },
              select: {
                id: true,
                kondisiAkhir: true,
                jumlahKembali: true,
                penaltyAmount: true,
                modalAwalUsed: true,
                createdAt: true,
                createdBy: true,
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

    // TSK-24: Transform items with multi-condition return data
    const enhancedTransaksi = {
      ...transaksi,
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: this.transformItemsWithMultiCondition(transaksi.items as any),
    }

    return enhancedTransaksi as TransaksiWithDetails
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
            // TSK-24: Include multi-condition return data
            returnConditions: {
              orderBy: { createdAt: 'asc' },
              select: {
                id: true,
                kondisiAkhir: true,
                jumlahKembali: true,
                penaltyAmount: true,
                modalAwalUsed: true,
                createdAt: true,
                createdBy: true,
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

    // TSK-24: Transform items with multi-condition return data
    const enhancedTransaksi = {
      ...transaksi,
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: this.transformItemsWithMultiCondition(transaksi.items as any),
    }

    return enhancedTransaksi as TransaksiWithDetails
  }

  /**
   * Get paginated list of transactions with enhanced status calculation
   * Applies status enhancement and filtering on enhanced status for accurate results
   */
  async getTransaksiList(params: TransaksiQueryParams): Promise<TransaksiListResponse> {
    const { page, limit, status, search, penyewaId, dateStart, dateEnd } = params

    // Build where clause for database filtering (exclude status for now - we'll filter by enhanced status)
    const whereClause: Record<string, unknown> = {}

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

    // Get all transactions (we'll filter by enhanced status in memory)
    const [allTransactions, summary] = await Promise.all([
      this.prisma.transaksi.findMany({
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
      this.getTransaksiStats(),
    ])

    // Apply enhanced status calculation and filtering
    const enhancedTransactions = allTransactions.map((transaction) => {
      const enhancedStatus = calculateEnhancedStatus(
        transaction.status as TransactionStatus,
        transaction.items,
        transaction.tglSelesai?.toISOString()
      )

      return {
        ...transaction,
        status: enhancedStatus,
      }
    })

    // Filter by enhanced status if requested
    const filteredTransactions = status
      ? enhancedTransactions.filter((transaction) => transaction.status === status)
      : enhancedTransactions

    // Apply pagination to filtered results
    const skip = (page - 1) * limit
    const paginatedData = filteredTransactions.slice(skip, skip + limit)
    const total = filteredTransactions.length
    const totalPages = Math.ceil(total / limit)

    return {
      data: paginatedData as unknown as TransaksiWithDetails[],
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
          await this.restoreProductQuantities(tx, id, 'cancelled')
        } else if (data.status === 'selesai') {
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
   * Get transaction statistics with enhanced status calculation
   * Applies status enhancement logic to provide accurate counts for frontend
   */
  async getTransaksiStats(): Promise<{
    totalActive: number
    totalDiambil: number
    totalSelesai: number
    totalTerlambat: number
    totalCancelled: number
  }> {
    const log = logger.child('transaksiService')

    log.debug('getTransaksiStats', 'Starting backend stats calculation')

    // Fetch all transactions with basic data needed for status calculation
    const transactions = await this.prisma.transaksi.findMany({
      select: {
        id: true,
        kode: true,
        status: true,
        tglSelesai: true,
        items: {
          select: {
            jumlahDiambil: true,
            statusKembali: true,
          }
        }
      }
    })

    log.debug('getTransaksiStats', 'Backend: Fetched transactions for stats', {
      totalTransactions: transactions.length,
      transactionIds: transactions.map(t => ({ id: t.id, kode: t.kode, status: t.status }))
    })

    const result = {
      totalActive: 0,
      totalDiambil: 0,
      totalSelesai: 0,
      totalTerlambat: 0,
      totalCancelled: 0,
    }

    // Apply enhanced status calculation to each transaction
    transactions.forEach((transaction, index) => {
      log.debug('getTransaksiStats', `Backend: Processing transaction ${index + 1}/${transactions.length}`, {
        transactionId: transaction.id,
        kode: transaction.kode,
        originalStatus: transaction.status,
        hasItems: !!transaction.items?.length,
        itemsData: transaction.items?.map(item => ({
          jumlahDiambil: item.jumlahDiambil,
          statusKembali: item.statusKembali
        }))
      })

      const enhancedStatus = calculateEnhancedStatus(
        transaction.status as TransactionStatus,
        transaction.items,
        transaction.tglSelesai?.toISOString()
      )

      log.debug('getTransaksiStats', `Backend: Enhanced status calculated for ${transaction.kode}`, {
        originalStatus: transaction.status,
        enhancedStatus,
        transformation: transaction.status !== enhancedStatus ? 'CHANGED' : 'UNCHANGED'
      })

      switch (enhancedStatus) {
        case 'active':
          result.totalActive++
          break
        case 'diambil':
          result.totalDiambil++
          break
        case 'selesai':
          result.totalSelesai++
          break
        case 'terlambat':
          result.totalTerlambat++
          break
        case 'cancelled':
          result.totalCancelled++
          break
      }
    })

    log.info('getTransaksiStats', 'Backend: Final stats calculated', {
      result,
      totalProcessed: transactions.length,
      mapping: {
        'selesai': result.totalSelesai,
        'terlambat': result.totalTerlambat
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
    for (const item of items) {
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

        throw new Error(error)
      }

      // Double-check availability using calculated availableStock (race condition protection)
      const availableStock = calculateAvailableStock(
        currentProduct.quantity,
        currentProduct.rentedStock,
      )
      if (availableStock < item.jumlah) {
        const error = `Insufficient stock for product ${currentProduct.name}. Available: ${availableStock}, Requested: ${item.jumlah}`

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

        throw new Error(error)
      }
    }
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
      }
    }
  }

  /**
   * TSK-24: Transform transaction items to include multi-condition return data
   * Maintains backward compatibility while enhancing with condition breakdown
   */
  private transformItemsWithMultiCondition(
    items: TransaksiWithDetails['items'],
  ): TransaksiWithDetails['items'] {
    return items.map((item) => {
      const transformedItem = { ...item }

      // Check if item has multi-condition returns
      if (item.returnConditions && item.returnConditions.length > 0) {
        if (item.returnConditions.length > 1) {
          // Multi-condition case: Transform kondisiAkhir to indicate multi-condition
          transformedItem.kondisiAkhir = 'multi-condition'

          // Calculate multi-condition summary
          const totalPenalty = item.returnConditions.reduce(
            (sum, condition) => sum + Number(condition.penaltyAmount),
            0,
          )

          const lostItems = item.returnConditions
            .filter((c) => this.isLostItemCondition(c.kondisiAkhir))
            .reduce((sum, c) => sum + c.jumlahKembali, 0)

          const goodItems = item.returnConditions
            .filter((c) => !this.isLostItemCondition(c.kondisiAkhir))
            .reduce((sum, c) => sum + c.jumlahKembali, 0)

          transformedItem.multiConditionSummary = {
            totalPenalty,
            lostItems,
            goodItems,
            totalQuantity: lostItems + goodItems,
            conditionBreakdown: item.returnConditions.map((condition) => ({
              kondisiAkhir: condition.kondisiAkhir,
              jumlahKembali: condition.jumlahKembali,
              penaltyAmount: Number(condition.penaltyAmount),
              modalAwalUsed: condition.modalAwalUsed ? Number(condition.modalAwalUsed) : null,
            })),
          }
        } else {
          // Single condition case: Use the actual condition data
          const singleCondition = item.returnConditions[0]
          transformedItem.kondisiAkhir = singleCondition.kondisiAkhir
          transformedItem.totalReturnPenalty = singleCondition.penaltyAmount
        }

        // Update status based on return data
        if (item.returnConditions.length > 0) {
          const totalReturned = item.returnConditions.reduce(
            (sum, condition) => sum + condition.jumlahKembali,
            0,
          )

          if (totalReturned >= item.jumlahDiambil) {
            transformedItem.statusKembali = 'lengkap'
          } else if (totalReturned > 0) {
            transformedItem.statusKembali = 'sebagian'
          }
        }
      }

      return transformedItem
    })
  }

  /**
   * TSK-24: Helper method to detect lost item conditions
   */
  private isLostItemCondition(kondisiAkhir: string): boolean {
    const normalized = kondisiAkhir.toLowerCase()
    return normalized.includes('hilang') || normalized.includes('tidak dikembalikan')
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
