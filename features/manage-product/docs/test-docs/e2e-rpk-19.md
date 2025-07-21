# Test Summary Report - RPK-19 E2E Testing Manage-Product

## 1. Identifikasi Dokumen
- **Judul Dokumen:** Test Summary Report - [RPK-19] E2E Testing Manage-Product
- **Identifikasi Versi dan Tanggal:**  
  - Versi: 1.0  
  - Tanggal: 2025-07-21
- **Author:** Ardiansyah Arifin
- **Reviewer:** -

## 2. Pendahuluan

### Tujuan
Mendokumentasikan skenario pengujian end-to-end untuk fitur manajemen produk (RPK-3) menggunakan Playwright dengan integrasi Clerk Authentication, memastikan semua workflow utama berfungsi dengan baik untuk role Producer dan Admin.

### Ruang Lingkup
Laporan ini mencakup skenario E2E testing untuk implementasi manage-product yang meliputi:
- CRUD operations untuk produk (Create, Read, Update, Delete)
- Upload dan validasi gambar produk
- Manajemen kategori produk
- Authorization testing (Producer dan Admin access)
- Form validation dan user experience flows

### Referensi
- Task RPK-19: [task-rpk-19.md](../task/story-3/task-rpk-19.md)
- User Story: [story-3.md](../story-3.md)
- Frontend Implementation: [result-rpk-14.md](../result-docs/result-rpk-14.md)
- Backend Implementation: [result-rpk-13.md](../result-docs/result-rpk-13.md)

## 3. E2E Testing (BDD) - Playwright

### 3.1 Test Environment Setup
- **Framework:** Playwright + Clerk Authentication
- **Browser Coverage:** Chrome, Firefox, Edge
- **Authentication:** Clerk test users dengan roles Producer/Admin
- **Base URL:** `http://localhost:3000`

### 3.2 Test Scenarios Overview

#### 3.2.1 Authentication & Authorization Tests
| Scenario | Priority | Status | Estimated Duration |
|----------|----------|--------|-------------------|
| Producer dapat mengakses halaman manage-product | High | Pending | 2 menit |
| Admin dapat mengakses halaman manage-product | High | Pending | 2 menit |
| Kasir tidak dapat mengakses halaman manage-product | High | Pending | 2 menit |

#### 3.2.2 Product Management Tests
| Scenario | Priority | Status | Estimated Duration |
|----------|----------|--------|-------------------|
| Producer dapat menambah produk baru dengan upload foto | High | Pending | 5 menit |
| Producer dapat melihat daftar produk | High | Pending | 3 menit |
| Producer dapat melihat detail produk | Medium | Pending | 3 menit |
| Producer dapat mengedit produk yang ada | High | Pending | 4 menit |
| Producer dapat menghapus produk dengan konfirmasi | High | Pending | 3 menit |

#### 3.2.3 Category Management Tests  
| Scenario | Priority | Status | Estimated Duration |
|----------|----------|--------|-------------------|
| Producer dapat mengelola kategori produk | Medium | Pending | 4 menit |
| Producer dapat menambah kategori baru | Medium | Pending | 3 menit |

#### 3.2.4 Search & Filter Tests
| Scenario | Priority | Status | Estimated Duration |
|----------|----------|--------|-------------------|
| Producer dapat mencari produk berdasarkan nama | Medium | Pending | 2 menit |
| Producer dapat memfilter produk berdasarkan kategori | Medium | Pending | 2 menit |

### 3.3 Detailed Test Scenarios

#### Scenario 1: Producer Login dan Akses Halaman
```typescript
test('Producer dapat mengakses halaman manage-product', async ({ page }) => {
  // Given: Producer login dengan Clerk
  await page.goto('/sign-in');
  await page.fill('[name="identifier"]', 'producer@test.com');
  await page.fill('[name="password"]', 'testpassword');
  await page.click('[type="submit"]');
  
  // When: Navigate ke manage-product
  await page.goto('/producer/manage-product');
  
  // Then: Halaman berhasil dimuat
  await expect(page.locator('h1')).toContainText('Kelola Produk');
  await expect(page.locator('[data-testid="product-table"]')).toBeVisible();
});
```

