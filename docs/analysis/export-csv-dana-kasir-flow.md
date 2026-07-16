# Analisis Flow System: Export CSV Dana Kasir

> **Tanggal Analisis**: 2026-07-15  
> **Scope**: Fitur Export CSV untuk Pendapatan & Pengeluaran  
> **Entry Point**: `app/(kasir)/dana-kasir/page.tsx`  
> **Role Access**: **Owner only** — Kasir tidak bisa export  

---

## 📁 File Inventory — Semua File yang Terlibat

| # | Layer | File | Peran |
|---|-------|------|-------|
| 1 | **Page** | `app/(kasir)/dana-kasir/page.tsx` | Entry point — cek role user, render dashboard |
| 2 | **Component (Orchestrator)** | `features/dana-kasir/components/DanaKasirDashboard.tsx` | Manage state `showExportDialog`, trigger `handleExport()` |
| 3 | **Component (Trigger Button)** | `features/dana-kasir/components/DateNavigation.tsx` | Render tombol "Export CSV" (hanya jika `canExport=true`) |
| 4 | **Component (UI Dialog)** | `features/dana-kasir/components/ExportDialog.tsx` | Dialog pilih date range, trigger fetch ke API, handle download |
| 5 | **API Route** | `app/api/kasir/dana-export/route.ts` | Handler `GET /api/kasir/dana-export`, validasi, return CSV response |
| 6 | **Service (Core Logic)** | `features/dana-kasir/services/csvExportService.ts` | Query DB, format CSV string, generate filename |
| 7 | **Auth Middleware** | `lib/auth-middleware.ts` | `requireDanaKasirExport()` — enforce Owner-only access |
| 8 | **Utils** | `features/dana-kasir/utils/timezone.ts` | `getWITADayRange()`, `formatWITADate()` — WITA (UTC+8) timezone |
| 9 | **Types** | `features/dana-kasir/types.ts` | `ExportOptions`, `ApiResponse`, `PengeluaranKasir`, `IncomeItem` |

---

## 🔄 Flow System — End to End

### Gambaran Singkat

```
[User (Owner)] → Klik "Export CSV" di DateNavigation
    → DanaKasirDashboard: setShowExportDialog(true)
    → ExportDialog: pilih date range → validateDates() client-side
    → fetch GET /api/kasir/dana-export?startDate=...&endDate=...
    → auth-middleware: verifikasi JWT Clerk + cek role Owner
    → CSVExportService: query DB (transaksi + pengeluaranKasir) paralel
    → format CSV string → return sebagai file download
    → ExportDialog: trigger browser download via anchor element
    → toast.success + dialog close
```

### Sequence Lengkap

```
1. page.tsx
   - useUserRole() → ambil role dari Clerk
   - Jika role = 'kasir'|'owner'|'producer' → render <DanaKasirDashboard>
   - role 'producer' di-map ke 'owner' sebelum diteruskan

2. DanaKasirDashboard.tsx
   - canExport = (userRole === 'owner')  ← flag penentu
   - Pass ke <DateNavigation canExport={canExport} onExport={handleExport} />
   - handleExport() → setShowExportDialog(true)
   - Render <ExportDialog isOpen={showExportDialog} onClose={...} />

3. DateNavigation.tsx
   - Render tombol "Export CSV" hanya jika canExport === true
   - onClick → panggil onExport() callback

4. ExportDialog.tsx
   - State: startDate, endDate (default: hari ini WITA), isExporting
   - Preset buttons: "Hari Ini", "7 Hari", "Bulan Ini"
   - validateDates(): startDate ≤ endDate
   - handleExport():
       a. setIsExporting(true)
       b. fetch('/api/kasir/dana-export?startDate=...&endDate=...')
       c. Jika response OK → ambil blob → trigger download
       d. toast.success / toast.error
       e. setIsExporting(false)

5. app/api/kasir/dana-export/route.ts (Server)
   - requireDanaKasirExport() → cek auth + role
   - Parse & validasi query params:
       • startDate & endDate wajib ada
       • Format date valid (tidak NaN)
       • startDate ≤ endDate
       • Range maksimal 365 hari
   - new CSVExportService(prisma)
   - csvService.generateCSV(startDate, endDate) → csvContent
   - csvService.generateFilename(startDate, endDate) → filename
   - return new NextResponse(csvContent, {
       headers: {
         'Content-Type': 'text/csv; charset=utf-8',
         'Content-Disposition': `attachment; filename="${filename}"`,
         'Cache-Control': 'no-cache, ...'
       }
     })

6. csvExportService.ts
   - getWITADayRange(startDate) → { start: startDay 00:00, end: ... }
   - getWITADayRange(endDate)   → { ..., end: endDay 23:59:59.999 }
   - Query PARALEL:
       prisma.transaksi.findMany    ← data pendapatan
       prisma.pengeluaranKasir.findMany  ← data pengeluaran
   - Build CSV rows (header + income rows + expense rows)
   - escapeCsvValue() → handle karakter koma/kutip/newline
   - return csvString (joined by '\n')
```

