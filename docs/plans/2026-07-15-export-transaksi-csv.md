# Export Data Transaksi CSV — Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Load executing-plans to implement this plan task-by-task.

**Goal:** Tambahkan fitur baru "Export Data Transaksi" (CSV kedua, terpisah dari CSV Dana Kasir yang sudah ada) yang fokus pada data customer + detail transaksi, dengan kolom: Kode Transaksi, Tanggal, Nama Customer, No. HP, Alamat, Jumlah Item, Status, Metode Bayar, Total Bayar, Catatan, Kasir.

**Architecture:** Buat service baru `transactionExportService.ts` yang query tabel `transaksi` + include `penyewa` (telepon, alamat) + `items` (SUM jumlah). Buat API route baru `/api/kasir/transaksi-export`. Tambah tombol "Export Transaksi" di `DateNavigation.tsx` di samping tombol Export Dana Kasir yang sudah ada (Owner only). Extend `ExportDialog` dengan prop `exportType` untuk support 2 tipe export dari 1 dialog komponen.

**Tech Stack:** Next.js App Router, Prisma, TypeScript, shadcn/ui (Button, Dialog), Sonner (toast), WITA timezone utils

**Keputusan Arsitektur (dari brainstorming session 2026-07-15):**
- Pisah 2 CSV (Opsi B) — Dana Kasir tetap tidak diubah, tambah CSV Transaksi baru
- Tombol "Export Transaksi" di DateNavigation (di samping Export Dana Kasir)
- Scope: Semua transaksi dalam date range yang dipilih (bukan filter status)

---

## Konteks Codebase

```
features/dana-kasir/
  components/
    DanaKasirDashboard.tsx    <- tambah state showTransaksiExportDialog
    DateNavigation.tsx         <- tambah tombol Export Transaksi
    ExportDialog.tsx           <- extend dengan prop exportType
  services/
    csvExportService.ts        <- referensi pola (TIDAK diubah)
    transactionExportService.ts <- FILE BARU (Task 1)
    index.ts                   <- tambah export baru
app/api/kasir/
  dana-export/route.ts         <- referensi pola (TIDAK diubah)
  transaksi-export/route.ts    <- FILE BARU (Task 2)
```

**Schema fields yang digunakan:**
- `transaksi`: kode, createdAt, status, jumlahBayar, flatLatePenalty, metodeBayar, catatan
- `penyewa`: nama, telepon, alamat
- `kasir`: nama
- `transaksiItem`: jumlah (di-SUM di aplikasi)

**Auth:** Owner only — gunakan `requireDanaKasirExport()` yang sudah ada di `lib/auth-middleware.ts`

---

## Task 1: TransactionExportService

**Files:**
- Create: `features/dana-kasir/services/transactionExportService.ts`
- Create: `features/dana-kasir/services/__tests__/transactionExportService.test.ts`
- Modify: `features/dana-kasir/services/index.ts`

### Step 1: Tulis failing test

