'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Package,
  User,
  DollarSign,
  FileText,
  ArrowLeft
} from 'lucide-react'
import type { TransaksiDetail } from '../../types'
import type { 
  EnhancedItemCondition,
  MultiConditionPenaltyResult,
  ReturnProcessingResult 
} from '../../types'

// Backward compatibility interfaces
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

interface ReturnConfirmationProps {
  transaction: TransaksiDetail
  // Support both old and new data structures
  itemConditions: Record<string, ItemCondition> | Record<string, EnhancedItemCondition>
  penaltyCalculation: PenaltyCalculation | MultiConditionPenaltyResult | null
  onProcess: (notes?: string) => Promise<ReturnProcessingResult | void>
  onComplete: () => void
  onBack?: () => void
  isLoading?: boolean
}

// Helper function to normalize item conditions to old format for display compatibility
const normalizeItemConditions = (
  conditions: Record<string, ItemCondition> | Record<string, EnhancedItemCondition>
): Record<string, ItemCondition> => {
  const normalized: Record<string, ItemCondition> = {}
  
  for (const [itemId, condition] of Object.entries(conditions)) {
    if ('mode' in condition && 'conditions' in condition) {
      // Enhanced multi-condition format
      const enhanced = condition as EnhancedItemCondition
      if (enhanced.mode === 'single' || enhanced.conditions.length === 1) {
        // Single condition - use first condition
        const firstCondition = enhanced.conditions[0]
        normalized[itemId] = {
          kondisiAkhir: firstCondition?.kondisiAkhir || '',
          jumlahKembali: firstCondition?.jumlahKembali || 0
        }
      } else {
        // Multi-condition - combine for display
        const totalReturned = enhanced.conditions.reduce((sum, c) => sum + (c.jumlahKembali || 0), 0)
        const conditionLabels = enhanced.conditions.map(c => `${c.kondisiAkhir} (${c.jumlahKembali})`).join(', ')
        normalized[itemId] = {
          kondisiAkhir: `Multi: ${conditionLabels}`,
          jumlahKembali: totalReturned
        }
      }
    } else {
      // Old format - pass through
      normalized[itemId] = condition as ItemCondition
    }
  }
  
  return normalized
}

// Helper function to normalize penalty calculation for display
const normalizePenaltyCalculation = (
  penalty: PenaltyCalculation | MultiConditionPenaltyResult | null
): PenaltyCalculation | null => {
  if (!penalty) return null
  
  if ('breakdown' in penalty && Array.isArray(penalty.breakdown)) {
    // Check if it's the new enhanced format
    if (penalty.breakdown[0] && 'calculationMethod' in penalty.breakdown[0]) {
      // Enhanced format - convert to old format
      const enhanced = penalty as MultiConditionPenaltyResult
      return {
        totalPenalty: enhanced.totalPenalty,
        lateDays: enhanced.lateDays,
        breakdown: enhanced.breakdown.map(item => ({
          itemId: item.itemId,
          itemName: item.itemName,
          latePenalty: item.latePenalty,
          conditionPenalty: item.conditionPenalty,
          totalItemPenalty: item.totalItemPenalty,
          kondisiAkhir: item.kondisiAkhir,
          jumlahKembali: item.jumlahKembali,
          isLostItem: item.isLostItem
        })),
        summary: {
          onTimeItems: enhanced.summary?.onTimeItems || 0,
          lateItems: enhanced.summary?.lateItems || 0,
          damagedItems: enhanced.summary?.damagedItems || 0,
          lostItems: enhanced.summary?.lostItems || 0
        }
      }
    }
  }
  
  // Old format - pass through
  return penalty as PenaltyCalculation
}

