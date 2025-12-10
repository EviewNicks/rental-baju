// Dana Kasir Management - Dana Summary API Endpoint
// GET handler for daily summary with income and expense data

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'
import { DanaSummaryService } from '@/features/dana-kasir/services'
import { validateDateQuery } from '@/features/dana-kasir/validation'
import { getCurrentWITADate } from '@/features/dana-kasir/utils/timezone'

const prisma = new PrismaClient()

/**
 * GET /api/kasir/dana-summary
 * 
 * Get daily summary with income, expenses, and net balance
 * Query params: date (optional, defaults to today)
 * Auth: Kasir (read), Owner (read)
 * 
 * Returns:
 * {
 *   summary: { totalIncome, totalExpense, netBalance, date },
 *   income: IncomeItem[],
 *   expenses: PengeluaranKasir[]
 * }
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

    // Create service instance
    const danaSummaryService = new DanaSummaryService(prisma)

    // Get complete daily data (summary + income + expenses)
    const dailyData = await danaSummaryService.getDailyData(queryDate)

    return NextResponse.json({
      success: true,
      data: {
        summary: dailyData.summary,
        income: dailyData.income,
        expenses: dailyData.expenses
      }
    })

  } catch (error) {
    console.error('Error fetching dana summary:', error)
    
    // Handle specific errors
    if (error instanceof Error) {
      // Database connection errors
      if (error.message.includes('database') || error.message.includes('connection')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Database connection error',
              code: 'DATABASE_ERROR'
            }
          },
          { status: 503 }
        )
      }
      
      // Prisma query errors
      if (error.message.includes('Prisma')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Database query error',
              code: 'QUERY_ERROR'
            }
          },
          { status: 500 }
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
