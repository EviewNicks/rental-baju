/**
 * End-to-End Tests for Penalty System with Playwright
 * Tests complete kasir workflow with flat 20k penalty and manual pricing
 */

import { test, expect, Page } from '@playwright/test'

// Test configuration
const KASIR_USER = {
  email: 'kasir@test.com',
  password: 'test123',
  role: 'kasir'
}

const TEST_TRANSACTION = {
  code: 'TR-2025-001',
  customerName: 'John Doe',
  items: [
    { name: 'Kebaya Tradisional', quantity: 3, modalAwal: 150000 },
    { name: 'Baju Adat', quantity: 2, modalAwal: 200000 }
  ]
}

// Helper functions
async function loginAsKasir(page: Page) {
  await page.goto('/auth/signin')

  await page.fill('[data-testid="email-input"]', KASIR_USER.email)
  await page.fill('[data-testid="password-input"]', KASIR_USER.password)
  await page.click('[data-testid="signin-button"]')

  // Wait for successful login redirect
  await page.waitForURL('/dashboard/**')
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
}

async function navigateToReturnPage(page: Page) {
  // Navigate to return processing page
  await page.click('[data-testid="returns-menu"]')
  await page.waitForLoadState('networkidle')

  // Should see return processing interface
  await expect(page.locator('[data-testid="return-page-title"]')).toBeVisible()
}

async function selectTransactionForReturn(page: Page, transactionCode: string) {
  // Search for transaction
  await page.fill('[data-testid="transaction-search"]', transactionCode)
  await page.press('[data-testid="transaction-search"]', 'Enter')

  // Wait for search results
  await page.waitForSelector('[data-testid="transaction-list"]')

  // Select the transaction
  await page.click(`[data-testid="transaction-${transactionCode}"]`)

  // Wait for transaction details to load
  await page.waitForSelector('[data-testid="transaction-details"]')
  await expect(page.locator('[data-testid="customer-name"]')).toContainText(TEST_TRANSACTION.customerName)
}

