/**
 * File Upload Adapter - Data Access Layer
 * Handles file upload and management operations
 */

import { httpClient } from './base/http-client'
import type { UploadImageResponse, DeleteImageResponse } from './types/responses'
import { ValidationError } from './types/errors'

// File validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

export const fileUploadAdapter = {
  /**
   * Upload product image
   */
  async uploadProductImage(file: File, productCode: string): Promise<UploadImageResponse> {
    // Validate inputs
    if (!file) {
      throw new ValidationError('File is required')
    }

    if (!productCode) {
      throw new ValidationError('Product code is required')
    }

    // Validate file
    this.validateImageFile(file)

    // Create FormData
    const formData = new FormData()
    formData.append('file', file)
    formData.append('productCode', productCode)
    formData.append('type', 'product-image')

    // Upload file
    const response = await httpClient.post<UploadImageResponse>('/api/upload', formData, {
      headers: {}, // Let browser set Content-Type for FormData
      timeout: 60000, // 60 seconds for file upload
    })

    return response.data
  },

  /**
   * Upload multiple product images
   */
  async uploadProductImages(files: File[], productCode: string): Promise<UploadImageResponse[]> {
    if (!files || files.length === 0) {
      throw new ValidationError('At least one file is required')
    }

    if (!productCode) {
      throw new ValidationError('Product code is required')
    }

    // Validate all files first
    files.forEach((file, index) => {
      try {
        this.validateImageFile(file)
      } catch (error) {
        throw new ValidationError(
          `File ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    })

    // Upload files in parallel
    const uploadPromises = files.map((file) => this.uploadProductImage(file, productCode))
    return Promise.all(uploadPromises)
  },

  /**
   * Delete uploaded image
   */
  async deleteImage(imageUrl: string): Promise<DeleteImageResponse> {
    if (!imageUrl) {
      throw new ValidationError('Image URL is required')
    }

    const response = await httpClient.delete<DeleteImageResponse>('/api/upload', {
      body: JSON.stringify({ imageUrl }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    return response.data
  },

  /**
   * Get image upload progress (for future implementation)
   */
  uploadImageWithProgress(
    file: File,
    productCode: string,
    onProgress?: (progress: number) => void,
  ): Promise<UploadImageResponse> {
    return new Promise((resolve, reject) => {
      // Validate inputs
      if (!file) {
        reject(new ValidationError('File is required'))
        return
      }

      if (!productCode) {
        reject(new ValidationError('Product code is required'))
        return
      }

      // Validate file
      try {
        this.validateImageFile(file)
      } catch (error) {
        reject(error)
        return
      }

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest()
      const formData = new FormData()
      formData.append('file', file)
      formData.append('productCode', productCode)
      formData.append('type', 'product-image')

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100
          onProgress(Math.round(progress))
        }
      })

      // Handle response
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve(response)
          } catch {
            reject(new Error('Invalid response format'))
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText)
            reject(new Error(errorResponse.error?.message || 'Upload failed'))
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        }
      })

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'))
      })

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'))
      })

      // Configure and send request
      xhr.timeout = 60000 // 60 seconds
      xhr.open('POST', '/api/upload')
      xhr.send(formData)
    })
  },

  /**
   * Validate image file
   */
  validateImageFile(file: File): void {
    // Check if file exists
    if (!file) {
      throw new ValidationError('File is required')
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
    }

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new ValidationError(
        `File type ${file.type} is not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`,
      )
    }

    // Check file extension
    const extension = this.getFileExtension(file.name)
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      throw new ValidationError(
        `File extension ${extension} is not allowed. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`,
      )
    }

    // Check if file has content
    if (file.size === 0) {
      throw new ValidationError('File is empty')
    }
  },

  /**
   * Get file extension from filename
   */
  getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.')
    if (lastDotIndex === -1) {
      return ''
    }
    return filename.substring(lastDotIndex).toLowerCase()
  },

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  /**
   * Check if file is valid image
   */
  isValidImage(file: File): boolean {
    try {
      this.validateImageFile(file)
      return true
    } catch {
      return false
    }
  },

  /**
   * Create preview URL for image file
   */
  createPreviewUrl(file: File): string {
    if (!this.isValidImage(file)) {
      throw new ValidationError('Invalid image file')
    }
    return URL.createObjectURL(file)
  },

  /**
   * Revoke preview URL to free memory
   */
  revokePreviewUrl(url: string): void {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  },

  /**
   * Generate unique filename
   */
  generateFilename(originalName: string, productCode: string): string {
    const extension = this.getFileExtension(originalName)
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${productCode}-${timestamp}-${random}${extension}`
  },
}
