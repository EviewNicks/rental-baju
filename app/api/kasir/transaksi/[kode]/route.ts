/**
 * API Route: Individual Transaksi Management - RPK-26
 * 
 * GET /api/kasir/transaksi/[kode] - Get transaksi by code with full details
 * PUT /api/kasir/transaksi/[kode] - Update transaksi status and details
 * 
 * Authentication: Clerk (admin/kasir roles only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TransaksiService } from '@/features/kasir/services/transaksiService'
import { updateTransaksiSchema } from '@/features/kasir/lib/validation/kasirSchema'
import { TransactionCodeGenerator } from '@/features/kasir/lib/utils/codeGenerator'
import { ZodError } from 'zod'
import { requirePermission, withRateLimit } from '@/lib/auth-middleware'
import { formatTransactionResponse } from '@/features/kasir/lib/utils/responseFormatter'

interface RouteParams {
  params: Promise<{
    kode: string
  }>
}

/**
 * ✅ AUTO-CORRECT STATUS: Automatically fix transaction status based on actual pickup state
 * This ensures status is always accurate regardless of backend pickup service issues
 */
async function autoCorrectTransactionStatus(
  transaksi: any,
  transaksiService: TransaksiService
): Promise<any> {
  try {
    // ✅ PICKUP AUTO-CORRECTION: active/terlambat → diambil
    const pickupCorrected = await autoCorrectPickupStatus(transaksi, transaksiService)
    
    // ✅ RETURN AUTO-CORRECTION: diambil/pending_resolution → selesai/pending_resolution
    const returnCorrected = await autoCorrectReturnStatus(pickupCorrected, transaksiService)
    
    return returnCorrected
  } catch (error) {
    console.error('❌ AUTO-CORRECT: Failed to auto-correct transaction status', {
      transactionId: transaksi.id,
      transactionCode: transaksi.kode,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    // Return original transaction if auto-correct fails
    return transaksi
  }
}

/**
 * ✅ PICKUP AUTO-CORRECTION: Fix pickup status based on jumlahDiambil
 */
async function autoCorrectPickupStatus(
  transaksi: any,
  transaksiService: TransaksiService
): Promise<any> {
  try {
    // Only auto-correct for 'active' status (NOT 'terlambat')
    // 'terlambat' is a visual badge for overdue dates and should remain until return
    if (transaksi.status !== 'active') {
      return transaksi
    }

    // Check if any items have been picked up
    const hasAnyPickup = transaksi.items.some((item: any) => (item.jumlahDiambil || 0) > 0)

    // If items have been picked up but status is still 'active', update to 'diambil'
    if (hasAnyPickup && transaksi.status === 'active') {
      console.info('🔧 AUTO-CORRECT PICKUP: Updating transaction status from pickup state', {
        transactionId: transaksi.id,
        transactionCode: transaksi.kode,
        currentStatus: transaksi.status,
        newStatus: 'diambil',
        itemsWithPickup: transaksi.items.filter((item: any) => (item.jumlahDiambil || 0) > 0).length,
        totalItems: transaksi.items.length,
        reason: 'auto_correct_pickup_status'
      })

      // Update status in database
      await transaksiService.updateTransaksiStatus(transaksi.id, { 
        status: 'diambil' 
      })

      // Return updated transaction object
      return {
        ...transaksi,
        status: 'diambil'
      }
    }

    return transaksi
  } catch (error) {
    console.error('❌ AUTO-CORRECT PICKUP: Failed to auto-correct pickup status', {
      transactionId: transaksi.id,
      transactionCode: transaksi.kode,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return transaksi
  }
}

/**
 * ✅ RETURN AUTO-CORRECTION: Fix return status based on return records and lost items
 */
async function autoCorrectReturnStatus(
  transaksi: any,
  transaksiService: TransaksiService
): Promise<any> {
  try {
    // Only auto-correct for 'diambil' and 'pending_resolution' status
    if (transaksi.status !== 'diambil' && transaksi.status !== 'pending_resolution') {
      return transaksi
    }

    // Check for unresolved lost items
    const hasUnresolvedLostItems = transaksi.items.some((item: any) => {
      return item.conditionBreakdown?.some((condition: any) => {
        const isLostItem = condition.kondisiAkhir?.toLowerCase().includes('hilang')
        const isUnresolved = !condition.resolutionStatus
        return isLostItem && isUnresolved
      })
    })

    // Check if all items are fully returned
    const allItemsReturned = transaksi.items.every((item: any) => {
      const isPickedUp = (item.jumlahDiambil || 0) > 0
      const isReturned = item.statusKembali === 'lengkap'
      
      // If item was picked up, it must be returned
      if (isPickedUp) {
        return isReturned
      }
      
      // If item was not picked up, it doesn't need to be returned
      return true
    })

    // Determine correct status based on return state
    let correctStatus = transaksi.status
    let correctionReason = ''

    if (hasUnresolvedLostItems) {
      // Priority 1: If there are unresolved lost items → pending_resolution
      if (transaksi.status !== 'pending_resolution') {
        correctStatus = 'pending_resolution'
        correctionReason = 'has_unresolved_lost_items'
      }
    } else if (allItemsReturned) {
      // Priority 2: If all items returned and no lost items → selesai
      if (transaksi.status !== 'selesai') {
        correctStatus = 'selesai'
        correctionReason = 'all_items_returned'
      }
    }

    // Apply correction if needed
    if (correctStatus !== transaksi.status) {
      console.info('🔧 AUTO-CORRECT RETURN: Updating transaction status from return state', {
        transactionId: transaksi.id,
        transactionCode: transaksi.kode,
        currentStatus: transaksi.status,
        newStatus: correctStatus,
        reason: correctionReason,
        returnAnalysis: {
          hasUnresolvedLostItems,
          allItemsReturned,
          itemsAnalysis: transaksi.items.map((item: any) => ({
            itemId: item.id,
            productName: item.produk?.name,
            jumlahDiambil: item.jumlahDiambil,
            statusKembali: item.statusKembali,
            hasLostItems: item.conditionBreakdown?.some((c: any) => 
              c.kondisiAkhir?.toLowerCase().includes('hilang') && !c.resolutionStatus
            ) || false
          }))
        }
      })

      // Update status in database
      await transaksiService.updateTransaksiStatus(transaksi.id, { 
        status: correctStatus,
        tglKembali: correctStatus === 'selesai' ? new Date().toISOString() : undefined
      })

      // Return updated transaction object
      return {
        ...transaksi,
        status: correctStatus,
        tglKembali: correctStatus === 'selesai' ? new Date().toISOString() : transaksi.tglKembali
      }
    }

    return transaksi
  } catch (error) {
    console.error('❌ AUTO-CORRECT RETURN: Failed to auto-correct return status', {
      transactionId: transaksi.id,
      transactionCode: transaksi.kode,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return transaksi
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await withRateLimit(`transaksi-get-${clientIP}`, 100, 60000)
    if (rateLimitResult.error) {
      return rateLimitResult.error
    }

    // Authentication and permission check
    const authResult = await requirePermission('transaksi', 'read')
    if (authResult.error) {
      return authResult.error
    }
    const { user } = authResult

    const { kode } = await params

    // Detect parameter type (UUID or transaction code)
    const paramType = TransactionCodeGenerator.detectParameterType(kode)
    
    if (paramType === 'invalid') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Parameter harus berupa kode transaksi (contoh: TXN-20250726-001) atau ID transaksi',
            code: 'VALIDATION_ERROR'
          }
        },
        { status: 400 }
      )
    }

    // Initialize transaksi service
    const transaksiService = new TransaksiService(prisma, user.id)

    // Get transaksi using appropriate method based on parameter type
    const transaksi = paramType === 'uuid' 
      ? await transaksiService.getTransaksiById(kode)
      : await transaksiService.getTransaksiByCode(kode)

    // ✅ AUTO-CORRECT STATUS: Update status based on actual pickup state
    // This ensures status is always accurate regardless of backend pickup service issues
    const correctedTransaksi = await autoCorrectTransactionStatus(transaksi, transaksiService)

    // Format response data using shared formatter (eliminates ~82 lines duplicate code)
    // Kasir information is now included directly from database (no Clerk API call needed)
    const formattedData = formatTransactionResponse(correctedTransaksi)

    return NextResponse.json(
      {
        success: true,
        data: formattedData,
        message: 'Detail transaksi berhasil diambil'
      },
      { status: 200 }
    )
  } catch (error) {
    const { kode } = await params
    
    // Comprehensive error logging with transaction context
    console.error('Transaction retrieval error', {
      level: 'error',
      endpoint: 'GET /api/kasir/transaksi/[kode]',
      transactionCode: kode,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      // Note: No Clerk API fallback - kasir info comes from database only
    })

    // Handle not found errors
    if (error instanceof Error && error.message.includes('tidak ditemukan')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Transaksi tidak ditemukan',
            code: 'NOT_FOUND'
          }
        },
        { status: 404 }
      )
    }

    // Handle database connection errors (no Clerk API fallback)
    if (error && typeof error === 'object' && 'message' in error && 
        typeof error.message === 'string' && error.message.includes('connection pool')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Database connection timeout. Please try again.',
            code: 'CONNECTION_ERROR'
          }
        },
        { status: 503 }
      )
    }

    // Generic server error (graceful degradation - no external API fallback)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR'
        }
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await withRateLimit(`transaksi-update-${clientIP}`, 10, 60000)
    if (rateLimitResult.error) {
      return rateLimitResult.error
    }

    // Authentication and permission check
    const authResult = await requirePermission('transaksi', 'update')
    if (authResult.error) {
      return authResult.error
    }
    const { user } = authResult

    const { kode } = await params

    // Detect parameter type (UUID or transaction code)
    const paramType = TransactionCodeGenerator.detectParameterType(kode)
    
    if (paramType === 'invalid') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Parameter harus berupa kode transaksi (contoh: TXN-20250726-001) atau ID transaksi',
            code: 'VALIDATION_ERROR'
          }
        },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate request data
    const validatedData = updateTransaksiSchema.parse(body)

    // Check if there's actually data to update
    if (Object.keys(validatedData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Tidak ada data untuk diperbarui',
            code: 'VALIDATION_ERROR'
          }
        },
        { status: 400 }
      )
    }

    // Initialize transaksi service with kasir from request body
    // ✅ UPDATED: Get kasirId from request body (manual selection)
    const kasirId = validatedData.kasirId || null
    
    // ✅ UPDATED: Add validation for paid transactions requiring kasir
    if (validatedData.status === 'cancelled') {
      const existingTransaksi = await prisma.transaksi.findUnique({
        where: paramType === 'uuid' ? { id: kode } : { kode },
        select: { jumlahBayar: true },
      })
      
      const isPaidTransaction = existingTransaksi && existingTransaksi.jumlahBayar.toNumber() > 0
      
      if (isPaidTransaction && !kasirId) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Kasir selection is required for paid transaction cancellation',
              code: 'KASIR_REQUIRED'
            }
          },
          { status: 400 }
        )
      }
    }
    
    // Create service with kasirId from request (needed for refund processing)
    const transaksiService = new TransaksiService(
      prisma, 
      user.id, 
      kasirId || undefined // Convert null to undefined for TypeScript
    )

    // Get current transaction using appropriate method
    const currentTransaksi = paramType === 'uuid' 
      ? await transaksiService.getTransaksiById(kode)
      : await transaksiService.getTransaksiByCode(kode)

    // Update transaksi status
    await transaksiService.updateTransaksiStatus(
      currentTransaksi.id, 
      validatedData
    )

    // Get updated transaction with full details
    const fullTransaksi = await transaksiService.getTransaksiById(currentTransaksi.id)

  // Format response data using shared formatter (eliminates ~82 lines duplicate code)
    const formattedData = formatTransactionResponse(fullTransaksi)

    return NextResponse.json(
      {
        success: true,
        data: formattedData,
        message: `Transaksi ${kode} berhasil diperbarui`
      },
      { status: 200 }
    )
  } catch (error) {
    const { kode } = await params
    console.error(`PUT /api/kasir/transaksi/${kode} error:`, error)

    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Data tidak valid',
            code: 'VALIDATION_ERROR',
            details: error.issues.map((err) => ({
              field: err.path.join('.'),
              message: err.message
            }))
          }
        },
        { status: 400 }
      )
    }

    // Handle business logic errors
    if (error instanceof Error) {
      // Not found error
      if (error.message.includes('tidak ditemukan')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Transaksi tidak ditemukan',
              code: 'NOT_FOUND'
            }
          },
          { status: 404 }
        )
      }

      // Status transition errors
      if (error.message.includes('Tidak dapat mengubah status')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: error.message,
              code: 'INVALID_STATUS_TRANSITION'
            }
          },
          { status: 409 }
        )
      }

      // ✅ NEW: Kasir-related errors for refund processing
      if (error.message.includes('KasirId diperlukan') || 
          error.message.includes('Kasir tidak ditemukan')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Kasir information required for refund processing. Please ensure you are logged in as an active kasir.',
              code: 'KASIR_REQUIRED'
            }
          },
          { status: 400 }
        )
      }

      // Other business logic errors
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: 'BUSINESS_ERROR'
          }
        },
        { status: 400 }
      )
    }

    // Handle database connection errors
    if (error && typeof error === 'object' && 'message' in error && 
        typeof error.message === 'string' && error.message.includes('connection pool')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Database connection timeout. Please try again.',
            code: 'CONNECTION_ERROR'
          }
        },
        { status: 503 }
      )
    }

    // Generic server error
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR'
        }
      },
      { status: 500 }
    )
  }
}