'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Package, Info, ArrowRight, Zap } from 'lucide-react'
import { ItemConditionForm } from './ItemConditionForm'
import { MultiConditionForm } from './MultiConditionForm'
import { ModeToggle } from './ModeToggle'
import type { 
  EnhancedItemCondition, 
  ConditionSplit,
  ConditionValidationResult 
} from '../../types/multiConditionReturn'
import type { TransaksiDetail } from '../../types'
import type { TransaksiItem } from '../../types/index'

interface EnhancedItemConditionFormProps {
  item: TransaksiItem
  value: EnhancedItemCondition | null
  onChange: (condition: EnhancedItemCondition) => void
  disabled?: boolean
  isLoading?: boolean
  showModeToggle?: boolean
}

/**
 * Enhanced Item Condition Form Component
 * Progressive enhancement wrapper that shows appropriate interface based on complexity
 * - Single condition: Uses existing ItemConditionForm
 * - Multi-condition: Uses new MultiConditionForm
 * - Smart detection based on item quantity and user preference
 */
export function EnhancedItemConditionForm({
  item,
  value,
  onChange,
  disabled = false,
  isLoading = false,
  showModeToggle = true,
}: EnhancedItemConditionFormProps) {
  // Initialize condition if null
  const initialCondition: EnhancedItemCondition = value || {
    itemId: item.id,
    mode: 'single',
    conditions: [{ kondisiAkhir: '', jumlahKembali: item.jumlahDiambil }],
    isValid: false,
    totalQuantity: item.jumlahDiambil,
    remainingQuantity: item.jumlahDiambil,
  }

  const [currentCondition, setCurrentCondition] = useState<EnhancedItemCondition>(initialCondition)
  const [validation, setValidation] = useState<ConditionValidationResult | null>(null)

  // Smart detection: should show multi-condition option?
  const shouldShowMultiOption = useMemo(() => {
    return item.jumlahDiambil > 1 // Only show for items with quantity > 1
  }, [item.jumlahDiambil])

  // Auto-suggest multi-condition for complex scenarios
  const suggestMultiCondition = useMemo(() => {
    return item.jumlahDiambil >= 3 && currentCondition.mode === 'single'
  }, [item.jumlahDiambil, currentCondition.mode])

  // Update parent when condition changes
  useEffect(() => {
    onChange(currentCondition)
  }, [currentCondition, onChange])

  // Handle mode change with data preservation
  const handleModeChange = (mode: 'single' | 'multi') => {
    let newConditions: ConditionSplit[]

    if (mode === 'single' && currentCondition.conditions.length > 0) {
      // Multi → Single: Take first condition or create default
      const firstCondition = currentCondition.conditions[0]
      newConditions = [firstCondition || { kondisiAkhir: '', jumlahKembali: item.jumlahDiambil }]
    } else if (mode === 'multi' && currentCondition.mode === 'single') {
      // Single → Multi: Convert single condition to array or create default
      newConditions = currentCondition.conditions.length > 0 
        ? [...currentCondition.conditions] 
        : [{ kondisiAkhir: '', jumlahKembali: item.jumlahDiambil }]
    } else {
      newConditions = [...currentCondition.conditions]
    }

    setCurrentCondition(prev => ({
      ...prev,
      mode,
      conditions: newConditions,
      remainingQuantity: item.jumlahDiambil - newConditions.reduce((sum, c) => sum + (c.jumlahKembali || 0), 0)
    }))
  }

  // Handle single condition change (legacy format)
  const handleSingleConditionChange = (kondisiAkhir: string, jumlahKembali: number) => {
    const newCondition: ConditionSplit = { kondisiAkhir, jumlahKembali }
    
    setCurrentCondition(prev => ({
      ...prev,
      conditions: [newCondition],
      isValid: kondisiAkhir.length > 0 && jumlahKembali > 0,
      remainingQuantity: item.jumlahDiambil - jumlahKembali
    }))
  }

  // Handle multi-condition change
  const handleMultiConditionChange = (conditions: ConditionSplit[]) => {
    const totalReturned = conditions.reduce((sum, c) => sum + (c.jumlahKembali || 0), 0)
    const isValid = conditions.every(c => c.kondisiAkhir && c.jumlahKembali !== undefined) && 
                   totalReturned <= item.jumlahDiambil && totalReturned > 0

    setCurrentCondition(prev => ({
      ...prev,
      conditions,
      isValid,
      remainingQuantity: item.jumlahDiambil - totalReturned
    }))
  }

  // Handle validation change from multi-condition form
  const handleValidationChange = (newValidation: ConditionValidationResult) => {
    setValidation(newValidation)
    
    setCurrentCondition(prev => ({
      ...prev,
      isValid: newValidation.isValid,
      validationError: newValidation.error,
      remainingQuantity: newValidation.remaining
    }))
  }

  // Get condition color based on current state
  const getConditionColor = () => {
    if (validation?.error || !currentCondition.isValid) {
      return 'border-red-200 bg-red-50'
    } else if (currentCondition.isValid) {
      return 'border-green-200 bg-green-50'
    }
    return 'border-gray-200'
  }

  // Get mode badge color
  const getModeColor = () => {
    if (currentCondition.mode === 'multi') {
      return 'bg-purple-100 text-purple-800 border-purple-200'
    }
    return 'bg-blue-100 text-blue-800 border-blue-200'
  }

  return (
    <Card className={`transition-all duration-200 ${getConditionColor()}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {item.produk?.name || 'Unknown Product'}
                <Badge variant="outline" className={getModeColor()}>
                  {currentCondition.mode === 'multi' ? 'Multi-Kondisi' : 'Kondisi Tunggal'}
                </Badge>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Quantity: {item.jumlahDiambil} unit
                {currentCondition.mode === 'multi' && (
                  <> • {currentCondition.conditions.length} kondisi berbeda</>
                )}
              </p>
            </div>
          </div>

          {/* Mode Toggle */}
          {showModeToggle && shouldShowMultiOption && !disabled && (
            <ModeToggle
              mode={currentCondition.mode}
              onModeChange={handleModeChange}
              itemQuantity={item.jumlahDiambil}
              disabled={isLoading}
              showLabels={true}
            />
          )}
        </div>

        {/* Multi-condition suggestion for complex items */}
        {suggestMultiCondition && (
          <Alert className="mt-4">
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <strong>Saran:</strong> Item dengan {item.jumlahDiambil} unit mungkin dikembalikan dalam kondisi berbeda. 
                  Mode multi-kondisi memberikan penalty yang lebih akurat.
                </div>
                <button 
                  onClick={() => handleModeChange('multi')}
                  className="ml-4 text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 whitespace-nowrap"
                >
                  Gunakan Multi-Kondisi <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Error Display */}
        {validation?.error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>
              {validation.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Warnings Display */}
        {validation?.warnings && validation.warnings.length > 0 && (
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
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
        {/* Conditional Form Rendering */}
        {currentCondition.mode === 'single' ? (
          <ItemConditionForm
            transaction={{
              items: [item],
            } as TransaksiDetail}
            itemConditions={{
              [item.id]: currentCondition.conditions[0] || { kondisiAkhir: '', jumlahKembali: item.jumlahDiambil },
            }}
            onConditionsChange={(conditions: Record<string, { kondisiAkhir: string; jumlahKembali: number }>) => {
              const itemCondition = conditions[item.id]
              if (itemCondition) {
                handleSingleConditionChange(itemCondition.kondisiAkhir, itemCondition.jumlahKembali)
              }
            }}
            isLoading={disabled}
          />
        ) : (
          <MultiConditionForm
            itemId={item.id}
            itemName={item.produk?.name || 'Unknown Product'}
            maxQuantity={item.jumlahDiambil}
            initialConditions={currentCondition.conditions}
            onConditionsChange={handleMultiConditionChange}
            onValidationChange={handleValidationChange}
            disabled={disabled}
            isLoading={isLoading}
          />
        )}
      </CardContent>

      {/* Summary Footer */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-4">
            <span>
              Status: {currentCondition.isValid ? '✅ Valid' : '⚠️ Perlu dilengkapi'}
            </span>
            {currentCondition.mode === 'multi' && (
              <span>
                Sisa: {currentCondition.remainingQuantity} unit
              </span>
            )}
          </div>
          
          {currentCondition.isValid && (
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
              Siap diproses
            </Badge>
          )}
        </div>
      </div>
    </Card>
  )
}