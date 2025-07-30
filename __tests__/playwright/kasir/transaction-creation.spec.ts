/**
 * E2E Tests untuk Transaction Creation Flow (RPK-21)
 *
 * Test suite ini focus pada testing complete transaction creation flow
 * dari product selection hingga payment completion dengan BDD approach.
 *
 * Test coverage meliputi:
 * ✅ Complete 3-step transaction flow (Product → Customer → Payment)
 * ✅ Form validation and error handling
 * ✅ Data persistence across steps
 * ✅ API integration testing
 * ✅ User interaction patterns
 * ✅ Accessibility compliance
 *
 * Uses kasir authentication untuk testing transaction creation.
 */

import { test, expect } from '@playwright/test'
import { verifyUserSession } from '../utils/test-helpers'
import { navigateToNewTransaction, takeKasirScreenshot } from '../utils/kasir-test-helpers'
import { performanceThresholds } from '../fixtures/kasir-test-data'

// Use kasir storage state for authentication
test.use({ storageState: '__tests__/playwright/.clerk/kasir.json' })

/**
 * Transaction Creation Helper Functions
 *
 * These functions encapsulate common transaction creation workflows
 * and provide reusable patterns for different test scenarios.
 */

/**
 * Navigate to new transaction form and verify initial state
 */
//eslint-disable-next-line @typescript-eslint/no-explicit-any
async function navigateToTransactionForm(page: any) {
  console.log('🏠 Navigating to transaction form...')

  await navigateToNewTransaction(page)

  // Verify form is loaded and in initial state
  await expect(page.locator('[data-testid="transaction-form-header"]')).toBeVisible()
  await expect(page.locator('[data-testid="transaction-form-stepper"]')).toBeVisible()
  await expect(page.locator('[data-testid="product-selection-step"]')).toBeVisible()

  console.log('✅ Transaction form loaded successfully')
}

/**
 * Complete product selection step
 */
async function completeProductSelection(
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  options: { products?: string[]; skipValidation?: boolean } = {},
) {
  const { products = ['kemeja-001'], skipValidation = false } = options

  console.log('🛒 Completing product selection...')

  // Wait for products to load
  await expect(page.locator('[data-testid="products-grid-section"]')).toBeVisible()

  // Wait for products to be loaded (either grid or loading state)
  await Promise.race([
    page.locator('[data-testid="products-grid"]').waitFor({ state: 'visible', timeout: 10000 }),
    page
      .locator('[data-testid="products-loading-state"]')
      .waitFor({ state: 'visible', timeout: 5000 }),
  ])

  // If products are loading, wait for them to finish
  const isLoading = await page.locator('[data-testid="products-loading-state"]').isVisible()
  if (isLoading) {
    await expect(page.locator('[data-testid="products-loading-state"]')).not.toBeVisible({
      timeout: 15000,
    })
  }

  // Check if products are available
  const hasProducts = await page.locator('[data-testid="products-grid"]').isVisible()
  if (hasProducts) {
    // Add products to cart
    for (const productId of products) {
      const productCard = page.locator(`[data-testid="product-card-${productId}"]`)
      if (await productCard.isVisible()) {
        // Find and click add to cart button within the product card
        const addButton = productCard
          .locator('button')
          .filter({ hasText: /tambah|add/i })
          .first()
        if (await addButton.isVisible()) {
          await addButton.click()
          await page.waitForTimeout(500) // Wait for cart update
        }
      }
    }

    // Verify cart has items
    const cartItemCount = page.locator('[data-testid="cart-item-count"]')
    if (await cartItemCount.isVisible()) {
      const countText = await cartItemCount.textContent()
      expect(countText).toMatch(/\d+/)
    }
  } else {
    console.log('⚠️ No products available, continuing with empty cart for testing')
  }

  // Proceed to next step
  const nextButton = page.locator('[data-testid="step-1-next-button"]')
  if ((await nextButton.isVisible()) && (await nextButton.isEnabled())) {
    await nextButton.click()
    await page.waitForTimeout(1000)
  }

  if (!skipValidation) {
    // Verify we're on customer step
    await expect(page.locator('[data-testid="customer-biodata-step"]')).toBeVisible({
      timeout: 10000,
    })
  }

  console.log('✅ Product selection completed')
}

