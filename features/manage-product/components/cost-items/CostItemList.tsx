"use client"

import { useState, useEffect, useCallback } from 'react'
import { Search, Edit, Trash2, MoreHorizontal } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/features/kasir/lib/utils/common'
import { DeleteCostItemDialog } from './DeleteCostItem'
import { CostItemModal } from './cost-item-modal'
import type { CostItem, CostItemListResponse } from '../../types/costItem'

interface CostItemListProps {
  page: number
  search: string
  refreshTrigger?: number
  onRefreshTrigger?: () => void
}

// Loading skeleton component
function CostItemListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-16" />
      </div>

      {/* Table skeleton */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Dibuat Oleh</TableHead>
              <TableHead>Tanggal Dibuat</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  )
}

export function CostItemList({ page, search, refreshTrigger, onRefreshTrigger }: CostItemListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  
  const [data, setData] = useState<CostItemListResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(search)
  const [deleteItem, setDeleteItem] = useState<CostItem | null>(null)
  const [editItem, setEditItem] = useState<CostItem | null>(null)

  // Fetch cost items
  const fetchCostItems = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
      })

      console.log('Fetching cost items with params:', params.toString())
      const response = await fetch(`/api/cost-items?${params}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', response.status, errorText)
        throw new Error(`Failed to fetch cost items: ${response.status}`)
      }

      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching cost items:', error)
      toast.error('Gagal memuat data cost items')
    } finally {
      setIsLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchCostItems()
  }, [fetchCostItems, refreshTrigger])

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    
    // Update URL with search params - stay on current page
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set('search', value)
    } else {
      params.delete('search')
    }
    params.set('page', '1') // Reset to first page
    
    // Use current pathname to stay on the same page
    const newUrl = `${pathname}?${params.toString()}`
    console.log('Navigating to search:', newUrl)
    router.push(newUrl)
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    
    // Use current pathname to stay on the same page
    const newUrl = `${pathname}?${params.toString()}`
    console.log('Navigating to page:', newPage, 'URL:', newUrl)
    router.push(newUrl)
  }

  // Handle delete success
  const handleDeleteSuccess = () => {
    setDeleteItem(null)
    fetchCostItems() // Refresh the list
    toast.success('Cost item berhasil dihapus')
  }

  // Handle edit success
  const handleEditSuccess = () => {
    setEditItem(null)
    fetchCostItems() // Refresh the list
    onRefreshTrigger?.() // Trigger parent refresh if needed
  }

  if (isLoading) {
    return <CostItemListSkeleton />
  }

  if (!data) {
    return <div className="text-center py-8">Gagal memuat data</div>
  }

  const { costItems, pagination } = data

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari cost item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(searchTerm)
              }
            }}
            className="pl-10"
          />
        </div>
        <Button onClick={() => handleSearch(searchTerm)} variant="outline">
          Cari
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Dibuat Oleh</TableHead>
              <TableHead>Tanggal Dibuat</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {costItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  {search ? `Tidak ada cost item yang cocok dengan "${search}"` : 'Belum ada cost item'}
                </TableCell>
              </TableRow>
            ) : (
              costItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.createdBy}</TableCell>
                  <TableCell>{formatDate(item.createdAt.toString())}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Aktif</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditItem(item)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteItem(item)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Menampilkan {costItems.length} dari {pagination.total} cost items
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Sebelumnya
            </Button>
            <span className="text-sm">
              Halaman {pagination.page} dari {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {deleteItem && (
        <DeleteCostItemDialog
          costItem={deleteItem}
          open={!!deleteItem}
          onClose={() => setDeleteItem(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}

      {/* Edit Modal */}
      {editItem && (
        <CostItemModal
          open={!!editItem}
          onClose={() => setEditItem(null)}
          onSuccess={handleEditSuccess}
          costItem={editItem}
        />
      )}
    </div>
  )
}