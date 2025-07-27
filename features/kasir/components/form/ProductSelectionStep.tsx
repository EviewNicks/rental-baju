'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, Filter, ShoppingCart, Plus, Minus, X, Package, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from '../ui/product-card'
import type { Product, ProductFilters, ProductSelection } from '../../types/product'
import { useAvailableProducts } from '../../hooks/useProduk'
import { formatCurrency } from '../../lib/utils'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface ProductSelectionStepProps {
  selectedProducts: ProductSelection[]
  onAddProduct: (product: Product, quantity: number) => void
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
  const [filters, setFilters] = useState<ProductFilters>({
    category: 'semua',
    size: 'semua',
    color: 'semua',
    search: '',
    available: true,
  })
  const [showCart, setShowCart] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch products from API
  const { 
    data: productsResponse, 
    isLoading, 
    error, 
    refetch 
  } = useAvailableProducts({
    search: searchQuery,
    available: true,
  })

  // Extract products and transform API data to match component interface
  const apiProducts = useMemo(() => {
    if (!productsResponse?.data) return []
    
    return productsResponse.data.map((apiProduct): Product => ({
      id: apiProduct.id,
      name: apiProduct.name,
      category: apiProduct.category.name.toLowerCase(),
      size: apiProduct.size || 'Unknown',
      color: apiProduct.color?.name || 'Unknown',
      pricePerDay: apiProduct.hargaSewa,
      image: apiProduct.imageUrl || '/placeholder.svg',
      available: apiProduct.availableQuantity > 0,
      description: apiProduct.description,
      availableQuantity: apiProduct.availableQuantity,
    }))
  }, [productsResponse])

  // Extract unique categories, sizes, and colors from API data
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(apiProducts.map(p => p.category))]
    return ['semua', ...uniqueCategories]
  }, [apiProducts])

  const sizes = useMemo(() => {
    const uniqueSizes = [...new Set(apiProducts.map(p => p.size).filter(Boolean))]
    return ['semua', ...uniqueSizes]
  }, [apiProducts])

  const colors = useMemo(() => {
    const uniqueColors = [...new Set(apiProducts.map(p => p.color).filter(Boolean))]
    return ['semua', ...uniqueColors]
  }, [apiProducts])

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(filters.search || '')
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [filters.search])

  const filteredProducts = useMemo(() => {
    return apiProducts.filter((product) => {
      if (
        filters.category &&
        filters.category !== 'semua' &&
        product.category !== filters.category
      ) {
        return false
      }
      if (filters.size && filters.size !== 'semua' && product.size !== filters.size) {
        return false
      }
      if (filters.color && filters.color !== 'semua' && product.color !== filters.color) {
        return false
      }
      if (filters.available && !product.available) {
        return false
      }
      return true
    })
  }, [apiProducts, filters])

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

  const handleAddProduct = (product: Product, quantity: number) => {
    // Check if product is already in cart
    const existingProduct = selectedProducts.find((item) => item.product.id === product.id)

    if (existingProduct) {
      // Update quantity if product already exists
      onUpdateQuantity(product.id, existingProduct.quantity + quantity)
    } else {
      // Add new product
      onAddProduct(product, quantity)
    }
  }

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      onRemoveProduct(productId)
    } else {
      onUpdateQuantity(productId, newQuantity)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-3 space-y-6">
        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Filter className="h-5 w-5" />
            Filter Produk
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari produk..."
              value={filters.search || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>

          {/* Filter Buttons */}
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Kategori</div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    size="sm"
                    variant={filters.category === category ? 'default' : 'outline'}
                    onClick={() => setFilters((prev) => ({ ...prev, category }))}
                    className={cn(
                      'text-xs capitalize',
                      filters.category === category &&
                        'bg-yellow-400 text-gray-900 hover:bg-yellow-500',
                    )}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Ukuran</div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <Button
                      key={size}
                      size="sm"
                      variant={filters.size === size ? 'default' : 'outline'}
                      onClick={() => setFilters((prev) => ({ ...prev, size }))}
                      className={cn(
                        'text-xs',
                        filters.size === size && 'bg-yellow-400 text-gray-900 hover:bg-yellow-500',
                      )}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Warna</div>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <Button
                      key={color}
                      size="sm"
                      variant={filters.color === color ? 'default' : 'outline'}
                      onClick={() => setFilters((prev) => ({ ...prev, color }))}
                      className={cn(
                        'text-xs',
                        filters.color === color &&
                          'bg-yellow-400 text-gray-900 hover:bg-yellow-500',
                      )}
                    >
                      {color}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Produk Tersedia ({isLoading ? '...' : filteredProducts.length})
            </h2>
            <Button variant="outline" onClick={() => setShowCart(!showCart)} className="lg:hidden">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Keranjang ({getTotalItems()})
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Memuat produk...</span>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-red-300 mx-auto mb-4" />
              <div className="text-lg text-red-600 mb-2">
                Gagal memuat produk
              </div>
              <div className="text-sm text-gray-600 mb-4">
                Terjadi kesalahan saat mengambil data produk
              </div>
              <Button onClick={() => refetch()} variant="outline">
                Coba Lagi
              </Button>
            </div>
          )}

          {/* Products Content */}
          {!isLoading && !error && (
            <>
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddProduct}
                      selectedQuantity={getSelectedQuantity(product.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
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
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className={cn('lg:block', showCart ? 'block' : 'hidden')}>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 sticky top-32">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900">Keranjang</h3>
            </div>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {getTotalItems()} item
            </Badge>
          </div>

          {selectedProducts.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Keranjang masih kosong</p>
              <p className="text-gray-400 text-xs mt-1">Pilih produk untuk memulai</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {selectedProducts.map((item) => (
                  <div key={item.product.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <Image
                        src={item.product.image || '/placeholder.svg'}
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
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onRemoveProduct(item.product.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 ml-auto"
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
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Item:</span>
                  <span className="font-medium">{getTotalItems()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Durasi:</span>
                  <span className="font-medium">3 hari</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-gray-900 border-t border-gray-200 pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(getTotalPrice())}</span>
                </div>
              </div>

              {/* Proceed Button */}
              <Button
                onClick={onNext}
                disabled={!canProceed}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold"
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
