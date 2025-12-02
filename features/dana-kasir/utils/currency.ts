// Dana Kasir Management - Currency Utilities
// Indonesian Rupiah formatting and parsing

/**
 * Format number to Indonesian Rupiah currency string
 * @param amount - Number to format
 * @param showSymbol - Whether to show 'Rp' symbol (default: true)
 * @returns Formatted currency string (e.g., "Rp 150.000")
 */
export const formatRupiah = (amount: number, showSymbol: boolean = true): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return showSymbol ? 'Rp 0' : '0'
  }

  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)

  if (!showSymbol) {
    return formatted.replace('Rp', '').trim()
  }

  return formatted
}

/**
 * Format number to compact Rupiah (e.g., "150K", "1.5M")
 * @param amount - Number to format
 * @returns Compact currency string
 */
export const formatCompactRupiah = (amount: number): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp 0'
  }

  const absAmount = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''

  if (absAmount >= 1000000000) {
    return `${sign}Rp ${(absAmount / 1000000000).toFixed(1)}B`
  } else if (absAmount >= 1000000) {
    return `${sign}Rp ${(absAmount / 1000000).toFixed(1)}M`
  } else if (absAmount >= 1000) {
    return `${sign}Rp ${(absAmount / 1000).toFixed(0)}K`
  } else {
    return `${sign}Rp ${absAmount}`
  }
}

/**
 * Parse Rupiah string to number
 * @param rupiahString - String like "Rp 150.000" or "150000"
 * @returns Parsed number or 0 if invalid
 */
export const parseRupiah = (rupiahString: string): number => {
  if (!rupiahString || typeof rupiahString !== 'string') {
    return 0
  }

  // Remove currency symbol, spaces, and dots (thousand separators)
  const cleanString = rupiahString
    .replace(/Rp/gi, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.') // Replace comma with dot for decimal
    .trim()

  const parsed = parseFloat(cleanString)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Format input value for currency input field
 * @param value - Input value (string or number)
 * @returns Formatted string for input display
 */
export const formatCurrencyInput = (value: string | number): string => {
  if (!value) return ''
  
  const numericValue = typeof value === 'string' ? parseRupiah(value) : value
  if (numericValue === 0) return ''
  
  return formatRupiah(numericValue, false)
}

/**
 * Validate if string is a valid currency amount
 * @param value - String to validate
 * @returns True if valid currency format
 */
export const isValidCurrency = (value: string): boolean => {
  if (!value || typeof value !== 'string') return false
  
  const parsed = parseRupiah(value)
  return parsed > 0 && parsed <= 999999999.99
}

/**
 * Format currency for display in tables/lists
 * @param amount - Number to format
 * @param compact - Whether to use compact format for large numbers
 * @returns Formatted currency string
 */
export const formatDisplayCurrency = (amount: number, compact: boolean = false): string => {
  if (compact && Math.abs(amount) >= 1000000) {
    return formatCompactRupiah(amount)
  }
  return formatRupiah(amount)
}

/**
 * Calculate percentage of amount relative to total
 * @param amount - Part amount
 * @param total - Total amount
 * @returns Percentage string (e.g., "25%")
 */
export const calculatePercentage = (amount: number, total: number): string => {
  if (total === 0 || isNaN(amount) || isNaN(total)) {
    return '0%'
  }
  
  const percentage = (amount / total) * 100
  return `${percentage.toFixed(1)}%`
}

/**
 * Format currency with color coding for positive/negative values
 * @param amount - Number to format
 * @returns Object with formatted string and color class
 */
export const formatCurrencyWithColor = (amount: number): { 
  formatted: string
  colorClass: string
  isPositive: boolean
} => {
  const isPositive = amount >= 0
  return {
    formatted: formatRupiah(Math.abs(amount)),
    colorClass: isPositive ? 'text-green-600' : 'text-red-600',
    isPositive
  }
}

/**
 * Round currency to nearest hundred (for cleaner display)
 * @param amount - Amount to round
 * @returns Rounded amount
 */
export const roundCurrency = (amount: number): number => {
  return Math.round(amount / 100) * 100
}

/**
 * Constants for currency validation
 */
export const CURRENCY_LIMITS = {
  MIN_AMOUNT: 1,
  MAX_AMOUNT: 999999999.99,
  MAX_DECIMAL_PLACES: 2
} as const

/**
 * Format currency for CSV export (plain number format)
 * @param amount - Number to format
 * @returns Plain number string for CSV
 */
export const formatCurrencyForCSV = (amount: number): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0'
  }
  return amount.toFixed(2)
}
