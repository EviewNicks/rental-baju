/**
 * Lost Item Resolution API Endpoint - Task 8
 * POST /api/kasir/transaksi/[kode]/resolve-lost-item
 * Resolve lost items with customer replacement or deposit retention
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createUnifiedReturnService } from '@/features/kasir/services/returnService'
import { requirePermission, withRateLimit } from '@/lib/auth-middleware'
import { TransactionCodeGenerator } from '@/features/kasir/lib/utils/codeGenerator'
import { TransaksiService } from '@/features/kasir/services/transaksiService'
import { z } from 'zod'

// Request validation schema
const resolveLostItemSchema = z.object({
  returnRecordId: z.string().min(1, 'Return record ID is required'),
  resolutionType: z.enum(['customer_replaced', 'deposit_kept']),
  notes: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ kode: string }> },
) {
  try {
    // 1. Await params to comply with Next.js 15
    const { kode } = await params

    // 2. Detect parameter type (UUID or transaction code)
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

    // Generate correlation ID for request tracking
    const correlationId = `resolve-lost-${kode}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Log request start for monitoring
    console.log(`[${correlationId}] Lost item resolution request started:`, {
      transactionCode: kode,
      paramType,
      clientIP: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString(),
    })

    // 3. Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await withRateLimit(`resolve-lost-${clientIP}`, 20, 60000)
    if (rateLimitResult.error) {
      return rateLimitResult.error
    }

    // 4. Authentication and permission check
    const authResult = await requirePermission('transaksi', 'update')
    if (authResult.error) {
      return authResult.error
    }
    const { user } = authResult

    // 5. Parse and validate request body
    const body = await request.json()
    const validation = resolveLostItemSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.error.flatten(),
          },
        },
        { status: 400 },
      )
    }

    const { returnRecordId, resolutionType, notes } = validation.data

    // 6. Get transaction using appropriate method based on parameter type
    const transaksiService = new TransaksiService(prisma, user.id)
    const transaction = paramType === 'uuid' 
      ? await transaksiService.getTransaksiById(kode)
      : await transaksiService.getTransaksiByCode(kode)

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          message: 'Transaction not found',
          error: {
            code: 'TRANSACTION_NOT_FOUND',
            message: `Transaksi dengan kode ${kode} tidak ditemukan`,
          },
        },
        { status: 404 },
      )
    }

    // 7. Create return service and process resolution
    const returnService = createUnifiedReturnService(prisma, user.id)

    const result = await returnService.resolveLostItem({
      transaksiId: transaction.id,
      returnRecordId,
      resolutionType,
      notes,
    })

    // 8. Log success and return response
    console.log(`[${correlationId}] Lost item resolution completed successfully:`, {
      transactionId: transaction.id,
      transactionCode: transaction.kode,
      returnRecordId,
      resolutionType,
      refundAmount: result.refundAmount,
      userId: user.id,
      processingTime: Date.now() - parseInt(correlationId.split('-')[2]),
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        resolutionType: result.resolutionType,
        refundAmount: result.refundAmount,
        stockUpdates: result.stockUpdates,
      },
    })
  } catch (error) {
    const { kode } = await params
    const correlationId = `resolve-lost-${kode}-${Date.now()}`

    // Enhanced error logging with context
    console.error(`[${correlationId}] Lost item resolution failed:`, {
      transactionCode: kode,
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : {
              message: 'Unknown error',
              type: typeof error,
            },
      timestamp: new Date().toISOString(),
      clientIP: request.headers.get('x-forwarded-for') || 'unknown',
    })

    // Handle not found errors
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: 'NOT_FOUND',
          },
        },
        { status: 404 },
      )
    }

    // Handle already resolved errors
    if (error instanceof Error && error.message.includes('already resolved')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: 'ALREADY_RESOLVED',
          },
        },
        { status: 400 },
      )
    }

    // Handle validation errors
    if (
      error instanceof Error &&
      (error.message.includes('Can only resolve') ||
        error.message.includes('No rented quantity') ||
        error.message.includes('Product size ID not found'))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 },
      )
    }

    // Handle business logic errors
    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: 'BUSINESS_ERROR',
          },
        },
        { status: 400 },
      )
    }

    // Handle database connection errors
    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string' &&
      error.message.includes('connection pool')
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Database connection timeout. Please try again.',
            code: 'CONNECTION_ERROR',
          },
        },
        { status: 503 },
      )
    }

    // Generic server error
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
      },
      { status: 500 },
    )
  }
}

// Method not allowed for other HTTP methods
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: 'Method not allowed',
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST method is supported' },
    },
    { status: 405 },
  )
}

export async function PATCH() {
  return NextResponse.json(
    {
      success: false,
      message: 'Method not allowed',
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST method is supported' },
    },
    { status: 405 },
  )
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      message: 'Method not allowed',
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST method is supported' },
    },
    { status: 405 },
  )
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      message: 'Method not allowed',
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST method is supported' },
    },
    { status: 405 },
  )
}
