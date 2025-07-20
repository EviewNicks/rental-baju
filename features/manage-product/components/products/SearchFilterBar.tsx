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
import type { ViewMode } from '@/features/manage-product/types'

interface SearchFilterBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedCategory: string
  onCategoryChange: (value: string) => void
  selectedStatus: string
  onStatusChange: (value: string) => void
  viewMode: ViewMode
  onViewModeChange: (value: ViewMode) => void
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
}: SearchFilterBarProps) {
  // Fetch categories from API
  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories()
  const categories = categoriesData?.categories || []

  // Create category options with "Semua" option
  const categoryOptions = [
    { id: '', name: 'Semua' },
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
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedCategory} onValueChange={onCategoryChange}>
                <SelectTrigger className="w-32 border">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingCategories ? (
                    <SelectItem value="" disabled>
                      Loading...
                    </SelectItem>
                  ) : (
                    categoryOptions.map((category) => (
                      <SelectItem key={category.id || 'all'} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <Select value={selectedStatus} onValueChange={onStatusChange}>
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
