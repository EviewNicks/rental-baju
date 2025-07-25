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
  penyewaQuerySchema 
} from '@/features/kasir/lib/validation/kasirSchema'
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

    // Parse request body
    const body = await request.json()

    // Validate request data
    const validatedData = createPenyewaSchema.parse(body)

    // Initialize penyewa service
    const penyewaService = new PenyewaService(prisma, user.id, user.role)

    // Create penyewa
    const penyewa = await penyewaService.createPenyewa(validatedData)

    return NextResponse.json(
      {
        success: true,
        data: {
          id: penyewa.id,
          nama: penyewa.nama,
          telepon: penyewa.telepon,
          alamat: penyewa.alamat,
          email: penyewa.email,
          nik: penyewa.nik,
          foto: penyewa.foto,
          catatan: penyewa.catatan,
          createdAt: penyewa.createdAt.toISOString(),
          updatedAt: penyewa.updatedAt.toISOString()
        },
        message: 'Penyewa berhasil dibuat'
      },
      { status: 201 }
    )
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
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          }
        },
        { status: 400 }
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
              code: 'CONFLICT'
            }
          },
          { status: 409 }
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
      search: searchParams.get('search') || undefined
    }

    // Validate query parameters
    const validatedQuery = penyewaQuerySchema.parse(queryParams)

    // Initialize penyewa service
    const penyewaService = new PenyewaService(prisma, user.id, user.role)

    // Get penyewa list
    const result = await penyewaService.getPenyewaList(validatedQuery)

    // Format response data
    const formattedData = {
      data: result.data.map(penyewa => ({
        id: penyewa.id,
        nama: penyewa.nama,
        telepon: penyewa.telepon,
        alamat: penyewa.alamat,
        email: penyewa.email,
        nik: penyewa.nik,
        foto: penyewa.foto,
        catatan: penyewa.catatan,
        createdAt: penyewa.createdAt.toISOString(),
        updatedAt: penyewa.updatedAt.toISOString()
      })),
      pagination: result.pagination
    }

    return NextResponse.json(
      {
        success: true,
        data: formattedData,
        message: 'Data penyewa berhasil diambil'
      },
      { status: 200 }
    )
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
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
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