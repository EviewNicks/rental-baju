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
import { useFormValidation } from '@/features/manage-product/hooks/useFormValidation'
import { useCategories } from '@/features/manage-product/hooks/useCategories'
import { useProductManagement } from '@/features/manage-product/hooks/useProductManagement'
import type { ClientProduct } from '@/features/manage-product/types'
import type { CreateProductRequest, UpdateProductRequest } from '@/features/manage-product/adapters/types/requests'

// Local form data interface with numbers for form handling
interface ProductFormData {
  code: string
  name: string
  categoryId: string
  quantity: number
  modalAwal: number
  hargaSewa: number
  description: string
  imageUrl: string | null
  image?: File | null
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

const validationRules = {
  code: {
    required: true,
    pattern: /^[A-Z0-9]{4}$/,
    custom: (value: string) => {
      if (value && !/^[A-Z0-9]{4}$/.test(value)) {
        return 'Kode harus 4 digit alfanumerik uppercase'
      }
      return null
    },
  },
  name: {
    required: true,
    minLength: 3,
    maxLength: 100,
  },
  categoryId: {
    required: true,
    custom: (value: string) => {
      if (!value || value.trim() === '') {
        return 'Kategori wajib dipilih'
      }
      return null
    },
  },
  modalAwal: {
    required: true,
    min: 0,
  },
  hargaSewa: {
    required: true,
    min: 0,
  },
  quantity: {
    required: true,
    min: 0,
    max: 9999,
  },
  description: {
    maxLength: 500,
  },
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
  } = useCategories()

  // Product management hooks for CRUD operations
  const {
    handleCreateProduct,
    handleUpdateProduct,
    mutations,
  } = useProductManagement()

  const categories = categoriesData?.categories ?? []

  const [formData, setFormData] = useState<ProductFormData>({
    code: product?.code || '',
    name: product?.name || '',
    categoryId: product?.categoryId || '',
    quantity: product?.quantity || 1,
    modalAwal: product?.modalAwal ? Number(product.modalAwal) : 0,
    hargaSewa: product?.hargaSewa ? Number(product.hargaSewa) : 0,
    description: product?.description || '',
    imageUrl: product?.imageUrl || null,
    image: null,
  })

  const { errors, touched, validate, validateSingleField } = useFormValidation(validationRules)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleInputChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (touched[name]) {
      validateSingleField(name, value)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleBlur = (name: string, value: any) => {
    validateSingleField(name, value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate(formData)) {
      return
    }

    try {
      if (mode === 'add') {
        // Create new product
        const createData: CreateProductRequest = {
          code: formData.code,
          name: formData.name,
          description: formData.description,
          modalAwal: formData.modalAwal,
          hargaSewa: formData.hargaSewa,
          quantity: formData.quantity,
          categoryId: formData.categoryId,
          image: formData.image || undefined,
          imageUrl: formData.imageUrl || undefined,
        }

        await handleCreateProduct(createData)
      } else {
        // Update existing product
        if (!product?.id) {
          throw new Error('Product ID is required for update')
        }

        const updateData: UpdateProductRequest = {
          name: formData.name,
          description: formData.description,
          modalAwal: formData.modalAwal,
          hargaSewa: formData.hargaSewa,
          quantity: formData.quantity,
          categoryId: formData.categoryId,
          image: formData.image || undefined,
          imageUrl: formData.imageUrl || undefined,
        }

        await handleUpdateProduct(product.id, updateData)
      }

      // Success - redirect to product list
      router.push('/producer/manage-product')
    } catch (error) {
      console.error(`Error ${mode === 'add' ? 'creating' : 'updating'} product:`, error)
      // Error handling is already done in the hooks (showError)
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
        {(categoriesError || mutations.create.error || mutations.update.error) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">
              {categoriesError && 'Gagal memuat data kategori. Silakan refresh halaman.'}
              {mutations.create.error && `Error creating product: ${mutations.create.error.message}`}
              {mutations.update.error && `Error updating product: ${mutations.update.error.message}`}
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
                mutations.create.isPending || 
                mutations.update.isPending || 
                isLoadingCategories
              }
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
              data-testid="submit-button"
            >
              {mutations.create.isPending || mutations.update.isPending ? (
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
