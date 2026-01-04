/**
 * Pairing Return Validator - Return-Pairing Integration
 *
 * Validates that jas-sarung pairings are returned together with proper quantity ratios
 * and provides comprehensive error messages for pairing validation failures.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { parseKondisiAwalEnhanced, type EnhancedKondisiAwalData } from '../utils/kondisiAwalParser'

export interface PairingReturnValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  pairingInfo?: {
    jasItemId: string
    sarungItemId: string // ✅ Will be 'metadata' for Option B approach
    jasProductSizeId: string
    sarungProductSizeId: string
    requiredRatio: string // "1:1"
  }
}

export interface ReturnItem {
  itemId: string
  kondisiAwal: string | null
  conditions: Array<{
    kondisiAkhir: string
    jumlahKembali: number
    conditionCategory?: string
  }>
}

export interface TransactionItem {
  id: string
  kondisiAwal: string | null
  jumlahDiambil: number
  produk: {
    id: string
    name: string
    code?: string
  }
}

/**
 * PairingReturnValidator handles validation logic for jas-sarung pairing returns
 * Ensures paired items are returned together with correct quantity ratios
 */
export class PairingReturnValidator {
  /**
   * Validate that paired items are returned together with correct ratios
   * 
   * @param returnItems - Items being returned
   * @param transactionItems - Original transaction items for reference
   * @returns Validation result with errors and pairing information
   */
  static validatePairedReturn(
    returnItems: ReturnItem[],
    transactionItems: TransactionItem[]
  ): PairingReturnValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    let pairingInfo: PairingReturnValidationResult['pairingInfo']

    try {
      // Step 1: Identify paired items in the return request
      const pairedItems = this.identifyPairedItems(returnItems, transactionItems)
      
      if (pairedItems.length === 0) {
        // No paired items in this return - validation passes
        return {
          isValid: true,
          errors: [],
          warnings: []
        }
      }

      // Step 2: Validate each pairing
      for (const pairing of pairedItems) {
        const pairingValidation = this.validateSinglePairing(pairing, returnItems, transactionItems)
        
        if (!pairingValidation.isValid) {
          errors.push(...pairingValidation.errors)
        }
        
        warnings.push(...pairingValidation.warnings)
        
        // Store pairing info for the first valid pairing
        if (!pairingInfo && pairingValidation.pairingInfo) {
          pairingInfo = pairingValidation.pairingInfo
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        pairingInfo
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      }
    }
  }

  /**
   * Identify paired items from return request
   * ✅ OPTION B: Handle sarung as metadata in jas item
   */
  private static identifyPairedItems(
    returnItems: ReturnItem[],
    transactionItems: TransactionItem[]
  ): Array<{
    jasItemId: string
    jasKondisiData: EnhancedKondisiAwalData
  }> {
    const pairedItems: Array<{
      jasItemId: string
      jasKondisiData: EnhancedKondisiAwalData
    }> = []

    // Build a map of all transaction items for quick lookup
    const transactionItemMap = new Map(transactionItems.map(ti => [ti.id, ti]))

    // Look for jas items with linkedSarung in return request
    for (const returnItem of returnItems) {
      const transactionItem = transactionItemMap.get(returnItem.itemId)
      if (!transactionItem) continue

      const kondisiData = parseKondisiAwalEnhanced(transactionItem.kondisiAwal)
      
      // Check if this is a jas with linkedSarung metadata
      if (kondisiData.linkedSarung?.productSizeId) {
        pairedItems.push({
          jasItemId: returnItem.itemId,
          jasKondisiData: kondisiData
        })
      }
    }

    return pairedItems
  }

  /**
   * Validate a single jas-sarung pairing
   * ✅ OPTION B: Validate sarung as metadata in jas item
   */
  private static validateSinglePairing(
    pairing: {
      jasItemId: string
      jasKondisiData: EnhancedKondisiAwalData
    },
    returnItems: ReturnItem[],
    transactionItems: TransactionItem[]
  ): PairingReturnValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Find return item for jas
    const jasReturnItem = returnItems.find(ri => ri.itemId === pairing.jasItemId)
    
    // Get transaction item for reference
    const jasTransactionItem = transactionItems.find(ti => ti.id === pairing.jasItemId)

    if (!jasTransactionItem) {
      errors.push('Pairing validation failed: Jas transaction item not found')
      return { isValid: false, errors, warnings }
    }

