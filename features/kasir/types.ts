/**
 * Kasir Feature Types - Consolidated
 * All TypeScript types for the kasir feature in one file
 * Following architecture guidelines from docs/rules/architecture.md
 */

// ==========================================
// CORE TYPES & ENUMS
// ==========================================

export type TransactionStatus = 'active' | 'selesai' | 'terlambat' | 'cancelled'
export type PaymentMethod = 'tunai' | 'transfer' | 'kartu'
export type ActivityType = 'dibuat' | 'dibayar' | 'dikembalikan' | 'terlambat' | 'dibatalkan'
export type ReturnStatus = 'belum' | 'sebagian' | 'lengkap'
export type TransactionStep = 1 | 2 | 3

// ==========================================
// CUSTOMER TYPES
// ==========================================

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

// ==========================================
// PRODUCT TYPES
// ==========================================

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

// ==========================================
// TRANSACTION TYPES
// ==========================================

export interface Transaction {
  id: string
  transactionCode: string
  customerName: string
  customerPhone: string
  customerAddress: string
  items: string[]
  totalAmount: number
  amountPaid: number
  remainingAmount: number
  status: TransactionStatus
  startDate: string
  endDate?: string
  returnDate?: string
  paymentMethod?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface TransactionFilters {
  status?: TransactionStatus | 'all'
  search?: string
  dateRange?: {
    start: string
    end: string
  }
}

export interface ActivityLog {
  id: string
  timestamp: string
  action:
    | 'created'
    | 'paid'
    | 'picked_up'
    | 'returned'
    | 'overdue'
    | 'reminder_sent'
    | 'penalty_added'
  description: string
  performedBy: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: any
}

export interface Penalty {
  id: string
  type: 'late_return' | 'damage' | 'lost'
  amount: number
  description: string
  createdAt: string
  status: 'pending' | 'paid' | 'waived'
}

export interface Payment {
  id: string
  amount: number
  method: 'cash' | 'qris' | 'transfer'
  timestamp: string
  type: 'rental' | 'penalty' | 'deposit'
  reference?: string
}

export interface TransactionDetail extends Transaction {
  customer: Customer
  products: Array<{
    id: string // TransaksiItem.id - needed for pickup operations
    product: Product
    quantity: number
    jumlahDiambil?: number // How many items have been picked up
    pricePerDay: number
    duration: number
    subtotal: number
  }>
  timeline: ActivityLog[]
  penalties?: Penalty[]
  payments: Payment[]
}

// ==========================================
// TRANSACTION FORM TYPES
// ==========================================

export interface TransactionFormData {
  customer?: Customer
  products: ProductSelection[]
  pickupDate: string
  returnDate: string
  paymentMethod: 'cash' | 'qris' | 'transfer'
  paymentAmount: number
  paymentStatus: 'paid' | 'unpaid'
  notes?: string
  currentStep?: TransactionStep // For persistence
}

// ==========================================
// API TYPES
// ==========================================

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
    category?: string
    size?: string
    color?: string
  }
  jumlah: number
  jumlahDiambil: number
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
  // For list endpoint - simplified items with product names (when itemCount is used)
  itemCount?: number
  // For detail endpoint - full item details (API returns full details in items field)
  items?: TransaksiItemResponse[]
  pembayaran?: PembayaranResponse[]
  aktivitas?: AktivitasResponse[]
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
  transaksiKode: string
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

// Dashboard Statistics Types
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

// Pickup API Types (TSK-22)
export interface PickupItemRequest {
  id: string // TransaksiItem.id
  jumlahDiambil: number // Quantity to pick up
}

export interface PickupRequest {
  items: PickupItemRequest[]
}

export interface PickupResponse {
  success: boolean
  transaction: TransaksiResponse
  message: string
}

// ==========================================
// UI TYPES
// ==========================================

export interface TransactionSuccessProps {
  transactionCode?: string
  message?: string
  redirectDelay?: number
}

export interface TransactionFormState {
  showSuccess: boolean
  errorMessage: string | null
  isDataRestored: boolean
}

export interface StepIndicatorProps {
  currentStep: number
  canProceed: boolean
  onStepClick: (step: number) => void
}

export interface TransactionNotification {
  type: 'error' | 'warning' | 'info' | 'success'
  title: string
  message: string
  helpText?: string
  dismissible?: boolean
  autoHide?: boolean
  duration?: number
}

export interface TransactionFormPageProps {
  // Future: Could accept initial data or configuration
  initialStep?: number
  onTransactionComplete?: (transactionId: string) => void
}