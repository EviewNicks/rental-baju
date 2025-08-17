'use client'

import { TabNavigation, useTabNavigation, type TabValue } from './TabNavigation'
import { MaterialManagement } from '../material/MaterialManagement'
import { CategoryManagement } from '../category/CategoryManagement'
import { ColorManagement } from '../color/ColorManagement'
import { PageNavigation } from '../shared/PageNavigation'
import { logger } from '@/services/logger'
import { useEffect } from 'react'

// Component-specific logger for product management page
const pageLogger = logger.child('ProductManagementPage')

export function ProductManagementPage() {
  const { activeTab, switchTab } = useTabNavigation()

  // Log component mount and initialization
  useEffect(() => {
    pageLogger.info('componentMount', 'Product Management Page mounted', {
      initialTab: activeTab
    })
  }, [activeTab])

  // Log tab changes for user behavior tracking
  useEffect(() => {
    pageLogger.info('tabChange', 'User navigated to different tab', {
      activeTab,
      timestamp: Date.now()
    })
  }, [activeTab])

  // Enhanced tab switching with logging
  const handleTabChange = (tab: string) => {
    pageLogger.info('handleTabChange', 'User initiated tab change', {
      fromTab: activeTab,
      toTab: tab,
      userAction: 'click'
    })
    switchTab(tab as TabValue)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Navigation */}
      <PageNavigation 
        currentPage="Data Master Produk"
        parentPath="/producer/manage-product"
        parentLabel="Kelola Produk"
        className="mb-4"
      />

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kelola Data Master Produk</h1>
        <p className="text-sm text-gray-600 mt-1">
          Atur material, kategori, dan warna produk untuk organisasi inventaris yang lebih baik
        </p>
      </div>

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'material' && (
          <div className="space-y-6">
            <MaterialManagement />
          </div>
        )}
        
        {activeTab === 'category' && (
          <div className="space-y-6">
            <CategoryManagement />
          </div>
        )}
        
        {activeTab === 'color' && (
          <div className="space-y-6">
            <ColorManagement />
          </div>
        )}
      </div>
    </div>
  )
}