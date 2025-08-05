/**
 * ReturnService - TSK-23
 * Service layer for return processing operations
 * Following existing TransaksiService patterns and TDD approach
 */

import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import {
  ReturnRequest,
  ReturnItemRequest,
  ExtendedTransactionStatus,
  validateReturnItemContext,
} from '../lib/validation/returnSchema'
import { PenaltyCalculator, PenaltyCalculationResult } from '../lib/utils/penaltyCalculator'
import { TransaksiService, TransaksiWithDetails, TransaksiForValidation } from './transaksiService'
import { createAuditService, AuditService } from './auditService'

export interface ReturnEligibilityResult {
  isEligible: boolean
  reason?: string
  transaction?: TransaksiWithDetails
  eligibilityDetails?: {
    currentStatus: string
    hasUnreturnedItems: boolean
    canProcessReturn: boolean
  }
}

export interface ReturnProcessingResult {
  success: boolean
  transaksiId: string
  totalPenalty: number
  processedItems: Array<{
    itemId: string
    penalty: number
    kondisiAkhir: string
    statusKembali: 'lengkap'
  }>
  updatedTransaction: {
    id: string
    status: ExtendedTransactionStatus
    tglKembali: Date
    sisaBayar: number
  }
  penaltyCalculation?: PenaltyCalculationResult
}

export interface ReturnValidationError {
  field: string
  message: string
  code: string
}

export class ReturnService {
  private transaksiService: TransaksiService
  private auditService: AuditService

  constructor(
    private prisma: PrismaClient,
    private userId: string,
  ) {
    this.transaksiService = new TransaksiService(prisma, userId)
    this.auditService = createAuditService(prisma, userId)
  }

