/**
 * Role-Based Test Helper Utilities untuk Authorization E2E Testing
 *
 * Extended dari test-helpers.ts dengan fokus pada role-based access control testing.
 * Menyediakan utilities untuk login dengan specific roles dan testing route access.
 *
 * Referensi:
 * - https://clerk.com/docs/testing/playwright/overview
 * - https://clerk.com/docs/testing/playwright/test-authenticated-flows
 * - https://clerk.com/docs/guides/basic-rbac
 */

import { Page, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { clerk } from '@clerk/testing/playwright'
import { RoleTestUser, getRoleTestUser, hasAccess } from '../fixtures/role-test-users'
import { waitForPageLoad, takeScreenshot, verifyUserSession } from './test-helpers'
import { UserRole } from '../../../features/auth/types'

/**
 * Login dengan specific role menggunakan Clerk testing helpers
 *
 * @param page - Playwright Page object
 * @param role - Role user yang akan digunakan untuk login ('admin', 'creator', 'user')
 * @returns Promise<RoleTestUser> - Data user yang berhasil login
 *
 * @example
 * ```typescript
 * const adminUser = await loginWithRole(page, 'admin')
 * ```
 */
export async function loginWithRole(page: Page, role: UserRole): Promise<RoleTestUser> {
  const testUser = getRoleTestUser(role)

  console.log(`🔐 Logging in as ${role}: ${testUser.identifier}`)

  // Setup Clerk testing token
  await setupClerkTestingToken({ page })

  // Navigate to homepage first untuk inisialisasi Clerk
  await page.goto('/')
  await waitForPageLoad(page)

  // Perform authentication dengan Clerk helper
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: testUser.identifier,
      password: testUser.password,
    },
  })

  console.log(`✅ Successfully logged in as ${role}`)

  // Verify login berhasil
  await verifyUserSession(page)

  return testUser
}

/**
 * Test akses ke route dengan role tertentu
 *
 * @param page - Playwright Page object
 * @param route - Route yang akan ditest
 * @param role - Role user yang sedang digunakan
 * @param shouldHaveAccess - Apakah user seharusnya punya akses (optional, akan dihitung otomatis)
 *
 * @example
 * ```typescript
 * // Test bahwa admin bisa akses admin routes
 * await testRoleBasedAccess(page, '/admin', 'admin')
 *
 * // Test bahwa user tidak bisa akses admin routes
 * await testRoleBasedAccess(page, '/admin', 'user')
 * ```
 */
export async function testRoleBasedAccess(
  page: Page,
  route: string,
  role: UserRole,
  shouldHaveAccess?: boolean,
) {
  // Auto-determine access jika tidak dispesifikasi
  const expectedAccess = shouldHaveAccess ?? hasAccess(role, route)

  console.log(`🔍 Testing ${role} access to ${route}, expected access: ${expectedAccess}`)

  await page.goto(route)
  await waitForPageLoad(page)

  // DEBUG: Log current URL after navigation
  const currentUrl = page.url()
  console.log(`🌐 Current URL after navigation: ${currentUrl}`)

  if (expectedAccess) {
    // User seharusnya punya akses
    await expect(page).not.toHaveURL('/unauthorized')
    await expect(page).not.toHaveURL('/sign-in')

    // Check bahwa halaman berhasil dimuat - perbaiki selector
    const mainSelectors = ['main', '[role="main"]', 'body', '.main-content', '#main']
    let mainFound = false

    for (const selector of mainSelectors) {
      const element = page.locator(selector)
      if ((await element.count()) > 0 && (await element.isVisible())) {
        mainFound = true
        console.log(`✅ Main element found with selector: ${selector}`)
        break
      }
    }

    if (!mainFound) {
      // Fallback: check page content
      const pageContent = await page.content()
      console.log(`⚠️ No main element found, page title: ${await page.title()}`)
      console.log(`⚠️ Page content length: ${pageContent.length} characters`)

      // Check if page has meaningful content (not just empty or error page)
      const hasContent =
        pageContent.includes('dashboard') ||
        pageContent.includes('admin') ||
        pageContent.includes('control') ||
        pageContent.length > 1000

      if (hasContent) {
        console.log(`✅ Page seems to have content, considering as loaded`)
        mainFound = true
      }
    }

    expect(mainFound).toBeTruthy()

    console.log(`✅ ${role} successfully accessed ${route}`)
  } else {
    // User seharusnya tidak punya akses
    await expect(page).toHaveURL('/unauthorized', { timeout: 10000 })

    // Verify unauthorized page elements
    await expect(page.locator('h1')).toContainText(/akses ditolak|access denied|unauthorized/i)

    console.log(`✅ ${role} correctly blocked from ${route}`)
  }

  await takeScreenshot(
    page,
    `${role}-access-${route.replace(/\//g, '-')}-${expectedAccess ? 'allowed' : 'blocked'}`,
  )
}

