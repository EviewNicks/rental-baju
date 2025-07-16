'use client'

import { Badge } from '@/components/ui/badge'
import { generateCategoryColors } from '@/features/manage-product/lib/utils/color'

interface CategoryBadgePreviewProps {
  name: string
  color: string
  className?: string
}

export function CategoryBadgePreview({ name, color, className }: CategoryBadgePreviewProps) {
  const colors = generateCategoryColors(color)

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700">Preview Badge</label>
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <Badge
          variant="outline"
          style={{
            backgroundColor: colors.bg_color,
            color: colors.text_color,
            borderColor: colors.color,
          }}
          className="font-medium"
        >
          {name || 'Nama Kategori'}
        </Badge>
      </div>
    </div>
  )
}
