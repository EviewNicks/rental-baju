/**
 * Environment Validation untuk E2E Testing
 *
 * Basic validation functions untuk environment variables yang diperlukan
 * untuk general dan role-based authorization testing dengan Clerk.
 */

import { UserRole } from '../../../features/auth/types'

/**
 * Environment variables yang diperlukan untuk setiap role
 */
export const requiredEnvVars = {
  kasir: ['E2E_CLERK_KASIR_USERNAME', 'E2E_CLERK_KASIR_PASSWORD'],
  producer: ['E2E_CLERK_PRODUCER_USERNAME', 'E2E_CLERK_PRODUCER_PASSWORD'],
  owner: ['E2E_CLERK_OWNER_USERNAME', 'E2E_CLERK_OWNER_PASSWORD'],
  // Base Clerk variables
  clerk: ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'],
} as const

/**
 * Basic validation untuk environment variables
 */
export function validateRoleTestEnvironment(): {
  isValid: boolean
  missingVars: string[]
  availableRoles: UserRole[]
} {
  const missingVars: string[] = []
  const availableRoles: UserRole[] = []

  // Check base Clerk variables
  for (const envVar of requiredEnvVars.clerk) {
    if (!process.env[envVar]) {
      missingVars.push(envVar)
    }
  }

  // Check role-specific variables
  Object.entries(requiredEnvVars).forEach(([role, envVars]) => {
    if (role === 'clerk') return // Skip base variables

    const missing = envVars.filter((envVar) => !process.env[envVar])
    if (missing.length === 0) {
      availableRoles.push(role as UserRole)
    } else {
      missingVars.push(...missing)
    }
  })

  const isValid = missingVars.length === 0 && availableRoles.length >= 1

  return {
    isValid,
    missingVars: [...new Set(missingVars)], // Remove duplicates
    availableRoles,
  }
}

/**
 * Helper untuk check apakah role tersedia untuk testing
 */
export function isRoleAvailable(role: UserRole): boolean {
  const validation = validateRoleTestEnvironment()
  return validation.availableRoles.includes(role)
}

/**
 * Helper untuk get available roles untuk testing
 */
export function getAvailableRoles(): UserRole[] {
  const validation = validateRoleTestEnvironment()
  return validation.availableRoles
}
