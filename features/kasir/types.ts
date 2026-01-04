/**
 * Kasir Feature Types - Consolidated
 * All TypeScript types for the kasir feature in one file
 * Following architecture guidelines from docs/rules/architecture.md
 */

// Kasir types are now consolidated in this file

// ==========================================
// CORE TYPES & ENUMS
// ==========================================

// UI-specific types for 2-level payment method selection
export type PrimaryPaymentMethod = 'tunai' | 'bank'
export type BankPaymentMethod = 'bca' | 'bri' | 'mandiri' | 'qris'

export type TransactionStatus =
  | 'active'
  | 'diambil'
  | 'selesai'
  | 'terlambat'
  | 'cancelled'
  | 'pending_resolution'
export type PaymentMethod = 'tunai' | 'bca' | 'bri' | 'mandiri' | 'qris' | 'penalty'
export type ActivityType = 'dibuat' | 'dibayar' | 'diambil' | 'selesai' | 'terlambat' | 'dibatalkan'
export type ReturnStatus = 'belum' | 'sebagian' | 'lengkap'
export type TransactionStep = 1 | 2 | 3 | 4

// New condition categories enum for manual pricing system
export enum ConditionCategory {
  BAIK = 'BAIK',
  KOTOR = 'KOTOR',
  RUSAK_RINGAN = 'RUSAK_RINGAN',
  RUSAK_BERAT = 'RUSAK_BERAT',
  HILANG = 'HILANG',
}

// Condition category labels for UI display
export const ConditionCategoryLabels: Record<ConditionCategory, string> = {
  [ConditionCategory.BAIK]: 'Baik',
  [ConditionCategory.KOTOR]: 'Kotor',
  [ConditionCategory.RUSAK_RINGAN]: 'Rusak Ringan',
  [ConditionCategory.RUSAK_BERAT]: 'Rusak Berat',
  [ConditionCategory.HILANG]: 'Hilang',
}

// Penalty system types for new flat + manual pricing structure
export interface FlatPenaltySettings {
  latePenaltyAmount: number // Default 20000 (20k flat penalty)
  enableManualPricing: boolean
  categoryPriceRanges: Record<ConditionCategory, { min: number; max: number }>
}

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

// ==========================================
// KASIR (CASHIER) TYPES
// ==========================================

export interface Kasir {
  id: string
  nama: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string
}

export interface KasirFormData {
  nama: string
  isActive: boolean
}

export interface KasirListResponse {
  data: Kasir[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  summary: {
    total: number
    active: number
    inactive: number
  }
}

export interface CreateKasirRequest {
  nama: string
  isActive?: boolean
}

export interface UpdateKasirRequest {
  nama?: string
  isActive?: boolean
}

export interface KasirResponse {
  id: string
  nama: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string
}

export interface KasirQueryParams {
  page: number
  limit: number
  search?: string
  isActive?: boolean
}

export interface CustomerFormData {
  name: string
  phone: string
  email?: string
  address: string
  identityNumber?: string
}

// ==========================================
// PRODUCT TYPES - BASE INTERFACES
// ==========================================

// Base Product interface - Core fields shared across all product contexts
export interface ProductCore {
  id: string
  name: string
  code?: string
  description?: string
  imageUrl?: string
}

// Product with category information
export interface ProductWithCategory extends ProductCore {
  category: {
    id: string
    name: string
    color?: string
    type?: 'clothing' | 'accessories_age_based' | 'accessories_universal' // RPK-52: Category type for dynamic forms
  }
  size?: string
  color?: {
    id: string
    name: string
    hexCode?: string
  }
}

// Product with pricing information
export interface ProductWithPricing extends ProductCore {
  currentPrice: number // Current rental price per unit
  pricePerDay?: number // Legacy field for backward compatibility
}

// Product with stock information (calculated fields)
export interface ProductWithStock extends ProductCore {
  quantity: number
  rentedStock: number
  // Note: availableStock calculated as (quantity - rentedStock) using calculateAvailableStock() utility
}

// ProductSize interface for size-aware inventory (RPK-51)
export interface ProductSize {
  id: string
  productId?: string // Optional - not always provided by frontend
  ageCategory: 'ADULT' | 'TEEN' | 'CHILD'
  size: string // 'S', 'M', 'L', 'XL', etc.
  quantity: number
  availableQuantity: number // Size-specific available stock
  rentedStock?: number // Optional - not always provided by frontend
  createdAt?: string // Optional - frontend may not provide
  updatedAt?: string // Optional - frontend may not provide
  // Additional optional fields that frontend may provide
  color?: string
  originalQuantity?: number
  rentedQuantity?: number
}

// Legacy Product interface for backward compatibility
// @deprecated Use ProductWithCategory + ProductWithPricing + ProductWithStock
export interface Product {
  id: string
  name: string
  code?: string // Product code for identification and search
  category: string
  categoryType?: 'clothing' | 'accessories_age_based' | 'accessories_universal' // RPK-52: Category type for dynamic forms
  size: string
  color: string
  pricePerDay: number
  image: string
  available: boolean
  description?: string
  availableQuantity?: number

