/**
 * API Route: Product Costs
 * 
 * GET /api/products/[id]/costs - Get product costs for a specific product
 * POST /api/products/[id]/costs - Add cost item to product
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProductCostService } from '@/features/manage-product/services/productCostService'
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

    const { id: productId } = await params

    // Initialize service
    const productCostService = new ProductCostService(prisma, userId)

    // Get product costs
    const costs = await productCostService.getProductCosts(productId)

    return NextResponse.json({ costs }, { status: 200 })
  } catch (error) {
    console.error(`GET /api/products/${(await params).id}/costs error:`, error)

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

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
    }

    const { id: productId } = await params

    // Parse JSON request body
    const body = await request.json()

    // Initialize service
    const productCostService = new ProductCostService(prisma, userId)

    // Add cost to product (validation handled by service)
    const productCost = await productCostService.addProductCost(productId, body)

    return NextResponse.json(productCost, { status: 201 })
  } catch (error) {
    console.error(`POST /api/products/${(await params).id}/costs error:`, error)

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