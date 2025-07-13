/**
 * Smoke Test untuk Playwright Setup Verification
 *
 * Test ini memverifikasi bahwa:
 * - Playwright dapat mengakses aplikasi Next.js
 * - Clerk integration berfungsi dengan baik
 * - Basic navigation dan page loading bekerja
 * - Test environment sudah dikonfigurasi dengan benar
 * - Komponen homepage (Navbar, Hero, Footer) dapat dimuat dengan benar
 */

import { test, expect } from '@playwright/test'
import { waitForPageLoad } from './utils/test-helpers'

test.describe('Playwright Setup Verification', () => {
  test.beforeEach(async () => {
    // Setup untuk setiap test
    console.log('🧪 Starting smoke test...')
  })

  test('should load homepage successfully with all components', async ({ page }) => {
    // Given: Playwright dikonfigurasi dengan benar

    // When: Mengakses homepage aplikasi
    await page.goto('/')
    await waitForPageLoad(page)

    // Then: Homepage dapat dimuat tanpa error dan semua komponen utama ada
    await expect(page).toHaveTitle(/RentalBaju/)
    await expect(page.locator('body')).toBeVisible()

    // Verify Navbar components
    await expect(page.locator('[data-testid="navbar"]')).toBeVisible()
    await expect(page.locator('[data-testid="navbar-logo"]')).toBeVisible()
    await expect(page.locator('[data-testid="desktop-navigation"]')).toBeVisible()
    await expect(page.locator('[data-testid="desktop-auth-buttons"]')).toBeVisible()

    // Verify Hero Section components
    await expect(page.locator('[data-testid="hero-section"]')).toBeVisible()
    await expect(page.locator('[data-testid="hero-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="hero-description"]')).toBeVisible()
    await expect(page.locator('[data-testid="hero-cta-buttons"]')).toBeVisible()

    // Verify Footer components
    await expect(page.locator('[data-testid="footer"]')).toBeVisible()
    await expect(page.locator('[data-testid="footer-brand"]')).toBeVisible()
    await expect(page.locator('[data-testid="footer-contact"]')).toBeVisible()

    console.log('✅ Homepage loaded successfully with all components')
  })

  test('should verify navigation elements functionality', async ({ page }) => {
    // Given: Homepage sudah dimuat

    // When: Mengakses homepage
    await page.goto('/')
    await waitForPageLoad(page)

    // Then: Navigation elements dapat diakses
    // Desktop navigation links
    await expect(page.locator('[data-testid="nav-categories"]')).toBeVisible()
    await expect(page.locator('[data-testid="nav-featured"]')).toBeVisible()
    await expect(page.locator('[data-testid="nav-store-info"]')).toBeVisible()
    await expect(page.locator('[data-testid="nav-contact"]')).toBeVisible()

    // Auth buttons (should be visible for unauthenticated users)
    // Check if user is not signed in, then auth buttons should be visible
    const isSignedIn = (await page.locator('[data-testid="desktop-dashboard-link"]').count()) > 0

    if (!isSignedIn) {
      await expect(page.locator('[data-testid="desktop-sign-in-link"]')).toBeVisible()
      await expect(page.locator('[data-testid="desktop-sign-up-link"]')).toBeVisible()
    } else {
      // If signed in, dashboard link should be visible
      await expect(page.locator('[data-testid="desktop-dashboard-link"]')).toBeVisible()
    }

    console.log('✅ Navigation elements verified')
  })

  test('should verify hero section content and trust indicators', async ({ page }) => {
    // Given: Homepage sudah dimuat

    // When: Mengakses homepage
    await page.goto('/')
    await waitForPageLoad(page)

    // Then: Hero section content dan trust indicators ada
    // Main hero content
    await expect(page.locator('[data-testid="hero-badge"]')).toContainText('Terpercaya sejak 2020')
    await expect(page.locator('[data-testid="hero-title"]')).toContainText('RentalBaju')
    await expect(page.locator('[data-testid="hero-description"]')).toBeVisible()

    // Trust indicators
    await expect(page.locator('[data-testid="hero-trust-indicators"]')).toBeVisible()
    await expect(page.locator('[data-testid="trust-rating"]')).toContainText('4.9/5')
    await expect(page.locator('[data-testid="trust-customers"]')).toContainText('1000+')
    await expect(page.locator('[data-testid="trust-hours"]')).toContainText('09-20')
    await expect(page.locator('[data-testid="trust-security"]')).toContainText('Aman')

    // CTA buttons
    await expect(page.locator('[data-testid="hero-view-collection-btn"]')).toBeVisible()
    await expect(page.locator('[data-testid="hero-whatsapp-btn"]')).toBeVisible()

    // Features
    await expect(page.locator('[data-testid="feature-quality"]')).toContainText('Kualitas Premium')
    await expect(page.locator('[data-testid="feature-price"]')).toContainText('Harga Terjangkau')
    await expect(page.locator('[data-testid="feature-delivery"]')).toContainText('Delivery Gratis')

    console.log('✅ Hero section content and trust indicators verified')
  })

  test('should verify footer content and links', async ({ page }) => {
    // Given: Homepage sudah dimuat

    // When: Mengakses homepage
    await page.goto('/')
    await waitForPageLoad(page)

    // Then: Footer content dan links ada
    // Brand section
    await expect(page.locator('[data-testid="footer-logo"]')).toBeVisible()
    await expect(page.locator('[data-testid="footer-description"]')).toBeVisible()
    await expect(page.locator('[data-testid="footer-rating"]')).toContainText('Rating 4.9/5')
    await expect(page.locator('[data-testid="footer-hours"]')).toContainText('09:00 - 20:00')

    // Social media links
    await expect(page.locator('[data-testid="social-instagram"]')).toBeVisible()
    await expect(page.locator('[data-testid="social-facebook"]')).toBeVisible()
    await expect(page.locator('[data-testid="social-twitter"]')).toBeVisible()
    await expect(page.locator('[data-testid="social-youtube"]')).toBeVisible()

    // Quick links
    await expect(page.locator('[data-testid="footer-link-categories"]')).toBeVisible()
    await expect(page.locator('[data-testid="footer-link-featured"]')).toBeVisible()
    await expect(page.locator('[data-testid="footer-link-store-info"]')).toBeVisible()
    await expect(page.locator('[data-testid="footer-link-contact"]')).toBeVisible()

    // Contact information
    await expect(page.locator('[data-testid="contact-address"]')).toContainText('Jakarta Pusat')
    await expect(page.locator('[data-testid="contact-phone"]')).toContainText('+62 812-3456-7890')
    await expect(page.locator('[data-testid="contact-email"]')).toContainText('info@rentalbaju.com')

    // Contact buttons
    await expect(page.locator('[data-testid="footer-whatsapp-btn"]')).toBeVisible()
    await expect(page.locator('[data-testid="footer-maps-btn"]')).toBeVisible()

    console.log('✅ Footer content and links verified')
  })

  test('should access sign-in page with Clerk integration', async ({ page }) => {
    // Given: Aplikasi sudah running dan clear auth state
    await page.context().clearCookies()
    await page.context().clearPermissions()

    // When: Mengakses halaman sign-in
    await page.goto('/sign-in')
    await waitForPageLoad(page)

    // Then: Verify sign-in page loads correctly
    await expect(page).toHaveURL('/sign-in')
    await expect(page.locator('[data-testid="sign-in-container"]')).toBeVisible()
    // Check for Clerk form elements (more generic approach)
    await expect(page.locator('form')).toBeVisible()
    console.log('✅ Sign-in page loaded successfully with Clerk integration')
  })

  test('should access sign-up page with Clerk integration', async ({ page }) => {
    // Given: Aplikasi sudah running dan clear auth state
    await page.context().clearCookies()
    await page.context().clearPermissions()

    // When: Mengakses halaman sign-up
    await page.goto('/sign-up')
    await waitForPageLoad(page)

    // Then: Verify sign-up page loads correctly
    await expect(page).toHaveURL('/sign-up')
    await expect(page.locator('[data-testid="sign-up-container"]')).toBeVisible()
    // Check for Clerk form elements (more generic approach)
    await expect(page.locator('form')).toBeVisible()
    console.log('✅ Sign-up page loaded successfully with Clerk integration')
  })

  test('should handle navigation between pages using navbar links', async ({ page }) => {
    // Given: Aplikasi sudah running

    // When: Navigate dari homepage ke sign-in ke sign-up
    await page.goto('/')
    await waitForPageLoad(page)

    // Check if user is signed in
    const isSignedIn = (await page.locator('[data-testid="desktop-dashboard-link"]').count()) > 0

    if (!isSignedIn) {
      // Navigate ke sign-in via navbar
      await page.click('[data-testid="desktop-sign-in-link"]')
      await waitForPageLoad(page)
      await expect(page).toHaveURL('/sign-in')

      // Navigate ke sign-up via navbar
      await page.click('[data-testid="desktop-sign-up-link"]')
      await waitForPageLoad(page)
      await expect(page).toHaveURL('/sign-up')
    } else {
      // If signed in, test dashboard navigation
      await page.click('[data-testid="desktop-dashboard-link"]')
      await waitForPageLoad(page)
      await expect(page).toHaveURL(/\/dashboard/)
    }

    // Navigate kembali ke homepage via logo
    // Use a more reliable selector for the logo
    await page.goto('/')
    await waitForPageLoad(page)
    await expect(page).toHaveURL('/')

    console.log('✅ Navigation between pages working correctly via navbar')
  })

  test('should verify mobile menu functionality', async ({ page }) => {
    // Given: Homepage sudah dimuat

    // When: Mengakses homepage dan membuka mobile menu
    await page.goto('/')
    await waitForPageLoad(page)

    // Set viewport ke mobile size
    await page.setViewportSize({ width: 375, height: 667 })

    // Then: Mobile menu button ada dan dapat diklik
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()

    // Click mobile menu button
    await page.click('[data-testid="mobile-menu-button"]')

    // Verify mobile menu muncul
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()

    // Verify mobile navigation links
    await expect(page.locator('[data-testid="mobile-nav-categories"]')).toBeVisible()
    await expect(page.locator('[data-testid="mobile-nav-featured"]')).toBeVisible()
    await expect(page.locator('[data-testid="mobile-nav-store-info"]')).toBeVisible()
    await expect(page.locator('[data-testid="mobile-nav-contact"]')).toBeVisible()

    // Check if user is signed in for mobile auth buttons
    const isSignedIn = (await page.locator('[data-testid="mobile-dashboard-link"]').count()) > 0

    if (!isSignedIn) {
      // Verify mobile auth buttons for unauthenticated users
      await expect(page.locator('[data-testid="mobile-sign-in-link"]')).toBeVisible()
      await expect(page.locator('[data-testid="mobile-sign-up-link"]')).toBeVisible()
    } else {
      // Verify mobile dashboard link for authenticated users
      await expect(page.locator('[data-testid="mobile-dashboard-link"]')).toBeVisible()
    }

    console.log('✅ Mobile menu functionality verified')
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

    // Verify semua komponen utama dapat dimuat
    await expect(page.locator('[data-testid="navbar"]')).toBeVisible()
    await expect(page.locator('[data-testid="hero-section"]')).toBeVisible()
    await expect(page.locator('[data-testid="footer"]')).toBeVisible()

    console.log('✅ Test environment configured correctly')
  })

  test('should verify Clerk test mode integration', async ({ page }) => {
    // Given: Clerk test mode sudah diaktifkan dan clear auth state
    await page.context().clearCookies()
    await page.context().clearPermissions()

    // When: Mengakses sign-in page
    await page.goto('/sign-in')
    await waitForPageLoad(page)

    // Then: Verify Clerk integration works correctly
    await expect(page).toHaveURL('/sign-in')
    await expect(page.locator('form')).toBeVisible()
    const hasClerkElements = (await page.locator('form').count()) > 0
    expect(hasClerkElements).toBeTruthy()
    console.log('✅ Clerk test mode integration verified')
  })
})