  // Size-aware fields (RPK-51) - Optional for backward compatibility
  sizes?: ProductSize[] // Available sizes for this product
  supportsSizeSelection?: boolean // Flag to show size selector in UI
}

export interface ProductSelection {
  product: Product
  quantity: number
  duration: number

  // Size-aware fields (RPK-51) - Optional for backward compatibility
  productSizeId?: string // Selected size ID for API request
  selectedSize?: ProductSize // Full size info for UI display

  // Jas-Sarung pairing fields - Optional for backward compatibility
  linkedSarung?: LinkedSarung // Sarung linked to jas product
}

// Jas-Sarung pairing types
export interface LinkedSarung {
  productId: string
  productSizeId: string
  quantity: number
  selectedSize: ProductSize
}

// Task 18: Enhanced Modal with Quantity Distribution
export interface SarungDistribution {
  sarungSelections: Array<{
    product: Product
    quantity: number
    productSizeId?: string
    selectedSize?: ProductSize
  }>
  totalDistributed: number
  remainingJas: number
}

// Enhanced LinkedSarung with product reference for Task 3 (sarung code display)
export interface LinkedSarung {
  productId: string
  productSizeId: string
  quantity: number
  selectedSize: ProductSize
  // ✅ TASK 3: Add product reference for sarung code display
  product?: Product // Optional for backward compatibility
}

export interface ProductFilters {
  category?: string
  size?: string
  color?: string
  search?: string
  available?: boolean
}

// Enhanced filters for kasir workflow - RPK-52 Optimization
export interface KasirFilters {
  search?: string
  categoryId?: string
  status?: 'AVAILABLE' | 'RENTED' | ''
  sortBy?: 'name' | 'price' | 'quantity' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  minPrice?: number
  maxPrice?: number
  // Additional properties for pagination and size filtering
  page?: number
  limit?: number
  size?: string[]
}

// ==========================================
// TRANSACTION TYPES - BASE INTERFACES
// ==========================================

// Base Transaction interface - Core fields shared across all transaction contexts
export interface TransaksiCore {
  id: string
  kode: string // Standardized field name
  status: TransactionStatus
  totalHarga: number // Performance critical - kept as stored field
  jumlahBayar: number
  sisaBayar: number // Performance critical - kept as stored field
  tglMulai: string
  tglSelesai?: string
  createdAt: string
  updatedAt: string
}

// Transaction with customer information
export interface TransaksiWithCustomer extends TransaksiCore {
  penyewa: {
    id: string
    nama: string
    telepon: string
    alamat: string
  }
  kasir?: {
    id: string
    nama: string
    isActive: boolean
  }
}

// Transaction summary for list views (optimized response)
export interface TransaksiSummary extends TransaksiWithCustomer {
  itemCount: number // For performance - avoids loading full items
  hasPickup: boolean // Server-calculated pickup status for enhanced status calculation
  metodeBayar: PaymentMethod
  catatan?: string
  createdBy: string
}

// Transaction detail for full views (complete data)
export interface TransaksiDetail extends TransaksiWithCustomer {
  items: TransaksiItemResponse[]
  pembayaran?: PembayaranResponse[]
  aktivitas?: AktivitasResponse[]
  metodeBayar: PaymentMethod
  catatan?: string
  createdBy: string
  // tglKembali derived from item status - will be validated in Phase 2
  tglKembali?: string
}

// Legacy Transaction interface for backward compatibility
// @deprecated Use TransaksiSummary or TransaksiDetail
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
  // 🆕 ENHANCEMENT: Discount system fields
  discountType?: 'percent' | 'nominal' | null
  discountValue?: number | null
  createdAt: string
  updatedAt: string
  kasir?: {
    id: string
    nama: string
    isActive: boolean
    createdAt: string
    updatedAt: string
    createdBy?: string
  } // Optional kasir information for display
}

