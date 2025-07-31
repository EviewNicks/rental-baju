export interface Product {
  id: string
  name: string
  category: string
  size: string
  color: string
  pricePerDay: number
  image: string
  available: boolean
  description?: string
  availableQuantity?: number
}

export interface ProductSelection {
  product: Product
  quantity: number
  duration: number
}

export interface ProductFilters {
  category?: string
  size?: string
  color?: string
  search?: string
  available?: boolean
}
