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
  transactionDate: Date | string  // Rental transaction date
  rentalStart: Date | string
  rentalEnd: Date | string | null
  
  // Customer Data (Privacy-Compliant for Producer Role)
  customerName: string        // May be masked: "John D."
  customerContact: string     // May be masked: "081****567"
  
  // Financial Data (Simple Revenue Display)
  baseRevenue: number         // TransaksiItem.subtotal
  penaltyAmount: number       // Total penalties from TransaksiItemReturn
  totalRevenue: number        // baseRevenue + penaltyAmount
  
  // Basic Meta Information
  status: string              // Transaction status
  itemQuantity: number        // Number of items rented
  duration: number           // Rental duration in days
  
  // NEW: Activity Timeline (Optional for backward compatibility)
  activities?: ActivityInfo[]
  
  // NEW: Product Size Information (Optional for backward compatibility)
  sizeInfo?: SizeInfo | null
}

// NEW: Activity Information from AktivitasTransaksi
export interface ActivityInfo {
  id: string
  type: string                // 'dibuat', 'dibatalkan', 'dikembalikan', 'terlambat', 'diperbarui'
  typeLabel: string           // Human-readable Indonesian label
  description: string         // Activity description
  createdAt: Date | string    // Activity timestamp
  createdBy: string           // User who created the activity
  metadata?: ActivityMetadata // Role-filtered metadata
}

// NEW: Activity Metadata (role-filtered based on permissions)
export interface ActivityMetadata {
  // Common metadata (all roles)
  itemsCount?: number
  totalAmount?: string
  
  // Kasir information (all roles)
  kasirId?: string
  kasirName?: string
  
  // Status change metadata (all roles)
  previousStatus?: string
  newStatus?: string
  reason?: string
  
  // Stock and refund information (all roles)
  stockRestored?: boolean
  needsRefund?: boolean
  
  // Pickup/Return quantities (all roles)
  jumlahDiambil?: number
  jumlahKembali?: number
  
  // Penalty information (all roles)
  penaltyAmount?: number
  kondisiAkhir?: string
  
  // Performance metrics (owner only)
  transactionDuration?: number
  optimizedSystem?: boolean
  sizeAware?: boolean
  
  // Customer data (owner only - filtered for producer/kasir)
  customerName?: string
  customerContact?: string
}

// NEW: Product Size Information parsed from kondisiAwal
export interface SizeInfo {
  productSizeId: string       // UUID of ProductSize
  size: string                // 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'UNIVERSAL'
  ageCategory: string         // 'ADULT', 'CHILD', 'UNIVERSAL'
  condition?: string          // Optional condition notes
  displayText: string         // Pre-formatted: "Size: M (ADULT)"
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
  limit?: number              // Default: 10 per page
  sortBy?: 'date' | 'revenue'
  sortOrder?: 'asc' | 'desc'  // Default: desc (newest first)
}

// Customer Data Masking Configuration
export interface CustomerDataMask {
  maskName: boolean           // True for Producer role
  maskContact: boolean        // True for Producer role
  fullAccess: boolean         // True for Owner role
}

// Revenue Breakdown for Calculations
export interface RevenueBreakdown {
  subtotal: number            // Base rental amount
  penalties: PenaltyDetail[]  // Array of penalty details
  totalPenalties: number      // Sum of all penalties
  finalTotal: number          // subtotal + totalPenalties
}

export interface PenaltyDetail {
  kondisiAkhir: string        // Return condition
  jumlahKembali: number       // Quantity returned
  penaltyAmount: number       // Penalty for this condition
  modalAwalUsed?: number      // Modal awal used in calculation
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
  // NEW: Size information from kondisiAwal field
  kondisiAwal?: string | null
  // NEW: Activity data from AktivitasTransaksi join
  activities?: RawActivityData[]
}

// NEW: Raw Activity Data from database (before transformation)
export interface RawActivityData {
  id: string
  tipe: string                // Activity type from database
  deskripsi: string           // Activity description
  data: Record<string, unknown> | null  // JSON metadata
  createdBy: string           // User who created activity
  createdAt: Date             // Activity timestamp
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
    canViewFullCustomerData: false,  // Masked customer data
    canViewRevenue: true,
    canViewPenalties: true,
  },
  kasir: {
    canViewFullCustomerData: false,
    canViewRevenue: true,
    canViewPenalties: true,
  },
}