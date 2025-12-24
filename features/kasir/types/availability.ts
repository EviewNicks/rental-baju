/**
 * Availability Product View Types
 * TypeScript interfaces for transaction history and date-aware availability checking
 */

export interface TransactionHistoryItem {
  transactionCode: string
  quantity: number
  startDate: Date
  endDate: Date
  status: 'active' | 'diambil' // REVISED: Only active and diambil status
  displayText: string // Formatted as "TXN-001 (2 item) untuk 4-7 Feb"
}

export interface DateRangeAvailabilityCheck {
  productSizeId: string
  requestedQuantity: number
  startDate: Date
  endDate: Date
}

export interface AvailabilityResult {
  productSizeId: string
  totalStock: number
  availableQuantity: number
  reservedQuantity: number // Reserved but not picked up
  conflicts: ConflictDetail[]
  canBook: boolean
}

export interface ConflictDetail {
  transactionCode: string
  conflictQuantity: number
  conflictPeriod: DateRange
}

export interface DateRange {
  startDate: Date
  endDate: Date
}

export interface OverlapResult {
  hasOverlap: boolean
  overlapStart?: Date
  overlapEnd?: Date
  conflictingTransactions: string[] // Transaction codes
}

export interface CachedTransactionHistory {
  productSizeId: string
  data: TransactionHistoryItem[]
  cachedAt: Date
  expiresAt: Date
  version: number // For cache invalidation
}

export interface TransactionHistoryOptions {
  statuses?: ('active' | 'diambil')[] // REVISED: Only active and diambil
  limit?: number
  sortBy?: 'date_proximity' | 'date_asc' | 'date_desc'
}

export enum AvailabilityErrorType {
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  DATE_OVERLAP_CONFLICT = 'DATE_OVERLAP_CONFLICT',
  CACHE_ERROR = 'CACHE_ERROR',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  API_ERROR = 'API_ERROR'
}

export interface AvailabilityError {
  type: AvailabilityErrorType
  message: string
  details?: Record<string, unknown>
  retryable: boolean
}