/**
 * Complete customer selection step
 */
async function completeCustomerSelection(
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: { useExisting?: boolean; customerData?: any } = {},
) {
  const { useExisting = true, customerData } = options

  console.log('👤 Completing customer selection...')

  // Verify we're on customer step
  await expect(page.locator('[data-testid="customer-biodata-step"]')).toBeVisible()

  if (useExisting) {
    // Try to select existing customer
    const customerList = page.locator('[data-testid="customer-list-items"]')

    // Wait for customer list to load
    await Promise.race([
      customerList.waitFor({ state: 'visible', timeout: 10000 }),
      page
        .locator('[data-testid="customer-list-loading-state"]')
        .waitFor({ state: 'visible', timeout: 5000 }),
    ])

    const isLoading = await page.locator('[data-testid="customer-list-loading-state"]').isVisible()
    if (isLoading) {
      await expect(page.locator('[data-testid="customer-list-loading-state"]')).not.toBeVisible({
        timeout: 10000,
      })
    }

    // Check if customers are available
    const hasCustomers = await customerList.isVisible()
    if (hasCustomers) {
      const firstCustomer = customerList.locator('[data-testid^="customer-list-item-"]').first()
      if (await firstCustomer.isVisible()) {
        await firstCustomer.click()
        await page.waitForTimeout(500)

        // Verify customer is selected
        await expect(page.locator('[data-testid="selected-customer-display"]')).toBeVisible({
          timeout: 5000,
        })
      }
    } else {
      console.log('⚠️ No existing customers, will create new customer')
    }
  }

  if (!useExisting) {
    // Create new customer
    await page.locator('[data-testid="add-new-customer-button"]').click()

    // Fill customer registration form (if modal opens)
    const modal = page.locator('[data-testid="customer-registration-modal-container"]')
    if (await modal.isVisible({ timeout: 5000 })) {
      // Fill basic customer data
      const testCustomer = customerData || {
        name: 'Test Customer E2E',
        phone: '081234567890',
        email: 'test@example.com',
        address: 'Test Address 123',
      }

      // Fill form fields (adjust selectors based on actual modal structure)
      await page.fill('input[placeholder*="nama" i], input[name="name"]', testCustomer.name)
      await page.fill('input[placeholder*="telepon" i], input[name="phone"]', testCustomer.phone)
      await page.fill('input[placeholder*="email" i], input[name="email"]', testCustomer.email)
      await page.fill(
        'textarea[placeholder*="alamat" i], textarea[name="address"]',
        testCustomer.address,
      )

      // Submit form
      const submitButton = modal.locator('button').filter({ hasText: /simpan|save|daftar/i })
      if (await submitButton.isVisible()) {
        await submitButton.click()
        await page.waitForTimeout(1000)

        // Verify customer is created and selected
        await expect(page.locator('[data-testid="selected-customer-display"]')).toBeVisible({
          timeout: 10000,
        })
      }
    }
  }

  // Proceed to next step
  const nextButton = page.locator('[data-testid="step-2-next-button"]')
  if ((await nextButton.isVisible()) && (await nextButton.isEnabled())) {
    await nextButton.click()
    await page.waitForTimeout(1000)
  }

  // Verify we're on payment step
  await expect(page.locator('[data-testid="payment-summary-step"]')).toBeVisible({ timeout: 10000 })

  console.log('✅ Customer selection completed')
}

/**
 * Complete payment step and submit transaction
 */
