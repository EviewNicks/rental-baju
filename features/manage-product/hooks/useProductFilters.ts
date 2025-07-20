'use client'

import { useState, useMemo } from 'react'
import type { Product, ViewMode } from '@/features/manage-product/types'

interface UseProductFiltersProps {
  products: Product[]
}

export function useProductFilters({ products }: UseProductFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [selectedStatus, setSelectedStatus] = useState('Semua')
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'Semua' || product.category.name === selectedCategory
      const matchesStatus = selectedStatus === 'Semua' || product.status === selectedStatus

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [products, searchTerm, selectedCategory, selectedStatus])

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedCategory('Semua')
    setSelectedStatus('Semua')
  }

  return {
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
  }
}
