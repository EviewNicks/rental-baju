/**
 * Global Setup untuk Playwright E2E Testing dengan Clerk Authentication State
 *
 * Setup ini mengikuti dokumentasi resmi Clerk Test Authenticated Flows:
 * 1. Configure Playwright dengan Clerk menggunakan clerkSetup() (setup terpisah)
 * 2. Authenticate user dan save auth state ke storage file (setup terpisah)
 * 3. Auth state akan di-reuse oleh semua tests untuk performance
 *
 * Referensi:
 * - https://clerk.com/docs/testing/playwright/test-authenticated-flows
 * - https://clerk.com/docs/testing/playwright/overview
 * - https://clerk.com/docs/testing/playwright/test-helpers
 */

import { clerk, clerkSetup } from '@clerk/testing/playwright'
import { test as setup } from '@playwright/test'
import path from 'path'
import dotenv from 'dotenv'

// CRITICAL: Setup must be run serially sesuai dokumentasi Overview
// https://clerk.com/docs/testing/playwright/overview
setup.describe.configure({ mode: 'serial' })

// Setup 1: Configure Clerk ONLY - sesuai dokumentasi
setup('global setup', async () => {
  await clerkSetup()
  try {
    if (process.env.NODE_ENV) {
      dotenv.config({
        path: `.env.${process.env.NODE_ENV}`,
        override: true,
      })
    } else {
      console.log('No specific ENV provided, using default environment variables.')
    }
    console.log(`Loaded environment variables from .env.${process.env.NODE_ENV}`)
  } catch (error) {
    console.error('Error in loading environment variables', error)
  }
})
// Define the path to the storage file, which is `user.json`
// Path disesuaikan dengan struktur directory proyek kita
const authFile = path.join(__dirname, '.clerk/user.json')

// Setup 2: Authenticate dan save state - sesuai dokumentasi Test Authenticated Flows
setup('authenticate', async ({ page }) => {
  console.log('🔐 Authenticating user and saving state to storage...')

  // Navigate to unprotected page that loads Clerk - sesuai dokumentasi Test Helpers
  await page.goto('/')

  // Perform authentication - sesuai dokumentasi Test Helpers
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: process.env.E2E_CLERK_USER_USERNAME!,
      password: process.env.E2E_CLERK_USER_PASSWORD!,
    },
  })

  // Navigate ke protected page untuk verify authentication berhasil
  await page.goto('/dashboard')

  // Ensure user berhasil access protected page
  await page.waitForSelector('main', { timeout: 10000 })

  // Save authentication state - sesuai dokumentasi Test Authenticated Flows
  await page.context().storageState({ path: authFile })
  console.log('✅ Auth state saved to:', authFile)
})
