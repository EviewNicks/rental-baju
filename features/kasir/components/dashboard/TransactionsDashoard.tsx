'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { TransactionStatus } from '../../types'
import { useTransactions } from '../../hooks/useTransactions'
import { useURLFilters } from '../../hooks/useURLFilters'
import { TransactionTabs } from './TransactionTabs'
import { TransactionTable } from './TransactionsTable'
import { TransactionPagination } from './TransactionPagination'
import { Button } from '@/components/ui/button'
import { AuthenticationControls } from '@/features/auth/components/AuthenticationControls'
import { Plus, Shirt, Wallet, RefreshCw } from 'lucide-react'

export function TransactionsDashboard() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TransactionStatus | 'all'>('all')
  const [isInitialized, setIsInitialized] = useState(false)
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
    isDateCreatedFiltering,
    isSearching,
    pagination,
    currentPage,
    setPage,
  } = useTransactions()

  // Initialize URL filters hook for state persistence
  const { parseFiltersFromURL, updateURL } = useURLFilters()

  // Initialize filters from URL on component mount (ONLY ONCE)
  useEffect(() => {
    if (isInitialized) return // Skip if already initialized

    const urlFilters = parseFiltersFromURL()

    console.log('[PAGINATION_DEBUG] Initializing from URL:', {
      urlFilters,
      currentPage,
      isInitialized,
    })

    // Set active tab from URL status parameter
    if (urlFilters.status) {
      setActiveTab(urlFilters.status)
    } else {
      setActiveTab('all')
    }

    // Set page from URL parameter
    if (urlFilters.page) {
      console.log('[PAGINATION_DEBUG] Setting page from URL:', urlFilters.page)
      setPage(urlFilters.page)
    }

    // Update filters from URL parameters WITHOUT resetting page
    if (Object.keys(urlFilters).length > 0) {
      const { ...filtersWithoutPage } = urlFilters
      console.log('[PAGINATION_DEBUG] Updating filters (no page reset):', filtersWithoutPage)
      updateFilters(filtersWithoutPage, { resetPage: false })
    }

    setIsInitialized(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - run only once on mount

  // Update URL when filters, active tab, or page change (ONLY AFTER INITIALIZATION)
  useEffect(() => {
    if (!isInitialized) return // Skip until initialized

    console.log('[PAGINATION_DEBUG] Updating URL:', {
      filters,
      activeTab,
      currentPage,
      isInitialized,
    })

    updateURL(filters, activeTab, currentPage)
  }, [filters, activeTab, currentPage, updateURL, isInitialized])

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
    console.log('[PAGINATION_DEBUG] Tab changed:', tab)
    setActiveTab(tab)
    setPage(1) // Reset to page 1 when tab changes
    updateFilters(
      {
        status: tab === 'all' ? undefined : tab,
      },
      { resetPage: false },
    ) // Don't reset page in updateFilters, we already did it
  }

  const handleSearchChange = (search: string) => {
    console.log('[PAGINATION_DEBUG] Search changed:', search)

    // Only reset page if search value actually changed (not just empty → empty)
    const previousSearch = filters.search || ''
    const newSearch = search || ''

    if (previousSearch !== newSearch) {
      setPage(1) // Reset to page 1 when search changes
    }

    updateFilters({ search }, { resetPage: false })
  }

  const handleDateChange = (dateFilter: string | null) => {
    console.log('[PAGINATION_DEBUG] Date filter changed:', dateFilter)

    // Only reset page if date filter actually changed
    const previousDate = filters.dateFilter || null
    const newDate = dateFilter || null

    if (previousDate !== newDate) {
      setPage(1) // Reset to page 1 when date filter changes
    }

    updateFilters({ dateFilter: dateFilter || undefined }, { resetPage: false })
  }

  const handleDateCreatedChange = (dateCreated: string | null) => {
    console.log('[PAGINATION_DEBUG] Date created filter changed:', dateCreated)

    const previousDate = filters.dateCreated || null
    const newDate = dateCreated || null

    if (previousDate !== newDate) {
      setPage(1)
    }

    updateFilters({ dateCreated: dateCreated || undefined }, { resetPage: false })
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
        <div
          className="bg-white/95 backdrop-blur-sm border-b border-neutral-100 sticky top-0 z-50"
          data-testid="kasir-auth-nav"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-12">
              {/* Brand/Logo */}
              <Link
                href="/"
                className="flex items-center space-x-2 group"
                data-testid="kasir-brand-link"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-gold-500 to-gold-600 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                  <Shirt className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-neutral-900 transition-colors duration-200 group-hover:text-gold-500">
                  Erlima Mode
                </span>
              </Link>

              {/* Authentication Controls */}
              <div className="hidden md:flex">
                <AuthenticationControls showDashboardLink={true} showLogo={false} />
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
      <div
        className="bg-white/95 backdrop-blur-sm border-b border-neutral-100 sticky top-0 z-50"
        data-testid="kasir-auth-nav"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            {/* Brand/Logo */}
            <Link
              href="/"
              className="flex items-center space-x-2 group"
              data-testid="kasir-brand-link"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-gold-500 to-gold-600 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                <Shirt className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-neutral-900 transition-colors duration-200 group-hover:text-gold-500">
                Erlima Mode
              </span>
            </Link>

            {/* Authentication Controls */}
            <div className="hidden md:flex">
              <AuthenticationControls showDashboardLink={true} showLogo={false} />
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
      <div className="p-4" data-testid="kasir-main-content">
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
            {/* ✅ PHASE 2: Manual Refresh Button */}
            <Button
              onClick={refreshTransactions}
              variant="outline"
              disabled={isLoading}
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 font-medium shadow-sm"
              data-testid="refresh-button"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              {isLoading ? 'Memuat...' : 'Refresh Data'}
            </Button>

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
            dateCreatedValue={filters.dateCreated || null}
            onDateCreatedChange={handleDateCreatedChange}
            onResetFilters={handleResetFilters}
            hasActiveFilters={hasActiveFilters}
            counts={counts}
            isLoading={isDateFiltering}
            isDateCreatedLoading={isDateCreatedFiltering}
            isSearchLoading={isSearching}
          />

          {/* Transactions Table */}
          <TransactionTable transactions={transactions} isLoading={isLoading} />

          {/* Pagination */}
          {pagination && pagination.total > 0 && (
            <TransactionPagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={setPage}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  )
}
