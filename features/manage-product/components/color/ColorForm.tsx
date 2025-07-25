'use client'

import type React from 'react'

import { useState, useEffect } from 'react'
import { Palette, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ColorPreview } from './ColorPreview'
import type { Color, ColorFormData, ColorModalMode } from '../../types/color'
import { cn } from '@/lib/utils'

interface ColorFormProps {
  mode: ColorModalMode
  color?: Color | null
  onSubmit: (data: ColorFormData) => Promise<void>
  onCancel: () => void
  existingColors: Color[]
}

// Simple validation helper functions
const validateColorName = (name: string, existingColors: Color[], editingId?: string): string | null => {
  if (!name.trim()) return 'Nama warna wajib diisi'
  if (name.length < 2) return 'Nama warna minimal 2 karakter'
  if (name.length > 50) return 'Nama warna maksimal 50 karakter'
  
  const exists = existingColors.some(
    (color) => color.name.toLowerCase() === name.toLowerCase() && color.id !== editingId
  )
  if (exists) return 'Nama warna sudah digunakan'
  
  return null
}

const validateHexValue = (hexValue: string, existingColors: Color[], editingId?: string): string | null => {
  if (!hexValue.trim()) return 'Kode warna wajib diisi'
  if (!/^#[0-9A-Fa-f]{6}$/.test(hexValue)) return 'Format warna tidak valid (gunakan #RRGGBB)'
  
  const exists = existingColors.some(
    (color) => color.hexCode.toLowerCase() === hexValue.toLowerCase() && color.id !== editingId
  )
  if (exists) return 'Kode warna sudah digunakan'
  
  return null
}

export function ColorForm({ mode, color, onSubmit, onCancel, existingColors }: ColorFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<ColorFormData>({
    name: color?.name || '',
    hexCode: color?.hexCode || '#FF0000',
  })

  // Simple error state management
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (color && mode === 'edit') {
      setFormData({
        name: color.name,
        hexCode: color.hexCode,
      })
    }
  }, [color, mode])

  // Simple validation function
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    const editingId = mode === 'edit' ? color?.id : undefined

    const nameError = validateColorName(formData.name, existingColors, editingId)
    if (nameError) newErrors.name = nameError

    const hexError = validateHexValue(formData.hexCode, existingColors, editingId)
    if (hexError) newErrors.hexCode = hexError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleBlur = (name: string, value: string) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    
    // Validate single field on blur
    const editingId = mode === 'edit' ? color?.id : undefined
    let error = ''
    
    if (name === 'name') {
      error = validateColorName(value, existingColors, editingId) || ''
    } else if (name === 'hexCode') {
      error = validateHexValue(value, existingColors, editingId) || ''
    }
    
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      setTouched({ name: true, hexCode: true })
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
                value={formData.hexCode}
                onChange={(e) => handleInputChange('hexCode', e.target.value)}
                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <Input
                type="text"
                value={formData.hexCode}
                onChange={(e) => handleInputChange('hexCode', e.target.value.toUpperCase())}
                onBlur={(e) => handleBlur('hexCode', e.target.value)}
                placeholder="#FF0000"
                className={cn(
                  'flex-1 font-mono',
                  errors.hexCode && touched.hexCode && 'border-red-500',
                  !errors.hexCode &&
                    touched.hexCode &&
                    formData.hexCode &&
                    'border-green-500',
                )}
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
            {errors.hexCode && touched.hexCode && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <X className="w-3 h-3" />
                {errors.hexCode}
              </p>
            )}
            <p className="text-xs text-gray-500">Format: #RRGGBB (contoh: #FF0000)</p>
          </div>

          {/* Color Preview */}
          <ColorPreview name={formData.name} hexValue={formData.hexCode} />
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
