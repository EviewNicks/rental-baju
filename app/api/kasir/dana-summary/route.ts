// Dana Kasir Management - Dana Summary API Endpoint
// GET handler for daily summary with income and expense data

import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'
import { DanaSummaryService } from '@/features/dana-kasir/services'
import { validateDateQuery } from '@/features/dana-kasir/validation'
import { getCurrentWITADate } from '@/features/dana-kasir/utils/timezone'
import { getKasirFromUser } from '@/features/kasir/lib/utils/kasirHelper'

const prisma = new PrismaClient()

/**
 * GET /api/kasir/dana-summary
 *
 * Role-based expense visibility system:
 * - Kasir: Can only see expenses from other kasir (kasirId != "owner-system")
 * - Owner: Can see all expenses with optional kasir filter
 *
 * Query params:
 *   - date (optional, defaults to today)
 *   - kasirId (optional, filter by specific kasir)
 * Auth: Any authenticated user with kasir/owner role
 *
 * Returns:
 * {
 *   summary: { totalIncome, totalExpense, netBalance, date },
 *   income: IncomeItem[],
 *   expenses: PengeluaranKasir[]
 * }
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  const auditData: any = {
    endpoint: '/api/kasir/dana-summary',
    method: 'GET',
    timestamp: new Date().toISOString(),
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
  }

  try {
    const { userId } = await auth()
    auditData.userId = userId

    if (!userId) {
      auditData.error = 'No userId from auth()'
      auditData.duration = Date.now() - startTime
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
    }
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const userRole = (user.publicMetadata.role as string) || 'kasir'

    auditData.userRole = userRole
    auditData.userEmail = user.emailAddresses[0]?.emailAddress

    // Determine user's kasirId with detailed logging
    let userKasirId: string
    if (userRole === 'owner') {
      userKasirId = 'owner-system'
      auditData.kasirId = userKasirId
      auditData.kasirSource = 'owner-role'
    } else {
      try {
        const kasirInfo = await getKasirFromUser(prisma, userId)
        auditData.kasirLookupResult = kasirInfo

        if (!kasirInfo) {
          auditData.error = 'Kasir not found in database'
          auditData.duration = Date.now() - startTime
          console.error('❌ [AUDIT] Kasir not found for user:', auditData)

          return NextResponse.json(
            {
              success: false,
              error: { message: 'Kasir not found for user', code: 'KASIR_NOT_FOUND' },
            },
            { status: 403 },
          )
        }

        userKasirId = kasirInfo.id
        auditData.kasirId = userKasirId
        auditData.kasirName = kasirInfo.nama
        auditData.kasirSource = 'database-lookup'
      } catch (kasirError) {
        auditData.error = 'Database error during kasir lookup'
        auditData.kasirError = kasirError instanceof Error ? kasirError.message : String(kasirError)
        auditData.duration = Date.now() - startTime

        return NextResponse.json(
          {
            success: false,
            error: { message: 'Database error during kasir lookup', code: 'DATABASE_ERROR' },
          },
          { status: 500 },
        )
      }
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const kasirIdParam = searchParams.get('kasirId')

    auditData.queryParams = { date: dateParam, kasirId: kasirIdParam }

    // Validate and parse date
    let queryDate: Date
    if (dateParam) {
      const dateValidation = validateDateQuery({ date: dateParam })
      if (!dateValidation.success) {
        auditData.error = 'Invalid date format'
        auditData.validationErrors = dateValidation.error?.issues
        auditData.duration = Date.now() - startTime

        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Invalid date format',
              code: 'VALIDATION_ERROR',
              details: dateValidation.error?.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
                code: issue.code,
              })),
            },
          },
          { status: 400 },
        )
      }
      queryDate = dateValidation.data.date || getCurrentWITADate()
    } else {
      queryDate = getCurrentWITADate()
    }

    auditData.processedDate = queryDate.toISOString()

    // Create service instance and fetch data
    const danaSummaryService = new DanaSummaryService(prisma)

    const serviceStartTime = Date.now()
    const dailyData = await danaSummaryService.getDailyDataWithRoleFilter(
      queryDate,
      userRole as 'kasir' | 'owner',
      userKasirId,
      kasirIdParam || undefined,
    )
    const serviceEndTime = Date.now()

    auditData.serviceCallDuration = serviceEndTime - serviceStartTime
    auditData.resultCounts = {
      incomeItems: dailyData.income.length,
      expenseItems: dailyData.expenses.length,
      totalIncome: dailyData.summary.totalIncome,
      totalExpense: dailyData.summary.totalExpense,
    }
    auditData.duration = Date.now() - startTime
    auditData.success = true

    return NextResponse.json({
      success: true,
      data: {
        summary: dailyData.summary,
        income: dailyData.income,
        expenses: dailyData.expenses,
      },
    })
  } catch (error) {
    auditData.error = 'Unexpected server error'
    auditData.errorDetails = error instanceof Error ? error.message : String(error)
    auditData.errorStack = error instanceof Error ? error.stack : undefined
    auditData.duration = Date.now() - startTime

    console.error('💥 [AUDIT] Unexpected error occurred:', auditData)
    console.error('Error details:', error)

    // Handle specific errors
    if (error instanceof Error) {
      // Database connection errors
      if (error.message.includes('database') || error.message.includes('connection')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Database connection error',
              code: 'DATABASE_ERROR',
            },
          },
          { status: 503 },
        )
      }

      // Prisma query errors
      if (error.message.includes('Prisma')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Database query error',
              code: 'QUERY_ERROR',
            },
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
      },
      { status: 500 },
    )
  }
}
