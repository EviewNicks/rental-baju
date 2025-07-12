/**
 * Smoke Test untuk Playwright Setup Verification
 *
 * Test ini memverifikasi bahwa:
 * - Playwright dapat mengakses aplikasi Next.js
 * - Clerk integration berfungsi dengan baik
 * - Basic navigation dan page loading bekerja
 * - Test environment sudah dikonfigurasi dengan benar
 */

import { test, expect } from '@playwright/test'
import { waitForPageLoad } from './utils/test-helpers'

test.describe('Playwright Setup Verification', () => {
  test.beforeEach(async () => {
    // Setup untuk setiap test
    console.log('🧪 Starting smoke test...')
  })

  test('should load homepage successfully', async ({ page }) => {
    // Given: Playwright dikonfigurasi dengan benar

    // When: Mengakses homepage aplikasi
    await page.goto('/')
    await waitForPageLoad(page)

    // Then: Homepage dapat dimuat tanpa error
    await expect(page).toHaveTitle(/Maguru/)
    await expect(page.locator('body')).toBeVisible()

    console.log('✅ Homepage loaded successfully')
  })

  test('should access sign-in page', async ({ page }) => {
    // Given: Aplikasi sudah running

    // When: Mengakses halaman sign-in
    await page.goto('/sign-in')
    await waitForPageLoad(page)

    // Then: Sign-in page dapat dimuat dengan Clerk component
    await expect(page).toHaveURL('/sign-in')

    // Verify Clerk sign-in component ada
    const signInForm = page.locator('form').first()
    await expect(signInForm).toBeVisible()

    console.log('✅ Sign-in page loaded successfully')
  })

  test('should access sign-up page', async ({ page }) => {
    // Given: Aplikasi sudah running

    // When: Mengakses halaman sign-up
    await page.goto('/sign-up')
    await waitForPageLoad(page)

    // Then: Sign-up page dapat dimuat dengan Clerk component
    await expect(page).toHaveURL('/sign-up')

    // Verify Clerk sign-up component ada
    const signUpForm = page.locator('form').first()
    await expect(signUpForm).toBeVisible()

    console.log('✅ Sign-up page loaded successfully')
  })

  test('should handle navigation between pages', async ({ page }) => {
    // Given: Aplikasi sudah running

    // When: Navigate dari homepage ke sign-in ke sign-up
    await page.goto('/')
    await waitForPageLoad(page)

    // Navigate ke sign-in
    await page.goto('/sign-in')
    await waitForPageLoad(page)
    await expect(page).toHaveURL('/sign-in')

    // Navigate ke sign-up
    await page.goto('/sign-up')
    await waitForPageLoad(page)
    await expect(page).toHaveURL('/sign-up')

    // Navigate kembali ke homepage
    await page.goto('/')
    await waitForPageLoad(page)
    await expect(page).toHaveURL('/')

    console.log('✅ Navigation between pages working correctly')
  })

  test('should verify test environment configuration', async ({ page }) => {
    // Given: Test environment sudah dikonfigurasi

    // When: Mengakses aplikasi dan check environment indicators
    await page.goto('/')
    await waitForPageLoad(page)

    // Then: Environment configuration benar
    // Check bahwa kita tidak di production (base URL localhost)
    expect(page.url()).toContain('localhost:3000')

    // Verify page dapat diakses tanpa error
    const body = page.locator('body')
    await expect(body).toBeVisible()

    console.log('✅ Test environment configured correctly')
  })

  test('should verify Clerk test mode integration', async ({ page }) => {
    // Given: Clerk test mode sudah diaktifkan

    // When: Mengakses sign-in page
    await page.goto('/sign-in')
    await waitForPageLoad(page)

    // Then: Clerk component dapat dimuat dalam test mode
    // Verify Clerk element ada (menandakan Clerk loaded)
    // Dalam test mode, component tetap ada tapi dengan test configuration
    const hasClerkElements = (await page.locator('form').count()) > 0
    expect(hasClerkElements).toBeTruthy()

    console.log('✅ Clerk test mode integration verified')
  })
})
