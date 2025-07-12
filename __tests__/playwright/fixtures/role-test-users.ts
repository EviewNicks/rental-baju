/**
 * Role-Based Test Users untuk Authorization E2E Testing
 *
 * Extended dari test-users.ts dengan fokus pada role-based access control testing.
 * Menggunakan environment variables untuk real user accounts dengan different roles.
 *
 * Setup Required di Clerk Dashboard:
 * 1. Admin User: Set public_metadata.role = 'admin'
 * 2. Creator User: Set public_metadata.role = 'creator'
 * 3. Regular User: Set public_metadata.role = 'user' (atau default)
 *
 * Environment Variables Required:
 * - E2E_CLERK_ADMIN_USERNAME, E2E_CLERK_ADMIN_PASSWORD, E2E_CLERK_ADMIN_EMAIL
 * - E2E_CLERK_CREATOR_USERNAME, E2E_CLERK_CREATOR_PASSWORD, E2E_CLERK_CREATOR_EMAIL
 * - E2E_CLERK_USER_USERNAME, E2E_CLERK_USER_PASSWORD, E2E_CLERK_USER_EMAIL
 *
 * Referensi:
 * - https://clerk.com/docs/testing/playwright/overview
 * - https://clerk.com/docs/testing/playwright/test-authenticated-flows
 * - https://clerk.com/docs/guides/basic-rbac
 */

import { TestUser, validateTestEnvironment } from './test-users'
import { UserRole } from '../../../features/auth/types'

export interface RoleTestUser extends TestUser {
  role: UserRole
  allowedRoutes: string[]
  restrictedRoutes: string[]
  displayName: string
  dashboardUrl: string
}

// Role-based test users dengan access control configuration
export const roleTestUsers = {
  /**
   * Admin Test User - Memiliki akses ke semua routes
   */
  admin: {
    identifier: process.env.E2E_CLERK_ADMIN_USERNAME || process.env.E2E_CLERK_USER_USERNAME!,
    password: process.env.E2E_CLERK_ADMIN_PASSWORD || process.env.E2E_CLERK_USER_PASSWORD!,
    email: process.env.E2E_CLERK_ADMIN_EMAIL || process.env.E2E_CLERK_USER_EMAIL!,
    role: 'admin' as const,
    displayName: 'Admin Test User',
    dashboardUrl: '/admin',
    allowedRoutes: [
      '/dashboard', // User dashboard - semua role bisa akses
      '/admin', // Admin dashboard - hanya admin
      '/creator', // Creator dashboard - admin dan creator
      '/settings',
      '/profile',
    ],
    restrictedRoutes: [], // Admin dapat akses semua routes
  },

  /**
   * Creator Test User - Akses ke creator dan user routes, tidak bisa admin
   */
  creator: {
    identifier: process.env.E2E_CLERK_CREATOR_USERNAME || process.env.E2E_CLERK_USER_USERNAME!,
    password: process.env.E2E_CLERK_CREATOR_PASSWORD || process.env.E2E_CLERK_USER_PASSWORD!,
    email: process.env.E2E_CLERK_CREATOR_EMAIL || process.env.E2E_CLERK_USER_EMAIL!,
    role: 'creator' as const,
    displayName: 'Creator Test User',
    dashboardUrl: '/creator',
    allowedRoutes: [
      '/dashboard', // User dashboard - semua role bisa akses
      '/creator', // Creator dashboard - creator dan admin
      '/settings',
      '/profile',
    ],
    restrictedRoutes: ['/admin'], // Creator tidak bisa akses admin dashboard
  },

  /**
   * Regular User - Hanya akses ke user routes
   */
  user: {
    identifier: process.env.E2E_CLERK_USER_USERNAME!,
    password: process.env.E2E_CLERK_USER_PASSWORD!,
    email: process.env.E2E_CLERK_USER_EMAIL!,
    role: 'user' as const,
    displayName: 'Regular Test User',
    dashboardUrl: '/dashboard',
    allowedRoutes: ['/dashboard', '/settings', '/profile'], // User hanya akses dashboard umum
    restrictedRoutes: ['/admin', '/creator'], // User tidak bisa akses admin dan creator dashboard
  },
} as const

// Access Control Configuration Matrix
export const accessControlMatrix = {
  '/admin': ['admin'], // Hanya admin
  '/creator': ['admin', 'creator'], // Admin dan creator
  '/dashboard': ['admin', 'creator', 'user'], // Semua role
  '/settings': ['admin', 'creator', 'user'], // Semua role
  '/profile': ['admin', 'creator', 'user'], // Semua role
} as const

// Helper function untuk check apakah role punya akses ke route
export function hasAccess(userRole: UserRole, route: string): boolean {
  const allowedRoles = accessControlMatrix[route as keyof typeof accessControlMatrix]
  // @ts-expect-error - userRole is UserRole
  return allowedRoles?.includes(userRole) ?? false
}

// Helper function untuk get role test user berdasarkan role
export function getRoleTestUser(role: UserRole): RoleTestUser {
  const user = roleTestUsers[role]
  return {
    ...user,
    allowedRoutes: [...user.allowedRoutes], // Convert readonly to mutable
    restrictedRoutes: [...user.restrictedRoutes], // Convert readonly to mutable
  }
}

// Helper function untuk validate role-based environment
export function validateRoleTestEnvironment(): {
  isValid: boolean
  missingVars: string[]
  availableRoles: UserRole[]
} {


  const roleEnvVars = {
    admin: ['E2E_CLERK_ADMIN_USERNAME', 'E2E_CLERK_ADMIN_PASSWORD'],
    creator: ['E2E_CLERK_CREATOR_USERNAME', 'E2E_CLERK_CREATOR_PASSWORD'],
    user: ['E2E_CLERK_USER_USERNAME', 'E2E_CLERK_USER_PASSWORD'],
  }

  const missingVars: string[] = []
  const availableRoles: UserRole[] = []

  // Check each role's environment variables
  Object.entries(roleEnvVars).forEach(([role, envVars]) => {
    const missing = envVars.filter((envVar) => !process.env[envVar])
    if (missing.length === 0) {
      availableRoles.push(role as UserRole)
    } else {
      missingVars.push(...missing)
    }
  })

  // Base validation dari test-users.ts
  const baseValidation = validateTestEnvironment()
  missingVars.push(...baseValidation.missingVars)

  return {
    isValid: missingVars.length === 0 && availableRoles.length >= 1,
    missingVars: [...new Set(missingVars)], // Remove duplicates
    availableRoles,
  }
}

// Test scenarios configuration
export const authorizationTestScenarios = [
  {
    name: 'Admin Full Access Verification',
    role: 'admin' as const,
    description: 'Admin dapat mengakses semua routes tanpa restriction',
    testType: 'positive' as const,
  },
  {
    name: 'Creator Allowed Access Verification',
    role: 'creator' as const,
    description: 'Creator dapat mengakses creator dan user routes',
    testType: 'positive' as const,
  },
  {
    name: 'Creator Restricted Access Verification',
    role: 'creator' as const,
    description: 'Creator tidak dapat mengakses admin routes',
    testType: 'negative' as const,
  },
  {
    name: 'User Allowed Access Verification',
    role: 'user' as const,
    description: 'User dapat mengakses user routes',
    testType: 'positive' as const,
  },
  {
    name: 'User Restricted Access Verification',
    role: 'user' as const,
    description: 'User tidak dapat mengakses admin dan creator routes',
    testType: 'negative' as const,
  },
] as const

export default roleTestUsers
