/**
 * Workflow Configuration Constants for Kasir Feature
 * Centralized configuration for business workflows and form mappings
 */

import type { CustomerFormData } from '../../types'

// Transaction Form Steps Configuration
export const transactionFormSteps = [
  { id: 1, title: 'Pilih Produk', description: 'Pilih baju yang akan disewa' },
  { id: 2, title: 'Data Penyewa', description: 'Isi biodata penyewa' },
  { id: 3, title: 'Pembayaran', description: 'Ringkasan & pembayaran' },
]

// Field Mapping for API-to-Form Translation
export const apiToFormFieldMapping: Record<string, keyof CustomerFormData> = {
  nama: 'name',
  telepon: 'phone',
  alamat: 'address',
  email: 'email',
  nik: 'identityNumber',
}

// Form-to-API Field Mapping (reverse of above)
export const formToApiFieldMapping: Record<keyof CustomerFormData, string> = {
  name: 'nama',
  phone: 'telepon',
  address: 'alamat',
  email: 'email',
  identityNumber: 'nik',
}

// Transaction Status Flow Configuration
export const statusTransitions = {
  active: ['selesai', 'cancelled', 'terlambat'],
  selesai: [], // Terminal state
  terlambat: ['selesai', 'cancelled'],
  cancelled: [], // Terminal state
} as const

// Payment Method Configuration
export const paymentMethods = [
  { value: 'tunai', label: 'Tunai', icon: '💵' },
  { value: 'transfer', label: 'Transfer Bank', icon: '🏦' },
  { value: 'kartu', label: 'Kartu Debit/Kredit', icon: '💳' },
] as const

// Duration Options (in days)
export const rentalDurationOptions = [
  { value: 1, label: '1 Hari' },
  { value: 2, label: '2 Hari' },
  { value: 3, label: '3 Hari' },
  { value: 7, label: '1 Minggu' },
  { value: 14, label: '2 Minggu' },
  { value: 30, label: '1 Bulan' },
] as const