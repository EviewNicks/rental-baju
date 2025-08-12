/**
 * API Route: Transaction Return Processing - TSK-23
 *
 * PUT /api/kasir/transaksi/[kode]/pengembalian - Process transaction return
 *
 * Authentication: Clerk (kasir/owner roles only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UnifiedReturnService } from '@/features/kasir/services/ReturnService'
import {
  unifiedReturnRequestSchema,
  convertLegacyToUnified,
  validateUnifiedReturnRequest,
  UnifiedReturnRequest,
} from '@/features/kasir/lib/validation/ReturnSchema'
import { TransactionCodeGenerator } from '@/features/kasir/lib/utils/codeGenerator'
import { ZodError } from 'zod'
import { requirePermission, withRateLimit } from '@/lib/auth-middleware'
import { logger } from '@/services/logger'

interface RouteParams {
  params: Promise<{
    kode: string
  }>
}

// TSK-24 Phase 1: Unified request body types
interface LegacyRequestBodyItem {
  itemId: string
  kondisiAkhir: string
  jumlahKembali: number
}

interface LegacyRequestBodyType {
  items?: LegacyRequestBodyItem[]
  catatan?: string
  tglKembali?: string
}

// Unified request body is now handled by UnifiedReturnRequest type from schema

export async function PUT(request: NextRequest, { params }: RouteParams) {
  // Start API performance monitoring with timeout optimization
  const apiTimer = logger.startTimer('API', 'PUT-pengembalian', 'total-api-request')
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  // Request deduplication mechanism to prevent multiple identical calls
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const contentLength = request.headers.get('content-length') || '0'

  // Performance optimization: Set up request timeout to prevent hanging
  const timeoutController = new AbortController()
  const timeoutId = setTimeout(() => timeoutController.abort(), 30000) // 30 second timeout

  // Declare variables that need to be accessible in error handler
  let requestBody: LegacyRequestBodyType | UnifiedReturnRequest | null = null

  try {
    // Log API request start with deduplication tracking (CRITICAL: Track multiple calls)
    logger.info('API', 'PUT-pengembalian', 'API request started', {
      requestId,
      timestamp: new Date().toISOString(),
      userAgent,
      contentLength,
      clientIP,
      transactionCode: (await params).kode,
      deduplicationInfo: {
        clientFingerprint: `${clientIP}-${userAgent}-${contentLength}`,
        potentialDuplicate: false, // Will be enhanced in future iterations
      },
    })

    // Rate limiting check with timing
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

    // TSK-24 Phase 1: Unified validation with automatic format detection
    let validatedData: UnifiedReturnRequest
    let isLegacyFormat: boolean = false

    try {
      // Auto-detect request format and convert if needed
      if (body.items && body.items.length > 0) {
        const firstItem = body.items[0]

        // Check if it's legacy format (has kondisiAkhir directly on item)
        if (
          'kondisiAkhir' in firstItem &&
          'jumlahKembali' in firstItem &&
          !('conditions' in firstItem)
        ) {
          isLegacyFormat = true
          logger.info(
            'API',
            'PUT-pengembalian',
            'Legacy format detected - converting to unified format',
            {
              requestId,
              itemCount: body.items.length,
            },
          )

          // Convert legacy format to unified format
          const legacyBody = body as LegacyRequestBodyType
          validatedData = convertLegacyToUnified({
            items: legacyBody.items || [],
            catatan: legacyBody.catatan,
            tglKembali: legacyBody.tglKembali,
          })
        } else {
          // Assume unified format
          validatedData = body as UnifiedReturnRequest
        }
      } else {
        // Empty items array - let validation handle it
        validatedData = body as UnifiedReturnRequest
      }

      // Validate using unified schema
      validatedData = unifiedReturnRequestSchema.parse(validatedData)

      // Additional business rules validation
      const businessValidation = validateUnifiedReturnRequest(validatedData)
      if (!businessValidation.isValid) {
        const zodError = new ZodError(
          businessValidation.errors.map((err) => ({
            code: 'custom',
            path: err.field.split('.'),
            message: err.message,
            fatal: false,
            received: undefined,
          })),
        )
        throw zodError
      }

      logger.info('API', 'PUT-pengembalian', 'Unified validation successful', {
        requestId,
        format: isLegacyFormat ? 'legacy' : 'unified',
        itemCount: validatedData.items.length,
        totalConditions: validatedData.items.reduce((sum, item) => sum + item.conditions.length, 0),
      })
    } catch (validationError) {
      if (validationError instanceof ZodError) {
        logger.error('API', 'PUT-pengembalian', 'Unified validation failed', {
          requestId,
          transactionCode: kode,
          format: isLegacyFormat ? 'legacy' : 'unified',
          validationErrors: validationError.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
          requestBody: requestBody,
        })

        throw validationError // Re-throw to be handled by main catch block
      }
      throw validationError
    }

    // Initialize unified return service
    const unifiedReturnService = new UnifiedReturnService(prisma, user.id)

    let transaksiId: string
    if (paramType === 'uuid') {
      transaksiId = kode
    } else {
      // Get transaction by code to obtain ID
      const transaction = await unifiedReturnService.getReturnTransactionByCode(kode)
      transaksiId = transaction.id
    }

    // TSK-24 Phase 1: Use unified processing for all scenarios
    const result = await unifiedReturnService.processUnifiedReturn(transaksiId, validatedData)

    logger.info('API', 'PUT-pengembalian', 'Unified return processing completed', {
      requestId,
      format: isLegacyFormat ? 'legacy' : 'unified',
      success: result.success,
      totalPenalty: result.penalty,
      processedItems: result.processedItems.length,
      totalConditions: validatedData.items.reduce((sum, item) => sum + item.conditions.length, 0),
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
              processingTime: result.details.processingTime,
            },
          },
          { status: 409 },
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
              processingTime: result.details.processingTime,
            },
          },
          { status: 400 },
        )
      }
    }

    // TSK-24 Phase 1: Build unified response data
    const responseData: Record<string, unknown> = {
      transaksiId: result.transactionId,
      totalPenalty: result.penalty,
      processedItems: result.processedItems,
      processingMode: result.processingMode, // Always 'unified' in new architecture
      format: isLegacyFormat ? 'legacy' : 'unified', // Track input format for analytics
      totalConditions: validatedData.items.reduce((sum, item) => sum + item.conditions.length, 0),
    }

    // Include detailed breakdown only if requested (reduces payload size)
    if (includeDetails) {
      responseData.conditionBreakdown = result.processedItems.map((item) => ({
        itemId: item.itemId,
        penalty: item.penalty,
        conditions: item.conditionBreakdown || [
          {
            kondisiAkhir: item.kondisiAkhir,
            jumlahKembali: 1, // Fallback for simple cases
            penaltyAmount: item.penalty,
          },
        ],
      }))

      responseData.processingMetadata = {
        unifiedArchitecture: true,
        legacyCompatible: true,
        migrationPhase: 1,
        processingTimestamp: new Date().toISOString(),
      }
    }

    const totalApiDuration = apiTimer.end('API request completed successfully')

    // Optimized response with compression and performance headers
    const response = NextResponse.json(
      {
        success: true,
        data: responseData,
        message: `Pengembalian berhasil diproses melalui unified architecture untuk transaksi ${kode}. Total penalty: Rp ${(result.penalty || 0).toLocaleString('id-ID')}`,
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

    // TSK-24 Phase 1: Handle unified validation errors
    if (error instanceof ZodError) {
      // Unified validation error response
      const validationDetails = error.issues.map((err) => {
        const fieldPath = err.path.join('.')
        let enhancedMessage = err.message
        let suggestions: string[] = []

        // Enhanced handling for unified condition validation errors
        if (fieldPath.includes('conditions')) {
          enhancedMessage = `Unified validation failed for ${fieldPath}: ${err.message}`
          suggestions = [
            'Pastikan setiap kondisi memiliki deskripsi yang jelas (minimal 4 karakter)',
            'Contoh kondisi valid: "baik", "kotor", "rusak ringan", "rusak berat", "hilang"',
            'Barang hilang harus memiliki jumlahKembali = 0',
            'Barang yang dikembalikan harus memiliki jumlahKembali > 0',
            'Total jumlah kembali tidak boleh melebihi jumlah yang diambil',
          ]
        }

        // Enhanced handling for quantity validation in unified format
        else if (fieldPath.includes('jumlahKembali')) {
          enhancedMessage = `Unified validation failed for ${fieldPath}: ${err.message}`
          suggestions = [
            'Untuk barang hilang: set jumlahKembali = 0 dan kondisiAkhir mengandung "Hilang"',
            'Untuk barang yang dikembalikan: set jumlahKembali ≥ 1',
            'Pastikan total jumlah kembali tidak melebihi jumlah yang diambil',
            'Gunakan unified format dengan array conditions untuk skenario kompleks',
          ]
        }

        // Enhanced handling for date validation
        else if (fieldPath.includes('tglKembali')) {
          enhancedMessage = `Date validation failed: ${err.message}`
          suggestions = [
            'Format tanggal: ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)',
            'Untuk pengembalian terlambat: gunakan tanggal masa lalu',
            'Maksimal 30 hari ke depan untuk pengembalian terjadwal',
          ]
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

      // Categorize error types for unified validation messaging
      const hasDateError = error.issues.some((issue) => issue.path.includes('tglKembali'))
      const hasConditionError = error.issues.some((issue) => issue.path.includes('conditions'))
      const hasQuantityError = error.issues.some((issue) => issue.path.includes('jumlahKembali'))

      let enhancedMessage = 'Data pengembalian tidak valid dalam unified architecture'
      let generalHints: string[] = []

      if (hasConditionError) {
        enhancedMessage = 'Validasi kondisi pengembalian gagal. Periksa format unified conditions.'
        generalHints = [
          'Gunakan array conditions untuk setiap item, bahkan untuk kasus sederhana',
          'Setiap kondisi harus memiliki kondisiAkhir (minimal 4 karakter) dan jumlahKembali yang valid',
          'Contoh kondisi valid: "baik", "kotor", "rusak ringan", "rusak berat", "hilang"',
          'Total jumlahKembali dari semua kondisi tidak boleh melebihi jumlahDiambil',
        ]
      } else if (hasQuantityError) {
        enhancedMessage =
          'Validasi jumlah pengembalian gagal. Periksa konsistensi quantity dengan kondisi.'
        generalHints = [
          'Barang hilang: jumlahKembali = 0',
          'Barang dikembalikan: jumlahKembali ≥ 1',
          'Unified format mendukung pembagian quantity per kondisi',
        ]
      } else if (hasDateError) {
        enhancedMessage =
          'Tanggal pengembalian tidak valid. Periksa format dan rentang tanggal yang diizinkan.'
        generalHints = [
          'Format tanggal: ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)',
          'Pengembalian terlambat: gunakan tanggal masa lalu',
          'Pengembalian terjadwal: maksimal 30 hari ke depan',
        ]
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            message: enhancedMessage,
            code: hasConditionError
              ? 'UNIFIED_CONDITION_VALIDATION_ERROR'
              : hasQuantityError
                ? 'UNIFIED_QUANTITY_VALIDATION_ERROR'
                : 'UNIFIED_VALIDATION_ERROR',
            details: validationDetails,
            hints: generalHints,
            architecture: 'unified',
            migrationPhase: 1,
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
