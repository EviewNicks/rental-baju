'use client'

import { useState } from 'react'
import { X, Plus, Package } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { FormField } from '@/features/manage-product/components/form-product/FormField'
import type { AggregatedSizeView, SizeEnum, AgeCategory } from '@/features/manage-product/types'

interface SizeCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onSizeCreate: (newSize: AggregatedSizeView) => void
  existingSizes: AggregatedSizeView[]
}

interface SizeFormData {
  size: SizeEnum | ''
  ageCategories: {
    adult: { enabled: boolean; quantity: number }
    child: { enabled: boolean; quantity: number }
    universal: { enabled: boolean; quantity: number }
  }
}

const sizeOptions = [
  { value: 'XS', label: 'XS (Extra Small)' },
  { value: 'S', label: 'S (Small)' },
  { value: 'M', label: 'M (Medium)' },
  { value: 'L', label: 'L (Large)' },
  { value: 'XL', label: 'XL (Extra Large)' },
  { value: 'XXL', label: 'XXL (Double Extra Large)' },
]

const ageCategoryLabels = {
  adult: 'Dewasa (Adult)',
  child: 'Anak (Child)',
  universal: 'Universal',
}

export function SizeCreationModal({
  isOpen,
  onClose,
  onSizeCreate,
  existingSizes
}: SizeCreationModalProps) {
  const [formData, setFormData] = useState<SizeFormData>({
    size: '',
    ageCategories: {
      adult: { enabled: false, quantity: 1 },
      child: { enabled: false, quantity: 1 },
      universal: { enabled: false, quantity: 1 },
    },
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Reset form when modal opens/closes
  const resetForm = () => {
    setFormData({
      size: '',
      ageCategories: {
        adult: { enabled: false, quantity: 1 },
        child: { enabled: false, quantity: 1 },
        universal: { enabled: false, quantity: 1 },
      },
    })
    setErrors({})
  }

  // Handle size selection
  const handleSizeChange = (size: string) => {
    setFormData(prev => ({ ...prev, size: size as SizeEnum }))
    if (errors.size) {
      setErrors(prev => ({ ...prev, size: '' }))
    }
  }

  // Handle age category enable/disable
  const handleAgeCategoryToggle = (category: keyof typeof formData.ageCategories) => {
    setFormData(prev => ({
      ...prev,
      ageCategories: {
        ...prev.ageCategories,
        [category]: {
          ...prev.ageCategories[category],
          enabled: !prev.ageCategories[category].enabled,
        },
      },
    }))
    if (errors.ageCategories) {
      setErrors(prev => ({ ...prev, ageCategories: '' }))
    }
  }

  // Handle quantity change for age category
  const handleQuantityChange = (category: keyof typeof formData.ageCategories, quantity: number) => {
    setFormData(prev => ({
      ...prev,
      ageCategories: {
        ...prev.ageCategories,
        [category]: {
          ...prev.ageCategories[category],
          quantity: Math.max(1, quantity),
        },
      },
    }))
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    // Check if size is selected
    if (!formData.size) {
      newErrors.size = 'Pilih ukuran produk'
    }

    // Check if size already exists
    if (formData.size && existingSizes.some(size => size.size === formData.size)) {
      newErrors.size = 'Ukuran ini sudah ada'
    }

    // Check if at least one age category is enabled
    const enabledCategories = Object.values(formData.ageCategories).filter(cat => cat.enabled)
    if (enabledCategories.length === 0) {
      newErrors.ageCategories = 'Pilih setidaknya satu kategori usia'
    }

    // Check if all enabled categories have valid quantities
    Object.entries(formData.ageCategories).forEach(([key, category]) => {
      if (category.enabled && category.quantity <= 0) {
        newErrors[`quantity_${key}`] = 'Kuantitas harus lebih dari 0'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Build breakdown object
    const breakdown: { adult?: number; child?: number; universal?: number } = {}
    let totalQuantity = 0

    Object.entries(formData.ageCategories).forEach(([key, category]) => {
      if (category.enabled) {
        breakdown[key as keyof typeof breakdown] = category.quantity
        totalQuantity += category.quantity
      }
    })

    // Create new size entry
    const newSize: AggregatedSizeView = {
      size: formData.size as SizeEnum,
      totalQuantity,
      breakdown,
      hasMultipleCategories: Object.keys(breakdown).length > 1,
    }

    onSizeCreate(newSize)
    resetForm()
    onClose()
  }

  // Handle cancel
  const handleCancel = () => {
    resetForm()
    onClose()
  }

  // Calculate total quantity
  const totalQuantity = Object.values(formData.ageCategories)
    .filter(cat => cat.enabled)
    .reduce((sum, cat) => sum + cat.quantity, 0)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Tambah Ukuran Baru
              </h2>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Size Selection */}
            <FormField
              type="select"
              name="size"
              label="Ukuran Produk"
              value={formData.size}
              onChange={handleSizeChange}
              options={sizeOptions}
              placeholder="Pilih ukuran"
              error={errors.size}
              required
              helpText="Pilih ukuran untuk produk ini"
            />

            {/* Age Categories Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Kategori Usia & Kuantitas
                </h3>
                {errors.ageCategories && (
                  <p className="text-sm text-red-600 mb-3">{errors.ageCategories}</p>
                )}
              </div>

              {Object.entries(formData.ageCategories).map(([key, category]) => (
                <div
                  key={key}
                  className={`border rounded-lg p-4 transition-colors ${
                    category.enabled ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  {/* Category Toggle */}
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={category.enabled}
                        onChange={() => handleAgeCategoryToggle(key as keyof typeof formData.ageCategories)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 border-2 rounded mr-3 flex items-center justify-center ${
                        category.enabled ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                      }`}>
                        {category.enabled && <div className="w-2 h-2 bg-white rounded-sm" />}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {ageCategoryLabels[key as keyof typeof ageCategoryLabels]}
                      </span>
                    </label>
                  </div>

                  {/* Quantity Input */}
                  {category.enabled && (
                    <div className="space-y-2">
                      <FormField
                        type="number"
                        name={`quantity_${key}`}
                        label="Kuantitas"
                        value={category.quantity}
                        onChange={(value) => handleQuantityChange(
                          key as keyof typeof formData.ageCategories,
                          typeof value === 'number' ? value : 1
                        )}
                        onBlur={(value) => handleQuantityChange(
                          key as keyof typeof formData.ageCategories,
                          typeof value === 'number' ? value : 1
                        )}
                        min={1}
                        max={999}
                        error={errors[`quantity_${key}`]}
                        required
                        helpText={`Jumlah stok untuk kategori ${ageCategoryLabels[key as keyof typeof ageCategoryLabels].toLowerCase()}`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Total Summary */}
            {totalQuantity > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Total Kuantitas: {totalQuantity} unit
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e)}
                disabled={totalQuantity === 0}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Tambah Ukuran
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}