#### Scenario 2: Menambah Produk Baru
```typescript
test('Producer dapat menambah produk baru dengan upload foto', async ({ page }) => {
  // Given: Producer sudah login dan di halaman manage-product
  await authenticateAsProducer(page);
  await page.goto('/producer/manage-product');
  
  // When: Klik tombol Tambah Produk
  await page.click('[data-testid="add-product-button"]');
  await expect(page).toHaveURL(/\/producer\/manage-product\/add/);
  
  // And: Mengisi form produk
  await page.fill('[name="code"]', 'TEST001');
  await page.fill('[name="name"]', 'Test Product');
  await page.fill('[name="description"]', 'Deskripsi test product');
  await page.fill('[name="modalAwal"]', '100000');
  await page.fill('[name="hargaSewa"]', '50000');
  await page.fill('[name="quantity"]', '5');
  
  // And: Upload gambar
  await page.setInputFiles('[data-testid="image-upload"]', 'test-image.jpg');
  
  // And: Pilih kategori
  await page.selectOption('[name="categoryId"]', { label: 'Pakaian Formal' });
  
  // When: Submit form
  await page.click('[data-testid="submit-button"]');
  
  // Then: Produk berhasil ditambahkan
  await expect(page).toHaveURL(/\/producer\/manage-product/);
  await expect(page.locator('text=Produk berhasil ditambahkan')).toBeVisible();
  await expect(page.locator('text=TEST001')).toBeVisible();
});
```

#### Scenario 3: Mengedit Produk
```typescript
test('Producer dapat mengedit produk yang ada', async ({ page }) => {
  // Given: Producer sudah login dan ada produk yang bisa diedit
  await authenticateAsProducer(page);
  await page.goto('/producer/manage-product');
  
  // When: Klik tombol Edit pada produk pertama
  await page.click('[data-testid="edit-product-button"]:first-child');
  await expect(page).toHaveURL(/\/producer\/manage-product\/edit/);
  
  // And: Ubah nama produk
  await page.fill('[name="name"]', 'Updated Product Name');
  await page.fill('[name="hargaSewa"]', '75000');
  
  // When: Submit perubahan
  await page.click('[data-testid="submit-button"]');
  
  // Then: Perubahan berhasil disimpan
  await expect(page).toHaveURL(/\/producer\/manage-product/);
  await expect(page.locator('text=Produk berhasil diperbarui')).toBeVisible();
  await expect(page.locator('text=Updated Product Name')).toBeVisible();
});
```

#### Scenario 4: Menghapus Produk
```typescript
test('Producer dapat menghapus produk dengan konfirmasi', async ({ page }) => {
  // Given: Producer sudah login dan melihat detail produk
  await authenticateAsProducer(page);
  await page.goto('/producer/manage-product');
  await page.click('[data-testid="product-row"]:first-child');
  
  // When: Klik tombol Hapus
  await page.click('[data-testid="delete-product-button"]');
  
  // And: Konfirmasi penghapusan
  await expect(page.locator('text=Apakah Anda yakin ingin menghapus produk ini?')).toBeVisible();
  await page.click('[data-testid="confirm-delete-button"]');
  
  // Then: Produk berhasil dihapus
  await expect(page.locator('text=Produk berhasil dihapus')).toBeVisible();
  await expect(page.locator('[data-testid="product-detail-modal"]')).not.toBeVisible();
});
```

