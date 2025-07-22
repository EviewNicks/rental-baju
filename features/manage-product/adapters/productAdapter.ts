/**
 * Product Adapter - Data Access Layer
 * Handles all product-related API communications
 */

import { httpClient, createQueryString } from './base/http-client'
import type {
  GetProductsParams,
  CreateProductRequest,
  UpdateProductRequest,
  UpdateProductStatusRequest,
} from './types/requests'
import type {
  ProductResponse,
  ProductListApiResponse,
  ProductDeleteResponse,
} from './types/responses'

export const productAdapter = {
  /**
   * Get products with pagination and filtering
   */
  async getProducts(params: GetProductsParams = {}): Promise<ProductListApiResponse> {
    const queryString = createQueryString(params as Record<string, unknown>)
    const url = `/api/products${queryString ? `?${queryString}` : ''}`

    const response = await httpClient.get<ProductListApiResponse>(url)
    return response.data
  },

  /**
   * Get single product by ID
   */
  async getProduct(id: string): Promise<ProductResponse> {
    if (!id) {
      throw new Error('Product ID is required')
    }

    const response = await httpClient.get<ProductResponse>(`/api/products/${id}`)
    return response.data
  },

  /**
   * Create new product
   */
  async createProduct(data: CreateProductRequest): Promise<ProductResponse> {
    // Validate required fields
    if (!data.code || !data.name || !data.categoryId) {
      throw new Error('Missing required fields: code, name, categoryId')
    }

    // Create FormData for multipart upload
    const formData = new FormData()
    formData.append('code', data.code)
    formData.append('name', data.name)
    formData.append('categoryId', data.categoryId)
    formData.append('modalAwal', data.modalAwal.toString())
    formData.append('hargaSewa', data.hargaSewa.toString())
    formData.append('quantity', data.quantity.toString())

    if (data.description) {
      formData.append('description', data.description)
    }

    if (data.image) {
      formData.append('image', data.image)
    }

    const response = await httpClient.post<ProductResponse>('/api/products', formData, {
      headers: {}, // Let browser set Content-Type for FormData
    })

    return response.data
  },

  /**
   * Update existing product
   */
  async updateProduct(id: string, data: UpdateProductRequest): Promise<ProductResponse> {
    if (!id) {
      throw new Error('Product ID is required')
    }

    // Create FormData for multipart upload
    const formData = new FormData()

    // Only append fields that are provided
    if (data.name !== undefined) formData.append('name', data.name)
    if (data.description !== undefined) formData.append('description', data.description)
    if (data.modalAwal !== undefined) formData.append('modalAwal', data.modalAwal.toString())
    if (data.hargaSewa !== undefined) formData.append('hargaSewa', data.hargaSewa.toString())
    if (data.quantity !== undefined) formData.append('quantity', data.quantity.toString())
    if (data.categoryId !== undefined) formData.append('categoryId', data.categoryId)
    if (data.image) formData.append('image', data.image)

    const response = await httpClient.put<ProductResponse>(`/api/products/${id}`, formData, {
      headers: {}, // Let browser set Content-Type for FormData
    })

    return response.data
  },

  /**
   * Update product status
   */
  async updateProductStatus(
    id: string,
    statusData: UpdateProductStatusRequest,
  ): Promise<ProductResponse> {
    if (!id) {
      throw new Error('Product ID is required')
    }

    if (!statusData.status) {
      throw new Error('Status is required')
    }

    const response = await httpClient.put<ProductResponse>(`/api/products/${id}/status`, statusData)

    return response.data
  },

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(id: string): Promise<ProductDeleteResponse> {
    if (!id) {
      throw new Error('Product ID is required')
    }

    const response = await httpClient.delete<ProductDeleteResponse>(`/api/products/${id}`)

    // If API returns the deleted product, transform to delete response
    if (response.data && typeof response.data === 'object' && 'id' in response.data) {
      return {
        success: true,
        message: 'Product deleted successfully',
      }
    }

    return response.data
  },

  /**
   * Search products (alias for getProducts with search parameter)
   */
  async searchProducts(
    searchTerm: string,
    params: GetProductsParams = {},
  ): Promise<ProductListApiResponse> {
    return this.getProducts({
      ...params,
      search: searchTerm,
    })
  },

  /**
   * Get products by category
   */
  async getProductsByCategory(
    categoryId: string,
    params: GetProductsParams = {},
  ): Promise<ProductListApiResponse> {
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
    params: GetProductsParams = {},
  ): Promise<ProductListApiResponse> {
    return this.getProducts({
      ...params,
      status,
    })
  },

  /**
   * Check if product code exists
   */
  async checkProductCode(code: string): Promise<boolean> {
    try {
      const response = await this.getProducts({ search: code, limit: 1 })
      return response.products.some((product) => product.code === code)
    } catch {
      return false
    }
  },
}
