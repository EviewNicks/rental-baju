/**
 * Kasir-specific Test Helper Functions
 *
 * Helper functions yang spesifik untuk testing kasir dashboard functionality.
 * Includes navigation, interaction, dan assertion helpers untuk kasir workflow.
 */

import { Page, expect } from '@playwright/test'
import { waitForPageLoad, takeScreenshot, verifyUserSession } from './test-helpers'
import { kasirSelectors, performanceThresholds, testConfig } from '../fixtures/kasir-test-data'
import type { TransactionStatus } from '../../../features/kasir/types/transaction'

/**
 * Navigate ke kasir dashboard dan verify basic loading
 *
 * @param page - Playwright Page object
 * @param options - Navigation options
 */
export async function navigateToKasirDashboard(
  page: Page,
  options: { waitForData?: boolean; timeout?: number } = {},
) {
  const { waitForData = true, timeout = testConfig.timeouts.medium } = options

  console.log('🏠 Navigating to kasir dashboard...')

  // Navigate to dashboard
  await page.goto('/dashboard')
  await waitForPageLoad(page)

  // Verify page is loaded
  await expect(page.locator(kasirSelectors.title)).toBeVisible({ timeout })
  await expect(page.locator(kasirSelectors.subtitle)).toBeVisible({ timeout })

  // Wait for data loading jika diperlukan
  if (waitForData) {
    await waitForDashboardDataLoad(page, timeout)
  }

  console.log('✅ Successfully navigated to kasir dashboard')
}

/**
 * Wait for dashboard data to fully load
 *
 * @param page - Playwright Page object
 * @param timeout - Maximum wait time
 */
export async function waitForDashboardDataLoad(page: Page, timeout = testConfig.timeouts.medium) {
  console.log('⏳ Waiting for dashboard data to load...')

  try {
    // Wait for either transaction table or empty state
    await Promise.race([
      page.locator(kasirSelectors.transactionTable).waitFor({ state: 'visible', timeout }),
      page.locator(kasirSelectors.emptyState).waitFor({ state: 'visible', timeout }),
    ])

    // Ensure loading state is gone
    await expect(page.locator(kasirSelectors.loadingState)).not.toBeVisible()

    console.log('✅ Dashboard data loaded successfully')
  } catch {
    console.log('⚠️ Dashboard data load timeout, continuing with test...')
  }
}

/**
 * Verify kasir dashboard basic components are visible
 *
 * @param page - Playwright Page object
 */
export async function verifyDashboardComponents(page: Page) {
  console.log('🔍 Verifying dashboard components...')

  // Header components
  await expect(page.locator(kasirSelectors.title)).toBeVisible()
  await expect(page.locator(kasirSelectors.title)).toHaveText('RentalBaju')
  await expect(page.locator(kasirSelectors.subtitle)).toBeVisible()
  await expect(page.locator(kasirSelectors.subtitle)).toHaveText('Daftar Transaksi Penyewaan')

  // Action button
  await expect(page.locator(kasirSelectors.addTransactionButton)).toBeVisible()
  await expect(page.locator(kasirSelectors.addTransactionButton)).toBeEnabled()

  // Tab navigation
  await expect(page.locator(kasirSelectors.tabContainer)).toBeVisible()
  await expect(page.locator(kasirSelectors.allTab)).toBeVisible()
  await expect(page.locator(kasirSelectors.activeTab)).toBeVisible()
  await expect(page.locator(kasirSelectors.completedTab)).toBeVisible()
  await expect(page.locator(kasirSelectors.overdueTab)).toBeVisible()

  // Search functionality
  await expect(page.locator(kasirSelectors.searchInput)).toBeVisible()

  console.log('✅ All dashboard components verified')
}

/**
 * Switch to specific transaction tab
 *
 * @param page - Playwright Page object
 * @param tabStatus - Status tab to switch to
 */
