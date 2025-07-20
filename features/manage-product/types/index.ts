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

/**
 * API Request/Response Types
 */

export interface CreateProductRequest {
  code: string
  name: string
  description?: string
  modalAwal: Decimal
  hargaSewa: Decimal
  quantity: number
  categoryId: string
  image?: File
}

export interface UpdateProductRequest {
  name?: string
  description?: string
  modalAwal?: Decimal
  hargaSewa?: Decimal
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
  modalAwal: Decimal
  hargaSewa: Decimal
  description: string
  imageUrl: string | null
}
