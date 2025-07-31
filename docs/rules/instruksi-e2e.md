---
description: 
globs: 
alwaysApply: false
---
# Panduan E2E Testing dengan Playwright - Proyek Maguru

## Daftar Isi

1. [Pendahuluan](mdc:#pendahuluan)
2. [Setup dan Instalasi](mdc:#setup-dan-instalasi)
3. [Struktur Folder E2E Test](mdc:#struktur-folder-e2e-test)
4. [Menjalankan E2E Test](mdc:#menjalankan-e2e-test)
5. [Debugging E2E Test](mdc:#debugging-e2e-test)
6. [Membaca Test Report](mdc:#membaca-test-report)
7. [Best Practices](mdc:#best-practices)
8. [Troubleshooting](mdc:#troubleshooting)
9. [CI/CD Integration](mdc:#cicd-integration)

---

## Pendahuluan

Dokumen ini menjelaskan cara menggunakan Playwright untuk E2E testing di proyek Maguru. Playwright adalah framework testing modern yang mendukung multiple browser (Chromium, Firefox, WebKit) dan menyediakan tools debugging yang powerful.

### Mengapa Playwright?

- **Cross-browser testing**: Mendukung semua browser modern
- **Reliable testing**: Auto-wait dan retry mechanism
- **Powerful debugging**: Trace viewer, screenshots, videos
- **CI/CD friendly**: Headless mode dan parallelization
- **Modern architecture**: Built untuk aplikasi modern (SPA, PWA)

---

## Setup dan Instalasi

### 1. Verifikasi Instalasi

```bash
# Cek versi Playwright
yarn playwright --version

# Cek browser yang terinstall
yarn playwright install --dry-run
```

### 2. Install Browser (Jika Belum)

```bash
# Install semua browser
yarn playwright install

# Install hanya Chromium (untuk CI)
yarn playwright install chromium --with-deps
```

### 3. Verifikasi Konfigurasi

```bash
# Validasi konfigurasi Playwright
yarn playwright test --list
```

---

## Struktur Folder E2E Test

```
__tests__/playwright/
├── smoke.spec.ts                    # Smoke tests
├── global.setup.ts                  # Global setup untuk semua test
├── utils/                           # Shared utilities
│   └── test-helpers.ts              # Helper functions
├── fixtures/                        # Test data dan fixtures
│   └── test-users.ts                # User data untuk testing
├── auth/                            # Authentication E2E tests
│   ├── sign-in.spec.ts
│   ├── sign-up.spec.ts
│   └── sign-out.spec.ts
├── authorization/                   # Authorization E2E tests
│   ├── role-access.spec.ts
│   └── permissions.spec.ts
└── features/                        # Feature-specific tests
    ├── manage-module/
    └── user-profile/
```

### Konvensi Penamaan

- **Test files**: `*.spec.ts`
- **Helper files**: `*-helpers.ts`
- **Fixture files**: `*-fixtures.ts` atau `test-*.ts`
- **Page objects**: `*Page.ts` (jika menggunakan Page Object Model)

---

## Menjalankan E2E Test

### 1. Command Dasar

```bash
# Menjalankan semua E2E test
yarn test:e2e:all

# Menjalankan E2E test untuk fitur tertentu (auth)
yarn test:e2e

# Menjalankan test spesifik
yarn playwright test smoke.spec.ts

# Menjalankan test dengan pattern
yarn playwright test --grep "sign-in"
```

### 2. Mode Eksekusi

```bash
# Headless mode (default)
yarn test:e2e:all

# Headed mode (dengan browser UI)
yarn playwright test --headed

# UI mode (interactive)
yarn test:e2e:ui

# Debug mode
yarn test:e2e:debug
```

### 3. Browser Selection

```bash
# Menjalankan di browser tertentu
yarn playwright test --project=chromium
yarn playwright test --project=firefox
yarn playwright test --project=webkit

# Menjalankan di semua browser
yarn playwright test --project=chromium --project=firefox
```

### 4. Parallel Execution

```bash
# Menjalankan dengan worker tertentu
yarn playwright test --workers=2

# Menjalankan secara serial
yarn playwright test --workers=1

# Sharding untuk CI
yarn playwright test --shard=1/3
```

---

## Debugging E2E Test

### 1. Debug Mode

```bash
# Debug semua test
yarn test:e2e:debug

# Debug test spesifik
yarn playwright test auth/sign-in.spec.ts --debug

# Debug test pada line tertentu
yarn playwright test auth/sign-in.spec.ts:25 --debug
```

**Fitur Debug Mode:**

- **Step-by-step execution**: Jalankan test satu langkah demi satu
- **Live editing**: Edit locator dan lihat hasilnya real-time
- **Inspector**: Inspect element dan DOM
- **Console**: Akses browser console

### 2. UI Mode (Recommended)

```bash
# Buka Playwright UI
yarn test:e2e:ui
```

**Fitur UI Mode:**

- **Visual test runner**: Lihat semua test dalam UI
- **Time travel debugging**: Lihat setiap step test
- **Watch mode**: Auto-rerun test saat file berubah
- **Trace viewer**: Integrated trace viewer

### 3. Trace Debugging

```bash
# Generate trace untuk semua test
yarn playwright test --trace on

# Generate trace hanya untuk test yang gagal
yarn playwright test --trace retain-on-failure

# Buka trace viewer
yarn playwright show-trace test-results/[test-name]/trace.zip
```

### 4. Screenshot dan Video

```bash
# Ambil screenshot untuk semua test
yarn playwright test --screenshot=on

# Record video untuk test yang gagal
yarn playwright test --video=retain-on-failure

# Screenshot dan video untuk semua test
yarn playwright test --screenshot=on --video=on
```

### 5. Debug dalam Kode

```typescript
// Pause test untuk debugging manual
await page.pause()

// Screenshot untuk debugging
await page.screenshot({ path: 'debug.png' })

// Log page content
console.log(await page.content())

// Wait for debugger
await page.waitForTimeout(5000)
```

---

## Membaca Test Report

### 1. HTML Report

```bash
# Buka HTML report
yarn test:e2e:report

# Atau langsung
yarn playwright show-report services/playwright-report
```

**Komponen HTML Report:**

- **Test summary**: Overview passed/failed tests
- **Test details**: Step-by-step execution
- **Screenshots**: Visual evidence
- **Videos**: Recording test execution
- **Traces**: Interactive debugging
- **Network logs**: HTTP requests/responses
- **Console logs**: Browser console output

### 2. Membaca Test Results

#### ✅ **Test Passed**

- **Green indicator**: Test berhasil
- **Execution time**: Waktu eksekusi
- **Screenshots**: Screenshot final state

#### ❌ **Test Failed**

- **Red indicator**: Test gagal
- **Error message**: Detail error
- **Stack trace**: Lokasi error dalam kode
- **Screenshots**: Screenshot saat error
- **Video**: Recording hingga error
- **Trace**: Step-by-step hingga error

#### ⚠️ **Test Flaky**

- **Yellow indicator**: Test tidak konsisten
- **Retry attempts**: Jumlah retry
- **Success rate**: Persentase keberhasilan

### 3. Trace Viewer

**Cara menggunakan:**

1. Klik icon trace di HTML report
2. Atau buka file trace.zip dengan `yarn playwright show-trace`

**Fitur Trace Viewer:**

- **Timeline**: Visual timeline eksekusi test
- **Actions**: Setiap aksi yang dilakukan
- **Screenshots**: Screenshot setiap step
- **Network**: HTTP requests dan responses
- **Console**: Browser console logs
- **DOM snapshots**: State DOM setiap step

### 4. JSON Report

```bash
# Generate JSON report
yarn playwright test --reporter=json

# Lokasi: services/test-results/results.json
```

**Struktur JSON Report:**

```json
{
  "suites": [...],
  "tests": [...],
  "errors": [...],
  "stats": {
    "passed": 5,
    "failed": 1,
    "skipped": 0,
    "total": 6
  }
}
```

---

## Best Practices

### 1. Test Organization

```typescript
// Gunakan describe untuk grouping
test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Setup untuk setiap test
  })

  test('should sign in successfully', async ({ page }) => {
    // Test implementation
  })
})
```

### 2. Locator Strategy

```typescript
// ✅ Gunakan test-id untuk element penting
await page.locator('[data-testid="sign-in-button"]').click()

// ✅ Gunakan role untuk accessibility
await page.getByRole('button', { name: 'Sign In' }).click()

// ✅ Gunakan text content
await page.getByText('Welcome back').click()

// ❌ Hindari CSS selector yang fragile
await page.locator('.btn-primary').click()
```

### 3. Waiting Strategy

```typescript
// ✅ Auto-waiting (recommended)
await page.locator('[data-testid="result"]').click()

// ✅ Wait for specific condition
await page.waitForLoadState('networkidle')
await page.waitForURL('/dashboard')

// ❌ Hindari fixed timeout
await page.waitForTimeout(5000)
```

### 4. Test Data Management

```typescript
// ✅ Gunakan fixtures untuk test data
import { testUsers } from '../fixtures/test-users'

test('should login with valid user', async ({ page }) => {
  const user = testUsers.validUser
  await page.fill('[data-testid="email"]', user.email)
  await page.fill('[data-testid="password"]', user.password)
})
```

### 5. Error Handling

```typescript
// ✅ Gunakan soft assertions untuk multiple checks
await expect.soft(page.locator('[data-testid="title"]')).toHaveText('Dashboard')
await expect.soft(page.locator('[data-testid="user-name"]')).toBeVisible()

// ✅ Tambahkan context untuk error
test('should display user profile', async ({ page }) => {
  await page.goto('/profile')

  // Tambahkan screenshot untuk debugging
  await page.screenshot({ path: 'profile-page.png' })

  await expect(page.locator('[data-testid="profile-form"]')).toBeVisible()
})
```

---

## Troubleshooting

### 1. Test Timeout

**Problem**: Test timeout setelah 30 detik

**Solutions**:

```typescript
// Increase timeout untuk test spesifik
test('slow test', async ({ page }) => {
  test.setTimeout(60000) // 60 seconds
  // test implementation
})

// Atau di config
export default defineConfig({
  timeout: 60000,
})
```

### 2. Element Not Found

**Problem**: `Error: Locator not found`

**Solutions**:

```typescript
// Tunggu element muncul
await page.waitForSelector('[data-testid="element"]')
await page.locator('[data-testid="element"]').click()

// Atau gunakan auto-waiting
await page.locator('[data-testid="element"]').waitFor()
await page.locator('[data-testid="element"]').click()
```

### 3. Network Issues

**Problem**: Request timeout atau network error

**Solutions**:

```typescript
// Intercept dan mock network request
await page.route('**/api/slow-endpoint', (route) => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ data: 'mocked' }),
  })
})
```

### 4. Browser Context Issues

**Problem**: Browser context closed unexpectedly

**Solutions**:

```typescript
// Pastikan tidak ada multiple page.goto() tanpa await
await page.goto('/page1')
await page.waitForLoadState()
await page.goto('/page2')

// Atau gunakan page.reload() jika perlu
await page.reload()
```

### 5. Asset Loading Issues

**Problem**: Images atau assets gagal dimuat

**Solutions**:

```typescript
// Wait for all network requests
await page.waitForLoadState('networkidle')

// Atau ignore specific resources
await page.route('**/*.{png,jpg,jpeg,svg}', (route) => route.abort())
```

---

## CI/CD Integration

### 1. GitHub Actions

File `.github/workflows/ci.yml` sudah dikonfigurasi untuk:

- Install Playwright browsers
- Run E2E tests dengan headless mode
- Upload test results dan reports
- Generate artifacts untuk debugging

### 2. Environment Variables

```bash
# Required untuk CI
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_TEST_MODE=true
```

### 3. Browser Optimization

```bash
# Install hanya Chromium untuk CI (lebih cepat)
npx playwright install chromium --with-deps

# Atau di package.json
"ci:e2e": "playwright test --project=chromium"
```

### 4. Parallel Execution

```bash
# Gunakan sharding untuk CI yang lebih cepat
yarn playwright test --shard=1/3
yarn playwright test --shard=2/3
yarn playwright test --shard=3/3
```

---

## Quick Reference

### Commands Cheat Sheet

```bash
# Development
yarn test:e2e              # Auth E2E tests
yarn test:e2e:all          # All E2E tests
yarn test:e2e:ui           # UI mode
yarn test:e2e:debug        # Debug mode

# Specific tests
yarn playwright test smoke.spec.ts
yarn playwright test --grep "sign-in"
yarn playwright test auth/

# Debugging
yarn playwright test --debug
yarn playwright test --headed
yarn playwright test --trace on

# Reports
yarn test:e2e:report
yarn playwright show-report
yarn playwright show-trace trace.zip

# Browser management
yarn playwright install
yarn playwright install chromium
yarn playwright --version
```

### Useful Flags

| Flag                 | Description                     |
| -------------------- | ------------------------------- |
| `--headed`           | Run with browser UI             |
| `--debug`            | Debug mode dengan inspector     |
| `--ui`               | Interactive UI mode             |
| `--trace on`         | Generate trace untuk semua test |
| `--screenshot=on`    | Screenshot untuk semua test     |
| `--video=on`         | Record video untuk semua test   |
| `--workers=1`        | Run tests serially              |
| `--grep "pattern"`   | Run tests matching pattern      |
| `--project=chromium` | Run only on Chromium            |

---

## Kesimpulan

Playwright menyediakan ecosystem testing yang powerful untuk E2E testing. Dengan mengikuti panduan ini, Anda dapat:

1. **Menjalankan test** dengan berbagai mode dan konfigurasi
2. **Debug test** menggunakan tools yang tersedia
3. **Membaca report** untuk memahami hasil test
4. **Troubleshoot** masalah yang umum terjadi
5. **Integrate** dengan CI/CD pipeline

Untuk pertanyaan lebih lanjut, rujuk ke [dokumentasi resmi Playwright](mdc:https:/playwright.dev/docs/intro) atau buat issue di repository proyek.

---

**Last updated**: 2025-01-29  
**Version**: 1.0.0  
**Author**: Maguru Development Team
