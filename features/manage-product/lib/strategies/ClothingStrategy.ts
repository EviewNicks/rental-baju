/**
 * Clothing Strategy
 *
 * Strategy untuk pakaian standar dengan ukuran S/M/L/XL.
 * Contoh produk: Baju, Celana, Gaun
 */

import { z } from 'zod'
import type {
  CategoryFormStrategy,
  FormSectionConfig,
  CreateProductSizeRequest,
  CategoryFormData
} from './CategoryFormStrategy'
import type { CategoryType } from '../../types'

export class ClothingStrategy implements CategoryFormStrategy {
  readonly type: CategoryType = 'clothing'

  /**
   * Available size options untuk clothing dengan age categorization
   */
  private readonly sizeOptions = [
    { value: 'XS_ANAK', label: 'XS - Anak (Extra Small)' },
    { value: 'XS_DEWASA', label: 'XS - Dewasa (Extra Small)' },
    { value: 'S_ANAK', label: 'S - Anak (Small)' },
    { value: 'S_DEWASA', label: 'S - Dewasa (Small)' },
    { value: 'M_ANAK', label: 'M - Anak (Medium)' },
    { value: 'M_DEWASA', label: 'M - Dewasa (Medium)' },
    { value: 'L_ANAK', label: 'L - Anak (Large)' },
    { value: 'L_DEWASA', label: 'L - Dewasa (Large)' },
    { value: 'XL_ANAK', label: 'XL - Anak (Extra Large)' },
    { value: 'XL_DEWASA', label: 'XL - Dewasa (Extra Large)' },
    { value: 'XXL_DEWASA', label: 'XXL - Dewasa (Double Extra Large)' }
  ]

