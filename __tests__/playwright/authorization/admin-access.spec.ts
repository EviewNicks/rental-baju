/**
 * E2E Test: Admin Access Verification
 *
 * Test ini memvalidasi bahwa admin users memiliki akses penuh ke semua areas
 * dalam aplikasi sesuai dengan role hierarchy yang telah diimplementasikan.
 *
 * Test Scenarios:
 * 1. Admin Full Access Verification - Admin dapat mengakses semua routes
 * 2. Admin UI Elements Verification - Admin-specific UI elements tersedia
 * 3. Admin Role Persistence - Role permissions konsisten across sessions
 * 4. Admin Dashboard Functionality - Admin dashboard berfungsi dengan benar
 *
 * Referensi:
 * - Task TSK-40: Menulis Test Case untuk Otorisasi Berbasis Peran
 * - Task TSK-15: Role-Based Access Control Implementation
 * - https://clerk.com/docs/testing/playwright/overview
 * - https://clerk.com/docs/testing/playwright/test-authenticated-flows
 */

import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { validateRoleTestEnvironment, RoleTestUser } from '../fixtures/role-test-users'
import {
  loginWithRole,
  testAllowedRoutesForRole,
  verifyRoleBasedUI,
  testRolePersistence,
  testDirectUrlAccess,
  logoutFromRoleSession,
} from '../utils/role-test-helpers'
import { waitForPageLoad, takeScreenshot } from '../utils/test-helpers'

// Validate role test environment sebelum menjalankan tests
test.beforeAll(async () => {
  const { missingVars, availableRoles } = validateRoleTestEnvironment()

  if (!availableRoles.includes('admin')) {
    throw new Error(
      `Admin role not available. Missing environment variables: ${missingVars.join(', ')}`,
    )
  }
})

