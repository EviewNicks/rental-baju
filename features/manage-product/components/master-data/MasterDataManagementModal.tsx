'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CategoryManagement } from '../category/CategoryManagement'

interface MasterDataManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

export function MasterDataManagementModal({
  isOpen,
  onClose,
}: MasterDataManagementModalProps) {
  const handleModalClose = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Kelola Data Master</h2>
              <p className="text-sm text-gray-600 mt-1">
                Atur kategori produk untuk organisasi inventaris yang lebih baik
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <CategoryManagement />
      </DialogContent>
    </Dialog>
  )
}
