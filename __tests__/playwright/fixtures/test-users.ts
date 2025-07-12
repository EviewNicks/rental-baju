/**
 * Test User Fixtures untuk E2E Testing dengan Clerk
 *
 * Data test users yang digunakan untuk authentication dan authorization testing.
 * Menggunakan real user accounts yang sudah terdaftar di Clerk Dashboard sesuai dokumentasi resmi.
 *
 * Referensi:
 * - https://clerk.com/docs/testing/playwright/overview
 * - https://clerk.com/docs/testing/playwright/test-helpers
 * - https://clerk.com/docs/testing/playwright/test-authenticated-flows
 * - https://clerk.com/docs/testing/test-emails-and-phones
 *
 * CRITICAL Setup Required:
 * 1. Create test user di Clerk Dashboard dengan email dan password authentication
 * 2. Enable email dan password dalam Authentication settings
 * 3. Verify bahwa test user dapat login manual di browser
 * 4. Set environment variables di .env.local dengan format yang EXACT
 */

import { UserRole } from '../../../features/auth/types'

export interface TestUser {
  identifier: string // username atau email sesuai Clerk config
  password: string
  firstName?: string
  lastName?: string
  role?: UserRole
  displayName?: string
  email?: string // untuk sign-up tests
  username?: string // untuk sign-up tests
}

// Real test users configuration sesuai demo repo Clerk
export const testUsers = {
  // Primary test user - sesuai demo repo format (untuk authenticated tests)
  existingUser: {
    identifier: process.env.E2E_CLERK_USER_USERNAME!,
    password: process.env.E2E_CLERK_USER_PASSWORD!,
    email: process.env.E2E_CLERK_USER_EMAIL!,
  },

  // NEW USER for sign-up tests (menggunakan fake email sesuai Clerk docs)
  newUser: {
    username: 'newuser' + Date.now(), // Dynamic username untuk avoid conflicts
    email: `newuser+clerk_test@example.com`, // Fake email sesuai Clerk docs
    password: 'NewUserPassword123!',
    identifier: `newuser+clerk_test@example.com`,
  },

  // INVALID USER for validation tests
  invalidUser: {
    username: 'invalid-user',
    email: 'invalid-email-format', // Format email salah
    password: '123', // Password lemah
    identifier: 'invalid-email-format',
  },

  // WEAK PASSWORD USER for password validation tests
  weakPasswordUser: {
    username: 'weakpassuser' + Date.now(),
    email: `weakpass+clerk_test@example.com`,
    password: '123', // Password lemah
    identifier: `weakpass+clerk_test@example.com`,
  },

  // Alternative users untuk testing berbagai scenarios (opsional)
  // Harus dibuat di Clerk Dashboard jika digunakan
  adminUser: {
    identifier: process.env.E2E_CLERK_ADMIN_USERNAME!,
    password: process.env.E2E_CLERK_ADMIN_PASSWORD!,
    role: 'admin' as const,
    displayName: 'Admin Test User',
  },
  creatorUser: {
    identifier: process.env.E2E_CLERK_CREATOR_USERNAME!,
    password: process.env.E2E_CLERK_CREATOR_PASSWORD!,
    role: 'creator' as const,
    displayName: 'Creator Test User',
  },
  regularUser: {
    identifier: process.env.E2E_CLERK_USER_USERNAME!, // Same as existingUser
    password: process.env.E2E_CLERK_USER_PASSWORD!,
    email: process.env.E2E_CLERK_USER_EMAIL!,
    role: 'user' as const,
    displayName: 'Regular Test User',
  },
}

// Clerk test configuration sesuai demo repo
export const clerkTestConfig = {
  // Environment variables yang diperlukan - sesuai demo repo
  requiredEnvVars: [
    'E2E_CLERK_USER_USERNAME',
    'E2E_CLERK_USER_PASSWORD',
    'E2E_CLERK_USER_EMAIL',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
  ],

  // Strategy yang didukung
  supportedStrategies: [
    'password', // username/email + password
    'phone_code', // phone number + verification code (requires setup)
    'email_code', // email + verification code (requires setup)
  ],

  // Default strategy untuk testing
  defaultStrategy: 'password',

  // Fake emails dan phones sesuai Clerk docs
  // https://clerk.com/docs/testing/test-emails-and-phones
  fakeEmailFormats: [
    '+clerk_test@example.com', // Format untuk fake email
    '+clerk_test@email.example', // Alternative format
  ],

  fakePhoneFormats: [
    '+15555550100', // US fake phone number
    '+15555550101', // Alternative fake phone
  ],
}

// Validation helper untuk memastikan environment variables tersedia
export function validateTestEnvironment(): { isValid: boolean; missingVars: string[] } {
  const missingVars = clerkTestConfig.requiredEnvVars.filter((envVar) => !process.env[envVar])

  return {
    isValid: missingVars.length === 0,
    missingVars,
  }
}

// Helper untuk generate dynamic test email dengan timestamp
export function generateTestEmail(prefix: string = 'test'): string {
  const timestamp = Date.now()
  return `${prefix}${timestamp}+clerk_test@example.com`
}

// Helper untuk generate dynamic username
export function generateTestUsername(prefix: string = 'testuser'): string {
  const timestamp = Date.now()
  return `${prefix}${timestamp}`
}
