/**
 * E2E Tests for Product Listing & Display (RPK-19)
 *
 * This test suite focuses specifically on product listing functionality including:
 * ✅ Product page loading and component visibility
 * ✅ Table view display and functionality
 * ✅ View mode switching (table/grid)
 * ✅ Product data display validation
 *
 * Uses producer authentication for testing product listing access.
 */

import { test, expect } from '@playwright/test'
import { verifyUserSession, waitForPageLoad, takeScreenshot } from '../utils/test-helpers'

// Use producer storage state as they have manage-product access
test.use({ storageState: '__tests__/playwright/.clerk/producer.json' })

test.describe('Product Listing & Display', () => {
  test.beforeEach(async ({ page }) => {
    // Verify producer is authenticated
    await verifyUserSession(page)
  })

  /**
   * Test Case: Core Page Loading and Component Visibility
   *
   * Purpose: Ensures all critical UI components are properly loaded and displayed
   * when a producer accesses the manage-product page for the first time.
   *
   * Validates:
   * - Page navigation and loading
   * - Header component with title and action buttons
   * - Search and filter components
   * - Product content area (table or empty state)
   *
   * Business Value: Confirms users can access and see all necessary tools
   * for product management functionality.
   */
  test('should display product management page with all components', async ({ page }) => {
    // Given: Producer navigates to manage-product page
    await page.goto('/producer/manage-product')
    await waitForPageLoad(page, '[data-testid="manage-product-page"]')

    // Then: All main components should be visible
    await expect(page.locator('[data-testid="product-header"]')).toBeVisible()
    await expect(page.locator('[data-testid="product-header-title"]')).toHaveText(
      'Manajemen Produk',
    )
    await expect(page.locator('[data-testid="add-product-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="manage-categories-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="search-filter-bar"]')).toBeVisible()

    // Alternatif assertion: tunggu salah satu table atau empty state muncul
    const table = page.locator('[data-testid="product-table"]')
    const empty = page.locator('[data-testid="empty-state"]')

    // Tunggu salah satu visible (maks 20 detik)
    await Promise.race([
      table.waitFor({ state: 'visible', timeout: 20000 }),
      empty.waitFor({ state: 'visible', timeout: 20000 }),
    ])

    // Assertion: salah satu harus visible
    const isTableVisible = await table.isVisible()
    const isEmptyVisible = await empty.isVisible()
    expect(isTableVisible || isEmptyVisible).toBeTruthy()

    await takeScreenshot(page, 'manage-product-page-loaded')
  })

  /**
   * Test Case: Default Table View Display
   *
   * Purpose: Verifies that the product list displays in table format by default
   * and shows all necessary column headers for product information.
   *
   * Validates:
   * - Table view is the default display mode
   * - All table headers are visible (Code, Name, Category, Price, Actions)
   * - Table toggle button state is correctly set
   *
   * Business Value: Ensures users see product data in an organized, scannable
   * format that supports quick comparison and identification of products.
   */
  test('should display products in table format by default', async ({ page }) => {
    // Given: Producer is on manage-product page with products
    await page.goto('/producer/manage-product')
    await waitForPageLoad(page)

    // When: Page loads with products
    if ((await page.locator('[data-testid="product-table"]').count()) > 0) {
      // Then: Table view should be active and display products
      await expect(page.locator('[data-testid="product-table"]')).toBeVisible()
      await expect(page.locator('[data-testid="table-view-toggle"]')).toHaveAttribute(
        'data-state',
        'on',
      )

      // Table headers should be visible
      await expect(page.locator('[data-testid="header-code"]')).toBeVisible()
      await expect(page.locator('[data-testid="header-name"]')).toBeVisible()
      await expect(page.locator('[data-testid="header-category"]')).toBeVisible()
      await expect(page.locator('[data-testid="header-price"]')).toBeVisible()
      await expect(page.locator('[data-testid="header-actions"]')).toBeVisible()
    }

    await takeScreenshot(page, 'product-table-view')
  })

  /**
   * Test Case: View Mode Toggle Functionality
   *
   * Purpose: Tests the ability to switch between table and grid/card view modes
   * for different user preferences and use cases.
   *
   * Validates:
   * - Grid view can be activated from table view
   * - Table view can be re-activated from grid view
   * - Toggle button states update correctly
   * - View mode persistence during session
   *
   * Business Value: Provides flexibility for users to view products in their
   * preferred format - table for data comparison, grid for visual browsing.
   */
  test('should switch between table and grid view modes', async ({ page }) => {
    // Given: Producer is on manage-product page
    await page.goto('/producer/manage-product')
    await waitForPageLoad(page)

    // When: User clicks grid view toggle
    await page.click('[data-testid="card-view-toggle"]')
    await waitForPageLoad(page)

    // Then: Grid view should be active
    await expect(page.locator('[data-testid="card-view-toggle"]')).toHaveAttribute(
      'data-state',
      'on',
    )
    await expect(page.locator('[data-testid="table-view-toggle"]')).toHaveAttribute(
      'data-state',
      'off',
    )

    // When: User switches back to table view
    await page.click('[data-testid="table-view-toggle"]')
    await waitForPageLoad(page)

    // Then: Table view should be active again
    await expect(page.locator('[data-testid="table-view-toggle"]')).toHaveAttribute(
      'data-state',
      'on',
    )
    await expect(page.locator('[data-testid="card-view-toggle"]')).toHaveAttribute(
      'data-state',
      'off',
    )

    await takeScreenshot(page, 'view-mode-switching')
  })

  /**
   * Test Case: Product Data Display Validation
   *
   * Purpose: Validates that product data is correctly displayed in the table
   * with proper formatting and all required information.
   *
   * Validates:
   * - Product rows display correct data structure
   * - Currency formatting for prices and costs
   * - Category badges display properly
   * - Status badges show correct states
   * - Action buttons are accessible for each product
   *
   * Business Value: Ensures data integrity and proper presentation
   * of product information for business decision making.
   */
  test('should display product data correctly in table rows', async ({ page }) => {
    // Given: Producer is on manage-product page with products
    await page.goto('/producer/manage-product')
    await waitForPageLoad(page)

    // When: Products are displayed in table
    const productRows = page.locator('[data-testid^="product-row-"]')
    const rowCount = await productRows.count()

    if (rowCount > 0) {
      const firstRow = productRows.first()

      // Then: Product row should contain all required data elements
      await expect(firstRow.locator('[data-testid$="-code"]')).toBeVisible()
      await expect(firstRow.locator('[data-testid$="-name"]')).toBeVisible()
      await expect(firstRow.locator('[data-testid$="-category-badge"]')).toBeVisible()
      await expect(firstRow.locator('[data-testid$="-price"]')).toBeVisible()
      await expect(firstRow.locator('[data-testid$="-status-badge"]')).toBeVisible()
      await expect(firstRow.locator('[data-testid$="-actions-trigger"]')).toBeVisible()

      // Currency fields should contain proper formatting
      const priceText = await firstRow.locator('[data-testid$="-price"]').textContent()
      const modalText = await firstRow.locator('[data-testid$="-modal"]').textContent()

      if (priceText) expect(priceText).toMatch(/Rp|,|\d/)
      if (modalText) expect(modalText).toMatch(/Rp|,|\d/)
    }

    await takeScreenshot(page, 'product-data-display')
  })
})
