/**
 * Global Setup untuk Playwright E2E Testing dengan Clerk Authentication State
 * Multi-Role Support: Kasir, Producer, Owner
 *
 * Setup ini mengikuti dokumentasi resmi Clerk Test Authenticated Flows:
 * 1. Configure Playwright dengan Clerk menggunakan clerkSetup() (setup terpisah)
 * 2. Authenticate user dan save auth state ke storage file (setup terpisah)
 * 3. Auth state akan di-reuse oleh semua tests untuk performance
 * 4. Multi-role support dengan storage state terpisah untuk setiap role
 *
 * Referensi:
 * - https://clerk.com/docs/testing/playwright/test-authenticated-flows
 * - https://clerk.com/docs/testing/playwright/overview
 * - https://clerk.com/docs/testing/playwright/test-helpers
 * - Task Plan: Multi-Role E2E Testing Implementation (RPK-17)
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

// Setup untuk setiap role dengan storage state terpisah
// Path disesuaikan dengan struktur direktori proyek kita
const roleAuthFiles = {
  kasir: path.join(__dirname, '.clerk/kasir.json'),
  producer: path.join(__dirname, '.clerk/producer.json'),
  owner: path.join(__dirname, '.clerk/owner.json'),
}

// Setup authentication untuk setiap role sesuai dokumentasi Clerk
setup('authenticate kasir and save state', async ({ page }) => {
  console.log('🔐 Authenticating kasir and saving state...')
  await page.goto('/')
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: 'kasir01',
      password: 'kasir01rentalbaju',
    },
  })
  await page.goto('/dashboard')
  await page.waitForSelector('main', { timeout: 10000 })
  await page.context().storageState({ path: roleAuthFiles.kasir })
  console.log('✅ Kasir auth state saved to:', roleAuthFiles.kasir)
})

setup('authenticate producer and save state', async ({ page }) => {
  console.log('🔐 Authenticating producer and saving state...')
  await page.goto('/')
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: 'producer01',
      password: 'akunproducer01',
    },
  })
  await page.goto('/producer')
  await page.waitForSelector('main', { timeout: 10000 })
  await page.context().storageState({ path: roleAuthFiles.producer })
  console.log('✅ Producer auth state saved to:', roleAuthFiles.producer)
})

setup('authenticate owner and save state', async ({ page }) => {
  console.log('🔐 Authenticating owner and saving state...')
  await page.goto('/')
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: 'owner01',
      password: 'ardi14mei2005',
    },
  })
  await page.goto('/owner')
  await page.waitForSelector('main', { timeout: 10000 })
  await page.context().storageState({ path: roleAuthFiles.owner })
  console.log('✅ Owner auth state saved to:', roleAuthFiles.owner)
})
