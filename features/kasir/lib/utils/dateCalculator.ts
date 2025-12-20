/**
 * Date Calculator Utilities - Transaction Enhancements
 * Business logic for calculating rental dates with duration packages
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */

export class DateCalculator {
  /**
   * Calculate return date based on pickup date and duration
   * Formula: Return Date = Pickup Date + (Duration - 1)
   * 
   * Examples:
   * - 4-day package, pickup on 27th → return on 30th (27 + 4 - 1 = 30)
   * - 7-day package, pickup on 27th → return on 2nd next month (27 + 7 - 1 = 33 → 2nd)
   * 
   * Requirements: 3.1, 3.2, 3.3, 3.4
   */
  static calculateReturnDate(pickupDate: string | Date, duration: 4 | 7): string {
    // Convert input to Date object
    const pickup = typeof pickupDate === 'string' ? new Date(pickupDate) : new Date(pickupDate)
    
    // Validate input date
    if (isNaN(pickup.getTime())) {
      throw new Error('Invalid pickup date provided')
    }
    
    // Create return date object
    const returnDate = new Date(pickup)
    
    // Apply the formula: Return Date = Pickup Date + (Duration - 1)
    // This ensures that a 4-day rental picked up on day 1 is returned on day 4
    returnDate.setDate(returnDate.getDate() + (duration - 1))
    
    // Return as ISO date string (YYYY-MM-DD format)
    return returnDate.toISOString().split('T')[0]
  }

  /**
   * Calculate return date with time zone handling
   * Ensures consistent date calculation regardless of time zone
   */
  static calculateReturnDateWithTimezone(
    pickupDate: string | Date, 
    duration: 4 | 7,
    timezone: string = 'Asia/Jakarta'
  ): string {
    const pickup = typeof pickupDate === 'string' ? new Date(pickupDate) : new Date(pickupDate)
    
    if (isNaN(pickup.getTime())) {
      throw new Error('Invalid pickup date provided')
    }

    // Create return date in specified timezone
    const returnDate = new Date(pickup)
    returnDate.setDate(returnDate.getDate() + (duration - 1))
    
    // Format in specified timezone (using the timezone parameter)
    return returnDate.toLocaleDateString('sv-SE', { timeZone: timezone }) // Returns YYYY-MM-DD format
  }

  /**
   * Validate pickup date is not in the past
   * Requirements: 3.5, 3.6
   */
  static validatePickupDate(pickupDate: string | Date): {
    isValid: boolean
    error?: string
  } {
    const pickup = typeof pickupDate === 'string' ? new Date(pickupDate) : new Date(pickupDate)
    
    if (isNaN(pickup.getTime())) {
      return {
        isValid: false,
        error: 'Tanggal pickup tidak valid'
      }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day
    pickup.setHours(0, 0, 0, 0) // Reset time to start of day

    if (pickup < today) {
      return {
        isValid: false,
        error: 'Tanggal pickup tidak boleh di masa lalu'
      }
    }

    return { isValid: true }
  }

  /**
   * Validate date range for pickup and return dates
   * Requirements: 7.7
   */
  static validateDateRange(pickupDate: string | Date, duration: 4 | 7): {
    isValid: boolean
    error?: string
    pickupDate?: string
    returnDate?: string
  } {
    // Validate pickup date first
    const pickupValidation = this.validatePickupDate(pickupDate)
    if (!pickupValidation.isValid) {
      return pickupValidation
    }

    try {
      const pickup = typeof pickupDate === 'string' ? pickupDate : pickupDate.toISOString().split('T')[0]
      const returnDate = this.calculateReturnDate(pickup, duration)

      return {
        isValid: true,
        pickupDate: pickup,
        returnDate
      }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Error calculating return date'
      }
    }
  }

