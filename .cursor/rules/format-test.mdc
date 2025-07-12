---
description: 
globs: 
alwaysApply: false
---
---
description: 
globs: 
alwaysApply: true
---
# Test Summary Report

## 1. Identifikasi Dokumen
- **Judul Dokumen:** Test Summary Report - [OPS-XXX] [Nama Fitur]
- **Identifikasi Versi dan Tanggal:**  
  - Versi: 1.0  
  - Tanggal: YYYY-MM-DD
- **Author:** [Nama Tester/Developer]
- **Reviewer:** [Nama Reviewer]

## 2. Pendahuluan
- **Tujuan:**  
  Mendokumentasikan hasil pengujian untuk fitur [Nama Fitur] (OPS-XXX) sesuai dengan pendekatan Testing di Maguru yang mencakup Unit Testing (TDD), Integration Testing, E2E Testing (BDD), dan Performance Testing.

- **Ruang Lingkup:**  
  Laporan ini mencakup hasil pengujian untuk implementasi [Nama Fitur] yang meliputi komponen/fungsi berikut:
  - [Komponen/Fungsi 1]
  - [Komponen/Fungsi 2]
  - ...

- **Referensi:**  
  - Task OPS-XXX: [Link ke task-ops-xxx.md]
  - Result OPS-XXX: [Link ke result-ops-xxx.md]
  - Test Plan OPS-XXX: [Link ke Test Plan]

## 3. Ringkasan Pengujian


### 3.1 Unit Testing (TDD)

#### Unit Script
```
// semua unit test yang berhubungan dengan task 
    "test:unit": "jest   --verbose",

// unit test component

"test:unit": "jest features/manage-module/components/ModulePageSidebar/SidebarContent.tsx  features/manage-module/components/ModulePageSidebar/SidebarContent/FolderItem.test.tsx features/manage-module/components/ModulePageSidebar/SidebarContent/PageItem.test.tsx features/manage-module/components/ModulePageSidebar/SidebarContent/ContextMenu.test.tsx  features/manage-module/components/ModulePageSidebar/SidebarContent/InlineInput.test.tsx features/manage-module/components/ModulePageSidebar/SidebarContent/AddButton.test.tsx --verbose",

//unit test Layer Context
 "test:unit": "jest features/manage-module/context/ModulePageCRUDContext.test.tsx features/manage-module/context/ModulePageUIContext.test.tsx  --verbose",

 //unit test Layer Hooks 
 "test:unit": "jest  features/manage-module/hooks/module-page/usePage.test.tsx features/manage-module/hooks/module-page/useFolder.test.tsx features/manage-module/hooks/module-page/useModulePageOperation.test.tsx --verbose",


```

#### Statistik
- **Total Test Cases:** XX
- **Test Cases Berhasil:** XX (XX%)
- **Test Cases Gagal:** XX (XX%)
- **Coverage:** XX%

### List Test
example:

```

### 5.5.1 folderService.test.ts

#### getFolders

- ✅ **should return list of folders with pagination data** (20ms)

  - Memverifikasi bahwa service mengembalikan daftar folder dengan metadata pagination yang tepat
  - Memastikan query ke database menggunakan parameter yang benar
  - Memastikan response memiliki format yang sesuai dengan `ApiListResponse<ModuleFolder>`

- ✅ **should handle pagination parameters correctly** (5ms)

  - Memverifikasi bahwa parameter page dan limit diterapkan dengan benar ke query Prisma
  - Memastikan skip dan take dihitung dengan benar berdasarkan page dan limit

- ✅ **should handle database error** (5ms)
  - Memverifikasi bahwa error dari database ditangkap dan dilempar kembali
  - Memastikan error dilog dengan benar

```

#### Metodologi
- Mengikuti siklus TDD (Red → Green → Refactor)
- Menggunakan Jest dan React Testing Library
- Co-location testing (test file berdampingan dengan file implementasi)

#### Komponen yang Diuji
| Komponen | File Test | Coverage | Status |
|----------|-----------|----------|--------|
| [Komponen 1] | `path/to/Component1.test.tsx` | XX% | ✅ |
| [Komponen 2] | `path/to/Component2.test.tsx` | XX% | ✅ |
| [Service 1] | `path/to/service1.test.ts` | XX% | ⚠️ |

#### Catatan Penting
- [Hal penting yang ditemukan selama unit testing]
- [Area yang perlu perhatian khusus]

### 3.2 Integration Testing

#### Statistik
- **Total Test Cases:** XX
- **Test Cases Berhasil:** XX (XX%)
- **Test Cases Gagal:** XX (XX%)

#### Metodologi
- Menggunakan Jest + React Testing Library + MSW
- Focus pada interaksi antar komponen dan services

#### Test Cases
| Test Case | File Test | Komponen Terkait | Status |
|-----------|-----------|-----------------|--------|
| [Test Case 1] | `path/to/integration.test.ts` | [Komponen A, Komponen B] | ✅ |
| [Test Case 2] | `path/to/integration.test.ts` | [Komponen C, Service D] | ⚠️ |

#### Catatan Penting
- [Hal penting yang ditemukan selama integration testing]
- [Interaksi komponen yang memerlukan perhatian]