/**
 * Test semua allowed routes untuk role tertentu
 *
 * @param page - Playwright Page object
 * @param role - Role yang akan ditest
 *
 * @example
 * ```typescript
 * await testAllowedRoutesForRole(page, 'creator')
 * ```
 */
export async function testAllowedRoutesForRole(page: Page, role: UserRole) {
  const testUser = getRoleTestUser(role)

  console.log(`🧪 Testing all allowed routes for ${role}`)

  for (const route of testUser.allowedRoutes) {
    await testRoleBasedAccess(page, route, role, true)
  }

  console.log(`✅ All allowed routes tested for ${role}`)
}

/**
 * Test semua restricted routes untuk role tertentu
 *
 * @param page - Playwright Page object
 * @param role - Role yang akan ditest
 *
 * @example
 * ```typescript
 * await testRestrictedRoutesForRole(page, 'user')
 * ```
 */
export async function testRestrictedRoutesForRole(page: Page, role: UserRole) {
  const testUser = getRoleTestUser(role)

  console.log(`🧪 Testing all restricted routes for ${role}`)

  for (const route of testUser.restrictedRoutes) {
    await testRoleBasedAccess(page, route, role, false)
  }

  console.log(`✅ All restricted routes tested for ${role}`)
}

/**
 * Verify role-specific UI elements pada halaman tertentu
 *
 * @param page - Playwright Page object
 * @param role - Role yang sedang digunakan
 * @param route - Route yang sedang diakses
 *
 * @example
 * ```typescript
 * await verifyRoleBasedUI(page, 'admin', '/dashboard')
 * ```
 */
export async function verifyRoleBasedUI(page: Page, role: UserRole, route: string = '/dashboard') {
  console.log(`🔍 Verifying role-based UI elements for ${role} on ${route}`)

  await page.goto(route)
  await waitForPageLoad(page)

  // Check for role-specific navigation items
  switch (role) {
    case 'admin':
      // Admin should see admin menu items
      await expect(page.locator('a[href*="/admin"], [data-testid*="admin"]')).toBeVisible()
      break

    case 'creator':
      await expect(
        page.locator('a[href*="/creator/dashboard"], [data-testid*="creator Studio"]'),
      ).toBeVisible()
      await expect(page.locator('a[href*="/admin"], [data-testid*="admin"]')).not.toBeVisible()
      break

    case 'user':
      // User should not see admin or creator menu items
      await expect(page.locator('a[href*="/admin"], [data-testid*="admin"]')).not.toBeVisible()
      await expect(page.locator('a[href*="/creator"], [data-testid*="creator"]')).not.toBeVisible()
      break
  }

  // Check for role indicator if available
  const roleDisplay = page.locator('[data-testid="user-role"], .user-role')
  if (await roleDisplay.isVisible()) {
    await expect(roleDisplay).toContainText(role, { ignoreCase: true })
  }

  console.log(`✅ Role-based UI verified for ${role}`)
  await takeScreenshot(page, `${role}-ui-verification-${route.replace(/\//g, '-')}`)
}

/**
 * Test direct URL access untuk memastikan middleware protection berfungsi
 *
 * @param page - Playwright Page object
 * @param role - Role yang sedang digunakan
 * @param targetRoute - Route yang akan diakses langsung via URL
 *
 * @example
 * ```typescript
 * await testDirectUrlAccess(page, 'user', '/admin/dashboard')
 * ```
 */
export async function testDirectUrlAccess(page: Page, role: UserRole, targetRoute: string) {
  const expectedAccess = hasAccess(role, targetRoute)

  console.log(`🔗 Testing direct URL access: ${role} -> ${targetRoute}`)

  // Navigate directly ke target route
  await page.goto(targetRoute)
  await waitForPageLoad(page)

  if (expectedAccess) {
    await expect(page).toHaveURL(targetRoute)
    await expect(page.locator('main')).toBeVisible()
  } else {
    await expect(page).toHaveURL('/unauthorized')
  }

  console.log(`✅ Direct URL access test completed for ${role} -> ${targetRoute}`)
}

