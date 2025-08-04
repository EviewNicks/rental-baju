'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { TransactionStatus } from '../../types'
import { useTransactions } from '../../hooks/useTransactions'
import { TransactionTabs } from './TransactionTabs'
import { TransactionTable } from './TransactionsTable'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function TransactionsDashboard() {
  const [activeTab, setActiveTab] = useState<TransactionStatus | 'all'>('all')
  const { transactions, filters, updateFilters, isLoading, counts, error, refreshTransactions } =
    useTransactions()

  const handleTabChange = (tab: TransactionStatus | 'all') => {
    setActiveTab(tab)
    updateFilters({
      status: tab === 'all' ? undefined : tab,
    })
  }

  const handleSearchChange = (search: string) => {
    updateFilters({ search })
  }

  // Handle error state
  if (error) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4"
        data-testid="kasir-main-content"
      >
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center space-y-2" data-testid="kasir-header">
            <h1 className="text-2xl font-bold text-gray-900" data-testid="kasir-title">
              RentalBaju
            </h1>
            <p className="text-gray-600" data-testid="kasir-subtitle">
              Daftar Transaksi Penyewaan
            </p>
          </div>

          <div
            className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"
            data-testid="error-boundary"
          >
            <div className="text-red-600 mb-2">⚠️ Terjadi Kesalahan</div>
            <p className="text-red-700 mb-4" data-testid="error-message">
              {error.message || 'Gagal memuat data transaksi'}
            </p>
            <Button
              onClick={refreshTransactions}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="retry-button"
            >
              Coba Lagi
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4"
      data-testid="kasir-main-content"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2" data-testid="kasir-header">
          <h1 className="text-2xl font-bold text-gray-900" data-testid="kasir-title">
            RentalBaju
          </h1>
          <p className="text-gray-600" data-testid="kasir-subtitle">
            Daftar Transaksi Penyewaan
          </p>
        </div>

        {/* Add Transaction Button */}
        <div className="flex justify-end">
          <Link href="/dashboard/new" data-testid="add-transaction-link">
            <Button
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium shadow-lg shadow-yellow-400/25"
              data-testid="add-transaction-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Transaksi
            </Button>
          </Link>
        </div>

        {/* Tabs and Search */}
        <TransactionTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          searchValue={filters.search || ''}
          onSearchChange={handleSearchChange}
          counts={counts}
        />

        {/* Transactions Table */}
        <TransactionTable transactions={transactions} isLoading={isLoading} />
      </div>
    </div>
  )
}
