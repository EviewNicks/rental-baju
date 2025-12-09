# Late Penalty Fix - Implementation Guide

**Date**: December 9, 2025  
**Issue**: Late penalty dihitung salah karena Math.ceil() membulatkan ke atas  
**Solution**: Bandingkan tanggal saja (tanpa jam/menit/detik)

---

## 🎯 Yang Perlu Diubah

### ✅ File yang Perlu Dimodifikasi

**HANYA 1 FILE**:
- `features/kasir/lib/utils/penaltyCalculator.ts` (Line 633-646)

### ❌ File yang TIDAK Perlu Diubah

- ✅ `app/api/kasir/transaksi/[kode]/pengembalian/route.ts` - Sudah benar, hanya memanggil service
- ✅ `features/kasir/services/returnService.ts` - Sudah benar, hanya memanggil calculator
- ✅ API routes lainnya - Tidak ada logic perhitungan penalty

---

## 🔧 Implementasi Fix

### Step 1: Update calculateFlatLatePenalty

**File**: `features/kasir/lib/utils/penaltyCalculator.ts`  
**Line**: 633-646

**Kode Lama** (SALAH):
```typescript
static calculateFlatLatePenalty(
  expectedDate: Date,
  actualDate: Date,
  customAmount?: number
): { isLate: boolean; penalty: number; lateDays: number } {
  const timeDiff = actualDate.getTime() - expectedDate.getTime()
  const lateDays = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)))  // ❌ Math.ceil
  const isLate = lateDays > 0

  return {
    isLate,
    penalty: isLate ? (customAmount || this.FLAT_LATE_PENALTY) : 0,
    lateDays
  }
}
```

**Kode Baru** (BENAR):
```typescript
static calculateFlatLatePenalty(
  expectedDate: Date,
  actualDate: Date,
  customAmount?: number
): { isLate: boolean; penalty: number; lateDays: number } {
  // ✅ FIX: Normalize ke tanggal saja (buang jam/menit/detik)
  // Ini memastikan pengembalian di hari yang sama tidak dianggap terlambat
  const expectedDay = new Date(
    expectedDate.getFullYear(), 
    expectedDate.getMonth(), 
    expectedDate.getDate()
  )
  const actualDay = new Date(
    actualDate.getFullYear(), 
    actualDate.getMonth(), 
    actualDate.getDate()
  )
  
  const timeDiff = actualDay.getTime() - expectedDay.getTime()
  const lateDays = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)))  // ✅ Math.floor
  const isLate = lateDays > 0

  return {
    isLate,
    penalty: isLate ? (customAmount || this.FLAT_LATE_PENALTY) : 0,
    lateDays
  }
}
```

**Perubahan**:
1. ✅ Normalize `expectedDate` dan `actualDate` ke 00:00:00
2. ✅ Gunakan `Math.floor()` bukan `Math.ceil()`
3. ✅ Hanya hitung hari penuh

---

## 📊 Dampak Perubahan

### Sebelum Fix

| Tanggal Selesai | Tanggal Kembali | timeDiff | lateDays (OLD) | Penalty (OLD) |
|-----------------|-----------------|----------|----------------|---------------|
| 14 Jan 00:00 | 14 Jan 08:00 | 8 jam | 1 hari ❌ | Rp 20.000 ❌ |
| 14 Jan 00:00 | 14 Jan 15:00 | 15 jam | 1 hari ❌ | Rp 20.000 ❌ |
| 14 Jan 00:00 | 14 Jan 23:59 | 23.9 jam | 1 hari ❌ | Rp 20.000 ❌ |
| 14 Jan 00:00 | 15 Jan 10:00 | 34 jam | 2 hari ❌ | Rp 20.000 ❌ |

### Setelah Fix

| Tanggal Selesai | Tanggal Kembali | expectedDay | actualDay | lateDays (NEW) | Penalty (NEW) |
|-----------------|-----------------|-------------|-----------|----------------|---------------|
| 14 Jan 00:00 | 14 Jan 08:00 | 14 Jan 00:00 | 14 Jan 00:00 | 0 hari ✅ | Rp 0 ✅ |
| 14 Jan 00:00 | 14 Jan 15:00 | 14 Jan 00:00 | 14 Jan 00:00 | 0 hari ✅ | Rp 0 ✅ |
| 14 Jan 00:00 | 14 Jan 23:59 | 14 Jan 00:00 | 14 Jan 00:00 | 0 hari ✅ | Rp 0 ✅ |
| 14 Jan 00:00 | 15 Jan 10:00 | 14 Jan 00:00 | 15 Jan 00:00 | 1 hari ✅ | Rp 20.000 ✅ |

---

## 🔍 Alur Lengkap Perhitungan Penalty

