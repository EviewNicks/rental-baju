'use client'

import { Edit, Trash2, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Category } from '@/features/manage-product/types'
import { getContrastTextColor, lightenColor } from '@/features/manage-product/lib/utils/color'

interface CategoryListProps {
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  loading?: boolean
}

export function CategoryList({ categories, onEdit, onDelete, loading }: CategoryListProps) {
  if (loading) {
    return <CategoryListSkeleton />
  }

  if (categories.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Kategori Tersedia</h3>
      <div className="space-y-3">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-lg hover:border-yellow-200 transition-all duration-200"
          >
            <div className="flex items-center space-x-4">
              <Badge
                variant="outline"
                style={{
                  backgroundColor: lightenColor(category.color, 85),
                  color: getContrastTextColor(lightenColor(category.color, 85)),
                  borderColor: category.color,
                }}
                className="font-medium rounded-full"
              >
                {category.name}
              </Badge>
              <span className="text-sm text-gray-500">{category.products.length} produk</span>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(category)}
                className="text-gray-600"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(category)}
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

function CategoryListSkeleton() {
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
              <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
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
        <Tag className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada kategori</h3>
      <p className="text-gray-600">
        Mulai dengan menambahkan kategori pertama untuk mengorganisir produk Anda
      </p>
    </div>
  )
}
