'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import {
  createAdvancedProductSchema,
  updateAdvancedProductSchema,
  validateAdvancedSizeArraySchema,
} from '@/features/manage-product/lib/validation/advancedProductSchema'
import type {
  AdvancedProduct,
  CreateAdvancedProductSizeRequest,
  AdvancedAggregatedSizeView,
} from '@/features/manage-product/types/advanced'
import { logger } from '@/services/logger'

// Form logger
const formLogger = logger.child('useAdvancedProductForm')

/**
 * Advanced Product Form Data Structure
 */
interface AdvancedProductFormData {
  code: string
  name: string
  categoryId: string
  colorId?: string
  materialId?: string
  materialQuantity?: number
  modalAwal: number
  currentPrice: number
  description: string
  imageUrl: string | null
  image?: File | null

  // REQUIRED: Advanced size management only
  sizes: CreateAdvancedProductSizeRequest[]
}

/**
 * Form validation errors
 */
interface FormErrors {
  [key: string]: string | null
}

/**
 * Form touched state
 */
interface FormTouched {
  [key: string]: boolean
}

/**
 * Hook options
 */
interface UseAdvancedProductFormOptions {
  mode: 'create' | 'edit'
  initialData?: AdvancedProduct
  onSubmit?: (data: AdvancedProductFormData) => Promise<void>
  enableAutoSave?: boolean
  autoSaveDelayMs?: number
}

/**
 * Hook return type
 */
interface UseAdvancedProductFormReturn {
  // Form data and state
  formData: AdvancedProductFormData
  errors: FormErrors
  touched: FormTouched
  isValid: boolean
  isDirty: boolean
  isSubmitting: boolean

  // Form handlers
  setValue: (name: string, value: any) => void
  setValues: (values: Partial<AdvancedProductFormData>) => void
  handleInputChange: (name: string, value: any) => void
  handleBlur: (name: string, value: any) => void
  handleSizesChange: (sizes: CreateAdvancedProductSizeRequest[]) => void
  handleAggregatedSizesChange: (sizes: AdvancedAggregatedSizeView[]) => void

  // Form actions
  handleSubmit: (e?: React.FormEvent) => Promise<void>
  reset: () => void
  validate: () => boolean
  validateField: (fieldName: string) => string | null

  // Utility functions
  formatCurrency: (value: string) => string
  getTotalQuantity: () => number
  getSizesSummary: () => { count: number; totalQuantity: number; uniqueAgeCategories: number }
}

/**
 * Default form data
 */
const getDefaultFormData = (): AdvancedProductFormData => ({
  code: '',
  name: '',
  categoryId: '',
  colorId: '',
  materialId: '',
  materialQuantity: 0,
  modalAwal: 0,
  currentPrice: 0,
  description: '',
  imageUrl: null,
  image: null,
  sizes: [], // REQUIRED but starts empty
})

/**
 * Advanced Product Form Hook
 *
 * Provides comprehensive form state management for advanced-only product forms:
 * - REQUIRED sizes validation (minimum 1 size)
 * - Real-time validation with business rules
 * - Size aggregation calculation
 * - Auto-save capabilities
 * - Currency formatting utilities
 */
