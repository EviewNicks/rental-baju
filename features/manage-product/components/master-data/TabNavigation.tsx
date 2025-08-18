'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Package, Tag, Palette } from 'lucide-react'
import { logger } from '@/services/logger'

// Component-specific logger for tab navigation
const navLogger = logger.child('TabNavigation')

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
    const validTabs = ['material', 'category', 'color']
    
    navLogger.debug('hashRouting', 'Initializing tab from URL hash', {
      currentHash: hash,
      isValidTab: validTabs.includes(hash),
      defaultTab: 'material'
    })
    
    if (validTabs.includes(hash)) {
      setActiveTab(hash)
      navLogger.info('hashRouting', 'Tab initialized from URL hash', {
        initialTab: hash
      })
    } else {
      navLogger.debug('hashRouting', 'Using default tab (invalid or empty hash)', {
        hash,
        defaultTab: 'material'
      })
    }
  }, [])

  const switchTab = (tab: TabValue) => {
    const previousTab = activeTab
    
    navLogger.info('switchTab', 'Switching active tab', {
      fromTab: previousTab,
      toTab: tab,
      method: 'hash_routing'
    })
    
    setActiveTab(tab)
    window.location.hash = tab
    
    navLogger.debug('switchTab', 'Tab switch completed', {
      newActiveTab: tab,
      urlHash: window.location.hash
    })
  }

  return { activeTab, switchTab }
}