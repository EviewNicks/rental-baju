'use client'

import { Search, Filter, ArrowUpDown, DollarSign } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCategories } from '@/features/manage-product/hooks/useCategories'
import type { KasirFilters } from '../../types'

interface KasirFilterBarProps {
  filters: KasirFilters
  onFiltersChange: (filters: KasirFilters) => void
  isLoading?: boolean
  productCount?: number
}

export function KasirFilterBar({
  filters,
  onFiltersChange,
  isLoading = false,
  productCount = 0,
}: KasirFilterBarProps) {
  // Fetch categories from API
  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories()
  const categories = categoriesData?.categories || []

  // Create category options with "Semua" option
  const categoryOptions = [{ id: 'all', name: 'Semua Kategori' }, ...categories]

  // Status options for kasir workflow
  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'AVAILABLE', label: 'Tersedia' },
    { value: 'RENTED', label: 'Sedang Disewa' },
  ]

  // Sort options for kasir workflow
  const sortOptions = [
    { value: 'name', label: 'Nama Produk' },
    { value: 'price', label: 'Harga' },
    { value: 'quantity', label: 'Stok Tersedia' },
    { value: 'createdAt', label: 'Terbaru Ditambah' },
  ]

  const handleFilterChange = (key: keyof KasirFilters, value: string | number | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  const resetFilters = () => {
    onFiltersChange({
      search: '',
      categoryId: '',
      status: '',
      sortBy: 'name',
      sortOrder: 'asc',
      minPrice: undefined,
      maxPrice: undefined,
    })
  }

  const hasActiveFilters =
    filters.search || filters.categoryId || filters.status || filters.minPrice || filters.maxPrice

  return (
    <Card className="mb-6 shadow-md border-0 bg-card" data-testid="kasir-filter-bar">
      <CardContent className="px-6 py-4">
        <div className="flex flex-col lg:flex-col gap-4 items-start lg:items-center justify-between">
          {/* Search Section */}
          <div className="flex flex-row justify-between w-full ">
            <div className="flex-1 max-w-lg" data-testid="search-section">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Cari produk untuk kasir..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 border-border focus:ring-2 focus:ring-ring/20"
                  disabled={isLoading}
                  data-testid="kasir-search-input"
                />
              </div>
            </div>
            {/* Reset Button */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                disabled={isLoading}
                className="text-sm"
                data-testid="reset-filters-button"
              >
                Reset Filter
              </Button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-3 items-center" data-testid="filter-controls">
            {/* Category Filter */}
            <div className="flex items-center gap-2" data-testid="category-filter-section">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select
                value={filters.categoryId || 'all'}
                onValueChange={(value) =>
                  handleFilterChange('categoryId', value === 'all' ? '' : value)
                }
                disabled={isLoading || isLoadingCategories}
                data-testid="kasir-category-filter"
              >
                <SelectTrigger className="w-48 border" data-testid="category-filter-trigger">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent data-testid="category-filter-content">
                  {isLoadingCategories ? (
                    <SelectItem value="loading" disabled data-testid="category-loading-item">
                      Loading...
                    </SelectItem>
                  ) : (
                    categoryOptions.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id}
                        data-testid={`category-option-${category.id}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{category.name}</span>
                          {category.id !== 'all' && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {productCount}+
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
              disabled={isLoading}
              data-testid="kasir-status-filter"
            >
              <SelectTrigger className="w-36" data-testid="status-filter-trigger">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent data-testid="status-filter-content">
                {statusOptions.map((status) => (
                  <SelectItem
                    key={status.value}
                    value={status.value}
                    data-testid={`status-option-${status.value}`}
                  >
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Controls */}
            <div className="flex items-center gap-2" data-testid="sort-controls">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <Select
                value={filters.sortBy || 'name'}
                onValueChange={(value) => handleFilterChange('sortBy', value)}
                disabled={isLoading}
                data-testid="kasir-sort-filter"
              >
                <SelectTrigger className="w-40" data-testid="sort-filter-trigger">
                  <SelectValue placeholder="Urutkan" />
                </SelectTrigger>
                <SelectContent data-testid="sort-filter-content">
                  {sortOptions.map((sort) => (
                    <SelectItem
                      key={sort.value}
                      value={sort.value}
                      data-testid={`sort-option-${sort.value}`}
                    >
                      {sort.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort Order Toggle */}
              <Button
                variant={filters.sortOrder === 'desc' ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')
                }
                disabled={isLoading}
                className="px-3"
                data-testid="sort-order-toggle"
              >
                {filters.sortOrder === 'desc' ? '↓' : '↑'}
              </Button>
            </div>

            {/* Price Range Filter */}
            <div className="flex items-center gap-2" data-testid="price-range-section">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice || ''}
                  onChange={(e) =>
                    handleFilterChange(
                      'minPrice',
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  className="w-24"
                  min="0"
                  disabled={isLoading}
                  data-testid="min-price-input"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice || ''}
                  onChange={(e) =>
                    handleFilterChange(
                      'maxPrice',
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  className="w-24"
                  min="0"
                  disabled={isLoading}
                  data-testid="max-price-input"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
