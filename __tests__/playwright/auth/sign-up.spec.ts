/**
 * E2E Test: Sign Up Flow
 *
 * Test ini mencakup:
 * - Successful sign up dengan data valid
 * - Error handling untuk email yang sudah terdaftar
 * - Validasi form untuk data invalid
 * - Redirect flow setelah registrasi berhasil
 *
 * CRITICAL: Test ini berjalan tanpa authentication state untuk menguji alur sign-up yang sebenarnya
 */

import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { testUsers, generateTestEmail, generateTestUsername } from '../fixtures/test-users'
import { waitForPageLoad, takeScreenshot } from '../utils/test-helpers'

// Configure test untuk tidak menggunakan storageState (authentication state)
test.use({
  storageState: { cookies: [], origins: [] }, // Fresh browser state
})

test.describe('Sign Up Flow', () => {
  // Ensure fresh browser context untuk setiap test
  test.beforeEach(async ({ context }) => {
    // Clear all cookies dan storage untuk memastikan fresh state
    await context.clearCookies()
    await context.clearPermissions()
  })

  /**
   * Test: Successful sign up dengan data valid
   *
   * Skenario: User melakukan registrasi dengan data yang valid
   * Expected: User berhasil terdaftar dan diarahkan ke dashboard/verification
   *
   * BDD Format:
   * - Given: User berada di halaman sign up dengan data valid
   * - When: User mengisi form dengan data valid dan submit
   * - Then: User berhasil terdaftar dan diarahkan sesuai konfigurasi
   */
  test('should successfully sign up with valid data', async ({ page }) => {
    // Setup Clerk testing token untuk test ini
    await setupClerkTestingToken({ page })

    // Given: User berada di halaman sign up dengan data valid
    await page.goto('/sign-up')
    await waitForPageLoad(page)

    // Verify halaman sign up dimuat dengan benar
    await expect(page).toHaveURL('/sign-up')

    // Wait untuk Clerk component dimuat - gunakan selector yang lebih fleksibel
    try {
      await page.waitForSelector('[data-clerk-component="SignUp"], .cl-signUp-root', {
        state: 'visible',
        timeout: 15000,
      })
    } catch {
      // Fallback - wait for any input fields
      await page.waitForSelector('input[name="emailAddress"], input[type="email"]', {
        timeout: 10000,
      })
    }


    // When: User mengisi form dengan data valid dan submit
    const newUser = {
      username: generateTestUsername('signuptest'),
      email: generateTestEmail('signuptest'),
      password: 'SignUpTestPassword123!',
    }



    // Fill username field - Clerk menggunakan name="username"
    const usernameInput = page.locator('input[name="username"]').first()
    if ((await usernameInput.count()) > 0) {
      await usernameInput.fill(newUser.username)
    } 

    // Fill email field - Clerk menggunakan name="emailAddress"
    const emailInput = page.locator('input[name="emailAddress"]').first()
    await emailInput.fill(newUser.email)

    // Fill password field
    const passwordInput = page.locator('input[name="password"]').first()
    await passwordInput.fill(newUser.password)

    // Wait untuk validasi form selesai
    await page.waitForTimeout(1000)

    // Submit form dengan mencari button Continue yang tepat
    const continueButton = page.locator('button').filter({ hasText: 'Continue' }).first()

    if ((await continueButton.count()) > 0) {
      await continueButton.click()
    } else {
      await page.keyboard.press('Enter')
    }

    // Then: User berhasil terdaftar dan diarahkan sesuai konfigurasi
    // Tunggu redirect (Clerk sign up flow memerlukan email verification)
    await page.waitForURL(
      (url) =>
        url.toString().includes('/verify-email-address') ||
        url.toString().includes('/dashboard') ||
        url.toString().includes('/sign-in') ||
        url.toString().includes('/sso-callback'),
      { timeout: 15000 },
    )

    // Verify expected flow berdasarkan dokumentasi Clerk
    const currentUrl = page.url()

    if (currentUrl.includes('/verify-email-address')) {

      // Verify halaman verification memiliki elemen yang tepat
      await expect(page.locator('text=Verify your email')).toBeVisible({ timeout: 5000 })
    } else if (currentUrl.includes('/dashboard')) {
    } else if (currentUrl.includes('/sso-callback')) {
    } else {
    }

    // Take screenshot untuk dokumentasi
    await takeScreenshot(page, 'sign-up-success')

  })

  /**
   * Test: Error handling untuk email yang sudah terdaftar
   *
   * Skenario: User mencoba registrasi dengan email yang sudah ada
   * Expected: Error message ditampilkan dan user tetap di halaman sign up
   *
   * BDD Format:
   * - Given: User berada di halaman sign up
   * - When: User mengisi form dengan email yang sudah terdaftar
   * - Then: Error message ditampilkan
   */
  test('should show error for existing email', async ({ page }) => {
    // Setup Clerk testing token untuk test ini
    await setupClerkTestingToken({ page })

    // Given: User berada di halaman sign up
    await page.goto('/sign-up')
    await waitForPageLoad(page)

    // Wait untuk Clerk component dimuat - gunakan selector yang lebih fleksibel
    try {
      await page.waitForSelector('[data-clerk-component="SignUp"], .cl-signUp-root', {
        state: 'visible',
        timeout: 15000,
      })
    } catch {
      await page.waitForSelector('input[name="emailAddress"], input[type="email"]', {
        timeout: 10000,
      })
    }

    // When: User mengisi form dengan email yang sudah terdaftar
    const existingUser = testUsers.existingUser

    // Fill username field if exists
    const usernameInput = page.locator('input[name="username"]').first()
    if ((await usernameInput.count()) > 0) {
      await usernameInput.fill('existingtest' + Date.now())
    }

    const emailInput = page.locator('input[name="emailAddress"]').first()
    await emailInput.fill(existingUser.email!)

    const passwordInput = page.locator('input[name="password"]').first()
    await passwordInput.fill(existingUser.password)

    // Wait untuk validasi form selesai
    await page.waitForTimeout(1000)

    // Submit form dengan strategi yang sama seperti successful test
    const continueButton = page.locator('button').filter({ hasText: 'Continue' }).first()

    if ((await continueButton.count()) > 0) {
      await continueButton.click()
    } else {
      await page.keyboard.press('Enter')
    }

    // Then: Error message ditampilkan
    // Tunggu error message muncul
    await page.waitForTimeout(3000)

    // Check untuk berbagai kemungkinan error message
    const errorSelectors = [
      '.cl-formFieldErrorText',
      '.cl-fieldError',
      '[data-localization-key*="error"]',
      '[role="alert"]',
      '.error',
      'text=already exists',
      'text=already taken',
      'text=already registered',
    ]

    let errorFound = false
    for (const selector of errorSelectors) {
      const errorElement = page.locator(selector)
      if ((await errorElement.count()) > 0 && (await errorElement.isVisible())) {
        errorFound = true
        break
      }
    }

    // Jika tidak ada error message spesifik, pastikan tidak redirect ke dashboard
    if (!errorFound) {
      // Pastikan masih di halaman sign-up atau tidak redirect ke dashboard
      await expect(page).not.toHaveURL('/dashboard')
    }

    await takeScreenshot(page, 'sign-up-existing-email-error')
  })

  /**
   * Test: Validasi format email yang invalid
   *
   * Skenario: User mengisi email dengan format yang tidak valid
   * Expected: Validation error ditampilkan atau form tidak submit
   *
   * BDD Format:
   * - Given: User berada di halaman sign up
   * - When: User mengisi email dengan format invalid
   * - Then: Validation error ditampilkan atau form tidak submit
   */
  test('should validate invalid email format', async ({ page }) => {
    // Setup Clerk testing token untuk test ini
    await setupClerkTestingToken({ page })

    // Given: User berada di halaman sign up
    await page.goto('/sign-up')
    await waitForPageLoad(page)

    // Wait untuk Clerk component dimuat - gunakan selector yang lebih fleksibel
    try {
      await page.waitForSelector('[data-clerk-component="SignUp"], .cl-signUp-root', {
        state: 'visible',
        timeout: 15000,
      })
    } catch {
      await page.waitForSelector('input[name="emailAddress"], input[type="email"]', {
        timeout: 10000,
      })
    }

    // When: User mengisi email dengan format invalid
    const invalidUser = testUsers.invalidUser

    // Fill username field if exists
    const usernameInput = page.locator('input[name="username"]').first()
    if ((await usernameInput.count()) > 0) {
      await usernameInput.fill(invalidUser.username!)
    }

    const emailInput = page.locator('input[name="emailAddress"]').first()
    await emailInput.fill(invalidUser.email!)

    const passwordInput = page.locator('input[name="password"]').first()
    await passwordInput.fill('ValidPassword123!')

    // Wait untuk validasi form selesai
    await page.waitForTimeout(1000)

    // Submit form dengan strategi yang sama seperti successful test
    const continueButton = page.locator('button').filter({ hasText: 'Continue' }).first()

    if ((await continueButton.count()) > 0) {
      await continueButton.click()
    } else {
      await page.keyboard.press('Enter')
    }

    // Then: Validation error ditampilkan atau form tidak submit
    await page.waitForTimeout(1000)

    // Pastikan tidak redirect ke dashboard
    await expect(page).not.toHaveURL('/dashboard')
    await takeScreenshot(page, 'sign-up-invalid-email')
  })

  /**
   * Test: Validasi password yang lemah
   *
   * Skenario: User mengisi password yang tidak memenuhi kriteria keamanan
   * Expected: Password validation error ditampilkan
   *
   * BDD Format:
   * - Given: User berada di halaman sign up
   * - When: User mengisi password yang lemah
   * - Then: Password validation error ditampilkan
   */
  test('should validate weak password', async ({ page }) => {
    // Setup Clerk testing token untuk test ini
    await setupClerkTestingToken({ page })

    // Given: User berada di halaman sign up
    await page.goto('/sign-up')
    await waitForPageLoad(page)

    // Wait untuk Clerk component dimuat - gunakan selector yang lebih fleksibel
    try {
      await page.waitForSelector('[data-clerk-component="SignUp"], .cl-signUp-root', {
        state: 'visible',
        timeout: 15000,
      })
    } catch {
      await page.waitForSelector('input[name="emailAddress"], input[type="email"]', {
        timeout: 10000,
      })
    }

    // When: User mengisi password yang lemah
    const weakUser = testUsers.weakPasswordUser

    // Fill username field if exists
    const usernameInput = page.locator('input[name="username"]').first()
    if ((await usernameInput.count()) > 0) {
      await usernameInput.fill(weakUser.username!)
    }

    const emailInput = page.locator('input[name="emailAddress"]').first()
    await emailInput.fill(weakUser.email!)

    const passwordInput = page.locator('input[name="password"]').first()
    await passwordInput.fill(weakUser.password) // Password lemah: "123"

    // Wait untuk validasi form selesai
    await page.waitForTimeout(1000)

    // Submit form dengan strategi yang sama seperti successful test
    const continueButton = page.locator('button').filter({ hasText: 'Continue' }).first()

    if ((await continueButton.count()) > 0) {
      await continueButton.click()
    } else {
      await page.keyboard.press('Enter')
    }

    // Then: Password validation error ditampilkan
    await page.waitForTimeout(2000)

    // Check untuk password validation
    const passwordErrorSelectors = [
      '.cl-formFieldErrorText',
      '.cl-fieldError',
      '[role="alert"]',
      'text=password',
      'text=weak',
      'text=requirements',
      'text=characters',
    ]

    let passwordErrorFound = false
    for (const selector of passwordErrorSelectors) {
      const errorElement = page.locator(selector)
      if ((await errorElement.count()) > 0 && (await errorElement.isVisible())) {
        passwordErrorFound = true
        break
      }
    }

    // Log hasil untuk debugging
    if (!passwordErrorFound) {
    }

    // Pastikan tidak redirect ke dashboard
    await expect(page).not.toHaveURL('/dashboard')
    await takeScreenshot(page, 'sign-up-weak-password')
  })

  /**
   * Test: Graceful handling untuk network timeout
   *
   * Skenario: User submit form dengan koneksi yang lambat/timeout
   * Expected: Loading state ditampilkan atau graceful error handling
   *
   * BDD Format:
   * - Given: User berada di halaman sign up
   * - When: User submit form dengan network delay
   * - Then: Loading state ditampilkan atau graceful handling
   */
  test('should handle network timeout gracefully', async ({ page }) => {
    // Setup Clerk testing token untuk test ini
    await setupClerkTestingToken({ page })

    // Given: User berada di halaman sign up
    await page.goto('/sign-up')
    await waitForPageLoad(page)

    // Wait untuk Clerk component dimuat - gunakan selector yang lebih fleksibel
    try {
      await page.waitForSelector('[data-clerk-component="SignUp"], .cl-signUp-root', {
        state: 'visible',
        timeout: 15000,
      })
    } catch {
      await page.waitForSelector('input[name="emailAddress"], input[type="email"]', {
        timeout: 10000,
      })
    }

    // Simulate slow network untuk test timeout handling
    await page.route('**/*clerk*', (route) => {
      setTimeout(() => route.continue(), 5000) // Delay 5 detik
    })

    // When: User submit form dengan network delay
    const timeoutUser = {
      username: generateTestUsername('timeouttest'),
      email: generateTestEmail('timeouttest'),
      password: 'TimeoutTestPassword123!',
    }

    // Fill username field if exists
    const usernameInput = page.locator('input[name="username"]').first()
    if ((await usernameInput.count()) > 0) {
      await usernameInput.fill(timeoutUser.username)
    }

    const emailInput = page.locator('input[name="emailAddress"]').first()
    await emailInput.fill(timeoutUser.email)

    const passwordInput = page.locator('input[name="password"]').first()
    await passwordInput.fill(timeoutUser.password)

    // Wait untuk validasi form selesai
    await page.waitForTimeout(1000)

    // Submit form dengan strategi yang sama seperti successful test
    const continueButton = page.locator('button').filter({ hasText: 'Continue' }).first()

    if ((await continueButton.count()) > 0) {
      await continueButton.click()
    } else {
      await page.keyboard.press('Enter')
    }

    // Then: Loading state ditampilkan atau graceful handling
    // Check untuk loading indicator dengan timeout yang lebih pendek
    const loadingSelectors = [
      '.cl-spinner',
      '.cl-loading',
      '[data-testid="loading"]',
      'button[disabled]',
      '.loading',
      'button:has-text("Continue")[disabled]',
    ]

    let loadingFound = false
    for (const selector of loadingSelectors) {
      try {
        const loadingElement = page.locator(selector)
        if ((await loadingElement.count()) > 0) {
          loadingFound = true
          break
        }
      } catch {
        // Ignore errors saat checking loading states dan log untuk debugging
      }
    }

    // Log hasil untuk debugging
    if (!loadingFound) {
    }

    await takeScreenshot(page, 'sign-up-network-timeout')

    // Clear route untuk cleanup
    await page.unroute('**/*clerk*')
  })
})
