/**
 * API Route: Ubah Tanggal Sewa Transaksi (Reschedule)
 * PATCH /api/kasir/transaksi/[kode]/ubah-tanggal
 *
 * Menggeser jadwal sewa tanpa membatalkan transaksi aktif.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TransaksiService } from '@/features/kasir/services/transaksiService'
import { ubahTanggalRequestSchema } from '@/features/kasir/lib/validation/kasirSchema'
import { requirePermission, withRateLimit } from '@/lib/auth-middleware'

interface RouteParams {
  params: Promise<{
    kode: string
  }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { kode } = await params
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'

    // 1. Rate limiting check
    const rateLimitResult = await withRateLimit(`transaksi-ubah-tanggal-${clientIP}`, 40, 60000)
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
    const validation = ubahTanggalRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validasi data perubahan tanggal gagal',
          error: {
            code: 'VALIDATION_ERROR',
            details: validation.error.flatten(),
          },
        },
        { status: 400 },
      )
    }

    const { tglMulai, tglSelesai, durasi, catatan } = validation.data

    // 4. Inisialisasi TransaksiService
    const transaksiService = new TransaksiService(prisma, user.id)

    // 5. Eksekusi pengubahan jadwal sewa
    const result = await transaksiService.ubahTanggalSewaTransaksi({
      transactionCode: kode,
      tglMulai,
      tglSelesai,
      durasi,
      kasirId: user.id,
      catatan,
    })

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: 'Jadwal sewa berhasil diperbarui',
      },
      { status: 200 },
    )
  } catch (error) {
    const { kode } = await params
    console.error('❌ Gagal mengubah tanggal sewa:', {
      endpoint: 'PATCH /api/kasir/transaksi/[kode]/ubah-tanggal',
      transactionCode: kode,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : 'Terjadi kesalahan sistem saat mengubah tanggal sewa',
        error: {
          code: 'RESCHEDULE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 400 },
    )
  }
}
