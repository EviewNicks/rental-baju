'use client'

import type React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { DollarSign, TrendingUp, Wallet, Calculator } from 'lucide-react'
import { formatCurrency } from '@/features/manage-product/lib/utils/product'
import type { Product } from '@/features/manage-product/types'
import type { FinancialSummary } from '../../lib/utils/financialSummary'
import { formatFinancialMetrics, hasFinancialData } from '../../lib/utils/financialSummary'

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
  financialData?: FinancialSummary
  className?: string
}

export function PricingCard({ product, financialData, className }: PricingCardProps) {
  const modalAwal = Number(product.modalAwal)
  const hargaSewa = Number(product.currentPrice)

  return (
    <Card
      className={`h-fit hover:shadow-xl transition-all duration-300 border-l-4 border-l-yellow-400 ${className}`}
    >
      <CardHeader className="pb">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-yellow-600" />
          Informasi Harga
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Modal Awal */}
        <InfoField label="Modal Awal">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(modalAwal)}</p>
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
                <p className="text-3xl font-bold text-yellow-700">{formatCurrency(hargaSewa)}</p>
              </div>
            </div>
          </div>
        </InfoField>

        {/* Financial Summary from History Data */}
        {financialData && hasFinancialData(financialData) && (
          <FinancialSummarySection financialData={financialData} />
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Financial Summary Section Component
 * Displays financial summary from actual transaction history data
 */
function FinancialSummarySection({ financialData }: { financialData: FinancialSummary }) {
  const formattedMetrics = formatFinancialMetrics(financialData, formatCurrency)

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-100">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          Ringkasan Transaksi
        </h3>
        <p className="text-xs text-gray-500">Berdasarkan riwayat sewa aktual</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Revenue */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-600">Total Pendapatan</span>
          </div>
          <div className="text-lg font-bold text-green-700">
            {formattedMetrics.totalRevenueFormatted}
          </div>
        </div>

        {/* Total Transactions */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Calculator className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Transaksi</span>
          </div>
          <div className="text-lg font-bold text-blue-700">
            {formattedMetrics.totalTransactionsFormatted}
          </div>
        </div>
      </div>
    </div>
  )
}
