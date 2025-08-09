'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, Package, AlertTriangle, CheckCircle } from 'lucide-react'
import { CONDITION_OPTIONS } from '../../types/multiConditionReturn'
import type { ConditionSplitCardProps } from '../../types/multiConditionReturn'

/**
 * Condition Split Card Component
 * Individual card for entering condition details in multi-condition mode
 */
export function ConditionSplitCard({
  condition,
  index,
  maxQuantity,
  availableQuantity,
  onConditionChange,
  onRemove,
  showRemoveButton = true,
  disabled = false,
}: ConditionSplitCardProps) {
  const [localCondition, setLocalCondition] = useState(condition)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Sync with parent changes
  useEffect(() => {
    setLocalCondition(condition)
  }, [condition])

  // Validate condition
  const validateCondition = (newCondition: typeof condition): string | null => {
    if (!newCondition.kondisiAkhir) {
      return 'Kondisi barang harus dipilih'
    }

    const isLostItem = 
      newCondition.kondisiAkhir.toLowerCase().includes('hilang') ||
      newCondition.kondisiAkhir.toLowerCase().includes('tidak dikembalikan')

    if (isLostItem) {
      if (newCondition.jumlahKembali !== 0) {
        return 'Barang hilang harus memiliki jumlah = 0'
      }
    } else {
      if (newCondition.jumlahKembali < 1) {
        return 'Jumlah kembali minimal 1 untuk barang yang dikembalikan'
      }
      if (newCondition.jumlahKembali > availableQuantity) {
        return `Jumlah kembali tidak bisa lebih dari ${availableQuantity} (sisa yang tersedia)`
      }
      if (newCondition.jumlahKembali > maxQuantity) {
        return `Jumlah kembali tidak bisa lebih dari ${maxQuantity} (total diambil)`
      }
    }

    return null
  }

  // Handle condition changes with validation
  const handleConditionChange = (field: keyof typeof condition, value: string | number) => {
    const newCondition = {
      ...localCondition,
      [field]: value,
    }

    // Auto-adjust quantity for lost items
    if (field === 'kondisiAkhir') {
      const isLostItem = 
        String(value).toLowerCase().includes('hilang') ||
        String(value).toLowerCase().includes('tidak dikembalikan')

      if (isLostItem) {
        newCondition.jumlahKembali = 0
      } else if (localCondition.jumlahKembali === 0) {
        // Reset to 1 if changing from lost item
        newCondition.jumlahKembali = Math.min(availableQuantity, 1)
      }
    }

    setLocalCondition(newCondition)
    
    // Validate and notify parent
    const error = validateCondition(newCondition)
    setValidationError(error)
    
    if (!error) {
      onConditionChange(newCondition)
    }
  }

  // Get condition color for styling
  const getConditionColor = (kondisiAkhir: string) => {
    if (kondisiAkhir.includes('Hilang')) return 'text-red-600 bg-red-50 border-red-200'
    if (kondisiAkhir.includes('Buruk')) return 'text-orange-600 bg-orange-50 border-orange-200'
    if (kondisiAkhir.includes('Cukup')) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    if (kondisiAkhir.includes('Baik')) return 'text-green-600 bg-green-50 border-green-200'
    return 'text-gray-600 bg-gray-50 border-gray-200'
  }

  const isLostItem = 
    localCondition.kondisiAkhir?.toLowerCase().includes('hilang') ||
    localCondition.kondisiAkhir?.toLowerCase().includes('tidak dikembalikan')

  const isValid = !validationError && localCondition.kondisiAkhir && localCondition.jumlahKembali !== undefined

  return (
    <Card className={`p-4 transition-all ${
      validationError ? 'border-red-300 bg-red-50' : isValid ? 'border-green-200 bg-green-50' : 'border-gray-200'
    }`}>
      <div className="space-y-4">
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-full ${
              isValid ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
            }`}>
              <Package className="h-4 w-4" />
            </div>
            <span className="font-medium text-sm">
              Kondisi #{index + 1}
            </span>
            {isValid && (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
          </div>

          {/* Remove Button */}
          {showRemoveButton && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRemove}
              disabled={disabled}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Condition Selection */}
        <div className="space-y-2">
          <Label htmlFor={`condition-${index}`}>Kondisi Barang *</Label>
          <Select
            value={localCondition.kondisiAkhir || ''}
            onValueChange={(value) => handleConditionChange('kondisiAkhir', value)}
            disabled={disabled}
          >
            <SelectTrigger id={`condition-${index}`}>
              <SelectValue placeholder="Pilih kondisi barang" />
            </SelectTrigger>
            <SelectContent>
              {CONDITION_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  <div className={`px-2 py-1 rounded text-sm ${getConditionColor(option)}`}>
                    {option}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quantity Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor={`quantity-${index}`}>Jumlah Unit *</Label>
            <span className="text-xs text-gray-500">
              Tersedia: {availableQuantity} unit
            </span>
          </div>
          <Input
            id={`quantity-${index}`}
            type="number"
            min="0"
            max={Math.max(availableQuantity, maxQuantity)}
            value={localCondition.jumlahKembali ?? ''}
            onChange={(e) => handleConditionChange('jumlahKembali', parseInt(e.target.value) || 0)}
            disabled={disabled || isLostItem}
            className={isLostItem ? 'bg-gray-100' : ''}
            placeholder={isLostItem ? '0 (otomatis)' : '1'}
          />
        </div>

        {/* Lost Item Notice */}
        {isLostItem && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Barang hilang/tidak dikembalikan. Jumlah otomatis diset ke 0. 
              Penalty dihitung berdasarkan modal awal produk.
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Error */}
        {validationError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">{validationError}</AlertDescription>
          </Alert>
        )}

        {/* Success Indicator */}
        {isValid && !validationError && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>
              {isLostItem 
                ? `${localCondition.jumlahKembali} unit hilang - penalty modal awal`
                : `${localCondition.jumlahKembali} unit dalam kondisi "${localCondition.kondisiAkhir}"`
              }
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}