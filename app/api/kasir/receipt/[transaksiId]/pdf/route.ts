/**
 * API Route: Receipt PDF Generation
 * 
 * GET /api/kasir/receipt/[transaksiId]/pdf - Generate and return PDF receipt
 * 
 * Authentication: Clerk (kasir/owner roles)
 * Authorization: Requires 'transaksi' read permission
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TransaksiService } from '@/features/kasir/services/transaksiService'
import { ReceiptService } from '@/features/kasir/services/receiptService'
import { requirePermission } from '@/lib/auth-middleware'
import { TransactionCodeGenerator } from '@/features/kasir/lib/utils/codeGenerator'

interface RouteParams {
  params: Promise<{
    transaksiId: string
  }>
}

/**
 * GET /api/kasir/receipt/[transaksiId]/pdf
 * Generate and return PDF receipt for a transaction
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing transaksiId
 * @returns PDF file as Response with appropriate headers
 * 
 * @throws 401 - Unauthorized if user lacks permission
 * @throws 404 - Not Found if transaction doesn't exist
 * @throws 500 - Internal Server Error if PDF generation fails
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Authentication and permission check
    const authResult = await requirePermission('transaksi', 'read')
    if (authResult.error) {
      return authResult.error
    }
    const { user } = authResult

    const { transaksiId } = await params

    // Detect parameter type (UUID or transaction code)
    const paramType = TransactionCodeGenerator.detectParameterType(transaksiId)
    
    if (paramType === 'invalid') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Parameter harus berupa kode transaksi (contoh: TXN-20251201-002) atau ID transaksi',
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
      ? await transaksiService.getTransaksiById(transaksiId)
      : await transaksiService.getTransaksiByCode(transaksiId)

    // Initialize receipt service
    const receiptService = new ReceiptService()

    // Generate PDF receipt
    const pdfBuffer = await receiptService.generateReceiptPDF(transaksi)

    // Return PDF with appropriate headers
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="receipt-${transaksi.kode}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    const { transaksiId } = await params
    
    // Comprehensive error logging with transaction context
    console.error('Receipt PDF generation error', {
      level: 'error',
      endpoint: 'GET /api/kasir/receipt/[transaksiId]/pdf',
      transactionId: transaksiId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
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
          message: 'Failed to generate receipt',
          code: 'INTERNAL_ERROR'
        }
      },
      { status: 500 }
    )
  }
}
