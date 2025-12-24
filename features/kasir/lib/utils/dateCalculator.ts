/**
 * Frontend Date Calculator for Transaction Enhancements
 * Handles return date calculations with correct logic
 */

export class DateCalculator {
  /**
   * Calculate return date based on pickup date and duration
   * Formula: Return Date = Pickup Date + (Duration - 1)
   */
  static calculateReturnDate(pickupDate: string, duration: 4 | 7): string {
    if (!pickupDate) return ''
    
    try {
      const pickup = new Date(pickupDate)
      const returnDate = new Date(pickup)
      
      // Fixed calculation: Return Date = Pickup Date + (Duration - 1)
      returnDate.setDate(returnDate.getDate() + (duration - 1))
      
      return returnDate.toISOString().split('T')[0]
    } catch {
      console.error('Error calculating return date')
      return ''
    }
  }
  
  /**
   * Validate pickup date (must be today or future)
   */
  static validatePickupDate(pickupDate: string): { isValid: boolean; error?: string } {
    if (!pickupDate) {
      return { isValid: false, error: 'Tanggal ambil harus diisi' }
    }
    
    try {
      const pickup = new Date(pickupDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (pickup < today) {
        return { isValid: false, error: 'Tanggal ambil tidak boleh di masa lalu' }
      }
      
      return { isValid: true }
    } catch {
      return { isValid: false, error: 'Format tanggal tidak valid' }
    }
  }
  
  /**
   * Format date for display
   */
  static formatDateForDisplay(dateString: string): string {
    if (!dateString) return ''
    
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }
}