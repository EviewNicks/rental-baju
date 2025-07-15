/**
 * Product Management Types
 *
 */

export interface Product {
  id: string
  code: string
  name: string
  description?: string
  category: string
  modal_awal: number
  harga_sewa: number
  quantity: number
  status: 'Tersedia' | 'Disewa' | 'Maintenance' | 'Habis'
  image_url?: string
  pendapatan: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  color: string
  created_at: string
}

export type ViewMode = 'table' | 'card'
export type ProductStatus = 'Tersedia' | 'Disewa' | 'Maintenance' | 'Habis'
export type ProductCategory = 'Dress' | 'Kemeja' | 'Jas' | 'Celana' | 'Aksesoris'

/**
 * Category Management Types
 *
 */

export interface Category {
  id: string
  name: string
  color: string
  bg_color: string
  text_color: string
  product_count: number
  created_at: string
  updated_at: string
}

export interface CategoryFormData {
  name: string
  color: string
}

export type CategoryModalMode = 'add' | 'edit' | 'view'
