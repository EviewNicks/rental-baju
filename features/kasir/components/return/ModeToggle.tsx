'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Package2, Layers3, Info } from 'lucide-react'
import type { ModeToggleProps } from '../../types/multiConditionReturn'

/**
 * Mode Toggle Component
 * Allows switching between single and multi-condition modes for items with quantity > 1
 */
export function ModeToggle({
  mode,
  onModeChange,
  disabled = false,
  itemQuantity,
  showLabels = true,
}: ModeToggleProps) {
  // Don't show toggle for single quantity items
  if (itemQuantity <= 1) {
    return null
  }

  return (
    <Card className="p-3 bg-blue-50 border-blue-200">
      <div className="space-y-3">
        {/* Info Header */}
        <div className="flex items-center gap-2 text-blue-700 text-sm">
          <Info className="h-4 w-4" />
          <span className="font-medium">
            Item ini memiliki {itemQuantity} unit. Pilih cara pengembalian:
          </span>
        </div>

        {/* Toggle Buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={mode === 'single' ? 'default' : 'outline'}
            onClick={() => onModeChange('single')}
            disabled={disabled}
            className={`flex items-center gap-2 transition-all ${
              mode === 'single' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'border-blue-300 text-blue-700 hover:bg-blue-100'
            }`}
          >
            <Package2 className="h-4 w-4" />
            <span>Kondisi Sama</span>
            {mode === 'single' && <Badge variant="secondary" className="ml-1 text-xs">Aktif</Badge>}
          </Button>

          <Button
            size="sm"
            variant={mode === 'multi' ? 'default' : 'outline'}
            onClick={() => onModeChange('multi')}
            disabled={disabled}
            className={`flex items-center gap-2 transition-all ${
              mode === 'multi' 
                ? 'bg-green-600 text-white shadow-md' 
                : 'border-green-300 text-green-700 hover:bg-green-100'
            }`}
          >
            <Layers3 className="h-4 w-4" />
            <span>Kondisi Berbeda</span>
            {mode === 'multi' && <Badge variant="secondary" className="ml-1 text-xs">Aktif</Badge>}
          </Button>
        </div>

        {/* Mode Descriptions */}
        {showLabels && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className={`p-2 rounded border ${
              mode === 'single' 
                ? 'bg-blue-100 border-blue-300 text-blue-800' 
                : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}>
              <div className="font-medium mb-1">Kondisi Sama</div>
              <div>Semua {itemQuantity} unit dalam kondisi yang sama</div>
              <div className="text-xs opacity-75 mt-1">
                • Proses lebih cepat
                • Untuk pengembalian sederhana
              </div>
            </div>

            <div className={`p-2 rounded border ${
              mode === 'multi' 
                ? 'bg-green-100 border-green-300 text-green-800' 
                : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}>
              <div className="font-medium mb-1">Kondisi Berbeda</div>
              <div>Unit berbeda dengan kondisi masing-masing</div>
              <div className="text-xs opacity-75 mt-1">
                • Penalty lebih akurat
                • Untuk kasus kompleks
              </div>
            </div>
          </div>
        )}

        {/* Current Selection Summary */}
        <div className={`text-xs font-medium ${
          mode === 'single' ? 'text-blue-700' : 'text-green-700'
        }`}>
          {mode === 'single' 
            ? `✓ Akan memproses ${itemQuantity} unit dengan kondisi yang sama`
            : `✓ Akan memproses unit secara terpisah dengan kondisi masing-masing`
          }
        </div>
      </div>
    </Card>
  )
}