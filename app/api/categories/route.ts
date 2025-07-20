/**
 * API Route: Categories
 *
 * GET /api/categories - Mendapatkan daftar kategori
 * POST /api/categories - Membuat kategori baru
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { CategoryService } from '@/features/manage-product/services/categoryService'
import { prisma } from '@/lib/prisma'
import { categorySchema } from '@/features/manage-product/lib/validation/productSchema'
import { ConflictError } from '@/features/manage-product/lib/errors/AppError'

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const query = {
      search: searchParams.get('search') || undefined,
      includeProducts: searchParams.get('includeProducts') === 'true',
    }

    // Initialize service
    const categoryService = new CategoryService(prisma, userId)

    // Get categories
    const categories = await categoryService.getCategories(query)

    return NextResponse.json(categories, { status: 200 })
  } catch (error) {
    console.error('GET /api/categories error:', error)

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

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.color) {
      return NextResponse.json(
        { error: { message: 'Name and color are required', code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    // Validate with schema
    const validatedData = categorySchema.parse(body)

    // Initialize service
    const categoryService = new CategoryService(prisma, userId)

    // Create category
    const category = await categoryService.createCategory(validatedData)

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('POST /api/categories error:', error)

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