export interface KasirInfo {
  id: string
  nama: string
  isActive: boolean
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
    | 'cancelled'  // ✅ ADDED: Support for cancelled activities
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
  method: 'tunai' | 'bca' | 'bri' | 'mandiri' | 'qris' | 'penalty'
  timestamp: string
  type: 'rental' | 'penalty' | 'deposit'
  reference?: string
  notes?: string
}

// Legacy TransactionDetail - replaced by TransaksiDetail
// @deprecated Use TransaksiDetail with standardized field names
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
    sizeInfo?: string // Size information for display
    kondisiAwal?: string | null // Condition data for pairing integration
    // ✅ Multi-condition summary for lost item resolution
    multiConditionSummary?: {
      totalPenalty: number
      lostItems: number
      goodItems: number
      totalQuantity: number
      conditionBreakdown: Array<{
        id: string
        kondisiAkhir: string
        jumlahKembali: number
        penaltyAmount: number
        modalAwalUsed?: number | null
        resolutionStatus?: string | null
        resolutionDate?: string | null
      }>
    }
    // Legacy conditionBreakdown (backward compatibility)
    conditionBreakdown?: Array<{
      id: string
      kondisiAkhir: string
      jumlahKembali: number
      penaltyAmount: number
      modalAwalUsed?: number | null
      resolutionStatus?: string | null
      resolutionDate?: string | null
      createdAt?: string
      createdBy?: string
    }>
    // RPK-51: Add kondisiAwal for AgeSizes parsing - REMOVED: Duplicate declaration
    // kondisiAwal is already declared above with proper pairing integration support
    // TASK 23: Add linkedSarung data for separate sarung display
    linkedSarung?: {
      productId: string
      productSizeId: string
      quantity: number
      product?: {
        id: string
        code: string
        name: string
        category: string
        image?: string
        imageUrl?: string
      }
      selectedSize?: {
        id: string
        size: string
        ageCategory: string
      }
    }
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
  paymentMethod: 'tunai' | 'bca' | 'bri' | 'mandiri' | 'qris'
  paymentAmount: number
  paymentStatus: 'paid' | 'unpaid'
  notes?: string
  currentStep?: TransactionStep // For persistence
  kasirSelection?: KasirSelectionData // Cashier selection data
  
  // Task 4: New fields for transaction enhancements
  duration: 4 | 7 // Duration package selection (4-day or 7-day)
  discountType: 'percent' | 'nominal' | null // Discount type selection
  discountValue: number | null // Discount value (percentage or nominal amount)
}

