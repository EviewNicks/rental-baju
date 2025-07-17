/**
 * API Routes untuk Manajemen Detail Kategori
 *
 * Endpoint ini menangani operasi spesifik untuk kategori berdasarkan ID:
 * - Mendapatkan detail kategori
 * - Memperbarui kategori
 * - Menghapus kategori
 *
 * @module CategoryDetailAPI
 * @category API Routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { CategoryService } from '@/features/manage-product/services/categoryService'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAuthAndRole } from '@/lib/auth-middleware'
import { categoryParamsSchema } from '@/features/manage-product/lib/validation/productSchema'

/**
 * Handler untuk GET /api/categories/[id]
 * Mendapatkan detail kategori berdasarkan ID
 *
 * @route GET /api/categories/[id]
 * @access Authenticated (Owner, Producer Role)
 * @returns {Object} Detail kategori
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authentication check
    const authResult = await requireAuthAndRole(['owner', 'producer'])
    if (authResult.error) {
      return authResult.error
    }

    // Validasi parameter
    const validatedParams = categoryParamsSchema.parse(params)

    // Inisialisasi service
    const categoryService = new CategoryService(prisma)

    // Ambil detail kategori
    const category = await categoryService.getCategoryById(validatedParams.id)

    if (!category) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(category, { status: 200 })
  } catch (error) {
    console.error('GET /api/categories/[id] error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'ID kategori tidak valid' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Gagal mengambil detail kategori' }, { status: 500 })
  }
}

/**
 * Handler untuk PUT /api/categories/[id]
 * Memperbarui detail kategori yang sudah ada
 *
 * @route PUT /api/categories/[id]
 * @access Authenticated (Owner, Producer Role)
 * @returns {Object} Kategori yang diperbarui
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authentication check
    const authResult = await requireAuthAndRole(['owner', 'producer'])
    if (authResult.error) {
      return authResult.error
    }

    // Validasi parameter
    const validatedParams = categoryParamsSchema.parse(params)

    const body = await request.json()

    // Inisialisasi service
    const categoryService = new CategoryService(prisma)

    // Update kategori
    const updatedCategory = await categoryService.updateCategory(validatedParams.id, body)

    return NextResponse.json(updatedCategory, { status: 200 })
  } catch (error) {
    console.error('PUT /api/categories/[id] error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'ID kategori tidak valid' }, { status: 400 })
    }

    if (error instanceof Error) {
      if (error.message.includes('Kategori tidak ditemukan')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }

      if (error.message.includes('Nama kategori sudah digunakan')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }

      if (error.message.includes('Validasi kategori gagal')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    return NextResponse.json({ error: 'Gagal memperbarui kategori' }, { status: 500 })
  }
}

/**
 * Handler untuk DELETE /api/categories/[id]
 * Menghapus kategori dari database
 *
 * @route DELETE /api/categories/[id]
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
    const validatedParams = categoryParamsSchema.parse(params)

    // Inisialisasi service
    const categoryService = new CategoryService(prisma)

    // Hapus kategori
    await categoryService.deleteCategory(validatedParams.id)

    return NextResponse.json(
      {
        success: true,
        message: 'Kategori berhasil dihapus',
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('DELETE /api/categories/[id] error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'ID kategori tidak valid' }, { status: 400 })
    }

    if (error instanceof Error) {
      if (error.message.includes('Kategori tidak ditemukan')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }

      if (error.message.includes('Kategori masih digunakan')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }
    }

    return NextResponse.json({ error: 'Gagal menghapus kategori' }, { status: 500 })
  }
}
