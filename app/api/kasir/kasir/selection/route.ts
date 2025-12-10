/**
 * API Route: Kasir Selection - Limited Access for Transaction Assignment
 *
 * GET /api/kasir/kasir/selection - Get kasir list for transaction assignment
 * Role-based filtering: Kasir role gets limited data (no PII)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { KasirService } from '@/features/kasir/services/kasirService'
import { requirePermission, withRateLimit } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await withRateLimit(`kasir-selection-${clientIP}`, 60, 60000)
    if (rateLimitResult.error) {
      return rateLimitResult.error
    }

    // Authentication and permission check
    const authResult = await requirePermission('kasir', 'read')
    if (authResult.error) {
      return authResult.error
    }
    const { user } = authResult

    // Initialize kasir service
    const kasirService = new KasirService(prisma, user.id, user.role)

    // Get kasir list for selection
    const kasirList = await kasirService.getKasirForSelection()

    // Return response
    return NextResponse.json({
      success: true,
      data: kasirList,
      message: 'Daftar kasir untuk seleksi transaksi berhasil diambil',
    })
  } catch (error) {
    console.error('GET /api/kasir/kasir/selection error:', error)

    // Handle database connection errors
    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string' &&
      error.message.includes('connection pool')
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Database connection timeout. Please try again.',
            code: 'CONNECTION_ERROR',
          },
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
          code: 'INTERNAL_ERROR',
        },
      },
      { status: 500 }
    )
  }
}