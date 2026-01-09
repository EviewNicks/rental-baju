/**
 * API Route: Cost Items
 * 
 * GET /api/cost-items - Get list of cost items with pagination and search
 * POST /api/cost-items - Create new cost item
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { CostItemService } from '@/features/manage-product/services/costItemService'
import { costItemQuerySchema } from '@/features/manage-product/lib/validation/costItemSchema'
import { prisma } from '@/lib/prisma'
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
    const rawQuery = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      search: searchParams.get('search') || undefined,
    }

    // Validate and parse query parameters
    const query = costItemQuerySchema.parse(rawQuery)

    // Initialize service
    const costItemService = new CostItemService(prisma, userId)

    // Get cost items
    const result = await costItemService.getCostItems(query)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('GET /api/cost-items error:', error)

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

    // Initialize service
    const costItemService = new CostItemService(prisma, userId)

    // Create cost item (validation handled by service)
    const costItem = await costItemService.createCostItem(body)

    return NextResponse.json(costItem, { status: 201 })
  } catch (error) {
    console.error('POST /api/cost-items error:', error)

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