'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface NavigationTabsProps {
  isLoading?: boolean
}

const tabs = [
  { id: 'renters', label: 'Penyewa', count: 156 },
  { id: 'rentals', label: 'Penyewaan', count: 89 },
  { id: 'returns', label: 'Pengembalian', count: 23 },
  { id: 'payments', label: 'Pembayaran', count: 45 },
]

export function NavigationTabs({ isLoading = false }: NavigationTabsProps) {
  const [activeTab, setActiveTab] = useState('renters')

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-neutral-300 p-2">
        <nav className="flex space-x-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-32 rounded-xl" />
          ))}
        </nav>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-neutral-300 p-2">
      <nav className="flex space-x-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200',
              activeTab === tab.id
                ? 'bg-lime-400 text-black shadow-md transform scale-105'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100',
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                'px-3 py-1 rounded-full text-xs font-bold',
                activeTab === tab.id ? 'bg-black text-lime-500' : 'bg-neutral-200 text-neutral-600',
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </nav>
    </div>
  )
}
