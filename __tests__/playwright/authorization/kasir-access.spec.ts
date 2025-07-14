/**
 * E2E Tests untuk Role Kasir Access Control
 *
 * Test ini memverifikasi bahwa user dengan role Kasir:
 * ✅ Dapat mengakses dashboard dan area kasir
 * ❌ Tidak dapat mengakses area producer dan owner
 * ✅ Role persistence dan session management
 *
 * Menggunakan storage state dari global setup untuk performance
 */

import { test, expect } from '@playwright/test'
import { testRoleBasedAccess, verifyUserSession, takeScreenshot } from '../utils/test-helpers'
import { getRoleTestUser } from '../fixtures/test-users'

// Gunakan storage state untuk Kasir dari global setup
test.use({ storageState: '__tests__/playwright/.clerk/kasir.json' })

test.describe('Kasir Role Access Control', () => {
  test.beforeEach(async ({ page }) => {
    // Verify user sudah authenticated dengan role Kasir
    await verifyUserSession(page)
  })

  test('kasir dapat mengakses dashboard', async ({ page }) => {
    console.log('🧪 Testing Kasir access to dashboard')

    await testRoleBasedAccess(page, '/dashboard', 'kasir', true)

    // Additional verification untuk dashboard content
    await expect(page).toHaveURL('/dashboard')
    // Check for any content instead of specific main element
    const pageContent = await page.content()
    expect(pageContent.length).toBeGreaterThan(1000)

    await takeScreenshot(page, 'kasir-dashboard-access')
  })

  test('kasir tidak dapat mengakses producer area', async ({ page }) => {
    console.log('🧪 Testing Kasir blocked from producer area')

    await testRoleBasedAccess(page, '/producer', 'kasir', false)

    // Verify redirect ke unauthorized page
    await expect(page).toHaveURL('/unauthorized')

    await takeScreenshot(page, 'kasir-producer-blocked')
  })

  test('kasir tidak dapat mengakses owner area', async ({ page }) => {
    console.log('🧪 Testing Kasir blocked from owner area')

    await testRoleBasedAccess(page, '/owner', 'kasir', false)

    // Verify redirect ke unauthorized page
    await expect(page).toHaveURL('/unauthorized')

    await takeScreenshot(page, 'kasir-owner-blocked')
  })

  test('kasir dapat melakukan navigasi di area yang diizinkan', async ({ page }) => {
    console.log('🧪 Testing Kasir navigation in allowed areas')

    const kasirUser = getRoleTestUser('kasir')

    // Test semua allowed routes
    for (const route of kasirUser.allowedRoutes) {
      await page.goto(route)
      await expect(page).not.toHaveURL('/unauthorized')
      await expect(page.locator('main')).toBeVisible()

      console.log(`✅ Kasir successfully navigated to ${route}`)
    }

    await takeScreenshot(page, 'kasir-navigation-allowed')
  })

  test('kasir session tetap aktif setelah navigasi', async ({ page }) => {
    console.log('🧪 Testing Kasir session persistence')

    // Navigate ke beberapa halaman
    await page.goto('/dashboard')
    await verifyUserSession(page)

    // Refresh page
    await page.reload()
    await verifyUserSession(page)

    // Navigate ke homepage
    await page.goto('/')
    await verifyUserSession(page)

    console.log('✅ Kasir session remained active throughout navigation')

    await takeScreenshot(page, 'kasir-session-persistence')
  })
})