Buat `features/dana-kasir/services/__tests__/transactionExportService.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { TransactionExportService } from '../transactionExportService'

describe('TransactionExportService', () => {
  let prisma: PrismaClient
  let service: TransactionExportService
  const mockStartDate = new Date('2026-01-15')
  const mockEndDate = new Date('2026-01-15')

  beforeEach(() => {
    prisma = new PrismaClient()
    service = new TransactionExportService(prisma)
  })

  it('should include No. HP, Alamat, and Jumlah Item in CSV', async () => {
    prisma.transaksi.findMany = jest.fn().mockResolvedValueOnce([
      {
        kode: 'TRX-001',
        createdAt: new Date('2026-01-15T08:00:00+08:00'),
        status: 'completed',
        jumlahBayar: { toNumber: () => 150000 },
        flatLatePenalty: { toNumber: () => 0 },
        metodeBayar: 'tunai',
        catatan: null,
        kasirId: 'kasir-abc',
        penyewa: { nama: 'Budi Santoso', telepon: '081234567890', alamat: 'Jl. Merdeka No.5' },
        kasir: { id: 'kasir-abc', nama: 'Andi' },
        items: [{ jumlah: 2 }, { jumlah: 1 }],
      },
    ])

    const csvContent = await service.generateCSV(mockStartDate, mockEndDate)
    const rows = csvContent.split('\n')

    expect(rows[0]).toContain('No. HP')
    expect(rows[0]).toContain('Alamat')
    expect(rows[0]).toContain('Jumlah Item')
    expect(rows[1]).toContain('081234567890')
    expect(rows[1]).toContain('Jl. Merdeka No.5')
    expect(rows[1]).toContain('3') // 2+1
    expect(rows[1]).toContain('TRX-001')
    expect(rows[1]).toContain('150000')
  })

  it('should generate filename with range', () => {
    const filename = service.generateFilename(new Date('2026-01-01'), new Date('2026-01-31'))
    expect(filename).toBe('transaksi-2026-01-01-to-2026-01-31.csv')
  })

  it('should generate filename for single date', () => {
    const filename = service.generateFilename(new Date('2026-01-15'), new Date('2026-01-15'))
    expect(filename).toBe('transaksi-2026-01-15.csv')
  })

  it('should handle null catatan gracefully', async () => {
    prisma.transaksi.findMany = jest.fn().mockResolvedValueOnce([
      {
        kode: 'TRX-002', createdAt: new Date(), status: 'active',
        jumlahBayar: { toNumber: () => 100000 }, flatLatePenalty: { toNumber: () => 0 },
        metodeBayar: 'qris', catatan: null, kasirId: 'kasir-abc',
        penyewa: { nama: 'Siti', telepon: '089999', alamat: 'Gg. Mawar' },
        kasir: { id: 'kasir-abc', nama: 'Budi' },
        items: [{ jumlah: 1 }],
      },
    ])
    const csvContent = await service.generateCSV(mockStartDate, mockEndDate)
    expect(csvContent).toBeDefined()
    expect(csvContent).not.toContain('null')
  })
})
```

### Step 2: Jalankan test — pastikan FAIL

```powershell
npx jest features/dana-kasir/services/__tests__/transactionExportService.test.ts --no-coverage
```

Expected: FAIL dengan `Cannot find module '../transactionExportService'`

### Step 3: Buat TransactionExportService

Buat `features/dana-kasir/services/transactionExportService.ts`:

```typescript
// Dana Kasir Management - Transaction Export Service
// Export data transaksi + customer info ke CSV
// BERBEDA dari csvExportService.ts (laporan keuangan debit/kredit)
// Ini fokus pada: siapa yang menyewa, berapa item, alamat, no HP

import { PrismaClient } from '@prisma/client'
import { getWITADayRange, formatWITADate } from '../utils/timezone'

export class TransactionExportService {
  constructor(private prisma: PrismaClient) {}

  async generateCSV(startDate: Date, endDate: Date): Promise<string> {
    const startRange = getWITADayRange(startDate)
    const endRange = getWITADayRange(endDate)

    const transactions = await this.prisma.transaksi.findMany({
      where: {
        createdAt: { gte: startRange.start, lte: endRange.end },
      },
      include: {
        penyewa: { select: { nama: true, telepon: true, alamat: true } },
        kasir: { select: { id: true, nama: true } },
        items: { select: { jumlah: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    const csvRows: string[] = []

    csvRows.push(
      ['Tanggal','Kode Transaksi','Nama Customer','No. HP','Alamat',
       'Jumlah Item','Status','Metode Bayar','Total Bayar','Catatan','Kasir'].join(',')
    )

    for (const trx of transactions) {
      const totalItems = trx.items.reduce((sum, item) => sum + item.jumlah, 0)
      const totalBayar = trx.jumlahBayar.toNumber() + trx.flatLatePenalty.toNumber()

      csvRows.push(
        [
          formatWITADate(trx.createdAt),
          this.escapeCsvValue(trx.kode),
          this.escapeCsvValue(trx.penyewa.nama),
          this.escapeCsvValue(trx.penyewa.telepon),
          this.escapeCsvValue(trx.penyewa.alamat),
          totalItems.toString(),
          this.escapeCsvValue(trx.status),
          this.escapeCsvValue(trx.metodeBayar),
          totalBayar.toString(),
          this.escapeCsvValue(trx.catatan || ''),
          this.escapeCsvValue(trx.kasir?.nama || 'N/A'),
        ].join(',')
      )
    }

    return csvRows.join('\n')
  }

  generateFilename(startDate: Date, endDate: Date): string {
    const start = formatWITADate(startDate)
    const end = formatWITADate(endDate)
    return start === end ? `transaksi-${start}.csv` : `transaksi-${start}-to-${end}.csv`
  }

  private escapeCsvValue(value: string): string {
    if (!value) return ''
    if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
    return value
  }
}
```

