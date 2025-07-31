export interface Color {
  id: string
  name: string
  hexCode: string
  product_count: number
  created_at: string
  updated_at: string
}

export interface ColorFormData {
  name: string
  hexCode: string
}

export type ColorModalMode = 'add' | 'edit' | 'view'
