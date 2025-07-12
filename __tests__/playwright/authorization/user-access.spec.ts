/**
 * E2E Test: User Access Verification
 *
 * Test ini memvalidasi bahwa regular users memiliki akses terbatas sesuai
 * dengan role hierarchy: hanya dapat akses user routes, diblokir dari admin dan creator routes.
 *
 * Test Scenarios:
 * 1. User Allowed Access - User dapat akses user routes saja
 * 2. User Restricted Access - User diblokir dari admin dan creator routes
 * 3. User UI Elements - User-specific UI elements (limited features)
 * 4. User Authorization Boundaries - Comprehensive boundary testing
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

  if (!availableRoles.includes('user')) {
    throw new Error(
      `User role not available. Missing environment variables: ${missingVars.join(', ')}`,
    )
  }
})

test.describe('User Access Verification', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let regularUser: RoleTestUser | null

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
   * Test: User Allowed Access Verification
   *
   * Skenario: Regular user mengakses user routes yang diizinkan
   * Expected: User dapat mengakses user routes dan basic features
   *
   * BDD Format:
   * - Given: User login sebagai regular user dengan role user di Clerk
   * - When: User mencoba mengakses user routes dan basic features
   * - Then: User berhasil mengakses routes yang diizinkan
   */
  test('should allow user access to user routes only', async ({ page }) => {
    // Given: Regular user login

    regularUser = await loginWithRole(page, 'user')
    await waitForPageLoad(page)

    // When & Then: Test semua allowed routes untuk user
    await testAllowedRoutesForRole(page, 'user')
    await takeScreenshot(page, 'user-allowed-access-verified')
  })

  /**
   * Test: User Restricted Access Verification
   *
   * Skenario: Regular user mencoba mengakses admin dan creator routes yang dilarang
   * Expected: User diblokir dari admin dan creator routes
   *
   * BDD Format:
   * - Given: Regular user sudah login dengan role user
   * - When: User mencoba mengakses admin dan creator routes
   * - Then: User diarahkan ke unauthorized page untuk semua restricted routes
   */
  test('should block user access to admin and creator routes', async ({ page }) => {
    // Given: Regular user login

    regularUser = await loginWithRole(page, 'user')
    await waitForPageLoad(page)

    // When & Then: Test semua restricted routes untuk user
    await testRestrictedRoutesForRole(page, 'user')
    await takeScreenshot(page, 'user-restricted-access-verified')
  })

  /**
   * Test: User UI Elements Verification
   *
   * Skenario: Regular user melihat user-specific UI elements di dashboard
   * Expected: User menu items terbatas, admin dan creator elements tidak terlihat
   *
   * BDD Format:
   * - Given: Regular user sudah login dan berada di dashboard
   * - When: User melihat navigation menu dan UI elements
   * - Then: Hanya user-level features yang tersedia, privileged elements tidak terlihat
   */
  test('should display limited user UI elements and hide privileged elements', async ({ page }) => {
    // Given: Regular user login dan navigate ke dashboard

    regularUser = await loginWithRole(page, 'user')

    // When & Then: Verify role-based UI untuk user
    await verifyRoleBasedUI(page, 'user', '/dashboard')

    // Additional user-specific checks
    await page.goto('/user')
    await waitForPageLoad(page)

    // Verify user area tersedia
    await expect(page.locator('main, [role="main"], body')).toBeVisible()
    await expect(page).not.toHaveURL('/unauthorized')
    await takeScreenshot(page, 'user-ui-elements-verified')
  })

  /**
   * Test: User Dashboard Access
   *
   * Skenario: User mengakses user dashboard dan basic features
   * Expected: User dashboard berfungsi dengan limited functionality
   *
   * BDD Format:
   * - Given: Regular user sudah login
   * - When: User mengakses user dashboard
   * - Then: User dashboard accessible dengan appropriate limitations
   */
  test('should access user dashboard with limited functionality', async ({ page }) => {
    // Given: Regular user login

    regularUser = await loginWithRole(page, 'user')

    // When: Navigate ke user dashboard
    await page.goto('/user/dashboard')
    await waitForPageLoad(page)

    // Then: Verify user dashboard accessibility
    await expect(page).toHaveURL('/user/dashboard')
    await expect(page.locator('main, [role="main"], body')).toBeVisible()

    // Verify tidak ada error atau unauthorized access
    await expect(page).not.toHaveURL('/unauthorized')
    await expect(page).not.toHaveURL('/sign-in')
    await takeScreenshot(page, 'user-dashboard-access')
  })

  /**
   * Test: User Admin Route Block Testing
   *
   * Skenario: User mencoba mengakses admin routes via direct URL
   * Expected: User diblokir dan diarahkan ke unauthorized page
   *
   * BDD Format:
   * - Given: Regular user sudah login
   * - When: User mencoba akses admin routes via direct URL
   * - Then: User diblokir dan melihat unauthorized page
   */
  test('should block user from accessing admin routes via direct URL', async ({ page }) => {
    // Given: Regular user login

    regularUser = await loginWithRole(page, 'user')

    // When & Then: Test direct access ke admin routes
    const adminRoutes = ['/admin', '/admin/dashboard']

    for (const route of adminRoutes) {
      await testDirectUrlAccess(page, 'user', route)
    }

    await takeScreenshot(page, 'user-admin-route-blocking')
  })

  /**
   * Test: User Creator Route Block Testing
   *
   * Skenario: User mencoba mengakses creator routes via direct URL
   * Expected: User diblokir dan diarahkan ke unauthorized page
   *
   * BDD Format:
   * - Given: Regular user sudah login
   * - When: User mencoba akses creator routes via direct URL
   * - Then: User diblokir dan melihat unauthorized page
   */
  test('should block user from accessing creator routes via direct URL', async ({ page }) => {
    // Given: Regular user login

    regularUser = await loginWithRole(page, 'user')

    // When & Then: Test direct access ke creator routes
    const creatorRoutes = ['/creator', '/creator/dashboard']

    for (const route of creatorRoutes) {
      await testDirectUrlAccess(page, 'user', route)
    }

    await takeScreenshot(page, 'user-creator-route-blocking')
  })

  /**
   * Test: User Unauthorized Page Functionality
   *
   * Skenario: User mengakses restricted routes dan melihat unauthorized page
   * Expected: Unauthorized page menampilkan user-appropriate message dengan contact admin option
   *
   * BDD Format:
   * - Given: Regular user sudah login
   * - When: User mengakses restricted route dan diarahkan ke unauthorized page
   * - Then: Unauthorized page berfungsi dengan user-specific messaging dan contact option
   */
  test('should display appropriate unauthorized page with contact admin option', async ({
    page,
  }) => {
    // Given: Regular user login

    regularUser = await loginWithRole(page, 'user')

    // Additional verification for user-specific features
    await page.goto('/creator')
    await waitForPageLoad(page)

    // Should also be on unauthorized page
    await expect(page).toHaveURL('/unauthorized')

    // When & Then: Verify unauthorized page functionality
    await verifyUnauthorizedPageFunctionality(page, 'user', '/admin')
    await takeScreenshot(page, 'user-unauthorized-page')
  })

  /**
   * Test: User Role Persistence
   *
   * Skenario: User role permissions tetap konsisten across navigation
   * Expected: User permissions tetap terbatas during extended usage
   *
   * BDD Format:
   * - Given: Regular user sudah login dengan session aktif
   * - When: User navigate antar allowed pages dan refresh
   * - Then: User role limitations tetap konsisten
   */
  test('should maintain user role persistence with consistent limitations', async ({ page }) => {
    // Given: Regular user login

    regularUser = await loginWithRole(page, 'user')

    // When & Then: Test role persistence
    await testRolePersistence(page, 'user')
    await takeScreenshot(page, 'user-role-persistence')
  })

  /**
   * Test: User Boundary Testing dengan Multiple Privilege Escalation Attempts
   *
   * Skenario: User mencoba berbagai cara untuk mengakses privileged routes
   * Expected: Semua attempts diblokir consistently tanpa session corruption
   *
   * BDD Format:
   * - Given: Regular user dengan active session
   * - When: User repeatedly tries privileged access dengan different methods
   * - Then: All attempts blocked consistently, session remains stable
   */
  test('should consistently block all privilege escalation attempts', async ({ page }) => {
    // Given: Regular user login

    regularUser = await loginWithRole(page, 'user')

    // When: Multiple privileged access attempts
    const privilegedRoutes = [
      '/admin',
      '/admin/dashboard',
      '/admin/users',
      '/creator',
      '/creator/dashboard',
      '/creator/content',
    ]

    for (const route of privilegedRoutes) {
      await page.goto(route)
      await waitForPageLoad(page)

      // Then: Should be blocked consistently
      await expect(page).toHaveURL('/unauthorized')

      // Navigate back to allowed area to test session stability
      await page.goto('/user')
      await waitForPageLoad(page)
      await expect(page).toHaveURL('/user')
      await expect(page).not.toHaveURL('/sign-in')
    }

    await takeScreenshot(page, 'user-privilege-escalation-blocked')
  })

  /**
   * Test: User Navigation Within Allowed Scope
   *
   * Skenario: User navigate dalam scope yang diizinkan (user routes)
   * Expected: Navigation lancar untuk allowed routes saja
   *
   * BDD Format:
   * - Given: Regular user sudah login
   * - When: User navigate dalam allowed user scope
   * - Then: Navigation berhasil untuk user routes
   */
  test('should navigate smoothly within allowed user scope', async ({ page }) => {
    // Given: Regular user login

    regularUser = await loginWithRole(page, 'user')

    // When: Navigate within allowed user areas
    const allowedUserAreas = [{ path: '/dashboard', name: 'General Dashboard' }]

    for (const area of allowedUserAreas) {
      await page.goto(area.path)
      await waitForPageLoad(page)

      // Then: Verify successful access
      await expect(page).toHaveURL(area.path)
      await expect(page).not.toHaveURL('/unauthorized')
      await expect(page.locator('main')).toBeVisible()
    }

    await takeScreenshot(page, 'user-allowed-navigation')
  })

  /**
   * Test: User Session Stability Under Repeated Blocking
   *
   * Skenario: User session tetap stabil meskipun berulang kali diblokir dari privileged routes
   * Expected: Session tidak corrupt atau terminated setelah multiple blocking events
   *
   * BDD Format:
   * - Given: Regular user dengan stable session
   * - When: User experiences multiple route blocking events
   * - Then: Session remains stable dan user tetap dapat akses allowed routes
   */
  test('should maintain session stability under repeated access blocking', async ({ page }) => {
    // Given: Regular user login

    regularUser = await loginWithRole(page, 'user')

    // When: Simulate repeated blocking scenarios
    const blockingScenarios = [
      { route: '/admin', name: 'Admin Access' },
      { route: '/creator', name: 'Creator Access' },
      { route: '/admin/dashboard', name: 'Admin Dashboard' },
      { route: '/creator/dashboard', name: 'Creator Dashboard' },
    ]

    for (let i = 0; i < 2; i++) {
      // Repeat cycle twice
      for (const scenario of blockingScenarios) {
        // Attempt privileged access
        await page.goto(scenario.route)
        await waitForPageLoad(page)
        await expect(page).toHaveURL('/unauthorized')

        // Return to safe area
        await page.goto('/user')
        await waitForPageLoad(page)
        await expect(page).toHaveURL('/user')
        await expect(page).not.toHaveURL('/sign-in')
      }
    }

    await takeScreenshot(page, 'user-session-stability')
  })
})
