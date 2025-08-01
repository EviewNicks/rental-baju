/**
 * Payment Service - RPK-26
 * Service layer for payment (pembayaran) CRUD operations
 * Following business logic requirements for rental payment management
 */

import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { CreatePembayaranRequest } from '../lib/validation/kasirSchema'
import { PriceCalculator } from '../lib/utils/priceCalculator'
import { createAuditService, AuditService } from './auditService'

export interface PembayaranWithDetails {
  id: string
  transaksiId: string
  jumlah: Decimal
  metode: string
  referensi: string | null
  catatan: string | null
  createdBy: string
  createdAt: Date
  transaksi: {
    id: string
    kode: string
    penyewa: {
      nama: string
      telepon: string
    }
    totalHarga: Decimal
    jumlahBayar: Decimal
    sisaBayar: Decimal
    status: string
  }
}

export interface PaymentSummary {
  totalPaid: Decimal
  remainingAmount: Decimal
  paymentPercentage: number
  isFullyPaid: boolean
  paymentCount: number
  lastPaymentDate?: Date
}

export class PembayaranService {
  private auditService: AuditService

  constructor(
    private prisma: PrismaClient,
    private userId: string,
    private userRole?: string
  ) {
    this.auditService = createAuditService(prisma, userId, userRole)
  }

