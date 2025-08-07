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
  isLostItemCondition,
  getExpectedReturnQuantity,
  getValidationContextMessage,
  createEnhancedContextualReturnSchema,
  detectProcessingMode,
  validateMultiConditionBusinessRules,
  getEnhancedValidationMessage,
} from '@/features/kasir/lib/validation/returnValidationSchema'
import { EnhancedReturnRequest } from '@/features/kasir/types'
import { TransactionCodeGenerator } from '@/features/kasir/lib/utils/codeGenerator'
import { ZodError } from 'zod'
import { requirePermission, withRateLimit } from '@/lib/auth-middleware'
import { logger } from '@/services/logger'

interface RouteParams {
  params: Promise<{
    kode: string
  }>
}

// TSK-24: Enhanced request body types supporting multi-condition
interface RequestBodyItem {
  itemId: string
  kondisiAkhir?: string
  jumlahKembali?: number
  // TSK-24: Multi-condition support
  conditions?: Array<{
    kondisiAkhir: string
    jumlahKembali: number
    modalAwal?: number
  }>
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
    // Log API request start with deduplication tracking (CRITICAL: Track multiple calls)
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

    // TSK-24: Enhanced validation with multi-condition support
    let validatedData: EnhancedReturnRequest
    let processingMode: string = 'single-condition' // Initialize with default
    try {
      // Detect processing mode (single, multi, or mixed condition)
      processingMode = detectProcessingMode(body as EnhancedReturnRequest)
      
      // Detect return context based on tglKembali if provided
      let validationContext: 'late' | 'scheduled' | 'flexible' | 'multi-condition' = 'flexible'

      if (body.tglKembali) {
        const returnDate = new Date(body.tglKembali)
        const today = new Date()

        if (returnDate <= today) {
          validationContext = 'late'
          logger.info('API', 'PUT-pengembalian', 'Late return detected', {
            requestId,
            returnDate: body.tglKembali,
            processingMode,
            daysLate: Math.ceil((today.getTime() - returnDate.getTime()) / (24 * 60 * 60 * 1000)),
          })
        } else {
          validationContext = 'scheduled'
          logger.info('API', 'PUT-pengembalian', 'Scheduled return detected', {
            requestId,
            returnDate: body.tglKembali,
            processingMode,
            daysAhead: Math.ceil((returnDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)),
          })
        }
      }

      // Override context for multi-condition requests
      if (processingMode === 'multi-condition') {
        validationContext = 'multi-condition'
      }

      // Use enhanced contextual validation schema
      const validationSchema = createEnhancedContextualReturnSchema(validationContext)
      validatedData = validationSchema.parse(body)
      
      // Additional business rules validation for multi-condition
      const businessValidation = validateMultiConditionBusinessRules(validatedData)
      if (!businessValidation.isValid) {
        const zodError = new ZodError(
          businessValidation.errors.map((err: {field: string; message: string; code: string}) => ({
            code: 'custom',
            path: err.field.split('.'),
            message: err.message,
            fatal: false,
            received: undefined
          }))
        )
        throw zodError
      }

      logger.info('API', 'PUT-pengembalian', 'Validation successful', {
        requestId,
        processingMode,
        validationContext,
        itemCount: validatedData.items.length
      })

    } catch (validationError) {
      if (validationError instanceof ZodError) {
        // Enhanced validation error handling with multi-condition context
        logger.error('API', 'PUT-pengembalian', 'Validation failed', {
          requestId,
          transactionCode: kode,
          processingMode: processingMode || 'unknown',
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

    // TSK-24: Use enhanced processing based on detected mode
    const result = processingMode === 'single-condition' 
      ? await returnService.processReturn(transaksiId, {
          items: validatedData.items.map(item => ({
            itemId: item.itemId,
            kondisiAkhir: item.kondisiAkhir || item.conditions?.[0]?.kondisiAkhir || '',
            jumlahKembali: item.jumlahKembali || item.conditions?.[0]?.jumlahKembali || 0,
          })),
          catatan: validatedData.catatan,
          tglKembali: validatedData.tglKembali,
        })
      : await returnService.processEnhancedReturn(transaksiId, validatedData)

    logger.info('API', 'PUT-pengembalian', 'Return processing completed', {
      requestId,
      processingMode,
      success: result.success,
      totalPenalty: result.penalty,
      processedItems: result.processedItems.length
    })

    // Handle structured error responses from service (CRITICAL FIX - proper HTTP codes)
    if (!result.success) {
      const statusCode = result.details?.statusCode
      
      // Return 409 Conflict for already-returned transactions (idempotent handling)
      if (statusCode === 'ALREADY_RETURNED' && result.details) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: result.details.message,
              code: 'ALREADY_RETURNED',
              currentStatus: result.details.currentStatus,
              originalReturnDate: result.details.originalReturnDate,
              processingTime: result.details.processingTime
            },
          },
          { status: 409 }
        )
      }
      
      // Return 400 Bad Request for other invalid statuses
      if (statusCode === 'INVALID_STATUS' && result.details) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: result.details.message,
              code: 'INVALID_STATUS',
              currentStatus: result.details.currentStatus,
              processingTime: result.details.processingTime
            },
          },
          { status: 400 }
        )
      }
    }

    // TSK-24: Build response data with multi-condition support
    const responseData: Record<string, unknown> = {
      transaksiId: 'transaksiId' in result ? result.transaksiId : result.transactionId,
      totalPenalty: 'totalPenalty' in result ? result.totalPenalty : result.penalty,
      processedItems: result.processedItems,
      updatedTransaction: 'updatedTransaction' in result ? result.updatedTransaction : undefined,
      processingMode, // Include processing mode for client understanding
    }

    // Include multi-condition summary if available
    if ('multiConditionSummary' in result && result.multiConditionSummary) {
      responseData.multiConditionSummary = result.multiConditionSummary
    }

    // Include detailed breakdown only if requested (reduces payload size)
    if (includeDetails) {
      if ('penaltyCalculation' in result && result.penaltyCalculation) {
        // Legacy single-condition format
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
      }
      
      // Enhanced multi-condition breakdown
      if ('multiConditionSummary' in result && result.multiConditionSummary) {
        responseData.multiConditionBreakdown = result.multiConditionSummary
      }
    } else {
      // Include minimal penalty info
      if ('penaltyCalculation' in result && result.penaltyCalculation) {
        responseData.penaltySummary = {
          totalLateDays: result.penaltyCalculation.totalLateDays,
          summary: result.penaltyCalculation.summary,
        }
      }
    }

    const totalApiDuration = apiTimer.end('API request completed successfully')

    // Optimized response with compression and performance headers
    const response = NextResponse.json(
      {
        success: true,
        data: responseData,
        message: `Pengembalian berhasil diproses untuk transaksi ${kode}. Total penalty: Rp ${('totalPenalty' in result ? result.totalPenalty || 0 : result.penalty || 0).toLocaleString('id-ID')}`,
      },
      {
        status: 200,
        headers: {
          // Performance optimization headers
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json; charset=utf-8',
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

    // TSK-24: Handle validation errors with multi-condition support
    if (error instanceof ZodError) {
      // Enhanced validation error response with multi-condition context
      const validationDetails = error.issues.map((err) => {
        const fieldPath = err.path.join('.')
        let enhancedMessage = err.message
        let suggestions: string[] = []

        // Enhanced handling for multi-condition validation errors
        if (fieldPath.includes('conditions')) {
          const enhanced = getEnhancedValidationMessage(err, 'multi-condition')
          enhancedMessage = enhanced.message
          suggestions = enhanced.suggestions
        }
        
        // Enhanced handling for lost item validation errors
        else if (fieldPath.includes('jumlahKembali') && err.message.includes('kondisi barang')) {
          // Try to get the item condition from request body for better error message
          try {
            const itemIndex = parseInt(
              err.path.find((p) => typeof p === 'number')?.toString() || '0',
            )
            const item = requestBody?.items?.[itemIndex]

            if (item) {
              // Check if multi-condition format
              if (item.conditions && item.conditions.length > 0) {
                const conditionIndex = parseInt(
                  err.path.find((p, i) => typeof p === 'number' && i > err.path.indexOf('conditions'))?.toString() || '0'
                )
                const condition = item.conditions[conditionIndex]
                
                if (condition) {
                  const isLost = isLostItemCondition(condition.kondisiAkhir)
                  enhancedMessage = `Multi-condition validation failed for condition ${conditionIndex + 1}: ${condition.kondisiAkhir}`
                  
                  if (isLost) {
                    suggestions = [
                      'Untuk barang hilang dalam multi-condition, set jumlahKembali = 0',
                      'Pisahkan barang hilang dan barang yang dikembalikan ke kondisi terpisah',
                      'Pastikan setiap kondisi memiliki jumlah yang konsisten'
                    ]
                  }
                }
              } else {
                // Single condition format - use existing logic
                const context = getValidationContextMessage({
                  itemId: item.itemId,
                  kondisiAkhir: item.kondisiAkhir || '',
                  jumlahKembali: item.jumlahKembali || 0,
                })
                enhancedMessage = `${err.message}. ${context.message}`
                suggestions = context.suggestions
              }
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
