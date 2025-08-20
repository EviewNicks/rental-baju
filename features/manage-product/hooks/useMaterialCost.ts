/**
 * React Hook: useMaterialCost
 * Provides reactive material cost calculation with memoization
 * Replaces server-side calculation with efficient client-side computation
 */

import { useMemo } from 'react'
import type { Material } from '@/features/manage-product/types/material'
import { calculateCostFromMaterial, formatMaterialCost } from '@/features/manage-product/lib/utils/materialCalculations'
import { logger } from '@/services/logger'

// Component-specific logger for material cost calculations
const costLogger = logger.child('useMaterialCost')

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
    const timer = logger.startTimer('useMaterialCost', 'calculateCost', 'cost_calculation')
    
    try {
      // Log input validation
      if (!material) {
        costLogger.debug('calculateCost', 'No material provided for cost calculation', {
          quantity,
          currency
        })
      } else if (quantity <= 0) {
        costLogger.warn('calculateCost', 'Invalid quantity for cost calculation', {
          materialId: material.id,
          materialName: material.name,
          quantity,
          expectedQuantity: '>0'
        })
      }

      const totalCost = calculateCostFromMaterial(material, quantity)
      const formattedCost = formatMaterialCost(totalCost, currency)
      const isValid = totalCost > 0
      const duration = timer.end()

      // Log calculation result
      costLogger.debug('calculateCost', 'Material cost calculation completed', {
        materialId: material?.id,
        materialName: material?.name,
        quantity,
        totalCost,
        isValid,
        duration: `${duration}ms`
      })

      return {
        totalCost,
        formattedCost,
        isValid,
      }
    } catch (error) {
      timer.end('Cost calculation failed')
      costLogger.error('calculateCost', 'Material cost calculation failed', error as Error)
      
      // Return safe fallback
      return {
        totalCost: 0,
        formattedCost: formatMaterialCost(0, currency),
        isValid: false,
      }
    }
  }, [material, quantity, currency])
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
    const timer = logger.startTimer('useMaterialCost', 'batchCalculation', 'batch_cost_calculation')
    
    try {
      costLogger.debug('batchCalculation', 'Starting batch material cost calculation', {
        materialCount: materials.length,
        currency
      })

      const individualCosts = materials.map(({ material, quantity }, index) => {
        const cost = calculateCostFromMaterial(material, quantity)
        
        if (quantity <= 0 && material) {
          costLogger.warn('batchCalculation', 'Invalid quantity in batch calculation', {
            batchIndex: index,
            materialId: material.id,
            quantity
          })
        }
        
        return cost
      })

      const totalCost = individualCosts.reduce((sum, cost) => sum + cost, 0)
      const formattedTotal = formatMaterialCost(totalCost, currency)
      const formattedIndividual = individualCosts.map(cost => 
        formatMaterialCost(cost, currency)
      )
      
      const duration = timer.end()
      const validCount = individualCosts.filter(cost => cost > 0).length
      
      costLogger.info('batchCalculation', 'Batch material cost calculation completed', {
        materialCount: materials.length,
        validCalculations: validCount,
        totalCost,
        duration: `${duration}ms`,
        avgCostPerMaterial: materials.length > 0 ? totalCost / materials.length : 0
      })

      return {
        individualCosts,
        totalCost,
        formattedTotal,
        formattedIndividual,
        isValid: totalCost > 0,
      }
    } catch (error) {
      timer.end('Batch calculation failed')
      costLogger.error('batchCalculation', 'Batch material cost calculation failed', error as Error)
      
      // Return safe fallback
      const fallbackIndividual = materials.map(() => 0)
      return {
        individualCosts: fallbackIndividual,
        totalCost: 0,
        formattedTotal: formatMaterialCost(0, currency),
        formattedIndividual: fallbackIndividual.map(cost => formatMaterialCost(cost, currency)),
        isValid: false,
      }
    }
  }, [materials, currency])
}