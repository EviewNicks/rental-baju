/**
 * Material Management Types - RPK-45
 * Type definitions untuk Material management system
 */

import { Decimal } from '@prisma/client/runtime/library'

// ===============================
// BASE MATERIAL TYPES
// ===============================

/**
 * Base Material interface (server-side dengan Decimal)
 */
export interface BaseMaterial {
  id: string
  name: string
  pricePerUnit: Decimal
  unit: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

/**
 * Material interface (client-side dengan number)
 */
export interface Material {
  id: string
  name: string
  pricePerUnit: number // Client-side number
  unit: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

// ===============================
// REQUEST/RESPONSE TYPES
// ===============================

/**
 * Create Material Request (API payload)
 */
export interface CreateMaterialRequest {
  name: string
  pricePerUnit: number
  unit: string
}

/**
 * Update Material Request (API payload)
 */
export interface UpdateMaterialRequest {
  name?: string
  pricePerUnit?: number
  unit?: string
  isActive?: boolean
}

/**
 * Material Query Parameters
 */
export interface MaterialQueryParams {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
  unit?: string | string[]
}

/**
 * Material List Response
 */
export interface MaterialListResponse {
  materials: Material[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * Material Info (lightweight untuk product relations)
 */
export interface MaterialInfo {
  id: string
  name: string
  pricePerUnit: number
  unit: string
}

// ===============================
// FORM TYPES
// ===============================

/**
 * Material Form Data (untuk UI forms)
 */
export interface MaterialFormData {
  name: string
  pricePerUnit: number | string // Support string untuk form inputs
  unit: string
}

/**
 * Material Filters (untuk search dan filtering)
 */
export interface MaterialFilters {
  search?: string
  isActive?: boolean
  unit?: string[]
  page?: number
  limit?: number
}

// ===============================
// COST CALCULATION TYPES
// ===============================

/**
 * Material Cost Calculation
 */
export interface MaterialCostCalculation {
  materialId: string
  materialName: string
  pricePerUnit: number
  quantity: number
  totalCost: number // pricePerUnit * quantity
}

/**
 * Product Material Cost Breakdown
 */
export interface ProductMaterialCostBreakdown {
  productId: string
  materialCost: number | null
  calculation: MaterialCostCalculation | null
}

// ===============================
// UTILITY TYPES
// ===============================

/**
 * Material with Products Count (untuk analytics)
 */
export interface MaterialWithProductsCount extends Material {
  _count: {
    products: number
  }
}

/**
 * Material Unit Options (untuk dropdowns)
 */
export type MaterialUnit = 
  | 'meter'
  | 'piece'
  | 'kg'
  | 'gram'
  | 'liter'
  | 'yard'
  | 'cm'
  | 'unit'

/**
 * Material Status untuk UI
 */
export type MaterialStatus = 'active' | 'inactive'