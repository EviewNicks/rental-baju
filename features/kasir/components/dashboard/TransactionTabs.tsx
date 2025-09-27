'use client'

import type { TransactionStatus } from '../../types'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'
import { statusConfig } from '../../lib/constants/uiConfig'

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
}

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
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
      cancelled: 'cancelled'
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
}: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 bg-white/80 backdrop-blur-sm border-gray-200 focus:border-yellow-400 focus:ring-yellow-400/20"
        data-testid="search-input"
      />
    </div>
  )
}

export function TransactionTabs({
  activeTab,
  onTabChange,
  searchValue,
  onSearchChange,
  counts,
}: TransactionTabsProps) {
  const tabConfigs = getTabConfiguration()

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
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
        <SearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder="Cari transaksi..."
          className="w-full sm:w-80"
        />
      </div>
    </div>
  )
}
