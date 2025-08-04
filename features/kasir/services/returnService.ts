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
} from '../lib/validation/returnSchema'
import { PenaltyCalculator, PenaltyCalculationResult } from '../lib/utils/penaltyCalculator'
import { TransaksiService, TransaksiWithDetails, TransaksiForValidation } from './transaksiService'
import { createAuditService, AuditService } from './auditService'
import { logger } from '@/services/logger'

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

        // Validate return quantity
        if (returnItem.jumlahKembali <= 0) {
          errors.push({
            field: 'jumlahKembali',
            message: `Jumlah pengembalian harus lebih dari 0 untuk item ${transactionItem.produk.name}`,
            code: 'INVALID_QUANTITY',
          })
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
    const penaltyLogger = logger.child('ReturnService')
    const calcId = `penalty-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    try {
      penaltyLogger.debug('calculateReturnPenalties', 'Penalty calculation started', {
        calcId,
        transaksiId,
        itemCount: returnItems.length,
        actualReturnDate: actualReturnDate.toISOString()
      })

      // Get transaction details (optimized query for penalty calculation) with timing
      const txQueryTimer = logger.startTimer('ReturnService', 'calculateReturnPenalties', 'transaction-query')
      const transaction = await this.transaksiService.getTransaksiForPenaltyCalculation(transaksiId)
      const txQueryDuration = txQueryTimer.end('Transaction query for penalty calculation completed')

      penaltyLogger.debug('calculateReturnPenalties', 'Transaction data retrieved', {
        calcId,
        transaksiId,
        txQueryDuration,
        transactionStatus: transaction.status,
        expectedReturnDate: transaction.tglSelesai?.toISOString(),
        itemsCount: transaction.items.length
      })

      // Prepare items for penalty calculation with timing
      const itemPrepTimer = logger.startTimer('ReturnService', 'calculateReturnPenalties', 'item-preparation')
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
      const itemPrepDuration = itemPrepTimer.end('Item preparation for penalty calculation completed')

      penaltyLogger.debug('calculateReturnPenalties', 'Items prepared for calculation', {
        calcId,
        transaksiId,
        itemPrepDuration,
        itemsForCalculationCount: itemsForCalculation.length
      })

      // Calculate penalties using PenaltyCalculator with timing
      const calculationTimer = logger.startTimer('ReturnService', 'calculateReturnPenalties', 'penalty-calculator')
      const penaltyResult = PenaltyCalculator.calculateTransactionPenalties(itemsForCalculation)
      const calculationDuration = calculationTimer.end('Penalty calculator execution completed')

      penaltyLogger.info('calculateReturnPenalties', 'Penalty calculation completed', {
        calcId,
        transaksiId,
        calculationDuration,
        totalDuration: txQueryDuration + itemPrepDuration + calculationDuration,
        totalPenalty: penaltyResult.totalPenalty,
        totalLateDays: penaltyResult.totalLateDays,
        itemPenaltiesCount: penaltyResult.itemPenalties.length,
        performanceBreakdown: {
          transactionQuery: txQueryDuration,
          itemPreparation: itemPrepDuration,
          penaltyCalculation: calculationDuration
        }
      })

      return penaltyResult
    } catch (error) {
      penaltyLogger.error('calculateReturnPenalties', 'Penalty calculation failed', {
        calcId,
        transaksiId,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        itemCount: returnItems.length
      })
      
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
    const serviceLogger = logger.child('ReturnService')
    const processId = `process-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Start comprehensive performance monitoring
    const processTimer = logger.startTimer('ReturnService', 'processReturn', `total-process-${processId}`)
    
    serviceLogger.info('processReturn', 'Return processing started', {
      processId,
      transaksiId,
      itemCount: request.items.length,
      hasReturnDate: !!request.tglKembali,
      hasNotes: !!request.catatan
    })
    
    try {
      // Step 1: Log return processing start (fire-and-forget async - zero blocking)
      const auditStartTimer = logger.startTimer('ReturnService', 'processReturn', 'audit-start-logging')
      // Fire-and-forget async logging - no await to prevent blocking
      Promise.resolve().then(() => 
        this.auditService.logReturnActivityAsync(transaksiId, {
          items: request.items,
          totalPenalty: 0,
          totalLateDays: 0,
          catatan: request.catatan,
          stage: 'validation',
        })
      ).catch(err => {
        // Log error but don't fail the main process
        serviceLogger.warn('processReturn', 'Async audit logging failed', { processId, error: err.message })
      })
      const auditStartDuration = auditStartTimer.end('Audit start logging initiated')

      // Step 2: Pre-transaction validations and calculations (OPTIMIZED: Parallel processing)
      
      // Calculate return date (no async, fast operation)
      const returnDate = request.tglKembali ? new Date(request.tglKembali) : new Date()
      
      // Run validation and penalty calculation preparation in PARALLEL
      const parallelTimer = logger.startTimer('ReturnService', 'processReturn', 'parallel-operations')
      serviceLogger.info('processReturn', 'Starting parallel validation and preparation', { 
        processId, 
        transaksiId, 
        itemCount: request.items.length 
      })
      
      const [combinedValidation, penaltyCalculation] = await Promise.all([
        // Validation (optimized lean query)
        this.validateReturnProcessing(transaksiId, request.items),
        // Penalty calculation (moved from later in the process)
        this.calculateReturnPenalties(transaksiId, request.items, returnDate)
      ])
      
      const parallelDuration = parallelTimer.end('Parallel operations completed')
      
      // Check validation results
      if (!combinedValidation.isValid) {
        const errorMessage = combinedValidation.error || 'Validation failed'
        
        serviceLogger.warn('processReturn', 'Validation failed', {
          processId,
          transaksiId,
          errorMessage,
          parallelDuration,
          details: combinedValidation.details
        })
        
        await this.auditService.logReturnError(transaksiId, {
          error: errorMessage,
          stage: 'validation',
          context: { details: combinedValidation.details },
          duration: Date.now() - startTime,
        })
        throw new Error(errorMessage)
      }
      
      const eligibility = combinedValidation.transaction!.transaction
      
      serviceLogger.info('processReturn', 'Parallel validation and penalty calculation completed', {
        processId,
        transaksiId,
        parallelDuration,
        transactionStatus: eligibility.status,
        itemsFound: eligibility.items.length,
        totalPenalty: penaltyCalculation.totalPenalty,
        totalLateDays: penaltyCalculation.totalLateDays
      })

      // Log calculation start (fire-and-forget async - zero blocking)
      const auditCalcStartTimer = logger.startTimer('ReturnService', 'processReturn', 'audit-calculation-logging')
      // Fire-and-forget async logging - no await to prevent blocking
      Promise.resolve().then(() =>
        this.auditService.logReturnActivityAsync(transaksiId, {
          items: request.items,
          totalPenalty: penaltyCalculation.totalPenalty, // Now available from parallel execution
          totalLateDays: penaltyCalculation.totalLateDays,
          catatan: request.catatan,
          stage: 'calculation',
        })
      ).catch(err => {
        serviceLogger.warn('processReturn', 'Async audit calculation logging failed', { processId, error: err.message })
      })
      const auditCalcStartDuration = auditCalcStartTimer.end('Audit calculation logging initiated')

      // Log penalty calculation details (fire-and-forget async - zero blocking)
      const auditPenaltyTimer = logger.startTimer('ReturnService', 'processReturn', 'audit-penalty-logging')
      // Fire-and-forget async logging - no await to prevent blocking
      Promise.resolve().then(() =>
        this.auditService.logPenaltyCalculationAsync(transaksiId, {
          calculationDuration: parallelDuration, // Use parallel execution time
          totalPenalty: penaltyCalculation.totalPenalty,
          lateDays: penaltyCalculation.totalLateDays,
          itemBreakdown: penaltyCalculation.itemPenalties.map(p => ({
            itemId: p.itemId,
            productName: p.productName,
            penalty: p.totalPenalty,
            reason: p.description,
          })),
        })
      ).catch(err => {
        serviceLogger.warn('processReturn', 'Async penalty calculation logging failed', { processId, error: err.message })
      })
      const auditPenaltyDuration = auditPenaltyTimer.end('Audit penalty logging initiated')

      // Log processing start (fire-and-forget async - zero blocking)
      const auditProcessingTimer = logger.startTimer('ReturnService', 'processReturn', 'audit-processing-logging')
      // Fire-and-forget async logging - no await to prevent blocking
      Promise.resolve().then(() =>
        this.auditService.logReturnActivityAsync(transaksiId, {
          items: request.items,
          totalPenalty: penaltyCalculation.totalPenalty,
          totalLateDays: penaltyCalculation.totalLateDays,
          catatan: request.catatan,
          stage: 'processing',
        })
      ).catch(err => {
        serviceLogger.warn('processReturn', 'Async processing logging failed', { processId, error: err.message })
      })
      const auditProcessingDuration = auditProcessingTimer.end('Audit processing logging initiated')

      // Step 3: Execute atomic database operations in transaction with detailed timing
      const dbTransactionTimer = logger.startTimer('ReturnService', 'processReturn', 'database-transaction')
      serviceLogger.info('processReturn', 'Starting database transaction', { 
        processId, 
        transaksiId,
        totalPenalty: penaltyCalculation.totalPenalty,
        itemsToProcess: request.items.length
      })
      
      const transactionStart = Date.now()
      const transactionResult = await this.prisma.$transaction(
        async (tx) => {
          const txLogger = serviceLogger // Use same logger for transaction operations
          
          // Transaction operation logging
          txLogger.debug('processReturn', 'Transaction started', { 
            processId, 
            transaksiId,
            timestamp: new Date().toISOString()
          })

          // Update transaction status and penalty with timing
          const txUpdateTimer = logger.startTimer('ReturnService', 'processReturn', 'transaction-update')
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
          const txUpdateDuration = txUpdateTimer.end('Transaction status update completed')

          txLogger.debug('processReturn', 'Transaction status updated', { 
            processId, 
            transaksiId,
            newStatus: updatedTransaction.status,
            returnDate: returnDate.toISOString(),
            penaltyAdded: penaltyCalculation.totalPenalty,
            txUpdateDuration
          })

          // Prepare batch operations data with timing
          const batchPrepTimer = logger.startTimer('ReturnService', 'processReturn', 'batch-preparation')
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
          const batchPrepDuration = batchPrepTimer.end('Batch operations preparation completed')

          txLogger.debug('processReturn', 'Batch operations prepared', { 
            processId, 
            transaksiId,
            transactionItemUpdatesCount: transactionItemUpdates.length,
            productStockUpdatesCount: productStockUpdates.size,
            batchPrepDuration
          })

          // Execute ALL database operations in parallel for maximum performance
          const batchUpdatesTimer = logger.startTimer('ReturnService', 'processReturn', 'batch-operations')
          
          // Prepare product stock update operations
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
          
          // Execute ALL updates in parallel: transaction items + product stocks
          await Promise.all([
            ...transactionItemUpdates,
            ...productUpdatePromises
          ])
          
          const batchUpdatesDuration = batchUpdatesTimer.end('All batch operations completed')

          txLogger.debug('processReturn', 'All database updates completed', { 
            processId, 
            transaksiId,
            batchUpdatesDuration,
            totalOperationsCount: transactionItemUpdates.length + productUpdatePromises.length,
            transactionItemUpdatesCount: transactionItemUpdates.length,
            productStockUpdatesCount: productUpdatePromises.length
          })

          // Note: Activity logging moved to async operations outside transaction for better performance

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
      
      const dbTransactionDuration = dbTransactionTimer.end('Database transaction completed')
      const transactionInternalDuration = Date.now() - transactionStart

      serviceLogger.info('processReturn', 'Database transaction completed successfully', {
        processId,
        transaksiId,
        dbTransactionDuration,
        transactionInternalDuration,
        totalPenalty: penaltyCalculation.totalPenalty,
        processedItemsCount: transactionResult.processedItems.length
      })

      // Log successful completion outside transaction (fire-and-forget async - zero blocking)
      const auditCompletionTimer = logger.startTimer('ReturnService', 'processReturn', 'audit-completion-logging')
      // Fire-and-forget async logging - no await to prevent blocking
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
      ).catch(err => {
        serviceLogger.warn('processReturn', 'Async completion logging failed', { processId, error: err.message })
      })
      const auditCompletionDuration = auditCompletionTimer.end('Audit completion logging initiated')

      // Final process completion timing
      const totalProcessDuration = processTimer.end('Return processing completed successfully')

      // Comprehensive performance summary with optimization metrics
      serviceLogger.info('processReturn', 'Return processing completed successfully', {
        processId,
        transaksiId,
        totalProcessDuration,
        performanceBreakdown: {
          auditStartLogging: auditStartDuration,
          parallelValidationAndPenaltyCalculation: parallelDuration, // OPTIMIZED: Parallel execution
          auditCalculationLogging: auditCalcStartDuration,
          auditPenaltyLogging: auditPenaltyDuration,
          auditProcessingLogging: auditProcessingDuration,
          databaseTransaction: dbTransactionDuration,
          auditCompletionLogging: auditCompletionDuration
        },
        businessMetrics: {
          totalPenalty: penaltyCalculation.totalPenalty,
          totalLateDays: penaltyCalculation.totalLateDays,
          processedItemsCount: transactionResult.processedItems.length,
          success: true
        }
      })

      return transactionResult
    } catch (error) {
      // Enhanced error logging for better troubleshooting with comprehensive performance context
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const duration = Date.now() - startTime
      const totalProcessDuration = processTimer.end('Return processing failed')
      
      serviceLogger.error('processReturn', 'Return processing failed', {
        processId,
        transaksiId,
        totalProcessDuration,
        duration,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        timestamp: new Date().toISOString(),
        itemCount: request.items.length
      })
      
      console.error('Return processing error:', {
        processId,
        transaksiId,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        duration,
        totalProcessDuration,
        timestamp: new Date().toISOString(),
      })

      // Log error to audit trail
      await this.auditService.logReturnError(transaksiId, {
        error: errorMessage,
        stage: 'processing',
        stack: error instanceof Error ? error.stack : undefined,
        duration,
        context: { processId },
      })
      
      throw new Error(`Gagal memproses pengembalian: ${errorMessage}`)
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
