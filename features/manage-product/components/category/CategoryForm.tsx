'use client'

import type React from 'react'

import { useState, useEffect } from 'react'
import { Tag, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ColorPicker } from './ColorPicker'
import { CategoryBadgePreview } from './CategoryBadgePreview'
import type { ClientCategory, CategoryFormData, CategoryModalMode } from '@/features/manage-product/types'
import { cn } from '@/lib/utils'

interface CategoryFormProps {
  mode: CategoryModalMode
  category?: ClientCategory | null
  onSubmit: (data: CategoryFormData) => Promise<void>
  onCancel: () => void
  existingCategories: ClientCategory[]
}

// Simple validation helper functions
const validateCategoryName = (name: string, existingCategories: ClientCategory[], editingId?: string): string | null => {
  if (!name.trim()) return 'Nama kategori wajib diisi'
  if (name.length < 2) return 'Nama kategori minimal 2 karakter'
  if (name.length > 50) return 'Nama kategori maksimal 50 karakter'
  if (!/^[a-zA-Z0-9\s-]+$/.test(name)) return 'Nama kategori hanya boleh mengandung huruf, angka, spasi, dan tanda hubung'
  
  const exists = existingCategories.some(
    (cat) => cat.name.toLowerCase() === name.toLowerCase() && cat.id !== editingId
  )
  if (exists) return 'Nama kategori sudah digunakan'
  
  return null
}

const validateCategoryColor = (color: string): string | null => {
  if (!color.trim()) return 'Warna kategori wajib dipilih'
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) return 'Format warna tidak valid (gunakan #RRGGBB)'
  return null
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

  // Simple error state management
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Simple validation function
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    const editingId = mode === 'edit' ? category?.id : undefined

    const nameError = validateCategoryName(formData.name, existingCategories, editingId)
    if (nameError) newErrors.name = nameError

    const colorError = validateCategoryColor(formData.color)
    if (colorError) newErrors.color = colorError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateSingleField = (name: string, value: string): void => {
    const editingId = mode === 'edit' ? category?.id : undefined
    let error = ''
    
    if (name === 'name') {
      error = validateCategoryName(value, existingCategories, editingId) || ''
    } else if (name === 'color') {
      error = validateCategoryColor(value) || ''
    }
    
    setErrors(prev => ({ ...prev, [name]: error }))
  }

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
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleBlur = (name: string, value: string) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    validateSingleField(name, value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      setTouched({ name: true, color: true })
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
