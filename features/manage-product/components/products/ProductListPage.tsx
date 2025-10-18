'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProductHeader } from './ProductHeader'
import { SearchFilterBar } from './SearchFilterBar'
import { ProductTable } from './ProductTable'
import { ProductGrid } from './ProductGrid'
import { EmptyState } from './EmptyState'
import { ManageProductErrorBoundary } from '../shared/ManageProductErrorBoundary'
import { SearchFilterErrorBoundary } from '../shared/SearchFilterErrorBoundary'
import { PaginationControls } from '../product-detail/PaginationControls'
import { useProducts } from '../../hooks/useProducts'
import { useDeleteProduct } from '../../hooks/useProducts'
import type { ClientProduct, CategoryFilterValue, StatusFilterValue, ViewMode } from '../../types'

interface ProductFilters {
  search?: string
  categoryId?: CategoryFilterValue
  status?: StatusFilterValue
  size?: string | string[]
}

export function ProductListPage() {
  const router = useRouter()

  // Local UI state
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    categoryId: '',
    status: '',
  })
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<ClientProduct | null>(null)

  // Data fetching
  const { data: productsData, isLoading, error } = useProducts({
    ...filters,
    page: currentPage
  })
  const deleteProductMutation = useDeleteProduct()

  const products = productsData?.products || []
  const pagination = productsData?.pagination || { page: 1, totalPages: 1, total: 0 }
  const isEmpty = !isLoading && products.length === 0

  // Navigation handlers
  const handleAddProduct = () => {
    router.push('/producer/manage-product/add')
  }

  const handleEditProduct = (product: ClientProduct) => {
    router.push(`/producer/manage-product/edit/${product.id}`)
  }

  const handleViewProduct = (product: ClientProduct) => {
    router.push(`/producer/manage-product/${product.id}`)
  }

  // Filter handlers
  const handleSearch = (search: string) => {
    setCurrentPage(1) // Reset to first page when searching
    setFilters((prev) => ({ ...prev, search }))
  }

  const handleCategoryFilter = (categoryId: CategoryFilterValue) => {
    setCurrentPage(1) // Reset to first page when changing category
    setFilters((prev) => ({ ...prev, categoryId }))
  }

  const handleStatusFilter = (status: StatusFilterValue) => {
    setCurrentPage(1) // Reset to first page when changing status
    setFilters((prev) => ({ ...prev, status }))
  }

  const handleSizeFilter = (size: string | undefined) => {
    setCurrentPage(1) // Reset to first page when changing size filter
    setFilters((prev) => ({ ...prev, size }))
  }

  
  const resetFilters = () => {
    setCurrentPage(1) // Reset to first page when resetting filters
    setFilters({
      search: '',
      categoryId: '',
      status: '',
    })
  }

  // Delete handlers
  const handleDeleteProduct = (product: ClientProduct) => {
    setProductToDelete(product)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return

    try {
      await deleteProductMutation.mutateAsync(productToDelete.id)
      setIsDeleteDialogOpen(false)
      setProductToDelete(null)
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  const cancelDeleteProduct = () => {
    setIsDeleteDialogOpen(false)
    setProductToDelete(null)
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Terjadi Kesalahan</h2>
          <p className="text-gray-600 mb-6">
            {error instanceof Error
              ? error.message
              : 'Gagal memuat data produk. Silakan coba lagi.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="manage-product-page">
      <ProductHeader onAddProduct={handleAddProduct} />

      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        data-testid="manage-product-content"
      >
        <SearchFilterErrorBoundary
          onError={(error, errorInfo) => {
            console.error('SearchFilterBar error:', error, errorInfo)
          }}
          onReset={() => {
            console.log('SearchFilterBar reset')
          }}
        >
          <SearchFilterBar
            searchTerm={filters.search || ''}
            onSearchChange={handleSearch}
            selectedCategory={filters.categoryId}
            onCategoryChange={handleCategoryFilter}
            selectedStatus={filters.status}
            onStatusChange={handleStatusFilter}
            selectedSize={Array.isArray(filters.size) ? filters.size.join(',') : filters.size}
            onSizeChange={handleSizeFilter}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            isLoading={isLoading}
          />
        </SearchFilterErrorBoundary>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Memuat produk...</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && isEmpty && <EmptyState onReset={resetFilters} />}

        {/* Products Display */}
        {!isLoading && !isEmpty && (
          <>
            {viewMode === 'table' ? (
              <ProductTable
                products={products}
                onViewProduct={handleViewProduct}
                onEditProduct={handleEditProduct}
                onDeleteProduct={handleDeleteProduct}
                loading={isLoading}
              />
            ) : (
              <ProductGrid products={products} onProductClick={handleViewProduct} />
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <PaginationControls
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setCurrentPage}
                isLoading={isLoading}
                data-testid="product-pagination-controls"
                className="mt-8"
              />
            )}
          </>
        )}

        {/* Delete Confirmation Dialog */}
        {isDeleteDialogOpen && productToDelete && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            data-testid="delete-confirmation-overlay"
          >
            <div
              className="bg-white p-6 rounded-lg max-w-md mx-4"
              data-testid="delete-confirmation-dialog"
            >
              <h3 className="text-lg font-semibold mb-4" data-testid="delete-confirmation-title">
                Konfirmasi Hapus
              </h3>
              <p className="text-gray-600 mb-6" data-testid="delete-confirmation-message">
                Apakah Anda yakin ingin menghapus produk &quot;{productToDelete.name}&quot;?
                Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex justify-end space-x-3" data-testid="delete-confirmation-actions">
                <button
                  onClick={cancelDeleteProduct}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={deleteProductMutation.isPending}
                  data-testid="delete-confirmation-cancel"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDeleteProduct}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  disabled={deleteProductMutation.isPending}
                  data-testid="delete-confirmation-confirm"
                >
                  {deleteProductMutation.isPending ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function ProductListPageWithErrorBoundary() {
  return (
    <ManageProductErrorBoundary
      onReset={() => {
        window.location.reload()
      }}
    >
      <ProductListPage />
    </ManageProductErrorBoundary>
  )
}
