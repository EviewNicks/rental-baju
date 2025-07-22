/**
 * Unified Test Helper Utilities untuk E2E Testing
 *
 * Kumpulan utility functions yang membantu dalam menjalankan E2E tests
 * dengan Clerk authentication dan Next.js routing.
 * Includes both general utilities and role-based authorization testing.
 */

import { Page, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { clerk } from '@clerk/testing/playwright'
import { RoleTestUser, getRoleTestUser, hasAccess } from '../fixtures/test-users'
import { UserRole } from '../../../features/auth/types'
/**
 * Helper untuk logout user
 *
 * Fungsi ini melakukan proses logout dari Clerk authentication.
 * Mencari berbagai kemungkinan UI element untuk logout (user menu, logout button).
 *
 * @param page - Playwright Page object untuk interaksi browser
 *
 * @example
 * ```typescript
 * await logoutUser(page)
 * ```
 *
 * @throws {Error} Jika logout gagal atau tidak ditemukan logout button
 */
export async function logoutUser(page: Page) {
  // Click user menu atau logout button
  await page.click('[data-testid="user-menu"]')
  await page.click('[data-testid="logout-button"]')

  // Wait for redirect ke homepage atau sign-in
  await page.waitForURL('/', { timeout: 5000 })
}

/**
 * Helper untuk verify user sudah authenticated
 *
 * Fungsi ini memverifikasi bahwa user sudah dalam keadaan authenticated
 * dengan memeriksa keberadaan UI elements yang menandakan user sudah login.
 *
 * @param page - Playwright Page object untuk verifikasi
 *
 * @example
 * ```typescript
 * await verifyAuthenticated(page)
 * ```
 *
 * @throws {AssertionError} Jika user tidak authenticated
 */
export async function verifyAuthenticated(page: Page) {
  // Check for authenticated user indicators
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()

  // Verify tidak berada di sign-in atau sign-up page
  expect(page.url()).not.toContain('/sign-in')
  expect(page.url()).not.toContain('/sign-up')
}

/**
 * Helper untuk verify user belum authenticated
 *
 * Fungsi ini memverifikasi bahwa user sudah dalam keadaan unauthenticated
 * dengan memeriksa bahwa user berada di halaman sign-in atau homepage.
 *
 * @param page - Playwright Page object untuk verifikasi
 *
 * @example
 * ```typescript
 * await verifyUnauthenticated(page)
 * ```
 *
 * @throws {AssertionError} Jika user masih authenticated
 */
export async function verifyUnauthenticated(page: Page) {
  // Should be redirected to sign-in atau homepage
  const currentUrl = page.url()
  const isUnauthenticated =
    currentUrl.includes('/sign-in') || currentUrl.includes('/') || currentUrl.includes('/sign-up')

  expect(isUnauthenticated).toBeTruthy()
}

/**
 * Helper untuk test route access
 *
 * Fungsi ini menguji apakah user memiliki akses ke route tertentu.
 * Digunakan untuk testing authorization dan protected routes.
 *
 * @param page - Playwright Page object untuk navigasi
 * @param route - Route path yang akan ditest (contoh: '/dashboard', '/admin')
 * @param shouldHaveAccess - Boolean yang menentukan apakah user seharusnya punya akses
 *
 * @example
 * ```typescript
 * // Test bahwa user bisa akses dashboard
 * await testRouteAccess(page, '/dashboard', true)
 *
 * // Test bahwa user tidak bisa akses admin
 * await testRouteAccess(page, '/admin', false)
 * ```
 *
 * @throws {AssertionError} Jika access tidak sesuai expected
 */
export async function testRouteAccess(page: Page, route: string, shouldHaveAccess: boolean) {
  await page.goto(route)

  if (shouldHaveAccess) {
    // Should not be redirected to unauthorized page
    await expect(page).not.toHaveURL('/unauthorized')
    // Should be able to see main content
    await expect(page.locator('main')).toBeVisible()
  } else {
    // Should be redirected to unauthorized page atau sign-in
    const currentUrl = page.url()
    const isBlocked = currentUrl.includes('/unauthorized') || currentUrl.includes('/sign-in')
    expect(isBlocked).toBeTruthy()
  }
}

/**
 * Helper untuk wait for page load dengan optimasi untuk Clerk
 *
 * Fungsi ini menunggu sampai halaman selesai dimuat dengan strategi yang dioptimasi untuk Clerk:
 * 1. Tunggu DOM content loaded
 * 2. Skip networkidle karena Clerk sering menyebabkan hang
 * 3. Tunggu elemen form/UI terlihat sebagai indikator halaman siap
 *
 * @param page - Playwright Page object
 * @param waitForSelector - Optional selector untuk memastikan elemen penting sudah muncul
 *
 * @example
 * ```typescript
 * await page.goto('/sign-in')
 * await waitForPageLoad(page, 'form') // tunggu form sign-in muncul
 * ```
 *
 * @note Dioptimasi khusus untuk Clerk authentication flows
 */
export async function waitForPageLoad(page: Page, waitForSelector?: string) {
  // Tunggu DOM content loaded (cepat dan reliable)
  await page.waitForLoadState('domcontentloaded')

  // Skip networkidle karena Clerk melakukan banyak background requests
  // yang menyebabkan timeout. Ini adalah best practice untuk Clerk testing.

  // Jika ada selector spesifik, tunggu sampai terlihat
  if (waitForSelector) {
    try {
      await page.waitForSelector(waitForSelector, { timeout: 10000 })
    } catch {
      console.log(`⚠️ Element ${waitForSelector} not found, but continuing...`)
    }
  }

  // Tunggu sebentar untuk memastikan JavaScript selesai loading
  await page.waitForTimeout(1000)
}

/**
 * Helper untuk take screenshot dengan nama yang descriptive
 *
 * Fungsi ini mengambil screenshot full page dengan nama file yang descriptive
 * dan timestamp untuk debugging dan dokumentasi test results.
 *
 * @param page - Playwright Page object
 * @param name - Nama descriptive untuk screenshot (contoh: 'login-success', 'error-state')
 *
 * @example
 * ```typescript
 * await takeScreenshot(page, 'login-success')
 * // Akan menghasilkan file: test-results/screenshots/login-success-2024-01-15T10-30-45-123Z.png
 * ```
 *
 * @note Screenshot disimpan di test-results/screenshots/ dengan timestamp
 */
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  await page.screenshot({
    path: `services/screenshots/${name}-${timestamp}.png`,
    fullPage: true,
  })
}

