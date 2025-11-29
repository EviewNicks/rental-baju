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
import { inventoryService } from './inventoryService'
import type { TransactionStatus } from '../types'
import { TransactionLogger } from '../lib/logger/transactionLogger'

export interface TransaksiWithDetails extends Transaksi {
  penyewa: {
    id: string
    nama: string
    telepon: string
    alamat: string
  }
  kasir: {
    // NEW: Include kasir information from database
    id: string
    nama: string
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  } | null
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
  hasPickup?: boolean,
): TransactionStatus {
  // Priority 1: Check if explicit overdue status (terlambat)
  if (baseStatus === 'terlambat') {
    return 'terlambat'
  }

  // Priority 2: Check if cancelled
  if (baseStatus === 'cancelled') {
    return 'cancelled'
  }

  // Priority 3: Check if explicit completed status (selesai)
  if (baseStatus === 'selesai') {
    return 'selesai'
  }

  // Priority 4: Check if all items have been returned (auto-complete logic)
  // This runs BEFORE overdue check to prioritize completion over timing
  if (baseStatus === 'active' || baseStatus === 'diambil' || baseStatus === 'dikembalikan') {
    if (items && items.length > 0) {
      const allItemsReturned = items.every((item) => {
        // Check if this item has been fully returned using statusKembali
        return item.statusKembali === 'lengkap'
      })

      if (allItemsReturned) {
        return 'selesai'
      }
    }
  }

  // Priority 5: Check if current date is past end date (manual overdue check)
  // This runs AFTER completion check to allow completed transactions to show as 'selesai'
  if (endDate && (baseStatus === 'active' || baseStatus === 'diambil')) {
    const now = new Date()
    const dueDate = typeof endDate === 'string' ? new Date(endDate) : endDate
    const isOverdue = now > dueDate

    if (isOverdue && !isNaN(dueDate.getTime())) {
      return 'terlambat'
    }
  }

  // Priority 6: Check if any items have been picked up
  if (baseStatus === 'active') {
    // Use server flag if available, fallback to item parsing
    const pickupDetected = hasPickup ?? (items?.some((item) => item.jumlahDiambil > 0) || false)

    if (pickupDetected) {
      return 'diambil'
    }
  }

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
   * Validate kasir exists and is active
   * NEW: Kasir validation for transaction assignment
   * FIXED: Using logKasirDebug instead of logApiPayload for type safety
   * @private
   */
  private async validateKasirExistsAndActive(kasirId: string): Promise<void> {
    // 🔍 DEBUG: Log kasir validation attempt
    TransactionLogger.logKasirDebug({
      kasirId,
      validation: 'kasir_active_check',
      timestamp: new Date().toISOString(),
      source: 'TransaksiService.validateKasirExistsAndActive',
    })

    const kasir = await this.prisma.kasir.findUnique({
      where: { id: kasirId, isActive: true },
    })

    if (!kasir) {
      // 🔍 DEBUG: Log kasir validation failure
      TransactionLogger.logKasirDebug({
        kasirId,
        validation: 'kasir_validation_failed',
        reason: 'not_found_or_inactive',
        timestamp: new Date().toISOString(),
        source: 'TransaksiService.validateKasirExistsAndActive',
      })
      throw new Error('Kasir tidak ditemukan atau tidak aktif')
    }

    // 🔍 DEBUG: Log kasir validation success
    TransactionLogger.logKasirDebug({
      kasirId,
      kasirName: kasir.nama,
      validation: 'kasir_validation_success',
      timestamp: new Date().toISOString(),
      source: 'TransaksiService.validateKasirExistsAndActive',
    })
  }

  /**
   * Unified method to get transaction by ID or code
   * Consolidates duplicate logic from getTransaksiById and getTransaksiByCode
   * @param identifier - Transaction ID (UUID) or code
   * @param type - Type of identifier ('id' or 'code')
   * @returns Transaction with full details
   */
  async getTransaksiByIdentifier(
    identifier: string,
    type: 'id' | 'code' = 'code',
  ): Promise<TransaksiWithDetails> {
    const whereClause = type === 'id' ? { id: identifier } : { kode: identifier }

    try {
      const transaksi = await this.prisma.transaksi.findUnique({
        where: whereClause,
        include: {
          penyewa: {
            select: {
              id: true,
              nama: true,
              telepon: true,
              alamat: true,
            },
          },
          kasir: {
            // NEW: Include kasir information from database (not Clerk)
            select: {
              id: true,
              nama: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
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

      // Handle kasir relation errors gracefully
      // If kasir is referenced but not found, log warning and set to null
      if (transaksi.kasirId && !transaksi.kasir) {
        console.warn('Kasir information not found', {
          level: 'warn',
          message: 'Kasir information not found',
          context: {
            transactionCode: transaksi.kode,
            transactionId: transaksi.id,
            kasirId: transaksi.kasirId,
            timestamp: new Date().toISOString(),
            source: 'TransaksiService.getTransaksiByIdentifier',
          },
        })
        // Set kasir to null for graceful degradation
        transaksi.kasir = null
      }

      // TSK-24: Transform items with multi-condition return data
      const enhancedTransaksi = {
        ...transaksi,
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: this.transformItemsWithMultiCondition(transaksi.items as any),
      }

      return enhancedTransaksi as TransaksiWithDetails
    } catch (error) {
      // Handle database query failures with comprehensive error logging
      if (error instanceof Error) {
        // Log error with full context for debugging
        console.error('Failed to retrieve transaction with kasir information', {
          level: 'error',
          message: error.message,
          context: {
            identifier,
            identifierType: type,
            timestamp: new Date().toISOString(),
            source: 'TransaksiService.getTransaksiByIdentifier',
            errorStack: error.stack,
          },
        })

        // Re-throw the error if it's a "not found" error
        if (error.message.includes('tidak ditemukan')) {
          throw error
        }

        // For other database errors, throw with more context
        throw new Error(`Failed to retrieve transaction: ${error.message}`)
      }

      // Handle unknown errors
      throw new Error('Unknown error occurred while retrieving transaction')
    }
  }

  // Legacy createTransaksi method removed - replaced by optimized createTransaksiSizeAware
  // This improves performance by eliminating dual inventory system complexity

  /**
   * Create new transaction with size-aware stock management
   * NEW: Support for size-based inventory tracking with optimized transaction pattern
   *
   * PHASE 2 OPTIMIZATION: Pre-validation pattern to prevent transaction timeouts
   * Step 1: Validate stock availability OUTSIDE transaction
   * Step 2: Create transaction with minimal operations INSIDE transaction
   * Step 3: Update stock quantities with retry logic AFTER transaction
   */
  async createTransaksiSizeAware(data: CreateTransaksiRequest): Promise<Transaksi> {
    let priceCalculation: ReturnType<typeof PriceCalculator.calculateTransactionTotal> | null = null

    try {
      const penyewa = await this.prisma.penyewa.findUnique({
        where: { id: data.penyewaId },
      })

      if (!penyewa) {
        throw new Error('Penyewa tidak ditemukan')
      }

      // NEW: Validate kasir if provided
      if (data.kasirId) {
        // 🔍 DEBUG: Log kasir validation start in transaction creation
        TransactionLogger.logKasirDebug({
          kasirId: data.kasirId,
          transactionCode: 'pending_generation',
          validation: 'kasir_validation_start',
          step: 'pre_transaction_creation',
          timestamp: new Date().toISOString(),
          source: 'TransaksiService.createTransaksiSizeAware',
        })

        await this.validateKasirExistsAndActive(data.kasirId)
      }

      // STEP 2: Pre-validate stock availability OUTSIDE transaction
      await this.validateStockAvailability(data.items)

      // STEP 3: Get product data for pricing (can reuse from validation)
      const productSizeIds = data.items.map((item) => item.productSizeId)
      const uniqueSizeIds = [...new Set(productSizeIds)]

      const productSizes = await this.prisma.productSize.findMany({
        where: {
          id: { in: uniqueSizeIds },
          isActive: true,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              currentPrice: true,
            },
          },
        },
      })

      // Calculate prices using size-specific data
      const itemsWithPrices = data.items.map((item) => {
        const productSize = productSizes.find((ps) => ps.id === item.productSizeId)!
        return {
          produkId: item.produkId,
          productSizeId: item.productSizeId,
          jumlah: item.jumlah,
          durasi: 4, // Fixed 4-day package
          hargaSewa: productSize.product.currentPrice,
        }
      })

      priceCalculation = PriceCalculator.calculateTransactionTotal(itemsWithPrices)

      if (!priceCalculation) {
        throw new Error('Failed to calculate transaction pricing')
      }

      // Generate transaction code
      const kode = await this.codeGenerator.generateTransactionCode()

      // STEP 4: Create transaction with MINIMAL operations INSIDE transaction
      const transactionStartTime = Date.now()

      const transaksi = await this.prisma.$transaction(
        async (tx) => {
          // Create main transaction (1 operation)
          const createdTransaksi = await tx.transaksi.create({
            data: {
              kode,
              penyewaId: data.penyewaId,
              kasirId: data.kasirId || null, // NEW: Include kasirId if provided
              status: 'active',
              totalHarga: priceCalculation!.totalHarga,
              jumlahBayar: new Decimal(0),
              sisaBayar: priceCalculation!.totalHarga,
              tglMulai: new Date(data.tglMulai),
              tglSelesai: data.tglSelesai ? new Date(data.tglSelesai) : null,
              metodeBayar: data.metodeBayar || 'tunai',
              catatan: data.catatan || null,
              createdBy: this.userId,
            },
          })

          // Create transaction items (1 operation - bulk insert)
          const itemsData = data.items.map((item, index) => {
            const calculation = priceCalculation!.itemCalculations[index]
            const productSize = productSizes.find((ps) => ps.id === item.productSizeId)!
            return {
              transaksiId: createdTransaksi.id,
              produkId: item.produkId,
              jumlah: item.jumlah,
              hargaSewa: calculation.hargaSewa,
              durasi: 4, // Fixed 4-day package
              subtotal: calculation.subtotal,
              kondisiAwal: `${item.productSizeId}|${productSize.size}|${productSize.ageCategory}|${item.kondisiAwal || ''}`,
            }
          })

          await tx.transaksiItem.createMany({
            data: itemsData,
          })

          // Update product quantities - OPTIMIZED: Single inventory system
          // Use only ProductSize.quantity (size-aware system) for better performance
          await this.updateProductSizeQuantities(tx, data.items)

          // Create activity log (1 operation)
          await tx.aktivitasTransaksi.create({
            data: {
              transaksiId: createdTransaksi.id,
              tipe: 'dibuat',
              deskripsi: `Transaksi ${kode} dibuat${data.kasirId ? ' dengan kasir ter assign' : ''}`,
              data: {
                items: data.items.length,
                totalHarga: priceCalculation!.totalHarga.toString(),
                kasirId: data.kasirId || null, // NEW: Include kasir assignment
                sizeAware: true,
                optimizedSystem: true,
                transactionDuration: Date.now() - transactionStartTime,
              },
              createdBy: this.userId,
            },
          })

          return createdTransaksi
        },
        {
          timeout: 30000, // 30 seconds timeout for safety
        },
      )

      // 🔍 DEBUG: Log transaction creation success with kasir assignment
      TransactionLogger.logKasirDebug({
        transactionCode: transaksi.kode,
        transactionId: transaksi.id,
        kasirId: data.kasirId,
        success: 'transaction_created_with_kasir',
        timestamp: new Date().toISOString(),
        source: 'TransaksiService.createTransaksiSizeAware',
      })

      return transaksi
    } catch (error) {
      // Enhanced error logging for debugging
      if (error instanceof Error) {
        console.error('🚨 [ERROR] Details:', {
          message: error.message,
          itemCount: data.items.length,
          penyewaId: data.penyewaId,
          totalAmount: priceCalculation?.totalHarga?.toString() || 'unknown',
        })
      }

      throw error
    }
  }

  /**
   * Update product size quantities when items are rented
   * ENHANCED: Using InventoryService for single source of truth
   * @private
   */
  private async updateProductSizeQuantities(
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: any, // Prisma transaction type
    items: CreateTransaksiRequest['items'],
  ): Promise<void> {
    for (const item of items) {
      // Validate availability using InventoryService
      const isAvailable = await inventoryService.checkAvailability(item.productSizeId, item.jumlah)

      if (!isAvailable) {
        // Get stock status for detailed error message
        const stockStatus = await inventoryService.getStockStatus(item.productSizeId)
        throw new Error(
          `Insufficient stock for product size. Available: ${stockStatus.availableQuantity}, Requested: ${item.jumlah}`,
        )
      }

      // Update stock using InventoryService (atomic operation)
      await inventoryService.updateStockOnCreate(item.productSizeId, item.jumlah)
    }
  }

  /**
   * Validate stock availability for all items BEFORE transaction
   * ENHANCED: Using InventoryService for real-time stock validation
   * @private
   */
  private async validateStockAvailability(items: CreateTransaksiRequest['items']): Promise<void> {
    const productSizeIds = items.map((item) => item.productSizeId)
    const uniqueSizeIds = [...new Set(productSizeIds)] // Remove duplicates

    // Single query to get all required product sizes for product validation
    const productSizes = await this.prisma.productSize.findMany({
      where: {
        id: { in: uniqueSizeIds },
        isActive: true,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            currentPrice: true,
            isActive: true,
            status: true,
          },
        },
      },
    })

    // Check if all requested sizes exist
    if (productSizes.length !== uniqueSizeIds.length) {
      const foundIds = productSizes.map((ps) => ps.id)
      const missingIds = uniqueSizeIds.filter((id) => !foundIds.includes(id))
      throw new Error(`Ukuran produk dengan ID ${missingIds[0]} tidak tersedia`)
    }

    // Validate each item using InventoryService for real-time stock checking
    for (const item of items) {
      const productSize = productSizes.find((ps) => ps.id === item.productSizeId)

      if (!productSize) {
        throw new Error(`Ukuran produk tidak ditemukan untuk item ${item.productSizeId}`)
      }

      // Validate product is active and available
      if (!productSize.product.isActive || productSize.product.status !== 'AVAILABLE') {
        throw new Error(`Produk ${productSize.product.name} sedang tidak tersedia`)
      }

      // Validate stock availability using InventoryService (real-time check)
      const isAvailable = await inventoryService.checkAvailability(item.productSizeId, item.jumlah)

      if (!isAvailable) {
        // Get detailed stock status for error message
        const stockStatus = await inventoryService.getStockStatus(item.productSizeId)
        throw new Error(
          `Size ${productSize.size} (${productSize.ageCategory}) untuk ${productSize.product.name} tidak mencukupi. Tersedia: ${stockStatus.availableQuantity}, Diminta: ${item.jumlah}`,
        )
      }
    }
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
   * Legacy wrapper for getTransaksiByIdentifier
   */
  async getTransaksiById(id: string): Promise<TransaksiWithDetails> {
    return this.getTransaksiByIdentifier(id, 'id')
  }

  /**
   * Get transaction by code
   * Legacy wrapper for getTransaksiByIdentifier
   */
  async getTransaksiByCode(kode: string): Promise<TransaksiWithDetails> {
    return this.getTransaksiByIdentifier(kode, 'code')
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
        transaction.tglSelesai?.toISOString(),
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
        if (data.status === 'cancelled' || data.status === 'selesai') {
          // Get transaction items to restore stock
          const transaksiItems = await tx.transaksiItem.findMany({
            where: { transaksiId: id },
            select: {
              id: true,
              kondisiAwal: true,
              jumlah: true,
              jumlahDiambil: true,
            },
          })

          // Restore stock using InventoryService for consistency
          await Promise.all(
            transaksiItems.map(async (item) => {
              const quantityToRestore =
                data.status === 'cancelled' ? item.jumlah : item.jumlah - (item.jumlahDiambil || 0)

              if (quantityToRestore > 0 && item.kondisiAwal) {
                // Parse productSizeId from kondisiAwal field format: "productSizeId|size|ageCategory|condition"
                const kondisiParts = item.kondisiAwal.split('|')
                const productSizeId = kondisiParts[0]

                if (productSizeId) {
                  // Use InventoryService for consistent stock management
                  await inventoryService.updateStockOnReturn(productSizeId, quantityToRestore)
                }
              }
            }),
          )
        }

        // Create activity log with enhanced data for cancellation
        if (data.status === 'cancelled') {
          // Get items count for detailed logging
          const itemsCount = await tx.transaksiItem.count({
            where: { transaksiId: id },
          })

          await tx.aktivitasTransaksi.create({
            data: {
              transaksiId: id,
              tipe: 'dibatalkan',
              deskripsi: `Transaksi dibatalkan: ${data.catatan || 'Tanpa alasan'}`,
              data: {
                previousStatus: existingTransaksi.status,
                newStatus: 'cancelled',
                reason: data.catatan || null,
                totalAmount: existingTransaksi.totalHarga.toString(),
                amountPaid: existingTransaksi.jumlahBayar.toString(),
                remainingAmount: existingTransaksi.sisaBayar.toString(),
                itemsCount: itemsCount,
                stockRestored: true,
                cancelledAt: new Date().toISOString(),
                needsRefund: existingTransaksi.jumlahBayar.gt(0),
              },
              createdBy: this.userId,
            },
          })
        } else {
          // Regular status change logging
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
          },
        },
      },
    })

    const result = {
      totalActive: 0,
      totalDiambil: 0,
      totalSelesai: 0,
      totalTerlambat: 0,
      totalCancelled: 0,
    }

    // Apply enhanced status calculation to each transaction
    transactions.forEach((transaction) => {
      const enhancedStatus = calculateEnhancedStatus(
        transaction.status as TransactionStatus,
        transaction.items,
        transaction.tglSelesai?.toISOString(),
      )

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

    return result
  }

  /**
   * Validate status transitions according to business rules
   */
  private validateStatusTransition(currentStatus: string, newStatus: string): void {
    const validTransitions: Record<string, string[]> = {
      active: ['selesai', 'terlambat', 'cancelled', 'diambil'],
      diambil: ['selesai', 'cancelled'],
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
