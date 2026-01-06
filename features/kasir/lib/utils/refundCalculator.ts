/**
 * Refund Policy Calculator
 * 
 * Implements business rules for transaction cancellation refunds:
 * - ≥ 7 days before pickup date → 30% refund
 * - < 7 days before pickup date → No refund
 */

export interface RefundCalculation {
  isEligible: boolean
  daysUntilPickup: number
  refundPercentage: number
  refundAmount: number
  originalAmount: number
  reason: string
  calculationDate: Date
  pickupDate: Date
}

/**
 * Calculate refund eligibility and amount based on pickup date and payment amount
 */
export function calculateRefundEligibility(
  tglMulai: Date | string,
  amountPaid: number
): RefundCalculation {
  const today = new Date()
  const pickupDate = new Date(tglMulai)
  
  // Reset time to start of day for accurate day calculation
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const pickupStart = new Date(pickupDate.getFullYear(), pickupDate.getMonth(), pickupDate.getDate())
  
  // Calculate days until pickup (inclusive of today)
  const timeDiff = pickupStart.getTime() - todayStart.getTime()
  const daysUntilPickup = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
  
  // Determine refund eligibility
  const isEligible = daysUntilPickup >= 7
  const refundPercentage = isEligible ? 30 : 0
  const refundAmount = isEligible ? Math.round(amountPaid * 0.3) : 0
  
  // Generate reason message
  let reason: string
  if (daysUntilPickup < 0) {
    reason = 'Tanggal pengambilan sudah lewat'
  } else if (daysUntilPickup === 0) {
    reason = 'Pembatalan di hari yang sama dengan pengambilan'
  } else if (daysUntilPickup < 7) {
    reason = `Pembatalan kurang dari 7 hari sebelum pengambilan (${daysUntilPickup} hari)`
  } else {
    reason = `Pembatalan ${daysUntilPickup} hari sebelum pengambilan`
  }
  
  return {
    isEligible,
    daysUntilPickup,
    refundPercentage,
    refundAmount,
    originalAmount: amountPaid,
    reason,
    calculationDate: today,
    pickupDate
  }
}

/**
 * Get days until pickup date from today
 */
export function getDaysUntilPickup(tglMulai: Date | string): number {
  const today = new Date()
  const pickupDate = new Date(tglMulai)
  
  // Reset time to start of day for accurate day calculation
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const pickupStart = new Date(pickupDate.getFullYear(), pickupDate.getMonth(), pickupDate.getDate())
  
  const timeDiff = pickupStart.getTime() - todayStart.getTime()
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
}

/**
 * Format refund information for display
 */
export function formatRefundInfo(refundData: RefundCalculation): {
  eligibilityBadge: {
    text: string
    variant: 'success' | 'warning' | 'destructive'
    className: string
  }
  amountDisplay: string
  reasonText: string
  daysText: string
} {
  const { isEligible, refundAmount, daysUntilPickup, reason } = refundData
  
  // Eligibility badge
  const eligibilityBadge = {
    text: isEligible ? `Refund ${refundData.refundPercentage}%` : 'Tidak Ada Refund',
    variant: (isEligible ? 'success' : 'destructive') as 'success' | 'destructive',
    className: isEligible 
      ? 'bg-green-50 text-green-700 border-green-200'
      : 'bg-red-50 text-red-700 border-red-200'
  }
  
  // Amount display
  const amountDisplay = isEligible 
    ? `Rp ${refundAmount.toLocaleString('id-ID')}`
    : 'Rp 0'
  
  // Days text
  const daysText = daysUntilPickup === 1 
    ? '1 hari lagi'
    : daysUntilPickup <= 0 
    ? 'Hari ini atau sudah lewat'
    : `${daysUntilPickup} hari lagi`
  
  return {
    eligibilityBadge,
    amountDisplay,
    reasonText: reason,
    daysText
  }
}

/**
 * Format currency for Indonesian Rupiah
 */
export function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

/**
 * Validate refund calculation inputs
 */
export function validateRefundInputs(
  tglMulai: Date | string,
  amountPaid: number
): { isValid: boolean; error?: string } {
  // Validate pickup date
  const pickupDate = new Date(tglMulai)
  if (isNaN(pickupDate.getTime())) {
    return { isValid: false, error: 'Invalid pickup date' }
  }
  
  // Validate amount paid
  if (typeof amountPaid !== 'number' || amountPaid < 0) {
    return { isValid: false, error: 'Invalid amount paid' }
  }
  
  return { isValid: true }
}

/**
 * Generate refund audit data for database logging
 */
export function generateRefundAuditData(refundData: RefundCalculation) {
  return {
    refundPolicy: {
      daysUntilPickup: refundData.daysUntilPickup,
      isEligible: refundData.isEligible,
      refundPercentage: refundData.refundPercentage,
      originalAmount: refundData.originalAmount,
      refundAmount: refundData.refundAmount,
      calculationDate: refundData.calculationDate.toISOString(),
      pickupDate: refundData.pickupDate.toISOString(),
      reason: refundData.reason
    }
  }
}