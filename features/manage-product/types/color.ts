export interface Color {
  id: string
  name: string
  hex_value: string
  product_count: number
  created_at: string
  updated_at: string
}

export interface ColorFormData {
  name: string
  hex_value: string
}

export type ColorModalMode = 'add' | 'edit' | 'view'
