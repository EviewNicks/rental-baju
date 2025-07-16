'use client'

import type React from 'react'

import { useState, useEffect } from 'react'
import { Tag, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ColorPicker } from './ColorPicker'
import { CategoryBadgePreview } from './CategoryBadgePreview'
import { useFormValidation } from '@/features/manage-product/hooks/useFormValidation'
import type { Category, CategoryFormData, CategoryModalMode } from '@/features/manage-product/types'
import { cn } from '@/lib/utils'

interface CategoryFormProps {
  mode: CategoryModalMode
  category?: Category | null
  onSubmit: (data: CategoryFormData) => Promise<void>
  onCancel: () => void
  existingCategories: Category[]
}

const validationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s-]+$/,
    custom: (value: string, existingCategories: Category[], editingId?: string) => {
      if (value) {
        const exists = existingCategories.some(
          (cat) => cat.name.toLowerCase() === value.toLowerCase() && cat.id !== editingId,
        )
        if (exists) {
          return 'Nama kategori sudah digunakan'
        }
      }
      return null
    },
  },
  color: {
    required: true,
    pattern: /^#[0-9A-Fa-f]{6}$/,
    custom: (value: string) => {
      if (value && !/^#[0-9A-Fa-f]{6}$/.test(value)) {
        return 'Format warna tidak valid (gunakan #RRGGBB)'
      }
      return null
    },
  },
}

export function CategoryForm({
  mode,
  category,
  onSubmit,
  onCancel,
  existingCategories,
}: CategoryFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: category?.name || '',
    color: category?.color || '#FFD700',
  })

  const { errors, touched, validate, validateSingleField } = useFormValidation({
    ...validationRules,
    name: {
      ...validationRules.name,
      custom: (value: string) =>
        validationRules.name.custom(
          value,
          existingCategories,
          mode === 'edit' ? category?.id : undefined,
        ),
    },
  })

  useEffect(() => {
    if (category && mode === 'edit') {
      setFormData({
        name: category.name,
        color: category.color,
      })
    }
  }, [category, mode])

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (touched[name]) {
      validateSingleField(name, value)
    }
  }

  const handleBlur = (name: string, value: string) => {
    validateSingleField(name, value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate(formData)) {
      return
    }

    setIsLoading(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Error submitting category:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const isEdit = mode === 'edit'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {isEdit ? 'Edit Kategori' : 'Tambah Kategori Baru'}
        </h3>

        <div className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Nama Kategori
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              onBlur={(e) => handleBlur('name', e.target.value)}
              placeholder="Masukkan nama kategori"
              maxLength={50}
              className={cn(
                errors.name && touched.name && 'border-red-500',
                !errors.name && touched.name && formData.name && 'border-green-500',
              )}
            />
            {errors.name && touched.name && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <X className="w-3 h-3" />
                {errors.name}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Masukkan nama kategori yang jelas dan deskriptif ({formData.name.length}/50)
            </p>
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Warna Badge
              <span className="text-red-500">*</span>
            </Label>
            <ColorPicker
              value={formData.color}
              onChange={(color) => handleInputChange('color', color)}
            />
            {errors.color && touched.color && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <X className="w-3 h-3" />
                {errors.color}
              </p>
            )}
          </div>

          {/* Badge Preview */}
          <CategoryBadgePreview name={formData.name} color={formData.color} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Batal
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-yellow-400 hover:bg-yellow-500 text-black flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
              {isEdit ? 'Mengupdate...' : 'Menyimpan...'}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isEdit ? 'Update Kategori' : 'Simpan Kategori'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
