# Task TSK-27: E2E Testing untuk Fitur Autentikasi dan Otorisasi

## Daftar Isi

1. [Pendahuluan](#pendahuluan)
2. [Batasan dan Penyederhanaan](#batasan-dan-penyederhanaan)
3. [Spesifikasi Teknis](#spesifikasi-teknis)
4. [Implementasi Teknis](#implementasi-teknis)
5. [Test Plan](#test-plan)
6. [Pertanyaan untuk Diklarifikasi](#pertanyaan-untuk-diklarifikasi)

## Pendahuluan

Sebagai tim QA, kami ingin memastikan bahwa fitur autentikasi dan otorisasi yang telah diimplementasikan dalam TSK-14 (Authentication System) dan TSK-15 (Role-Based Access Control) berfungsi dengan baik melalui testing end-to-end.

User story ini bertujuan untuk:

- Memvalidasi alur autentikasi lengkap (sign up, sign in, sign out) dari perspektif end user
- Memastikan sistem otorisasi berbasis peran bekerja dengan benar
- Memberikan confidence bahwa integrasi Clerk dengan aplikasi Next.js berjalan sesuai ekspektasi
- Menyediakan automated testing yang dapat dijalankan dalam CI/CD pipeline

Nilai bisnis yang dihasilkan adalah peningkatan kualitas produk dan pengurangan risiko bug pada fitur kritis autentikasi yang dapat berdampak pada user experience dan keamanan aplikasi.

## Batasan dan Penyederhanaan

1. **Fokus E2E Testing Saja**:
   - Tidak mencakup unit testing atau integration testing
   - Fokus pada user journey dan interaction flows
   - Testing dilakukan pada browser environment yang real

2. **Environment Testing**:
   - Testing menggunakan Clerk test mode untuk menghindari bot protection
   - Menggunakan test user accounts yang sudah dikonfigurasi
   - Tidak testing pada production environment

3. **Browser Coverage**:
   - Primary testing pada Chromium (Chrome)
   - Secondary testing pada Firefox dan WebKit (Safari) jika diperlukan
   - Mobile testing menggunakan device emulation

4. **Role Testing Scope**:
   - Testing terbatas pada 3 role utama: Admin, Creator, User
   - Tidak testing granular permissions dalam scope ini
   - Fokus pada route-level authorization

## Spesifikasi Teknis

### Struktur Data Testing

```typescript
// Test User Configuration
interface TestUser {
  email: string
  password: string
  role: 'admin' | 'creator' | 'user'
  expectedRoutes: string[]
  restrictedRoutes: string[]
}

// Test Scenarios
interface TestScenario {
  name: string
  description: string
  steps: TestStep[]
  expectedOutcome: string
}
```

### Flow Pengguna

#### 1. Sign Up Flow:

1. Pengguna mengakses halaman `/sign-up`
2. Pengguna mengisi form registrasi dengan email dan password
3. Pengguna mensubmit form
4. Sistem memproses registrasi melalui Clerk
5. Pengguna diarahkan ke halaman dashboard setelah berhasil

**Happy Path**:

- Registrasi berhasil dengan email valid dan password yang memenuhi kriteria
- Redirect ke dashboard dengan user session aktif

**Error Paths**:

- Email sudah terdaftar - menampilkan error message
- Password tidak memenuhi kriteria - menampilkan validation error
- Network error - menampilkan error handling yang graceful

#### 2. Sign In Flow:

1. Pengguna mengakses halaman `/sign-in`
2. Pengguna mengisi kredensial (email/password)
3. Pengguna mensubmit form
4. Sistem memvalidasi kredensial melalui Clerk
5. Pengguna diarahkan ke dashboard yang sesuai dengan role

**Happy Path**:

- Login berhasil dengan kredensial valid
- Redirect ke dashboard sesuai role (admin/creator/user)

**Error Paths**:

- Kredensial invalid - menampilkan error message
- Account tidak aktif - menampilkan appropriate error
- Rate limiting - menampilkan temporary block message

#### 3. Sign Out Flow:

1. Pengguna mengklik sign out button di navbar
2. Sistem memproses logout melalui Clerk
3. Session dihapus dan pengguna diarahkan ke homepage
4. Akses ke protected routes diblokir

**Happy Path**:

- Logout berhasil dan session cleared
- Redirect ke homepage
- Protected routes tidak dapat diakses

#### 4. Role-Based Authorization Flow:

1. Pengguna login dengan role tertentu
2. Pengguna mencoba mengakses berbagai routes
3. Sistem memvalidasi akses berdasarkan role
4. Authorized routes dapat diakses, unauthorized routes diblokir

**Happy Path**:

- Admin dapat mengakses semua routes (`/admin/*`, `/creator/*`, `/user/*`)
- Creator dapat mengakses creator dan user routes (`/creator/*`, `/user/*`)
- User hanya dapat mengakses user routes (`/user/*`)

**Error Paths**:

- Unauthorized access diarahkan ke `/unauthorized` page
- Proper error message ditampilkan

## Implementasi Teknis

### 1. Playwright Setup dan Konfigurasi

Mengintegrasikan Playwright dengan aplikasi Next.js dan konfigurasi Clerk testing:

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '__tests__/playwright',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
})
```

### 2. Clerk Testing Integration

Setup Clerk testing token dan helper functions:

```typescript
// global.setup.ts
import { clerkSetup } from '@clerk/testing/playwright'
import { test as setup } from '@playwright/test'

setup('global setup', async ({}) => {
  await clerkSetup()
})
```

### API Endpoints

Tidak ada API endpoints baru yang dibuat, menggunakan Clerk API dan existing application routes:

1. **Clerk Authentication API** - Untuk sign up, sign in, sign out operations
2. **Application Routes** - Untuk testing route-based authorization
   - `/sign-up` - Sign up page
   - `/sign-in` - Sign in page
   - `/dashboard` - Protected dashboard
   - `/admin/*` - Admin routes
   - `/creator/*` - Creator routes
   - `/user/*` - User routes
   - `/unauthorized` - Unauthorized access page

## Test Plan

### 1. E2E Testing (BDD)

#### Pendekatan:

- Menggunakan format Given-When-Then (BDD)
- Implementasi dengan Playwright + Clerk testing helpers
- Target: Complete user journeys dari perspektif end user
- Browser testing pada Chromium, Firefox, dan WebKit

#### Test Scenarios:

**1. User Registration Flow**:

- **Given**: User berada di halaman sign up
- **When**: User mengisi form registrasi dengan data valid dan submit
- **Then**: User berhasil terdaftar dan diarahkan ke dashboard

**2. User Authentication Flow**:

- **Given**: User memiliki account yang valid
- **When**: User login dengan kredensial yang benar
- **Then**: User berhasil login dan dapat mengakses dashboard

**3. User Sign Out Flow**:

- **Given**: User sedang dalam keadaan logged in
- **When**: User mengklik sign out button
- **Then**: User berhasil logout dan diarahkan ke homepage

**4. Admin Authorization Flow**:

- **Given**: User login sebagai admin
- **When**: User mengakses admin routes
- **Then**: User dapat mengakses semua admin features

**5. Creator Authorization Flow**:

- **Given**: User login sebagai creator
- **When**: User mengakses creator dan admin routes
- **Then**: User dapat mengakses creator routes tapi diblokir dari admin routes

**6. User Authorization Flow**:

- **Given**: User login sebagai regular user
- **When**: User mengakses various routes
- **Then**: User hanya dapat mengakses user routes

**7. Unauthorized Access Flow**:

- **Given**: User tidak memiliki akses ke route tertentu
- **When**: User mencoba mengakses unauthorized route
- **Then**: User diarahkan ke unauthorized page dengan error message

**8. Session Persistence Flow**:

- **Given**: User sudah login
- **When**: User refresh page atau navigate
- **Then**: User session tetap aktif dan tidak perlu login ulang

## Pertanyaan untuk Diklarifikasi

1. Apakah perlu testing pada mobile devices secara real atau cukup dengan device emulation?
2. Apakah ada specific browser versions yang harus di-support untuk testing?
3. Bagaimana handling test data cleanup setelah test execution?
4. Apakah perlu performance testing untuk authentication flows?
5. Bagaimana setup CI/CD environment untuk running E2E tests?

## Referensi

1. [Clerk Testing with Playwright - Overview](https://clerk.com/docs/testing/playwright/overview)
2. [Clerk Testing - Test Helpers](https://clerk.com/docs/testing/playwright/test-helpers)
3. [Clerk Testing - Authenticated Flows](https://clerk.com/docs/testing/playwright/test-authenticated-flows)
4. [Playwright Best Practices](https://playwright.dev/docs/best-practices)
5. [Next.js Testing Documentation](https://nextjs.org/docs/14/app/building-your-application)
6. [PR TSK-14: Authentication System Implementation](docs/PR/PR_TSK_14.md)
7. [PR TSK-15: Role-Based Access Control Implementation](docs/PR/PR_TSK_15.md)
