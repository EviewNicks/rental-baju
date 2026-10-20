/**
 * API Route: Tukar Sarung Pairing (Sarung Gratis)
 * POST /api/kasir/transaksi/[kode]/tukar-sarung
 *
 * Mengganti sarung gratis pasangan jas tanpa biaya tambahan (Rp 0).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TransaksiService } from '@/features/kasir/services/transaksiService'
import { tukarSarungRequestSchema } from '@/features/kasir/lib/validation/kasirSchema'
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
    const rateLimitResult = await withRateLimit(`transaksi-tukar-sarung-${clientIP}`, 40, 60000)
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
    const validation = tukarSarungRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validasi data penukaran sarung gagal',
          error: {
            code: 'VALIDATION_ERROR',
            details: validation.error.flatten(),
          },
        },
        { status: 400 },
      )
    }

    const { parentTransaksiItemId, newSarung, catatan } = validation.data

    // 4. Inisialisasi TransaksiService
    const transaksiService = new TransaksiService(prisma, user.id)

    // 5. Eksekusi penukaran sarung
    const result = await transaksiService.tukarSarungPairingTransaksi({
      transactionCode: kode,
      parentTransaksiItemId,
      newSarung,
      kasirId: user.id,
      catatan,
    })

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: 'Sarung pasangan berhasil ditukar',
      },
      { status: 200 },
    )
  } catch (error) {
    const { kode } = await params
    console.error('❌ Gagal melakukan penukaran sarung:', {
      endpoint: 'POST /api/kasir/transaksi/[kode]/tukar-sarung',
      transactionCode: kode,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Terjadi kesalahan sistem saat menukar sarung',
        error: {
          code: 'SWAP_SARUNG_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 400 },
    )
  }
}
