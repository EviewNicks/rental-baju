'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Search, MoreHorizontal, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useKasirManagement } from '../../hooks/useKasirManagement'
import { KasirStatusToggle } from './KasirStatusToggle'

interface KasirFilters {
  search?: string
  status?: 'active' | 'inactive'
}

interface Kasir {
  id: string
  nama: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string
}

export function KasirListPage() {
  const router = useRouter()
  const [filters, setFilters] = useState<KasirFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [kasirToDelete, setKasirToDelete] = useState<Kasir | null>(null)

  // Use real API with React Query
  const { kasirs, isLoadingKasirs, deleteKasir } = useKasirManagement()

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    // Debounced search implementation
    const timeoutId = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: term }))
    }, 300)
    return () => clearTimeout(timeoutId)
  }

  const handleStatusFilter = (status: 'active' | 'inactive' | 'all') => {
    setFilters((prev) => ({
      ...prev,
      status: status === 'all' ? undefined : status,
    }))
  }

  const handleDelete = (kasir: Kasir) => {
    setKasirToDelete(kasir)
    setDeleteDialogOpen(true)
  }

  // Calculate summary statistics from API data
  const summaryStats = {
    total: kasirs?.length || 0,
    active: kasirs?.filter((k) => k.isActive).length || 0,
    inactive: kasirs?.filter((k) => !k.isActive).length || 0,
  }

  // Filter kasirs based on search and status filters
  const filteredKasirs =
    kasirs?.filter((kasir) => {
      const matchesSearch =
        !filters.search || kasir.nama.toLowerCase().includes(filters.search.toLowerCase())
      const matchesStatus =
        !filters.status || (filters.status === 'active' ? kasir.isActive : !kasir.isActive)
      return matchesSearch && matchesStatus
    }) || []

  const confirmDelete = async () => {
    if (!kasirToDelete) return

    try {
      // Use deleteKasir from useKasirManagement hook
      deleteKasir(kasirToDelete.id)
      toast.success('Kasir berhasil dihapus')
      setDeleteDialogOpen(false)
      setKasirToDelete(null)
    } catch (error) {
      console.error('Error deleting kasir:', error)
      toast.error('Gagal menghapus kasir')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manajemen Kasir</h1>
            <p className="text-gray-600 mt-1">Kelola data kasir untuk sistem transaksi</p>
          </div>
          <Button onClick={() => router.push('/owner/manage-kasir/add')}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Kasir
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Kasir</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kasir Aktif</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summaryStats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kasir Tidak Aktif</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{summaryStats.inactive}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari kasir berdasarkan nama..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={!filters.status ? 'default' : 'outline'}
                  onClick={() => handleStatusFilter('all')}
                  size="sm"
                >
                  Semua
                </Button>
                <Button
                  variant={filters.status === 'active' ? 'default' : 'outline'}
                  onClick={() => handleStatusFilter('active')}
                  size="sm"
                >
                  Aktif
                </Button>
                <Button
                  variant={filters.status === 'inactive' ? 'default' : 'outline'}
                  onClick={() => handleStatusFilter('inactive')}
                  size="sm"
                >
                  Tidak Aktif
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Kasir</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingKasirs ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Kasir</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Dibuat</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredKasirs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                          Tidak ada data kasir ditemukan
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredKasirs.map((kasir) => (
                        <TableRow key={kasir.id}>
                          <TableCell className="font-medium">{kasir.nama}</TableCell>
                          <TableCell>
                            <KasirStatusToggle
                              kasirId={kasir.id}
                              kasirName={kasir.nama}
                              isActive={kasir.isActive}
                              onToggleComplete={() => {
                                // Refresh data when toggle completes
                                window.location.reload()
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(kasir.createdAt).toLocaleDateString('id-ID')}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleDelete(kasir)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
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
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi Hapus Kasir</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menghapus kasir &quot;{kasirToDelete?.nama}&quot;? Tindakan
                ini tidak dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Batal
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Hapus
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

import { Users, UserCheck, UserX } from 'lucide-react'

// Error Boundary Wrapper
export function KasirListPageWithErrorBoundary() {
  return (
    <div>
      <KasirListPage />
    </div>
  )
}
