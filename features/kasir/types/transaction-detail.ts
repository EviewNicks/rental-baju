import type { Transaction } from './transaction'
import type { Customer } from './customer'
import type { Product } from './product'

export interface TransactionDetail extends Transaction {
  customer: Customer
  products: Array<{
    product: Product
    quantity: number
    pricePerDay: number
    duration: number
    subtotal: number
  }>
  timeline: ActivityLog[]
  penalties?: Penalty[]
  payments: Payment[]
}

export interface ActivityLog {
  id: string
  timestamp: string
  action:
    | 'created'
    | 'paid'
    | 'picked_up'
    | 'returned'
    | 'overdue'
    | 'reminder_sent'
    | 'penalty_added'
  description: string
  performedBy: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: any
}

export interface Penalty {
  id: string
  type: 'late_return' | 'damage' | 'lost'
  amount: number
  description: string
  createdAt: string
  status: 'pending' | 'paid' | 'waived'
}

export interface Payment {
  id: string
  amount: number
  method: 'cash' | 'qris' | 'transfer'
  timestamp: string
  type: 'rental' | 'penalty' | 'deposit'
  reference?: string
}
