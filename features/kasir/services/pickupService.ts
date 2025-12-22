/**
 * PickupService - TSK-22
 * Service layer for pickup operations business logic
 * Following TDD approach and established kasir patterns
 */

import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { PickupItemRequest } from '../lib/validation/kasirSchema'
import { TransaksiWithDetails, TransaksiService } from './transaksiService'
import { PickupValidator, ValidationContext } from '../lib/validation/pickupValidation'
import { createInventoryService } from './inventoryService' // ✅ TASK 5: Added for stock deduction

export interface PickupValidationResult {
  valid: boolean
  errors: string[]
  warnings?: string[]
}

export interface PickupProcessResult {
  success: boolean
  transaction: TransaksiWithDetails
  message: string
  error?: string
}

export class PickupService {
  private transaksiService: TransaksiService

  constructor(
    private prisma: PrismaClient,
    private userId: string,
    transaksiService: TransaksiService,
  ) {
    this.transaksiService = transaksiService
  }

  /**
   * Validate pickup request using provided transaction data (no re-fetch)
   * ✅ PERFORMANCE: Eliminates redundant database query
   * ✅ TASK 1.5 Phase 1: Quick Wins
   */
  async validatePickupRequestWithData(
    transaction: TransaksiWithDetails,
    items: PickupItemRequest[],
    catatan?: string,
  ): Promise<PickupValidationResult> {
    try {
      // ✅ Use provided transaction data (no database fetch)
      
      // Validate remaining quantities to prevent over-pickup
      const quantityErrors: string[] = []
      
      for (const pickupItem of items) {
        const transactionItem = transaction.items.find((ti) => ti.id === pickupItem.id)
        
        if (!transactionItem) {
          quantityErrors.push(
            `Item dengan ID ${pickupItem.id} tidak ditemukan dalam transaksi`
          )
          continue
        }

        // Calculate remaining quantity
        const remainingQuantity = transactionItem.jumlah - transactionItem.jumlahDiambil

        // Validate pickup doesn't exceed remaining quantity
        if (pickupItem.jumlahDiambil > remainingQuantity) {
          quantityErrors.push(
            `Jumlah pickup untuk ${transactionItem.produk.name} melebihi sisa yang tersedia. ` +
            `Tersedia: ${remainingQuantity}, Diminta: ${pickupItem.jumlahDiambil}`
          )
        }

        // Validate pickup quantity is positive
        if (pickupItem.jumlahDiambil <= 0) {
          quantityErrors.push(
            `Jumlah pickup untuk ${transactionItem.produk.name} harus lebih dari 0`
          )
        }
      }

      // Return early if quantity validation fails
      if (quantityErrors.length > 0) {
        return {
          valid: false,
          errors: quantityErrors,
        }
      }

      // Prepare validation context
      const context: ValidationContext = {
        transactionStatus: transaction.status,
        transactionCode: transaction.kode,
        items: transaction.items.map(item => ({
          id: item.id,
          transaksiId: transaction.id, // Use transaction ID since item doesn't have it
          produkId: item.produkId,
          jumlah: item.jumlah,
          hargaSewa: item.hargaSewa,
          durasi: item.durasi,
          subtotal: item.subtotal,
          kondisiAwal: item.kondisiAwal ?? null, // Handle undefined -> null
          statusKembali: item.statusKembali,
          jumlahDiambil: item.jumlahDiambil,
          totalReturnPenalty: item.totalReturnPenalty ?? new Decimal(0), // Provide default
          conditionCount: 1, // Default value since not available in TransaksiWithDetails
          migratedFromSingleMode: false, // Default value since not available in TransaksiWithDetails
          produk: {
            id: item.produk.id,
            name: item.produk.name,
            code: item.produk.code,
          },
        })),
      }

      // Run comprehensive validation using business rules
      const validationResult = PickupValidator.validatePickupRequest(context, items, catatan)

      // Transform to service interface format
      return {
        valid: validationResult.valid,
        errors: validationResult.errors.map((e) => e.message),
        warnings:
          validationResult.warnings.length > 0
            ? validationResult.warnings.map((w) => w.message)
            : undefined,
      }
    } catch (error) {
      console.error('Pickup validation failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionCode: transaction.kode,
        itemCount: items.length,
        userId: this.userId,
        timestamp: new Date().toISOString(),
      })

      return {
        valid: false,
        errors: ['Terjadi kesalahan saat validasi pickup'],
      }
    }
  }

  /**
   * Validate pickup request against comprehensive business rules
   * ✅ TASK 11: Enhanced with quantity validation to prevent over-pickup
   * @deprecated Use validatePickupRequestWithData() for better performance
   */
  async validatePickupRequest(
    transactionId: string,
    items: PickupItemRequest[],
    catatan?: string,
  ): Promise<PickupValidationResult> {
    try {
      // 1. Check if transaction exists and get current state
      const transaction = await this.prisma.transaksi.findUnique({
        where: { id: transactionId },
        include: {
          items: {
            include: {
              produk: {
                select: { id: true, name: true, code: true },
              },
            },
          },
        },
      })

      if (!transaction) {
        return {
          valid: false,
          errors: ['Transaksi tidak ditemukan'],
        }
      }

      // 2. ✅ TASK 11: Validate remaining quantities to prevent over-pickup
      const quantityErrors: string[] = []
      
      for (const pickupItem of items) {
        const transactionItem = transaction.items.find((ti) => ti.id === pickupItem.id)
        
        if (!transactionItem) {
          quantityErrors.push(
            `Item dengan ID ${pickupItem.id} tidak ditemukan dalam transaksi`
          )
          continue
        }

        // Calculate remaining quantity
        const remainingQuantity = transactionItem.jumlah - transactionItem.jumlahDiambil

        // Validate pickup doesn't exceed remaining quantity
        if (pickupItem.jumlahDiambil > remainingQuantity) {
          quantityErrors.push(
            `Jumlah pickup untuk ${transactionItem.produk.name} melebihi sisa yang tersedia. ` +
            `Tersedia: ${remainingQuantity}, Diminta: ${pickupItem.jumlahDiambil}`
          )
        }

        // Validate pickup quantity is positive
        if (pickupItem.jumlahDiambil <= 0) {
          quantityErrors.push(
            `Jumlah pickup untuk ${transactionItem.produk.name} harus lebih dari 0`
          )
        }
      }

      // Return early if quantity validation fails
      if (quantityErrors.length > 0) {
        return {
          valid: false,
          errors: quantityErrors,
        }
      }

      // 3. Prepare validation context
      const context: ValidationContext = {
        transactionStatus: transaction.status,
        transactionCode: transaction.kode,
        items: transaction.items.map(item => ({
          id: item.id,
          transaksiId: transaction.id, // Use transaction ID since item doesn't have it
          produkId: item.produkId,
          jumlah: item.jumlah,
          hargaSewa: item.hargaSewa,
          durasi: item.durasi,
          subtotal: item.subtotal,
          kondisiAwal: item.kondisiAwal ?? null, // Handle undefined -> null
          statusKembali: item.statusKembali,
          jumlahDiambil: item.jumlahDiambil,
          totalReturnPenalty: item.totalReturnPenalty ?? new Decimal(0), // Provide default
          conditionCount: 1, // Default value since not available in TransaksiWithDetails
          migratedFromSingleMode: false, // Default value since not available in TransaksiWithDetails
          produk: {
            id: item.produk.id,
            name: item.produk.name,
            code: item.produk.code,
          },
        })),
      }

      // 4. Run comprehensive validation using business rules
      const validationResult = PickupValidator.validatePickupRequest(context, items, catatan)

      // 5. Transform to service interface format
      return {
        valid: validationResult.valid,
        errors: validationResult.errors.map((e) => e.message),
        warnings:
          validationResult.warnings.length > 0
            ? validationResult.warnings.map((w) => w.message)
            : undefined,
      }
    } catch (error) {
      // Log validation error with context for debugging
      console.error('Pickup validation failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId,
        itemCount: items.length,
        userId: this.userId,
        timestamp: new Date().toISOString(),
      })

      // Return specific error message based on error type
      let errorMessage = 'Terjadi kesalahan saat validasi pickup'

      if (error instanceof Error) {
        // Check for common database errors
        if (error.message.includes('connection') || error.message.includes('timeout')) {
          errorMessage = 'Database connection error saat validasi pickup'
        } else if (error.message.includes('not found')) {
          errorMessage = 'Transaksi tidak ditemukan'
        } else {
          errorMessage = `Validasi error: ${error.message}`
        }
      }

      return {
        valid: false,
        errors: [errorMessage],
      }
    }
  }

  /**
   * Process pickup operation with atomic database transaction
   */
  async processPickup(
    transactionId: string,
    items: PickupItemRequest[],
    catatan?: string,
  ): Promise<PickupProcessResult> {
    try {
      // 1. Validate the pickup request first
      const validation = await this.validatePickupRequest(transactionId, items, catatan)

      if (!validation.valid) {
        return {
          success: false,
          transaction: {} as TransaksiWithDetails,
          message: 'Validasi pickup gagal',
          error: validation.errors.join(', '),
        }
      }

      // 2. Process pickup in atomic transaction (OPTIMIZED - Task 1.5)
      const resultTransactionId = await this.prisma.$transaction(
        async (tx) => {
          // ✅ ENHANCED: Fetch transaction items with product details and kasir info
          const allTransactionItems = await tx.transaksiItem.findMany({
            where: { transaksiId: transactionId },
            include: {
              produk: {
                select: { id: true, name: true, code: true },
              },
            },
          })

          // ✅ ENHANCED: Fetch transaction with kasir info for user name
          const transaction = await tx.transaksi.findUnique({
            where: { id: transactionId },
            include: {
              kasir: {
                select: { nama: true },
              },
            },
          })

          // ✅ TASK 11 + TASK 1.5 FIX: Update each item's pickup quantity
          // OPTIMIZATION: Use cached data instead of re-fetching (eliminates N queries)
          for (const pickupItem of items) {
            // ✅ FIX: Use already-fetched data instead of re-fetching
            const currentItem = allTransactionItems.find(ti => ti.id === pickupItem.id)

            if (!currentItem) {
              throw new Error(`Item dengan ID ${pickupItem.id} tidak ditemukan`)
            }

            // Calculate remaining quantity with cached data
            const remainingQuantity = currentItem.jumlah - currentItem.jumlahDiambil

            // Validate pickup doesn't exceed remaining quantity (concurrent pickup prevention)
            if (pickupItem.jumlahDiambil > remainingQuantity) {
              throw new Error(
                `Jumlah pickup untuk ${currentItem.produk.name} melebihi sisa yang tersedia. ` +
                `Tersedia: ${remainingQuantity}, Diminta: ${pickupItem.jumlahDiambil}. ` +
                `Item mungkin telah diambil oleh proses lain. Silakan refresh dan coba lagi.`
              )
            }

            // Update pickup quantity
            await tx.transaksiItem.update({
              where: { id: pickupItem.id },
              data: {
                jumlahDiambil: {
                  increment: pickupItem.jumlahDiambil,
                },
              },
            })
          }

          // ✅ TASK 5: Deduct stock during pickup operation (moved from transaction creation)
          // This implements the new stock management flow where stock is only deducted when items are actually picked up
          //eslint-
          const txInventoryService = createInventoryService(tx as any) // Type assertion for transaction context
          
          for (const pickupItem of items) {
            const transactionItem = allTransactionItems.find(ti => ti.id === pickupItem.id)
            if (!transactionItem) continue
            
            // Extract productSizeId from kondisiAwal field
            // Format: "productSizeId|size|ageCategory|condition"
            const kondisiParts = transactionItem.kondisiAwal?.split('|') || []
            const productSizeId = kondisiParts[0]
            
            if (productSizeId) {
              // Deduct stock for the picked up quantity
              await txInventoryService.updateStockOnCreate(productSizeId, pickupItem.jumlahDiambil)
            } else {
              console.warn('Could not extract productSizeId from kondisiAwal:', {
                itemId: pickupItem.id,
                kondisiAwal: transactionItem.kondisiAwal,
                transactionId: transactionId
              })
            }
          }

        // ✅ ENHANCED: Create activity log with product details and kasir name
        const itemsDescription = items
          .map((item) => {
            const transactionItem = allTransactionItems.find((ti) => ti.id === item.id)
            return `${transactionItem?.produk?.name || 'Unknown Product'} (${item.jumlahDiambil} unit)`
          })
          .join(', ')

        const activityData = {
          items: items.map((item) => {
            const transactionItem = allTransactionItems.find((ti) => ti.id === item.id)
            return {
              itemId: item.id,
              jumlahDiambil: item.jumlahDiambil,
              // ✅ NEW: Add product details
              productName: transactionItem?.produk?.name,
              productCode: transactionItem?.produk?.code,
              kondisiAwal: transactionItem?.kondisiAwal,
            }
          }),
          processedBy: this.userId,
          processedByName: transaction?.kasir?.nama, // ✅ NEW: Add kasir name
          timestamp: new Date().toISOString(),
          ...(catatan && { catatan }),
        }

        await tx.aktivitasTransaksi.create({
          data: {
            transaksiId: transactionId,
            tipe: 'diambil',
            deskripsi: catatan
              ? `Pickup: ${itemsDescription} - ${catatan}`
              : `Pickup: ${itemsDescription}`,
            data: activityData,
            createdBy: this.userId,
          },
        })

        // ✅ TASK 9: Fix critical partial pickup bug - Check if ALL items are fully picked up
        // Use Array.every() to verify EVERY item has jumlahDiambil >= jumlah
        // This correctly handles partial pickups where some items are picked but others are not
        const allItemsPickedUp = allTransactionItems.every(item => 
          item.jumlahDiambil >= item.jumlah
        )

        // ✅ REMOVED: status_pickup activity log (clutters timeline)
        // ✅ REMOVED: status_changed activity log (redundant)

        // ✅ FIXED: Update transaction status ONLY when ALL quantities are picked up
        // This ensures partial pickups keep status as 'active' or 'terlambat'
        if (allItemsPickedUp) {
          await tx.transaksi.update({
            where: { id: transactionId },
            data: { status: 'diambil' },
          })
        }

        // ✅ TASK 1.5 FIX: Return only transaction ID (not full object)
        // This eliminates the heavy final query from inside transaction
        return transactionId
      },
      {
        timeout: 8000, // ✅ TASK 1.5 FIX: Safety net - increased from default 5000ms
      }
    )

      // ✅ TASK 1.5 FIX: Fetch updated transaction with full details OUTSIDE transaction
      // This prevents timeout by moving expensive query outside the transaction block
      const updatedTransaction = await this.prisma.transaksi.findUnique({
        where: { id: resultTransactionId },
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
            // ✅ TASK 1.5: Include kasir information (minimal fields for performance)
            select: {
              id: true,
              nama: true,
              // ✅ REMOVED: isActive, createdAt, updatedAt (not needed in response)
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
            take: 10, // ✅ TASK 1.5: Limit to latest 10 activities (reduces payload size)
          },
        },
      })

      if (!updatedTransaction) {
        throw new Error('Failed to fetch updated transaction details after pickup')
      }

      const result = updatedTransaction as unknown as TransaksiWithDetails

      // 3. Generate success message
      const totalItems = items.reduce((sum, item) => sum + item.jumlahDiambil, 0)
      const message = `Berhasil memproses pickup ${totalItems} item dari transaksi ${result.kode}`

      return {
        success: true,
        transaction: result,
        message,
      }
    } catch (error) {
      // Create comprehensive error context for debugging
      const errorContext = {
        transactionId,
        items: items.map((item) => ({
          id: item.id,
          jumlahDiambil: item.jumlahDiambil,
        })),
        userId: this.userId,
        timestamp: new Date().toISOString(),
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
              }
            : {
                message: 'Unknown error',
                type: typeof error,
              },
      }

      // Log detailed error information
      console.error('Pickup processing failed:', errorContext)

      // Determine error type and create appropriate error message
      let errorMessage = 'Gagal memproses pickup'

      if (error instanceof Error) {
        // ✅ TASK 1.5 FIX: Transaction timeout errors (specific handling)
        if (error.message.includes('Transaction already closed') || error.message.includes('expired transaction')) {
          errorMessage = 'Operasi pickup memakan waktu terlalu lama. Silakan coba lagi.'
        }
        // Database connection errors
        else if (error.message.includes('connection') || error.message.includes('timeout')) {
          errorMessage = 'Database connection error. Silakan coba lagi beberapa saat.'
        }
        // Constraint violations
        else if (error.message.includes('constraint') || error.message.includes('unique')) {
          errorMessage = 'Data conflict detected. Item mungkin telah diambil oleh proses lain.'
        }
        // Transaction errors
        else if (error.message.includes('transaction') || error.message.includes('rollback')) {
          errorMessage = 'Transaksi gagal diproses. Silakan coba lagi.'
        }
        // Permission/validation errors
        else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          errorMessage = 'Anda tidak memiliki izin untuk melakukan pickup pada transaksi ini.'
        }
        // Item not found errors
        else if (error.message.includes('not found') || error.message.includes('tidak ditemukan')) {
          errorMessage = 'Item transaksi tidak ditemukan. Transaksi mungkin telah diubah.'
        }
        // Generic error with specific message
        else {
          errorMessage = `Gagal memproses pickup: ${error.message}`
        }
      } else {
        errorMessage = 'Gagal memproses pickup karena kesalahan sistem yang tidak diketahui.'
      }

      throw new Error(errorMessage)
    }
  }

  /**
   * @deprecated This method is no longer used. Status update is now handled
   * within processPickup() transaction to avoid nested transaction issues.
   * Keeping for backward compatibility but logs deprecation warning.
   */
  async updateTransactionPickupStatus(transactionId: string): Promise<void> {
    // Log deprecation warning
    console.warn('[DEPRECATED] updateTransactionPickupStatus called. This method is deprecated.', {
      transactionId,
      userId: this.userId,
      timestamp: new Date().toISOString(),
      reason: 'Status update moved to processPickup() transaction to avoid nested transactions'
    })
    try {
      const transaction = await this.prisma.transaksi.findUnique({
        where: { id: transactionId },
        include: {
          items: true,
        },
      })

      if (!transaction) {
        throw new Error('Transaksi tidak ditemukan')
      }

      // Calculate pickup completion statistics
      const pickupStats = transaction.items.reduce(
        (stats, item) => {
          const isFullyPickedUp = item.jumlahDiambil >= item.jumlah
          const isPartiallyPickedUp = item.jumlahDiambil > 0 && item.jumlahDiambil < item.jumlah

          return {
            totalItems: stats.totalItems + 1,
            fullyPickedUp: stats.fullyPickedUp + (isFullyPickedUp ? 1 : 0),
            partiallyPickedUp: stats.partiallyPickedUp + (isPartiallyPickedUp ? 1 : 0),
            notPickedUp: stats.notPickedUp + (item.jumlahDiambil === 0 ? 1 : 0),
          }
        },
        {
          totalItems: 0,
          fullyPickedUp: 0,
          partiallyPickedUp: 0,
          notPickedUp: 0,
        },
      )

      // Log pickup status for monitoring
      await this.prisma.aktivitasTransaksi.create({
        data: {
          transaksiId: transactionId,
          tipe: 'status_pickup',
          deskripsi: `Status pickup: ${pickupStats.fullyPickedUp} lengkap, ${pickupStats.partiallyPickedUp} sebagian, ${pickupStats.notPickedUp} belum`,
          data: {
            pickupStats,
            calculatedBy: this.userId,
            timestamp: new Date().toISOString(),
          },
          createdBy: this.userId,
        },
      })

      // Update transaction status to 'diambil' if all items are fully picked up
      if (pickupStats.fullyPickedUp === pickupStats.totalItems && pickupStats.notPickedUp === 0) {
        await this.transaksiService.updateTransaksiStatus(transactionId, { status: 'diambil' })
      }
    } catch (error) {
      // Log error for monitoring but don't throw as this is secondary operation
      console.error('Failed to update transaction pickup status:', {
        transactionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: this.userId,
        timestamp: new Date().toISOString(),
      })
      // This is a non-critical operation, so we don't throw to avoid affecting main pickup flow
    }
  }

  /**
   * Get pickup summary for a transaction
   */
  async getPickupSummary(transactionId: string): Promise<{
    totalItems: number
    totalQuantity: number
    pickedUpQuantity: number
    remainingQuantity: number
    pickupPercentage: number
    items: Array<{
      id: string
      productName: string
      productCode: string
      totalQuantity: number
      pickedUpQuantity: number
      remainingQuantity: number
      isFullyPickedUp: boolean
    }>
  } | null> {
    try {
      const transaction = await this.prisma.transaksi.findUnique({
        where: { id: transactionId },
        include: {
          items: {
            include: {
              produk: {
                select: { id: true, name: true, code: true },
              },
            },
          },
        },
      })

      if (!transaction) {
        return null
      }

      const items = transaction.items.map((item) => ({
        id: item.id,
        productName: item.produk.name,
        productCode: item.produk.code,
        totalQuantity: item.jumlah,
        pickedUpQuantity: item.jumlahDiambil,
        remainingQuantity: item.jumlah - item.jumlahDiambil,
        isFullyPickedUp: item.jumlahDiambil >= item.jumlah,
      }))

      const totalQuantity = transaction.items.reduce((sum, item) => sum + item.jumlah, 0)
      const pickedUpQuantity = transaction.items.reduce((sum, item) => sum + item.jumlahDiambil, 0)
      const remainingQuantity = totalQuantity - pickedUpQuantity
      const pickupPercentage =
        totalQuantity > 0 ? Math.round((pickedUpQuantity / totalQuantity) * 100) : 0

      return {
        totalItems: transaction.items.length,
        totalQuantity,
        pickedUpQuantity,
        remainingQuantity,
        pickupPercentage,
        items,
      }
    } catch (error) {
      // Log error for debugging but return null as expected by interface
      console.error('Failed to get pickup summary:', {
        transactionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: this.userId,
        timestamp: new Date().toISOString(),
      })
      return null
    }
  }
}

/**
 * Factory function to create PickupService instance
 */
export const createPickupService = (
  prisma: PrismaClient,
  userId: string,
  transaksiService: TransaksiService
): PickupService => {
  return new PickupService(prisma, userId, transaksiService)
}