  /**
   * Create new payment record
   */
  async createPembayaran(data: CreatePembayaranRequest): Promise<PembayaranWithDetails> {
    // 1. Validate transaction exists and is active
    const transaksi = await this.prisma.transaksi.findUnique({
      where: { kode: data.transaksiKode },
      include: {
        penyewa: {
          select: { nama: true, telepon: true }
        }
      }
    })

    if (!transaksi) {
      throw new Error('Transaksi tidak ditemukan')
    }

    if (transaksi.status === 'cancelled') {
      throw new Error('Tidak dapat menambahkan pembayaran ke transaksi yang dibatalkan')
    }

    if (transaksi.status === 'selesai') {
      throw new Error('Transaksi sudah selesai, tidak dapat menambahkan pembayaran')
    }

    // 2. Validate payment amount
    const validation = PriceCalculator.validatePaymentAmount(
      data.jumlah,
      transaksi.totalHarga,
      transaksi.jumlahBayar
    )

    if (!validation.isValid) {
      throw new Error(validation.error!)
    }

    // 3. Create payment record and update transaction in a database transaction with consistency checks
    const result = await this.prisma.$transaction(async (tx) => {
      console.log(`[PAYMENT_CREATE] Starting payment transaction for ${transaksi.kode}`)
      
      // Create payment record
      const pembayaran = await tx.pembayaran.create({
        data: {
          transaksiId: transaksi.id, // Use the found transaction's ID
          jumlah: new Decimal(data.jumlah),
          metode: data.metode,
          referensi: data.referensi || null,
          catatan: data.catatan || null,
          createdBy: this.userId
        }
      })
      console.log(`[PAYMENT_CREATE] Payment record created: ${pembayaran.id}`)

      // Update transaction payment amounts
      const newJumlahBayar = transaksi.jumlahBayar.add(data.jumlah)
      const newSisaBayar = PriceCalculator.calculateRemainingPayment(
        transaksi.totalHarga,
        newJumlahBayar
      )

      await tx.transaksi.update({
        where: { id: transaksi.id }, // Use the found transaction's ID
        data: {
          jumlahBayar: newJumlahBayar,
          sisaBayar: newSisaBayar
        }
      })
      console.log(`[PAYMENT_CREATE] Transaction amounts updated for ${transaksi.kode}`)

      // Create activity log
      const aktivitas = await tx.aktivitasTransaksi.create({
        data: {
          transaksiId: transaksi.id, // Use the found transaction's ID
          tipe: 'dibayar',
          deskripsi: `Pembayaran ${data.metode} sebesar ${PriceCalculator.formatToRupiah(data.jumlah)}`,
          data: {
            paymentId: pembayaran.id,
            amount: data.jumlah,
            method: data.metode,
            reference: data.referensi,
            newTotal: newJumlahBayar.toString(),
            remaining: newSisaBayar.toString()
          },
          createdBy: this.userId
        }
      })
      console.log(`[PAYMENT_CREATE] Activity log created: ${aktivitas.id}`)

      // 🔥 FIX: Verify activity was created within transaction
      const activityVerification = await tx.aktivitasTransaksi.findUnique({
        where: { id: aktivitas.id }
      })
      
      if (!activityVerification) {
        throw new Error(`Critical error: Activity ${aktivitas.id} creation verification failed`)
      }
      console.log(`[PAYMENT_CREATE] Activity verification successful: ${aktivitas.id}`)

      // Get payment with transaction details for response
      const paymentWithDetails = await tx.pembayaran.findUnique({
        where: { id: pembayaran.id },
        include: {
          transaksi: {
            select: {
              id: true,
              kode: true,
              penyewa: {
                select: { nama: true, telepon: true }
              },
              totalHarga: true,
              jumlahBayar: true,
              sisaBayar: true,
              status: true
            }
          }
        }
      })

      console.log(`[PAYMENT_CREATE] Payment transaction completed for ${transaksi.kode}`)
      return paymentWithDetails!
    }, {
      // 🔥 FIX: Increase transaction timeout and set isolation level for consistency
      timeout: 30000, // 30 seconds timeout
      isolationLevel: 'ReadCommitted' // Ensure read-after-write consistency
    })

    // 🔥 FIX: Post-transaction consistency verification
    // Small delay to ensure database consistency across replicas/connections
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Verify the activity exists after transaction commit
    let retryCount = 0
    const maxRetries = 3
    let activityExists = false
    
    while (!activityExists && retryCount < maxRetries) {
      try {
        const activityCheck = await this.prisma.aktivitasTransaksi.findFirst({
          where: {
            transaksiId: transaksi.id,
            tipe: 'dibayar',
            createdBy: this.userId
          },
          orderBy: { createdAt: 'desc' }
        })
        
        if (activityCheck) {
          activityExists = true
          console.log(`[PAYMENT_VERIFY] Activity verification successful after ${retryCount} retries`)
        } else {
          retryCount++
          if (retryCount < maxRetries) {
            console.log(`[PAYMENT_VERIFY] Activity not found, retrying (${retryCount}/${maxRetries})`)
            await new Promise(resolve => setTimeout(resolve, 200 * retryCount)) // Exponential backoff
          }
        }
      } catch (error) {
        retryCount++
        console.error(`[PAYMENT_VERIFY] Activity verification error (${retryCount}/${maxRetries}):`, error)
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 200 * retryCount))
        }
      }
    }
    
    if (!activityExists) {
      console.error(`[PAYMENT_VERIFY] Critical: Activity verification failed after ${maxRetries} retries for ${transaksi.kode}`)
      // Don't fail the entire payment, but log for debugging
    }

    // Log audit trail
    await this.auditService.logPembayaranActivity(
      'create',
      result.id,
      undefined,
      result,
      {
        operation: 'payment_creation',
        transactionCode: result.transaksi.kode,
        amount: data.jumlah,
        method: data.metode
      }
    )

    console.log(`[PAYMENT_CREATE] Payment creation process completed for ${transaksi.kode}`)
    return result as PembayaranWithDetails
  }

  /**
   * Get payments for a transaction
   */
  async getTransactionPayments(transaksiId: string): Promise<PembayaranWithDetails[]> {
    const payments = await this.prisma.pembayaran.findMany({
      where: { transaksiId },
      include: {
        transaksi: {
          select: {
            id: true,
            kode: true,
            penyewa: {
              select: { nama: true, telepon: true }
            },
            totalHarga: true,
            jumlahBayar: true,
            sisaBayar: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return payments as PembayaranWithDetails[]
  }

  /**
   * Get payment by ID
   */
  async getPembayaranById(id: string): Promise<PembayaranWithDetails> {
    const payment = await this.prisma.pembayaran.findUnique({
      where: { id },
      include: {
        transaksi: {
          select: {
            id: true,
            kode: true,
            penyewa: {
              select: { nama: true, telepon: true }
            },
            totalHarga: true,
            jumlahBayar: true,
            sisaBayar: true,
            status: true
          }
        }
      }
    })

    if (!payment) {
      throw new Error('Pembayaran tidak ditemukan')
    }

    return payment as PembayaranWithDetails
  }

  /**
   * Get payment summary for a transaction
   */
  async getPaymentSummary(transaksiId: string): Promise<PaymentSummary> {
    const transaksi = await this.prisma.transaksi.findUnique({
      where: { id: transaksiId },
      select: {
        totalHarga: true,
        jumlahBayar: true,
        sisaBayar: true
      }
    })

    if (!transaksi) {
      throw new Error('Transaksi tidak ditemukan')
    }

    const payments = await this.prisma.pembayaran.findMany({
      where: { transaksiId },
      select: {
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    })

    const paymentCount = await this.prisma.pembayaran.count({
      where: { transaksiId }
    })

    const paymentPercentage = PriceCalculator.calculatePaymentPercentage(
      transaksi.totalHarga,
      transaksi.jumlahBayar
    )

    const isFullyPaid = PriceCalculator.isFullyPaid(
      transaksi.totalHarga,
      transaksi.jumlahBayar
    )

    return {
      totalPaid: transaksi.jumlahBayar,
      remainingAmount: transaksi.sisaBayar,
      paymentPercentage,
      isFullyPaid,
      paymentCount,
      lastPaymentDate: payments[0]?.createdAt
    }
  }

  /**
   * Get all payments with pagination and filtering
   */
  async getPaymentList(params: {
    page?: number
    limit?: number
    transaksiId?: string
    metode?: string
    startDate?: Date
    endDate?: Date
  }): Promise<{
    data: PembayaranWithDetails[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }> {
    const { page = 1, limit = 10, transaksiId, metode, startDate, endDate } = params
    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: Record<string, unknown> = {}

    if (transaksiId) {
      whereClause.transaksiId = transaksiId
    }

    if (metode) {
      whereClause.metode = metode
    }

    if (startDate || endDate) {
      whereClause.createdAt = {}
      if (startDate) (whereClause.createdAt as Record<string, Date>).gte = startDate
      if (endDate) (whereClause.createdAt as Record<string, Date>).lte = endDate
    }

    const [data, total] = await Promise.all([
      this.prisma.pembayaran.findMany({
        skip,
        take: limit,
        where: whereClause,
        include: {
          transaksi: {
            select: {
              id: true,
              kode: true,
              penyewa: {
                select: { nama: true, telepon: true }
              },
              totalHarga: true,
              jumlahBayar: true,
              sisaBayar: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.pembayaran.count({ where: whereClause })
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: data as PembayaranWithDetails[],
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }
  }

  /**
   * Cancel/reverse a payment (admin only)
   */
  async cancelPayment(
    id: string,
    reason: string
  ): Promise<void> {
    const payment = await this.prisma.pembayaran.findUnique({
      where: { id },
      include: {
        transaksi: true
      }
    })

    if (!payment) {
      throw new Error('Pembayaran tidak ditemukan')
    }

    if (payment.transaksi.status === 'cancelled') {
      throw new Error('Tidak dapat membatalkan pembayaran dari transaksi yang sudah dibatalkan')
    }

    // Reverse payment in a database transaction
    await this.prisma.$transaction(async (tx) => {
      // Update transaction amounts
      const newJumlahBayar = payment.transaksi.jumlahBayar.sub(payment.jumlah)
      const newSisaBayar = PriceCalculator.calculateRemainingPayment(
        payment.transaksi.totalHarga,
        newJumlahBayar
      )

      await tx.transaksi.update({
        where: { id: payment.transaksiId },
        data: {
          jumlahBayar: newJumlahBayar,
          sisaBayar: newSisaBayar
        }
      })

      // Delete payment record
      await tx.pembayaran.delete({
        where: { id }
      })

      // Log cancellation activity
      await tx.aktivitasTransaksi.create({
        data: {
          transaksiId: payment.transaksiId,
          tipe: 'pembayaran_dibatalkan',
          deskripsi: `Pembayaran ${payment.metode} sebesar ${PriceCalculator.formatToRupiah(payment.jumlah)} dibatalkan`,
          data: {
            cancelledPaymentId: id,
            amount: payment.jumlah.toString(),
            method: payment.metode,
            reason,
            newTotal: newJumlahBayar.toString(),
            remaining: newSisaBayar.toString()
          },
          createdBy: this.userId
        }
      })
    })

    // Log audit trail
    await this.auditService.logPembayaranActivity(
      'delete',
      id,
      payment,
      undefined,
      {
        operation: 'payment_cancellation',
        reason,
        transactionCode: payment.transaksi.kode,
        amount: payment.jumlah.toString()
      }
    )
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(startDate?: Date, endDate?: Date): Promise<{
    totalPayments: number
    totalAmount: Decimal
    paymentsByMethod: Record<string, { count: number; amount: Decimal }>
    averagePaymentAmount: Decimal
  }> {
    const whereClause: Record<string, unknown> = {}

    if (startDate || endDate) {
      whereClause.createdAt = {}
      if (startDate) (whereClause.createdAt as Record<string, Date>).gte = startDate
      if (endDate) (whereClause.createdAt as Record<string, Date>).lte = endDate
    }

    const payments = await this.prisma.pembayaran.findMany({
      where: whereClause,
      select: {
        jumlah: true,
        metode: true
      }
    })

    const totalPayments = payments.length
    const totalAmount = payments.reduce(
      (sum, payment) => sum.add(payment.jumlah),
      new Decimal(0)
    )

    const paymentsByMethod: Record<string, { count: number; amount: Decimal }> = {}
    payments.forEach(payment => {
      if (!paymentsByMethod[payment.metode]) {
        paymentsByMethod[payment.metode] = { count: 0, amount: new Decimal(0) }
      }
      paymentsByMethod[payment.metode].count++
      paymentsByMethod[payment.metode].amount = paymentsByMethod[payment.metode].amount.add(payment.jumlah)
    })

    const averagePaymentAmount = totalPayments > 0 
      ? totalAmount.div(totalPayments)
      : new Decimal(0)

    return {
      totalPayments,
      totalAmount,
      paymentsByMethod,
      averagePaymentAmount
    }
  }
}