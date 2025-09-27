/**
 * API Route: Advanced Product Business Logic Validation
 *
 * GET /api/products/[id]/validation - Validate advanced-only business logic
 *   Query Parameters:
 *   - type: 'full' | 'consistency' | 'capabilities' - Type of validation (default: full)
 *   - format: 'detailed' | 'summary' - Response format (default: detailed)
 *
 * Purpose: Validate that the advanced size management system maintains
 * all business logic capabilities for rental tracking, analytics, and inventory
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { AdvancedProductService } from '@/features/manage-product/services/advancedProductService'
import { prisma } from '@/lib/prisma'
import { advancedProductParamsSchema } from '@/features/manage-product/lib/validation/advancedProductSchema'
import { NotFoundError } from '@/features/manage-product/lib/errors/AppError'
import type {
  AdvancedBusinessValidationResult,
  AdvancedProductCapabilities,
} from '@/features/manage-product/types/advanced'

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

    // Validate product ID parameter
    const { id: validatedId } = advancedProductParamsSchema.parse({ id })

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const validationType = searchParams.get('type') || 'full'
    const responseFormat = searchParams.get('format') || 'detailed'

    // Initialize advanced services
    const productService = new AdvancedProductService(prisma, userId)

    // Verify product exists
    const product = await productService.getProductAdvanced(validatedId)

    if (!product) {
      return NextResponse.json(
        { error: { message: 'Product not found', code: 'NOT_FOUND' } },
        { status: 404 },
      )
    }

    let validationResult: AdvancedBusinessValidationResult | AdvancedProductCapabilities

    switch (validationType) {
      case 'consistency':
        // Validate advanced business logic consistency
        validationResult = await productService.validateAdvancedBusinessLogic(validatedId)
        break

      case 'capabilities':
        // Get advanced business capabilities analysis
        validationResult = await productService.analyzeAdvancedProductCapabilities(validatedId)
        break

      case 'full':
      default:
        // Full advanced business logic validation
        validationResult = await productService.validateAdvancedBusinessLogic(validatedId)
        break
    }

    // Format response based on requested format
    if (responseFormat === 'summary') {
      const summary = {
        productId: validatedId,
        productName: product.name,
        validationType,
        isHealthy:
          validationType === 'capabilities' && 'businessValue' in validationResult
            ? ['advanced', 'enterprise'].includes(validationResult.businessValue)
            : validationType === 'consistency' && 'errors' in validationResult
              ? validationResult.errors.length === 0
              : validationType === 'full' && 'errors' in validationResult
                ? validationResult.errors.length === 0
                : true,
        keyMetrics:
          validationType === 'capabilities'
            ? {
                businessValue: (validationResult as AdvancedProductCapabilities).businessValue,
                complexityScore: (validationResult as AdvancedProductCapabilities).complexityScore,
                recommendedActionsCount:
                  (validationResult as AdvancedProductCapabilities).recommendedActions?.length || 0,
              }
            : {
                sizeConsistency: (validationResult as AdvancedBusinessValidationResult)
                  .sizeConsistency,
                uniqueCombinations: (validationResult as AdvancedBusinessValidationResult)
                  .uniqueCombinations,
                errorCount:
                  (validationResult as AdvancedBusinessValidationResult).errors?.length || 0,
              },
        timestamp: new Date().toISOString(),
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
        version: '2.0.0',
        systemInfo: {
          advancedSizeManagement: true,
          businessLogicValidation: true,
          advancedArchitecture: true,
        },
      },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error in business logic validation API:', error)

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: { message: error.message, code: 'NOT_FOUND' } },
        { status: 404 },
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
          },
        },
        { status: 400 },
      )
    }

    // Generic error response
    return NextResponse.json(
      {
        error: {
          message: 'Internal server error during validation',
          code: 'VALIDATION_INTERNAL_ERROR',
        },
      },
      { status: 500 },
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