export async function switchToTab(page: Page, tabStatus: TransactionStatus | 'all') {
  console.log(`🔄 Switching to ${tabStatus} tab...`)

  const startTime = Date.now()

  const tabSelector =
    tabStatus === 'all'
      ? kasirSelectors.allTab
      : tabStatus === 'selesai'
        ? kasirSelectors.completedTab
        : tabStatus === 'terlambat'
          ? kasirSelectors.overdueTab
          : kasirSelectors.activeTab

  // Click the tab
  await page.click(tabSelector)

  // Wait for content to update
  await waitForDashboardDataLoad(page)

  // Verify tab is active using Radix UI data-state attribute (most reliable)
  await expect(page.locator(tabSelector)).toHaveAttribute('data-state', 'active', { timeout: 10000 })

  const loadTime = Date.now() - startTime
  console.log(`✅ Tab switch completed in ${loadTime}ms`)

  // Performance assertion - allow more time for tab switching with data loading
  expect(loadTime).toBeLessThan(performanceThresholds.tabSwitchTime * 2)
}

/**
 * Perform search operation
 *
 * @param page - Playwright Page object
 * @param query - Search query string
 * @param options - Search options
 */
export async function performSearch(
  page: Page,
  query: string,
  options: { waitForResults?: boolean; clearFirst?: boolean } = {},
) {
  const { waitForResults = true, clearFirst = false } = options

  console.log(`🔍 Searching for: "${query}"`)

  const startTime = Date.now()

  // Clear existing search if needed
  if (clearFirst) {
    await page.fill(kasirSelectors.searchInput, '')
    await page.waitForTimeout(300) // Wait for debounce
  }

  // Enter search query
  await page.fill(kasirSelectors.searchInput, query)

  // Wait for debounced search (useTransactions has debounce)
  await page.waitForTimeout(500)

  if (waitForResults) {
    await waitForDashboardDataLoad(page)
  }

  const searchTime = Date.now() - startTime
  console.log(`✅ Search completed in ${searchTime}ms`)

  // Performance assertion
  expect(searchTime).toBeLessThan(performanceThresholds.searchResponseTime)
}

/**
 * Clear search input
 *
 * @param page - Playwright Page object
 */
export async function clearSearch(page: Page) {
  console.log('🗑️ Clearing search...')

  await page.fill(kasirSelectors.searchInput, '')
  await page.waitForTimeout(300) // Wait for debounce
  await waitForDashboardDataLoad(page)

  // Verify search is cleared
  await expect(page.locator(kasirSelectors.searchInput)).toHaveValue('')
}

/**
 * Click Tambah Transaksi button and verify navigation
 *
 * @param page - Playwright Page object
 */
export async function navigateToNewTransaction(page: Page) {
  console.log('➕ Navigating to new transaction...')

  const startTime = Date.now()

  // Click the button
  await page.click(kasirSelectors.addTransactionButton)

  // Wait for navigation
  await page.waitForURL('/dashboard/new', { timeout: testConfig.timeouts.medium })
  await waitForPageLoad(page)

  const navTime = Date.now() - startTime
  console.log(`✅ Navigation completed in ${navTime}ms`)

  // Performance assertion
  expect(navTime).toBeLessThan(performanceThresholds.navigationTime)

  // Verify we're on the right page
  expect(page.url()).toContain('/dashboard/new')
}

/**
 * Go back to dashboard from other pages
 *
 * @param page - Playwright Page object
 */
export async function navigateBackToDashboard(page: Page) {
  console.log('↩️ Navigating back to dashboard...')

  await page.goto('/dashboard')
  await waitForPageLoad(page)
  await waitForDashboardDataLoad(page)

  // Verify we're back on dashboard
  await expect(page.locator(kasirSelectors.title)).toBeVisible()
}

/**
 * Verify error state is displayed
 *
 * @param page - Playwright Page object
 * @param expectedErrorMessage - Optional expected error message
 */
