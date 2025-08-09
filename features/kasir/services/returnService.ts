/**
 * Unified Return Service - TSK-24 Phase 1
 * Single-mode removal implementation with unified multi-condition architecture
 * Eliminates dual-mode processing complexity through unified interface
 */

import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import {
  ReturnRequest,
  ReturnItemRequest,
  ExtendedTransactionStatus,
  ReturnValidationError,
  validateReturnItemContext,
  isLostItemCondition,
} from '../lib/validation/unifiedValidationSchema'
import { PenaltyCalculator, PenaltyCalculationResult } from '../lib/utils/penaltyCalculator'
import { TransaksiService, TransaksiWithDetails, TransaksiForValidation } from './transaksiService'
import { createAuditService, AuditService } from './auditService'
import { logger } from '../../../services/logger'

// Unified return request interface - treats all returns as multi-condition
interface UnifiedReturnRequest {
  items: Array<{
    itemId: string
    conditions: Array<{
      kondisiAkhir: string
      jumlahKembali: number
      modalAwal?: number
    }>
  }>
  catatan?: string
  tglKembali?: string
}

// Unified processing result interface
interface UnifiedReturnProcessingResult {
  success: boolean
  transactionId: string
  returnedAt: Date
  penalty: number
  processedItems: Array<{
    itemId: string
    penalty: number
    kondisiAkhir: string
    statusKembali: 'lengkap'
    conditionBreakdown?: Array<{
      kondisiAkhir: string
      jumlahKembali: number
      penaltyAmount: number
    }>
  }>
  processingMode: 'unified' // Always unified in new architecture
  details?: {
    statusCode: 'ALREADY_RETURNED' | 'INVALID_STATUS' | 'VALIDATION_ERROR'
    message: string
    currentStatus: string
    originalReturnDate?: Date | null
    processingTime: number
    validationErrors?: Array<{
      field: string
      message: string
      code: string
    }>
  }
}

export interface ReturnValidationError {
  field: string
  message: string
  code: string
}

export class UnifiedReturnService {
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
   * Convert legacy single-mode request to unified format
   * This enables backward compatibility while using unified processing
   */
  private convertLegacyRequest(request: ReturnRequest): UnifiedReturnRequest {
    return {
      items: request.items.map((item) => ({
        itemId: item.itemId,
        conditions: [
          {
            kondisiAkhir: item.kondisiAkhir,
            jumlahKembali: item.jumlahKembali,
          },
        ],
      })),
      catatan: request.catatan,
      tglKembali: request.tglKembali,
    }
  }

