/**
 * Response Formatter - Common response formatting utilities
 * Standardizes API response format and improves performance
 */

import { Penyewa } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    field?: string
    details?: Array<{
      field: string
      message: string
    }>
  }
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * Format Penyewa data for API response
 * Optimizes date serialization and removes sensitive fields
 */
export function formatPenyewaData(penyewa: Penyewa & { 
  transaksi?: Array<{
    id: string
    kode: string
    status: string
    totalHarga: number | Decimal
    createdAt: Date
  }>
}) {
  return {
    id: penyewa.id,
    nama: penyewa.nama,
    telepon: penyewa.telepon,
    alamat: penyewa.alamat,
    email: penyewa.email,
    nik: penyewa.nik,
    foto: penyewa.foto,
    catatan: penyewa.catatan,
    createdAt: penyewa.createdAt.toISOString(),
    updatedAt: penyewa.updatedAt.toISOString(),
    ...(penyewa.transaksi && {
      recentTransactions: penyewa.transaksi.map(t => ({
        id: t.id,
        kode: t.kode,
        status: t.status,
        totalHarga: Number(t.totalHarga),
        createdAt: t.createdAt.toISOString()
      }))
    })
  }
}

/**
 * Format Penyewa list for API response
 * Batch processes multiple records efficiently
 */
export function formatPenyewaList(penyewaList: Penyewa[]) {
  return penyewaList.map(penyewa => ({
    id: penyewa.id,
    nama: penyewa.nama,
    telepon: penyewa.telepon,
    alamat: penyewa.alamat,
    email: penyewa.email,
    nik: penyewa.nik,
    foto: penyewa.foto,
    catatan: penyewa.catatan,
    createdAt: penyewa.createdAt.toISOString(),
    updatedAt: penyewa.updatedAt.toISOString()
  }))
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message: string,
  status: number = 200
): { response: ApiResponse<T>; status: number } {
  return {
    response: {
      success: true,
      data,
      message
    },
    status
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  message: string,
  code: string,
  status: number = 400,
  field?: string,
  details?: Array<{ field: string; message: string }>
): { response: ApiResponse; status: number } {
  return {
    response: {
      success: false,
      error: {
        message,
        code,
        ...(field && { field }),
        ...(details && { details })
      }
    },
    status
  }
}