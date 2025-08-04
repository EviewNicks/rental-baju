/**
 * API Route: Kasir Penyewa Management - RPK-26
 *
 * POST /api/kasir/penyewa - Create new penyewa (customer)
 * GET /api/kasir/penyewa - Get paginated list of penyewa with search
 *
 * Authentication: Clerk (admin/kasir roles only)
 * Following existing patterns from manage-product feature
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PenyewaService } from '@/features/kasir/services/penyewaService'
import {
  createPenyewaSchema,
  penyewaQuerySchema,
} from '@/features/kasir/lib/validation/kasirSchema'
import {
  formatPenyewaData,
  formatPenyewaList,
  createSuccessResponse,
  sanitizePenyewaInput,
} from '@/features/kasir/types'
import { ZodError } from 'zod'
import { requirePermission, withRateLimit } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await withRateLimit(`penyewa-create-${clientIP}`, 10, 60000)
    if (rateLimitResult.error) {
      return rateLimitResult.error
    }

    // Authentication and permission check
    const authResult = await requirePermission('penyewa', 'create')
    if (authResult.error) {
      return authResult.error
    }
    const { user } = authResult

    // Parse and validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid JSON format',
            code: 'INVALID_JSON',
          },
        },
        { status: 400 },
      )
    }

    // Sanitize input data
    const sanitizedData = sanitizePenyewaInput(body as Record<string, unknown>)

    // Remove empty optional fields to let Zod set defaults
    const processedData = Object.fromEntries(
      Object.entries(sanitizedData).filter(([key, value]) => {
        // Keep required fields even if empty (nama, telepon, alamat)
        if (['nama', 'telepon', 'alamat'].includes(key)) {
          return true
        }
        // Remove empty optional fields
        return value !== '' && value !== null && value !== undefined
      }),
    )

    // Validate request data
    const validatedData = createPenyewaSchema.parse(processedData)

    // Initialize penyewa service
    const penyewaService = new PenyewaService(prisma, user.id, user.role)

    // Create penyewa
    const penyewa = await penyewaService.createPenyewa(validatedData)

    // Format and return response
    const { response, status } = createSuccessResponse(
      formatPenyewaData(penyewa),
      'Penyewa berhasil dibuat',
      201,
    )
    return NextResponse.json(response, { status })
  } catch (error) {
    console.error('POST /api/kasir/penyewa error:', error)

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
      // Phone number uniqueness error
      if (error.message.includes('telepon sudah terdaftar')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: error.message,
              code: 'PHONE_ALREADY_EXISTS',
              field: 'telepon',
            },
          },
          { status: 409 },
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
        { status: 422 },
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

export async function GET(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await withRateLimit(`penyewa-list-${clientIP}`, 30, 60000)
    if (rateLimitResult.error) {
      return rateLimitResult.error
    }

    // Authentication and permission check
    const authResult = await requirePermission('penyewa', 'read')
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
    }

    // Validate query parameters
    const validatedQuery = penyewaQuerySchema.parse(queryParams)

    // Initialize penyewa service
    const penyewaService = new PenyewaService(prisma, user.id, user.role)

    // Get penyewa list
    const result = await penyewaService.getPenyewaList(validatedQuery)

    // Format response data
    const formattedData = {
      data: formatPenyewaList(result.data),
      pagination: result.pagination,
    }

    // Return formatted response
    const { response, status } = createSuccessResponse(
      formattedData,
      'Data penyewa berhasil diambil',
    )
    return NextResponse.json(response, { status })
  } catch (error) {
    console.error('GET /api/kasir/penyewa error:', error)

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
