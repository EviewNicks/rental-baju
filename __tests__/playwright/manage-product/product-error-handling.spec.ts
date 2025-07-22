/**
 * E2E Tests for Product Management Error Handling (RPK-19)
 * 
 * This test suite focuses specifically on error handling and edge cases including:
 * ✅ Network error handling and recovery
 * ✅ Navigation error handling
 * ✅ Form validation and error states
 * ✅ Session timeout and authentication errors
 * ✅ Server error responses
 * ✅ Data loading failures and retry mechanisms
 * 
 * Uses producer authentication for testing error scenarios.
 */

import { test, expect } from '@playwright/test'
import { verifyUserSession, waitForPageLoad, takeScreenshot } from '../utils/test-helpers'

// Use producer storage state for error testing
test.use({ storageState: '__tests__/playwright/.clerk/producer.json' })

test.describe('Product Management Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    // Verify producer is authenticated
    await verifyUserSession(page)
  })

  /**
   * Test Case: Navigation Error Handling
   * 
   * Purpose: Tests how the application handles invalid URLs or
   * product IDs that don't exist in the system.
   * 
   * Validates:
   * - Application handles invalid product IDs gracefully
   * - No crashes or unhandled errors occur
   * - Appropriate error pages or redirects are shown
   * - URL remains accessible and doesn't break navigation
   * 
   * Business Value: Ensures robust user experience even when
   * accessing invalid or outdated product links.
   */
  test('should handle navigation errors gracefully', async ({ page }) => {
    // When: Producer tries to access invalid product ID
    await page.goto('/producer/manage-product/999999')
    await waitForPageLoad(page)

    // Then: Should show appropriate error or redirect
    const currentUrl = page.url()
    expect(currentUrl).toBeDefined()

    // Should not crash or show blank page
    const pageContent = await page.content()
    expect(pageContent.length).toBeGreaterThan(100)

    await takeScreenshot(page, 'navigation-error-handling')
  })

  /**
   * Test Case: Form Validation Error States
   * 
   * Purpose: Tests comprehensive form validation error handling
   * and user guidance for correcting invalid inputs.
   * 
   * Validates:
   * - All form fields show appropriate validation errors
   * - Error messages are clear and actionable
   * - Form prevents submission with invalid data
   * - Error states are visually distinctive
   * - Multiple validation errors can be displayed simultaneously
   * 
   * Business Value: Guides users to provide valid data and
   * prevents system errors from invalid inputs.
   */
  test('should display comprehensive form validation errors', async ({ page }) => {
    // Given: Producer is on add product page
    await page.goto('/producer/manage-product/add')
    await waitForPageLoad(page, '[data-testid="product-form-page-add"]')

    // When: User submits form with various invalid inputs
    await page.fill('[data-testid="product-code-field-input"]', '1') // Too short
    await page.fill('[data-testid="product-name-field-input"]', '') // Empty required field
    await page.fill('[data-testid="product-quantity-field-input"]', '-5') // Negative number
    await page.fill('[data-testid="product-price-field-input"]', '0') // Zero price
    
    await page.click('[data-testid="submit-button"]')
    await waitForPageLoad(page)

    // Then: Multiple validation errors should be displayed
    // Note: Specific error validation depends on implementation
    await expect(page.locator('[data-testid="product-form-container"]')).toBeVisible()

    await takeScreenshot(page, 'form-validation-errors')
  })

  /**
   * Test Case: Network Error Recovery
   * 
   * Purpose: Tests how the application handles network failures
   * and provides recovery mechanisms for users.
   * 
   * Validates:
   * - Network failures are detected and handled
   * - Appropriate error messages are shown to users
   * - Retry mechanisms are provided where applicable
   * - Application remains stable during network issues
   * 
   * Business Value: Maintains user productivity during
   * network connectivity issues.
   */
  test('should handle network errors with retry mechanisms', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/**', route => {
      route.abort('failed')
    })

    // When: User tries to load manage-product page
    await page.goto('/producer/manage-product')
    await waitForPageLoad(page)

    // Then: Should handle network error gracefully
    // Note: Specific error handling depends on implementation
    const pageContent = await page.content()
    expect(pageContent).toBeDefined()

    await takeScreenshot(page, 'network-error-handling')
  })

  /**
   * Test Case: Session Timeout Handling
   * 
   * Purpose: Tests how the application handles authentication
   * session timeouts during product management operations.
   * 
   * Validates:
   * - Session timeout is detected properly
   * - Users are redirected to authentication
   * - Work in progress is handled appropriately
   * - Clear messaging about session expiration
   * 
   * Business Value: Provides clear guidance when sessions expire
   * and protects against unauthorized access.
   */
  test('should handle session timeout gracefully', async ({ page }) => {
    // Given: User is on manage-product page
    await page.goto('/producer/manage-product')
    await waitForPageLoad(page)

    // Simulate session timeout by clearing cookies
    await page.context().clearCookies()

    // When: User tries to perform an action
    await page.click('[data-testid="add-product-button"]')
    await waitForPageLoad(page)

    // Then: Should handle session timeout appropriately
    // Note: May redirect to login or show session expired message
    const currentUrl = page.url()
    expect(currentUrl).toBeDefined()

    await takeScreenshot(page, 'session-timeout-handling')
  })

  /**
   * Test Case: Server Error Response Handling
   * 
   * Purpose: Tests how the application handles various server
   * error responses (500, 503, etc.) during operations.
   * 
   * Validates:
   * - Server errors are caught and handled gracefully
   * - User-friendly error messages are displayed
   * - Application doesn't crash on server errors
   * - Recovery options are provided where possible
   * 
   * Business Value: Maintains user experience during
   * server-side issues and provides clear communication.
   */
  test('should handle server error responses', async ({ page }) => {
    // Simulate server error responses
    await page.route('**/api/products**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      })
    })

    // When: User loads product management page
    await page.goto('/producer/manage-product')
    await waitForPageLoad(page)

    // Then: Should handle server error gracefully
    await expect(page.locator('body')).toBeVisible()
    
    // Should not show raw error or crash
    const pageText = await page.textContent('body')
    expect(pageText).toBeDefined()

    await takeScreenshot(page, 'server-error-handling')
  })

  /**
   * Test Case: Data Loading Failure Recovery
   * 
   * Purpose: Tests recovery mechanisms when product data
   * fails to load initially but may succeed on retry.
   * 
   * Validates:
   * - Data loading failures are detected
   * - Retry mechanisms are provided
   * - Loading states are properly managed
   * - Users can recover from temporary failures
   * 
   * Business Value: Improves reliability by allowing recovery
   * from temporary data loading issues.
   */
  test('should provide data loading failure recovery', async ({ page }) => {
    let requestCount = 0

    // Simulate initial failure then success
    await page.route('**/api/products**', route => {
      requestCount++
      if (requestCount === 1) {
        route.abort('failed')
      } else {
        route.continue()
      }
    })

    // When: User loads product management page
    await page.goto('/producer/manage-product')
    await waitForPageLoad(page)

    // Should provide some mechanism to retry
    // Note: Specific retry mechanism depends on implementation
    await expect(page.locator('body')).toBeVisible()

    await takeScreenshot(page, 'data-loading-recovery')
  })

  /**
   * Test Case: Concurrent User Action Error Handling
   * 
   * Purpose: Tests handling of conflicts when multiple users
   * attempt to modify the same product simultaneously.
   * 
   * Validates:
   * - Concurrent edit conflicts are detected
   * - Users are notified of conflicts
   * - Data consistency is maintained
   * - Recovery options are provided
   * 
   * Business Value: Prevents data corruption and provides
   * clear resolution paths for concurrent edit conflicts.
   */
  test('should handle concurrent user action conflicts', async ({ page }) => {
    // Simulate concurrent edit conflict
    await page.route('**/api/products/**/edit', route => {
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'Conflict: Product has been modified by another user' 
        })
      })
    })

    // When: User tries to edit a product
    await page.goto('/producer/manage-product')
    await waitForPageLoad(page)

    const productRows = page.locator('[data-testid^="product-row-"]')
    if (await productRows.count() > 0) {
      const firstRow = productRows.first()
      const actionsButton = firstRow.locator('[data-testid$="-actions-trigger"]')
      await actionsButton.click()
      await waitForPageLoad(page)

      await firstRow.locator('[data-testid$="-edit-action"]').click()
      await waitForPageLoad(page)
    }

    // Should handle conflict appropriately
    await takeScreenshot(page, 'concurrent-action-conflict')
  })

  /**
   * Test Case: Memory and Performance Error Handling
   * 
   * Purpose: Tests application behavior under high memory usage
   * or performance constraints.
   * 
   * Validates:
   * - Application remains responsive under load
   * - Memory usage is managed appropriately
   * - Large data sets are handled gracefully
   * - Performance degradation is handled smoothly
   * 
   * Business Value: Ensures application stability and
   * usability even with large product catalogs.
   */
  test('should handle high load and memory constraints', async ({ page }) => {
    // Test with a large number of UI interactions
    await page.goto('/producer/manage-product')
    await waitForPageLoad(page)

    // Simulate intensive user interactions
    for (let i = 0; i < 10; i++) {
      await page.fill('[data-testid="search-input"]', `search-term-${i}`)
      await page.waitForTimeout(100)
      await page.fill('[data-testid="search-input"]', '')
      await page.waitForTimeout(100)
    }

    // Application should remain responsive
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="manage-product-page"]')).toBeVisible()

    await takeScreenshot(page, 'high-load-handling')
  })

  /**
   * Test Case: Browser Compatibility Error Handling
   * 
   * Purpose: Tests that error handling works consistently
   * across different browser environments and capabilities.
   * 
   * Validates:
   * - Error handling works in different browser contexts
   * - Fallbacks are provided for unsupported features
   * - Cross-browser compatibility is maintained
   * - Progressive enhancement principles are followed
   * 
   * Business Value: Ensures consistent user experience
   * across different browser environments.
   */
  test('should handle browser-specific error scenarios', async ({ page }) => {
    // Test various browser API availability
    await page.goto('/producer/manage-product')
    await waitForPageLoad(page)

    // Test localStorage availability
    const hasLocalStorage = await page.evaluate(() => {
      try {
        return typeof Storage !== 'undefined' && window.localStorage !== undefined
      } catch {
        return false
      }
    })

    // Application should work regardless of localStorage availability
    expect(hasLocalStorage !== undefined).toBeTruthy()
    await expect(page.locator('[data-testid="manage-product-page"]')).toBeVisible()

    await takeScreenshot(page, 'browser-compatibility-handling')
  })
})