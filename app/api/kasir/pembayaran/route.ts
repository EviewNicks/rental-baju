/**
 * API Route: Kasir Payment Management - RPK-26
 * 
 * POST /api/kasir/pembayaran - Create new payment record
 * GET /api/kasir/pembayaran - Get paginated list of payments with filters
 * 
 * Authentication: Clerk (admin/kasir roles only)
 * Following existing patterns from manage-product feature
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PembayaranService } from '@/features/kasir/services/pembayaranService'
import { createPembayaranSchema } from '@/features/kasir/lib/validation/kasirSchema'
import { ZodError } from 'zod'
import { requirePermission, withRateLimit } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await withRateLimit(`payment-create-${clientIP}`, 20, 60000)
    if (rateLimitResult.error) {
      return rateLimitResult.error
    }

    // Authentication and permission check
    const authResult = await requirePermission('pembayaran', 'create')
    if (authResult.error) {
      return authResult.error
    }
    const { user } = authResult

    // Parse request body
    const body = await request.json()

    // Validate request data
    const validatedData = createPembayaranSchema.parse(body)

    // Initialize payment service
    const pembayaranService = new PembayaranService(prisma, user.id, user.role)

    // Create payment
    const pembayaran = await pembayaranService.createPembayaran(validatedData)

    // Format response data
    const formattedData = {
      id: pembayaran.id,
      transaksi: {
        id: pembayaran.transaksi.id,
        kode: pembayaran.transaksi.kode,
        penyewa: {
          nama: pembayaran.transaksi.penyewa.nama,
          telepon: pembayaran.transaksi.penyewa.telepon
        },
        totalHarga: Number(pembayaran.transaksi.totalHarga),
        jumlahBayar: Number(pembayaran.transaksi.jumlahBayar),
        sisaBayar: Number(pembayaran.transaksi.sisaBayar),
        status: pembayaran.transaksi.status
      },
      jumlah: Number(pembayaran.jumlah),
      metode: pembayaran.metode,
      referensi: pembayaran.referensi,
      catatan: pembayaran.catatan,
      createdBy: pembayaran.createdBy,
      createdAt: pembayaran.createdAt.toISOString()
    }

    return NextResponse.json(
      {
        success: true,
        data: formattedData,
        message: `Pembayaran ${pembayaran.metode} sebesar Rp ${Number(pembayaran.jumlah).toLocaleString('id-ID')} berhasil dicatat`
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/kasir/pembayaran error:', error)

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
      // Transaction not found
      if (error.message.includes('Transaksi tidak ditemukan')) {
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

      // Payment validation errors
      if (error.message.includes('tidak dapat') || 
          error.message.includes('melebihi') ||
          error.message.includes('sudah selesai') ||
          error.message.includes('dibatalkan')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: error.message,
              code: 'PAYMENT_ERROR'
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
    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await withRateLimit(`payment-list-${clientIP}`, 60, 60000)
    if (rateLimitResult.error) {
      return rateLimitResult.error
    }

    // Authentication and permission check
    const authResult = await requirePermission('pembayaran', 'read')
    if (authResult.error) {
      return authResult.error
    }
    const { user } = authResult

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      transaksiId: searchParams.get('transaksiId') || undefined,
      metode: searchParams.get('metode') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    }

    // Initialize payment service
    const pembayaranService = new PembayaranService(prisma, user.id, user.role)

    // Get payment list
    const result = await pembayaranService.getPaymentList(queryParams)

    // Format response data
    const formattedData = {
      data: result.data.map(payment => ({
        id: payment.id,
        transaksi: {
          id: payment.transaksi.id,
          kode: payment.transaksi.kode,
          penyewa: {
            nama: payment.transaksi.penyewa.nama,
            telepon: payment.transaksi.penyewa.telepon
          },
          totalHarga: Number(payment.transaksi.totalHarga),
          jumlahBayar: Number(payment.transaksi.jumlahBayar),
          sisaBayar: Number(payment.transaksi.sisaBayar),
          status: payment.transaksi.status
        },
        jumlah: Number(payment.jumlah),
        metode: payment.metode,
        referensi: payment.referensi,
        catatan: payment.catatan,
        createdBy: payment.createdBy,
        createdAt: payment.createdAt.toISOString()
      })),
      pagination: result.pagination
    }

    return NextResponse.json(
      {
        success: true,
        data: formattedData,
        message: 'Data pembayaran berhasil diambil'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('GET /api/kasir/pembayaran error:', error)

    // Handle validation errors (query params)
    if (error instanceof Error && error.message.includes('Invalid date')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Format tanggal tidak valid',
            code: 'VALIDATION_ERROR'
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