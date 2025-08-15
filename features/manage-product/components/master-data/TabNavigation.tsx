'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Package, Tag, Palette } from 'lucide-react'

export type TabValue = 'material' | 'category' | 'color'

interface TabNavigationProps {
  activeTab: TabValue
  onTabChange: (tab: TabValue) => void
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as TabValue)} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="material" className="flex items-center gap-2">
          <Package className="w-4 h-4" />
          Kelola Material
        </TabsTrigger>
        <TabsTrigger value="category" className="flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Kelola Kategori
        </TabsTrigger>
        <TabsTrigger value="color" className="flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Kelola Warna
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

// Hook for hash routing functionality
export function useTabNavigation() {
  const [activeTab, setActiveTab] = useState<TabValue>('material')

  useEffect(() => {
    // Read hash on mount
    const hash = window.location.hash.slice(1) as TabValue
    if (['material', 'category', 'color'].includes(hash)) {
      setActiveTab(hash)
    }
  }, [])

  const switchTab = (tab: TabValue) => {
    setActiveTab(tab)
    window.location.hash = tab
  }

  return { activeTab, switchTab }
}