// Cashier Selection Data for transaction form
export interface KasirSelectionData {
  kasirId: string | null
  kasirInfo: KasirInfo | null
  isAutoAssigned: boolean // true if auto-assigned to current user
  assignmentReason?: string // reason for auto-assignment
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

// Size-aware transaction item format (RPK-51)
export interface CreateTransaksiItemSizeAware {
  produkId: string
  productSizeId: string // Size-specific ID for inventory management
  jumlah: number
  durasi: number // dalam hari
  kondisiAwal?: string
  // ✅ TASK 20: Add linked sarung support for jas-sarung pairing
  linkedSarung?: {
    productId: string
    productSizeId: string
    quantity: number
    selectedSize: ProductSize
  }
}

// Legacy transaction item format (backward compatibility)
export interface CreateTransaksiItemLegacy {
  produkId: string
  jumlah: number
  durasi: number // dalam hari
  kondisiAwal?: string
  // ✅ TASK 20: Add linked sarung support for backward compatibility
  linkedSarung?: {
    productId: string
    productSizeId: string
    quantity: number
    selectedSize: ProductSize
  }
}

// Type guard to detect size-aware items
export function isSizeAwareItem(
  item: CreateTransaksiItemSizeAware | CreateTransaksiItemLegacy,
): item is CreateTransaksiItemSizeAware {
  return 'productSizeId' in item && item.productSizeId !== undefined
}

// Main transaction request interface supporting dual-format
export interface CreateTransaksiRequest {
  kasirId?: string // Optional to match database schema (kasirId?)
  penyewaId: string
  items: Array<CreateTransaksiItemSizeAware | CreateTransaksiItemLegacy>
  tglMulai: string // ISO date string
  tglSelesai?: string // ISO date string
  metodeBayar?: PaymentMethod
  catatan?: string
  // Task 4: Add discount fields for transaction enhancements
  discountType?: 'percent' | 'nominal' | null
  discountValue?: number | null
}

// Legacy transaction request interface (backward compatibility)
export interface CreateTransaksiLegacyRequest {
  penyewaId: string
  items: CreateTransaksiItemLegacy[]
  tglMulai: string // ISO date string
  tglSelesai?: string // ISO date string
  metodeBayar?: PaymentMethod
  catatan?: string
}

export interface UpdateTransaksiRequest {
  status?: TransactionStatus
  tglKembali?: string // ISO date string
  catatan?: string
  kasirId?: string // ✅ NEW: For manual kasir selection in refund processing
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
    modalAwal: number
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
  // ✅ TASK 6: Add linkedSarung property for jas-sarung pairing integration
  linkedSarung?: {
    productId: string
    productSizeId: string
    quantity: number
    product?: {
      id: string
      code: string
      name: string
      category?: string
      imageUrl?: string
    }
    selectedSize?: {
      id: string
      size: string
      ageCategory: string
    }
  }
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

// Unified TransaksiResponse - supports both summary and detail modes
export interface TransaksiResponse extends TransaksiCore {
  penyewa: {
    id: string
    nama: string
    telepon: string
    alamat: string
  }
  kasir?: {
    id: string
    nama: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  }
  metodeBayar: PaymentMethod
  catatan?: string
  createdBy: string
  tglKembali?: string // Will be validated against item status in Phase 2
  // 🆕 ENHANCEMENT: Discount system fields
  discountType?: 'percent' | 'nominal' | null
  discountValue?: number | null

  // New flat penalty system fields
  flatLatePenalty: number // Default 20000 (20k flat penalty)
  isLateReturn: boolean // Flag for late return status

  // For list endpoint - simplified items with product names (when itemCount is used)
  itemCount?: number
  hasPickup?: boolean // Optional server-calculated pickup status for enhanced status calculation
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
    totalDiambil: number
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

// Product Availability API Types - Using consolidated base interfaces
export interface ProductAvailabilityResponse extends ProductWithCategory, ProductWithPricing {
  quantity: number
  // availableQuantity is calculated field - will be removed in Phase 3
  availableQuantity: number // @deprecated Use availableStock calculation

  // RPK-51: Size-aware inventory support
  sizes?: ProductSize[] // Optional for backward compatibility
  supportsSizeSelection?: boolean // Computed based on sizes.length > 0
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
// INPUT SANITIZATION UTILITIES
// ==========================================

/**
 * Sanitize and validate penyewa input data
 * Removes potentially harmful content and normalizes input
 */
export function sanitizePenyewaInput(input: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(input)) {
    if (value === null || value === undefined) {
      continue // Skip null/undefined values
    }

    switch (key) {
      case 'nama':
      case 'alamat':
        // Sanitize text fields - remove HTML tags and normalize whitespace
        if (typeof value === 'string') {
          sanitized[key] = sanitizeTextInput(value)
        }
        break

      case 'telepon':
        // Sanitize phone number - keep only digits, +, -, (, ), and spaces
        if (typeof value === 'string') {
          sanitized[key] = sanitizePhoneInput(value)
        }
        break

      case 'email':
        // Sanitize email - basic cleanup and normalization
        if (typeof value === 'string') {
          sanitized[key] = sanitizeEmailInput(value)
        }
        break

      case 'nik':
        if (typeof value === 'string') {
          const afterRegex = value.replace(/\D/g, '')
          const sanitizedValue = afterRegex.substring(0, 16)
          sanitized[key] = sanitizedValue // ✅ FIX: Actually save the sanitized value!
        } else {
          console.log('[NIK_SANITIZATION_NON_STRING]', {
            value,
            type: typeof value,
          })
        }
        break

      default:
        // For other fields, just ensure they're safe strings if they are strings
        if (typeof value === 'string') {
          sanitized[key] = sanitizeGenericInput(value)
        } else {
          sanitized[key] = value
        }
        break
    }
  }

