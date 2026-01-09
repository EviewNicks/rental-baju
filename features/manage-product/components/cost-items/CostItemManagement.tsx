'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { CostItemList } from './CostItemList'
import { CostItemModal } from './cost-item-modal'
import { ManageProductErrorBoundary } from '../shared/ManageProductErrorBoundary'
import { logger } from '@/services/logger'

// Component-specific logger for cost item management
const componentLogger = logger.child('CostItemManagement')

interface CostItemManagementProps {
  className?: string
}

function CostItemManagementContent({ className }: CostItemManagementProps) {
  const searchParams = useSearchParams()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Get current page and search from URL params
  const page = parseInt(searchParams.get('page') || '1', 10)
  const search = searchParams.get('search') || ''

  // Log component mount
  React.useEffect(() => {
    componentLogger.debug('CostItemManagementContent', 'Component mounted', {
      page,
      search,
      hasSearch: !!search
    })
  }, [page, search])

  const handleCreateSuccess = () => {
    setRefreshTrigger(prev => prev + 1) // Trigger refresh
  }

  return (
    <div className={`space-y-6 w-full ${className}`}>
      {/* Cost Item List */}
      <CostItemList 
        page={page} 
        search={search} 
        refreshTrigger={refreshTrigger}
        onRefreshTrigger={() => setRefreshTrigger(prev => prev + 1)}
      />

      {/* Add Cost Item Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-yellow-400 hover:bg-yellow-500 text-black flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Tambah Cost Item
        </Button>
      </div>

      {/* Create Modal */}
      <CostItemModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}

export function CostItemManagement(props: CostItemManagementProps) {
  return (
    <ManageProductErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Terjadi Kesalahan</h3>
          <p className="text-gray-600 mb-4">
            Maaf, terjadi kesalahan saat memuat halaman manajemen cost item. 
            Silakan refresh halaman atau hubungi administrator jika masalah berlanjut.
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-yellow-400 hover:bg-yellow-500 text-black"
          >
            Refresh Halaman
          </Button>
        </div>
      }
    >
      <CostItemManagementContent {...props} />
    </ManageProductErrorBoundary>
  )
}