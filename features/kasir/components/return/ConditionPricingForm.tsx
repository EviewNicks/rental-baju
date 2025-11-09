'use client'

import { useCallback, useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, AlertTriangle, DollarSign } from 'lucide-react'
import type { ConditionSplit, ConditionCategory } from '../../types'
import { kasirLogger } from '../../lib/logger'

// Condition category options with UI metadata (simplified - no suggested prices)
const CONDITION_CATEGORIES = [
  {
    value: 'BAIK' as ConditionCategory,
    label: 'Baik',
    color: 'bg-green-100 text-green-800 border-green-200',
    description: 'Kondisi sempurna tanpa kerusakan',
  },
  {
    value: 'KOTOR' as ConditionCategory,
    label: 'Kotor',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    description: 'Perlu pencucian atau pembersihan',
  },
  {
    value: 'RUSAK_RINGAN' as ConditionCategory,
    label: 'Rusak Ringan',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    description: 'Kerusakan kecil yang dapat diperbaiki',
  },
  {
    value: 'RUSAK_BERAT' as ConditionCategory,
    label: 'Rusak Berat',
    color: 'bg-red-100 text-red-800 border-red-200',
    description: 'Kerusakan signifikan sulit diperbaiki',
  },
  {
    value: 'HILANG' as ConditionCategory,
    label: 'Hilang',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    description: 'Item tidak dikembalikan',
  },
] as const

interface ConditionPricingFormProps {
  condition: ConditionSplit
  onChange: (condition: ConditionSplit) => void
  onRemove?: () => void
  disabled?: boolean
  canRemove?: boolean
  autoFocus?: boolean
  maxQuantity?: number
  remainingQuantity?: number
  productModalAwal?: number
}

/**
 * ConditionPricingForm Component
 * Manual pricing entry for return conditions with category-based structure
 * Supports both automatic suggested pricing and manual override
 */
