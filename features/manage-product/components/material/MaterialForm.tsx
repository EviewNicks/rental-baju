'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, X } from 'lucide-react'
import type {
  Material,
  MaterialFormData,
  MaterialUnit,
} from '@/features/manage-product/types/material'
import { logger } from '@/services/logger'

// Component-specific logger for material form
const formLogger = logger.child('MaterialForm')

// Ultra-simplified material units (aligned with backend schema)
const MATERIAL_UNITS: { value: MaterialUnit; label: string }[] = [
  { value: 'meter', label: 'Meter (m)' },
  { value: 'unit', label: 'Unit' },
]

type MaterialModalMode = 'add' | 'edit'

interface MaterialFormProps {
  mode: MaterialModalMode
  material: Material | null
  onSubmit: (data: MaterialFormData) => Promise<void>
  onCancel: () => void
  existingMaterials: Material[]
}

export function MaterialForm({
  mode,
  material,
  onSubmit,
  onCancel,
  existingMaterials,
}: MaterialFormProps) {
  const [formData, setFormData] = useState<MaterialFormData>({
    name: '',
    pricePerUnit: '',
    unit: 'meter', // Default to meter for fabric focus
  })
  const [errors, setErrors] = useState<Partial<MaterialFormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form data
  useEffect(() => {
    formLogger.debug('formInitialization', 'Initializing material form', {
      mode,
      materialId: material?.id,
      materialName: material?.name,
      existingMaterialsCount: existingMaterials.length,
    })

    if (mode === 'edit' && material) {
      const initialData = {
        name: material.name,
        pricePerUnit: material.pricePerUnit.toString(),
        unit: material.unit,
      }
      setFormData(initialData)

      formLogger.info('formInitialization', 'Form initialized for editing', {
        materialId: material.id,
        materialName: material.name,
        initialData,
      })
    } else {
      const defaultData = {
        name: '',
        pricePerUnit: '',
        unit: 'meter',
      }
      setFormData(defaultData)

      formLogger.info('formInitialization', 'Form initialized for adding new material', {
        defaultUnit: 'meter',
      })
    }
    setErrors({})
  }, [mode, material, existingMaterials.length])

  // Validation function
  const validateForm = (): boolean => {
    const timer = logger.startTimer('MaterialForm', 'validateForm', 'form_validation')
    const newErrors: Partial<MaterialFormData> = {}

    formLogger.debug('validateForm', 'Starting form validation', {
      formData: {
        name: formData.name,
        pricePerUnit: formData.pricePerUnit,
        unit: formData.unit,
      },
      mode,
    })

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Nama material wajib diisi'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nama material minimal 2 karakter'
    } else {
      // Check for duplicate names (excluding current material in edit mode)
      const isDuplicate = existingMaterials.some(
        (m) =>
          m.name.toLowerCase() === formData.name.trim().toLowerCase() &&
          (mode === 'add' || m.id !== material?.id),
      )
      if (isDuplicate) {
        newErrors.name = 'Nama material sudah digunakan'
        formLogger.warn('validateForm', 'Duplicate material name detected', {
          attemptedName: formData.name.trim(),
          mode,
          currentMaterialId: material?.id,
        })
      }
    }

    // Price validation
    const price =
      typeof formData.pricePerUnit === 'string'
        ? parseFloat(formData.pricePerUnit)
        : formData.pricePerUnit

    if (!formData.pricePerUnit || formData.pricePerUnit === '') {
      newErrors.pricePerUnit = 'Harga per unit wajib diisi'
    } else if (isNaN(price) || price <= 0) {
      newErrors.pricePerUnit = 'Harga per unit harus berupa angka positif'
      formLogger.warn('validateForm', 'Invalid price value detected', {
        priceInput: formData.pricePerUnit,
        parsedPrice: price,
        isNaN: isNaN(price),
        isNegativeOrZero: price <= 0,
      })
    }

    // Unit validation
    if (!formData.unit) {
      newErrors.unit = 'Satuan material wajib dipilih'
    }

    const duration = timer.end()
    const isValid = Object.keys(newErrors).length === 0

    formLogger.info('validateForm', 'Form validation completed', {
      isValid,
      errorCount: Object.keys(newErrors).length,
      errors: Object.keys(newErrors),
      duration: `${duration}ms`,
    })

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const timer = logger.startTimer('MaterialForm', 'handleSubmit', 'form_submit')

    formLogger.info('handleSubmit', 'User initiated form submission', {
      mode,
      materialId: material?.id,
      materialName: formData.name.trim(),
    })

    if (!validateForm()) {
      timer.end('Form submission cancelled due to validation errors')
      formLogger.warn('handleSubmit', 'Form submission prevented by validation errors', {
        mode,
        formData: {
          name: formData.name,
          pricePerUnit: formData.pricePerUnit,
          unit: formData.unit,
        },
      })
      return
    }

    setIsSubmitting(true)
    try {
      const submitData = {
        name: formData.name.trim(),
        pricePerUnit:
          typeof formData.pricePerUnit === 'string'
            ? parseCurrency(formData.pricePerUnit)
            : formData.pricePerUnit,
        unit: formData.unit,
      }

      formLogger.debug('handleSubmit', 'Calling parent onSubmit function', {
        submitData,
        mode,
      })

      await onSubmit(submitData)
      const duration = timer.end('Form submission completed successfully')

      formLogger.info('handleSubmit', 'Form submitted successfully', {
        mode,
        materialName: submitData.name,
        duration: `${duration}ms`,
        operation: mode,
      })
    } catch (error) {
      timer.end('Form submission failed')
      formLogger.error('handleSubmit', 'Form submission failed', {
        mode,
        materialName: formData.name.trim(),
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
              }
            : error,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (value: string) => {
    // Keep it simple: only allow integers with thousand separators
    const originalValue = value
    
    // Remove all non-numeric characters (no decimals allowed)
    const numericValue = value.replace(/[^\d]/g, '')
    
    // Handle empty input
    if (!numericValue) return ''
    
    // Add thousand separators using dots (simple Indonesian format)
    const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

    if (originalValue !== formattedValue) {
      formLogger.debug('formatCurrency', 'Currency input formatted (simple)', {
        originalValue,
        formattedValue,
        removedChars: originalValue.length - numericValue.length,
        hasThousandSeparators: formattedValue.includes('.')
      })
    }

    return formattedValue
  }

  // Convert formatted currency back to number for submission (simple)
  const parseCurrency = (formattedValue: string): number => {
    // Simple: just remove thousand separators (dots) and convert to integer
    if (!formattedValue) return 0
    
    // Remove all dots and convert to number
    const numericValue = formattedValue.replace(/\./g, '')
    return parseInt(numericValue, 10) || 0
  }

  // Log significant form field changes for UX analysis
  const handleNameChange = (value: string) => {
    setFormData({ ...formData, name: value })

    if (value.length > 0 && value.length % 5 === 0) {
      formLogger.debug('handleNameChange', 'Material name input progress', {
        currentLength: value.length,
        mode,
        hasContent: value.trim().length > 0,
      })
    }
  }

  const handleUnitChange = (value: string) => {
    formLogger.info('handleUnitChange', 'User changed material unit', {
      previousUnit: formData.unit,
      newUnit: value,
      mode,
    })
    setFormData({ ...formData, unit: value })
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </Button>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === 'add' ? 'Tambah Material Baru' : 'Edit Material'}
          </h3>
          <p className="text-sm text-gray-600">
            {mode === 'add'
              ? 'Lengkapi informasi material yang ingin ditambahkan'
              : 'Perbarui informasi material'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Material Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Nama Material *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Contoh: Kain Katun Premium"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Unit */}
          <div className="space-y-2">
            <Label htmlFor="unit" className="text-sm font-medium text-gray-700">
              Satuan *
            </Label>
            <Select value={formData.unit} onValueChange={handleUnitChange}>
              <SelectTrigger className={errors.unit ? 'border-red-500' : ''}>
                <SelectValue placeholder="Pilih satuan material" />
              </SelectTrigger>
              <SelectContent>
                {MATERIAL_UNITS.map((unit) => (
                  <SelectItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.unit && <p className="text-sm text-red-600">{errors.unit}</p>}
          </div>

          {/* Price Per Unit */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="pricePerUnit" className="text-sm font-medium text-gray-700">
              Harga per Unit (Rp) *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                Rp
              </span>
              <Input
                id="pricePerUnit"
                type="text"
                value={formData.pricePerUnit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pricePerUnit: formatCurrency(e.target.value),
                  })
                }
                placeholder="0"
                className={`pl-10 ${errors.pricePerUnit ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.pricePerUnit && <p className="text-sm text-red-600">{errors.pricePerUnit}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Batal</span>
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-yellow-400 hover:bg-yellow-500 text-black flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Menyimpan...'
                : mode === 'add'
                  ? 'Tambah Material'
                  : 'Simpan Perubahan'}
            </span>
          </Button>
        </div>
      </form>
    </div>
  )
}
