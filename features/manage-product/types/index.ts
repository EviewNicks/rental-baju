/**
 * Product Management Types
 *
 */

export interface Product {
  id: string
  code: string
  name: string
  description?: string
  categoryId: string
  category: Category
  modalAwal: number
  hargaSewa: number
  quantity: number
  status: ProductStatus
  imageUrl?: string
  totalPendapatan: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface Category {
  id: string
  name: string
  color: string
  products: Product[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
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
  modalAwal: number
  hargaSewa: number
  quantity: number
  categoryId: string
  image?: File
}

export interface UpdateProductRequest {
  name?: string
  description?: string
  modalAwal?: number
  hargaSewa?: number
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
  modalAwal: number
  hargaSewa: number
  description: string
  imageUrl: string | null
}
