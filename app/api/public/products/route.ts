/**
 * API Route: Public Products
 *
 * GET /api/public/products - Mendapatkan daftar produk public tanpa autentikasi
 *                           untuk homepage dan konsumsi publik
 *
 * Query Parameters:
 *   - page: number - Halaman pagination (default: 1)
 *   - limit: number - Jumlah item per halaman (default: 10)
 *   - search: string - Pencarian berdasarkan nama/deskripsi
 *   - categoryId: string - Filter berdasarkan kategori
 *   - status: string - Filter berdasarkan status (default: AVAILABLE)
 */

import { NextRequest, NextResponse } from 'next/server'
import { ProductService } from '@/features/manage-product/services/productService'
import { ProductSizeTransformer } from '@/features/manage-product/utils/ProductSizeTransformer'
import { prisma } from '@/lib/prisma'
import type { Product } from '@/features/manage-product/types'

// PublicProduct interface - filtered data untuk konsumsi publik
interface PublicProduct {
  id: string
  code: string
  name: string
  description?: string
  category: {
    name: string
    color: string
  }
  currentPrice: number // Harga sewa per hari
  modalAwal: number    // Nilai barang
  imageUrl?: string
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE'
  sizes: Array<{
    size: string
    ageCategory: string
    quantity: number
  }>
  isActive: boolean
}

// Query parameters schema untuk public API
interface PublicProductQuery {
  page: number
  limit: number
  search?: string
  categoryId?: string
  status?: string
}

/**
 * Convert Product dari ProductService ke PublicProduct (filtered)
 * Menghilangkan data sensitif seperti revenue, cost, dan tracking internal
 */
function convertToPublicProduct(product: Product): PublicProduct {
  return {
    id: product.id,
    code: product.code,
    name: product.name,
    description: product.description,
    category: {
      name: product.category.name,
      color: product.category.color,
    },
    currentPrice: Number(product.currentPrice), // Convert Decimal to number
    modalAwal: Number(product.modalAwal), // Convert Decimal to number
    imageUrl: product.imageUrl,
    status: product.status,
    sizes: product.sizes.map(size => ({
      size: size.size,
      ageCategory: size.ageCategory,
      quantity: size.quantity,
    })),
    isActive: product.isActive,
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const query: PublicProductQuery = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      search: searchParams.get('search') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      status: searchParams.get('status') || 'AVAILABLE', // Default: hanya produk tersedia
    }

    // Validasi basic parameters
    if (query.page < 1) query.page = 1
    if (query.limit < 1 || query.limit > 100) query.limit = 10 // Max 100 items per page

    // Initialize ProductService tanpa userId (public access)
    // Menggunakan placeholder userId untuk kompatibilitas dengan existing service
    const productService = new ProductService(prisma, 'public-api')

    // Build query untuk ProductService
    const productQuery = {
      page: query.page,
      limit: query.limit,
      search: query.search,
      categoryId: query.categoryId,
      status: query.status,
      isActive: true, // Hanya produk aktif
    }

    // Get products menggunakan existing ProductService
    const result = await productService.getProducts(productQuery)

    // Filter products dengan available stock untuk public API
    const availableProducts = result.products.filter(product => {
      // Hanya tampilkan produk yang available dan ada stock
      if (query.status === 'AVAILABLE') {
        const totalQuantity = ProductSizeTransformer.calculateTotalQuantity(product.sizes || [], 'simplified')
        // Calculate available quantity from Enhanced ProductSize fields
        const availableQuantity = product.sizes?.reduce((sum, size) => sum + (size.availableQuantity || 0), 0) || 0
        return product.status === 'AVAILABLE' && availableQuantity > 0
      }
      return true
    })

    // Convert ke PublicProduct format
    const publicProducts = availableProducts.map(convertToPublicProduct)

    // Response format sesuai existing pattern
    const response = {
      products: publicProducts,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: publicProducts.length,
        totalPages: Math.ceil(publicProducts.length / query.limit),
      },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    // Error handling sesuai pattern existing API
    if (error instanceof Error) {
      return NextResponse.json(
        { error: { message: error.message, code: 'INTERNAL_ERROR' } },
        { status: 500 },
      )
    }

    // Handle Prisma connection errors
    if (error instanceof Error && error.message.includes('connection pool')) {
      return NextResponse.json(
        {
          error: {
            message: 'Database connection timeout. Please try again.',
            code: 'CONNECTION_ERROR',
          },
        },
        { status: 503 },
      )
    }

    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    )
  }
}