'use client'

import { Edit, Trash2, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Color } from '../../types/color'

interface ColorListProps {
  colors: Color[]
  onEdit: (color: Color) => void
  onDelete: (color: Color) => void
  loading?: boolean
}

export function ColorList({ colors, onEdit, onDelete, loading }: ColorListProps) {
  if (loading) {
    return <ColorListSkeleton />
  }

  if (colors.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-4 w-full">
      <h3 className="text-lg font-semibold text-gray-900">Warna Tersedia</h3>
      <div className="space-y-3">
        {colors.map((color) => (
          <div
            key={color.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-lg hover:border-yellow-200 transition-all duration-200"
          >
            <div className="flex items-center space-x-4">
              <div
                className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm flex-shrink-0"
                style={{ backgroundColor: color.hexCode }}
              />

              {/* Color Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-gray-900">{color.name}</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {color.hexCode}
                  </Badge>
                </div>
 
                <p className="text-xs text-gray-500 mt-1">
                  {color.product_count} produk menggunakan warna ini
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(color)}
                className="text-gray-600"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(color)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ColorListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
          >
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        <Palette className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada warna</h3>
      <p className="text-gray-600">
        Mulai dengan menambahkan warna pertama untuk katalog produk Anda
      </p>
    </div>
  )
}