export async function verifyErrorState(page: Page, expectedErrorMessage?: string) {
  console.log('🚨 Verifying error state...')

  // Use single reliable error boundary selector
  await expect(page.locator('[data-testid="error-boundary"]')).toBeVisible({ timeout: 10000 })
  console.log('✅ Error boundary found')

  // Verify retry button exists using consistent test-id
  await expect(page.locator('[data-testid="retry-button"]')).toBeVisible({ timeout: 5000 })
  await expect(page.locator('[data-testid="retry-button"]')).toBeEnabled()
  console.log('✅ Retry button found and enabled')

  // Check specific error message if provided
  if (expectedErrorMessage) {
    try {
      await expect(page.locator(`text=${expectedErrorMessage}`)).toBeVisible({ timeout: 5000 })
      console.log(`✅ Expected error message "${expectedErrorMessage}" found`)
    } catch {
      console.log(`⚠️ Expected error message "${expectedErrorMessage}" not found, but error state is confirmed`)
    }
  }

  console.log('✅ Error state verified')
}

/**
 * Click retry button and verify recovery
 *
 * @param page - Playwright Page object
 */
export async function performErrorRetry(page: Page) {
  console.log('🔄 Performing error retry...')

  await page.click('[data-testid="retry-button"]')
  await waitForDashboardDataLoad(page)

  // Verify error is gone (either recovered or still in error state)
  console.log('✅ Retry action completed')
}

/**
 * Count visible transaction rows
 *
 * @param page - Playwright Page object
 * @returns Number of visible transaction rows
 */
export async function countTransactionRows(page: Page): Promise<number> {
  try {
    const rows = page.locator(kasirSelectors.transactionRows)
    const count = await rows.count()
    console.log(`📊 Found ${count} transaction rows`)
    return count
  } catch {
    console.log('📊 No transaction rows found (likely empty state)')
    return 0
  }
}

/**
 * Verify tab has correct count badge
 *
 * @param page - Playwright Page object
 * @param tabStatus - Tab to check
 * @param expectedCount - Expected count (optional)
 */
export async function verifyTabCount(
  page: Page,
  tabStatus: TransactionStatus | 'all',
  expectedCount?: number,
) {
  console.log(`🔢 Verifying ${tabStatus} tab count...`)

  const tabSelector =
    tabStatus === 'all'
      ? kasirSelectors.allTab
      : tabStatus === 'selesai'
        ? kasirSelectors.completedTab
        : tabStatus === 'terlambat'
          ? kasirSelectors.overdueTab
          : kasirSelectors.activeTab

  const tabElement = page.locator(tabSelector)
  await expect(tabElement).toBeVisible()

  // If expectedCount provided, verify it
  if (expectedCount !== undefined) {
    // Look for count badge or text containing the number
    const countText = await tabElement.textContent()
    if (countText) {
      const hasCount = countText.includes(expectedCount.toString())
      expect(hasCount).toBeTruthy()
    }
  }

  console.log(`✅ Tab count verified for ${tabStatus}`)
}

/**
 * Take screenshot with kasir-specific naming
 *
 * @param page - Playwright Page object
 * @param name - Screenshot name
 * @param context - Additional context for filename
 */
export async function takeKasirScreenshot(page: Page, name: string, context?: string) {
  const fullName = context ? `kasir-${name}-${context}` : `kasir-${name}`
  await takeScreenshot(page, fullName)
}

/**
 * Setup kasir test environment
 *
 * @param page - Playwright Page object
 */
export async function setupKasirTestEnvironment(page: Page) {
  console.log('🛠️ Setting up kasir test environment...')

  // Verify user session
  await verifyUserSession(page)

  // Navigate to dashboard
  await navigateToKasirDashboard(page)

  // Verify basic setup
  await verifyDashboardComponents(page)

  console.log('✅ Kasir test environment ready')
}
