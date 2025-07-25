/**
 * Input Sanitizer - Security utilities for input validation
 * Provides XSS protection and data sanitization
 */

// Simple HTML tag removal without external dependencies
function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '')
}

// Remove potentially dangerous characters
function removeScriptChars(input: string): string {
  return input
    .replace(/[<>"'`]/g, '') // Remove HTML/script injection chars
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
}

// Basic sanitization function
function basicSanitize(input: string): string {
  return removeScriptChars(stripHtml(input)).trim()
}

/**
 * Sanitize string input to prevent XSS attacks
 * Removes potentially dangerous HTML and scripts
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') {
    return ''
  }
  
  // Remove HTML tags and potentially dangerous content
  return basicSanitize(input)
}

/**
 * Sanitize phone number input
 * Normalizes Indonesian phone number format
 */
export function sanitizePhoneNumber(phone: unknown): string {
  if (typeof phone !== 'string') {
    return ''
  }
  
  const sanitized = sanitizeString(phone)
  
  // Remove all non-numeric characters except +
  const cleaned = sanitized.replace(/[^\d+]/g, '')
  
  // Return cleaned phone (normalization will be done by Zod transform)
  return cleaned
}

/**
 * Sanitize email input
 * Basic email sanitization and normalization
 */
export function sanitizeEmail(email: unknown): string {
  if (typeof email !== 'string') {
    return ''
  }
  
  const sanitized = sanitizeString(email).toLowerCase().trim()
  
  // Return sanitized email (validation will be done by Zod)
  return sanitized
}

/**
 * Sanitize NIK (Indonesian ID number)
 * Ensures only numeric characters for NIK
 */
export function sanitizeNIK(nik: unknown): string {
  if (typeof nik !== 'string') {
    return ''
  }
  
  const sanitized = sanitizeString(nik)
  
  // Remove all non-numeric characters
  const cleaned = sanitized.replace(/\D/g, '')
  
  // Return cleaned NIK (validation will be done by Zod)
  return cleaned
}

/**
 * Sanitize text area input (address, notes)
 * Allows basic formatting but removes dangerous content
 */
export function sanitizeTextArea(input: unknown): string {
  if (typeof input !== 'string') {
    return ''
  }
  
  // Remove HTML tags and dangerous content
  return basicSanitize(input)
}

/**
 * Comprehensive data sanitization for Penyewa input
 * Sanitizes all fields according to their types
 * Returns empty strings instead of null for Zod compatibility
 */
export function sanitizePenyewaInput(data: Record<string, unknown>) {
  const sanitized: Record<string, string> = {}
  
  // Sanitize nama - required field
  if ('nama' in data) {
    const nama = sanitizeString(data.nama)
    sanitized.nama = nama
  }
  
  // Sanitize telepon - required field
  if ('telepon' in data) {
    const telepon = sanitizePhoneNumber(data.telepon)
    sanitized.telepon = telepon
  }
  
  // Sanitize alamat - required field
  if ('alamat' in data) {
    const alamat = sanitizeTextArea(data.alamat)
    sanitized.alamat = alamat
  }
  
  // Sanitize email - optional field
  if ('email' in data) {
    const email = sanitizeEmail(data.email)
    sanitized.email = email // Empty string if invalid
  }
  
  // Sanitize NIK - optional field
  if ('nik' in data) {
    const nik = sanitizeNIK(data.nik)
    sanitized.nik = nik // Empty string if invalid
  }
  
  // Sanitize catatan - optional field
  if ('catatan' in data) {
    const catatan = sanitizeTextArea(data.catatan)
    sanitized.catatan = catatan // Empty string if invalid
  }
  
  // Note: foto field should be handled separately with proper file validation
  
  return sanitized
}

/**
 * Rate limiting key sanitization
 * Prevents injection attacks in rate limiting keys
 */
export function sanitizeRateLimitKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9-_.]/g, '').substring(0, 50)
}