  return sanitized
}

/**
 * Sanitize general text input
 * Removes HTML tags, normalizes whitespace, and trims
 */
export function sanitizeTextInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 255) // Limit length to prevent DoS
}

/**
 * Sanitize phone number input
 * Keeps only valid phone number characters
 */
function sanitizePhoneInput(input: string): string {
  return input
    .replace(/[^0-9+\-\(\)\s]/g, '') // Keep only phone-valid characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 20) // Reasonable phone number length limit
}

/**
 * Sanitize email input
 * Basic email cleanup and normalization
 */
function sanitizeEmailInput(input: string): string {
  return input
    .toLowerCase() // Email addresses are case-insensitive
    .replace(/[<>'"&]/g, '') // Remove dangerous characters
    .replace(/\s/g, '') // Remove all whitespace
    .trim()
    .substring(0, 254) // RFC 5321 email length limit
}

/**
 * Sanitize generic string input
 * General purpose string sanitization
 */
function sanitizeGenericInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
    .trim()
    .substring(0, 500) // General length limit
}

// ==========================================
// RESPONSE FORMATTING UTILITIES
// ==========================================

/**
 * Format penyewa data for API response
 * Transforms database model to API response format
 */
export function formatPenyewaData(penyewa: {
  id: string
  nama: string
  telepon: string
  alamat: string
  email?: string | null
  nik?: string | null
  foto?: string | null
  catatan?: string | null
  createdAt: Date
  updatedAt: Date
}): PenyewaResponse {
  return {
    id: penyewa.id,
    nama: penyewa.nama,
    telepon: penyewa.telepon,
    alamat: penyewa.alamat,
    email: penyewa.email || null,
    nik: penyewa.nik || null,
    foto: penyewa.foto || null,
    catatan: penyewa.catatan || null,
    createdAt: penyewa.createdAt.toISOString(),
    updatedAt: penyewa.updatedAt.toISOString(),
  }
}

/**
 * Format penyewa list (simple array transformation)
 * Transforms array of database models to formatted array
 */
export function formatPenyewaList(
  penyewaList: Array<{
    id: string
    nama: string
    telepon: string
    alamat: string
    email?: string | null
    createdAt: Date
    updatedAt: Date
  }>,
): PenyewaResponse[] {
  return penyewaList.map(formatPenyewaData)
}

/**
 * Format penyewa list for paginated API response
 * Transforms array of database models to paginated response format
 */
export function formatPenyewaListWithPagination(
  penyewaList: Array<{
    id: string
    nama: string
    telepon: string
    alamat: string
    email?: string | null
    createdAt: Date
    updatedAt: Date
  }>,
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  },
): PenyewaListResponse {
  return {
    data: penyewaList.map(formatPenyewaData),
    pagination,
  }
}

/**
 * Create standardized success response
 * Provides consistent response structure across API endpoints
 */
export function createSuccessResponse<T = unknown>(
  data: T,
  message: string,
  statusCode: number = 200,
): { response: { success: true; data: T; message: string }; status: number } {
  return {
    response: {
      success: true,
      data,
      message,
    },
    status: statusCode,
  }
}

/**
 * Create standardized error response
 * Provides consistent error structure across API endpoints
 */
export function createErrorResponse(
  message: string,
  code: string,
  statusCode: number = 400,
  details?: unknown,
): {
  response: { success: false; error: { message: string; code: string; details?: unknown } }
  status: number
} {
  const errorResponse: { message: string; code: string; details?: unknown } = {
    message,
    code,
  }

  if (details) {
    errorResponse.details = details
  }

  return {
    response: {
      success: false,
      error: errorResponse,
    },
    status: statusCode,
  }
}

// ==========================================
// RETURN PROCESSING TYPES - Multi-Condition Support (TSK-24)
// ==========================================

// Multi-condition return support for enhanced return system with manual pricing
export interface ConditionSplit {
  kondisiAkhir: string
  jumlahKembali: number
  isLostItem?: boolean
  modalAwal?: number

