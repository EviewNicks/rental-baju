/**
 * API Routes untuk Manajemen Kategori
 *
 * Endpoint ini menangani operasi CRUD (Create, Read, Update, Delete) untuk kategori.
 * Dirancang untuk digunakan oleh role Producer dengan otorisasi yang ketat.
 *
 * @module CategoryAPI
 * @category API Routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { CategoryService } from '@/features/manage-product/services/categoryService'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAuthAndRole } from '@/lib/auth-middleware'
import { categoryQuerySchema } from '@/features/manage-product/lib/validation/productSchema'

/**
 * Handler untuk GET /api/categories
 * Mendapatkan daftar kategori dengan opsi opsional untuk menyertakan produk
 *
 * @route GET /api/categories
 * @access Authenticated (Owner, Producer Role)
 * @returns {Object} Daftar kategori
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

    // Validasi query parameters (untuk future use)
    categoryQuerySchema.parse(queryParams)

    // Inisialisasi service
    const categoryService = new CategoryService(prisma)

    // Ambil data kategori
    const categories = await categoryService.getCategories()

    return NextResponse.json(categories, { status: 200 })
  } catch (error) {
    console.error('GET /api/categories error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Parameter tidak valid',
          details: error.errors,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({ error: 'Gagal mengambil daftar kategori' }, { status: 500 })
  }
}

/**
 * Handler untuk POST /api/categories
 * Membuat kategori baru dengan validasi ketat
 *
 * @route POST /api/categories
 * @access Authenticated (Owner, Producer Role)
 * @returns {Object} Kategori yang baru dibuat
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authResult = await requireAuthAndRole(['owner', 'producer'])
    if (authResult.error) {
      return authResult.error
    }

    const body = await request.json()

    // Inisialisasi service
    const categoryService = new CategoryService(prisma)

    // Buat kategori baru dengan user ID dari auth
    const category = await categoryService.createCategory(body, authResult.user.id)

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('POST /api/categories error:', error)

    if (error instanceof Error) {
      // Handle specific service errors
      if (error.message.includes('Nama kategori sudah digunakan')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }

      if (error.message.includes('Validasi kategori gagal')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    return NextResponse.json({ error: 'Gagal membuat kategori' }, { status: 500 })
  }
}
