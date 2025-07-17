/**
 * API Routes untuk Manajemen Produk
 *
 * Endpoint ini menangani operasi CRUD (Create, Read, Update, Delete) untuk produk.
 * Dirancang untuk digunakan oleh role Producer dengan otorisasi yang ketat.
 *
 * @module ProductAPI
 * @category API Routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { ProductService } from '@/features/manage-product/services/productService'
import { prisma } from '@/lib/prisma'
import { ProductStatus } from '@prisma/client'
import { requireAuthAndRole } from '@/lib/auth-middleware'
import { productQuerySchema } from '@/features/manage-product/lib/validation/productSchema'
import { z } from 'zod'

/**
 * Handler untuk GET /api/products
 * Mendapatkan daftar produk dengan dukungan pagination dan filtering
 *
 * @route GET /api/products
 * @access Authenticated (Owner, Producer Role)
 * @returns {Object} Daftar produk dengan informasi pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const authResult = await requireAuthAndRole(['owner', 'producer'])
    if (authResult.error) {
      return authResult.error
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validasi query parameters
    const validatedParams = productQuerySchema.parse(queryParams)

    // Inisialisasi service
    const productService = new ProductService(prisma)

    // Ambil data produk
    const result = await productService.getProducts({
      page: validatedParams.page,
      limit: validatedParams.limit,
      search: validatedParams.search,
      categoryId: validatedParams.categoryId,
      status: validatedParams.status as ProductStatus,
      isActive: validatedParams.isActive,
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('GET /api/products error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Parameter tidak valid',
          details: error.errors,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({ error: 'Gagal mengambil daftar produk' }, { status: 500 })
  }
}

/**
 * Handler untuk POST /api/products
 * Membuat produk baru dengan validasi ketat dan support file upload (multipart/form-data)
 *
 * @route POST /api/products
 * @access Authenticated (Owner, Producer Role)
 * @returns {Object} Produk yang baru dibuat
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authResult = await requireAuthAndRole(['owner', 'producer'])
    if (authResult.error) {
      return authResult.error
    }

    let data: Record<string, unknown> = {}
    let image: File | undefined

    // Cek content-type untuk support multipart/form-data
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()

      // Parsing field dengan validasi tipe data
      data.code = formData.get('code')?.toString() || ''
      data.name = formData.get('name')?.toString() || ''
      data.description = formData.get('description')?.toString() || ''
      data.modalAwal = Number(formData.get('modalAwal')) || 0
      data.hargaSewa = Number(formData.get('hargaSewa')) || 0
      data.quantity = Number(formData.get('quantity')) || 0
      data.categoryId = formData.get('categoryId')?.toString() || ''

      // File handling yang lebih robust
      const file = formData.get('image')
      if (file && file instanceof File) {
        image = file
        data.image = file // Pastikan data.image juga diset
      } else {
        data.image = undefined // Explicitly set undefined
      }
    } else {
      // Fallback ke JSON
      data = await request.json()
      // Pastikan image tidak ada untuk JSON request
      data.image = undefined
    }

    // Inisialisasi service
    const productService = new ProductService(prisma)

    // Buat produk baru dengan user ID dari auth
    const productInput = {
      code: data.code as string,
      name: data.name as string,
      description: data.description as string,
      modalAwal: Number(data.modalAwal),
      hargaSewa: Number(data.hargaSewa),
      quantity: Number(data.quantity),
      categoryId: data.categoryId as string,
      image, // File terpisah
    }

    const product = await productService.createProduct(productInput, authResult.user.id)

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('POST /api/products error:', error)

    if (error instanceof Error) {
      // Handle specific service errors
      if (error.message.includes('Kode produk sudah digunakan')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }
      if (error.message.includes('Kategori tidak ditemukan')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message.includes('Validasi produk gagal')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      if (error.message.includes('Gagal mengupload file')) {
        return NextResponse.json({ error: error.message }, { status: 422 })
      }
    }
    return NextResponse.json({ error: 'Gagal membuat produk' }, { status: 500 })
  }
}
