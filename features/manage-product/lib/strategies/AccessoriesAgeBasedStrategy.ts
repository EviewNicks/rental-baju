/**
 * Accessories Age-Based Strategy
 *
 * Strategy untuk aksesoris yang memerlukan pembagian umur (Dewasa/Anak).
 * Contoh produk: Sarung, Songket
 */

import { z } from 'zod'
import type {
  CategoryFormStrategy,
  FormSectionConfig,
  CreateProductSizeRequest,
  CategoryFormData
} from './CategoryFormStrategy'
import type { CategoryType } from '../../types'

export class AccessoriesAgeBasedStrategy implements CategoryFormStrategy {
  readonly type: CategoryType = 'accessories_age_based'

  private ensureNumber(value: unknown): number {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const parsed = Number(value)
      if (!isNaN(parsed)) return parsed
    }
    return 0
  }

  /**
   * Form fields untuk aksesoris berbasis umur
   * - Jumlah Dewasa (number input)
   * - Jumlah Anak (number input)
   */
  getFormFields(): FormSectionConfig[] {
    return [
      {
        title: 'Ukuran & Stok',
        description: 'Masukkan jumlah stok untuk setiap kategori umur',
        fields: [
          {
            name: 'jumlahDewasa',
            type: 'number',
            label: 'Jumlah Dewasa',
            placeholder: '0',
            required: true,
            validation: z.number().min(0, 'Jumlah dewasa minimal 0'),
            min: 0,
            max: 9999,
            defaultValue: 0,
            helpText: 'Jumlah stok untuk kategori dewasa'
          },
          {
            name: 'jumlahAnak',
            type: 'number',
            label: 'Jumlah Anak',
            placeholder: '0',
            required: true,
            validation: z.number().min(0, 'Jumlah anak minimal 0'),
            min: 0,
            max: 9999,
            defaultValue: 0,
            helpText: 'Jumlah stok untuk kategori anak'
          }
        ]
      }
    ]
  }

  /**
   * Transform form data ke ProductSize format
   */
  transformToProductSizes(formData: CategoryFormData): CreateProductSizeRequest[] {
    const sizes: CreateProductSizeRequest[] = []

    const jumlahDewasa = this.ensureNumber(formData.jumlahDewasa)
    const jumlahAnak = this.ensureNumber(formData.jumlahAnak)

    // Add Dewasa size jika ada quantity
    if (jumlahDewasa > 0) {
      sizes.push({
        ageCategory: 'ADULT',
        size: 'UNIVERSAL',
        quantity: jumlahDewasa,
        isActive: true
      })
    }

    // Add Anak size jika ada quantity
    if (jumlahAnak > 0) {
      sizes.push({
        ageCategory: 'CHILD',
        size: 'UNIVERSAL',
        quantity: jumlahAnak,
        isActive: true
      })
    }

    return sizes
  }

  /**
   * Validation schema untuk form data
   */
  getValidationSchema(): z.ZodSchema {
    return z.object({
      jumlahDewasa: z.number().min(0, 'Jumlah dewasa minimal 0').max(9999, 'Maksimal 9999'),
      jumlahAnak: z.number().min(0, 'Jumlah anak minimal 0').max(9999, 'Maksimal 9999')
    }).refine(
      (data) => data.jumlahDewasa > 0 || data.jumlahAnak > 0,
      {
        message: 'Minimal salah satu kategori (Dewasa atau Anak) harus memiliki stok',
        path: ['jumlahDewasa']
      }
    )
  }

  /**
   * Default values untuk form
   */
  getDefaultValues(): CategoryFormData {
    return {
      categoryId: '',
      jumlahDewasa: 0,
      jumlahAnak: 0
    }
  }

  /**
   * Form description untuk user guidance
   */
  getFormDescription(): string {
    return 'Untuk aksesoris seperti sarung atau songket yang memerlukan pembagian stok berdasarkan kategori umur.'
  }

  /**
   * Transform ProductSize kembali ke form format (untuk edit mode)
   */
  transformFromProductSizes(sizes: CreateProductSizeRequest[]): CategoryFormData {
    const formData: CategoryFormData = {
      categoryId: '',
      jumlahDewasa: 0,
      jumlahAnak: 0
    }

    sizes.forEach(size => {
      if (size.ageCategory === 'ADULT') {
        formData.jumlahDewasa = size.quantity
      } else if (size.ageCategory === 'CHILD') {
        formData.jumlahAnak = size.quantity
      }
    })

    return formData
  }

  /**
   * Calculate total quantity dari form data
   */
  calculateTotalQuantity(formData: CategoryFormData): number {
    return this.ensureNumber(formData.jumlahDewasa) + this.ensureNumber(formData.jumlahAnak)
  }

  /**
   * Generate size display string untuk UI
   */
  generateSizeDisplay(formData: CategoryFormData): string {
    const parts: string[] = []

    const dewasaCount = this.ensureNumber(formData.jumlahDewasa)
    const anakCount = this.ensureNumber(formData.jumlahAnak)

    if (dewasaCount > 0) {
      parts.push(`Dewasa: ${dewasaCount}`)
    }

    if (anakCount > 0) {
      parts.push(`Anak: ${anakCount}`)
    }

    return parts.length > 0 ? parts.join(', ') : 'Belum ada stok'
  }
}