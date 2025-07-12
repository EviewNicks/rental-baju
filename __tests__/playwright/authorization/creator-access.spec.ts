/**
 * E2E Test: Creator Access Verification
 *
 * Test ini memvalidasi bahwa creator users memiliki akses yang tepat sesuai
 * dengan role hierarchy: dapat akses creator dan user areas, diblokir dari admin areas.
 *
 * Test Scenarios:
 * 1. Creator Allowed Access - Creator dapat akses creator dan user routes
 * 2. Creator Restricted Access - Creator diblokir dari admin routes
 * 3. Creator UI Elements - Creator-specific UI elements tersedia
 * 4. Creator Authorization Flow - Complete authorization workflow
 *
 * Referensi:
 * - Task TSK-40: Menulis Test Case untuk Otorisasi Berbasis Peran
 * - Task TSK-15: Role-Based Access Control Implementation
 * - https://clerk.com/docs/testing/playwright/overview
 * - https://clerk.com/docs/testing/playwright/test-authenticated-flows
 */

import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { RoleTestUser, validateRoleTestEnvironment } from '../fixtures/role-test-users'
import {
  loginWithRole,
  testAllowedRoutesForRole,
  testRestrictedRoutesForRole,
  verifyRoleBasedUI,
  testRolePersistence,
  testDirectUrlAccess,
  verifyUnauthorizedPageFunctionality,
  logoutFromRoleSession,
} from '../utils/role-test-helpers'
import { waitForPageLoad, takeScreenshot } from '../utils/test-helpers'

// Validate role test environment sebelum menjalankan tests
test.beforeAll(async () => {
  const { missingVars, availableRoles } = validateRoleTestEnvironment()

  if (!availableRoles.includes('creator')) {
    throw new Error(
      `Creator role not available. Missing environment variables: ${missingVars.join(', ')}`,
    )
  }
})

