'use client'

import { useProductManagement } from '@/features/manage-product/hooks/useProductManagement'
import { ProductHeader } from '@/features/manage-product/components/products/ProductHeader'
import { SearchFilterBar } from '@/features/manage-product/components/products/SearchFilterBar'
import { ProductTable } from '@/features/manage-product/components/products/ProductTable'
import { ProductGrid } from '@/features/manage-product/components/products/ProductGrid'
import { EmptyState } from '@/features/manage-product/components/products/EmptyState'
import { ProductDetailModal } from '@/features/manage-product/components/product-detail/ProductDetailModal'

export default function ProductManagement() {
  const {
    // Data
    products,
    pagination,

    // UI State
    viewMode,
    setViewMode,
    isDeleteDialogOpen,
    productToDelete,
    isDetailModalOpen,
    selectedProductId,

    // Loading & Error States
    isLoading,
    isLoadingProducts,
    hasError,
    error,
    isEmpty,

    // CRUD Operations
    handleDeleteProduct,
    confirmDeleteProduct,
    cancelDeleteProduct,

    // Navigation
    handleAddProduct,
    handleEditProduct,
    handleViewProduct,

    // Modal Management
    handleCloseDetailModal,
    handleProductDeleted,

    // Filtering
    filters,
    handleSearch,
    handleCategoryFilter,
    handleStatusFilter,
    resetFilters,
  } = useProductManagement({
    defaultViewMode: 'table',
    initialFilters: { limit: 10, page: 1 },
  })

  // Error state
  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Terjadi Kesalahan</h2>
          <p className="text-gray-600 mb-6">
            {error?.message || 'Gagal memuat data produk. Silakan coba lagi.'}
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
    <div className="min-h-screen bg-gray-50">
      <ProductHeader onAddProduct={handleAddProduct} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SearchFilterBar
          searchTerm={filters.search || ''}
          onSearchChange={handleSearch}
          selectedCategory={filters.categoryId || ''}
          onCategoryChange={handleCategoryFilter}
          selectedStatus={filters.status || ''}
          onStatusChange={(value: string) => {
            const statusValue =
              value === 'Semua'
                ? undefined
                : (value as 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | undefined)
            handleStatusFilter(statusValue)
          }}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Loading State */}
        {isLoadingProducts && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Memuat produk...</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingProducts && isEmpty && <EmptyState onReset={resetFilters} />}

        {/* Products Display */}
        {!isLoadingProducts && !isEmpty && (
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

            {/* Pagination - Add if needed */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="text-sm text-gray-700">
                  Halaman {pagination.page} dari {pagination.totalPages}({pagination.total} total
                  produk)
                </div>
              </div>
            )}
          </>
        )}

        {/* Delete Confirmation Dialog */}
        {isDeleteDialogOpen && productToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Konfirmasi Hapus</h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus produk &quot;{productToDelete.name}?&quot;
                Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDeleteProduct}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={isLoading}
                >
                  Batal
                </button>
                <button
                  onClick={confirmDeleteProduct}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product Detail Modal */}
        <ProductDetailModal
          productId={selectedProductId}
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          onEdit={handleEditProduct}
          onProductDeleted={handleProductDeleted}
        />
      </div>
    </div>
  )
}
