/**
 * API Route: Products
 *
 * GET /api/products - Mendapatkan daftar produk dengan pagination dan filter
 * POST /api/products - Membuat produk baru dengan upload gambar
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProductService } from '@/features/manage-product/services/productService'
import { FileUploadService } from '@/features/manage-product/services/fileUploadService'
import { prisma } from '@/lib/prisma'
import { createProductSchema } from '@/features/manage-product/lib/validation/productSchema'
import { ConflictError } from '@/features/manage-product/lib/errors/AppError'

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const query = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      search: searchParams.get('search') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      status: searchParams.get('status') || undefined,
      isActive: searchParams.get('isActive') !== 'false', // default true
    }

    // Initialize service
    const productService = new ProductService(prisma, userId)

    // Get products
    const result = await productService.getProducts(query)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('GET /api/products error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: { message: error.message, code: 'INTERNAL_ERROR' } },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
    }

    // Parse multipart form data
    const formData = await request.formData()

    // Extract form fields
    const code = formData.get('code') as string
    const name = formData.get('name') as string
    const description = (formData.get('description') as string) || undefined
    const modalAwalStr = formData.get('modalAwal') as string
    const hargaSewaStr = formData.get('hargaSewa') as string
    const quantityStr = formData.get('quantity') as string
    const categoryId = formData.get('categoryId') as string
    const image = formData.get('image') as File | null

    // Convert string to numbers
    const modalAwal = parseFloat(modalAwalStr)
    const hargaSewa = parseFloat(hargaSewaStr)
    const quantity = parseInt(quantityStr)

    // Validate required fields and number conversions
    if (!code || !name || !categoryId) {
      return NextResponse.json(
        { error: { message: 'Missing required fields', code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    if (isNaN(modalAwal) || isNaN(hargaSewa) || isNaN(quantity)) {
      return NextResponse.json(
        {
          error: {
            message: 'Invalid number format for modalAwal, hargaSewa, or quantity',
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 },
      )
    }

    // Prepare request data
    const createRequest = {
      code,
      name,
      description,
      modalAwal,
      hargaSewa,
      quantity,
      categoryId,
      image,
    }

    // Validate with schema
    const validatedData = createProductSchema.parse(createRequest)

    // Initialize services
    const productService = new ProductService(prisma, userId)
    const fileUploadService = new FileUploadService(userId)

    // Handle image upload if provided
    let imageUrl: string | undefined
    if (image && image.size > 0) {
      try {
        const uploadResult = await fileUploadService.uploadProductImage(image, validatedData.code)
        imageUrl = uploadResult?.url
      } catch (uploadError) {
        console.error('Image upload error:', uploadError)
        return NextResponse.json(
          { error: { message: 'Failed to upload image', code: 'UPLOAD_ERROR' } },
          { status: 400 },
        )
      }
    } else {
      // Use default image if no image provided
      imageUrl = process.env.NEXT_PUBLIC_DEFAULT_COURSE_THUMBNAIL_URL || 'products/image.png'
    }

    // Create product with image URL
    const productData = {
      ...validatedData,
      image: undefined, // Remove file from validated data
      imageUrl, // Add uploaded image URL
    }

    const product = await productService.createProduct(productData)

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('POST /api/products error:', error)

    if (error instanceof ConflictError) {
      return NextResponse.json(
        { error: { message: error.message, code: 'CONFLICT' } },
        { status: 409 },
      )
    }

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: { message: error.message, code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    )
  }
}
