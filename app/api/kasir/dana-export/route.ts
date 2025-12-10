// Dana Kasir Management - CSV Export API Endpoint
// GET /api/kasir/dana-export - Export income and expense data to CSV

import { NextRequest, NextResponse } from 'next/server'
import { requireDanaKasirExport } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { CSVExportService } from '@/features/dana-kasir/services/csvExportService'
import { ApiResponse } from '@/features/dana-kasir/types'

/**
 * GET /api/kasir/dana-export
 *
 * Export income and expense data to CSV format
 *
 * Query Parameters:
 * - startDate: Start date in YYYY-MM-DD format (required)
 * - endDate: End date in YYYY-MM-DD format (required)
 *
 * Authorization:
 * - Owner role required (read-only access)
 *
 * Response:
 * - CSV file download with proper headers
 * - Filename format: dana-kasir-YYYY-MM-DD-to-YYYY-MM-DD.csv
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 6.4
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize user (Owner role required)
    const authResult = await requireDanaKasirExport()
    if (authResult.error) {
      return authResult.error
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    // Validate required parameters
    if (!startDateParam || !endDateParam) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: {
            message: 'Parameter startDate dan endDate harus diisi',
            code: 'MISSING_PARAMETERS',
          },
        },
        { status: 400 },
      )
    }

    // Parse dates
    const startDate = new Date(startDateParam)
    const endDate = new Date(endDateParam)

    // Validate date format
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: {
            message: 'Format tanggal tidak valid. Gunakan format YYYY-MM-DD',
            code: 'INVALID_DATE_FORMAT',
          },
        },
        { status: 400 },
      )
    }

    // Validate date range
    if (startDate > endDate) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: {
            message: 'Tanggal mulai harus lebih kecil atau sama dengan tanggal akhir',
            code: 'INVALID_DATE_RANGE',
          },
        },
        { status: 400 },
      )
    }

    // Validate date range is not too large (max 1 year)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff > 365) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: {
            message: 'Rentang tanggal maksimal 1 tahun (365 hari)',
            code: 'DATE_RANGE_TOO_LARGE',
          },
        },
        { status: 400 },
      )
    }

    // Generate CSV
    const csvService = new CSVExportService(prisma)
    const csvContent = await csvService.generateCSV(startDate, endDate)
    const filename = csvService.generateFilename(startDate, endDate)

    // Return CSV file with proper headers
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('CSV Export Error:', error)

    // Handle authorization errors
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: {
            message:
              error.message === 'Unauthorized'
                ? 'Anda harus login terlebih dahulu'
                : 'Hanya Owner yang dapat mengekspor data',
            code: error.message === 'Unauthorized' ? 'UNAUTHORIZED' : 'FORBIDDEN',
          },
        },
        { status: error.message === 'Unauthorized' ? 401 : 403 },
      )
    }

    // Handle database errors
    if (error.code === 'P2002' || error.code === 'P2025') {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: {
            message: 'Terjadi kesalahan database',
            code: 'DATABASE_ERROR',
          },
        },
        { status: 500 },
      )
    }

    // Generic error response
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: {
          message: 'Terjadi kesalahan saat mengekspor data',
          code: 'INTERNAL_ERROR',
        },
      },
      { status: 500 },
    )
  }
}
