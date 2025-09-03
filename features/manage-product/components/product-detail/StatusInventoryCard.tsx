'use client'

import type React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Package, CheckCircle, XCircle, AlertTriangle, BarChart3 } from 'lucide-react'
import { getStatusBadge } from '@/features/manage-product/lib/utils/product'
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

interface StatusInventoryCardProps {
  product: Product
  className?: string
}

export function StatusInventoryCard({ product, className }: StatusInventoryCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          bg: 'bg-green-50',
          border: 'border-l-green-400',
          icon: CheckCircle,
          iconColor: 'text-green-600'
        }
      case 'RENTED':
        return {
          bg: 'bg-blue-50',
          border: 'border-l-blue-400', 
          icon: Package,
          iconColor: 'text-blue-600'
        }
      case 'MAINTENANCE':
        return {
          bg: 'bg-yellow-50',
          border: 'border-l-yellow-400',
          icon: AlertTriangle,
          iconColor: 'text-yellow-600'
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-l-gray-400',
          icon: XCircle,
          iconColor: 'text-gray-600'
        }
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return { label: 'Tersedia', desc: 'Siap untuk disewakan' }
      case 'RENTED':
        return { label: 'Disewa', desc: 'Sedang dalam penyewaan' }
      case 'MAINTENANCE':
        return { label: 'Perawatan', desc: 'Sedang dalam perbaikan' }
      default:
        return { label: status, desc: 'Status tidak diketahui' }
    }
  }

  const statusConfig = getStatusColor(product.status)
  const statusText = getStatusText(product.status)
  const StatusIcon = statusConfig.icon

  // Calculate availability based on actual stock data
  const rentedQuantity = Math.max(0, Math.min(product.rentedStock || 0, product.quantity))
  const availableQuantity = Math.max(0, product.quantity - rentedQuantity)
  const maintenanceQuantity = 0 // Not tracked in current data model

  return (
    <Card className={`h-fit hover:shadow-xl transition-all duration-300 border-l-4 ${statusConfig.border} ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          Status & Inventaris
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <InfoField label="Status Produk">
          <div className={`p-4 ${statusConfig.bg} rounded-lg border ${statusConfig.border.replace('border-l-', 'border-')}`}>
            <div className="flex items-center gap-3">
              <StatusIcon className={`w-5 h-5 ${statusConfig.iconColor}`} />
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${getStatusBadge(product.status)}`}>
                    {statusText.label}
                  </Badge>
                </div>
                <p className={`text-sm mt-1 ${statusConfig.iconColor}`}>
                  {statusText.desc}
                </p>
              </div>
            </div>
          </div>
        </InfoField>

        {/* Inventory Summary */}
        <InfoField label="Jumlah Stok">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <Package className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{product.quantity}</p>
                <p className="text-sm text-gray-500">Total unit</p>
              </div>
            </div>
          </div>
        </InfoField>

        {/* Detailed Inventory Breakdown */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Rincian Ketersediaan</h4>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Tersedia</span>
              </div>
              <span className="text-lg font-bold text-green-600">{availableQuantity}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Disewa</span>
              </div>
              <span className="text-lg font-bold text-blue-600">{rentedQuantity}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-700">Perawatan</span>
              </div>
              <span className="text-lg font-bold text-yellow-600">{maintenanceQuantity}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}