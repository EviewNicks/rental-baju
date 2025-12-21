/**
 * Image Error Handler
 * Menangani error dari Next.js Image component dan mengurangi spam logging
 */

import { errorSuppressor } from './error-suppression'

/**
 * Custom error handler untuk Next.js Image component
 */
export function handleImageError(error: Error, src?: string): void {
  // Jangan log TimeoutError yang berulang
  if (errorSuppressor.shouldSuppress(error)) {
    return
  }

  // Log error yang tidak di-suppress
  if (process.env.NODE_ENV === 'development') {
    console.warn('🖼️ Image loading error:', {
      error: error.message,
      src: src?.substring(0, 100) + '...',
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * Wrapper untuk Image component dengan error handling
 */
export const imageErrorHandler = {
  onError: (error: Error) => {
    handleImageError(error)
  },
  
  onLoadingComplete: (result: { naturalWidth: number; naturalHeight: number }) => {
    // Optional: log successful loads in development
    if (process.env.NODE_ENV === 'development' && process.env.DEBUG_IMAGES === 'true') {
      console.log('🖼️ Image loaded successfully:', result)
    }
  }
}

/**
 * Default props untuk Image component dengan error handling
 */
export const defaultImageProps = {
  onError: imageErrorHandler.onError,
  onLoadingComplete: imageErrorHandler.onLoadingComplete,
  placeholder: 'blur' as const,
  blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
}