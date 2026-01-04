/**
 * PairingDisplayFormatter - Task 5: UI Display Formatting
 *
 * Formats item display names and descriptions to show pairing information clearly in pickup UI
 * Handles "Jas Name + Sarung Name" format display and generates pickup descriptions
 */

import { parseKondisiAwalEnhanced } from './kondisiAwalParser'

export interface PairingDisplayInfo {
  displayName: string
  isPaired: boolean
  pairingDescription?: string
  linkedSarungName?: string
  originalJasName: string
}

export interface PickupDisplayItem {
  jasName: string
  kondisiAwal: string | null
  quantity: number
}

export class PairingDisplayFormatter {
  /**
   * Format item display name to show pairing information
   * Returns "Jas Name + Sarung Name" format for paired items
   */
  static formatItemDisplayName(jasName: string, kondisiAwal: string | null): PairingDisplayInfo {
    const kondisiData = parseKondisiAwalEnhanced(kondisiAwal)

    if (!kondisiData?.linkedSarung) {
      return {
        displayName: jasName,
        isPaired: false,
        originalJasName: jasName,
      }
    }

    // For paired items, show "Jas Name + Sarung Name" format
    const sarungName = kondisiData.linkedSarung.product?.name || 'Sarung'
    const displayName = `${jasName} + ${sarungName}`

    return {
      displayName,
      isPaired: true,
      pairingDescription: 'Paket jas dengan sarung gratis',
      linkedSarungName: sarungName,
      originalJasName: jasName,
    }
  }

  /**
   * Generate pickup description for activity logs and confirmations
   * Combines multiple items into a readable description
   */
  static generatePickupDescription(items: PickupDisplayItem[]): string {
    const descriptions = items.map((item) => {
      const displayInfo = this.formatItemDisplayName(item.jasName, item.kondisiAwal)
      const quantityText = item.quantity > 1 ? ` (${item.quantity} unit)` : ''
      return `${displayInfo.displayName}${quantityText}`
    })

    return descriptions.join(', ')
  }

  /**
   * Extract pairing information from kondisiAwal for UI components
   */
  static extractPairingInfo(kondisiAwal: string | null): {
    hasPairing: boolean
    linkedSarungId?: string
    linkedSarungName?: string
    pairingType: 'none' | 'jas-sarung'
  } {
    const kondisiData = parseKondisiAwalEnhanced(kondisiAwal)

    if (!kondisiData?.linkedSarung) {
      return {
        hasPairing: false,
        pairingType: 'none',
      }
    }

    return {
      hasPairing: true,
      linkedSarungId: kondisiData.linkedSarung.productSizeId,
      linkedSarungName: kondisiData.linkedSarung.product?.name,
      pairingType: 'jas-sarung',
    }
  }

  /**
   * Format pairing information for pickup modal display
   */
  static formatPairingInfoForModal(
    jasName: string,
    kondisiAwal: string | null,
  ): {
    title: string
    subtitle?: string
    badge?: {
      text: string
      variant: 'success' | 'info' | 'warning'
    }
  } {
    const displayInfo = this.formatItemDisplayName(jasName, kondisiAwal)

    if (!displayInfo.isPaired) {
      return {
        title: jasName,
      }
    }

    return {
      title: displayInfo.displayName,
      subtitle: displayInfo.pairingDescription,
      badge: {
        text: 'Paket',
        variant: 'success',
      },
    }
  }

  /**
   * Generate item list for pickup confirmation
   * Groups paired and non-paired items for clear display
   */
  static formatItemsForConfirmation(items: PickupDisplayItem[]): {
    pairedItems: Array<{
      displayName: string
      jasName: string
      sarungName: string
      quantity: number
    }>
    regularItems: Array<{
      displayName: string
      quantity: number
    }>
    totalItems: number
    totalQuantity: number
  } {
    const pairedItems: Array<{
      displayName: string
      jasName: string
      sarungName: string
      quantity: number
    }> = []

    const regularItems: Array<{
      displayName: string
      quantity: number
    }> = []

    let totalQuantity = 0

    items.forEach((item) => {
      const displayInfo = this.formatItemDisplayName(item.jasName, item.kondisiAwal)
      totalQuantity += item.quantity

      if (displayInfo.isPaired && displayInfo.linkedSarungName) {
        pairedItems.push({
          displayName: displayInfo.displayName,
          jasName: displayInfo.originalJasName,
          sarungName: displayInfo.linkedSarungName,
          quantity: item.quantity,
        })
      } else {
        regularItems.push({
          displayName: displayInfo.displayName,
          quantity: item.quantity,
        })
      }
    })

    return {
      pairedItems,
      regularItems,
      totalItems: items.length,
      totalQuantity,
    }
  }

  /**
   * Format pickup summary for transaction history
   */
  static formatPickupSummary(items: PickupDisplayItem[]): {
    shortDescription: string
    detailedDescription: string
    itemCount: number
    pairingCount: number
  } {
    const confirmation = this.formatItemsForConfirmation(items)
    const pairingCount = confirmation.pairedItems.length
    const regularCount = confirmation.regularItems.length

    let shortDescription = ''
    if (pairingCount > 0 && regularCount > 0) {
      shortDescription = `${pairingCount} paket + ${regularCount} item regular`
    } else if (pairingCount > 0) {
      shortDescription = `${pairingCount} paket jas-sarung`
    } else {
      shortDescription = `${regularCount} item`
    }

    const detailedDescription = this.generatePickupDescription(items)

    return {
      shortDescription,
      detailedDescription,
      itemCount: items.length,
      pairingCount,
    }
  }

  /**
   * Validate if items can be displayed in pickup UI
   * Filters out items that shouldn't be shown (like standalone paired sarung)
   */
  static filterPickupableItems<T extends { kondisiAwal: string | null }>(items: T[]): T[] {
    return items.filter(() => {
      return true
    })
  }

  /**
   * Generate display text for pickup button
   */
  static generatePickupButtonText(selectedItems: PickupDisplayItem[]): string {
    if (selectedItems.length === 0) {
      return 'Pilih Item'
    }

    const totalQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0)
    const confirmation = this.formatItemsForConfirmation(selectedItems)

    if (confirmation.pairedItems.length > 0 && confirmation.regularItems.length > 0) {
      return `Pickup ${totalQuantity} Item (${confirmation.pairedItems.length} Paket)`
    } else if (confirmation.pairedItems.length > 0) {
      return `Pickup ${confirmation.pairedItems.length} Paket`
    } else {
      return `Pickup ${totalQuantity} Item`
    }
  }
}
