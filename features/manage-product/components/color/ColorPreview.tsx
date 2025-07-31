'use client'

import { Badge } from '@/components/ui/badge'

interface ColorPreviewProps {
  name: string
  hexValue: string
  description?: string
  className?: string
}

export function ColorPreview({ name, hexValue, description, className }: ColorPreviewProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <label className="text-sm font-medium text-gray-700">Preview Warna</label>
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4">
          {/* Color Circle */}
          <div
            className="w-12 h-12 rounded-full border-2 border-gray-300 shadow-sm"
            style={{ backgroundColor: hexValue }}
          />

          {/* Color Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-medium text-gray-900">{name || 'Nama Warna'}</span>
              <Badge variant="outline" className="font-mono text-xs">
                {hexValue}
              </Badge>
            </div>
            {description && <p className="text-sm text-gray-600">{description}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
