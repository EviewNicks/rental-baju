'use client'

import { Plus, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
// import { CategoryManagementModal } from '@/features/manage-product/components/category/CategoryManagementModal'
// import { useCategoryModal } from '@/features/manage-product/hooks/usecategoryModal'

import { MasterDataManagementModal } from '../master-data/MasterDataManagementModal'
import { useMasterDataModal } from '../../hooks/useMasterDataModal'

interface ProductHeaderProps {
  onAddProduct: () => void
}

export function ProductHeader({ onAddProduct }: ProductHeaderProps) {
  // const { isOpen, openModal, closeModal } = useCategoryModal()
  const { isOpen, defaultTab, openModal, closeModal } = useMasterDataModal()

  return (
    <>
      <div className="bg-white border-b border-gray-200" data-testid="product-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div data-testid="product-header-title-section">
              <h1 className="text-3xl font-bold text-gray-900" data-testid="product-header-title">
                Manajemen Produk
              </h1>
              <p className="text-gray-600 mt-1" data-testid="product-header-subtitle">
                Kelola inventaris produk rental pakaian Anda
              </p>
            </div>
            <div className="flex gap-3" data-testid="product-header-actions">
              {/* <Button
                variant="outline"
                className="flex items-center gap-2 bg-transparent"
                onClick={openModal}
                data-testid="manage-categories-button"
              >
                <Settings className="w-4 h-4" />
                Kelola Kategori
              </Button> */}
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-transparent"
                onClick={() => openModal('categories')}
              >
                <Settings className="w-4 h-4" />
                Kelola Data Master
              </Button>
              <Button
                className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black"
                onClick={onAddProduct}
                data-testid="add-product-button"
              >
                <Plus className="w-4 h-4" />
                Tambah Produk
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* <CategoryManagementModal isOpen={isOpen} onClose={closeModal} /> */}
      <MasterDataManagementModal isOpen={isOpen} onClose={closeModal} defaultTab={defaultTab} />
    </>
  )
}
