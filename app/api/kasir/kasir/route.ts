/**
 * API Route: Kasir Management - Kasir Management System
 *
 * POST /api/kasir/kasir - Create new kasir (cashier)
 * GET /api/kasir/kasir - Get paginated list of kasir with search and filters
 *
 * Authentication: Clerk (admin/producer roles only)
 * Following existing patterns from Penyewa API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { KasirService } from '@/features/kasir/services/kasirService'
import {
  createKasirSchema,
  kasirQuerySchema,
} from '@/features/kasir/lib/validation/kasirSchema'
import {
  createSuccessResponse,
  createErrorResponse,
} from '@/features/kasir/types'
import { ZodError } from 'zod'
import { requirePermission, withRateLimit } from '@/lib/auth-middleware'

// Helper function to format kasir data for API response
function formatKasirData(kasir: {
  id: string
  nama: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy?: string | null
}) {
  return {
    id: kasir.id,
    nama: kasir.nama,
    isActive: kasir.isActive,
    createdAt: kasir.createdAt.toISOString(),
    updatedAt: kasir.updatedAt.toISOString(),
    createdBy: kasir.createdBy,
  }
}

// Helper function to format kasir list
function formatKasirList(kasirList: Array<{
  id: string
  nama: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy?: string | null
}>) {
  return kasirList.map(formatKasirData)
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await withRateLimit(`kasir-create-${clientIP}`, 10, 60000)
    if (rateLimitResult.error) {
      return rateLimitResult.error
    }

    // Authentication and permission check
    const authResult = await requirePermission('kasir', 'create')
    if (authResult.error) {
      return authResult.error
    }
    const { user } = authResult

    // Parse and validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      const { response, status } = createErrorResponse(
        'Invalid JSON format',
        'INVALID_JSON',
        400
      )
      return NextResponse.json(response, { status })
    }

    // Remove empty optional fields to let Zod set defaults
    const processedData = Object.fromEntries(
      Object.entries(body as Record<string, unknown>).filter(([key, value]) => {
        // Keep required field even if empty (nama)
        if (['nama'].includes(key)) {
          return true
        }
        // Remove empty optional fields
        return value !== '' && value !== null && value !== undefined
      }),
    )

    // Validate request data
    const validatedData = createKasirSchema.parse(processedData)

    // Initialize kasir service
    const kasirService = new KasirService(prisma, user.id, user.role)

    // Create kasir
    const kasir = await kasirService.createKasir(validatedData)

    // Format and return response
    const { response, status } = createSuccessResponse(
      formatKasirData(kasir),
      'Kasir berhasil dibuat',
      201,
    )
    return NextResponse.json(response, { status })
  } catch (error) {
    console.error('POST /api/kasir/kasir error:', error)

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
              message: err.message,
            })),
          },
        },
        { status: 400 },
      )
    }

    // Handle business logic errors
    if (error instanceof Error) {
      // Other business logic errors
      const { response, status } = createErrorResponse(
        error.message,
        'BUSINESS_ERROR',
        422
      )
      return NextResponse.json(response, { status })
    }

    // Handle database connection errors
    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string' &&
      error.message.includes('connection pool')
    ) {
      const { response, status } = createErrorResponse(
        'Database connection timeout. Please try again.',
        'CONNECTION_ERROR',
        503
      )
      return NextResponse.json(response, { status })
    }

    // Generic server error
    const { response, status } = createErrorResponse(
      'Internal server error',
      'INTERNAL_ERROR',
      500
    )
    return NextResponse.json(response, { status })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await withRateLimit(`kasir-list-${clientIP}`, 30, 60000)
    if (rateLimitResult.error) {
      return rateLimitResult.error
    }

    // Authentication and permission check
    const authResult = await requirePermission('kasir', 'read')
    if (authResult.error) {
      return authResult.error
    }
    const { user } = authResult

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      search: searchParams.get('search') || undefined,
      isActive: searchParams.get('isActive') || undefined,
    }

    // Validate query parameters
    const validatedQuery = kasirQuerySchema.parse(queryParams)

    // Initialize kasir service
    const kasirService = new KasirService(prisma, user.id, user.role)

    // Get kasir list
    const result = await kasirService.getKasirList(validatedQuery)

    // Format response data
    const formattedData = {
      data: formatKasirList(result.data),
      pagination: result.pagination,
      summary: result.summary,
    }

    // Return formatted response
    const { response, status } = createSuccessResponse(
      formattedData,
      'Data kasir berhasil diambil',
    )
    return NextResponse.json(response, { status })
  } catch (error) {
    console.error('GET /api/kasir/kasir error:', error)

    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Parameter query tidak valid',
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

    // Handle database connection errors
    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string' &&
      error.message.includes('connection pool')
    ) {
      const { response, status } = createErrorResponse(
        'Database connection timeout. Please try again.',
        'CONNECTION_ERROR',
        503
      )
      return NextResponse.json(response, { status })
    }

    // Generic server error
    const { response, status } = createErrorResponse(
      'Internal server error',
      'INTERNAL_ERROR',
      500
    )
    return NextResponse.json(response, { status })
  }
}