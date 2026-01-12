'use client'

import { useState, useCallback, useEffect } from 'react'
import { Edit3, Check, X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency, parseCurrency } from '../../../lib/utils/client'
import { PriceCalculator } from '../../../lib/utils/priceCalculator'
import type { ProductSelection } from '../../../types'

interface InlinePriceEditorProps {
  item: ProductSelection
  itemIndex: number
  duration: 4 | 7
  onCumulativeAdjustment: (itemIndex: number, adjustmentAmount: number) => void
  onPriceReset: (itemIndex: number) => void
  disabled?: boolean
}

export function InlinePriceEditor({
  item,
  itemIndex,
  duration,
  onCumulativeAdjustment,
  onPriceReset,
  disabled = false
}: InlinePriceEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Calculate original automatic price
  const originalPrice = PriceCalculator.calculateOriginalPrice(item, duration)
  
  // Get current total adjustment and final price
  const totalAdjustment = item.manualPriceAdjustment?.adjustmentAmount || 0
  const currentPrice = originalPrice + totalAdjustment
  const isManuallyAdjusted = item.manualPriceAdjustment?.isManuallyAdjusted || false

  // Initialize input value when editing starts
  useEffect(() => {
    if (isEditing) {
      setInputValue('')
      setError(null)
    }
  }, [isEditing])

  const handleEditStart = useCallback(() => {
    if (disabled) return
    setIsEditing(true)
  }, [disabled])

  const handleEditCancel = useCallback(() => {
    setIsEditing(false)
    setInputValue('')
    setError(null)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    
    // Clear error when user starts typing
    if (error) {
      setError(null)
    }
  }, [error])

  // Parse input with prefix detection
  const parseAdjustmentInput = useCallback((input: string): { amount: number; isValid: boolean; error?: string } => {
    const trimmed = input.trim()
    
    if (!trimmed) {
      return { amount: 0, isValid: false, error: 'Input tidak boleh kosong' }
    }

    let adjustmentAmount: number
    let cleanValue: string

    // Check for explicit prefix
    if (trimmed.startsWith('+')) {
      cleanValue = trimmed.substring(1)
      const parsed = parseCurrency(cleanValue)
      if (isNaN(parsed) || parsed <= 0) {
        return { amount: 0, isValid: false, error: 'Jumlah harus berupa angka positif' }
      }
      adjustmentAmount = parsed
    } else if (trimmed.startsWith('-')) {
      cleanValue = trimmed.substring(1)
      const parsed = parseCurrency(cleanValue)
      if (isNaN(parsed) || parsed <= 0) {
        return { amount: 0, isValid: false, error: 'Jumlah harus berupa angka positif' }
      }
      adjustmentAmount = -parsed
    } else {
      // No prefix - default to positive (add)
      const parsed = parseCurrency(trimmed)
      if (isNaN(parsed) || parsed <= 0) {
        return { amount: 0, isValid: false, error: 'Jumlah harus berupa angka positif' }
      }
      adjustmentAmount = parsed
    }

    return { amount: adjustmentAmount, isValid: true }
  }, [])

  const handleAdjustmentConfirm = useCallback(() => {
    const parseResult = parseAdjustmentInput(inputValue)
    
    if (!parseResult.isValid) {
      setError(parseResult.error || 'Input tidak valid')
      return
    }

    const adjustmentAmount = parseResult.amount
    const newTotalAdjustment = totalAdjustment + adjustmentAmount
    const newTotalPrice = originalPrice + newTotalAdjustment

    // Validate the new total price
    if (newTotalPrice < 0) {
      setError('Total harga tidak boleh negatif')
      return
    }

    // Validate adjustment amount (prevent excessive adjustments)
    const maxTotalAdjustment = originalPrice * 10 // Max 10x original price
    if (Math.abs(newTotalAdjustment) > maxTotalAdjustment) {
      setError(`Total adjustment tidak boleh lebih dari ${formatCurrency(maxTotalAdjustment)}`)
      return
    }


    // Apply cumulative adjustment
    onCumulativeAdjustment(itemIndex, adjustmentAmount)
    setIsEditing(false)
    setError(null)
    setInputValue('')
  }, [inputValue, totalAdjustment, originalPrice, itemIndex, onCumulativeAdjustment, parseAdjustmentInput])

  const handlePriceReset = useCallback(() => {
    onPriceReset(itemIndex)
    setIsEditing(false)
    setError(null)
  }, [itemIndex, onPriceReset])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdjustmentConfirm()
    } else if (e.key === 'Escape') {
      handleEditCancel()
    }
  }, [handleAdjustmentConfirm, handleEditCancel])

  // Preview calculation for display
  const getPreviewCalculation = useCallback(() => {
    if (!inputValue.trim()) return null
    
    const parseResult = parseAdjustmentInput(inputValue)
    if (!parseResult.isValid) return null
    
    const adjustmentAmount = parseResult.amount
    const newTotalAdjustment = totalAdjustment + adjustmentAmount
    const newTotalPrice = originalPrice + newTotalAdjustment
    
    return {
      adjustmentAmount,
      newTotalAdjustment,
      newTotalPrice
    }
  }, [inputValue, totalAdjustment, originalPrice, parseAdjustmentInput])

  if (isEditing) {
    const preview = getPreviewCalculation()
    
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {/* Input field */}
          <div className="flex-1">
            <Input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="Contoh: +75000, -10000, atau 50000"
              className={`text-right ${error ? 'border-red-500' : ''}`}
              autoFocus
            />
          </div>

          {/* Action buttons */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleAdjustmentConfirm}
            disabled={!inputValue.trim()}
            className="h-8 w-8 p-0"
          >
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleEditCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4 text-red-600" />
          </Button>
          {isManuallyAdjusted && (
            <Button
              size="sm"
              variant="outline"
              onClick={handlePriceReset}
              className="h-8 w-8 p-0"
              title="Reset ke harga otomatis"
            >
              <RotateCcw className="h-4 w-4 text-blue-600" />
            </Button>
          )}
        </div>
        
        {error && (
          <div className="text-xs text-red-600 text-right">
            {error}
          </div>
        )}
        
        {/* Price preview */}
        <div className="text-xs text-gray-600 text-right space-y-1">
          <div>Harga asli: {formatCurrency(originalPrice)}</div>
          {totalAdjustment !== 0 && (
            <div>Total adjustment saat ini: {totalAdjustment >= 0 ? '+' : ''}{formatCurrency(totalAdjustment)}</div>
          )}
          {preview && !error && (
            <div className="font-medium text-blue-600">
              Preview: {formatCurrency(originalPrice)} + ({totalAdjustment >= 0 ? '+' : ''}{formatCurrency(totalAdjustment)} {preview.adjustmentAmount >= 0 ? '+' : ''}{formatCurrency(preview.adjustmentAmount)}) = {formatCurrency(preview.newTotalPrice)}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-end gap-2">
        <div className="text-right">
          <div className={`font-semibold ${isManuallyAdjusted ? 'text-blue-600' : 'text-gray-900'}`}>
            {formatCurrency(currentPrice)}
          </div>
          {isManuallyAdjusted && (
            <div className="text-xs text-gray-500 space-y-1">
              <div>Harga asli: {formatCurrency(originalPrice)}</div>
              <div className={`font-medium ${totalAdjustment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Total adjustment: {totalAdjustment >= 0 ? '+' : ''}{formatCurrency(totalAdjustment)}
              </div>
            </div>
          )}
        </div>
        
        {!disabled && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleEditStart}
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Edit harga"
          >
            <Edit3 className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      <div className="text-xs text-gray-600 text-right">
        {item.quantity}x × {duration} hari
      </div>
    </div>
  )
}