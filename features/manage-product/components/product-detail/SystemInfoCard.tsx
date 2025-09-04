'use client'

import type React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Clock, Calendar, Info } from 'lucide-react'
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

interface SystemInfoCardProps {
  product: Product
  className?: string
}

export function SystemInfoCard({ product, className }: SystemInfoCardProps) {
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) {
      return 'Tidak tersedia'
    }

    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      if (isNaN(dateObj.getTime())) {
        return 'Tanggal tidak valid'
      }

      return dateObj.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Tanggal tidak valid'
    }
  }

  return (
    <Card className={`h-fit hover:shadow-xl transition-all duration-300 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Info className="w-5 h-5 text-gray-600" />
          Informasi Sistem
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <InfoField label="Dibuat Pada">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <Calendar className="w-4 h-4 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">
                {formatDate(product.createdAt)}
              </p>
              <p className="text-xs text-green-600">Tanggal pembuatan</p>
            </div>
          </div>
        </InfoField>

        <InfoField label="Terakhir Diupdate">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                {formatDate(product.updatedAt)}
              </p>
              <p className="text-xs text-blue-600">Pembaruan terakhir</p>
            </div>
          </div>
        </InfoField>

        {/* System Meta Info */}
        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
              <span className="text-xs text-gray-500">Status Sistem</span>
              <span className="text-xs font-medium text-green-600">Aktif</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
              <span className="text-xs text-gray-500">ID Produk</span>
              <code className="text-xs font-mono text-gray-700 bg-white px-2 py-1 rounded border">
                {product.id}
              </code>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}