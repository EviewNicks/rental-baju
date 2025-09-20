'use client'

import { Package, Plus, Minus, Eye, EyeOff } from 'lucide-react'
import type { AggregatedSizeView, AgeCategory } from '@/features/manage-product/types'
import { formatAgeCategory } from '@/features/manage-product/lib/utils/sizeManagementUtils'

interface AggregatedSizeDisplayProps {
  aggregatedSizes: AggregatedSizeView[]
  showBreakdown?: boolean
  editable?: boolean
  onSizeChange?: (sizes: AggregatedSizeView[]) => void
  className?: string
}

/**
 * Aggregated Size Display Component
 *
 * Displays size information in aggregated format: "M: 5 total"
 * Optionally shows breakdown by age category: "Dewasa: 2, Anak: 3"
 * Supports editing in aggregated mode
 */
export function AggregatedSizeDisplay({
  aggregatedSizes,
  showBreakdown = false,
  editable = false,
  onSizeChange,
  className = '',
}: AggregatedSizeDisplayProps) {
  // Calculate totals
  const totalQuantity = aggregatedSizes.reduce((sum, size) => sum + size.totalQuantity, 0)
  const totalSizes = aggregatedSizes.length

  // Handle quantity change for a specific size
  const handleQuantityChange = (sizeToUpdate: string, newQuantity: number) => {
    if (!editable || !onSizeChange) return

    const updatedSizes = aggregatedSizes.map((size) =>
      size.size === sizeToUpdate ? { ...size, totalQuantity: Math.max(0, newQuantity) } : size,
    )

    onSizeChange(updatedSizes)
  }

  // Remove a size entry
  const handleRemoveSize = (sizeToRemove: string) => {
    if (!editable || !onSizeChange) return

    const updatedSizes = aggregatedSizes.filter((size) => size.size !== sizeToRemove)
    onSizeChange(updatedSizes)
  }

  // Render quantity input for editable mode
  const renderQuantityInput = (size: AggregatedSizeView) => {
    if (!editable) {
      return <span className="font-semibold text-gray-900">{size.totalQuantity}</span>
    }

    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => handleQuantityChange(size.size, size.totalQuantity - 1)}
          className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={size.totalQuantity <= 0}
          title="Kurangi stok"
        >
          <Minus className="w-3 h-3" />
        </button>

        <input
          type="number"
          value={size.totalQuantity}
          onChange={(e) => handleQuantityChange(size.size, parseInt(e.target.value) || 0)}
          className="w-16 text-center text-sm border border-gray-300 rounded-md py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          min="0"
          max="999"
        />

        <button
          type="button"
          onClick={() => handleQuantityChange(size.size, size.totalQuantity + 1)}
          className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-300 hover:bg-gray-50"
          title="Tambah stok"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    )
  }

  // Render breakdown details for a size
  const renderBreakdown = (size: AggregatedSizeView) => {
    if (!showBreakdown || !size.breakdown) return null

    const breakdownEntries = Object.entries(size.breakdown).filter(([, qty]) => qty && qty > 0)

    if (breakdownEntries.length === 0) return null

    return (
      <div className="mt-2 text-xs text-gray-600">
        <div className="flex items-center gap-1 mb-1">
          <Eye className="w-3 h-3" />
          <span className="font-medium">Detail:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {breakdownEntries.map(([category, quantity]) => (
            <span
              key={category}
              className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-700"
            >
              {formatAgeCategory(
                (category.toUpperCase() === 'DEWASA' ? 'ADULT' :
                 category.toUpperCase() === 'ANAK' ? 'CHILD' : 'UNIVERSAL') as AgeCategory
              )}: {quantity}
            </span>
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (aggregatedSizes.length === 0) {
    return (
      <div className={`text-center py-6 text-gray-500 ${className}`}>
        <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">Belum ada ukuran yang ditambahkan</p>
        {editable && (
          <p className="text-xs mt-1">
            Klik &quot;Tambah Ukuran&quot; untuk mulai mengelola stok berdasarkan ukuran
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`} data-testid="aggregated-size-display">
      {/* Summary header */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            Total Stok: {totalQuantity} unit
          </span>
        </div>
        <div className="text-xs text-gray-500">{totalSizes} ukuran tersedia</div>
      </div>

      {/* Size list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {aggregatedSizes.map((size) => (
          <div
            key={size.size}
            className="border border-gray-200 rounded-lg p-3 bg-white hover:shadow-sm transition-shadow"
            data-testid={`size-item-${size.size}`}
          >
            {/* Size header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-lg text-gray-900">{size.size}</span>
                {size.hasMultipleCategories && (
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    title="Ukuran ini tersedia untuk beberapa kategori usia"
                  >
                    Multi
                  </span>
                )}
              </div>

              {editable && (
                <button
                  type="button"
                  onClick={() => handleRemoveSize(size.size)}
                  className="text-red-500 hover:text-red-700 text-xs"
                  title="Hapus ukuran"
                >
                  ×
                </button>
              )}
            </div>

            {/* Quantity display/input */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Stok:</span>
              {renderQuantityInput(size)}
            </div>

            {/* Breakdown details */}
            {renderBreakdown(size)}

            {/* Stock status indicator */}
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    size.totalQuantity > 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span
                  className={`text-xs ${
                    size.totalQuantity > 0 ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {size.totalQuantity > 0 ? 'Tersedia' : 'Stok habis'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add size button (editable mode) */}
      {editable && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
          <button
            type="button"
            className="flex items-center justify-center gap-2 mx-auto px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
            title="Tambah ukuran baru"
          >
            <Plus className="w-4 h-4" />
            Tambah Ukuran
          </button>
          <p className="text-xs text-gray-500 mt-1">
            Klik untuk menambah ukuran baru dengan pengaturan detail
          </p>
        </div>
      )}

      {/* Breakdown toggle hint */}
      {!showBreakdown && aggregatedSizes.some((size) => size.hasMultipleCategories) && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <EyeOff className="w-4 h-4" />
            <span>
              Klik &quot;Tampilkan Detail&quot; untuk melihat breakdown berdasarkan kategori usia
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
