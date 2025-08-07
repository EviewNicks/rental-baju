'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Package, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import type { TransaksiDetail } from '../../types'

// Standard condition options from backend schema
const CONDITION_OPTIONS = [
  'Baik - tidak ada kerusakan',
  'Baik - sedikit kotor/kusut',
  'Cukup - ada noda ringan',
  'Cukup - ada kerusakan kecil',
  'Buruk - ada noda berat',
  'Buruk - ada kerusakan besar',
  'Hilang/tidak dikembalikan',
]

interface ItemCondition {
  kondisiAkhir: string
  jumlahKembali: number
}

interface ItemConditionFormProps {
  transaction: TransaksiDetail
  itemConditions: Record<string, ItemCondition>
  onConditionsChange: (conditions: Record<string, ItemCondition>) => void
  onContinue?: () => void
  isLoading?: boolean
}

export function ItemConditionForm({
  transaction,
  itemConditions,
  onConditionsChange,
  isLoading = false,
}: ItemConditionFormProps) {
  const [localConditions, setLocalConditions] =
    useState<Record<string, ItemCondition>>(itemConditions)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Get returnable items (items that have been picked up but not fully returned)
  const returnableItems = useMemo(
    () =>
      transaction.items?.filter(
        (item) => item.jumlahDiambil > 0 && item.statusKembali !== 'lengkap',
      ) || [],
    [transaction.items],
  )

  // Initialize conditions for returnable items
  useEffect(() => {
    const initialConditions: Record<string, ItemCondition> = {}

    returnableItems.forEach((item) => {
      if (!localConditions[item.id]) {
        initialConditions[item.id] = {
          kondisiAkhir: '',
          jumlahKembali: item.jumlahDiambil, // Default to returning all picked up items
        }
      } else {
        initialConditions[item.id] = localConditions[item.id]
      }
    })

    setLocalConditions((prev) => ({ ...prev, ...initialConditions }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnableItems])

  // Real-time state synchronization - sync localConditions to parent immediately
  useEffect(() => {
    // Only sync if we have returnable items and conditions are being set
    if (returnableItems.length > 0 && Object.keys(localConditions).length > 0) {
      onConditionsChange(localConditions)
    }
  }, [localConditions, returnableItems.length, onConditionsChange])

  // Validate item condition
  const validateItemCondition = (itemId: string, condition: ItemCondition): string | null => {
    const item = returnableItems.find((i) => i.id === itemId)
    if (!item) return 'Item tidak ditemukan'

    if (!condition.kondisiAkhir) {
      return 'Kondisi barang harus dipilih'
    }

    // Check if it's a lost item
    const isLostItem =
      condition.kondisiAkhir.toLowerCase().includes('hilang') ||
      condition.kondisiAkhir.toLowerCase().includes('tidak dikembalikan')

    if (isLostItem) {
      if (condition.jumlahKembali !== 0) {
        return 'Barang hilang harus memiliki jumlah kembali = 0'
      }
    } else {
      if (condition.jumlahKembali < 1) {
        return 'Jumlah kembali minimal 1 untuk barang yang dikembalikan'
      }
      if (condition.jumlahKembali > item.jumlahDiambil) {
        return `Jumlah kembali tidak bisa lebih dari ${item.jumlahDiambil}`
      }
    }

    return null
  }

  // Handle condition change
  const handleConditionChange = (
    itemId: string,
    field: keyof ItemCondition,
    value: string | number,
  ) => {
    const newConditions = {
      ...localConditions,
      [itemId]: {
        ...localConditions[itemId],
        [field]: value,
      },
    }

    // Auto-adjust jumlahKembali for lost items
    if (field === 'kondisiAkhir') {
      const isLostItem =
        String(value).toLowerCase().includes('hilang') ||
        String(value).toLowerCase().includes('tidak dikembalikan')

      if (isLostItem) {
        newConditions[itemId].jumlahKembali = 0
      } else if (localConditions[itemId]?.jumlahKembali === 0) {
        // Reset to max available if changing from lost item
        const item = returnableItems.find((i) => i.id === itemId)
        if (item) {
          newConditions[itemId].jumlahKembali = item.jumlahDiambil
        }
      }
    }

    setLocalConditions(newConditions)

    // Validate and update errors
    const error = validateItemCondition(itemId, newConditions[itemId])
    setValidationErrors((prev) => ({
      ...prev,
      [itemId]: error || '',
    }))

    // Note: Removed auto-advance behavior - user now controls progression
  }

  // Check if form is valid
  const isFormValid = () => {
    return returnableItems.every((item) => {
      const condition = localConditions[item.id]
      return condition && condition.kondisiAkhir && !validateItemCondition(item.id, condition)
    })
  }

  // Get condition color for styling
  const getConditionColor = (condition: string) => {
    if (condition.includes('Hilang')) return 'text-red-600 bg-red-50'
    if (condition.includes('Buruk')) return 'text-orange-600 bg-orange-50'
    if (condition.includes('Cukup')) return 'text-yellow-600 bg-yellow-50'
    if (condition.includes('Baik')) return 'text-green-600 bg-green-50'
    return 'text-gray-600 bg-gray-50'
  }

  if (returnableItems.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Tidak ada barang yang dapat dikembalikan pada transaksi ini.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Kondisi Barang Saat Dikembalikan</h3>
        <p className="text-gray-600">
          Catat kondisi setiap barang yang dikembalikan. Kondisi ini akan mempengaruhi perhitungan
          penalty.
        </p>
      </div>

      {/* Items Form */}
      <div className="space-y-4">
        {returnableItems.map((item, index) => {
          const condition = localConditions[item.id]
          const error = validationErrors[item.id]
          const isLostItem =
            condition?.kondisiAkhir?.toLowerCase().includes('hilang') ||
            condition?.kondisiAkhir?.toLowerCase().includes('tidak dikembalikan')

          return (
            <Card key={item.id} className={`p-6 ${error ? 'border-red-200' : ''}`}>
              <div className="space-y-4">
                {/* Item Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-gray-400" />
                    <div>
                      <h4 className="font-medium">{item.produk.name}</h4>
                      <p className="text-sm text-gray-600">
                        Diambil: {item.jumlahDiambil} dari {item.jumlah} item
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-600">Item #{index + 1}</div>
                </div>

                {/* Condition Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`condition-${item.id}`}>Kondisi Barang *</Label>
                    <Select
                      value={condition?.kondisiAkhir || ''}
                      onValueChange={(value) =>
                        handleConditionChange(item.id, 'kondisiAkhir', value)
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger id={`condition-${item.id}`}>
                        <SelectValue placeholder="Pilih kondisi barang" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            <div
                              className={`px-2 py-1 rounded text-sm ${getConditionColor(option)}`}
                            >
                              {option}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`quantity-${item.id}`}>Jumlah Dikembalikan *</Label>
                    <Input
                      id={`quantity-${item.id}`}
                      type="number"
                      min="0"
                      max={item.jumlahDiambil}
                      value={condition?.jumlahKembali ?? item.jumlahDiambil}
                      onChange={(e) =>
                        handleConditionChange(
                          item.id,
                          'jumlahKembali',
                          parseInt(e.target.value) || 0,
                        )
                      }
                      disabled={isLoading || isLostItem}
                      className={isLostItem ? 'bg-gray-100' : ''}
                    />
                    <p className="text-xs text-gray-500">Maksimal: {item.jumlahDiambil} item</p>
                  </div>
                </div>

                {/* Lost Item Notice */}
                {isLostItem && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Barang hilang/tidak dikembalikan. Jumlah kembali otomatis diset ke 0. Penalty
                      akan dihitung berdasarkan modal awal produk.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Validation Error */}
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Success Indicator */}
                {condition && !error && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    Kondisi barang sudah dicatat
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Form Summary */}
      <Card className="p-4 bg-blue-50">
        <div className="flex items-center gap-3">
          <Info className="h-5 w-5 text-blue-600" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Ringkasan</h4>
            <p className="text-sm text-blue-700">
              {returnableItems.filter((item) => localConditions[item.id]?.kondisiAkhir).length} dari{' '}
              {returnableItems.length} barang sudah dicatat kondisinya
            </p>
            {isFormValid() && (
              <p className="text-sm text-green-700 mt-1">
                ✓ Semua kondisi barang sudah lengkap dan valid
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Condition Guide */}
      <Card className="p-4">
        <h4 className="font-medium mb-3">Panduan Kondisi Barang</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span>
                <strong>Baik:</strong> Tidak ada kerusakan atau hanya kotor ringan
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-500"></div>
              <span>
                <strong>Cukup:</strong> Ada noda atau kerusakan kecil
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-500"></div>
              <span>
                <strong>Buruk:</strong> Noda berat atau kerusakan besar
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span>
                <strong>Hilang:</strong> Barang tidak dapat dikembalikan
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
