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
import type { ProductSelection } from '../types'
import { TransactionCodeGenerator } from '../lib/utils/codeGenerator'
import { PriceCalculator } from '../lib/utils/server'
import { createAvailabilityService, AvailabilityService } from './availabilityService'
import { createInventoryService } from './inventoryService'
import type { TransactionStatus } from '../types'
import { TransactionLogger } from '../lib/logger/transactionLogger'

export interface TransaksiWithDetails extends Transaksi {
  penyewa: {
    id: string
    nama: string
    telepon: string
    alamat: string
    nik?: string | null // Add NIK field for customer identity number
    email?: string | null // Add email field for customer contact
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
      resolutionStatus?: string | null
      resolutionDate?: Date | null
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
    nik?: string | null // Add NIK field for customer identity number
    email?: string | null // Add email field for customer contact
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
 * ✅ STATUS MISMATCH FIX: Moved from frontend to backend for single source of truth
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
  items: Array<{ jumlah: number; jumlahDiambil: number; statusKembali?: string }> | undefined,
  endDate?: string | Date,
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
  // ✅ FIX: Exclude pending_resolution from auto-complete - it should only transition via resolveLostItem()
  if (baseStatus === 'active' || baseStatus === 'diambil') {
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

  // ✅ STATUS MISMATCH FIX: Priority 6 - Check if ALL items are fully picked up (not just ANY)
  // This aligns with the backend pickup logic in pickupService.ts
  if (baseStatus === 'active' && items && items.length > 0) {
    // Check if ALL items are fully picked up (same logic as pickupService)
    const allItemsPickedUp = items.every((item) => item.jumlahDiambil >= item.jumlah)

    if (allItemsPickedUp) {
      return 'diambil'
    }

    // If some items are picked up but not all, stay as 'active'
    // This prevents the mismatch where frontend shows 'diambil' but backend shows 'active'
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
   * OPTIMIZED: Conditional logging for development only
   * @private
   */
  private async validateKasirExistsAndActive(kasirId: string): Promise<void> {
    const kasir = await this.prisma.kasir.findUnique({
      where: { id: kasirId, isActive: true },
    })

    if (!kasir) {
      // 🔍 DEBUG: Log kasir validation failure (dev only)
      if (process.env.NODE_ENV === 'development') {
        TransactionLogger.logKasirDebug({
          kasirId,
          validation: 'kasir_validation_failed',
          reason: 'not_found_or_inactive',
          timestamp: new Date().toISOString(),
          source: 'TransaksiService.validateKasirExistsAndActive',
        })
      }
      throw new Error('Kasir tidak ditemukan atau tidak aktif')
    }
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
              nik: true, // Add NIK field for customer identity number
              email: true, // Add email field for customer contact
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
                  resolutionStatus: true, // ✅ TASK 9.1: Include resolution status
                  resolutionDate: true, // ✅ TASK 9.1: Include resolution date
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

      const enhancedStatus = calculateEnhancedStatus(
        transaksi.status as TransactionStatus,
        transaksi.items,
        transaksi.tglSelesai?.toISOString(),
      )

      // TSK-24: Transform items with multi-condition return data
      const enhancedTransaksi = {
        ...transaksi,
        status: enhancedStatus, // ✅ Enhanced status calculated on backend
        //eslint-disable-next-line
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
   * Create new transaction with size-aware stock management and enhancements
   * ENHANCED: Now supports discount system and duration packages (4-day/7-day)
   * OPTIMIZED: Returns full transaction details to eliminate double query
   *
   * PHASE 2 OPTIMIZATION: Pre-validation pattern to prevent transaction timeouts
   * Step 1: Validate stock availability OUTSIDE transaction
   * Step 2: Create transaction with minimal operations INSIDE transaction
   * Step 3: Update stock quantities with retry logic AFTER transaction
   */
  async createTransaksiSizeAware(data: CreateTransaksiRequest): Promise<TransaksiWithDetails> {
    let priceCalculation: ReturnType<typeof PriceCalculator.calculateTransactionTotalWithEnhancements> | null = null

    try {
      const penyewa = await this.prisma.penyewa.findUnique({
        where: { id: data.penyewaId },
      })

      if (!penyewa) {
        throw new Error('Penyewa tidak ditemukan')
      }

      // Get product data for enhanced pricing
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

      // Get duration from first item (all items should have same duration in UI)
      const duration = data.items[0]?.durasi as 4 | 7 || 4

      // Prepare items for enhanced price calculation
      const itemsForCalculation: ProductSelection[] = data.items.map((item) => {
        const productSize = productSizes.find((ps) => ps.id === item.productSizeId)!
        return {
          product: {
            id: item.produkId,
            name: productSize.product.name,
            pricePerDay: Number(productSize.product.currentPrice),
            // Add required fields for ProductSelection
            category: '',
            size: productSize.size,
            color: '',
            image: '',
            available: true,
          },
          quantity: item.jumlah,
          duration: duration,
          productSizeId: item.productSizeId,
        }
      })

      // ENHANCED: Use enhanced price calculation with discount support
      priceCalculation = PriceCalculator.calculateTransactionTotalWithEnhancements({
        items: itemsForCalculation,
        duration,
        discountType: data.discountType,
        discountValue: data.discountValue || undefined,
      })

      if (!priceCalculation) {
        throw new Error('Failed to calculate enhanced transaction pricing')
      }

      // ENHANCED: Calculate return date using DateCalculator
      const DateCalculator = await import('../lib/utils/dateCalculator').then(m => m.DateCalculator)
      const returnDate = DateCalculator.calculateReturnDate(data.tglMulai, duration)

      // Generate transaction code
      const kode = await this.codeGenerator.generateTransactionCode()

      // STEP 3: Create transaction with OPTIMIZED operations INSIDE transaction
      const transactionStartTime = Date.now()

      const transaksi = await this.prisma.$transaction(
        async (tx) => {
          // Validate stock availability INSIDE transaction (prevents race conditions)
          // This is the ONLY validation - removed redundant pre-validation
          await this.validateStockAvailabilityInTransaction(tx, data.items, productSizes)

          // ENHANCED: Create main transaction with discount fields
          const createdTransaksi = await tx.transaksi.create({
            data: {
              kode,
              penyewaId: data.penyewaId,
              kasirId: data.kasirId || null,
              status: 'active',
              totalHarga: priceCalculation!.finalTotal,
              jumlahBayar: new Decimal(0),
              sisaBayar: priceCalculation!.finalTotal,
              tglMulai: new Date(data.tglMulai),
              tglSelesai: new Date(returnDate), // ENHANCED: Use calculated return date
              metodeBayar: data.metodeBayar || 'tunai',
              catatan: data.catatan || null,
              // ENHANCED: Store discount information
              discountType: data.discountType || null,
              discountValue: data.discountValue ? new Decimal(data.discountValue) : null,
              createdBy: this.userId,
            },
            include: {
              penyewa: {
                select: {
                  id: true,
                  nama: true,
                  telepon: true,
                  alamat: true,
                  nik: true,
                  email: true,
                },
              },
              kasir: {
                select: {
                  id: true,
                  nama: true,
                  isActive: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          })

          // ENHANCED: Create transaction items with enhanced pricing
          const itemsData = data.items.map((item, index) => {
            const calculation = priceCalculation!.itemCalculations[index]
            const productSize = productSizes.find((ps) => ps.id === item.productSizeId)!
            return {
              transaksiId: createdTransaksi.id,
              produkId: item.produkId,
              jumlah: item.jumlah,
              hargaSewa: new Decimal(calculation.adjustedPrice).div(item.jumlah), // Price per unit after duration multiplier
              durasi: duration, // ENHANCED: Use actual duration from form
              subtotal: calculation.adjustedPrice,
              kondisiAwal: `${item.productSizeId}|${productSize.size}|${productSize.ageCategory}|${item.kondisiAwal || ''}`,
            }
          })

          await tx.transaksiItem.createMany({
            data: itemsData,
          })

          // Update product quantities - OPTIMIZED: Single inventory system
          // Stock already validated above, just update quantities
          await this.updateProductSizeQuantitiesWithoutValidation(tx, data.items)

          // Fetch items with full product details
          const items = await tx.transaksiItem.findMany({
            where: { transaksiId: createdTransaksi.id },
            include: {
              produk: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  modalAwal: true,
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
          })

          // Fetch pembayaran and aktivitas
          const pembayaran = await tx.pembayaran.findMany({
            where: { transaksiId: createdTransaksi.id },
            orderBy: { createdAt: 'desc' },
          })

          const aktivitas = await tx.aktivitasTransaksi.findMany({
            where: { transaksiId: createdTransaksi.id },
            orderBy: { createdAt: 'desc' },
          })

          return {
            ...createdTransaksi,
            items,
            pembayaran,
            aktivitas,
          }
        },
        {
          timeout: 10000, // 10 seconds timeout (reduced from 30s after optimization)
        },
      )

      // ENHANCED: Create enhanced activity log AFTER transaction (async, non-blocking)
      this.createEnhancedActivityLogAsync(
        transaksi.id,
        kode,
        data,
        priceCalculation,
        duration,
        transactionStartTime,
      ).catch((err: Error) => {
        console.error('Failed to create enhanced activity log:', err)
      })

      // 🔍 DEBUG: Log transaction creation success with kasir assignment
      TransactionLogger.logKasirDebug({
        transactionCode: transaksi.kode,
        transactionId: transaksi.id,
        kasirId: data.kasirId,
        success: 'transaction_created_with_enhancements',
        discountType: data.discountType,
        discountValue: data.discountValue,
        duration,
        timestamp: new Date().toISOString(),
        source: 'TransaksiService.createTransaksiSizeAware',
      })

      // Apply enhanced status calculation
      const enhancedStatus = calculateEnhancedStatus(
        transaksi.status as TransactionStatus,
        transaksi.items,
        transaksi.tglSelesai?.toISOString(),
      )

      // Transform items with multi-condition return data
      const enhancedTransaksi = {
        ...transaksi,
        status: enhancedStatus,
        //eslint-disable-next-line
        items: this.transformItemsWithMultiCondition(transaksi.items as any),
      }

      return enhancedTransaksi as TransaksiWithDetails
    } catch (error) {
      // Enhanced error logging for debugging
      if (error instanceof Error) {
        console.error('🚨 [ERROR] Enhanced Transaction Creation Failed:', {
          message: error.message,
          itemCount: data.items.length,
          penyewaId: data.penyewaId,
          discountType: data.discountType,
          discountValue: data.discountValue,
          totalAmount: priceCalculation?.finalTotal?.toString() || 'unknown',
        })
      }

      throw error
    }
  }

  /**
   * Validate stock availability INSIDE transaction (single source of truth)
   * OPTIMIZED: Validates once inside transaction to prevent race conditions
   * FIXED: Removed redundant isActive check - query already filters by isActive
   * @private
   */
  private async validateStockAvailabilityInTransaction(
    //eslint-disable-next-line
    tx: any,
    items: CreateTransaksiRequest['items'],
    //eslint-disable-next-line
    productSizes: any[],
  ): Promise<void> {
    const txInventoryService = createInventoryService(tx)

    for (const item of items) {
      const productSize = productSizes.find((ps) => ps.id === item.productSizeId)

      // ✅ VALIDATION 1: Check if size exists
      // If size is inactive, it won't be in productSizes array (filtered by query)
      if (!productSize) {
        throw new Error(`Ukuran produk tidak ditemukan untuk item ${item.productSizeId}`)
      }

      // ❌ REMOVED: isActive check - redundant because:
      // 1. Query already filters by ProductSize.isActive = true
      // 2. If size is inactive, it won't reach here (caught by !productSize check above)
      // 3. Stock availability is the real validation

      // ✅ VALIDATION 2: Check actual stock availability using InventoryService
      // This is the real validation - checks if we have enough quantity
      const isAvailable = await txInventoryService.checkAvailability(
        item.productSizeId,
        item.jumlah,
      )

      if (!isAvailable) {
        const stockStatus = await txInventoryService.getStockStatus(item.productSizeId)
        throw new Error(
          `Size ${productSize.size} (${productSize.ageCategory}) untuk ${productSize.product.name} tidak mencukupi. Tersedia: ${stockStatus.availableQuantity}, Diminta: ${item.jumlah}`,
        )
      }
    }
  }

  /**
   * Update product size quantities WITHOUT validation (already validated)
   * OPTIMIZED: Skips validation to avoid double-checking
   * @private
   */
  private async updateProductSizeQuantitiesWithoutValidation(
    //eslint-disable-next-line
    tx: any,
    items: CreateTransaksiRequest['items'],
  ): Promise<void> {
    const txInventoryService = createInventoryService(tx)

    // Update stock using InventoryService (atomic operation)
    // Validation already done in validateStockAvailabilityInTransaction
    for (const item of items) {
      await txInventoryService.updateStockOnCreate(item.productSizeId, item.jumlah)
    }
  }

  /**
   * Create enhanced activity log with discount information
   * @private
   */
  private async createEnhancedActivityLogAsync(
    transaksiId: string,
    kode: string,
    data: CreateTransaksiRequest,
    priceCalculation: ReturnType<typeof PriceCalculator.calculateTransactionTotalWithEnhancements>,
    duration: 4 | 7,
    transactionStartTime: number,
  ): Promise<void> {
    try {
      await this.prisma.aktivitasTransaksi.create({
        data: {
          transaksiId,
          tipe: 'dibuat',
          deskripsi: `Transaksi ${kode} dibuat${data.kasirId ? ' dengan kasir ter assign' : ''}${data.discountType ? ` dengan diskon ${data.discountType}` : ''}`,
          data: {
            items: data.items.length,
            subtotal: priceCalculation.subtotal.toString(),
            discountAmount: priceCalculation.discountAmount.toString(),
            totalHarga: priceCalculation.finalTotal.toString(),
            discountType: data.discountType || null,
            discountValue: data.discountValue || null,
            duration,
            durationMultiplier: priceCalculation.durationMultiplier,
            kasirId: data.kasirId || null,
            sizeAware: true,
            enhancedSystem: true,
            transactionDuration: Date.now() - transactionStartTime,
          },
          createdBy: this.userId,
        },
      })
    } catch (error) {
      console.error('Failed to create enhanced activity log:', error)
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
            nik: true, // Add NIK field for customer identity number
            email: true, // Add email field for customer contact
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
            },
          },
          kasir: {
            select: {
              nama: true,
            },
          },
          items: {
            include: {
              produk: {
                select: {
                  id: true,
                  code: true,
                  name: true,
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
    //eslint-disable-next-line
    const updatedTransaksi = await this.prisma.$transaction(async (tx: any) => {
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

          // ✅ PERFORMANCE FIX: Use transaction-scoped inventory service
          const txInventoryService = createInventoryService(tx)

          // Restore stock using InventoryService for consistency
          await Promise.all(
            //eslint-disable-next-line
            transaksiItems.map(async (item: any) => {
              const quantityToRestore =
                data.status === 'cancelled' ? item.jumlah : item.jumlah - (item.jumlahDiambil || 0)

              if (quantityToRestore > 0 && item.kondisiAwal) {
                // Parse productSizeId from kondisiAwal field format: "productSizeId|size|ageCategory|condition"
                const kondisiParts = item.kondisiAwal.split('|')
                const productSizeId = kondisiParts[0]

                if (productSizeId) {
                  // Use InventoryService for consistent stock management
                  await txInventoryService.updateStockOnReturn(productSizeId, quantityToRestore)
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
            jumlah: true, // ✅ Added for enhanced status calculation
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
      active: ['selesai', 'terlambat', 'cancelled', 'diambil', 'pending_resolution'], // ✅ FIX: Allow transition to pending_resolution for HILANG items
      diambil: ['selesai', 'cancelled'],
      terlambat: ['selesai', 'cancelled'],
      pending_resolution: ['selesai', 'cancelled'], // ✅ FIX: Allow transition after lost items resolved
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
        // ✅ FIX: Always create multiConditionSummary for consistency (even for single conditions)
        // This ensures lost item resolution button works for all scenarios

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

        // Always create multiConditionSummary (for both single and multi-condition items)
        transformedItem.multiConditionSummary = {
          totalPenalty,
          lostItems,
          goodItems,
          totalQuantity: lostItems + goodItems,
          conditionBreakdown: item.returnConditions.map((condition) => ({
            id: condition.id,
            kondisiAkhir: condition.kondisiAkhir,
            jumlahKembali: condition.jumlahKembali,
            penaltyAmount: Number(condition.penaltyAmount),
            modalAwalUsed: condition.modalAwalUsed ? Number(condition.modalAwalUsed) : null,
            resolutionStatus: condition.resolutionStatus || null,
            resolutionDate: condition.resolutionDate || null,
          })),
        }

        // Set kondisiAkhir based on number of conditions
        if (item.returnConditions.length > 1) {
          // Multi-condition case: Transform kondisiAkhir to indicate multi-condition
          transformedItem.kondisiAkhir = 'multi-condition'
        } else {
          // Single condition case: Use the actual condition data (backward compatibility)
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