### Step 4: Update services/index.ts — tambah export

Buka `features/dana-kasir/services/index.ts`, tambahkan baris:

```typescript
export { TransactionExportService } from './transactionExportService'
```

### Step 5: Jalankan test — pastikan PASS

```powershell
npx jest features/dana-kasir/services/__tests__/transactionExportService.test.ts --no-coverage
```

Expected: PASS 4/4 tests

### Step 6: Commit

```powershell
git add features/dana-kasir/services/transactionExportService.ts
git add features/dana-kasir/services/__tests__/transactionExportService.test.ts
git add features/dana-kasir/services/index.ts
git commit -m "feat: add TransactionExportService for customer-focused transaction CSV"
```

---

## Task 2: API Route `/api/kasir/transaksi-export`

**Files:**
- Create: `app/api/kasir/transaksi-export/route.ts`

### Step 1: Buat folder dan route file

```powershell
New-Item -ItemType Directory -Path "app/api/kasir/transaksi-export" -Force
```

Buat `app/api/kasir/transaksi-export/route.ts`:

```typescript
// GET /api/kasir/transaksi-export
// Export data transaksi + customer info ke CSV
// BERBEDA dari /api/kasir/dana-export (laporan keuangan)

import { NextRequest, NextResponse } from 'next/server'
import { requireDanaKasirExport } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { TransactionExportService } from '@/features/dana-kasir/services/transactionExportService'
import { ApiResponse } from '@/features/dana-kasir/types'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireDanaKasirExport()
    if (authResult.error) return authResult.error

    const searchParams = request.nextUrl.searchParams
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    if (!startDateParam || !endDateParam) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: { message: 'Parameter startDate dan endDate harus diisi', code: 'MISSING_PARAMETERS' } },
        { status: 400 }
      )
    }

    const startDate = new Date(startDateParam)
    const endDate = new Date(endDateParam)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: { message: 'Format tanggal tidak valid. Gunakan format YYYY-MM-DD', code: 'INVALID_DATE_FORMAT' } },
        { status: 400 }
      )
    }

    if (startDate > endDate) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: { message: 'Tanggal mulai harus lebih kecil atau sama dengan tanggal akhir', code: 'INVALID_DATE_RANGE' } },
        { status: 400 }
      )
    }

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff > 365) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: { message: 'Rentang tanggal maksimal 1 tahun (365 hari)', code: 'DATE_RANGE_TOO_LARGE' } },
        { status: 400 }
      )
    }

    const exportService = new TransactionExportService(prisma)
    const csvContent = await exportService.generateCSV(startDate, endDate)
    const filename = exportService.generateFilename(startDate, endDate)

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Transaction CSV Export Error:', error)
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: {
            message: error.message === 'Unauthorized' ? 'Anda harus login terlebih dahulu' : 'Hanya Owner yang dapat mengekspor data',
            code: error.message === 'Unauthorized' ? 'UNAUTHORIZED' : 'FORBIDDEN',
          },
        },
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      )
    }
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: { message: 'Terjadi kesalahan saat mengekspor data transaksi', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}
```

