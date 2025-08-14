/**
 * API Route: Material by ID
 * 
 * GET /api/materials/[id] - Mendapatkan material berdasarkan ID
 * PUT /api/materials/[id] - Update material berdasarkan ID  
 * DELETE /api/materials/[id] - Soft delete material berdasarkan ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { MaterialService } from '@/features/manage-product/services/materialService'
import { prisma } from '@/lib/prisma'
import { ConflictError, NotFoundError } from '@/features/manage-product/lib/errors/AppError'

interface RouteParams {
  params: {
    id: string
  }
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

    const { id } = params

    // Initialize service
    const materialService = new MaterialService(prisma, userId)

    // Get material by ID
    const material = await materialService.getMaterialById(id)

    return NextResponse.json(material, { status: 200 })
  } catch (error) {
    console.error(`GET /api/materials/${params.id} error:`, error)

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: { message: error.message, code: 'NOT_FOUND' } },
        { status: 404 },
      )
    }

    if (error instanceof Error) {
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

    const { id } = params

    // Parse JSON request body
    const body = await request.json()

    // Extract fields (all optional for update)
    const { name, pricePerUnit, unit, isActive } = body

    // Prepare update request
    const updateRequest: Record<string, unknown> = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json(
          { error: { message: 'Nama material harus berupa string yang tidak kosong', code: 'VALIDATION_ERROR' } },
          { status: 400 },
        )
      }
      updateRequest.name = name.trim()
    }

    if (pricePerUnit !== undefined) {
      if (typeof pricePerUnit !== 'number' || pricePerUnit <= 0) {
        return NextResponse.json(
          { error: { message: 'Harga per unit harus berupa angka positif', code: 'VALIDATION_ERROR' } },
          { status: 400 },
        )
      }
      updateRequest.pricePerUnit = pricePerUnit
    }

    if (unit !== undefined) {
      if (typeof unit !== 'string' || unit.trim() === '') {
        return NextResponse.json(
          { error: { message: 'Satuan material harus berupa string yang tidak kosong', code: 'VALIDATION_ERROR' } },
          { status: 400 },
        )
      }
      updateRequest.unit = unit.trim()
    }

    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return NextResponse.json(
          { error: { message: 'Status aktif harus berupa boolean', code: 'VALIDATION_ERROR' } },
          { status: 400 },
        )
      }
      updateRequest.isActive = isActive
    }

    // Check if there are fields to update
    if (Object.keys(updateRequest).length === 0) {
      return NextResponse.json(
        { error: { message: 'Tidak ada field yang diupdate', code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    // Initialize service
    const materialService = new MaterialService(prisma, userId)

    // Update material
    const material = await materialService.updateMaterial(id, updateRequest)

    return NextResponse.json(material, { status: 200 })
  } catch (error) {
    console.error(`PUT /api/materials/${params.id} error:`, error)

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

    if (error instanceof Error) {
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

    const { id } = params

    // Initialize service
    const materialService = new MaterialService(prisma, userId)

    // Delete material (soft delete)
    const result = await materialService.deleteMaterial(id)

    return NextResponse.json(
      { 
        message: 'Material berhasil dihapus',
        success: result 
      }, 
      { status: 200 }
    )
  } catch (error) {
    console.error(`DELETE /api/materials/${params.id} error:`, error)

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

    if (error instanceof Error) {
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