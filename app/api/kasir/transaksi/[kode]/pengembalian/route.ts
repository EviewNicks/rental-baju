/**
 * API Route: Transaction Return Processing - TSK-23
 * 
 * PUT /api/kasir/transaksi/[kode]/pengembalian - Process transaction return
 * 
 * Authentication: Clerk (kasir/owner roles only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ReturnService } from '@/features/kasir/services/returnService'
import { returnRequestSchema } from '@/features/kasir/lib/validation/returnSchema'
import { TransactionCodeGenerator } from '@/features/kasir/lib/utils/codeGenerator'
import { ZodError } from 'zod'
import { requirePermission, withRateLimit } from '@/lib/auth-middleware'

interface RouteParams {
  params: Promise<{
    kode: string
  }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await withRateLimit(`return-${clientIP}`, 10, 60000)
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

    // Parse and validate request body
    const body = await request.json()
    const validatedData = returnRequestSchema.parse(body)

    // Initialize return service
    const returnService = new ReturnService(prisma, user.id)

    // Get transaction ID based on parameter type
    let transaksiId: string
    if (paramType === 'uuid') {
      transaksiId = kode
    } else {
      // Get transaction by code to obtain ID
      const transaction = await returnService.getReturnTransactionByCode(kode)
      transaksiId = transaction.id
    }

    // Validate return eligibility
    const eligibility = await returnService.validateReturnEligibility(transaksiId)
    if (!eligibility.isEligible) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: eligibility.reason || 'Transaksi tidak memenuhi syarat untuk pengembalian',
            code: 'RETURN_NOT_ELIGIBLE',
            details: eligibility.eligibilityDetails
          }
        },
        { status: 400 }
      )
    }

    // Validate return items
    const itemValidation = await returnService.validateReturnItems(transaksiId, validatedData.items)
    if (!itemValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Data pengembalian tidak valid',
            code: 'VALIDATION_ERROR',
            details: itemValidation.errors
          }
        },
        { status: 400 }
      )
    }

    // Process the return
    const result = await returnService.processReturn(transaksiId, validatedData)

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          transaksiId: result.transaksiId,
          totalPenalty: result.totalPenalty,
          processedItems: result.processedItems,
          updatedTransaction: result.updatedTransaction,
          penaltyBreakdown: result.penaltyCalculation ? {
            totalLateDays: result.penaltyCalculation.totalLateDays,
            summary: result.penaltyCalculation.summary,
            itemDetails: result.penaltyCalculation.itemPenalties.map(penalty => ({
              itemId: penalty.itemId,
              productName: penalty.productName,
              lateDays: penalty.lateDays,
              penalty: penalty.totalPenalty,
              reason: penalty.description
            }))
          } : null
        },
        message: `Pengembalian berhasil diproses untuk transaksi ${kode}. Total penalty: Rp ${result.totalPenalty.toLocaleString('id-ID')}`
      },
      { status: 200 }
    )
  } catch (error) {
    const { kode } = await params
    console.error(`PUT /api/kasir/transaksi/${kode}/pengembalian error:`, error)

    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Data pengembalian tidak valid',
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
      // Transaction not found
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

      // Return eligibility errors
      if (error.message.includes('tidak memenuhi syarat') || error.message.includes('kelayakan')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: error.message,
              code: 'RETURN_NOT_ELIGIBLE'
            }
          },
          { status: 400 }
        )
      }

      // Return processing errors
      if (error.message.includes('Gagal memproses pengembalian')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: error.message,
              code: 'RETURN_PROCESSING_ERROR'
            }
          },
          { status: 400 }
        )
      }

      // Validation errors
      if (error.message.includes('Validasi item gagal')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: error.message,
              code: 'ITEM_VALIDATION_ERROR'
            }
          },
          { status: 400 }
        )
      }

      // Penalty calculation errors
      if (error.message.includes('Gagal menghitung penalty')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: error.message,
              code: 'PENALTY_CALCULATION_ERROR'
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