  /**
   * Unified validation for all return processing scenarios
   * Single method handles both simple and complex returns
   */
  async validateUnifiedReturn(
    transaksiId: string,
    request: UnifiedReturnRequest,
  ): Promise<{
    isValid: boolean
    error?: string
    details?: Record<string, unknown>
    transaction?: { transaction: TransaksiForValidation }
  }> {
    try {
      // Get transaction for validation
      const transaction = await this.transaksiService.getTransaksiForValidation(transaksiId)

      // Check transaction status eligibility
      if (transaction.status !== 'active') {
        return {
          isValid: false,
          error: `Transaksi dengan status '${transaction.status}' tidak dapat diproses pengembaliannya`,
          details: { currentStatus: transaction.status },
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
          details: { hasUnreturnedItems: false },
        }
      }

      // Validate each return item with unified validation
      const errors: ReturnValidationError[] = []
      for (const returnItem of request.items) {
        const transactionItem = transaction.items.find((item) => item.id === returnItem.itemId)

        if (!transactionItem) {
          errors.push({
            field: 'itemId',
            message: `Item dengan ID ${returnItem.itemId} tidak ditemukan dalam transaksi`,
            code: 'ITEM_NOT_FOUND',
          })
          continue
        }

        // Validate each condition within the item
        let totalReturnQuantity = 0
        for (
          let conditionIndex = 0;
          conditionIndex < returnItem.conditions.length;
          conditionIndex++
        ) {
          const condition = returnItem.conditions[conditionIndex]

          // Validate condition description
          if (!condition.kondisiAkhir || condition.kondisiAkhir.trim() === '') {
            errors.push({
              field: `items[${returnItem.itemId}].conditions[${conditionIndex}].kondisiAkhir`,
              message: 'Kondisi akhir harus diisi dengan deskripsi yang jelas (minimal 5 karakter)',
              code: 'MISSING_CONDITION',
            })
            continue
          }

          // Validate quantity based on condition type
          const isLostItem = isLostItemCondition(condition.kondisiAkhir)
          if (isLostItem && condition.jumlahKembali !== 0) {
            errors.push({
              field: `items[${returnItem.itemId}].conditions[${conditionIndex}].jumlahKembali`,
              message: 'Barang hilang atau tidak dikembalikan harus memiliki jumlah kembali = 0',
              code: 'LOST_ITEM_INVALID_QUANTITY',
            })
          } else if (!isLostItem && condition.jumlahKembali <= 0) {
            errors.push({
              field: `items[${returnItem.itemId}].conditions[${conditionIndex}].jumlahKembali`,
              message: 'Barang yang dikembalikan harus memiliki jumlah kembali lebih dari 0',
              code: 'RETURNED_ITEM_INVALID_QUANTITY',
            })
          }

          totalReturnQuantity += condition.jumlahKembali
        }

        // Check that total return quantity doesn't exceed picked up quantity
        if (totalReturnQuantity > transactionItem.jumlahDiambil) {
          errors.push({
            field: `items[${returnItem.itemId}]`,
            message: `Total jumlah kembali dari semua kondisi (${totalReturnQuantity}) melebihi jumlah yang diambil (${transactionItem.jumlahDiambil})`,
            code: 'EXCESS_TOTAL_QUANTITY',
          })
        }
      }

      if (errors.length > 0) {
        logger.warn('UnifiedReturnService', 'validateUnifiedReturn', 'Return validation failed', {
          transactionId: transaksiId,
          errorCount: errors.length,
          itemsValidated: request.items.length,
        })

        return {
          isValid: false,
          error: `Validasi item gagal: ${errors.map((e) => e.message).join(', ')}`,
          details: { errors },
        }
      }

      logger.debug(
        'UnifiedReturnService',
        'validateUnifiedReturn',
        'Return validation successful',
        {
          transactionId: transaksiId,
          itemsValidated: request.items.length,
          transactionStatus: transaction.status,
        },
      )

      return {
        isValid: true,
        transaction: { transaction },
      }
    } catch (error) {
      logger.error('UnifiedReturnService', 'validateUnifiedReturn', 'Return validation error', {
        transactionId: transaksiId,
        error: error instanceof Error ? error.message : 'Unknown error',
        itemsAttempted: request.items.length,
      })

      return {
        isValid: false,
        error: `Gagal validasi: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { originalError: error },
      }
    }
  }

  /**
   * Calculate penalties for unified return request
   */
  async calculateUnifiedReturnPenalties(
    transaksiId: string,
    request: UnifiedReturnRequest,
    actualReturnDate: Date = new Date(),
  ): Promise<PenaltyCalculationResult> {
    try {
      // Get transaction details (optimized query for penalty calculation)
      const transaction = await this.transaksiService.getTransaksiForPenaltyCalculation(transaksiId)

      // Flatten all conditions into penalty calculation items
      const itemsForCalculation = request.items.flatMap((returnItem) => {
        const transactionItem = transaction.items.find((item) => item.id === returnItem.itemId)
        if (!transactionItem) {
          throw new Error(`Item dengan ID ${returnItem.itemId} tidak ditemukan`)
        }

        return returnItem.conditions.map((condition) => ({
          id: `${returnItem.itemId}-${condition.kondisiAkhir}`,
          productName: transactionItem.produk.name,
          expectedReturnDate: transaction.tglSelesai || new Date(),
          actualReturnDate,
          condition: condition.kondisiAkhir,
          quantity: condition.jumlahKembali,
          modalAwal: condition.modalAwal || Number(transactionItem.produk.modalAwal),
        }))
      })

      // Calculate penalties using existing PenaltyCalculator
      const penaltyResult = PenaltyCalculator.calculateTransactionPenalties(itemsForCalculation)

      return penaltyResult
    } catch (error) {
      logger.error(
        'UnifiedReturnService',
        'calculateUnifiedReturnPenalties',
        'Penalty calculation failed',
        {
          transactionId: transaksiId,
          itemCount: request.items.length,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      )

      throw new Error(
        `Gagal menghitung penalty: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Process unified return transaction
   * Single method handles all return scenarios through unified architecture
   */
  async processUnifiedReturn(
    transaksiId: string,
    request: UnifiedReturnRequest,
  ): Promise<UnifiedReturnProcessingResult> {
    const startTime = Date.now()

    try {
      // Early status validation
      const transactionForValidation =
        await this.transaksiService.getTransaksiForValidation(transaksiId)

      if (transactionForValidation.status === 'dikembalikan') {
        return {
          success: false,
          transactionId: transaksiId,
          returnedAt: new Date(),
          penalty: 0,
          processedItems: [],
          processingMode: 'unified',
          details: {
            statusCode: 'ALREADY_RETURNED' as const,
            message: 'Transaksi sudah dikembalikan sebelumnya',
            currentStatus: transactionForValidation.status,
            originalReturnDate: null,
            processingTime: Date.now() - startTime,
          },
        }
      }

      if (transactionForValidation.status !== 'active') {
        return {
          success: false,
          transactionId: transaksiId,
          returnedAt: new Date(),
          penalty: 0,
          processedItems: [],
          processingMode: 'unified',
          details: {
            statusCode: 'INVALID_STATUS' as const,
            message: `Transaksi dengan status '${transactionForValidation.status}' tidak dapat diproses pengembaliannya`,
            currentStatus: transactionForValidation.status,
            processingTime: Date.now() - startTime,
          },
        }
      }

      const returnDate = request.tglKembali ? new Date(request.tglKembali) : new Date()

      // Run validation and penalty calculation in parallel
      const [validation, penaltyCalculation] = await Promise.all([
        this.validateUnifiedReturn(transaksiId, request),
        this.calculateUnifiedReturnPenalties(transaksiId, request, returnDate),
      ])

      if (!validation.isValid) {
        return {
          success: false,
          transactionId: transaksiId,
          returnedAt: returnDate,
          penalty: 0,
          processedItems: [],
          processingMode: 'unified',
          details: {
            statusCode: 'VALIDATION_ERROR' as const,
            message: validation.error || 'Validation failed',
            currentStatus: transactionForValidation.status,
            processingTime: Date.now() - startTime,
            validationErrors: validation.details?.errors as any,
          },
        }
      }

      // Execute unified database transaction
      const result = await this.prisma.$transaction(
        async (tx) => {
          // Update main transaction
          await tx.transaksi.update({
            where: { id: transaksiId },
            data: {
              status: 'dikembalikan',
              tglKembali: returnDate,
              sisaBayar: {
                increment: new Decimal(penaltyCalculation.totalPenalty),
              },
            },
          })

          const processedItems: UnifiedReturnProcessingResult['processedItems'] = []

          // Process each item with its conditions
          for (const item of request.items) {
            let itemTotalPenalty = 0
            const conditionBreakdown: Array<{
              kondisiAkhir: string
              jumlahKembali: number
              penaltyAmount: number
            }> = []

            // Create TransaksiItemReturn records for each condition
            for (const condition of item.conditions) {
              // Calculate individual condition penalty
              const conditionPenalty =
                penaltyCalculation.itemPenalties.find((p) => p.itemId.startsWith(item.itemId))
                  ?.totalPenalty || 0

              // Create return condition record
              await tx.transaksiItemReturn.create({
                data: {
                  transaksiItemId: item.itemId,
                  kondisiAkhir: condition.kondisiAkhir,
                  jumlahKembali: condition.jumlahKembali,
                  penaltyAmount: conditionPenalty,
                  modalAwalUsed: condition.modalAwal ? new Decimal(condition.modalAwal) : null,
                  penaltyCalculation: {
                    expectedReturnDate: returnDate,
                    actualReturnDate: returnDate,
                    calculationMethod: isLostItemCondition(condition.kondisiAkhir)
                      ? 'modal_awal'
                      : 'late_fee',
                    description: `Unified processing: ${condition.kondisiAkhir} (${condition.jumlahKembali} unit)`,
                  },
                  createdBy: this.userId,
                },
              })

              itemTotalPenalty += conditionPenalty
              conditionBreakdown.push({
                kondisiAkhir: condition.kondisiAkhir,
                jumlahKembali: condition.jumlahKembali,
                penaltyAmount: conditionPenalty,
              })
            }

            // Update TransaksiItem with unified data
            await tx.transaksiItem.update({
              where: { id: item.itemId },
              data: {
                statusKembali: 'lengkap',
                totalReturnPenalty: itemTotalPenalty,
                conditionCount: item.conditions.length, // Track complexity
              },
            })

            // Update product stock (sum all returned quantities)
            const totalReturned = item.conditions.reduce((sum, c) => sum + c.jumlahKembali, 0)
            const transactionItem = validation.transaction!.transaction.items.find(
              (ti) => ti.id === item.itemId,
            )
            if (transactionItem) {
              await tx.product.update({
                where: { id: transactionItem.produkId },
                data: {
                  quantity: { increment: totalReturned },
                },
              })
            }

            processedItems.push({
              itemId: item.itemId,
              penalty: itemTotalPenalty,
              kondisiAkhir:
                item.conditions.length === 1 ? item.conditions[0].kondisiAkhir : 'multi-condition',
              statusKembali: 'lengkap',
              conditionBreakdown,
            })
          }

          return {
            success: true,
            transactionId: transaksiId,
            returnedAt: returnDate,
            penalty: penaltyCalculation.totalPenalty,
            processedItems,
            processingMode: 'unified' as const,
          }
        },
        { timeout: 15000 }, // Increased timeout for complex operations
      )

      logger.info(
        'UnifiedReturnService',
        'processUnifiedReturn',
        'Unified return processing completed successfully',
        {
          transactionId: transaksiId,
          totalPenalty: penaltyCalculation.totalPenalty,
          itemsProcessed: request.items.length,
          conditionsProcessed: request.items.reduce((sum, item) => sum + item.conditions.length, 0),
          processingTime: Date.now() - startTime,
        },
      )

      return result
    } catch (error) {
      logger.error(
        'UnifiedReturnService',
        'processUnifiedReturn',
        'Unified return processing failed',
        {
          transactionId: transaksiId,
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime: Date.now() - startTime,
          itemsAttempted: request.items?.length || 0,
        },
      )

      throw new Error(
        `Gagal memproses pengembalian unified: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Legacy compatibility method - processes old ReturnRequest format
   * Converts to unified format internally for seamless migration
   */
  async processLegacyReturn(
    transaksiId: string,
    legacyRequest: ReturnRequest,
  ): Promise<UnifiedReturnProcessingResult> {
    // Convert legacy format to unified format
    const unifiedRequest = this.convertLegacyRequest(legacyRequest)

    // Log legacy compatibility usage for monitoring
    logger.info(
      'UnifiedReturnService',
      'processLegacyReturn',
      'Processing legacy return request through unified interface',
      {
        transactionId: transaksiId,
        legacyItemCount: legacyRequest.items.length,
        convertedConditionCount: unifiedRequest.items.reduce(
          (sum, item) => sum + item.conditions.length,
          0,
        ),
      },
    )

    // Process through unified interface
    return await this.processUnifiedReturn(transaksiId, unifiedRequest)
  }

  /**
   * Get return transaction by transaction code
   */
  async getReturnTransactionByCode(transactionCode: string): Promise<TransaksiWithDetails> {
    try {
      return await this.transaksiService.getTransaksiByCode(transactionCode)
    } catch (error) {
      logger.error(
        'UnifiedReturnService',
        'getReturnTransactionByCode',
        'Failed to fetch transaction',
        {
          transactionCode,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      )

      throw new Error(
        `Gagal mendapatkan transaksi: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }
}
