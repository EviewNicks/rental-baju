'use client'

import type React from 'react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@/components/ui/breadcrumb'
import { ProductForm } from '@/features/manage-product/components/form-product/ProductForm'
import { useCategories } from '@/features/manage-product/hooks/useCategories'
import { useCreateProduct, useUpdateProduct } from '@/features/manage-product/hooks/useProducts'
import { ProductSizeTransformer } from '@/features/manage-product/utils/ProductSizeTransformer'
import type {
  ClientProduct,
  AggregatedSizeView,
  SimplifiedSizeEntry,
  CreateProductSizeRequest,
} from '@/features/manage-product/types'
import type { CategoryFormData } from '@/features/manage-product/lib/strategies/CategoryFormStrategy'
import { FormStrategyFactory } from '@/features/manage-product/lib/strategies/StrategyFactory'

// Image format validation constants
const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

// Local form data interface with numbers for form handling
interface ProductFormData {
  code: string
  name: string
  categoryId: string
  materialId?: string | undefined
  materialQuantity?: number | undefined
  quantity: number
  modalAwal: number
  currentPrice: number
  description: string
  imageUrl: string | null
  image?: File | null

  // Simplified Size Management (required for all products)
  hasSizes: boolean // Always true in advanced-only architecture
  simplifiedSizes?: SimplifiedSizeEntry[]
  aggregatedSizes?: AggregatedSizeView[] // Keep for backward compatibility
}

// Request interfaces for API calls
interface CreateProductRequest {
  code: string
  name: string
  description: string
  modalAwal: number
  currentPrice: number
  quantity: number
  categoryId: string
  sizes: string // JSON string format required by backend
  materialId?: string
  materialQuantity?: number
  image?: File
  imageUrl?: string
}

interface UpdateProductRequest {
  name: string
  description: string
  modalAwal: number
  currentPrice: number
  quantity: number
  categoryId: string
  sizes: string // JSON string format required by backend
  materialId?: string
  materialQuantity?: number
  image?: File
  imageUrl?: string
}
// Jika ingin menggunakan mock data saat development, import mock-categories
// import { mockCategories } from '@/features/manage-product/data/mock-categories'

interface ProductFormPageProps {
  mode: 'add' | 'edit'
  product?: ClientProduct | null
  breadcrumbItems: Array<{ label: string; href?: string; current?: boolean }>
  title: string
  subtitle: string
}

// Simple validation helper functions
const validateProductCode = (code: string): string | null => {
  if (!code.trim()) return 'Kode produk wajib diisi'
  if (!/^[A-Za-z0-9]{3,10}$/.test(code)) return 'Kode harus 3-10 digit alfanumerik'
  return null
}

const validateProductName = (name: string): string | null => {
  if (!name.trim()) return 'Nama produk wajib diisi'
  if (name.length < 3) return 'Nama produk minimal 3 karakter'
  if (name.length > 100) return 'Nama produk maksimal 100 karakter'
  return null
}

const validateCategoryId = (categoryId: string): string | null => {
  if (!categoryId || categoryId.trim() === '') return 'Kategori wajib dipilih'
  return null
}

const validateNumber = (
  value: number,
  field: string,
  min: number = 0,
  max?: number,
): string | null => {
  if (value === undefined || value === null) return `${field} wajib diisi`
  if (value < min) return `${field} minimal ${min}`
  if (max && value > max) return `${field} maksimal ${max}`
  return null
}

const validateDescription = (description: string): string | null => {
  if (description.length > 500) return 'Deskripsi maksimal 500 karakter'
  return null
}

// Image format validation function
const validateImageFormat = (file: File): string | null => {
  if (!SUPPORTED_IMAGE_FORMATS.includes(file.type.toLowerCase())) {
    return `Format ${file.type} tidak didukong. Gunakan JPG, PNG, atau WebP.`
  }
  return null
}

