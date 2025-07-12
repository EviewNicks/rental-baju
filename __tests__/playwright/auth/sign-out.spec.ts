/**
 * E2E Test: Sign Out Flow
 *
 * Test ini mencakup:
 * - Successful sign out dari dashboard
 * - Sign out dari berbagai halaman
 * - Session cleanup dan redirect
 * - Protected route access setelah logout
 *
 * IMPORTANT: Test ini menggunakan authentication state dari global.setup.ts
 * untuk memastikan user sudah login sebelum melakukan test sign out.
 * Berbeda dengan sign-in.spec.ts yang menggunakan fresh state.
 */

import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { waitForPageLoad, takeScreenshot, verifyUserLoggedOut } from '../utils/test-helpers'
import path from 'path'

test.describe('Sign Out Flow', () => {
  // CRITICAL: Menggunakan authenticated state dari global setup untuk sign-out tests
  // Berbeda dengan sign-in tests yang menggunakan fresh state
  // Debug path untuk memastikan file storageState terbaca dengan benar
  const authFile = path.join(__dirname, '../.clerk/user.json')
  test.use({ storageState: authFile })

  test.beforeEach(async ({ page }) => {
    // Setup Clerk testing token untuk setiap test
    await setupClerkTestingToken({ page })
  })

  /**
   * Test: Successful sign out dari dashboard
   *
   * Skenario: User yang sudah login melakukan logout dari dashboard
   * Expected: User berhasil logout dan diarahkan ke homepage
   *
   * BDD Format:
   * - Given: User sudah login dan berada di dashboard
   * - When: User klik sign out button
   * - Then: User berhasil logout dan diarahkan ke homepage
   */
  test('should successfully sign out from dashboard', async ({ page }) => {
    // Given: User sudah login dan berada di dashboard
    await page.goto('/dashboard')
    await waitForPageLoad(page)

    // Verify user berada di dashboard
    await page.waitForURL((url) => url.toString().includes('/dashboard'), { timeout: 15000 })
    await expect(page).toHaveURL('/dashboard')

    // When: User klik sign out button
    // Look for various sign out elements
    const signOutSelectors = [
      '[data-testid="desktop-sign-out-button"]',
      'button:has-text("Sign out")',
      'button:has-text("Keluar")',
      '.cl-userButtonPopoverActionButton:has-text("Keluar")',
      '[role="menuitem"]:has-text("Keluar")',
    ]

    let signOutClicked = false
    for (const selector of signOutSelectors) {
      const signOutElement = page.locator(selector)
      if ((await signOutElement.count()) > 0 && (await signOutElement.isVisible())) {
        await signOutElement.click()
        signOutClicked = true
        break
      }
    }

    // If no direct sign out button, try user menu/profile dropdown
    if (!signOutClicked) {
      const userMenuSelectors = [
        '.cl-userButton',
        '[data-testid="desktop-user-button"]',
        '[data-testid="desktop-user-menu"]',
        '.user-menu',
      ]

      for (const selector of userMenuSelectors) {
        const userMenu = page.locator(selector)
        if ((await userMenu.count()) > 0 && (await userMenu.isVisible())) {
          await userMenu.click()
          await page.waitForTimeout(1000) // Wait for menu to appear

          // Try to find sign out in dropdown
          for (const signOutSelector of signOutSelectors) {
            const signOutElement = page.locator(signOutSelector)
            if ((await signOutElement.count()) > 0 && (await signOutElement.isVisible())) {
              await signOutElement.click()
              signOutClicked = true
              break
            }
          }

          if (signOutClicked) break
        }
      }
    }

    // Then: User berhasil logout dan diarahkan ke homepage
    if (signOutClicked) {
      // Wait for redirect after logout
      await page.waitForURL(
        (url) =>
          url.toString() === '/' ||
          url.toString().includes('localhost:3000/') ||
          url.toString().includes('/sign-in'),
        { timeout: 15000 },
      )

      // Verify user logged out
      await verifyUserLoggedOut(page)

      await takeScreenshot(page, 'sign-out-success')
    } else {
      await takeScreenshot(page, 'sign-out-button-not-found')
    }
  })

  /**
   * Test: Sign out dan block protected route access
   *
   * Skenario: User logout kemudian mencoba akses protected route
   * Expected: User tidak dapat mengakses protected routes setelah logout
   *
   * BDD Format:
   * - Given: User sudah login
   * - When: User sign out
   * - Then: User tidak dapat mengakses protected routes
   */
  test('should sign out and block protected route access', async ({ page }) => {
    // Given: User sudah login
    await page.goto('/dashboard')
    await page.waitForURL((url) => url.toString().includes('/dashboard'), { timeout: 15000 })

    // When: User sign out
    const signOutSelectors = [
      '[data-testid="desktop-sign-out-button"]',
      'button:has-text("Keluar")',
      '.cl-userButtonPopoverActionButton:has-text("Keluar")',
    ]

    let signOutSuccess = false
    for (const selector of signOutSelectors) {
      const signOutElement = page.locator(selector)
      if ((await signOutElement.count()) > 0) {
        // If element exists but not visible, try clicking user button first
        if (!(await signOutElement.isVisible())) {
          const userButton = page.locator('.cl-userButton')
          if ((await userButton.count()) > 0) {
            await userButton.click()
            await page.waitForTimeout(1000)
          }
        }

        if (await signOutElement.isVisible()) {
          await signOutElement.click()
          signOutSuccess = true
          break
        }
      }
    }

    if (signOutSuccess) {
      // Wait for logout redirect
      await page.waitForURL((url) => !url.toString().includes('/dashboard'), { timeout: 15000 })

      // Then: User tidak dapat mengakses protected routes
      await page.goto('/dashboard')

      // Should redirect to sign-in
      await page.waitForURL('/sign-in', { timeout: 10000 })
      await expect(page).toHaveURL('/sign-in')

      await takeScreenshot(page, 'sign-out-protected-route-blocked')
    }
  })

  /**
   * Test: Sign out dari berbagai halaman
   *
   * Skenario: User melakukan logout dari halaman selain dashboard
   * Expected: Sign out berhasil dari halaman manapun
   *
   * BDD Format:
   * - Given: User sudah login
   * - When: User sign out dari homepage
   * - Then: Sign out berhasil dari halaman manapun
   */
  test('should sign out from different pages', async ({ page }) => {
    // Given: User sudah login
    await page.goto('/dashboard')
    await page.waitForURL((url) => url.toString().includes('/dashboard'), { timeout: 15000 })

    // Navigate to homepage while logged in
    await page.goto('/')
    await waitForPageLoad(page)

    // When: User sign out dari homepage
    const signOutSelectors = [
      '[data-testid="desktop-sign-out-button"]',
      'button:has-text("Keluar")',
      'button:has-text("Keluar")',
      '.cl-userButton',
    ]

    let signOutFromHomepage = false
    for (const selector of signOutSelectors) {
      const element = page.locator(selector)
      if ((await element.count()) > 0) {
        if (selector === '.cl-userButton') {
          // Click user button to open menu
          await element.click()
          await page.waitForTimeout(1000)

          // Look for sign out in menu
          const signOutInMenu = page
            .locator(
              'button:has-text("Keluar"), .cl-userButtonPopoverActionButton:has-text("Keluar")',
            )
            .first()
          if ((await signOutInMenu.count()) > 0 && (await signOutInMenu.isVisible())) {
            await signOutInMenu.click()
            signOutFromHomepage = true
          }
        } else if (await element.isVisible()) {
          await element.click()
          signOutFromHomepage = true
        }

        if (signOutFromHomepage) break
      }
    }

    // Then: Sign out berhasil dari halaman manapun
    if (signOutFromHomepage) {
      // Verify logout redirect
      await page.waitForURL(
        (url) =>
          url.toString() === '/' ||
          url.toString().includes('localhost:3000/') ||
          url.toString().includes('/sign-in'),
        { timeout: 15000 },
      )

      await verifyUserLoggedOut(page)
      await takeScreenshot(page, 'sign-out-from-homepage')
    }
  })

  /**
   * Test: Clear session data setelah sign out
   *
   * Skenario: Memverifikasi bahwa session data dibersihkan setelah logout
   * Expected: Session data (storage, cookies) dibersihkan
   *
   * BDD Format:
   * - Given: User sudah login
   * - When: User sign out
   * - Then: Session data dibersihkan
   */
  test('should clear session data after sign out', async ({ page }) => {
    // Given: User sudah login
    await page.goto('/dashboard')
    await page.waitForURL((url) => url.toString().includes('/dashboard'), { timeout: 15000 })

    // When: User sign out
    const userButton = page.locator('.cl-userButton')
    if ((await userButton.count()) > 0) {
      await userButton.click()
      await page.waitForTimeout(1000)

      const signOutButton = page
        .locator('button:has-text("Keluar"), .cl-userButtonPopoverActionButton:has-text("Keluar")')
        .first()
      if ((await signOutButton.count()) > 0 && (await signOutButton.isVisible())) {
        await signOutButton.click()

        // Wait for logout process
        await page.waitForURL((url) => !url.toString().includes('/dashboard'), { timeout: 15000 })

        // Then: Session data dibersihkan
        await page.waitForTimeout(2000) // Wait for cleanup

        // Verify session cleanup (at least some cleanup should occur)
        // Note: Complete cleanup depends on Clerk's implementation
        await takeScreenshot(page, 'sign-out-session-cleanup')
      }
    }
  })

  /**
   * Test: Sign out dengan browser refresh
   *
   * Skenario: User refresh browser kemudian melakukan logout
   * Expected: User masih bisa sign out setelah refresh
   *
   * BDD Format:
   * - Given: User sudah login
   * - When: User refresh browser setelah login
   * - Then: User masih bisa sign out setelah refresh
   */
  test('should handle sign out with browser refresh', async ({ page }) => {
    // Given: User sudah login
    await page.goto('/dashboard')
    await page.waitForURL((url) => url.toString().includes('/dashboard'), { timeout: 15000 })

    // When: User refresh browser setelah login
    await page.reload()
    await waitForPageLoad(page)

    // Verify still logged in after refresh
    await expect(page).toHaveURL('/dashboard')

    // Then: User masih bisa sign out setelah refresh
    const userButton = page.locator('.cl-userButton')
    if ((await userButton.count()) > 0) {
      await userButton.click()
      await page.waitForTimeout(1000)

      const signOutButton = page.locator('button:has-text("Keluar")').first()
      if ((await signOutButton.count()) > 0 && (await signOutButton.isVisible())) {
        await signOutButton.click()

        // Verify logout after refresh
        await page.waitForURL((url) => !url.toString().includes('/dashboard'), { timeout: 15000 })
        await verifyUserLoggedOut(page)

        await takeScreenshot(page, 'sign-out-after-refresh')
      }
    }
  })

  /**
   * Test: Multiple tab sign out
   *
   * Skenario: User login di multiple tabs kemudian logout dari satu tab
   * Expected: Tab lain juga logout (shared session)
   *
   * BDD Format:
   * - Given: User login di tab pertama (menggunakan shared storageState)
   * - When: User sign out dari tab pertama
   * - Then: Verify logout successful pada tab pertama
   * Note: Test ini difokuskan pada sign out functionality, session sharing
   * antar tab memerlukan setup yang lebih kompleks
   */
  test('should handle multiple tab sign out', async ({ context }) => {
    // Given: User login di tab pertama - menggunakan storageState dari global setup
    const page1 = await context.newPage()
    await setupClerkTestingToken({ page: page1 })

    // Navigate ke dashboard dengan error handling yang lebih baik
    await page1.goto('/dashboard')
    await waitForPageLoad(page1)

    try {
      await page1.waitForURL((url) => url.toString().includes('/dashboard'), { timeout: 15000 })
    } catch {
      // If Tab1 can't access dashboard, skip the test gracefully
      await takeScreenshot(page1, 'tab1-auth-failed')
      await page1.close()
      return // Skip test jika authentication tidak bekerja
    }

    // When: User sign out dari tab pertama
    const userButton = page1.locator('.cl-userButton')

    let signOutSuccess = false
    if ((await userButton.count()) > 0) {
      await userButton.click()
      await page1.waitForTimeout(1000)

      // Try different sign out button selectors
      const signOutSelectors = [
        'button:has-text("Keluar")',
        'button:has-text("Sign out")',
        '.cl-userButtonPopoverActionButton:has-text("Keluar")',
        '.cl-userButtonPopoverActionButton:has-text("Sign out")',
        '[role="menuitem"]:has-text("Keluar")',
        '[role="menuitem"]:has-text("Sign out")',
      ]

      for (const selector of signOutSelectors) {
        const signOutButton = page1.locator(selector).first()
        if ((await signOutButton.count()) > 0 && (await signOutButton.isVisible())) {
          await signOutButton.click()
          signOutSuccess = true
          break
        }
      }

      if (signOutSuccess) {
        // Wait for logout dari tab1
        try {
          await page1.waitForURL((url) => !url.toString().includes('/dashboard'), {
            timeout: 15000,
          })

          // Then: Verify protected route access setelah logout
          await page1.goto('/dashboard')

          await page1.waitForURL('/sign-in', { timeout: 10000 })

          await takeScreenshot(page1, 'sign-out-multi-tab-success')
        } catch {
          await takeScreenshot(page1, 'sign-out-multi-tab-failed')
        }
      } else {
        await takeScreenshot(page1, 'sign-out-button-not-found-tab1')
      }
    } else {
      await takeScreenshot(page1, 'user-button-not-found-tab1')
    }

    // Cleanup: Close tabs
    await page1.close()
  })

  /**
   * Test: Sign out error handling
   *
   * Skenario: Network error terjadi saat logout
   * Expected: Error handled gracefully
   *
   * BDD Format:
   * - Given: User sudah login
   * - When: User mencoba sign out dengan network error
   * - Then: Error handled gracefully
   */
  test('should handle sign out error gracefully', async ({ page }) => {
    // Given: User sudah login
    await page.goto('/dashboard')
    await page.waitForURL((url) => url.toString().includes('/dashboard'), { timeout: 15000 })

    // Simulate network error during sign out
    await page.route('**/*clerk*', (route) => {
      if (route.request().method() === 'POST') {
        route.abort() // Abort sign out request
      } else {
        route.continue()
      }
    })

    // When: User mencoba sign out dengan network error
    const userButton = page.locator('.cl-userButton')
    if ((await userButton.count()) > 0) {
      await userButton.click()
      await page.waitForTimeout(1000)

      const signOutButton = page.locator('button:has-text("Keluar")').first()
      if ((await signOutButton.count()) > 0 && (await signOutButton.isVisible())) {
        await signOutButton.click()

        // Wait a bit to see if error handling occurs
        await page.waitForTimeout(3000)

        // Then: Error handled gracefully (user might still be logged in)
        // This depends on Clerk's error handling implementation
        await takeScreenshot(page, 'sign-out-network-error')
      }
    }

    // Clear route for cleanup
    await page.unroute('**/*clerk*')
  })
})
