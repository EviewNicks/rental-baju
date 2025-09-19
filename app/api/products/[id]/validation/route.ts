/**
 * API Route: Product Business Logic Validation
 *
 * GET /api/products/[id]/validation - Validate business logic preservation
 *   Query Parameters:
 *   - type: 'full' | 'consistency' | 'capabilities' - Type of validation (default: full)
 *   - format: 'detailed' | 'summary' - Response format (default: detailed)
 *
 * Purpose: Validate that the hybrid size management system preserves
 * all business logic capabilities for rental tracking, analytics, and inventory
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProductService } from '@/features/manage-product/services/productService'
import { ProductSizeAggregationService } from '@/features/manage-product/services/productSizeAggregationService'
import { prisma } from '@/lib/prisma'
import { productParamsSchema } from '@/features/manage-product/lib/validation/productSchema'
import { NotFoundError } from '@/features/manage-product/lib/errors/AppError'
import type {
  AggregationConsistencyResult,
  BusinessLogicValidationResult,
  BusinessCapabilitiesReport
} from '@/features/manage-product/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Validate product ID parameter
    const { id: validatedId } = productParamsSchema.parse({ id: params.id })

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const validationType = searchParams.get('type') || 'full'
    const responseFormat = searchParams.get('format') || 'detailed'

    // Initialize services
    const productService = new ProductService(prisma, userId)
    const aggregationService = new ProductSizeAggregationService(prisma)

    // Verify product exists
    const product = await productService.getProductById(validatedId)

    if (!product) {
      return NextResponse.json(
        { error: { message: 'Product not found', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    let validationResult: AggregationConsistencyResult | BusinessCapabilitiesReport | BusinessLogicValidationResult

    switch (validationType) {
      case 'consistency':
        // Only validate aggregation consistency
        validationResult = await aggregationService.validateAggregationConsistency(validatedId)
        break

      case 'capabilities':
        // Get business capabilities report
        validationResult = await productService.getBusinessCapabilitiesReport(validatedId)
        break

      case 'full':
      default:
        // Full business logic preservation validation
        validationResult = await productService.validateBusinessLogicPreservation(validatedId)
        break
    }

    // Format response based on requested format
    if (responseFormat === 'summary') {
      const summary = {
        productId: validatedId,
        productName: product.name,
        validationType,
        isHealthy: validationType === 'full' && 'overallHealth' in validationResult
          ? ['excellent', 'good'].includes(validationResult.overallHealth)
          : validationType === 'consistency' && 'isConsistent' in validationResult
          ? validationResult.isConsistent !== false
          : true,
        keyMetrics: validationType === 'full'
          ? {
              overallHealth: (validationResult as BusinessLogicValidationResult).overallHealth,
              recommendationCount: (validationResult as BusinessLogicValidationResult).recommendations?.length || 0,
              businessCapabilities: (validationResult as BusinessLogicValidationResult).rentalTracking?.businessCapabilities?.length || 0
            }
          : validationType === 'capabilities'
          ? {
              businessLevel: (validationResult as BusinessCapabilitiesReport).businessValue?.level,
              capabilityScore: (validationResult as BusinessCapabilitiesReport).businessValue?.score,
              strengthCount: (validationResult as BusinessCapabilitiesReport).businessValue?.strengths?.length || 0
            }
          : {
              isConsistent: (validationResult as AggregationConsistencyResult).isConsistent,
              errorCount: (validationResult as AggregationConsistencyResult).errors?.length || 0
            },
        timestamp: new Date().toISOString()
      }

      return NextResponse.json(summary, { status: 200 })
    }

    // Detailed response
    const response = {
      productId: validatedId,
      productName: product.name,
      validationType,
      validationResult,
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        systemInfo: {
          aggregationEnabled: true,
          businessLogicPreserved: true,
          hybridArchitecture: true
        }
      }
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Error in business logic validation API:', error)

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
          message: 'Internal server error during validation',
          code: 'VALIDATION_INTERNAL_ERROR'
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