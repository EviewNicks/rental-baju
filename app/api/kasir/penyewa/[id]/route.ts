/**
 * API Route: Individual Penyewa Management - RPK-26
 *
 * GET /api/kasir/penyewa/[id] - Get penyewa by ID with transactions
 * PUT /api/kasir/penyewa/[id] - Update penyewa data
 *
 * Authentication: Clerk (admin/kasir roles only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PenyewaService } from '@/features/kasir/services/penyewaService'
import { updatePenyewaSchema } from '@/features/kasir/lib/validation/kasirSchema'
import { formatPenyewaData, createSuccessResponse, sanitizePenyewaInput } from '@/features/kasir/types'
import { ZodError } from 'zod'
import { requirePermission, withRateLimit } from '@/lib/auth-middleware'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await withRateLimit(`penyewa-get-${clientIP}`, 100, 60000)
    if (rateLimitResult.error) {
      return rateLimitResult.error
    }

    // Authentication and permission check
    const authResult = await requirePermission('penyewa', 'read')
    if (authResult.error) {
      return authResult.error
    }
    const { user } = authResult

    // Extract params (Next.js 15 compatibility)
    const { id } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Format ID tidak valid',
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 },
      )
    }

    // Initialize penyewa service
    const penyewaService = new PenyewaService(prisma, user.id, user.role)

    // Get penyewa by ID
    const penyewa = await penyewaService.getPenyewaById(id)

    // Format and return response
    const { response, status } = createSuccessResponse(
      formatPenyewaData(penyewa),
      'Data penyewa berhasil diambil',
    )
    return NextResponse.json(response, { status })
  } catch (error) {
    // Safe error logging without accessing params directly
    console.error('GET /api/kasir/penyewa/[id] error:', error)

    // Handle not found errors
    if (error instanceof Error && error.message.includes('tidak ditemukan')) {
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

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await withRateLimit(`penyewa-update-${clientIP}`, 20, 60000)
    if (rateLimitResult.error) {
      return rateLimitResult.error
    }

    // Authentication and permission check
    const authResult = await requirePermission('penyewa', 'update')
    if (authResult.error) {
      return authResult.error
    }
    const { user } = authResult

    // Extract params (Next.js 15 compatibility)
    const { id } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Format ID tidak valid',
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 },
      )
    }

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

    // Remove empty optional fields to let Zod handle defaults
    const processedData = Object.fromEntries(
      Object.entries(sanitizedData).filter(([value]) => {
        // Remove empty values to let Zod handle defaults
        return value !== '' && value !== null && value !== undefined
      }),
    )

    // Validate request data
    const validatedData = updatePenyewaSchema.parse(processedData)

    // Check if there's actually data to update
    if (Object.keys(validatedData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Tidak ada data untuk diperbarui',
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 },
      )
    }

    // Initialize penyewa service
    const penyewaService = new PenyewaService(prisma, user.id, user.role)

    // Update penyewa
    const updatedPenyewa = await penyewaService.updatePenyewa(id, validatedData)

    // Format and return response
    const { response, status } = createSuccessResponse(
      formatPenyewaData(updatedPenyewa),
      'Data penyewa berhasil diperbarui',
    )
    return NextResponse.json(response, { status })
  } catch (error) {
    // Safe error logging without accessing params directly
    console.error('PUT /api/kasir/penyewa/[id] error:', error)

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
      // Not found error
      if (error.message.includes('tidak ditemukan')) {
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
