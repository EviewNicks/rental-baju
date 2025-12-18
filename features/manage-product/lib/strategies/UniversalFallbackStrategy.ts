/**
 * Universal Fallback Strategy
 * 
 * Strategy fallback untuk kategori yang belum memiliki strategy khusus.
 * Menggunakan pattern size management yang fleksibel dan universal.
 */

import { z } from 'zod'
import type {
  CategoryFormStrategy,
  FormSectionConfig,
  CategoryFormData,
  CreateProductSizeRequest,
} from './CategoryFormStrategy'

export class UniversalFallbackStrategy implements CategoryFormStrategy {
  readonly type = 'universal_fallback'
  readonly categoryId: string
  readonly categoryName: string
  readonly isEditMode: boolean
  readonly existingData: CreateProductSizeRequest[]

  constructor(context: {
    categoryId: string
    categoryName: string
    isEditMode: boolean
    existingData?: CreateProductSizeRequest[]
  }) {
    this.categoryId = context.categoryId
    this.categoryName = context.categoryName
    this.isEditMode = context.isEditMode
    this.existingData = context.existingData || []
  }

  getFormDescription(): string {
    return `Manajemen ukuran universal untuk kategori ${this.categoryName}. Pilih ukuran yang tersedia dan tentukan stok untuk setiap ukuran.`
  }

  getFormFields(): FormSectionConfig[] {
    return [
      {
        title: 'Pilih Ukuran & Stok',
        description: 'Pilih ukuran yang tersedia untuk produk ini dan tentukan jumlah stok',
        fields: [
          {
            name: 'sizes',
            type: 'checkbox-group',
            label: 'Ukuran Tersedia',
            required: true,
            validation: z.array(z.string()).min(1, 'At least one size must be selected'),
            options: [
              { value: 'XS', label: 'XS (Extra Small)' },
              { value: 'S', label: 'S (Small)' },
              { value: 'M', label: 'M (Medium)' },
              { value: 'L', label: 'L (Large)' },
              { value: 'XL', label: 'XL (Extra Large)' },
              { value: 'XXL', label: 'XXL (Double Extra Large)' },
            ],
            helpText: 'Pilih semua ukuran yang tersedia untuk produk ini',
          },
          // Dynamic quantity fields akan di-generate berdasarkan selected sizes
          ...this.generateQuantityFields(),
        ],
      },
    ]
  }

  getValidationSchema(): z.ZodSchema {
    return z.object({
      categoryId: z.string().min(1, 'Category ID is required'),
      sizes: z.array(z.string()).min(1, 'At least one size must be selected'),
      // Dynamic validation for quantity fields
      quantity_XS: z.number().min(0).max(999).optional(),
      quantity_S: z.number().min(0).max(999).optional(),
      quantity_M: z.number().min(0).max(999).optional(),
      quantity_L: z.number().min(0).max(999).optional(),
      quantity_XL: z.number().min(0).max(999).optional(),
      quantity_XXL: z.number().min(0).max(999).optional(),
    }).refine((data) => {
      // Ensure at least one selected size has quantity > 0
      const selectedSizes = data.sizes || []
      const hasValidQuantity = selectedSizes.some(size => {
        const quantityKey = `quantity_${size}` as keyof typeof data
        const quantity = data[quantityKey] as number
        return quantity && quantity > 0
      })
      return hasValidQuantity
    }, {
      message: 'At least one selected size must have quantity greater than 0',
      path: ['sizes']
    })
  }

  /**
   * Generate quantity fields berdasarkan ukuran yang dipilih
   */
  private generateQuantityFields() {
    const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    
    return sizeOptions.map(size => ({
      name: `quantity_${size}`,
      type: 'number' as const,
      label: `Stok ${size}`,
      required: false,
      validation: z.number().min(0, 'Quantity must be 0 or greater').max(999, 'Quantity cannot exceed 999').optional(),
      min: 0,
      max: 999,
      defaultValue: 0,
      helpText: `Jumlah stok untuk ukuran ${size}`,
      condition: {
        field: 'sizes',
        operator: 'includes' as const,
        value: size,
      },
    }))
  }

  getDefaultValues(): CategoryFormData {
    if (this.isEditMode && this.existingData.length > 0) {
      // Load dari existing data
      return this.transformFromProductSizes(this.existingData)
    }

    // Default values untuk mode create
    return {
      categoryId: this.categoryId,
      sizes: [],
    }
  }

  transformToProductSizes(formData: CategoryFormData): CreateProductSizeRequest[] {
    const sizes: CreateProductSizeRequest[] = []
    const selectedSizes = (formData.sizes as string[]) || []

    selectedSizes.forEach(size => {
      const quantityKey = `quantity_${size}`
      const quantity = (formData[quantityKey] as number) || 0

      if (quantity > 0) {
        sizes.push({
          ageCategory: 'ADULT', // Default ke ADULT untuk universal strategy
          //eslint-disable-next-line @typescript-eslint/no-explicit-any
          size: size as any, // SizeEnum
          quantity,
          originalQuantity: quantity,
          availableQuantity: quantity,
          rentedQuantity: 0,
          lostQuantity: 0,
          isActive: true,
        })
      }
    })

    return sizes
  }

  transformFromProductSizes(sizes: CreateProductSizeRequest[]): CategoryFormData {
    const formData: CategoryFormData = {
      categoryId: this.categoryId,
      sizes: sizes.map(s => s.size),
    }

    // Set quantity values
    sizes.forEach(size => {
      const quantityKey = `quantity_${size.size}`
      formData[quantityKey] = size.originalQuantity || size.quantity
    })

    return formData
  }

  getInitialSizes(formData: CategoryFormData): CreateProductSizeRequest[] {
    return this.transformToProductSizes(formData)
  }

  validateProductSizes(sizes: CreateProductSizeRequest[]): { 
    isValid: boolean
    errors: string[] 
  } {
    const errors: string[] = []

    if (sizes.length === 0) {
      errors.push('Minimal satu ukuran harus dipilih dengan stok > 0')
    }

    // Validate individual sizes
    sizes.forEach(size => {
      if (size.quantity <= 0) {
        errors.push(`Stok untuk ukuran ${size.size} harus lebih dari 0`)
      }
      if (size.quantity > 999) {
        errors.push(`Stok untuk ukuran ${size.size} tidak boleh lebih dari 999`)
      }
    })

    // Check for duplicates
    const sizeValues = sizes.map(s => s.size)
    const uniqueSizes = new Set(sizeValues)
    if (sizeValues.length !== uniqueSizes.size) {
      errors.push('Tidak boleh ada ukuran yang duplikat')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}