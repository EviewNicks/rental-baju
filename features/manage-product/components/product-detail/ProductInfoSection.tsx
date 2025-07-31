'use client'

import type React from 'react'

import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/features/manage-product/lib/utils/product'
import { getStatusBadge, getCategoryBadge } from '@/features/manage-product/lib/utils/product'
import type { Product } from '@/features/manage-product/types'

interface InfoFieldProps {
  label: string
  children: React.ReactNode
  className?: string
}

function InfoField({ label, children, className }: InfoFieldProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label className="text-sm font-medium text-gray-500">{label}</Label>
      <div>{children}</div>
    </div>
  )
}

interface InfoSectionProps {
  title: string
  children: React.ReactNode
  className?: string
}

function InfoSection({ title, children, className }: InfoSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">{title}</h3>
      {children}
    </div>
  )
}

interface ProductInfoSectionProps {
  product: Product
  className?: string
}

export function ProductInfoSection({ product, className }: ProductInfoSectionProps) {
  // Utility function untuk memastikan tanggal valid
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) {
      return 'Tidak tersedia'
    }

    try {
      // Konversi ke Date object jika string
      const dateObj = typeof date === 'string' ? new Date(date) : date

      // Validasi apakah Date valid
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
    <div className={`space-y-6 ${className}`}>
      {/* Informasi Dasar */}
      <InfoSection title="Informasi Dasar">
        <div className="grid grid-cols-1 gap-4">
          <InfoField label="Kode Produk">
            <p className="font-mono text-lg font-semibold text-gray-900">{product.code}</p>
          </InfoField>

          <InfoField label="Nama Produk">
            <p className="text-xl font-semibold text-gray-900">{product.name}</p>
          </InfoField>

          <InfoField label="Kategori">
            <Badge variant="outline" className={getCategoryBadge(product.category.color)}>
              {product.category.name}
            </Badge>
          </InfoField>

          {product.size && (
            <InfoField label="Ukuran">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                {product.size}
              </Badge>
            </InfoField>
          )}

          {product.description && (
            <InfoField label="Deskripsi">
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </InfoField>
          )}
        </div>
      </InfoSection>

      {/* Informasi Warna */}
      {product.color && (
        <InfoSection title="Informasi Warna">
          <div className="grid grid-cols-1 gap-4">
            <InfoField label="Nama Warna">
              <div className="flex items-center gap-3">
                <div 
                  className="w-6 h-6 rounded-full border-2 border-gray-300 shadow-sm"
                  style={{ backgroundColor: product.color.hexCode || '#gray' }}
                  title={`Kode Warna: ${product.color.hexCode}`}
                />
                <p className="text-lg font-semibold text-gray-900">{product.color.name}</p>
              </div>
            </InfoField>

            {product.color.hexCode && (
              <InfoField label="Kode Hex">
                <div className="flex items-center gap-2">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                    {product.color.hexCode}
                  </code>
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: product.color.hexCode }}
                  />
                </div>
              </InfoField>
            )}

            {product.color.description && (
              <InfoField label="Deskripsi Warna">
                <p className="text-gray-600 leading-relaxed">{product.color.description}</p>
              </InfoField>
            )}
          </div>
        </InfoSection>
      )}

      {/* Informasi Harga */}
      <InfoSection title="Informasi Harga">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField label="Modal Awal">
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(Number(product.modalAwal))}
            </p>
          </InfoField>

          <InfoField label="Harga Sewa">
            <p className="text-lg font-semibold text-yellow-600">
              {formatCurrency(Number(product.hargaSewa))}
            </p>
          </InfoField>
        </div>
      </InfoSection>

      {/* Status & Inventaris */}
      <InfoSection title="Status & Inventaris">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoField label="Status">
            <Badge variant="outline" className={getStatusBadge(product.status)}>
              {product.status}
            </Badge>
          </InfoField>

          <InfoField label="Jumlah Stok">
            <p className="text-lg font-semibold text-gray-900">{product.quantity} pcs</p>
          </InfoField>

          <InfoField label="Total Pendapatan">
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(Number(product.totalPendapatan))}
            </p>
          </InfoField>
        </div>
      </InfoSection>

      {/* Informasi Sistem */}
      <InfoSection title="Informasi Sistem">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField label="Dibuat Pada">
            <p className="text-sm text-gray-600">{formatDate(product.createdAt)}</p>
          </InfoField>

          <InfoField label="Terakhir Diupdate">
            <p className="text-sm text-gray-600">{formatDate(product.updatedAt)}</p>
          </InfoField>
        </div>
      </InfoSection>
    </div>
  )
}