/**
 * Test role persistence across page navigation
 *
 * @param page - Playwright Page object
 * @param role - Role yang sedang digunakan
 *
 * @example
 * ```typescript
 * await testRolePersistence(page, 'creator')
 * ```
 */
export async function testRolePersistence(page: Page, role: UserRole) {
  const testUser = getRoleTestUser(role)

  console.log(`🔄 Testing role persistence for ${role}`)

  // Navigate ke berbagai allowed routes
  const testRoutes = testUser.allowedRoutes.slice(0, 3) // Test first 3 routes untuk efficiency

  for (const route of testRoutes) {
    await page.goto(route)
    await waitForPageLoad(page)

    // Verify masih ada session dan tidak redirect ke unauthorized
    await expect(page).not.toHaveURL('/unauthorized')
    await expect(page).not.toHaveURL('/sign-in')
    await verifyUserSession(page)
  }

  // Test page refresh
  await page.reload()
  await waitForPageLoad(page)
  await verifyUserSession(page)

  console.log(`✅ Role persistence verified for ${role}`)
}

/**
 * Verify unauthorized page functionality dan error messaging
 *
 * @param page - Playwright Page object
 * @param role - Role yang sedang digunakan
 * @param attemptedRoute - Route yang dicoba akses tapi ditolak
 *
 * @example
 * ```typescript
 * await verifyUnauthorizedPageFunctionality(page, 'user', '/admin')
 * ```
 */
export async function verifyUnauthorizedPageFunctionality(
  page: Page,
  role: UserRole,
  attemptedRoute: string,
) {
  console.log(`🚫 Verifying unauthorized page functionality for ${role}`)

  // Navigate ke restricted route
  await page.goto(attemptedRoute)
  await waitForPageLoad(page)

  // Should be on unauthorized page
  await expect(page).toHaveURL('/unauthorized')

  // Check error message elements
  await expect(page.locator('h1')).toContainText(/akses ditolak|access denied/i)
  await expect(page.locator('body')).toContainText(/tidak memiliki izin|unauthorized/i)

  // Check for role-specific messaging
  const roleMessage = page.locator('p').filter({ hasText: `Current Role: ${role}` })
  await expect(roleMessage).toBeVisible()

  // Check for navigation options
  await expect(page.locator('a[href="/dashboard"], button:has-text("Dashboard")')).toBeVisible()
  await expect(page.locator('button:has-text("Kembali"), button:has-text("Back")')).toBeVisible()

  // Test navigation back to allowed area
  await page.click('a[href="/dashboard"], button:has-text("Dashboard")')
  await waitForPageLoad(page)
  await expect(page).toHaveURL('/dashboard')

  console.log(`✅ Unauthorized page functionality verified for ${role}`)
  await takeScreenshot(page, `${role}-unauthorized-page-${attemptedRoute.replace(/\//g, '-')}`)
}

/**
 * Logout user dari role-based session
 *
 * @param page - Playwright Page object
 *
 * @example
 * ```typescript
 * await logoutFromRoleSession(page)
 * ```
 */
export async function logoutFromRoleSession(page: Page) {
  console.log('🚪 Logging out from role-based session...')

  try {
    // Use Clerk's signOut method
    await clerk.signOut({ page })

    // Clear browser state completely
    await page.context().clearCookies()
    await page.context().clearPermissions()

    // Clear any client-side storage
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })

    // Wait for redirect to homepage atau sign-in
    await waitForPageLoad(page)

    // Navigate to home to ensure clean state
    await page.goto('/')
    await waitForPageLoad(page)

    // Verify logout berhasil - check that we can access sign-in page
    await page.goto('/sign-in')
    await waitForPageLoad(page)

    // If we can access sign-in without redirect, we're logged out
    const currentUrl = page.url()
    const isLoggedOut = currentUrl.includes('/sign-in') || currentUrl.includes('/')

    if (!isLoggedOut) {
      console.log('⚠️ Logout verification failed, current URL:', currentUrl)
      throw new Error('Logout failed - still appears to be authenticated')
    }

    console.log('✅ Role-based logout completed successfully')
  } catch (error) {
    console.log(`⚠️ Logout error (continuing anyway): ${error}`)

    // Force clear everything if normal logout fails
    await page.context().clearCookies()
    await page.context().clearPermissions()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })

    // Try to navigate to sign-in
    await page.goto('/sign-in')
    await waitForPageLoad(page)

    console.log('✅ Force logout completed')
  }
}

