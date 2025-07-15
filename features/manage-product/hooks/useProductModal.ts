'use client'

import { useState } from 'react'
import type { Product } from '@/features/manage-product/types'

export function useProductModal() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const openAddModal = () => setIsAddModalOpen(true)
  const closeAddModal = () => setIsAddModalOpen(false)

  const openEditModal = (product: Product) => {
    setSelectedProduct(product)
    setIsEditModalOpen(true)
  }
  const closeEditModal = () => {
    setSelectedProduct(null)
    setIsEditModalOpen(false)
  }

  const openDetailModal = (product: Product) => {
    setSelectedProduct(product)
    setIsDetailModalOpen(true)
  }
  const closeDetailModal = () => {
    setSelectedProduct(null)
    setIsDetailModalOpen(false)
  }

  return {
    isAddModalOpen,
    isEditModalOpen,
    isDetailModalOpen,
    selectedProduct,
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal,
    openDetailModal,
    closeDetailModal,
  }
}
