/**
 * E2E Tests untuk Role Producer Access Control
 *
 * Test ini memverifikasi bahwa user dengan role Producer:
 * ✅ Dapat mengakses dashboard dan area producer
 * ❌ Tidak dapat mengakses area owner
 * ✅ Role persistence dan session management
 *
 * Menggunakan storage state dari global setup untuk performance
 */

import { test, expect } from '@playwright/test'
import { testRoleBasedAccess, verifyUserSession, takeScreenshot } from '../utils/test-helpers'
import { getRoleTestUser } from '../fixtures/test-users'
// import { UserRole } from '../../../features/auth/types' // Tidak digunakan

// Gunakan storage state untuk Producer dari global setup
test.use({ storageState: '__tests__/playwright/.clerk/producer.json' })

test.describe('Producer Role Access Control', () => {
  test.beforeEach(async ({ page }) => {
    // Verify user sudah authenticated dengan role Producer
    await verifyUserSession(page)
  })

  test('producer dapat mengakses dashboard', async ({ page }) => {
    console.log('🧪 Testing Producer access to dashboard')

    await testRoleBasedAccess(page, '/dashboard', 'producer', true)

    // Additional verification untuk dashboard content
    // Cek data-testid pada root utama jika ada, fallback ke panjang konten
    const root = page.locator('[data-testid="producer-dashboard-root"]')
    if (await root.count()) {
      expect(await root.isVisible()).toBeTruthy()
      const rootContent = await root.innerHTML()
      expect(rootContent.length).toBeGreaterThan(100)
    } else {
      // Fallback: cek panjang konten halaman
      const pageContent = await page.content()
      expect(pageContent.length).toBeGreaterThan(1000)
    }
    await expect(page).toHaveURL('/dashboard')

    await takeScreenshot(page, 'producer-dashboard-access')
  })

  test('producer dapat mengakses producer area', async ({ page }) => {
    console.log('🧪 Testing Producer access to producer area')

    await testRoleBasedAccess(page, '/producer', 'producer', true)

    // Additional verification untuk producer content
    // Cek root utama, fallback ke main jika tidak ada
    let root2 = page.locator('[data-testid="producer-dashboard-root"]')
    if (!(await root2.count())) {
      root2 = page.locator('[data-testid="producer-dashboard-main"]')
    }
    if (await root2.count()) {
      expect(await root2.isVisible()).toBeTruthy()
      const rootContent = await root2.innerHTML()
      expect(rootContent.length).toBeGreaterThan(100)
    } else {
      // Fallback: cek panjang konten halaman
      const pageContent = await page.content()
      expect(pageContent.length).toBeGreaterThan(1000)
    }
    await expect(page).toHaveURL('/producer')

    await takeScreenshot(page, 'producer-area-access')
  })

  test('producer tidak dapat mengakses owner area', async ({ page }) => {
    console.log('🧪 Testing Producer blocked from owner area')

    await testRoleBasedAccess(page, '/owner', 'producer', false)

    // Verify redirect ke unauthorized page
    await expect(page).toHaveURL('/unauthorized')

    await takeScreenshot(page, 'producer-owner-blocked')
  })

  test('producer dapat melakukan navigasi di area yang diizinkan', async ({ page }) => {
    console.log('🧪 Testing Producer navigation in allowed areas')

    const producerUser = getRoleTestUser('producer')

    // Test semua allowed routes
    for (const route of producerUser.allowedRoutes) {
      await page.goto(route)
      await expect(page).not.toHaveURL('/unauthorized')
      // Cek data-testid pada root utama jika ada, fallback ke panjang konten
      const rootNav = page.locator('[data-testid="producer-dashboard-root"]')
      if (await rootNav.count()) {
        expect(await rootNav.isVisible()).toBeTruthy()
        const rootContent = await rootNav.innerHTML()
        expect(rootContent.length).toBeGreaterThan(100)
      } else {
        const pageContent = await page.content()
        expect(pageContent.length).toBeGreaterThan(1000)
      }

      console.log(`✅ Producer successfully navigated to ${route}`)
    }

    await takeScreenshot(page, 'producer-navigation-allowed')
  })

  test('producer session tetap aktif setelah navigasi', async ({ page }) => {
    console.log('🧪 Testing Producer session persistence')

    // Navigate ke beberapa halaman
    await page.goto('/dashboard')
    await verifyUserSession(page)

    await page.goto('/producer')
    await verifyUserSession(page)

    // Refresh page
    await page.reload()
    await verifyUserSession(page)

    // Navigate ke homepage
    await page.goto('/')
    await verifyUserSession(page)

    console.log('✅ Producer session remained active throughout navigation')

    await takeScreenshot(page, 'producer-session-persistence')
  })

  test('producer dapat beralih antara dashboard dan producer area', async ({ page }) => {
    console.log('🧪 Testing Producer switching between allowed areas')

    // Navigate dari dashboard ke producer
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/dashboard')
    await verifyUserSession(page)

    await page.goto('/producer')
    await expect(page).toHaveURL('/producer')
    await verifyUserSession(page)

    // Navigate kembali ke dashboard
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/dashboard')
    await verifyUserSession(page)

    console.log('✅ Producer successfully switched between allowed areas')

    await takeScreenshot(page, 'producer-area-switching')
  })
})
