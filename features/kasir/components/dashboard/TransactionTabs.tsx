'use client'

import type { TransactionStatus } from '../../types/transaction'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'

interface TransactionTabsProps {
  activeTab: TransactionStatus | 'all'
  onTabChange: (tab: TransactionStatus | 'all') => void
  searchValue: string
  onSearchChange: (value: string) => void
  counts: {
    active: number
    completed: number
    overdue: number
    total: number
  }
}

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
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
            <TabsTrigger value="all" data-testid="tab-all">
              Semua <span className="ml-1 text-xs text-muted-foreground">({counts.total})</span>
            </TabsTrigger>
            <TabsTrigger value="active" data-testid="tab-active">
              Aktif <span className="ml-1 text-xs text-muted-foreground">({counts.active})</span>
            </TabsTrigger>
            <TabsTrigger value="selesai" data-testid="tab-selesai">
              Selesai{' '}
              <span className="ml-1 text-xs text-muted-foreground">({counts.completed})</span>
            </TabsTrigger>
            <TabsTrigger value="terlambat" data-testid="tab-terlambat">
              Terlambat{' '}
              <span className="ml-1 text-xs text-muted-foreground">({counts.overdue})</span>
            </TabsTrigger>
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
