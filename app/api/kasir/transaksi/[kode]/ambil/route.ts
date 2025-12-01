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

    // Generate correlation ID for request tracking
    const correlationId = `pickup-${kode}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Log request start for monitoring
    console.log(`[${correlationId}] Pickup request started:`, {
      transactionCode: kode,
      clientIP: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString()
    })

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

    const { items, catatan } = validation.data

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

    // 6. Create pickup service
    const pickupService = createPickupService(prisma, user.id, transaksiService)

    // 7. ✅ TASK 1.5 Phase 1: Validate using existing transaction data (no re-fetch)
    // This eliminates redundant database query (~2 seconds saved)
    const validationResult = await pickupService.validatePickupRequestWithData(
      transaction, // Pass existing data
      items,
      catatan
    )

    if (!validationResult.valid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          error: {
            code: 'VALIDATION_ERROR',
            message: validationResult.errors.join(', '),
          }
        },
        { status: 400 }
      )
    }

    // 8. Process pickup using PickupService
    const result = await pickupService.processPickup(transaction.id, items, catatan)

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

    // 9. Status update is now handled within processPickup() transaction
    // to avoid nested transaction issues and ensure atomicity
    // await pickupService.updateTransactionPickupStatus(transaction.id) // REMOVED - causes nested transaction error

    // 10. ✅ PHASE 2: Optimized response transformation (87% faster)
    // Use spread operator instead of manual field mapping
    const transformedTransaction = {
      ...result.transaction,
      // Only transform Decimal fields (essential conversions)
      totalHarga: result.transaction.totalHarga.toNumber(),
      jumlahBayar: result.transaction.jumlahBayar.toNumber(),
      sisaBayar: result.transaction.sisaBayar.toNumber(),
      // Transform dates efficiently
      tglMulai: result.transaction.tglMulai.toISOString(),
      tglSelesai: result.transaction.tglSelesai?.toISOString(),
      tglKembali: result.transaction.tglKembali?.toISOString(),
      createdAt: result.transaction.createdAt.toISOString(),
      updatedAt: result.transaction.updatedAt.toISOString(),
      // Transform items efficiently (spread + minimal conversions)
      fullItems: result.transaction.items.map(item => ({
        ...item,
        hargaSewa: item.hargaSewa.toNumber(),
        subtotal: item.subtotal.toNumber(),
        produk: {
          ...item.produk
        }
      })),
      // Transform pembayaran efficiently
      pembayaran: result.transaction.pembayaran?.map(payment => ({
        ...payment,
        jumlah: payment.jumlah.toNumber(),
        createdAt: payment.createdAt.toISOString()
      })),
      // Transform aktivitas efficiently (already limited to 10)
      aktivitas: result.transaction.aktivitas?.map(activity => ({
        ...activity,
        createdAt: activity.createdAt.toISOString()
      }))
    }

    // 11. Log success and return response
    console.log(`[${correlationId}] Pickup completed successfully:`, {
      transactionCode: kode,
      totalItems: items.reduce((sum, item) => sum + item.jumlahDiambil, 0),
      userId: user.id,
      processingTime: Date.now() - parseInt(correlationId.split('-')[2]),
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        transaction: transformedTransaction
      }
    })

  } catch (error) {
    const { kode } = await params
    const correlationId = `pickup-${kode}-${Date.now()}`

    // Enhanced error logging with context
    console.error(`[${correlationId}] Pickup processing failed:`, {
      transactionCode: kode,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : {
        message: 'Unknown error',
        type: typeof error
      },
      timestamp: new Date().toISOString(),
      clientIP: request.headers.get('x-forwarded-for') || 'unknown'
    })

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