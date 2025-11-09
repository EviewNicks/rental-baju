'use client'

import type React from 'react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Wallet } from 'lucide-react'
import {
  getStatusBadge,
  getCategoryBadge,
  formatCurrency,
} from '@/features/manage-product/lib/utils/product'
import { MaterialCostDisplay } from '@/features/manage-product/components/material/MaterialCostDisplay'
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

        {product.sizes && product.sizes.length > 0 && (
          <InfoField label="Ukuran">
            <div className="flex flex-wrap gap-1">
              {product.sizes.slice(0, 3).map((size, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-blue-50 text-blue-700 border-blue-200 text-sm font-medium"
                >
                  {size.size} ({size.ageCategory})
                </Badge>
              ))}
              {product.sizes.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{product.sizes.length - 3} lainnya
                </Badge>
              )}
            </div>
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
  const modalAwal = Number(product.modalAwal)
  const hargaSewa = Number(product.currentPrice)

  return (
    <Card className="h-fit hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
          Informasi Produk
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Product Name */}
        <div className="space-y-3">
          <h2 className="text-3xl font-bold text-gray-900 leading-tight">{product.name}</h2>
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

          {product.sizes && product.sizes.length > 0 && (
            <div className="text-center p-2 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-600 font-medium">Ukuran </p>
              <div className="flex flex-wrap gap-1 justify-center mt-1">
                {product.sizes.slice(0, 2).map((size, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200 text-sm font-medium py-1 px-2"
                  >
                    {size.size} ({size.ageCategory})
                  </Badge>
                ))}
                {product.sizes.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{product.sizes.length - 2}
                  </Badge>
                )}
              </div>
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

        {/* Pricing Information */}
        <div className="space-y-4">
          <div className="text-lg font-semibold text-gray-900">Informasi Harga</div>

          {/* Modal Awal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Modal Awal</label>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(modalAwal)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Harga Sewa */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Harga Sewa</label>
              <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-3xl font-bold text-yellow-700">
                      {formatCurrency(hargaSewa)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Material Information */}
        {product.material && (
          <div className="space-y-4">
            <div className="text-lg font-semibold text-gray-900">Informasi Material</div>
            <MaterialCostDisplay
              selectedMaterial={product.material}
              materialQuantity={product.materialQuantity || 0}
              materialCost={product.materialCost || 0}
            />
          </div>
        )}

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
