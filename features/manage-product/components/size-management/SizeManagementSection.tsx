'use client'

import { useState } from 'react'
import { Package, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { FormSection } from '@/features/manage-product/components/form-product/FormSection'
import { AggregatedSizeDisplay } from './AggregatedSizeDisplay'
import { SizeCreationModal } from './SizeCreationModal'
import type { AggregatedSizeView } from '@/features/manage-product/types'

interface SizeManagementSectionProps {
  // Size data
  aggregatedSizes: AggregatedSizeView[]
  onAggregatedSizesChange: (sizes: AggregatedSizeView[]) => void

  // Validation
  errors?: Record<string, string>

  // UI state
  isEditing?: boolean
}

/**
 * Size Management Section - Streamlined size management interface
 *
 * Provides intuitive size and stock management for rental clothing products.
 * All products require structured size data with age categories.
 */
export function SizeManagementSection({
  aggregatedSizes,
  onAggregatedSizesChange,
  errors = {},
  isEditing = false,
}: SizeManagementSectionProps) {
  // Local state for breakdown display
  const [showBreakdown, setShowBreakdown] = useState(false)

  // Modal state for size creation
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Calculate summary stats
  const totalStock = aggregatedSizes.reduce((sum, size) => sum + size.totalQuantity, 0)
  const totalSizes = aggregatedSizes.length

  // Handle new size creation from modal
  const handleSizeCreate = (newSize: AggregatedSizeView) => {
    const updatedSizes = [...aggregatedSizes, newSize]
    onAggregatedSizesChange(updatedSizes)
    setIsModalOpen(false)
  }

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  return (
    <FormSection
      title="Manajemen Ukuran"
      data-testid="size-management-section"
      className="space-y-4"
    >
      {/* Summary Header */}
      {totalSizes > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {totalSizes} ukuran tersedia
                </p>
                <p className="text-xs text-blue-700">
                  Total stok: {totalStock} unit
                </p>
              </div>
            </div>

            {totalSizes > 0 && (
              <button
                type="button"
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {showBreakdown ? 'Sembunyikan Detail' : 'Tampilkan Detail'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Size Management Content */}
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Main Content Area */}
            {aggregatedSizes.length > 0 ? (
              <AggregatedSizeDisplay
                aggregatedSizes={aggregatedSizes}
                showBreakdown={showBreakdown}
                editable={isEditing}
                onSizeChange={onAggregatedSizesChange}
              />
            ) : (
              /* Improved Empty State */
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Belum Ada Ukuran
                </h3>
                <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
                  Tambahkan ukuran produk dengan stok untuk setiap kategori usia (Dewasa, Anak, atau Universal)
                </p>

                {/* Primary CTA - Always visible */}
                {isEditing && (
                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 bg-blue-50">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                      title="Tambah ukuran baru"
                    >
                      <Plus className="w-4 h-4" />
                      Tambah Ukuran Pertama
                    </button>
                    <p className="text-xs text-blue-700 mt-2">
                      Mulai dengan menambahkan ukuran pertama untuk produk ini
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Messages */}
      {errors.sizes && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-700">{errors.sizes}</p>
        </div>
      )}

      {/* Size Creation Modal */}
      <SizeCreationModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSizeCreate={handleSizeCreate}
        existingSizes={aggregatedSizes}
      />
    </FormSection>
  )
}