  // New manual pricing fields
  conditionCategory: ConditionCategory
  manualPrice?: number
  useManualPricing: boolean
}

export interface MultiConditionReturnItem {
  itemId: string

  // Single-condition mode (backward compatibility)
  kondisiAkhir?: string
  jumlahKembali?: number

  // Multi-condition mode (enhanced)
  conditions?: ConditionSplit[]
}

export interface EnhancedReturnRequest {
  items: MultiConditionReturnItem[]
  catatan?: string
  tglKembali?: string

  // New flat penalty system fields
  applyFlatLatePenalty?: boolean // Whether to apply 20k flat late penalty
  customLatePenalty?: number // Override default 20k penalty if needed
}

export type ProcessingMode = 'single-condition' | 'multi-condition' | 'mixed'

export interface MultiConditionPenaltyResult {
  totalPenalty: number
  lateDays?: number

  // New flat penalty system fields
  flatLatePenalty: number // Always 20k if late
  conditionPenalties: number // Sum of all manual pricing
  isLateReturn: boolean

  conditionBreakdown: Array<{
    kondisiAkhir: string
    conditionCategory: ConditionCategory
    quantity: number
    penaltyPerUnit: number
    totalConditionPenalty: number
    calculationMethod: 'flat_late' | 'manual_pricing' | 'modal_awal' | 'none'
    description: string
    manualPrice?: number
    useManualPricing: boolean
  }>
  breakdown?: Array<{
    itemId: string
    itemName: string
    splitIndex?: number
    kondisiAkhir: string
    conditionCategory: ConditionCategory
    jumlahKembali: number
    isLostItem: boolean
    latePenalty: number
    modalAwal?: number
    modalAwalUsed?: number
    penaltyAmount: number
    conditionPenalty: number
    manualPrice?: number
    useManualPricing: boolean
    totalItemPenalty: number
    calculationMethod: string
    description: string
    rateApplied?: number
  }>
  summary: {
    totalQuantity: number
    lostItems: number
    goodItems: number
    damagedItems: number
    totalConditions?: number
    onTimeItems?: number
    lateItems?: number
    totalItems?: number
    averageConditionsPerItem?: number
    totalManuallyPriced?: number
    totalFlatPenalties?: number
  }
  calculationMetadata?: {
    calculatedAt: string
    processingMode: ProcessingMode
    itemCount: number
    totalConditions: number
    hasLateItems: boolean
    itemsProcessed?: number
    conditionSplits?: number
    usesManualPricing: boolean
    usesFlatPenalty: boolean
  }
}

export interface MultiConditionValidationResult {
  isValid: boolean
  errors: Array<{
    field: string
    message: string
    code: string
  }>
  mode: ProcessingMode
}

export interface EnhancedReturnProcessingResult {
  success: boolean
  transactionId: string
  returnedAt: Date
  penalty: number
  itemsProcessed?: number
  conditionSplitsProcessed?: number
  totalPenalty?: number
  message?: string
  errors?: string[]
  warnings?: string[]
  processedItems: Array<{
    itemId: string
    penalty: number
    kondisiAkhir: string | 'multi-condition'
    statusKembali: 'lengkap'
    conditionBreakdown?: Array<{
      kondisiAkhir: string
      jumlahKembali: number
      penaltyAmount: number
    }>
  }>

  // Success case properties
  processingMode?: ProcessingMode
  multiConditionSummary?: Record<string, MultiConditionPenaltyResult>

