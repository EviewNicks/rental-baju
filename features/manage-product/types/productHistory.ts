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