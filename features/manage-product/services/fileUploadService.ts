/**
 * FileUploadService - File Upload and Management Layer
 * Handles file upload operations, validation, and cloud storage integration
 */

import { createClient } from '@supabase/supabase-js'
import { imageFileSchema } from '../lib/validation/productSchema'

// Initialize Supabase client (will be mocked in tests)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

export interface UploadResult {
  url: string
  path: string
}

export class FileUploadService {
  private readonly bucket = 'products'
  private readonly maxRetries = 3

  constructor(private readonly userId: string) {}

  /**
   * Validate file using schema
   */
  validateFile(file: File | null | undefined): boolean {
    try {
      imageFileSchema.parse(file)
      return true
    } catch (error) {
      throw error
    }
  }

  /**
   * Upload product image to cloud storage
   */
  async uploadProductImage(
    file: File | null | undefined,
    productCode: string,
  ): Promise<UploadResult | null> {
    // Validate file
    const validatedFile = imageFileSchema.parse(file)

    // Return null for null/undefined files
    if (!validatedFile) {
      return null
    }

    // Generate unique file path
    const extension = this.getFileExtension(validatedFile.name)
    const imagePath = this.generateImagePath(productCode, extension)

    // Upload with retry logic
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const { data, error } = await supabase.storage
          .from(this.bucket)
          .upload(imagePath, validatedFile, {
            cacheControl: '3600',
            upsert: true,
          })

        if (error) {
          lastError = new Error(error.message)
          if (attempt < this.maxRetries) {
            // Wait before retry (exponential backoff)
            await this.delay(attempt * 1000)
            continue
          }
        } else if (data) {
          // Get public URL
          const { data: urlData } = supabase.storage.from(this.bucket).getPublicUrl(imagePath)

          return {
            url: urlData.publicUrl,
            path: imagePath,
          }
        }
      } catch (error) {
        lastError = error as Error
        if (attempt < this.maxRetries) {
          await this.delay(attempt * 1000)
          continue
        }
      }
    }

    // All retries failed
    if (lastError) {
      if (
        lastError.message.includes('Storage quota') ||
        lastError.message.includes('Temporary server error') ||
        lastError.message.includes('Persistent error')
      ) {
        throw new Error(
          `Gagal mengupload gambar setelah ${this.maxRetries} percobaan: ${lastError.message}`,
        )
      } else {
        throw new Error(`Gagal mengupload gambar: ${lastError.message}`)
      }
    }

    throw new Error('Upload failed for unknown reason')
  }

  /**
   * Delete product image from cloud storage
   */
  async deleteProductImage(imagePath: string | null): Promise<boolean> {
    if (!imagePath || imagePath.trim() === '') {
      return false
    }

    try {
      const { error } = await supabase.storage.from(this.bucket).remove([imagePath])

      if (error) {
        throw new Error(`Gagal menghapus gambar: ${error.message}`)
      }

      return true
    } catch (error) {
      throw error
    }
  }

  /**
   * Update product image (delete old, upload new)
   */
  async updateProductImage(
    file: File | null | undefined,
    productCode: string,
    oldImagePath?: string,
  ): Promise<UploadResult | null> {
    // Delete old image if exists (but don't fail if deletion fails)
    if (oldImagePath) {
      try {
        await this.deleteProductImage(oldImagePath)
      } catch (error) {
        // Log error but continue with upload
        console.warn('Failed to delete old image:', error)
      }
    }

    // Upload new image
    return this.uploadProductImage(file, productCode)
  }

  /**
   * Generate unique image path with timestamp
   */
  generateImagePath(productCode: string, extension: string): string {
    const timestamp = Date.now()
    return `products/${this.userId}/${productCode}/${timestamp}.${extension}`
  }

  /**
   * Extract storage path from public URL
   */
  extractPathFromUrl(url: string | null): string {
    if (!url || url.trim() === '') {
      throw new Error('Invalid image URL')
    }

    try {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/')

      // Find the bucket name in path and extract everything after it
      const bucketIndex = pathParts.indexOf(this.bucket)
      if (bucketIndex === -1) {
        throw new Error('Invalid image URL')
      }

      return pathParts.slice(bucketIndex + 1).join('/')
    } catch {
      throw new Error('Invalid image URL')
    }
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split('.')
    return parts[parts.length - 1].toLowerCase()
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
