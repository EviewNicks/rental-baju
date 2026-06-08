// Dana Kasir Management - Type Definitions
// Keep It Simple approach with essential types only

// Expense categories (fixed)
export const EXPENSE_CATEGORIES = [
  'Operasional',
  'Maintenance',
  'Transport',
  'Refund Dana Jaminan', // ✅ NEW: For lost item refunds
  'Lainnya',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

// Core expense record interface
export interface PengeluaranKasir {
  id: string
  kasirId: string
  harga: number
  kategori: ExpenseCategory
  deskripsi?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  kasir?: {
    id: string
    nama: string
  }
}

// API request types
export interface CreatePengeluaranRequest {
  kasirId: string // NEW: Selected kasir from dropdown
  harga: number
  kategori: ExpenseCategory
  deskripsi?: string
}

export interface UpdatePengeluaranRequest {
  kasirId?: string // NEW: Can update kasir assignment
  harga?: number
  kategori?: ExpenseCategory
  deskripsi?: string
}

// Income item from rental transactions
export interface IncomeItem {
  type: 'rental' | 'penalty' // NEW: Distinguish between rental and penalty income
  transaksiKode: string
  customerName: string
  rentalAmount: number
  penaltyAmount: number
  status: string
  kasirId: string
  kasirName: string
  createdAt: Date

  // NEW: Payment method information (dominant method from multiple payments)
  paymentMethod?: string // e.g., 'tunai', 'qris', 'transfer', 'penalty'
  paymentCount?: number // Number of payment records for this transaction

  // NEW: Penalty-specific fields (Requirements 3.4, 3.6)
  penaltyBreakdown?: {
    latePenalty: number
    conditionPenalty: number
    itemCount: number
  }
}

// Daily summary data
export interface DailySummary {
  totalIncome: number // Sum of rental + penalty amounts
  totalExpense: number // Sum of expense amounts
  netBalance: number // totalIncome - totalExpense
  date: string
}

// Complete dashboard response
export interface DanaSummaryResponse {
  summary: DailySummary
  income: IncomeItem[]
  expenses: PengeluaranKasir[]
}

// Form data for UI components
export interface PengeluaranFormData {
  kasirId: string // NEW: Selected kasir from dropdown
  harga: number
  kategori: ExpenseCategory
  deskripsi?: string
}

// Kasir list item for dropdown (NEW)
export interface KasirListItem {
  id: string
  nama: string
}

// Kasir filter option (NEW)
export interface KasirOption {
  id: string
  nama: string
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    details?: ValidationError[]
  }
}

// Validation error structure
export interface ValidationError {
  field: string
  message: string
  code: string
}

// Date utility types
export interface DateRange {
  startDate: Date
  endDate: Date
}

// CSV export options
export interface ExportOptions {
  startDate: Date
  endDate: Date
  format: 'csv'
}