---

## 📋 Format CSV yang Dihasilkan

### Header Kolom (11 kolom)

| Kolom | Untuk Tipe | Sumber Data |
|-------|-----------|-------------|
| `Tanggal` | Keduanya | `formatWITADate(createdAt)` |
| `Tipe` | Keduanya | Literal `"Pendapatan"` / `"Pengeluaran"` |
| `Kode Transaksi` | Pendapatan saja | `transaksi.kode` |
| `Nama Customer` | Pendapatan saja | `transaksi.penyewa.nama` |
| `Kategori` | Pengeluaran saja | `pengeluaranKasir.kategori` |
| `Deskripsi` | Pengeluaran saja | `pengeluaranKasir.deskripsi` |
| `Jumlah Rental` | Pendapatan saja | `transaksi.jumlahBayar` |
| `Jumlah Penalty` | Pendapatan saja | `transaksi.flatLatePenalty` |
| `Total Jumlah` | Keduanya | Rental+Penalty atau `pengeluaranKasir.harga` |
| `Kasir ID` | Keduanya | `kasirId` |
| `Nama Kasir` | Keduanya | `kasir.nama` |

### Filename Convention

```
Single date:  dana-kasir-YYYY-MM-DD.csv
Date range:   dana-kasir-YYYY-MM-DD-to-YYYY-MM-DD.csv
```

### Contoh Isi CSV

```csv
Tanggal,Tipe,Kode Transaksi,Nama Customer,Kategori,Deskripsi,Jumlah Rental,Jumlah Penalty,Total Jumlah,Kasir ID,Nama Kasir
2026-01-15,Pendapatan,TRX-001,Budi Santoso,,,150000,0,150000,kasir-abc,Andi
2026-01-15,Pendapatan,TRX-002,Siti Rahayu,,,200000,20000,220000,kasir-abc,Andi
2026-01-15,Pengeluaran,,,,Beli sabun,Operasional,,50000,kasir-xyz,Budi
```

---

## 🔐 Authorization Flow

```
User Request ke /api/kasir/dana-export
       ↓
requireDanaKasirExport()
       ↓
requireAuth()
  → currentUser() dari Clerk
  → Jika tidak login → 401 UNAUTHORIZED
       ↓
hasPermission(role, 'dana-kasir-export', 'read')
  → 'owner'    ✅ → lanjut generate CSV
  → 'producer' ✅ → diperlakukan sebagai owner di page.tsx
  → 'kasir'    ❌ → 403 FORBIDDEN "Only Owner can export"
```

**Catatan**: Role `producer` di `page.tsx` di-map jadi `owner`:
```tsx
userRole={role === 'producer' ? 'owner' : role as 'kasir' | 'owner'}
```
Ini berarti `producer` bisa export CSV meski secara teknis dikirim sebagai `owner`.

---

## ⚙️ Validasi Berlapis

### Client-side (ExportDialog.tsx)
| Validasi | Pesan Error |
|----------|-------------|
| startDate atau endDate kosong | "Mohon pilih tanggal mulai dan tanggal akhir" |
| startDate > endDate | "Tanggal mulai harus lebih kecil atau sama dengan tanggal akhir" |

