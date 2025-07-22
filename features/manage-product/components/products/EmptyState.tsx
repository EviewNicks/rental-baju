'use client'

import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
  onReset: () => void
}

export function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <Card className="shadow-sm" data-testid="empty-state">
      <CardContent className="p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center" data-testid="empty-state-icon">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2" data-testid="empty-state-title">Tidak ada produk ditemukan</h3>
        <p className="text-gray-600 mb-4" data-testid="empty-state-message">Coba ubah filter atau kata kunci pencarian Anda</p>
        <Button variant="outline" onClick={onReset} data-testid="reset-filter-button">
          Reset Filter
        </Button>
      </CardContent>
    </Card>
  )
}