export function useAdvancedProductForm({
  mode,
  initialData,
  onSubmit,
  enableAutoSave = false,
  autoSaveDelayMs = 2000,
}: UseAdvancedProductFormOptions): UseAdvancedProductFormReturn {
  // Form state
  const [formData, setFormData] = useState<AdvancedProductFormData>(() => {
    if (initialData) {
      return {
        code: initialData.code,
        name: initialData.name,
        categoryId: initialData.categoryId,
        colorId: initialData.colorId || '',
        materialId: initialData.materialId || '',
        materialQuantity: initialData.materialQuantity || 0,
        modalAwal: initialData.modalAwal,
        currentPrice: initialData.currentPrice,
        description: initialData.description || '',
        imageUrl: initialData.imageUrl || null,
        image: null,
        sizes: initialData.sizes.map(size => ({
          ageCategory: size.ageCategory,
          size: size.size,
          quantity: size.quantity,
          isActive: size.isActive,
        })),
      }
    }
    return getDefaultFormData()
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<FormTouched>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [initialFormData] = useState<AdvancedProductFormData>(formData)

  // Form validation
  const isValid = useMemo(() => {
    const schema = mode === 'create' ? createAdvancedProductSchema : updateAdvancedProductSchema
    const result = schema.safeParse(formData)
    return result.success && formData.sizes.length > 0
  }, [formData, mode])

  // Check if form is dirty (has changes)
  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormData)
  }, [formData, initialFormData])

  // Field validation function
  const validateField = useCallback((fieldName: string): string | null => {
    try {
      const schema = mode === 'create' ? createAdvancedProductSchema : updateAdvancedProductSchema

      // Special validation for sizes
      if (fieldName === 'sizes') {
        if (formData.sizes.length === 0) {
          return 'Minimal 1 ukuran harus ditambahkan'
        }

        const sizeValidation = validateAdvancedSizeArraySchema(formData.sizes)
        if (!sizeValidation.success) {
          return sizeValidation.error?.issues[0]?.message || 'Validasi ukuran gagal'
        }

        return null
      }

      // Validate individual field
      const fieldValue = formData[fieldName as keyof AdvancedProductFormData]
      const fieldSchema = schema.shape[fieldName as keyof typeof schema.shape]

      if (fieldSchema) {
        const result = fieldSchema.safeParse(fieldValue)
        if (!result.success) {
          return result.error.issues[0]?.message || 'Validasi gagal'
        }
      }

      return null
    } catch (error) {
      formLogger.error('Field validation error', { fieldName, error })
      return 'Validasi gagal'
    }
  }, [formData, mode])

  // Form validation function
  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {}

    // Validate all fields
    Object.keys(formData).forEach(fieldName => {
      const error = validateField(fieldName)
      if (error) {
        newErrors[fieldName] = error
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, validateField])

  // Set single value
  const setValue = useCallback((name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null,
      }))
    }

    formLogger.debug('Form field updated', { name, value })
  }, [errors])

  // Set multiple values
  const setValues = useCallback((values: Partial<AdvancedProductFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...values,
    }))

    // Clear errors for updated fields
    const updatedFields = Object.keys(values)
    if (updatedFields.some(field => errors[field])) {
      setErrors(prev => {
        const newErrors = { ...prev }
        updatedFields.forEach(field => {
          delete newErrors[field]
        })
        return newErrors
      })
    }

    formLogger.debug('Multiple form fields updated', { fields: Object.keys(values) })
  }, [errors])

  // Handle input change
  const handleInputChange = useCallback((name: string, value: any) => {
    setValue(name, value)
  }, [setValue])

  // Handle blur (for validation)
  const handleBlur = useCallback((name: string, value: any) => {
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }))

    // Validate field on blur
    const error = validateField(name)
    setErrors(prev => ({
      ...prev,
      [name]: error,
    }))

    formLogger.debug('Field blurred and validated', { name, hasError: !!error })
  }, [validateField])

  // Handle sizes change
  const handleSizesChange = useCallback((sizes: CreateAdvancedProductSizeRequest[]) => {
    setValue('sizes', sizes)

    // Mark sizes as touched
    setTouched(prev => ({
      ...prev,
      sizes: true,
    }))

    formLogger.info('Sizes updated', { sizesCount: sizes.length })
  }, [setValue])

  // Handle aggregated sizes change (for display purposes)
  const handleAggregatedSizesChange = useCallback((sizes: AdvancedAggregatedSizeView[]) => {
    // This is primarily for display/analytics purposes
    // The actual sizes data is managed by handleSizesChange
    formLogger.debug('Aggregated sizes updated', { aggregatedCount: sizes.length })
  }, [])

  // Currency formatting utility
  const formatCurrency = useCallback((value: string): string => {
    const numericValue = value.replace(/[^\d]/g, '')
    if (!numericValue) return ''

    const number = parseInt(numericValue)
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number)
  }, [])

  // Calculate total quantity from sizes
  const getTotalQuantity = useCallback((): number => {
    return formData.sizes.reduce((sum, size) => sum + size.quantity, 0)
  }, [formData.sizes])

  // Get sizes summary
  const getSizesSummary = useCallback(() => {
    const count = formData.sizes.length
    const totalQuantity = getTotalQuantity()
    const uniqueAgeCategories = new Set(formData.sizes.map(s => s.ageCategory)).size

    return {
      count,
      totalQuantity,
      uniqueAgeCategories,
    }
  }, [formData.sizes, getTotalQuantity])

  // Form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    setIsSubmitting(true)

    try {
      // Validate form
      if (!validate()) {
        toast.error('Formulir mengandung kesalahan. Silakan periksa kembali.')
        return
      }

      // Check required sizes
      if (formData.sizes.length === 0) {
        toast.error('Minimal 1 ukuran harus ditambahkan')
        setErrors(prev => ({
          ...prev,
          sizes: 'Minimal 1 ukuran harus ditambahkan'
        }))
        return
      }

      // Call submit handler
      if (onSubmit) {
        await onSubmit(formData)
        formLogger.info('Form submitted successfully', { mode, sizesCount: formData.sizes.length })
      }
    } catch (error) {
      formLogger.error('Form submission failed', { error, mode })
      toast.error('Gagal menyimpan produk. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, onSubmit, validate, mode])

  // Reset form
  const reset = useCallback(() => {
    const resetData = initialData ? {
      code: initialData.code,
      name: initialData.name,
      categoryId: initialData.categoryId,
      colorId: initialData.colorId || '',
      materialId: initialData.materialId || '',
      materialQuantity: initialData.materialQuantity || 0,
      modalAwal: initialData.modalAwal,
      currentPrice: initialData.currentPrice,
      description: initialData.description || '',
      imageUrl: initialData.imageUrl || null,
      image: null,
      sizes: initialData.sizes.map(size => ({
        ageCategory: size.ageCategory,
        size: size.size,
        quantity: size.quantity,
        isActive: size.isActive,
      })),
    } : getDefaultFormData()

    setFormData(resetData)
    setErrors({})
    setTouched({})

    formLogger.info('Form reset', { mode })
  }, [initialData, mode])

  // Auto-save effect (if enabled)
  useEffect(() => {
    if (!enableAutoSave || !isDirty || !isValid) return

    const timeoutId = setTimeout(() => {
      if (onSubmit) {
        formLogger.debug('Auto-saving form')
        handleSubmit()
      }
    }, autoSaveDelayMs)

    return () => clearTimeout(timeoutId)
  }, [enableAutoSave, isDirty, isValid, formData, autoSaveDelayMs, onSubmit, handleSubmit])

  // Initialize form logging
  useEffect(() => {
    formLogger.info('Advanced product form initialized', {
      mode,
      hasInitialData: !!initialData,
      enableAutoSave,
    })
  }, [mode, initialData, enableAutoSave])

  return {
    // Form data and state
    formData,
    errors,
    touched,
    isValid,
    isDirty,
    isSubmitting,

    // Form handlers
    setValue,
    setValues,
    handleInputChange,
    handleBlur,
    handleSizesChange,
    handleAggregatedSizesChange,

    // Form actions
    handleSubmit,
    reset,
    validate,
    validateField,

    // Utility functions
    formatCurrency,
    getTotalQuantity,
    getSizesSummary,
  }
}

export type {
  AdvancedProductFormData,
  FormErrors,
  FormTouched,
  UseAdvancedProductFormOptions,
  UseAdvancedProductFormReturn,
}