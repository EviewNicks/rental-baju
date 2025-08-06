'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
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

interface ItemCondition {
  kondisiAkhir: string
  jumlahKembali: number
}

interface PenaltyCalculation {
  totalPenalty: number
  lateDays: number
  breakdown: {
    itemId: string
    itemName: string
    latePenalty: number
    conditionPenalty: number
    totalItemPenalty: number
    kondisiAkhir: string
    jumlahKembali: number
    isLostItem: boolean
  }[]
  summary: {
    onTimeItems: number
    lateItems: number
    damagedItems: number
    lostItems: number
  }
}

interface PenaltyDisplayProps {
  transaction: TransaksiDetail
  itemConditions: Record<string, ItemCondition>
  onPenaltyCalculated?: (calculation: PenaltyCalculation) => void
}

export function PenaltyDisplay({ 
  transaction, 
  itemConditions, 
  onPenaltyCalculated
}: PenaltyDisplayProps) {
  const [calculation, setCalculation] = useState<PenaltyCalculation | null>(null)

  // Penalty rates (from backend business logic)
  const DAILY_LATE_RATE = 5000 // Rp 5,000 per day
  const CONDITION_PENALTIES = {
    'baik': 0,
    'cukup': 5000, // 1x daily rate
    'buruk': 20000, // 4x daily rate  
    'hilang': 150000 // Default, but will use modalAwal if available
  }

  // Calculate penalty
  const penaltyCalculation = useMemo(() => {
    if (!transaction.items || Object.keys(itemConditions).length === 0) {
      return null
    }

    const returnableItems = transaction.items.filter(item => 
      item.jumlahDiambil > 0 && 
      item.statusKembali !== 'lengkap' &&
      itemConditions[item.id]
    )

    if (returnableItems.length === 0) {
      return null
    }

    // Calculate late days
    const today = new Date()
    const expectedReturnDate = new Date(transaction.tglSelesai || transaction.createdAt)
    const lateDays = Math.max(0, Math.ceil((today.getTime() - expectedReturnDate.getTime()) / (1000 * 60 * 60 * 24)))

    const breakdown = returnableItems.map(item => {
      const condition = itemConditions[item.id]
      const isLostItem = condition.kondisiAkhir.toLowerCase().includes('hilang') || 
                         condition.kondisiAkhir.toLowerCase().includes('tidak dikembalikan')

      // Late penalty (per item quantity)
      const latePenalty = lateDays * DAILY_LATE_RATE * condition.jumlahKembali

      // Condition penalty
      let conditionPenalty = 0
      if (isLostItem) {
        // Use modalAwal from produk if available, otherwise default
        const modalAwal = 'modalAwal' in item.produk && item.produk.modalAwal ? Number(item.produk.modalAwal) : null
        conditionPenalty = modalAwal || CONDITION_PENALTIES.hilang
      } else if (condition.kondisiAkhir.toLowerCase().includes('buruk')) {
        conditionPenalty = CONDITION_PENALTIES.buruk * condition.jumlahKembali
      } else if (condition.kondisiAkhir.toLowerCase().includes('cukup')) {
        conditionPenalty = CONDITION_PENALTIES.cukup * condition.jumlahKembali
      } else {
        conditionPenalty = CONDITION_PENALTIES.baik * condition.jumlahKembali
      }

      return {
        itemId: item.id,
        itemName: item.produk.name,
        latePenalty,
        conditionPenalty,
        totalItemPenalty: latePenalty + conditionPenalty,
        kondisiAkhir: condition.kondisiAkhir,
        jumlahKembali: condition.jumlahKembali,
        isLostItem
      }
    })

    const totalPenalty = breakdown.reduce((sum, item) => sum + item.totalItemPenalty, 0)

    // Summary statistics
    const summary = {
      onTimeItems: lateDays === 0 ? breakdown.filter(item => !item.isLostItem && item.conditionPenalty === 0).length : 0,
      lateItems: lateDays > 0 ? breakdown.filter(item => !item.isLostItem).length : 0,
      damagedItems: breakdown.filter(item => !item.isLostItem && item.conditionPenalty > 0).length,
      lostItems: breakdown.filter(item => item.isLostItem).length
    }

    return {
      totalPenalty,
      lateDays,
      breakdown,
      summary
    }
  }, [transaction, itemConditions, CONDITION_PENALTIES.baik, CONDITION_PENALTIES.buruk, CONDITION_PENALTIES.cukup, CONDITION_PENALTIES.hilang])

  // Update calculation and notify parent
  useEffect(() => {
    if (penaltyCalculation) {
      setCalculation(penaltyCalculation)
      onPenaltyCalculated?.(penaltyCalculation)
    }
  }, [penaltyCalculation, onPenaltyCalculated])

  const getConditionColor = (kondisiAkhir: string) => {
    if (kondisiAkhir.toLowerCase().includes('hilang')) return 'text-red-600'
    if (kondisiAkhir.toLowerCase().includes('buruk')) return 'text-orange-600'
    if (kondisiAkhir.toLowerCase().includes('cukup')) return 'text-yellow-600'
    return 'text-green-600'
  }

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`
  }

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
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Perhitungan Penalty</h3>
        <p className="text-gray-600">
          Berikut adalah rincian penalty berdasarkan kondisi barang dan keterlambatan pengembalian.
        </p>
      </div>

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