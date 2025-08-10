'use client'

import { useCallback, useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, AlertTriangle, Calculator } from 'lucide-react'
import type { ConditionRowProps } from '../../types'
import { kasirLogger } from '../../services/logger'

// Standard condition options with penalty implications
const CONDITION_OPTIONS = [
  { value: 'baik', label: 'Baik', color: 'bg-green-100 text-green-800 border-green-200', penalty: 0 },
  { value: 'kotor', label: 'Kotor', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', penalty: 5000 },
  { value: 'rusak ringan', label: 'Rusak Ringan', color: 'bg-orange-100 text-orange-800 border-orange-200', penalty: 15000 },
  { value: 'rusak berat', label: 'Rusak Berat', color: 'bg-red-100 text-red-800 border-red-200', penalty: 50000 },
  { value: 'hilang', label: 'Hilang', color: 'bg-gray-100 text-gray-800 border-gray-200', penalty: 'modal_awal' },
] as const

/**
 * ConditionRow Component
 * Individual condition entry with built-in validation and smart defaults
 * Provides real-time validation, smart suggestions, and accessibility support
 */
export function ConditionRow({
  condition,
  onChange,
  onRemove,
  disabled = false,
  canRemove = false,
  autoFocus = false,
  maxQuantity = 1,
  remainingQuantity = 0,
}: ConditionRowProps) {
  // Get condition metadata for UI styling
  const conditionMeta = useMemo(() => {
    return CONDITION_OPTIONS.find(opt => opt.value === condition.kondisiAkhir) || CONDITION_OPTIONS[0]
  }, [condition.kondisiAkhir])

  // Validation state
  const validation = useMemo(() => {
    const errors: string[] = []
    const warnings: string[] = []

    if (!condition.kondisiAkhir) {
      errors.push('Kondisi harus dipilih')
    }

    if (!condition.jumlahKembali || condition.jumlahKembali <= 0) {
      errors.push('Jumlah harus lebih dari 0')
    } else if (condition.jumlahKembali > maxQuantity) {
      errors.push(`Jumlah tidak boleh lebih dari ${maxQuantity}`)
    }

    // Smart warnings
    if (condition.kondisiAkhir === 'hilang' && condition.jumlahKembali > 1) {
      warnings.push('Item hilang biasanya dicatat per unit untuk tracking yang lebih baik')
    }

    if (condition.kondisiAkhir === 'baik' && remainingQuantity > 0) {
      warnings.push(`Masih ada ${remainingQuantity} unit yang belum dialokasikan`)
    }

    return {
      isValid: errors.length === 0,
      hasWarnings: warnings.length > 0,
      errors,
      warnings
    }
  }, [condition, maxQuantity, remainingQuantity])

  // Handle condition type change
  const handleConditionChange = useCallback((value: string) => {
    kasirLogger.userInteraction.debug('handleConditionChange', 'Condition type changed', {
      previousCondition: condition.kondisiAkhir,
      newCondition: value,
      quantity: condition.jumlahKembali
    })

    const newCondition = { ...condition, kondisiAkhir: value }

    // Auto-calculate modal awal for lost items (placeholder - would use actual product data)
    if (value === 'hilang') {
      newCondition.modalAwal = 100000 // Placeholder - should come from product data
      newCondition.isLostItem = true
    } else {
      delete newCondition.modalAwal
      delete newCondition.isLostItem
    }

    onChange(newCondition)
  }, [condition, onChange])

  // Handle quantity change
  const handleQuantityChange = useCallback((value: string) => {
    const quantity = parseInt(value) || 0
    
    kasirLogger.userInteraction.debug('handleQuantityChange', 'Quantity changed', {
      previousQuantity: condition.jumlahKembali,
      newQuantity: quantity,
      condition: condition.kondisiAkhir
    })

    onChange({ ...condition, jumlahKembali: quantity })
  }, [condition, onChange])

  // Handle remove condition
  const handleRemove = useCallback(() => {
    kasirLogger.userInteraction.info('handleRemove', 'Condition removed', {
      removedCondition: condition.kondisiAkhir,
      quantity: condition.jumlahKembali
    })
    onRemove?.()
  }, [onRemove, condition])

  return (
    <div className="space-y-3">
      {/* Main Condition Row */}
      <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-shadow">
        {/* Condition Selector */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-medium text-gray-700">
              Kondisi
            </label>
            {conditionMeta.penalty === 'modal_awal' && (
              <Badge variant="outline" className="text-xs">
                <Calculator className="w-3 h-3 mr-1" />
                Modal Awal
              </Badge>
            )}
          </div>
          
          <Select 
            value={condition.kondisiAkhir || ''} 
            onValueChange={handleConditionChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih kondisi..." />
            </SelectTrigger>
            <SelectContent>
              {CONDITION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${option.color}`}>
                      {option.label}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {option.penalty === 'modal_awal' ? 'Modal Awal' : 
                       option.penalty === 0 ? 'Tanpa Penalty' : 
                       `Rp ${option.penalty.toLocaleString('id-ID')}`}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quantity Input */}
        <div className="w-24">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Jumlah
          </label>
          <Input
            type="number"
            min="1"
            max={maxQuantity}
            value={condition.jumlahKembali || ''}
            onChange={(e) => handleQuantityChange(e.target.value)}
            disabled={disabled}
            autoFocus={autoFocus}
            className="text-center"
            placeholder="0"
          />
        </div>

        {/* Remove Button */}
        {canRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
            title="Hapus kondisi ini"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Validation Messages */}
      {!validation.isValid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Warnings */}
      {validation.hasWarnings && validation.isValid && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="space-y-1">
              {validation.warnings.map((warning, index) => (
                <li key={index} className="text-amber-700">
                  💡 {warning}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Penalty Preview */}
      {validation.isValid && condition.kondisiAkhir && (
        <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={conditionMeta.color}>
              {condition.jumlahKembali}x {conditionMeta.label}
            </Badge>
            {condition.isLostItem && condition.modalAwal && (
              <span className="text-gray-600">
                Modal: Rp {condition.modalAwal.toLocaleString('id-ID')}
              </span>
            )}
          </div>
          
          <div className="text-right">
            {conditionMeta.penalty === 'modal_awal' ? (
              <span className="font-medium text-red-600">
                Rp {((condition.modalAwal || 0) * condition.jumlahKembali).toLocaleString('id-ID')}
              </span>
            ) : conditionMeta.penalty > 0 ? (
              <span className="font-medium text-orange-600">
                Rp {(conditionMeta.penalty * condition.jumlahKembali).toLocaleString('id-ID')}
              </span>
            ) : (
              <span className="font-medium text-green-600">
                Tanpa Penalty
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}