/**
 * Material Cost Calculation Utilities
 * Simple frontend utilities for material cost calculations
 * Replaces the removed /api/materials/calculate-cost endpoint
 */

import type { Material } from '@/features/manage-product/types/material'

/**
 * Calculate total cost for a given material and quantity
 * Formula: totalCost = pricePerUnit × quantity
 * 
 * @param pricePerUnit - Price per unit of material
 * @param quantity - Quantity of material needed
 * @returns Total cost rounded to 2 decimal places, or 0 if invalid inputs
 */
export function calculateMaterialCost(pricePerUnit: number, quantity: number): number {
  // Input validation
  if (!pricePerUnit || !quantity || pricePerUnit <= 0 || quantity <= 0) {
    return 0
  }

  // Calculate total cost with proper rounding for monetary values
  const totalCost = pricePerUnit * quantity
  return Number(totalCost.toFixed(2))
}

/**
 * Calculate total cost using a Material object and quantity
 * Convenience wrapper for calculateMaterialCost
 * 
 * @param material - Material object with pricePerUnit
 * @param quantity - Quantity of material needed
 * @returns Total cost rounded to 2 decimal places, or 0 if invalid inputs
 */
export function calculateCostFromMaterial(material: Material | null | undefined, quantity: number): number {
  if (!material) {
    return 0
  }

  return calculateMaterialCost(material.pricePerUnit, quantity)
}

/**
 * Calculate multiple material costs in batch
 * Useful for forms with multiple material selections
 * 
 * @param calculations - Array of {material, quantity} objects
 * @returns Array of calculated costs maintaining order
 */
export function calculateBatchMaterialCosts(
  calculations: Array<{ material: Material | null; quantity: number }>
): number[] {
  return calculations.map(({ material, quantity }) => 
    calculateCostFromMaterial(material, quantity)
  )
}

/**
 * Format cost as currency string
 * Helper function for displaying calculated costs
 * 
 * @param cost - Cost amount to format
 * @param currency - Currency symbol (default: 'Rp')
 * @returns Formatted currency string
 */
export function formatMaterialCost(cost: number, currency: string = 'Rp'): string {
  if (!cost || cost <= 0) {
    return `${currency} 0`
  }

  // Format with thousands separator
  const formatted = cost.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  return `${currency} ${formatted}`
}

/**
 * Validate material cost calculation inputs
 * Useful for form validation
 * 
 * @param pricePerUnit - Price per unit to validate
 * @param quantity - Quantity to validate
 * @returns Validation result with error message if invalid
 */
export function validateMaterialCostInputs(
  pricePerUnit: number | null | undefined, 
  quantity: number | null | undefined
): { valid: boolean; error?: string } {
  if (!pricePerUnit || pricePerUnit <= 0) {
    return { valid: false, error: 'Harga per unit harus berupa angka positif' }
  }

  if (!quantity || quantity <= 0) {
    return { valid: false, error: 'Quantity harus berupa angka positif' }
  }

  return { valid: true }
}