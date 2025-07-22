/**
 * Unit Tests untuk Product & Category Validation Schemas
 * Testing Zod schema validation, error messages, and edge cases
 * 
 * Coverage:
 * - Product schema validation (create/update)
 * - Category schema validation
 * - File upload validation
 * - Query parameter validation
 * - Route parameter validation
 * - Error message localization
 * - Edge cases and boundary testing
 */

import {
  productBaseSchema,
  imageFileSchema,
  createProductSchema,
  updateProductSchema,
  categorySchema,
  updateCategorySchema,
  productQuerySchema,
  productParamsSchema,
  categoryQuerySchema,
  categoryParamsSchema,
} from './productSchema'

describe('Product Schema Validation', () => {
  describe('productBaseSchema', () => {
    const validProductData = {
      code: 'DRS1',
      name: 'Dress Elegant',
      description: 'Beautiful dress for formal events',
      modalAwal: 150000,
      hargaSewa: 50000,
      quantity: 5,
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
    }

    const expectedParsedData = {
      code: 'DRS1',
      name: 'Dress Elegant',
      description: 'Beautiful dress for formal events',
      modalAwal: '150000',
      hargaSewa: '50000',
      quantity: 5,
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
    }

    it('should validate valid product data - happy path', () => {
      // Act
      const result = productBaseSchema.parse(validProductData)

      // Assert
      expect(result.modalAwal.toString()).toBe(expectedParsedData.modalAwal)
      expect(result.hargaSewa.toString()).toBe(expectedParsedData.hargaSewa)
      expect(result.code).toBe(expectedParsedData.code)
      expect(result.name).toBe(expectedParsedData.name)
      expect(result.description).toBe(expectedParsedData.description)
      expect(result.quantity).toBe(expectedParsedData.quantity)
      expect(result.categoryId).toBe(expectedParsedData.categoryId)
    })

    describe('code validation', () => {
      it('should accept valid 4-character alphanumeric uppercase code', () => {
        // Arrange
        const testCodes = ['DRS1', 'SUT2', 'A1B2', '1234', 'ABCD']

        testCodes.forEach(code => {
          // Act & Assert
          expect(() => productBaseSchema.parse({
            ...validProductData,
            code,
          })).not.toThrow()
        })
      })

      it('should reject code that is too short', () => {
        // Act & Assert
        expect(() => productBaseSchema.parse({
          ...validProductData,
          code: 'DR',
        })).toThrow('Kode harus 4 digit alfanumerik uppercase')
      })

      it('should reject code that is too long', () => {
        // Act & Assert
        expect(() => productBaseSchema.parse({
          ...validProductData,
          code: 'DRESS',
        })).toThrow('Kode maksimal 4 karakter')
      })

      it('should reject code with lowercase characters', () => {
        // Act & Assert
        expect(() => productBaseSchema.parse({
          ...validProductData,
          code: 'drs1',
        })).toThrow('Kode harus 4 digit alfanumerik uppercase')
      })

      it('should reject code with special characters', () => {
        // Act & Assert
        expect(() => productBaseSchema.parse({
          ...validProductData,
          code: 'DR$1',
        })).toThrow('Kode harus 4 digit alfanumerik uppercase')
      })

      it('should reject empty code', () => {
        // Act & Assert
        expect(() => productBaseSchema.parse({
          ...validProductData,
          code: '',
        })).toThrow('Kode produk wajib diisi')
      })
    })

    describe('name validation', () => {
      it('should accept valid product names', () => {
        // Arrange
        const validNames = [
          'Dress Elegant',
          'A',
          'Super Long Product Name That Is Exactly 100 Characters Long And Should Pass Validation Test X',
        ]

        validNames.forEach(name => {
          // Act & Assert
          expect(() => productBaseSchema.parse({
            ...validProductData,
            name,
          })).not.toThrow()
        })
      })

      it('should reject empty name', () => {
        // Act & Assert
        expect(() => productBaseSchema.parse({
          ...validProductData,
          name: '',
        })).toThrow('Nama produk wajib diisi')
      })

      it('should reject name that is too long', () => {
        // Arrange
        const tooLongName = 'A'.repeat(101)

        // Act & Assert
        expect(() => productBaseSchema.parse({
          ...validProductData,
          name: tooLongName,
        })).toThrow('Nama maksimal 100 karakter')
      })
    })

    describe('description validation', () => {
      it('should accept valid descriptions', () => {
        // Arrange
        const validDescriptions = [
          'Short description',
          '',
          undefined,
          'A'.repeat(500), // Exactly 500 characters
        ]

        validDescriptions.forEach(description => {
          // Act & Assert
          expect(() => productBaseSchema.parse({
            ...validProductData,
            description,
          })).not.toThrow()
        })
      })

      it('should reject description that is too long', () => {
        // Arrange
        const tooLongDescription = 'A'.repeat(501)

        // Act & Assert
        expect(() => productBaseSchema.parse({
          ...validProductData,
          description: tooLongDescription,
        })).toThrow('Deskripsi maksimal 500 karakter')
      })
    })

    describe('modalAwal validation', () => {
      it('should accept positive numbers', () => {
        // Arrange
        const validValues = [1, 100, 1000, 999999999]

        validValues.forEach(modalAwal => {
          // Act & Assert
          expect(() => productBaseSchema.parse({
            ...validProductData,
            modalAwal,
          })).not.toThrow()
        })
      })

      it('should reject zero or negative numbers', () => {
        // Arrange
        const invalidValues = [0, -1, -100]

        invalidValues.forEach(modalAwal => {
          // Act & Assert
          expect(() => productBaseSchema.parse({
            ...validProductData,
            modalAwal,
          })).toThrow('Modal awal harus positif')
        })
      })

      it('should reject values that are too large', () => {
        // Act & Assert
        expect(() => productBaseSchema.parse({
          ...validProductData,
          modalAwal: 1000000000, // 1 billion
        })).toThrow('Modal maksimal 999,999,999')
      })
    })

    describe('hargaSewa validation', () => {
      it('should accept positive numbers', () => {
        // Arrange
        const validValues = [1, 100, 1000, 999999999]

        validValues.forEach(hargaSewa => {
          // Act & Assert
          expect(() => productBaseSchema.parse({
            ...validProductData,
            hargaSewa,
          })).not.toThrow()
        })
      })

      it('should reject zero or negative numbers', () => {
        // Arrange
        const invalidValues = [0, -1, -100]

        invalidValues.forEach(hargaSewa => {
          // Act & Assert
          expect(() => productBaseSchema.parse({
            ...validProductData,
            hargaSewa,
          })).toThrow('Harga sewa harus positif')
        })
      })

      it('should reject values that are too large', () => {
        // Act & Assert
        expect(() => productBaseSchema.parse({
          ...validProductData,
          hargaSewa: 1000000000,
        })).toThrow('Harga sewa maksimal 999,999,999')
      })
    })

    describe('quantity validation', () => {
      it('should accept valid integer quantities', () => {
        // Arrange
        const validValues = [0, 1, 100, 9999]

        validValues.forEach(quantity => {
          // Act & Assert
          expect(() => productBaseSchema.parse({
            ...validProductData,
            quantity,
          })).not.toThrow()
        })
      })

      it('should reject negative quantities', () => {
        // Act & Assert
        expect(() => productBaseSchema.parse({
          ...validProductData,
          quantity: -1,
        })).toThrow('Jumlah minimal 0')
      })

      it('should reject quantities that are too large', () => {
        // Act & Assert
        expect(() => productBaseSchema.parse({
          ...validProductData,
          quantity: 10000,
        })).toThrow('Jumlah maksimal 9999')
      })

      it('should reject decimal quantities', () => {
        // Act & Assert
        expect(() => productBaseSchema.parse({
          ...validProductData,
          quantity: 5.5,
        })).toThrow()
      })
    })

    describe('categoryId validation', () => {
      it('should accept valid UUID', () => {
        // Arrange
        const validUUIDs = [
          '123e4567-e89b-12d3-a456-426614174000',
          '00000000-0000-0000-0000-000000000000',
          'ffffffff-ffff-ffff-ffff-ffffffffffff',
        ]

        validUUIDs.forEach(categoryId => {
          // Act & Assert
          expect(() => productBaseSchema.parse({
            ...validProductData,
            categoryId,
          })).not.toThrow()
        })
      })

      it('should reject invalid UUID formats', () => {
        // Arrange
        const invalidUUIDs = [
          'not-a-uuid',
          '123',
          '123e4567-e89b-12d3-a456-42661417400', // Too short
          '123e4567-e89b-12d3-a456-4266141740000', // Too long
          '123e4567_e89b_12d3_a456_426614174000', // Wrong separators
        ]

        invalidUUIDs.forEach(categoryId => {
          // Act & Assert
          expect(() => productBaseSchema.parse({
            ...validProductData,
            categoryId,
          })).toThrow('ID kategori tidak valid')
        })
      })
    })
  })

  describe('imageFileSchema', () => {
    it('should accept valid image files', () => {
      // Arrange
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }) // 1MB

      // Act & Assert
      expect(() => imageFileSchema.parse(validFile)).not.toThrow()
    })

    it('should accept undefined and null values', () => {
      // Act & Assert
      expect(() => imageFileSchema.parse(undefined)).not.toThrow()
      expect(() => imageFileSchema.parse(null)).not.toThrow()
    })

    it('should reject files that are too large', () => {
      // Arrange
      const largeFile = new File(['test'], 'large.jpg', { type: 'image/jpeg' })
      Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 }) // 6MB

      // Act & Assert
      expect(() => imageFileSchema.parse(largeFile)).toThrow('Ukuran file maksimal 5MB')
    })

    it('should reject unsupported file types', () => {
      // Arrange
      const invalidTypes = ['image/gif', 'image/bmp', 'text/plain', 'application/pdf']

      invalidTypes.forEach(type => {
        const file = new File(['test'], 'test.file', { type })
        Object.defineProperty(file, 'size', { value: 1024 })

        // Act & Assert
        expect(() => imageFileSchema.parse(file)).toThrow('Format file harus JPG, PNG, atau WebP')
      })
    })

    it('should accept supported file types', () => {
      // Arrange
      const validTypes = ['image/jpeg', 'image/png', 'image/webp']

      validTypes.forEach(type => {
        const file = new File(['test'], 'test.file', { type })
        Object.defineProperty(file, 'size', { value: 1024 })

        // Act & Assert
        expect(() => imageFileSchema.parse(file)).not.toThrow()
      })
    })
  })

  describe('createProductSchema', () => {
    const validCreateData = {
      code: 'DRS1',
      name: 'Dress Elegant',
      description: 'Beautiful dress',
      modalAwal: 150000,
      hargaSewa: 50000,
      quantity: 5,
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
      image: undefined,
    }

    it('should validate create product data with image', () => {
      // Arrange
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1024 })

      // Act & Assert
      expect(() => createProductSchema.parse({
        ...validCreateData,
        image: file,
      })).not.toThrow()
    })

    it('should validate create product data without image', () => {
      // Act & Assert
      expect(() => createProductSchema.parse(validCreateData)).not.toThrow()
    })
  })

  describe('updateProductSchema', () => {
    it('should validate partial product updates', () => {
      // Arrange
      const partialUpdates = [
        { name: 'Updated Name' },
        { hargaSewa: 75000 },
        { quantity: 10 },
        { description: 'Updated description' },
        {},
      ]

      partialUpdates.forEach(update => {
        // Act & Assert
        expect(() => updateProductSchema.parse(update)).not.toThrow()
      })
    })

    it('should validate update with image', () => {
      // Arrange
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1024 })

      // Act & Assert
      expect(() => updateProductSchema.parse({
        name: 'Updated Name',
        image: file,
      })).not.toThrow()
    })
  })

  describe('productQuerySchema', () => {
    it('should validate query parameters with defaults', () => {
      // Act
      const result = productQuerySchema.parse({})

      // Assert
      expect(result).toEqual({
        page: 1,
        limit: 10,
      })
    })

    it('should validate complete query parameters', () => {
      // Arrange
      const query = {
        page: '2',
        limit: '20',
        search: 'dress',
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'AVAILABLE',
        isActive: 'true',
      }

      // Act
      const result = productQuerySchema.parse(query)

      // Assert
      expect(result).toEqual({
        page: 2,
        limit: 20,
        search: 'dress',
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'AVAILABLE',
        isActive: true,
      })
    })

    it('should enforce page and limit boundaries', () => {
      // Act & Assert
      expect(() => productQuerySchema.parse({ page: '0' })).toThrow()
      expect(() => productQuerySchema.parse({ limit: '0' })).toThrow()
      expect(() => productQuerySchema.parse({ limit: '101' })).toThrow()
    })

    it('should validate status enum values', () => {
      // Arrange
      const validStatuses = ['AVAILABLE', 'RENTED', 'MAINTENANCE']
      const invalidStatuses = ['INVALID', 'available', 'Active']

      validStatuses.forEach(status => {
        // Act & Assert
        expect(() => productQuerySchema.parse({ status })).not.toThrow()
      })

      invalidStatuses.forEach(status => {
        // Act & Assert
        expect(() => productQuerySchema.parse({ status })).toThrow()
      })
    })
  })

  describe('productParamsSchema', () => {
    it('should validate valid UUID parameter', () => {
      // Arrange
      const validParam = { id: '123e4567-e89b-12d3-a456-426614174000' }

      // Act & Assert
      expect(() => productParamsSchema.parse(validParam)).not.toThrow()
    })

    it('should reject invalid UUID parameter', () => {
      // Arrange
      const invalidParams = [
        { id: 'not-a-uuid' },
        { id: '123' },
        { id: '' },
      ]

      invalidParams.forEach(param => {
        // Act & Assert
        expect(() => productParamsSchema.parse(param)).toThrow('ID produk tidak valid')
      })
    })
  })
})

