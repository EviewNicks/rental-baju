/**
 * API Route: Individual Kasir Operations
 *
 * API untuk operasi individual pada kasir:
 * GET /api/kasir/kasir/[id] - Mendapatkan detail kasir spesifik
 * PUT /api/kasir/kasir/[id] - Update kasir (termasuk status toggle)
 * DELETE /api/kasir/kasir/[id] - Hapus kasir
 *
 * Authentication: Clerk (admin/producer roles only)
 * Business Logic: Validasi transaksi aktif sebelum deactivation
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { KasirService } from '@/features/kasir/services/kasirService'
import { updateKasirSchema } from '@/features/kasir/lib/validation/kasirSchema'
import { createSuccessResponse, createErrorResponse } from '@/features/kasir/types'
import { ZodError } from 'zod'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET - Mendapatkan detail kasir spesifik
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      const { response, status } = createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401)
      return NextResponse.json(response, { status })
    }

    const { id } = await params

    // Get kasir details
    const kasirService = new KasirService(prisma, userId, 'admin')
    const kasir = await kasirService.getKasirById(id)

    if (!kasir) {
      const { response, status } = createErrorResponse('Kasir tidak ditemukan', 'NOT_FOUND', 404)
      return NextResponse.json(response, { status })
    }

    const { response, status } = createSuccessResponse(kasir, 'Kasir berhasil ditemukan')
    return NextResponse.json(response, { status })
  } catch (error) {
    console.error('Error getting kasir:', error)

    if (error instanceof ZodError) {
      const { response, status } = createErrorResponse(
        'Invalid request data',
        'INVALID_REQUEST',
        400,
      )
      return NextResponse.json(response, { status })
    }

    const { response, status } = createErrorResponse(
      error instanceof Error ? error.message : 'Terjadi kesalahan',
      'INTERNAL_ERROR',
      500,
    )
    return NextResponse.json(response, { status })
  }
}

/**
 * PUT - Update kasir (nama dan/atau status)
 * Support untuk status-only update dan full update
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      const { response, status } = createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401)
      return NextResponse.json(response, { status })
    }

    const { id } = await params
    const body = await request.json()

    // Validate request body
    const validatedData = updateKasirSchema.parse(body)

    // Initialize service
    const kasirService = new KasirService(prisma, userId, 'admin')

    // Business logic validation untuk status changes
    if (validatedData.isActive === false) {
      await kasirService.validateNoActiveTransactions(id)
    }

    // Update kasir
    const updatedKasir = await kasirService.updateKasir(id, validatedData)

    const { response, status } = createSuccessResponse(
      updatedKasir,
      `Kasir ${validatedData.nama ? updatedKasir.nama : ''} berhasil diperbarui`,
    )
    return NextResponse.json(response, { status })
  } catch (error) {
    console.error('Error updating kasir:', error)

    if (error instanceof ZodError) {
      const { response, status } = createErrorResponse(
        'Invalid request data',
        'INVALID_REQUEST',
        400,
      )
      return NextResponse.json(response, { status })
    }

    const { response, status } = createErrorResponse(
      error instanceof Error ? error.message : 'Terjadi kesalahan',
      'INTERNAL_ERROR',
      500,
    )
    return NextResponse.json(response, { status })
  }
}

/**
 * DELETE - Hapus kasir (soft delete dengan cascade protection)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      const { response, status } = createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401)
      return NextResponse.json(response, { status })
    }

    const { id } = await params

    // Initialize service
    const kasirService = new KasirService(prisma, userId, 'admin')

    // Validate kasir exists and can be deleted
    await kasirService.getKasirById(id)
    await kasirService.validateNoActiveTransactions(id)

    // Delete kasir
    await kasirService.deleteKasir(id)

    const { response, status } = createSuccessResponse(null, 'Kasir berhasil dihapus')
    return NextResponse.json(response, { status })
  } catch (error) {
    console.error('Error deleting kasir:', error)

    if (error instanceof ZodError) {
      const { response, status } = createErrorResponse(
        'Invalid request data',
        'INVALID_REQUEST',
        400,
      )
      return NextResponse.json(response, { status })
    }

    const { response, status } = createErrorResponse(
      error instanceof Error ? error.message : 'Terjadi kesalahan',
      'INTERNAL_ERROR',
      500,
    )
    return NextResponse.json(response, { status })
  }
}
