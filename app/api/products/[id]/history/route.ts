/**
 * API Route: Product History
 * RPK-46 Product History Activity Timeline Component
 *
 * GET /api/products/[id]/history - Get product rental history with pagination
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProductHistoryService } from '@/features/manage-product/services/productHistoryService'
import { prisma } from '@/lib/prisma'
import { productParamsSchema } from '@/features/manage-product/lib/validation/productSchema'
import type { UserRole, HistoryQueryParams } from '@/features/manage-product/types/productHistory'
import {
  isValidSortBy,
  isValidSortOrder,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '@/features/manage-product/types/productHistory'

/**
 * Get product rental history with pagination and role-based data masking
 */
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const { userId, sessionClaims } = await auth()
    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } 
        },
        { status: 401 },
      )
    }

    // Extract and validate product ID from params
    const { id } = await params
    const { id: productId } = productParamsSchema.parse({ id })

    // Extract and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = extractQueryParams(searchParams)

    // Determine user role from session claims (Clerk custom claims)
    const userRole = determineUserRole(sessionClaims)

    // Initialize service
    const productHistoryService = new ProductHistoryService(prisma, userId)

    // Get product history
    const result = await productHistoryService.getProductHistory(
      productId,
      queryParams,
      userRole
    )

    if (!result.success) {
      const statusCode = result.error?.code === 'NOT_FOUND' ? 404 : 500
      return NextResponse.json(result, { status: statusCode })
    }

    // Get summary statistics (optional, for enhanced response)
    let summary
    try {
      summary = await productHistoryService.getHistorySummary(productId)
    } catch (error) {
      console.warn('Failed to get history summary:', error)
      // Continue without summary - not critical for core functionality
    }

    // Build successful response
    const response = {
      success: true,
      data: result.data,
      pagination: result.pagination,
      summary,
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('GET /api/products/[id]/history error:', error)

    // Handle specific error types
    if (error instanceof Error) {
      // Handle validation errors
      if (error.message.includes('validation')) {
        return NextResponse.json(
          { 
            success: false,
            error: { message: error.message, code: 'VALIDATION_ERROR' } 
          },
          { status: 400 },
        )
      }

      // Handle database connection errors
      if (error.message.includes('connection pool')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Database connection timeout. Please try again.',
              code: 'CONNECTION_ERROR',
            },
          },
          { status: 503 },
        )
      }
    }

    // Generic error response
    return NextResponse.json(
      { 
        success: false,
        error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } 
      },
      { status: 500 },
    )
  }
}

/**
 * Extract and validate query parameters from URL search params
 */
function extractQueryParams(searchParams: URLSearchParams): HistoryQueryParams {
  // Parse pagination parameters
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(searchParams.get('limit') || DEFAULT_PAGE_SIZE.toString(), 10))
  )

  // Parse sorting parameters
  const sortByParam = searchParams.get('sortBy')
  const sortBy = isValidSortBy(sortByParam) ? sortByParam : 'date'

  const sortOrderParam = searchParams.get('sortOrder')
  const sortOrder = isValidSortOrder(sortOrderParam) ? sortOrderParam : 'desc'

  return {
    productId: '', // Will be set by caller
    page,
    limit,
    sortBy,
    sortOrder,
  }
}

/**
 * Determine user role from Clerk session claims
 * Follows existing role-based access control patterns
 */
function determineUserRole(sessionClaims: Record<string, unknown> | null): UserRole {
  // Default to producer role for safety (masked customer data)
  if (!sessionClaims || typeof sessionClaims !== 'object') {
    return 'producer'
  }

  // Extract role from custom session claims
  // This should match the role structure from your Clerk configuration
  const metadata = sessionClaims.metadata as Record<string, unknown> | undefined
  const role = metadata?.role || sessionClaims.role || 'producer'

  // Validate and normalize role
  switch (String(role).toLowerCase()) {
    case 'owner':
      return 'owner'
    case 'kasir':
      return 'kasir'
    case 'producer':
    default:
      return 'producer'
  }
}

