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
import type { Product, Category, ProductFormData } from '@/features/manage-product/types'
// Jika ingin menggunakan mock data saat development, import mock-categories
// import { mockCategories } from '@/features/manage-product/data/mock-categories'

interface ProductFormPageProps {
  mode: 'add' | 'edit'
  product?: Product | null
  breadcrumbItems: Array<{ label: string; href?: string; current?: boolean }>
  title: string
  subtitle: string
  categories: Category[]
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
  categories,
}: ProductFormPageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState<ProductFormData>({
    code: product?.code || '',
    name: product?.name || '',
    categoryId: product?.categoryId || '',
    quantity: product?.quantity || 1,
    modalAwal: product?.modalAwal || 0,
    hargaSewa: product?.hargaSewa || 0,
    description: product?.description || '',
    imageUrl: product?.imageUrl || null,
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

    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Success - redirect to product list
      router.push('/producer/manage-product')
    } catch (error) {
      console.error(`Error ${mode === 'add' ? 'saving' : 'updating'} product:`, error)
    } finally {
      setIsLoading(false)
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Button>
          </div>

          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              {breadcrumbItems.map((item) => (
                <BreadcrumbItem key={item.label}>
                  <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-600 mt-1">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <ProductForm
            formData={formData}
            errors={errors}
            touched={touched}
            onInputChange={handleInputChange}
            onBlur={handleBlur}
            formatCurrency={formatCurrency}
            categories={categories ?? []} // Defensive: fallback ke array kosong
          />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-8">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              <X className="w-4 h-4 mr-2" />
              Batal
            </Button>
            <Button type="button" variant="secondary" onClick={handleSaveDraft}>
              <Save className="w-4 h-4 mr-2" />
              Simpan Draft
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  {mode === 'add' ? 'Menyimpan...' : 'Mengupdate...'}
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