#### Scenario 5: Authorization Test - Kasir Access
```typescript
test('Kasir tidak dapat mengakses halaman manage-product', async ({ page }) => {
  // Given: Kasir login dengan Clerk
  await page.goto('/sign-in');
  await page.fill('[name="identifier"]', 'kasir@test.com');
  await page.fill('[name="password"]', 'testpassword');
  await page.click('[type="submit"]');
  
  // When: Mencoba akses manage-product
  await page.goto('/producer/manage-product');
  
  // Then: Diarahkan ke halaman unauthorized atau error
  await expect(page).toHaveURL(/\/(unauthorized|403|sign-in)/);
  await expect(page.locator('text=Akses ditolak')).toBeVisible();
});
```

#### Scenario 6: Mengelola Kategori
```typescript
test('Producer dapat mengelola kategori produk', async ({ page }) => {
  // Given: Producer sudah login di halaman manage-product
  await authenticateAsProducer(page);
  await page.goto('/producer/manage-product');
  
  // When: Klik tombol Kelola Kategori
  await page.click('[data-testid="manage-categories-button"]');
  
  // And: Tambah kategori baru
  await page.fill('[data-testid="category-name-input"]', 'Kategori Test');
  await page.click('[data-testid="color-picker-red"]');
  await page.click('[data-testid="add-category-button"]');
  
  // Then: Kategori berhasil ditambahkan
  await expect(page.locator('text=Kategori berhasil ditambahkan')).toBeVisible();
  await expect(page.locator('text=Kategori Test')).toBeVisible();
});
```

### 3.4 Form Validation Tests

#### Scenario 7: Validasi Form Produk
```typescript
test('Form produk menampilkan error untuk input tidak valid', async ({ page }) => {
  // Given: Producer di halaman tambah produk
  await authenticateAsProducer(page);
  await page.goto('/producer/manage-product/add');
  
  // When: Submit form kosong
  await page.click('[data-testid="submit-button"]');
  
  // Then: Error validation muncul
  await expect(page.locator('text=Kode produk harus diisi')).toBeVisible();
  await expect(page.locator('text=Nama produk harus diisi')).toBeVisible();
  await expect(page.locator('text=Modal awal harus diisi')).toBeVisible();
  
  // When: Isi dengan format yang salah
  await page.fill('[name="code"]', 'invalid-code-too-long');
  await page.fill('[name="modalAwal"]', '-100');
  await page.fill('[name="hargaSewa"]', 'bukan-angka');
  
  await page.click('[data-testid="submit-button"]');
  
  // Then: Specific validation errors muncul
  await expect(page.locator('text=Kode produk maksimal 10 karakter')).toBeVisible();
  await expect(page.locator('text=Modal awal harus bernilai positif')).toBeVisible();
  await expect(page.locator('text=Harga sewa harus berupa angka')).toBeVisible();
});
```

### 3.5 Search & Filter Tests

#### Scenario 8: Pencarian dan Filter Produk
```typescript
test('Producer dapat mencari dan memfilter produk', async ({ page }) => {
  // Given: Producer di halaman manage-product dengan beberapa produk
  await authenticateAsProducer(page);
  await page.goto('/producer/manage-product');
  
  // When: Melakukan pencarian
  await page.fill('[data-testid="search-input"]', 'TEST001');
  await page.keyboard.press('Enter');
  
  // Then: Hanya produk yang cocok ditampilkan
  await expect(page.locator('[data-testid="product-row"]')).toHaveCount(1);
  await expect(page.locator('text=TEST001')).toBeVisible();
  
  // When: Clear search dan filter berdasarkan kategori
  await page.fill('[data-testid="search-input"]', '');
  await page.selectOption('[data-testid="category-filter"]', { label: 'Pakaian Formal' });
  
  // Then: Hanya produk dengan kategori tersebut ditampilkan
  await expect(page.locator('[data-testid="category-badge"]:has-text("Pakaian Formal")')).toHaveCount({ min: 1 });
});
```

## 4. Test Utilities & Helpers

