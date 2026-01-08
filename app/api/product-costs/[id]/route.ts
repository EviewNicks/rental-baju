/**
 * API Route: Product Cost by ID
 * 
 * PUT /api/product-costs/[id] - Update product cost by ID
 * DELETE /api/product-costs/[id] - Remove product cost by ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProductCostService } from '@/features/manage-product/services/productCostService'
import { prisma } from '@/lib/prisma'
import { NotFoundError } from '@/features/manage-product/lib/errors/AppError'

interface RouteParams {
  params: Promise<{
    id: string
  }>
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
    const productCostService = new ProductCostService(prisma, userId)

    // Update product cost (validation handled by service)
    const productCost = await productCostService.updateProductCost(id, body)

    return NextResponse.json(productCost, { status: 200 })
  } catch (error) {
    console.error(`PUT /api/product-costs/${(await params).id} error:`, error)

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
    const productCostService = new ProductCostService(prisma, userId)

    // Remove product cost
    const result = await productCostService.removeProductCost(id)

    return NextResponse.json(
      { 
        message: 'Product cost berhasil dihapus',
        success: result 
      }, 
      { status: 200 }
    )
  } catch (error) {
    console.error(`DELETE /api/product-costs/${(await params).id} error:`, error)

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