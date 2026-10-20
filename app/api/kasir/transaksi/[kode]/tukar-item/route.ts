/**
 * API Route: Tukar Item Transaksi - TSK Tukar Baju / Ukuran
 * POST /api/kasir/transaksi/[kode]/tukar-item
 *
 * Mengganti ukuran atau produk dalam transaksi aktif tanpa membatalkan transaksi.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TransaksiService } from '@/features/kasir/services/transaksiService'
import { tukarItemRequestSchema } from '@/features/kasir/lib/validation/kasirSchema'
import { requirePermission, withRateLimit } from '@/lib/auth-middleware'

interface RouteParams {
  params: Promise<{
    kode: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { kode } = await params
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'

    // 1. Rate limiting check
    const rateLimitResult = await withRateLimit(`transaksi-tukar-item-${clientIP}`, 40, 60000)
    if (rateLimitResult.error) {
      return rateLimitResult.error
    }

    // 2. Authentication & permission check
    const authResult = await requirePermission('transaksi', 'update')
    if (authResult.error) {
      return authResult.error
    }
    const { user } = authResult

    // 3. Parse & validate request body
    const body = await request.json()
    const validation = tukarItemRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validasi data penukaran gagal',
          error: {
            code: 'VALIDATION_ERROR',
            details: validation.error.flatten(),
          },
        },
        { status: 400 },
      )
    }

    const { transaksiItemId, newItem, financialAdjustment, catatan } = validation.data

    // 4. Inisialisasi TransaksiService
    const transaksiService = new TransaksiService(prisma, user.id)

    // 5. Eksekusi penukaran item
    const result = await transaksiService.tukarItemTransaksi({
      transactionCode: kode,
      transaksiItemId,
      newItem,
      financialAdjustment,
      kasirId: user.id,
      catatan,
    })

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: 'Baju / ukuran berhasil ditukar',
      },
      { status: 200 },
    )
  } catch (error) {
    const { kode } = await params
    console.error('❌ Gagal melakukan penukaran baju:', {
      endpoint: 'POST /api/kasir/transaksi/[kode]/tukar-item',
      transactionCode: kode,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Terjadi kesalahan sistem saat menukar baju',
        error: {
          code: 'SWAP_ITEM_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 400 },
    )
  }
}