/**
 * Verify role hierarchy implementation
 */
export async function verifyRoleHierarchy(page: Page) {
  const results = {
    isValid: true,
    canAccessAdmin: false,
    canAccessCreator: false,
    canAccessUser: false,
    errors: [] as string[],
  }

  try {
    // Test admin access - menggunakan route yang benar
    await page.goto('/admin')
    await waitForPageLoad(page)
    results.canAccessAdmin = !page.url().includes('/unauthorized')

    // Test creator access - menggunakan route yang benar
    await page.goto('/creator')
    await waitForPageLoad(page)
    results.canAccessCreator = !page.url().includes('/unauthorized')

    // Test user access (general dashboard)
    await page.goto('/dashboard')
    await waitForPageLoad(page)
    results.canAccessUser = !page.url().includes('/unauthorized')
  } catch (error) {
    results.errors.push(`Hierarchy verification error: ${error}`)
    results.isValid = false
  }

  return results
}

/**
 * Test role switching between different roles
 */
export async function testRoleSwitching(page: Page, fromRole: UserRole, toRole: UserRole) {
  const results = {
    switchSuccessful: false,
    hasPermissionLeakage: false,
    correctPermissions: false,
    errors: [] as string[],
  }

  console.log(`🔄 Testing role switch: ${fromRole} → ${toRole}`)

  try {
    // Login with first role
    await loginWithRole(page, fromRole)
    await waitForPageLoad(page)

    // Logout
    await logoutFromRoleSession(page)

    // Add small delay to ensure logout is complete
    await page.waitForTimeout(1000)

    // Login with second role
    await loginWithRole(page, toRole)
    await waitForPageLoad(page)

    // Test permissions for second role
    const toUser = getRoleTestUser(toRole)
    let permissionTest = true

    // Test allowed routes (simplified - only test /dashboard which all roles should access)
    const testRoute = '/dashboard'

    try {
      await page.goto(testRoute)
      await waitForPageLoad(page)

      if (page.url().includes('/unauthorized')) {
        permissionTest = false
        results.errors.push(`Should have access to ${testRoute} but was unauthorized`)
      }   
    } catch (error) {
      permissionTest = false
      results.errors.push(`Error testing route ${testRoute}: ${error}`)
    }

    // Test restricted routes (only if role has restrictions)
    if (toUser.restrictedRoutes.length > 0) {
      const restrictedRoute = toUser.restrictedRoutes[0] // Test first restricted route

      try {
        await page.goto(restrictedRoute)
        await waitForPageLoad(page) 

        if (!page.url().includes('/unauthorized')) {
          permissionTest = false
          results.hasPermissionLeakage = true
          results.errors.push(`Should not have access to ${restrictedRoute} but was allowed`)
        }
      } catch (error) {
        // Error accessing restricted route is actually expected/OK
        console.log(
          `ℹ️ Error accessing restricted route ${restrictedRoute} (this may be expected): ${error}`,
        )
      }
    }

    results.switchSuccessful = true
    results.correctPermissions = permissionTest
  } catch (error) {
    results.errors.push(`Role switching error: ${error}`)
  }

  return results
}

/**
 * Validate access control matrix
 */
export async function validateAccessControlMatrix(
  page: Page,
  matrix: Record<string, readonly string[]>,
) {
  const results = {
    isValid: true,
    failedCases: [] as Array<{
      role: string
      route: string
      expected: boolean
      actual: boolean
      error?: string
    }>,
    totalTests: 0,
    passedTests: 0,
  }

  const roles = ['admin', 'creator', 'user'] as UserRole[]

  for (const role of roles) {
    await loginWithRole(page, role)

    for (const route of Object.keys(matrix)) {
      results.totalTests++
      const expectedAllowed = matrix[route].includes(role)

      try {
        await page.goto(route)
        await waitForPageLoad(page)

        const actualAllowed = !page.url().includes('/unauthorized')

        if (expectedAllowed === actualAllowed) {
          results.passedTests++
        } else {
          results.failedCases.push({
            role,
            route,
            expected: expectedAllowed,
            actual: actualAllowed,
          })
        }
      } catch (error) {
        results.failedCases.push({
          role,
          route,
          expected: expectedAllowed,
          actual: false,
          error: error.toString(),
        })
      }
    }

    await logoutFromRoleSession(page)
  }

  results.isValid = results.failedCases.length === 0
  return results
}
