/**
 * API Route: Individual Transaksi Management - RPK-26
 * 
 * GET /api/kasir/transaksi/[kode] - Get transaksi by code with full details
 * PUT /api/kasir/transaksi/[kode] - Update transaksi status and details
 * 
 * Authentication: Clerk (admin/kasir roles only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TransaksiService } from '@/features/kasir/services/transaksiService'
import { updateTransaksiSchema } from '@/features/kasir/lib/validation/kasirSchema'
import { TransactionCodeGenerator } from '@/features/kasir/lib/utils/codeGenerator'
import { ZodError } from 'zod'
import { requirePermission, withRateLimit } from '@/lib/auth-middleware'

interface RouteParams {
  params: Promise<{
    kode: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await withRateLimit(`transaksi-get-${clientIP}`, 100, 60000)
    if (rateLimitResult.error) {
      return rateLimitResult.error
    }

    // Authentication and permission check
    const authResult = await requirePermission('transaksi', 'read')
    if (authResult.error) {
      return authResult.error
    }
    const { user } = authResult

    const { kode } = await params

    // Detect parameter type (UUID or transaction code)
    const paramType = TransactionCodeGenerator.detectParameterType(kode)
    
    if (paramType === 'invalid') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Parameter harus berupa kode transaksi (contoh: TXN-20250726-001) atau ID transaksi',
            code: 'VALIDATION_ERROR'
          }
        },
        { status: 400 }
      )
    }

    // Initialize transaksi service
    const transaksiService = new TransaksiService(prisma, user.id)

    // Get transaksi using appropriate method based on parameter type
    const transaksi = paramType === 'uuid' 
      ? await transaksiService.getTransaksiById(kode)
      : await transaksiService.getTransaksiByCode(kode)

    // Format response data
    const formattedData = {
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
      items: transaksi.items.map(item => ({
        id: item.id,
        produk: {
          id: item.produk.id,
          code: item.produk.code,
          name: item.produk.name,
          modalAwal: Number(item.produk.modalAwal),
          imageUrl: item.produk.imageUrl,
          // Add missing product fields
          size: item.produk.size || null,
          color: item.produk.color?.name || null,
          category: item.produk.category?.name || null
        },
        jumlah: item.jumlah,
        jumlahDiambil: item.jumlahDiambil,
        hargaSewa: Number(item.hargaSewa),
        durasi: item.durasi,
        subtotal: Number(item.subtotal),
        kondisiAwal: item.kondisiAwal,
        kondisiAkhir: item.kondisiAkhir,
        statusKembali: item.statusKembali,
        // TSK-24: Multi-condition return enhancements
        ...(item.isMultiCondition && {
          isMultiCondition: item.isMultiCondition
        }),
        ...(item.multiConditionSummary && {
          multiConditionSummary: item.multiConditionSummary
        }),
        ...(item.totalReturnPenalty && {
          totalReturnPenalty: Number(item.totalReturnPenalty)
        }),
        ...(item.returnConditions && item.returnConditions.length > 0 && {
          conditionBreakdown: item.returnConditions.map(condition => ({
            id: condition.id,
            kondisiAkhir: condition.kondisiAkhir,
            jumlahKembali: condition.jumlahKembali,
            penaltyAmount: Number(condition.penaltyAmount),
            modalAwalUsed: condition.modalAwalUsed ? Number(condition.modalAwalUsed) : null,
            createdAt: condition.createdAt.toISOString(),
            createdBy: condition.createdBy
          }))
        })
      })),
      pembayaran: transaksi.pembayaran.map(payment => ({
        id: payment.id,
        jumlah: Number(payment.jumlah),
        metode: payment.metode,
        referensi: payment.referensi,
        catatan: payment.catatan,
        createdBy: payment.createdBy,
        createdAt: payment.createdAt.toISOString()
      })),
      aktivitas: transaksi.aktivitas.map(activity => ({
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
        message: 'Detail transaksi berhasil diambil'
      },
      { status: 200 }
    )
  } catch (error) {
    const { kode } = await params
    console.error(`GET /api/kasir/transaksi/${kode} error:`, error)

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

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await withRateLimit(`transaksi-update-${clientIP}`, 10, 60000)
    if (rateLimitResult.error) {
      return rateLimitResult.error
    }

    // Authentication and permission check
    const authResult = await requirePermission('transaksi', 'update')
    if (authResult.error) {
      return authResult.error
    }
    const { user } = authResult

    const { kode } = await params

    // Detect parameter type (UUID or transaction code)
    const paramType = TransactionCodeGenerator.detectParameterType(kode)
    
    if (paramType === 'invalid') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Parameter harus berupa kode transaksi (contoh: TXN-20250726-001) atau ID transaksi',
            code: 'VALIDATION_ERROR'
          }
        },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate request data
    const validatedData = updateTransaksiSchema.parse(body)

    // Check if there's actually data to update
    if (Object.keys(validatedData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Tidak ada data untuk diperbarui',
            code: 'VALIDATION_ERROR'
          }
        },
        { status: 400 }
      )
    }

    // Initialize transaksi service
    const transaksiService = new TransaksiService(prisma, user.id)

    // Get current transaction using appropriate method
    const currentTransaksi = paramType === 'uuid' 
      ? await transaksiService.getTransaksiById(kode)
      : await transaksiService.getTransaksiByCode(kode)

    // Update transaksi status
    await transaksiService.updateTransaksiStatus(
      currentTransaksi.id, 
      validatedData
    )

    // Get updated transaction with full details
    const fullTransaksi = await transaksiService.getTransaksiById(currentTransaksi.id)

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
          modalAwal: Number(item.produk.modalAwal),
          imageUrl: item.produk.imageUrl,
          // Add missing product fields
          size: item.produk.size || null,
          color: item.produk.color?.name || null,
          category: item.produk.category?.name || null
        },
        jumlah: item.jumlah,
        jumlahDiambil: item.jumlahDiambil,
        hargaSewa: Number(item.hargaSewa),
        durasi: item.durasi,
        subtotal: Number(item.subtotal),
        kondisiAwal: item.kondisiAwal,
        kondisiAkhir: item.kondisiAkhir,
        statusKembali: item.statusKembali,
        // TSK-24: Multi-condition return enhancements
        ...(item.isMultiCondition && {
          isMultiCondition: item.isMultiCondition
        }),
        ...(item.multiConditionSummary && {
          multiConditionSummary: item.multiConditionSummary
        }),
        ...(item.totalReturnPenalty && {
          totalReturnPenalty: Number(item.totalReturnPenalty)
        }),
        ...(item.returnConditions && item.returnConditions.length > 0 && {
          conditionBreakdown: item.returnConditions.map(condition => ({
            id: condition.id,
            kondisiAkhir: condition.kondisiAkhir,
            jumlahKembali: condition.jumlahKembali,
            penaltyAmount: Number(condition.penaltyAmount),
            modalAwalUsed: condition.modalAwalUsed ? Number(condition.modalAwalUsed) : null,
            createdAt: condition.createdAt.toISOString(),
            createdBy: condition.createdBy
          }))
        })
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
        message: `Transaksi ${kode} berhasil diperbarui`
      },
      { status: 200 }
    )
  } catch (error) {
    const { kode } = await params
    console.error(`PUT /api/kasir/transaksi/${kode} error:`, error)

    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Data tidak valid',
            code: 'VALIDATION_ERROR',
            details: error.issues.map((err) => ({
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
      // Not found error
      if (error.message.includes('tidak ditemukan')) {
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

      // Status transition errors
      if (error.message.includes('Tidak dapat mengubah status')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: error.message,
              code: 'INVALID_STATUS_TRANSITION'
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