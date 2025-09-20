'use client'

import { useState, useEffect } from 'react'
import { Ruler, ToggleLeft, ToggleRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { FormSection } from '@/features/manage-product/components/form-product/FormSection'
import { FormField } from '@/features/manage-product/components/form-product/FormField'
import { AggregatedSizeDisplay } from './AggregatedSizeDisplay'
import { getProductSizeMode, type SizeMode } from '@/features/manage-product/lib/utils/sizeManagementUtils'
import type { ClientProduct, AggregatedSizeView } from '@/features/manage-product/types'

interface SizeManagementSectionProps {
  // Current product data (for edit mode)
  product?: ClientProduct

  // Form state
  hasSizes: boolean
  onHasSizesChange: (hasSizes: boolean) => void

  // Legacy size field (for backward compatibility)
  legacySize?: string
  onLegacySizeChange: (size: string) => void

  // Advanced size data
  aggregatedSizes?: AggregatedSizeView[]
  onAggregatedSizesChange?: (sizes: AggregatedSizeView[]) => void

  // Validation
  errors?: { [key: string]: string | null }
  touched?: { [key: string]: boolean }

  // UI state
  isEditing?: boolean
}

/**
 * Size Management Section - Hybrid sizing with backward compatibility
 *
 * Handles three modes:
 * - Legacy: Single size field (existing products)
 * - Advanced: Aggregated size display with breakdown
 * - None: No sizes
 */
export function SizeManagementSection({
  product,
  hasSizes,
  onHasSizesChange,
  legacySize,
  onLegacySizeChange,
  aggregatedSizes = [],
  onAggregatedSizesChange,
  errors = {},
  touched = {},
  isEditing = false,
}: SizeManagementSectionProps) {
  // Detect current size mode
  const sizeMode: SizeMode = product ? getProductSizeMode(product) : 'none'

  // Local state for advanced mode
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [isAdvancedMode, setIsAdvancedMode] = useState(sizeMode === 'advanced')

  // Size options for legacy mode
  const sizeOptions = [
    { value: 'XS', label: 'XS (Extra Small)' },
    { value: 'S', label: 'S (Small)' },
    { value: 'M', label: 'M (Medium)' },
    { value: 'L', label: 'L (Large)' },
    { value: 'XL', label: 'XL (Extra Large)' },
    { value: 'XXL', label: 'XXL (Double Extra Large)' },
  ]

  // Update advanced mode when hasSizes changes
  useEffect(() => {
    if (!hasSizes) {
      setIsAdvancedMode(false)
    }
  }, [hasSizes])

  // Handle "Has Sizes" toggle
  const handleHasSizesToggle = (newHasSizes: boolean) => {
    onHasSizesChange(newHasSizes)

    if (!newHasSizes) {
      // Clear size data when disabled
      onLegacySizeChange('')
      if (onAggregatedSizesChange) {
        onAggregatedSizesChange([])
      }
      setIsAdvancedMode(false)
    }
  }

  // Handle advanced mode toggle
  const handleAdvancedModeToggle = () => {
    const newAdvancedMode = !isAdvancedMode
    setIsAdvancedMode(newAdvancedMode)

    if (newAdvancedMode) {
      // Switching to advanced mode
      // TODO: Convert legacy size to advanced (Phase 2b)
      console.log('Switching to advanced mode')
    } else {
      // Switching to legacy mode
      // TODO: Convert first advanced size to legacy (Phase 2b)
      console.log('Switching to legacy mode')
    }
  }

  // Render size mode indicator
  const renderSizeModeIndicator = () => {
    const modeLabels = {
      legacy: 'Mode: Sederhana',
      advanced: 'Mode: Lanjutan',
      none: 'Tidak ada ukuran'
    }

    const modeColors = {
      legacy: 'text-blue-600 bg-blue-50 border-blue-200',
      advanced: 'text-green-600 bg-green-50 border-green-200',
      none: 'text-gray-500 bg-gray-50 border-gray-200'
    }

    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${modeColors[sizeMode]}`}>
        <Ruler className="w-3 h-3 mr-1" />
        {modeLabels[sizeMode]}
      </div>
    )
  }

  return (
    <FormSection
      title="Manajemen Ukuran"
      data-testid="size-management-section"
      className="space-y-4"
    >
      {/* Header with mode indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-gray-700">
            Pengaturan Ukuran Produk
          </h3>
          {renderSizeModeIndicator()}
        </div>

        {/* Advanced mode toggle (only show if has sizes) */}
        {hasSizes && sizeMode !== 'none' && (
          <button
            type="button"
            onClick={handleAdvancedModeToggle}
            className="flex items-center gap-2 px-3 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
            title={isAdvancedMode ? 'Beralih ke mode sederhana' : 'Beralih ke mode lanjutan'}
          >
            {isAdvancedMode ? (
              <>
                <ToggleRight className="w-4 h-4" />
                Mode Lanjutan
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4" />
                Mode Sederhana
              </>
            )}
          </button>
        )}
      </div>

      {/* Has Sizes Toggle */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Produk Memiliki Ukuran
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Aktifkan jika produk tersedia dalam berbagai ukuran
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleHasSizesToggle(!hasSizes)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              hasSizes ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            data-testid="has-sizes-toggle"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                hasSizes ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Size Management Content */}
      {hasSizes && (
        <Card className="border-gray-200">
          <CardContent className="p-4">
            {isAdvancedMode ? (
              /* Advanced Mode: Aggregated Size Display */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">
                    Ukuran & Stok (Agregat)
                  </h4>

                  {aggregatedSizes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowBreakdown(!showBreakdown)}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      {showBreakdown ? 'Sembunyikan Detail' : 'Tampilkan Detail'}
                    </button>
                  )}
                </div>

                <AggregatedSizeDisplay
                  aggregatedSizes={aggregatedSizes}
                  showBreakdown={showBreakdown}
                  editable={isEditing}
                  onSizeChange={onAggregatedSizesChange}
                />

                {aggregatedSizes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Ruler className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Belum ada ukuran yang ditambahkan</p>
                    <p className="text-xs mt-1">
                      Gunakan mode lanjutan untuk menambah ukuran dengan detail kategori usia
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Legacy Mode: Simple Size Selection */
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">
                  Ukuran Produk
                </h4>

                <FormField
                  type="select"
                  name="size"
                  label="Ukuran"
                  icon={Ruler}
                  value={legacySize || ''}
                  onChange={(value) => onLegacySizeChange(value)}
                  options={sizeOptions}
                  placeholder="Pilih ukuran (opsional)"
                  error={errors.size}
                  touched={touched.size}
                  helpText="Pilih ukuran produk jika berlaku"
                  data-testid="legacy-size-field"
                />

                {/* Upgrade prompt */}
                {legacySize && !isAdvancedMode && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-xs text-blue-700">
                      💡 <strong>Tips:</strong> Aktifkan mode lanjutan untuk mengelola stok berdasarkan kategori usia (Dewasa/Anak) dan mendapatkan laporan yang lebih detail.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help text when no sizes */}
      {!hasSizes && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <p className="text-sm text-gray-600">
            Produk ini tidak memiliki variasi ukuran. Stok akan dikelola sebagai satu unit tanpa pembagian ukuran.
          </p>
        </div>
      )}
    </FormSection>
  )
}