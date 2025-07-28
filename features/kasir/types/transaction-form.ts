import type { Customer } from './customer'
import type { ProductSelection } from './product'

export interface TransactionFormData {
  customer?: Customer
  products: ProductSelection[]
  pickupDate: string
  returnDate: string
  paymentMethod: 'cash' | 'qris' | 'transfer'
  paymentAmount: number
  paymentStatus: 'paid' | 'unpaid'
  notes?: string
  currentStep?: TransactionStep // For persistence
}

export type TransactionStep = 1 | 2 | 3
