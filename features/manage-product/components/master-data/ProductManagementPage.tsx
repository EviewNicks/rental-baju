'use client'

import { TabNavigation, useTabNavigation } from './TabNavigation'
import { MaterialManagement } from '../material/MaterialManagement'
import { CategoryManagement } from '../category/CategoryManagement'
import { ColorManagement } from '../color/ColorManagement'

export function ProductManagementPage() {
  const { activeTab, switchTab } = useTabNavigation()

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kelola Data Master Produk</h1>
        <p className="text-sm text-gray-600 mt-1">
          Atur material, kategori, dan warna produk untuk organisasi inventaris yang lebih baik
        </p>
      </div>

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={switchTab} />

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