test.describe('Penalty System E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test data and login before each test
    await loginAsKasir(page)
  })

  test.describe('Flat 20k Late Penalty', () => {
    test('should apply flat 20k penalty for late return', async ({ page }) => {
      await navigateToReturnPage(page)
      await selectTransactionForReturn(page, TEST_TRANSACTION.code)

      // Start return process
      await page.click('[data-testid="start-return-button"]')

      // Set first item condition (on time, good condition)
      await page.selectOption('[data-testid="item-1-category-select"]', 'BAIK')
      await page.fill('[data-testid="item-1-description"]', 'Kondisi baik, dikembalikan tepat waktu')
      await page.fill('[data-testid="item-1-quantity"]', '3')

      // Set second item condition (on time, minor damage)
      await page.selectOption('[data-testid="item-2-category-select"]', 'RUSAK_RINGAN')
      await page.fill('[data-testid="item-2-description"]', 'Sedikit sobek di bagian lengan')
      await page.fill('[data-testid="item-2-quantity"]', '2')

      // Proceed to penalty calculation
      await page.click('[data-testid="proceed-to-penalty"]')
      await page.waitForSelector('[data-testid="penalty-summary"]')

      // Since this is a late return (based on test transaction dates)
      // Should see flat 20k late penalty + condition penalties
      const latePenalty = page.locator('[data-testid="late-penalty-amount"]')
      await expect(latePenalty).toContainText('Rp 20.000')

      const conditionPenalty = page.locator('[data-testid="condition-penalty-amount"]')
      await expect(conditionPenalty).toContainText('Rp 30.000') // 0 + 15k*2 items

      const totalPenalty = page.locator('[data-testid="total-penalty-amount"]')
      await expect(totalPenalty).toContainText('Rp 50.000')

      // Verify penalty breakdown is displayed
      await expect(page.locator('[data-testid="penalty-breakdown"]')).toBeVisible()
      await expect(page.locator('[data-testid="late-penalty-row"]')).toContainText('Keterlambatan')
      await expect(page.locator('[data-testid="condition-penalty-row"]')).toContainText('Kondisi Barang')
    })

    test('should show zero late penalty for on-time return', async ({ page }) => {
      // Mock early return scenario
      await page.route('**/api/kasir/penalty/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totalPenalty: 15000,
            flatLatePenalty: 0, // On time
            conditionPenalty: 15000,
            isLate: false
          })
        })
      })

      await navigateToReturnPage(page)
      await selectTransactionForReturn(page, TEST_TRANSACTION.code)

      await page.click('[data-testid="start-return-button"]')

      // Set conditions
      await page.selectOption('[data-testid="item-1-category-select"]', 'RUSAK_RINGAN')
      await page.fill('[data-testid="item-1-description"]', 'Sedikit rusak pada bagian kancing')
      await page.fill('[data-testid="item-1-quantity"]', '3')

      await page.click('[data-testid="proceed-to-penalty"]')
      await page.waitForSelector('[data-testid="penalty-summary"]')

      // Should show zero late penalty
      const latePenalty = page.locator('[data-testid="late-penalty-amount"]')
      await expect(latePenalty).toContainText('Rp 0')

      // Should still show condition penalty
      const conditionPenalty = page.locator('[data-testid="condition-penalty-amount"]')
      await expect(conditionPenalty).toContainText('Rp 15.000')

      // Total should be only condition penalty
      const totalPenalty = page.locator('[data-testid="total-penalty-amount"]')
      await expect(totalPenalty).toContainText('Rp 15.000')
    })
  })

  test.describe('Manual Pricing System', () => {
    test('should enable manual pricing for specific conditions', async ({ page }) => {
      await navigateToReturnPage(page)
      await selectTransactionForReturn(page, TEST_TRANSACTION.code)

      await page.click('[data-testid="start-return-button"]')

      // Select condition category first
      await page.selectOption('[data-testid="item-1-category-select"]', 'KOTOR')
      await page.fill('[data-testid="item-1-description"]', 'Noda khusus yang sulit dibersihkan')
      await page.fill('[data-testid="item-1-quantity"]', '3')

      // Enable manual pricing
      await page.click('[data-testid="item-1-manual-pricing-toggle"]')

      // Manual price input should be enabled
      const manualPriceInput = page.locator('[data-testid="item-1-manual-price"]')
      await expect(manualPriceInput).toBeEnabled()

      // Should show suggested price initially
      await expect(manualPriceInput).toHaveValue('5000') // KOTOR suggested price

      // Enter custom manual price
      await manualPriceInput.fill('8500')

      // Price summary should update to reflect manual pricing
      await expect(page.locator('[data-testid="item-1-price-summary"]')).toContainText('Rp 25.500') // 8500 * 3
      await expect(page.locator('[data-testid="item-1-pricing-mode"]')).toContainText('Manual')

      // Proceed to penalty calculation
      await page.click('[data-testid="proceed-to-penalty"]')
      await page.waitForSelector('[data-testid="penalty-summary"]')

      // Should reflect manual pricing in penalty breakdown
      const conditionPenalty = page.locator('[data-testid="condition-penalty-amount"]')
      await expect(conditionPenalty).toContainText('Rp 25.500')
    })

    test('should use automatic pricing when manual pricing is disabled', async ({ page }) => {
      await navigateToReturnPage(page)
      await selectTransactionForReturn(page, TEST_TRANSACTION.code)

      await page.click('[data-testid="start-return-button"]')

      // Select condition category
      await page.selectOption('[data-testid="item-1-category-select"]', 'RUSAK_BERAT')
      await page.fill('[data-testid="item-1-description"]', 'Kerusakan signifikan pada struktur')
      await page.fill('[data-testid="item-1-quantity"]', '2')

      // Manual pricing should be disabled by default
      const manualPricingToggle = page.locator('[data-testid="item-1-manual-pricing-toggle"]')
      await expect(manualPricingToggle).not.toBeChecked()

      // Manual price input should be disabled
      const manualPriceInput = page.locator('[data-testid="item-1-manual-price"]')
      await expect(manualPriceInput).toBeDisabled()

      // Should show automatic price
      await expect(manualPriceInput).toHaveValue('50000') // RUSAK_BERAT suggested price

      // Price summary should show automatic calculation
      await expect(page.locator('[data-testid="item-1-price-summary"]')).toContainText('Rp 100.000') // 50000 * 2
      await expect(page.locator('[data-testid="item-1-pricing-mode"]')).toContainText('Otomatis')
    })

    test('should handle lost items with modal awal pricing', async ({ page }) => {
      await navigateToReturnPage(page)
      await selectTransactionForReturn(page, TEST_TRANSACTION.code)

      await page.click('[data-testid="start-return-button"]')

      // Select lost item category
      await page.selectOption('[data-testid="item-1-category-select"]', 'HILANG')
      await page.fill('[data-testid="item-1-description"]', 'Item tidak dikembalikan oleh penyewa')
      await page.fill('[data-testid="item-1-quantity"]', '1')

      // For lost items, should automatically use modal awal
      const manualPriceInput = page.locator('[data-testid="item-1-manual-price"]')
      await expect(manualPriceInput).toHaveValue('150000') // Product modal awal

      // Price summary should show modal awal calculation
      await expect(page.locator('[data-testid="item-1-price-summary"]')).toContainText('Rp 150.000')
      await expect(page.locator('[data-testid="item-1-pricing-info"]')).toContainText('Modal Awal')

      // Enable manual pricing for custom lost item price
      await page.click('[data-testid="item-1-manual-pricing-toggle"]')
      await manualPriceInput.fill('120000') // Custom lost item penalty

      await expect(page.locator('[data-testid="item-1-price-summary"]')).toContainText('Rp 120.000')
    })
  })

  test.describe('Multi-Condition Scenarios', () => {
    test('should handle multiple conditions for single item', async ({ page }) => {
      await navigateToReturnPage(page)
      await selectTransactionForReturn(page, TEST_TRANSACTION.code)

      await page.click('[data-testid="start-return-button"]')

      // Set initial condition for partial quantity
      await page.selectOption('[data-testid="item-1-category-select"]', 'BAIK')
      await page.fill('[data-testid="item-1-description"]', 'Sebagian dalam kondisi baik')
      await page.fill('[data-testid="item-1-quantity"]', '2') // Only 2 out of 3

      // Should show suggestion to add condition for remaining quantity
      await expect(page.locator('[data-testid="add-condition-suggestion"]')).toBeVisible()
      await expect(page.locator('[data-testid="remaining-quantity-alert"]')).toContainText('1 unit tersisa')

      // Add second condition for remaining item
      await page.click('[data-testid="add-condition-button"]')

      // Second condition form should appear
      await expect(page.locator('[data-testid="item-1-condition-2"]')).toBeVisible()

      // Set second condition
      await page.selectOption('[data-testid="item-1-condition-2-category-select"]', 'KOTOR')
      await page.fill('[data-testid="item-1-condition-2-description"]', 'Sebagian kotor perlu pembersihan khusus')
      await page.fill('[data-testid="item-1-condition-2-quantity"]', '1')

      // Enable manual pricing for second condition
      await page.click('[data-testid="item-1-condition-2-manual-pricing-toggle"]')
      await page.fill('[data-testid="item-1-condition-2-manual-price"]', '7500')

      // Should show combined pricing summary
      await expect(page.locator('[data-testid="item-1-total-price"]')).toContainText('Rp 7.500') // 0 + 7500
      await expect(page.locator('[data-testid="item-1-condition-count"]')).toContainText('2 kondisi')

      // Remove second condition to test removal
      await page.click('[data-testid="item-1-condition-2-remove"]')
      await expect(page.locator('[data-testid="item-1-condition-2"]')).not.toBeVisible()
      await expect(page.locator('[data-testid="remaining-quantity-alert"]')).toContainText('1 unit tersisa')
    })

    test('should validate multi-condition quantity constraints', async ({ page }) => {
      await navigateToReturnPage(page)
      await selectTransactionForReturn(page, TEST_TRANSACTION.code)

      await page.click('[data-testid="start-return-button"]')

      // Set condition with quantity exceeding available
      await page.selectOption('[data-testid="item-1-category-select"]', 'BAIK')
      await page.fill('[data-testid="item-1-description"]', 'Test over-quantity scenario')
      await page.fill('[data-testid="item-1-quantity"]', '5') // More than available 3

      // Should show validation error
      await expect(page.locator('[data-testid="quantity-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="quantity-error"]')).toContainText('tidak boleh lebih dari 3')

      // Proceed button should be disabled
      await expect(page.locator('[data-testid="proceed-to-penalty"]')).toBeDisabled()

      // Fix the quantity
      await page.fill('[data-testid="item-1-quantity"]', '3')
      await expect(page.locator('[data-testid="quantity-error"]')).not.toBeVisible()
      await expect(page.locator('[data-testid="proceed-to-penalty"]')).toBeEnabled()
    })
  })

  test.describe('Complete Return Workflow', () => {
    test('should complete full return process with mixed pricing', async ({ page }) => {
      await navigateToReturnPage(page)
      await selectTransactionForReturn(page, TEST_TRANSACTION.code)

      await page.click('[data-testid="start-return-button"]')

      // Item 1: Automatic pricing
      await page.selectOption('[data-testid="item-1-category-select"]', 'RUSAK_RINGAN')
      await page.fill('[data-testid="item-1-description"]', 'Kerusakan ringan pada kancing')
      await page.fill('[data-testid="item-1-quantity"]', '3')

      // Item 2: Manual pricing
      await page.selectOption('[data-testid="item-2-category-select"]', 'KOTOR')
      await page.fill('[data-testid="item-2-description"]', 'Noda khusus memerlukan dry cleaning')
      await page.fill('[data-testid="item-2-quantity"]', '2')
      await page.click('[data-testid="item-2-manual-pricing-toggle"]')
      await page.fill('[data-testid="item-2-manual-price"]', '12000')

      // Proceed to penalty calculation
      await page.click('[data-testid="proceed-to-penalty"]')
      await page.waitForSelector('[data-testid="penalty-summary"]')

      // Verify penalty breakdown
      await expect(page.locator('[data-testid="total-penalty-amount"]')).toContainText('Rp 89.000') // 20k late + 45k item1 + 24k item2

      // Proceed to confirmation
      await page.click('[data-testid="proceed-to-confirmation"]')
      await page.waitForSelector('[data-testid="return-confirmation"]')

      // Add notes
      await page.fill('[data-testid="return-notes"]', 'Return processed with mixed automatic and manual pricing')

      // Confirm return
      await page.click('[data-testid="confirm-return-button"]')

      // Should see success message
      await expect(page.locator('[data-testid="return-success-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="return-success-message"]')).toContainText('berhasil diproses')

      // Should redirect back to dashboard or show summary
      await page.waitForSelector('[data-testid="return-summary"]')
      await expect(page.locator('[data-testid="processed-transaction-code"]')).toContainText(TEST_TRANSACTION.code)
    })

    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API error
      await page.route('**/api/kasir/return/**', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal server error during return processing'
          })
        })
      })

      await navigateToReturnPage(page)
      await selectTransactionForReturn(page, TEST_TRANSACTION.code)

      await page.click('[data-testid="start-return-button"]')

      // Set basic conditions
      await page.selectOption('[data-testid="item-1-category-select"]', 'BAIK')
      await page.fill('[data-testid="item-1-description"]', 'Test error handling')
      await page.fill('[data-testid="item-1-quantity"]', '3')

      await page.click('[data-testid="proceed-to-penalty"]')
      await page.click('[data-testid="proceed-to-confirmation"]')
      await page.click('[data-testid="confirm-return-button"]')

      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="error-message"]')).toContainText('kesalahan')

      // Should allow retry
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
    })
  })

  test.describe('Validation and Error Handling', () => {
    test('should validate required fields before proceeding', async ({ page }) => {
      await navigateToReturnPage(page)
      await selectTransactionForReturn(page, TEST_TRANSACTION.code)

      await page.click('[data-testid="start-return-button"]')

      // Try to proceed without filling conditions
      await page.click('[data-testid="proceed-to-penalty"]')

      // Should show validation errors
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('harus dipilih')

      // Fill partial information
      await page.selectOption('[data-testid="item-1-category-select"]', 'KOTOR')
      // Leave description empty
      await page.fill('[data-testid="item-1-quantity"]', '3')

      await page.click('[data-testid="proceed-to-penalty"]')

      // Should still show validation error for missing description
      await expect(page.locator('[data-testid="description-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="description-error"]')).toContainText('minimal 4 karakter')
    })

    test('should validate manual pricing when enabled', async ({ page }) => {
      await navigateToReturnPage(page)
      await selectTransactionForReturn(page, TEST_TRANSACTION.code)

      await page.click('[data-testid="start-return-button"]')

      // Set basic condition
      await page.selectOption('[data-testid="item-1-category-select"]', 'KOTOR')
      await page.fill('[data-testid="item-1-description"]', 'Valid description with manual pricing test')
      await page.fill('[data-testid="item-1-quantity"]', '3')

      // Enable manual pricing
      await page.click('[data-testid="item-1-manual-pricing-toggle"]')

      // Clear the manual price field
      await page.fill('[data-testid="item-1-manual-price"]', '')

      await page.click('[data-testid="proceed-to-penalty"]')

      // Should show manual pricing validation error
      await expect(page.locator('[data-testid="manual-price-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="manual-price-error"]')).toContainText('harus diisi')

      // Enter negative price
      await page.fill('[data-testid="item-1-manual-price"]', '-1000')

      await page.click('[data-testid="proceed-to-penalty"]')

      // Should show negative price validation error
      await expect(page.locator('[data-testid="manual-price-error"]')).toContainText('tidak boleh negatif')
    })
  })

  test.describe('Accessibility', () => {
    test('should be navigable with keyboard', async ({ page }) => {
      await navigateToReturnPage(page)
      await selectTransactionForReturn(page, TEST_TRANSACTION.code)

      await page.click('[data-testid="start-return-button"]')

      // Tab through form elements
      await page.press('body', 'Tab') // Category select
      await page.press('body', 'Tab') // Description input
      await page.press('body', 'Tab') // Quantity input
      await page.press('body', 'Tab') // Manual pricing toggle

      // Select category using keyboard
      await page.press('[data-testid="item-1-category-select"]', 'Space')
      await page.press('[data-testid="item-1-category-select"]', 'ArrowDown')
      await page.press('[data-testid="item-1-category-select"]', 'Enter')

      // Fill description using keyboard
      await page.press('[data-testid="item-1-description"]', 'Tab')
      await page.type('[data-testid="item-1-description"]', 'Keyboard navigation test')

      // All focusable elements should have proper focus indicators
      await expect(page.locator('[data-testid="item-1-description"]:focus')).toBeVisible()
    })

    test('should have proper ARIA labels and roles', async ({ page }) => {
      await navigateToReturnPage(page)
      await selectTransactionForReturn(page, TEST_TRANSACTION.code)

      await page.click('[data-testid="start-return-button"]')

      // Check for proper ARIA labels
      await expect(page.locator('[data-testid="item-1-category-select"]')).toHaveAttribute('aria-label')
      await expect(page.locator('[data-testid="item-1-description"]')).toHaveAttribute('aria-label')
      await expect(page.locator('[data-testid="item-1-manual-pricing-toggle"]')).toHaveAttribute('role', 'switch')

      // Check for form validation ARIA attributes
      await page.fill('[data-testid="item-1-quantity"]', '10') // Invalid quantity
      await expect(page.locator('[data-testid="item-1-quantity"]')).toHaveAttribute('aria-invalid', 'true')
    })
  })

  test.describe('Performance', () => {
    test('should load return interface within acceptable time', async ({ page }) => {
      const startTime = Date.now()

      await navigateToReturnPage(page)
      await selectTransactionForReturn(page, TEST_TRANSACTION.code)
      await page.click('[data-testid="start-return-button"]')

      // Wait for all form elements to be visible
      await page.waitForSelector('[data-testid="item-1-category-select"]')
      await page.waitForSelector('[data-testid="item-2-category-select"]')

      const loadTime = Date.now() - startTime

      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000)
    })

    test('should handle penalty calculation efficiently', async ({ page }) => {
      await navigateToReturnPage(page)
      await selectTransactionForReturn(page, TEST_TRANSACTION.code)

      await page.click('[data-testid="start-return-button"]')

      // Fill conditions
      await page.selectOption('[data-testid="item-1-category-select"]', 'KOTOR')
      await page.fill('[data-testid="item-1-description"]', 'Performance test condition')
      await page.fill('[data-testid="item-1-quantity"]', '3')

      const startTime = Date.now()

      // Proceed to penalty calculation
      await page.click('[data-testid="proceed-to-penalty"]')

      // Wait for penalty summary to appear
      await page.waitForSelector('[data-testid="penalty-summary"]')

      const calculationTime = Date.now() - startTime

      // Penalty calculation should complete within 2 seconds
      expect(calculationTime).toBeLessThan(2000)
    })
  })
})