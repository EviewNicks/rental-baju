/**
 * Category Adapter - Data Access Layer
 * Handles all category-related API communications
 */

import { httpClient } from './base/http-client'
import type { CreateCategoryRequest, UpdateCategoryRequest } from './types/requests'
import type {
  CategoryResponse,
  CategoryListResponse,
  CategoryDeleteResponse,
} from './types/responses'

export const categoryAdapter = {
  /**
   * Get all categories
   */
  async getCategories(params: { search?: string; includeProducts?: boolean } = {}): Promise<CategoryListResponse> {
    const queryParams = new URLSearchParams()
    
    if (params.search) {
      queryParams.append('search', params.search)
    }
    
    if (params.includeProducts) {
      queryParams.append('includeProducts', 'true')
    }

    const url = queryParams.toString() 
      ? `/api/categories?${queryParams.toString()}`
      : '/api/categories'

    const response = await httpClient.get<CategoryResponse[]>(url)

    // Transform response to match expected format
    const categories = Array.isArray(response.data) ? response.data : []

    return {
      categories,
      total: categories.length,
    }
  },

  /**
   * Get single category by ID
   */
  async getCategory(id: string): Promise<CategoryResponse> {
    if (!id) {
      throw new Error('Category ID is required')
    }

    const response = await httpClient.get<CategoryResponse>(`/api/categories/${id}`)
    return response.data
  },

  /**
   * Create new category
   */
  async createCategory(data: CreateCategoryRequest): Promise<CategoryResponse> {
    // Validate required fields
    if (!data.name || !data.color) {
      throw new Error('Missing required fields: name, color')
    }

    // Validate color format (should be hex color)
    if (!/^#[0-9A-F]{6}$/i.test(data.color)) {
      throw new Error('Color must be a valid hex color code (e.g., #FF0000)')
    }

    const response = await httpClient.post<CategoryResponse>('/api/categories', data)
    return response.data
  },

  /**
   * Update existing category
   */
  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<CategoryResponse> {
    if (!id) {
      throw new Error('Category ID is required')
    }

    // Validate color format if provided
    if (data.color && !/^#[0-9A-F]{6}$/i.test(data.color)) {
      throw new Error('Color must be a valid hex color code (e.g., #FF0000)')
    }

    // Filter out undefined values
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([value]) => value !== undefined),
    )

    if (Object.keys(updateData).length === 0) {
      throw new Error('At least one field must be provided for update')
    }

    const response = await httpClient.put<CategoryResponse>(`/api/categories/${id}`, updateData)
    return response.data
  },

  /**
   * Delete category
   */
  async deleteCategory(id: string): Promise<CategoryDeleteResponse> {
    if (!id) {
      throw new Error('Category ID is required')
    }

    const response = await httpClient.delete<CategoryDeleteResponse>(`/api/categories/${id}`)

    // If API returns the deleted category, transform to delete response
    if (response.data && typeof response.data === 'object' && 'id' in response.data) {
      return {
        success: true,
        message: 'Category deleted successfully',
      }
    }

    return response.data
  },

  /**
   * Check if category name exists
   */
  async checkCategoryName(name: string, excludeId?: string): Promise<boolean> {
    try {
      const response = await this.getCategories()
      return response.categories.some(
        (category) =>
          category.name.toLowerCase() === name.toLowerCase() &&
          (!excludeId || category.id !== excludeId),
      )
    } catch {
      return false
    }
  },

  /**
   * Get categories with product count
   */
  async getCategoriesWithProductCount(): Promise<CategoryListResponse> {
    // For now, just return categories - product count could be added later
    // if the API supports it or we need to make a separate call
    return this.getCategories()
  },

  /**
   * Search categories by name
   */
  async searchCategories(searchTerm: string): Promise<CategoryListResponse> {
    const response = await this.getCategories()

    if (!searchTerm.trim()) {
      return response
    }

    const filteredCategories = response.categories.filter((category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    return {
      categories: filteredCategories,
      total: filteredCategories.length,
    }
  },

  /**
   * Validate category data
   */
  validateCategoryData(data: CreateCategoryRequest | UpdateCategoryRequest): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Check name
    if ('name' in data && data.name !== undefined) {
      if (!data.name.trim()) {
        errors.push('Category name is required')
      } else if (data.name.length > 50) {
        errors.push('Category name must be 50 characters or less')
      }
    }

    // Check color
    if ('color' in data && data.color !== undefined) {
      if (!data.color.trim()) {
        errors.push('Category color is required')
      } else if (!/^#[0-9A-F]{6}$/i.test(data.color)) {
        errors.push('Color must be a valid hex color code (e.g., #FF0000)')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  },
}
