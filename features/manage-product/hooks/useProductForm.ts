/**
 * useProductForm Hook - React Hook Form integration for product forms
 * Handles form state, validation, and submission with real-time feedback
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect } from 'react'
import { createProductSchema, updateProductSchema } from '../lib/validation/productSchema'
import { useImageUpload } from './useImageUpload'
import { useCategories } from './useCategories'
import { showSuccess, showError } from '@/lib/notifications'
import type { Product, CreateProductRequest, UpdateProductRequest } from '../types'
import type { z } from 'zod'

type ProductFormData = z.infer<typeof createProductSchema>
type UpdateProductFormData = z.infer<typeof updateProductSchema>

interface UseProductFormOptions {
  product?: Product // For edit mode
  onSubmit?: (data: CreateProductRequest | UpdateProductRequest) => Promise<void>
  onCancel?: () => void
  autoSave?: boolean
  mode?: 'create' | 'edit'
}

export function useProductForm(options: UseProductFormOptions = {}) {
  const { product, onSubmit, onCancel, autoSave = false, mode = 'create' } = options

  // Determine schema based on mode
  const schema = mode === 'create' ? createProductSchema : updateProductSchema
  const isEditMode = mode === 'edit' && !!product

  // Setup form with React Hook Form
  const form = useForm<ProductFormData | UpdateProductFormData>({
    resolver: zodResolver(schema),
    defaultValues: isEditMode
      ? {
          code: product.code,
          name: product.name,
          description: product.description || '',
          modalAwal: Number(product.modalAwal),
          hargaSewa: Number(product.hargaSewa),
          quantity: product.quantity,
          categoryId: product.categoryId,
        }
      : {
          code: '',
          name: '',
          description: '',
          modalAwal: 0,
          hargaSewa: 0,
          quantity: 0,
          categoryId: '',
        },
    mode: 'onChange', // Real-time validation
  })

  // Image upload handling
  const imageUpload = useImageUpload({
    onFileChange: (file) => {
      form.setValue('image', file)
      if (file) {
        form.clearErrors('image')
      }
    },
  })

  // Categories for dropdown
  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories()
  const categories = categoriesData?.categories || []

  // Form state
  const {
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, isValid },
    reset,
    setValue,
    watch,
    clearErrors,
    setError,
  } = form

  // Watch all fields for auto-save
  const watchedFields = watch()

  // Handle form submission
  const onFormSubmit = useCallback(
    async (data: ProductFormData | UpdateProductFormData) => {
      try {
        // Prepare submission data
        const submissionData = {
          ...data,
          image: imageUpload.file,
        } as CreateProductRequest | UpdateProductRequest

        await onSubmit?.(submissionData)

        // Reset form on successful create
        if (mode === 'create') {
          reset()
          imageUpload.reset()
          showSuccess('Produk berhasil disimpan', 'Form telah direset untuk input baru')
        }
      } catch (error) {
        console.error('Form submission error:', error)

        // Handle validation errors from API
        if (error && typeof error === 'object' && 'field' in error) {
          const apiError = error as { field: string; message: string }
          setError(apiError.field as keyof ProductFormData, {
            type: 'manual',
            message: apiError.message,
          })
        } else {
          showError(
            'Gagal menyimpan produk',
            error instanceof Error ? error.message : 'Terjadi kesalahan tidak terduga',
          )
        }
      }
    },
    [onSubmit, mode, reset, imageUpload, setError],
  )

  // Auto-save functionality (debounced)
  useEffect(() => {
    if (!autoSave || !isDirty || !isValid) return

    const timeoutId = setTimeout(() => {
      handleSubmit(onFormSubmit)()
    }, 2000) // 2 second debounce

    return () => clearTimeout(timeoutId)
  }, [watchedFields, autoSave, isDirty, isValid, handleSubmit, onFormSubmit])

  // Reset form to initial values
  const resetForm = useCallback(() => {
    reset()
    imageUpload.reset()
    clearErrors()
  }, [reset, imageUpload, clearErrors])

  // Cancel form and reset
  const cancelForm = useCallback(() => {
    resetForm()
    onCancel?.()
  }, [resetForm, onCancel])

  // Prefill form with product data (for edit mode)
  const prefillForm = useCallback(
    (productData: Product) => {
      reset({
        code: productData.code,
        name: productData.name,
        description: productData.description || '',
        modalAwal: Number(productData.modalAwal),
        hargaSewa: Number(productData.hargaSewa),
        quantity: productData.quantity,
        categoryId: productData.categoryId,
      })

      // Handle existing image
      if (productData.imageUrl) {
        // Note: You might want to fetch and set the existing image file here
        // For now, we'll just clear any selected file
        imageUpload.reset()
      }
    },
    [reset, imageUpload],
  )

  // Validate specific field
  const validateField = useCallback(
    (fieldName: keyof ProductFormData, value: Product) => {
      try {
        schema.shape[fieldName]?.parse(value)
        clearErrors(fieldName)
        return true
      } catch (error) {
        if (error instanceof Error) {
          setError(fieldName, { type: 'manual', message: error.message })
        }
        return false
      }
    },
    [schema, clearErrors, setError],
  )

  // Check if product code is unique (for create mode)
  const checkCodeUniqueness = useCallback(
    async (code: string) => {
      if (mode === 'edit' && product?.code === code) return true

      // This would typically call an API endpoint to check uniqueness
      // For now, we'll just validate format
      return /^[A-Z0-9]{4}$/.test(code)
    },
    [mode, product],
  )

  return {
    // Form instance
    form,

    // Form methods
    handleSubmit: handleSubmit(onFormSubmit),
    reset: resetForm,
    cancel: cancelForm,
    prefill: prefillForm,
    validateField,
    checkCodeUniqueness,

    // Form state
    errors,
    isSubmitting,
    isDirty,
    isValid,

    // Image upload
    imageUpload,

    // Categories
    categories,
    isLoadingCategories,

    // Utilities
    setValue,
    watch,
    clearErrors,

    // Computed states
    canSubmit: isValid && !isSubmitting,
    hasErrors: Object.keys(errors).length > 0,
    isEditMode,

    // Auto-save state
    autoSaveEnabled: autoSave && isDirty && isValid,
  }
}
