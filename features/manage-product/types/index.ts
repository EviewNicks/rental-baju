/**
 * Product Management Types
 *
 */

// Note: Decimal type is only used on server-side
// Frontend uses regular numbers for all monetary values

// Base types that match Prisma output (server-side)
export interface BaseProduct {
  id: string
  code: string
  name: string
  description?: string
  categoryId: string
  size?: string
  colorId?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modalAwal: any // Prisma Decimal (server-side only)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentPrice: any // Prisma Decimal (server-side only)
  quantity: number
  rentedStock: number
  // Material Management fields - RPK-45 (NULLABLE untuk backward compatibility)
  materialId?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  materialCost?: any // Prisma Decimal (server-side only)
  materialQuantity?: number
  status: ProductStatus
  imageUrl?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  totalPendapatan: any // Prisma Decimal (server-side only)
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

export interface BaseColor {
  id: string
  name: string
  hexCode?: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

// Client-side types (frontend-safe with regular numbers)
export interface ClientProduct {
  id: string
  code: string
  name: string
  description?: string
  categoryId: string
  size?: string
  colorId?: string
  modalAwal: number
  currentPrice: number
  quantity: number
  rentedStock: number
  // Material Management fields - RPK-45 (client-safe numbers)
  materialId?: string
  materialCost?: number
  materialQuantity?: number
  status: ProductStatus
  imageUrl?: string
  totalPendapatan: number
  isActive: boolean
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string
  category: ClientCategory
  color?: ClientColor
  material?: ClientMaterial
}

export interface ClientCategory {
  id: string
  name: string
  color: string
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string
  products: ClientProduct[]
}

export interface ClientColor {
  id: string
  name: string
  hexCode?: string
  description?: string
  isActive: boolean
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string
  products: ClientProduct[]
}

// Material Management - RPK-45
export interface BaseMaterial {
  id: string
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pricePerUnit: any // Prisma Decimal (server-side only)
  unit: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface ClientMaterial {
  id: string
  name: string
  pricePerUnit: number
  unit: string
  isActive: boolean
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string
  products: ClientProduct[]
}

export interface Material extends BaseMaterial {
  products: Product[]
}

// Full types with relationships
export interface Product extends BaseProduct {
  category: Category
  color?: Color
  material?: Material
}

export interface Category extends BaseCategory {
  products: Product[]
}

export interface Color extends BaseColor {
  products: Product[]
}

// Client-side category type for frontend usage
export interface CategoryWithClientProducts extends BaseCategory {
  products: Product[]
}

// Prisma-compatible types (without circular dependencies)
export interface PrismaProduct extends BaseProduct {
  category?: BaseCategory
}

export interface PrismaCategory extends BaseCategory {
  products?: BaseProduct[]
}

export type ViewMode = 'table' | 'card' | 'grid'
export type ProductStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE'

// Filter types untuk UI components
export type CategoryFilterValue = string | undefined
export type StatusFilterValue = ProductStatus | undefined | 'Semua' | ''

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
  currentPrice: number // ✅ Renamed from hargaSewa to match database schema
  quantity: number
  categoryId: string
  size?: string
  colorId?: string
  // Material Management fields - RPK-45
  materialId?: string
  materialQuantity?: number
  image?: File
  imageUrl?: string
}

export interface UpdateProductRequest {
  name?: string
  description?: string
  modalAwal?: number // ✅ Ubah dari Decimal ke number
  currentPrice?: number // ✅ Renamed from hargaSewa to match database schema
  quantity?: number
  categoryId?: string
  size?: string
  colorId?: string
  // Material Management fields - RPK-45
  materialId?: string
  materialQuantity?: number
  image?: File
  imageUrl?: string
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
 * Color Management Types
 */

export interface CreateColorRequest {
  name: string
  hexCode?: string
  description?: string
}

export interface UpdateColorRequest {
  name?: string
  hexCode?: string
  description?: string
  isActive?: boolean
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
  size?: string
  colorId?: string
  quantity: number
  modalAwal: number // ✅ Ubah dari Decimal ke number
  currentPrice: number // ✅ Renamed from hargaSewa to match database schema
  description: string
  imageUrl: string | null
}
