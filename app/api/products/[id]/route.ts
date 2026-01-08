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
import { ProductHistoryService } from '@/features/manage-product/services/productHistoryService'
import { FileUploadService } from '@/features/manage-product/services/fileUploadService'
import { prisma } from '@/lib/prisma'
import { updateProductSchema } from '@/features/manage-product/lib/validation/productSchema'
import {
  NotFoundError,
  ValidationError,
  formatErrorResponse,
} from '@/features/manage-product/lib/errors/AppError'
import type { UpdateProductWithSizesRequest } from '@/features/manage-product/types'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authentication check
    const { userId, sessionClaims } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
    }

    const { id } = await params

    // Get query parameters for aggregation and break-even
    const { searchParams } = new URL(request.url)
    const includeAggregation = searchParams.get('includeAggregation') === 'true'
    const includeBreakdown = searchParams.get('includeBreakdown') !== 'false' // default true
    const includeBreakEven = searchParams.get('includeBreakEven') === 'true' // RPK-MODAL
    const includeCosts = searchParams.get('includeCosts') !== 'false' // default true - NEW: Cost items always included by default

    // Initialize service
    const productService = new ProductService(prisma, userId)

    // Get product by ID
    const product = await productService.getProductById(id)

    // Backend Audit Trail - Log product retrieval with detailed cost items info
    console.log('[BACKEND AUDIT] Product retrieved for GET request:', {
      productId: id,
      hasProduct: !!product,
      hasCosts: Array.isArray(product.costs) && product.costs.length > 0,
      costsCount: Array.isArray(product.costs) ? product.costs.length : 0,
      hasSimplifiedCosts: Array.isArray(product.simplifiedCosts) && product.simplifiedCosts.length > 0,
      simplifiedCostsCount: Array.isArray(product.simplifiedCosts) ? product.simplifiedCosts.length : 0,
      modalAwal: product.modalAwal,
      costItemsDetails: Array.isArray(product.costs) ? product.costs.map(cost => ({
        costItemId: cost.costItemId,
        amount: cost.amount,
        costItemName: cost.costItem?.name || 'Unknown'
      })) : [],
      simplifiedCostsDetails: Array.isArray(product.simplifiedCosts) ? product.simplifiedCosts : [],
      calculatedModalAwal: Array.isArray(product.costs) ? 
        product.costs.reduce((total, cost) => total + cost.amount, 0) : 0,
      modalAwalMatch: Array.isArray(product.costs) ? 
        Number(product.modalAwal) === product.costs.reduce((total, cost) => total + cost.amount, 0) : 
        Number(product.modalAwal) === 0,
      timestamp: new Date().toISOString(),
      action: 'PRODUCT_RETRIEVED'
    })

    // Prepare response object
    let responseData: Record<string, unknown> = { ...product }

    // Backend Audit Trail - Log response data preparation
    console.log('[BACKEND AUDIT] Response data prepared:', {
      productId: id,
      responseDataKeys: Object.keys(responseData),
      hasCostsInResponse: 'costs' in responseData && Array.isArray(responseData.costs),
      costsCountInResponse: Array.isArray(responseData.costs) ? responseData.costs.length : 0,
      hasSimplifiedCostsInResponse: 'simplifiedCosts' in responseData && Array.isArray(responseData.simplifiedCosts),
      simplifiedCostsCountInResponse: Array.isArray(responseData.simplifiedCosts) ? responseData.simplifiedCosts.length : 0,
      modalAwalInResponse: responseData.modalAwal,
      includeCostsParam: includeCosts,
      timestamp: new Date().toISOString(),
      action: 'RESPONSE_DATA_PREPARED'
    })

    // Ensure cost items are included in response (they should already be from ProductService)
    if (includeCosts && product.costs) {
      responseData.costs = product.costs
      console.log('[BACKEND AUDIT] Cost items explicitly included in response:', {
        productId: id,
        costItemsCount: product.costs.length,
        costItems: product.costs.map(cost => ({
          costItemId: cost.costItemId,
          amount: cost.amount,
          costItemName: cost.costItem?.name || 'Unknown'
        })),
        timestamp: new Date().toISOString(),
        action: 'COST_ITEMS_INCLUDED_IN_RESPONSE'
      })
    }

    // Add aggregation data if requested
    if (includeAggregation) {
      const aggregationService = new ProductSizeAggregationService(prisma, {
        includeBreakdown,
      })

      try {
        // ENHANCED: Use comprehensive inventory method with InventoryService integration
        const comprehensiveInventory = await aggregationService.getComprehensiveInventory(
          product.id,
        )

        responseData = {
          ...responseData,
          // Legacy aggregation for backward compatibility
          aggregation: {
            productId: comprehensiveInventory.productId,
            totalQuantity: comprehensiveInventory.totalQuantity,
            aggregatedSizes: comprehensiveInventory.aggregatedSizes,
            hasAdvancedSizing: comprehensiveInventory.hasAdvancedSizing,
            categoryBreakdown: comprehensiveInventory.categoryBreakdown,
            lastCalculated: comprehensiveInventory.lastCalculated,
          },
          // NEW: Comprehensive inventory data with Enhanced ProductSize fields
          inventoryStatus: comprehensiveInventory.inventoryStatus,
          sizeDetails: comprehensiveInventory.sizeDetails,
        }
      } catch (error) {
        // If aggregation fails, continue without aggregation data
        console.warn(`Failed to get aggregation for product ${product.id}:`, error)
      }
    }

    // RPK-MODAL: Add break-even status if requested and authorized
    if (includeBreakEven) {
      // Check role permissions (Owner, Producer only)
      const userRole = determineUserRole(sessionClaims)
      const canViewBreakEven = ['owner', 'producer'].includes(userRole)

      if (canViewBreakEven) {
        try {
          const historyService = new ProductHistoryService(prisma, userId)
          const breakEvenStatus = await historyService.getBreakEvenStatus(id)

          responseData = {
            ...responseData,
            breakEvenStatus,
          }
        } catch (error) {
          // If break-even calculation fails, continue without break-even data
          console.warn(`Failed to get break-even status for product ${product.id}:`, error)
        }
      }
    }

    // Backend Audit Trail - Log final response before sending
    console.log('[BACKEND AUDIT] Final response ready to send:', {
      productId: id,
      finalResponseKeys: Object.keys(responseData),
      hasCostsInFinalResponse: 'costs' in responseData && Array.isArray(responseData.costs),
      costsCountInFinalResponse: Array.isArray(responseData.costs) ? responseData.costs.length : 0,
      hasSimplifiedCostsInFinalResponse: 'simplifiedCosts' in responseData && Array.isArray(responseData.simplifiedCosts),
      simplifiedCostsCountInFinalResponse: Array.isArray(responseData.simplifiedCosts) ? responseData.simplifiedCosts.length : 0,
      modalAwalInFinalResponse: responseData.modalAwal,
      hasAggregation: 'aggregation' in responseData,
      hasInventoryStatus: 'inventoryStatus' in responseData,
      hasBreakEvenStatus: 'breakEvenStatus' in responseData,
      timestamp: new Date().toISOString(),
      action: 'FINAL_RESPONSE_READY'
    })

    return NextResponse.json(responseData, { status: 200 })
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

    // Frontend Audit Trail - Log all received form data for update
    console.log('[BACKEND AUDIT] PUT /api/products/[id] - Form data received:', {
      productId: id,
      allFormFields: Array.from(formData.entries()).map(([key, value]) => ({
        key,
        valueType: typeof value,
        valueSize: value instanceof File ? value.size : String(value).length,
        isFile: value instanceof File
      })),
      timestamp: new Date().toISOString(),
      action: 'UPDATE_FORM_DATA_RECEIVED'
    })

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
    const categoryId = (formData.get('categoryId') as string) || undefined
    const size = (formData.get('size') as string) || undefined
    const colorId = (formData.get('colorId') as string) || undefined
    // Material Management fields - RPK-45
    const materialId = (formData.get('materialId') as string) || undefined
    const materialQuantityStr = (formData.get('materialQuantity') as string) || undefined
    const materialQuantity = materialQuantityStr ? parseInt(materialQuantityStr) : undefined
    const image = formData.get('image') as File | null

    // NEW: Cost Items Management - Extract cost items data for update
    const selectedCostsStr = formData.get('selectedCosts') as string
    let selectedCosts: Array<{
      costItemId: string
      amount: number
      name?: string
    }> = []

    // Enhanced audit trail for cost items parsing
    console.log('[BACKEND AUDIT] Cost items field extraction:', {
      productId: id,
      hasSelectedCostsField: selectedCostsStr !== null,
      selectedCostsFieldType: typeof selectedCostsStr,
      selectedCostsFieldValue: selectedCostsStr,
      selectedCostsFieldLength: selectedCostsStr ? selectedCostsStr.length : 0,
      isEmptyString: selectedCostsStr === '',
      isNullValue: selectedCostsStr === null,
      isUndefinedValue: selectedCostsStr === undefined,
      timestamp: new Date().toISOString(),
      action: 'COST_ITEMS_FIELD_EXTRACTION'
    })

    // Parse cost items if provided
    if (selectedCostsStr !== null && selectedCostsStr !== undefined) {
      if (selectedCostsStr === '') {
        // Empty string case - should be treated as removal
        selectedCosts = []
        console.log('[BACKEND AUDIT] Empty cost items string detected - treating as removal:', {
          productId: id,
          selectedCostsStr: selectedCostsStr,
          resultingArray: selectedCosts,
          shouldTriggerRemoval: true,
          timestamp: new Date().toISOString(),
          action: 'EMPTY_COST_ITEMS_STRING_DETECTED'
        })
      } else {
        try {
          selectedCosts = JSON.parse(selectedCostsStr)
          console.log('[BACKEND AUDIT] Cost items parsed for update:', {
            productId: id,
            costItemsCount: selectedCosts.length,
            costItems: selectedCosts,
            isEmptyArray: selectedCosts.length === 0,
            shouldTriggerRemoval: selectedCosts.length === 0,
            timestamp: new Date().toISOString(),
            action: 'UPDATE_COST_ITEMS_PARSED'
          })
        } catch (parseError) {
          console.error('[BACKEND AUDIT] Failed to parse cost items for update:', {
            productId: id,
            error: parseError,
            selectedCostsStr,
            timestamp: new Date().toISOString(),
            action: 'UPDATE_COST_ITEMS_PARSE_ERROR'
          })
          return NextResponse.json(
            { error: { message: 'Format data cost items tidak valid', code: 'VALIDATION_ERROR' } },
            { status: 400 },
          )
        }
      }
    } else {
      // Field not provided - should not trigger cost items update
      console.log('[BACKEND AUDIT] Cost items field not provided - no update:', {
        productId: id,
        selectedCostsStr,
        willUpdateCostItems: false,
        timestamp: new Date().toISOString(),
        action: 'COST_ITEMS_FIELD_NOT_PROVIDED'
      })
    }

    // Backend Audit Trail - Log parsed form data for update
    console.log('[BACKEND AUDIT] Update form fields parsed:', {
      productId: id,
      hasName: !!name,
      hasModalAwal: modalAwal !== undefined,
      hasCurrentPrice: currentPrice !== undefined,
      hasCostItems: selectedCosts.length > 0,
      costItemsCount: selectedCosts.length,
      modalAwalValue: modalAwal,
      costItemsData: selectedCosts,
      timestamp: new Date().toISOString(),
      action: 'UPDATE_FORM_FIELDS_PARSED'
    })

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

    // Size Management fields - Advanced only (no hasSizes flag)
    const sizesStr = formData.get('sizes') as string
    let sizes: Array<{
      id?: string
      ageCategory: string
      size: string
      quantity: number
      originalQuantity?: number
      rentedQuantity?: number
      availableQuantity?: number
      isActive?: boolean
    }> = []

    // Parse sizes if provided (for updates)
    if (sizesStr) {
      try {
        sizes = JSON.parse(sizesStr)

        // Validate that if sizes are provided, array should not be empty
        if (sizes.length === 0) {
          return NextResponse.json(
            {
              error: {
                message: 'Jika menyediakan data ukuran, minimal 1 ukuran harus ada',
                code: 'VALIDATION_ERROR',
              },
            },
            { status: 400 },
          )
        }
      } catch (parseError) {
        console.error(`[API Route] Failed to parse sizes:`, {
          error: parseError,
          sizesStr: sizesStr,
          timestamp: new Date().toISOString(),
        })
        return NextResponse.json(
          { error: { message: 'Format data ukuran tidak valid', code: 'VALIDATION_ERROR' } },
          { status: 400 },
        )
      }
    } else {
      console.log(`[API Route] No sizes string provided`)
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (modalAwal !== undefined) updateData.modalAwal = modalAwal
    if (currentPrice !== undefined) updateData.currentPrice = currentPrice // ✅ Fixed: use currentPrice instead of hargaSewa
    if (quantity !== undefined) updateData.quantity = quantity
    if (categoryId !== undefined) updateData.categoryId = categoryId
    if (size !== undefined) updateData.size = size
    if (colorId !== undefined) updateData.colorId = colorId
    // Material Management fields - RPK-45
    if (materialId !== undefined) updateData.materialId = materialId
    if (materialQuantity !== undefined) updateData.materialQuantity = materialQuantity
    // Size Management fields - Enhanced ProductSize fields processed in service layer
    if (sizes.length > 0) {
      updateData.sizes = sizes // Pass raw data to service layer
    } else {
      console.log(`[API Route] No sizes to add to updateData`)
    }
    // NEW: Cost Items Management - Add cost items to update data
    const shouldUpdateCostItems = selectedCostsStr !== null && selectedCostsStr !== undefined
    if (shouldUpdateCostItems) {
      updateData.selectedCosts = selectedCosts
      console.log('[BACKEND AUDIT] Cost items added to update data:', {
        productId: id,
        costItemsCount: selectedCosts.length,
        costItems: selectedCosts,
        isRemovalAction: selectedCosts.length === 0,
        shouldResetModalAwal: selectedCosts.length === 0,
        timestamp: new Date().toISOString(),
        action: 'COST_ITEMS_ADDED_TO_UPDATE_DATA'
      })
    } else {
      console.log('[BACKEND AUDIT] Cost items not included in update data:', {
        productId: id,
        reason: 'selectedCosts field not provided in form data',
        willPreserveCostItems: true,
        timestamp: new Date().toISOString(),
        action: 'COST_ITEMS_NOT_INCLUDED_IN_UPDATE'
      })
    }

    // Backend Audit Trail - Log prepared update data
    console.log('[BACKEND AUDIT] Update data prepared:', {
      productId: id,
      updateDataKeys: Object.keys(updateData),
      hasSelectedCosts: 'selectedCosts' in updateData,
      costItemsCount: Array.isArray(updateData.selectedCosts) ? updateData.selectedCosts.length : 0,
      modalAwalValue: updateData.modalAwal,
      costItemsData: updateData.selectedCosts,
      shouldUpdateCostItems,
      costItemsFieldProvided: selectedCostsStr !== null && selectedCostsStr !== undefined,
      isRemovalAction: Array.isArray(updateData.selectedCosts) && updateData.selectedCosts.length === 0,
      timestamp: new Date().toISOString(),
      action: 'UPDATE_DATA_PREPARED'
    })

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

    // ENHANCED: Validate update safety if sizes are being updated
    if (sizes.length > 0) {
      try {
        // Check current rental state before update
        const currentProduct = await productService.getProductById(id)

        // Validate that quantity changes are safe
        for (const newSize of sizes) {
          const existingSize = currentProduct.sizes?.find(
            (s) => s.ageCategory === newSize.ageCategory && s.size === newSize.size,
          )

          if (existingSize) {
            const newOriginalQty = newSize.originalQuantity || newSize.quantity
            const currentRented = existingSize.rentedQuantity || 0
            const currentLost = existingSize.lostQuantity || 0
            const minRequired = currentRented + currentLost

            if (newOriginalQty < minRequired) {
              return NextResponse.json(
                {
                  error: {
                    message: `Cannot reduce quantity for ${newSize.ageCategory}-${newSize.size} below ${minRequired} (${currentRented} rented + ${currentLost} lost)`,
                    code: 'QUANTITY_VALIDATION_ERROR',
                    field: 'sizes',
                    details: {
                      ageCategory: newSize.ageCategory,
                      size: newSize.size,
                      requestedQuantity: newOriginalQty,
                      minimumRequired: minRequired,
                      currentRented: currentRented,
                      currentLost: currentLost,
                    },
                  },
                },
                { status: 400 },
              )
            }
          }
        }
      } catch (error) {
        // If validation fails, return error
        return NextResponse.json(
          {
            error: {
              message: 'Failed to validate update safety',
              code: 'VALIDATION_ERROR',
              details: error instanceof Error ? error.message : 'Unknown error',
            },
          },
          { status: 400 },
        )
      }
    }

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

    // Update product using advanced-only architecture with rental state preservation
    const product = await productService.updateProduct(
      id,
      updateData as unknown as UpdateProductWithSizesRequest,
    )

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
        { status: 503 },
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
        { status: 503 },
      )
    }

    // Handle unknown errors
    return NextResponse.json(formatErrorResponse(error as Error, requestId), { status: 500 })
  }
}

/**
 * Helper function to determine user role from Clerk session claims
 * RPK-MODAL: Role-based access control for break-even status
 *
 * @param sessionClaims - Clerk session claims object
 * @returns User role (owner, producer, kasir)
 */
function determineUserRole(
  sessionClaims: Record<string, unknown> | null,
): 'owner' | 'producer' | 'kasir' {
  // Default to producer role for safety (masked customer data)
  if (!sessionClaims || typeof sessionClaims !== 'object') {
    return 'producer'
  }

  // Extract role from custom session claims
  // This should match the role structure from your Clerk configuration
  const metadata = sessionClaims.metadata as Record<string, unknown> | undefined
  const role = metadata?.role || sessionClaims.role || 'producer'

  // Validate and normalize role
  switch (String(role).toLowerCase()) {
    case 'owner':
      return 'owner'
    case 'kasir':
      return 'kasir'
    case 'producer':
    default:
      return 'producer'
  }
}
