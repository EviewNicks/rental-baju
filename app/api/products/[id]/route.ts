/**
 * API Route: Product by ID
 *
 * GET /api/products/[id] - Mendapatkan detail produk berdasarkan ID
 *   Query Parameters:
 *   - includeAggregation: boolean - Include aggregated size data
 *   - includeBreakdown: boolean - Include age category breakdown (default: true)
 * PUT /api/products/[id] - Mengupdate produk berdasarkan ID
 * DELETE /api/products/[id] - Soft delete produk berdasarkan ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProductService } from '@/features/manage-product/services/productService'
import { ProductSizeAggregationService } from '@/features/manage-product/services/productSizeAggregationService'
import { FileUploadService } from '@/features/manage-product/services/fileUploadService'
import { prisma } from '@/lib/prisma'
import { updateProductSchema } from '@/features/manage-product/lib/validation/productSchema'
import { NotFoundError, ValidationError, formatErrorResponse } from '@/features/manage-product/lib/errors/AppError'
import type { UpdateProductWithSizesRequest } from '@/features/manage-product/types'

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

    // Get query parameters for aggregation
    const { searchParams } = new URL(request.url)
    const includeAggregation = searchParams.get('includeAggregation') === 'true'
    const includeBreakdown = searchParams.get('includeBreakdown') !== 'false' // default true

    // Initialize service
    const productService = new ProductService(prisma, userId)

    // Get product by ID
    const product = await productService.getProductById(id)

    // Add aggregation data if requested
    if (includeAggregation) {
      const aggregationService = new ProductSizeAggregationService(prisma, {
        includeBreakdown,
      })

      try {
        const aggregation = await aggregationService.getProductAggregation(product.id)

        return NextResponse.json({
          ...product,
          aggregation,
        }, { status: 200 })
      } catch (error) {
        // If aggregation fails, include product without aggregation data
        console.warn(`Failed to get aggregation for product ${product.id}:`, error)
        return NextResponse.json(product, { status: 200 })
      }
    }

    return NextResponse.json(product, { status: 200 })
  } catch (error) {
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
    const currentPrice = formData.get('currentPrice') // ✅ Fixed: use currentPrice instead of hargaSewa
      ? parseFloat(formData.get('currentPrice') as string)
      : undefined
    const quantity = formData.get('quantity')
      ? parseInt(formData.get('quantity') as string)
      : undefined
    const rentedStock = formData.get('rentedStock') // ✅ Added rentedStock parsing
      ? parseInt(formData.get('rentedStock') as string)
      : undefined
    const categoryId = (formData.get('categoryId') as string) || undefined
    const size = (formData.get('size') as string) || undefined
    const colorId = (formData.get('colorId') as string) || undefined
    // Material Management fields - RPK-45
    const materialId = (formData.get('materialId') as string) || undefined
    const materialQuantityStr = (formData.get('materialQuantity') as string) || undefined
    const materialQuantity = materialQuantityStr ? parseInt(materialQuantityStr) : undefined
    const image = formData.get('image') as File | null

    // Validate image format and size if new image is provided
    if (image && image.size > 0) {
      // Supported image formats
      const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

      // Check file format
      if (!SUPPORTED_IMAGE_FORMATS.includes(image.type.toLowerCase())) {
        return NextResponse.json(
          {
            error: {
              message: 'Format gambar tidak didukung',
              code: 'IMAGE_FORMAT_ERROR',
              field: 'image',
              details: `Format ${image.type} tidak didukung. Gunakan JPG, PNG, atau WebP.`,
              supportedFormats: SUPPORTED_IMAGE_FORMATS
            },
          },
          { status: 400 },
        )
      }

      // Check file size (5MB limit)
      const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
      if (image.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: {
              message: 'Ukuran file terlalu besar',
              code: 'IMAGE_SIZE_ERROR',
              field: 'image',
              details: `Ukuran file terlalu besar. Maksimal 5MB. File Anda: ${(image.size / 1024 / 1024).toFixed(2)}MB.`,
              maxSize: MAX_FILE_SIZE
            },
          },
          { status: 413 },
        )
      }
    }

    // Size Management fields - Advanced only (no hasSizes flag)
    const sizesStr = formData.get('sizes') as string
    let sizes: Array<{ id?: string; ageCategory: string; size: string; quantity: number; isActive?: boolean }> = []

    // Parse sizes if provided (for updates)
    if (sizesStr) {
      try {
        sizes = JSON.parse(sizesStr)
        // Validate that if sizes are provided, array should not be empty
        if (sizes.length === 0) {
          return NextResponse.json(
            { error: { message: 'Jika menyediakan data ukuran, minimal 1 ukuran harus ada', code: 'VALIDATION_ERROR' } },
            { status: 400 },
          )
        }
      } catch {
        return NextResponse.json(
          { error: { message: 'Format data ukuran tidak valid', code: 'VALIDATION_ERROR' } },
          { status: 400 },
        )
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (modalAwal !== undefined) updateData.modalAwal = modalAwal
    if (currentPrice !== undefined) updateData.currentPrice = currentPrice // ✅ Fixed: use currentPrice instead of hargaSewa
    if (quantity !== undefined) updateData.quantity = quantity
    if (rentedStock !== undefined) updateData.rentedStock = rentedStock // ✅ Added rentedStock handling
    if (categoryId !== undefined) updateData.categoryId = categoryId
    if (size !== undefined) updateData.size = size
    if (colorId !== undefined) updateData.colorId = colorId
    // Material Management fields - RPK-45
    if (materialId !== undefined) updateData.materialId = materialId
    if (materialQuantity !== undefined) updateData.materialQuantity = materialQuantity
    // Size Management fields - Advanced only
    if (sizes.length > 0) updateData.sizes = sizes

    // Validate materialQuantity if provided
    if (materialQuantityStr && (isNaN(materialQuantity!) || materialQuantity! <= 0)) {
      return NextResponse.json(
        {
          error: {
            message: 'Material quantity harus berupa angka positif',
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 },
      )
    }

    // Validate materialId and materialQuantity consistency
    if (materialId && !materialQuantity) {
      return NextResponse.json(
        {
          error: {
            message: 'Material quantity wajib diisi jika material dipilih',
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 },
      )
    }

    // Validate with advanced schema if there's data to update
    if (Object.keys(updateData).length > 0) {
      // Always use advanced schema (all products have sizes in advanced-only mode)
      try {
        updateProductSchema.parse(updateData)
      } catch (validationError) {
        //eslint-disable-next-line
        const validationErr = ValidationError.fromZodError(validationError as any)
        return NextResponse.json(formatErrorResponse(validationErr), { status: 400 })
      }
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
          } catch {
            // Failed to extract old image path
          }
        }

        // Use updateProductImage to delete old and upload new
        const uploadResult = await fileUploadService.updateProductImage(
          image,
          currentProduct.code,
          oldImagePath,
        )
        updateData.imageUrl = uploadResult?.url
      } catch {
        // Image upload failed
        return NextResponse.json(
          { error: { message: 'Failed to upload image', code: 'UPLOAD_ERROR' } },
          { status: 400 },
        )
      }
    }

    // Update product using advanced-only architecture
    const product = await productService.updateProduct(id, updateData as unknown as UpdateProductWithSizesRequest)

    return NextResponse.json(product, { status: 200 })
  } catch (error) {
    // Generate request ID for debugging
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Handle known error types
    if (error instanceof NotFoundError) {
      return NextResponse.json(formatErrorResponse(error, requestId), { status: 404 })
    }

    // Handle Prisma connection errors
    if (error instanceof Error && error.message.includes('connection pool')) {
      return NextResponse.json(
        formatErrorResponse(new Error('Database connection timeout. Please try again.'), requestId),
        { status: 503 }
      )
    }

    // Handle unknown errors
    return NextResponse.json(formatErrorResponse(error as Error, requestId), { status: 500 })
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
    // Generate request ID for debugging
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Handle known error types
    if (error instanceof NotFoundError) {
      return NextResponse.json(formatErrorResponse(error, requestId), { status: 404 })
    }

    // Handle Prisma connection errors
    if (error instanceof Error && error.message.includes('connection pool')) {
      return NextResponse.json(
        formatErrorResponse(new Error('Database connection timeout. Please try again.'), requestId),
        { status: 503 }
      )
    }

    // Handle unknown errors
    return NextResponse.json(formatErrorResponse(error as Error, requestId), { status: 500 })
  }
}
