/**
 * Product History Types - RPK-46 Component
 *
 * Type definitions for Product History Activity Timeline component
 * Follows existing architecture patterns from manage-product feature
 * Simple data model aligned with "Keep It Simple" principle
 */

// Core Product History Types
export interface ProductHistoryItem {
  // Core Identity
  id: string
  transactionCode: string

  // Timeline Information
  transactionDate: Date | string // Rental transaction date
  rentalStart: Date | string
  rentalEnd: Date | string | null

  // Customer Data (Full visibility - no masking for product history)
  customerName: string
  customerContact: string

  // Financial Data (Simple Revenue Display)
  baseRevenue: number // TransaksiItem.subtotal
  penaltyAmount: number // Total penalties from TransaksiItemReturn
  totalRevenue: number // baseRevenue + penaltyAmount

  // Basic Meta Information
  status: string // Transaction status
  itemQuantity: number // Number of items rented
  duration: number // Rental duration in days

  // REMOVED: activities - not used in UI (80% response size reduction)

  // Product Size Information (ALWAYS included in response, even if null)
  sizeInfo: SizeInfo | null

  // Detailed Penalty Breakdown
  penalty?: {
    total: number // Total penalty amount
    late: number // Late penalty (flat 20k per item)
    condition: number // Condition-based penalties
    breakdown: Array<{
      // Per-condition breakdown
      kondisiAkhir: string // Condition: 'kotor', 'rusak', 'hilang'
      jumlahKembali: number // Quantity returned in this condition
      penaltyAmount: number // Penalty for this condition
    }>
  }
}

// DEPRECATED: Activity Information (no longer returned in API - not used in UI)
export interface ActivityInfo {
  id: string
  type: string
  typeLabel: string
  description: string
  createdAt: Date | string
  createdBy: string
  metadata?: ActivityMetadata
}

// DEPRECATED: Activity Metadata (no longer returned in API - not used in UI)
export interface ActivityMetadata {
  itemsCount?: number
  totalAmount?: string
  kasirId?: string
  kasirName?: string
  previousStatus?: string
  newStatus?: string
  reason?: string
  stockRestored?: boolean
  needsRefund?: boolean
  jumlahDiambil?: number
  jumlahKembali?: number
  penaltyAmount?: number
  kondisiAkhir?: string
  transactionDuration?: number
  optimizedSystem?: boolean
  sizeAware?: boolean
  customerName?: string
  customerContact?: string
}

// Product Size Information parsed from kondisiAwal
export interface SizeInfo {
  productSizeId: string // UUID of ProductSize
  size: string // 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'UNIVERSAL'
  ageCategory: string // 'ADULT', 'CHILD', 'UNIVERSAL'
  condition?: string // Optional condition notes
  displayText: string // Pre-formatted: "Size: M (ADULT)"
}

// API Response Structure
export interface ProductHistoryResponse {
  success: boolean
  data: ProductHistoryItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  summary?: {
    totalRevenue: number
    totalTransactions: number
    averageRentalDuration: number
  }
}

// API Request Parameters
export interface HistoryQueryParams {
  productId: string
  page?: number
  limit?: number // Default: 10 per page
  sortBy?: 'date' | 'revenue'
  sortOrder?: 'asc' | 'desc' // Default: desc (newest first)
}

// Customer Data Masking Configuration
export interface CustomerDataMask {
  maskName: boolean // True for Producer role
  maskContact: boolean // True for Producer role
  fullAccess: boolean // True for Owner role
}

// Revenue Breakdown for Calculations
export interface RevenueBreakdown {
  subtotal: number // Base rental amount
  penalties: PenaltyDetail[] // Array of penalty details
  totalPenalties: number // Sum of all penalties
  finalTotal: number // subtotal + totalPenalties
}

export interface PenaltyDetail {
  kondisiAkhir: string // Return condition
  jumlahKembali: number // Quantity returned
  penaltyAmount: number // Penalty for this condition
  modalAwalUsed?: number // Modal awal used in calculation
}

// Error Types
export interface HistoryError {
  code: 'NOT_FOUND' | 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'INTERNAL_ERROR'
  message: string
  details?: string
}

// Service Layer Types
export interface ProductHistoryServiceResult {
  success: boolean
  data?: ProductHistoryItem[]
  error?: HistoryError
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Database Query Types (for service layer)
export interface ProductHistoryQuery {
  productId: string
  pagination: {
    page: number
    limit: number
    offset: number
  }
  sorting: {
    field: string
    direction: 'asc' | 'desc'
  }
}

// Raw Database Result (before transformation)
export interface ProductHistoryRawResult {
  id: string
  transactionCode: string
  transactionDate: Date
  rentalStart: Date
  rentalEnd: Date | null
  customerName: string
  customerContact: string
  subtotal: number
  duration: number
  status: string
  itemQuantity: number
  // Penalty data from joins
  penalties?: Array<{
    kondisiAkhir: string
    jumlahKembali: number
    penaltyAmount: number
    modalAwalUsed?: number
  }>
  // Size information from kondisiAwal field
  kondisiAwal?: string | null
  // REMOVED: activities - not used in UI (80% response size reduction)
}

// DEPRECATED: Raw Activity Data (no longer used)
export interface RawActivityData {
  id: string
  tipe: string
  deskripsi: string
  data: Record<string, unknown> | null
  createdBy: string
  createdAt: Date
}

// Type Guards
export function isValidSortBy(value: unknown): value is 'date' | 'revenue' {
  return typeof value === 'string' && ['date', 'revenue'].includes(value)
}

export function isValidSortOrder(value: unknown): value is 'asc' | 'desc' {
  return typeof value === 'string' && ['asc', 'desc'].includes(value)
}

// Utility Types for Role-Based Access
export type UserRole = 'owner' | 'producer' | 'kasir'

export interface RolePermissions {
  canViewFullCustomerData: boolean
  canViewRevenue: boolean
  canViewPenalties: boolean
}

// Constants
export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE = 50
export const DEFAULT_SORT_BY = 'date'
export const DEFAULT_SORT_ORDER = 'desc'

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  owner: {
    canViewFullCustomerData: true,
    canViewRevenue: true,
    canViewPenalties: true,
  },
  producer: {
    canViewFullCustomerData: false, // Masked customer data
    canViewRevenue: true,
    canViewPenalties: true,
  },
  kasir: {
    canViewFullCustomerData: false,
    canViewRevenue: true,
    canViewPenalties: true,
  },
}