  private ensureNumber(value: unknown): number {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const parsed = Number(value)
      if (!isNaN(parsed)) return parsed
    }
    return 0
  }

  /**
   * Parse size-age combination string
   * @param sizeAgeCombination - e.g., 'XS_DEWASA', 'S_ANAK'
   * @returns { size, ageCategory }
   */
  private parseSizeAgeCombination(sizeAgeCombination: string): { size: string; ageCategory: 'ADULT' | 'CHILD' } {
    const [size, ageCategory] = sizeAgeCombination.split('_')
    return {
      size,
      ageCategory: ageCategory === 'DEWASA' ? 'ADULT' : 'CHILD'
    }
  }

  /**
   * Get base size from size-age combination
   * @param sizeAgeCombination - e.g., 'XS_DEWASA' → 'XS'
   */
  private getBaseSize(sizeAgeCombination: string): string {
    return sizeAgeCombination.split('_')[0]
  }

  /**
   * Form fields untuk pakaian
   * - Size selection dengan checkboxes untuk setiap ukuran
   * - Conditional quantity fields untuk ukuran yang dipilih
   */
  getFormFields(): FormSectionConfig[] {
    // Combine checkbox selection with conditional quantity fields in single section
    const checkboxField = {
      name: 'sizes',
      type: 'checkbox-group' as const,
      label: 'Ukuran Tersedia',
      required: true,
      validation: z.array(z.string()).min(1, 'Pilih minimal satu ukuran'),
      options: this.sizeOptions,
      defaultValue: [],
      helpText: 'Pilih semua ukuran yang tersedia untuk produk ini (dewasa dan anak-anak)'
    }

    // Generate conditional quantity fields
    const quantityFields = this.sizeOptions.map(size => ({
      name: `quantity_${size.value}`,
      type: 'number' as const,
      label: `Jumlah ${size.label}`,
      placeholder: '0',
      required: false,
      validation: z.number().min(0, 'Jumlah minimal 0').max(9999, 'Maksimal 9999'),
      min: 0,
      max: 9999,
      defaultValue: 0,
      helpText: `Stok untuk ukuran ${size.value}`,
      condition: {
        field: 'sizes',
        operator: 'includes' as const,
        value: size.value
      }
    }))

    return [
      {
        title: 'Ukuran & Stok',
        description: 'Pilih ukuran yang tersedia dan masukkan jumlah stok untuk setiap ukuran',
        fields: [checkboxField, ...quantityFields]
      }
    ]
  }

  /**
   * Transform form data ke ProductSize format
   */
  transformToProductSizes(formData: CategoryFormData): CreateProductSizeRequest[] {
    const sizes: CreateProductSizeRequest[] = []
    const selectedSizes = formData.sizes || []

    if (Array.isArray(selectedSizes)) {
      selectedSizes.forEach((sizeAgeCombination: string) => {
        const quantityKey = `quantity_${sizeAgeCombination}`
        const quantity = this.ensureNumber(formData[quantityKey])

        if (quantity > 0) {
          const { size, ageCategory } = this.parseSizeAgeCombination(sizeAgeCombination)
          sizes.push({
            ageCategory,
            size: size as 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL',
            quantity,
            isActive: true
          })
        }
      })
    }

    return sizes
  }

  /**
   * Validation schema untuk form data
   */
  getValidationSchema(): z.ZodSchema {
    return z.object({
      sizes: z.array(z.string()).min(1, 'Pilih minimal satu ukuran'),
      ...this.sizeOptions.reduce((acc, size) => {
        acc[`quantity_${size.value}`] = z.number().min(0, 'Jumlah minimal 0').max(9999, 'Maksimal 9999')
        return acc
      }, {} as Record<string, z.ZodNumber>)
    }).refine(
      (data) => {
        const selectedSizes = data.sizes || []
        return selectedSizes.some((size: string) => {
          const quantityKey = `quantity_${size}`
          const quantity = (data as Record<string, unknown>)[quantityKey] as number
          return quantity > 0
        })
      },
      {
        message: 'Minimal satu ukuran (dewasa atau anak) yang dipilih harus memiliki stok',
        path: ['sizes']
      }
    )
  }

  /**
   * Default values untuk form
   */
  getDefaultValues(): CategoryFormData {
    const defaults: CategoryFormData = {
      categoryId: '',
      sizes: []
    }

    this.sizeOptions.forEach(size => {
      defaults[`quantity_${size.value}`] = 0
    })

    return defaults
  }

  /**
   * Form description untuk user guidance
   */
  getFormDescription(): string {
    return 'Untuk pakaian standar dengan ukuran S, M, L, XL, XXL untuk dewasa dan anak-anak. Pilih ukuran yang tersedia dan masukkan jumlah stoknya.'
  }

  /**
   * Transform ProductSize kembali ke form format (untuk edit mode)
   */
  transformFromProductSizes(sizes: CreateProductSizeRequest[]): CategoryFormData {
    const defaultValues = this.getDefaultValues()
    const formData: CategoryFormData = {
      ...defaultValues
    }

    // Group sizes berdasarkan size-age combination
    const selectedSizes: string[] = []

    sizes.forEach(size => {
      const ageSuffix = size.ageCategory === 'ADULT' ? 'DEWASA' : 'ANAK'
      const sizeAgeCombination = `${size.size}_${ageSuffix}`

      // Check if this combination exists in our size options
      if (this.sizeOptions.some(opt => opt.value === sizeAgeCombination)) {
        selectedSizes.push(sizeAgeCombination)
        const quantityKey = `quantity_${sizeAgeCombination}`
        formData[quantityKey] = size.quantity
      }
    })

    formData.sizes = selectedSizes
    return formData
  }

  /**
   * Get initial sizes dari form data untuk edit mode initialization
   */
  getInitialSizes(formData: CategoryFormData): CreateProductSizeRequest[] {
    const sizes: CreateProductSizeRequest[] = []
    const selectedSizes = formData.sizes || []

    if (Array.isArray(selectedSizes)) {
      selectedSizes.forEach((sizeAgeCombination: string) => {
        const quantityKey = `quantity_${sizeAgeCombination}`
        const quantity = this.ensureNumber(formData[quantityKey])

        if (quantity > 0) {
          const { size, ageCategory } = this.parseSizeAgeCombination(sizeAgeCombination)
          sizes.push({
            ageCategory,
            //eslint-disable-next-line @typescript-eslint/no-explicit-any
            size: size as any, // Type assertion for valid size enum
            quantity,
            isActive: true
          })
        }
      })
    }

    return sizes
  }

  /**
   * Calculate total quantity dari form data
   */
  calculateTotalQuantity(formData: CategoryFormData): number {
    const selectedSizes = formData.sizes || []
    let total = 0

    if (Array.isArray(selectedSizes)) {
      selectedSizes.forEach((sizeValue: string) => {
        const quantityKey = `quantity_${sizeValue}`
        total += this.ensureNumber(formData[quantityKey])
      })
    }

    return total
  }

  /**
   * Generate size display string untuk UI
   */
  generateSizeDisplay(formData: CategoryFormData): string {
    const selectedSizes = formData.sizes || []
    const parts: string[] = []

    if (Array.isArray(selectedSizes)) {
      selectedSizes.forEach((sizeValue: string) => {
        const quantityKey = `quantity_${sizeValue}`
        const quantity = this.ensureNumber(formData[quantityKey])

        if (quantity > 0) {
          parts.push(`${sizeValue}: ${quantity}`)
        }
      })
    }

    return parts.length > 0 ? parts.join(', ') : 'Belum ada stok'
  }

  /**
   * Validate size combinations untuk clothing
   */
  validateProductSizes(sizes: CreateProductSizeRequest[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    const validSizeAgeCombinations = this.sizeOptions.map(opt => opt.value)
    const validBaseSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

    // Check untuk valid size-age combinations
    const invalidCombinations: string[] = []
    sizes.forEach(size => {
      const ageSuffix = size.ageCategory === 'ADULT' ? 'DEWASA' : 'ANAK'
      const sizeAgeCombination = `${size.size}_${ageSuffix}`

      if (!validSizeAgeCombinations.includes(sizeAgeCombination)) {
        invalidCombinations.push(sizeAgeCombination)
      }
    })

    if (invalidCombinations.length > 0) {
      errors.push(`Kombinasi ukuran tidak valid: ${invalidCombinations.join(', ')}. Gunakan format: XS_DEWASA, S_ANAK, dll`)
    }

    // Check untuk valid base sizes
    const invalidBaseSizes = sizes.filter(size => !validBaseSizes.includes(size.size))
    if (invalidBaseSizes.length > 0) {
      errors.push(`Ukuran tidak valid: ${invalidBaseSizes.map(s => s.size).join(', ')}. Gunakan: ${validBaseSizes.join(', ')}`)
    }

    // Check untuk duplicate size-age combinations
    const sizeAgeCombinations = sizes.map(s => `${s.size}_${s.ageCategory === 'ADULT' ? 'DEWASA' : 'ANAK'}`)
    const uniqueCombinations = new Set(sizeAgeCombinations)
    if (sizeAgeCombinations.length !== uniqueCombinations.size) {
      errors.push('Tidak boleh ada kombinasi ukuran duplikat (contoh: S_DEWASA duplikat)')
    }

    // Check semua quantities positif
    const zeroQuantities = sizes.filter(s => s.quantity <= 0)
    if (zeroQuantities.length > 0) {
      errors.push('Semua ukuran harus memiliki jumlah stok minimal 1')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Get available size options
   */
  getSizeOptions(): Array<{ value: string; label: string }> {
    return this.sizeOptions
  }
}