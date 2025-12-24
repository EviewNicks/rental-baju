/**
 * API Route: Professional Receipt PDF Generation
 * 
 * GET /api/kasir/receipt/[transaksiId]/pdf - Generate and return professional PDF receipt
 * 
 * Authentication: Clerk (kasir/owner roles)
 * Authorization: Requires 'transaksi' read permission
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TransaksiService } from '@/features/kasir/services/transaksiService'
import { ProfessionalReceiptService } from '@/features/kasir/services/professionalReceiptService'
import { requirePermission } from '@/lib/auth-middleware'
import { TransactionCodeGenerator } from '@/features/kasir/lib/utils/codeGenerator'

interface RouteParams {
  params: Promise<{
    transaksiId: string
  }>
}

/**
 * GET /api/kasir/receipt/[transaksiId]/pdf
 * Generate and return professional PDF receipt for a transaction
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing transaksiId
 * @returns PDF file as Response with appropriate headers
 * 
 * @throws 401 - Unauthorized if user lacks permission
 * @throws 404 - Not Found if transaction doesn't exist
 * @throws 500 - Internal Server Error if PDF generation fails
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
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

    // Initialize professional receipt service
    const professionalReceiptService = new ProfessionalReceiptService()
    
    // Generate professional PDF receipt
    const pdfBuffer = await professionalReceiptService.generateProfessionalReceiptPDF(transaksi)
    const filename = `professional-receipt-${transaksi.kode}.pdf`

    // Return PDF with appropriate headers
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    const { transaksiId } = await params
    
    // Comprehensive error logging with transaction context
    console.error('Professional receipt PDF generation error', {
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
          message: 'Failed to generate professional receipt',
          code: 'INTERNAL_ERROR'
        }
      },
      { status: 500 }
    )
  }
}
