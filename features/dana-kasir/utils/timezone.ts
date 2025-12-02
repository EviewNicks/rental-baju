// Dana Kasir Management - Timezone Utilities
// WITA (Waktu Indonesia Tengah) timezone handling

// WITA is UTC+8
const WITA_OFFSET = 8 * 60 * 60 * 1000 // 8 hours in milliseconds

/**
 * Get current date in WITA timezone
 */
export const getCurrentWITADate = (): Date => {
  const now = new Date()
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  return new Date(utc + WITA_OFFSET)
}

/**
 * Convert any date to WITA timezone
 */
export const toWITADate = (date: Date): Date => {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000)
  return new Date(utc + WITA_OFFSET)
}

/**
 * Get start of day (00:00:00) in WITA timezone
 */
export const getWITAStartOfDay = (date: Date): Date => {
  const witaDate = toWITADate(date)
  witaDate.setHours(0, 0, 0, 0)
  return witaDate
}

/**
 * Get end of day (23:59:59.999) in WITA timezone
 */
export const getWITAEndOfDay = (date: Date): Date => {
  const witaDate = toWITADate(date)
  witaDate.setHours(23, 59, 59, 999)
  return witaDate
}

/**
 * Get date range for a specific day in WITA timezone
 */
export const getWITADayRange = (date: Date): { start: Date; end: Date } => {
  return {
    start: getWITAStartOfDay(date),
    end: getWITAEndOfDay(date)
  }
}

/**
 * Format date to YYYY-MM-DD string in WITA timezone
 */
export const formatWITADate = (date: Date): string => {
  const witaDate = toWITADate(date)
  return witaDate.toISOString().split('T')[0]
}

/**
 * Format date to readable Indonesian format
 */
export const formatIndonesianDate = (date: Date): string => {
  const witaDate = toWITADate(date)
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Makassar' // WITA timezone
  }
  return witaDate.toLocaleDateString('id-ID', options)
}

/**
 * Format date and time to readable Indonesian format
 */
export const formatIndonesianDateTime = (date: Date): string => {
  const witaDate = toWITADate(date)
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Makassar' // WITA timezone
  }
  return witaDate.toLocaleDateString('id-ID', options)
}

/**
 * Check if two dates are the same day in WITA timezone
 */
export const isSameWITADay = (date1: Date, date2: Date): boolean => {
  const wita1 = formatWITADate(date1)
  const wita2 = formatWITADate(date2)
  return wita1 === wita2
}

/**
 * Parse date string (YYYY-MM-DD) to Date object in WITA timezone
 */
export const parseWITADate = (dateString: string): Date => {
  // Parse as WITA date (not UTC)
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day) // month is 0-indexed
  return date
}

/**
 * Get today's date string in WITA timezone (YYYY-MM-DD)
 */
export const getTodayWITAString = (): string => {
  return formatWITADate(getCurrentWITADate())
}

/**
 * Get yesterday's date string in WITA timezone (YYYY-MM-DD)
 */
export const getYesterdayWITAString = (): string => {
  const yesterday = new Date(getCurrentWITADate())
  yesterday.setDate(yesterday.getDate() - 1)
  return formatWITADate(yesterday)
}

/**
 * Get date range for current month in WITA timezone
 */
export const getCurrentMonthWITARange = (): { start: Date; end: Date } => {
  const now = getCurrentWITADate()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  
  return {
    start: getWITAStartOfDay(start),
    end: getWITAEndOfDay(end)
  }
}

/**
 * Get date range for current week in WITA timezone (Monday to Sunday)
 */
export const getCurrentWeekWITARange = (): { start: Date; end: Date } => {
  const now = getCurrentWITADate()
  const dayOfWeek = now.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Sunday = 0, Monday = 1
  
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset)
  
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  
  return {
    start: getWITAStartOfDay(monday),
    end: getWITAEndOfDay(sunday)
  }
}
