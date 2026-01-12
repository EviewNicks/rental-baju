/**
 * Sarung Transformation Utility
 * Transforms linkedSarung data to ProductDetailCard format for separate display
 * 
 * TASK 23: Separate Sarung Display as ProductDetailCard
 */

interface TransactionItem {
  id?: string
  product: {
    id: string
    name: string
    category: string
    size?: string
    color?: string
    image?: string
    imageUrl?: string // Add imageUrl for API compatibility
    description?: string
  }
  quantity: number
  jumlahDiambil?: number
  pricePerDay: number
  duration: number
  subtotal: number
  statusKembali?: 'lengkap' | 'sebagian' | 'belum'
  totalReturnPenalty?: number
  conditionBreakdown?: Array<{
    id: string
    kondisiAkhir: string
    jumlahKembali: number
    penaltyAmount: number
    modalAwalUsed?: number | null
    createdAt?: string
    createdBy?: string
  }>
  kondisiAwal?: string | null
  linkedSarung?: {
    productId: string
    productSizeId: string
    quantity: number
    product?: {
      id: string
      code: string
      name: string
      category: string
      image?: string
      imageUrl?: string // ✅ TASK 24: Add imageUrl for API compatibility
    }
    selectedSize?: {
      id: string
      size: string
      ageCategory: string
    }
  }
}

interface SarungDisplayItem {
  product: {
    id: string
    name: string
    category: string
    size: string
    color: string
    image: string
    description?: string
  }
  quantity: number
  jumlahDiambil?: number
  pricePerDay: number
  duration: number
  subtotal: number
  statusKembali?: 'lengkap' | 'sebagian' | 'belum'
  totalReturnPenalty?: number
  conditionBreakdown?: Array<{
    id: string
    kondisiAkhir: string
    jumlahKembali: number
    penaltyAmount: number
    modalAwalUsed?: number | null
    createdAt?: string
    createdBy?: string
  }>
  kondisiAwal?: string | null
  // Special sarung identification
  isSarungGratis: boolean
  pairedWithJas: string
  pairedWithJasId: string
}

/**
 * Transform linkedSarung data to ProductDetailCard format
 * Creates a separate sarung item for independent display and management
 */
export function createSarungDisplayItem(jasItem: TransactionItem): SarungDisplayItem | null {
  if (!jasItem.linkedSarung) return null

  const linkedSarung = jasItem.linkedSarung
  
  return {
    product: {
      id: linkedSarung.product?.id || linkedSarung.productId,
      name: linkedSarung.product?.name || 'Sarung',
      category: linkedSarung.product?.category || 'sarung',
      size: linkedSarung.selectedSize?.size || 'UNIVERSAL',
      color: '', // Sarung typically doesn't have color variants
      image: linkedSarung.product?.imageUrl || linkedSarung.product?.image || '/products/sarung-default.png',
      description: `Sarung gratis dari ${jasItem.product.name}`
    },
    quantity: linkedSarung.quantity,
    jumlahDiambil: jasItem.jumlahDiambil, // Same pickup status as jas initially
    pricePerDay: 0, // Always free
    duration: jasItem.duration,
    subtotal: 0, // Always free
    statusKembali: jasItem.statusKembali, // Same return status as jas initially
    totalReturnPenalty: 0, // Independent penalty management
    conditionBreakdown: [], // Independent condition tracking
    kondisiAwal: jasItem.kondisiAwal, // Reference to pairing data
    // Special sarung identification
    isSarungGratis: true,
    pairedWithJas: jasItem.product.name,
    pairedWithJasId: jasItem.product.id
  }
}

/**
 * Process transaction items to include separate sarung cards
 * Transforms the transaction items array to include both jas and sarung as separate items
 */
export function processTransactionItemsWithSeparateSarung(items: TransactionItem[]): Array<TransactionItem | SarungDisplayItem> {
  const processedItems: Array<TransactionItem | SarungDisplayItem> = []

  items.forEach(item => {
    // Add the main item (jas or other product)
    // Remove linkedSarung from display to avoid duplication
    const mainItem = {
      ...item,
      linkedSarung: undefined // Remove to avoid showing pairing indicator
    }
    processedItems.push(mainItem)

    // Add separate sarung card if linked
    if (item.linkedSarung) {
      const sarungItem = createSarungDisplayItem(item)
      if (sarungItem) {
        processedItems.push(sarungItem)
      }
    }
  })
  return processedItems
}

/**
 * Check if an item is a sarung gratis item
 */
export function isSarungGratisItem(item: TransactionItem | SarungDisplayItem): item is SarungDisplayItem {
  return Boolean((item as SarungDisplayItem).isSarungGratis)
}

/**
 * Get pairing relationship information
 * Returns pairing details for display purposes
 */
export function getPairingInfo(items: Array<TransactionItem | SarungDisplayItem>) {
  const pairings: Array<{
    jasId: string
    jasName: string
    sarungId: string
    sarungName: string
  }> = []

  const sarungItems = items.filter(isSarungGratisItem)
  
  sarungItems.forEach(sarungItem => {
    const jasItem = items.find(item => 
      !isSarungGratisItem(item) && item.product.id === sarungItem.pairedWithJasId
    )
    
    if (jasItem) {
      pairings.push({
        jasId: jasItem.product.id,
        jasName: jasItem.product.name,
        sarungId: sarungItem.product.id,
        sarungName: sarungItem.product.name
      })
    }
  })

  return pairings
}

export type { SarungDisplayItem, TransactionItem }