'use client'

import type React from 'react'
import { useState } from 'react'
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
import type { ClientProduct, AggregatedSizeView } from '@/features/manage-product/types'

// Local form data interface with numbers for form handling
interface ProductFormData {
  code: string
  name: string
  categoryId: string
  colorId?: string | undefined
  materialId?: string | undefined
  materialQuantity?: number | undefined
  quantity: number
  modalAwal: number
  currentPrice: number
  description: string
  imageUrl: string | null
  image?: File | null

  // Advanced-only Size Management (required for all products)
  hasSizes: boolean // Always true in advanced-only architecture
  aggregatedSizes?: AggregatedSizeView[]
}

// Utility function to transform aggregated sizes to backend format
const transformSizesToBackendFormat = (aggregatedSizes: AggregatedSizeView[]): string => {
  const sizes = aggregatedSizes.flatMap(aggSize =>
    Object.entries(aggSize.breakdown).map(([ageCategory, quantity]) => ({
      ageCategory: ageCategory.toUpperCase() as "ADULT" | "CHILD" | "UNIVERSAL",
      size: aggSize.size,
      quantity: quantity,
      isActive: true
    }))
  );
  return JSON.stringify(sizes);
};

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
  colorId?: string
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
  colorId?: string
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
  if (!/^[A-Z0-9]{4}$/.test(code)) return 'Kode harus 4 digit alfanumerik uppercase'
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

const validateNumber = (value: number, field: string, min: number = 0, max?: number): string | null => {
  if (value === undefined || value === null) return `${field} wajib diisi`
  if (value < min) return `${field} minimal ${min}`
  if (max && value > max) return `${field} maksimal ${max}`
  return null
}

const validateDescription = (description: string): string | null => {
  if (description.length > 500) return 'Deskripsi maksimal 500 karakter'
  return null
}

