'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { TransactionStatus } from '../../types'
import { useTransactions } from '../../hooks/useTransactions'
import { useURLFilters } from '../../hooks/useURLFilters'
import { TransactionTabs } from './TransactionTabs'
import { TransactionTable } from './TransactionsTable'
import { Button } from '@/components/ui/button'
import { AuthenticationControls } from '@/features/auth/components/AuthenticationControls'
import { Plus, Shirt, Wallet } from 'lucide-react'

export function TransactionsDashboard() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TransactionStatus | 'all'>('all')
  const { 
    transactions, 
    filters, 
    updateFilters, 
    resetAllFilters, 
    hasActiveFilters, 
    isLoading, 
    counts, 
    error, 
    refreshTransactions,
    isDateFiltering,
    isSearching
  } = useTransactions()

  // Initialize URL filters hook for state persistence
  const { parseFiltersFromURL, updateURL } = useURLFilters()

  // Initialize filters from URL on component mount
  useEffect(() => {
    const urlFilters = parseFiltersFromURL()
    
    // Set active tab from URL status parameter
    if (urlFilters.status) {
      setActiveTab(urlFilters.status)
    } else {
      setActiveTab('all')
    }
    
    // Update filters from URL parameters
    if (Object.keys(urlFilters).length > 0) {
      updateFilters(urlFilters)
    }
  }, [parseFiltersFromURL, updateFilters])

  // Update URL when filters or active tab change
  useEffect(() => {
    updateURL(filters, activeTab)
  }, [filters, activeTab, updateURL])

  // Check for refresh parameter and trigger refresh if needed
  useEffect(() => {
    const shouldRefresh = searchParams.get('refresh')
    if (shouldRefresh === 'true') {
      refreshTransactions()
      // Clean up URL by removing the refresh parameter
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [searchParams, refreshTransactions])

  const handleTabChange = (tab: TransactionStatus | 'all') => {
    setActiveTab(tab)
    updateFilters({
      status: tab === 'all' ? undefined : tab,
    })
  }

  const handleSearchChange = (search: string) => {
    updateFilters({ search })
  }

  const handleDateChange = (dateFilter: string | null) => {
    updateFilters({ dateFilter: dateFilter || undefined })
  }

  const handleResetFilters = () => {
    setActiveTab('all')
    resetAllFilters()
  }

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Top Tier: Authentication Navigation */}
        <div className="bg-white/95 backdrop-blur-sm border-b border-neutral-100 sticky top-0 z-50" data-testid="kasir-auth-nav">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-12">
              {/* Brand/Logo */}
              <Link href="/" className="flex items-center space-x-2 group" data-testid="kasir-brand-link">
                <div className="w-8 h-8 bg-gradient-to-br from-gold-500 to-gold-600 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                  <Shirt className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-neutral-900 transition-colors duration-200 group-hover:text-gold-500">
                  Erlima Mode
                </span>
              </Link>

              {/* Authentication Controls */}
              <div className="hidden md:flex">
                <AuthenticationControls 
                  showDashboardLink={true}
                  showLogo={false} 
                />
              </div>

              {/* Mobile Authentication Menu */}
              <div className="md:hidden">
                <AuthenticationControls 
                  showDashboardLink={true}
                  showLogo={false}
                  className="space-x-2" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error Content */}
        <div className="p-4" data-testid="kasir-main-content">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="text-center space-y-2" data-testid="kasir-header">
              <h1 className="text-2xl font-bold text-gray-900" data-testid="kasir-title">
                Dashboard Kasir
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
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Tier: Authentication Navigation */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-neutral-100 sticky top-0 z-50" data-testid="kasir-auth-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            {/* Brand/Logo */}
            <Link href="/" className="flex items-center space-x-2 group" data-testid="kasir-brand-link">
              <div className="w-8 h-8 bg-gradient-to-br from-gold-500 to-gold-600 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                <Shirt className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-neutral-900 transition-colors duration-200 group-hover:text-gold-500">
                Erlima Mode
              </span>
            </Link>

            {/* Authentication Controls */}
            <div className="hidden md:flex">
              <AuthenticationControls 
                showDashboardLink={true}
                showLogo={false} 
              />
            </div>

            {/* Mobile Authentication Menu */}
            <div className="md:hidden">
              <AuthenticationControls 
                showDashboardLink={true}
                showLogo={false}
                className="space-x-2" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className="p-4"
        data-testid="kasir-main-content"
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="text-center space-y-2" data-testid="kasir-header">
            <h1 className="text-2xl font-bold text-gray-900" data-testid="kasir-title">
              Dashboard Kasir
            </h1>
            <p className="text-gray-600" data-testid="kasir-subtitle">
              Daftar Transaksi Penyewaan
            </p>
          </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          {/* Dana Kasir Button */}
          <Link href="/dana-kasir" data-testid="dana-kasir-link">
            <Button
              variant="outline"
              className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 font-medium shadow-sm"
              data-testid="dana-kasir-button"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Dana Kasir
            </Button>
          </Link>

          {/* Add Transaction Button */}
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
          dateValue={filters.dateFilter || null}
          onDateChange={handleDateChange}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
          counts={counts}
          isLoading={isDateFiltering}
          isSearchLoading={isSearching}
        />

          {/* Transactions Table */}
          <TransactionTable transactions={transactions} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
