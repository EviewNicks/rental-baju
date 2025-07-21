'use client'

import { Search, Filter, Table, Grid3X3 } from 'lucide-react'
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
  selectedCategory: CategoryFilterValue
  onCategoryChange: (value: CategoryFilterValue) => void
  selectedStatus: StatusFilterValue
  onStatusChange: (value: StatusFilterValue) => void
  viewMode: ViewMode
  onViewModeChange: (value: ViewMode) => void
  isLoading?: boolean
}

export function SearchFilterBar({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  viewMode,
  onViewModeChange,
  isLoading = false,
}: SearchFilterBarProps) {
  // Fetch categories from API
  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories()
  const categories = categoriesData?.categories || []

  // Create category options with "Semua" option
  const categoryOptions = [
    { id: 'all', name: 'Semua' },
    ...categories
  ]
  return (
    <Card className="mb-6 shadow-md border-0 bg-card">
      <CardContent className="px-6 py-2">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Cari produk berdasarkan nama atau kode..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 border-border focus:ring-2 focus:ring-ring/20"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select 
                value={selectedCategory || 'all'} 
                onValueChange={(value) => onCategoryChange(value === 'all' ? '' : value)}
                disabled={isLoading || isLoadingCategories}
              >
                <SelectTrigger className="w-32 border">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingCategories ? (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  ) : (
                    categoryOptions.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
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
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => value && onViewModeChange(value as ViewMode)}
              disabled={isLoading}
            >
              <ToggleGroupItem value="table" aria-label="Table view">
                <Table className="w-4 h-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="card" aria-label="Card view">
                <Grid3X3 className="w-4 h-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
