/**
 * Accessories Universal Strategy
 *
 * Strategy untuk aksesoris universal yang tidak memerlukan pembagian umur.
 * Contoh produk: Anting, Gelang, Kalung
 */

import { z } from 'zod'
import type {
  CategoryFormStrategy,
  FormSectionConfig,
  CreateProductSizeRequest,
  CategoryFormData
} from './CategoryFormStrategy'
import type { CategoryType } from '../../types'

export class AccessoriesUniversalStrategy implements CategoryFormStrategy {
  readonly type: CategoryType = 'accessories_universal'

  private ensureNumber(value: unknown): number {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const parsed = Number(value)
      if (!isNaN(parsed)) return parsed
    }
    return 0
  }

  /**
   * Form fields untuk aksesoris universal
   * - Jumlah Total (single number input)
   */
  getFormFields(): FormSectionConfig[] {
    return [
      {
        title: 'Stok Produk',
        description: 'Masukkan jumlah total stok untuk produk ini',
        fields: [
          {
            name: 'jumlahTotal',
            type: 'number',
            label: 'Jumlah Total',
            placeholder: '0',
            required: true,
            validation: z.number().min(1, 'Jumlah total minimal 1'),
            min: 1,
            max: 9999,
            defaultValue: 1,
            helpText: 'Total stok yang tersedia untuk disewa'
          }
        ]
      }
    ]
  }

  /**
   * Transform form data ke ProductSize format
   */
  transformToProductSizes(formData: CategoryFormData): CreateProductSizeRequest[] {
    const jumlahTotal = this.ensureNumber(formData.jumlahTotal)

    if (jumlahTotal <= 0) {
      return []
    }

    // Universal accessories menggunakan UNIVERSAL age category
    return [
      {
        ageCategory: 'UNIVERSAL',
        size: 'UNIVERSAL',
        quantity: jumlahTotal,
        isActive: true
      }
    ]
  }

  /**
   * Validation schema untuk form data
   */
  getValidationSchema(): z.ZodSchema {
    return z.object({
      jumlahTotal: z.number().min(1, 'Jumlah total minimal 1').max(9999, 'Maksimal 9999')
    })
  }

  /**
   * Default values untuk form
   */
  getDefaultValues(): CategoryFormData {
    return {
      categoryId: '',
      jumlahTotal: 1
    }
  }

  /**
   * Form description untuk user guidance
   */
  getFormDescription(): string {
    return 'Untuk aksesoris universal seperti anting, gelang, atau kalung yang tidak memerlukan pembagian ukuran atau kategori umur.'
  }

  /**
   * Transform ProductSize kembali ke form format (untuk edit mode)
   */
  transformFromProductSizes(sizes: CreateProductSizeRequest[]): CategoryFormData {
    const formData: CategoryFormData = {
      categoryId: '',
      jumlahTotal: 0
    }

    // Cari UNIVERSAL size
    const universalSize = sizes.find(
      size => size.ageCategory === 'UNIVERSAL' && size.size === 'UNIVERSAL'
    )

    if (universalSize) {
      formData.jumlahTotal = universalSize.quantity
    }

    return formData
  }

  /**
   * Get initial sizes dari form data untuk edit mode initialization
   */
  getInitialSizes(formData: CategoryFormData): CreateProductSizeRequest[] {
    const jumlahTotal = this.ensureNumber(formData.jumlahTotal)

    if (jumlahTotal <= 0) {
      return []
    }

    return [
      {
        ageCategory: 'UNIVERSAL',
        size: 'UNIVERSAL',
        quantity: jumlahTotal,
        isActive: true
      }
    ]
  }

  /**
   * Calculate total quantity dari form data
   */
  calculateTotalQuantity(formData: CategoryFormData): number {
    return this.ensureNumber(formData.jumlahTotal)
  }

  /**
   * Generate size display string untuk UI
   */
  generateSizeDisplay(formData: CategoryFormData): string {
    const total = this.ensureNumber(formData.jumlahTotal)
    return total > 0 ? `${total} item(s)` : 'Belum ada stok'
  }

  /**
   * Validate bahwa hanya ada satu UNIVERSAL entry
   */
  validateProductSizes(sizes: CreateProductSizeRequest[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Filter hanya UNIVERSAL sizes
    const universalSizes = sizes.filter(
      size => size.ageCategory === 'UNIVERSAL' && size.size === 'UNIVERSAL'
    )

    if (universalSizes.length === 0) {
      errors.push('Minimal satu ukuran UNIVERSAL harus ada')
    } else if (universalSizes.length > 1) {
      errors.push('Aksesoris universal seharusnya hanya memiliki satu jenis ukuran')
    }

    // Validate tidak ada size lain selain UNIVERSAL
    const nonUniversalSizes = sizes.filter(
      size => !(size.ageCategory === 'UNIVERSAL' && size.size === 'UNIVERSAL')
    )

    if (nonUniversalSizes.length > 0) {
      errors.push('Aksesoris universal hanya boleh menggunakan ukuran UNIVERSAL')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}