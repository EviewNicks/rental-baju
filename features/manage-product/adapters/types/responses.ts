/**
 * Adapter Response Types  
 * TypeScript interfaces for API responses in the Data Access Layer
 */

import type { Product, Category, ProductListResponse } from '../../types'

// API response wrapper
export interface ApiResponse<T> {
  data?: T
  error?: ApiError
  success: boolean
  message?: string
}

// Error response type
export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

// Product response types
export type ProductResponse = Product

export type ProductListApiResponse = ProductListResponse

export interface ProductDeleteResponse {
  success: boolean
  message: string
}

// Category response types
export type CategoryResponse = Category

export interface CategoryListResponse {
  categories: Category[]
  total: number
}

export interface CategoryDeleteResponse {
  success: boolean
  message: string
}

// File upload response types
export interface UploadImageResponse {
  url: string
  filename: string
  size: number
  contentType: string
}

export interface DeleteImageResponse {
  success: boolean
  message: string
}

// HTTP status codes for API responses
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const

export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS]