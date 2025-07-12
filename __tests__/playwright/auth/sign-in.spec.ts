/**
 * E2E Test: Sign In Flow dengan Clerk Authentication
 *
 * Test ini mengikuti flow sign-in Clerk yang sebenarnya:
 * - Single form dengan email/username dan password
 * - Click "Continue" untuk submit
 * - Redirect ke dashboard setelah berhasil
 *
 * Referensi:
 * - https://clerk.com/docs/components/authentication/sign-in
 * - https://clerk.com/docs/testing/playwright/overview
 * - https://clerk.com/docs/testing/playwright/test-helpers
 */

import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { testUsers, validateTestEnvironment } from '../fixtures/test-users'
import { waitForPageLoad, verifyUserSession, takeScreenshot } from '../utils/test-helpers'

// Validate test environment sebelum menjalankan tests
test.beforeAll(async () => {
  const { isValid, missingVars } = validateTestEnvironment()
  if (!isValid) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
  }
})

test.describe('Sign In Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup Clerk testing token untuk setiap test sesuai dokumentasi
    await setupClerkTestingToken({ page })

    // CRITICAL: Clear browser state untuk fresh session
    await page.context().clearCookies()
    await page.context().clearPermissions()
  })

  // CRITICAL: Tidak menggunakan storageState untuk sign-in tests
  // Ini memastikan browser dalam keadaan fresh tanpa authentication state
  test.use({ storageState: { cookies: [], origins: [] } })

  /**
   * Test: Successful Sign In dengan Clerk Form
   *
   * Skenario: User melakukan sign in dengan kredensial valid pada form Clerk
   * Expected: User berhasil login dan diarahkan ke dashboard dengan session aktif
   *
   * BDD Format:
   * - Given: User memiliki account valid dan berada di halaman sign-in
   * - When: User mengisi email dan password, kemudian submit
   * - Then: User berhasil login dan dapat mengakses dashboard
   */
  test('should successfully sign in with valid credentials', async ({ page }) => {
    // Given: User navigasi ke halaman sign-in

    await page.goto('/sign-in')
    await waitForPageLoad(page)

      // When: Fill form dengan kredensial yang benar
    await page.fill('input[name="identifier"]', testUsers.existingUser.email)

    await page.click('button:has-text("Continue")')

    await page.fill('input[name="password"]', testUsers.existingUser.password)

    await page.click('button:has-text("Continue")')

    // Then: User berhasil login dan redirect ke dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 })
    await verifyUserSession(page)

    await takeScreenshot(page, 'clerk-signin-success')
  })

  /**
   * Test: Sign In dengan Password Salah
   *
   * Skenario: User menggunakan email yang benar tapi password salah
   * Expected: Error message ditampilkan dan user tidak berhasil login
   *
   * BDD Format:
   * - Given: User memiliki email valid tapi password salah
   * - When: User mengisi email yang benar dan password salah
   * - Then: Error message ditampilkan dan user tidak berhasil login
   */
  test('should show error for invalid password', async ({ page }) => {
    // Given: User navigasi ke halaman sign-in

    await page.goto('/sign-in')
    await waitForPageLoad(page)

    // When: Fill form dengan password yang salah
    await page.fill('input[name="identifier"]', testUsers.existingUser.identifier)

    await page.fill('input[name="password"]', 'WrongPassword123!')

    await page.click('button:has-text("Continue")')

    // Then: Error message harus muncul
    const errorMessage = page.locator(
      '.cl-formFieldErrorText, [role="alert"], [data-testid*="error"]',
    )
    await expect(errorMessage).toBeVisible({ timeout: 10000 })

    // Verify masih di halaman sign-in
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 })

    await takeScreenshot(page, 'clerk-signin-invalid-password')
  })

  /**
   * Test: Sign In dengan Email Tidak Terdaftar
   *
   * Skenario: User menggunakan email yang tidak terdaftar di sistem
   * Expected: Error message ditampilkan dan user tidak berhasil login
   *
   * BDD Format:
   * - Given: User menggunakan email yang tidak terdaftar
   * - When: User mengisi email tidak terdaftar dan password, kemudian submit
   * - Then: Error message ditampilkan dan user tidak berhasil login
   */
  test('should show error for non-existent email', async ({ page }) => {
    // Given: User navigasi ke halaman sign-in

    await page.goto('/sign-in')
    await waitForPageLoad(page)

    // When: Fill form dengan email yang tidak terdaftar
    await page.fill('input[name="identifier"]', 'nonexistent@maguru.test')

    await page.fill('input[name="password"]', 'SomePassword123!')

    await page.click('button:has-text("Continue")')

    // Then: Error message harus muncul
    const errorMessage = page.locator(
      '.cl-formFieldErrorText, [role="alert"], [data-testid*="error"]',
    )
    await expect(errorMessage).toBeVisible({ timeout: 10000 })

    // Verify masih di halaman sign-in
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 })

    await takeScreenshot(page, 'clerk-signin-nonexistent-email')
  })

  /**
   * Test: Sign In Form UI Elements Display
   *
   * Skenario: User mengunjungi halaman sign in untuk melihat form elements
   * Expected: Form email/username, password, dan button continue terlihat
   *
   * BDD Format:
   * - Given: User navigasi ke halaman sign in
   * - When: Halaman sign in dimuat
   * - Then: Input identifier, password, dan button continue terlihat
   */
  test('should display sign in form elements correctly', async ({ page }) => {
    // Given: User navigasi ke halaman sign in

    await page.goto('/sign-in')
    await waitForPageLoad(page)

    // Then: Form elements harus terlihat
    await expect(page.locator('input[name="identifier"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button:has-text("Continue")')).toBeVisible()

    // Check for sign up link
    const signUpLink = page.locator('a').filter({ hasText: /sign.up/i })
    await expect(signUpLink).toBeVisible()

    await takeScreenshot(page, 'clerk-signin-form-ui')
  })

  /**
   * Test: Navigation dari Sign In ke Sign Up
   *
   * Skenario: User klik link "Sign up" dari halaman sign in
   * Expected: User diarahkan ke halaman sign up
   *
   * BDD Format:
   * - Given: User berada di halaman sign in
   * - When: User klik link "Sign up"
   * - Then: User diarahkan ke halaman sign up
   */
  test('should navigate to sign up from sign in page', async ({ page }) => {
    // Given: User berada di halaman sign in

    await page.goto('/sign-in')
    await waitForPageLoad(page)

    // When: User klik link sign up
    const signUpLink = page
      .locator('a')
      .filter({ hasText: /sign.up/i })
      .first()
    await signUpLink.click()

    // Then: User diarahkan ke halaman sign up
    await expect(page).toHaveURL('/sign-up', { timeout: 10000 })

    await takeScreenshot(page, 'clerk-signin-to-signup-nav')
  })

  /**
   * Test: Sign In pada Mobile Viewport
   *
   * Skenario: User melakukan sign in pada device mobile (viewport kecil)
   * Expected: Sign in flow bekerja dengan baik pada mobile viewport
   *
   * BDD Format:
   * - Given: User menggunakan mobile viewport (375x667 - iPhone SE)
   * - When: User melakukan sign in dengan form yang responsive
   * - Then: Sign in berhasil dan responsive pada mobile viewport
   */
  test('should work correctly on mobile viewport', async ({ page }) => {
    // Given: Mobile viewport

    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE size
    await page.goto('/sign-in')
    await waitForPageLoad(page)

    // When: Fill form dengan kredensial yang benar
    await page.fill('input[name="identifier"]', testUsers.existingUser.email)

    await page.click('button:has-text("Continue")')

    await page.fill('input[name="password"]', testUsers.existingUser.password)

    await page.click('button:has-text("Continue")')

    // Then: Sign in berhasil di mobile
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 })
    await verifyUserSession(page)

    await takeScreenshot(page, 'clerk-signin-mobile')
  })
})
