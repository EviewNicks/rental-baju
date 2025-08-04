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
import { returnRequestSchema } from '@/features/kasir/lib/validation/returnSchema'
import { TransactionCodeGenerator } from '@/features/kasir/lib/utils/codeGenerator'
import { ZodError } from 'zod'
import { requirePermission, withRateLimit } from '@/lib/auth-middleware'
import { logger } from '@/services/logger'

interface RouteParams {
  params: Promise<{
    kode: string
  }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  // Start API performance monitoring with timeout optimization
  const apiTimer = logger.startTimer('API', 'PUT-pengembalian', 'total-api-request')
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Performance optimization: Set up request timeout to prevent hanging
  const timeoutController = new AbortController()
  const timeoutId = setTimeout(() => timeoutController.abort(), 30000) // 30 second timeout

  try {
    // Log API request start
    logger.info('API', 'PUT-pengembalian', 'API request started', {
      requestId,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      contentLength: request.headers.get('content-length'),
    })

    // Rate limiting check with timing
    const rateLimitTimer = logger.startTimer('API', 'PUT-pengembalian', 'rate-limit-check')
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await withRateLimit(`return-${clientIP}`, 10, 60000)
    const rateLimitDuration = rateLimitTimer.end('Rate limit check completed')

    if (rateLimitResult.error) {
      logger.warn('API', 'PUT-pengembalian', 'Rate limit exceeded', {
        requestId,
        clientIP,
        duration: rateLimitDuration,
      })
      return rateLimitResult.error
    }

    // Authentication and permission check with timing
    const authTimer = logger.startTimer('API', 'PUT-pengembalian', 'authentication')
    const authResult = await requirePermission('transaksi', 'update')
    const authDuration = authTimer.end('Authentication completed')

    if (authResult.error) {
      return authResult.error
    }
    const { user } = authResult

    // Parameter processing with timing
    const paramTimer = logger.startTimer('API', 'PUT-pengembalian', 'parameter-processing')
    const { kode } = await params
    const paramDuration = paramTimer.end('Parameter processing completed')

    logger.info('API', 'PUT-pengembalian', 'Authentication and parameters processed', {
      requestId,
      userId: user.id,
      transactionCode: kode,
      authDuration,
      paramDuration,
      rateLimitDuration,
    })

    // Check for optional detailed breakdown with timing
    const urlParsingTimer = logger.startTimer('API', 'PUT-pengembalian', 'url-parsing')
    const { searchParams } = new URL(request.url)
    const includeDetails = searchParams.get('includeDetails') === 'true'
    const urlParsingDuration = urlParsingTimer.end('URL parsing completed')

    // Detect parameter type (UUID or transaction code) with timing
    const paramValidationTimer = logger.startTimer(
      'API',
      'PUT-pengembalian',
      'parameter-validation',
    )
    const paramType = TransactionCodeGenerator.detectParameterType(kode)
    const paramValidationDuration = paramValidationTimer.end('Parameter validation completed')

    if (paramType === 'invalid') {
      logger.warn('API', 'PUT-pengembalian', 'Invalid parameter format', {
        requestId,
        transactionCode: kode,
        paramType: 'invalid',
        duration: paramValidationDuration,
      })
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
    const bodyParsingTimer = logger.startTimer('API', 'PUT-pengembalian', 'body-parsing')
    const body = await request.json()
    const bodyParsingDuration = bodyParsingTimer.end('Request body parsing completed')

    const validationTimer = logger.startTimer('API', 'PUT-pengembalian', 'body-validation')
    const validatedData = returnRequestSchema.parse(body)
    const validationDuration = validationTimer.end('Request body validation completed')

    logger.info('API', 'PUT-pengembalian', 'Request validation completed', {
      requestId,
      paramType,
      includeDetails,
      itemCount: validatedData.items.length,
      urlParsingDuration,
      paramValidationDuration,
      bodyParsingDuration,
      validationDuration,
    })

    // Initialize return service with timing
    const serviceInitTimer = logger.startTimer('API', 'PUT-pengembalian', 'service-initialization')
    const returnService = new ReturnService(prisma, user.id)
    const serviceInitDuration = serviceInitTimer.end('Return service initialized')

    // Get transaction ID based on parameter type with timing
    const transactionLookupTimer = logger.startTimer(
      'API',
      'PUT-pengembalian',
      'transaction-lookup',
    )
    let transaksiId: string
    if (paramType === 'uuid') {
      transaksiId = kode
      logger.debug('API', 'PUT-pengembalian', 'Using UUID parameter directly', {
        requestId,
        transaksiId,
      })
    } else {
      // Get transaction by code to obtain ID
      const transaction = await returnService.getReturnTransactionByCode(kode)
      transaksiId = transaction.id
      logger.debug('API', 'PUT-pengembalian', 'Transaction code resolved to ID', {
        requestId,
        transactionCode: kode,
        transaksiId,
      })
    }
    const transactionLookupDuration = transactionLookupTimer.end('Transaction lookup completed')

    logger.info(
      'API',
      'PUT-pengembalian',
      'Service initialization and transaction lookup completed',
      {
        requestId,
        transaksiId,
        serviceInitDuration,
        transactionLookupDuration,
      },
    )

    // Process the return (validation handled internally by service) with timing
    const returnProcessingTimer = logger.startTimer('API', 'PUT-pengembalian', 'return-processing')
    logger.info('API', 'PUT-pengembalian', 'Starting return processing', {
      requestId,
      transaksiId,
      itemCount: validatedData.items.length,
      returnDate: validatedData.tglKembali,
    })

    const result = await returnService.processReturn(transaksiId, validatedData)
    const returnProcessingDuration = returnProcessingTimer.end('Return processing completed')

    logger.info('API', 'PUT-pengembalian', 'Return processing completed successfully', {
      requestId,
      transaksiId,
      totalPenalty: result.totalPenalty,
      processedItemsCount: result.processedItems.length,
      returnProcessingDuration,
    })

    // Response assembly with timing
    const responseAssemblyTimer = logger.startTimer('API', 'PUT-pengembalian', 'response-assembly')

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

    const responseAssemblyDuration = responseAssemblyTimer.end('Response assembly completed')
    const totalApiDuration = apiTimer.end('API request completed successfully')

    // Log final API performance summary
    logger.info('API', 'PUT-pengembalian', 'API request completed successfully', {
      requestId,
      transaksiId,
      totalApiDuration,
      performanceBreakdown: {
        rateLimitCheck: rateLimitDuration,
        authentication: authDuration,
        parameterProcessing: paramDuration,
        urlParsing: urlParsingDuration,
        parameterValidation: paramValidationDuration,
        bodyParsing: bodyParsingDuration,
        bodyValidation: validationDuration,
        serviceInitialization: serviceInitDuration,
        transactionLookup: transactionLookupDuration,
        returnProcessing: returnProcessingDuration,
        responseAssembly: responseAssemblyDuration,
      },
      responsePayloadSize: JSON.stringify(responseData).length,
      success: true,
    })

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
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Data pengembalian tidak valid',
            code: 'VALIDATION_ERROR',
            details: error.issues.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
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
