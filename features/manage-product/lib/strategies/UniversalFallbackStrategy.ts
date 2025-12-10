/**
 * Universal Fallback Strategy
 * 
 * Strategy fallback untuk kategori yang belum memiliki strategy khusus.
 * Menggunakan pattern size management yang fleksibel dan universal.
 */

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