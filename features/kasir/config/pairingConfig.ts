/**
 * Sarung Gratis Pairing Configuration
 * Simple configuration for jas-sarung pairing system
 * 
 * To add new eligible categories, simply add them to the array below.
 */

// Eligible categories for sarung gratis pairing
// To add new categories: just add the category name to this array
export const SARUNG_GRATIS_ELIGIBLE_CATEGORIES = [
  // Jas categories
  'jas-jaguar',
  'jas-polos', 
  'jas-premium',
  'jas-renda',
  
  // Renda categories
  'renda',
  'renda-premium',
  
  // Organza categories
  'organza', // Added: Organza products eligible for free sarung
  
  // Add future categories here:
  // 'gamis-anak',
  // 'gamis-tanggung', 
  // 'gamis-dewasa',
] as const

// Type for eligible categories
export type SarungGratisCategory = typeof SARUNG_GRATIS_ELIGIBLE_CATEGORIES[number]

// Sarung pairing display configuration
export const SARUNG_PAIRING_DISPLAY = {
  badgeText: 'Produk + Sarung Gratis', // Updated: Generic text for all eligible categories (jas, renda, organza)
  buttonText: 'Pilih dengan Sarung',
  freeItemCategory: 'sarung',
  freeItemCategoryType: 'accessories_age_based'
} as const

// Simple utility functions
export function isEligibleForSarungGratis(categoryName: string): boolean {
  const normalizedCategory = categoryName.toLowerCase().trim()
  return SARUNG_GRATIS_ELIGIBLE_CATEGORIES.includes(normalizedCategory as SarungGratisCategory)
}

export function getAllEligibleCategories(): string[] {
  return [...SARUNG_GRATIS_ELIGIBLE_CATEGORIES]
}