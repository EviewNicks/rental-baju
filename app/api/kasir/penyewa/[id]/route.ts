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
import { ZodError } from 'zod'
import { requirePermission, withRateLimit } from '@/lib/auth-middleware'

interface RouteParams {
  params: {
    id: string
  }
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

    const { id } = params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Format ID tidak valid',
            code: 'VALIDATION_ERROR'
          }
        },
        { status: 400 }
      )
    }

    // Initialize penyewa service
    const penyewaService = new PenyewaService(prisma, user.id, user.role)

    // Get penyewa by ID
    const penyewa = await penyewaService.getPenyewaById(id)

    // Format response data
    const formattedData = {
      id: penyewa.id,
      nama: penyewa.nama,
      telepon: penyewa.telepon,
      alamat: penyewa.alamat,
      email: penyewa.email,
      nik: penyewa.nik,
      foto: penyewa.foto,
      catatan: penyewa.catatan,
      createdAt: penyewa.createdAt.toISOString(),
      updatedAt: penyewa.updatedAt.toISOString(),
      recentTransactions: penyewa.transaksi?.map(t => ({
        id: t.id,
        kode: t.kode,
        status: t.status,
        totalHarga: Number(t.totalHarga),
        createdAt: t.createdAt.toISOString()
      })) || []
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
    console.error(`GET /api/kasir/penyewa/${params.id} error:`, error)

    // Handle not found errors
    if (error instanceof Error && error.message.includes('tidak ditemukan')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: 'NOT_FOUND'
          }
        },
        { status: 404 }
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

    const { id } = params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Format ID tidak valid',
            code: 'VALIDATION_ERROR'
          }
        },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate request data
    const validatedData = updatePenyewaSchema.parse(body)

    // Check if there's actually data to update
    if (Object.keys(validatedData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Tidak ada data untuk diperbarui',
            code: 'VALIDATION_ERROR'
          }
        },
        { status: 400 }
      )
    }

    // Initialize penyewa service
    const penyewaService = new PenyewaService(prisma, user.id, user.role)

    // Update penyewa
    const updatedPenyewa = await penyewaService.updatePenyewa(id, validatedData)

    // Format response data
    const formattedData = {
      id: updatedPenyewa.id,
      nama: updatedPenyewa.nama,
      telepon: updatedPenyewa.telepon,
      alamat: updatedPenyewa.alamat,
      email: updatedPenyewa.email,
      nik: updatedPenyewa.nik,
      foto: updatedPenyewa.foto,
      catatan: updatedPenyewa.catatan,
      createdAt: updatedPenyewa.createdAt.toISOString(),
      updatedAt: updatedPenyewa.updatedAt.toISOString()
    }

    return NextResponse.json(
      {
        success: true,
        data: formattedData,
        message: 'Data penyewa berhasil diperbarui'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(`PUT /api/kasir/penyewa/${params.id} error:`, error)

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
      // Not found error
      if (error.message.includes('tidak ditemukan')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: error.message,
              code: 'NOT_FOUND'
            }
          },
          { status: 404 }
        )
      }

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