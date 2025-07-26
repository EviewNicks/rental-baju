/**
 * API Types for Kasir Feature - RPK-26
 * TypeScript interfaces for request/response contracts
 * Following Indonesian field naming as per task requirements
 */


// Status types aligned with UI requirements
export type TransactionStatus = 'active' | 'selesai' | 'terlambat' | 'cancelled'
export type PaymentMethod = 'tunai' | 'transfer' | 'kartu'
export type ActivityType = 'dibuat' | 'dibayar' | 'dikembalikan' | 'terlambat' | 'dibatalkan'
export type ReturnStatus = 'belum' | 'sebagian' | 'lengkap'

// Penyewa (Customer) API Types
export interface CreatePenyewaRequest {
  nama: string
  telepon: string
  alamat: string
  email?: string
  nik?: string
  foto?: string
  catatan?: string
}

export interface UpdatePenyewaRequest {
  nama?: string
  telepon?: string
  alamat?: string
  email?: string
  nik?: string
  foto?: string
  catatan?: string
}

export interface PenyewaResponse {
  id: string
  nama: string
  telepon: string
  alamat: string
  email: string | null
  nik: string | null
  foto: string | null
  catatan: string | null
  createdAt: string
  updatedAt: string
}

export interface PenyewaListResponse {
  data: PenyewaResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Transaksi (Transaction) API Types
export interface CreateTransaksiRequest {
  penyewaId: string
  items: Array<{
    produkId: string
    jumlah: number
    durasi: number // dalam hari
    kondisiAwal?: string
  }>
  tglMulai: string // ISO date string
  tglSelesai?: string // ISO date string
  metodeBayar?: PaymentMethod
  catatan?: string
}

export interface UpdateTransaksiRequest {
  status?: TransactionStatus
  tglKembali?: string // ISO date string
  catatan?: string
  items?: Array<{
    id: string
    kondisiAkhir?: string
    statusKembali?: ReturnStatus
  }>
}

export interface TransaksiItemResponse {
  id: string
  produkId: string
  produk: {
    id: string
    code: string
    name: string
    imageUrl?: string
  }
  jumlah: number
  hargaSewa: number
  durasi: number
  subtotal: number
  kondisiAwal?: string
  kondisiAkhir?: string
  statusKembali: ReturnStatus
}

export interface PembayaranResponse {
  id: string
  jumlah: number
  metode: PaymentMethod
  referensi?: string
  catatan?: string
  createdBy: string
  createdAt: string
}

export interface AktivitasResponse {
  id: string
  tipe: ActivityType
  deskripsi: string
  data?: Record<string, unknown>
  createdBy: string
  createdAt: string
}

export interface TransaksiResponse {
  id: string
  kode: string
  penyewa: {
    id: string
    nama: string
    telepon: string
    alamat: string
  }
  status: TransactionStatus
  totalHarga: number
  jumlahBayar: number
  sisaBayar: number
  tglMulai: string
  tglSelesai?: string
  tglKembali?: string
  metodeBayar: PaymentMethod
  catatan?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  items: TransaksiItemResponse[]
  pembayaran: PembayaranResponse[]
  aktivitas: AktivitasResponse[]
}

export interface TransaksiListResponse {
  data: TransaksiResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  summary: {
    totalActive: number
    totalSelesai: number
    totalTerlambat: number
    totalCancelled: number
  }
}

// Payment API Types
export interface CreatePembayaranRequest {
  transaksiId: string
  jumlah: number
  metode: PaymentMethod
  referensi?: string
  catatan?: string
}

// Product Availability API Types
export interface ProductAvailabilityResponse {
  id: string
  code: string
  name: string
  description?: string
  hargaSewa: number
  quantity: number
  availableQuantity: number
  imageUrl?: string
  category: {
    id: string
    name: string
    color: string
  }
  size?: string
  color?: {
    id: string
    name: string
    hexCode?: string
  }
}

export interface ProductAvailabilityListResponse {
  data: ProductAvailabilityResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Query Parameters
export interface PenyewaQueryParams {
  page?: number
  limit?: number
  search?: string // Search by nama or telepon
  [key: string]: unknown
}

export interface TransaksiQueryParams {
  page?: number
  limit?: number
  status?: TransactionStatus
  search?: string // Search by kode, penyewa nama, or telepon
  dateRange?: {
    start: string
    end: string
  }
  penyewaId?: string
  [key: string]: unknown
}

export interface ProductAvailabilityQueryParams {
  page?: number
  limit?: number
  search?: string
  categoryId?: string
  size?: string[]
  colorId?: string[]
  available?: boolean // Only show available products
  [key: string]: unknown
}

// Standard API Response Wrapper
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message: string
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

// Error Types
export interface ValidationError {
  field: string
  message: string
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
  validationErrors?: ValidationError[]
}

// Dashboard Statistics Types (from task requirements)
export interface DashboardStats {
  transactions: {
    total: number
    active: number
    completed: number
    completionRate: number
  }
  customers: {
    total: number
    thisMonth: number
    growth: number
  }
  payments: {
    totalRevenue: number
    thisMonth: number
    pendingAmount: number
  }
  inventory: {
    totalProducts: number
    availableProducts: number
    rentedProducts: number
  }
  alerts: {
    overdueTransactions: number
    lowStock: number
    paymentReminders: number
  }
}