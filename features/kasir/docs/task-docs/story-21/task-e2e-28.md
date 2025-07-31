# Task E2E-28: End-to-End Testing untuk Fitur Pendaftaran Penyewa dan Transaksi Penyewaan

## Daftar Isi

1. [Pendahuluan](#pendahuluan)
2. [Test Strategy & Approach](#test-strategy--approach)
3. [Test Scenarios & Cases](#test-scenarios--cases)
4. [Test Environment Setup](#test-environment-setup)
5. [Test Implementation](#test-implementation)
6. [Data Management](#data-management)
7. [Performance & Accessibility Testing](#performance--accessibility-testing)
8. [Reporting & CI Integration](#reporting--ci-integration)
9. [Maintenance & Updates](#maintenance--updates)

## Pendahuluan

Task ini bertujuan untuk mengimplementasikan comprehensive end-to-end testing untuk fitur pendaftaran penyewa dan transaksi penyewaan menggunakan Playwright. Testing akan mencakup complete user journey dari authentication, pendaftaran penyewa baru, pemilihan produk, hingga pembuatan transaksi dengan kode unik.

E2E tests ini akan memastikan bahwa integrasi antara frontend (task-fe-27), backend (task-be-26), dan UI design (task-ui-25) berfungsi dengan baik dalam realistic user scenarios, termasuk edge cases dan error handling yang proper.

## Test Strategy & Approach

### Testing Philosophy

- **User-Centric Testing**: Test dari perspektif end-user (kasir) dengan realistic workflows
- **Business Value Focused**: Prioritize test cases yang critical untuk business operations
- **Cross-Browser Coverage**: Ensure compatibility across major browsers
- **Mobile-First**: Test responsive behavior dan touch interactions
- **Performance Aware**: Include performance assertions dalam test scenarios

### Test Pyramid Strategy

1. **Happy Path Tests**: Core functionality yang must work (80% focus)
2. **Edge Case Tests**: Boundary conditions dan error scenarios (15% focus)
3. **Integration Tests**: Cross-system interactions dan data flow (5% focus)

### BDD Approach

Menggunakan Gherkin-style scenarios untuk clear test documentation:
```gherkin
Feature: Pendaftaran Penyewa dan Transaksi Penyewaan
  As a kasir
  I want to register new customers and create rental transactions
  So that I can efficiently process rental requests
```

## Test Scenarios & Cases

### Primary Test Scenarios

#### Scenario 1: Happy Path - Complete Rental Process
```gherkin
Given I am logged in as a kasir
When I navigate to the rental page
And I fill in valid customer registration data
And I select available products for rental
And I confirm the transaction details
Then a new transaction should be created with unique code
And the customer data should be saved in the database
And I should see the transaction confirmation screen
```

#### Scenario 2: Form Validation Testing
```gherkin
Given I am on the customer registration form
When I submit the form with missing required fields
Then I should see validation error messages
And the form should not be submitted
And the error messages should be user-friendly
```

#### Scenario 3: Product Availability Testing
```gherkin
Given I have registered a customer
When I try to select products that are unavailable
Then the system should prevent selection
And show clear availability status
And suggest alternative products if available
```

#### Scenario 4: Error Handling Testing
```gherkin
Given I am in the middle of creating a transaction
When the backend API becomes unavailable
Then the system should show appropriate error messages
And provide options to retry or save draft
And maintain form data for recovery
```

### Detailed Test Cases

#### Authentication & Authorization Tests
- **TC-001**: Valid kasir login successful
- **TC-002**: Invalid credentials rejected
- **TC-003**: Unauthorized role access prevention
- **TC-004**: Session timeout handling
- **TC-005**: Multi-tab session management

#### Customer Registration Tests  
- **TC-006**: Valid customer data registration
- **TC-007**: Duplicate phone number prevention
- **TC-008**: Invalid phone format rejection
- **TC-009**: Optional fields handling (email, NIK)
- **TC-010**: Form auto-save functionality
- **TC-011**: Long text input handling

#### Product Selection Tests
- **TC-012**: Available products display correctly
- **TC-013**: Product search functionality
- **TC-014**: Category filtering works
- **TC-015**: Quantity selection validation
- **TC-016**: Duration selection (rental period)
- **TC-017**: Price calculation accuracy
- **TC-018**: Multiple product selection
- **TC-019**: Product removal from selection

#### Transaction Creation Tests
- **TC-020**: Successful transaction creation
- **TC-021**: Unique transaction code generation
- **TC-022**: Price calculation verification
- **TC-023**: Transaction summary accuracy
- **TC-024**: Database persistence verification
- **TC-025**: Transaction status handling

#### UI/UX Behavior Tests
- **TC-026**: Responsive design on mobile devices
- **TC-027**: Loading states display properly
- **TC-028**: Error messages are user-friendly
- **TC-029**: Success feedback is clear
- **TC-030**: Navigation between steps works
- **TC-031**: Back button behavior
- **TC-032**: Form data persistence across navigation

## Test Environment Setup

### Playwright Configuration

```typescript
// playwright.config.ts for kasir feature
export default defineConfig({
  testDir: './__tests__/playwright/kasir',
  fullyParallel: false, // Sequential for data consistency
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
```

### Test Database Setup

- **Test Database**: Separate database untuk testing dengan realistic data
- **Seeding**: Consistent test data setup dengan known products dan users
- **Cleanup**: Automated cleanup setelah each test run
- **Isolation**: Each test gets fresh database state

### Environment Variables

```env
# Test environment configuration
TEST_DATABASE_URL="postgresql://test:test@localhost:5432/rental_test"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
TEST_ADMIN_EMAIL="admin@test.com"
TEST_ADMIN_PASSWORD="test123"
```

## Test Implementation

### Page Object Model Structure

```typescript
// page-objects/kasir/RentalPage.ts
export class RentalPage {
  constructor(private page: Page) {}
  
  // Customer Registration
  async fillCustomerForm(customerData: CustomerData) {
    await this.page.fill('[data-testid="customer-name"]', customerData.nama);
    await this.page.fill('[data-testid="customer-phone"]', customerData.telepon);
    await this.page.fill('[data-testid="customer-address"]', customerData.alamat);
  }
  
  async submitCustomerForm() {
    await this.page.click('[data-testid="submit-customer"]');
    await this.page.waitForSelector('[data-testid="product-selection"]');
  }
  
  // Product Selection
  async selectProduct(productName: string, quantity: number = 1, duration: number = 1) {
    await this.page.click(`[data-testid="product-${productName}"]`);
    await this.page.fill('[data-testid="quantity-input"]', quantity.toString());
    await this.page.fill('[data-testid="duration-input"]', duration.toString());
    await this.page.click('[data-testid="add-to-cart"]');
  }
  
  // Transaction
  async confirmTransaction() {
    await this.page.click('[data-testid="confirm-transaction"]');
    await this.page.waitForSelector('[data-testid="transaction-success"]');
  }
  
  async getTransactionCode(): Promise<string> {
    return await this.page.textContent('[data-testid="transaction-code"]');
  }
}
```

### Test Helpers & Utilities

```typescript
// test-helpers/kasir-helpers.ts
export class KasirTestHelpers {
  static generateTestCustomer(): CustomerData {
    return {
      nama: `Test Customer ${Date.now()}`,
      telepon: `081${Math.random().toString().substr(2, 9)}`,
      alamat: 'Jl. Test No. 123, Jakarta',
      email: `test${Date.now()}@example.com`
    };
  }
  
  static async loginAsKasir(page: Page) {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', process.env.TEST_ADMIN_EMAIL);
    await page.fill('[data-testid="password"]', process.env.TEST_ADMIN_PASSWORD);
    await page.click('[data-testid="login-button"]');
    await page.waitForSelector('[data-testid="kasir-dashboard"]');
  }
  
  static async cleanupTestData(customerPhone: string) {
    // Database cleanup logic
  }
}
```

### Core Test Implementation

```typescript
// __tests__/playwright/kasir/rental-process.spec.ts
test.describe('Kasir Rental Process', () => {
  let rentalPage: RentalPage;
  let customerData: CustomerData;
  
  test.beforeEach(async ({ page }) => {
    rentalPage = new RentalPage(page);
    customerData = KasirTestHelpers.generateTestCustomer();
    
    // Login as kasir
    await KasirTestHelpers.loginAsKasir(page);
    await page.goto('/kasir/rental');
  });
  
  test.afterEach(async () => {
    // Cleanup test data
    await KasirTestHelpers.cleanupTestData(customerData.telepon);
  });
  
  test('Complete rental process - Happy Path', async ({ page }) => {
    // Customer Registration
    await rentalPage.fillCustomerForm(customerData);
    await rentalPage.submitCustomerForm();
    
    // Product Selection  
    await rentalPage.selectProduct('Kemeja Batik', 1, 3);
    await rentalPage.selectProduct('Celana Formal', 1, 3);
    
    // Transaction Confirmation
    await rentalPage.confirmTransaction();
    
    // Verification
    const transactionCode = await rentalPage.getTransactionCode();
    expect(transactionCode).toMatch(/^TXN-\d{8}-\d{3}$/);
    
    // Verify in database
    const customer = await db.penyewa.findUnique({
      where: { telepon: customerData.telepon }
    });
    expect(customer).toBeTruthy();
    expect(customer.nama).toBe(customerData.nama);
    
    const transaction = await db.transaksi.findUnique({
      where: { kode: transactionCode },
      include: { items: true }
    });
    expect(transaction).toBeTruthy();
    expect(transaction.items).toHaveLength(2);
  });
  
  test('Form validation prevents invalid submission', async ({ page }) => {
    // Submit empty form
    await page.click('[data-testid="submit-customer"]');
    
    // Verify validation errors
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="phone-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="address-error"]')).toBeVisible();
    
    // Form should not proceed
    await expect(page.locator('[data-testid="product-selection"]')).not.toBeVisible();
  });
  
  test('Duplicate phone number prevention', async ({ page }) => {
    // Create customer first
    await rentalPage.fillCustomerForm(customerData);
    await rentalPage.submitCustomerForm();
    await rentalPage.selectProduct('Kemeja Batik', 1, 1);
    await rentalPage.confirmTransaction();
    
    // Try to create another customer dengan same phone
    await page.goto('/kasir/rental');
    await rentalPage.fillCustomerForm({
      ...customerData,
      nama: 'Different Name'
    });
    await page.click('[data-testid="submit-customer"]');
    
    // Should show duplicate error
    await expect(page.locator('[data-testid="phone-duplicate-error"]')).toBeVisible();
  });
});
```

## Data Management

### Test Data Strategy

**Static Test Data**:
- Predefined products dengan known IDs dan properties
- Test user accounts dengan different roles
- Reference data (categories, statuses, etc.)

**Dynamic Test Data**:
- Generated customer data dengan unique identifiers
- Random product selections untuk variety
- Timestamp-based transaction codes

### Database Seeding

```typescript
// test-setup/seed-test-data.ts
export async function seedTestData() {
  // Create test products
  await db.produk.createMany({
    data: [
      {
        id: 'prod-001',
        nama: 'Kemeja Batik',
        kategori: 'formal',
        hargaSewa: 50000,
        status: 'available'
      },
      {
        id: 'prod-002', 
        nama: 'Celana Formal',
        kategori: 'formal',
        hargaSewa: 40000,
        status: 'available'
      }
      // ... more test products
    ]
  });
  
  // Create test kasir account
  await createTestUser({
    email: 'kasir@test.com',
    role: 'kasir'
  });
}
```

### Data Cleanup Strategy

- **Per-Test Cleanup**: Remove test-specific data after each test
- **Suite Cleanup**: Reset database state after test suite completion
- **Orphan Cleanup**: Remove any leftover test data from failed tests
- **Backup Restoration**: Restore from clean backup if needed

## Performance & Accessibility Testing

### Performance Testing

**Lighthouse Integration**:
```typescript
test('Performance benchmarks', async ({ page }) => {
  await page.goto('/kasir/rental');
  
  // Run Lighthouse audit
  const lighthouse = await playAudit({
    page,
    thresholds: {
      performance: 85,
      accessibility: 95,
      'best-practices': 85,
      seo: 85,
    },
  });
  
  expect(lighthouse.lhr.categories.performance.score * 100).toBeGreaterThan(85);
});
```

**Load Time Testing**:
- Initial page load < 3 seconds
- Form submission response < 2 seconds  
- Product search results < 1 second
- Transaction creation < 2 seconds

### Accessibility Testing

**Automated A11y Testing**:
```typescript
test('Accessibility compliance', async ({ page }) => {
  await page.goto('/kasir/rental');
  
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

**Manual A11y Test Cases**:
- Keyboard navigation through entire form
- Screen reader compatibility testing
- Color contrast verification
- Focus management testing
- ARIA labels validation

## Reporting & CI Integration

### Test Reporting

**HTML Reports**: Comprehensive test results dengan screenshots dan traces
**JUnit XML**: Integration dengan CI/CD systems
**Custom Reports**: Business-friendly summaries untuk stakeholders
**Failure Analysis**: Detailed failure logs dengan debugging information

### CI/CD Integration

```yaml
# .github/workflows/e2e-kasir.yml
name: E2E Tests - Kasir Feature

on:
  pull_request:
    paths:
      - 'features/kasir/**'
      - 'app/api/kasir/**'
  
jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_DB: rental_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup test database
        run: npm run test:db:setup
      
      - name: Run E2E tests
        run: npm run test:e2e:kasir
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: e2e-test-results
          path: test-results/
```

## Maintenance & Updates

### Test Maintenance Strategy

**Regular Updates**:
- Update test data ketika business rules change
- Sync dengan UI changes dari design updates
- Validate test stability dengan new browser versions
- Performance benchmark updates

**Test Review Process**:
- Monthly review untuk identify flaky tests
- Quarterly update untuk improve test coverage
- Annual review untuk optimize test suite performance
- Continuous monitoring untuk test execution times

### Documentation Updates

- Update test scenarios ketika features change
- Maintain test data documentation
- Keep environment setup instructions current
- Document known issues dan workarounds

## Acceptance Criteria

| Kriteria E2E Testing                                    | Status | Keterangan |
| ------------------------------------------------------- | ------ | ---------- |
| Complete rental flow test (registration → transaction)  |        |            |
| Form validation testing untuk all input fields         |        |            |
| Error handling scenarios covered                       |        |            |
| Cross-browser testing (Chrome, Firefox, Safari)       |        |            |
| Mobile responsive testing                              |        |            |
| Performance testing dengan Lighthouse integration     |        |            |
| Accessibility testing dengan axe-core                 |        |            |
| Database integration verification                      |        |            |
| Test data cleanup automation                           |        |            |
| CI/CD integration dengan automated runs               |        |            |
| HTML test reports generation                          |        |            |
| Test coverage minimal 80% untuk critical user paths   |        |            |

---

**Task ID**: RPK-28  
**Story**: RPK-21 - Sebagai kasir, saya ingin mendaftarkan penyewa baru dan membuat transaksi penyewaan agar proses sewa dapat dimulai  
**Type**: E2E Testing Task  
**Priority**: Medium  
**Estimated Effort**: 4 hours  
**Dependencies**: 
- **UI Implementation**: [task-ui-25.md](task-ui-25.md) - Design specifications untuk test selectors
- **Backend API**: [task-be-26.md](task-be-26.md) - API endpoints untuk integration testing  
- **Frontend Implementation**: [task-fe-27.md](task-fe-27.md) - Complete UI implementation untuk testing