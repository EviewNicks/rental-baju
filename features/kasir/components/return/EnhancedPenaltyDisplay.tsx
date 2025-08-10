'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { 
  Calculator, 
  AlertTriangle, 
  Clock, 
  Package, 
  DollarSign,
  Info,
  CheckCircle,
  TrendingUp,
  FileText,
  Layers,
  Target,
  Eye,
  EyeOff
} from 'lucide-react'
import type { TransaksiDetail } from '../../types'
import type {
  EnhancedItemCondition,
  MultiConditionPenaltyResult
} from '../../types'
import { kasirLogger } from '../../services/logger'

interface EnhancedPenaltyDisplayProps {
  transaction: TransaksiDetail
  itemConditions: Record<string, EnhancedItemCondition>
  penaltyCalculation?: MultiConditionPenaltyResult | null
  onPenaltyCalculated?: (calculation: MultiConditionPenaltyResult) => void
  showBreakdown?: boolean
  compactView?: boolean
  isCalculating?: boolean
}

/**
 * Enhanced Penalty Display Component
 * Supports both single-condition and multi-condition penalty breakdown
 */
export function EnhancedPenaltyDisplay({
  penaltyCalculation,
  onPenaltyCalculated,
  showBreakdown = true,
  compactView = false,
  isCalculating = false
}: EnhancedPenaltyDisplayProps) {
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false)

  // Processing mode detection
  const processingMode = penaltyCalculation?.calculationMetadata?.processingMode || 'single'

  // Utility functions
  const getConditionBadgeColor = (kondisiAkhir: string) => {
    if (kondisiAkhir.toLowerCase().includes('hilang')) return 'bg-red-100 text-red-800 border-red-200'
    if (kondisiAkhir.toLowerCase().includes('buruk')) return 'bg-orange-100 text-orange-800 border-orange-200'
    if (kondisiAkhir.toLowerCase().includes('cukup')) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-green-100 text-green-800 border-green-200'
  }

  const getCalculationMethodBadge = (method: string) => {
    switch (method) {
      case 'late_fee':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Telat</Badge>
      case 'modal_awal':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Modal</Badge>
      case 'damage_fee':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Rusak</Badge>
      case 'none':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Normal</Badge>
      default:
        return <Badge variant="outline">-</Badge>
    }
  }


  // Notify parent when calculation changes
  useEffect(() => {
    if (penaltyCalculation && onPenaltyCalculated) {
      kasirLogger.penaltyCalc.debug('penalty display', 'Penalty calculation received', {
        totalPenalty: penaltyCalculation.totalPenalty,
        lateDays: penaltyCalculation.lateDays,
        breakdownItems: penaltyCalculation.breakdown?.length || 0,
        processingMode: penaltyCalculation.calculationMetadata?.processingMode,
        conditionSplits: penaltyCalculation.calculationMetadata?.conditionSplits
      })
      
      onPenaltyCalculated(penaltyCalculation)
    }
  }, [penaltyCalculation, onPenaltyCalculated])

  // Utility functions
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
  if (!penaltyCalculation) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Lengkapi kondisi barang terlebih dahulu untuk melihat perhitungan penalty.
        </AlertDescription>
      </Alert>
    )
  }

  const { totalPenalty, lateDays, breakdown, summary, calculationMetadata } = penaltyCalculation

  if (compactView) {
    // Compact view for small spaces
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-green-600" />
            <div>
              <div className="font-semibold">{formatCurrency(totalPenalty)}</div>
              <div className="text-sm text-gray-600">
                Total Penalty ({processingMode === 'multi-condition' ? 'Multi-kondisi' : 'Standard'})
              </div>
            </div>
          </div>
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
            {summary.totalConditions} kondisi
          </Badge>
        </div>
      </Card>
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
          <div className="flex items-center gap-2">
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
            <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">
              {summary.totalConditions} kondisi
            </Badge>
          </div>
        </div>
      </Card>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-700">{formatCurrency(totalPenalty)}</div>
              <div className="text-sm text-green-600">Total Penalty</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <div className="text-xl font-bold text-blue-600">{lateDays}</div>
              <div className="text-sm text-gray-600">Hari Terlambat</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-gray-600" />
            <div>
              <div className="text-xl font-bold text-gray-700">{summary.totalItems}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Layers className="h-5 w-5 text-purple-600" />
            <div>
              <div className="text-xl font-bold text-purple-600">{summary.totalConditions}</div>
              <div className="text-sm text-gray-600">Total Kondisi</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-orange-600" />
            <div>
              <div className="text-xl font-bold text-orange-600">
                {summary.averageConditionsPerItem?.toFixed(1) || '0.0'}
              </div>
              <div className="text-sm text-gray-600">Rata-rata / Item</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Condition Type Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <div className="text-xl font-bold text-green-600">{summary.onTimeItems}</div>
              <div className="text-sm text-gray-600">Barang Normal</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <div>
              <div className="text-xl font-bold text-orange-600">{summary.damagedItems}</div>
              <div className="text-sm text-gray-600">Barang Rusak</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-red-600" />
            <div>
              <div className="text-xl font-bold text-red-600">{summary.lostItems}</div>
              <div className="text-sm text-gray-600">Barang Hilang</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <div>
              <div className="text-xl font-bold text-blue-600">{summary.lateItems}</div>
              <div className="text-sm text-gray-600">Barang Telat</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Late Penalty Info */}
      {lateDays && lateDays > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Pengembalian terlambat {lateDays} hari. 
            Penalty keterlambatan dihitung per hari per unit sesuai kondisi.
          </AlertDescription>
        </Alert>
      )}

      {/* Multi-condition Processing Info */}
      {(processingMode === 'multi-condition' || processingMode === 'mixed') && (
        <Alert>
          <Layers className="h-4 w-4" />
          <AlertDescription>
            <strong>Mode Multi-Kondisi:</strong> Setiap unit item dihitung penalty sesuai kondisi masing-masing 
            untuk perhitungan yang lebih akurat dan adil.
            {processingMode === 'mixed' && (
              <span className="ml-1">Sebagian item menggunakan kondisi tunggal, sebagian multi-kondisi.</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Breakdown */}
      {showBreakdown && breakdown && breakdown.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Rincian Penalty per Item
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newState = !showDetailedBreakdown
                  kasirLogger.userInteraction.debug('penalty display toggle', 'User toggled detailed breakdown view', {
                    previousState: showDetailedBreakdown,
                    newState,
                    processingMode,
                    totalPenalty: penaltyCalculation?.totalPenalty,
                    breakdownItems: penaltyCalculation?.breakdown?.length || 0
                  })
                  setShowDetailedBreakdown(newState)
                }}
              >
                {showDetailedBreakdown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showDetailedBreakdown ? 'Sembunyikan' : 'Tampilkan'} Detail
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {breakdown.map((item) => (
                <div key={`${item.itemId}-${item.splitIndex || 0}`} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-medium">{item.itemName}</h5>
                        {item.splitIndex !== undefined && (
                          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                            Split #{item.splitIndex + 1}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {item.jumlahKembali} unit
                        </span>
                        <Badge variant="outline" className={getConditionBadgeColor(item.kondisiAkhir)}>
                          {item.kondisiAkhir}
                        </Badge>
                        {getCalculationMethodBadge(item.calculationMethod)}
                        {item.isLostItem && (
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                            Hilang
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">{formatCurrency(item.totalItemPenalty)}</div>
                      <div className="text-sm text-gray-600">Penalty Item</div>
                    </div>
                  </div>

                  {showDetailedBreakdown && (
                    <div className="bg-gray-50 rounded-lg p-3 mt-3">
                      <h6 className="font-medium mb-2 text-sm">Detail Perhitungan</h6>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Penalty Telat:</span>
                          <span className="ml-2 font-medium">{formatCurrency(item.latePenalty)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Penalty Kondisi:</span>
                          <span className="ml-2 font-medium">{formatCurrency(item.conditionPenalty)}</span>
                        </div>
                        {item.modalAwalUsed && (
                          <div>
                            <span className="text-gray-600">Modal Awal:</span>
                            <span className="ml-2 font-medium">{formatCurrency(item.modalAwalUsed)}</span>
                          </div>
                        )}
                        {item.rateApplied && (
                          <div>
                            <span className="text-gray-600">Rate Applied:</span>
                            <span className="ml-2 font-medium">{formatCurrency(item.rateApplied)}</span>
                          </div>
                        )}
                      </div>
                      {item.description && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600 italic">{item.description}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calculation Metadata */}
      {calculationMetadata && showDetailedBreakdown && (
        <Card className="p-4 bg-gray-50">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Informasi Perhitungan
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Mode Processing:</span>
              <span className="ml-2 font-medium capitalize">{calculationMetadata.processingMode}</span>
            </div>
            <div>
              <span className="text-gray-600">Items Processed:</span>
              <span className="ml-2 font-medium">{calculationMetadata.itemsProcessed}</span>
            </div>
            <div>
              <span className="text-gray-600">Condition Splits:</span>
              <span className="ml-2 font-medium">{calculationMetadata.conditionSplits}</span>
            </div>
            <div>
              <span className="text-gray-600">Calculated At:</span>
              <span className="ml-2 font-medium">{new Date(calculationMetadata.calculatedAt).toLocaleString('id-ID')}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}