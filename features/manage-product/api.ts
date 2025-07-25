/**
 * Simple API Client for Manage Product Feature
 * Replaces over-engineered adapter layer with standard fetch calls
 */

// Base API configuration
const API_BASE_URL = '/api'

// Simple error handling helper
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }
  return response.json()
}

// Helper untuk build query params
const buildQueryParams = (params: Record<string, string | number | boolean | string[] | undefined | null>): string => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => query.append(key, v))
      } else {
        query.append(key, value.toString())
      }
    }
  })
  return query.toString()
}

// === PRODUCT API ===
export const productApi = {
  // Get all products with filtering
  getProducts: async (params?: {
    search?: string
    category?: string
    status?: string
    size?: string | string[]
    colorId?: string | string[]
    page?: number
    limit?: number
  }) => {
    const queryString = params ? buildQueryParams(params) : ''
    const url = `${API_BASE_URL}/products${queryString ? `?${queryString}` : ''}`
    const response = await fetch(url)
    return handleResponse(response)
  },

  // Get single product by ID
  getProductById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`)
    return handleResponse(response)
  },

  // Create new product
  createProduct: async (data: FormData | Record<string, string | number | boolean | File | null>) => {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
      headers: data instanceof FormData ? {} : { 'Content-Type': 'application/json' }
    })
    return handleResponse(response)
  },

  // Update existing product
  updateProduct: async (id: string, data: FormData | Record<string, string | number | boolean | File | null>) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
      headers: data instanceof FormData ? {} : { 'Content-Type': 'application/json' }
    })
    return handleResponse(response)
  },

  // Delete product
  deleteProduct: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE'
    })
    return handleResponse(response)
  }
}

// === CATEGORY API ===
export const categoryApi = {
  // Get all categories
  getCategories: async (params?: { search?: string; isActive?: boolean; includeProducts?: boolean }) => {
    const queryString = params ? buildQueryParams(params) : ''
    const url = `${API_BASE_URL}/categories${queryString ? `?${queryString}` : ''}`
    const response = await fetch(url)
    return handleResponse(response)
  },

  // Get single category by ID
  getCategoryById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`)
    return handleResponse(response)
  },

  // Create new category
  createCategory: async (data: { name: string; description?: string; color?: string }) => {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  // Update existing category
  updateCategory: async (id: string, data: { name?: string; description?: string; color?: string }) => {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  // Delete category
  deleteCategory: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'DELETE'
    })
    return handleResponse(response)
  }
}

// === COLOR API ===
export const colorApi = {
  // Get all colors
  getColors: async (params?: { 
    search?: string 
    isActive?: boolean 
    includeProducts?: boolean 
  }) => {
    const queryString = params ? buildQueryParams(params) : ''
    const url = `${API_BASE_URL}/colors${queryString ? `?${queryString}` : ''}`
    const response = await fetch(url)
    return handleResponse(response)
  },

  // Get single color by ID
  getColorById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/colors/${id}`)
    return handleResponse(response)
  },

  // Create new color
  createColor: async (data: { 
    name: string 
    hexCode?: string 
    description?: string 
  }) => {
    const response = await fetch(`${API_BASE_URL}/colors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  // Update existing color
  updateColor: async (id: string, data: { 
    name?: string 
    hexCode?: string 
    description?: string 
  }) => {
    const response = await fetch(`${API_BASE_URL}/colors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  // Delete color
  deleteColor: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/colors/${id}`, {
      method: 'DELETE'
    })
    return handleResponse(response)
  }
}

// === FILE UPLOAD API ===
export const fileApi = {
  // Upload single file
  uploadFile: async (file: File, folder?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (folder) formData.append('folder', folder)

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData
    })
    return handleResponse(response)
  },

  // Delete file
  deleteFile: async (filename: string) => {
    const response = await fetch(`${API_BASE_URL}/upload/${filename}`, {
      method: 'DELETE'
    })
    return handleResponse(response)
  }
}