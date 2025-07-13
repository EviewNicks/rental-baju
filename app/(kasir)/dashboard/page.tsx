'use client'

import { useState } from 'react'
import { DashboardHeader } from '@/features/rentals-manage/components/DashboardHeader'
import { NavigationTabs } from '@/features/rentals-manage/components/NavigationTabs'
import { SearchActionsBar } from '@/features/rentals-manage/components/SearchActionBar'
import { RentersTable } from '@/features/rentals-manage/components/RentersTable'
import { Pagination } from '@/features/rentals-manage/components/Pagination'
import { RenterFormModal } from '@/features/rentals-manage/components/RenterFormModal'
import { DeleteConfirmationModal } from '@/features/rentals-manage/components/DeleteComfirmationModal'

export interface Renter {
  id: string
  unique_code: string
  name: string
  phone: string
  address: string
  identity_number?: string
  created_at: string
  updated_at: string
}

// Mock data
const mockRenters: Renter[] = [
  {
    id: '1',
    unique_code: 'RNT001',
    name: 'Siti Nurhaliza',
    phone: '08123456789',
    address: 'Jl. Merdeka No. 123, Jakarta Pusat',
    identity_number: '3171234567890123',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    unique_code: 'RNT002',
    name: 'Ahmad Rizki',
    phone: '08234567890',
    address: 'Jl. Sudirman No. 456, Jakarta Selatan',
    identity_number: '3172345678901234',
    created_at: '2024-01-16T14:20:00Z',
    updated_at: '2024-01-16T14:20:00Z',
  },
  {
    id: '3',
    unique_code: 'RNT003',
    name: 'Maya Sari',
    phone: '08345678901',
    address: 'Jl. Gatot Subroto No. 789, Jakarta Barat',
    created_at: '2024-01-17T09:15:00Z',
    updated_at: '2024-01-17T09:15:00Z',
  },
  {
    id: '4',
    unique_code: 'RNT004',
    name: 'Budi Santoso',
    phone: '08456789012',
    address: 'Jl. Thamrin No. 321, Jakarta Pusat',
    identity_number: '3174567890123456',
    created_at: '2024-01-18T16:45:00Z',
    updated_at: '2024-01-18T16:45:00Z',
  },
  {
    id: '5',
    unique_code: 'RNT005',
    name: 'Dewi Lestari',
    phone: '08567890123',
    address: 'Jl. Kuningan No. 654, Jakarta Selatan',
    created_at: '2024-01-19T11:30:00Z',
    updated_at: '2024-01-19T11:30:00Z',
  },
]

export default function RentersManagementPage() {
  const [renters, setRenters] = useState<Renter[]>(mockRenters)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedRenter, setSelectedRenter] = useState<Renter | null>(null)
  const [renterToDelete, setRenterToDelete] = useState<Renter | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading] = useState(false)

  // Filter renters based on search query
  const filteredRenters = renters.filter(
    (renter) =>
      renter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      renter.phone.includes(searchQuery) ||
      renter.unique_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      renter.address.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Pagination
  const totalItems = filteredRenters.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRenters = filteredRenters.slice(startIndex, endIndex)

  const handleAddRenter = () => {
    setSelectedRenter(null)
    setIsFormModalOpen(true)
  }

  const handleEditRenter = (renter: Renter) => {
    setSelectedRenter(renter)
    setIsFormModalOpen(true)
  }

  const handleDeleteRenter = (renter: Renter) => {
    setRenterToDelete(renter)
    setIsDeleteModalOpen(true)
  }

  const handleSaveRenter = async (renterData: Partial<Renter>) => {
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (selectedRenter) {
      // Update existing renter
      setRenters((prev) =>
        prev.map((renter) =>
          renter.id === selectedRenter.id
            ? { ...renter, ...renterData, updated_at: new Date().toISOString() }
            : renter,
        ),
      )
    } else {
      // Add new renter
      const newRenter: Renter = {
        id: Date.now().toString(),
        unique_code: `RNT${String(renters.length + 1).padStart(3, '0')}`,
        name: renterData.name || '',
        phone: renterData.phone || '',
        address: renterData.address || '',
        identity_number: renterData.identity_number,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setRenters((prev) => [...prev, newRenter])
    }

    setIsLoading(false)
    setIsFormModalOpen(false)
  }

  const handleConfirmDelete = async () => {
    if (!renterToDelete) return

    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setRenters((prev) => prev.filter((renter) => renter.id !== renterToDelete.id))
    setIsLoading(false)
    setIsDeleteModalOpen(false)
    setRenterToDelete(null)
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <DashboardHeader isLoading={isPageLoading} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NavigationTabs isLoading={isPageLoading} />

        <div className="mt-8 space-y-6">
          <SearchActionsBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddClick={handleAddRenter}
            isLoading={isPageLoading}
          />

          <RentersTable
            renters={currentRenters}
            onEdit={handleEditRenter}
            onDelete={handleDeleteRenter}
            isLoading={isLoading || isPageLoading}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            isLoading={isPageLoading}
          />
        </div>
      </main>

      <RenterFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveRenter}
        renter={selectedRenter}
        isLoading={isLoading}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        renterName={renterToDelete?.name || ''}
        isLoading={isLoading}
      />
    </div>
  )
}
