'use client'

import { Search, Filter, Table, Grid3X3, Ruler } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { STATUSES } from '@/features/manage-product/lib/constants'
import { useCategories } from '@/features/manage-product/hooks/useCategories'
import type { ViewMode, CategoryFilterValue, StatusFilterValue } from '@/features/manage-product/types'

interface SearchFilterBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  onSearchSubmit?: (value: string) => void
  selectedCategory: CategoryFilterValue
  onCategoryChange: (value: CategoryFilterValue) => void
  selectedStatus: StatusFilterValue
  onStatusChange: (value: StatusFilterValue) => void
  selectedSize?: string | undefined
  onSizeChange: (value: string | undefined) => void
  viewMode: ViewMode
  onViewModeChange: (value: ViewMode) => void
  isLoading?: boolean
  isSearchPending?: boolean
}

export function SearchFilterBar({
  searchTerm,
  onSearchChange,
  onSearchSubmit,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  selectedSize,
  onSizeChange,
  viewMode,
  onViewModeChange,
  isLoading = false,
  isSearchPending = false,
}: SearchFilterBarProps) {
  // Fetch categories from API
  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories()
  const categories = categoriesData?.categories || []

  // Create category options with "Semua" option
  const categoryOptions = [
    { id: 'all', name: 'Semua' },
    ...categories
  ]

  // Size options with "Semua" option
  const sizeOptions = [
    { value: 'all', label: 'Semua' },
    { value: 'XS', label: 'XS' },
    { value: 'S', label: 'S' },
    { value: 'M', label: 'M' },
    { value: 'L', label: 'L' },
    { value: 'XL', label: 'XL' },
    { value: 'XXL', label: 'XXL' },
  ]

  // Handle keyboard events for search input
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      onSearchSubmit(searchTerm)
    }
  }
  return (
    <Card className="mb-6 shadow-md border-0 bg-card" data-testid="search-filter-bar">
      <CardContent className="px-6 py-2">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex-1 max-w-md" data-testid="search-section">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Cari produk berdasarkan nama atau kode..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className={`pl-10 border-border focus:ring-2 focus:ring-ring/20 ${isSearchPending ? 'pr-10' : ''}`}
                disabled={isLoading}
                data-testid="search-input"
              />
              {isSearchPending && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2" data-testid="search-pending-indicator">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary opacity-50"></div>
                </div>
              )}
            </div>
            {isSearchPending && (
              <p className="text-xs text-muted-foreground mt-1" data-testid="search-pending-text">
                Mencari...
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 items-center" data-testid="filter-controls">
            <div className="flex items-center gap-2" data-testid="category-filter-section">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select 
                value={selectedCategory || 'all'} 
                onValueChange={(value) => onCategoryChange(value === 'all' ? '' : value)}
                disabled={isLoading || isLoadingCategories}
                data-testid="category-filter"
              >
                <SelectTrigger className="w-32 border" data-testid="category-filter-trigger">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent data-testid="category-filter-content">
                  {isLoadingCategories ? (
                    <SelectItem value="loading" disabled data-testid="category-loading-item">
                      Loading...
                    </SelectItem>
                  ) : (
                    categoryOptions.map((category) => (
                      <SelectItem key={category.id} value={category.id} data-testid={`category-option-${category.id}`}>
                        {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <Select 
              value={selectedStatus || 'Semua'} 
              onValueChange={(value) => onStatusChange(value === 'Semua' ? undefined : value as StatusFilterValue)}
              disabled={isLoading}
              data-testid="status-filter"
            >
              <SelectTrigger className="w-32" data-testid="status-filter-trigger">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent data-testid="status-filter-content">
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status} data-testid={`status-option-${status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2" data-testid="size-filter-section">
              <Ruler className="w-4 h-4 text-muted-foreground" />
              <Select 
                value={selectedSize || 'all'} 
                onValueChange={(value) => onSizeChange(value === 'all' ? undefined : value)}
                disabled={isLoading}
                data-testid="size-filter"
              >
                <SelectTrigger className="w-24" data-testid="size-filter-trigger">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent data-testid="size-filter-content">
                  {sizeOptions.map((size) => (
                    <SelectItem key={size.value} value={size.value} data-testid={`size-option-${size.value}`}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

  
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => value && onViewModeChange(value as ViewMode)}
              disabled={isLoading}
              data-testid="view-mode-toggle"
            >
              <ToggleGroupItem value="table" aria-label="Table view" data-testid="table-view-toggle">
                <Table className="w-4 h-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="card" aria-label="Card view" data-testid="card-view-toggle">
                <Grid3X3 className="w-4 h-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
