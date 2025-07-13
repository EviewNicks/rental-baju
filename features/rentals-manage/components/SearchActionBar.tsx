'use client'

import { Search, Plus, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

interface SearchActionsBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onAddClick: () => void
  isLoading?: boolean
}

export function SearchActionsBar({
  searchQuery,
  onSearchChange,
  onAddClick,
  isLoading = false,
}: SearchActionsBarProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <Skeleton className="h-12 w-full max-w-md" />
          <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Cari penyewa berdasarkan nama, telepon, atau kode..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-3 w-full border-neutral-200 focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 rounded-xl"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-2 bg-transparent hover:bg-lime-50 border-neutral-200 hover:border-lime-500 rounded-xl"
          >
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>

          <Button
            onClick={onAddClick}
            className="bg-black hover:bg-neutral-800 text-white flex items-center space-x-2 transition-all duration-200 hover:scale-105 rounded-xl px-6 py-3 font-semibold shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Penyewa</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
