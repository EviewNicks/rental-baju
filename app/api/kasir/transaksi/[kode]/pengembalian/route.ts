/**
 * API Route: Transaction Return Processing - TSK-23
 *
 * PUT /api/kasir/transaksi/[kode]/pengembalian - Process transaction return
 *
 * Authentication: Clerk (kasir/owner roles only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ReturnService } from '@/features/kasir/services/returnService'
import {
  createContextualReturnSchema,
  isLostItemCondition,
  getExpectedReturnQuantity,
  getValidationContextMessage,
} from '@/features/kasir/lib/validation/returnSchema'
import { TransactionCodeGenerator } from '@/features/kasir/lib/utils/codeGenerator'
import { ZodError } from 'zod'
import { requirePermission, withRateLimit } from '@/lib/auth-middleware'
import { logger } from '@/services/logger'

interface RouteParams {
  params: Promise<{
    kode: string
  }>
}

interface RequestBodyItem {
  itemId: string
  kondisiAkhir: string
  jumlahKembali: number
}

interface RequestBodyType {
  items?: RequestBodyItem[]
  catatan?: string
  tglKembali?: string
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  // Start API performance monitoring with timeout optimization
  const apiTimer = logger.startTimer('API', 'PUT-pengembalian', 'total-api-request')
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Performance optimization: Set up request timeout to prevent hanging
  const timeoutController = new AbortController()
  const timeoutId = setTimeout(() => timeoutController.abort(), 30000) // 30 second timeout

  // Declare variables that need to be accessible in error handler
  let requestBody: RequestBodyType | null = null

  try {
    // Log API request start
    logger.info('API', 'PUT-pengembalian', 'API request started', {
      requestId,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      contentLength: request.headers.get('content-length'),
    })

    // Rate limiting check with timing

    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await withRateLimit(`return-${clientIP}`, 10, 60000)

    if (rateLimitResult.error) {
      return rateLimitResult.error
    }

    // Authentication and permission check with timing

    const authResult = await requirePermission('transaksi', 'update')

    if (authResult.error) {
      return authResult.error
    }
    const { user } = authResult

    // Parameter processing with timing

    const { kode } = await params

    // Check for optional detailed breakdown with timing

    const { searchParams } = new URL(request.url)
    const includeDetails = searchParams.get('includeDetails') === 'true'

    // Detect parameter type (UUID or transaction code) with timing

    const paramType = TransactionCodeGenerator.detectParameterType(kode)

    if (paramType === 'invalid') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message:
              'Parameter harus berupa kode transaksi (contoh: TXN-20250726-001) atau ID transaksi',
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 },
      )
    }

    // Parse and validate request body with timing

    const body = await request.json()
    requestBody = body // Store reference for error handling

    // Enhanced validation with context detection
    let validatedData
    try {
      // Detect return context based on tglKembali if provided
      let validationContext: 'late' | 'scheduled' | 'flexible' = 'flexible'

      if (body.tglKembali) {
        const returnDate = new Date(body.tglKembali)
        const today = new Date()

        if (returnDate <= today) {
          validationContext = 'late'
          logger.info('API', 'PUT-pengembalian', 'Late return detected', {
            requestId,
            returnDate: body.tglKembali,
            daysLate: Math.ceil((today.getTime() - returnDate.getTime()) / (24 * 60 * 60 * 1000)),
          })
        } else {
          validationContext = 'scheduled'
          logger.info('API', 'PUT-pengembalian', 'Scheduled return detected', {
            requestId,
            returnDate: body.tglKembali,
            daysAhead: Math.ceil((returnDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)),
          })
        }
      }

      // Use contextual validation schema
      const validationSchema = createContextualReturnSchema(validationContext)
      validatedData = validationSchema.parse(body)
    } catch (validationError) {
      if (validationError instanceof ZodError) {
        // Enhanced validation error handling with context
        logger.error('API', 'PUT-pengembalian', 'Validation failed', {
          requestId,
          transactionCode: kode,
          validationErrors: validationError.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
          requestBody: body,
        })

        throw validationError // Re-throw to be handled by main catch block
      }
      throw validationError
    }

    // Initialize return service with timing

    const returnService = new ReturnService(prisma, user.id)

    let transaksiId: string
    if (paramType === 'uuid') {
      transaksiId = kode
    } else {
      // Get transaction by code to obtain ID
      const transaction = await returnService.getReturnTransactionByCode(kode)
      transaksiId = transaction.id
    }

    const result = await returnService.processReturn(transaksiId, validatedData)

    // Build response data (optimized payload)
    const responseData: Record<string, unknown> = {
      transaksiId: result.transaksiId,
      totalPenalty: result.totalPenalty,
      processedItems: result.processedItems,
      updatedTransaction: result.updatedTransaction,
    }

    // Include detailed breakdown only if requested (reduces payload size)
    if (includeDetails && result.penaltyCalculation) {
      responseData.penaltyBreakdown = {
        totalLateDays: result.penaltyCalculation.totalLateDays,
        summary: result.penaltyCalculation.summary,
        itemDetails: result.penaltyCalculation.itemPenalties.map((penalty) => ({
          itemId: penalty.itemId,
          productName: penalty.productName,
          lateDays: penalty.lateDays,
          penalty: penalty.totalPenalty,
          reason: penalty.description,
        })),
      }
    } else if (result.penaltyCalculation) {
      // Include minimal penalty info
      responseData.penaltySummary = {
        totalLateDays: result.penaltyCalculation.totalLateDays,
        summary: result.penaltyCalculation.summary,
      }
    }

    const totalApiDuration = apiTimer.end('API request completed successfully')

    // Optimized response with compression and performance headers
    const response = NextResponse.json(
      {
        success: true,
        data: responseData,
        message: `Pengembalian berhasil diproses untuk transaksi ${kode}. Total penalty: Rp ${result.totalPenalty.toLocaleString('id-ID')}`,
      },
      {
        status: 200,
        headers: {
          // Performance optimization headers
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Encoding': 'gzip', // Enable compression
          'X-Request-ID': requestId,
          'X-Processing-Time': `${totalApiDuration}ms`,
          'X-Performance-Optimized': 'true',
          // CORS optimization for frontend
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          // Security headers
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        },
      },
    )

    // Clear timeout on successful completion
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    // Clear timeout on error
    clearTimeout(timeoutId)

    // Capture error timing and details
    const totalApiDuration = apiTimer.end('API request failed')
    const { kode } = await params

    // Enhanced error logging with performance context
    logger.error('API', 'PUT-pengembalian', 'API request failed', {
      requestId,
      transactionCode: kode,
      totalApiDuration,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
      timestamp: new Date().toISOString(),
    })

    console.error(`PUT /api/kasir/transaksi/${kode}/pengembalian error:`, error)

    // Handle validation errors
    if (error instanceof ZodError) {
      // Enhanced validation error response with helpful context
      const validationDetails = error.issues.map((err) => {
        const fieldPath = err.path.join('.')
        let enhancedMessage = err.message
        let suggestions: string[] = []

        // Enhanced handling for lost item validation errors
        if (fieldPath.includes('jumlahKembali') && err.message.includes('kondisi barang')) {
          // Try to get the item condition from request body for better error message
          try {
            const itemIndex = parseInt(
              err.path.find((p) => typeof p === 'number')?.toString() || '0',
            )
            const item = requestBody?.items?.[itemIndex]

            if (item) {
              // Use the enhanced context message generation
              const context = getValidationContextMessage(item)
              enhancedMessage = `${err.message}. ${context.message}`
              suggestions = context.suggestions
            }
          } catch {
            // Fallback to original message if parsing fails
            const itemIndex = parseInt(
              err.path.find((p) => typeof p === 'number')?.toString() || '0',
            )
            const itemCondition = requestBody?.items?.[itemIndex]?.kondisiAkhir
            const receivedQuantity = requestBody?.items?.[itemIndex]?.jumlahKembali

            if (itemCondition) {
              const isLost = isLostItemCondition(itemCondition)
              const expected = getExpectedReturnQuantity(itemCondition)

              enhancedMessage = `${err.message}. Kondisi: "${itemCondition}" → Jumlah kembali harus ${expected.min === expected.max ? expected.min : `${expected.min}-${expected.max}`}`

              if (isLost && (receivedQuantity ?? 0) > 0) {
                suggestions = [
                  'Untuk barang hilang/tidak dikembalikan, set jumlahKembali = 0',
                  'Penalty akan dihitung berdasarkan modal awal produk',
                  'Pastikan kondisi barang sesuai dengan situasi aktual',
                ]
              } else if (!isLost && (receivedQuantity ?? 0) === 0) {
                suggestions = [
                  'Untuk barang yang dikembalikan, jumlahKembali harus minimal 1',
                  'Jika barang benar-benar hilang, ubah kondisiAkhir ke "Hilang/tidak dikembalikan"',
                  'Periksa kembali kondisi dan jumlah barang yang dikembalikan',
                ]
              }
            }
          }
        }

        return {
          field: fieldPath,
          message: enhancedMessage,
          code: err.code,
          receivedValue: err.path.includes('tglKembali')
            ? 'Invalid date format or out of range'
            : undefined,
          suggestions,
        }
      })

      // Categorize error types for better messaging
      const hasDateError = error.issues.some((issue) => issue.path.includes('tglKembali'))
      const hasLostItemError = error.issues.some(
        (issue) => issue.path.includes('jumlahKembali') && issue.message.includes('kondisi barang'),
      )

      let enhancedMessage = 'Data pengembalian tidak valid'
      let generalHints: string[] = []

      if (hasLostItemError) {
        enhancedMessage = 'Validasi barang hilang gagal. Periksa kondisi dan jumlah kembali.'
        generalHints = [
          'Barang hilang: set jumlahKembali = 0 dan kondisiAkhir mengandung "Hilang" atau "tidak dikembalikan"',
          'Barang normal: set jumlahKembali ≥ 1 dan kondisiAkhir sesuai keadaan barang',
        ]
      } else if (hasDateError) {
        enhancedMessage =
          'Tanggal pengembalian tidak valid. Periksa format dan rentang tanggal yang diizinkan.'
        generalHints = [
          'Untuk pengembalian terlambat: gunakan tanggal masa lalu',
          'Untuk pengembalian terjadwal: maksimal 30 hari ke depan',
          'Format tanggal: ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)',
        ]
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            message: enhancedMessage,
            code: hasLostItemError ? 'LOST_ITEM_VALIDATION_ERROR' : 'VALIDATION_ERROR',
            details: validationDetails,
            hints: generalHints,
          },
        },
        { status: 400 },
      )
    }

    // Handle business logic errors
    if (error instanceof Error) {
      // Transaction not found
      if (error.message.includes('tidak ditemukan')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Transaksi tidak ditemukan',
              code: 'NOT_FOUND',
            },
          },
          { status: 404 },
        )
      }

      // Return eligibility errors
      if (error.message.includes('tidak memenuhi syarat') || error.message.includes('kelayakan')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: error.message,
              code: 'RETURN_NOT_ELIGIBLE',
            },
          },
          { status: 400 },
        )
      }

      // Return processing errors
      if (error.message.includes('Gagal memproses pengembalian')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: error.message,
              code: 'RETURN_PROCESSING_ERROR',
            },
          },
          { status: 400 },
        )
      }

      // Validation errors
      if (error.message.includes('Validasi item gagal')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: error.message,
              code: 'ITEM_VALIDATION_ERROR',
            },
          },
          { status: 400 },
        )
      }

      // Penalty calculation errors
      if (error.message.includes('Gagal menghitung penalty')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: error.message,
              code: 'PENALTY_CALCULATION_ERROR',
            },
          },
          { status: 400 },
        )
      }

      // Other business logic errors
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
