'use client'

import { Edit, Trash2, Phone, MapPin, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Renter } from '@/features/rentals-manage/types'

interface RentersTableProps {
  renters: Renter[]
  onEdit: (renter: Renter) => void
  onDelete: (renter: Renter) => void
  isLoading: boolean
}

export function RentersTable({ renters, onEdit, onDelete, isLoading }: RentersTableProps) {
  if (isLoading) {
    return <TableSkeleton />
  }

  if (renters.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-neutral-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-100 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">
                Kode Unik
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Nama</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Kontak</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Alamat</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Status</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-900">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {renters.map((renter, index) => (
              <tr
                key={renter.id}
                className={`hover:bg-lime-50 transition-colors duration-150 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-neutral-50'
                }`}
              >
                <td className="px-6 py-4">
                  <Badge variant="outline" className="font-mono text-xs border-neutral-200">
                    {renter.unique_code}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{renter.name}</p>
                    {renter.identity_number && (
                      <p className="text-xs text-neutral-500 font-mono">{renter.identity_number}</p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-1 text-sm text-neutral-800">
                    <Phone className="h-3 w-3 text-neutral-400" />
                    <span>{renter.phone}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-start space-x-1 text-sm text-neutral-800 max-w-xs">
                    <MapPin className="h-3 w-3 text-neutral-400 mt-0.5 flex-shrink-0" />
                    <span className="truncate">{renter.address}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge className="bg-lime-100 text-lime-800 hover:bg-lime-100 rounded-full px-3 py-1 font-medium">
                    Aktif
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(renter)}
                      className="text-lime-600 hover:text-lime-700 hover:bg-lime-50 rounded-lg"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(renter)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-md border border-neutral-200 overflow-hidden">
      <div className="p-6 space-y-4">
        {/* Header skeleton */}
        <div className="flex items-center space-x-4 pb-4 border-b border-neutral-200">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-20" />
          ))}
        </div>
        {/* Row skeletons */}
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-4 py-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-12 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="h-8 w-8 text-neutral-400" />
        </div>
        <h3 className="text-lg font-medium text-neutral-900 mb-2">Belum ada penyewa</h3>
        <p className="text-neutral-500 mb-6">
          Mulai tambahkan penyewa pertama Anda untuk mengelola data rental.
        </p>
        <Button className="bg-lime-500 hover:bg-lime-600 text-black">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Penyewa Pertama
        </Button>
      </div>
    </div>
  )
}
