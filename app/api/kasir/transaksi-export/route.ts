// GET /api/kasir/transaksi-export
// Export data transaksi + customer info ke CSV format
//
// BERBEDA dari /api/kasir/dana-export:
//   dana-export        → laporan keuangan (Pendapatan/Pengeluaran/Penalty per event keuangan)
//   transaksi-export   → data customer (1 baris per transaksi, ada No. HP, Alamat, Jumlah Item)
//
// Authorization: Owner only (sama dengan dana-export)
//
// Query Parameters:
//   startDate: YYYY-MM-DD (required)
//   endDate:   YYYY-MM-DD (required)
//
// Response: CSV file download
// Content-Disposition: attachment; filename="transaksi-YYYY-MM-DD[-to-YYYY-MM-DD].csv"

import { NextRequest, NextResponse } from 'next/server'
import { requireDanaKasirExport } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { TransactionExportService } from '@/features/dana-kasir/services/transactionExportService'
import { ApiResponse } from '@/features/dana-kasir/types'

export async function GET(request: NextRequest) {
  try {
    // Authorization: Owner only
    const authResult = await requireDanaKasirExport()
    if (authResult.error) return authResult.error

    const searchParams = request.nextUrl.searchParams
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    // Validate required params
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

    // Validate date range order
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

    // Validate max range: 365 days
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
    const exportService = new TransactionExportService(prisma)
    const csvContent = await exportService.generateCSV(startDate, endDate)
    const filename = exportService.generateFilename(startDate, endDate)

    // Return CSV file with proper headers and UTF-8 BOM (\uFEFF)
    // BOM memberitahu Excel untuk menggunakan UTF-8 decoder secara otomatis
    const bomCsvContent = `\uFEFF${csvContent}`

    return new NextResponse(bomCsvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Transaction CSV Export Error:', error)

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

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: {
          message: 'Terjadi kesalahan saat mengekspor data transaksi',
          code: 'INTERNAL_ERROR',
        },
      },
      { status: 500 },
    )
  }
}
