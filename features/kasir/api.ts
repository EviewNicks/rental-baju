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
} from './types/api'

// Base API configuration
const API_BASE_URL = '/api/kasir'

// Custom error class for API errors
export class KasirApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
    public validationErrors?: Array<{ field: string; message: string }>
  ) {
    super(message)
    this.name = 'KasirApiError'
  }
}

// Generic fetch wrapper with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
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
        Array.isArray(error.details) ? error.details as Array<{ field: string; message: string }> : undefined
      )
    }

    if (!data.success) {
      throw new KasirApiError(
        data.error?.code || 'API_ERROR',
        data.message || 'Terjadi kesalahan',
        data.error?.details
      )
    }

    return data.data as T
  } catch (error) {
    if (error instanceof KasirApiError) {
      throw error
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new KasirApiError(
        'NETWORK_ERROR',
        'Koneksi bermasalah. Silakan coba lagi.'
      )
    }
    
    // Handle other errors
    throw new KasirApiError(
      'UNKNOWN_ERROR',
      'Terjadi kesalahan tidak terduga'
    )
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
        value.forEach(item => {
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
    return apiRequest<PenyewaResponse>('/penyewa', {
      method: 'POST',
      body: JSON.stringify(data),
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
    return apiRequest<PenyewaResponse>(`/penyewa/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
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

  static async updateTransaksi(kode: string, data: UpdateTransaksiRequest): Promise<TransaksiResponse> {
    return apiRequest<TransaksiResponse>(`/transaksi/${kode}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Produk (Product) Operations
  static async getAvailableProducts(params: ProductAvailabilityQueryParams = {}): Promise<ProductAvailabilityListResponse> {
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
    data: Partial<Omit<CreatePembayaranRequest, 'transaksiId'>>
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
    getByStatus: (status: string) => KasirApi.getTransaksiList({ status: status as TransactionStatus }),
    search: (query: string) => KasirApi.getTransaksiList({ search: query } as TransaksiQueryParams),
  },

  // Product shortcuts
  produk: {
    getAvailable: (params?: ProductAvailabilityQueryParams) => KasirApi.getAvailableProducts(params),
    search: (query: string) => KasirApi.getAvailableProducts({ search: query, available: true }),
    getByCategory: (categoryId: string) => KasirApi.getAvailableProducts({ categoryId, available: true }),
  },

  // Payment shortcuts
  pembayaran: {
    create: (data: CreatePembayaranRequest) => KasirApi.createPembayaran(data),
    update: (id: string, data: Partial<Omit<CreatePembayaranRequest, 'transaksiId'>>) => 
      KasirApi.updatePembayaran(id, data),
  },
}