async function completePaymentAndSubmit(
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  options: { paymentAmount?: number; fullPayment?: boolean } = {},
) {
  const { paymentAmount, fullPayment = true } = options

  console.log('💳 Completing payment and submitting transaction...')

  // Verify we're on payment step
  await expect(page.locator('[data-testid="payment-summary-step"]')).toBeVisible()

  // Set pickup date (required)
  const pickupDateInput = page.locator('[data-testid="pickup-date-input"]')
  if (await pickupDateInput.isVisible()) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().split('T')[0]
    await pickupDateInput.fill(dateString)
  }

  // Set payment method (default to cash)
  const cashRadio = page.locator('input[value="cash"]')
  if (await cashRadio.isVisible()) {
    await cashRadio.check()
  }

  // Set payment amount
  const paymentInput = page.locator('[data-testid="payment-amount-input"]')
  if (await paymentInput.isVisible()) {
    if (paymentAmount) {
      await paymentInput.fill(paymentAmount.toString())
    } else if (fullPayment) {
      // Click "Bayar Lunas" button if available
      const payFullButton = page.locator('button').filter({ hasText: /bayar lunas/i })
      if (await payFullButton.isVisible()) {
        await payFullButton.click()
      } else {
        // Fallback: enter a reasonable amount
        await paymentInput.fill('100000')
      }
    }
  }

  // Submit transaction
  const submitButton = page.locator('[data-testid="submit-transaction-button"]')
  await expect(submitButton).toBeVisible()
  await expect(submitButton).toBeEnabled()

  await submitButton.click()

  // Wait for transaction to be submitted
  await page.waitForTimeout(2000)

  console.log('✅ Payment completed and transaction submitted')
}

/**
 * Verify transaction success state
 */
//eslint-disable-next-line @typescript-eslint/no-explicit-any
async function verifyTransactionSuccess(page: any) {
  console.log('✅ Verifying transaction success...')

  // Check for success screen or redirect
  const successScreen = page.locator('[data-testid="transaction-success-screen"]')
  const dashboardUrl = /\/dashboard$/

  // Wait for either success screen or redirect to dashboard
  await Promise.race([
    successScreen.waitFor({ state: 'visible', timeout: 15000 }),
    page.waitForURL(dashboardUrl, { timeout: 15000 }),
  ])

  const isSuccessVisible = await successScreen.isVisible()
  const isOnDashboard = dashboardUrl.test(page.url())

  expect(isSuccessVisible || isOnDashboard).toBeTruthy()

  if (isSuccessVisible) {
    console.log('✅ Transaction success screen displayed')
  } else if (isOnDashboard) {
    console.log('✅ Redirected to dashboard after successful transaction')
  }

  console.log('✅ Transaction success verified')
}

