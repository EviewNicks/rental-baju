'use client'

import type React from 'react'

import { useState, useEffect } from 'react'
import { Palette, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ColorPreview } from './ColorPreview'
import { useFormValidation } from '../../hooks/useFormValidation'
import type { Color, ColorFormData, ColorModalMode } from '../../types/color'
import { cn } from '@/lib/utils'

interface ColorFormProps {
  mode: ColorModalMode
  color?: Color | null
  onSubmit: (data: ColorFormData) => Promise<void>
  onCancel: () => void
  existingColors: Color[]
}

const validationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    custom: (value: string, existingColors: Color[], editingId?: string) => {
      if (value) {
        const exists = existingColors.some(
          (color) => color.name.toLowerCase() === value.toLowerCase() && color.id !== editingId,
        )
        if (exists) {
          return 'Nama warna sudah digunakan'
        }
      }
      return null
    },
  },
  hex_value: {
    required: true,
    pattern: /^#[0-9A-Fa-f]{6}$/,
    custom: (value: string, existingColors: Color[], editingId?: string) => {
      if (value) {
        if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
          return 'Format warna tidak valid (gunakan #RRGGBB)'
        }
        const exists = existingColors.some(
          (color) =>
            color.hex_value.toLowerCase() === value.toLowerCase() && color.id !== editingId,
        )
        if (exists) {
          return 'Kode warna sudah digunakan'
        }
      }
      return null
    },
  },
  description: {
    maxLength: 200,
  },
}

export function ColorForm({ mode, color, onSubmit, onCancel, existingColors }: ColorFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<ColorFormData>({
    name: color?.name || '',
    hex_value: color?.hex_value || '#FF0000',
  })

  const { errors, touched, validate, validateSingleField } = useFormValidation({
    ...validationRules,
    name: {
      ...validationRules.name,
      custom: (value: string) =>
        validationRules.name.custom(value, existingColors, mode === 'edit' ? color?.id : undefined),
    },
    hex_value: {
      ...validationRules.hex_value,
      custom: (value: string) =>
        validationRules.hex_value.custom(
          value,
          existingColors,
          mode === 'edit' ? color?.id : undefined,
        ),
    },
  })

  useEffect(() => {
    if (color && mode === 'edit') {
      setFormData({
        name: color.name,
        hex_value: color.hex_value,
      })
    }
  }, [color, mode])

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
      console.error('Error submitting color:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const isEdit = mode === 'edit'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {isEdit ? 'Edit Warna' : 'Tambah Warna Baru'}
        </h3>

        <div className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Nama Warna
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              onBlur={(e) => handleBlur('name', e.target.value)}
              placeholder="Masukkan nama warna"
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
              Masukkan nama warna yang deskriptif ({formData.name.length}/50)
            </p>
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Kode Warna
              <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center space-x-3">
              <input
                aria-label="input"
                type="color"
                value={formData.hex_value}
                onChange={(e) => handleInputChange('hex_value', e.target.value)}
                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <Input
                type="text"
                value={formData.hex_value}
                onChange={(e) => handleInputChange('hex_value', e.target.value.toUpperCase())}
                onBlur={(e) => handleBlur('hex_value', e.target.value)}
                placeholder="#FF0000"
                className={cn(
                  'flex-1 font-mono',
                  errors.hex_value && touched.hex_value && 'border-red-500',
                  !errors.hex_value &&
                    touched.hex_value &&
                    formData.hex_value &&
                    'border-green-500',
                )}
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
            {errors.hex_value && touched.hex_value && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <X className="w-3 h-3" />
                {errors.hex_value}
              </p>
            )}
            <p className="text-xs text-gray-500">Format: #RRGGBB (contoh: #FF0000)</p>
          </div>

          {/* Color Preview */}
          <ColorPreview name={formData.name} hexValue={formData.hex_value} />
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
              {isEdit ? 'Update Warna' : 'Simpan Warna'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