  /**
   * Handle month boundary edge cases
   * Requirements: 3.4, 7.7
   */
  static handleMonthBoundary(pickupDate: string | Date, duration: 4 | 7): {
    pickupDate: string
    returnDate: string
    crossesMonth: boolean
    monthInfo?: {
      pickupMonth: number
      returnMonth: number
      pickupYear: number
      returnYear: number
    }
  } {
    const pickup = typeof pickupDate === 'string' ? new Date(pickupDate) : new Date(pickupDate)
    const returnDate = new Date(pickup)
    returnDate.setDate(returnDate.getDate() + (duration - 1))

    const crossesMonth = pickup.getMonth() !== returnDate.getMonth() || 
                        pickup.getFullYear() !== returnDate.getFullYear()

    return {
      pickupDate: pickup.toISOString().split('T')[0],
      returnDate: returnDate.toISOString().split('T')[0],
      crossesMonth,
      monthInfo: crossesMonth ? {
        pickupMonth: pickup.getMonth() + 1, // Convert to 1-based month
        returnMonth: returnDate.getMonth() + 1,
        pickupYear: pickup.getFullYear(),
        returnYear: returnDate.getFullYear()
      } : undefined
    }
  }

  /**
   * Handle leap year edge cases
   * Requirements: 7.7
   */
  static isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
  }

  /**
   * Calculate days between two dates
   * Useful for late fee calculations
   */
  static calculateDaysBetween(startDate: string | Date, endDate: string | Date): number {
    const start = typeof startDate === 'string' ? new Date(startDate) : new Date(startDate)
    const end = typeof endDate === 'string' ? new Date(endDate) : new Date(endDate)
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date provided for calculation')
    }

    const diffTime = end.getTime() - start.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  /**
   * Check if return date is overdue
   * Used for status calculation
   */
  static isOverdue(returnDate: string | Date, currentDate?: string | Date): boolean {
    const returnDateObj = typeof returnDate === 'string' ? new Date(returnDate) : new Date(returnDate)
    const currentDateObj = currentDate 
      ? (typeof currentDate === 'string' ? new Date(currentDate) : new Date(currentDate))
      : new Date()

    if (isNaN(returnDateObj.getTime()) || isNaN(currentDateObj.getTime())) {
      return false // Invalid dates are not considered overdue
    }

    // Set both dates to start of day for fair comparison
    returnDateObj.setHours(23, 59, 59, 999) // End of return date
    currentDateObj.setHours(0, 0, 0, 0) // Start of current date

    return currentDateObj > returnDateObj
  }

  /**
   * Calculate overdue days
   * Returns 0 if not overdue, positive number if overdue
   */
  static calculateOverdueDays(returnDate: string | Date, currentDate?: string | Date): number {
    if (!this.isOverdue(returnDate, currentDate)) {
      return 0
    }

    const returnDateObj = typeof returnDate === 'string' ? new Date(returnDate) : new Date(returnDate)
    const currentDateObj = currentDate 
      ? (typeof currentDate === 'string' ? new Date(currentDate) : new Date(currentDate))
      : new Date()

    return this.calculateDaysBetween(returnDateObj, currentDateObj)
  }

  /**
   * Format date for display in Indonesian locale
   */
  static formatDateIndonesian(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date)
    
    if (isNaN(dateObj.getTime())) {
      return 'Tanggal tidak valid'
    }

    return dateObj.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  /**
   * Format date range for display
   */
  static formatDateRange(
    pickupDate: string | Date, 
    returnDate: string | Date,
    duration: 4 | 7
  ): string {
    const pickup = this.formatDateIndonesian(pickupDate)
    const returnFormatted = this.formatDateIndonesian(returnDate)
    
    return `${pickup} - ${returnFormatted} (${duration} hari)`
  }

  /**
   * Get duration label for display
   */
  static getDurationLabel(duration: 4 | 7): string {
    return duration === 4 
      ? 'Paket 4 Hari (Harga Normal)'
      : 'Paket 7 Hari (+50% untuk luar kota)'
  }

  /**
   * Validate duration value
   * Requirements: 7.4
   */
  static validateDuration(duration: number): {
    isValid: boolean
    error?: string
  } {
    if (![4, 7].includes(duration)) {
      return {
        isValid: false,
        error: 'Durasi harus 4 atau 7 hari'
      }
    }

    return { isValid: true }
  }

  /**
   * Calculate business days between dates (excluding weekends)
   * Useful for business logic that excludes weekends
   */
  static calculateBusinessDays(startDate: string | Date, endDate: string | Date): number {
    const start = typeof startDate === 'string' ? new Date(startDate) : new Date(startDate)
    const end = typeof endDate === 'string' ? new Date(endDate) : new Date(endDate)
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date provided for business days calculation')
    }

    let businessDays = 0
    const currentDate = new Date(start)

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay()
      // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays++
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return businessDays
  }
}