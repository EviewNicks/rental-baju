/**
 * Rentals Management Types
 */

export interface Renter {
  id: string
  unique_code: string
  name: string
  identity_number?: string | null
  phone: string
  address: string
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface CreateRenterRequest {
  name: string
  phone: string
  address: string
  identity_number?: string
}

export interface UpdateRenterRequest {
  name?: string
  phone?: string
  address?: string
  identity_number?: string
}