// Dana Kasir Management - Expense CRUD API Endpoints
// GET and POST handlers for expense management

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'
import { PengeluaranService } from '@/features/dana-kasir/services'
import { validateDateQuery, validateCreatePengeluaran } from '@/features/dana-kasir/validation'
import { getCurrentWITADate } from '@/features/dana-kasir/utils/timezone'

const prisma = new PrismaClient()

/**
 * GET /api/kasir/pengeluaran
 * 
 * Get expenses for a specific date
 * Query params: date (optional, defaults to today)
 * Auth: Kasir (read), Owner (read)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    
    // Validate and parse date
    let queryDate: Date
    if (dateParam) {
      const dateValidation = validateDateQuery({ date: dateParam })
      if (!dateValidation.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Invalid date format',
              code: 'VALIDATION_ERROR',
              details: dateValidation.error?.issues.map((issue: any) => ({
                field: issue.path.join('.'),
                message: issue.message,
                code: issue.code
              }))
            }
          },
          { status: 400 }
        )
      }
      queryDate = dateValidation.data.date || getCurrentWITADate()
    } else {
      queryDate = getCurrentWITADate()
    }

    // Get user's kasir ID (for now, we'll use userId as kasirId)
    // TODO: In production, get actual kasirId from user profile
    const kasirId = userId

    // Create service instance
    const pengeluaranService = new PengeluaranService(prisma, userId, kasirId)

    // Get expenses for the date
    const expenses = await pengeluaranService.getByDate(queryDate)

    return NextResponse.json({
      success: true,
      data: expenses
    })

  } catch (error) {
    console.error('Error fetching expenses:', error)
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
 * POST /api/kasir/pengeluaran
 * 
 * Create a new expense record
 * Body: { harga, kategori, deskripsi }
 * Auth: Kasir (write only)
 */
export async function POST(request: NextRequest) {
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
    // For now, we'll assume all authenticated users can create expenses
    // In production, add role checking:
    // const user = await getUserProfile(userId)
    // if (user.role !== 'kasir') {
    //   return NextResponse.json(
    //     { success: false, error: { message: 'Forbidden', code: 'FORBIDDEN' } },
    //     { status: 403 }
    //   )
    // }

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
    const validation = validateCreatePengeluaran(requestBody)
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

    // Create expense
    const expense = await pengeluaranService.create(validation.data)

    return NextResponse.json(
      {
        success: true,
        data: expense
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error creating expense:', error)
    
    // Handle validation errors from service
    if (error instanceof Error && error.message.includes('Validation failed')) {
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
