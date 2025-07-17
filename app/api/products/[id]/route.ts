/**
 * API Routes untuk Manajemen Detail Produk
 *
 * Endpoint ini menangani operasi spesifik untuk produk berdasarkan ID:
 * - Mendapatkan detail produk
 * - Memperbarui produk
 * - Menghapus (soft delete) produk
 *
 * @module ProductDetailAPI
 * @category API Routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { ProductService } from '@/features/manage-product/services/productService'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAuthAndRole } from '@/lib/auth-middleware'
import { productParamsSchema } from '@/features/manage-product/lib/validation/productSchema'

/**
 * Handler untuk GET /api/products/[id]
 * Mendapatkan detail produk berdasarkan ID
 *
 * @route GET /api/products/[id]
 * @access Authenticated (Owner, Producer Role)
 * @returns {Object} Detail produk
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authentication check
    const authResult = await requireAuthAndRole(['owner', 'producer'])
    if (authResult.error) {
      return authResult.error
    }

    // Validasi parameter
    const validatedParams = productParamsSchema.parse(params)

    // Inisialisasi service
    const productService = new ProductService(prisma)

    // Ambil detail produk
    const product = await productService.getProductById(validatedParams.id)

    return NextResponse.json(product, { status: 200 })
  } catch (error) {
    console.error('GET /api/products/[id] error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'ID produk tidak valid' }, { status: 400 })
    }

    if (error instanceof Error && error.message.includes('Produk tidak ditemukan')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ error: 'Gagal mengambil detail produk' }, { status: 500 })
  }
}

/**
 * Handler untuk PUT /api/products/[id]
 * Memperbarui detail produk yang sudah ada
 * Mendukung file upload (multipart/form-data)
 *
 * @route PUT /api/products/[id]
 * @access Authenticated (Owner, Producer Role)
 * @returns {Object} Produk yang diperbarui
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authentication check
    const authResult = await requireAuthAndRole(['owner', 'producer'])
    if (authResult.error) {
      return authResult.error
    }

    // Validasi parameter
    const validatedParams = productParamsSchema.parse(params)

    let data: Record<string, unknown> = {}
    let image: File | undefined
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      data.name = formData.get('name')?.toString() || ''
      data.description = formData.get('description')?.toString() || ''
      data.modalAwal = Number(formData.get('modalAwal'))
      data.hargaSewa = Number(formData.get('hargaSewa'))
      data.quantity = Number(formData.get('quantity'))
      data.categoryId = formData.get('categoryId')?.toString() || ''
      // File
      const file = formData.get('image')
      if (file && typeof file === 'object' && 'arrayBuffer' in file) {
        image = file as File
      }
    } else {
      data = await request.json()
    }

    // Inisialisasi service
    const productService = new ProductService(prisma)
    // Pastikan data bertipe UpdateProductRequest & { image?: File }
    const updateInput = {
      name: data.name as string,
      description: data.description as string,
      modalAwal: data.modalAwal !== undefined ? Number(data.modalAwal) : undefined,
      hargaSewa: data.hargaSewa !== undefined ? Number(data.hargaSewa) : undefined,
      quantity: data.quantity !== undefined ? Number(data.quantity) : undefined,
      categoryId: data.categoryId as string,
      image,
    }
    // Update produk
    const updatedProduct = await productService.updateProduct(validatedParams.id, updateInput)

    return NextResponse.json(updatedProduct, { status: 200 })
  } catch (error) {
    console.error('PUT /api/products/[id] error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'ID produk tidak valid' }, { status: 400 })
    }

    if (error instanceof Error) {
      if (error.message.includes('Produk tidak ditemukan')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
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
    return NextResponse.json({ error: 'Gagal memperbarui produk' }, { status: 500 })
  }
}

/**
 * Handler untuk DELETE /api/products/[id]
 * Melakukan soft delete pada produk
 *
 * @route DELETE /api/products/[id]
 * @access Authenticated (Owner, Producer Role)
 * @returns {Object} Status keberhasilan penghapusan
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authentication check
    const authResult = await requireAuthAndRole(['owner', 'producer'])
    if (authResult.error) {
      return authResult.error
    }

    // Validasi parameter
    const validatedParams = productParamsSchema.parse(params)

    // Inisialisasi service
    const productService = new ProductService(prisma)

    // Soft delete produk
    await productService.deleteProduct(validatedParams.id)

    return NextResponse.json(
      {
        success: true,
        message: 'Produk berhasil dihapus',
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('DELETE /api/products/[id] error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'ID produk tidak valid' }, { status: 400 })
    }

    if (error instanceof Error && error.message.includes('Produk tidak ditemukan')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ error: 'Gagal menghapus produk' }, { status: 500 })
  }
}