describe('Category Schema Validation', () => {
  describe('categorySchema', () => {
    const validCategoryData = {
      name: 'Dress Formal',
      color: '#FF5733',
    }

    it('should validate valid category data - happy path', () => {
      // Act
      const result = categorySchema.parse(validCategoryData)

      // Assert
      expect(result).toEqual(validCategoryData)
    })

    describe('name validation', () => {
      it('should accept valid category names', () => {
        // Arrange
        const validNames = ['Dress', 'A', 'A'.repeat(50)]

        validNames.forEach(name => {
          // Act & Assert
          expect(() => categorySchema.parse({
            ...validCategoryData,
            name,
          })).not.toThrow()
        })
      })

      it('should reject empty name', () => {
        // Act & Assert
        expect(() => categorySchema.parse({
          ...validCategoryData,
          name: '',
        })).toThrow('Nama kategori wajib diisi')
      })

      it('should reject name that is too long', () => {
        // Arrange
        const tooLongName = 'A'.repeat(51)

        // Act & Assert
        expect(() => categorySchema.parse({
          ...validCategoryData,
          name: tooLongName,
        })).toThrow('Nama kategori maksimal 50 karakter')
      })
    })

    describe('color validation', () => {
      it('should accept valid hex colors', () => {
        // Arrange
        const validColors = [
          '#FF5733',
          '#ff5733',
          '#000000',
          '#FFFFFF',
          '#AbCdEf',
        ]

        validColors.forEach(color => {
          // Act & Assert
          expect(() => categorySchema.parse({
            ...validCategoryData,
            color,
          })).not.toThrow()
        })
      })

      it('should reject invalid color formats', () => {
        // Arrange
        const invalidColors = [
          'FF5733',     // Missing #
          '#FF573',     // Too short
          '#FF57333',   // Too long
          '#GG5733',    // Invalid hex characters
          'red',        // Color name
          'rgb(255,87,51)', // RGB format
        ]

        invalidColors.forEach(color => {
          // Act & Assert
          expect(() => categorySchema.parse({
            ...validCategoryData,
            color,
          })).toThrow('Warna harus dalam format hex (#RRGGBB)')
        })
      })
    })
  })

  describe('updateCategorySchema', () => {
    it('should validate partial category updates', () => {
      // Arrange
      const partialUpdates = [
        { name: 'Updated Category' },
        { color: '#00FF00' },
        { name: 'New Name', color: '#0000FF' },
        {},
      ]

      partialUpdates.forEach(update => {
        // Act & Assert
        expect(() => updateCategorySchema.parse(update)).not.toThrow()
      })
    })
  })

  describe('categoryQuerySchema', () => {
    it('should validate query parameters with defaults', () => {
      // Act
      const result = categoryQuerySchema.parse({})

      // Assert
      expect(result).toEqual({
        includeProducts: false,
      })
    })

    it('should validate complete query parameters', () => {
      // Arrange
      const query = {
        search: 'dress',
        includeProducts: 'true',
      }

      // Act
      const result = categoryQuerySchema.parse(query)

      // Assert
      expect(result).toEqual({
        search: 'dress',
        includeProducts: true,
      })
    })

    it('should coerce includeProducts to boolean', () => {
      // Act & Assert - Test Zod's boolean coercion behavior
      expect(categoryQuerySchema.parse({ includeProducts: true }).includeProducts).toBe(true)
      expect(categoryQuerySchema.parse({ includeProducts: false }).includeProducts).toBe(false)
      expect(categoryQuerySchema.parse({ includeProducts: 'true' }).includeProducts).toBe(true)
      // Note: Zod's coerce.boolean() converts any truthy string to true, even 'false'
      expect(categoryQuerySchema.parse({ includeProducts: 'false' }).includeProducts).toBe(true)
      expect(categoryQuerySchema.parse({ includeProducts: '' }).includeProducts).toBe(false)
      expect(categoryQuerySchema.parse({ includeProducts: 0 }).includeProducts).toBe(false)
      expect(categoryQuerySchema.parse({ includeProducts: 1 }).includeProducts).toBe(true)
    })
  })

  describe('categoryParamsSchema', () => {
    it('should validate valid UUID parameter', () => {
      // Arrange
      const validParam = { id: '123e4567-e89b-12d3-a456-426614174000' }

      // Act & Assert
      expect(() => categoryParamsSchema.parse(validParam)).not.toThrow()
    })

    it('should reject invalid UUID parameter', () => {
      // Arrange
      const invalidParams = [
        { id: 'not-a-uuid' },
        { id: '123' },
        { id: '' },
      ]

      invalidParams.forEach(param => {
        // Act & Assert
        expect(() => categoryParamsSchema.parse(param)).toThrow('ID kategori tidak valid')
      })
    })
  })
})