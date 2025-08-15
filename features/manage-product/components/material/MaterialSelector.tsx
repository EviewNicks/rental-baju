'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Package, Calculator } from 'lucide-react'
import { useMaterials } from '@/features/manage-product/hooks/useMaterials'
import type { Material } from '@/features/manage-product/types/material'

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
  const materials = materialsData?.materials || []
  
  const selectedMaterial = materials.find((m: Material) => m.id === selectedMaterialId)
  
  // Calculate material cost
  const materialCost = selectedMaterial && materialQuantity 
    ? selectedMaterial.pricePerUnit * materialQuantity 
    : 0

  const handleQuantityChange = (value: string) => {
    const quantity = parseFloat(value)
    onQuantityChange(isNaN(quantity) || quantity <= 0 ? undefined : quantity)
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
          value={selectedMaterialId || ''} 
          onValueChange={(value) => onMaterialChange(value || undefined)}
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