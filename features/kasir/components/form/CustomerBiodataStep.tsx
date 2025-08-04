'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Plus,
  User,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CustomerRegistrationModal } from './CustomerRegistrationModal'
import type { Customer, PenyewaResponse } from '../../types'
import { usePenyewaSearch, usePenyewaList } from '../../hooks/usePenyewa'

interface CustomerBiodataStepProps {
  selectedCustomer?: Customer
  onSelectCustomer: (customer: Customer) => void
  onNext: () => void
  onPrev: () => void
  canProceed: boolean
}

export function CustomerBiodataStep({
  selectedCustomer,
  onSelectCustomer,
  onNext,
  onPrev,
  canProceed,
}: CustomerBiodataStepProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)

  // Debounce search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Fetch customers - use search if query exists, otherwise get recent customers
  const {
    data: searchResults,
    isLoading: isSearching,
    error: searchError,
  } = usePenyewaSearch(debouncedSearchQuery, debouncedSearchQuery.length >= 2)

  const {
    data: allCustomersResponse,
    isLoading: isLoadingAll,
    error: allCustomersError,
  } = usePenyewaList({ limit: 20 })

  // Transform API data to Customer interface
  const transformPenyewaToCustomer = (penyewa: PenyewaResponse): Customer => ({
    id: penyewa.id,
    name: penyewa.nama,
    phone: penyewa.telepon,
    email: penyewa.email || '',
    address: penyewa.alamat,
    totalTransactions: 0, // This would need to come from API if needed
    createdAt: penyewa.createdAt,
  })

  const customers = useMemo(() => {
    if (debouncedSearchQuery.length >= 2 && searchResults?.data) {
      return searchResults.data.map(transformPenyewaToCustomer)
    } else if (allCustomersResponse?.data) {
      return allCustomersResponse.data.map(transformPenyewaToCustomer)
    }
    return []
  }, [searchResults, allCustomersResponse, debouncedSearchQuery])

  const isLoading = isSearching || isLoadingAll
  const error = searchError || allCustomersError

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleCustomerRegistered = (customer: Customer) => {
    onSelectCustomer(customer)
    setShowRegistrationModal(false)
    // Note: The customer list will be automatically updated via React Query invalidation
  }

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer)
  }

  const handleChangeCustomer = () => {
    // Reset selected customer to allow selection of a different one
    onSelectCustomer({} as Customer)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="customer-biodata-layout">
      {/* Search Customer */}
      <div
        className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 space-y-4"
        data-testid="customer-search-section"
      >
        <div className="flex items-center justify-between" data-testid="customer-search-header">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <User className="h-5 w-5" />
            Pilih Penyewa
          </div>
          <Button
            onClick={() => setShowRegistrationModal(true)}
            size="sm"
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"
            data-testid="add-new-customer-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Penyewa Baru
          </Button>
        </div>

        {/* Search Input */}
        <div className="relative" data-testid="customer-search-input-container">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari berdasarkan nama, telepon, atau email..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
            data-testid="customer-search-input"
          />
        </div>
      </div>

      {/* Selected Customer Display */}
      {selectedCustomer && selectedCustomer.id && (
        <div
          className="bg-green-50 border border-green-200 rounded-xl p-6"
          data-testid="selected-customer-display"
        >
          <div className="text-lg font-semibold text-green-800 mb-4">Penyewa Terpilih</div>
          <div
            className="bg-white rounded-lg p-6 space-y-4"
            data-testid="selected-customer-details"
          >
            <div className="flex items-center gap-4" data-testid="selected-customer-header">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-gray-900" />
              </div>
              <div>
                <div
                  className="text-xl font-semibold text-gray-900"
                  data-testid="selected-customer-name"
                >
                  {selectedCustomer.name}
                </div>
                <div
                  className="text-sm text-gray-600"
                  data-testid="selected-customer-transaction-count"
                >
                  {selectedCustomer.totalTransactions} transaksi sebelumnya
                </div>
              </div>
            </div>
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
              data-testid="selected-customer-contact-info"
            >
              <div
                className="flex items-center gap-3 text-gray-600"
                data-testid="selected-customer-phone"
              >
                <Phone className="h-4 w-4" />
                {selectedCustomer.phone}
              </div>
              {selectedCustomer.email && (
                <div
                  className="flex items-center gap-3 text-gray-600"
                  data-testid="selected-customer-email"
                >
                  <Mail className="h-4 w-4" />
                  {selectedCustomer.email}
                </div>
              )}
              <div
                className="flex items-start gap-3 text-gray-600 md:col-span-2"
                data-testid="selected-customer-address"
              >
                <MapPin className="h-4 w-4 mt-0.5" />
                {selectedCustomer.address}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleChangeCustomer}
              className="mt-4 bg-transparent"
              data-testid="change-customer-button"
            >
              Ganti Penyewa
            </Button>
          </div>
        </div>
      )}

      {/* Customer List */}
      {(!selectedCustomer || !selectedCustomer.id) && (
        <div
          className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden"
          data-testid="customer-list-section"
        >
          <div className="p-6 border-b border-gray-200/50" data-testid="customer-list-header">
            <div className="text-lg font-semibold text-gray-900" data-testid="customer-list-count">
              Daftar Penyewa ({isLoading ? '...' : customers.length})
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div
              className="flex items-center justify-center py-12"
              data-testid="customer-list-loading-state"
            >
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">
                {debouncedSearchQuery ? 'Mencari penyewa...' : 'Memuat daftar penyewa...'}
              </span>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="p-12 text-center text-gray-500" data-testid="customer-list-error-state">
              <User className="h-16 w-16 mx-auto mb-4 text-red-300" />
              <div className="text-lg text-red-600">Gagal memuat data penyewa</div>
              <div className="text-sm mt-1 text-gray-600">
                Terjadi kesalahan saat mengambil data penyewa
              </div>
            </div>
          )}

          {/* Customer List Content */}
          {!isLoading && !error && (
            <>
              <div className="max-h-96 overflow-y-auto" data-testid="customer-list-items">
                {customers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleSelectCustomer(customer)}
                    className="w-full p-6 text-left hover:bg-gray-50/50 transition-colors border-b border-gray-200/50 last:border-b-0"
                    data-testid={`customer-list-item-${customer.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-lg font-semibold text-gray-900"
                          data-testid={`customer-name-${customer.id}`}
                        >
                          {customer.name}
                        </div>
                        <div
                          className="text-sm text-gray-600 flex items-center gap-4 mt-1"
                          data-testid={`customer-contact-${customer.id}`}
                        >
                          <span>{customer.phone}</span>
                          {customer.email && <span>{customer.email}</span>}
                        </div>
                        <div
                          className="text-xs text-gray-500 mt-2"
                          data-testid={`customer-info-${customer.id}`}
                        >
                          {customer.totalTransactions} transaksi • Bergabung{' '}
                          {new Date(customer.createdAt).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {customers.length === 0 && !isLoading && (
                <div
                  className="p-12 text-center text-gray-500"
                  data-testid="customer-list-empty-state"
                >
                  <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <div className="text-lg">Tidak ada penyewa ditemukan</div>
                  <div className="text-sm mt-1">
                    {debouncedSearchQuery
                      ? 'Coba ubah kata kunci pencarian atau tambah penyewa baru'
                      : 'Belum ada penyewa terdaftar. Tambah penyewa baru untuk memulai'}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Navigation */}
      <div
        className="flex items-center justify-between pt-6"
        data-testid="customer-step-navigation"
      >
        <Button variant="outline" onClick={onPrev} data-testid="step-2-prev-button">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Produk
        </Button>

        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"
          data-testid="step-2-next-button"
        >
          Lanjut ke Pembayaran
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Customer Registration Modal */}
      <div data-testid="customer-registration-modal-container">
        <CustomerRegistrationModal
          isOpen={showRegistrationModal}
          onClose={() => setShowRegistrationModal(false)}
          onCustomerRegistered={handleCustomerRegistered}
        />
      </div>
    </div>
  )
}
