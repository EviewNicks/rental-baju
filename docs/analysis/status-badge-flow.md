# Status Badge System Analysis

## Overview
Analisis lengkap sistem status badge pada fitur kasir, menjelaskan bagaimana komponen StatusBadge bekerja dan terintegrasi dengan seluruh sistem.

## Arsitektur Sistem

### 1. Komponen Utama

#### StatusBadge Component (`features/kasir/components/ui/status-badge.tsx`)
```typescript
interface StatusBadgeProps {
  status: TransactionStatus
  className?: string
  'data-testid'?: string
  'aria-label'?: string
}
```

**Fitur Utama:**
- Menampilkan status transaksi dengan styling yang konsisten
- Fallback configuration untuk status yang tidak terdefinisi
- Accessibility support (aria-label, role="status", title)
- Customizable styling melalui className prop

#### Status Types (`features/kasir/types.ts`)
```typescript
export type TransactionStatus =
  | 'active'      // Transaksi aktif, belum diambil
  | 'diambil'     // Barang sudah diambil customer
  | 'selesai'     // Transaksi selesai
  | 'terlambat'   // Transaksi terlambat
  | 'cancelled'   // Transaksi dibatalkan
  | 'pending_resolution' // Menunggu resolusi barang hilang
```

### 2. Konfigurasi UI (`features/kasir/lib/constants/uiConfig.ts`)

```typescript
export const statusConfig: Record<string, {
  label: string;        // Text yang ditampilkan
  className: string;    // Tailwind CSS classes
  description: string;  // Deskripsi untuk accessibility
}> = {
  active: {
    label: 'Aktif',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Transaksi sedang berjalan',
  },
  diambil: {
    label: 'Diambil',
    className: 'bg-green-100 text-green-800 border-green-200',
    description: 'Barang sudah diambil customer',
  },
  selesai: {
    label: 'Selesai',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    description: 'Transaksi telah selesai',
  },
  terlambat: {
    label: 'Terlambat',
    className: 'bg-red-100 text-red-800 border-red-200',
    description: 'Transaksi terlambat dikembalikan',
  },
  cancelled: {
    label: 'Dibatalkan',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    description: 'Transaksi dibatalkan',
  },
  // Legacy support
  dikembalikan: {
    label: 'Selesai',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    description: 'Transaksi telah selesai',
  },
}
```

### 3. Status Calculation Logic (`features/kasir/services/transaksiService.ts`)

**calculateEnhancedStatus Function - Priority Order:**

1. **Explicit Overdue Status** (`terlambat`)
   - Jika status sudah terlambat, tetap terlambat

2. **Cancelled Status** (`cancelled`)
   - Jika transaksi dibatalkan, tetap cancelled

3. **Explicit Completed Status** (`selesai`)
   - Jika status sudah selesai, tetap selesai

4. **Auto-Complete Logic**
   - Jika semua item sudah dikembalikan (`statusKembali === 'lengkap'`)
   - Otomatis ubah status menjadi `selesai`

5. **Overdue Check**
   - Jika tanggal sekarang > endDate dan status `active`/`diambil`
   - Ubah status menjadi `terlambat`

6. **Pickup Detection**
   - Jika semua item sudah diambil (`jumlahDiambil >= jumlah`)
   - Ubah status dari `active` menjadi `diambil`

### 4. Data Flow

```
Backend (TransaksiService)
    ↓ calculateEnhancedStatus()
API Response (TransaksiResponse)
    ↓ kasirApi.transaksi.getByKode()
useTransactionDetail Hook
    ↓ React Query
TransactionDetailPage
    ↓ transaction.status prop
StatusBadge Component
    ↓ statusConfig lookup
Rendered Badge
```

### 5. Integration Points

#### Primary Usage:
- **TransactionDetailPage**: Header dan transaction info section
- **TransactionsTable**: Status column dalam tabel transaksi
- **ProductHistoryPopup**: Status dalam history popup

#### Secondary Usage:
- **TransactionLookup**: Status dalam hasil pencarian
- **Dashboard Components**: Various status displays

### 6. Status Utilities (`features/kasir/lib/utils/statusUtils.ts`)

**Helper Functions:**
- `hasPickupItems()`: Cek apakah ada item yang sudah diambil
- `isOverdue()`: Cek apakah transaksi terlambat
- `hasValidItemData()`: Validasi data item untuk kalkulasi status

### 7. Hook Integration (`features/kasir/hooks/useTransactionDetail.ts`)

```typescript
export function useTransactionDetail(transactionId: string) {
  const { data: apiData, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.kasir.transaksi.detail(transactionId),
    queryFn: () => kasirApi.transaksi.getByKode(transactionId),
    // ... other options
  })
  
  // Status sudah dikalkulasi di backend
  return { transaction: apiData, ... }
}
```

## Keunggulan Arsitektur

### 1. Centralized Configuration
- Semua styling dan label status terpusat di `uiConfig.ts`
- Mudah maintenance dan konsistensi UI

### 2. Type Safety
- TypeScript types untuk semua status values
- Compile-time error detection

### 3. Backend-Driven Status
- Status calculation di backend untuk konsistensi
- Menghindari mismatch antara frontend dan backend

### 4. Defensive Programming
- Fallback configuration untuk status yang tidak terdefinisi
- Graceful handling untuk edge cases

### 5. Accessibility Support
- ARIA labels dan role attributes
- Screen reader friendly

### 6. Backward Compatibility
- Support untuk legacy status values
- Smooth migration path

## File Dependencies

### Core Files:
1. `features/kasir/components/ui/status-badge.tsx` - UI Component
2. `features/kasir/lib/constants/uiConfig.ts` - Configuration
3. `features/kasir/types.ts` - Type definitions
4. `features/kasir/services/transaksiService.ts` - Status calculation
5. `features/kasir/hooks/useTransactionDetail.ts` - Data fetching

### Supporting Files:
6. `features/kasir/lib/utils/statusUtils.ts` - Helper utilities
7. `features/kasir/components/detail/TransactionDetailPage.tsx` - Main consumer
8. `features/kasir/components/dashboard/TransactionsTable.tsx` - Table usage

## Testing Strategy

### Unit Tests:
- StatusBadge component rendering
- Status configuration mapping
- calculateEnhancedStatus logic
- Status utility functions

### Integration Tests:
- TransactionDetailPage status display
- Status updates in real-time
- Error handling for invalid statuses

## Maintenance Guidelines

### Adding New Status:
1. Add to `TransactionStatus` type in `types.ts`
2. Add configuration in `uiConfig.ts`
3. Update `calculateEnhancedStatus` logic if needed
4. Add test cases

### Modifying Status Logic:
1. Update `calculateEnhancedStatus` function
2. Update related utility functions
3. Update test cases
4. Verify integration points

### UI Changes:
1. Modify `statusConfig` in `uiConfig.ts`
2. Test across all integration points
3. Verify accessibility compliance

## Kesimpulan

Sistem status badge memiliki arsitektur yang solid dengan:
- Separation of concerns yang jelas
- Centralized configuration
- Type safety dan error handling
- Accessibility support
- Backward compatibility

Sistem ini mudah di-maintain dan extend untuk kebutuhan future development.