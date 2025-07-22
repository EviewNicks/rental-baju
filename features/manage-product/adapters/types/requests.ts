/**
 * Adapter Request Types
 * TypeScript interfaces for API requests in the Data Access Layer
 */

// Product request types
export interface GetProductsParams {
  page?: number
  limit?: number
  search?: string
  categoryId?: string
  status?: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE'
  isActive?: boolean
}

export interface CreateProductRequest {
  code: string
  name: string
  description?: string
  modalAwal: number
  hargaSewa: number
  quantity: number
  categoryId: string
  image?: File
  imageUrl?: string
}

export interface UpdateProductRequest {
  name?: string
  description?: string
  modalAwal?: number
  hargaSewa?: number
  quantity?: number
  categoryId?: string
  image?: File
  imageUrl?: string
}

export interface UpdateProductStatusRequest {
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE'
}

// Category request types
export interface CreateCategoryRequest {
  name: string
  color: string
}

export interface UpdateCategoryRequest {
  name?: string
  color?: string
}

// File upload request types
export interface UploadImageRequest {
  file: File
  productCode: string
}

export interface DeleteImageRequest {
  imageUrl: string
}