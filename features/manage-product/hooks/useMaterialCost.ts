/**
 * React Hook: useMaterialCost
 * Provides reactive material cost calculation with memoization
 * Replaces server-side calculation with efficient client-side computation
 */

import { useMemo } from 'react'
import type { Material } from '@/features/manage-product/types/material'
import { calculateCostFromMaterial, formatMaterialCost } from '@/features/manage-product/lib/utils/materialCalculations'

interface UseMaterialCostReturn {
  /** Calculated total cost (raw number) */
  totalCost: number
  /** Formatted cost as currency string */
  formattedCost: string
  /** Whether the calculation is valid (has positive cost) */
  isValid: boolean
}

/**
 * Hook for reactive material cost calculation
 * Automatically recalculates when material or quantity changes
 * 
 * @param material - Material object or null
 * @param quantity - Quantity needed (default: 0)
 * @param currency - Currency symbol for formatting (default: 'Rp')
 * @returns Object with totalCost, formattedCost, and isValid
 * 
 * @example
 * ```tsx
 * const { totalCost, formattedCost, isValid } = useMaterialCost(selectedMaterial, quantity)
 * 
 * return (
 *   <div>
 *     <p>Total: {formattedCost}</p>
 *     {isValid && <p>Cost calculation valid</p>}
 *   </div>
 * )
 * ```
 */
export function useMaterialCost(
  material: Material | null | undefined,
  quantity: number = 0,
  currency: string = 'Rp'
): UseMaterialCostReturn {
  return useMemo(() => {
    const totalCost = calculateCostFromMaterial(material, quantity)
    const formattedCost = formatMaterialCost(totalCost, currency)
    const isValid = totalCost > 0

    return {
      totalCost,
      formattedCost,
      isValid,
    }
  }, [material?.id, material?.pricePerUnit, quantity, currency])
}

/**
 * Hook for multiple material cost calculations
 * Useful for forms with multiple material selections
 * 
 * @param materials - Array of {material, quantity} objects
 * @param currency - Currency symbol for formatting (default: 'Rp')
 * @returns Object with individual costs, total, and formatted values
 * 
 * @example
 * ```tsx
 * const materialSelections = [
 *   { material: cottonMaterial, quantity: 5 },
 *   { material: silkMaterial, quantity: 2 }
 * ]
 * 
 * const { individualCosts, totalCost, formattedTotal } = useBatchMaterialCost(materialSelections)
 * ```
 */
export function useBatchMaterialCost(
  materials: Array<{ material: Material | null; quantity: number }>,
  currency: string = 'Rp'
) {
  return useMemo(() => {
    const individualCosts = materials.map(({ material, quantity }) => 
      calculateCostFromMaterial(material, quantity)
    )

    const totalCost = individualCosts.reduce((sum, cost) => sum + cost, 0)
    const formattedTotal = formatMaterialCost(totalCost, currency)
    const formattedIndividual = individualCosts.map(cost => 
      formatMaterialCost(cost, currency)
    )

    return {
      individualCosts,
      totalCost,
      formattedTotal,
      formattedIndividual,
      isValid: totalCost > 0,
    }
  }, [materials, currency])
}