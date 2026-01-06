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
import type { ProductSelection, CreateTransaksiItemSizeAware } from '../types'
import type { LinkedSarung, ProductSize } from '../types'
import { TransactionCodeGenerator } from '../lib/utils/codeGenerator'
import { PriceCalculator } from '../lib/utils/server'
import { createAvailabilityService } from './availabilityService'
import { createInventoryService } from './inventoryService'
import type { TransactionStatus } from '../types'
import { DateCalculator } from '../lib/utils/dateCalculator'
import { TransactionLogger } from '../lib/logger/transactionLogger'
import { sarungPairingService } from './pairingService'


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
    // TASK 19: Jas-sarung pairing support
    linkedSarung?: {
      productId: string
      productSizeId: string
      quantity: number
      selectedSize: ProductSize
      product?: {
        id: string
        code: string
        name: string
        category: string
      }
    }
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

  constructor(
    private prisma: PrismaClient,
    private userId: string,
    private kasirId?: string, // ✅ NEW: Optional kasirId for refund processing
  ) {
    this.codeGenerator = new TransactionCodeGenerator(prisma)
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
            // TASK 19: Order items to group jas-sarung pairs together
            orderBy: [
              { id: 'asc' }, // Use id instead of createdAt for consistent ordering
            ],
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
        ;(transaksi as TransaksiWithDetails).kasir = null
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

      // TASK 19: Transform items with pairing relationships
      const itemsWithPairing = this.transformItemsWithPairing(enhancedTransaksi.items)
      
      // Type-safe transformation to match TransaksiWithDetails interface
      const result: TransaksiWithDetails = {
        ...enhancedTransaksi,
        items: itemsWithPairing,
        aktivitas: enhancedTransaksi.aktivitas.map(activity => ({
          id: activity.id,
          tipe: activity.tipe,
          deskripsi: activity.deskripsi,
          data: activity.data as Record<string, unknown> | undefined,
          createdBy: activity.createdBy,
          createdAt: activity.createdAt,
        })),
      }
      
      return result
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
   * ENHANCED: Now supports jas-sarung pairing with linked inventory management
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

      // ✅ CRITICAL FIX: Get product data for enhanced pricing including linkedSarung productSizeIds
      const productSizeIds: string[] = []
      
      // Collect all productSizeIds (main items + linkedSarung items)
      data.items.forEach((item) => {
        // Add main item productSizeId
        productSizeIds.push(item.productSizeId)
        
        // ✅ CRITICAL FIX: Add linkedSarung productSizeId if exists
        if ('linkedSarung' in item && item.linkedSarung) {
          const linkedSarungData = item.linkedSarung as {
            productId: string
            productSizeId: string
            quantity: number
            selectedSize: ProductSize
          }
          productSizeIds.push(linkedSarungData.productSizeId)
        }
      })
      
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
              category: true, // TASK 9: Add category for jas detection
            },
          },
        },
      })

      // 🔍 DEBUG: Log productSizes query results


      // Get duration from first item (all items should have same duration in UI)
      const duration = data.items[0]?.durasi as 4 | 7 || 4

      // TASK 9: Prepare items for enhanced price calculation with pairing support
      const itemsForCalculation: ProductSelection[] = data.items.map((item) => {
        const productSize = productSizes.find((ps) => ps.id === item.productSizeId)!
        
        // TASK 9: Check if this is a product eligible for free sarung using configurable system
        const isEligibleForSarung = sarungPairingService.isEligibleForPairing({
          id: item.produkId,
          name: productSize.product.name,
          category: productSize.product.category.name,
          pricePerDay: Number(productSize.product.currentPrice),
          size: productSize.size,
          color: '',
          image: '',
          available: true,
        })
        let linkedSarung: LinkedSarung | undefined = undefined
        
        // TASK 9: Find linked sarung if this is an eligible product and item has linkedSarung
        if (isEligibleForSarung && 'linkedSarung' in item && item.linkedSarung) {
          const linkedSarungData = item.linkedSarung as {
            productId: string
            productSizeId: string
            quantity: number
            selectedSize: ProductSize
          }
          
          linkedSarung = {
            productId: linkedSarungData.productId,
            productSizeId: linkedSarungData.productSizeId,
            quantity: linkedSarungData.quantity,
            selectedSize: linkedSarungData.selectedSize,
          }
        }

        return {
          product: {
            id: item.produkId,
            name: productSize.product.name,
            pricePerDay: Number(productSize.product.currentPrice),
            // Add required fields for ProductSelection
            category: productSize.product.category.name,
            size: productSize.size,
            color: '',
            image: '',
            available: true,
          },
          quantity: item.jumlah,
          duration: duration,
          productSizeId: item.productSizeId,
          linkedSarung: linkedSarung, // TASK 9: Include linked sarung data
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
      const returnDate = DateCalculator.calculateReturnDate(data.tglMulai, duration)

      // Generate transaction code
      const kode = await this.codeGenerator.generateTransactionCode()

      // STEP 3: Create transaction with OPTIMIZED operations INSIDE transaction
      const transactionStartTime = Date.now()

      const transaksi = await this.prisma.$transaction(
        async (tx) => {
          // TASK 4.1: Validate stock availability with date-aware checking
          // TASK 9: Include linked sarung validation
          await this.validateStockAvailabilityInTransaction(
            tx, 
            data.items, 
            productSizes,
            new Date(data.tglMulai), // Start date from form
            new Date(returnDate)     // Calculated end date
          )

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

          // TASK 9: Create transaction items with pairing support
          const allItemsData = []
          
          for (let index = 0; index < data.items.length; index++) {
            const item = data.items[index]
            const calculation = priceCalculation!.itemCalculations[index]
            const productSize = productSizes.find((ps) => ps.id === item.productSizeId)!
            
            // ✅ SIMPLIFIED: Store only essential data in kondisiAwal (no linkedSarung duplication)
            const kondisiAwalData = {
              productSizeId: item.productSizeId,
              size: productSize.size,
              ageCategory: productSize.ageCategory,
              condition: item.kondisiAwal || '',
              linkedSarung: null as LinkedSarung | null
            }
            
            // ✅ CRITICAL FIX: Enhanced linkedSarung detection and storage
            const itemWithLinkedSarung = item as CreateTransaksiItemSizeAware
            if (itemWithLinkedSarung.linkedSarung && typeof itemWithLinkedSarung.linkedSarung === 'object') {
              const linkedSarungData = itemWithLinkedSarung.linkedSarung as {
                productId: string
                productSizeId: string
                quantity: number
                selectedSize: ProductSize
              }
              

              
              kondisiAwalData.linkedSarung = {
                productId: linkedSarungData.productId,
                productSizeId: linkedSarungData.productSizeId,
                quantity: linkedSarungData.quantity,
                selectedSize: {
                  id: linkedSarungData.selectedSize.id,
                  productId: linkedSarungData.productId,
                  size: linkedSarungData.selectedSize.size,
                  ageCategory: linkedSarungData.selectedSize.ageCategory,
                  quantity: linkedSarungData.quantity,
                  availableQuantity: 0,
                  rentedStock: 0,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }
              }
              

            } else {
              // ✅ DEBUG: Log when no linkedSarung detected
              console.log('ℹ️ No linkedSarung detected for item:', {
                itemId: item.produkId,
                hasLinkedSarungField: 'linkedSarung' in item,
                linkedSarungValue: itemWithLinkedSarung.linkedSarung,
                linkedSarungType: typeof itemWithLinkedSarung.linkedSarung,
                timestamp: new Date().toISOString()
              })
            }
            
            // Create main item (jas or regular product)
            const mainItemData = {
              transaksiId: createdTransaksi.id,
              produkId: item.produkId,
              jumlah: item.jumlah,
              hargaSewa: new Decimal(calculation.adjustedPrice).div(item.jumlah), // Price per unit after duration multiplier
              durasi: duration, // ENHANCED: Use actual duration from form
              subtotal: calculation.adjustedPrice,
              kondisiAwal: JSON.stringify(kondisiAwalData), // ✅ SIMPLIFIED: Store only essential data
            }
            
            // 🔍 DEBUG: Log kondisiAwal JSON (simplified)
            console.log('🔍 DEBUG - Simplified KondisiAwal Storage:', {
              itemIndex: index + 1,
              produkId: item.produkId,
              kondisiAwalJSON: JSON.stringify(kondisiAwalData),
              timestamp: new Date().toISOString(),
              debugPoint: 'SIMPLIFIED_STORAGE'
            })
            
            allItemsData.push(mainItemData)
            
            // TASK 9: Create linked sarung item if exists
            if ('linkedSarung' in item && item.linkedSarung) {
              const linkedSarungData = item.linkedSarung as {
                productId: string
                productSizeId: string
                quantity: number
                selectedSize: ProductSize
              }
              
              const sarungProductSize = await tx.productSize.findUnique({
                where: { id: linkedSarungData.productSizeId },
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      code: true,
                    },
                  },
                },
              })
              
              if (sarungProductSize) {
                // ✅ SIMPLIFIED: Store sarung metadata with reference to parent jas (no duplication)
                const sarungKondisiAwalData = {
                  productSizeId: linkedSarungData.productSizeId,
                  size: sarungProductSize.size,
                  ageCategory: sarungProductSize.ageCategory,
                  condition: item.kondisiAwal || 'baik',
                  isPairedSarung: true,
                  parentJasProductId: item.produkId // Reference to parent jas
                }
                
                const sarungItemData = {
                  transaksiId: createdTransaksi.id,
                  produkId: linkedSarungData.productId,
                  jumlah: linkedSarungData.quantity,
                  hargaSewa: new Decimal(0), // Sarung is free when paired
                  durasi: duration,
                  subtotal: new Decimal(0), // Sarung subtotal is 0
                  kondisiAwal: JSON.stringify(sarungKondisiAwalData), // ✅ SIMPLIFIED: Store as JSON with pairing metadata only
                }
                allItemsData.push(sarungItemData)
              }
            }
          }

          await tx.transaksiItem.createMany({
            data: allItemsData,
          })

          // ❌ TASK 5: Stock deduction REMOVED from transaction creation
          // Stock is now deducted during pickup operation (see PickupService.processPickup)
          // This allows multiple transactions for different date ranges without immediate stock conflict
          // Date-aware validation (Task 4.1) prevents overbooking by checking overlapping periods
          // await this.updateProductSizeQuantitiesWithoutValidation(tx, data.items) // REMOVED

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
          timeout: 20000, // 20 seconds timeout (increased for jas-sarung pairing complexity)
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
   * ENHANCED: Now supports date-aware availability validation using tglMulai and tglSelesai
   * TASK 9: Now supports linked sarung validation for jas-sarung pairing
   * @private
   */
  private async validateStockAvailabilityInTransaction(
    //eslint-disable-next-line
    tx: any,
    items: CreateTransaksiRequest['items'],
    //eslint-disable-next-line
    productSizes: any[],
    startDate?: Date, // TASK 4.1: Added for date-aware validation
    endDate?: Date    // TASK 4.1: Added for date-aware validation
  ): Promise<void> {
    const txInventoryService = createInventoryService(tx)
    const txAvailabilityService = createAvailabilityService(tx)

    // TASK 9: Collect all items to validate (main items + linked sarung)
    const allItemsToValidate = []
    
    for (const item of items) {
      // Add main item
      allItemsToValidate.push({
        productSizeId: item.productSizeId,
        quantity: item.jumlah,
        isLinkedSarung: false,
        parentItem: item,
      })
      
      // TASK 9: Add linked sarung if exists
      if ('linkedSarung' in item && item.linkedSarung) {
        const linkedSarungData = item.linkedSarung as {
          productId: string
          productSizeId: string
          quantity: number
          selectedSize: ProductSize
        }
        
        allItemsToValidate.push({
          productSizeId: linkedSarungData.productSizeId,
          quantity: linkedSarungData.quantity,
          isLinkedSarung: true,
          parentItem: item,
        })
      }
    }

    for (const validationItem of allItemsToValidate) {
      const productSize = productSizes.find((ps) => ps.id === validationItem.productSizeId)

      // ✅ VALIDATION 1: Check if size exists
      // If size is inactive, it won't be in productSizes array (filtered by query)
      if (!productSize) {
        const itemType = validationItem.isLinkedSarung ? 'sarung' : 'produk'
        throw new Error(`Ukuran ${itemType} tidak ditemukan untuk item ${validationItem.productSizeId}`)
      }

      // ✅ VALIDATION 2: Use date-aware availability checking if dates are provided
      if (startDate && endDate) {
        // TASK 4.1 FIX: Use productSizeId instead of productId for size-aware validation
        const availabilityCheck = await txAvailabilityService.checkDateRangeAvailability(
          [{ productSizeId: validationItem.productSizeId, quantity: validationItem.quantity }],
          startDate,
          endDate
        )

        if (!availabilityCheck.available) {
          const conflict = availabilityCheck.conflicts[0]
          const overlappingTransactions = conflict.overlappingTransactions
            .map(t => t.transactionCode)
            .join(', ')
          
          const itemType = validationItem.isLinkedSarung ? 'Sarung' : 'Produk'
          throw new Error(
            `${itemType} size ${productSize.size} (${productSize.ageCategory}) untuk ${productSize.product.name} tidak tersedia untuk periode ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}. ` +
            `Tersedia: ${conflict.available}, Diminta: ${conflict.requested}. ` +
            `Konflik dengan transaksi: ${overlappingTransactions}`
          )
        }
      } else {
        // Legacy validation: Check current stock availability using InventoryService
        const isAvailable = await txInventoryService.checkAvailability(
          validationItem.productSizeId,
          validationItem.quantity,
        )

        if (!isAvailable) {
          const stockStatus = await txInventoryService.getStockStatus(validationItem.productSizeId)
          const itemType = validationItem.isLinkedSarung ? 'Sarung' : 'Produk'
          throw new Error(
            `${itemType} size ${productSize.size} (${productSize.ageCategory}) untuk ${productSize.product.name} tidak mencukupi. Tersedia: ${stockStatus.availableQuantity}, Diminta: ${validationItem.quantity}`,
          )
        }
      }
    }
  }

  /**
   * Create enhanced activity log with discount information
   * TASK 9: Enhanced with jas-sarung pairing information
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
      // TASK 9: Count jas-sarung pairings
      const pairingCount = data.items.filter(item => 'linkedSarung' in item && item.linkedSarung).length
      const totalItems = data.items.length + data.items.filter(item => 'linkedSarung' in item && item.linkedSarung).length // Main items + linked sarung
      
      await this.prisma.aktivitasTransaksi.create({
        data: {
          transaksiId,
          tipe: 'dibuat',
          deskripsi: `Transaksi ${kode} dibuat${data.kasirId ? ' dengan kasir ter assign' : ''}${data.discountType ? ` dengan diskon ${data.discountType}` : ''}${pairingCount > 0 ? ` dengan ${pairingCount} pairing jas-sarung` : ''}`,
          data: {
            items: data.items.length,
            totalItemsIncludingSarung: totalItems, // TASK 9: Include sarung count
            jasSarungPairings: pairingCount, // TASK 9: Track pairing count
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
            pairingSupport: true, // TASK 9: Flag for pairing support
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
    const { page, limit, status, search, penyewaId, dateStart, dateEnd, tglMulai } = params

    // Build where clause for database filtering (exclude status for now - we'll filter by enhanced status)
    const whereClause: Record<string, unknown> = {}

    if (penyewaId) {
      whereClause.penyewaId = penyewaId
    }

    // Handle date range filtering (existing functionality)
    if (dateStart || dateEnd) {
      whereClause.createdAt = {}
      if (dateStart) (whereClause.createdAt as Record<string, Date>).gte = new Date(dateStart)
      if (dateEnd) (whereClause.createdAt as Record<string, Date>).lte = new Date(dateEnd)
    }

    // Handle single date filtering for tglMulai (new functionality)
    if (tglMulai) {
      // Convert YYYY-MM-DD to date range for exact day matching
      // Handle timezone properly for Indonesian context (UTC+7)
      const filterDate = new Date(tglMulai)
      const startOfDay = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate(), 0, 0, 0, 0)
      const endOfDay = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate(), 23, 59, 59, 999)
      
      whereClause.tglMulai = {
        gte: startOfDay,
        lte: endOfDay,
      }
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
              // ✅ SIMPLE FIX: No stock restoration for cancelled transactions (pickup-based system)
              const quantityToRestore = data.status === 'cancelled' 
                ? 0  // ❌ NO restoration for cancelled transactions
                : item.jumlah - (item.jumlahDiambil || 0)  // ✅ Keep existing logic for 'selesai'

              if (quantityToRestore > 0 && item.kondisiAwal) {
                // Parse productSizeId from kondisiAwal field (support both JSON and legacy formats)
                let productSizeId: string | null = null
                
                try {
                  // Try parsing as JSON first (new format)
                  const kondisiData = JSON.parse(item.kondisiAwal)
                  productSizeId = kondisiData.productSizeId
                } catch {
                  // Fallback to legacy format: "productSizeId|size|ageCategory|condition"
                  const kondisiParts = item.kondisiAwal.split('|')
                  productSizeId = kondisiParts[0]
                }

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

          // Get customer info for refund processing
          const customerInfo = await tx.penyewa.findUnique({
            where: { id: existingTransaksi.penyewaId },
            select: { nama: true },
          })

          // ✅ NEW: Process automatic refund with policy calculation if payment was made
          const refundAmount = existingTransaksi.jumlahBayar.toNumber()
          let refundProcessed = false
          let refundError: string | null = null
          let actualRefundAmount = 0

          if (refundAmount > 0) {
            try {
              // ✅ NEW: Get refund data from request if provided
              const refundData = data.refundData || null
              
              await this.processAutomaticRefund(tx, {
                transaksiId: id,
                transactionCode: existingTransaksi.kode,
                refundAmount,
                customerName: customerInfo?.nama || 'Unknown Customer',
                cancellationReason: data.catatan || 'Tanpa alasan',
                refundData, // ✅ NEW: Pass refund calculation data
              })
              
              actualRefundAmount = refundData?.isEligible ? refundData.refundAmount : 0
              refundProcessed = actualRefundAmount > 0
            } catch (error) {
              // Log error but don't fail the cancellation
              refundError = error instanceof Error ? error.message : 'Unknown refund error'
              console.error('Automatic refund processing failed', {
                transactionId: id,
                transactionCode: existingTransaksi.kode,
                refundAmount,
                kasirId: this.kasirId,
                error: refundError,
                timestamp: new Date().toISOString(),
              })
            }
          }

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
                stockRestored: false,  // ✅ UPDATED: No stock restoration for cancelled transactions
                cancelledAt: new Date().toISOString(),
                // ✅ ENHANCED: Refund processing status with policy data
                needsRefund: refundAmount > 0 && !refundProcessed,
                refundProcessed: refundProcessed,
                refundAmount: refundAmount > 0 ? refundAmount : undefined,
                actualRefundAmount: actualRefundAmount > 0 ? actualRefundAmount : undefined,
                refundPolicy: data.refundData ? {
                  isEligible: data.refundData.isEligible,
                  refundPercentage: data.refundData.refundPercentage,
                  daysUntilPickup: data.refundData.daysUntilPickup,
                  calculationDate: new Date().toISOString(),
                } : undefined,
                expenseRecordCreated: refundProcessed,
                refundCategory: refundProcessed ? 'Refund Pembatalan Transaksi' : undefined,
                refundError: refundError,
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

  /**
   * ✅ NEW: Process automatic refund for cancelled transactions
   * Follows the same pattern as Lost Item Resolution system
   * @private
   */
  private async processAutomaticRefund(
    //eslint-disable-next-line
    tx: any,
    params: {
      transaksiId: string
      transactionCode: string
      refundAmount: number
      customerName: string
      cancellationReason: string
      refundData?: {
        refundAmount: number
        refundPercentage: number
        isEligible: boolean
        daysUntilPickup: number
      } | null
    }
  ): Promise<void> {
    // Step 1: Validate kasir exists (required for expense tracking)
    if (!this.kasirId) {
      throw new Error('KasirId diperlukan untuk pemrosesan refund')
    }

    const kasirExists = await tx.kasir.findUnique({
      where: { id: this.kasirId },
    })
    
    if (!kasirExists) {
      throw new Error('Kasir tidak ditemukan untuk pemrosesan refund')
    }

    // ✅ NEW: Calculate actual refund amount based on policy
    const actualRefundAmount = params.refundData?.isEligible 
      ? params.refundData.refundAmount 
      : 0

    // Only process refund if eligible and amount > 0
    if (actualRefundAmount > 0) {
      // Step 2: Create refund payment record (negative amount)
      await tx.pembayaran.create({
        data: {
          transaksiId: params.transaksiId,
          jumlah: new Decimal(-actualRefundAmount),
          metode: 'refund',
          catatan: `Refund pembatalan transaksi (${params.refundData?.refundPercentage}%): ${params.cancellationReason}`,
          createdBy: this.userId,
        },
      })

      // Step 3: Create expense record (positive amount)
      await tx.pengeluaranKasir.create({
        data: {
          kasirId: this.kasirId,
          harga: new Decimal(actualRefundAmount),
          kategori: 'Refund Pembatalan Transaksi',
          deskripsi: `Refund pembatalan transaksi #${params.transactionCode} - ${params.customerName} (${params.refundData?.refundPercentage}% dari Rp ${params.refundAmount.toLocaleString('id-ID')})`,
          createdBy: this.userId,
          isActive: true,
        },
      })

      console.log('✅ Policy-based refund processed successfully', {
        transactionId: params.transaksiId,
        transactionCode: params.transactionCode,
        originalAmount: params.refundAmount,
        actualRefundAmount,
        refundPercentage: params.refundData?.refundPercentage,
        daysUntilPickup: params.refundData?.daysUntilPickup,
        kasirId: this.kasirId,
        timestamp: new Date().toISOString(),
      })
    } else {
      console.log('ℹ️ No refund processed - not eligible or zero amount', {
        transactionId: params.transaksiId,
        transactionCode: params.transactionCode,
        originalAmount: params.refundAmount,
        isEligible: params.refundData?.isEligible || false,
        daysUntilPickup: params.refundData?.daysUntilPickup || 0,
        timestamp: new Date().toISOString(),
      })
    }
  }
  

  /**
   * TASK 19: Transform transaction items to include linkedSarung relationships
   * ✅ BACKWARD COMPATIBLE: Handles both old and new data formats
   */
  private transformItemsWithPairing(items: TransaksiWithDetails['items']): TransaksiWithDetails['items'] {
    const transformedItems: TransaksiWithDetails['items'] = []
    
    
    for (const item of items) {
      // Parse kondisiAwal to check if this is a paired sarung
      let kondisiAwalData: Record<string, unknown> | null = null
      try {
        if (typeof item.kondisiAwal === 'string' && item.kondisiAwal.startsWith('{')) {
          kondisiAwalData = JSON.parse(item.kondisiAwal)
        }
      } catch (error) {
        // Handle legacy format or invalid JSON
        console.warn('Failed to parse kondisiAwal JSON', { itemId: item.id, error })
      }
      
      // Skip sarung items that are paired (they'll be included as linkedSarung data)
      if (kondisiAwalData && typeof kondisiAwalData === 'object' && 'isPairedSarung' in kondisiAwalData && kondisiAwalData.isPairedSarung) {
        console.log('🔍 Skipping paired sarung item:', { itemId: item.id, produkId: item.produkId })
        continue
      }
      
      // Transform main item (jas or regular product)
      let transformedItem = { ...item }
      
      // ✅ BACKWARD COMPATIBILITY: Handle both old and new linkedSarung data formats
      if (!item.linkedSarung && kondisiAwalData && 
          typeof kondisiAwalData === 'object' && 
          'linkedSarung' in kondisiAwalData && 
          kondisiAwalData.linkedSarung) {
        
        // OLD FORMAT: linkedSarung data is in kondisiAwal JSON
        const linkedSarungData = kondisiAwalData.linkedSarung as Record<string, unknown>
        const sarungProduct = this.findSarungProductDetailsFromKondisiAwal(items, linkedSarungData.productId as string)
        
        
        transformedItem = {
          ...transformedItem,
          linkedSarung: {
            productId: linkedSarungData.productId as string,
            productSizeId: linkedSarungData.productSizeId as string,
            quantity: linkedSarungData.quantity as number,
            selectedSize: linkedSarungData.selectedSize as ProductSize,
            product: sarungProduct
          }
        }
        

      }
      // NEW FORMAT: linkedSarung data is already at item level (no need to do anything)
      
      transformedItems.push(transformedItem)
    }
    return transformedItems
  }
  
  /**
   * TASK 19: Helper method to find sarung product details from kondisiAwal (for backward compatibility)
   * TASK 24: Include imageUrl field for proper sarung image display
   */
  private findSarungProductDetailsFromKondisiAwal(items: TransaksiWithDetails['items'], sarungProductId: string): {
    id: string
    code: string
    name: string
    category: string
    imageUrl?: string
  } | undefined {
    const sarungItem = items.find(item => 
      item.produkId === sarungProductId && 
      item.kondisiAwal?.includes('isPairedSarung')
    )
    
    if (sarungItem?.produk) {
      
      return {
        id: sarungItem.produk.id,
        code: sarungItem.produk.code,
        name: sarungItem.produk.name,
        category: sarungItem.produk.category?.name || 'sarung',
        imageUrl: sarungItem.produk.imageUrl || undefined
      }
    }
    
    
    return undefined
  }
}
