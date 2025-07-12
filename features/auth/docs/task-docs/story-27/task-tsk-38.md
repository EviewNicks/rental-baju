# Task TSK-38: Mengintegrasikan Playwright dengan Aplikasi

## Daftar Isi

1. [Pendahuluan](#pendahuluan)
2. [Batasan dan Penyederhanaan](#batasan-dan-penyederhanaan)
3. [Spesifikasi Teknis](#spesifikasi-teknis)
4. [Implementasi Teknis](#implementasi-teknis)
5. [Test Plan](#test-plan)

## Pendahuluan

Task ini bertujuan untuk mengintegrasikan Playwright sebagai framework E2E testing dalam aplikasi Maguru. Integrasi ini merupakan fondasi untuk menjalankan automated testing pada fitur autentikasi dan otorisasi yang menggunakan Clerk.

Tujuan utama task ini:

- Setup Playwright framework dalam proyek Next.js
- Konfigurasi environment testing yang kompatibel dengan Clerk
- Memastikan Playwright dapat berjalan di development dan CI/CD environment
- Verifikasi setup dengan menjalankan test dasar

Nilai bisnis yang dihasilkan adalah tersedianya infrastructure testing yang reliable untuk memastikan kualitas fitur autentikasi dan otorisasi, serta menyediakan foundation untuk automated testing di masa depan.

## Batasan dan Penyederhanaan

1. **Fokus Setup dan Konfigurasi**:
   - Tidak mencakup penulisan test cases yang kompleks
   - Fokus pada integration dan configuration
   - Verifikasi dengan basic smoke test saja

2. **Browser Support**:
   - Primary support untuk Chromium (Chrome)
   - Optional support untuk Firefox dan WebKit
   - Mobile testing menggunakan device emulation

3. **Environment Compatibility**:
   - Kompatibilitas dengan Clerk test mode
   - Setup untuk development environment
   - Persiapan untuk CI/CD integration (tanpa implementasi penuh)

4. **Dependency Management**:
   - Menggunakan existing package manager (yarn)
   - Minimal additional dependencies
   - Kompatibilitas dengan existing project structure

## Spesifikasi Teknis

### Struktur Konfigurasi

```typescript
// playwright.config.ts
interface PlaywrightConfig {
  testDir: string
  timeout: number
  fullyParallel: boolean
  forbidOnly: boolean
  retries: number
  workers: number
  reporter: string[]
  use: {
    baseURL: string
    trace: string
    screenshot: string
    video: string
  }
  projects: ProjectConfig[]
}

// Environment Variables
interface TestEnvironment {
  CLERK_PUBLISHABLE_KEY: string
  CLERK_SECRET_KEY: string
  CLERK_TESTING_TOKEN?: string
  BASE_URL: string
  CI: boolean
}
```

### Flow Setup

#### 1. Installation Flow:

1. Install Playwright dan dependencies
2. Initialize Playwright configuration
3. Setup browser binaries
4. Verify installation dengan basic test

#### 2. Configuration Flow:

1. Buat playwright.config.ts dengan proper settings
2. Setup test directories structure
3. Configure environment variables
4. Setup global setup dan teardown

#### 3. Clerk Integration Flow:

1. Install @clerk/testing package
2. Configure Clerk testing helpers
3. Setup testing token management
4. Verify Clerk integration dengan basic auth test

#### 4. Verification Flow:

1. Run basic smoke test
2. Verify browser launching
3. Test application accessibility
4. Validate Clerk authentication flow

## Implementasi Teknis

### 1. Package Installation

Install Playwright dan dependencies yang diperlukan:

```bash
# Install Playwright
yarn add -D @playwright/test

# Install Clerk testing helpers
yarn add -D @clerk/testing

# Install browser binaries
npx playwright install
```

### 2. Playwright Configuration

Setup konfigurasi Playwright untuk proyek:

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: '__tests__/playwright',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
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
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },
  ],
})
```

### 3. Directory Structure

Setup struktur direktori untuk E2E tests:

```
__tests__/
└── playwright/
   ├── auth/
   │   ├── auth.setup.ts
   │   ├── sign-up.spec.ts
   │   ├── sign-in.spec.ts
   │   └── sign-out.spec.ts
   └── authorization/
    │       ├── admin.spec.ts
    │       ├── creator.spec.ts
    │       └── user.spec.ts
    ├── fixtures/
    │   └── test-users.ts
    ├── utils/
    │   └── test-helpers.ts
    └── global.setup.ts
```

### 4. Clerk Testing Integration

Setup Clerk testing helpers:

```typescript
// __tests__/playwright/global.setup.ts
import { clerkSetup } from '@clerk/testing/playwright'
import { test as setup } from '@playwright/test'

setup.describe.configure({ mode: 'serial' })

setup('global setup', async ({}) => {
  await clerkSetup()
})
```

### 5. Environment Configuration

Setup environment variables untuk testing:

```bash
# .env.test
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### 6. Package.json Scripts

Tambahkan scripts untuk menjalankan E2E tests:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:report": "playwright show-report"
  }
}
```

### API Endpoints

Tidak ada API endpoints baru yang dibuat untuk task ini. Testing akan menggunakan existing application routes dan Clerk API.

## Referensi

1. [Playwright Installation Guide](https://playwright.dev/docs/intro)
2. [Playwright Configuration](https://playwright.dev/docs/test-configuration)
3. [Clerk Testing with Playwright - Overview](https://clerk.com/docs/testing/playwright/overview)
4. [Next.js Testing Documentation](https://nextjs.org/docs/14/app/building-your-application)
5. [Playwright Best Practices](https://playwright.dev/docs/best-practices)
6. [Playwright CI/CD Integration](https://playwright.dev/docs/ci)
