/**
 * API Route: Individual Color
 *
 * GET /api/colors/[id] - Mendapatkan detail warna berdasarkan ID
 * PUT /api/colors/[id] - Update warna berdasarkan ID
 * DELETE /api/colors/[id] - Soft delete warna berdasarkan ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ColorService } from '@/features/manage-product/services/colorService'
import { prisma } from '@/lib/prisma'
import { updateColorSchema } from '@/features/manage-product/lib/validation/productSchema'
import { NotFoundError, ConflictError } from '@/features/manage-product/lib/errors/AppError'

type RouteParams = {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
    }

    // Await params
    const { id } = await params

    // Initialize service
    const colorService = new ColorService(prisma, userId)

    // Get color by ID
    const color = await colorService.getColorById(id)

    return NextResponse.json(color, { status: 200 })
  } catch (error) {
    console.error('GET /api/colors/[id] error:', error)

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: { message: error.message, code: 'NOT_FOUND' } },
        { status: 404 },
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: { message: error.message, code: 'INTERNAL_ERROR' } },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
    }

    // Await params
    const { id } = await params

    // Parse request body
    const body = await request.json()

    // Validate with schema
    const validatedData = updateColorSchema.parse(body)

    // Initialize service
    const colorService = new ColorService(prisma, userId)

    // Update color
    const updatedColor = await colorService.updateColor(id, validatedData)

    return NextResponse.json(updatedColor, { status: 200 })
  } catch (error) {
    console.error('PUT /api/colors/[id] error:', error)

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: { message: error.message, code: 'NOT_FOUND' } },
        { status: 404 },
      )
    }

    if (error instanceof ConflictError) {
      return NextResponse.json(
        { error: { message: error.message, code: 'CONFLICT' } },
        { status: 409 },
      )
    }

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: { message: error.message, code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
    }

    // Await params
    const { id } = await params

    // Initialize service
    const colorService = new ColorService(prisma, userId)

    // Delete color (soft delete)
    const deleted = await colorService.deleteColor(id)

    return NextResponse.json(
      { message: 'Warna berhasil dihapus', success: deleted },
      { status: 200 },
    )
  } catch (error) {
    console.error('DELETE /api/colors/[id] error:', error)

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: { message: error.message, code: 'NOT_FOUND' } },
        { status: 404 },
      )
    }

    if (error instanceof ConflictError) {
      return NextResponse.json(
        { error: { message: error.message, code: 'CONFLICT' } },
        { status: 409 },
      )
    }

    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    )
  }
}