'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Package, Plus, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { ConditionPricingForm } from './ConditionPricingForm'
import type {
  UnifiedConditionFormProps,
  EnhancedItemCondition,
  ConditionSplit,
  ConditionValidationResult,
  ConditionCategory,
} from '../../types'
import { kasirLogger } from '../../lib/logger'
import { extractSizeInfo } from '../../lib/utils/kondisiAwalParser'

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
  remainingQuantity, // Add remaining quantity prop
}: UnifiedConditionFormProps) {
  // ✅ SMART DEFAULT: Use remaining quantity as helpful default, but allow zero for partial return
  // This provides the best UX: auto-fill with remaining quantity, but user can adjust to 0 if needed
  const getSmartDefaultQuantity = (item: any, existingValue?: EnhancedItemCondition | null, remainingQty?: number) => {
    // If there's an existing value, use it (form already initialized)
    if (existingValue?.conditions?.[0]?.jumlahKembali !== undefined) {
      return existingValue.conditions[0].jumlahKembali
    }
    
    // ✅ FIX: Use remaining quantity if provided, otherwise fall back to jumlahDiambil
    // This fixes the issue where form shows total picked up instead of remaining quantity
    return remainingQty !== undefined ? remainingQty : (item.jumlahDiambil || 0)
  }

  const smartDefaultQuantity = getSmartDefaultQuantity(item, value, remainingQuantity)
  
  const initialCondition: EnhancedItemCondition = value || {
    itemId: item.id,
    mode: 'single', // Internal mode tracking (simplified)
    conditions: [
      {
        kondisiAkhir: 'Baik', // Default valid description for BAIK category
        jumlahKembali: smartDefaultQuantity, // ✅ Smart default: remaining quantity, but adjustable to 0
        conditionCategory: 'BAIK' as ConditionCategory,
        useManualPricing: false,
        manualPrice: 0,
      },
    ],
    // ✅ Smart validation: valid if quantity > 0, but allow 0 for partial return scenarios
    isValid: smartDefaultQuantity > 0, 
    totalQuantity: remainingQuantity !== undefined ? remainingQuantity : item.jumlahDiambil, // ✅ Use remaining quantity for accurate total
    remainingQuantity: Math.max(0, (remainingQuantity !== undefined ? remainingQuantity : item.jumlahDiambil) - smartDefaultQuantity),
  }

  const [currentCondition, setCurrentCondition] = useState<EnhancedItemCondition>(initialCondition)
  const [touched, setTouched] = useState(false) // ✅ Start as untouched - user needs to interact first

  // Debug logging for component initialization
  useEffect(() => {
    kasirLogger.returnProcess.debug('UnifiedConditionForm', 'Form component initialized', {
      itemId: item.id,
      productName: item.produk?.name,
      totalQuantity: item.jumlahDiambil,
      initialMode: initialCondition.mode,
      hasExistingValue: !!value,
    })
  }, [item.id, item.produk?.name, item.jumlahDiambil, initialCondition.mode, value])

  // Validation logic
  const validation = useMemo((): ConditionValidationResult => {
    const totalReturned = currentCondition.conditions.reduce(
      (sum, c) => sum + (c.jumlahKembali || 0),
      0,
    )
    const remaining = currentCondition.totalQuantity - totalReturned
    const hasValidConditions = currentCondition.conditions.every((c) => {
      // Special validation for HILANG category
      // ✅ FIX: Allow non-zero jumlahKembali for HILANG (frontend sends quantity, backend sets jumlahKembali=0)
      if (c.conditionCategory === 'HILANG') {
        return (
          c.kondisiAkhir &&
          c.kondisiAkhir.length >= 4 &&
          c.kondisiAkhir.length <= 500 &&
          c.jumlahKembali !== undefined &&
          c.jumlahKembali > 0 && // ✅ Changed: Allow positive quantity for HILANG
          c.useManualPricing &&
          c.manualPrice !== undefined &&
          c.manualPrice >= 0
        )
      }

      const basicValidation =
        c.kondisiAkhir &&
        c.kondisiAkhir.length >= 4 &&
        c.kondisiAkhir.length <= 500 &&
        c.jumlahKembali !== undefined &&
        c.jumlahKembali >= 0 && // ✅ PARTIAL RETURN FIX: Allow 0 quantity for partial return scenarios
        c.conditionCategory

      // Enhanced validation for BAIK category
      if (c.conditionCategory === 'BAIK') {
        return basicValidation && !c.useManualPricing && (!c.manualPrice || c.manualPrice === 0)
      }

      // Standard validation for non-BAIK categories
      return (
        basicValidation &&
        (!c.useManualPricing || (c.manualPrice !== undefined && c.manualPrice >= 0))
      )
    })

    let error: string | undefined
    const warnings: string[] = []

    if (totalReturned > currentCondition.totalQuantity) {
      error = `Total ${totalReturned} melebihi maksimal ${currentCondition.totalQuantity} unit`
    } else if (totalReturned < 0) {
      // ✅ PARTIAL RETURN FIX: Allow totalReturned = 0 for partial return scenarios
      // User might not want to return any items in current session
      error = 'Jumlah tidak boleh negatif'
    } else if (!hasValidConditions) {
      // Check specific validation issues with enhanced BAIK category validation
      const invalidConditions = currentCondition.conditions.filter((c) => {
        const basicValidation =
          c.kondisiAkhir &&
          c.kondisiAkhir.length >= 4 &&
          c.kondisiAkhir.length <= 500 &&
          c.jumlahKembali !== undefined &&
          c.jumlahKembali > 0 &&
          c.conditionCategory

        if (!basicValidation) return true

        // BAIK category specific validation
        if (c.conditionCategory === 'BAIK') {
          return c.useManualPricing || (c.manualPrice && c.manualPrice > 0)
        }

        // Non-BAIK category validation
        return c.useManualPricing && (c.manualPrice === undefined || c.manualPrice < 0)
      })

      if (invalidConditions.length > 0) {
        const firstInvalid = invalidConditions[0]
        if (!firstInvalid.kondisiAkhir) {
          error = 'Semua kondisi harus dipilih'
        } else if (!firstInvalid.conditionCategory) {
          error = 'Kategori kondisi harus dipilih'
        } else if (firstInvalid.kondisiAkhir.length > 500) {
          error = 'Kondisi maksimal 500 karakter'
        } else if (!firstInvalid.jumlahKembali || firstInvalid.jumlahKembali < 0) {
          // ✅ PARTIAL RETURN FIX: Allow jumlahKembali = 0, only prevent negative values
          error = 'Jumlah kembali tidak boleh negatif'
        } else if (firstInvalid.conditionCategory === 'BAIK' && firstInvalid.useManualPricing) {
          error = 'Kondisi BAIK tidak boleh menggunakan manual pricing'
        } else if (firstInvalid.conditionCategory === 'BAIK') {
          error = 'Kondisi BAIK tidak boleh memiliki manual price (harus 0)'
        } else if (
          firstInvalid.useManualPricing &&
          (firstInvalid.manualPrice === undefined || firstInvalid.manualPrice < 0)
        ) {
          error = 'Harga manual harus diisi dan tidak boleh negatif'
        }
      } else {
        error = 'Semua kondisi harus diisi dengan lengkap'
      }
    }

    // Progressive disclosure warnings/suggestions

    if (currentCondition.conditions.length > 3) {
      warnings.push('Banyak kondisi berbeda - pastikan sudah sesuai kebutuhan')
    }

    // ✅ SMART VALIDATION: Support both helpful defaults and partial return flexibility
    // - Allow totalReturned = 0 for partial return scenarios (user can skip items)
    // - Allow totalReturned > 0 for normal return scenarios (most common case)
    // - Only show error for negative values or over-return
    const validationResult = {
      isValid: !error && totalReturned >= 0, // ✅ Allow 0 or positive quantities
      remaining,
      totalReturned,
      maxAllowed: currentCondition.totalQuantity,
      error,
      warnings: warnings.length > 0 ? warnings : undefined,
    }

    kasirLogger.validation.debug('validation', 'Form validation calculated', {
      itemId: item.id,
      conditionCount: currentCondition.conditions.length,
      totalReturned,
      remaining,
      maxAllowed: currentCondition.totalQuantity,
      isValid: validationResult.isValid,
      hasError: !!error,
      warningCount: warnings.length,
      validationState: error
        ? 'error'
        : validationResult.isValid && remaining === 0
          ? 'complete'
          : totalReturned > 0
            ? 'partial'
            : 'empty',
    })

    return validationResult
  }, [currentCondition, item.id])

  // Smart suggestion logic - show when partial quantity entered and room for more conditions
  const shouldShowSuggestion = useMemo(() => {
    if (currentCondition.conditions.length > 1) return false // Already multi-condition
    if (validation.remaining <= 0) return false // No remaining quantity
    if (!validation.totalReturned || validation.totalReturned <= 0) return false // No valid input yet

    const firstCondition = currentCondition.conditions[0]
    if (!firstCondition?.kondisiAkhir || !firstCondition?.jumlahKembali) return false // Invalid first condition

    // ✅ FIX: Allow suggestion for HILANG when there's remaining quantity
    // Example: 2 units total, 1 HILANG, 1 BAIK - should show "Add Condition" button
    // Removed: if (firstCondition.conditionCategory === 'HILANG') return false

    // ✅ PARTIAL RETURN FIX: Progressive disclosure for partial return scenarios
    // Show suggestion when user has entered some quantity but hasn't allocated all items
    // Allow suggestion even when totalReturned = 0 (user might want to add conditions without returning in current session)
    const shouldShow =
      validation.remaining > 0 && 
      validation.remaining < currentCondition.totalQuantity &&
      validation.totalReturned >= 0 // ✅ Allow 0 or positive (was > 0)

    // Debug logging for progressive disclosure decision
    kasirLogger.returnProcess.debug('shouldShowSuggestion', 'Progressive disclosure evaluation', {
      itemId: item.id,
      conditionCount: currentCondition.conditions.length,
      remaining: validation.remaining,
      totalReturned: validation.totalReturned,
      totalQuantity: currentCondition.totalQuantity,
      shouldShow,
      firstConditionValid: !!(firstCondition?.kondisiAkhir && firstCondition?.jumlahKembali),
      firstConditionCategory: firstCondition?.conditionCategory,
    })

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

    kasirLogger.returnProcess.debug('UnifiedConditionForm', 'onChange callback will be called', {
      itemId: item.id,
      productName: item.produk?.name,
      isValid: validation.isValid,
      remainingQuantity: validation.remaining,
      totalReturned: validation.totalReturned,
      hasError: !!validation.error,
      conditionsCount: currentCondition.conditions.length,
      hasOnChangeCallback: typeof onChange === 'function',
      conditionStructure: Object.keys(updatedCondition),
    })

    onChange(updatedCondition)

    kasirLogger.returnProcess.debug('UnifiedConditionForm', 'onChange callback completed', {
      itemId: item.id,
      productName: item.produk?.name,
    })
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

      // Mark form as touched when user starts interacting
      if (!touched) {
        setTouched(true)
      }

      setCurrentCondition((prev) => ({
        ...prev,
        conditions: prev.conditions.map((cond, i) => (i === index ? newCondition : cond)),
      }))
    },
    [item.id, touched],
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
          conditionCategory: 'BAIK' as ConditionCategory,
          useManualPricing: false,
          manualPrice: 0,
        },
      ],
    }))
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

  // Extract size information from kondisiAwal
  const sizeInfo = useMemo(() => extractSizeInfo(item), [item])

  return (
    <Card className={`transition-all duration-200 ${getCardStyling()}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-100 text-blue-600">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {item.produk?.name || 'Unknown Product'}
                {sizeInfo.hasSizeInfo && (
                  <Badge
                    variant="outline"
                    className="bg-indigo-100 text-indigo-800 border-indigo-200"
                  >
                    {sizeInfo.size} | {sizeInfo.ageCategory}
                  </Badge>
                )}
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
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            {validation.isValid && validation.remaining === 0 && validation.totalReturned > 0 ? (
              <Badge className="bg-green-500 text-white">
                <CheckCircle className="w-3 h-3 mr-1" />
                Lengkap
              </Badge>
            ) : validation.error && touched ? (
              <Badge variant="destructive">
                <AlertCircle className="w-3 h-3 mr-1" />
                Perlu Diperbaiki
              </Badge>
            ) : validation.totalReturned > 0 && touched ? (
              <Badge className="bg-yellow-500 text-black">
                Dalam Proses ({validation.totalReturned}/{currentCondition.totalQuantity})
              </Badge>
            ) : validation.totalReturned > 0 && !touched ? (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Siap Diproses (Default)
              </Badge>
            ) : touched ? (
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                <Clock className="w-3 h-3 mr-1" />
                Sedang Diisi
              </Badge>
            ) : (
              <Badge variant="outline" className="text-gray-600">
                Siap Diisi
              </Badge>
            )}
          </div>
        </div>

        {/* Validation Error Display - Only show when touched */}
        {validation.error && touched && (
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
            <ConditionPricingForm
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
              productModalAwal={item.produk?.modalAwal || 0}
            />
          ))}

          {/* Add Condition Button - Progressive Disclosure */}
          {!disabled && !isLoading && validation.remaining > 0 && shouldShowSuggestion && (
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
              {validation.isValid && validation.remaining === 0 && validation.totalReturned > 0
                ? '✅ Lengkap'
                : validation.error && touched
                  ? '❌ Perlu diperbaiki'
                  : validation.totalReturned > 0
                    ? '⏳ Dalam proses'
                    : validation.totalReturned === 0 && touched
                      ? '⏸️ Tidak dikembalikan sesi ini'
                      : validation.totalReturned > 0 && !touched
                        ? '📋 Siap diproses (default)'
                        : '📋 Siap diisi'}
            </span>
            {validation.remaining > 0 && <span>Sisa: {validation.remaining} unit</span>}
            <span>
              Total: {validation.totalReturned}/{currentCondition.totalQuantity} unit
            </span>
          </div>

          {validation.isValid && validation.remaining === 0 && validation.totalReturned > 0 && (
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
              Siap diproses
            </Badge>
          )}

          {/* ✅ SMART DEFAULT: Show status for default values that are ready to process */}
          {validation.isValid && validation.totalReturned > 0 && !touched && (
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
              Siap diproses (default)
            </Badge>
          )}

          {/* ✅ PARTIAL RETURN: Show status for items not being returned in current session */}
          {validation.totalReturned === 0 && touched && !validation.error && (
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
              Tidak dikembalikan sesi ini
            </Badge>
          )}
        </div>
      </div>
    </Card>
  )
}