### 3.3 E2E Testing (BDD)

#### Statistik
- **Total Scenarios:** XX
- **Scenarios Berhasil:** XX (XX%)
- **Scenarios Gagal:** XX (XX%)

#### Metodologi
- Menggunakan Playwright
- Format Given-When-Then (BDD)
- Testing pada browser [Chrome, Firefox, Safari]

#### Test Scenarios
| Scenario | File Test | Status |
|----------|-----------|--------|
| [User dapat membuat folder baru] | `path/to/Feature.spec.ts` | ✅ |
| [User dapat mengedit halaman] | `path/to/Feature.spec.ts` | ❌ |

#### Sample BDD Test
```typescript
// Sample BDD test format from the test
test('User dapat membuat folder baru', async ({ page }) => {
  // Given
  await page.goto('/module/123');
  
  // When
  await page.click('[data-testid="add-folder-button"]');
  await page.fill('[data-testid="folder-name-input"]', 'Folder Baru');
  await page.keyboard.press('Enter');
  
  // Then
  await expect(page.locator('text=Folder Baru')).toBeVisible();
});
```

#### Catatan Penting
- [Hal penting yang ditemukan selama E2E testing]
- [User flows yang memerlukan perhatian]

### 3.4 Performance Testing (jika dilakukan)

#### Statistik
- **Total Metrics Diukur:** XX
- **Metrics Memenuhi Target:** XX (XX%)
- **Metrics Gagal Memenuhi Target:** XX (XX%)

#### Metodologi
- Menggunakan Playwright + Web Performance API
- Testing pada browser [Chrome, Firefox]
- Pengukuran [FCP, LCP, TTI, dll]

#### Hasil Pengukuran
| Metric | Baseline | Hasil | Target | Status |
|--------|----------|-------|--------|--------|
| First Contentful Paint | XXXms | XXXms | <XXXms | ✅ |
| Largest Contentful Paint | XXXms | XXXms | <XXXms | ⚠️ |
| Time to Interactive | XXXms | XXXms | <XXXms | ❌ |

#### Catatan Penting
- [Bottlenecks yang ditemukan]
- [Rekomendasi optimasi]

## 4. Analisis Bug dan Defect

### 4.1 Ringkasan Bug
- **Total Bug:** XX
- **Critical:** XX
- **Major:** XX
- **Minor:** XX

### 4.2 Bug Penting
| ID | Deskripsi | Severity | Status | Link |
|----|-----------|----------|--------|------|
| BUG-1 | [Deskripsi singkat] | Critical | Open | [Link issue] |
| BUG-2 | [Deskripsi singkat] | Major | Fixed | [Link issue] |

### 4.3 Root Cause Analysis
- [Analisis penyebab utama dari bug-bug yang ditemukan]
- [Pattern atau area yang perlu perhatian khusus]

## 5. Laporan Coverage

### 5.1 Code Coverage
```
--------------------------|---------|----------|---------|---------|
File                     | % Stmts | % Branch | % Funcs | % Lines |
--------------------------|---------|----------|---------|---------|
All files                |   85.30 |    79.40 |   88.10 |   86.20 |
 components/             |   92.10 |    83.20 |   95.60 |   92.80 |
  Component1.tsx         |  100.00 |   100.00 |  100.00 |  100.00 |
  Component2.tsx         |   88.50 |    76.30 |   90.20 |   89.40 |
 hooks/                  |   90.40 |    85.70 |   91.30 |   90.60 |
  useFeature.ts          |   90.40 |    85.70 |   91.30 |   90.60 |
 services/               |   73.40 |    69.30 |   77.40 |   75.10 |
  service1.ts            |   73.40 |    69.30 |   77.40 |   75.10 |
--------------------------|---------|----------|---------|---------|
```

### 5.2 Feature Coverage
| Feature | Unit | Integration | E2E | Performance |
|---------|------|------------|-----|-------------|
| [Feature 1] | ✅ | ✅ | ✅ | ❌ |
| [Feature 2] | ✅ | ⚠️ | ❌ | ❌ |

## 6. Conclusi dan Rekomendasi

### 6.1 Status Kelulusan
- [ ] **Lulus tanpa syarat** - Semua pengujian berhasil dan tidak ada bug kritis
- [ ] **Lulus bersyarat** - Ada minor bugs yang perlu diperbaiki di sprint berikutnya
- [ ] **Tidak lulus** - Ada critical bugs yang harus diperbaiki sebelum release

### 6.2 Rekomendasi
1. [Rekomendasi 1] - [Deskripsi dan justifikasi]
2. [Rekomendasi 2] - [Deskripsi dan justifikasi]

### 6.3 Technical Debt yang Teridentifikasi
1. [Technical Debt 1] - [Deskripsi dan dampak]
2. [Technical Debt 2] - [Deskripsi dan dampak]

## 7. Lampiran

### 7.1 Screenshot Hasil Testing
[Link atau screenshot hasil pengujian]

### 7.2 Test Recording
[Link ke video recording E2E test jika tersedia]

### 7.3 Artifacts
- [Link ke test result di CI/CD]
- [Link ke performa benchmarks]