  /**
   * Combined validation for return processing (single database query)
   * Optimized lean query to reduce response time by ~60%
   */
  async validateReturnProcessing(
    transaksiId: string,
    returnItems: ReturnItemRequest[]
  ): Promise<{
    isValid: boolean
    error?: string
    details?: Record<string, unknown>
    transaction?: { transaction: TransaksiForValidation }
  }> {
    try {
      // Optimized lean database query for validation only
      const transaction = await this.transaksiService.getTransaksiForValidation(transaksiId)

      // Check transaction status eligibility
      if (transaction.status !== 'active') {
        return {
          isValid: false,
          error: `Transaksi dengan status '${transaction.status}' tidak dapat diproses pengembaliannya`,
          details: { currentStatus: transaction.status }
        }
      }

      // Check if there are items that have been picked up but not returned
      const hasUnreturnedItems = transaction.items.some(
        (item) => item.jumlahDiambil > 0 && item.statusKembali !== 'lengkap',
      )

      if (!hasUnreturnedItems) {
        return {
          isValid: false,
          error: 'Tidak ada barang yang perlu dikembalikan pada transaksi ini',
          details: { hasUnreturnedItems: false }
        }
      }

      // Validate each return item
      const errors: ReturnValidationError[] = []
      for (const returnItem of returnItems) {
        const transactionItem = transaction.items.find((item) => item.id === returnItem.itemId)

        if (!transactionItem) {
          errors.push({
            field: 'itemId',
            message: `Item dengan ID ${returnItem.itemId} tidak ditemukan dalam transaksi`,
            code: 'ITEM_NOT_FOUND',
          })
          continue
        }

        // Smart business validation using schema integration
        const adaptedTransactionItem = {
          produk: {
            name: transactionItem.produk.name,
            modalAwal: transactionItem.produk.modalAwal ? Number(transactionItem.produk.modalAwal) : null
          }
        }
        const businessValidation = validateReturnItemContext(returnItem, adaptedTransactionItem)
        if (!businessValidation.isValid) {
          errors.push(...businessValidation.errors)
        }

        if (returnItem.jumlahKembali > transactionItem.jumlahDiambil) {
          errors.push({
            field: 'jumlahKembali',
            message: `Jumlah pengembalian (${returnItem.jumlahKembali}) tidak boleh melebihi jumlah yang diambil (${transactionItem.jumlahDiambil}) untuk item ${transactionItem.produk.name}`,
            code: 'EXCESS_RETURN_QUANTITY',
          })
        }

        // Validate condition
        if (!returnItem.kondisiAkhir || returnItem.kondisiAkhir.trim() === '') {
          errors.push({
            field: 'kondisiAkhir',
            message: `Kondisi akhir harus diisi untuk item ${transactionItem.produk.name}`,
            code: 'MISSING_CONDITION',
          })
        }
      }

      if (errors.length > 0) {
        return {
          isValid: false,
          error: `Validasi item gagal: ${errors.map((e) => e.message).join(', ')}`,
          details: { errors }
        }
      }

      return {
        isValid: true,
        transaction: { transaction }
      }
    } catch (error) {
      return {
        isValid: false,
        error: `Gagal validasi: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { originalError: error }
      }
    }
  }

  /**
   * Validate if a transaction is eligible for return processing
   * @deprecated Use validateReturnProcessing instead for better performance
   */
  async validateReturnEligibility(transaksiId: string): Promise<ReturnEligibilityResult> {
    try {
      // Get transaction with full details
      const transaction = await this.transaksiService.getTransaksiById(transaksiId)

      // Check if transaction status allows returns
      if (transaction.status !== 'active') {
        return {
          isEligible: false,
          reason: `Transaksi dengan status '${transaction.status}' tidak dapat diproses pengembaliannya`,
          transaction,
        }
      }

      // Check if there are items that have been picked up but not returned
      const hasUnreturnedItems = transaction.items.some(
        (item) => item.jumlahDiambil > 0 && item.statusKembali !== 'lengkap',
      )

      if (!hasUnreturnedItems) {
        return {
          isEligible: false,
          reason: 'Tidak ada barang yang perlu dikembalikan pada transaksi ini',
          transaction,
          eligibilityDetails: {
            currentStatus: transaction.status,
            hasUnreturnedItems: false,
            canProcessReturn: false,
          },
        }
      }

      return {
        isEligible: true,
        transaction,
        eligibilityDetails: {
          currentStatus: transaction.status,
          hasUnreturnedItems: true,
          canProcessReturn: true,
        },
      }
    } catch (error) {
      throw new Error(
        `Gagal memvalidasi kelayakan pengembalian: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Validate return request items against transaction items
   */
  async validateReturnItems(
    transaksiId: string,
    returnItems: ReturnItemRequest[],
  ): Promise<{ isValid: boolean; errors: ReturnValidationError[] }> {
    const errors: ReturnValidationError[] = []

    try {
      // Get transaction details
      const transaction = await this.transaksiService.getTransaksiById(transaksiId)

      // Validate each return item
      for (const returnItem of returnItems) {
        const transactionItem = transaction.items.find((item) => item.id === returnItem.itemId)

        if (!transactionItem) {
          errors.push({
            field: `items.${returnItem.itemId}`,
            message: 'Item tidak ditemukan dalam transaksi',
            code: 'ITEM_NOT_FOUND',
          })
          continue
        }

        // Check if item has been picked up
        if (transactionItem.jumlahDiambil === 0) {
          errors.push({
            field: `items.${returnItem.itemId}`,
            message: 'Item belum diambil, tidak dapat dikembalikan',
            code: 'ITEM_NOT_PICKED_UP',
          })
          continue
        }

        // Check if item is already fully returned
        if (transactionItem.statusKembali === 'lengkap') {
          errors.push({
            field: `items.${returnItem.itemId}`,
            message: 'Item sudah dikembalikan sepenuhnya',
            code: 'ITEM_ALREADY_RETURNED',
          })
          continue
        }

        // Check if return quantity is valid
        const maxReturnableQuantity = transactionItem.jumlahDiambil
        if (returnItem.jumlahKembali > maxReturnableQuantity) {
          errors.push({
            field: `items.${returnItem.itemId}`,
            message: `Jumlah kembali (${returnItem.jumlahKembali}) melebihi jumlah yang diambil (${maxReturnableQuantity})`,
            code: 'INVALID_RETURN_QUANTITY',
          })
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
      }
    } catch (error) {
      errors.push({
        field: 'general',
        message: `Gagal memvalidasi item pengembalian: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'VALIDATION_ERROR',
      })

      return {
        isValid: false,
        errors,
      }
    }
  }

  /**
   * Calculate penalties for return items
   */
  async calculateReturnPenalties(
    transaksiId: string,
    returnItems: ReturnItemRequest[],
    actualReturnDate: Date = new Date(),
  ): Promise<PenaltyCalculationResult> {
    try {
      // Get transaction details (optimized query for penalty calculation)
      const transaction = await this.transaksiService.getTransaksiForPenaltyCalculation(transaksiId)

      // Prepare items for penalty calculation
      const itemsForCalculation = returnItems.map((returnItem) => {
        const transactionItem = transaction.items.find((item) => item.id === returnItem.itemId)
        if (!transactionItem) {
          throw new Error(`Item dengan ID ${returnItem.itemId} tidak ditemukan`)
        }

        return {
          id: returnItem.itemId,
          productName: transactionItem.produk.name,
          expectedReturnDate: transaction.tglSelesai || new Date(),
          actualReturnDate,
          condition: returnItem.kondisiAkhir,
          quantity: returnItem.jumlahKembali,
          modalAwal: Number(transactionItem.produk.modalAwal), // Added for lost item penalty calculation
        }
      })

      // Calculate penalties using PenaltyCalculator
      const penaltyResult = PenaltyCalculator.calculateTransactionPenalties(itemsForCalculation)

      return penaltyResult
    } catch (error) {
      throw new Error(
        `Gagal menghitung penalty: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Process return transaction with atomic database operations
   * Refactored to prevent transaction timeout by moving penalty calculation outside transaction
   */
  async processReturn(
    transaksiId: string,
    request: ReturnRequest,
  ): Promise<ReturnProcessingResult> {
    const startTime = Date.now()
    
    try {
      // Step 1: Log return processing start (fire-and-forget async - zero blocking)
      Promise.resolve().then(() => 
        this.auditService.logReturnActivityAsync(transaksiId, {
          items: request.items,
          totalPenalty: 0,
          totalLateDays: 0,
          catatan: request.catatan,
          stage: 'validation',
        })
      ).catch(() => {
        // Silently handle logging errors to keep main process clean
      })

      // Step 2: Pre-transaction validations and calculations (parallel processing)
      const returnDate = request.tglKembali ? new Date(request.tglKembali) : new Date()
      
      // Run validation and penalty calculation in parallel
      const [combinedValidation, penaltyCalculation] = await Promise.all([
        this.validateReturnProcessing(transaksiId, request.items),
        this.calculateReturnPenalties(transaksiId, request.items, returnDate)
      ])
      
      // Check validation results
      if (!combinedValidation.isValid) {
        const errorMessage = combinedValidation.error || 'Validation failed'
        
        await this.auditService.logReturnError(transaksiId, {
          error: errorMessage,
          stage: 'validation',
          context: { details: combinedValidation.details },
          duration: Date.now() - startTime,
        })
        throw new Error(errorMessage)
      }
      
      const eligibility = combinedValidation.transaction!.transaction

      // Log calculation start (fire-and-forget async - zero blocking)
      Promise.resolve().then(() =>
        this.auditService.logReturnActivityAsync(transaksiId, {
          items: request.items,
          totalPenalty: penaltyCalculation.totalPenalty,
          totalLateDays: penaltyCalculation.totalLateDays,
          catatan: request.catatan,
          stage: 'calculation',
        })
      ).catch(() => {
        // Silently handle logging errors to keep main process clean
      })

      // Log penalty calculation details (fire-and-forget async - zero blocking)
      Promise.resolve().then(() =>
        this.auditService.logPenaltyCalculationAsync(transaksiId, {
          calculationDuration: 0,
          totalPenalty: penaltyCalculation.totalPenalty,
          lateDays: penaltyCalculation.totalLateDays,
          itemBreakdown: penaltyCalculation.itemPenalties.map(p => ({
            itemId: p.itemId,
            productName: p.productName,
            penalty: p.totalPenalty,
            reason: p.description,
          })),
        })
      ).catch(() => {
        // Silently handle logging errors to keep main process clean
      })

      // Log processing start (fire-and-forget async - zero blocking)
      Promise.resolve().then(() =>
        this.auditService.logReturnActivityAsync(transaksiId, {
          items: request.items,
          totalPenalty: penaltyCalculation.totalPenalty,
          totalLateDays: penaltyCalculation.totalLateDays,
          catatan: request.catatan,
          stage: 'processing',
        })
      ).catch(() => {
        // Silently handle logging errors to keep main process clean
      })

      // Step 3: Execute atomic database operations in transaction
      const transactionStart = Date.now()
      const transactionResult = await this.prisma.$transaction(
        async (tx) => {
          // Update transaction status and penalty
          const updatedTransaction = await tx.transaksi.update({
            where: { id: transaksiId },
            data: {
              status: 'dikembalikan',
              tglKembali: returnDate,
              sisaBayar: {
                increment: new Decimal(penaltyCalculation.totalPenalty),
              },
            },
          })

          // Prepare batch operations data
          const processedItems = []
          const transactionItemUpdates = []
          const productStockUpdates = new Map<string, number>()

          // Prepare all updates in memory first
          for (const returnItem of request.items) {
            // Find penalty details for this item
            const itemPenalty = penaltyCalculation.itemPenalties.find(
              (p) => p.itemId === returnItem.itemId,
            )

            // Prepare transaction item update
            transactionItemUpdates.push(
              tx.transaksiItem.update({
                where: { id: returnItem.itemId },
                data: {
                  kondisiAkhir: returnItem.kondisiAkhir,
                  statusKembali: 'lengkap',
                },
              })
            )

            // Prepare processed item result
            processedItems.push({
              itemId: returnItem.itemId,
              penalty: itemPenalty?.totalPenalty || 0,
              kondisiAkhir: returnItem.kondisiAkhir,
              statusKembali: 'lengkap' as const,
            })

            // Aggregate product stock updates
            const transactionItem = eligibility.items.find(
              (item) => item.id === returnItem.itemId,
            )
            if (transactionItem) {
              const currentIncrement = productStockUpdates.get(transactionItem.produkId) || 0
              productStockUpdates.set(transactionItem.produkId, currentIncrement + returnItem.jumlahKembali)
            }
          }

          // Execute all database operations in parallel for maximum performance
          const productUpdatePromises = Array.from(productStockUpdates.entries()).map(([produkId, increment]) =>
            tx.product.update({
              where: { id: produkId },
              data: {
                quantity: {
                  increment: increment,
                },
              },
            })
          )
          
          // Execute all updates in parallel: transaction items + product stocks
          await Promise.all([
            ...transactionItemUpdates,
            ...productUpdatePromises
          ])

          const result = {
            success: true,
            transaksiId,
            totalPenalty: penaltyCalculation.totalPenalty,
            processedItems,
            updatedTransaction: {
              id: updatedTransaction.id,
              status: 'dikembalikan' as ExtendedTransactionStatus,
              tglKembali: returnDate,
              sisaBayar: Number(updatedTransaction.sisaBayar),
            },
            penaltyCalculation,
          }

          return result
        },
        {
          timeout: 10000, // Increase timeout to 10 seconds for safety
        }
      )
      
      const transactionInternalDuration = Date.now() - transactionStart

      // Log successful completion outside transaction (fire-and-forget async - zero blocking)
      Promise.resolve().then(() =>
        this.auditService.logReturnActivityAsync(transaksiId, {
          items: request.items,
          totalPenalty: penaltyCalculation.totalPenalty,
          totalLateDays: penaltyCalculation.totalLateDays,
          catatan: request.catatan,
          stage: 'completed',
        }, {
          totalDuration: Date.now() - startTime,
          transactionDuration: transactionInternalDuration,
        })
      ).catch(() => {
        // Silently handle logging errors to keep main process clean
      })

      return transactionResult
    } catch (error) {
      // Log error to audit trail
      await this.auditService.logReturnError(transaksiId, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stage: 'processing',
        stack: error instanceof Error ? error.stack : undefined,
        duration: Date.now() - startTime,
        context: {},
      })
      
      throw new Error(`Gagal memproses pengembalian: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get return transaction by transaction code
   */
  async getReturnTransactionByCode(transactionCode: string): Promise<TransaksiWithDetails> {
    try {
      return await this.transaksiService.getTransaksiByCode(transactionCode)
    } catch (error) {
      throw new Error(
        `Gagal mendapatkan transaksi: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Get return history for a transaction
   */
  async getReturnHistory(transaksiId: string) {
    try {
      const activities = await this.prisma.aktivitasTransaksi.findMany({
        where: {
          transaksiId,
          tipe: 'dikembalikan',
        },
        orderBy: {
          createdAt: 'desc',
        },
        // include: {
        //   user: {
        //     select: {
        //       id: true,
        //       nama: true
        //     }
        //   }
        // }
      })

      return activities.map((activity) => ({
        id: activity.id,
        returnDate: activity.createdAt,
        processedBy: 'Unknown', // Fix: user relation not available
        description: activity.deskripsi,
        penaltyAmount:
          activity.data && typeof activity.data === 'object' && 'penaltyDetails' in activity.data
            ? (activity.data.penaltyDetails as { totalPenalty?: number })?.totalPenalty || 0
            : 0,
        items:
          activity.data && typeof activity.data === 'object' && 'returnItems' in activity.data
            ? (activity.data.returnItems as Array<{
                itemId: string
                kondisiAkhir: string
                jumlahKembali: number
              }>) || []
            : [],
        notes:
          activity.data && typeof activity.data === 'object' && 'catatan' in activity.data
            ? (activity.data.catatan as string) || null
            : null,
      }))
    } catch (error) {
      throw new Error(
        `Gagal mendapatkan riwayat pengembalian: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }
}
