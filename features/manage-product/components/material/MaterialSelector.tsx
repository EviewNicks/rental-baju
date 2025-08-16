'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Package, Calculator } from 'lucide-react'
import { useMaterials } from '@/features/manage-product/hooks/useMaterials'
import type { Material } from '@/features/manage-product/types/material'
import { logger } from '@/services/logger'
import { useEffect, useMemo } from 'react'

// Component-specific logger for material selector
const selectorLogger = logger.child('MaterialSelector')

interface MaterialSelectorProps {
  selectedMaterialId?: string
  materialQuantity?: number
  onMaterialChange: (materialId: string | undefined) => void
  onQuantityChange: (quantity: number | undefined) => void
  disabled?: boolean
  className?: string
}

export function MaterialSelector({
  selectedMaterialId,
  materialQuantity,
  onMaterialChange,
  onQuantityChange,
  disabled = false,
  className = '',
}: MaterialSelectorProps) {
  const { data: materialsData, isLoading, error } = useMaterials({ limit: 100 })
  const materials = useMemo(() => materialsData?.materials || [], [materialsData?.materials])
  
  // Log component initialization
  useEffect(() => {
    selectorLogger.debug('componentInit', 'MaterialSelector initialized', {
      selectedMaterialId,
      materialQuantity,
      disabled,
      className: className || 'none'
    })
  }, [selectedMaterialId, materialQuantity, disabled, className])

  // Log materials data loading state
  useEffect(() => {
    if (isLoading) {
      selectorLogger.debug('materialsLoading', 'Loading materials for selector')
    } else if (error) {
      selectorLogger.error('materialsLoadError', 'Failed to load materials for selector', error)
    } else if (materials.length > 0) {
      selectorLogger.info('materialsLoaded', 'Materials loaded successfully for selector', {
        materialsCount: materials.length,
        topMaterials: materials.slice(0, 3).map((m: Material) => ({ id: m.id, name: m.name }))
      })
    }
  }, [isLoading, error, materials])
  
  const selectedMaterial = materials.find((m: Material) => m.id === selectedMaterialId)
  
  // Calculate material cost with logging
  const materialCost = (() => {
    if (!selectedMaterial || !materialQuantity) {
      return 0
    }
    
    const cost = selectedMaterial.pricePerUnit * materialQuantity
    
    selectorLogger.debug('calculateCost', 'Material cost calculated', {
      materialId: selectedMaterial.id,
      materialName: selectedMaterial.name,
      pricePerUnit: selectedMaterial.pricePerUnit,
      quantity: materialQuantity,
      totalCost: cost
    })
    
    return cost
  })()

  const handleMaterialChange = (materialId: string | undefined) => {
    const material = materials.find((m: Material) => m.id === materialId)
    
    selectorLogger.info('handleMaterialChange', 'User changed material selection', {
      previousMaterialId: selectedMaterialId,
      newMaterialId: materialId,
      previousMaterialName: selectedMaterial?.name,
      newMaterialName: material?.name,
      hasQuantity: !!materialQuantity
    })
    
    onMaterialChange(materialId)
  }

  const handleQuantityChange = (value: string) => {
    const originalQuantity = materialQuantity
    const quantity = parseFloat(value)
    const validQuantity = isNaN(quantity) || quantity <= 0 ? undefined : quantity
    
    if (validQuantity !== originalQuantity) {
      selectorLogger.info('handleQuantityChange', 'User changed material quantity', {
        materialId: selectedMaterialId,
        materialName: selectedMaterial?.name,
        previousQuantity: originalQuantity,
        newQuantity: validQuantity,
        inputValue: value,
        isValid: validQuantity !== undefined
      })
      
      if (validQuantity === undefined && value.length > 0) {
        selectorLogger.warn('handleQuantityChange', 'Invalid quantity input detected', {
          inputValue: value,
          parsedValue: quantity,
          isNaN: isNaN(quantity),
          isNegativeOrZero: quantity <= 0
        })
      }
    }
    
    onQuantityChange(validQuantity)
  }

  // Log material selection state changes for debugging
  useEffect(() => {
    if (selectedMaterialId && !selectedMaterial) {
      selectorLogger.warn('materialSelectionMismatch', 'Selected material ID not found in loaded materials', {
        selectedMaterialId,
        availableMaterialIds: materials.map((m: Material) => m.id),
        materialsCount: materials.length
      })
    }
  }, [selectedMaterialId, selectedMaterial, materials])

  // Log cost calculation edge cases
  useEffect(() => {
    if (selectedMaterial && materialQuantity && materialCost === 0) {
      selectorLogger.warn('costCalculationError', 'Material cost calculation resulted in zero despite valid inputs', {
        materialId: selectedMaterial.id,
        pricePerUnit: selectedMaterial.pricePerUnit,
        quantity: materialQuantity
      })
    }
  }, [selectedMaterial, materialQuantity, materialCost])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Material Selection */}
      <div className="space-y-2">
        <Label htmlFor="material" className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Material (Opsional)
        </Label>
        <Select 
          value={selectedMaterialId || ''} 
          onValueChange={(value) => handleMaterialChange(value || undefined)}
          disabled={disabled || isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={isLoading ? 'Memuat material...' : 'Pilih material'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tidak menggunakan material</SelectItem>
            {materials.map((material: Material) => (
              <SelectItem key={material.id} value={material.id}>
                <div className="flex items-center justify-between w-full">
                  <span>{material.name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    Rp {material.pricePerUnit.toLocaleString('id-ID')}/{material.unit}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Material Quantity (only show if material is selected) */}
      {selectedMaterial && (
        <div className="space-y-2">
          <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
            Jumlah ({selectedMaterial.unit})
          </Label>
          <Input
            id="quantity"
            type="number"
            min="0"
            step="0.1"
            value={materialQuantity || ''}
            onChange={(e) => handleQuantityChange(e.target.value)}
            placeholder={`Jumlah dalam ${selectedMaterial.unit}`}
            disabled={disabled}
          />
        </div>
      )}

      {/* Cost Calculation Display */}
      {selectedMaterial && materialQuantity && materialCost > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-800 mb-1">
            <Calculator className="w-4 h-4" />
            Perhitungan Biaya Material
          </div>
          <div className="text-sm text-blue-700">
            <div className="flex justify-between">
              <span>{selectedMaterial.name}</span>
              <span>Rp {selectedMaterial.pricePerUnit.toLocaleString('id-ID')}/{selectedMaterial.unit}</span>
            </div>
            <div className="flex justify-between">
              <span>Jumlah</span>
              <span>{materialQuantity} {selectedMaterial.unit}</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-blue-300 pt-1 mt-1">
              <span>Total Biaya Material</span>
              <span>Rp {materialCost.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}