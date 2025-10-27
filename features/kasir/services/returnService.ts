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
import { kasirLogger } from '../lib/logger'
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
   * Helper method to get current product state for verification
   * Enhanced debugging: Logs current stock state before and after operations
   */
  private async getProductForVerification(productId: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          code: true,
          name: true,
          quantity: true,
          rentedStock: true,
          status: true,
        },
      })

      if (!product) {
        kasirLogger.returnProcess.error(
          'getProductForVerification',
          'Product not found for verification',
          {
            productId,
            timestamp: new Date().toISOString(),
          },
        )
        throw new Error(`Product with ID ${productId} not found for stock verification`)
      }

      kasirLogger.returnProcess.debug(
        'getProductForVerification',
        'Current product state retrieved',
        {
          productId: product.id,
          productCode: product.code,
          productName: product.name,
          currentQuantity: product.quantity,
          currentRentedStock: product.rentedStock,
          calculatedAvailableStock: product.quantity - product.rentedStock,
          productStatus: product.status,
        },
      )

      return product
    } catch (error) {
      kasirLogger.returnProcess.error(
        'getProductForVerification',
        'Failed to retrieve product for verification',
        {
          productId,
          error:
            error instanceof Error
              ? {
                  name: error.name,
                  message: error.message,
                  stack: error.stack,
                }
              : { message: String(error) },
        },
      )
      throw error
    }
  }

  /**
   * Helper method to calculate expected stock based on operation type
   */
  private calculateExpectedStock(
    currentStock: number,
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    item: any,
    operation: 'pickup' | 'return',
  ): number {
    if (operation === 'pickup') {
      // For pickup, stock decreases (more items rented)
      const totalTaken =
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        item.conditions?.reduce((sum: number, c: any) => sum + (c.jumlahDiambil || 0), 0) ||
        item.jumlahDiambil ||
        0
      return currentStock + totalTaken
    } else {
      // For return, stock increases (items returned)
      const totalReturned = item.conditions?.reduce(
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sum: number, c: any) => sum + (c.jumlahKembali || 0),
        0,
      )
      return currentStock - totalReturned
    }
  }

  /**
   * Helper method to get initial stock before any operations
   * Used for calculating expected stock in verification
   */
  private async getInitialStock(productId: string): Promise<number> {
    try {
      // This would typically come from a stock history table
      // For now, we'll calculate from current state by reversing typical operations
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { quantity: true, rentedStock: true },
      })

      if (!product) return 0

      // Initial stock would be current available + rented
      return product.quantity + product.rentedStock
    } catch (error) {
      kasirLogger.returnProcess.error(
        'processUnifiedReturn',
        'Failed to get initial stock for verification',
        {
          productId,
          error: error instanceof Error ? error.message : String(error),
        },
      )
      return 0
    }
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
    },
  ): Promise<void> {
    try {
      await this.prisma.aktivitasTransaksi.create({
        data: {
          transaksiId,
          tipe: activityData.tipe,
          deskripsi: activityData.deskripsi,
          data: activityData.data,
          createdBy: this.userId,
        },
      })
    } catch (error) {
      // Log activity creation failure but don't break main return flow
      console.error(
        'UnifiedReturnService',
        'createReturnActivity',
        'Failed to create return activity',
        {
          transactionId: transaksiId,
          activityType: activityData.tipe,
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: this.userId,
        },
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

      // Check transaction status eligibility - allow active, overdue, and picked up transactions
      if (
        transaction.status !== 'active' &&
        transaction.status !== 'terlambat' &&
        transaction.status !== 'diambil'
      ) {
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

        // RPK-51: Enhanced Size-aware validation with legacy format compatibility
        const parsedKondisiAwal = parseKondisiAwal(transactionItem.kondisiAwal)

        // Legacy format compatibility check
        if (parsedKondisiAwal.isLegacyFormat) {
          // For legacy format, skip size validation and log for debugging
          console.debug(
            'UnifiedReturnService',
            'validateUnifiedReturn',
            'Legacy format detected, skipping size validation',
            {
              transactionId: transaksiId,
              itemId: returnItem.itemId,
              kondisiAwal: transactionItem.kondisiAwal,
              parsedSize: parsedKondisiAwal.size,
              productName: transactionItem.produk.name,
            },
          )

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
              select: { id: true, size: true, ageCategory: true },
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
          } catch (sizeError) {
            console.error(
              'UnifiedReturnService',
              'validateUnifiedReturn',
              'Size validation database error',
              {
                transactionId: transaksiId,
                itemId: returnItem.itemId,
                productSizeId: parsedKondisiAwal.productSizeId,
                error:
                  sizeError instanceof Error ? sizeError.message : 'Unknown size validation error',
              },
            )

            errors.push({
              field: `items[${returnItem.itemId}].productSizeId`,
              message: 'Gagal memvalidasi ukuran produk. Silakan coba lagi atau hubungi admin.',
              code: 'SIZE_VALIDATION_ERROR',
            })
            continue
          }
        } else {
          // Fallback for unexpected format
          console.warn(
            'UnifiedReturnService',
            'validateUnifiedReturn',
            'Unexpected size format detected',
            {
              transactionId: transaksiId,
              itemId: returnItem.itemId,
              kondisiAwal: transactionItem.kondisiAwal,
              parsedFormat: parsedKondisiAwal,
              productName: transactionItem.produk.name,
            },
          )

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
        console.warn('UnifiedReturnService', 'validateUnifiedReturn', 'Return validation failed', {
          transactionId: transaksiId,
          errorCount: errors.length,
          itemsValidated: request.items.length,
          validationErrors: errors.map((error) => ({
            field: error.field,
            message: error.message,
            code: error.code,
          })),
          summary: {
            hasSizeErrors: errors.some(
              (e) => e.code === 'SIZE_NOT_AVAILABLE' || e.code === 'SIZE_VALIDATION_ERROR',
            ),
            hasConditionErrors: errors.some((e) => e.code === 'MISSING_CONDITION'),
            hasQuantityErrors: errors.some(
              (e) =>
                e.code === 'EXCESS_TOTAL_QUANTITY' || e.code === 'RETURNED_ITEM_INVALID_QUANTITY',
            ),
            hasItemErrors: errors.some((e) => e.code === 'ITEM_NOT_FOUND'),
          },
        })

        return {
          isValid: false,
          error: `Validasi item gagal: ${errors.map((e) => e.message).join(', ')}`,
          details: { errors },
        }
      }

      return {
        isValid: true,
        transaction: { transaction },
      }
    } catch (error) {
      console.error('UnifiedReturnService', 'validateUnifiedReturn', 'Return validation error', {
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
      const hasManualPricing = request.items.some((item) =>
        item.conditions.some(
          (condition) => 'conditionCategory' in condition && 'manualPrice' in condition,
        ),
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
            customLatePenalty: request.customLatePenalty,
          },
        )

        // Convert to standard PenaltyCalculationResult format for backward compatibility
        return {
          totalPenalty: enhancedResult.totalPenalty,
          totalLateDays: enhancedResult.itemPenalties.reduce((sum, p) => sum + p.lateDays, 0),
          itemPenalties: enhancedResult.itemPenalties.map((penalty) => ({
            itemId: penalty.itemId,
            productName: penalty.productName,
            expectedReturnDate: transaction.tglSelesai || new Date(),
            actualReturnDate,
            lateDays: penalty.lateDays,
            dailyPenaltyRate: 20000, // Flat penalty rate
            modalAwal: undefined,
            totalPenalty: penalty.totalPenalty,
            reasonCode: penalty.isLate ? 'late' : 'on_time',
            description: penalty.description,
          })),
          summary: {
            onTimeItems: enhancedResult.summary.onTimeItems,
            lateItems: enhancedResult.summary.lateItems,
            damagedItems: enhancedResult.summary.manuallyPricedItems,
            lostItems: 0, // Will be counted in manual pricing
          },
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
      console.error(
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
    const processingTimer = kasirLogger.performance.startTimer(
      'processUnifiedReturn',
      'Unified return processing',
    )

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

      if (
        transactionForValidation.status !== 'active' &&
        transactionForValidation.status !== 'terlambat' &&
        transactionForValidation.status !== 'diambil'
      ) {
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

                // Check if condition has manual pricing fields
                const hasManualPricing =
                  'conditionCategory' in condition && 'manualPrice' in condition

                // Create return condition record with enhanced fields
                await tx.transaksiItemReturn.create({
                  data: {
                    transaksiItemId: item.itemId,
                    kondisiAkhir: condition.kondisiAkhir,
                    conditionCategory: hasManualPricing ? condition.conditionCategory : 'BAIK',
                    jumlahKembali: condition.jumlahKembali,
                    penaltyAmount: conditionPenalty,
                    manualPrice: hasManualPricing ? new Decimal(condition.manualPrice || 0) : null,
                    useManualPricing: hasManualPricing
                      ? condition.useManualPricing || false
                      : false,
                    modalAwalUsed: condition.modalAwal ? new Decimal(condition.modalAwal) : null,
                    penaltyCalculation: {
                      expectedReturnDate: returnDate,
                      actualReturnDate: returnDate,
                      calculationMethod: hasManualPricing
                        ? condition.useManualPricing
                          ? 'manual_pricing'
                          : 'flat_late'
                        : isLostItemCondition(condition.kondisiAkhir)
                          ? 'modal_awal'
                          : 'late_fee',
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

              // Enhanced validation for transaction item
              if (!transactionItem) {
                console.error(
                  'UnifiedReturnService',
                  'processUnifiedReturn',
                  'Transaction item not found during processing',
                  {
                    transactionId: transaksiId,
                    itemId: item.itemId,
                    availableTransactionItemIds: transactionForValidation.items.map((ti) => ti.id),
                  },
                )
                throw new Error(
                  `Transaction item with ID ${item.itemId} not found in validation data. This indicates a validation consistency issue.`,
                )
              }

              if (!transactionItem.produkId) {
                console.error(
                  'UnifiedReturnService',
                  'processUnifiedReturn',
                  'Transaction item has invalid productId',
                  {
                    transactionId: transaksiId,
                    itemId: item.itemId,
                    transactionItem: transactionItem,
                  },
                )
                throw new Error(
                  `Transaction item ${item.itemId} has invalid productId. Data corruption detected.`,
                )
              }

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

              // CRITICAL FIX: Actually update rentedStock in database (MISSING IMPLEMENTATION)
              // rentedStock uses negative values for rented items, so we decrement (reduce the negative)
              // Example: rentedStock=-2 (2 items rented) → decrement by 2 → rentedStock=0 (all returned)
              await tx.product.update({
                where: { id: transactionItem.produkId },
                data: {
                  rentedStock: {
                    decrement: totalReturned,
                  },
                },
              })

              // CRITICAL FIX #2: Restore ProductSize.quantity (Second Bug Fix)
              // Parse kondisiAwal to extract productSizeId
              const parsedKondisi = parseKondisiAwal(transactionItem.kondisiAwal)

              if (parsedKondisi?.productSizeId && !parsedKondisi.isLegacyFormat) {
                try {
                  // Verify ProductSize exists before update
                  const productSizeBeforeRestore = await tx.productSize.findUnique({
                    where: { id: parsedKondisi.productSizeId },
                    select: {
                      id: true,
                      quantity: true,
                      size: true,
                      ageCategory: true,
                    },
                  })

                  if (productSizeBeforeRestore) {
                    // RESTORE size-specific stock
                    await tx.productSize.update({
                      where: { id: parsedKondisi.productSizeId },
                      data: {
                        quantity: {
                          increment: totalReturned,
                        },
                      },
                    })

                    kasirLogger.returnProcess.info(
                      'processUnifiedReturn',
                      'ProductSize quantity restored successfully',
                      {
                        transactionId: transaksiId,
                        itemId: item.itemId,
                        productSizeId: parsedKondisi.productSizeId,
                        size: productSizeBeforeRestore.size,
                        ageCategory: productSizeBeforeRestore.ageCategory,
                        previousQuantity: productSizeBeforeRestore.quantity,
                        quantityIncremented: totalReturned,
                        newQuantity: productSizeBeforeRestore.quantity + totalReturned,
                        operation: 'increment',
                      },
                    )
                  } else {
                    kasirLogger.returnProcess.warn(
                      'processUnifiedReturn',
                      'ProductSize not found for quantity restoration',
                      {
                        transactionId: transaksiId,
                        itemId: item.itemId,
                        productSizeId: parsedKondisi.productSizeId,
                        impact: 'Size-specific stock not restored - ProductSize may have been deleted',
                        recommendedAction: 'Manual stock adjustment may be required',
                      },
                    )
                  }
                } catch (error) {
                  kasirLogger.returnProcess.error(
                    'processUnifiedReturn',
                    'Failed to restore ProductSize quantity',
                    {
                      transactionId: transaksiId,
                      itemId: item.itemId,
                      productSizeId: parsedKondisi.productSizeId,
                      error: error instanceof Error ? error.message : String(error),
                      impact: 'Size-specific stock may be incorrect',
                      recommendedAction: 'Check ProductSize quantity manually',
                    },
                  )
                  // Don't throw - continue with transaction
                  // Size restoration failure shouldn't block entire return process
                }
              } else if (!parsedKondisi?.isLegacyFormat) {
                kasirLogger.returnProcess.warn(
                  'processUnifiedReturn',
                  'Could not extract productSizeId from kondisiAwal',
                  {
                    transactionId: transaksiId,
                    itemId: item.itemId,
                    kondisiAwal: transactionItem.kondisiAwal,
                    impact: 'Size-specific stock not restored - invalid or missing productSizeId',
                    note: 'This may be expected for legacy transactions',
                  },
                )
              }

              // ENHANCED DEBUG: Get current product state AFTER stock update
              const productBeforeUpdate = await this.getProductForVerification(
                transactionItem.produkId,
              )

              const expectedNewStock = productBeforeUpdate.rentedStock - totalReturned

              kasirLogger.returnProcess.info(
                'processUnifiedReturn',
                'Pre-stock update verification',
                {
                  transactionId: transaksiId,
                  itemId: item.itemId,
                  productId: transactionItem.produkId,
                  productCode: productBeforeUpdate.code,
                  productName: productBeforeUpdate.name,
                  currentRentedStock: productBeforeUpdate.rentedStock,
                  totalQuantity: productBeforeUpdate.quantity,
                  plannedDecrement: totalReturned,
                  expectedNewRentedStock: expectedNewStock,
                  calculatedAvailableStock: productBeforeUpdate.quantity - expectedNewStock,
                },
              )

              // ENHANCED DEBUG: Verify stock update success
              const productAfterUpdate = await this.getProductForVerification(
                transactionItem.produkId,
              )

              const stockUpdateSuccessful = productAfterUpdate.rentedStock === expectedNewStock
              const stockDifference = productAfterUpdate.rentedStock - expectedNewStock

              kasirLogger.returnProcess.info(
                'processUnifiedReturn',
                'Post-stock update verification',
                {
                  transactionId: transaksiId,
                  itemId: item.itemId,
                  productId: transactionItem.produkId,
                  previousRentedStock: productBeforeUpdate.rentedStock,
                  actualNewRentedStock: productAfterUpdate.rentedStock,
                  expectedNewRentedStock: expectedNewStock,
                  stockUpdateSuccessful,
                  stockDifference,
                  stockUpdateOperation: 'decrement_rentedStock',
                  quantityReturned: totalReturned,
                  stockConsistency: stockDifference === 0 ? 'CONSISTENT' : 'INCONSISTENT',
                },
              )

              // Replace console.info with enhanced kasirLogger
              console.info('📦 Stock updated on return', {
                productId: transactionItem.produkId,
                quantityReturned: totalReturned,
                action: 'decrement_rentedStock',
              })

              // CRITICAL: Detect stock update inconsistency and trigger alert
              if (!stockUpdateSuccessful) {
                kasirLogger.returnProcess.error(
                  'processUnifiedReturn',
                  'CRITICAL: Stock update inconsistency detected',
                  {
                    transactionId: transaksiId,
                    productId: transactionItem.produkId,
                    severity: 'HIGH',
                    expectedStock: expectedNewStock,
                    actualStock: productAfterUpdate.rentedStock,
                    difference: stockDifference,
                    rollbackRisk: 'POTENTIAL_DATA_INCONSISTENCY',
                    requiresImmediateAttention: true,
                  },
                )
              }

              processedItems.push({
                itemId: item.itemId,
                penalty: itemTotalPenalty,
                kondisiAkhir:
                  item.conditions.length === 1
                    ? item.conditions[0].kondisiAkhir
                    : 'multi-condition',
                statusKembali: 'lengkap',
                conditionBreakdown,
              })
            }

            // ENHANCED DEBUG: Transaction completion verification
            const totalProcessingTime = processingTimer.end('Unified return processing completed', {
              transactionId: transaksiId,
              totalItemsProcessed: processedItems.length,
              stockUpdatesSuccessful: true, // Will be updated after verification
            })

            // Verify all stock updates were successful
            const stockUpdateResults = []
            for (const item of request.items) {
              try {
                const transactionItem = transactionForValidation.items.find(
                  (ti) => ti.id === item.itemId,
                )

                if (!transactionItem) {
                  kasirLogger.returnProcess.error(
                    'processUnifiedReturn',
                    'Transaction item not found for verification',
                    {
                      transactionId: transaksiId,
                      itemId: item.itemId,
                    },
                  )
                  continue
                }

                const finalProductState = await this.getProductForVerification(
                  transactionItem.produkId
                )

                const expectedStock = this.calculateExpectedStock(
                  await this.getInitialStock(transactionItem.produkId),
                  item,
                  'return',
                )

                stockUpdateResults.push({
                  itemId: item.itemId,
                  productId: transactionItem.produkId,
                  actualStock: finalProductState.rentedStock,
                  expectedStock: expectedStock,
                  isConsistent: finalProductState.rentedStock === expectedStock,
                  difference: finalProductState.rentedStock - expectedStock,
                })
              } catch (error) {
                kasirLogger.returnProcess.error(
                  'processUnifiedReturn',
                  'Failed to verify final stock state',
                  {
                    transactionId: transaksiId,
                    itemId: item.itemId,
                    error:
                      error instanceof Error
                        ? {
                            name: error.name,
                            message: error.message,
                            stack: error.stack,
                          }
                        : { message: String(error) },
                  },
                )
                stockUpdateResults.push({
                  itemId: item.itemId,
                  verificationFailed: true,
                  error: error instanceof Error ? error.message : String(error),
                })
              }
            }

            const allStockUpdatesSuccessful = stockUpdateResults.every(
              (result) => result.isConsistent !== false && !result.verificationFailed,
            )
            const failedStockUpdates = stockUpdateResults.filter(
              (result) => result.isConsistent === false || result.verificationFailed,
            )

            kasirLogger.returnProcess.info(
              'processUnifiedReturn',
              'Transaction completion verification',
              {
                transactionId: transaksiId,
                processingTime: `${totalProcessingTime}ms`,
                totalItemsProcessed: processedItems.length,
                allStockUpdatesSuccessful,
                failedStockUpdates: failedStockUpdates.length,
                stockVerificationResults: stockUpdateResults,
                processingMode: 'unified',
                returnDate,
                totalPenalty: penaltyCalculation.totalPenalty,
              },
            )

            // CRITICAL: Alert if stock inconsistencies detected
            if (!allStockUpdatesSuccessful) {
              kasirLogger.returnProcess.error(
                'processUnifiedReturn',
                'CRITICAL: Stock inconsistencies detected in transaction completion',
                {
                  transactionId: transaksiId,
                  severity: 'HIGH',
                  alertType: 'STOCK_INCONSISTENCY_DETECTED',
                  failedCount: failedStockUpdates.length,
                  failedUpdates: failedStockUpdates,
                  requiresImmediateAttention: true,
                  recommendedAction: 'MANUAL_STOCK_RECONCILIATION_REQUIRED',
                  processingTime: `${totalProcessingTime}ms`,
                },
              )
            }

            return {
              success: true,
              transactionId: transaksiId,
              returnedAt: returnDate,
              penalty: penaltyCalculation.totalPenalty,
              processedItems,
              processingMode: 'unified' as const,
              // ENHANCED: Add verification results for debugging
              verificationResults: {
                stockUpdatesSuccessful: allStockUpdatesSuccessful,
                failedStockUpdates: failedStockUpdates.length,
                stockVerificationResults: stockUpdateResults,
              },
            }
          } catch (transactionError) {
            // ENHANCED DEBUG: Enhanced error boundary logging
            const totalProcessingTime = Date.now() - startTime

            // Check for partial transaction state before logging
            let partialTransactionState = null
            try {
              // Attempt to verify current transaction state after failure
              const currentTransaction = await this.transaksiService.getTransaksiById(transaksiId)
              if (currentTransaction) {
                partialTransactionState = {
                  transactionStatus: currentTransaction.status,
                  itemsProcessed: 0, // Error occurred before processing completed
                  totalItems: request.items.length,
                  partiallyProcessedItems:
                    currentTransaction.items?.filter(
                      (item) =>
                        item.statusKembali === 'lengkap' ||
                        (item.totalReturnPenalty && item.totalReturnPenalty.gt(0)),
                    ).length || 0,
                }
              }
            } catch (stateCheckError) {
              kasirLogger.returnProcess.error(
                'processUnifiedReturn',
                'Failed to check transaction state after error',
                {
                  transactionId: transaksiId,
                  stateCheckError:
                    stateCheckError instanceof Error
                      ? stateCheckError.message
                      : String(stateCheckError),
                },
              )
            }

            kasirLogger.returnProcess.error('processUnifiedReturn', 'Database transaction failed', {
              transactionId: transaksiId,
              processingTime: totalProcessingTime ? `${totalProcessingTime}ms` : 'unknown',
              error: {
                name: transactionError instanceof Error ? transactionError.name : 'Unknown',
                message:
                  transactionError instanceof Error
                    ? transactionError.message
                    : 'Unknown transaction error',
                stack: transactionError instanceof Error ? transactionError.stack : undefined,
                type:
                  transactionError instanceof Error ? transactionError.constructor.name : 'Unknown',
              },
              itemCount: request.items.length,
              totalConditions: request.items.reduce((sum, item) => sum + item.conditions.length, 0),
              // ENHANCED: Transaction state analysis
              partialTransactionState,
              potentialDataInconsistency: partialTransactionState
                ? partialTransactionState.itemsProcessed > 0 &&
                  partialTransactionState.itemsProcessed < partialTransactionState.totalItems
                : false,
              rollbackRisk: 'POTENTIAL_TRANSACTION_ROLLBACK',
              requiresImmediateInvestigation: true,
              recommendedActions: [
                'CHECK_TRANSACTION_COMPLETION_STATUS',
                'VERIFY_STOCK_CONSISTENCY',
                'REVIEW_DATABASE_TRANSACTION_LOGS',
              ],
            })

            // SILENT FAILURE DETECTION: Log specific patterns that indicate silent failures
            if (transactionError instanceof Error) {
              const errorMessage = transactionError.message.toLowerCase()

              // Detect common silent failure patterns
              const silentFailurePatterns = [
                'timeout',
                'connection',
                'constraint',
                'unique',
                'foreign key',
                'deadlock',
              ]

              const detectedPattern = silentFailurePatterns.find((pattern) =>
                errorMessage.includes(pattern),
              )

              if (detectedPattern) {
                kasirLogger.returnProcess.error(
                  'processUnifiedReturn',
                  'SILENT_FAILURE_PATTERN_DETECTED',
                  {
                    transactionId: transaksiId,
                    detectedPattern,
                    errorMessage: transactionError.message,
                    likelyCause: 'Database constraint or connection issue causing silent failure',
                    impact: 'Stock update may have failed without proper error propagation',
                    severity: 'HIGH',
                    requiresImmediateAttention: true,
                  },
                )
              }
            }

            throw new Error(
              `Database transaction failed: ${transactionError instanceof Error ? transactionError.message : 'Unknown error'}`,
            )
          }
        },
        { timeout: 15000 }, // Increased timeout for complex operations
      )

      // Create return activity after successful processing
      await this.createReturnActivity(transaksiId, {
        tipe: 'dikembalikan',
        deskripsi: `Item returned: ${result.processedItems.length} items processed`,
        data: {
          conditions: result.processedItems.map((item) => ({
            itemId: item.itemId,
            kondisiAkhir: item.kondisiAkhir,
            jumlahKembali:
              item.conditionBreakdown?.reduce((sum, c) => sum + c.jumlahKembali, 0) || 1,
            penaltyAmount: item.penalty,
            produkName:
              validation.transaction!.transaction.items.find((ti) => ti.id === item.itemId)?.produk
                ?.name || 'Unknown',
          })),
          totalPenalty: penaltyCalculation.totalPenalty,
          itemsAffected: result.processedItems.map(
            (item) =>
              validation.transaction!.transaction.items.find((ti) => ti.id === item.itemId)?.produk
                ?.name || 'Unknown',
          ),
          processingMode: result.processingMode,
          totalConditions: request.items.reduce((sum, item) => sum + item.conditions.length, 0),
          timestamp: new Date().toISOString(),
        },
      })

      // CRITICAL FIX: Update transaction status to 'selesai' after successful return
      await this.transaksiService.updateTransaksiStatus(transaksiId, {
        status: 'selesai',
        tglKembali: request.tglKembali || new Date().toISOString(),
      })

      // Create penalty-specific activity if penalties exist
      if (penaltyCalculation.totalPenalty > 0) {
        await this.createReturnActivity(transaksiId, {
          tipe: 'penalty_added',
          deskripsi: `Penalty applied: Rp ${penaltyCalculation.totalPenalty.toLocaleString('id-ID')} for condition damages`,
          data: {
            totalPenalty: penaltyCalculation.totalPenalty,
            penaltyBreakdown: result.processedItems
              .filter((item) => item.penalty > 0)
              .map((item) => ({
                itemId: item.itemId,
                produkName:
                  validation.transaction!.transaction.items.find((ti) => ti.id === item.itemId)
                    ?.produk?.name || 'Unknown',
                penaltyAmount: item.penalty,
                conditions:
                  item.conditionBreakdown?.map((c) => ({
                    kondisiAkhir: c.kondisiAkhir,
                    penaltyAmount: c.penaltyAmount,
                  })) || [],
              })),
            calculationMethod: 'condition-based',
            timestamp: new Date().toISOString(),
          },
        })
      }

      return result
    } catch (error) {
      console.error(
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
      console.error(
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
