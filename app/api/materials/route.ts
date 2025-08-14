/**
 * API Route: Materials
 * 
 * GET /api/materials - Mendapatkan daftar materials dengan pagination dan filter
 * POST /api/materials - Membuat material baru
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { MaterialService } from '@/features/manage-product/services/materialService'
import { prisma } from '@/lib/prisma'
import { ConflictError, NotFoundError } from '@/features/manage-product/lib/errors/AppError'

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

    // Get query parameters (ultra-simplified - no isActive filtering)
    const { searchParams } = new URL(request.url)
    const query = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      search: searchParams.get('search') || undefined,
      unit: searchParams.getAll('unit').length > 0 ? searchParams.getAll('unit') : undefined,
    }

    // Initialize service
    const materialService = new MaterialService(prisma, userId)

    // Get materials
    const result = await materialService.getMaterials(query)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('GET /api/materials error:', error)

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

    // Parse JSON request body
    const body = await request.json()

    // Extract fields
    const { name, pricePerUnit, unit } = body

    // Basic validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: { message: 'Nama material wajib diisi', code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    if (!pricePerUnit || typeof pricePerUnit !== 'number' || pricePerUnit <= 0) {
      return NextResponse.json(
        { error: { message: 'Harga per unit harus berupa angka positif', code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    if (!unit || typeof unit !== 'string' || unit.trim() === '') {
      return NextResponse.json(
        { error: { message: 'Satuan material wajib diisi', code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    // Prepare create request
    const createRequest = {
      name: name.trim(),
      pricePerUnit,
      unit: unit.trim(),
    }

    // Initialize service
    const materialService = new MaterialService(prisma, userId)

    // Create material
    const material = await materialService.createMaterial(createRequest)

    return NextResponse.json(material, { status: 201 })
  } catch (error) {
    console.error('POST /api/materials error:', error)

    // Handle known errors
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