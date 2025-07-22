export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  address: string
  identityNumber?: string
  createdAt: string
  totalTransactions: number
}

export interface CustomerFormData {
  name: string
  phone: string
  email?: string
  address: string
  identityNumber?: string
}