### Server-side (route.ts)
| Validasi | HTTP Status | Error Code |
|----------|-------------|-----------|
| startDate / endDate tidak ada | 400 | `MISSING_PARAMETERS` |
| Format tanggal invalid | 400 | `INVALID_DATE_FORMAT` |
| startDate > endDate | 400 | `INVALID_DATE_RANGE` |
| Range > 365 hari | 400 | `DATE_RANGE_TOO_LARGE` |
| Tidak login | 401 | `UNAUTHORIZED` |
| Bukan Owner | 403 | `FORBIDDEN` |
| Error DB Prisma | 500 | `DATABASE_ERROR` |
| Error lain | 500 | `INTERNAL_ERROR` |

---

## 🌏 Timezone Handling (WITA / UTC+8)

Semua filter tanggal menggunakan timezone **WITA (Asia/Makassar)**:

```
Input: startDate = "2026-01-15" (dari user)
  → getWITADayRange("2026-01-15")
  → start: 2026-01-15T00:00:00+08:00  (UTC: 2026-01-14T16:00:00Z)
  → end:   2026-01-15T23:59:59+08:00  (UTC: 2026-01-15T15:59:59Z)

Prisma query:
  createdAt: { gte: start, lte: end }
```

---

## 🗄️ Database Queries di csvExportService

### Query 1: Pendapatan (tabel `transaksi`)
```prisma
prisma.transaksi.findMany({
  where: {
    createdAt: { gte: startRange.start, lte: endRange.end }
  },
  include: {
    penyewa: { select: { nama: true } },
    kasir: { select: { id: true, nama: true } }
  },
  orderBy: { createdAt: 'asc' }
})
```

### Query 2: Pengeluaran (tabel `pengeluaranKasir`)
```prisma
prisma.pengeluaranKasir.findMany({
  where: {
    isActive: true,
    createdAt: { gte: startRange.start, lte: endRange.end }
  },
  include: {
    kasir: { select: { id: true, nama: true } }
  },
  orderBy: { createdAt: 'asc' }
})
```

---

## 🚨 TEMUAN PENTING: GAP DATA CSV vs Dashboard

Lihat bagian terpisah di bawah untuk penjelasan lengkap.

---

## 📊 Perbandingan Fitur Export vs Dashboard

| Aspek | Export CSV | Dashboard Summary |
|-------|-----------|-------------------|
| Filter kasir | Tidak ada (semua data) | Ada (bisa filter per kasir) |
| Urutan data | ASC (lama ke baru) | DESC (baru ke lama) |
| Scope tanggal | Date range bebas (max 1 tahun) | Per hari saja |
| Include penalty kondisi? | ❌ TIDAK | ✅ YA |
| Role yang bisa akses | Owner only | Kasir + Owner |

---

## ⚠️ Temuan & Status Perbaikan

### 1. ✅ FIXED — GAP DATA: Condition Penalty Tidak Termasuk CSV
- **Severity**: Tinggi
- **Status**: **SUDAH DIPERBAIKI** (2026-07-15)
- **File diperbaiki**: `features/dana-kasir/services/csvExportService.ts`
- **Fix**: Ditambahkan query `penaltyTransactions` ke `generateCSV()` yang filter by `tglKembali` dan `items.some({ totalReturnPenalty: { gt: 0 } })`. Hasilnya masuk ke CSV sebagai baris tipe `"Penalty Kondisi"`.
- **Test**: `features/dana-kasir/services/__tests__/csvExportService.condition-penalty.test.ts`

### 2. Sorting Berbeda antara CSV dan Dashboard
- **Severity**: Rendah (tidak di-fix, by design)
- **Detail**: CSV menggunakan `ORDER BY createdAt ASC`, dashboard menggunakan `DESC`

### 3. No Kasir Filter on Export
- **Severity**: Rendah / By Design
- **Detail**: Export selalu ambil semua data tanpa filter kasir (intended untuk rekap Owner)

### 4. Encoding CSV Tidak Ada BOM
- **Severity**: Medium (belum di-fix)
- **Detail**: Tidak ada UTF-8 BOM — Excel kadang salah baca karakter Indonesia
- **Fix suggestion**: Tambahkan `\uFEFF` di awal csvContent di `route.ts`