export function ConditionPricingForm({
  condition,
  onChange,
  onRemove,
  disabled = false,
  canRemove = false,
  autoFocus = false,
  maxQuantity = 1,
  remainingQuantity = 0,
  productModalAwal = 0,
}: ConditionPricingFormProps) {
  // Validation state
  const validation = useMemo(() => {
    const errors: string[] = []
    const warnings: string[] = []

    if (!condition.conditionCategory) {
      errors.push('Kategori kondisi harus dipilih')
    }

    if (!condition.kondisiAkhir || condition.kondisiAkhir.length < 4) {
      errors.push('Deskripsi kondisi minimal 4 karakter')
    } else if (condition.kondisiAkhir.length > 500) {
      errors.push('Deskripsi kondisi maksimal 500 karakter')
    }

    // Special validation for lost items (HILANG category)
    const isLostCondition = condition.conditionCategory === 'HILANG'

    if (!isLostCondition && (!condition.jumlahKembali || condition.jumlahKembali <= 0)) {
      errors.push('Jumlah harus lebih dari 0')
    } else if (isLostCondition && condition.jumlahKembali !== 0) {
      errors.push('Barang hilang harus memiliki jumlah kembali = 0')
    } else if (condition.jumlahKembali > maxQuantity) {
      errors.push(`Jumlah tidak boleh lebih dari ${maxQuantity}`)
    }

    // Manual pricing validation - required for non-BAIK categories
    if (condition.conditionCategory && condition.conditionCategory !== 'BAIK') {
      if (condition.manualPrice === undefined || condition.manualPrice < 0) {
        errors.push('Harga penalty harus diisi untuk kondisi selain "Baik"')
      }
    }

    // Smart warnings - simplified for HILANG category
    if (condition.conditionCategory === 'HILANG' && condition.jumlahKembali > 1) {
      warnings.push('Item hilang biasanya dicatat per unit untuk tracking yang lebih baik')
    }

    // Only show remaining quantity warning for non-HILANG categories
    if (
      condition.conditionCategory !== 'HILANG' &&
      condition.conditionCategory === 'BAIK' &&
      remainingQuantity > 0
    ) {
      warnings.push(`Masih ada ${remainingQuantity} unit yang belum dialokasikan`)
    }

    if (
      condition.useManualPricing &&
      condition.manualPrice &&
      condition.manualPrice > productModalAwal
    ) {
      warnings.push('Harga manual melebihi modal awal produk')
    }

    return {
      isValid: errors.length === 0,
      hasWarnings: warnings.length > 0,
      errors,
      warnings,
    }
  }, [condition, maxQuantity, remainingQuantity, productModalAwal])

  // Handle category change
  const handleCategoryChange = useCallback(
    (value: ConditionCategory) => {
      kasirLogger.userInteraction.debug('handleCategoryChange', 'Category changed', {
        previousCategory: condition.conditionCategory,
        newCategory: value,
        quantity: condition.jumlahKembali,
      })

      const categoryMeta = CONDITION_CATEGORIES.find((cat) => cat.value === value)
      const newCondition = {
        ...condition,
        conditionCategory: value,
        kondisiAkhir: categoryMeta?.label || '',
        useManualPricing: value !== 'BAIK', // Auto-set based on category
      }

      // Auto-correct quantity for HILANG category
      if (value === 'HILANG') {
        newCondition.jumlahKembali = 0 // Auto-set to 0 for lost items
        newCondition.useManualPricing = true // Force manual pricing for lost items
        // Auto-populate penalty with modalAwal for lost items
        if (productModalAwal > 0) {
          newCondition.manualPrice = productModalAwal
          newCondition.modalAwal = productModalAwal // CRITICAL: Ensure modalAwal field is populated for backend
        }
      } else {
        // Restore reasonable default when switching away from HILANG
        if (condition.conditionCategory === 'HILANG' && condition.jumlahKembali === 0) {
          newCondition.jumlahKembali = 1 // Reset to reasonable default
        }
        newCondition.useManualPricing = value !== 'BAIK'
        // Clear manual price for non-HILANG categories if not set
        if (!condition.manualPrice || condition.manualPrice === productModalAwal) {
          newCondition.manualPrice = value === 'BAIK' ? 0 : undefined
        }
      }

      onChange(newCondition)
    },
    [condition, onChange, productModalAwal],
  )

  // Handle description change
  const handleDescriptionChange = useCallback(
    (value: string) => {
      kasirLogger.userInteraction.debug('handleDescriptionChange', 'Description changed', {
        previousDescription: condition.kondisiAkhir,
        newDescription: value,
      })

      onChange({ ...condition, kondisiAkhir: value })
    },
    [condition, onChange],
  )

  // Handle quantity change
  const handleQuantityChange = useCallback(
    (value: string) => {
      const quantity = parseInt(value) || 0

      kasirLogger.userInteraction.debug('handleQuantityChange', 'Quantity changed', {
        previousQuantity: condition.jumlahKembali,
        newQuantity: quantity,
        category: condition.conditionCategory,
      })

      onChange({ ...condition, jumlahKembali: quantity })
    },
    [condition, onChange],
  )

  // Handle manual price change
  const handleManualPriceChange = useCallback(
    (value: string) => {
      const price = parseFloat(value) || 0

      kasirLogger.userInteraction.debug('handleManualPriceChange', 'Manual price changed', {
        previousPrice: condition.manualPrice,
        newPrice: price,
      })

      onChange({ ...condition, manualPrice: price })
    },
    [condition, onChange],
  )

  // Handle remove condition
  const handleRemove = useCallback(() => {
    kasirLogger.userInteraction.info('handleRemove', 'Condition removed', {
      removedCategory: condition.conditionCategory,
      quantity: condition.jumlahKembali,
    })
    onRemove?.()
  }, [onRemove, condition])

  return (
    <div className="space-y-4">
      {/* Main Condition Row */}
      <div className="flex flex-col gap-4 p-4 border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-shadow">
        {/* Category and Description Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Kategori Kondisi</label>
            <Select
              value={condition.conditionCategory || ''}
              onValueChange={handleCategoryChange}
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih kategori..." />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${category.color}`}>
                        {category.label}
                      </Badge>
                      <div className="text-left">
                        <div className="text-xs text-gray-500">{category.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Deskripsi Kondisi</label>
            <Input
              type="text"
              value={condition.kondisiAkhir || ''}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              disabled={disabled}
              autoFocus={autoFocus}
              placeholder="Deskripsikan kondisi item..."
              className="w-full"
            />
            {condition.kondisiAkhir && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {condition.kondisiAkhir.length >= 4 ? (
                    <span className="text-green-600">
                      ✓ Valid ({condition.kondisiAkhir.length} karakter)
                    </span>
                  ) : (
                    <span className="text-red-600">
                      ⚠ Minimal 4 karakter ({condition.kondisiAkhir.length}/4)
                    </span>
                  )}
                </span>
                <span className="text-gray-400">{condition.kondisiAkhir.length}/500</span>
              </div>
            )}
          </div>
        </div>

        {/* Quantity and Pricing Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Quantity Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Jumlah
              {condition.conditionCategory === 'HILANG' && (
                <span className="text-gray-500 font-normal"> (Otomatis 0 untuk hilang)</span>
              )}
            </label>
            <Input
              type="number"
              min="1"
              max={maxQuantity}
              value={condition.jumlahKembali || ''}
              onChange={(e) => handleQuantityChange(e.target.value)}
              disabled={disabled || condition.conditionCategory === 'HILANG'}
              className={`text-center ${
                condition.conditionCategory === 'HILANG' ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              placeholder={condition.conditionCategory === 'HILANG' ? '0' : '0'}
            />
            {condition.conditionCategory === 'HILANG' && (
              <p className="text-xs text-gray-500 mt-1">
                💡 Barang hilang otomatis memiliki jumlah kembali = 0
              </p>
            )}
          </div>

          {/* Spacer for consistent layout */}
          <div className="space-y-2">
            <div className="h-8"></div>
          </div>

          {/* Price Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Harga Penalty (IDR)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="number"
                min="0"
                value={condition.conditionCategory === 'BAIK' ? 0 : condition.manualPrice || ''}
                onChange={(e) => handleManualPriceChange(e.target.value)}
                disabled={disabled || condition.conditionCategory === 'BAIK'}
                className="pl-10"
                placeholder={
                  condition.conditionCategory === 'BAIK' ? '0' : 'Masukkan harga penalty'
                }
              />
            </div>
            {condition.conditionCategory === 'BAIK' && (
              <div className="text-xs text-green-600">✓ Kondisi baik - tidak ada penalty</div>
            )}
            {condition.conditionCategory === 'HILANG' && (
              <div className="text-xs text-green-600">
                ✓ Otomatis: Rp {productModalAwal.toLocaleString('id-ID')} (sesuai modal awal)
              </div>
            )}
          </div>
        </div>

        {/* Lost Item Help Text */}
        {condition.conditionCategory === 'HILANG' && (
          <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-200">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <AlertTriangle className="h-4 w-4" />
              <span>
                <strong>Barang Hilang:</strong> Item tidak dikembalikan, jumlah kembali otomatis =
                0, penalty otomatis = Rp {productModalAwal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        )}

        {/* Remove Button */}
        {canRemove && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus Kondisi
            </Button>
          </div>
        )}
      </div>

      {/* Validation Messages */}
      {!validation.isValid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Warnings */}
      {validation.hasWarnings && validation.isValid && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="space-y-1">
              {validation.warnings.map((warning, index) => (
                <li key={index} className="text-amber-700">
                  💡 {warning}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
