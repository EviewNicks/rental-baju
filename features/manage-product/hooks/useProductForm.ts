/**
 * Simplified useProductForm Hook - Form state management
 * Consolidates form logic without over-engineering
 */

import { useState } from 'react'
import { useCreateProduct, useUpdateProduct } from './useProducts'
import type { Product } from '../types'

export interface ProductFormData {
  code: string
  name: string
  description: string
  category: string
  size?: string
  colorId?: string
  modalAwal: number
  hargaSewa: number
  status: string
  image?: File
}

interface UseProductFormProps {
  initialData?: Partial<Product>
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useProductForm({ 
  initialData, 
  onSuccess, 
  onError 
}: UseProductFormProps = {}) {
  // Form state - keep it simple
  const [formData, setFormData] = useState<ProductFormData>({
    code: initialData?.code || '',
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    size: initialData?.size || '',
    colorId: initialData?.colorId || '',
    modalAwal: initialData?.modalAwal || 0,
    hargaSewa: initialData?.hargaSewa || 0,
    status: initialData?.status || 'Tersedia',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mutations
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  
  const isEditing = !!initialData?.id

  // Update form field
  const updateField = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Update multiple fields
  const updateFields = (updates: Partial<ProductFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  // Simple validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.code.trim()) newErrors.code = 'Kode produk wajib diisi'
    if (!formData.name.trim()) newErrors.name = 'Nama produk wajib diisi'  
    if (!formData.category.trim()) newErrors.category = 'Kategori wajib dipilih'
    if (formData.modalAwal < 0) newErrors.modalAwal = 'Modal awal tidak boleh negatif'
    if (formData.hargaSewa < 0) newErrors.hargaSewa = 'Harga sewa tidak boleh negatif'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    
    try {
      // Prepare form data for submission
      const submitData = new FormData()
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'image' && value instanceof File) {
            submitData.append('image', value)
          } else if (key !== 'image') {
            submitData.append(key, value.toString())
          }
        }
      })

      if (isEditing && initialData?.id) {
        await updateProduct.mutateAsync({ 
          id: initialData.id, 
          data: submitData 
        })
      } else {
        await createProduct.mutateAsync(submitData)
      }

      onSuccess?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan'
      onError?.(new Error(errorMessage))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      category: '',
      size: '',
      colorId: '',
      modalAwal: 0,
      hargaSewa: 0,
      status: 'Tersedia',
    })
    setErrors({})
  }

  return {
    // Form state
    formData,
    errors,
    isSubmitting,
    isEditing,

    // Form actions
    updateField,
    updateFields,
    handleSubmit,
    resetForm,
    validateForm,

    // Computed states
    isValid: Object.keys(errors).length === 0,
    isDirty: JSON.stringify(formData) !== JSON.stringify(initialData || {}),
  }
}