export function ProductFormPage({
  mode,
  product,
  breadcrumbItems,
  title,
  subtitle,
}: ProductFormPageProps) {
  const router = useRouter()

  // Fetch categories using hooks layer
  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
    error: categoriesError,
  } = useCategories({ isActive: true })

  // Product CRUD mutations
  const createProductMutation = useCreateProduct()
  const updateProductMutation = useUpdateProduct()

  const categories = categoriesData?.categories ?? []

  const [formData, setFormData] = useState<ProductFormData>({
    code: product?.code || '',
    name: product?.name || '',
    categoryId: product?.categoryId || '',
    // Fix: Initialize optional fields with undefined instead of empty strings to prevent Select.Item errors
    materialId: product?.materialId || undefined,
    materialQuantity: product?.materialQuantity || undefined,
    quantity: product?.quantity || 1,
    modalAwal: product?.modalAwal ? Number(product.modalAwal) : 0,
    currentPrice: product?.currentPrice ? Number(product.currentPrice) : 0,
    description: product?.description || '',
    imageUrl: product?.imageUrl || null,
    image: null,

    // Simplified Size Management (enforced - all products require sizes)
    hasSizes: true, // Always true in advanced-only architecture
    simplifiedSizes:
      mode === 'edit' && product?.sizes
        ? ProductSizeTransformer.transformProductSizesToSimplifiedFormat(product.sizes)
        : [], // Load existing sizes in edit mode, empty for new products
    aggregatedSizes: undefined, // Keep for backward compatibility
  })

  // Strategy state management for dynamic form integration
  const [strategySizes, setStrategySizes] = useState<CreateProductSizeRequest[]>([])
  const [categoryFormData, setCategoryFormData] = useState<CategoryFormData>({ categoryId: '' })

  // Simple error state management
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Prevent re-initialization flag
  const isInitializedRef = useRef<boolean>(false)

  // Initialize category form data from existing product in edit mode
  useEffect(() => {
    if (mode === 'edit' && product && product.categoryId && categories.length > 0 && !isInitializedRef.current) {
      isInitializedRef.current = true
      try {
        const category = categories.find((cat: any) => cat.id === product.categoryId)
        if (category) {
          const strategy = FormStrategyFactory.createWithContext(category.type, {
            categoryId: category.id,
            categoryName: category.name,
            isEditMode: true,
            existingData: product.sizes || [],
          })

          // Transform existing product sizes to form data
          const formData = strategy.transformFromProductSizes(product.sizes || [])
          formData.categoryId = product.categoryId

          setCategoryFormData(formData)

          // Initialize strategy sizes
          const transformedSizes = strategy.getInitialSizes(formData)
          setStrategySizes(transformedSizes)

          console.log('Edit mode: Initialized category form data:', formData)
          console.log('Edit mode: Initialized strategy sizes:', transformedSizes)
        }
      } catch (error) {
        console.error('Failed to initialize edit form data:', error)
        // Fallback to empty form data
        setCategoryFormData({ categoryId: product.categoryId })
        setStrategySizes([])
      }
    }
  }, [mode, product?.id, categories.length]) // Use specific dependencies to prevent re-runs

  // Simple validation function
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    const codeError = validateProductCode(formData.code)
    if (codeError) newErrors.code = codeError

    const nameError = validateProductName(formData.name)
    if (nameError) newErrors.name = nameError

    const categoryError = validateCategoryId(formData.categoryId)
    if (categoryError) newErrors.categoryId = categoryError

    const modalAwalError = validateNumber(formData.modalAwal, 'Modal awal')
    if (modalAwalError) newErrors.modalAwal = modalAwalError

    const currentPriceError = validateNumber(formData.currentPrice, 'Harga sewa')
    if (currentPriceError) newErrors.currentPrice = currentPriceError

    // Quantity is auto-calculated from aggregated sizes, no manual validation needed

    const descriptionError = validateDescription(formData.description)
    if (descriptionError) newErrors.description = descriptionError

    // Validate sizes array with strategy data priority
    const sizesError = ''
    let hasValidSizes = false

    if (strategySizes.length > 0) {
      // Priority 1: Strategy sizes
      hasValidSizes = strategySizes.length > 0
    } else if (formData.simplifiedSizes && formData.simplifiedSizes.length > 0) {
      // Priority 2: Simplified sizes (legacy system)
      hasValidSizes = !sizesError
    } else if (formData.aggregatedSizes && formData.aggregatedSizes.length > 0) {
      // Priority 3: Aggregated sizes (legacy fallback)
      hasValidSizes = formData.aggregatedSizes.some((size) => size.totalQuantity > 0)
    }

    // Set sizes error if no valid sizes found
    if (!hasValidSizes) {
      newErrors.sizes = 'Produk harus memiliki setidaknya satu ukuran dengan jumlah yang valid'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateSingleField = (name: string, value: string | number | File | null): void => {
    let error = ''

    switch (name) {
      case 'code':
        error = validateProductCode(typeof value === 'string' ? value : '') || ''
        break
      case 'name':
        error = validateProductName(typeof value === 'string' ? value : '') || ''
        break
      case 'categoryId':
        error = validateCategoryId(typeof value === 'string' ? value : '') || ''
        break
      case 'materialId':
        // MaterialId is optional, no validation needed
        error = ''
        break
      case 'materialQuantity':
        // MaterialQuantity is optional, no validation needed
        error = ''
        break
      case 'modalAwal':
        error = validateNumber(typeof value === 'number' ? value : 0, 'Modal awal') || ''
        break
      case 'currentPrice':
        error = validateNumber(typeof value === 'number' ? value : 0, 'Harga sewa') || ''
        break
      case 'quantity':
        // Quantity is auto-calculated from aggregated sizes, no manual validation needed
        error = ''
        break
      case 'description':
        error = validateDescription(typeof value === 'string' ? value : '') || ''
        break
    }

    setErrors((prev) => ({ ...prev, [name]: error }))
  }

  const handleInputChange = (name: string, value: string | number | File | null) => {
    // Validate image format if uploading an image
    if (name === 'image' && value instanceof File) {
      const imageError = validateImageFormat(value)
      if (imageError) {
        setErrors((prev) => ({ ...prev, image: imageError }))
        return // Don't update form data if image format is invalid
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleBlur = (name: string, value: string | number | File | null) => {
    setTouched((prev) => ({ ...prev, [name]: true }))
    validateSingleField(name, value)
  }

  // Size management handlers
  const handleHasSizesChange = () => {
    // In advanced-only architecture, sizes are always required
    // This function is kept for backward compatibility but enforces hasSizes = true
    setFormData((prev) => ({
      ...prev,
      hasSizes: true, // Always enforce sizes requirement
      aggregatedSizes: prev.aggregatedSizes, // Keep existing sizes
    }))
  }

  // Handler for new simplified sizes system
  const handleSimplifiedSizesChange = (sizes: SimplifiedSizeEntry[]) => {
    setFormData((prev) => ({
      ...prev,
      simplifiedSizes: sizes,
      // Auto-calculate total quantity from sizes using ProductSizeTransformer
      quantity: ProductSizeTransformer.calculateTotalQuantity(sizes, 'simplified'),
    }))

    // Clear any existing sizes validation error using ProductSizeTransformer
    ProductSizeTransformer.clearSizeErrors(setErrors)
  }

  // Handler for aggregated sizes change
  const handleAggregatedSizesChange = (sizes: AggregatedSizeView[]) => {
    setFormData((prev) => ({
      ...prev,
      aggregatedSizes: sizes,
      // Auto-calculate total quantity from sizes using ProductSizeTransformer
      quantity: ProductSizeTransformer.calculateTotalQuantity(sizes, 'aggregated'),
    }))

    // Clear any existing sizes validation error using ProductSizeTransformer
    ProductSizeTransformer.clearSizeErrors(setErrors)
  }

  // Strategy handlers for dynamic form integration
  const handleStrategySizesChange = (sizes: CreateProductSizeRequest[]) => {
    setStrategySizes(sizes)

    // Auto-calculate total quantity from strategy sizes using ProductSizeTransformer
    const totalQuantity = ProductSizeTransformer.calculateTotalQuantity(sizes, 'strategy')
    setFormData((prev) => ({ ...prev, quantity: totalQuantity }))

    // Clear any existing sizes validation error using ProductSizeTransformer
    ProductSizeTransformer.clearSizeErrors(setErrors)
  }

  const handleCategoryFormDataChange = (data: CategoryFormData) => {
    setCategoryFormData(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent multiple submissions
    if (isSubmitting) return

    setIsSubmitting(true)

    if (!validateForm()) {
      setTouched({
        code: true,
        name: true,
        categoryId: true,
        sizes: true, // Replace legacy size with sizes validation
        materialId: true,
        materialQuantity: true,
        modalAwal: true,
        currentPrice: true,
        quantity: true,
        description: true,
      })
      setIsSubmitting(false)
      return
    }

    // Transform sizes to backend format with strategy data priority using ProductSizeTransformer
    const { data: sizesData } = ProductSizeTransformer.transformToBackendFormat(
      strategySizes,
      formData.simplifiedSizes || [],
      formData.aggregatedSizes || [],
    )

    try {
      if (mode === 'add') {
        // Create new product
        const createData: CreateProductRequest = {
          code: formData.code,
          name: formData.name,
          description: formData.description,
          modalAwal: formData.modalAwal,
          currentPrice: formData.currentPrice,
          quantity: formData.quantity,
          categoryId: formData.categoryId,
          sizes: sizesData, // Use transformed sizes array
          materialId: formData.materialId || undefined,
          materialQuantity: formData.materialQuantity || undefined,
          image: formData.image || undefined,
          imageUrl: formData.imageUrl || undefined,
        }

        // Convert to FormData for proper API handling
        const formDataToSend = new FormData()
        Object.entries(createData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (value instanceof File) {
              formDataToSend.append(key, value)
            } else if (typeof value === 'object') {
              // Handle complex objects like sizes array
              formDataToSend.append(key, JSON.stringify(value))
            } else {
              formDataToSend.append(key, String(value))
            }
          }
        })

        await createProductMutation.mutateAsync(formDataToSend)
      } else {
        // Update existing product
        if (!product?.id) {
          throw new Error('Product ID is required for update')
        }

        const updateData: UpdateProductRequest = {
          name: formData.name,
          description: formData.description,
          modalAwal: formData.modalAwal,
          currentPrice: formData.currentPrice,
          quantity: formData.quantity,
          categoryId: formData.categoryId,
          sizes: sizesData, // Use transformed sizes array
          materialId: formData.materialId || undefined,
          materialQuantity: formData.materialQuantity || undefined,
          image: formData.image || undefined,
          imageUrl: formData.imageUrl || undefined,
        }

        // Convert to FormData for proper API handling
        const formDataToSend = new FormData()
        Object.entries(updateData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (value instanceof File) {
              formDataToSend.append(key, value)
            } else if (typeof value === 'object') {
              // Handle complex objects like sizes array
              formDataToSend.append(key, JSON.stringify(value))
            } else {
              formDataToSend.append(key, String(value))
            }
          }
        })

        await updateProductMutation.mutateAsync({
          id: product.id,
          data: formDataToSend,
        })
      }

      // Success - redirect to product list
      router.push('/producer/manage-product')
    } catch (error) {
      console.error(`[DEBUG] Error ${mode === 'add' ? 'creating' : 'updating'} product:`, {
        error: error,
        errorMessage: error instanceof Error ? error.message : String(error),
        formData: formData,
        sizesData: sizesData,
        transformedSizes: formData.simplifiedSizes,
        mutationError: mode === 'add' ? createProductMutation.error : updateProductMutation.error,
      })
      // Error handling is already done in the mutations
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = () => {
    localStorage.setItem('product-draft', JSON.stringify(formData))
    // Show toast notification
  }

  const formatCurrency = (value: string) => {
    const number = value.replace(/\D/g, '')
    return new Intl.NumberFormat('id-ID').format(Number(number))
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid={`product-form-page-${mode}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200" data-testid="product-form-header">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2"
              data-testid="back-button"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Button>
          </div>

          <Breadcrumb className="mb-4" data-testid="breadcrumb">
            <BreadcrumbList>
              {breadcrumbItems.map((item) => (
                <BreadcrumbItem key={item.label}>
                  <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          <div data-testid="page-title-section">
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
              {title}
            </h1>
            <p className="text-gray-600 mt-1" data-testid="page-subtitle">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        data-testid="product-form-content"
      >
        {/* Show errors */}
        {(categoriesError || createProductMutation.error || updateProductMutation.error) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 text-red-400">⚠️</div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {categoriesError && 'Kesalahan Memuat Data'}
                  {createProductMutation.error && 'Gagal Membuat Produk'}
                  {updateProductMutation.error && 'Gagal Mengupdate Produk'}
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {categoriesError && (
                    <p>
                      Gagal memuat data kategori. Silakan refresh halaman atau hubungi
                      administrator.
                    </p>
                  )}
                  {createProductMutation.error && (
                    <p>
                      {(() => {
                        // Check if error has structured response (new enhanced format from API client)
                        const errorData = (createProductMutation.error as Error & { cause?: { response?: { error?: { code: string; message?: string; details?: string; validationErrors?: Array<{ field: string; message: string }> } } } })?.cause?.response?.error

                        if (errorData?.code) {
                          switch (errorData.code) {
                            case 'IMAGE_FORMAT_ERROR':
                              return (
                                errorData.details ||
                                'Format gambar tidak didukung. Gunakan JPG, PNG, atau WebP.'
                              )
                            case 'IMAGE_SIZE_ERROR':
                              return (
                                errorData.details ||
                                'Ukuran file terlalu besar. Maksimal 5MB.'
                              )
                            case 'IMAGE_UPLOAD_ERROR':
                              return (
                                errorData.details || 'Gagal mengunggah gambar. Silakan coba lagi.'
                              )
                            case 'CONFLICT':
                              return (
                                errorData.details ||
                                'Kode produk sudah digunakan. Silakan gunakan kode yang berbeda.'
                              )
                            case 'VALIDATION_ERROR':
                              // Handle field-level validation errors
                              if (errorData.validationErrors && Array.isArray(errorData.validationErrors)) {
                                // Update form field errors individually
                                const fieldErrors: Record<string, string> = {}
                                const fieldTouched: Record<string, boolean> = {}

                                errorData.validationErrors.forEach((fieldError: { field: string; message: string }) => {
                                  fieldErrors[fieldError.field] = fieldError.message
                                  fieldTouched[fieldError.field] = true
                                })

                                setErrors(prev => ({ ...prev, ...fieldErrors }))
                                setTouched(prev => ({ ...prev, ...fieldTouched }))

                                return `Ada ${errorData.validationErrors.length} field yang perlu diperbaiki.`
                              }
                              return errorData.details || 'Data tidak valid. Silakan periksa kembali.'
                            default:
                              return errorData.message || createProductMutation.error.message
                          }
                        }

                        // Fallback to old string-based error handling
                        return createProductMutation.error.message.includes('Category') ||
                          createProductMutation.error.message.includes('Kategori')
                          ? 'Kategori produk tidak valid. Silakan pilih kategori yang tersedia.'
                          : createProductMutation.error.message.includes('Kode produk')
                            ? 'Kode produk sudah digunakan. Silakan gunakan kode yang berbeda.'
                            : createProductMutation.error.message.includes('Warna')
                              ? 'Warna produk tidak valid. Silakan pilih warna yang tersedia.'
                              : createProductMutation.error.message.includes('Material')
                                ? 'Material produk tidak valid. Silakan pilih material yang tersedia.'
                                : `${createProductMutation.error.message}. Silakan periksa kembali data yang dimasukkan.`
                      })()}
                    </p>
                  )}
                  {updateProductMutation.error && (
                    <p>
                      {(() => {
                        // Check if error has structured response (new enhanced format from API client)
                        const errorData = (updateProductMutation.error as Error & { cause?: { response?: { error?: { code: string; message?: string; details?: string; validationErrors?: Array<{ field: string; message: string }> } } } })?.cause?.response?.error

                        if (errorData?.code) {
                          switch (errorData.code) {
                            case 'IMAGE_FORMAT_ERROR':
                              return (
                                errorData.details ||
                                'Format gambar tidak didukung. Gunakan JPG, PNG, atau WebP.'
                              )
                            case 'IMAGE_SIZE_ERROR':
                              return (
                                errorData.details ||
                                'Ukuran file terlalu besar. Maksimal 5MB.'
                              )
                            case 'IMAGE_UPLOAD_ERROR':
                              return (
                                errorData.details || 'Gagal mengunggah gambar. Silakan coba lagi.'
                              )
                            case 'CONFLICT':
                              return (
                                errorData.details ||
                                'Kode produk sudah digunakan. Silakan gunakan kode yang berbeda.'
                              )
                            case 'VALIDATION_ERROR':
                              // Handle field-level validation errors
                              if (errorData.validationErrors && Array.isArray(errorData.validationErrors)) {
                                // Update form field errors individually
                                const fieldErrors: Record<string, string> = {}
                                const fieldTouched: Record<string, boolean> = {}

                                errorData.validationErrors.forEach((fieldError: { field: string; message: string }) => {
                                  fieldErrors[fieldError.field] = fieldError.message
                                  fieldTouched[fieldError.field] = true
                                })

                                setErrors(prev => ({ ...prev, ...fieldErrors }))
                                setTouched(prev => ({ ...prev, ...fieldTouched }))

                                return `Ada ${errorData.validationErrors.length} field yang perlu diperbaiki.`
                              }
                              return errorData.details || 'Data tidak valid. Silakan periksa kembali.'
                            default:
                              return errorData.message || updateProductMutation.error.message
                          }
                        }

                        // Fallback to old string-based error handling
                        return updateProductMutation.error.message.includes('tidak ditemukan')
                          ? 'Produk tidak ditemukan. Silakan refresh halaman.'
                          : `${updateProductMutation.error.message}. Silakan periksa kembali data yang dimasukkan.`
                      })()}
                    </p>
                  )}
                </div>
                {(createProductMutation.error || updateProductMutation.error) && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        createProductMutation.reset()
                        updateProductMutation.reset()
                        // Clear image-related field errors when closing error banner
                        setErrors(prev => {
                          const updatedErrors: Record<string, string> = { ...prev }

                          // Clear image and sizes errors
                          delete updatedErrors.image
                          delete updatedErrors.sizes

                          // Clear validation errors from createProductMutation
                          const createErrorData = (createProductMutation.error as Error & { cause?: { response?: { error?: { validationErrors?: Array<{ field: string }> } } } })?.cause?.response?.error
                          if (createErrorData?.validationErrors && Array.isArray(createErrorData.validationErrors)) {
                            createErrorData.validationErrors.forEach((err) => {
                              if (err.field) delete updatedErrors[err.field]
                            })
                          }

                          // Clear validation errors from updateProductMutation
                          const updateErrorData = (updateProductMutation.error as Error & { cause?: { response?: { error?: { validationErrors?: Array<{ field: string }> } } } })?.cause?.response?.error
                          if (updateErrorData?.validationErrors && Array.isArray(updateErrorData.validationErrors)) {
                            updateErrorData.validationErrors.forEach((err) => {
                              if (err.field) delete updatedErrors[err.field]
                            })
                          }

                          return updatedErrors
                        })
                      }}
                      className="text-sm text-red-600 hover:text-red-500 underline"
                    >
                      Tutup pesan ini
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} data-testid="product-form">
          <ProductForm
            formData={formData}
            errors={errors}
            touched={touched}
            onInputChange={handleInputChange}
            onBlur={handleBlur}
            formatCurrency={formatCurrency}
            categories={categories}
            product={product || undefined}
            onHasSizesChange={handleHasSizesChange}
            onAggregatedSizesChange={handleAggregatedSizesChange}
            onSimplifiedSizesChange={handleSimplifiedSizesChange}
            onStrategySizesChange={handleStrategySizesChange}
            onCategoryFormDataChange={handleCategoryFormDataChange}
            categoryFormData={categoryFormData}
          />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-8" data-testid="form-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              data-testid="cancel-button"
            >
              <X className="w-4 h-4 mr-2" />
              Batal
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSaveDraft}
              data-testid="save-draft-button"
            >
              <Save className="w-4 h-4 mr-2" />
              Simpan Draft
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                createProductMutation.isPending ||
                updateProductMutation.isPending ||
                isLoadingCategories
              }
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
              data-testid="submit-button"
            >
              {isSubmitting ||
              createProductMutation.isPending ||
              updateProductMutation.isPending ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  {mode === 'add' ? 'Menyimpan...' : 'Mengupdate...'}
                </>
              ) : isLoadingCategories ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  Memuat kategori...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {mode === 'add' ? 'Simpan Produk' : 'Update Produk'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