### 4.1 Authentication Helper
```typescript
// test-helpers.ts
export async function authenticateAsProducer(page: Page) {
  await page.goto('/sign-in');
  await page.fill('[name="identifier"]', process.env.PRODUCER_TEST_EMAIL);
  await page.fill('[name="password"]', process.env.PRODUCER_TEST_PASSWORD);
  await page.click('[type="submit"]');
  await page.waitForURL('/producer/dashboard');
}

export async function authenticateAsAdmin(page: Page) {
  await page.goto('/sign-in');
  await page.fill('[name="identifier"]', process.env.ADMIN_TEST_EMAIL);
  await page.fill('[name="password"]', process.env.ADMIN_TEST_PASSWORD);
  await page.click('[type="submit"]');
  await page.waitForURL('/admin/dashboard');
}
```

### 4.2 Test Data Setup
```typescript
// test-data.ts
export const testProducts = [
  {
    code: 'TEST001',
    name: 'Test Product 1',
    description: 'Deskripsi test product 1',
    modalAwal: '100000',
    hargaSewa: '50000',
    quantity: '5',
    category: 'Pakaian Formal'
  }
];

export const testCategories = [
  { name: 'Pakaian Formal', color: '#3B82F6' },
  { name: 'Pakaian Casual', color: '#10B981' }
];
```

## 5. Success Criteria & Definition of Done

### 5.1 Acceptance Criteria
- [ ] Producer dapat menambah produk baru dengan upload foto
- [ ] Producer dapat melihat, edit, dan hapus produk yang ada
- [ ] Producer dapat mengelola kategori produk
- [ ] Hanya producer dan admin yang dapat mengakses fitur
- [ ] Form validation berfungsi dengan baik
- [ ] Search dan filter produk bekerja dengan benar

### 5.2 Technical Requirements
- [ ] Semua test scenarios berhasil dijalankan
- [ ] Test coverage mencapai minimal 80%
- [ ] Tidak ada critical bugs ditemukan
- [ ] Performance loading halaman < 3 detik
- [ ] Responsive design berfungsi di mobile dan desktop

## 6. Implementation Notes

### 6.1 File Structure
```
__tests__/playwright/manage-product/
   manage-product.spec.ts          # Main E2E test scenarios
   authorization.spec.ts           # Authorization specific tests  
   form-validation.spec.ts         # Form validation tests
   performance.spec.ts            # Performance tests (optional)
```

### 6.2 Test Data Dependencies
- Test users dengan roles Producer, Admin, Kasir sudah dikonfigurasi di Clerk
- Test images untuk upload functionality
- Sample categories dan products untuk testing

### 6.3 Environment Configuration
- Test database terpisah dari development
- Environment variables untuk test credentials
- Mock external services jika diperlukan

## 7. Risk Assessment

### 7.1 Potential Issues
- **Clerk Authentication:** Flaky authentication tests karena network latency
- **File Upload:** Test image files consistency across environments  
- **Database State:** Cleanup test data antar test runs
- **Timing Issues:** Async operations dan loading states

### 7.2 Mitigation Strategies
- Gunakan proper wait strategies (waitForSelector, waitForURL)
- Implement test data cleanup di beforeEach/afterEach
- Use stable selectors (data-testid) instead of text-based selectors
- Add retry logic untuk network-dependent operations

## 8. Estimasi Effort

### 8.1 Development Time
- **Test Setup & Configuration:** 2 jam
- **Core CRUD Test Scenarios:** 3 jam  
- **Authorization Tests:** 1 jam
- **Form Validation Tests:** 1 jam
- **Search & Filter Tests:** 1 jam
- **Debugging & Refinement:** 2 jam

**Total Estimasi:** 10 jam (sesuai dengan task estimation 6 jam + buffer)

### 8.2 Maintenance
- Monthly test review dan update
- Update test data sesuai dengan perubahan business requirements
- Monitor dan fix flaky tests

---

**Note:** Dokumentasi ini fokus pada skenario E2E testing yang sederhana namun comprehensive untuk memastikan semua functionality utama manage-product berfungsi dengan baik. Implementation actual dari test scenarios akan mengikuti pattern yang sudah ada di `__tests__/playwright/` dengan fokus pada user workflows yang realistic.