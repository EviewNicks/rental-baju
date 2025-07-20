/**
 * Product Management Types
 *
 */

import { Decimal } from '@prisma/client/runtime/library'

// Base types that match Prisma output
export interface BaseProduct {
  id: string
  code: string
  name: string
  description?: string
  categoryId: string
  modalAwal: Decimal
  hargaSewa: Decimal
  quantity: number
  status: ProductStatus
  imageUrl?: string
  totalPendapatan: Decimal
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface BaseCategory {
  id: string
  name: string
  color: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

// Full types with relationships
export interface Product extends BaseProduct {
  category: Category
}

export interface Category extends BaseCategory {
  products: Product[]
}

// Prisma-compatible types (without circular dependencies)
export interface PrismaProduct extends BaseProduct {
  category?: BaseCategory
}

export interface PrismaCategory extends BaseCategory {
  products?: BaseProduct[]
}

export type ViewMode = 'table' | 'card'
export type ProductStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE'

// Filter types untuk UI components
export type CategoryFilterValue = string | undefined
export type StatusFilterValue = ProductStatus | undefined | 'Semua'

// Type guards
export function isValidProductStatus(status: string): status is ProductStatus {
  return ['AVAILABLE', 'RENTED', 'MAINTENANCE'].includes(status)
}

export function normalizeStatusFilter(status: string | undefined): ProductStatus | undefined {
  if (!status || status === 'Semua' || status === '') {
    return undefined
  }
  return isValidProductStatus(status) ? status : undefined
}

export function normalizeCategoryFilter(categoryId: string | undefined): string | undefined {
  if (!categoryId || categoryId === '' || categoryId === 'all') {
    return undefined
  }
  return categoryId
}

/**
 * API Request/Response Types
 * Menggunakan number untuk API layer, Decimal untuk database layer
 */

export interface CreateProductRequest {
  code: string
  name: string
  description?: string
  modalAwal: number // ✅ Ubah dari Decimal ke number
  hargaSewa: number // ✅ Ubah dari Decimal ke number
  quantity: number
  categoryId: string
  image?: File
  imageUrl?: string
}

export interface UpdateProductRequest {
  name?: string
  description?: string
  modalAwal?: number // ✅ Ubah dari Decimal ke number
  hargaSewa?: number // ✅ Ubah dari Decimal ke number
  quantity?: number
  categoryId?: string
  image?: File
}

export interface ProductListResponse {
  products: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * Category Management Types
 */

export interface CreateCategoryRequest {
  name: string
  color: string
}

export interface UpdateCategoryRequest {
  name?: string
  color?: string
}

/**
 * Category Management Types
 */

export interface CategoryFormData {
  name: string
  color: string
}

export type CategoryModalMode = 'add' | 'edit' | 'view'

// =============

export interface ProductFormData {
  code: string
  name: string
  categoryId: string
  quantity: number
  modalAwal: number // ✅ Ubah dari Decimal ke number
  hargaSewa: number // ✅ Ubah dari Decimal ke number
  description: string
  imageUrl: string | null
}
