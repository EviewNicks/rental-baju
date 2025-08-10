/**
 * Kasir API Client - RPK-27
 * Centralized API client for kasir feature following BE-26 endpoint contracts
 * Provides CRUD operations with proper error handling and type safety
 */

import type {
  // Dashboard types
  DashboardStats,

  // Penyewa types
  CreatePenyewaRequest,
  UpdatePenyewaRequest,
  PenyewaResponse,
  PenyewaListResponse,
  PenyewaQueryParams,

  // Transaksi types
  CreateTransaksiRequest,
  UpdateTransaksiRequest,
  TransaksiResponse,
  TransaksiListResponse,
  TransaksiQueryParams,
  TransactionStatus,

  // Pembayaran types
  CreatePembayaranRequest,
  PembayaranResponse,

  // Product types
  ProductAvailabilityListResponse,
  ProductAvailabilityQueryParams,

  // API wrapper types
  ApiResponse,
} from './types'
import { kasirLogger } from './lib/logger'

// Base API configuration
const API_BASE_URL = '/api/kasir'

// ==========================================
// INPUT SANITIZATION UTILITIES
// ==========================================

/**
 * Sanitize and validate penyewa input data
 * Removes potentially harmful content and normalizes input
 */
function sanitizePenyewaInput(input: Record<string, unknown>): Record<string, unknown> {
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
function sanitizeTextInput(input: string): string {
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

/**
 * Deep sanitize object recursively
 * Applies sanitization to nested objects and arrays
 *
 * @deprecated Not currently used in API client - for future use
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function deepSanitizeObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === 'string') {
    return sanitizeGenericInput(obj)
  }

  if (Array.isArray(obj)) {
    return obj.map(deepSanitizeObject)
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      sanitized[key] = deepSanitizeObject(value)
    }
    return sanitized
  }

  return obj
}

// Custom error class for API errors
export class KasirApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
    public validationErrors?: Array<{ field: string; message: string }>,
  ) {
    super(message)
    this.name = 'KasirApiError'
  }
}

// Generic fetch wrapper with error handling
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)
    const data: ApiResponse<T> = await response.json()

    if (!response.ok) {
      const error = data.error || {
        code: 'UNKNOWN_ERROR',
        message: data.message || 'Terjadi kesalahan pada server',
      }

      throw new KasirApiError(
        error.code,
        error.message,
        error.details,
        Array.isArray(error.details)
          ? (error.details as Array<{ field: string; message: string }>)
          : undefined,
      )
    }

    if (!data.success) {
      throw new KasirApiError(
        data.error?.code || 'API_ERROR',
        data.message || 'Terjadi kesalahan',
        data.error?.details,
      )
    }

    return data.data as T
  } catch (error) {
    if (error instanceof KasirApiError) {
      throw error
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new KasirApiError('NETWORK_ERROR', 'Koneksi bermasalah. Silakan coba lagi.')
    }

    // Handle other errors
    throw new KasirApiError('UNKNOWN_ERROR', 'Terjadi kesalahan tidak terduga')
  }
}

// Build query string from params
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'object' && !Array.isArray(value)) {
        // Handle nested objects (like dateRange)
        Object.entries(value).forEach(([nestedKey, nestedValue]) => {
          if (nestedValue !== undefined && nestedValue !== null) {
            searchParams.append(`${key}.${nestedKey}`, String(nestedValue))
          }
        })
      } else if (Array.isArray(value)) {
        // Handle arrays
        value.forEach((item) => {
          searchParams.append(key, String(item))
        })
      } else {
        searchParams.append(key, String(value))
      }
    }
  })

  return searchParams.toString()
}

/**
 * Kasir API Client Class
 */
export class KasirApi {
  // Dashboard Operations
  static async getDashboardStats(): Promise<DashboardStats> {
    return apiRequest<DashboardStats>('/dashboard')
  }

  // Penyewa (Customer) Operations
  static async createPenyewa(data: CreatePenyewaRequest): Promise<PenyewaResponse> {
    // Sanitize input data before sending
    const sanitizedData = sanitizePenyewaInput(
      data as unknown as Record<string, unknown>,
    ) as unknown as CreatePenyewaRequest

    return apiRequest<PenyewaResponse>('/penyewa', {
      method: 'POST',
      body: JSON.stringify(sanitizedData),
    })
  }

  static async getPenyewaById(id: string): Promise<PenyewaResponse> {
    return apiRequest<PenyewaResponse>(`/penyewa/${id}`)
  }

  static async getPenyewaList(params: PenyewaQueryParams = {}): Promise<PenyewaListResponse> {
    const queryString = buildQueryString(params)
    const endpoint = queryString ? `/penyewa?${queryString}` : '/penyewa'
    return apiRequest<PenyewaListResponse>(endpoint)
  }

  static async updatePenyewa(id: string, data: UpdatePenyewaRequest): Promise<PenyewaResponse> {
    // Sanitize input data before sending
    const sanitizedData = sanitizePenyewaInput(
      data as unknown as Record<string, unknown>,
    ) as unknown as UpdatePenyewaRequest

    return apiRequest<PenyewaResponse>(`/penyewa/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sanitizedData),
    })
  }

  // Transaksi (Transaction) Operations
  static async createTransaksi(data: CreateTransaksiRequest): Promise<TransaksiResponse> {
    return apiRequest<TransaksiResponse>('/transaksi', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  static async getTransaksiByKode(kode: string): Promise<TransaksiResponse> {
    return apiRequest<TransaksiResponse>(`/transaksi/${kode}`)
  }

  static async getTransaksiList(params: TransaksiQueryParams = {}): Promise<TransaksiListResponse> {
    const queryString = buildQueryString(params)
    const endpoint = queryString ? `/transaksi?${queryString}` : '/transaksi'
    return apiRequest<TransaksiListResponse>(endpoint)
  }

  static async updateTransaksi(
    kode: string,
    data: UpdateTransaksiRequest,
  ): Promise<TransaksiResponse> {
    return apiRequest<TransaksiResponse>(`/transaksi/${kode}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Process return for transaction (backward compatible)
  static async processReturn(
    transactionId: string,
    returnData: {
      items: Array<{
        itemId: string
        kondisiAkhir: string
        jumlahKembali: number
      }>
      catatan?: string
      tglKembali?: string
    },
  ): Promise<TransaksiResponse> {
    return apiRequest<TransaksiResponse>(`/transaksi/${transactionId}/pengembalian`, {
      method: 'PUT',
      body: JSON.stringify(returnData),
    })
  }

  // Enhanced multi-condition return processing (TSK-24 Phase 2)
  static async processEnhancedReturn(
    transactionId: string,
    returnData: {
      items: Array<{
        itemId: string
        // Single condition (existing format)
        kondisiAkhir?: string
        jumlahKembali?: number
        // Multi-condition (enhanced format)
        conditions?: Array<{
          kondisiAkhir: string
          jumlahKembali: number
          modalAwal?: number
        }>
      }>
      catatan?: string
      tglKembali?: string
    },
  ): Promise<{
    success: boolean
    processingMode: 'single-condition' | 'multi-condition' | 'mixed'
    transactionId: string
    itemsProcessed: number
    conditionSplitsProcessed: number
    totalPenalty: number
    message: string
    errors?: string[]
    warnings?: string[]
  }> {
    const timer = kasirLogger.performance.startTimer(
      'processEnhancedReturn',
      'Enhanced return API call',
    )

    // Detect processing mode for logging
    const hasMultiConditions = returnData.items.some(
      (item) => item.conditions && item.conditions.length > 1,
    )
    const totalConditions = returnData.items.reduce(
      (sum, item) => sum + (item.conditions?.length || 1),
      0,
    )

    kasirLogger.apiCalls.info('processEnhancedReturn', 'Starting enhanced return API call', {
      transactionId,
      itemCount: returnData.items.length,
      totalConditions,
      hasMultiConditions,
      hasNotes: !!returnData.catatan,
    })

    try {
      const result = await apiRequest<{
        success: boolean
        processingMode: 'single-condition' | 'multi-condition' | 'mixed'
        transactionId: string
        itemsProcessed: number
        conditionSplitsProcessed: number
        totalPenalty: number
        message: string
        errors?: string[]
        warnings?: string[]
      }>(`/transaksi/${transactionId}/pengembalian`, {
        method: 'PUT',
        body: JSON.stringify(returnData),
        headers: {
          'Content-Type': 'application/json',
          'X-Multi-Condition': 'true', // Signal for enhanced processing
        },
      })

      kasirLogger.apiCalls.info('processEnhancedReturn', 'Enhanced return API call completed', {
        success: result.success,
        processingMode: result.processingMode,
        itemsProcessed: result.itemsProcessed,
        conditionSplitsProcessed: result.conditionSplitsProcessed,
        totalPenalty: result.totalPenalty,
        hasErrors: !!result.errors?.length,
        hasWarnings: !!result.warnings?.length,
      })

      timer.end('Enhanced return API call completed')
      return result
    } catch (error) {
      kasirLogger.apiCalls.error(
        'processEnhancedReturn',
        'Enhanced return API call failed',
        error instanceof Error ? error : { error: String(error) },
      )
      throw error
    }
  }

  // Calculate enhanced penalties for multi-condition scenarios
  static async calculateEnhancedPenalties(
    transactionId: string,
    returnData: {
      items: Array<{
        itemId: string
        // Single condition (existing format)
        kondisiAkhir?: string
        jumlahKembali?: number
        // Multi-condition (enhanced format)
        conditions?: Array<{
          kondisiAkhir: string
          jumlahKembali: number
          modalAwal?: number
        }>
      }>
      catatan?: string
      tglKembali?: string
    },
  ): Promise<{
    totalPenalty: number
    lateDays: number
    breakdown: Array<{
      itemId: string
      itemName: string
      splitIndex?: number
      kondisiAkhir: string
      jumlahKembali: number
      isLostItem: boolean
      latePenalty: number
      conditionPenalty: number
      modalAwalUsed?: number
      totalItemPenalty: number
      calculationMethod: 'late_fee' | 'modal_awal' | 'damage_fee' | 'none'
      description: string
      rateApplied?: number
    }>
    summary: {
      totalItems: number
      totalConditions: number
      onTimeItems: number
      lateItems: number
      damagedItems: number
      lostItems: number
      singleConditionItems: number
      multiConditionItems: number
      averageConditionsPerItem: number
    }
    calculationMetadata: {
      processingMode: 'single' | 'multi' | 'mixed'
      itemsProcessed: number
      conditionSplits: number
      calculatedAt: string
    }
  }> {
    const timer = kasirLogger.performance.startTimer(
      'calculateEnhancedPenalties',
      'Enhanced penalty calculation API call',
    )

    // Analyze data for logging
    const hasMultiConditions = returnData.items.some(
      (item) => item.conditions && item.conditions.length > 1,
    )
    const totalConditions = returnData.items.reduce(
      (sum, item) => sum + (item.conditions?.length || 1),
      0,
    )

    kasirLogger.apiCalls.info(
      'calculateEnhancedPenalties',
      'Starting enhanced penalty calculation',
      {
        transactionId,
        itemCount: returnData.items.length,
        totalConditions,
        hasMultiConditions,
      },
    )

    try {
      const result = await apiRequest<{
        totalPenalty: number
        lateDays: number
        breakdown: Array<{
          itemId: string
          itemName: string
          splitIndex?: number
          kondisiAkhir: string
          jumlahKembali: number
          isLostItem: boolean
          latePenalty: number
          conditionPenalty: number
          modalAwalUsed?: number
          totalItemPenalty: number
          calculationMethod: 'late_fee' | 'modal_awal' | 'damage_fee' | 'none'
          description: string
          rateApplied?: number
        }>
        summary: {
          totalItems: number
          totalConditions: number
          onTimeItems: number
          lateItems: number
          damagedItems: number
          lostItems: number
          singleConditionItems: number
          multiConditionItems: number
          averageConditionsPerItem: number
        }
        calculationMetadata: {
          processingMode: 'single' | 'multi' | 'mixed'
          itemsProcessed: number
          conditionSplits: number
          calculatedAt: string
        }
      }>(`/transaksi/${transactionId}/pengembalian/calculate`, {
        method: 'POST',
        body: JSON.stringify(returnData),
        headers: {
          'Content-Type': 'application/json',
          'X-Multi-Condition': 'true',
        },
      })

      kasirLogger.penaltyCalc.info(
        'calculateEnhancedPenalties',
        'Enhanced penalty calculation completed',
        {
          totalPenalty: result.totalPenalty,
          lateDays: result.lateDays,
          breakdownItems: result.breakdown.length,
          processingMode: result.calculationMetadata.processingMode,
          itemsProcessed: result.calculationMetadata.itemsProcessed,
          conditionSplits: result.calculationMetadata.conditionSplits,
        },
      )

      timer.end('Enhanced penalty calculation completed')
      return result
    } catch (error) {
      kasirLogger.penaltyCalc.error(
        'calculateEnhancedPenalties',
        'Enhanced penalty calculation failed',
        error instanceof Error ? error : { error: String(error) },
      )
      throw error
    }
  }

  // Pickup operations (TSK-22 integration)
  static async processPickup(
    transactionId: string,
    pickupData: {
      items: Array<{
        id: string
        jumlahDiambil: number
      }>
    },
  ): Promise<TransaksiResponse> {
    return apiRequest<TransaksiResponse>(`/transaksi/${transactionId}/pickup`, {
      method: 'PUT',
      body: JSON.stringify(pickupData),
    })
  }

  // Produk (Product) Operations
  static async getAvailableProducts(
    params: ProductAvailabilityQueryParams = {},
  ): Promise<ProductAvailabilityListResponse> {
    const queryString = buildQueryString(params)
    const endpoint = queryString ? `/produk/available?${queryString}` : '/produk/available'
    return apiRequest<ProductAvailabilityListResponse>(endpoint)
  }

  // Pembayaran (Payment) Operations
  static async createPembayaran(data: CreatePembayaranRequest): Promise<PembayaranResponse> {
    return apiRequest<PembayaranResponse>('/pembayaran', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  static async updatePembayaran(
    id: string,
    data: Partial<Omit<CreatePembayaranRequest, 'transaksiId'>>,
  ): Promise<PembayaranResponse> {
    return apiRequest<PembayaranResponse>(`/pembayaran/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }
}

// Export default instance for convenience
export default KasirApi

// Helper functions for common operations
export const kasirApi = {
  // Dashboard shortcuts
  dashboard: {
    getStats: () => KasirApi.getDashboardStats(),
  },

  // Customer shortcuts with common patterns
  penyewa: {
    create: (data: CreatePenyewaRequest) => KasirApi.createPenyewa(data),
    getById: (id: string) => KasirApi.getPenyewaById(id),
    getAll: (params?: PenyewaQueryParams) => KasirApi.getPenyewaList(params),
    update: (id: string, data: UpdatePenyewaRequest) => KasirApi.updatePenyewa(id, data),
    search: (query: string) => KasirApi.getPenyewaList({ search: query, limit: 10 }),
  },

  // Transaction shortcuts
  transaksi: {
    create: (data: CreateTransaksiRequest) => KasirApi.createTransaksi(data),
    getByKode: (kode: string) => KasirApi.getTransaksiByKode(kode),
    getAll: (params?: TransaksiQueryParams) => KasirApi.getTransaksiList(params),
    update: (kode: string, data: UpdateTransaksiRequest) => KasirApi.updateTransaksi(kode, data),
    getByStatus: (status: string) =>
      KasirApi.getTransaksiList({ status: status as TransactionStatus }),
    search: (query: string) => KasirApi.getTransaksiList({ search: query } as TransaksiQueryParams),
  },

  // Return operations (backward compatible)
  processReturn: (
    transactionId: string,
    returnData: {
      items: Array<{
        itemId: string
        kondisiAkhir: string
        jumlahKembali: number
      }>
      catatan?: string
      tglKembali?: string
    },
  ) => KasirApi.processReturn(transactionId, returnData),

  // Enhanced multi-condition return operations (TSK-24 Phase 2)
  processEnhancedReturn: (
    transactionId: string,
    returnData: {
      items: Array<{
        itemId: string
        // Single condition (existing format)
        kondisiAkhir?: string
        jumlahKembali?: number
        // Multi-condition (enhanced format)
        conditions?: Array<{
          kondisiAkhir: string
          jumlahKembali: number
          modalAwal?: number
        }>
      }>
      catatan?: string
      tglKembali?: string
    },
  ) => KasirApi.processEnhancedReturn(transactionId, returnData),

  calculateEnhancedPenalties: (
    transactionId: string,
    returnData: {
      items: Array<{
        itemId: string
        kondisiAkhir?: string
        jumlahKembali?: number
        conditions?: Array<{
          kondisiAkhir: string
          jumlahKembali: number
          modalAwal?: number
        }>
      }>
      catatan?: string
      tglKembali?: string
    },
  ) => KasirApi.calculateEnhancedPenalties(transactionId, returnData),

  // Transaction lookup by code (for return process)
  getTransactionByCode: (code: string) => KasirApi.getTransaksiByKode(code),

  // Pickup operations
  processPickup: (
    transactionId: string,
    pickupData: {
      items: Array<{
        id: string
        jumlahDiambil: number
      }>
    },
  ) => KasirApi.processPickup(transactionId, pickupData),

  // Product shortcuts
  produk: {
    getAvailable: (params?: ProductAvailabilityQueryParams) =>
      KasirApi.getAvailableProducts(params),
    search: (query: string) => KasirApi.getAvailableProducts({ search: query, available: true }),
    getByCategory: (categoryId: string) =>
      KasirApi.getAvailableProducts({ categoryId, available: true }),
    getById: (id: string) => {
      // Get specific product details using the available products API
      // Since kasir available API doesn't support direct ID lookup, we'll filter in frontend
      return KasirApi.getAvailableProducts({ search: '', available: false }).then((response) => {
        const product = response.data.find((p) => p.id === id)
        if (!product) {
          throw new Error(`Product with ID ${id} not found`)
        }
        return product
      })
    },
  },

  // Payment shortcuts
  pembayaran: {
    create: (data: CreatePembayaranRequest) => KasirApi.createPembayaran(data),
    update: (id: string, data: Partial<Omit<CreatePembayaranRequest, 'transaksiId'>>) =>
      KasirApi.updatePembayaran(id, data),
  },
}
