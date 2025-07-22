'use client'

import { useState } from 'react'
import { Search, Plus, User, Phone, Mail, MapPin, ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CustomerRegistrationModal } from './CustomerRegistrationModal'
import type { Customer } from '../../types/customer'
import { mockCustomers } from '../../lib/mock-customer'

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
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [filteredCustomers, setFilteredCustomers] = useState(mockCustomers)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    const filtered = mockCustomers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query.toLowerCase()) ||
        customer.phone.includes(query) ||
        customer.email?.toLowerCase().includes(query.toLowerCase()),
    )
    setFilteredCustomers(filtered)
  }

  const handleCustomerRegistered = (customer: Customer) => {
    // Add to mock customers (in real app, this would be handled by API)
    mockCustomers.push(customer)
    setFilteredCustomers([...mockCustomers])
    onSelectCustomer(customer)
    setShowRegistrationModal(false)
  }

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer)
  }

  const handleChangeCustomer = () => {
    // Reset selected customer to allow selection of a different one
    onSelectCustomer({} as Customer)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search Customer */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <User className="h-5 w-5" />
            Pilih Penyewa
          </div>
          <Button
            onClick={() => setShowRegistrationModal(true)}
            size="sm"
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Penyewa Baru
          </Button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari berdasarkan nama, telepon, atau email..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Selected Customer Display */}
      {selectedCustomer && selectedCustomer.id && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="text-lg font-semibold text-green-800 mb-4">Penyewa Terpilih</div>
          <div className="bg-white rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-gray-900" />
              </div>
              <div>
                <div className="text-xl font-semibold text-gray-900">{selectedCustomer.name}</div>
                <div className="text-sm text-gray-600">
                  {selectedCustomer.totalTransactions} transaksi sebelumnya
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3 text-gray-600">
                <Phone className="h-4 w-4" />
                {selectedCustomer.phone}
              </div>
              {selectedCustomer.email && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="h-4 w-4" />
                  {selectedCustomer.email}
                </div>
              )}
              <div className="flex items-start gap-3 text-gray-600 md:col-span-2">
                <MapPin className="h-4 w-4 mt-0.5" />
                {selectedCustomer.address}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleChangeCustomer}
              className="mt-4 bg-transparent"
            >
              Ganti Penyewa
            </Button>
          </div>
        </div>
      )}

      {/* Customer List */}
      {(!selectedCustomer || !selectedCustomer.id) && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden">
          <div className="p-6 border-b border-gray-200/50">
            <div className="text-lg font-semibold text-gray-900">
              Daftar Penyewa ({filteredCustomers.length})
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {filteredCustomers.map((customer) => (
              <button
                key={customer.id}
                onClick={() => handleSelectCustomer(customer)}
                className="w-full p-6 text-left hover:bg-gray-50/50 transition-colors border-b border-gray-200/50 last:border-b-0"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-semibold text-gray-900">{customer.name}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-4 mt-1">
                      <span>{customer.phone}</span>
                      {customer.email && <span>{customer.email}</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {customer.totalTransactions} transaksi • Bergabung{' '}
                      {new Date(customer.createdAt).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {filteredCustomers.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <div className="text-lg">Tidak ada penyewa ditemukan</div>
              <div className="text-sm mt-1">
                Coba ubah kata kunci pencarian atau tambah penyewa baru
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Produk
        </Button>

        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"
        >
          Lanjut ke Pembayaran
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Customer Registration Modal */}
      <CustomerRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        onCustomerRegistered={handleCustomerRegistered}
      />
    </div>
  )
}