### Step 2: TypeScript check pada route baru

```powershell
npx tsc --noEmit --skipLibCheck 2>&1 | Select-String "transaksi-export"
```

Expected: Tidak ada output (tidak ada error)

### Step 3: Commit

```powershell
git add app/api/kasir/transaksi-export/route.ts
git commit -m "feat: add /api/kasir/transaksi-export API route"
```

---

## Task 3: UI — DateNavigation + DanaKasirDashboard + ExportDialog

**Files:**
- Modify: `features/dana-kasir/components/DateNavigation.tsx`
- Modify: `features/dana-kasir/components/DanaKasirDashboard.tsx`
- Modify: `features/dana-kasir/components/ExportDialog.tsx`

### Step 1: Baca DateNavigation untuk pahami struktur saat ini

```powershell
cat "features/dana-kasir/components/DateNavigation.tsx"
```

Perhatikan: interface props, import icons, dan di mana blok tombol Export dirender.

### Step 2: Modify DateNavigation.tsx

**Tambahkan ke interface props:**
```typescript
onExportTransaksi?: () => void
```

**Tambahkan tombol di samping tombol Export Dana Kasir.**

Cari blok `{canExport && (` dan tambahkan tombol kedua:

```tsx
{canExport && (
  <div className="flex items-center gap-2">
    <Button variant="outline" size="sm" onClick={onExport} className="flex items-center gap-1.5">
      <Download className="h-4 w-4" />
      Export Dana Kasir
    </Button>
    <Button variant="outline" size="sm" onClick={onExportTransaksi} className="flex items-center gap-1.5">
      <FileText className="h-4 w-4" />
      Export Transaksi
    </Button>
  </div>
)}
```

> Tambahkan `FileText` ke import dari `lucide-react` jika belum ada.

### Step 3: Modify ExportDialog.tsx — tambah prop exportType

**Ubah interface:**
```typescript
interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  exportType?: 'dana-kasir' | 'transaksi'
}
```

**Tambahkan derived values di dalam komponen:**
```typescript
const isTransaksiExport = exportType === 'transaksi'

const dialogTitle = isTransaksiExport ? 'Export Data Transaksi' : 'Export Data CSV'
const dialogDescription = isTransaksiExport
  ? 'Pilih rentang tanggal untuk mengekspor data transaksi dan informasi customer'
  : 'Pilih rentang tanggal untuk mengekspor data pendapatan dan pengeluaran'
const apiEndpoint = isTransaksiExport
  ? `/api/kasir/transaksi-export?startDate=${startDate}&endDate=${endDate}`
  : `/api/kasir/dana-export?startDate=${startDate}&endDate=${endDate}`
const defaultFilename = isTransaksiExport ? `transaksi-${startDate}.csv` : `dana-kasir-${startDate}.csv`
```

**Ganti hardcoded values di JSX dan di handleExport:**
- `<DialogTitle>` → gunakan `{dialogTitle}`
- `<DialogDescription>` → gunakan `{dialogDescription}`
- URL fetch di `handleExport` → gunakan `apiEndpoint`
- Fallback filename → gunakan `defaultFilename`

### Step 4: Modify DanaKasirDashboard.tsx

**Tambah state dan handlers:**
```typescript
const [showTransaksiExportDialog, setShowTransaksiExportDialog] = useState(false)

const handleExportTransaksi = () => setShowTransaksiExportDialog(true)
const handleTransaksiExportDialogClose = () => setShowTransaksiExportDialog(false)
```

**Pass ke DateNavigation:**
```tsx
<DateNavigation
  // ... semua props yang sudah ada ...
  onExportTransaksi={handleExportTransaksi}
/>
```

