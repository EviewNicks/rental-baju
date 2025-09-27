/**
 * API Route: Public Product Detail
 *
 * GET /api/public/products/[id] - Mendapatkan detail produk berdasarkan ID
 *                                 tanpa autentikasi untuk konsumsi publik
 */

import { NextRequest, NextResponse } from 'next/server'
import { ProductService } from '@/features/manage-product/services/productService'
import { prisma } from '@/lib/prisma'
import { NotFoundError } from '@/features/manage-product/lib/errors/AppError'
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
  color?: {
    name: string
    hexCode?: string
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
    color: product.color ? {
      name: product.color.name,
      hexCode: product.color.hexCode,
    } : undefined,
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Validasi basic ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: { message: 'Invalid product ID', code: 'INVALID_ID' } },
        { status: 400 },
      )
    }

    // Initialize ProductService tanpa userId (public access)
    // Menggunakan placeholder userId untuk kompatibilitas dengan existing service
    const productService = new ProductService(prisma, 'public-api')

    // Get product by ID menggunakan existing ProductService
    const product = await productService.getProductById(id)

    // Validasi bahwa produk aktif dan layak untuk konsumsi publik
    if (!product.isActive) {
      throw new NotFoundError('Produk tidak ditemukan atau tidak tersedia')
    }

    // Convert ke PublicProduct format
    const publicProduct = convertToPublicProduct(product)

    return NextResponse.json(publicProduct, { status: 200 })
  } catch (error) {
    // Handle NotFoundError dari ProductService
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: { message: 'Produk tidak ditemukan', code: 'NOT_FOUND' } },
        { status: 404 },
      )
    }

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