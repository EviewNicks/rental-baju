/**
 * PickupService - TSK-22
 * Service layer for pickup operations business logic
 * Following TDD approach and established kasir patterns
 */

import { PrismaClient } from '@prisma/client'
import { PickupItemRequest } from '../lib/validation/kasirSchema'
import { TransaksiWithDetails } from './transaksiService'
import { PickupValidator, ValidationContext } from '../lib/validation/pickupValidation'

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
  constructor(
    private prisma: PrismaClient,
    private userId: string
  ) {}

  /**
   * Validate pickup request against comprehensive business rules
   */
  async validatePickupRequest(
    transactionId: string, 
    items: PickupItemRequest[]
  ): Promise<PickupValidationResult> {
    try {
      // 1. Check if transaction exists and get current state
      const transaction = await this.prisma.transaksi.findUnique({
        where: { id: transactionId },
        include: {
          items: {
            include: {
              produk: {
                select: { id: true, name: true, code: true }
              }
            }
          }
        }
      })

      if (!transaction) {
        return {
          valid: false,
          errors: ['Transaksi tidak ditemukan']
        }
      }

      // 2. Prepare validation context
      const context: ValidationContext = {
        transactionStatus: transaction.status,
        transactionCode: transaction.kode,
        items: transaction.items
      }

      // 3. Run comprehensive validation using business rules
      const validationResult = PickupValidator.validatePickupRequest(context, items)

      // 4. Transform to service interface format
      return {
        valid: validationResult.valid,
        errors: validationResult.errors.map(e => e.message),
        warnings: validationResult.warnings.length > 0 
          ? validationResult.warnings.map(w => w.message)
          : undefined
      }

    } catch (error) {
      console.error('Error validating pickup request:', error)
      return {
        valid: false,
        errors: ['Terjadi kesalahan saat validasi pickup']
      }
    }
  }

  /**
   * Process pickup operation with atomic database transaction
   */
  async processPickup(
    transactionId: string,
    items: PickupItemRequest[]
  ): Promise<PickupProcessResult> {
    try {
      // 1. Validate the pickup request first
      const validation = await this.validatePickupRequest(transactionId, items)
      
      if (!validation.valid) {
        return {
          success: false,
          transaction: {} as TransaksiWithDetails,
          message: 'Validasi pickup gagal',
          error: validation.errors.join(', ')
        }
      }

      // 2. Process pickup in atomic transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Update each item's pickup quantity
        for (const pickupItem of items) {
          await tx.transaksiItem.update({
            where: { id: pickupItem.id },
            data: {
              jumlahDiambil: {
                increment: pickupItem.jumlahDiambil
              }
            }
          })
        }

        // Create activity log
        const itemsDescription = items.map(item => `${item.jumlahDiambil} item`).join(', ')
        await tx.aktivitasTransaksi.create({
          data: {
            transaksiId: transactionId,
            tipe: 'diambil',
            deskripsi: `Pickup dilakukan: ${itemsDescription}`,
            data: {
              items: items.map(item => ({
                itemId: item.id,
                jumlahDiambil: item.jumlahDiambil
              })),
              processedBy: this.userId,
              timestamp: new Date().toISOString()
            },
            createdBy: this.userId
          }
        })

        // Get updated transaction with all details
        const updatedTransaction = await tx.transaksi.findUnique({
          where: { id: transactionId },
          include: {
            penyewa: {
              select: {
                id: true,
                nama: true,
                telepon: true,
                alamat: true
              }
            },
            items: {
              include: {
                produk: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                    imageUrl: true
                  }
                }
              }
            },
            pembayaran: {
              orderBy: { createdAt: 'desc' }
            },
            aktivitas: {
              orderBy: { createdAt: 'desc' }
            }
          }
        })

        return updatedTransaction as TransaksiWithDetails
      })

      // 3. Generate success message
      const totalItems = items.reduce((sum, item) => sum + item.jumlahDiambil, 0)
      const message = `Berhasil memproses pickup ${totalItems} item dari transaksi ${result.kode}`

      return {
        success: true,
        transaction: result,
        message
      }

    } catch (error) {
      console.error('Error processing pickup:', error)
      return {
        success: false,
        transaction: {} as TransaksiWithDetails,
        message: 'Gagal memproses pickup',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update transaction pickup status based on current item states
   * This is called after pickup to determine if transaction needs status updates
   */
  async updateTransactionPickupStatus(transactionId: string): Promise<void> {
    try {
      const transaction = await this.prisma.transaksi.findUnique({
        where: { id: transactionId },
        include: {
          items: true
        }
      })

      if (!transaction) {
        throw new Error('Transaksi tidak ditemukan')
      }

      // Calculate pickup completion statistics
      const pickupStats = transaction.items.reduce((stats, item) => {
        const isFullyPickedUp = item.jumlahDiambil >= item.jumlah
        const isPartiallyPickedUp = item.jumlahDiambil > 0 && item.jumlahDiambil < item.jumlah
        
        return {
          totalItems: stats.totalItems + 1,
          fullyPickedUp: stats.fullyPickedUp + (isFullyPickedUp ? 1 : 0),
          partiallyPickedUp: stats.partiallyPickedUp + (isPartiallyPickedUp ? 1 : 0),
          notPickedUp: stats.notPickedUp + (item.jumlahDiambil === 0 ? 1 : 0)
        }
      }, {
        totalItems: 0,
        fullyPickedUp: 0,
        partiallyPickedUp: 0,
        notPickedUp: 0
      })

      // Log pickup status for monitoring
      await this.prisma.aktivitasTransaksi.create({
        data: {
          transaksiId: transactionId,
          tipe: 'status_pickup',
          deskripsi: `Status pickup: ${pickupStats.fullyPickedUp} lengkap, ${pickupStats.partiallyPickedUp} sebagian, ${pickupStats.notPickedUp} belum`,
          data: {
            pickupStats,
            calculatedBy: this.userId,
            timestamp: new Date().toISOString()
          },
          createdBy: this.userId
        }
      })

      // Note: Transaction status remains 'active' as pickup doesn't change transaction lifecycle
      // Only return affects transaction status (active -> selesai)

    } catch (error) {
      console.error('Error updating transaction pickup status:', error)
      // Don't throw here as this is a secondary operation
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
                select: { id: true, name: true, code: true }
              }
            }
          }
        }
      })

      if (!transaction) {
        return null
      }

      const items = transaction.items.map(item => ({
        id: item.id,
        productName: item.produk.name,
        productCode: item.produk.code,
        totalQuantity: item.jumlah,
        pickedUpQuantity: item.jumlahDiambil,
        remainingQuantity: item.jumlah - item.jumlahDiambil,
        isFullyPickedUp: item.jumlahDiambil >= item.jumlah
      }))

      const totalQuantity = transaction.items.reduce((sum, item) => sum + item.jumlah, 0)
      const pickedUpQuantity = transaction.items.reduce((sum, item) => sum + item.jumlahDiambil, 0)
      const remainingQuantity = totalQuantity - pickedUpQuantity
      const pickupPercentage = totalQuantity > 0 ? Math.round((pickedUpQuantity / totalQuantity) * 100) : 0

      return {
        totalItems: transaction.items.length,
        totalQuantity,
        pickedUpQuantity,
        remainingQuantity,
        pickupPercentage,
        items
      }

    } catch (error) {
      console.error('Error getting pickup summary:', error)
      return null
    }
  }
}

/**
 * Factory function to create PickupService instance
 */
export const createPickupService = (prisma: PrismaClient, userId: string): PickupService => {
  return new PickupService(prisma, userId)
}