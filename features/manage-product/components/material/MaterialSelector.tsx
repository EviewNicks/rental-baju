'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Package } from 'lucide-react'
import { useMaterials } from '@/features/manage-product/hooks/useMaterials'
import type { Material } from '@/features/manage-product/types/material'
import { MaterialCostDisplay } from './MaterialCostDisplay'
import { logger } from '@/services/logger'
import { useEffect, useMemo } from 'react'

// Component-specific logger for material selector
const selectorLogger = logger.child('MaterialSelector')

// Constants for select values
const NO_MATERIAL_VALUE = 'none'

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
  
  // Log only critical errors
  useEffect(() => {
    if (error) {
      selectorLogger.error('materialsLoadError', 'Failed to load materials for selector', error)
    }
  }, [error])
  
  const selectedMaterial = materials.find((m: Material) => m.id === selectedMaterialId)
  
  // Memoized cost calculation for performance
  const materialCost = useMemo(() => {
    if (!selectedMaterial || !materialQuantity) {
      return 0
    }
    return selectedMaterial.pricePerUnit * materialQuantity
  }, [selectedMaterial, materialQuantity])

  const handleMaterialChange = (materialId: string | undefined) => {
    onMaterialChange(materialId)
  }

  const handleQuantityChange = (value: string) => {
    const quantity = parseFloat(value)
    const validQuantity = isNaN(quantity) || quantity <= 0 ? undefined : quantity
    onQuantityChange(validQuantity)
  }


  return (
    <div className={`space-y-4 ${className}`}>
      {/* Material Selection */}
      <div className="space-y-2">
        <Label htmlFor="material" className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Material (Opsional)
        </Label>
        <Select 
          value={selectedMaterialId || NO_MATERIAL_VALUE} 
          onValueChange={(value) => handleMaterialChange(value === NO_MATERIAL_VALUE ? undefined : value)}
          disabled={disabled || isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={isLoading ? 'Memuat material...' : 'Pilih material'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_MATERIAL_VALUE}>Tidak menggunakan material</SelectItem>
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
        <MaterialCostDisplay 
          selectedMaterial={selectedMaterial}
          materialQuantity={materialQuantity}
          materialCost={materialCost}
        />
      )}
    </div>
  )
}