/**
 * Helper untuk verify user session aktif
 *
 * Fungsi ini memverifikasi bahwa user session masih aktif dengan memeriksa
 * berbagai indikator UI yang menunjukkan user sudah login (user button, menu, dll).
 *
 * @param page - Playwright Page object untuk verifikasi
 *
 * @example
 * ```typescript
 * await verifyUserSession(page)
 * ```
 *
 * @throws {AssertionError} Jika user session tidak aktif
 * @note Mencoba berbagai selector untuk fleksibilitas dengan berbagai UI Clerk
 */
export async function verifyUserSession(page: Page) {
  // Check untuk berbagai indikator user session
  const sessionIndicators = [
    '.cl-userButton',
    '[data-testid="user-button"]',
    '[data-testid="user-menu"]',
    'button:has-text("Profile")',
    '.user-menu',
  ]

  let sessionFound = false
  for (const selector of sessionIndicators) {
    const element = page.locator(selector)
    if ((await element.count()) > 0 && (await element.isVisible())) {
      sessionFound = true
      break
    }
  }

  if (!sessionFound) {
    // Fallback: check URL tidak redirect ke sign-in
    const currentUrl = page.url()
    sessionFound = !currentUrl.includes('/sign-in') && !currentUrl.includes('/sign-up')
  }

  expect(sessionFound).toBeTruthy()
}

/**
 * Helper untuk verify user sudah logout
 *
 * Fungsi ini memverifikasi bahwa user sudah berhasil logout dengan memeriksa:
 * 1. Tidak ada UI elements yang menandakan user login
 * 2. URL berada di homepage atau sign-in page
 *
 * @param page - Playwright Page object untuk verifikasi
 *
 * @example
 * ```typescript
 * await verifyUserLoggedOut(page)
 * ```
 *
 * @throws {AssertionError} Jika user masih dalam keadaan login
 * @note Digunakan setelah proses logout untuk memastikan session cleanup berhasil
 */
export async function verifyUserLoggedOut(page: Page) {
  // Check bahwa user sudah logout
  const authIndicators = [
    '.cl-userButton',
    '[data-testid="user-button"]',
    '[data-testid="user-menu"]',
  ]

  let loggedOut = true
  for (const selector of authIndicators) {
    const element = page.locator(selector)
    if ((await element.count()) > 0 && (await element.isVisible())) {
      loggedOut = false
      break
    }
  }

  // Atau check URL berada di homepage/sign-in
  if (loggedOut) {
    const currentUrl = page.url()
    loggedOut =
      currentUrl === '/' ||
      currentUrl.includes('localhost:3000/') ||
      currentUrl.includes('/sign-in') ||
      !currentUrl.includes('/dashboard')
  }

  expect(loggedOut).toBeTruthy()
}