**Tambah ExportDialog kedua (setelah yang sudah ada):**
```tsx
<ExportDialog
  isOpen={showTransaksiExportDialog}
  onClose={handleTransaksiExportDialogClose}
  exportType="transaksi"
/>
```

### Step 5: TypeScript check menyeluruh

```powershell
npx tsc --noEmit --skipLibCheck 2>&1 | Select-String "ExportDialog|DateNavigation|DanaKasirDashboard"
```

Expected: Tidak ada output

### Step 6: Commit

```powershell
git add features/dana-kasir/components/DateNavigation.tsx
git add features/dana-kasir/components/ExportDialog.tsx
git add features/dana-kasir/components/DanaKasirDashboard.tsx
git commit -m "feat: add Export Transaksi button and dialog to Dana Kasir UI"
```

---

## Task 4: Final Verification

### Step 1: Jalankan semua test dana-kasir

```powershell
npx jest features/dana-kasir/ --no-coverage
```

Expected: PASS semua test (termasuk existing tests yang tidak boleh rusak)

### Step 2: TypeScript check final

```powershell
npx tsc --noEmit --skipLibCheck 2>&1 | head -20
```

Expected: Tidak ada output (clean)

### Step 3: Checklist manual (jika server jalan)

```
[ ] Login sebagai Owner -> buka /dana-kasir
[ ] Lihat 2 tombol: "Export Dana Kasir" dan "Export Transaksi"
[ ] Klik "Export Dana Kasir" -> dialog judul "Export Data CSV" -> download berisi Pendapatan/Pengeluaran
[ ] Klik "Export Transaksi" -> dialog judul "Export Data Transaksi" -> download berisi No. HP, Alamat, Jumlah Item
[ ] Login sebagai Kasir -> pastikan kedua tombol TIDAK muncul
```

### Step 4: Final commit

```powershell
git commit --allow-empty -m "feat: complete 2-CSV export architecture (Dana Kasir + Transaksi)"
```

---

## Ringkasan File

| # | File | Aksi |
|---|------|------|
| 1 | `features/dana-kasir/services/transactionExportService.ts` | CREATE |
| 2 | `features/dana-kasir/services/__tests__/transactionExportService.test.ts` | CREATE |
| 3 | `features/dana-kasir/services/index.ts` | MODIFY (+1 export) |
| 4 | `app/api/kasir/transaksi-export/route.ts` | CREATE |
| 5 | `features/dana-kasir/components/DateNavigation.tsx` | MODIFY |
| 6 | `features/dana-kasir/components/ExportDialog.tsx` | MODIFY |
| 7 | `features/dana-kasir/components/DanaKasirDashboard.tsx` | MODIFY |

**TIDAK diubah (penting):**
- `features/dana-kasir/services/csvExportService.ts`
- `app/api/kasir/dana-export/route.ts`

---

## CSV Output Final

### CSV 1: Export Dana Kasir (laporan keuangan — tidak berubah)
```
Tanggal,Tipe,Kode Transaksi,Nama Customer,Kategori,Deskripsi,Jumlah Rental,Jumlah Penalty,Total Jumlah,Kasir ID,Nama Kasir
2026-01-15,Pendapatan,TRX-001,Budi,,,150000,0,150000,kasir-abc,Andi
2026-01-15,Penalty Kondisi,TRX-001,Budi,,Penalty kondisi barang...,80000,,80000,kasir-abc,Andi
2026-01-15,Pengeluaran,,,,Operasional,Beli sabun,,50000,kasir-xyz,Budi
```

### CSV 2: Export Transaksi (data customer — BARU)
```
Tanggal,Kode Transaksi,Nama Customer,No. HP,Alamat,Jumlah Item,Status,Metode Bayar,Total Bayar,Catatan,Kasir
2026-01-15,TRX-001,Budi Santoso,081234567890,"Jl. Merdeka No.5",3,completed,tunai,150000,,Andi
2026-01-15,TRX-002,Siti Rahayu,089876543210,"Gg. Anggrek 7",2,active,qris,200000,,Budi
```
