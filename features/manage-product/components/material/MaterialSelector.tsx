'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Package } from 'lucide-react'
import { useMaterials } from '@/features/manage-product/hooks/useMaterials'
import type { Material } from '@/features/manage-product/types/material'
import { MaterialCostDisplay } from './MaterialCostDisplay'
import { useMemo } from 'react'

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
  const { data: materialsData, isLoading } = useMaterials({ limit: 100 })
  const materials = useMemo(() => materialsData?.materials || [], [materialsData?.materials])
  
  // Error handling managed by React Query
  
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
    // Allow 0 as valid quantity, only treat NaN or negative as invalid
    const validQuantity = isNaN(quantity) || quantity < 0 ? 0 : quantity
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
            value={materialQuantity === 0 ? '' : materialQuantity || ''}
            onChange={(e) => {
              // Real-time leading zero removal
              const sanitized = e.target.value.replace(/^0+(?=\d)/, '')
              
              // Handle empty input - store as 0 internally but display empty
              if (sanitized === '' || sanitized === '0') {
                handleQuantityChange('0')
                return
              }
              
              handleQuantityChange(sanitized)
            }}
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