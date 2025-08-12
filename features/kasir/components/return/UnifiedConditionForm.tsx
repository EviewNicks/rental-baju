'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Package, Plus, Lightbulb, CheckCircle, AlertCircle } from 'lucide-react'
import { ConditionRow } from './ConditionRow'
import type {
  UnifiedConditionFormProps,
  EnhancedItemCondition,
  ConditionSplit,
  ConditionValidationResult,
} from '../../types'
import { kasirLogger } from '../../lib/logger'

/**
 * UnifiedConditionForm Component
 * Single form component handling all return scenarios through progressive disclosure
 *
 * Key Features:
 * - Starts simple: single condition row for all items
 * - Progressive disclosure: "Add Condition" appears when needed
 * - Smart suggestions: auto-suggest condition splits for partial quantities
 * - Real-time validation: immediate feedback on constraints
 * - Unified data model: always uses ConditionSplit[] internally
 */
export function UnifiedConditionForm({
  item,
  value,
  onChange,
  disabled = false,
  isLoading = false,
}: UnifiedConditionFormProps) {
  // Initialize with unified structure (always array)
  const initialCondition: EnhancedItemCondition = value || {
    itemId: item.id,
    mode: 'single', // Internal mode tracking (simplified)
    conditions: [{ kondisiAkhir: '', jumlahKembali: item.jumlahDiambil }],
    isValid: false,
    totalQuantity: item.jumlahDiambil,
    remainingQuantity: item.jumlahDiambil,
  }

  const [currentCondition, setCurrentCondition] = useState<EnhancedItemCondition>(initialCondition)
  const [showSuggestion, setShowSuggestion] = useState(false)

  // Debug logging for component initialization
  useEffect(() => {
    kasirLogger.returnProcess.debug(
      'UnifiedConditionForm',
      'Form component initialized',
      {
        itemId: item.id,
        productName: item.produk?.name,
        totalQuantity: item.jumlahDiambil,
        initialMode: initialCondition.mode,
        hasExistingValue: !!value,
      },
    )
  }, [item.id, item.produk?.name, item.jumlahDiambil, initialCondition.mode, value])

  // Validation logic
  const validation = useMemo((): ConditionValidationResult => {
    const totalReturned = currentCondition.conditions.reduce(
      (sum, c) => sum + (c.jumlahKembali || 0),
      0,
    )
    const remaining = currentCondition.totalQuantity - totalReturned
    const hasValidConditions = currentCondition.conditions.every(
      (c) => 
        c.kondisiAkhir && 
        c.kondisiAkhir.length >= 4 && 
        c.kondisiAkhir.length <= 500 &&
        c.jumlahKembali !== undefined && 
        c.jumlahKembali > 0,
    )

    let error: string | undefined
    const warnings: string[] = []

    if (totalReturned > currentCondition.totalQuantity) {
      error = `Total ${totalReturned} melebihi maksimal ${currentCondition.totalQuantity} unit`
    } else if (totalReturned === 0) {
      error = 'Minimal harus mengembalikan 1 unit atau tandai sebagai hilang'
    } else if (!hasValidConditions) {
      // Check specific validation issues
      const invalidConditions = currentCondition.conditions.filter(c => 
        !c.kondisiAkhir || 
        c.kondisiAkhir.length < 4 || 
        c.kondisiAkhir.length > 500 ||
        !c.jumlahKembali || 
        c.jumlahKembali <= 0
      )
      
      if (invalidConditions.length > 0) {
        const firstInvalid = invalidConditions[0]
        if (!firstInvalid.kondisiAkhir) {
          error = 'Semua kondisi harus dipilih'
        } else if (firstInvalid.kondisiAkhir.length < 4) {
          error = 'Kondisi harus minimal 4 karakter'
        } else if (firstInvalid.kondisiAkhir.length > 500) {
          error = 'Kondisi maksimal 500 karakter'
        } else if (!firstInvalid.jumlahKembali || firstInvalid.jumlahKembali <= 0) {
          error = 'Jumlah kembali harus lebih dari 0'
        }
      } else {
        error = 'Semua kondisi harus diisi dengan lengkap'
      }
    }

    // Progressive disclosure warnings/suggestions
    if (remaining > 0 && totalReturned > 0 && !error) {
      warnings.push(`Masih ada ${remaining} unit yang belum dialokasikan`)
    }

    if (currentCondition.conditions.length > 3) {
      warnings.push('Banyak kondisi berbeda - pastikan sudah sesuai kebutuhan')
    }

    // Debug logging for validation state changes
    const validationResult = {
      isValid: !error,
      remaining,
      totalReturned,
      maxAllowed: currentCondition.totalQuantity,
      error,
      warnings: warnings.length > 0 ? warnings : undefined,
    }

    kasirLogger.validation.debug(
      'validation',
      'Form validation calculated',
      {
        itemId: item.id,
        conditionCount: currentCondition.conditions.length,
        totalReturned,
        remaining,
        maxAllowed: currentCondition.totalQuantity,
        isValid: validationResult.isValid,
        hasError: !!error,
        warningCount: warnings.length,
        validationState: error ? 'error' : validationResult.isValid && remaining === 0 ? 'complete' : totalReturned > 0 ? 'partial' : 'empty',
      },
    )

    return validationResult
  }, [currentCondition, item.id])

  // Smart suggestion logic - show when partial quantity entered and room for more conditions
  const shouldShowSuggestion = useMemo(() => {
    if (currentCondition.conditions.length > 1) return false // Already multi-condition
    if (validation.remaining <= 0) return false // No remaining quantity
    if (!validation.totalReturned || validation.totalReturned <= 0) return false // No valid input yet

    const firstCondition = currentCondition.conditions[0]
    if (!firstCondition?.kondisiAkhir || !firstCondition?.jumlahKembali) return false // Invalid first condition

    const shouldShow = validation.remaining > 0 && validation.remaining < currentCondition.totalQuantity

    // Debug logging for progressive disclosure decision
    kasirLogger.returnProcess.debug(
      'shouldShowSuggestion',
      'Progressive disclosure evaluation',
      {
        itemId: item.id,
        conditionCount: currentCondition.conditions.length,
        remaining: validation.remaining,
        totalReturned: validation.totalReturned,
        totalQuantity: currentCondition.totalQuantity,
        shouldShow,
        firstConditionValid: !!(firstCondition?.kondisiAkhir && firstCondition?.jumlahKembali),
      },
    )

    return shouldShow
  }, [currentCondition, validation, item.id])

  // Update parent when condition changes
  useEffect(() => {
    const updatedCondition = {
      ...currentCondition,
      isValid: validation.isValid,
      remainingQuantity: validation.remaining,
      validationError: validation.error,
    }

    kasirLogger.returnProcess.debug(
      'UnifiedConditionForm',
      'onChange callback will be called',
      {
        itemId: item.id,
        productName: item.produk?.name,
        isValid: validation.isValid,
        remainingQuantity: validation.remaining,
        totalReturned: validation.totalReturned,
        hasError: !!validation.error,
        conditionsCount: currentCondition.conditions.length,
        hasOnChangeCallback: typeof onChange === 'function',
        conditionStructure: Object.keys(updatedCondition),
      },
    )

    onChange(updatedCondition)

    kasirLogger.returnProcess.debug(
      'UnifiedConditionForm',
      'onChange callback completed',
      {
        itemId: item.id,
        productName: item.produk?.name,
      },
    )
    //eslint-disable-next-line
  }, [currentCondition, validation])

  // Handle individual condition change
  const handleConditionChange = useCallback(
    (index: number, newCondition: ConditionSplit) => {
      kasirLogger.userInteraction.debug('handleConditionChange', 'Individual condition updated', {
        itemId: item.id,
        conditionIndex: index,
        kondisiAkhir: newCondition.kondisiAkhir,
        jumlahKembali: newCondition.jumlahKembali,
      })

      setCurrentCondition((prev) => ({
        ...prev,
        conditions: prev.conditions.map((cond, i) => (i === index ? newCondition : cond)),
      }))
    },
    [item.id],
  )

  // Add new condition (progressive disclosure)
  const handleAddCondition = useCallback(() => {
    kasirLogger.userInteraction.info('handleAddCondition', 'New condition added', {
      itemId: item.id,
      currentConditionsCount: currentCondition.conditions.length,
      remainingQuantity: validation.remaining,
    })

    const suggestedQuantity = validation.remaining
    setCurrentCondition((prev) => ({
      ...prev,
      mode: 'multi', // Switch to multi mode
      conditions: [
        ...prev.conditions,
        {
          kondisiAkhir: '',
          jumlahKembali: suggestedQuantity, // Auto-suggest remaining quantity
        },
      ],
    }))

    setShowSuggestion(false)
  }, [item.id, currentCondition.conditions.length, validation.remaining])

  // Remove condition (only allow if more than 1 condition exists)
  const handleRemoveCondition = useCallback(
    (index: number) => {
      if (currentCondition.conditions.length <= 1) return

      kasirLogger.userInteraction.info('handleRemoveCondition', 'Condition removed', {
        itemId: item.id,
        removedIndex: index,
        remainingConditions: currentCondition.conditions.length - 1,
      })

      const newConditions = currentCondition.conditions.filter((_, i) => i !== index)
      setCurrentCondition((prev) => ({
        ...prev,
        conditions: newConditions,
        mode: newConditions.length === 1 ? 'single' : 'multi',
      }))
    },
    [item.id, currentCondition.conditions],
  )

  // Smart suggestion handler
  const handleAcceptSuggestion = useCallback(() => {
    kasirLogger.userInteraction.info(
      'handleAcceptSuggestion',
      'User accepted condition split suggestion',
      {
        itemId: item.id,
        remainingQuantity: validation.remaining,
        suggestedAction: 'add_condition_for_remaining',
      },
    )

    handleAddCondition()
    setShowSuggestion(false)
  }, [item.id, validation.remaining, handleAddCondition])

  const handleDismissSuggestion = useCallback(() => {
    setShowSuggestion(false)
  }, [])

  // Get card styling based on validation state
  const getCardStyling = () => {
    if (validation.error) {
      return 'border-red-200 bg-red-50'
    } else if (validation.isValid && validation.remaining === 0) {
      return 'border-green-200 bg-green-50'
    } else if (validation.totalReturned > 0) {
      return 'border-yellow-200 bg-yellow-50'
    }
    return 'border-gray-200'
  }

  return (
    <Card className={`transition-all duration-200 ${getCardStyling()}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {item.produk?.name || 'Unknown Product'}
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                  {item.jumlahDiambil} unit
                </Badge>
                {currentCondition.conditions.length > 1 && (
                  <Badge
                    variant="outline"
                    className="bg-purple-100 text-purple-800 border-purple-200"
                  >
                    {currentCondition.conditions.length} kondisi
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {currentCondition.conditions.length === 1
                  ? 'Kondisi tunggal untuk semua unit'
                  : `Kondisi berbeda untuk ${currentCondition.conditions.length} kelompok unit`}
              </p>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            {validation.isValid && validation.remaining === 0 ? (
              <Badge className="bg-green-500 text-white">
                <CheckCircle className="w-3 h-3 mr-1" />
                Lengkap
              </Badge>
            ) : validation.error ? (
              <Badge variant="destructive">
                <AlertCircle className="w-3 h-3 mr-1" />
                Error
              </Badge>
            ) : validation.totalReturned > 0 ? (
              <Badge className="bg-yellow-500 text-black">
                Sebagian ({validation.totalReturned}/{currentCondition.totalQuantity})
              </Badge>
            ) : (
              <Badge variant="outline">Belum diisi</Badge>
            )}
          </div>
        </div>

        {/* Smart Suggestion Alert */}
        {shouldShowSuggestion && !showSuggestion && validation.remaining > 0 && (
          <Alert className="mt-4 border-blue-200 bg-blue-50">
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <strong>Saran:</strong> Masih ada {validation.remaining} unit yang belum
                  dialokasikan. Apakah kondisinya berbeda dengan yang sudah diisi?
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    onClick={handleAcceptSuggestion}
                    disabled={disabled}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Tambah Kondisi
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDismissSuggestion}
                    disabled={disabled}
                  >
                    Nanti
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Error Display */}
        {validation.error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validation.error}</AlertDescription>
          </Alert>
        )}

        {/* Validation Warnings */}
        {validation.warnings && validation.warnings.length > 0 && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {validation.warnings.map((warning, index) => (
                <div key={index} className="flex items-center gap-1">
                  💡 {warning}
                </div>
              ))}
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <CardContent>
        {/* Condition Rows - Progressive List */}
        <div className="space-y-4">
          {currentCondition.conditions.map((condition, index) => (
            <ConditionRow
              key={index}
              condition={condition}
              onChange={(newCondition) => handleConditionChange(index, newCondition)}
              onRemove={
                currentCondition.conditions.length > 1
                  ? () => handleRemoveCondition(index)
                  : undefined
              }
              disabled={disabled || isLoading}
              canRemove={currentCondition.conditions.length > 1}
              autoFocus={index === currentCondition.conditions.length - 1 && index > 0}
              maxQuantity={currentCondition.totalQuantity}
              remainingQuantity={validation.remaining}
              productModalAwal={item.produk.modalAwal}
            />
          ))}

          {/* Add Condition Button - Progressive Disclosure */}
          {!disabled && !isLoading && validation.remaining > 0 && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={handleAddCondition}
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
                disabled={validation.remaining <= 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Kondisi Berbeda ({validation.remaining} unit tersisa)
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {/* Summary Footer */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-4">
            <span>
              Status:{' '}
              {validation.isValid && validation.remaining === 0
                ? '✅ Lengkap'
                : validation.totalReturned > 0
                  ? '⏳ Sebagian'
                  : '⚠️ Belum diisi'}
            </span>
            {validation.remaining > 0 && <span>Sisa: {validation.remaining} unit</span>}
            <span>
              Total: {validation.totalReturned}/{currentCondition.totalQuantity} unit
            </span>
          </div>

          {validation.isValid && validation.remaining === 0 && (
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
              Siap diproses
            </Badge>
          )}
        </div>
      </div>
    </Card>
  )
}
