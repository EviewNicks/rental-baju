'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { useProductFilters } from '@/features/manage-product/hooks/useProductFilters'
import { useProductModal } from '@/features/manage-product/hooks/useProductModal'

import { ProductHeader } from '@/features/manage-product/components/products/ProductHeader'
import { SearchFilterBar } from '@/features/manage-product/components/products/SearchFilterBar'
import { ProductTable } from '@/features/manage-product/components/products/ProductTable'
import { ProductGrid } from '@/features/manage-product/components/products/ProductGrid'
// import { ProductDetailModal } from '@/features/manage-product/components/products-detail/ProductDetailModal'
import { EmptyState } from '@/features/manage-product/components/products/EmptyState'

import { mockProducts } from '@/features/manage-product/data/mock-products'
import type { Product } from '@/features/manage-product/types'

export default function ProductManagement() {
  const router = useRouter()
  const [products] = useState<Product[]>(mockProducts)

  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    viewMode,
    setViewMode,
    filteredProducts,
    resetFilters,
  } = useProductFilters({ products })

  //   const { isDetailModalOpen, selectedProduct, openDetailModal, closeDetailModal } =
  //     useProductModal()

  const { openDetailModal } = useProductModal()

  const handleAddProduct = () => {
    router.push('/producer/manage-product/add')
  }

  const handleEditProduct = (product: Product) => {
    router.push(`/producer/manage-product/edit/${product.id}`)
  }

  const handleViewProduct = (product: Product) => {
    openDetailModal(product)
  }

  const handleDeleteProduct = (product: Product) => {
    console.log('Delete product:', product.id)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProductHeader onAddProduct={handleAddProduct} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SearchFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {filteredProducts.length === 0 ? (
          <EmptyState onReset={resetFilters} />
        ) : viewMode === 'table' ? (
          <ProductTable
            products={filteredProducts}
            onViewProduct={handleViewProduct}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        ) : (
          <ProductGrid products={filteredProducts} onProductClick={handleViewProduct} />
        )}
      </div>

      {/* <ProductDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        product={selectedProduct}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
      /> */}
    </div>
  )
}