### 1. API Route (`pengembalian/route.ts`)
```typescript
// Hanya validasi dan routing, TIDAK ada logic penalty
const result = await unifiedReturnService.processUnifiedReturn(transaksiId, validatedData)
```

### 2. Return Service (`returnService.ts`)
```typescript
// Memanggil penalty calculator
const penaltyCalculation = await this.calculateBasicPenalties(
  transaksiId,
  request,
  validation.transaction!.transaction,
)
```

### 3. Penalty Calculator (`penaltyCalculator.ts`)
```typescript
// 2 path perhitungan:

// Path A: Enhanced (manual pricing)
const enhancedResult = PenaltyCalculator.calculateEnhancedTransactionPenalties(...)
  └─> calculateEnhancedPenalty(...)
      └─> calculateFlatLatePenalty(...)  // ⚠️ PERLU FIX DI SINI

// Path B: Standard (kondisi biasa)
const result = PenaltyCalculator.calculateTransactionPenalties(...)
  └─> calculateItemPenalty(...)
      └─> calculateLatePenalty(...)  // ⚠️ PERLU FIX DI SINI JUGA?
```

**TUNGGU!** Ada 2 fungsi perhitungan late penalty:
1. `calculateFlatLatePenalty()` - untuk sistem baru (flat 20k)
2. `calculateLatePenalty()` - untuk sistem lama (per hari)

Mari saya cek `calculateLatePenalty()`:

---

## ⚠️ TEMUAN PENTING: Ada 2 Fungsi Late Penalty!

### Fungsi 1: `calculateLatePenalty()` (Line 103-113)
```typescript
static calculateLatePenalty(
  expectedDate: Date, 
  actualDate: Date, 
  dailyRate: number = this.DEFAULT_DAILY_RATE
): number {
  const timeDiff = actualDate.getTime() - expectedDate.getTime()
  const lateDays = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)))  // ❌ Math.ceil
  
  const cappedLateDays = Math.min(lateDays, this.MAX_PENALTY_DAYS)
  
  return cappedLateDays * dailyRate
}
```

**Digunakan oleh**: `calculateItemPenalty()` → `calculateTransactionPenalties()` (Standard path)

### Fungsi 2: `calculateFlatLatePenalty()` (Line 633-646)
```typescript
static calculateFlatLatePenalty(
  expectedDate: Date,
  actualDate: Date,
  customAmount?: number
): { isLate: boolean; penalty: number; lateDays: number } {
  const timeDiff = actualDate.getTime() - expectedDate.getTime()
  const lateDays = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)))  // ❌ Math.ceil
  const isLate = lateDays > 0

  return {
    isLate,
    penalty: isLate ? (customAmount || this.FLAT_LATE_PENALTY) : 0,
    lateDays
  }
}
```

**Digunakan oleh**: `calculateEnhancedPenalty()` → `calculateEnhancedTransactionPenalties()` (Enhanced path)

---

## ✅ KESIMPULAN: Perlu Fix 2 Fungsi!

### File yang Perlu Diubah

**File**: `features/kasir/lib/utils/penaltyCalculator.ts`

**2 Fungsi yang perlu diperbaiki**:
1. ✅ `calculateLatePenalty()` (Line 103-113) - Standard path
2. ✅ `calculateFlatLatePenalty()` (Line 633-646) - Enhanced path

---

## 🔧 Fix Lengkap

### Fix 1: calculateLatePenalty() (Line 103-113)

**Kode Lama**:
```typescript
static calculateLatePenalty(
  expectedDate: Date, 
  actualDate: Date, 
  dailyRate: number = this.DEFAULT_DAILY_RATE
): number {
  const timeDiff = actualDate.getTime() - expectedDate.getTime()
  const lateDays = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)))
  
  const cappedLateDays = Math.min(lateDays, this.MAX_PENALTY_DAYS)
  
  return cappedLateDays * dailyRate
}
```

**Kode Baru**:
```typescript
static calculateLatePenalty(
  expectedDate: Date, 
  actualDate: Date, 
  dailyRate: number = this.DEFAULT_DAILY_RATE
): number {
  // ✅ FIX: Normalize ke tanggal saja (buang jam/menit/detik)
  const expectedDay = new Date(
    expectedDate.getFullYear(), 
    expectedDate.getMonth(), 
    expectedDate.getDate()
  )
  const actualDay = new Date(
    actualDate.getFullYear(), 
    actualDate.getMonth(), 
    actualDate.getDate()
  )
  
  const timeDiff = actualDay.getTime() - expectedDay.getTime()
  const lateDays = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)))  // ✅ Math.floor
  
  const cappedLateDays = Math.min(lateDays, this.MAX_PENALTY_DAYS)
  
  return cappedLateDays * dailyRate
}
```

### Fix 2: calculateFlatLatePenalty() (Line 633-646)

**Sudah dijelaskan di atas** ✅

---

## 🧪 Testing

### Test Cases yang Perlu Diupdate

