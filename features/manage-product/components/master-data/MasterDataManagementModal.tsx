'use client'

import { useState } from 'react'
import { Tag, Palette } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CategoryManagement } from '../category/CategoryManagement'
import { ColorManagement } from '../color/ColorManagement'

interface MasterDataManagementModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: 'categories' | 'colors'
}

export function MasterDataManagementModal({
  isOpen,
  onClose,
  defaultTab = 'categories',
}: MasterDataManagementModalProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

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
                Atur kategori dan warna produk untuk organisasi inventaris yang lebih baik
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'categories' | 'colors')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Kelola Kategori
            </TabsTrigger>
            <TabsTrigger value="colors" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Kelola Warna
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="mt-6">
            <CategoryManagement />
          </TabsContent>

          <TabsContent value="colors" className="mt-6">
            <ColorManagement />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
