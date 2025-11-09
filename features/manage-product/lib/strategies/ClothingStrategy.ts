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
   * Available size options untuk clothing
   */
  private readonly sizeOptions = [
    { value: 'XS', label: 'XS (Extra Small)' },
    { value: 'S', label: 'S (Small)' },
    { value: 'M', label: 'M (Medium)' },
    { value: 'L', label: 'L (Large)' },
    { value: 'XL', label: 'XL (Extra Large)' },
    { value: 'XXL', label: 'XXL (Double Extra Large)' }
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
      helpText: 'Pilih semua ukuran yang tersedia untuk produk ini'
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
      selectedSizes.forEach((sizeValue: string) => {
        const quantityKey = `quantity_${sizeValue}`
        const quantity = this.ensureNumber(formData[quantityKey])

        if (quantity > 0) {
          sizes.push({
            ageCategory: 'ADULT', // Default untuk clothing
            size: sizeValue as 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL',
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
        message: 'Minimal satu ukuran yang dipilih harus memiliki stok',
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
    return 'Untuk pakaian standar dengan ukuran S, M, L, XL, XXL. Pilih ukuran yang tersedia dan masukkan jumlah stoknya.'
  }

  /**
   * Transform ProductSize kembali ke form format (untuk edit mode)
   */
  transformFromProductSizes(sizes: CreateProductSizeRequest[]): CategoryFormData {
    const defaultValues = this.getDefaultValues()
    const formData: CategoryFormData = {
      ...defaultValues
    }

    // Group sizes berdasarkan size value
    const selectedSizes: string[] = []

    sizes.forEach(size => {
      if (size.ageCategory === 'ADULT' && this.sizeOptions.some(opt => opt.value === size.size)) {
        selectedSizes.push(size.size)
        const quantityKey = `quantity_${size.size}`
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
      selectedSizes.forEach((sizeValue: string) => {
        const quantityKey = `quantity_${sizeValue}`
        const quantity = this.ensureNumber(formData[quantityKey])

        if (quantity > 0) {
          sizes.push({
            ageCategory: 'ADULT',
            size: sizeValue as any, // Type assertion for valid size enum
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
    const validSizes = this.sizeOptions.map(opt => opt.value)

    // Filter ADULT sizes
    const clothingSizes = sizes.filter(size => size.ageCategory === 'ADULT')

    // Check untuk invalid sizes
    const invalidSizes = clothingSizes.filter(size => !validSizes.includes(size.size))
    if (invalidSizes.length > 0) {
      errors.push(`Ukuran tidak valid: ${invalidSizes.map(s => s.size).join(', ')}. Gunakan: ${validSizes.join(', ')}`)
    }

    // Check untuk duplicate sizes
    const sizeValues = clothingSizes.map(s => s.size)
    const uniqueSizes = new Set(sizeValues)
    if (sizeValues.length !== uniqueSizes.size) {
      errors.push('Tidak boleh ada ukuran duplikat')
    }

    // Check semua quantities positif
    const zeroQuantities = clothingSizes.filter(s => s.quantity <= 0)
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