/**
 * API Route: Individual Payment Operations - RPK-26
 * 
 * GET /api/kasir/pembayaran/[id] - Get payment by ID
 * DELETE /api/kasir/pembayaran/[id] - Cancel/reverse payment (admin only)
 * 
 * Authentication: Clerk (admin/kasir roles only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PembayaranService } from '@/features/kasir/services/pembayaranService'
import { requirePermission, requireAdminAccess, withRateLimit } from '@/lib/auth-middleware'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  // Extract params outside try block for error logging
  const { id } = await params
  
  try {
    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await withRateLimit(`payment-get-${clientIP}`, 100, 60000)
    if (rateLimitResult.error) {
      return rateLimitResult.error
    }

    // Authentication and permission check
    const authResult = await requirePermission('pembayaran', 'read')
    if (authResult.error) {
      return authResult.error
    }
    const { user } = authResult

    // Validate ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'ID pembayaran tidak valid',
            code: 'INVALID_ID'
          }
        },
        { status: 400 }
      )
    }

    // Initialize payment service
    const pembayaranService = new PembayaranService(prisma, user.id, user.role)

    // Get payment by ID
    const pembayaran = await pembayaranService.getPembayaranById(id)

    // Format response data
    const formattedData = {
      id: pembayaran.id,
      transaksi: {
        id: pembayaran.transaksi.id,
        kode: pembayaran.transaksi.kode,
        penyewa: {
          nama: pembayaran.transaksi.penyewa.nama,
          telepon: pembayaran.transaksi.penyewa.telepon
        },
        totalHarga: Number(pembayaran.transaksi.totalHarga),
        jumlahBayar: Number(pembayaran.transaksi.jumlahBayar),
        sisaBayar: Number(pembayaran.transaksi.sisaBayar),
        status: pembayaran.transaksi.status
      },
      jumlah: Number(pembayaran.jumlah),
      metode: pembayaran.metode,
      referensi: pembayaran.referensi,
      catatan: pembayaran.catatan,
      createdBy: pembayaran.createdBy,
      createdAt: pembayaran.createdAt.toISOString()
    }

    return NextResponse.json(
      {
        success: true,
        data: formattedData,
        message: 'Data pembayaran berhasil diambil'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(`GET /api/kasir/pembayaran/${id} error:`, error)

    // Handle not found errors
    if (error instanceof Error && error.message.includes('tidak ditemukan')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: 'NOT_FOUND'
          }
        },
        { status: 404 }
      )
    }

    // Generic server error
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR'
        }
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  // Extract params outside try block for error logging
  const { id } = await params
  
  try {
    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await withRateLimit(`payment-delete-${clientIP}`, 10, 60000)
    if (rateLimitResult.error) {
      return rateLimitResult.error
    }

    // Authentication and admin permission check (only admin can cancel payments)
    const authResult = await requireAdminAccess()
    if (authResult.error) {
      return authResult.error
    }
    const { user } = authResult

    // Validate ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'ID pembayaran tidak valid',
            code: 'INVALID_ID'
          }
        },
        { status: 400 }
      )
    }

    // Parse request body for cancellation reason
    let reason = 'Dibatalkan oleh admin'
    try {
      const body = await request.json()
      if (body.reason && typeof body.reason === 'string') {
        reason = body.reason
      }
    } catch {
      // If no body or invalid JSON, use default reason
    }

    // Initialize payment service
    const pembayaranService = new PembayaranService(prisma, user.id, user.role)

    // Cancel payment
    await pembayaranService.cancelPayment(id, reason)

    return NextResponse.json(
      {
        success: true,
        message: 'Pembayaran berhasil dibatalkan'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(`DELETE /api/kasir/pembayaran/${id} error:`, error)

    // Handle business logic errors
    if (error instanceof Error) {
      // Not found
      if (error.message.includes('tidak ditemukan')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: error.message,
              code: 'NOT_FOUND'
            }
          },
          { status: 404 }
        )
      }

      // Business rule violations
      if (error.message.includes('tidak dapat') || 
          error.message.includes('sudah dibatalkan')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: error.message,
              code: 'BUSINESS_ERROR'
            }
          },
          { status: 409 }
        )
      }

      // Other business logic errors
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: 'BUSINESS_ERROR'
          }
        },
        { status: 400 }
      )
    }

    // Generic server error
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR'
        }
      },
      { status: 500 }
    )
  }
}