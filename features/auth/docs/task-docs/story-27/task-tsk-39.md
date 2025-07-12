# Task TSK-39: Menulis Test Case untuk Sign Up, Sign In, Sign Out

## Daftar Isi

1. [Pendahuluan](#pendahuluan)
2. [Batasan dan Penyederhanaan](#batasan-dan-penyederhanaan)
3. [Spesifikasi Teknis](#spesifikasi-teknis)
4. [Implementasi Teknis](#implementasi-teknis)
5. [Test Plan](#test-plan)

## Pendahuluan

Task ini bertujuan untuk membuat comprehensive E2E test cases untuk alur autentikasi dasar aplikasi Maguru yang mencakup sign up, sign in, dan sign out. Test cases ini akan memvalidasi bahwa integrasi Clerk dengan aplikasi Next.js berfungsi dengan benar dari perspektif end user.

Tujuan utama task ini:

- Membuat test cases yang comprehensive untuk alur autentikasi
- Memastikan semua skenario (happy path dan error path) tercover
- Validasi integrasi Clerk authentication dengan UI aplikasi
- Menyediakan automated testing yang dapat dijalankan dalam CI/CD

Nilai bisnis yang dihasilkan adalah confidence bahwa fitur autentikasi core aplikasi bekerja dengan benar, mengurangi risiko bug pada user journey yang kritikal, dan memastikan user experience yang konsisten.

## Batasan dan Penyederhanaan

1. **Fokus Authentication Flow**:
   - Hanya mencakup sign up, sign in, dan sign out
   - Tidak mencakup advanced features seperti password reset, social login
   - Tidak mencakup multi-factor authentication

2. **Test Data Management**:
   - Menggunakan test user accounts yang sudah dikonfigurasi
   - Cleanup otomatis setelah test execution
   - Tidak testing dengan real production data

3. **Error Scenarios**:
   - Cover error scenarios utama (invalid credentials, network errors)
   - Tidak cover semua edge cases yang sangat spesifik
   - Fokus pada error handling yang user-facing

4. **Browser Testing**:
   - Primary testing pada Chromium
   - Optional testing pada Firefox dan WebKit
   - Mobile testing menggunakan device emulation

## Spesifikasi Teknis

### Struktur Test Data

```typescript
// Test User Types
interface TestUser {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

// Test Scenarios
interface AuthTestScenario {
  name: string
  description: string
  testUser: TestUser
  expectedOutcome: 'success' | 'error'
  expectedRedirect?: string
  expectedError?: string
}

// Page Objects
interface AuthPageObjects {
  signUpPage: SignUpPageObject
  signInPage: SignInPageObject
  dashboardPage: DashboardPageObject
  homePage: HomePageObject
}
```

### Flow Pengguna

#### 1. Sign Up Flow:

1. User navigasi ke halaman `/sign-up`
2. User mengisi form registrasi (email, password, confirm password)
3. User submit form registrasi
4. Sistem memproses registrasi melalui Clerk
5. User diarahkan ke dashboard atau sign-in page
6. Verifikasi user session aktif

**Happy Path**:

- Email valid dan belum terdaftar
- Password memenuhi kriteria keamanan
- Form submission berhasil
- Redirect ke dashboard dengan session aktif

**Error Paths**:

- Email sudah terdaftar - error message ditampilkan
- Password tidak memenuhi kriteria - validation error
- Email format invalid - validation error
- Network timeout - graceful error handling

#### 2. Sign In Flow:

1. User navigasi ke halaman `/sign-in`
2. User mengisi form login (email, password)
3. User submit form login
4. Sistem memvalidasi kredensial melalui Clerk
5. User diarahkan ke dashboard sesuai role
6. Verifikasi user session dan data user

**Happy Path**:

- Kredensial valid dan account aktif
- Login berhasil dengan session creation
- Redirect ke appropriate dashboard
- User data tersedia di client

**Error Paths**:

- Email tidak terdaftar - error message
- Password salah - error message
- Account inactive - appropriate error
- Rate limiting - temporary block message

#### 3. Sign Out Flow:

1. User dalam keadaan logged in
2. User klik sign out button (navbar atau user menu)
3. Sistem memproses logout melalui Clerk
4. Session dihapus dan cookies cleared
5. User diarahkan ke homepage
6. Verifikasi akses ke protected routes diblokir

**Happy Path**:

- Logout berhasil dengan session cleanup
- Redirect ke homepage
- Protected routes tidak dapat diakses
- UI state updated (navbar, user menu)

**Error Paths**:

- Network error during logout - graceful handling
- Session already expired - appropriate handling

## Implementasi Teknis

### 1. Test Data Setup

Setup test users dan data yang diperlukan:

```typescript
// __tests__/playwright/fixtures/test-users.ts
export const testUsers = {
  validUser: {
    email: 'test.user@maguru.test',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
  },
  existingUser: {
    email: 'existing.user@maguru.test',
    password: 'ExistingPassword123!',
  },
  invalidUser: {
    email: 'invalid-email',
    password: '123',
  },
}
```

### 2. Page Object Models

Implementasi Page Object pattern untuk maintainable tests:

```typescript
// __tests__/playwright/pages/SignUpPage.ts
export class SignUpPage {
  constructor(private page: Page) {}

  async navigateToSignUp() {
    await this.page.goto('/sign-up')
  }

  async fillSignUpForm(user: TestUser) {
    await this.page.fill('[data-testid="email-input"]', user.email)
    await this.page.fill('[data-testid="password-input"]', user.password)
    if (user.firstName) {
      await this.page.fill('[data-testid="first-name-input"]', user.firstName)
    }
  }

  async submitForm() {
    await this.page.click('[data-testid="sign-up-button"]')
  }

  async getErrorMessage() {
    return await this.page.textContent('[data-testid="error-message"]')
  }
}
```

### 3. Test Helper Functions

Utility functions untuk common operations:

```typescript
// __tests__/playwright/utils/auth-helpers.ts
export async function waitForAuthRedirect(page: Page, expectedUrl: string) {
  await page.waitForURL(expectedUrl, { timeout: 10000 })
}

export async function verifyUserSession(page: Page) {
  // Verify user session is active
  const userButton = page.locator('[data-testid="user-button"]')
  await expect(userButton).toBeVisible()
}

export async function cleanupTestUser(email: string) {
  // Cleanup test user after test completion
  // Implementation depends on Clerk API
}
```

### 4. Test Implementation Structure

```typescript
// __tests__/playwright/e2e/auth/sign-up.spec.ts
import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { SignUpPage } from '../../pages/SignUpPage'
import { testUsers } from '../../fixtures/test-users'

test.describe('Sign Up Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('successful sign up with valid data', async ({ page }) => {
    const signUpPage = new SignUpPage(page)

    // Given
    await signUpPage.navigateToSignUp()

    // When
    await signUpPage.fillSignUpForm(testUsers.validUser)
    await signUpPage.submitForm()

    // Then
    await waitForAuthRedirect(page, '/dashboard')
    await verifyUserSession(page)
  })

  test('sign up with existing email shows error', async ({ page }) => {
    const signUpPage = new SignUpPage(page)

    // Given
    await signUpPage.navigateToSignUp()

    // When
    await signUpPage.fillSignUpForm(testUsers.existingUser)
    await signUpPage.submitForm()

    // Then
    const errorMessage = await signUpPage.getErrorMessage()
    expect(errorMessage).toContain('already exists')
  })
})
```

### API Endpoints

Test akan menggunakan existing Clerk API dan application routes:

1. **Clerk Authentication API** - Sign up, sign in, sign out operations
2. **Application Routes**:
   - `/sign-up` - Sign up page
   - `/sign-in` - Sign in page
   - `/dashboard` - Protected dashboard (redirect target)
   - `/` - Homepage (sign out redirect target)

## Test Plan

### 3. E2E Testing (BDD)

#### Pendekatan:

- Menggunakan format Given-When-Then (BDD)
- Implementasi dengan Playwright + Clerk testing helpers
- Page Object Model untuk maintainable test code
- Comprehensive coverage untuk happy path dan error scenarios

#### Test Scenarios:

**1. Successful Sign Up Flow**:

- **Given**: User berada di halaman sign up dan menggunakan email yang belum terdaftar
- **When**: User mengisi form dengan data valid dan submit
- **Then**: User berhasil terdaftar dan diarahkan ke dashboard dengan session aktif

**2. Sign Up with Existing Email**:

- **Given**: User berada di halaman sign up
- **When**: User mengisi form dengan email yang sudah terdaftar
- **Then**: Error message ditampilkan dan user tetap di halaman sign up

**3. Sign Up with Invalid Data**:

- **Given**: User berada di halaman sign up
- **When**: User mengisi form dengan data invalid (email format salah, password lemah)
- **Then**: Validation error ditampilkan untuk field yang bermasalah

**4. Successful Sign In Flow**:

- **Given**: User memiliki account valid dan berada di halaman sign in
- **When**: User mengisi kredensial yang benar dan submit
- **Then**: User berhasil login dan diarahkan ke dashboard dengan session aktif

**5. Sign In with Invalid Credentials**:

- **Given**: User berada di halaman sign in
- **When**: User mengisi kredensial yang salah dan submit
- **Then**: Error message ditampilkan dan user tetap di halaman sign in

**6. Sign In with Non-existent Account**:

- **Given**: User berada di halaman sign in
- **When**: User mengisi email yang tidak terdaftar
- **Then**: Error message ditampilkan tentang account tidak ditemukan

**7. Successful Sign Out Flow**:

- **Given**: User sudah login dan berada di dashboard
- **When**: User klik sign out button
- **Then**: User berhasil logout, diarahkan ke homepage, dan session dihapus

**8. Sign Out from Multiple Pages**:

- **Given**: User sudah login dan navigasi ke berbagai halaman
- **When**: User klik sign out dari halaman manapun
- **Then**: Sign out berhasil dari semua halaman dan redirect konsisten

**9. Session Persistence Test**:

- **Given**: User sudah login
- **When**: User refresh page atau buka tab baru
- **Then**: User session tetap aktif dan tidak perlu login ulang

**10. Protected Route Access After Sign Out**:

- **Given**: User sudah logout
- **When**: User mencoba mengakses protected routes
- **Then**: User diarahkan ke sign in page

## Referensi

1. [Clerk Testing with Playwright - Overview](https://clerk.com/docs/testing/playwright/overview)
2. [Clerk Testing - Test Helpers](https://clerk.com/docs/testing/playwright/test-helpers)
3. [Clerk Testing - Authenticated Flows](https://clerk.com/docs/testing/playwright/test-authenticated-flows)
4. [Playwright Page Object Model](https://playwright.dev/docs/pom)
5. [Playwright Best Practices](https://playwright.dev/docs/best-practices)
6. [BDD Testing with Playwright](https://playwright.dev/docs/test-fixtures)
7. [PR TSK-14: Authentication System Implementation](docs/PR/PR_TSK_14.md)
