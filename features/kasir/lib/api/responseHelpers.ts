/**
 * API Response Helpers
 * Centralized response formatting for consistent API responses
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { createSuccessResponse } from '../../types'

export function unauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,
      error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
    },
    { status: 401 },
  )
}

export function successResponse(data: unknown, message = 'Success', statusCode = 200) {
  const { response, status } = createSuccessResponse(data, message, statusCode)
  return NextResponse.json(response, { status })
}

export function validationErrorResponse(error: ZodError) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'Data tidak valid',
        code: 'VALIDATION_ERROR',
        details: error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      },
    },
    { status: 400 },
  )
}

export function notFoundResponse(message: string) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code: 'NOT_FOUND',
      },
    },
    { status: 404 },
  )
}

export function businessErrorResponse(message: string, code = 'BUSINESS_ERROR') {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
      },
    },
    { status: 400 },
  )
}

export function availabilityErrorResponse(message: string) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code: 'AVAILABILITY_ERROR',
      },
    },
    { status: 409 },
  )
}

export function connectionErrorResponse() {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'Database connection timeout. Please try again.',
        code: 'CONNECTION_ERROR',
      },
    },
    { status: 503 },
  )
}

export function internalErrorResponse() {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    },
    { status: 500 },
  )
}

/**
 * Unified error handler for transaction operations
 */
export function handleTransaksiError(error: unknown) {
  // Validation errors
  if (error instanceof ZodError) {
    return validationErrorResponse(error)
  }

  // Business logic errors
  if (error instanceof Error) {
    // Customer not found
    if (error.message.includes('Penyewa tidak ditemukan')) {
      return notFoundResponse(error.message)
    }

    // Kasir validation errors
    if (error.message.includes('Kasir tidak ditemukan atau tidak aktif')) {
      return businessErrorResponse(error.message, 'KASIR_NOT_ACTIVE')
    }

    // Product availability errors
    if (error.message.includes('tidak tersedia') || error.message.includes('tidak mencukupi')) {
      return availabilityErrorResponse(error.message)
    }

    // Other business logic errors
    return businessErrorResponse(error.message)
  }

  // Database connection errors
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.includes('connection pool')
  ) {
    return connectionErrorResponse()
  }

  // Generic server error
  return internalErrorResponse()
}
