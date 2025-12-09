/**
 * Store Configuration
 * Contains business information used in receipts and other documents
 */
export const STORE_CONFIG = {
  name: 'MAGURU RENTAL',
  address: 'Jl. Contoh No. 123, Jakarta 12345',
  phone: '(021) 123-4567',
  email: 'info@magururental.com', // Optional, not used in MVP
} as const

export type StoreConfig = typeof STORE_CONFIG
