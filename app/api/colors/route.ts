/**
 * API Route: Colors
 *
 * GET /api/colors - Mendapatkan daftar warna dengan search dan filter
 * POST /api/colors - Membuat warna baru
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ColorService } from '@/features/manage-product/services/colorService'
import { prisma } from '@/lib/prisma'
import { colorSchema } from '@/features/manage-product/lib/validation/productSchema'
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
      isActive: searchParams.get('isActive') !== 'false', // default true
      includeProducts: searchParams.get('includeProducts') === 'true',
    }

    // Initialize service
    const colorService = new ColorService(prisma, userId)

    // Get colors
    const colors = await colorService.getColors(query)

    // Return with consistent API format structure
    return NextResponse.json({ colors }, { status: 200 })
  } catch (error) {
    console.error('GET /api/colors error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: { message: error.message, code: 'INTERNAL_ERROR' } },
        { status: 500 },
      )
    }

    // Handle Prisma connection errors
    if (error instanceof Error && error.message.includes('connection pool')) {
      return NextResponse.json(
        {
          error: {
            message: 'Database connection timeout. Please try again.',
            code: 'CONNECTION_ERROR',
          },
        },
        { status: 503 },
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
    if (!body.name) {
      return NextResponse.json(
        { error: { message: 'Name is required', code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    // Validate with schema
    const validatedData = colorSchema.parse(body)

    // Initialize service
    const colorService = new ColorService(prisma, userId)

    // Create color
    const color = await colorService.createColor(validatedData)

    return NextResponse.json(color, { status: 201 })
  } catch (error) {
    console.error('POST /api/colors error:', error)

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

    // Handle Prisma connection errors
    if (error instanceof Error && error.message.includes('connection pool')) {
      return NextResponse.json(
        {
          error: {
            message: 'Database connection timeout. Please try again.',
            code: 'CONNECTION_ERROR',
          },
        },
        { status: 503 },
      )
    }

    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    )
  }
}