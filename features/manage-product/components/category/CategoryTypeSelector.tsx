'use client'

import React from 'react'
import { Tag, Shirt, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CategoryType } from '@/features/manage-product/types'

interface CategoryTypeSelectorProps {
  value?: CategoryType
  onChange: (type: CategoryType) => void
  disabled?: boolean
  className?: string
}

const categoryTypes = [
  {
    value: 'clothing' as const,
    label: 'Pakaian',
    description: 'Baju, celana, gaun dengan ukuran standar (S, M, L, XL)',
    icon: Shirt,
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    selectedColor: 'bg-blue-100 border-blue-300 text-blue-800'
  },
  {
    value: 'accessories_age_based' as const,
    label: 'Aksesori Berdasarkan Usia',
    description: 'Topi, sepatu, kaos kaki dengan ukuran Anak/Dewasa',
    icon: Tag,
    color: 'bg-green-50 border-green-200 text-green-700',
    selectedColor: 'bg-green-100 border-green-300 text-green-800'
  },
  {
    value: 'accessories_universal' as const,
    label: 'Aksesori Universal',
    description: 'Tas, dompet, perhiasan dengan ukuran universal',
    icon: Package,
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    selectedColor: 'bg-purple-100 border-purple-300 text-purple-800'
  }
]

export function CategoryTypeSelector({
  value,
  onChange,
  disabled = false,
  className
}: CategoryTypeSelectorProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <label className="text-sm font-medium text-gray-700">
        Tipe Kategori
        <span className="text-red-500 ml-1">*</span>
      </label>

      <div className="space-y-2">
        {categoryTypes.map((type) => {
          const Icon = type.icon
          const isSelected = value === type.value

          return (
            <div
              key={type.value}
              className={cn(
                'relative flex cursor-pointer rounded-lg border p-4 transition-all',
                type.color,
                isSelected && type.selectedColor,
                disabled && 'cursor-not-allowed opacity-60',
                'hover:shadow-md'
              )}
              onClick={() => !disabled && onChange(type.value)}
            >
              <input
                type="radio"
                name="categoryType"
                value={type.value}
                checked={isSelected}
                onChange={() => !disabled && onChange(type.value)}
                disabled={disabled}
                className="sr-only"
              />

              <div className="flex items-start space-x-3">
                <div className={cn(
                  'rounded-md p-2',
                  isSelected ? 'bg-white bg-opacity-50' : 'bg-white bg-opacity-30'
                )}>
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {type.label}
                    </p>

                    {isSelected && (
                      <div className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-current" />
                      </div>
                    )}
                  </div>

                  <p className="mt-1 text-xs opacity-80">
                    {type.description}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {!value && (
        <p className="text-xs text-red-500">
          Tipe kategori wajib dipilih
        </p>
      )}
    </div>
  )
}

// Helper function untuk mendapatkan label dari type
export function getCategoryTypeLabel(type: CategoryType): string {
  const found = categoryTypes.find(t => t.value === type)
  return found?.label || type
}

// Helper function untuk mendapatkan icon dari type
export function getCategoryTypeIcon(type: CategoryType) {
  const found = categoryTypes.find(t => t.value === type)
  return found?.icon || Tag
}