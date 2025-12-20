/**
 * API Route: Kasir Transaksi Management - RPK-26
 *
 * POST /api/kasir/transaksi - Create new transaction with auto code generation
 * GET /api/kasir/transaksi - Get paginated list of transactions with filters
 *
 * Authentication: Clerk (admin/kasir roles only)
 * Following existing patterns from manage-product feature
 * OPTIMIZED: Using serializers and response helpers for cleaner code
 */

import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { TransaksiService } from '@/features/kasir/services/transaksiService'
import {
  createTransaksiSchema,
  transaksiQuerySchema,
  type CreateTransaksiRequest,
} from '@/features/kasir/lib/validation/kasirSchema'
import { TransactionLogger } from '@/features/kasir/lib/logger/transactionLogger'
import {
  unauthorizedResponse,
  successResponse,
  handleTransaksiError,
} from '@/features/kasir/lib/api/responseHelpers'
import {
  serializeTransaksi,
  serializeTransaksiListItem,
} from '@/features/kasir/lib/serializers/transaksiSerializer'

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) return unauthorizedResponse()

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createTransaksiSchema.parse(body) as CreateTransaksiRequest

    // 🔍 DEBUG: Log API payload for kasir tracking (dev only)
    if (process.env.NODE_ENV === 'development') {
      TransactionLogger.logApiPayload(validatedData)
    }

    // Create transaction with enhanced discount and duration support
    const transaksiService = new TransaksiService(prisma, userId)
    const transaksi = await transaksiService.createTransaksiSizeAware(validatedData)

    // Serialize response using centralized serializer
    const formattedData = serializeTransaksi(transaksi)

    return successResponse(formattedData, `Transaksi ${transaksi.kode} berhasil dibuat`, 201)
  } catch (error) {
    return handleTransaksiError(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) return unauthorizedResponse()

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      penyewaId: searchParams.get('penyewaId') || undefined,
      dateStart: searchParams.get('dateStart') || undefined,
      dateEnd: searchParams.get('dateEnd') || undefined,
    }

    const validatedQuery = transaksiQuerySchema.parse(queryParams)

    // Get transaction list
    const transaksiService = new TransaksiService(prisma, userId)
    const result = await transaksiService.getTransaksiList(validatedQuery)

    // Serialize response using centralized serializer
    const formattedData = {
      data: result.data.map(serializeTransaksiListItem),
      pagination: result.pagination,
      summary: result.summary,
    }

    return successResponse(formattedData, 'Data transaksi berhasil diambil')
  } catch (error) {
    return handleTransaksiError(error)
  }
}
