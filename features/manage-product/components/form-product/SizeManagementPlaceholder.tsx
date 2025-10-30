'use client'

import { Tag } from 'lucide-react'
import { FormSection } from '@/features/manage-product/components/form-product/FormSection'

interface SizeManagementPlaceholderProps {
  dataTestId?: string
}

export function SizeManagementPlaceholder({ dataTestId }: SizeManagementPlaceholderProps) {
  return (
    <FormSection title="Ukuran & Stok" data-testid={dataTestId || 'size-management-placeholder'}>
      <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full">
            <Tag className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-gray-900">Pilih Kategori Terlebih Dahulu</h3>
            <p className="text-xs text-gray-500 max-w-sm">
              Silakan pilih kategori produk untuk mengatur ukuran dan stok. Setiap kategori memiliki
              opsi ukuran yang berbeda.
            </p>
          </div>
        </div>
      </div>
    </FormSection>
  )
}