  // Error case properties
  details?: {
    statusCode: 'ALREADY_RETURNED' | 'INVALID_STATUS' | 'VALIDATION_ERROR'
    message: string
    currentStatus: string
    originalReturnDate?: Date | null
    processingTime: number
    validationErrors?: Array<{
      field: string
      message: string
      code: string
    }>
  }
}

export interface TransaksiItemReturnData {
  id: string
  transaksiItemId: string
  kondisiAkhir: string
  jumlahKembali: number
  penaltyAmount: number
  modalAwalUsed?: number
  penaltyCalculation?: Record<string, unknown>
  createdAt: Date
  createdBy: string
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

// ==========================================
// TSK-24 UNIFIED MULTI-CONDITION TYPES
// ==========================================

export interface EnhancedItemCondition {
  itemId: string
  mode: 'single' | 'multi'
  conditions: ConditionSplit[]
  isValid: boolean
  totalQuantity: number
  remainingQuantity: number
  validationError?: string
}

export interface ConditionValidationResult {
  isValid: boolean
  remaining: number
  totalReturned: number
  maxAllowed: number
  error?: string
  warnings?: string[]
}

export interface MultiConditionFormValidation {
  itemValidations: Record<string, ConditionValidationResult>
  isFormValid: boolean
  canProceed: boolean
  errors: string[]
  warnings: string[]
}

export interface ModeToggleProps {
  mode: 'single' | 'multi'
  onModeChange: (mode: 'single' | 'multi') => void
  disabled?: boolean
  itemQuantity: number
  showLabels?: boolean
}

export interface ConditionRowProps {
  condition: ConditionSplit
  onChange: (condition: ConditionSplit) => void
  onRemove?: () => void
  disabled?: boolean
  canRemove?: boolean
  autoFocus?: boolean
  maxQuantity?: number
  remainingQuantity?: number
  productModalAwal?: number
}

export interface UnifiedConditionFormProps {
  item: TransaksiItemResponse // Fix: Use the correct type name
  value: EnhancedItemCondition | null
  onChange: (condition: EnhancedItemCondition) => void
  disabled?: boolean
  isLoading?: boolean
  remainingQuantity?: number // Add remaining quantity prop for accurate default calculation
  pairingInfo?: {
    isPaired: boolean
    isJas: boolean
    linkedSarungData?: {
      productId: string
      productSizeId: string
      quantity: number
      product?: {
        name: string
        code: string
      }
    }
    displayName?: string
  } // Add pairing information for UI display
}

export type ReturnProcessingResult = EnhancedReturnProcessingResult

// Constants for penalty calculation
export const DAILY_LATE_RATE = 5000 // Rp 5,000 per day late fee
export const PENALTY_RATES = {
  kotor: 5000,
  'rusak ringan': 15000,
  'rusak berat': 50000,
  hilang: 'modal_awal',
} as const

// ==========================================
// REFUND PROCESSING TYPES - Task 6
// ==========================================

/**
 * Enhanced Activity Log Data Structure for Cancel Transaction Refund
 * Extends existing activity data with refund tracking fields
 */
export interface CancelActivityData {
  // Existing fields
  previousStatus: string
  newStatus: 'cancelled'
  reason: string | null
  totalAmount: string
  amountPaid: string
  remainingAmount: string
  itemsCount: number
  stockRestored: boolean
  cancelledAt: string
  
  // ✅ NEW: Refund tracking fields
  needsRefund: boolean // false when refund processed, true when pending
  refundProcessed?: boolean // true when refund completed
  refundAmount?: number // actual refund amount
  expenseRecordCreated?: boolean // true when expense record created
  refundCategory?: string // 'Refund Pembatalan Transaksi'
  refundError?: string // error message if refund failed
}

/**
 * Refund Status Types
 */
export type RefundStatus = 'pending' | 'completed' | 'failed'

/**
 * Refund Activity Data - Subset of CancelActivityData for refund-specific operations
 */
export interface RefundActivityData {
  refundProcessed: boolean
  refundAmount?: number
  expenseRecordCreated?: boolean
  refundError?: string
}

/**
 * Refund Expense Record Structure
 */
export interface RefundExpenseRecord {
  kasirId: string // Processing kasir
  harga: number // Positive refund amount (Decimal converted to number for UI)
  kategori: 'Refund Pembatalan Transaksi' // Fixed category
  deskripsi: string // "Refund pembatalan transaksi #[code] - [customer]"
  createdBy: string // User who processed cancellation
  isActive: true // Always active for refunds
}

/**
 * Refund Payment Record Structure
 */
export interface RefundPaymentRecord {
  transaksiId: string // Original transaction
  jumlah: number // Negative amount (refund) - Decimal converted to number for UI
  metode: 'refund' // Fixed method
  catatan: string // "Refund pembatalan transaksi: [reason]"
  createdBy: string // User who processed cancellation
}
