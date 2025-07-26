// Updated to match API types from BE-26
export type TransactionStatus = 'active' | 'selesai' | 'terlambat' | 'cancelled'

export interface Transaction {
  id: string
  transactionCode: string
  customerName: string
  customerPhone: string
  customerAddress: string
  items: string[]
  totalAmount: number
  amountPaid: number
  remainingAmount: number
  status: TransactionStatus
  startDate: string
  endDate?: string
  returnDate?: string
  paymentMethod?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface TransactionFilters {
  status?: TransactionStatus | 'all'
  search?: string
  dateRange?: {
    start: string
    end: string
  }
}
