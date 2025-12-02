// Dana Kasir Management - Expense Update/Delete API Endpoints
// PUT and DELETE handlers for individual expense records

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'
import { PengeluaranService } from '@/features/dana-kasir/services'
import { validateUpdatePengeluaran } from '@/features/dana-kasir/validation'

const prisma = new PrismaClient()

/**
 * PUT /api/kasir/pengeluaran/[id]
 * 
 * Update an existing expense record
 * Body: { harga?, kategori?, deskripsi? }
 * Auth: Kasir (write only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    // TODO: Check user has Kasir role
    // For now, we'll assume all authenticated users can update expenses
    // In production, add role checking

    const { id } = params
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Expense ID is required',
            code: 'VALIDATION_ERROR'
          }
        },
        { status: 400 }
      )
    }

    // Parse request body
    let requestBody
    try {
      requestBody = await request.json()
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid JSON in request body',
            code: 'VALIDATION_ERROR'
          }
        },
        { status: 400 }
      )
    }

    // Validate request body
    const validation = validateUpdatePengeluaran(requestBody)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: validation.error?.issues.map((issue: any) => ({
              field: issue.path.join('.'),
              message: issue.message,
              code: issue.code
            }))
          }
        },
        { status: 400 }
      )
    }

    // Get user's kasir ID (for now, we'll use userId as kasirId)
    const kasirId = userId

    // Create service instance
    const pengeluaranService = new PengeluaranService(prisma, userId, kasirId)

    // Update expense
    const expense = await pengeluaranService.update(id, validation.data)

    return NextResponse.json({
      success: true,
      data: expense
    })

  } catch (error) {
    console.error('Error updating expense:', error)
    
    // Handle specific service errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Expense not found',
              code: 'NOT_FOUND'
            }
          },
          { status: 404 }
        )
      }
      
      if (error.message.includes('not authorized')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Not authorized to update this expense',
              code: 'FORBIDDEN'
            }
          },
          { status: 403 }
        )
      }
      
      if (error.message.includes('Validation failed')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: error.message,
              code: 'VALIDATION_ERROR'
            }
          },
          { status: 400 }
        )
      }
    }

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

/**
 * DELETE /api/kasir/pengeluaran/[id]
 * 
 * Soft delete an expense record
 * Auth: Kasir (write only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    // TODO: Check user has Kasir role
    // For now, we'll assume all authenticated users can delete expenses
    // In production, add role checking

    const { id } = params
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Expense ID is required',
            code: 'VALIDATION_ERROR'
          }
        },
        { status: 400 }
      )
    }

    // Get user's kasir ID (for now, we'll use userId as kasirId)
    const kasirId = userId

    // Create service instance
    const pengeluaranService = new PengeluaranService(prisma, userId, kasirId)

    // Soft delete expense
    await pengeluaranService.softDelete(id)

    return NextResponse.json({
      success: true,
      message: 'Expense deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting expense:', error)
    
    // Handle specific service errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Expense not found or already deleted',
              code: 'NOT_FOUND'
            }
          },
          { status: 404 }
        )
      }
      
      if (error.message.includes('not authorized')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Not authorized to delete this expense',
              code: 'FORBIDDEN'
            }
          },
          { status: 403 }
        )
      }
    }

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