test.describe('Admin Access Verification', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let adminUser: RoleTestUser

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
   * Test: Admin Full Access Verification
   *
   * Skenario: Admin user login dan mengakses semua available routes
   * Expected: Admin dapat mengakses semua routes tanpa restriction
   *
   * BDD Format:
   * - Given: User login sebagai admin dengan role admin di Clerk
   * - When: Admin mencoba mengakses berbagai routes (admin, creator, user)
   * - Then: Admin berhasil mengakses semua routes tanpa error
   */
  test('should allow admin full access to all routes', async ({ page }) => {
    // Given: Admin user login

    adminUser = await loginWithRole(page, 'admin')
    await waitForPageLoad(page)

    // When & Then: Test semua allowed routes untuk admin
    await testAllowedRoutesForRole(page, 'admin')
    await takeScreenshot(page, 'admin-full-access-verified')
  })

  /**
   * Test: Admin UI Elements Verification
   *
   * Skenario: Admin user mengakses dashboard dan melihat admin-specific elements
   * Expected: Admin dashboard menampilkan admin menu items dan features
   *
   * BDD Format:
   * - Given: Admin user sudah login dan berada di dashboard
   * - When: Admin melihat navigation menu dan UI elements
   * - Then: Admin-specific menu items dan features tersedia
   */
  test('should display admin-specific UI elements and menu items', async ({ page }) => {
    // Given: Admin user login dan navigate ke dashboard

    adminUser = await loginWithRole(page, 'admin')

    // When & Then: Verify role-based UI untuk admin
    await verifyRoleBasedUI(page, 'admin', '/dashboard')

    // Additional admin-specific checks
    await page.goto('/admin')
    await waitForPageLoad(page)

    // Verify admin area tersedia
    await expect(page.locator('main')).toBeVisible()
    await expect(page).not.toHaveURL('/unauthorized')

    await takeScreenshot(page, 'admin-ui-elements-verified')
  })

  /**
   * Test: Admin Dashboard Access
   *
   * Skenario: Admin mengakses admin dashboard dan semua admin features
   * Expected: Admin dashboard berfungsi dengan benar dan menampilkan admin tools
   *
   * BDD Format:
   * - Given: Admin user sudah login
   * - When: Admin mengakses admin dashboard dan features
   * - Then: Admin dashboard berfungsi dengan benar tanpa error
   */
  test('should access admin dashboard with full functionality', async ({ page }) => {
    // Given: Admin user login

    adminUser = await loginWithRole(page, 'admin')

    // When: Navigate ke admin dashboard
    await page.goto('/admin/dashboard')
    await waitForPageLoad(page)

    // Then: Verify admin dashboard accessibility
    await expect(page).toHaveURL('/admin/dashboard')
    await expect(page.locator('main, [role="main"], body')).toBeVisible()

    // Verify tidak ada error atau unauthorized access
    await expect(page).not.toHaveURL('/unauthorized')
    await expect(page).not.toHaveURL('/sign-in')

    await takeScreenshot(page, 'admin-dashboard-access')
  })

  /**
   * Test: Admin Role Persistence Across Sessions
   *
   * Skenario: Admin role permissions tetap konsisten saat navigasi dan refresh
   * Expected: Admin permissions tetap aktif across page navigation dan refresh
   *
   * BDD Format:
   * - Given: Admin user sudah login dengan session aktif
   * - When: Admin navigate antar pages dan refresh browser
   * - Then: Admin role permissions tetap konsisten
   */
  test('should maintain admin role persistence across navigation', async ({ page }) => {
    // Given: Admin user login

    adminUser = await loginWithRole(page, 'admin')

    // When & Then: Test role persistence
    await testRolePersistence(page, 'admin')

    await takeScreenshot(page, 'admin-role-persistence')
  })

  /**
   * Test: Admin Direct URL Access
   *
   * Skenario: Admin mengakses routes langsung via URL tanpa navigation
   * Expected: Admin dapat akses semua routes via direct URL
   *
   * BDD Format:
   * - Given: Admin user sudah login
   * - When: Admin mengakses restricted routes via direct URL
   * - Then: Admin dapat akses semua routes tanpa restriction
   */
  test('should allow admin direct URL access to all protected routes', async ({ page }) => {
    // Given: Admin user login

    adminUser = await loginWithRole(page, 'admin')

    // When & Then: Test direct access ke berbagai routes
    const testRoutes = [
      '/admin',
      '/creator',
      '/dashboard', // User dashboard yang dapat diakses admin
    ]

    for (const route of testRoutes) {
      await testDirectUrlAccess(page, 'admin', route)
    }

    await takeScreenshot(page, 'admin-direct-url-access')
  })

  /**
   * Test: Admin Cross-Area Navigation
   *
   * Skenario: Admin navigate seamlessly antara admin, creator, dan user areas
   * Expected: Admin dapat navigate lancar tanpa permission errors
   *
   * BDD Format:
   * - Given: Admin user sudah login
   * - When: Admin navigate antara different role areas
   * - Then: Navigation berhasil tanpa permission restrictions
   */
  test('should navigate seamlessly across all role areas', async ({ page }) => {
    // Given: Admin user login

    adminUser = await loginWithRole(page, 'admin')

    // When: Navigate across different areas
    const areas = [
      { path: '/admin', name: 'Admin Area' },
      { path: '/creator', name: 'Creator Area' },
      { path: '/dashboard', name: 'User Dashboard (General)' },
    ]

    for (const area of areas) {

      await page.goto(area.path)
      await waitForPageLoad(page)

      // Then: Verify successful access
      await expect(page).toHaveURL(area.path)
      await expect(page).not.toHaveURL('/unauthorized')
      await expect(page.locator('main')).toBeVisible() // Fallback selector

    }

    await takeScreenshot(page, 'admin-cross-area-navigation')
  })

  /**
   * Test: Admin Session Management
   *
   * Skenario: Admin session tetap stabil dan tidak terminated unexpectedly
   * Expected: Admin session management berfungsi dengan benar
   *
   * BDD Format:
   * - Given: Admin user sudah login dengan active session
   * - When: Admin melakukan berbagai actions dan navigation
   * - Then: Session tetap stabil dan tidak ada unexpected termination
   */
  test('should maintain stable admin session during extended usage', async ({ page }) => {
    // Given: Admin user login

    adminUser = await loginWithRole(page, 'admin')

    // When: Simulate extended usage
    const actions = [
      () => page.goto('/admin'),
      () => page.goto('/creator'),
      () => page.goto('/dashboard'),
      () => page.reload(),
      () => page.goto('/admin/dashboard'),
      () => page.goBack(),
      () => page.goForward(),
    ]

    for (const action of actions) {
      await action()
      await waitForPageLoad(page)

      // Then: Verify session masih aktif
      await expect(page).not.toHaveURL('/sign-in')
      await expect(page).not.toHaveURL('/unauthorized')
    }

    await takeScreenshot(page, 'admin-session-stability')
  })
})
