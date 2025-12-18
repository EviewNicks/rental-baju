/**
 * Store Configuration
 * Contains business information used in receipts and other documents
 */
export const STORE_CONFIG = {
  name: 'ERLIMA MODE',
  address: 'Jl. Abd Dg sirua no 136D kota makassar',
  phone: '+62 821-9699-9962',
  logo: '/logo.jpg', // Logo path for PDF generation
  email: 'info@erlimamode.com', // Optional, not used in MVP
} as const

export type StoreConfig = typeof STORE_CONFIG