const validateSizes = (aggregatedSizes?: AggregatedSizeView[]): string | null => {
  if (!aggregatedSizes || aggregatedSizes.length === 0) {
    return 'Produk harus memiliki setidaknya satu ukuran (Advanced-only architecture)'
  }

  // Validate each size entry
  for (const sizeEntry of aggregatedSizes) {
    if (!sizeEntry.size || !['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(sizeEntry.size)) {
      return `Ukuran tidak valid: ${sizeEntry.size}. Harus salah satu dari: XS, S, M, L, XL, XXL`
    }

    if (!sizeEntry.breakdown || Object.keys(sizeEntry.breakdown).length === 0) {
      return `Breakdown kategori usia diperlukan untuk ukuran ${sizeEntry.size}`
    }

    // Validate age categories
    for (const ageCategory of Object.keys(sizeEntry.breakdown)) {
      if (!['adult', 'child', 'universal'].includes(ageCategory.toLowerCase())) {
        return `Kategori usia tidak valid: ${ageCategory}. Harus salah satu dari: ADULT, CHILD, UNIVERSAL`
      }

      const quantity = sizeEntry.breakdown[ageCategory]
      if (quantity <= 0) {
        return `Kuantitas harus lebih dari 0 untuk ${sizeEntry.size} - ${ageCategory}`
      }
    }
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
    colorId: product?.colorId || undefined,
    materialId: product?.materialId || undefined,
    materialQuantity: product?.materialQuantity || undefined,
    quantity: product?.quantity || 1,
    modalAwal: product?.modalAwal ? Number(product.modalAwal) : 0,
    currentPrice: product?.currentPrice ? Number(product.currentPrice) : 0,
    description: product?.description || '',
    imageUrl: product?.imageUrl || null,
    image: null,

    // Advanced-only Size Management (enforced - all products require sizes)
    hasSizes: true, // Always true in advanced-only architecture
    aggregatedSizes: undefined, // Will be loaded via useAggregatedSizes if needed
  })

  // Simple error state management
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

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

    // Validate sizes array (required for advanced-only architecture)
    const sizesError = validateSizes(formData.aggregatedSizes)
    if (sizesError) newErrors.sizes = sizesError

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
      case 'size':
        // Size is optional, no validation needed
        error = ''
        break
      case 'colorId':
        // ColorId is optional, no validation needed
        error = ''
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
    
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const handleInputChange = (name: string, value: string | number | File | null) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleBlur = (name: string, value: string | number | File | null) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    validateSingleField(name, value)
  }

  // Size management handlers
  const handleHasSizesChange = (hasSizes: boolean) => {
    // In advanced-only architecture, sizes are always required
    // This function is kept for backward compatibility but enforces hasSizes = true
    setFormData(prev => ({
      ...prev,
      hasSizes: true, // Always enforce sizes requirement
      aggregatedSizes: prev.aggregatedSizes // Keep existing sizes
    }))
  }

  const handleAggregatedSizesChange = (sizes: AggregatedSizeView[]) => {
    setFormData(prev => ({
      ...prev,
      aggregatedSizes: sizes,
      // Auto-calculate total quantity from sizes
      quantity: sizes.reduce((sum, size) => sum + size.totalQuantity, 0)
    }))

    // Clear any existing sizes validation error
    if (errors.sizes) {
      setErrors(prev => ({ ...prev, sizes: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      setTouched({
        code: true,
        name: true,
        categoryId: true,
        sizes: true, // Replace legacy size with sizes validation
        colorId: true,
        materialId: true,
        materialQuantity: true,
        modalAwal: true,
        currentPrice: true,
        quantity: true,
        description: true
      })
      return
    }

    try {
      // Transform aggregated sizes to backend format
      const sizesData = transformSizesToBackendFormat(formData.aggregatedSizes || []);

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
          colorId: formData.colorId || undefined,
          materialId: formData.materialId || undefined,
          materialQuantity: formData.materialQuantity || undefined,
          image: formData.image || undefined,
          imageUrl: formData.imageUrl || undefined,
        }

        await createProductMutation.mutateAsync(createData as unknown as FormData | Record<string, string | number | boolean | File | null>)
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
          colorId: formData.colorId || undefined,
          materialId: formData.materialId || undefined,
          materialQuantity: formData.materialQuantity || undefined,
          image: formData.image || undefined,
          imageUrl: formData.imageUrl || undefined,
        }

        await updateProductMutation.mutateAsync({ id: product.id, data: updateData as unknown as FormData | Record<string, string | number | boolean | File | null> })
      }

      // Success - redirect to product list
      router.push('/producer/manage-product')
    } catch (error) {
      console.error(`Error ${mode === 'add' ? 'creating' : 'updating'} product:`, error)
      // Error handling is already done in the mutations
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
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">{title}</h1>
            <p className="text-gray-600 mt-1" data-testid="page-subtitle">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="product-form-content">
        {/* Show errors */}
        {(categoriesError || createProductMutation.error || updateProductMutation.error) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">
              {categoriesError && 'Gagal memuat data kategori. Silakan refresh halaman.'}
              {createProductMutation.error && `Error creating product: ${createProductMutation.error.message}`}
              {updateProductMutation.error && `Error updating product: ${updateProductMutation.error.message}`}
            </p>
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
            product={product}
            onHasSizesChange={handleHasSizesChange}
            onAggregatedSizesChange={handleAggregatedSizesChange}
          />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-8" data-testid="form-actions">
            <Button type="button" variant="outline" onClick={() => router.back()} data-testid="cancel-button">
              <X className="w-4 h-4 mr-2" />
              Batal
            </Button>
            <Button type="button" variant="secondary" onClick={handleSaveDraft} data-testid="save-draft-button">
              <Save className="w-4 h-4 mr-2" />
              Simpan Draft
            </Button>
            <Button
              type="submit"
              disabled={
                createProductMutation.isPending || 
                updateProductMutation.isPending || 
                isLoadingCategories
              }
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
              data-testid="submit-button"
            >
              {createProductMutation.isPending || updateProductMutation.isPending ? (
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
