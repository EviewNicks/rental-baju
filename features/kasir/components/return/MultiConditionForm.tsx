'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, AlertTriangle, Info, CheckCircle, Package } from 'lucide-react'
import { ConditionSplitCard } from './ConditionSplitCard'
import type { MultiConditionFormProps, ConditionSplit, ConditionValidationResult } from '../../types/multiConditionReturn'

/**
 * Multi-Condition Form Component
 * Main interface for handling items with multiple condition splits
 */
export function MultiConditionForm({
  itemId,
  itemName,
  maxQuantity,
  initialConditions = [],
  onConditionsChange,
  onValidationChange,
  disabled = false,
  isLoading = false,
}: MultiConditionFormProps) {
  const [conditions, setConditions] = useState<ConditionSplit[]>(
    initialConditions.length > 0 
      ? initialConditions 
      : [{ kondisiAkhir: '', jumlahKembali: 1 }] // Start with one condition
  )

  // Real-time validation
  const validation = useMemo(() => {
    const totalReturned = conditions.reduce((sum, c) => sum + (c.jumlahKembali || 0), 0)
    const remaining = maxQuantity - totalReturned
    const hasValidConditions = conditions.every(c => c.kondisiAkhir && c.jumlahKembali !== undefined)
    
    let error: string | undefined
    const warnings: string[] = []
    
    if (totalReturned > maxQuantity) {
      error = `Total ${totalReturned} melebihi maksimal ${maxQuantity} unit`
    } else if (totalReturned === 0) {
      error = 'Minimal harus mengembalikan 1 unit atau tandai sebagai hilang'
    } else if (!hasValidConditions) {
      error = 'Semua kondisi harus diisi dengan lengkap'
    }

    // Warnings for edge cases
    if (remaining > 0 && !error) {
      warnings.push(`Masih ada ${remaining} unit yang belum dialokasikan`)
    }

    if (conditions.length > 5) {
      warnings.push('Terlalu banyak kondisi berbeda, pertimbangkan untuk menggabungkan yang serupa')
    }

    const result: ConditionValidationResult = {
      isValid: !error,
      remaining,
      totalReturned,
      maxAllowed: maxQuantity,
      error,
      warnings: warnings.length > 0 ? warnings : undefined,
    }

    return result
  }, [conditions, maxQuantity])

  // Update parent when conditions change
  useEffect(() => {
    if (validation.isValid) {
      onConditionsChange(conditions)
    }
    onValidationChange?.(validation)
  }, [conditions, validation, onConditionsChange, onValidationChange])

  // Handle condition changes
  const handleConditionChange = (index: number, newCondition: ConditionSplit) => {
    const newConditions = [...conditions]
    newConditions[index] = newCondition
    setConditions(newConditions)
  }

  // Add new condition
  const handleAddCondition = () => {
    if (validation.remaining > 0) {
      const newCondition: ConditionSplit = {
        kondisiAkhir: '',
        jumlahKembali: Math.min(validation.remaining, 1)
      }
      setConditions([...conditions, newCondition])
    }
  }

  // Remove condition
  const handleRemoveCondition = (index: number) => {
    if (conditions.length > 1) { // Always keep at least one condition
      const newConditions = conditions.filter((_, i) => i !== index)
      setConditions(newConditions)
    }
  }

  // Calculate available quantity for each condition (remaining + current condition quantity)
  const getAvailableQuantityForCondition = (index: number) => {
    return validation.remaining + (conditions[index]?.jumlahKembali || 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-green-100 text-green-600">
          <Package className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-medium text-lg">{itemName}</h4>
          <p className="text-sm text-gray-600">
            Total: {maxQuantity} unit - Mode kondisi berbeda
          </p>
        </div>
      </div>

      {/* Validation Summary */}
      <Card className={`p-4 ${
        validation.error 
          ? 'border-red-200 bg-red-50' 
          : validation.isValid 
            ? 'border-green-200 bg-green-50' 
            : 'border-yellow-200 bg-yellow-50'
      }`}>
        <div className="flex items-start gap-3">
          {validation.error ? (
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          ) : validation.isValid ? (
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          ) : (
            <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
          )}
          
          <div className="flex-1">
            <div className="font-medium mb-1">
              {validation.error 
                ? 'Perlu Perbaikan'
                : validation.isValid 
                  ? 'Semua Kondisi Valid'
                  : 'Lengkapi Kondisi'
              }
            </div>
            
            <div className="text-sm space-y-1">
              <div>
                Total dikembalikan: <strong>{validation.totalReturned}</strong> dari <strong>{maxQuantity}</strong> unit
              </div>
              
              {validation.remaining > 0 && (
                <div className="text-orange-600">
                  Sisa: <strong>{validation.remaining}</strong> unit belum dialokasikan
                </div>
              )}
              
              {validation.error && (
                <div className="text-red-600 font-medium">
                  ⚠ {validation.error}
                </div>
              )}
              
              {validation.warnings && validation.warnings.map((warning, i) => (
                <div key={i} className="text-yellow-600">
                  💡 {warning}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Condition Split Cards */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h5 className="font-medium">Kondisi per Unit</h5>
          <div className="text-sm text-gray-600">
            {conditions.length} kondisi berbeda
          </div>
        </div>

        {conditions.map((condition, index) => (
          <ConditionSplitCard
            key={index}
            condition={condition}
            index={index}
            maxQuantity={maxQuantity}
            availableQuantity={getAvailableQuantityForCondition(index)}
            onConditionChange={(newCondition) => handleConditionChange(index, newCondition)}
            onRemove={() => handleRemoveCondition(index)}
            showRemoveButton={conditions.length > 1}
            disabled={disabled || isLoading}
          />
        ))}
      </div>

      {/* Add Condition Button */}
      {validation.remaining > 0 && conditions.length < 10 && (
        <Card className="p-4 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
          <Button
            variant="ghost"
            onClick={handleAddCondition}
            disabled={disabled || isLoading || validation.remaining <= 0}
            className="w-full h-auto py-4 flex flex-col items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">Tambah Kondisi Berbeda</span>
            <span className="text-sm opacity-75">
              Untuk {validation.remaining} unit yang tersisa
            </span>
          </Button>
        </Card>
      )}

      {/* Instructions */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Panduan Multi-Kondisi:</strong>
          <ul className="mt-2 text-sm space-y-1 ml-4 list-disc">
            <li>Pisahkan unit dengan kondisi berbeda ke dalam kartu terpisah</li>
            <li>Total unit dari semua kondisi harus sama dengan yang diambil ({maxQuantity} unit)</li>
            <li>Barang hilang otomatis memiliki jumlah = 0</li>
            <li>Penalty akan dihitung per kondisi untuk keadilan</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}