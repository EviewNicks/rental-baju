'use client'

import { Calculator } from 'lucide-react'
import type { Material } from '@/features/manage-product/types/material'

interface MaterialCostDisplayProps {
  selectedMaterial: Material
  materialQuantity: number
  materialCost: number
}

export function MaterialCostDisplay({ 
  selectedMaterial, 
  materialQuantity, 
  materialCost 
}: MaterialCostDisplayProps) {
  return (
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
  )
}