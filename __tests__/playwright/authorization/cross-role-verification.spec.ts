/**
 * E2E Test: Cross-Role Authorization Verification
 *
 * Test ini memvalidasi interaksi dan boundary testing antar semua roles untuk memastikan
 * tidak ada privilege escalation atau role confusion dalam sistem. Comprehensive testing
 * yang mencover edge cases dan boundary conditions antar roles.
 *
 * Test Scenarios:
 * 1. Role Hierarchy Verification - Verification hierarki role yang benar
 * 2. Cross-Role Session Testing - Test switching antar role sessions
 * 3. Role Boundary Testing - Comprehensive boundary testing
 * 4. Authorization Matrix Validation - Full access control matrix testing
 *
 * Referensi:
 * - Task TSK-40: Menulis Test Case untuk Otorisasi Berbasis Peran
 * - Task TSK-15: Role-Based Access Control Implementation
 * - https://clerk.com/docs/testing/playwright/overview
 * - https://clerk.com/docs/testing/playwright/test-authenticated-flows
 */

import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { validateRoleTestEnvironment, accessControlMatrix } from '../fixtures/role-test-users'
import { loginWithRole, validateAccessControlMatrix } from '../utils/role-test-helpers'
import { waitForPageLoad, takeScreenshot } from '../utils/test-helpers'
import { UserRole } from '../../../features/auth/types'

// Validate role test environment sebelum menjalankan tests
test.beforeAll(async () => {
  const { missingVars, availableRoles } = validateRoleTestEnvironment()

  const requiredRoles = ['admin', 'creator', 'user']
  const missingRoles = requiredRoles.filter((role) => !availableRoles.includes(role as UserRole))

  if (missingRoles.length > 0) {
    throw new Error(
      `Missing required roles: ${missingRoles.join(', ')}. Missing environment variables: ${missingVars.join(', ')}`,
    )
  }
})

test.describe('Cross-Role Authorization Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Setup Clerk testing token untuk setiap test
    await setupClerkTestingToken({ page })

    // Clear browser state untuk fresh session
    await page.context().clearCookies()
    await page.context().clearPermissions()
  })

  /**
   * Test: Role Hierarchy Verification (Simplified)
   *
   * Skenario: Memverifikasi bahwa setiap role dapat akses route yang seharusnya
   * Expected: Setiap role hanya dapat akses routes sesuai dengan authorization matrix
   *
   * BDD Format:
   * - Given: System memiliki role hierarchy admin > creator > user
   * - When: Setiap role login dan mengakses routes sesuai hierarchy
   * - Then: Access permissions sesuai dengan hierarchy yang didefinisikan
   */
  test('should enforce correct role hierarchy across all roles', async ({ page }) => {
    await setupClerkTestingToken({ page })

    // Test simplified role hierarchy dengan single assertions per role
    const roleTests = [
      { role: 'admin', route: '/admin', shouldAccess: true },
      { role: 'creator', route: '/admin', shouldAccess: false },
      { role: 'creator', route: '/creator', shouldAccess: true },
      { role: 'user', route: '/admin', shouldAccess: false },
      { role: 'user', route: '/creator', shouldAccess: false },
      { role: 'user', route: '/dashboard', shouldAccess: true },
    ]

    for (const testCase of roleTests) {
      // Fresh login for each test to avoid session conflicts
      await page.context().clearCookies()
      await loginWithRole(page, testCase.role as UserRole)

      await page.goto(testCase.route)
      await waitForPageLoad(page)

      const currentUrl = page.url()
      const hasAccess = !currentUrl.includes('/unauthorized')

      expect(hasAccess).toBe(testCase.shouldAccess)
    }

    await takeScreenshot(page, 'role-hierarchy-verification')
  })

  /**
   * Test: Access Control Matrix Validation
   *
   * Skenario: Comprehensive testing authorization matrix
   * Expected: Access matrix berfungsi sesuai dengan spesifikasi RBAC
   */
  test('should validate complete access control matrix', async ({ page }) => {
    // Test access control matrix untuk semua role-route combinations
    const matrixValidationResult = await validateAccessControlMatrix(
      page,
      accessControlMatrix as unknown as Record<string, string[]>,
    )

    // Verify matrix validation passed
    expect(matrixValidationResult.isValid).toBe(true)
    expect(matrixValidationResult.failedCases.length).toBe(0)

    await takeScreenshot(page, 'access-control-matrix-validated')
  })

  /**
   * Test: Basic Security Boundary Verification
   *
   * Skenario: Test basic security boundaries tanpa complex role switching
   * Expected: System menangani basic security checks dengan benar
   */
  test('should handle basic security boundaries correctly', async ({ page }) => {
    const securityTests = [
      {
        name: 'User Cannot Access Admin Area',
        test: async () => {
          await loginWithRole(page, 'user')
          await page.goto('/admin')
          await waitForPageLoad(page)
          await expect(page).toHaveURL('/unauthorized')
        },
      },
      {
        name: 'Creator Cannot Access Admin Area',
        test: async () => {
          await page.context().clearCookies()
          await loginWithRole(page, 'creator')
          await page.goto('/admin')
          await waitForPageLoad(page)
          await expect(page).toHaveURL('/unauthorized')
        },
      },
      {
        name: 'Admin Can Access All Areas',
        test: async () => {
          await page.context().clearCookies()
          await loginWithRole(page, 'admin')

          // Test admin can access admin area
          await page.goto('/admin')
          await waitForPageLoad(page)
          await expect(page).not.toHaveURL('/unauthorized')

          // Test admin can access creator area
          await page.goto('/creator')
          await waitForPageLoad(page)
          await expect(page).not.toHaveURL('/unauthorized')
        },
      },
    ]

    for (const securityTest of securityTests) {
      try {
        await securityTest.test()
      } catch (error) {
        throw error
      }
    }

    await takeScreenshot(page, 'basic-security-boundaries')
  })
})
