'use client'

import { useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Calculator, 
  AlertTriangle, 
  Clock, 
  Package, 
  DollarSign,
  Info,
  CheckCircle
} from 'lucide-react'
import type { TransaksiDetail } from '../../types'
import type {
  EnhancedItemCondition,
  MultiConditionPenaltyResult
} from '../../types'

// Enhanced Penalty Display Props
interface EnhancedPenaltyDisplayProps {
  transaction: TransaksiDetail
  itemConditions: Record<string, EnhancedItemCondition>
  penaltyCalculation?: MultiConditionPenaltyResult | null
  onPenaltyCalculated?: (calculation: MultiConditionPenaltyResult) => void
  showBreakdown?: boolean
  compactView?: boolean
  isCalculating?: boolean
}

export function PenaltyDisplay({ 
  transaction, 
  itemConditions,
  penaltyCalculation: externalCalculation,
  onPenaltyCalculated,
  isCalculating = false
}: EnhancedPenaltyDisplayProps) {

  // Use external calculation or create fallback
  const calculation = externalCalculation

  // Processing mode detection
  const processingMode = useMemo(() => {
    if (!itemConditions || Object.keys(itemConditions).length === 0) {
      return 'single-condition'
    }

    let hasSimple = 0
    let hasMulti = 0

    for (const condition of Object.values(itemConditions)) {
      if (condition.mode === 'multi' && condition.conditions.length > 1) {
        hasMulti++
      } else {
        hasSimple++
      }
    }

    if (hasMulti === 0) return 'single-condition'
    if (hasSimple === 0) return 'multi-condition'
    return 'mixed'
  }, [itemConditions])


  // Notify parent when calculation changes
  useEffect(() => {
    if (calculation && onPenaltyCalculated) {
      onPenaltyCalculated(calculation)
    }
  }, [calculation, onPenaltyCalculated])

  const getConditionColor = (kondisiAkhir: string) => {
    if (kondisiAkhir.toLowerCase().includes('hilang')) return 'text-red-600'
    if (kondisiAkhir.toLowerCase().includes('buruk')) return 'text-orange-600'
    if (kondisiAkhir.toLowerCase().includes('cukup')) return 'text-yellow-600'
    return 'text-green-600'
  }

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`
  }

  // Loading state
  if (isCalculating) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-3">
          <Calculator className="h-5 w-5 animate-spin" />
          <span>Menghitung penalty...</span>
        </div>
      </Card>
    )
  }

  // No calculation state
  if (!calculation) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Lengkapi kondisi barang terlebih dahulu untuk melihat perhitungan penalty.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Processing Mode */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calculator className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Perhitungan Penalty</h3>
              <p className="text-sm text-blue-700 mt-1">
                {processingMode === 'multi-condition' 
                  ? 'Multi-kondisi: Penalty per kondisi berbeda' 
                  : processingMode === 'mixed'
                    ? 'Campuran: Sebagian item multi-kondisi'
                    : 'Kondisi tunggal: Standard processing'
                }
              </p>
            </div>
          </div>
          <Badge variant="outline" className={
            processingMode === 'multi-condition' 
              ? 'bg-purple-100 text-purple-800 border-purple-200'
              : processingMode === 'mixed'
                ? 'bg-orange-100 text-orange-800 border-orange-200'
                : 'bg-blue-100 text-blue-800 border-blue-200'
          }>
            {processingMode === 'multi-condition' ? 'Multi-Kondisi' 
             : processingMode === 'mixed' ? 'Campuran'
             : 'Kondisi Tunggal'}
          </Badge>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-blue-600">{calculation.lateDays}</div>
              <div className="text-sm text-gray-600">Hari Terlambat</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-600">{calculation.summary.onTimeItems}</div>
              <div className="text-sm text-gray-600">Barang Normal</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <div>
              <div className="text-2xl font-bold text-orange-600">{calculation.summary.damagedItems}</div>
              <div className="text-sm text-gray-600">Barang Rusak</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-red-600" />
            <div>
              <div className="text-2xl font-bold text-red-600">{calculation.summary.lostItems}</div>
              <div className="text-sm text-gray-600">Barang Hilang</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Late Penalty Info */}
      {calculation.lateDays > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Pengembalian terlambat {calculation.lateDays} hari. 
            Penalty keterlambatan: {formatCurrency(DAILY_LATE_RATE)} per hari per item.
          </AlertDescription>
        </Alert>
      )}

      {/* Item Breakdown */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Rincian Penalty per Item
        </h4>
        
        <div className="space-y-4">
          {calculation.breakdown.map((item) => (
            <div key={item.itemId} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h5 className="font-medium">{item.itemName}</h5>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span>Jumlah: {item.jumlahKembali} item</span>
                    <span className={getConditionColor(item.kondisiAkhir)}>
                      Kondisi: {item.kondisiAkhir}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    {formatCurrency(item.totalItemPenalty)}
                  </div>
                  <div className="text-sm text-gray-600">Total Penalty</div>
                </div>
              </div>

              {/* Penalty Breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Penalty Keterlambatan ({calculation.lateDays} hari)</span>
                  <span>{formatCurrency(item.latePenalty)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Penalty Kondisi Barang</span>
                  <span>{formatCurrency(item.conditionPenalty)}</span>
                </div>
                {item.isLostItem && (
                  <div className="text-red-600 text-xs mt-1">
                    * Penalty barang hilang menggunakan modal awal produk
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Total Summary */}
      <Card className="p-6 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-gray-600" />
            <div>
              <h4 className="font-semibold text-lg">Total Penalty</h4>
              <p className="text-sm text-gray-600">
                Akan ditambahkan ke sisa bayar transaksi
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-red-600">
              {formatCurrency(calculation.totalPenalty)}
            </div>
            <div className="text-sm text-gray-600">
              Sisa bayar saat ini: {formatCurrency(transaction.sisaBayar)}
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex justify-between items-center">
          <span className="font-medium">Total Sisa Bayar Setelah Pengembalian:</span>
          <span className="text-xl font-bold text-gray-900">
            {formatCurrency(transaction.sisaBayar + calculation.totalPenalty)}
          </span>
        </div>
      </Card>

      {/* Penalty Explanation */}
      <Card className="p-4 bg-blue-50">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Penjelasan Penalty</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div>• <strong>Keterlambatan:</strong> Rp 5.000 per hari per item</div>
              <div>• <strong>Kerusakan Ringan:</strong> Rp 5.000 per item (noda ringan, kerusakan kecil)</div>
              <div>• <strong>Kerusakan Berat:</strong> Rp 20.000 per item (noda berat, kerusakan besar)</div>
              <div>• <strong>Barang Hilang:</strong> Sesuai modal awal produk (jika tidak ada, default Rp 150.000)</div>
            </div>
          </div>
        </div>
      </Card>

    </div>
  )
}