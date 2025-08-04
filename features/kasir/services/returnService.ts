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
import { TransaksiService, TransaksiWithDetails } from './transaksiService'

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

  constructor(
    private prisma: PrismaClient,
    private userId: string,
  ) {
    this.transaksiService = new TransaksiService(prisma, userId)
  }

  /**
   * Validate if a transaction is eligible for return processing
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
      // Get transaction details
      const transaction = await this.transaksiService.getTransaksiById(transaksiId)

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
      return PenaltyCalculator.calculateTransactionPenalties(itemsForCalculation)
    } catch (error) {
      throw new Error(
        `Gagal menghitung penalty: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Process return transaction with atomic database operations
   */
  async processReturn(
    transaksiId: string,
    request: ReturnRequest,
  ): Promise<ReturnProcessingResult> {
    return await this.prisma.$transaction(async (tx) => {
      try {
        // Validate eligibility
        const eligibility = await this.validateReturnEligibility(transaksiId)
        if (!eligibility.isEligible || !eligibility.transaction) {
          throw new Error(
            eligibility.reason || 'Transaksi tidak memenuhi syarat untuk pengembalian',
          )
        }

        // Validate return items
        const validation = await this.validateReturnItems(transaksiId, request.items)
        if (!validation.isValid) {
          throw new Error(
            `Validasi item gagal: ${validation.errors.map((e) => e.message).join(', ')}`,
          )
        }

        // Calculate return date
        const returnDate = request.tglKembali ? new Date(request.tglKembali) : new Date()

        // Calculate penalties
        const penaltyCalculation = await this.calculateReturnPenalties(
          transaksiId,
          request.items,
          returnDate,
        )

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

        // Update transaction items
        const processedItems = []
        for (const returnItem of request.items) {
          await tx.transaksiItem.update({
            where: { id: returnItem.itemId },
            data: {
              kondisiAkhir: returnItem.kondisiAkhir,
              statusKembali: 'lengkap',
            },
          })

          // Find penalty details for this item
          const itemPenalty = penaltyCalculation.itemPenalties.find(
            (p) => p.itemId === returnItem.itemId,
          )

          processedItems.push({
            itemId: returnItem.itemId,
            penalty: itemPenalty?.totalPenalty || 0,
            kondisiAkhir: returnItem.kondisiAkhir,
            statusKembali: 'lengkap' as const,
          })
        }

        // Update product stock (increment available quantity)
        for (const returnItem of request.items) {
          const transactionItem = eligibility.transaction.items.find(
            (item) => item.id === returnItem.itemId,
          )
          if (transactionItem) {
            await tx.product.update({
              where: { id: transactionItem.produkId },
              data: {
                quantity: {
                  increment: returnItem.jumlahKembali,
                },
              },
            })
          }
        }

        // Create activity log
        await tx.aktivitasTransaksi.create({
          data: {
            transaksiId,
            tipe: 'dikembalikan',
            deskripsi: `Pengembalian ${request.items.length} item dengan total penalty ${PenaltyCalculator.formatPenaltyAmount(penaltyCalculation.totalPenalty)}`,
            data: {
              returnItems: request.items.map((item) => ({
                itemId: item.itemId,
                kondisiAkhir: item.kondisiAkhir,
                jumlahKembali: item.jumlahKembali,
              })),
              penaltyDetails: {
                totalPenalty: penaltyCalculation.totalPenalty,
                totalLateDays: penaltyCalculation.totalLateDays,
                breakdown: penaltyCalculation.itemPenalties.map((p) => ({
                  itemId: p.itemId,
                  productName: p.productName,
                  totalPenalty: p.totalPenalty,
                  lateDays: p.lateDays,
                  dailyPenaltyRate: p.dailyPenaltyRate,
                  reasonCode: p.reasonCode,
                  description: p.description,
                })),
              },
              returnDate: returnDate.toISOString(),
              catatan: request.catatan || null,
              //eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as Record<string, any>,
            createdBy: this.userId,
          },
        })

        return {
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
      } catch (error) {
        throw new Error(
          `Gagal memproses pengembalian: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    })
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
