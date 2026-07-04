'use client'

import type { TransactionStatus } from '../../types'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Search, Loader2 } from 'lucide-react'
import { statusConfig } from '../../lib/constants/uiConfig'
import { useSearchDebounce } from '../../hooks/optimization/useDebounce'
import { DateFilter } from '../ui/DateFilter'
import { ResetButton } from '../ui/ResetButton'

interface TransactionTabsProps {
  activeTab: TransactionStatus | 'all'
  onTabChange: (tab: TransactionStatus | 'all') => void
  searchValue: string
  onSearchChange: (value: string) => void
  counts: {
    active: number
    diambil: number
    completed: number
    overdue: number
    cancelled: number
    total: number
  }
  // New date filter props
  dateValue: string | null
  onDateChange: (date: string | null) => void
  // Date created filter props (new)
  dateCreatedValue: string | null
  onDateCreatedChange: (date: string | null) => void
  onResetFilters: () => void
  hasActiveFilters: boolean
  isLoading?: boolean
  isDateCreatedLoading?: boolean
  isSearchLoading?: boolean
}

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  isLoading?: boolean
}

// Dynamic tab configuration based on statusConfig
const TAB_ORDER: (TransactionStatus | 'all')[] = ['all', 'active', 'diambil', 'selesai', 'terlambat', 'cancelled']

interface TabConfig {
  value: TransactionStatus | 'all'
  label: string
  countKey: keyof TransactionTabsProps['counts']
  testId: string
}

function getTabConfiguration(): TabConfig[] {
  return TAB_ORDER.map((status) => {
    if (status === 'all') {
      return {
        value: 'all',
        label: 'Semua',
        countKey: 'total' as const,
        testId: 'tab-all'
      }
    }

    const config = statusConfig[status]
    const countKeyMap: Record<TransactionStatus, keyof TransactionTabsProps['counts']> = {
      active: 'active',
      diambil: 'diambil',
      selesai: 'completed',
      terlambat: 'overdue',
      cancelled: 'cancelled',
      pending_resolution: 'total' // Map pending_resolution to total for now
    }

    return {
      value: status,
      label: config?.label || status,
      countKey: countKeyMap[status],
      testId: `tab-${status}`
    }
  })
}

function SearchInput({
  value,
  onChange,
  placeholder = 'Cari transaksi...',
  className,
  isLoading = false,
}: SearchInputProps) {
  const { isPending, handleKeyPress, handleClear } = useSearchDebounce(
    value,
    onChange,
    500 // Increased from 300ms to 500ms for better performance
  )

  // Use external loading state if provided, otherwise use internal pending state
  const showLoading = isLoading || isPending

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
  }

  const handleClearClick = () => {
    handleClear()
  }

  return (
    <div className={cn('relative', className)}>
      {showLoading ? (
        <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500 h-4 w-4 animate-spin" />
      ) : (
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
      )}
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        className={cn(
          "pl-10 bg-white/80 backdrop-blur-sm border-gray-200 focus:border-yellow-400 focus:ring-yellow-400/20",
          showLoading && "pr-10" // Add padding for clear button when typing
        )}
        data-testid="search-input"
      />
      {value && (
        <button
          onClick={handleClearClick}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 h-4 w-4 flex items-center justify-center"
          data-testid="search-clear-button"
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  )
}

export function TransactionTabs({
  activeTab,
  onTabChange,
  searchValue,
  onSearchChange,
  counts,
  dateValue,
  onDateChange,
  dateCreatedValue,
  onDateCreatedChange,
  onResetFilters,
  hasActiveFilters,
  isLoading = false,
  isDateCreatedLoading = false,
  isSearchLoading = false,
}: TransactionTabsProps) {
  const tabConfigs = getTabConfiguration()

  return (
    <div className="space-y-4 w-full">
      {/* Row 1: Status Navigation Tabs */}
      <div className="w-full overflow-x-auto pb-1">
        <Tabs
          value={activeTab}
          onValueChange={(val) => onTabChange(val as TransactionStatus | 'all')}
          className="w-full"
          data-testid="transaction-tabs"
        >
          <TabsList>
            {tabConfigs.map(({ value, label, countKey, testId }) => (
              <TabsTrigger key={value} value={value} data-testid={testId}>
                {label}{' '}
                <span className="ml-1 text-xs text-muted-foreground">
                  ({counts[countKey]})
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      
      {/* Row 2: Search & Filter Row */}
      <div className="flex flex-col md:flex-row gap-4 items-end w-full bg-white/50 p-4 rounded-xl border border-gray-200/50 backdrop-blur-sm shadow-sm">
        {/* Search Input Box */}
        <div className="flex flex-col gap-1.5 w-full md:flex-1 min-w-[240px]">
          <label className="text-xs font-semibold text-gray-500 pl-1 uppercase tracking-wider">
            Pencarian
          </label>
          <SearchInput
            value={searchValue}
            onChange={onSearchChange}
            placeholder="Cari kode transaksi, nama penyewa..."
            className="w-full"
            isLoading={isSearchLoading}
          />
        </div>

        {/* Date Filter: Tanggal Pembuatan Transaksi */}
        <div className="flex flex-col gap-1.5 w-full md:w-48 flex-shrink-0">
          <label className="text-xs font-semibold text-gray-500 pl-1 uppercase tracking-wider">
            Tanggal Dibuat
          </label>
          <DateFilter
            value={dateCreatedValue}
            onChange={onDateCreatedChange}
            placeholder="Pilih tanggal..."
            className="w-full"
            isLoading={isDateCreatedLoading}
          />
        </div>

        {/* Date Filter: Tanggal Mulai Sewa */}
        <div className="flex flex-col gap-1.5 w-full md:w-48 flex-shrink-0">
          <label className="text-xs font-semibold text-gray-500 pl-1 uppercase tracking-wider">
            Tanggal Sewa
          </label>
          <DateFilter
            value={dateValue}
            onChange={onDateChange}
            placeholder="Pilih tanggal..."
            className="w-full"
            isLoading={isLoading}
          />
        </div>

        {/* Reset Filter Action */}
        <div className="w-full md:w-auto self-end flex-shrink-0">
          <ResetButton
            onReset={onResetFilters}
            hasActiveFilters={hasActiveFilters}
            className="w-full md:w-auto"
          />
        </div>
      </div>
    </div>
  )
}
