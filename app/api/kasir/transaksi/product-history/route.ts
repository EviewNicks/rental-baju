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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  cachedAt: Date
  expiresAt: Date
}>()

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export async function GET(request: NextRequest) {
  let productSizeId: string | null = null
  
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Akses tidak diizinkan',
          userMessage: 'Anda belum login atau sesi Anda sudah berakhir. Silakan login kembali untuk melanjutkan.',
          errorType: 'UNAUTHORIZED',
          suggestions: [
            'Login ulang ke sistem',
            'Periksa apakah Anda masih terhubung ke internet',
            'Hubungi admin jika tidak bisa login'
          ],
          details: 'User authentication required',
          retryable: false,
          helpText: 'Untuk keamanan, sistem memerlukan Anda untuk login terlebih dahulu sebelum melihat data transaksi.'
        },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    productSizeId = searchParams.get('productSizeId')
    const statusesParam = searchParams.get('statuses')
    const limitParam = searchParams.get('limit')
    const sortByParam = searchParams.get('sortBy')

    // Validate required parameters
    if (!productSizeId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Parameter produk tidak lengkap',
          userMessage: 'Informasi produk yang diperlukan tidak lengkap. Silakan pilih produk lagi dari daftar.',
          errorType: 'VALIDATION_ERROR',
          suggestions: [
            'Kembali ke halaman produk dan pilih ulang',
            'Refresh halaman dan coba lagi',
            'Pastikan Anda mengklik produk dari daftar yang tersedia'
          ],
          details: 'productSizeId parameter is required',
          retryable: false,
          helpText: 'Kesalahan ini biasanya terjadi jika ada masalah saat memilih produk. Silakan coba pilih produk lagi.'
        },
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      requestedProductSizeId: productSizeId || 'unknown',
      timestamp: new Date().toISOString()
    })

    // Enhanced error response with user-friendly messages in natural language
    let statusCode = 500
    let errorMessage = 'Terjadi kesalahan saat memuat riwayat transaksi'
    let userFriendlyMessage = 'Maaf, sistem sedang mengalami gangguan. Silakan coba lagi dalam beberapa saat.'
    let errorType = 'API_ERROR'
    let suggestions = ['Refresh halaman dan coba lagi', 'Hubungi admin jika masalah berlanjut']

    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      
      if (message.includes('not found') || message.includes('tidak ditemukan')) {
        statusCode = 404
        errorMessage = 'Produk atau ukuran tidak ditemukan'
        userFriendlyMessage = 'Produk yang Anda cari tidak tersedia atau sudah tidak ada dalam sistem.'
        errorType = 'PRODUCT_NOT_FOUND'
        suggestions = [
          'Periksa kembali produk yang dipilih',
          'Pilih ukuran lain yang tersedia',
          'Refresh halaman untuk memperbarui data produk'
        ]
      } else if (message.includes('timeout')) {
        statusCode = 408
        errorMessage = 'Waktu tunggu habis'
        userFriendlyMessage = 'Koneksi terlalu lambat atau server tidak merespons. Silakan coba lagi.'
        errorType = 'NETWORK_TIMEOUT'
        suggestions = [
          'Periksa koneksi internet Anda',
          'Coba lagi dalam beberapa detik',
          'Tutup aplikasi lain yang menggunakan internet'
        ]
      } else if (message.includes('validation') || message.includes('invalid')) {
        statusCode = 400
        errorMessage = 'Data yang dikirim tidak valid'
        userFriendlyMessage = 'Ada kesalahan dalam data yang dikirim. Silakan coba pilih produk lagi.'
        errorType = 'VALIDATION_ERROR'
        suggestions = [
          'Pilih ulang produk dari daftar',
          'Refresh halaman dan mulai dari awal',
          'Pastikan produk masih tersedia'
        ]
      } else if (message.includes('cache')) {
        statusCode = 503
        errorMessage = 'Layanan penyimpanan sementara bermasalah'
        userFriendlyMessage = 'Sistem penyimpanan data sementara sedang bermasalah. Data mungkin perlu dimuat ulang.'
        errorType = 'CACHE_ERROR'
        suggestions = [
          'Refresh halaman untuk memuat data terbaru',
          'Coba lagi dalam 1-2 menit',
          'Bersihkan cache browser jika masalah berlanjut'
        ]
      } else if (message.includes('database') || message.includes('connection')) {
        statusCode = 503
        errorMessage = 'Koneksi database bermasalah'
        userFriendlyMessage = 'Sistem database sedang mengalami gangguan. Silakan tunggu sebentar dan coba lagi.'
        errorType = 'DATABASE_ERROR'
        suggestions = [
          'Tunggu 2-3 menit dan coba lagi',
          'Jangan melakukan transaksi dulu',
          'Hubungi admin jika urgent'
        ]
      } else if (message.includes('permission') || message.includes('unauthorized')) {
        statusCode = 403
        errorMessage = 'Tidak memiliki akses'
        userFriendlyMessage = 'Anda tidak memiliki izin untuk melihat data ini. Silakan login ulang atau hubungi admin.'
        errorType = 'PERMISSION_ERROR'
        suggestions = [
          'Login ulang ke sistem',
          'Periksa hak akses Anda',
          'Hubungi admin untuk mendapatkan akses'
        ]
      }
    }

    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        userMessage: userFriendlyMessage,
        errorType,
        suggestions,
        details: error instanceof Error ? error.message : 'Unknown error',
        retryable: ['API_ERROR', 'NETWORK_TIMEOUT', 'CACHE_ERROR', 'DATABASE_ERROR'].includes(errorType),
        timestamp: new Date().toISOString(),
        helpText: errorType === 'NETWORK_TIMEOUT' 
          ? 'Jika masalah berlanjut, periksa koneksi internet atau hubungi admin.'
          : errorType === 'PRODUCT_NOT_FOUND'
          ? 'Produk mungkin sudah tidak tersedia atau telah dihapus dari sistem.'
          : 'Jika error ini terus muncul, silakan screenshot dan laporkan ke admin.'
      },
      { status: statusCode }
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