/**
 * Pickup API Endpoint - TSK-22
 * PATCH /api/kasir/transaksi/[kode]/ambil
 * Process item pickup from transaction
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPickupService } from '../../../../../../features/kasir/services/pickupService'
import { pickupRequestSchema } from '../../../../../../features/kasir/lib/validation/kasirSchema'
import { TransaksiService } from '../../../../../../features/kasir/services/transaksiService'
import { requirePermission, withRateLimit } from '@/lib/auth-middleware'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ kode: string }> }
) {
  try {
    // 1. Await params to comply with Next.js 15
    const { kode } = await params
    
    // 2. Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await withRateLimit(`transaksi-pickup-${clientIP}`, 50, 60000)
    if (rateLimitResult.error) {
      return rateLimitResult.error
    }

    // 3. Authentication and permission check
    const authResult = await requirePermission('transaksi', 'update')
    if (authResult.error) {
      return authResult.error
    }
    const { user } = authResult

    // 4. Parse and validate request body
    const body = await request.json()
    const validation = pickupRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.error.flatten()
          }
        },
        { status: 400 }
      )
    }

    const { items } = validation.data

    // 5. Get transaction by code
    const transaksiService = new TransaksiService(prisma, user.id)
    
    let transaction
    try {
      transaction = await transaksiService.getTransaksiByCode(kode)
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Transaction not found',
          error: {
            code: 'TRANSACTION_NOT_FOUND',
            message: `Transaksi dengan kode ${kode} tidak ditemukan`
          }
        },
        { status: 404 }
      )
    }

    // 6. Process pickup using PickupService
    const pickupService = createPickupService(prisma, user.id)
    const result = await pickupService.processPickup(transaction.id, items)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          error: {
            code: 'PICKUP_PROCESSING_FAILED',
            message: result.error || 'Failed to process pickup'
          }
        },
        { status: 400 }
      )
    }

    // 7. Update transaction pickup status
    await pickupService.updateTransactionPickupStatus(transaction.id)

    // 8. Transform response to match API contract
    const transformedTransaction = {
      id: result.transaction.id,
      kode: result.transaction.kode,
      penyewa: {
        id: result.transaction.penyewa.id,
        nama: result.transaction.penyewa.nama,
        telepon: result.transaction.penyewa.telepon,
        alamat: result.transaction.penyewa.alamat
      },
      status: result.transaction.status,
      totalHarga: Number(result.transaction.totalHarga),
      jumlahBayar: Number(result.transaction.jumlahBayar),
      sisaBayar: Number(result.transaction.sisaBayar),
      tglMulai: result.transaction.tglMulai.toISOString(),
      tglSelesai: result.transaction.tglSelesai?.toISOString(),
      tglKembali: result.transaction.tglKembali?.toISOString(),
      metodeBayar: result.transaction.metodeBayar,
      catatan: result.transaction.catatan,
      createdBy: result.transaction.createdBy,
      createdAt: result.transaction.createdAt.toISOString(),
      updatedAt: result.transaction.updatedAt.toISOString(),
      fullItems: result.transaction.items.map(item => ({
        id: item.id,
        produkId: item.produkId,
        produk: {
          id: item.produk.id,
          code: item.produk.code,
          name: item.produk.name,
          imageUrl: item.produk.imageUrl
        },
        jumlah: item.jumlah,
        jumlahDiambil: item.jumlahDiambil,
        hargaSewa: Number(item.hargaSewa),
        durasi: item.durasi,
        subtotal: Number(item.subtotal),
        kondisiAwal: item.kondisiAwal,
        kondisiAkhir: item.kondisiAkhir,
        statusKembali: item.statusKembali
      })),
      pembayaran: result.transaction.pembayaran?.map(payment => ({
        id: payment.id,
        jumlah: Number(payment.jumlah),
        metode: payment.metode,
        referensi: payment.referensi,
        catatan: payment.catatan,
        createdBy: payment.createdBy,
        createdAt: payment.createdAt.toISOString()
      })),
      aktivitas: result.transaction.aktivitas?.map(activity => ({
        id: activity.id,
        tipe: activity.tipe,
        deskripsi: activity.deskripsi,
        data: activity.data,
        createdBy: activity.createdBy,
        createdAt: activity.createdAt.toISOString()
      }))
    }

    // 9. Return success response
    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        transaction: transformedTransaction
      }
    })

  } catch (error) {
    const { kode } = await params
    console.error(`PATCH /api/kasir/transaksi/${kode}/ambil error:`, error)

    // Handle not found errors
    if (error instanceof Error && error.message.includes('tidak ditemukan')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Transaksi tidak ditemukan',
            code: 'NOT_FOUND'
          }
        },
        { status: 404 }
      )
    }

    // Handle business logic errors
    if (error instanceof Error) {
      // Pickup processing errors
      if (error.message.includes('pickup') || error.message.includes('pengambilan')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: error.message,
              code: 'PICKUP_ERROR'
            }
          },
          { status: 400 }
        )
      }

      // Validation errors
      if (error.message.includes('validasi') || error.message.includes('validation')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: error.message,
              code: 'VALIDATION_ERROR'
            }
          },
          { status: 400 }
        )
      }

      // Other business logic errors
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: 'BUSINESS_ERROR'
          }
        },
        { status: 400 }
      )
    }

    // Handle database connection errors
    if (error && typeof error === 'object' && 'message' in error && 
        typeof error.message === 'string' && error.message.includes('connection pool')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Database connection timeout. Please try again.',
            code: 'CONNECTION_ERROR'
          }
        },
        { status: 503 }
      )
    }

    // Generic server error
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR'
        }
      },
      { status: 500 }
    )
  }
}

// Method not allowed for other HTTP methods
export async function GET() {
  return NextResponse.json(
    { 
      success: false,
      message: 'Method not allowed',
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only PATCH method is supported' }
    },
    { status: 405 }
  )
}

export async function POST() {
  return NextResponse.json(
    { 
      success: false,
      message: 'Method not allowed',
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only PATCH method is supported' }
    },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { 
      success: false,
      message: 'Method not allowed',
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only PATCH method is supported' }
    },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { 
      success: false,
      message: 'Method not allowed',
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only PATCH method is supported' }
    },
    { status: 405 }
  )
}