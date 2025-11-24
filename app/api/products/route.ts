/**
 * API Route: Products
 *
 * GET /api/products - Mendapatkan daftar produk dengan pagination dan filter
 * POST /api/products - Membuat produk baru dengan upload gambar
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProductService } from '@/features/manage-product/services/productService'
import { ProductSizeAggregationService } from '@/features/manage-product/services/productSizeAggregationService'
import { FileUploadService } from '@/features/manage-product/services/fileUploadService'
import { prisma } from '@/lib/prisma'
import { createProductSchema } from '@/features/manage-product/lib/validation/productSchema'
import {
  ConflictError,
  ValidationError,
  formatErrorResponse,
} from '@/features/manage-product/lib/errors/AppError'
import type { Product } from '@/features/manage-product/types'

// Supported image formats for upload
const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

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
      size: searchParams.getAll('size').length > 0 ? searchParams.getAll('size') : undefined,
      colorId:
        searchParams.getAll('colorId').length > 0 ? searchParams.getAll('colorId') : undefined,
    }

    // Aggregation options
    const includeAggregation = searchParams.get('includeAggregation') === 'true'
    const includeBreakdown = searchParams.get('includeBreakdown') !== 'false' // default true

    // Initialize services
    const productService = new ProductService(prisma, userId)

    // Get products
    const result = await productService.getProducts(query)

    // Add aggregation data if requested
    if (includeAggregation && result.products.length > 0) {
      const aggregationService = new ProductSizeAggregationService(prisma, {
        includeBreakdown,
      })

      // Add aggregation data to each product
      const productsWithAggregation = await Promise.all(
        result.products.map(async (product: Product) => {
          try {
            const aggregation = await aggregationService.getProductAggregation(product.id)
            return {
              ...product,
              aggregation,
            }
          } catch (error) {
            // If aggregation fails, include product without aggregation data
            console.warn(`Failed to get aggregation for product ${product.id}:`, error)
            return product
          }
        }),
      )

      result.products = productsWithAggregation
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
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
    const currentPriceStr = formData.get('currentPrice') as string // ✅ Fixed: use currentPrice instead of hargaSewa
    const quantityStr = formData.get('quantity') as string
    // REMOVED: rentedStock field doesn't exist in Product model - using Enhanced ProductSize fields instead
    const categoryId = formData.get('categoryId') as string
    const size = (formData.get('size') as string) || undefined
    const colorId = (formData.get('colorId') as string) || undefined
    // Material Management fields - RPK-45
    const materialId = (formData.get('materialId') as string) || undefined
    const materialQuantityStr = (formData.get('materialQuantity') as string) || undefined
    const image = formData.get('image') as File | null

    // Validate image format and size if image is provided
    if (image && image.size > 0) {
      // Check file format
      if (!SUPPORTED_IMAGE_FORMATS.includes(image.type.toLowerCase())) {
        return NextResponse.json(
          {
            error: {
              message: 'Format gambar tidak didukung',
              code: 'IMAGE_FORMAT_ERROR',
              field: 'image',
              details: `Format ${image.type} tidak didukung. Gunakan JPG, PNG, atau WebP.`,
              supportedFormats: SUPPORTED_IMAGE_FORMATS,
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
              maxSize: MAX_FILE_SIZE,
            },
          },
          { status: 413 },
        )
      }
    }

    // Size Management fields - REQUIRED for advanced-only architecture
    const sizesStr = formData.get('sizes') as string
    let sizes: Array<{
      ageCategory: string;
      size: string;
      quantity: number; // Legacy field for backward compatibility
      originalQuantity?: number;  // Enhanced field
      rentedQuantity?: number;   // Enhanced field
      availableQuantity?: number; // Enhanced field
      isActive?: boolean
    }> = []

    // Parse sizes - REQUIRED since all products must have sizes
    if (!sizesStr) {
      return NextResponse.json(
        {
          error: {
            message: 'Field sizes wajib diisi - semua produk harus memiliki ukuran',
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 },
      )
    }

    try {
      sizes = JSON.parse(sizesStr)
      if (!sizes || sizes.length === 0) {
        return NextResponse.json(
          { error: { message: 'Minimal 1 ukuran harus ditambahkan', code: 'VALIDATION_ERROR' } },
          { status: 400 },
        )
      }

      // Enhanced ProductSize fields will be processed in service layer
      // Route layer only handles basic validation and passes raw data to service
    } catch {
      return NextResponse.json(
        { error: { message: 'Format data ukuran tidak valid', code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    // Convert string to numbers
    const modalAwal = parseFloat(modalAwalStr)
    const currentPrice = parseFloat(currentPriceStr) // ✅ Fixed: use currentPrice instead of hargaSewa
    const quantity = parseInt(quantityStr)
    // REMOVED: rentedStock field parsing - doesn't exist in Product model
    // Material Management - RPK-45
    const materialQuantity = materialQuantityStr ? parseInt(materialQuantityStr) : undefined

    // Validate required fields and number conversions
    if (!code || !name || !categoryId) {
      return NextResponse.json(
        { error: { message: 'Missing required fields', code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    if (isNaN(modalAwal) || isNaN(currentPrice) || isNaN(quantity)) {
      return NextResponse.json(
        {
          error: {
            message: 'Invalid number format for modalAwal, currentPrice, or quantity',
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 },
      )
    }

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

    // Prepare request data
    const createRequest = {
      code,
      name,
      description,
      modalAwal,
      currentPrice, 
      quantity,
      categoryId,
      size,
      colorId,
      materialId,
      materialQuantity,
      sizes,
      image,
    }

    // Validate with advanced-only schema (all products require sizes)
    let validatedData
    try {
      validatedData = createProductSchema.parse(createRequest)
    } catch (validationError) {
      //eslint-disable-next-line
      const validationErr = ValidationError.fromZodError(validationError as any)
      return NextResponse.json(formatErrorResponse(validationErr), { status: 400 })
    }

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
        // Image upload failed - provide specific error details
        const errorMessage =
          uploadError instanceof Error ? uploadError.message : 'Unknown upload error'
        return NextResponse.json(
          {
            error: {
              message: 'Gagal mengunggah gambar',
              code: 'IMAGE_UPLOAD_ERROR',
              field: 'image',
              details:
                errorMessage.includes('HEIC') || errorMessage.includes('heic')
                  ? 'Format HEIC tidak didukung. Gunakan JPG, PNG, atau WebP.'
                  : `Upload gagal: ${errorMessage}`,
            },
          },
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

    // Create product using advanced-only architecture
    const product = await productService.createProduct(productData)

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    // Generate request ID for debugging
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Handle known error types
    if (error instanceof ConflictError) {
      return NextResponse.json(formatErrorResponse(error, requestId), { status: 409 })
    }

    // Handle Prisma connection errors
    if (error instanceof Error && error.message.includes('connection pool')) {
      return NextResponse.json(
        formatErrorResponse(new Error('Database connection timeout. Please try again.'), requestId),
        { status: 503 },
      )
    }

    // Handle unknown errors
    return NextResponse.json(formatErrorResponse(error as Error, requestId), { status: 500 })
  }
}
