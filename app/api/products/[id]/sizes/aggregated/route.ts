/**
 * API Route: Advanced Products Aggregated Sizes
 *
 * GET /api/products/[id]/sizes/aggregated - Get advanced aggregated size data for a product
 *
 * Purpose: Provide advanced-only aggregated size views for UI consumption with enhanced
 * business intelligence and performance monitoring. Uses advanced size management system.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProductSizeAggregationService } from '@/features/manage-product/services/productSizeAggregationService'
import { prisma } from '@/lib/prisma'
import { productParamsSchema } from '@/features/manage-product/lib/validation/productSchema'
import { NotFoundError } from '@/features/manage-product/lib/errors/AppError'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    const { id } = await params

    // Validate product ID parameter
    const { id: validatedId } = productParamsSchema.parse({ id })

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      includeBreakdown: searchParams.get('includeBreakdown') !== 'false', // Default true
      includeRentalTracking: searchParams.get('includeRentalTracking') !== 'false', // Default true
      forceRefresh: searchParams.get('forceRefresh') === 'true',           // Default false
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: validatedId },
      select: { id: true, name: true, isActive: true },
    })

    if (!product) {
      return NextResponse.json(
        { error: { message: 'Product not found', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    if (!product.isActive) {
      return NextResponse.json(
        { error: { message: 'Product is not active', code: 'PRODUCT_INACTIVE' } },
        { status: 400 }
      )
    }

    // Initialize aggregation service
    const aggregationService = new ProductSizeAggregationService(prisma, {
      enableCaching: !queryParams.forceRefresh,
      includeBreakdown: queryParams.includeBreakdown,
    }, {
      enableCaching: !queryParams.forceRefresh,
      includeBreakdown: queryParams.includeBreakdown,
      includeRentalTracking: queryParams.includeRentalTracking,
      performanceThresholdMs: 50,
      maxCacheSize: 1000,
    })

    // Get advanced aggregated sizes
    const aggregationResponse = await aggregationService.getAdvancedAggregatedSizes(
      validatedId,
      {
        includeBreakdown: queryParams.includeBreakdown,
        includeRentalTracking: queryParams.includeRentalTracking,
        forceRefresh: queryParams.forceRefresh,
      }
    )

    // Prepare response based on query parameters
    const response = {
      productId: validatedId,
      productName: product.name,
      aggregatedSizes: aggregationResponse.data,
      metadata: aggregationResponse.metadata,
    }

    // Set cache headers for performance
    const cacheMaxAge = queryParams.forceRefresh ? 0 : 300 // 5 minutes
    const headers = {
      'Cache-Control': `public, max-age=${cacheMaxAge}, stale-while-revalidate=60`,
    }

    return NextResponse.json(response, {
      status: 200,
      headers,
    })

  } catch (error) {
    console.error('Error in aggregated sizes API:', error)

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: { message: error.message, code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: {
            message: 'Invalid product ID format',
            code: 'VALIDATION_ERROR',
            details: error.message,
          }
        },
        { status: 400 }
      )
    }

    // Generic error response
    return NextResponse.json(
      {
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR'
        }
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS method for CORS support
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}