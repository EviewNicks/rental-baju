/**
 * Public Product API Client
 *
 * API client for homepage to fetch public product data
 * without authentication requirements. Used for FeaturedItemsSection.
 */

// PublicProduct interface matching API response structure
export interface PublicProduct {
  id: string
  code: string
  name: string
  description?: string
  category: {
    name: string
    color: string
  }
  color?: {
    name: string
    hexCode?: string
  }
  currentPrice: number // Harga sewa per hari
  modalAwal: number    // Nilai barang
  imageUrl?: string
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE'
  sizes: Array<{
    size: string
    ageCategory: string
    quantity: number
  }>
  isActive: boolean
}

// Query parameters for public product API
export interface PublicProductQueryParams {
  page?: number
  limit?: number
  search?: string
  categoryId?: string
  status?: string
}

// API response structure
export interface PublicProductResponse {
  products: PublicProduct[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Error response structure
interface ApiError {
  error: {
    message: string
    code: string
  }
}

/**
 * Base API configuration
 */
const API_BASE_URL = '/api/public'

/**
 * Generic API request handler with error handling and retry logic
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    // Handle HTTP errors
    if (!response.ok) {
      const errorData: ApiError = await response.json()
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to server')
    }

    // Re-throw other errors
    throw error
  }
}

/**
 * Build query string from parameters
 */
function buildQueryString(params: PublicProductQueryParams): string {
  const queryParams = new URLSearchParams()

  if (params.page) queryParams.set('page', params.page.toString())
  if (params.limit) queryParams.set('limit', params.limit.toString())
  if (params.search) queryParams.set('search', params.search)
  if (params.categoryId) queryParams.set('categoryId', params.categoryId)
  if (params.status) queryParams.set('status', params.status)

  const queryString = queryParams.toString()
  return queryString ? `?${queryString}` : ''
}

/**
 * Public Product API Functions
 */
export const publicProductApi = {
  /**
   * Get list of public products with optional filtering and pagination
   */
  async getProducts(params: PublicProductQueryParams = {}): Promise<PublicProductResponse> {
    const queryString = buildQueryString(params)
    const endpoint = `/products${queryString}`

    return apiRequest<PublicProductResponse>(endpoint)
  },

  /**
   * Get single product detail by ID
   */
  async getProductDetail(id: string): Promise<PublicProduct> {
    if (!id || typeof id !== 'string') {
      throw new Error('Product ID is required and must be a string')
    }

    const endpoint = `/products/${encodeURIComponent(id)}`
    return apiRequest<PublicProduct>(endpoint)
  },

  /**
   * Get featured products for homepage (AVAILABLE only, limited)
   * Default: first 10 available products
   */
  async getFeaturedProducts(limit: number = 10): Promise<PublicProductResponse> {
    return this.getProducts({
      limit,
      status: 'AVAILABLE',
      page: 1,
    })
  },

  /**
   * Search products by name or description
   */
  async searchProducts(
    query: string,
    params: Omit<PublicProductQueryParams, 'search'> = {}
  ): Promise<PublicProductResponse> {
    return this.getProducts({
      ...params,
      search: query,
    })
  },

  /**
   * Get products by category
   */
  async getProductsByCategory(
    categoryId: string,
    params: Omit<PublicProductQueryParams, 'categoryId'> = {}
  ): Promise<PublicProductResponse> {
    return this.getProducts({
      ...params,
      categoryId,
    })
  },

  /**
   * Get products by status
   */
  async getProductsByStatus(
    status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE',
    params: Omit<PublicProductQueryParams, 'status'> = {}
  ): Promise<PublicProductResponse> {
    return this.getProducts({
      ...params,
      status,
    })
  },
}