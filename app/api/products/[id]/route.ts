/**
 * API Route: Product by ID
 *
 * GET /api/products/[id] - Mendapatkan detail produk berdasarkan ID
 * PUT /api/products/[id] - Mengupdate produk berdasarkan ID
 * DELETE /api/products/[id] - Soft delete produk berdasarkan ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProductService } from '@/features/manage-product/services/productService'
import { FileUploadService } from '@/features/manage-product/services/fileUploadService'
import { prisma } from '@/lib/prisma'
import { updateProductSchema } from '@/features/manage-product/lib/validation/productSchema'
import { NotFoundError } from '@/features/manage-product/lib/errors/AppError'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
    }

    const { id } = await params

    // Initialize service
    const productService = new ProductService(prisma, userId)

    // Get product by ID
    const product = await productService.getProductById(id)

    return NextResponse.json(product, { status: 200 })
  } catch (error) {
    console.error('GET /api/products/[id] error:', error)

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: { message: error.message, code: 'NOT_FOUND' } },
        { status: 404 },
      )
    }

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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
    }

    const { id } = await params

    // Parse multipart form data
    const formData = await request.formData()

    // Extract form fields
    const name = (formData.get('name') as string) || undefined
    const description = (formData.get('description') as string) || undefined
    const modalAwal = formData.get('modalAwal')
      ? parseFloat(formData.get('modalAwal') as string)
      : undefined
    const hargaSewa = formData.get('hargaSewa')
      ? parseFloat(formData.get('hargaSewa') as string)
      : undefined
    const quantity = formData.get('quantity')
      ? parseInt(formData.get('quantity') as string)
      : undefined
    const categoryId = (formData.get('categoryId') as string) || undefined
    const size = (formData.get('size') as string) || undefined
    const colorId = (formData.get('colorId') as string) || undefined
    const image = formData.get('image') as File | null

    // Prepare update data
    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (modalAwal !== undefined) updateData.modalAwal = modalAwal
    if (hargaSewa !== undefined) updateData.hargaSewa = hargaSewa
    if (quantity !== undefined) updateData.quantity = quantity
    if (categoryId !== undefined) updateData.categoryId = categoryId
    if (size !== undefined) updateData.size = size
    if (colorId !== undefined) updateData.colorId = colorId

    // Validate with schema if there's data to update
    if (Object.keys(updateData).length > 0) {
      updateProductSchema.parse(updateData)
    }

    // Initialize services
    const productService = new ProductService(prisma, userId)
    const fileUploadService = new FileUploadService(userId)

    // Handle image upload if provided
    if (image && image.size > 0) {
      try {
        // Get current product data to extract code and old image path
        const currentProduct = await productService.getProductById(id)

        // Extract old image path from current imageUrl for deletion
        let oldImagePath: string | undefined
        if (currentProduct.imageUrl) {
          try {
            oldImagePath = fileUploadService.extractPathFromUrl(currentProduct.imageUrl)
          } catch (error) {
            console.warn('Failed to extract old image path:', error)
          }
        }

        // Use updateProductImage to delete old and upload new
        const uploadResult = await fileUploadService.updateProductImage(
          image,
          currentProduct.code,
          oldImagePath,
        )
        updateData.imageUrl = uploadResult?.url
      } catch (uploadError) {
        console.error('Image upload error:', uploadError)
        return NextResponse.json(
          { error: { message: 'Failed to upload image', code: 'UPLOAD_ERROR' } },
          { status: 400 },
        )
      }
    }

    // Update product (this will also validate category existence)
    const product = await productService.updateProduct(id, updateData)

    return NextResponse.json(product, { status: 200 })
  } catch (error) {
    console.error('PUT /api/products/[id] error:', error)

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: { message: error.message, code: 'NOT_FOUND' } },
        { status: 404 },
      )
    }

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: { message: error.message, code: 'VALIDATION_ERROR' } },
        { status: 400 },
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
    }

    const { id } = await params

    // Initialize service
    const productService = new ProductService(prisma, userId)

    // Soft delete product
    await productService.deleteProduct(id)

    return NextResponse.json(
      { success: true, message: 'Product deleted successfully' },
      { status: 200 },
    )
  } catch (error) {
    console.error('DELETE /api/products/[id] error:', error)

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: { message: error.message, code: 'NOT_FOUND' } },
        { status: 404 },
      )
    }

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
