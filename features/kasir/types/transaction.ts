export type TransactionStatus = 'active' | 'completed' | 'overdue'

export interface Transaction {
  id: string
  transactionCode: string
  customerName: string
  customerPhone: string
  items: string[]
  rentalDate: string
  returnDate: string
  actualReturnDate?: string
  totalAmount: number
  paidAmount: number
  status: TransactionStatus
  notes?: string
}

export interface TransactionFilters {
  status?: TransactionStatus
  search?: string
  dateRange?: {
    start: string
    end: string
  }
}
