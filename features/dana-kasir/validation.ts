// Dana Kasir Management - Validation Schemas
// Zod validation with Indonesian error messages

import { z } from 'zod'
import { EXPENSE_CATEGORIES } from './types'

// Create expense validation schema
export const createPengeluaranSchema = z.object({
  harga: z
    .number({ message: 'Jumlah harus berupa angka' })
    .positive('Jumlah harus lebih besar dari 0')
    .max(999999999.99, 'Jumlah terlalu besar')
    .refine((val) => {
      // Check if number has at most 2 decimal places
      const decimalPlaces = (val.toString().split('.')[1] || '').length
      return decimalPlaces <= 2
    }, 'Jumlah maksimal 2 angka desimal'),
    
  kategori: z.enum(EXPENSE_CATEGORIES, {
    message: 'Kategori harus dipilih'
  }),
  
  deskripsi: z
    .string()
    .max(500, 'Deskripsi maksimal 500 karakter')
    .optional()
    .or(z.literal(''))
    .transform(val => val === '' ? undefined : val)
})

// Update expense validation schema (all fields optional)
export const updatePengeluaranSchema = z.object({
  harga: z
    .number({ message: 'Jumlah harus berupa angka' })
    .positive('Jumlah harus lebih besar dari 0')
    .max(999999999.99, 'Jumlah terlalu besar')
    .refine((val) => {
      const decimalPlaces = (val.toString().split('.')[1] || '').length
      return decimalPlaces <= 2
    }, 'Jumlah maksimal 2 angka desimal')
    .optional(),
    
  kategori: z
    .enum(EXPENSE_CATEGORIES, {
      message: 'Kategori tidak valid'
    })
    .optional(),
  
  deskripsi: z
    .string()
    .max(500, 'Deskripsi maksimal 500 karakter')
    .optional()
    .or(z.literal(''))
    .transform(val => val === '' ? undefined : val)
})

// Date validation for API queries
export const dateQuerySchema = z.object({
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
    .optional()
    .transform(val => val ? new Date(val + 'T00:00:00.000Z') : new Date())
})

// Date range validation for CSV export
export const dateRangeSchema = z.object({
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal mulai harus YYYY-MM-DD')
    .transform(val => new Date(val + 'T00:00:00.000Z')),
    
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal akhir harus YYYY-MM-DD')
    .transform(val => new Date(val + 'T23:59:59.999Z'))
}).refine(data => data.startDate <= data.endDate, {
  message: 'Tanggal mulai harus lebih kecil atau sama dengan tanggal akhir',
  path: ['startDate']
})

// Validation helper functions
export const validateCreatePengeluaran = (data: unknown) => {
  return createPengeluaranSchema.safeParse(data)
}

export const validateUpdatePengeluaran = (data: unknown) => {
  return updatePengeluaranSchema.safeParse(data)
}

export const validateDateQuery = (data: unknown) => {
  return dateQuerySchema.safeParse(data)
}

export const validateDateRange = (data: unknown) => {
  return dateRangeSchema.safeParse(data)
}

// Error message mapping for consistent error handling
export const ERROR_MESSAGES = {
  REQUIRED_AMOUNT: 'Jumlah harus diisi',
  INVALID_AMOUNT: 'Jumlah harus lebih besar dari 0',
  AMOUNT_TOO_LARGE: 'Jumlah terlalu besar',
  REQUIRED_CATEGORY: 'Kategori harus dipilih',
  INVALID_CATEGORY: 'Kategori tidak valid',
  DESCRIPTION_TOO_LONG: 'Deskripsi maksimal 500 karakter',
  INVALID_DATE_FORMAT: 'Format tanggal tidak valid',
  INVALID_DATE_RANGE: 'Rentang tanggal tidak valid'
} as const

// Type for validation results
export type ValidationResult<T> = {
  success: boolean
  data?: T
  error?: {
    issues: Array<{
      path: string[]
      message: string
      code: string
    }>
  }
}
