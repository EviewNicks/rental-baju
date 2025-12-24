/**
 * API Route: Product Availability for Kasir - RPK-26
 *
 * GET /api/kasir/produk/available - Get available products for rental
 *
 * Authentication: Clerk (admin/kasir roles only)
 * Returns products that are active and have available quantity for rental
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { productAvailabilityQuerySchema } from '@/features/kasir/lib/validation/kasirSchema'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { requirePermission, withRateLimit } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await withRateLimit(`products-available-${clientIP}`, 50, 60000)
    if (rateLimitResult.error) {
      return rateLimitResult.error
    }

    // Authentication and permission check
    const authResult = await requirePermission('produk', 'read')
    if (authResult.error) {
      return authResult.error
    }

    // Parse query parameters with enhanced filters for kasir workflow
    const { searchParams } = new URL(request.url)
    const rawQueryParams = Object.fromEntries(searchParams.entries())

    // Handle multiple values for array parameters properly
    const queryParams = {
      ...rawQueryParams,
      size: searchParams.getAll('size'), // Properly handle array parameters
    }

    // Validate query parameters
    const validatedQuery = productAvailabilityQuerySchema.parse(queryParams)

    const { page, limit, search, categoryId, available, size, ageCategory, minAvailableQuantity, status, sortBy, sortOrder, minPrice, maxPrice } = validatedQuery
    const skip = (page - 1) * limit

    // Dynamic validation for sortBy field to prevent Prisma errors (Updated for Enhanced ProductSize)
    const validSortFields = ['name', 'currentPrice', 'createdAt', 'availableQuantity']
    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Field sorting tidak valid',
            code: 'INVALID_SORT_FIELD',
            details: {
              received: sortBy,
              validOptions: validSortFields
            }
          }
        },
        { status: 400 }
      )
    }

    // Build optimized where clause with indexed fields first
    const whereClause: Record<string, unknown> = {
      isActive: true,
    }

    // Only show available products (AVAILABLE status and calculated available stock > 0)
    if (available) {
      whereClause.status = 'AVAILABLE'
      // Note: availableStock filtering will be done after query using calculateAvailableStock()
      // This avoids the schema mismatch issue while maintaining the same business logic
    }

    // Search by product name, code, or description
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Filter by category
    if (categoryId) {
      whereClause.categoryId = categoryId
    }

    // Filter by size on ProductSize relation level (Enhanced ProductSize)
    if (size && size.length > 0) {
      whereClause.sizes = {
        some: {
          size: { in: size },
          isActive: true
        }
      }
    }

    // Filter by age category on ProductSize relation level
    if (ageCategory && ageCategory.length > 0) {
      whereClause.sizes = {
        some: {
          ageCategory: { in: ageCategory },
          isActive: true,
          ...(size && size.length > 0 && {
            size: { in: size }
          })
        }
      }
    }

    // Filter by minimum available quantity
    if (minAvailableQuantity !== undefined) {
      whereClause.sizes = {
        some: {
          availableQuantity: { gte: minAvailableQuantity },
          isActive: true,
          ...(ageCategory && ageCategory.length > 0 && {
            ageCategory: { in: ageCategory }
          }),
          ...(size && size.length > 0 && {
            size: { in: size }
          })
        }
      }
    }

    // Enhanced filters for kasir workflow - optimized for performance
    // Use indexed fields first for better query performance
    if (categoryId) {
      whereClause.categoryId = categoryId // ✅ Indexed field
    }

    if (status) {
      whereClause.status = status // ✅ Indexed field
    }

    // Price range filter with proper indexing
    const priceFilter: Record<string, unknown> = {}
    if (minPrice !== undefined) {
      priceFilter.gte = minPrice
    }
    if (maxPrice !== undefined) {
      priceFilter.lte = maxPrice
    }
    if (Object.keys(priceFilter).length > 0) {
      whereClause.currentPrice = priceFilter // ✅ Indexed field
    }

  
    // Get products with related data including ProductSize information
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        skip,
        take: limit,
        where: whereClause,
        // Enhanced sorting for kasir workflow
        orderBy: [
          { [sortBy]: sortOrder },
          { name: 'asc' }, // Secondary sort for consistency
          { createdAt: 'desc' }
        ],
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              type: true,
            },
          },
          sizes: {
            where: { isActive: true },
            orderBy: [
              { ageCategory: 'asc' },
              { size: 'asc' }
            ],
          },
        },
      }),
      // Optimized count query instead of double data fetch
      prisma.product.count({ where: whereClause }),
    ])

    // SIMPLIFIED: Use database fields directly instead of complex calculations
    // This eliminates race conditions and improves performance

    const formattedProducts = products
      .map((product) => {
        // Calculate total available quantity using Enhanced ProductSize fields
        const totalAvailable = product.sizes.reduce((sum, size) => sum + (size.availableQuantity || 0), 0)
        const totalRented = product.sizes.reduce((sum, size) => sum + (size.rentedQuantity || 0), 0)
        const totalOriginal = product.sizes.reduce((sum, size) => sum + (size.originalQuantity || 0), 0)

        // Enhanced ProductSize integration - no more legacy fallbacks needed
        // Size information is now properly handled by Enhanced ProductSize fields

        return {
          id: product.id,
          code: product.code,
          name: product.name,
          description: product.description,
          currentPrice: Number(product.currentPrice),
          // ENHANCED: Size-based inventory information using Enhanced ProductSize schema
          totalInventory: totalOriginal, // Total original stock from all sizes
          availableQuantity: totalAvailable, // Total available stock across all sizes
          rentedQuantity: totalRented, // Total rented stock across all sizes
          // Legacy compatibility fields - simplified for frontend
          size: product.sizes && product.sizes.length > 0 ? product.sizes[0].size : 'Unknown',
          color: { name: 'Default' }, // Simplified - frontend uses category color
          // NEW: Size-specific information
          sizes: product.sizes.map(size => ({
            id: size.id,
            ageCategory: size.ageCategory,
            size: size.size,
            quantity: size.quantity, // Legacy field (keep for backward compatibility)
            originalQuantity: size.originalQuantity, // ✅ Enhanced field
            rentedQuantity: size.rentedQuantity, // ✅ Enhanced field
            availableQuantity: size.availableQuantity, // ✅ Enhanced field (FIXED)
            // Add color field to sizes for selectedSize mapping
            color: `${size.ageCategory} - ${size.size}`, // Generated color description
          })),
          imageUrl: product.imageUrl,
          category: {
            id: product.category.id,
            name: product.category.name,
            color: product.category.color,
            type: product.category.type,
          },
          status: product.status,
          createdAt: product.createdAt.toISOString(),
          updatedAt: product.updatedAt.toISOString(),
        }
      })
      // Filter out products with no available quantity if 'available' filter is true
      .filter((product) => !available || product.availableQuantity > 0)

    // Use optimized count query result (already includes availability filtering)
    const finalTotal = available
      ? await prisma.product.count({
          where: {
            ...whereClause,
            sizes: {
              some: {
                availableQuantity: { gt: 0 },
                isActive: true
              }
            }
          }
        })
      : total
    const totalPages = Math.ceil(finalTotal / limit)

    const responseData = {
      data: formattedProducts,
      pagination: {
        page,
        limit,
        total: finalTotal,
        totalPages,
      },
    }

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        message: 'Data produk tersedia berhasil diambil',
      },
      { status: 200 },
    )
  } catch (error) {
    // Enhanced error categorization with proper logging
    console.error('GET /api/kasir/produk/available error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      type: error?.constructor?.name
    })

    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Parameter query tidak valid',
            code: 'VALIDATION_ERROR',
            details: error.issues.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code
            }))
          }
        },
        { status: 400 }
      )
    }

    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const errorMap: Record<string, string> = {
        P2002: 'Data sudah ada dalam sistem',
        P2025: 'Data tidak ditemukan',
        P2003: 'Referensi data tidak valid',
        P2021: 'Tabel tidak ditemukan',
        P2022: 'Kolom tidak ditemukan',
        P2000: 'Value too large for column',
        P2001: 'Record does not exist'
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            message: errorMap[error.code] || 'Error database tidak diketahui',
            code: 'DATABASE_ERROR',
            details: {
              databaseCode: error.code,
              target: error.meta?.target,
              meta: error.meta
            }
          }
        },
        { status: 400 }
      )
    }

    // Handle connection timeout and network errors specifically
    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string' &&
      (error.message.includes('connection pool') ||
       error.message.includes('timeout') ||
       error.message.includes('ECONNREFUSED') ||
       error.message.includes('ENOTFOUND'))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Database connection timeout. Silakan coba lagi.',
            code: 'CONNECTION_ERROR',
            retryAfter: 5 // seconds
          }
        },
        { status: 503 }
      )
    }

    // Handle memory/overload errors
    if (error instanceof Error &&
        (error.message.includes('out of memory') ||
         error.message.includes('Maximum call stack') ||
         error.message.includes('heap out of memory'))) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Server kelebihan beban. Silakan coba dengan parameter yang lebih spesifik.',
            code: 'OVERLOAD_ERROR'
          }
        },
        { status: 503 }
      )
    }

    // Handle validation errors from Prisma
    if (error instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Format query tidak valid untuk database',
            code: 'QUERY_VALIDATION_ERROR',
            details: {
              message: error.message
            }
          }
        },
        { status: 400 }
      )
    }

    // Handle initialization errors
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Database initialization error. Silakan hubungi administrator.',
            code: 'DATABASE_INIT_ERROR',
            details: {
              errorCode: error.errorCode,
              message: error.message
            }
          }
        },
        { status: 503 }
      )
    }

    // Handle transaction errors
    if (error instanceof Prisma.PrismaClientRustPanicError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Database transaction error. Silakan coba lagi.',
            code: 'TRANSACTION_ERROR'
          }
        },
        { status: 503 }
      )
    }

    // Generic fallback with enhanced logging for debugging
    const requestId = crypto.randomUUID()
    
    // Suppress repetitive timeout errors
    if (error instanceof Error && (error.name === 'TimeoutError' || error.message.includes('timeout'))) {
      // Only log timeout errors in development or first occurrence
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Timeout error in GET /api/kasir/produk/available (suppressed in production):', {
          requestId,
          errorName: error.name,
          message: error.message.substring(0, 100) + '...',
          timestamp: new Date().toISOString()
        })
      }
    } else {
      // Log other errors normally
      console.error('Unhandled error in GET /api/kasir/produk/available:', {
        requestId,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
          requestId // For debugging and support
        }
      },
      { status: 500 }
    )
  }
}
