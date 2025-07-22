/**
 * Unit Tests untuk FileUploadService
 * Testing file upload operations dengan fokus pada fungsi utama
 *
 * Coverage:
 * - File validation
 * - Path generation utilities
 * - URL extraction utilities
 * - Basic upload/delete operations (mocked)
 */

import { FileUploadService } from './fileUploadService'
import { imageFileSchema } from '../lib/validation/productSchema'

// Mocks - Simple approach
jest.mock('../lib/validation/productSchema')
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: jest.fn(),
        remove: jest.fn(),
        getPublicUrl: jest.fn(),
      }),
    },
  }),
}))

describe('FileUploadService', () => {
  let fileUploadService: FileUploadService
  const mockUserId = 'user-123'

  beforeEach(() => {
    jest.clearAllMocks()
    fileUploadService = new FileUploadService(mockUserId)
  })

  describe('validateFile', () => {
    it('should validate file successfully - happy path', () => {
      // Arrange
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      ;(imageFileSchema.parse as jest.Mock).mockReturnValue(mockFile)

      // Act
      const result = fileUploadService.validateFile(mockFile)

      // Assert
      expect(imageFileSchema.parse).toHaveBeenCalledWith(mockFile)
      expect(result).toBe(true)
    })

    it('should reject file that is too large', () => {
      // Arrange
      const mockFile = new File(['test'], 'large.jpg', { type: 'image/jpeg' })
      ;(imageFileSchema.parse as jest.Mock).mockImplementation(() => {
        throw new Error('Ukuran file maksimal 5MB')
      })

      // Act & Assert
      expect(() => fileUploadService.validateFile(mockFile)).toThrow('Ukuran file maksimal 5MB')
    })

    it('should reject unsupported file format', () => {
      // Arrange
      const mockFile = new File(['test'], 'test.gif', { type: 'image/gif' })
      ;(imageFileSchema.parse as jest.Mock).mockImplementation(() => {
        throw new Error('Format file harus JPG, PNG, atau WebP')
      })

      // Act & Assert
      expect(() => fileUploadService.validateFile(mockFile)).toThrow(
        'Format file harus JPG, PNG, atau WebP',
      )
    })

    it('should handle null file gracefully', () => {
      // Arrange
      ;(imageFileSchema.parse as jest.Mock).mockReturnValue(null)

      // Act
      const result = fileUploadService.validateFile(null)

      // Assert
      expect(result).toBe(true)
    })

    it('should handle undefined file gracefully', () => {
      // Arrange
      ;(imageFileSchema.parse as jest.Mock).mockReturnValue(undefined)

      // Act
      const result = fileUploadService.validateFile(undefined)

      // Assert
      expect(result).toBe(true)
    })
  })

  describe('generateImagePath', () => {
    it('should generate valid image path with timestamp', () => {
      // Arrange
      const productCode = 'DRS1'
      const extension = 'jpg'
      const timestamp = 1643723400000
      jest.spyOn(Date, 'now').mockReturnValue(timestamp)

      // Act
      const path = fileUploadService.generateImagePath(productCode, extension)

      // Assert
      expect(path).toBe(`products/${productCode}/${timestamp}.${extension}`)
    })

    it('should handle different file extensions', () => {
      // Arrange
      const productCode = 'DRS1'

      // Act
      const jpegPath = fileUploadService.generateImagePath(productCode, 'jpeg')
      const pngPath = fileUploadService.generateImagePath(productCode, 'png')
      const webpPath = fileUploadService.generateImagePath(productCode, 'webp')

      // Assert
      expect(jpegPath).toContain('.jpeg')
      expect(pngPath).toContain('.png')
      expect(webpPath).toContain('.webp')
    })
  })

  describe('extractPathFromUrl', () => {
    it('should extract path from storage URL correctly', () => {
      // Arrange
      const storageUrl =
        'https://storage.supabase.com/bucket/product-images/products/DRS1/image.jpg'

      // Act
      const path = fileUploadService.extractPathFromUrl(storageUrl)

      // Assert
      expect(path).toBe('DRS1/image.jpg')
    })

    it('should handle URLs with query parameters', () => {
      // Arrange
      const urlWithParams =
        'https://storage.supabase.com/bucket/product-images/products/DRS1/image.jpg?v=1643723400'

      // Act
      const path = fileUploadService.extractPathFromUrl(urlWithParams)

      // Assert
      expect(path).toBe('DRS1/image.jpg')
    })

    it('should handle invalid URLs gracefully', () => {
      // Arrange
      const invalidUrl = 'not-a-valid-url'

      // Act & Assert
      expect(() => fileUploadService.extractPathFromUrl(invalidUrl)).toThrow('Invalid image URL')
    })

    it('should handle empty URL', () => {
      // Act & Assert
      expect(() => fileUploadService.extractPathFromUrl('')).toThrow('Invalid image URL')
    })

    it('should handle null URL', () => {
      // Act & Assert
      expect(() => fileUploadService.extractPathFromUrl(null)).toThrow('Invalid image URL')
    })
  })

  describe('uploadProductImage', () => {
    it('should handle null file input', async () => {
      // Arrange
      ;(imageFileSchema.parse as jest.Mock).mockReturnValue(null)

      // Act
      const result = await fileUploadService.uploadProductImage(null, 'DRS1')

      // Assert
      expect(result).toBeNull()
    })

    it('should handle undefined file input', async () => {
      // Arrange
      ;(imageFileSchema.parse as jest.Mock).mockReturnValue(undefined)

      // Act
      const result = await fileUploadService.uploadProductImage(undefined, 'DRS1')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('deleteProductImage', () => {
    it('should handle empty image path gracefully', async () => {
      // Act
      const result = await fileUploadService.deleteProductImage('')

      // Assert
      expect(result).toBe(false)
    })

    it('should handle null image path gracefully', async () => {
      // Act
      const result = await fileUploadService.deleteProductImage(null)

      // Assert
      expect(result).toBe(false)
    })
  })
})