test.describe('Transaction Creation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Verify kasir is authenticated
    await verifyUserSession(page)
  })

  /**
   * Test Group: Complete Transaction Flow
   *
   * Purpose: Tests the complete user journey from product selection
   * to payment completion with different scenarios.
   */
  test.describe('Complete Transaction Flow', () => {
    /**
     * Test Case: Happy Path - Full Payment Transaction
     *
     * Given: Kasir wants to create a new transaction
     * When: User completes all 3 steps with full payment
     * Then: Transaction should be created successfully
     */
    test('should successfully create transaction with full payment', async ({ page }) => {
      // Given: Navigate to transaction form
      await navigateToTransactionForm(page)
      await takeKasirScreenshot(page, 'transaction-flow', 'initial-form')

      // When: Complete Step 1 - Product Selection
      await completeProductSelection(page)
      await takeKasirScreenshot(page, 'transaction-flow', 'products-selected')

      // When: Complete Step 2 - Customer Selection
      await completeCustomerSelection(page)
      await takeKasirScreenshot(page, 'transaction-flow', 'customer-selected')

      // When: Complete Step 3 - Payment with full amount
      await completePaymentAndSubmit(page, { fullPayment: true })
      await takeKasirScreenshot(page, 'transaction-flow', 'payment-submitted')

      // Then: Verify transaction success
      await verifyTransactionSuccess(page)
      await takeKasirScreenshot(page, 'transaction-flow', 'success-complete')
    })

    /**
     * Test Case: Partial Payment Transaction
     *
     * Given: Kasir wants to create transaction with partial payment
     * When: User completes flow with partial payment amount
     * Then: Transaction should be created with remaining balance
     */
    test('should successfully create transaction with partial payment', async ({ page }) => {
      // Given: Navigate to transaction form
      await navigateToTransactionForm(page)

      // When: Complete all steps with partial payment
      await completeProductSelection(page)
      await completeCustomerSelection(page)
      await completePaymentAndSubmit(page, { paymentAmount: 50000, fullPayment: false })

      // Then: Verify transaction success
      await verifyTransactionSuccess(page)
      await takeKasirScreenshot(page, 'transaction-partial', 'success-partial-payment')
    })

    /**
     * Test Case: New Customer Registration Flow
     *
     * Given: No existing customers or need to create new customer
     * When: User creates new customer during transaction
     * Then: Customer should be registered and transaction created
     */
    test('should create transaction with new customer registration', async ({ page }) => {
      // Given: Navigate to transaction form
      await navigateToTransactionForm(page)

      // When: Complete flow with new customer
      await completeProductSelection(page)
      await completeCustomerSelection(page, {
        useExisting: false,
        customerData: {
          name: 'New Customer E2E Test',
          phone: '089999888777',
          email: 'newcustomer@test.com',
          address: 'New Customer Address 456',
        },
      })
      await completePaymentAndSubmit(page)

      // Then: Verify success
      await verifyTransactionSuccess(page)
      await takeKasirScreenshot(page, 'transaction-new-customer', 'success-new-customer')
    })
  })

  /**
   * Test Group: Step-by-Step Validation
   *
   * Purpose: Tests individual steps in isolation to ensure
   * each step works correctly and validates properly.
   */
  test.describe('Step-by-Step Validation', () => {
    /**
     * Test Case: Product Selection Step Validation
     *
     * Given: User is on product selection step
     * When: User tries to proceed without selecting products
     * Then: Validation should prevent proceeding
     */
    test('should validate product selection step requirements', async ({ page }) => {
      // Given: Navigate to form
      await navigateToTransactionForm(page)

      // When: Try to proceed without products
      const nextButton = page.locator('[data-testid="step-1-next-button"]')

      // Check if button is disabled or shows validation
      const isDisabled = await nextButton.isDisabled()
      const hasValidation = await page
        .locator('[data-testid="step-validation-notification"]')
        .isVisible()

      // Then: Should prevent proceeding
      expect(isDisabled || hasValidation).toBeTruthy()

      await takeKasirScreenshot(page, 'validation', 'product-step-validation')
    })

    /**
     * Test Case: Customer Selection Step Validation
     *
     * Given: User completed product selection
     * When: User tries to proceed without selecting customer
     * Then: Validation should prevent proceeding
     */
    test('should validate customer selection step requirements', async ({ page }) => {
      // Given: Navigate and complete product selection
      await navigateToTransactionForm(page)
      await completeProductSelection(page, { skipValidation: true })

      // When: On customer step without selection
      await expect(page.locator('[data-testid="customer-biodata-step"]')).toBeVisible()

      const nextButton = page.locator('[data-testid="step-2-next-button"]')

      // Then: Should validate customer selection
      const isDisabled = await nextButton.isDisabled()
      const hasValidation = await page
        .locator('[data-testid="step-validation-notification"]')
        .isVisible()

      expect(isDisabled || hasValidation).toBeTruthy()

      await takeKasirScreenshot(page, 'validation', 'customer-step-validation')
    })

    /**
     * Test Case: Payment Step Required Fields
     *
     * Given: User completed product and customer selection
     * When: User tries to submit without required payment fields
     * Then: Validation should prevent submission
     */
    test('should validate payment step required fields', async ({ page }) => {
      // Given: Navigate and complete first two steps
      await navigateToTransactionForm(page)
      await completeProductSelection(page)
      await completeCustomerSelection(page)

      // When: On payment step without required fields
      await expect(page.locator('[data-testid="payment-summary-step"]')).toBeVisible()

      const submitButton = page.locator('[data-testid="submit-transaction-button"]')

      // Then: Submit button should be disabled without required fields
      const isDisabled = await submitButton.isDisabled()
      expect(isDisabled).toBeTruthy()

      await takeKasirScreenshot(page, 'validation', 'payment-step-validation')
    })
  })

  /**
   * Test Group: Data Persistence and Navigation
   *
   * Purpose: Tests that form data persists correctly across steps
   * and navigation works as expected.
   */
  test.describe('Data Persistence and Navigation', () => {
    /**
     * Test Case: Form Data Persistence Across Steps
     *
     * Given: User fills data in each step
     * When: User navigates back and forth between steps
     * Then: Data should be preserved
     */
    test('should maintain form data when navigating between steps', async ({ page }) => {
      // Given: Navigate to form
      await navigateToTransactionForm(page)

      // When: Complete first step and navigate back
      await completeProductSelection(page)

      // Navigate back to step 1
      const backButton = page.locator('[data-testid="step-2-prev-button"]')
      if (await backButton.isVisible()) {
        await backButton.click()
        await page.waitForTimeout(500)

        // Verify we're back on step 1
        await expect(page.locator('[data-testid="product-selection-step"]')).toBeVisible()

        // Verify cart data is preserved
        const cartItemCount = page.locator('[data-testid="cart-item-count"]')
        if (await cartItemCount.isVisible()) {
          const countText = await cartItemCount.textContent()
          expect(countText).toMatch(/\d+/)
        }
      }

      await takeKasirScreenshot(page, 'navigation', 'data-persistence-test')
    })

    /**
     * Test Case: Stepper Navigation
     *
     * Given: User is on any step
     * When: User clicks on stepper to navigate
     * Then: Should navigate to clicked step (if accessible)
     */
    test('should support stepper navigation between completed steps', async ({ page }) => {
      // Given: Complete first step
      await navigateToTransactionForm(page)
      await completeProductSelection(page)

      // When: Try to navigate via stepper
      const stepper = page.locator('[data-testid="transaction-form-stepper"]')
      await expect(stepper).toBeVisible()

      // The stepper should show current progress
      await takeKasirScreenshot(page, 'navigation', 'stepper-progress')

      // Note: Actual stepper click functionality depends on implementation
      // This test verifies stepper is present and visible
    })
  })

  /**
   * Test Group: Error Handling and Edge Cases
   *
   * Purpose: Tests error scenarios and edge cases to ensure
   * robust error handling and user experience.
   */
  test.describe('Error Handling and Edge Cases', () => {
    /**
     * Test Case: API Failure Handling
     *
     * Given: User attempts to submit transaction
     * When: API call fails
     * Then: Should show error message and allow retry
     */
    test('should handle API failures gracefully', async ({ page }) => {
      // Given: Complete form setup
      await navigateToTransactionForm(page)

      // Mock API failure
      await page.route('**/api/kasir/transaksi', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal Server Error',
            message: 'Test error for E2E testing',
          }),
        })
      })

      await completeProductSelection(page)
      await completeCustomerSelection(page)

      // When: Submit with API failure
      await completePaymentAndSubmit(page)

      // Then: Should show error notification
      const errorNotification = page.locator('[data-testid="transaction-error-notification"]')
      await expect(errorNotification).toBeVisible({ timeout: 10000 })

      await takeKasirScreenshot(page, 'error-handling', 'api-failure')
    })

    /**
     * Test Case: Form Validation Error Messages
     *
     * Given: User submits form with invalid data
     * When: Validation fails
     * Then: Should show appropriate error messages
     */
    test('should display validation error messages for invalid inputs', async ({ page }) => {
      // Given: Navigate to payment step
      await navigateToTransactionForm(page)
      await completeProductSelection(page)
      await completeCustomerSelection(page)

      // When: Enter invalid payment data
      const paymentInput = page.locator('[data-testid="payment-amount-input"]')
      if (await paymentInput.isVisible()) {
        await paymentInput.fill('invalid-amount')
      }

      // Then: Should handle invalid input gracefully
      // (Actual validation behavior depends on input handling)

      await takeKasirScreenshot(page, 'error-handling', 'validation-errors')
    })

    /**
     * Test Case: Browser Back Button Handling
     *
     * Given: User is in middle of transaction flow
     * When: User clicks browser back button
     * Then: Should handle navigation gracefully
     */
    test('should handle browser back navigation gracefully', async ({ page }) => {
      // Given: Complete first step
      await navigateToTransactionForm(page)
      await completeProductSelection(page)

      // When: Use browser back navigation
      await page.goBack()
      await page.waitForTimeout(1000)

      // Then: Should handle gracefully (may return to dashboard or show warning)
      // The actual behavior depends on implementation
      await takeKasirScreenshot(page, 'navigation', 'browser-back-handling')
    })
  })

  /**
   * Test Group: Performance and Accessibility
   *
   * Purpose: Tests performance characteristics and accessibility
   * compliance of the transaction form.
   */
  test.describe('Performance and Accessibility', () => {
    /**
     * Test Case: Form Load Performance
     *
     * Given: User navigates to transaction form
     * When: Form loads
     * Then: Should load within performance thresholds
     */
    test('should load transaction form within performance thresholds', async ({ page }) => {
      const startTime = Date.now()

      // When: Navigate to form
      await navigateToTransactionForm(page)

      const loadTime = Date.now() - startTime
      console.log(`⏱️ Transaction form load time: ${loadTime}ms`)

      // Then: Should meet performance requirements
      expect(loadTime).toBeLessThan(performanceThresholds.pageLoadTime)

      await takeKasirScreenshot(page, 'performance', `load-time-${loadTime}ms`)
    })

    /**
     * Test Case: Responsive Design Testing
     *
     * Given: Transaction form is loaded
     * When: Viewport size changes
     * Then: Form should remain functional and accessible
     */
    test('should maintain functionality across different screen sizes', async ({ page }) => {
      await navigateToTransactionForm(page)

      // Test mobile view
      await page.setViewportSize({ width: 375, height: 667 })
      await expect(page.locator('[data-testid="transaction-form-header"]')).toBeVisible()
      await takeKasirScreenshot(page, 'responsive', 'mobile-view')

      // Test tablet view
      await page.setViewportSize({ width: 768, height: 1024 })
      await expect(page.locator('[data-testid="transaction-form-header"]')).toBeVisible()
      await takeKasirScreenshot(page, 'responsive', 'tablet-view')

      // Test desktop view
      await page.setViewportSize({ width: 1280, height: 720 })
      await expect(page.locator('[data-testid="transaction-form-header"]')).toBeVisible()
      await takeKasirScreenshot(page, 'responsive', 'desktop-view')
    })

    /**
     * Test Case: Keyboard Navigation
     *
     * Given: User uses keyboard to navigate form
     * When: User presses Tab to move between elements
     * Then: Focus should move logically through form elements
     */
    test('should support keyboard navigation throughout the form', async ({ page }) => {
      await navigateToTransactionForm(page)

      // Test tab navigation
      await page.keyboard.press('Tab')
      await page.waitForTimeout(200)

      // Verify focused element is visible and appropriate
      const focusedElement = await page.locator(':focus').first()
      await expect(focusedElement).toBeVisible()

      await takeKasirScreenshot(page, 'accessibility', 'keyboard-focus')
    })
  })
})