**File**: `__tests__/unit/kasir/penalty-system.test.ts`

#### Test 1: Same Day Return (Pagi)
```typescript
it('should NOT charge late penalty for same-day return (morning)', () => {
  const expectedDate = new Date('2025-09-01T00:00:00.000Z')
  const actualDate = new Date('2025-09-01T08:00:00.000Z')  // 8 AM same day
  
  const result = PenaltyCalculator.calculateFlatLatePenalty(expectedDate, actualDate)
  
  expect(result.isLate).toBe(false)
  expect(result.lateDays).toBe(0)
  expect(result.penalty).toBe(0)
})
```

#### Test 2: Same Day Return (Malam)
```typescript
it('should NOT charge late penalty for same-day return (evening)', () => {
  const expectedDate = new Date('2025-09-01T00:00:00.000Z')
  const actualDate = new Date('2025-09-01T23:59:59.000Z')  // 11:59 PM same day
  
  const result = PenaltyCalculator.calculateFlatLatePenalty(expectedDate, actualDate)
  
  expect(result.isLate).toBe(false)
  expect(result.lateDays).toBe(0)
  expect(result.penalty).toBe(0)
})
```

#### Test 3: Late 1 Day
```typescript
it('should charge late penalty for 1 day late', () => {
  const expectedDate = new Date('2025-09-01T00:00:00.000Z')
  const actualDate = new Date('2025-09-02T10:00:00.000Z')  // Next day
  
  const result = PenaltyCalculator.calculateFlatLatePenalty(expectedDate, actualDate)
  
  expect(result.isLate).toBe(true)
  expect(result.lateDays).toBe(1)
  expect(result.penalty).toBe(20000)
})
```

#### Test 4: Late 2 Days
```typescript
it('should charge late penalty for 2 days late', () => {
  const expectedDate = new Date('2025-09-01T00:00:00.000Z')
  const actualDate = new Date('2025-09-03T15:00:00.000Z')  // 2 days later
  
  const result = PenaltyCalculator.calculateFlatLatePenalty(expectedDate, actualDate)
  
  expect(result.isLate).toBe(true)
  expect(result.lateDays).toBe(2)
  expect(result.penalty).toBe(20000)  // Flat 20k regardless of days
})
```

---

## 📋 Checklist Implementasi

### Pre-Implementation
- [ ] Backup file `penaltyCalculator.ts`
- [ ] Review kode yang akan diubah
- [ ] Pastikan tidak ada perubahan lain yang sedang berjalan

### Implementation
- [ ] Update `calculateLatePenalty()` (Line 103-113)
- [ ] Update `calculateFlatLatePenalty()` (Line 633-646)
- [ ] Tambahkan comment explaining the fix
- [ ] Format kode dengan Prettier

### Testing
- [ ] Run unit tests: `npm test penalty-system.test.ts`
- [ ] Update test cases yang gagal
- [ ] Tambahkan test cases baru untuk same-day returns
- [ ] Test manual dengan data real

### Verification
- [ ] Test dengan transaksi yang dikembalikan tepat waktu
- [ ] Test dengan transaksi yang terlambat 1 hari
- [ ] Test dengan transaksi yang terlambat 2+ hari
- [ ] Cek API response dana-summary
- [ ] Cek penalty breakdown di transaksi detail

### Deployment
- [ ] Commit changes dengan message yang jelas
- [ ] Push ke branch
- [ ] Create PR dengan dokumentasi lengkap
- [ ] Review dan merge
- [ ] Deploy ke staging
- [ ] Test di staging
- [ ] Deploy ke production
- [ ] Monitor error logs

---

## 🎯 Expected Results

### Sebelum Fix
- ❌ Dikembalikan jam 15:00 di hari yang sama → Kena penalty Rp 20.000
- ❌ Customer komplain ditagih tidak adil
- ❌ Laporan keuangan tidak akurat

### Setelah Fix
- ✅ Dikembalikan kapan saja di hari yang sama → Tidak kena penalty
- ✅ Hanya terlambat hari berikutnya yang kena penalty
- ✅ Perhitungan adil dan transparan
- ✅ Customer puas
- ✅ Laporan keuangan akurat

---

## 🚨 Rollback Plan

Jika ada masalah setelah deployment:

### Option 1: Git Revert
```bash
git revert <commit-hash>
git push origin main
```

### Option 2: Manual Rollback
Restore file dari backup:
```bash
cp penaltyCalculator.ts.backup features/kasir/lib/utils/penaltyCalculator.ts
git commit -m "Rollback: Revert late penalty calculation fix"
git push origin main
```

---

**Estimated Time**: 1-2 jam (implementation + testing)  
**Risk Level**: 🟡 MEDIUM (affects billing, but easy to rollback)  
**Priority**: 🔴 HIGH (customer billing accuracy)
