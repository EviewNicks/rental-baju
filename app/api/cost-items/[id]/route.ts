/**
 * API Route: Cost Item by ID
 * 
 * GET /api/cost-items/[id] - Get cost item by ID
 * PUT /api/cost-items/[id] - Update cost item by ID  
 * DELETE /api/cost-items/[id] - Delete cost item by ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { CostItemService } from '@/features/manage-product/services/costItemService'
import { prisma } from '@/lib/prisma'
import { ConflictError, NotFoundError } from '@/features/manage-product/lib/errors/AppError'

interface RouteParams {
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

    const { id } = await params

    // Initialize service
    const costItemService = new CostItemService(prisma, userId)

    // Get cost item by ID
    const costItem = await costItemService.getCostItemById(id)

    return NextResponse.json(costItem, { status: 200 })
  } catch (error) {
    console.error(`GET /api/cost-items/${(await params).id} error:`, error)

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

    const { id } = await params

    // Parse JSON request body
    const body = await request.json()

    // Initialize service
    const costItemService = new CostItemService(prisma, userId)

    // Update cost item (validation handled by service)
    const costItem = await costItemService.updateCostItem(id, body)

    return NextResponse.json(costItem, { status: 200 })
  } catch (error) {
    console.error(`PUT /api/cost-items/${(await params).id} error:`, error)

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

    const { id } = await params

    // Initialize service
    const costItemService = new CostItemService(prisma, userId)

    // Delete cost item
    const result = await costItemService.deleteCostItem(id)

    return NextResponse.json(
      { 
        message: 'Cost item berhasil dihapus',
        success: result 
      }, 
      { status: 200 }
    )
  } catch (error) {
    console.error(`DELETE /api/cost-items/${(await params).id} error:`, error)

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