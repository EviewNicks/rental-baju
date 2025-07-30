export interface RecentTransaction {
  id: string
  kode: string
  status: string
  totalHarga: number
  createdAt: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  address: string
  identityNumber?: string
  foto?: string
  catatan?: string
  createdAt: string
  totalTransactions?: number
  recentTransactions?: RecentTransaction[]
}

export interface CustomerFormData {
  name: string
  phone: string
  email?: string
  address: string
  identityNumber?: string
}
