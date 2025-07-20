/**
 * useProductManagement Hook - High-level orchestration hook
 * Combines CRUD operations, filtering, UI state, and business logic
 */

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useProducts } from './useProducts'
import { useCreateProduct, useUpdateProduct, useDeleteProduct } from './useProduct'
import { showSuccess, showError } from '@/lib/notifications'
import type {
  CreateProductRequest,
  UpdateProductRequest,
  GetProductsParams,
} from '../adapters/types/requests'
import type { Product, ViewMode } from '../types'

interface UseProductManagementOptions {
  initialFilters?: GetProductsParams
  defaultViewMode?: ViewMode
  autoRefresh?: boolean
  enableOptimisticUpdates?: boolean
}

export function useProductManagement(options: UseProductManagementOptions = {}) {
  const router = useRouter()
  const { initialFilters = {}, defaultViewMode = 'table', autoRefresh = true } = options

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode)
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  // Filters state
  const [filters, setFilters] = useState<GetProductsParams>(initialFilters)

  // Data fetching
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    error: productsError,
    refetch: refetchProducts,
  } = useProducts({
    ...filters,
    enabled: autoRefresh,
  })

  // Mutations
  const createProductMutation = useCreateProduct()
  const updateProductMutation = useUpdateProduct()
  const deleteProductMutation = useDeleteProduct()

  // Extract data with safe defaults
  const products = productsData?.products || []
  const pagination = productsData?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  }

  // Filter products client-side if needed (for additional filtering not handled by API)
  const filteredProducts = useMemo(() => {
    const result = [...products]

    // Add any client-side filtering logic here if needed
    // For now, rely on server-side filtering

    return result
  }, [products])

  // Navigation handlers
  const handleAddProduct = useCallback(() => {
    router.push('/producer/manage-product/add')
  }, [router])

  const handleEditProduct = useCallback(
    (product: Product) => {
      router.push(`/producer/manage-product/edit/${product.id}`)
    },
    [router],
  )

  const handleViewProduct = useCallback((product: Product) => {
    setSelectedProductId(product.id)
    setIsDetailModalOpen(true)
  }, [])

  // CRUD operations
  const handleCreateProduct = useCallback(
    async (data: CreateProductRequest) => {
      try {
        const result = await createProductMutation.mutateAsync(data)
        showSuccess('Produk berhasil dibuat', `Produk ${data.name} telah ditambahkan ke inventaris`)
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Gagal membuat produk'
        showError('Gagal membuat produk', errorMessage)
        console.error('Failed to create product:', error)
        throw error
      }
    },
    [createProductMutation],
  )

  const handleUpdateProduct = useCallback(
    async (id: string, data: UpdateProductRequest) => {
      try {
        const result = await updateProductMutation.mutateAsync({ id, data })
        showSuccess('Produk berhasil diperbarui', `Perubahan pada produk telah disimpan`)
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Gagal memperbarui produk'
        showError('Gagal memperbarui produk', errorMessage)
        console.error('Failed to update product:', error)
        throw error
      }
    },
    [updateProductMutation],
  )

  const handleDeleteProduct = useCallback((product: Product) => {
    setProductToDelete(product)
    setIsDeleteDialogOpen(true)
  }, [])

  const confirmDeleteProduct = useCallback(async () => {
    if (!productToDelete) return

    try {
      await deleteProductMutation.mutateAsync(productToDelete.id)
      showSuccess(
        'Produk berhasil dihapus',
        `Produk ${productToDelete.name} telah dihapus dari inventaris`,
      )
      setIsDeleteDialogOpen(false)
      setProductToDelete(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus produk'
      showError('Gagal menghapus produk', errorMessage)
      console.error('Failed to delete product:', error)
      throw error
    }
  }, [productToDelete, deleteProductMutation])

  const cancelDeleteProduct = useCallback(() => {
    setIsDeleteDialogOpen(false)
    setProductToDelete(null)
  }, [])

  // Filter handlers
  const handleSearch = useCallback((searchTerm: string) => {
    setFilters((prev) => ({ ...prev, search: searchTerm, page: 1 }))
  }, [])

  const handleCategoryFilter = useCallback((categoryId: string | undefined) => {
    // Convert empty string to undefined for API call
    const actualCategoryId = categoryId === '' ? undefined : categoryId
    setFilters((prev) => ({ ...prev, categoryId: actualCategoryId, page: 1 }))
  }, [])

  const handleStatusFilter = useCallback(
    (status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | undefined) => {
      // Convert "Semua" or empty string to undefined for API call
      const actualStatus = status ? undefined : status
      setFilters((prev) => ({ ...prev, status: actualStatus, page: 1 }))
    },
    [],
  )

  const handlePagination = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }))
  }, [])

  const handleLimitChange = useCallback((limit: number) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [initialFilters])

  // Selection handlers (for bulk operations)
  const handleSelectProduct = useCallback((product: Product, selected: boolean) => {
    if (selected) {
      setSelectedProducts((prev) => [...prev, product])
    } else {
      setSelectedProducts((prev) => prev.filter((p) => p.id !== product.id))
    }
  }, [])

  const handleSelectAllProducts = useCallback(
    (selected: boolean) => {
      if (selected) {
        setSelectedProducts(filteredProducts)
      } else {
        setSelectedProducts([])
      }
    },
    [filteredProducts],
  )

  const clearSelection = useCallback(() => {
    setSelectedProducts([])
  }, [])

  // Modal handlers
  const handleCloseDetailModal = useCallback(() => {
    setIsDetailModalOpen(false)
    setSelectedProductId(null)
  }, [])

  const handleProductDeleted = useCallback(() => {
    // Refetch products after deletion
    refetchProducts()
  }, [refetchProducts])

  // Computed states
  const isLoading =
    isLoadingProducts ||
    createProductMutation.isPending ||
    updateProductMutation.isPending ||
    deleteProductMutation.isPending

  const hasError =
    !!productsError ||
    !!createProductMutation.error ||
    !!updateProductMutation.error ||
    !!deleteProductMutation.error

  const error =
    productsError ||
    createProductMutation.error ||
    updateProductMutation.error ||
    deleteProductMutation.error

  const isEmpty = !isLoadingProducts && filteredProducts.length === 0
  const hasSelection = selectedProducts.length > 0
  const isAllSelected =
    selectedProducts.length === filteredProducts.length && filteredProducts.length > 0

  return {
    // Data
    products: filteredProducts,
    pagination,
    selectedProducts,

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
    handleCreateProduct,
    handleUpdateProduct,
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
    handlePagination,
    handleLimitChange,
    resetFilters,

    // Selection
    handleSelectProduct,
    handleSelectAllProducts,
    clearSelection,
    hasSelection,
    isAllSelected,

    // Utilities
    refetch: refetchProducts,

    // Mutation states for individual tracking
    mutations: {
      create: {
        isPending: createProductMutation.isPending,
        error: createProductMutation.error,
      },
      update: {
        isPending: updateProductMutation.isPending,
        error: updateProductMutation.error,
      },
      delete: {
        isPending: deleteProductMutation.isPending,
        error: deleteProductMutation.error,
      },
    },
  }
}
