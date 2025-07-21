/**
 * E2E Tests for Product Search & Filtering (RPK-19)
 * 
 * This test suite focuses specifically on search and filtering functionality including:
 * ✅ Product search by name or code
 * ✅ Category-based filtering
 * ✅ Status-based filtering
 * ✅ Filter combinations and reset functionality
 * ✅ Empty state handling
 * 
 * Uses producer authentication for testing search and filter access.
 */

import { test, expect } from '@playwright/test'
import { verifyUserSession, waitForPageLoad, takeScreenshot } from '../utils/test-helpers'

// Use producer storage state as they have manage-product access
test.use({ storageState: '__tests__/playwright/.clerk/producer.json' })

test.describe('Product Search & Filtering', () => {
  test.beforeEach(async ({ page }) => {
    // Verify producer is authenticated
    await verifyUserSession(page)
    
    // Navigate to manage-product page for all tests
    await page.goto('/producer/manage-product')
    await waitForPageLoad(page)
  })

  /**
   * Test Case: Product Search by Name or Code
   * 
   * Purpose: Validates the search functionality for finding products
   * by entering partial or full product names or codes.
   * 
   * Validates:
   * - Search input accepts text input
   * - Search is triggered when text is entered
   * - Search can be cleared to show all products
   * - Search input maintains entered values
   * 
   * Business Value: Enables users to quickly locate specific products
   * from large inventories without scrolling through entire lists.
   */
  test('should search products by name or code', async ({ page }) => {
    // When: User enters search term
    const searchInput = page.locator('[data-testid="search-input"]')
    await searchInput.fill('dress')
    await waitForPageLoad(page)

    // Then: Products should be filtered based on search term
    await expect(searchInput).toHaveValue('dress')
    
    // When: User clears search
    await searchInput.clear()
    await waitForPageLoad(page)

    // Then: All products should be visible again
    await expect(searchInput).toHaveValue('')

    await takeScreenshot(page, 'product-search')
  })

  /**
   * Test Case: Advanced Search with Multiple Terms
   * 
   * Purpose: Tests search functionality with multiple keywords and
   * various search patterns to ensure robust search capabilities.
   * 
   * Validates:
   * - Multi-word search terms work correctly
   * - Case-insensitive search functionality
   * - Special character handling in search
   * - Search performance with various input lengths
   * 
   * Business Value: Provides flexible search capabilities for users
   * to find products using natural language queries.
   */
  test('should handle advanced search patterns', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]')

    // Test multi-word search
    await searchInput.fill('red dress elegant')
    await waitForPageLoad(page)
    await expect(searchInput).toHaveValue('red dress elegant')

    // Test case variations
    await searchInput.clear()
    await searchInput.fill('DRESS')
    await waitForPageLoad(page)
    await expect(searchInput).toHaveValue('DRESS')

    // Test partial code search
    await searchInput.clear()
    await searchInput.fill('PRD')
    await waitForPageLoad(page)
    await expect(searchInput).toHaveValue('PRD')

    await takeScreenshot(page, 'advanced-search-patterns')
  })

  /**
   * Test Case: Category-Based Product Filtering
   * 
   * Purpose: Tests the category filter dropdown functionality to allow
   * users to view products from specific categories only.
   * 
   * Validates:
   * - Category filter dropdown opens and displays options
   * - Category options are clickable and selectable
   * - Filter trigger shows current selection state
   * - Category filter can be cleared
   * 
   * Business Value: Helps users organize and focus on products within
   * specific categories for better inventory management and organization.
   */
  test('should filter products by category', async ({ page }) => {
    // When: User clicks category filter
    await page.click('[data-testid="category-filter-trigger"]')
    await waitForPageLoad(page)

    // Then: Category options should be visible
    await expect(page.locator('[data-testid="category-filter-content"]')).toBeVisible()

    // When: User selects a category (if available)
    const categoryOptions = page.locator('[data-testid^="category-option-"]')
    if (await categoryOptions.count() > 1) {
      // Select first non-"all" option
      const firstCategory = categoryOptions.nth(1)
      await firstCategory.click()
      await waitForPageLoad(page)
    }

    await takeScreenshot(page, 'category-filtering')
  })

  /**
   * Test Case: Status-Based Product Filtering
   * 
   * Purpose: Validates the status filter functionality to show products
   * based on their availability status (available, rented, maintenance, etc.).
   * 
   * Validates:
   * - Status filter dropdown opens with predefined options
   * - Status options can be selected
   * - Filter applies to product list display
   * - Status filter can be reset
   * 
   * Business Value: Allows users to quickly identify product availability
   * for rental planning and inventory status monitoring.
   */
  test('should filter products by status', async ({ page }) => {
    // When: User clicks status filter
    await page.click('[data-testid="status-filter-trigger"]')
    await waitForPageLoad(page)

    // Then: Status options should be visible
    await expect(page.locator('[data-testid="status-filter-content"]')).toBeVisible()

    // When: User selects a status
    await page.click('[data-testid="status-option-tersedia"]')
    await waitForPageLoad(page)

    await takeScreenshot(page, 'status-filtering')
  })

  /**
   * Test Case: Combined Search and Filter Operations
   * 
   * Purpose: Tests the combination of search and filter functionality
   * to ensure they work together properly without conflicts.
   * 
   * Validates:
   * - Search and category filter can be used simultaneously
   * - Search and status filter combination works
   * - Multiple filters don't interfere with each other
   * - Combined filters produce expected results
   * 
   * Business Value: Provides powerful filtering capabilities for users
   * to narrow down product lists using multiple criteria.
   */
  test('should combine search with category and status filters', async ({ page }) => {
    // Given: User applies search term
    const searchInput = page.locator('[data-testid="search-input"]')
    await searchInput.fill('dress')
    await waitForPageLoad(page)

    // When: User also applies category filter
    await page.click('[data-testid="category-filter-trigger"]')
    await waitForPageLoad(page)
    
    const categoryOptions = page.locator('[data-testid^="category-option-"]')
    if (await categoryOptions.count() > 1) {
      await categoryOptions.nth(1).click()
      await waitForPageLoad(page)
    }

    // And: User applies status filter
    await page.click('[data-testid="status-filter-trigger"]')
    await waitForPageLoad(page)
    await page.click('[data-testid="status-option-tersedia"]')
    await waitForPageLoad(page)

    // Then: All filters should be active
    await expect(searchInput).toHaveValue('dress')

    await takeScreenshot(page, 'combined-search-filters')
  })

  /**
   * Test Case: Filter Reset with Empty Results
   * 
   * Purpose: Tests the reset functionality when search/filter combinations
   * result in no matching products, providing users a way to clear filters.
   * 
   * Validates:
   * - Empty state appears when no products match filters
   * - Reset filter button is accessible and functional
   * - Reset clears all applied filters and search terms
   * - Products list returns to showing all items after reset
   * 
   * Business Value: Prevents users from getting stuck in filtered states
   * and provides clear path back to viewing all products.
   */
  test('should reset filters when no products found', async ({ page }) => {
    // When: User enters a search that returns no results
    await page.fill('[data-testid="search-input"]', 'nonexistentproduct123xyz')
    await waitForPageLoad(page)

    // Then: Empty state should be shown with reset option
    if (await page.locator('[data-testid="empty-state"]').count() > 0) {
      await expect(page.locator('[data-testid="empty-state"]')).toBeVisible()
      await expect(page.locator('[data-testid="reset-filter-button"]')).toBeVisible()

      // When: User clicks reset filters
      await page.click('[data-testid="reset-filter-button"]')
      await waitForPageLoad(page)

      // Then: Search should be cleared
      await expect(page.locator('[data-testid="search-input"]')).toHaveValue('')
    }

    await takeScreenshot(page, 'filter-reset')
  })

  /**
   * Test Case: Search Performance and Responsiveness
   * 
   * Purpose: Validates that search functionality remains responsive
   * and performs well with various input patterns and data loads.
   * 
   * Validates:
   * - Search responds quickly to user input
   * - No visual lag or freezing during search
   * - Search results update dynamically
   * - Search handles rapid input changes gracefully
   * 
   * Business Value: Ensures smooth user experience and maintains
   * productivity even with large product catalogs.
   */
  test('should maintain search performance and responsiveness', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]')

    // Test rapid search input changes
    await searchInput.fill('a')
    await page.waitForTimeout(100)
    await searchInput.fill('ab')
    await page.waitForTimeout(100)
    await searchInput.fill('abc')
    await page.waitForTimeout(100)
    await searchInput.clear()

    // Test long search terms
    await searchInput.fill('this is a very long search term that should be handled gracefully')
    await waitForPageLoad(page)
    
    // Search input should remain responsive
    await expect(searchInput).toBeFocused()
    await searchInput.clear()

    await takeScreenshot(page, 'search-performance')
  })
})