export function ReturnConfirmation({
  transaction,
  itemConditions,
  penaltyCalculation,
  onProcess,
  onComplete,
  onBack,
  isLoading = false
}: ReturnConfirmationProps) {
  const [notes, setNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processComplete, setProcessComplete] = useState(false)
  const [processError, setProcessError] = useState<string | null>(null)
  
  // Enhanced button state management (CRITICAL FIX - prevent double submissions)
  const [lastSubmissionTime, setLastSubmissionTime] = useState<number>(0)
  const [submissionCount, setSubmissionCount] = useState<number>(0)
  
  // Normalize data for display compatibility
  const normalizedConditions = normalizeItemConditions(itemConditions)
  const normalizedPenalty = normalizePenaltyCalculation(penaltyCalculation)
  
  const handleProcess = async () => {
    const now = Date.now()
    const timeSinceLastSubmission = now - lastSubmissionTime
    
    // Prevent rapid double-clicks (< 2 seconds)
    if (timeSinceLastSubmission < 2000) {
      // Enhanced logging for double-click prevention (strategic logging)
      console.log('🚫 BUTTON BLOCK (Double-Click):', {
        transactionCode: transaction.kode,
        timeSinceLastSubmission,
        cooldownRemaining: 2000 - timeSinceLastSubmission,
        blockType: 'rapid_click'
      })
      return
    }
    
    // Prevent multiple submissions when already processing
    if (isProcessing) {
      // Enhanced logging for processing state prevention (strategic logging)
      console.log('🚫 BUTTON BLOCK (Processing):', {
        transactionCode: transaction.kode,
        isProcessing,
        submissionCount,
        blockType: 'already_processing'
      })
      return
    }

    setLastSubmissionTime(now)
    setSubmissionCount(prev => prev + 1)
    setIsProcessing(true)
    setProcessError(null)
    
    console.log('🎯 Processing return submission', { 
      attempt: submissionCount + 1,
      transactionCode: transaction.kode 
    })
    
    try {
      await onProcess(notes.trim() || undefined)
      setProcessComplete(true)
      
      // Auto-complete after 3 seconds with clear feedback
      console.log('✅ Return processing completed successfully')
      setTimeout(() => {
        onComplete()
      }, 3000)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses pengembalian'
      console.error('❌ Return processing failed:', errorMessage)
      
      // Handle specific error types for better UX
      if (errorMessage.includes('sudah dikembalikan') || errorMessage.includes('ALREADY_RETURNED')) {
        setProcessError('Transaksi ini sudah dikembalikan sebelumnya.')
        setProcessComplete(true) // Treat as success since transaction is complete
        setTimeout(() => {
          onComplete()
        }, 2000)
      } else {
        setProcessError(errorMessage)
      }
      
    } finally {
      setIsProcessing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Get returnable items
  const returnableItems = transaction.items?.filter(item => 
    item.jumlahDiambil > 0 && 
    item.statusKembali !== 'lengkap' &&
    normalizedConditions[item.id]
  ) || []

  if (processComplete) {
    return (
      <div className="text-center py-8">
        <div className="mb-6">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-600 mb-2">
            Pengembalian Berhasil!
          </h3>
          <p className="text-gray-600">
            Transaksi {transaction.kode} telah berhasil diproses untuk pengembalian.
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <div className="text-sm text-green-700">
            <div className="font-medium mb-2">Ringkasan Pengembalian:</div>
            <div>• {returnableItems.length} item berhasil dikembalikan</div>
            {normalizedPenalty && normalizedPenalty.totalPenalty > 0 && (
              <div>• Total penalty: {formatCurrency(normalizedPenalty.totalPenalty)}</div>
            )}
            <div>• Status transaksi: Dikembalikan</div>
          </div>
        </div>

        <Button onClick={onComplete}>
          Selesai
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Konfirmasi Pengembalian</h3>
        <p className="text-gray-600">
          Periksa kembali detail pengembalian sebelum memproses. 
          Setelah diproses, data tidak dapat diubah.
        </p>
      </div>

      {/* Transaction Summary */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Detail Transaksi
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Kode Transaksi:</span>
            <div className="font-medium">{transaction.kode}</div>
          </div>
          <div>
            <span className="text-gray-600">Penyewa:</span>
            <div className="font-medium">{transaction.penyewa.nama}</div>
          </div>
          <div>
            <span className="text-gray-600">Telepon:</span>
            <div className="font-medium">{transaction.penyewa.telepon}</div>
          </div>
          <div>
            <span className="text-gray-600">Tanggal Pengembalian:</span>
            <div className="font-medium">{formatDate(new Date().toISOString())}</div>
          </div>
        </div>
      </Card>

      {/* Items to Return */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Barang yang Dikembalikan ({returnableItems.length} item)
        </h4>
        
        <div className="space-y-3">
          {returnableItems.map((item) => {
            const condition = normalizedConditions[item.id]
            const isLostItem = condition.kondisiAkhir.toLowerCase().includes('hilang') || 
                              condition.kondisiAkhir.toLowerCase().includes('tidak dikembalikan')
            
            return (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium">{item.produk.name}</h5>
                    <div className="text-sm text-gray-600 mt-1">
                      <div>Jumlah dikembalikan: {condition.jumlahKembali} dari {item.jumlahDiambil} item</div>
                      <div className={isLostItem ? 'text-red-600' : 'text-gray-600'}>
                        Kondisi: {condition.kondisiAkhir}
                      </div>
                    </div>
                  </div>
                  {isLostItem && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                      Hilang
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Penalty Summary */}
      {normalizedPenalty && (
        <Card className="p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Ringkasan Penalty
          </h4>
          
          <div className="space-y-3">
            {normalizedPenalty.lateDays > 0 && (
              <div className="flex justify-between text-sm">
                <span>Penalty Keterlambatan ({normalizedPenalty.lateDays} hari)</span>
                <span className="font-medium">
                  {formatCurrency(
                    normalizedPenalty.breakdown.reduce((sum, item) => sum + item.latePenalty, 0)
                  )}
                </span>
              </div>
            )}
            
            {normalizedPenalty.summary.damagedItems > 0 && (
              <div className="flex justify-between text-sm">
                <span>Penalty Kerusakan ({normalizedPenalty.summary.damagedItems} item)</span>
                <span className="font-medium">
                  {formatCurrency(
                    normalizedPenalty.breakdown
                      .filter(item => !item.isLostItem && item.conditionPenalty > 0)
                      .reduce((sum, item) => sum + item.conditionPenalty, 0)
                  )}
                </span>
              </div>
            )}
            
            {normalizedPenalty.summary.lostItems > 0 && (
              <div className="flex justify-between text-sm">
                <span>Penalty Barang Hilang ({normalizedPenalty.summary.lostItems} item)</span>
                <span className="font-medium">
                  {formatCurrency(
                    normalizedPenalty.breakdown
                      .filter(item => item.isLostItem)
                      .reduce((sum, item) => sum + item.conditionPenalty, 0)
                  )}
                </span>
              </div>
            )}

            <Separator />
            
            <div className="flex justify-between font-semibold">
              <span>Total Penalty</span>
              <span className="text-red-600">
                {formatCurrency(normalizedPenalty.totalPenalty)}
              </span>
            </div>
            
            <div className="flex justify-between text-lg font-bold">
              <span>Total Sisa Bayar Setelah Pengembalian</span>
              <span>
                {formatCurrency(transaction.sisaBayar + normalizedPenalty.totalPenalty)}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Additional Notes */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Catatan Tambahan (Opsional)
        </h4>
        
        <div className="space-y-2">
          <Label htmlFor="return-notes">Catatan Pengembalian</Label>
          <Textarea
            id="return-notes"
            placeholder="Tambahkan catatan jika diperlukan (opsional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isLoading || isProcessing}
            rows={3}
          />
          <p className="text-sm text-gray-500">
            Catatan ini akan disimpan sebagai log aktivitas transaksi.
          </p>
        </div>
      </Card>

      {/* Error Display */}
      {processError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{processError}</AlertDescription>
        </Alert>
      )}

      {/* Confirmation Warning */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Perhatian:</strong> Setelah pengembalian diproses, data tidak dapat diubah. 
          Pastikan semua informasi sudah benar sebelum melanjutkan.
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex gap-4">
        {/* Back Button */}
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isLoading || isProcessing}
            className="flex-1 hover:bg-neutral-50 border-neutral-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Penalty
          </Button>
        )}
        
        {/* Process Button - Enhanced State Management */}
        <Button
          onClick={handleProcess}
          disabled={isLoading || isProcessing || processComplete}
          className={`flex-1 ${processComplete ? 'bg-green-800' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {processComplete ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2 text-green-300" />
              Pengembalian Selesai
            </>
          ) : isProcessing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Memproses Pengembalian... {submissionCount > 1 && `(${submissionCount})`}
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Proses Pengembalian {submissionCount > 0 && `(${submissionCount + 1})`}
            </>
          )}
        </Button>
      </div>

      {/* Processing Info */}
      {isProcessing && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Sedang memproses pengembalian. Mohon tunggu dan jangan menutup halaman ini.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}