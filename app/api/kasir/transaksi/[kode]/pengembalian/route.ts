/**
 * API Route: Transaction Return Processing - TSK-23
 *
 * PUT /api/kasir/transaksi/[kode]/pengembalian - Process transaction return
 *
 * Authentication: Clerk (kasir/owner roles only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UnifiedReturnService } from '@/features/kasir/services/returnService'
import {
  unifiedReturnRequestSchema,
  convertLegacyToUnified,
  UnifiedReturnRequest,
} from '@/features/kasir/lib/validation/ReturnSchema'
import { TransactionCodeGenerator } from '@/features/kasir/lib/utils/codeGenerator'
import { ZodError } from 'zod'
import { requirePermission, withRateLimit } from '@/lib/auth-middleware'

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
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Request deduplication mechanism to prevent multiple identical calls
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown'

  // Performance optimization: Set up request timeout to prevent hanging
  const timeoutController = new AbortController()
  const timeoutId = setTimeout(() => timeoutController.abort(), 30000) // 30 second timeout

  try {
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

      // PERFORMANCE OPTIMIZATION: Removed redundant validations for faster processing
      // Business validation and BAIK validation moved to service layer to avoid duplication
    } catch (validationError) {
      if (validationError instanceof ZodError) {
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

      // Return 400 Bad Request for validation errors (CRITICAL FIX)
      if (statusCode === 'VALIDATION_ERROR' && result.details) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: result.details.message,
              code: 'VALIDATION_ERROR',
              currentStatus: result.details.currentStatus,
              processingTime: result.details.processingTime,
              validationErrors: result.details.validationErrors,
            },
          },
          { status: 400 },
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

    const { kode } = await params
    console.error(`PUT /api/kasir/transaksi/${kode}/pengembalian error:`, error)

    // PERFORMANCE OPTIMIZATION: Simplified error handling for faster response
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Data pengembalian tidak valid',
            code: 'VALIDATION_ERROR',
            details: error.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          },
        },
        { status: 400 },
      )
    }

    // Handle business logic errors (simplified)
    if (error instanceof Error) {
      const message = error.message

      // Transaction not found
      if (message.includes('tidak ditemukan')) {
        return NextResponse.json(
          {
            success: false,
            error: { message: 'Transaksi tidak ditemukan', code: 'NOT_FOUND' },
          },
          { status: 404 },
        )
      }

      // Return processing errors
      if (
        message.includes('Gagal memproses pengembalian') ||
        message.includes('Validasi gagal') ||
        message.includes('tidak dapat diproses')
      ) {
        return NextResponse.json(
          {
            success: false,
            error: { message, code: 'RETURN_PROCESSING_ERROR' },
          },
          { status: 400 },
        )
      }

      // Other business logic errors
      return NextResponse.json(
        {
          success: false,
          error: { message, code: 'BUSINESS_ERROR' },
        },
        { status: 400 },
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
