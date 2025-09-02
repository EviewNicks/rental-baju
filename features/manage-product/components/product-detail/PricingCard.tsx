'use client'

import type React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { DollarSign, TrendingUp, Wallet, Calculator } from 'lucide-react'
import { formatCurrency } from '@/features/manage-product/lib/utils/product'
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

interface PricingCardProps {
  product: Product
  className?: string
}

export function PricingCard({ product, className }: PricingCardProps) {
  const modalAwal = Number(product.modalAwal)
  const hargaSewa = Number(product.currentPrice)
  const totalPendapatan = Number(product.totalPendapatan || 0)

  // Calculate potential ROI
  const potentialROI = modalAwal > 0 ? ((hargaSewa * 30 - modalAwal) / modalAwal * 100) : 0

  return (
    <Card className={`h-fit hover:shadow-xl transition-all duration-300 border-l-4 border-l-yellow-400 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-yellow-600" />
          Informasi Harga
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Modal Awal */}
        <InfoField label="Modal Awal">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(modalAwal)}
                </p>
                <p className="text-sm text-gray-500">Investasi awal produk</p>
              </div>
            </div>
          </div>
        </InfoField>

        {/* Harga Sewa */}
        <InfoField label="Harga Sewa">
          <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-3xl font-bold text-yellow-700">
                  {formatCurrency(hargaSewa)}
                </p>
                <p className="text-sm text-yellow-600 font-medium">Per hari sewa</p>
              </div>
            </div>
          </div>
        </InfoField>

        {/* Revenue & ROI Section */}
        <div className="pt-4 border-t border-gray-200 space-y-4">
          <InfoField label="Total Pendapatan">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <Calculator className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xl font-semibold text-green-600">
                  {formatCurrency(totalPendapatan)}
                </p>
                <p className="text-xs text-green-500">Total yang sudah diperoleh</p>
              </div>
            </div>
          </InfoField>

          {/* Potential Monthly ROI */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 font-medium">Estimasi ROI Bulanan</p>
                <p className="text-sm font-semibold text-blue-700">
                  {potentialROI > 0 ? `${potentialROI.toFixed(1)}%` : 'Tidak tersedia'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-600">Target pendapatan</p>
                <p className="text-sm font-semibold text-blue-700">
                  {formatCurrency(hargaSewa * 30)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}