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
import { requirePermission, withRateLimit } from '@/lib/auth-middleware'
import { createAvailabilityService } from '@/features/kasir/services/availabilityService'

export async function GET(request: NextRequest) {
  try {
    // 🔍 LOG: API request start
    console.log('[ProductAvailableAPI] 🚀 GET request started', {
      timestamp: new Date().toISOString(),
      url: request.url,
      method: 'GET'
    })

    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await withRateLimit(`products-available-${clientIP}`, 50, 60000)
    if (rateLimitResult.error) {
      console.log('[ProductAvailableAPI] ⚠️ Rate limit exceeded', { clientIP })
      return rateLimitResult.error
    }

    // Authentication and permission check
    const authResult = await requirePermission('produk', 'read')
    if (authResult.error) {
      console.log('[ProductAvailableAPI] ❌ Authentication failed')
      return authResult.error
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      search: searchParams.get('search') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      available: searchParams.get('available') !== 'false', // default true
      size: searchParams.getAll('size').length > 0 ? searchParams.getAll('size') : undefined,
      colorId: searchParams.getAll('colorId').length > 0 ? searchParams.getAll('colorId') : undefined
    }

    // 🔍 LOG: Query parameters
    console.log('[ProductAvailableAPI] 📊 Query parameters received', {
      queryParams,
      timestamp: new Date().toISOString()
    })

    // Validate query parameters
    const validatedQuery = productAvailabilityQuerySchema.parse(queryParams)

    const { page, limit, search, categoryId, available, size, colorId } = validatedQuery
    const skip = (page - 1) * limit

    // 🔍 LOG: Processed query parameters
    console.log('[ProductAvailableAPI] ✅ Query parameters validated', {
      page,
      limit,
      skip,
      search,
      categoryId,
      available,
      size,
      colorId,
      timestamp: new Date().toISOString()
    })

    // Build where clause
    const whereClause: Record<string, unknown> = {
      isActive: true
    }

    // Only show available products (AVAILABLE status and availableStock > 0)
    if (available) {
      whereClause.status = 'AVAILABLE'
      whereClause.availableStock = { gt: 0 }  // Use new availableStock field
    }

    // Search by product name, code, or description
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Filter by category
    if (categoryId) {
      whereClause.categoryId = categoryId
    }

    // Filter by size
    if (size && size.length > 0) {
      whereClause.size = { in: size }
    }

    // Filter by color
    if (colorId && colorId.length > 0) {
      whereClause.colorId = { in: colorId }
    }

    // 🔍 LOG: Database query about to execute
    console.log('[ProductAvailableAPI] 🗄️ Executing database query', {
      whereClause,
      skip,
      limit,
      timestamp: new Date().toISOString()
    })

    // Get products with related data
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        skip,
        take: limit,
        where: whereClause,
        orderBy: [
          { name: 'asc' },
          { createdAt: 'desc' }
        ],
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true
            }
          },
          color: {
            select: {
              id: true,
              name: true,
              hexCode: true
            }
          }
        }
      }),
      prisma.product.count({
        where: whereClause
      })
    ])

    // 🔍 LOG: Database query results
    console.log('[ProductAvailableAPI] ✅ Database query completed', {
      productsFound: products.length,
      totalCount: total,
      productIds: products.map(p => p.id),
      productInventory: products.map(p => ({ 
        id: p.id, 
        name: p.name, 
        totalInventory: p.quantity,
        availableStock: p.availableStock,
        rentedStock: p.rentedStock
      })),
      timestamp: new Date().toISOString()
    })

    // SIMPLIFIED: Use database fields directly instead of complex calculations
    // This eliminates race conditions and improves performance
    console.log('[ProductAvailableAPI] ✅ Using database inventory fields directly', {
      productsFound: products.length,
      inventorySummary: products.map(p => ({
        id: p.id,
        name: p.name,
        totalInventory: p.quantity,      // Total stock (immutable)
        availableStock: p.availableStock, // Currently available
        rentedStock: p.rentedStock       // Currently rented
      })),
      timestamp: new Date().toISOString()
    })

    const formattedProducts = products
      .map(product => {
        return {
          id: product.id,
          code: product.code,
          name: product.name,
          description: product.description,
          hargaSewa: Number(product.hargaSewa),
          // UPDATED: Enhanced inventory information with new fields
          totalInventory: product.quantity,        // Total stock (immutable during rentals)
          quantity: product.quantity,              // Keep for backward compatibility
          availableQuantity: product.availableStock, // Currently available for rent
          rentedQuantity: product.rentedStock,     // Currently rented out
          imageUrl: product.imageUrl,
          category: {
            id: product.category.id,
            name: product.category.name,
            color: product.category.color
          },
          size: product.size,
          color: product.color ? {
            id: product.color.id,
            name: product.color.name,
            hexCode: product.color.hexCode
          } : null,
          status: product.status,
          createdAt: product.createdAt.toISOString(),
          updatedAt: product.updatedAt.toISOString()
        }
      })
      // Filter out products with no available quantity if 'available' filter is true
      .filter(product => !available || product.availableQuantity > 0)

    const totalPages = Math.ceil(total / limit)

    const responseData = {
      data: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }

    // 🔍 LOG: API response summary
    console.log('[ProductAvailableAPI] ✅ Sending response', {
      returnedProducts: formattedProducts.length,
      totalProducts: total,
      currentPage: page,
      totalPages,
      productsWithStock: formattedProducts.filter(p => p.availableQuantity > 0).length,
      productsOutOfStock: formattedProducts.filter(p => p.availableQuantity === 0).length,
      totalInventoryValue: formattedProducts.reduce((sum, p) => sum + p.totalInventory, 0),
      totalAvailableStock: formattedProducts.reduce((sum, p) => sum + p.availableQuantity, 0),
      totalRentedStock: formattedProducts.reduce((sum, p) => sum + p.rentedQuantity, 0),
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        message: 'Data produk tersedia berhasil diambil'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('GET /api/kasir/produk/available error:', error)

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
              message: err.message
            }))
          }
        },
        { status: 400 }
      )
    }

    // Handle database connection errors
    if (error && typeof error === 'object' && 'message' in error && 
        typeof error.message === 'string' && error.message.includes('connection pool')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Database connection timeout. Please try again.',
            code: 'CONNECTION_ERROR'
          }
        },
        { status: 503 }
      )
    }

    // Generic server error
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR'
        }
      },
      { status: 500 }
    )
  }
}