test.describe('Creator Access Verification', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let creatorUser: RoleTestUser

  test.beforeEach(async ({ page }) => {
    // Setup Clerk testing token untuk setiap test
    await setupClerkTestingToken({ page })

    // Clear browser state untuk fresh session
    await page.context().clearCookies()
    await page.context().clearPermissions()
  })

  test.afterEach(async ({ page }) => {
    // Cleanup setelah setiap test
    await logoutFromRoleSession(page)
  })

  /**
   * Test: Creator Allowed Access Verification
   *
   * Skenario: Creator user mengakses creator dan user routes yang diizinkan
   * Expected: Creator dapat mengakses creator dan user routes dengan sukses
   *
   * BDD Format:
   * - Given: User login sebagai creator dengan role creator di Clerk
   * - When: Creator mencoba mengakses creator dan user routes
   * - Then: Creator berhasil mengakses routes yang diizinkan
   */
  test('should allow creator access to creator and user routes', async ({ page }) => {
    // Given: Creator user login

    creatorUser = await loginWithRole(page, 'creator')
    await waitForPageLoad(page)

    // When & Then: Test semua allowed routes untuk creator
    await testAllowedRoutesForRole(page, 'creator')
    await takeScreenshot(page, 'creator-allowed-access-verified')
  })

  /**
   * Test: Creator Restricted Access Verification
   *
   * Skenario: Creator user mencoba mengakses admin routes yang dilarang
   * Expected: Creator diblokir dari admin routes dan diarahkan ke unauthorized page
   *
   * BDD Format:
   * - Given: Creator user sudah login dengan role creator
   * - When: Creator mencoba mengakses admin routes
   * - Then: Creator diarahkan ke unauthorized page dengan error message
   */
  test('should block creator access to admin routes', async ({ page }) => {
    // Given: Creator user login

    creatorUser = await loginWithRole(page, 'creator')
    await waitForPageLoad(page)

    // When & Then: Test semua restricted routes untuk creator
    await testRestrictedRoutesForRole(page, 'creator')
    await takeScreenshot(page, 'creator-restricted-access-verified')
  })

  /**
   * Test: Creator UI Elements Verification
   *
   * Skenario: Creator user melihat creator-specific UI elements di dashboard
   * Expected: Creator menu items tersedia, admin menu items tidak terlihat
   *
   * BDD Format:
   * - Given: Creator user sudah login dan berada di dashboard
   * - When: Creator melihat navigation menu dan UI elements
   * - Then: Creator-specific menu items tersedia, admin elements tidak terlihat
   */
  test('should display creator-specific UI elements and hide admin elements', async ({ page }) => {
    // Given: Creator user login dan navigate ke dashboard

    creatorUser = await loginWithRole(page, 'creator')

    // When & Then: Verify role-based UI untuk creator
    await verifyRoleBasedUI(page, 'creator', '/creator')

    // Additional creator-specific checks
    await page.goto('/creator')
    await waitForPageLoad(page)

    // Verify creator area tersedia
    await expect(page.locator('main, [role="main"]')).toBeVisible()
    await expect(page).not.toHaveURL('/unauthorized')
    await takeScreenshot(page, 'creator-ui-elements-verified')
  })

  /**
   * Test: Creator Dashboard Access
   *
   * Skenario: Creator mengakses creator dashboard dan creator features
   * Expected: Creator dashboard berfungsi dengan benar
   *
   * BDD Format:
   * - Given: Creator user sudah login
   * - When: Creator mengakses creator dashboard
   * - Then: Creator dashboard berfungsi dengan benar tanpa error
   */
  test('should access creator dashboard with appropriate functionality', async ({ page }) => {
    // Given: Creator user login

    creatorUser = await loginWithRole(page, 'creator')

    // When: Navigate ke creator dashboard
    await page.goto('/creator/dashboard')
    await waitForPageLoad(page)

    // Then: Verify creator dashboard accessibility
    await expect(page).toHaveURL('/creator/dashboard')
    await expect(page.locator('main, [role="main"], body')).toBeVisible()

    // Verify tidak ada error atau unauthorized access
    await expect(page).not.toHaveURL('/unauthorized')
    await expect(page).not.toHaveURL('/sign-in')
    await takeScreenshot(page, 'creator-dashboard-access')
  })

  /**
   * Test: Creator Admin Route Block Testing
   *
   * Skenario: Creator mencoba mengakses admin routes via direct URL
   * Expected: Creator diblokir dan diarahkan ke unauthorized page
   *
   * BDD Format:
   * - Given: Creator user sudah login
   * - When: Creator mencoba akses admin routes via direct URL
   * - Then: Creator diblokir dan melihat unauthorized page yang appropriate
   */
  test('should block creator from accessing admin routes via direct URL', async ({ page }) => {
    // Given: Creator user login

    creatorUser = await loginWithRole(page, 'creator')

    // When & Then: Test direct access ke admin routes
    const adminRoutes = ['/admin', '/admin/dashboard']

    for (const route of adminRoutes) {
      await testDirectUrlAccess(page, 'creator', route)
    }

    await takeScreenshot(page, 'creator-admin-route-blocking')
  })

  /**
   * Test: Creator Unauthorized Page Functionality
   *
   * Skenario: Creator mengakses admin route dan melihat unauthorized page
   * Expected: Unauthorized page menampilkan appropriate message dan navigation options
   *
   * BDD Format:
   * - Given: Creator user sudah login
   * - When: Creator mengakses admin route dan diarahkan ke unauthorized page
   * - Then: Unauthorized page berfungsi dengan benar dengan creator-specific messaging
   */
  test('should display appropriate unauthorized page for creator', async ({ page }) => {
    // Given: Creator user login

    creatorUser = await loginWithRole(page, 'creator')

    // When & Then: Verify unauthorized page functionality
    await verifyUnauthorizedPageFunctionality(page, 'creator', '/admin')

    await takeScreenshot(page, 'creator-unauthorized-page')
  })

  /**
   * Test: Creator Role Persistence
   *
   * Skenario: Creator role permissions tetap konsisten across navigation
   * Expected: Creator permissions tetap stabil during extended usage
   *
   * BDD Format:
   * - Given: Creator user sudah login dengan session aktif
   * - When: Creator navigate antar allowed pages dan refresh
   * - Then: Creator role permissions tetap konsisten
   */
  test('should maintain creator role persistence across navigation', async ({ page }) => {
    // Given: Creator user login

    creatorUser = await loginWithRole(page, 'creator')

    // When & Then: Test role persistence
    await testRolePersistence(page, 'creator')

    await takeScreenshot(page, 'creator-role-persistence')
  })

  /**
   * Test: Creator Navigation Between Allowed Areas
   *
   * Skenario: Creator navigate antara creator dan user areas yang diizinkan
   * Expected: Navigation berhasil tanpa permission errors
   *
   * BDD Format:
   * - Given: Creator user sudah login
   * - When: Creator navigate antara creator dan user areas
   * - Then: Navigation berhasil untuk allowed areas
   */
  test('should navigate seamlessly between allowed areas', async ({ page }) => {
    // Given: Creator user login

    creatorUser = await loginWithRole(page, 'creator')

    // When: Navigate between allowed areas
    const allowedAreas = [
      { path: '/creator', name: 'Creator Area' },
      { path: '/dashboard', name: 'General Dashboard' },
    ]

    for (const area of allowedAreas) {
      await page.goto(area.path)
      await waitForPageLoad(page)

      // Then: Verify successful access
      await expect(page).toHaveURL(area.path)
      await expect(page).not.toHaveURL('/unauthorized')
      await expect(page.locator('main, [role="main"]')).toBeVisible()
    }

    await takeScreenshot(page, 'creator-allowed-navigation')
  })

  /**
   * Test: Creator Session Boundary Testing
   *
   * Skenario: Creator session ditest pada boundary cases dengan admin access attempts
   * Expected: Session tetap stabil dengan consistent blocking untuk admin routes
   *
   * BDD Format:
   * - Given: Creator user dengan active session
   * - When: Creator repeatedly tries admin access dengan different methods
   * - Then: Blocking tetap konsisten tanpa session corruption
   */
  test('should consistently block admin access without session corruption', async ({ page }) => {
    // Given: Creator user login

    creatorUser = await loginWithRole(page, 'creator')

    // When: Multiple admin access attempts
    const adminAccessAttempts = ['/admin', '/admin/dashboard', '/admin/settings']

    for (const route of adminAccessAttempts) {
      await page.goto(route)
      await waitForPageLoad(page)

      // Then: Should be blocked consistently
      await expect(page).toHaveURL('/unauthorized')

      // Navigate back to allowed area to test session stability
      await page.goto('/creator')
      await waitForPageLoad(page)
      await expect(page).toHaveURL('/creator')
      await expect(page).not.toHaveURL('/sign-in')
    }

    await takeScreenshot(page, 'creator-session-boundary')
  })
})
