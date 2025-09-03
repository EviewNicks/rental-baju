'use client'

import type React from 'react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getStatusBadge, getCategoryBadge } from '@/features/manage-product/lib/utils/product'
import type { Product } from '@/features/manage-product/types'

interface InfoFieldProps {
  label: string
  children: React.ReactNode
  className?: string
}

function InfoField({ label, children, className }: InfoFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium text-gray-500">{label}</Label>
      <div>{children}</div>
    </div>
  )
}

interface BasicInfoCardProps {
  product: Product
}

// BasicInfoCard replaced by EnhancedBasicInfoCard - keeping for backward compatibility if needed elsewhere
export function BasicInfoCard({ product }: BasicInfoCardProps) {
  return (
    <Card className="h-fit hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">Informasi Dasar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <InfoField label="Nama Produk">
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">{product.name}</h2>
        </InfoField>

        <InfoField label="Kode Produk">
          <p className="font-mono text-lg font-semibold text-gray-700 bg-gray-50 px-3 py-2 rounded-md">
            {product.code}
          </p>
        </InfoField>

        <InfoField label="Kategori">
          <Badge
            variant="outline"
            className={`${getCategoryBadge(product.category.color)} text-sm font-medium`}
          >
            {product.category.name}
          </Badge>
        </InfoField>

        {product.size && (
          <InfoField label="Ukuran">
            <Badge
              variant="secondary"
              className="bg-blue-50 text-blue-700 border-blue-200 text-sm font-medium"
            >
              {product.size}
            </Badge>
          </InfoField>
        )}

        {product.description && (
          <InfoField label="Deskripsi">
            <p className="text-gray-600 leading-relaxed text-sm">{product.description}</p>
          </InfoField>
        )}
      </CardContent>
    </Card>
  )
}

// PricingCard moved to separate file: ./PricingCard.tsx

// StatusInventoryCard moved to separate file: ./StatusInventoryCard.tsx

// ColorInfoCard deprecated - color information now integrated into EnhancedBasicInfoCard
// interface ColorInfoCardProps {
//   product: Product
// }

// export function ColorInfoCard({ product }: ColorInfoCardProps) {
//   if (!product.color) return null
//   ...
// }
// Removed - functionality moved to EnhancedBasicInfoCard

// SystemInfoCard moved to separate file: ./SystemInfoCard.tsx

interface EnhancedBasicInfoCardProps {
  product: Product
}

export function EnhancedBasicInfoCard({ product }: EnhancedBasicInfoCardProps) {
  return (
    <Card className="h-fit hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
          Informasi Produk
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Product Name + Color (if exists) */}
        <div className="space-y-3">
          <h2 className="text-3xl font-bold text-gray-900 leading-tight">{product.name}</h2>
          {product.color && (
            <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border-2 border-gray-300 shadow-sm"
                  style={{ backgroundColor: product.color.hexCode || '#gray' }}
                  title={`Kode Warna: ${product.color.hexCode}`}
                />
                <span className="text-lg font-medium text-gray-700">{product.color.name}</span>
              </div>
              {product.color.hexCode && (
                <code className="text-sm bg-white px-3 py-1 rounded border border-gray-200 font-mono">
                  {product.color.hexCode}
                </code>
              )}
            </div>
          )}
        </div>

        {/* Product Code */}
        <InfoField label="Kode Produk">
          <p className="font-mono text-xl font-semibold text-gray-700 bg-gray-50 px-4 py-3 rounded-lg border">
            {product.code}
          </p>
        </InfoField>

        {/* Category + Size */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="text-center p-2 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-600 font-medium">Kategori</p>
            <Badge
              variant="outline"
              className={`${getCategoryBadge(product.category.color)} text-base font-medium py-2 mt-1`}
            >
              {product.category.name}
            </Badge>
          </div>

          {product.size && (
            <div className="text-center p-2 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-600 font-medium">Ukuran </p>
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200 text-base font-medium py-2 px-4"
              >
                {product.size}
              </Badge>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="pb-4 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-600 font-medium">Status</p>
              <Badge variant="outline" className={`${getStatusBadge(product.status)} mt-1`}>
                {product.status}
              </Badge>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-600 font-medium">Stok</p>
              <p className="text-lg font-bold ">{product.quantity} pcs</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <InfoField label="Deskripsi">
            <p className="text-gray-600 leading-relaxed text-base bg-gray-50 p-4 rounded-lg border">
              {product.description}
            </p>
          </InfoField>
        )}
      </CardContent>
    </Card>
  )
}
