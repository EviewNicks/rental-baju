'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  Package,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from '../ui/product-card'
import { KasirFilterBar } from '../ui/KasirFilterBar'
import type { Product, ProductSelection, KasirFilters } from '../../types'
import { useAvailableProducts } from '../../hooks/useProduk'
import { formatCurrency } from '../../lib/utils/client'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface ProductSelectionStepProps {
  selectedProducts: ProductSelection[]
  onAddProduct: (product: Product, quantity: number, productSizeId?: string) => void
  onRemoveProduct: (productId: string) => void
  onUpdateQuantity: (productId: string, quantity: number) => void
  onNext: () => void
  canProceed: boolean
}

export function ProductSelectionStep({
  selectedProducts,
  onAddProduct,
  onRemoveProduct,
  onUpdateQuantity,
  onNext,
  canProceed,
}: ProductSelectionStepProps) {
  const [filters, setFilters] = useState<KasirFilters>({
    search: '',
    categoryId: '',
    status: '',
    sortBy: 'name',
    sortOrder: 'asc',
    minPrice: undefined,
    maxPrice: undefined,
  })
  const [showCart, setShowCart] = useState(false)
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)

  // Debug logging for props
  useEffect(() => {}, [selectedProducts, canProceed])

  // Fetch products from API with enhanced filters
  const {
    data: productsResponse,
    isLoading,
    error,
    refetch,
  } = useAvailableProducts({
    search: filters.search,
    categoryId: filters.categoryId,
    status: filters.status as 'AVAILABLE' | 'RENTED' | undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    available: true, // Default to available for kasir workflow
    page: currentPage,
    limit: pageSize,
  })

  // Transform API data to match component interface
  const products = useMemo(() => {
    if (!productsResponse?.data) {
      return []
    }

    return productsResponse.data.map(
      (apiProduct): Product => ({
        id: apiProduct.id,
        name: apiProduct.name,
        category: apiProduct.category.name.toLowerCase(),
        categoryType: apiProduct.category.type,
        size: apiProduct.size || 'Unknown',
        color: apiProduct.color?.name || 'Unknown',
        pricePerDay: apiProduct.currentPrice,
        image: apiProduct.imageUrl || '/placeholder.svg',
        available: true, // Availability is now handled in ProductCard with quantity-aware logic
        description: apiProduct.description,
        availableQuantity: apiProduct.availableQuantity,

        // RPK-51: Map size-aware fields from API response
        sizes: apiProduct.sizes || [],
        supportsSizeSelection: (apiProduct.sizes?.length ?? 0) > 0,
      }),
    )
  }, [productsResponse])

  const getSelectedQuantity = (productId: string) => {
    const selected = selectedProducts.find((item) => item.product.id === productId)
    return selected?.quantity || 0
  }

  const getTotalItems = () => {
    return selectedProducts.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return selectedProducts.reduce((total, item) => {
      return total + item.product.pricePerDay * item.quantity * item.duration
    }, 0)
  }

  const handleAddProduct = (product: Product, quantity: number, productSizeId?: string) => {
    // Check if product is already in cart (consider productSizeId for size-aware products)
    const existingProduct = selectedProducts.find(
      (item) =>
        item.product.id === product.id &&
        (productSizeId ? item.productSizeId === productSizeId : !item.productSizeId),
    )

    if (existingProduct) {
      // Update quantity if product already exists
      onUpdateQuantity(product.id, existingProduct.quantity + quantity)
    } else {
      // Add new product (with optional productSizeId)
      onAddProduct(product, quantity, productSizeId)
    }
  }

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      onRemoveProduct(productId)
    } else {
      onUpdateQuantity(productId, newQuantity)
    }
  }

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1) // Reset to first page when changing page size
  }

  const totalPages = productsResponse?.pagination?.totalPages || 1
  const totalItems = productsResponse?.pagination?.total || 0
  const currentPageItems = productsResponse?.data?.length || 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" data-testid="product-selection-layout">
      {/* Main Content */}
      <div className="lg:col-span-3 space-y-6" data-testid="product-selection-main-content">
        {/* Enhanced Filters for Kasir Workflow */}
        <KasirFilterBar
          filters={filters}
          onFiltersChange={setFilters}
          isLoading={isLoading}
          productCount={totalItems}
        />

        {/* Products Grid */}
        <div
          className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6"
          data-testid="products-grid-section"
        >
          <div
            className="flex items-center justify-between mb-6"
            data-testid="products-grid-header"
          >
            <h2 className="text-lg font-semibold text-gray-900" data-testid="products-count-header">
              Produk Tersedia ({isLoading ? '...' : `${currentPageItems} dari ${totalItems}`})
            </h2>
            <div className="flex items-center gap-2">
              {/* Page Size Selector */}
              <select
                title="sizes"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                data-testid="page-size-selector"
              >
                <option value={12}>12 per halaman</option>
                <option value={24}>24 per halaman</option>
                <option value={48}>48 per halaman</option>
              </select>
              <Button
                variant="outline"
                onClick={() => setShowCart(!showCart)}
                className="lg:hidden"
                data-testid="mobile-cart-toggle-button"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Keranjang ({getTotalItems()})
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div
              className="flex items-center justify-center py-12"
              data-testid="products-loading-state"
            >
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Memuat produk...</span>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="text-center py-12" data-testid="products-error-state">
              <Package className="h-16 w-16 text-red-300 mx-auto mb-4" />
              <div className="text-lg text-red-600 mb-2">Gagal memuat produk</div>
              <div className="text-sm text-gray-600 mb-4">
                Terjadi kesalahan saat mengambil data produk
              </div>
              <Button
                onClick={() => refetch()}
                variant="outline"
                data-testid="products-retry-button"
              >
                Coba Lagi
              </Button>
            </div>
          )}

          {/* Products Content */}
          {!isLoading && !error && (
            <>
              {products.length > 0 ? (
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
                  data-testid="products-grid"
                >
                  {products.map((product) => (
                    <div key={product.id} data-testid={`product-card-${product.id}`}>
                      <ProductCard
                        product={product}
                        onAddToCart={handleAddProduct}
                        selectedQuantity={getSelectedQuantity(product.id)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12" data-testid="products-empty-state">
                  <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <div className="text-lg text-gray-500 mb-2">
                    Tidak ada produk yang sesuai dengan filter
                  </div>
                  <div className="text-sm text-gray-400">
                    Coba ubah filter atau kata kunci pencarian
                  </div>
                </div>
              )}
            </>
          )}

          {/* Pagination Controls */}
          {!isLoading && !error && totalPages > 1 && (
            <div
              className="mt-6 flex items-center justify-between"
              data-testid="pagination-controls"
            >
              <div className="text-sm text-gray-600">
                Halaman {currentPage} dari {totalPages} ({totalItems} total produk)
              </div>

              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  data-testid="pagination-prev-button"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className={cn(
                          'w-8 h-8 p-0',
                          currentPage === pageNum &&
                            'bg-yellow-400 text-gray-900 hover:bg-yellow-500',
                        )}
                        data-testid={`pagination-page-${pageNum}`}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                {/* Next Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  data-testid="pagination-next-button"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className={cn('lg:block', showCart ? 'block' : 'hidden')} data-testid="cart-sidebar">
        <div
          className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 sticky top-32"
          data-testid="cart-container"
        >
          <div className="flex items-center justify-between mb-4" data-testid="cart-header">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900">Keranjang</h3>
            </div>
            <Badge
              variant="secondary"
              className="bg-yellow-100 text-yellow-800"
              data-testid="cart-item-count"
            >
              {getTotalItems()} item
            </Badge>
          </div>

          {selectedProducts.length === 0 ? (
            <div className="text-center py-8" data-testid="cart-empty-state">
              <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Keranjang masih kosong</p>
              <p className="text-gray-400 text-xs mt-1">Pilih produk untuk memulai</p>
            </div>
          ) : (
            <div className="space-y-4" data-testid="cart-content">
              {/* Cart Items */}
              <div className="space-y-3 max-h-64 overflow-y-auto" data-testid="cart-items-list">
                {selectedProducts.map((item) => (
                  <div
                    key={item.product.id}
                    className="bg-gray-50 rounded-lg p-3"
                    data-testid={`cart-item-${item.product.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <Image
                        src={
                          item.product.image?.startsWith('/') ||
                          item.product.image?.startsWith('http')
                            ? item.product.image || '/products/image.png'
                            : `/${item.product.image || 'products/image.png'}`
                        }
                        alt={item.product.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 object-cover rounded-md"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {item.product.size} • {item.product.color}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatCurrency(item.product.pricePerDay)}/hari
                        </p>

                        {/* Quantity Controls */}
                        <div
                          className="flex items-center gap-2 mt-2"
                          data-testid={`cart-item-controls-${item.product.id}`}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                            className="h-6 w-6 p-0"
                            data-testid={`cart-item-decrease-${item.product.id}`}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span
                            className="text-sm font-medium w-8 text-center"
                            data-testid={`cart-item-quantity-${item.product.id}`}
                          >
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                            className="h-6 w-6 p-0"
                            data-testid={`cart-item-increase-${item.product.id}`}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onRemoveProduct(item.product.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 ml-auto"
                            data-testid={`cart-item-remove-${item.product.id}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Summary */}
              <div className="border-t border-gray-200 pt-4 space-y-2" data-testid="cart-summary">
                <div className="flex justify-between text-sm" data-testid="cart-total-items">
                  <span className="text-gray-600">Total Item:</span>
                  <span className="font-medium">{getTotalItems()}</span>
                </div>
                <div className="flex justify-between text-sm" data-testid="cart-duration">
                  <span className="text-gray-600">Durasi:</span>
                  <span className="font-medium">3 hari</span>
                </div>
                <div
                  className="flex justify-between text-base font-semibold text-gray-900 border-t border-gray-200 pt-2"
                  data-testid="cart-total-price"
                >
                  <span>Total:</span>
                  <span>{formatCurrency(getTotalPrice())}</span>
                </div>
              </div>

              {/* Proceed Button */}
              <Button
                onClick={onNext}
                disabled={!canProceed}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold"
                data-testid="step-1-next-button"
              >
                Lanjut ke Data Penyewa
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
