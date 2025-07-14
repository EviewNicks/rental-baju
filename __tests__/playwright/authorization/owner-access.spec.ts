/**
 * E2E Tests untuk Role Owner Access Control
 *
 * Test ini memverifikasi bahwa user dengan role Owner:
 * ✅ Dapat mengakses semua area (dashboard, producer, owner)
 * ✅ Full system access dan role hierarchy
 * ✅ Role persistence dan session management
 *
 * Menggunakan storage state dari global setup untuk performance
 */

import { test, expect } from '@playwright/test'
import { testRoleBasedAccess, verifyUserSession, takeScreenshot } from '../utils/test-helpers'
import { getRoleTestUser } from '../fixtures/test-users'

// Gunakan storage state untuk Owner dari global setup
test.use({ storageState: '__tests__/playwright/.clerk/owner.json' })

test.describe('Owner Role Access Control', () => {
  test.beforeEach(async ({ page }) => {
    // Verify user sudah authenticated dengan role Owner
    await verifyUserSession(page)
  })

  test('owner dapat mengakses dashboard', async ({ page }) => {
    console.log('🧪 Testing Owner access to dashboard')

    await testRoleBasedAccess(page, '/dashboard', 'owner', true)

    // Additional verification untuk dashboard content
    // Cek data-testid pada root utama jika ada, fallback ke panjang konten
    const root = page.locator('[data-testid="owner-dashboard-root"]')
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

    await takeScreenshot(page, 'owner-dashboard-access')
  })

  test('owner dapat mengakses producer area', async ({ page }) => {
    console.log('🧪 Testing Owner access to producer area')

    await testRoleBasedAccess(page, '/producer', 'owner', true)

    // Additional verification untuk producer content
    const root2 = page.locator('[data-testid="owner-dashboard-root"]')
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

    await takeScreenshot(page, 'owner-producer-access')
  })

  test('owner dapat mengakses owner area', async ({ page }) => {
    console.log('🧪 Testing Owner access to owner area')

    await testRoleBasedAccess(page, '/owner', 'owner', true)

    // Additional verification untuk owner content
    const root3 = page.locator('[data-testid="owner-dashboard-root"]')
    if (await root3.count()) {
      expect(await root3.isVisible()).toBeTruthy()
      const rootContent = await root3.innerHTML()
      expect(rootContent.length).toBeGreaterThan(100)
    } else {
      // Fallback: cek panjang konten halaman
      const pageContent = await page.content()
      expect(pageContent.length).toBeGreaterThan(1000)
    }
    await expect(page).toHaveURL('/owner')

    await takeScreenshot(page, 'owner-area-access')
  })

  test('owner dapat mengakses semua area yang diizinkan', async ({ page }) => {
    console.log('🧪 Testing Owner access to all allowed areas')

    const ownerUser = getRoleTestUser('owner')

    // Test semua allowed routes
    for (const route of ownerUser.allowedRoutes) {
      await page.goto(route)
      await expect(page).not.toHaveURL('/unauthorized')
      // Cek data-testid pada root utama jika ada, fallback ke panjang konten
      const rootNav = page.locator('[data-testid="owner-dashboard-root"]')
      if (await rootNav.count()) {
        expect(await rootNav.isVisible()).toBeTruthy()
        const rootContent = await rootNav.innerHTML()
        expect(rootContent.length).toBeGreaterThan(100)
      } else {
        const pageContent = await page.content()
        expect(pageContent.length).toBeGreaterThan(1000)
      }

      console.log(`✅ Owner successfully accessed ${route}`)
    }

    await takeScreenshot(page, 'owner-all-areas-access')
  })

  test('owner session tetap aktif setelah navigasi', async ({ page }) => {
    console.log('🧪 Testing Owner session persistence')

    // Navigate ke semua area
    await page.goto('/dashboard')
    await verifyUserSession(page)

    await page.goto('/producer')
    await verifyUserSession(page)

    await page.goto('/owner')
    await verifyUserSession(page)

    // Refresh page
    await page.reload()
    await verifyUserSession(page)

    // Navigate ke homepage
    await page.goto('/')
    await verifyUserSession(page)

    console.log('✅ Owner session remained active throughout navigation')

    await takeScreenshot(page, 'owner-session-persistence')
  })

  test('owner dapat beralih antara semua area', async ({ page }) => {
    console.log('🧪 Testing Owner switching between all areas')

    // Navigate ke semua area secara berurutan
    const areas = ['/dashboard', '/producer', '/owner']

    for (const area of areas) {
      await page.goto(area)
      await expect(page).toHaveURL(area)
      await verifyUserSession(page)
      // Cek data-testid pada root utama jika ada, fallback ke panjang konten
      const rootArea = page.locator('[data-testid="owner-dashboard-root"]')
      if (await rootArea.count()) {
        expect(await rootArea.isVisible()).toBeTruthy()
        const rootContent = await rootArea.innerHTML()
        expect(rootContent.length).toBeGreaterThan(100)
      } else {
        const pageContent = await page.content()
        expect(pageContent.length).toBeGreaterThan(1000)
      }

      console.log(`✅ Owner successfully navigated to ${area}`)
    }

    // Navigate kembali ke dashboard
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/dashboard')
    await verifyUserSession(page)

    console.log('✅ Owner successfully switched between all areas')

    await takeScreenshot(page, 'owner-area-switching')
  })

  test('owner tidak memiliki restricted routes', async ({ page }) => {
    console.log('🧪 Testing Owner has no restricted routes')

    const ownerUser = getRoleTestUser('owner')

    // Owner should have no restricted routes
    expect(ownerUser.restrictedRoutes).toHaveLength(0)

    // Verify owner can access all defined routes
    const allRoutes = ['/dashboard', '/producer', '/owner']

    for (const route of allRoutes) {
      await page.goto(route)
      await expect(page).not.toHaveURL('/unauthorized')

      console.log(`✅ Owner has no restrictions on ${route}`)
    }

    console.log('✅ Owner has no restricted routes verified')

    await takeScreenshot(page, 'owner-no-restrictions')
  })
})
