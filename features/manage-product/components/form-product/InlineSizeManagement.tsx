'use client'

import React, { useState } from 'react'
import { Plus, Trash2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import type { SimplifiedSizeEntry, SizeEnum, AgeCategory } from '@/features/manage-product/types'

// Available clothing sizes for rental business
const CLOTHING_SIZES: SizeEnum[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

// Age categories - simplified to DEWASA and ANAK only
const AGE_CATEGORIES: { value: AgeCategory; label: string }[] = [
  { value: 'DEWASA', label: 'Dewasa' },
  { value: 'ANAK', label: 'Anak' },
]

interface InlineSizeManagementProps {
  sizes: SimplifiedSizeEntry[]
  onSizesChange: (sizes: SimplifiedSizeEntry[]) => void
  errors?: string
}

export function InlineSizeManagement({ sizes, onSizesChange, errors }: InlineSizeManagementProps) {
  // New entry state for adding rows
  const [newEntry, setNewEntry] = useState<{
    size: SizeEnum | ''
    ageCategory: AgeCategory
    quantity: number
  }>({
    size: '',
    ageCategory: 'DEWASA', // Default to DEWASA
    quantity: 1,
  })

  // Validation state
  const [localErrors, setLocalErrors] = useState<{
    duplicate?: string
    size?: string
    quantity?: string
  }>({})

  // Generate unique ID for new entries
  const generateId = (): string => {
    return `size_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Check for duplicate size/age category combinations
  const checkDuplicate = (size: SizeEnum, ageCategory: AgeCategory): boolean => {
    return sizes.some((s) => s.size === size && s.ageCategory === ageCategory)
  }

  // Validate new entry before adding
  const validateNewEntry = (): boolean => {
    const newErrors: typeof localErrors = {}

    if (!newEntry.size) {
      newErrors.size = 'Ukuran harus dipilih'
    } else if (checkDuplicate(newEntry.size, newEntry.ageCategory)) {
      newErrors.duplicate = `Kombinasi ${newEntry.size} - ${newEntry.ageCategory} sudah ada`
    }

    if (newEntry.quantity < 1) {
      newErrors.quantity = 'Stok minimal 1'
    } else if (newEntry.quantity > 999) {
      newErrors.quantity = 'Stok maksimal 999'
    }

    setLocalErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Add new size entry
  const handleAddSize = () => {
    if (validateNewEntry() && newEntry.size) {
      const entry: SimplifiedSizeEntry = {
        id: generateId(),
        size: newEntry.size,
        ageCategory: newEntry.ageCategory,
        quantity: newEntry.quantity,
      }

      const updatedSizes = [...sizes, entry]
      onSizesChange(updatedSizes)

      // Reset form
      setNewEntry({
        size: '',
        ageCategory: 'DEWASA',
        quantity: 1,
      })
      setLocalErrors({})
    }
  }

  // Remove size entry
  const handleRemoveSize = (id: string) => {
    const updatedSizes = sizes.filter((s) => s.id !== id)
    onSizesChange(updatedSizes)
  }

  // Calculate total stock
  const totalQuantity = sizes.reduce((sum, entry) => sum + entry.quantity, 0)

  // Clear local errors when values change - simplified version
  const handleNewEntryChange = (field: string, value: any) => {
    setNewEntry((prev) => ({ ...prev, [field]: value }))
    setLocalErrors((prev) => ({ ...prev, [field]: undefined, duplicate: undefined }))
  }

  return (
    <div className="space-y-4" data-testid="inline-size-management">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <Package className="w-5 h-5 text-blue-600" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Manajemen Ukuran</h3>
          <p className="text-sm text-gray-600">
            Tambahkan ukuran dan stok untuk setiap kategori usia
          </p>
        </div>
      </div>

      {/* Add New Size Form */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Size Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Ukuran <span className="text-red-500">*</span>
            </label>
            <Select
              value={newEntry.size}
              onValueChange={(value) => handleNewEntryChange('size', value as SizeEnum)}
            >
              <SelectTrigger
                className={localErrors.size ? 'border-red-500' : ''}
                data-testid="size-selector"
              >
                <SelectValue placeholder="Pilih ukuran" />
              </SelectTrigger>
              <SelectContent>
                {CLOTHING_SIZES.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {localErrors.size && <p className="text-sm text-red-500">{localErrors.size}</p>}
          </div>

          {/* Age Category Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Kategori Usia <span className="text-red-500">*</span>
            </label>
            <Select
              value={newEntry.ageCategory}
              onValueChange={(value) => handleNewEntryChange('ageCategory', value as AgeCategory)}
            >
              <SelectTrigger data-testid="age-category-selector">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGE_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Stok <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={newEntry.quantity.toString()}
              onChange={(e) => {
                const numValue = e.target.value.replace(/\D/g, '')
                const quantity = numValue === '' ? 0 : Number(numValue)
                setNewEntry((prev) => ({ ...prev, quantity }))
                setLocalErrors((prev) => ({ ...prev, quantity: undefined, duplicate: undefined }))
              }}
              className={localErrors.quantity ? 'border-red-500' : ''}
              placeholder="1"
              data-testid="quantity-input"
            />
            {localErrors.quantity && <p className="text-sm text-red-500">{localErrors.quantity}</p>}
          </div>

          {/* Add Button */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-transparent">Aksi</label>
            <Button
              type="button"
              onClick={handleAddSize}
              disabled={!newEntry.size}
              className="w-full bg-blue-600 hover:bg-blue-700"
              data-testid="add-size-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah
            </Button>
          </div>
        </div>

        {/* Error Messages */}
        {localErrors.duplicate && (
          <p className="text-sm text-red-500 mt-2">{localErrors.duplicate}</p>
        )}
      </div>

      {/* Sizes Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-3 font-medium text-gray-900">Ukuran</th>
                <th className="text-left p-3 font-medium text-gray-900">Kategori Usia</th>
                <th className="text-left p-3 font-medium text-gray-900">Stok</th>
                <th className="text-left p-3 font-medium text-gray-900 w-20">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sizes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-gray-500 py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-8 h-8 text-gray-300" />
                      <p>Belum ada ukuran ditambahkan</p>
                      <p className="text-xs">Tambahkan ukuran pertama di form di atas</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sizes.map((sizeEntry) => (
                  <tr key={sizeEntry.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-900">{sizeEntry.size}</td>
                    <td className="p-3 text-gray-700">
                      {AGE_CATEGORIES.find((cat) => cat.value === sizeEntry.ageCategory)?.label}
                    </td>
                    <td className="p-3">
                      <Input
                        type="text"
                        value={sizeEntry.quantity.toString()}
                        onChange={(e) => {
                          const numValue = e.target.value.replace(/\D/g, '')
                          const quantity = numValue === '' ? 0 : Number(numValue)
                          const updatedSizes = sizes.map((s) =>
                            s.id === sizeEntry.id ? { ...s, quantity } : s,
                          )
                          onSizesChange(updatedSizes)
                        }}
                        className="w-20"
                        data-testid={`quantity-${sizeEntry.id}`}
                      />
                    </td>
                    <td className="p-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSize(sizeEntry.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        data-testid={`remove-${sizeEntry.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary & Validation */}
      <div className="space-y-2">
        {/* Summary */}
        {sizes.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{sizes.length} ukuran terdaftar</span>
              <span className="font-medium text-gray-900">Total Stok: {totalQuantity} unit</span>
            </div>
          </div>
        )}

        {/* Global Error */}
        {errors && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{errors}</p>
          </div>
        )}
      </div>
    </div>
  )
}
