/**
 * Pickup API Endpoint - TSK-22
 * PATCH /api/kasir/transaksi/[kode]/ambil
 * Process item pickup from transaction
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'
import { createPickupService } from '../../../../../../features/kasir/services/pickupService'
import { pickupRequestSchema } from '../../../../../../features/kasir/lib/validation/kasirSchema'
import { TransaksiService } from '../../../../../../features/kasir/services/transaksiService'

const prisma = new PrismaClient()

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ kode: string }> }
) {
  try {
    // 1. Await params to comply with Next.js 15
    const { kode } = await params
    
    // 2. Authentication & Authorization
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Unauthorized - Login required',
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
        },
        { status: 401 }
      )
    }

    // 3. Parse and validate request body
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

    // 4. Get transaction by code
    const transaksiService = new TransaksiService(prisma, userId)
    
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

    // 4. Process pickup using PickupService
    const pickupService = createPickupService(prisma, userId)
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

    // 5. Update transaction pickup status
    await pickupService.updateTransactionPickupStatus(transaction.id)

    // 6. Transform response to match API contract
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

    // 7. Return success response
    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        transaction: transformedTransaction
      }
    })

  } catch (error) {
    console.error('Pickup API Error:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred while processing pickup'
        }
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
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