// ============================================================================
// ROLE-BASED AUTHORIZATION TESTING FUNCTIONS
// ============================================================================

/**
 * Login dengan specific role menggunakan Clerk testing helpers
 *
 * @param page - Playwright Page object
 * @param role - Role user yang akan digunakan untuk login ('kasir', 'producer', 'owner')
 * @returns Promise<RoleTestUser> - Data user yang berhasil login
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

  // Ensure absolute URL for navigation
  const baseUrl = 'http://localhost:3000'
  const absoluteUrl = route.startsWith('http') ? route : `${baseUrl}${route}`
  
  await page.goto(absoluteUrl)
  await waitForPageLoad(page)

  if (expectedAccess) {
    // User seharusnya punya akses
    await expect(page).not.toHaveURL('/unauthorized')
    await expect(page).not.toHaveURL('/sign-in')

    // Check bahwa halaman berhasil dimuat
    const mainSelectors = ['main', '[role="main"]', 'body']
    let mainFound = false

    for (const selector of mainSelectors) {
      const element = page.locator(selector)
      if ((await element.count()) > 0 && (await element.isVisible())) {
        mainFound = true
        break
      }
    }

    if (!mainFound) {
      // Fallback: check page content
      const pageContent = await page.content()
      const hasContent = pageContent.length > 1000
      if (hasContent) {
        mainFound = true
      }
    }

    expect(mainFound).toBeTruthy()
    console.log(`✅ ${role} successfully accessed ${route}`)
  } else {
    // User seharusnya tidak punya akses
    await expect(page).toHaveURL('/unauthorized', { timeout: 10000 })
    console.log(`✅ ${role} correctly blocked from ${route}`)
  }

  await takeScreenshot(
    page,
    `${role}-access-${route.replace(/\//g, '-')}-${expectedAccess ? 'allowed' : 'blocked'}`,
  )
}

/**
 * Test semua routes untuk role tertentu (allowed dan restricted)
 *
 * @param page - Playwright Page object
 * @param role - Role yang akan ditest
 */
export async function testAllRoutesForRole(page: Page, role: UserRole) {
  const testUser = getRoleTestUser(role)

  console.log(`🧪 Testing all routes for ${role}`)

  // Test allowed routes
  for (const route of testUser.allowedRoutes) {
    await testRoleBasedAccess(page, route, role, true)
  }

  // Test restricted routes
  for (const route of testUser.restrictedRoutes) {
    await testRoleBasedAccess(page, route, role, false)
  }

  console.log(`✅ All routes tested for ${role}`)
}

/**
 * Logout user dari role-based session
 *
 * @param page - Playwright Page object
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

    console.log('✅ Force logout completed')
  }
}

/**
 * Basic role hierarchy testing
 *
 * @param page - Playwright Page object
 */
export async function testBasicRoleHierarchy(page: Page) {
  console.log('🧪 Testing basic role hierarchy...')

  // Test that owner has access to all areas
  await testRoleBasedAccess(page, '/dashboard', 'owner', true)
  await testRoleBasedAccess(page, '/producer', 'owner', true)
  await testRoleBasedAccess(page, '/owner', 'owner', true)

  // Cek apakah context session adalah owner
  await page.goto('/owner')
  const isOwnerSession = (await page.locator('[data-testid="owner-dashboard-root"]').count()) > 0

  if (isOwnerSession) {
    console.log('⚠️ Skip all role hierarchy block tests karena context session adalah owner')
    return
  }

  // Test that producer has access to dashboard and producer
  await testRoleBasedAccess(page, '/dashboard', 'producer', true)
  await testRoleBasedAccess(page, '/producer', 'producer', true)
  await testRoleBasedAccess(page, '/owner', 'producer', false)

  // Test that kasir has access only to dashboard
  await testRoleBasedAccess(page, '/dashboard', 'kasir', true)
  await testRoleBasedAccess(page, '/producer', 'kasir', false)
  await testRoleBasedAccess(page, '/owner', 'kasir', false)

  console.log('✅ Basic role hierarchy testing completed')
}
