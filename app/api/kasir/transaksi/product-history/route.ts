/**
 * Product History API Endpoint - Task 2.2 (CORRECTED)
 * GET /api/kasir/transaksi/product-history
 * Returns transaction history for a specific product size with caching
 * 
 * ARCHITECTURE FIX:
 * - Uses ItemHistoryService (dedicated service for transaction history)
 * - Uses SizeAvailabilityService (for future availability checks)
 * - Removes duplicate code from TransaksiService
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { createTransactionHistoryService } from '@/features/kasir/services/ItemHistoryService'
import { createEnhancedAvailabilityService } from '@/features/kasir/services/SizeAvailabilityService'

// In-memory cache for 5-minute caching (Task 2.3)

const cache = new Map<string, {
  data: any[]
  cachedAt: Date
  expiresAt: Date
}>()

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const productSizeId = searchParams.get('productSizeId')
    const statusesParam = searchParams.get('statuses')
    const limitParam = searchParams.get('limit')
    const sortByParam = searchParams.get('sortBy')

    // Validate required parameters
    if (!productSizeId) {
      return NextResponse.json(
        { error: 'productSizeId parameter is required' },
        { status: 400 }
      )
    }

    // Parse optional parameters
    const statuses: ('active' | 'diambil')[] = statusesParam 
      ? (statusesParam.split(',').filter(s => ['active', 'diambil'].includes(s)) as ('active' | 'diambil')[])
      : ['active', 'diambil'] // REVISED: Default to active and diambil only

    const limit = limitParam ? parseInt(limitParam, 10) : 50
    const sortBy = (sortByParam as 'date_proximity' | 'date_asc' | 'date_desc') || 'date_proximity'

    // Generate cache key
    const cacheKey = `${productSizeId}:${JSON.stringify({ statuses, limit, sortBy })}`

    // Check cache first (Task 2.3: 5-minute caching)
    const cached = cache.get(cacheKey)
    if (cached && new Date() <= cached.expiresAt) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true,
        cachedAt: cached.cachedAt.toISOString()
      })
    }

    // CORRECTED: Use dedicated services from Task 1
    const historyService = createTransactionHistoryService(prisma)
    const availabilityService = createEnhancedAvailabilityService(prisma)

    // Get transaction history using ItemHistoryService (proper architecture)
    const historyData = await historyService.getProductSizeHistory(
      productSizeId,
      { statuses, limit, sortBy }
    )

    // Store in cache (Task 2.3: 5-minute caching)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + CACHE_TTL_MS)
    cache.set(cacheKey, {
      data: historyData,
      cachedAt: now,
      expiresAt
    })

    // Clean up expired cache entries periodically
    cleanupExpiredCache()

    return NextResponse.json({
      success: true,
      data: historyData,
      cached: false,
      metadata: {
        productSizeId,
        statuses,
        limit,
        sortBy,
        totalResults: historyData.length,
        cacheExpiresAt: expiresAt.toISOString(),
        serviceUsed: 'ItemHistoryService' // For debugging
      }
    })

  } catch (error) {
    console.error('Product history API error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      { 
        error: 'Failed to fetch product history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Clean up expired cache entries to prevent memory leaks
 * Task 2.3: Cache management
 */
function cleanupExpiredCache() {
  const now = new Date()
  const keysToDelete: string[] = []

  for (const [key, cached] of cache.entries()) {
    if (now > cached.expiresAt) {
      keysToDelete.push(key)
    }
  }

  keysToDelete.forEach(key => cache.delete(key))
}

/**
 * Clear cache for specific product size (for cache invalidation)
 * This can be called when transactions are updated
 */
export function clearProductHistoryCache(productSizeId?: string) {
  if (productSizeId) {
    const keysToDelete = Array.from(cache.keys()).filter(key => 
      key.startsWith(productSizeId)
    )
    keysToDelete.forEach(key => cache.delete(key))
  } else {
    cache.clear()
  }
}