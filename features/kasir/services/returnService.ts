/**
 * Unified Return Service - TSK-24 Phase 1
 * Single-mode removal implementation with unified multi-condition architecture
 * Eliminates dual-mode processing complexity through unified interface
 */

import { PrismaClient, Prisma } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import {
  ReturnRequest,
  UnifiedValidationError,
  isLostItemCondition,
} from '../lib/validation/ReturnSchema'
import { PenaltyCalculator, PenaltyCalculationResult } from '../lib/utils/penaltyCalculator'
import { TransaksiService, TransaksiWithDetails, TransaksiForValidation } from './transaksiService'
import { createAuditService, AuditService } from './auditService'
import { ConditionCategory } from '../types'
import { logger } from '../../../services/logger'
import { parseKondisiAwal } from '../lib/utils/kondisiAwalParser'

// Unified return request interface - treats all returns as multi-condition
interface UnifiedReturnRequest {
  items: Array<{
    itemId: string
    conditions: Array<{
      kondisiAkhir: string
      jumlahKembali: number
      modalAwal?: number
      conditionCategory?: ConditionCategory
      manualPrice?: number
      useManualPricing?: boolean
    }>
  }>
  catatan?: string
  tglKembali?: string
  applyFlatLatePenalty?: boolean
  customLatePenalty?: number
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
   * Create return activity record for transaction timeline
   * Safe method that logs failures without breaking main return flow
   */
  private async createReturnActivity(
    transaksiId: string,
    activityData: {
      tipe: string
      deskripsi: string
      data: Prisma.InputJsonValue
    }
  ): Promise<void> {
    try {
      await this.prisma.aktivitasTransaksi.create({
        data: {
          transaksiId,
          tipe: activityData.tipe,
          deskripsi: activityData.deskripsi,
          data: activityData.data,
          createdBy: this.userId
        }
      })

      logger.debug(
        'UnifiedReturnService',
        'createReturnActivity',
        'Activity created successfully',
        {
          transactionId: transaksiId,
          activityType: activityData.tipe,
          description: activityData.deskripsi,
        }
      )
    } catch (error) {
      // Log activity creation failure but don't break main return flow
      logger.error(
        'UnifiedReturnService',
        'createReturnActivity',
        'Failed to create return activity',
        {
          transactionId: transaksiId,
          activityType: activityData.tipe,
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: this.userId
        }
      )
      // Don't throw - activity creation failure shouldn't break return processing
    }
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

      logger.debug('UnifiedReturnService', 'validateUnifiedReturn', 'Starting validation', {
        transactionId: transaksiId,
        transactionStatus: transaction.status,
        transactionItemCount: transaction.items.length,
        returnItemCount: request.items.length,
        returnItemIds: request.items.map(item => item.itemId)
      })

      // Check transaction status eligibility - allow active, overdue, and picked up transactions
      if (transaction.status !== 'active' && transaction.status !== 'terlambat' && transaction.status !== 'diambil') {
        return {
          isValid: false,
          error: `Transaksi dengan status '${transaction.status}' tidak dapat diproses pengembaliannya. Hanya transaksi dengan status 'active', 'terlambat', atau 'diambil' yang dapat diproses.`,
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

      // Log transaction items for debugging
      logger.debug('UnifiedReturnService', 'validateUnifiedReturn', 'Transaction items available', {
        transactionId: transaksiId,
        transactionItems: transaction.items.map(item => ({
          id: item.id,
          productId: item.produkId,
          produkName: item.produk.name,
          jumlahDiambil: item.jumlahDiambil,
          statusKembali: item.statusKembali,
          kondisiAwal: item.kondisiAwal
        }))
      })

      // Validate each return item with unified validation
      const errors: ReturnValidationError[] = []
      for (const returnItem of request.items) {
        logger.debug('UnifiedReturnService', 'validateUnifiedReturn', 'Processing return item', {
          transactionId: transaksiId,
          returnItemId: returnItem.itemId,
          returnItemConditions: returnItem.conditions
        })

        const transactionItem = transaction.items.find((item) => item.id === returnItem.itemId)

        logger.debug('UnifiedReturnService', 'validateUnifiedReturn', 'Item matching result', {
          transactionId: transaksiId,
          returnItemId: returnItem.itemId,
          found: !!transactionItem,
          transactionItemId: transactionItem?.id || 'NOT_FOUND'
        })

        if (!transactionItem) {
          errors.push({
            field: 'itemId',
            message: `Item dengan ID ${returnItem.itemId} tidak ditemukan dalam transaksi`,
            code: 'ITEM_NOT_FOUND',
          })
          continue
        }

        // RPK-51: Enhanced Size-aware validation with legacy format compatibility
        const parsedKondisiAwal = parseKondisiAwal(transactionItem.kondisiAwal)

        // Legacy format compatibility check
        if (parsedKondisiAwal.isLegacyFormat) {
          // For legacy format, skip size validation and log for debugging
          logger.debug('UnifiedReturnService', 'validateUnifiedReturn', 'Legacy format detected, skipping size validation', {
            transactionId: transaksiId,
            itemId: returnItem.itemId,
            kondisiAwal: transactionItem.kondisiAwal,
            parsedSize: parsedKondisiAwal.size,
            productName: transactionItem.produk.name
          })

          // Legacy format passes through size validation automatically
          // This maintains backward compatibility for existing return requests
        } else if (parsedKondisiAwal.productSizeId) {
          // Enhanced size validation for new size-aware format
          try {
            const sizeExists = await this.prisma.productSize.findFirst({
              where: {
                id: parsedKondisiAwal.productSizeId,
                productId: transactionItem.produkId,
              },
              select: { id: true, size: true, ageCategory: true }
            })

            if (!sizeExists) {
              // More descriptive error message with available sizes hint
              errors.push({
                field: `items[${returnItem.itemId}].productSizeId`,
                message: `Size ${parsedKondisiAwal.size || parsedKondisiAwal.productSizeId?.substring(0, 8)} (${parsedKondisiAwal.ageCategory || 'Unknown'}) tidak tersedia untuk produk ${transactionItem.produk.name}. Periksa ukuran yang tersedia di inventaris.`,
                code: 'SIZE_NOT_AVAILABLE',
              })
              continue
            }

            logger.debug('UnifiedReturnService', 'validateUnifiedReturn', 'Size validation passed', {
              transactionId: transaksiId,
              itemId: returnItem.itemId,
              productSizeId: parsedKondisiAwal.productSizeId,
              size: parsedKondisiAwal.size,
              ageCategory: parsedKondisiAwal.ageCategory,
              productName: transactionItem.produk.name,
              format: 'size-aware'
            })
          } catch (sizeError) {
            logger.error('UnifiedReturnService', 'validateUnifiedReturn', 'Size validation database error', {
              transactionId: transaksiId,
              itemId: returnItem.itemId,
              productSizeId: parsedKondisiAwal.productSizeId,
              error: sizeError instanceof Error ? sizeError.message : 'Unknown size validation error'
            })

            errors.push({
              field: `items[${returnItem.itemId}].productSizeId`,
              message: 'Gagal memvalidasi ukuran produk. Silakan coba lagi atau hubungi admin.',
              code: 'SIZE_VALIDATION_ERROR',
            })
            continue
          }
        } else {
          // Fallback for unexpected format
          logger.warn('UnifiedReturnService', 'validateUnifiedReturn', 'Unexpected size format detected', {
            transactionId: transaksiId,
            itemId: returnItem.itemId,
            kondisiAwal: transactionItem.kondisiAwal,
            parsedFormat: parsedKondisiAwal,
            productName: transactionItem.produk.name
          })

          // Allow processing but log for investigation
          // This prevents breaking existing functionality
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
        // Enhanced error logging with specific details
        logger.warn('UnifiedReturnService', 'validateUnifiedReturn', 'Return validation failed', {
          transactionId: transaksiId,
          errorCount: errors.length,
          itemsValidated: request.items.length,
          validationErrors: errors.map(error => ({
            field: error.field,
            message: error.message,
            code: error.code
          })),
          summary: {
            hasSizeErrors: errors.some(e => e.code === 'SIZE_NOT_AVAILABLE' || e.code === 'SIZE_VALIDATION_ERROR'),
            hasConditionErrors: errors.some(e => e.code === 'MISSING_CONDITION'),
            hasQuantityErrors: errors.some(e => e.code === 'EXCESS_TOTAL_QUANTITY' || e.code === 'RETURNED_ITEM_INVALID_QUANTITY'),
            hasItemErrors: errors.some(e => e.code === 'ITEM_NOT_FOUND')
          }
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
   * Calculate penalties for unified return request with enhanced flat + manual pricing system
   */
  async calculateUnifiedReturnPenalties(
    transaksiId: string,
    request: UnifiedReturnRequest,
    actualReturnDate: Date = new Date(),
  ): Promise<PenaltyCalculationResult> {
    try {
      // Get transaction details (optimized query for penalty calculation)
      const transaction = await this.transaksiService.getTransaksiForPenaltyCalculation(transaksiId)

      // Check if request has new manual pricing fields
      const hasManualPricing = request.items.some(item =>
        item.conditions.some(condition =>
          'conditionCategory' in condition && 'manualPrice' in condition
        )
      )

      if (hasManualPricing) {
        // Use new enhanced penalty calculation with flat + manual pricing
        const itemsForEnhancedCalculation = request.items.flatMap((returnItem) => {
          const transactionItem = transaction.items.find((item) => item.id === returnItem.itemId)
          if (!transactionItem) {
            throw new Error(`Item dengan ID ${returnItem.itemId} tidak ditemukan`)
          }

          return returnItem.conditions.map((condition) => ({
            id: `${returnItem.itemId}-${condition.kondisiAkhir}`,
            productName: transactionItem.produk.name,
            expectedReturnDate: transaction.tglSelesai || new Date(),
            actualReturnDate,
            conditionCategory: condition.conditionCategory || 'BAIK',
            manualPrice: condition.manualPrice || 0,
            quantity: condition.jumlahKembali,
            useManualPricing: condition.useManualPricing || false,
            modalAwal: condition.modalAwal || Number(transactionItem.produk.modalAwal),
          }))
        })

        // Use enhanced penalty calculation with flat penalty system
        const enhancedResult = PenaltyCalculator.calculateEnhancedTransactionPenalties(
          itemsForEnhancedCalculation,
          {
            applyFlatLatePenalty: request.applyFlatLatePenalty !== false,
            customLatePenalty: request.customLatePenalty
          }
        )

        // Convert to standard PenaltyCalculationResult format for backward compatibility
        return {
          totalPenalty: enhancedResult.totalPenalty,
          totalLateDays: enhancedResult.itemPenalties.reduce((sum, p) => sum + p.lateDays, 0),
          itemPenalties: enhancedResult.itemPenalties.map(penalty => ({
            itemId: penalty.itemId,
            productName: penalty.productName,
            expectedReturnDate: transaction.tglSelesai || new Date(),
            actualReturnDate,
            lateDays: penalty.lateDays,
            dailyPenaltyRate: 20000, // Flat penalty rate
            modalAwal: undefined,
            totalPenalty: penalty.totalPenalty,
            reasonCode: penalty.isLate ? 'late' : 'on_time',
            description: penalty.description
          })),
          summary: {
            onTimeItems: enhancedResult.summary.onTimeItems,
            lateItems: enhancedResult.summary.lateItems,
            damagedItems: enhancedResult.summary.manuallyPricedItems,
            lostItems: 0 // Will be counted in manual pricing
          }
        }
      } else {
        // Fallback to existing penalty calculation for backward compatibility
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

        // Calculate penalties using existing PenaltyCalculator for legacy support
        const penaltyResult = PenaltyCalculator.calculateTransactionPenalties(itemsForCalculation)
        return penaltyResult
      }
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

      if (transactionForValidation.status !== 'active' && transactionForValidation.status !== 'terlambat' && transactionForValidation.status !== 'diambil') {
        return {
          success: false,
          transactionId: transaksiId,
          returnedAt: new Date(),
          penalty: 0,
          processedItems: [],
          processingMode: 'unified',
          details: {
            statusCode: 'INVALID_STATUS' as const,
            message: `Transaksi dengan status '${transactionForValidation.status}' tidak dapat diproses pengembaliannya. Hanya transaksi dengan status 'active', 'terlambat', atau 'diambil' yang dapat diproses.`,
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
            validationErrors: validation.details?.errors as UnifiedValidationError[],
          },
        }
      }

      // Execute unified database transaction with enhanced error handling
      const result = await this.prisma.$transaction(
        async (tx) => {
          try {
          logger.debug('UnifiedReturnService', 'processUnifiedReturn', 'Starting database transaction', {
            transactionId: transaksiId,
            itemCount: request.items.length,
            totalConditions: request.items.reduce((sum, item) => sum + item.conditions.length, 0)
          })

          // Update main transaction with flat penalty info
          const isLateReturn = new Date() > new Date(transactionForValidation.tglSelesai || new Date())
          const transactionUpdate = await tx.transaksi.update({
            where: { id: transaksiId },
            data: {
              status: 'dikembalikan',
              tglKembali: returnDate,
              isLateReturn,
              flatLatePenalty: isLateReturn ? 20000 : 0,
              sisaBayar: {
                increment: new Decimal(penaltyCalculation.totalPenalty),
              },
            },
          })

          logger.debug('UnifiedReturnService', 'processUnifiedReturn', 'Main transaction updated', {
            transactionId: transaksiId,
            newStatus: 'dikembalikan',
            transactionUpdateId: transactionUpdate.id
          })

          const processedItems: UnifiedReturnProcessingResult['processedItems'] = []

          logger.debug('UnifiedReturnService', 'processUnifiedReturn', 'Starting item processing', {
            transactionId: transaksiId,
            itemsToProcess: request.items.map(item => ({
              itemId: item.itemId,
              conditionCount: item.conditions.length,
              conditions: item.conditions
            }))
          })

          // Process each item with its conditions
          for (const item of request.items) {
            logger.debug('UnifiedReturnService', 'processUnifiedReturn', 'Processing item', {
              transactionId: transaksiId,
              itemId: item.itemId,
              conditionCount: item.conditions.length
            })
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

              // Check if condition has manual pricing fields
              const hasManualPricing = 'conditionCategory' in condition && 'manualPrice' in condition

              // Create return condition record with enhanced fields
              await tx.transaksiItemReturn.create({
                data: {
                  transaksiItemId: item.itemId,
                  kondisiAkhir: condition.kondisiAkhir,
                  conditionCategory: hasManualPricing ? condition.conditionCategory : 'BAIK',
                  jumlahKembali: condition.jumlahKembali,
                  penaltyAmount: conditionPenalty,
                  manualPrice: hasManualPricing ? new Decimal(condition.manualPrice || 0) : null,
                  useManualPricing: hasManualPricing ? condition.useManualPricing || false : false,
                  modalAwalUsed: condition.modalAwal ? new Decimal(condition.modalAwal) : null,
                  penaltyCalculation: {
                    expectedReturnDate: returnDate,
                    actualReturnDate: returnDate,
                    calculationMethod: hasManualPricing
                      ? (condition.useManualPricing ? 'manual_pricing' : 'flat_late')
                      : (isLostItemCondition(condition.kondisiAkhir) ? 'modal_awal' : 'late_fee'),
                    description: hasManualPricing
                      ? `Enhanced processing: ${condition.conditionCategory} - ${condition.kondisiAkhir} (${condition.jumlahKembali} unit)`
                      : `Unified processing: ${condition.kondisiAkhir} (${condition.jumlahKembali} unit)`,
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

            // CRITICAL FIX: Use the same transaction data that was used for validation
            // This ensures data consistency between validation and processing
            const transactionItem = transactionForValidation.items.find(
              (ti) => ti.id === item.itemId,
            )

            logger.debug('UnifiedReturnService', 'processUnifiedReturn', 'Found transaction item for processing', {
              transactionId: transaksiId,
              itemId: item.itemId,
              found: !!transactionItem,
              transactionItemId: transactionItem?.id || 'NOT_FOUND',
              productId: transactionItem?.produkId || 'NO_PRODUCT_ID'
            })

            // Enhanced validation for transaction item
            if (!transactionItem) {
              logger.error('UnifiedReturnService', 'processUnifiedReturn', 'Transaction item not found during processing', {
                transactionId: transaksiId,
                itemId: item.itemId,
                availableTransactionItemIds: transactionForValidation.items.map(ti => ti.id)
              })
              throw new Error(`Transaction item with ID ${item.itemId} not found in validation data. This indicates a validation consistency issue.`)
            }

            if (!transactionItem.produkId) {
              logger.error('UnifiedReturnService', 'processUnifiedReturn', 'Transaction item has invalid productId', {
                transactionId: transaksiId,
                itemId: item.itemId,
                transactionItem: transactionItem
              })
              throw new Error(`Transaction item ${item.itemId} has invalid productId. Data corruption detected.`)
            }

            // Update TransaksiItem with unified data
            logger.debug('UnifiedReturnService', 'processUnifiedReturn', 'Updating TransaksiItem status', {
              transactionId: transaksiId,
              itemId: item.itemId,
              currentStatus: transactionItem.statusKembali,
              newStatus: 'lengkap',
              totalReturnPenalty: itemTotalPenalty
            })

            await tx.transaksiItem.update({
              where: { id: item.itemId },
              data: {
                statusKembali: 'lengkap',
                totalReturnPenalty: itemTotalPenalty,
                conditionCount: item.conditions.length, // Track complexity
              },
            })

            logger.debug('UnifiedReturnService', 'processUnifiedReturn', 'TransaksiItem status updated successfully', {
              transactionId: transaksiId,
              itemId: item.itemId,
              newStatus: 'lengkap'
            })

            // Update product stock (sum all returned quantities)
            const totalReturned = item.conditions.reduce((sum, c) => sum + c.jumlahKembali, 0)

            logger.debug('UnifiedReturnService', 'processUnifiedReturn', 'Updating product stock', {
              transactionId: transaksiId,
              itemId: item.itemId,
              produkId: transactionItem.produkId,
              totalReturned,
              productName: transactionItem.produk?.name || 'Unknown'
            })

            await tx.product.update({
              where: { id: transactionItem.produkId },
              data: {
                quantity: { increment: totalReturned },
              },
            })

            processedItems.push({
              itemId: item.itemId,
              penalty: itemTotalPenalty,
              kondisiAkhir:
                item.conditions.length === 1 ? item.conditions[0].kondisiAkhir : 'multi-condition',
              statusKembali: 'lengkap',
              conditionBreakdown,
              productName: transactionItem.produk?.name || 'Unknown Product'
            })

            logger.debug('UnifiedReturnService', 'processUnifiedReturn', 'Item added to processedItems', {
              transactionId: transaksiId,
              itemId: item.itemId,
              currentProcessedItemsCount: processedItems.length,
              itemTotalPenalty,
              statusKembali: 'lengkap'
            })
          }

          logger.debug('UnifiedReturnService', 'processUnifiedReturn', 'Database transaction completed', {
            transactionId: transaksiId,
            processedItemsCount: processedItems.length,
            totalPenalty: penaltyCalculation.totalPenalty,
            itemsProcessed: processedItems.map(item => ({ itemId: item.itemId, penalty: item.penalty }))
          })

          return {
            success: true,
            transactionId: transaksiId,
            returnedAt: returnDate,
            penalty: penaltyCalculation.totalPenalty,
            processedItems,
            processingMode: 'unified' as const,
          }
          } catch (transactionError) {
            logger.error('UnifiedReturnService', 'processUnifiedReturn', 'Database transaction failed', {
              transactionId: transaksiId,
              error: transactionError instanceof Error ? transactionError.message : 'Unknown transaction error',
              stack: transactionError instanceof Error ? transactionError.stack : undefined,
              itemCount: request.items.length,
              totalConditions: request.items.reduce((sum, item) => sum + item.conditions.length, 0)
            })

            throw new Error(`Database transaction failed: ${transactionError instanceof Error ? transactionError.message : 'Unknown error'}`)
          }
        },
        { timeout: 15000 }, // Increased timeout for complex operations
      )

      // Create return activity after successful processing
      await this.createReturnActivity(transaksiId, {
        tipe: 'dikembalikan',
        deskripsi: `Item returned: ${result.processedItems.length} items processed`,
        data: {
          conditions: result.processedItems.map(item => ({
            itemId: item.itemId,
            kondisiAkhir: item.kondisiAkhir,
            jumlahKembali: item.conditionBreakdown?.reduce((sum, c) => sum + c.jumlahKembali, 0) || 1,
            penaltyAmount: item.penalty,
            produkName: validation.transaction!.transaction.items.find(ti => ti.id === item.itemId)?.produk?.name || 'Unknown'
          })),
          totalPenalty: penaltyCalculation.totalPenalty,
          itemsAffected: result.processedItems.map(item => 
            validation.transaction!.transaction.items.find(ti => ti.id === item.itemId)?.produk?.name || 'Unknown'
          ),
          processingMode: result.processingMode,
          totalConditions: request.items.reduce((sum, item) => sum + item.conditions.length, 0),
          timestamp: new Date().toISOString()
        }
      })

      // Create penalty-specific activity if penalties exist
      if (penaltyCalculation.totalPenalty > 0) {
        await this.createReturnActivity(transaksiId, {
          tipe: 'penalty_added',
          deskripsi: `Penalty applied: Rp ${penaltyCalculation.totalPenalty.toLocaleString('id-ID')} for condition damages`,
          data: {
            totalPenalty: penaltyCalculation.totalPenalty,
            penaltyBreakdown: result.processedItems
              .filter(item => item.penalty > 0)
              .map(item => ({
                itemId: item.itemId,
                produkName: validation.transaction!.transaction.items.find(ti => ti.id === item.itemId)?.produk?.name || 'Unknown',
                penaltyAmount: item.penalty,
                conditions: item.conditionBreakdown?.map(c => ({
                  kondisiAkhir: c.kondisiAkhir,
                  penaltyAmount: c.penaltyAmount
                })) || []
              })),
            calculationMethod: 'condition-based',
            timestamp: new Date().toISOString()
          }
        })
      }

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
          activitiesCreated: penaltyCalculation.totalPenalty > 0 ? 2 : 1
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