    // ✅ OPTION B: Since sarung is metadata, we only need to validate jas item
    // The linkedSarung data in kondisiAwal contains all necessary sarung information
    if (jasReturnItem) {
      // Requirement 6.3: Validate against available quantities
      const jasReturnQuantity = jasReturnItem.conditions.reduce((sum, c) => sum + c.jumlahKembali, 0)
      const jasAvailable = jasTransactionItem.jumlahDiambil || 0

      if (jasReturnQuantity > jasAvailable) {
        errors.push(
          `Jumlah pengembalian jas (${jasReturnQuantity}) melebihi jumlah yang tersedia (${jasAvailable})`
        )
      }

      // Add informational warning about pairing
      if (errors.length === 0) {
        warnings.push(
          `Pairing terdeteksi: ${jasTransactionItem.produk.name} + Sarung (${jasReturnQuantity} set) - sarung sebagai metadata`
        )
      }
    }

    // Build pairing info if validation passes
    let pairingInfo: PairingReturnValidationResult['pairingInfo']
    if (errors.length === 0 && pairing.jasKondisiData.productSizeId && pairing.jasKondisiData.linkedSarung?.productSizeId) {
      pairingInfo = {
        jasItemId: pairing.jasItemId,
        sarungItemId: 'metadata', // ✅ Indicate sarung is metadata
        jasProductSizeId: pairing.jasKondisiData.productSizeId,
        sarungProductSizeId: pairing.jasKondisiData.linkedSarung.productSizeId,
        requiredRatio: '1:1'
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      pairingInfo
    }
  }

  /**
   * Check if a specific item is part of a pairing
   * ✅ OPTION B: Handle sarung as metadata
   */
  static isItemPaired(itemId: string, transactionItems: TransactionItem[]): boolean {
    const transactionItem = transactionItems.find(ti => ti.id === itemId)
    if (!transactionItem) return false

    const kondisiData = parseKondisiAwalEnhanced(transactionItem.kondisiAwal)
    
    // ✅ OPTION B: Only check if this item has linkedSarung (it's a jas with sarung metadata)
    return !!kondisiData.linkedSarung?.productSizeId
  }

  /**
   * Get pairing information for a specific item
   * ✅ OPTION B: Handle sarung as metadata
   */
  static getPairingInfo(itemId: string, transactionItems: TransactionItem[]): {
    isPaired: boolean
    role?: 'jas' | 'sarung'
    pairedItemId?: string
    pairedProductSizeId?: string
  } {
    const transactionItem = transactionItems.find(ti => ti.id === itemId)
    if (!transactionItem) {
      return { isPaired: false }
    }

    const kondisiData = parseKondisiAwalEnhanced(transactionItem.kondisiAwal)
    
    // ✅ OPTION B: Only check if this is a jas with linkedSarung metadata
    if (kondisiData.linkedSarung?.productSizeId) {
      return {
        isPaired: true,
        role: 'jas',
        pairedItemId: 'metadata', // ✅ Sarung is metadata, not separate item
        pairedProductSizeId: kondisiData.linkedSarung.productSizeId
      }
    }

    // ✅ OPTION B: No separate sarung items to check
    // Sarung data is always embedded as metadata in jas items
    return { isPaired: false }
  }

  /**
   * Generate comprehensive error messages for pairing validation failures
   * Requirement 6.5: Provide clear error messages about pairing requirements
   * ✅ OPTION B: Updated for metadata approach
   */
  static generatePairingErrorMessage(
    errors: string[],
    pairingInfo?: PairingReturnValidationResult['pairingInfo']
  ): string {
    if (errors.length === 0) {
      return ''
    }

    let message = 'Validasi pairing gagal:\n'
    
    errors.forEach((error, index) => {
      message += `${index + 1}. ${error}\n`
    })

    if (pairingInfo) {
      message += '\nInformasi Pairing:\n'
      message += `- Rasio yang diperlukan: ${pairingInfo.requiredRatio}\n`
      message += `- Jas Item ID: ${pairingInfo.jasItemId}\n`
      message += `- Sarung: Included as metadata (ProductSize ID: ${pairingInfo.sarungProductSizeId})\n`
    }

    message += '\nPetunjuk: Jas dengan sarung pairing sudah termasuk sarung secara otomatis.'

    return message.trim()
  }
}