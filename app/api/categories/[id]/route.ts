/**
 * API Route: Category by ID
 *
 * GET /api/categories/[id] - Mendapatkan detail kategori berdasarkan ID
 * PUT /api/categories/[id] - Mengupdate kategori berdasarkan ID
 * DELETE /api/categories/[id] - Menghapus kategori berdasarkan ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { CategoryService } from '@/features/manage-product/services/categoryService'
import { prisma } from '@/lib/prisma'
import { updateCategorySchema } from '@/features/manage-product/lib/validation/productSchema'
import { ConflictError, NotFoundError } from '@/features/manage-product/lib/errors/AppError'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
    }

    const { id } = await params

    // Initialize service
    const categoryService = new CategoryService(prisma, userId)

    // Get category by ID
    const category = await categoryService.getCategoryById(id)

    return NextResponse.json(category, { status: 200 })
  } catch (error) {
    console.error('GET /api/categories/[id] error:', error)

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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
    }

    const { id } = await params

    // Parse request body
    const body = await request.json()

    // Prepare update data
    const updateData: Record<string, unknown> = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.color !== undefined) updateData.color = body.color

    // Validate with schema if there's data to update
    if (Object.keys(updateData).length > 0) {
      updateCategorySchema.parse(updateData)
    }

    // Initialize service
    const categoryService = new CategoryService(prisma, userId)

    // Update category
    const category = await categoryService.updateCategory(id, updateData)

    return NextResponse.json(category, { status: 200 })
  } catch (error) {
    console.error('PUT /api/categories/[id] error:', error)

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
    }

    const { id } = await params

    // Initialize service
    const categoryService = new CategoryService(prisma, userId)

    // Delete category
    await categoryService.deleteCategory(id)

    return NextResponse.json(
      { success: true, message: 'Category deleted successfully' },
      { status: 200 },
    )
  } catch (error) {
    console.error('DELETE /api/categories/[id] error:', error)

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
