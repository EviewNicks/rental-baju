/**
 * API Route: Kasir Transaksi Management - RPK-26
 * 
 * POST /api/kasir/transaksi - Create new transaction with auto code generation
 * GET /api/kasir/transaksi - Get paginated list of transactions with filters
 * 
 * Authentication: Clerk (admin/kasir roles only)
 * Following existing patterns from manage-product feature
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { TransaksiService } from '@/features/kasir/services/transaksiService'
import { 
  createTransaksiSchema, 
  transaksiQuerySchema 
} from '@/features/kasir/lib/validation/kasirSchema'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' }
        },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate request data
    const validatedData = createTransaksiSchema.parse(body)

    // Initialize transaksi service
    const transaksiService = new TransaksiService(prisma, userId)

    // Create transaksi
    const transaksi = await transaksiService.createTransaksi(validatedData)

    // Get the created transaction with full details for response
    const fullTransaksi = await transaksiService.getTransaksiById(transaksi.id)

    // Format response data
    const formattedData = {
      id: fullTransaksi.id,
      kode: fullTransaksi.kode,
      penyewa: {
        id: fullTransaksi.penyewa.id,
        nama: fullTransaksi.penyewa.nama,
        telepon: fullTransaksi.penyewa.telepon,
        alamat: fullTransaksi.penyewa.alamat
      },
      status: fullTransaksi.status,
      totalHarga: Number(fullTransaksi.totalHarga),
      jumlahBayar: Number(fullTransaksi.jumlahBayar),
      sisaBayar: Number(fullTransaksi.sisaBayar),
      tglMulai: fullTransaksi.tglMulai.toISOString(),
      tglSelesai: fullTransaksi.tglSelesai?.toISOString() || null,
      tglKembali: fullTransaksi.tglKembali?.toISOString() || null,
      metodeBayar: fullTransaksi.metodeBayar,
      catatan: fullTransaksi.catatan,
      createdBy: fullTransaksi.createdBy,
      createdAt: fullTransaksi.createdAt.toISOString(),
      updatedAt: fullTransaksi.updatedAt.toISOString(),
      items: fullTransaksi.items.map(item => ({
        id: item.id,
        produk: {
          id: item.produk.id,
          code: item.produk.code,
          name: item.produk.name,
          imageUrl: item.produk.imageUrl
        },
        jumlah: item.jumlah,
        hargaSewa: Number(item.hargaSewa),
        durasi: item.durasi,
        subtotal: Number(item.subtotal),
        kondisiAwal: item.kondisiAwal,
        kondisiAkhir: item.kondisiAkhir,
        statusKembali: item.statusKembali
      })),
      pembayaran: fullTransaksi.pembayaran.map(payment => ({
        id: payment.id,
        jumlah: Number(payment.jumlah),
        metode: payment.metode,
        referensi: payment.referensi,
        catatan: payment.catatan,
        createdBy: payment.createdBy,
        createdAt: payment.createdAt.toISOString()
      })),
      aktivitas: fullTransaksi.aktivitas.map(activity => ({
        id: activity.id,
        tipe: activity.tipe,
        deskripsi: activity.deskripsi,
        data: activity.data,
        createdBy: activity.createdBy,
        createdAt: activity.createdAt.toISOString()
      }))
    }

    return NextResponse.json(
      {
        success: true,
        data: formattedData,
        message: `Transaksi ${transaksi.kode} berhasil dibuat`
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/kasir/transaksi error:', error)

    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Data tidak valid',
            code: 'VALIDATION_ERROR',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          }
        },
        { status: 400 }
      )
    }

    // Handle business logic errors
    if (error instanceof Error) {
      // Customer not found
      if (error.message.includes('Penyewa tidak ditemukan')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: error.message,
              code: 'NOT_FOUND'
            }
          },
          { status: 404 }
        )
      }

      // Product availability errors
      if (error.message.includes('tidak tersedia') || 
          error.message.includes('tidak mencukupi')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: error.message,
              code: 'AVAILABILITY_ERROR'
            }
          },
          { status: 409 }
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

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' }
        },
        { status: 401 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      penyewaId: searchParams.get('penyewaId') || undefined,
      dateStart: searchParams.get('dateStart') || undefined,
      dateEnd: searchParams.get('dateEnd') || undefined
    }

    // Validate query parameters
    const validatedQuery = transaksiQuerySchema.parse(queryParams)

    // Initialize transaksi service
    const transaksiService = new TransaksiService(prisma, userId)

    // Get transaksi list
    const result = await transaksiService.getTransaksiList(validatedQuery)

    // Format response data
    const formattedData = {
      data: result.data.map(transaksi => ({
        id: transaksi.id,
        kode: transaksi.kode,
        penyewa: {
          id: transaksi.penyewa.id,
          nama: transaksi.penyewa.nama,
          telepon: transaksi.penyewa.telepon,
          alamat: transaksi.penyewa.alamat
        },
        status: transaksi.status,
        totalHarga: Number(transaksi.totalHarga),
        jumlahBayar: Number(transaksi.jumlahBayar),
        sisaBayar: Number(transaksi.sisaBayar),
        tglMulai: transaksi.tglMulai.toISOString(),
        tglSelesai: transaksi.tglSelesai?.toISOString() || null,
        tglKembali: transaksi.tglKembali?.toISOString() || null,
        metodeBayar: transaksi.metodeBayar,
        catatan: transaksi.catatan,
        createdBy: transaksi.createdBy,
        createdAt: transaksi.createdAt.toISOString(),
        updatedAt: transaksi.updatedAt.toISOString(),
        itemCount: transaksi.items.length,
        items: transaksi.items.map(item => ({
          produk: {
            id: item.produk.id,
            name: item.produk.name
          },
          jumlah: item.jumlah
        })),
        recentPayment: transaksi.pembayaran[0] ? {
          jumlah: Number(transaksi.pembayaran[0].jumlah),
          metode: transaksi.pembayaran[0].metode,
          createdAt: transaksi.pembayaran[0].createdAt.toISOString()
        } : null
      })),
      pagination: result.pagination,
      summary: result.summary
    }

    return NextResponse.json(
      {
        success: true,
        data: formattedData,
        message: 'Data transaksi berhasil diambil'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('GET /api/kasir/transaksi error:', error)

    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Parameter query tidak valid',
            code: 'VALIDATION_ERROR',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
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