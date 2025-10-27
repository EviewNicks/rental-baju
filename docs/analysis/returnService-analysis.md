# Analisis Bug RentedStock Tidak Terupdate - Return Service

## Ringkasan Masalah

**BUG KRITIS:** Return service tidak mengupdate `rentedStock` di tabel `Product` saat proses return, yang menyebabkan inconsistency data inventory.

**Lokasi File:** `features/kasir/services/returnService.ts`
**Baris Kritis:** 815-896 (area seharusnya ada product update)
**Severity:** HIGH - Data inconsistency yang mengakibatkan stock calculation error

## Analisis Detail

### 1. Root Cause Analysis

#### 1.1. Missing Implementation
Di `returnService.ts` pada baris 815-896, terdapat log untuk verifikasi stock update:
```typescript
// Lines 821-876
const productBeforeUpdate = await this.getProductForVerification(transactionItem.produkId, 'processUnifiedReturn')
const expectedNewStock = productBeforeUpdate.rentedStock - totalReturned
// ... extensive logging ...
const productAfterUpdate = await this.getProductForVerification(transactionItem.produkId, 'processUnifiedReturn')
```

**MASALAH:** Ada logging dan verifikasi stock, tetapi **TIDAK ADA** implementasi actual update ke database `rentedStock`.

#### 1.2. Perbandingan dengan Working Implementation

**✅ Working Implementation (transaksiService.ts):**
```typescript
// Line 1157-1165 - RESTORE product quantities
await tx.product.update({
  where: { id: item.produkId },
  data: {
    rentedStock: {
      decrement: quantityToRestore, // Reduce rented stock
    },
  },
})
```

**❌ Missing Implementation (returnService.ts):**
```typescript
// Line 815-896 - HANYA logging dan verifikasi
// TIDAK ADA actual product.update call
```

#### 1.3. CalculateExpectedStock Logic (Lines 158-181)

Logic perhitungan expected stock sudah benar:
```typescript
private calculateExpectedStock(currentStock: number, item: any, operation: 'pickup' | 'return'): number {
  if (operation === 'return') {
    const totalReturned = item.conditions?.reduce((sum: number, c: any) => sum + (c.jumlahKembali || 0), 0)
    return currentStock - totalReturned  // ✅ Benar: decrease rentedStock
  }
}
```

### 2. Flow Analysis

#### 2.1. Expected Flow (Saat Return 2 Item)
1. `rentedStock` saat ini: -2 (berarti 2 item sedang disewa)
2. Return 2 item → `rentedStock` should become: -2 + 2 = 0
3. **Actual outcome:** `rentedStock` remains -2 (tidak terupdate)

#### 2.2. Current Return Process Flow
```typescript
// 1. ✅ Validasi return
// 2. ✅ Calculate penalties
// 3. ✅ Create TransaksiItemReturn records
// 4. ✅ Update TransaksiItem (statusKembali: 'lengkap')
// 5. ❌ MISSING: Update Product.rentedStock (decrement)
// 6. ✅ Update Transaksi status to 'selesai'
// 7. ✅ Create activity logs
```

#### 2.3. Transaction Context Issue
Semua operasi berada dalam Prisma transaction:
```typescript
const result = await this.prisma.$transaction(async (tx) => {
  // ... tapi tidak ada tx.product.update call untuk rentedStock
})
```

### 3. Silent Failure Patterns

#### 3.1. False Positive Logging
Lines 846-896 menunjukkan logging yang extensive, tetapi sebenarnya:
- `productBeforeUpdate` dan `productAfterUpdate` akan selalu sama
- `stockUpdateSuccessful` akan selalu `false`
- `stockDifference` akan selalu sama dengan `totalReturned`

#### 3.2. Verification Without Update
```typescript
// Lines 852-853
const stockUpdateSuccessful = productAfterUpdate.rentedStock === expectedNewStock
const stockDifference = productAfterUpdate.rentedStock - expectedNewStock
```
Kode ini memverifikasi sesuatu yang tidak pernah terjadi (update stock).

### 4. Error Handling Analysis

#### 4.1. Detection Logic Exists
Lines 880-896 memiliki detection logic untuk inconsistency:
```typescript
if (!stockUpdateSuccessful) {
  kasirLogger.returnProcess.error('CRITICAL: Stock update inconsistency detected', ...)
}
```

**PROBLEM:** Error ini akan selalu ter-trigger karena tidak ada update yang terjadi.

#### 4.2. Transaction Rollback Scenarios
Lines 1036-1140 memiliki comprehensive error handling untuk transaction failures, tetapi:
- Tidak ada logic untuk stock update failure karena tidak ada stock update
- Silent failure detection (lines 1102-1135) tidak akan menangkap kasus ini

### 5. Comparison with Pickup Service

#### 5.1. Pickup Implementation (pickupService.ts)
```typescript
// Lines 135-136: NOTE yang penting!
// NOTE: rentedStock is already incremented during transaction creation
// So we don't need to increment it again during pickup
```

**Analisis:** Pickup service tidak update `rentedStock` karena sudah diincrement saat transaksi dibuat.

#### 5.2. Return Should Decrement
Return service HARUS mendecrement `rentedStock` karena:
- Pickup: `rentedStock` incremented (saat create transaction)
- Return: `rentedStock` harus decremented (saat proses return)

### 6. Database Transaction Analysis

#### 6.1. Current Transaction Scope
```typescript
const result = await this.prisma.$transaction(async (tx) => {
  // TransaksiItem updates ✅
  // TransaksiItemReturn creates ✅
  // Activity logs ✅
  // Product rentedStock update ❌ MISSING
})
```

#### 6.2. Required Addition
Perlu ditambahkan:
```typescript
await tx.product.update({
  where: { id: transactionItem.produkId },
  data: {
    rentedStock: {
      decrement: totalReturned,
    },
  },
})
```

### 7. Impact Analysis

#### 7.1. Business Impact
- **Stock Calculation Error:** `availableStock = quantity - rentedStock` akan salah
- **Availability Check Error:** System akan berpikir item masih disewa
- **Inventory Inconsistency:** Data tidak akurat untuk reporting

#### 7.2. System Impact
- **False Positives:** Stock inconsistency alerts akan selalu trigger
- **Data Integrity:** Long-term data inconsistency issues
- **User Experience:** Confusion tentang availability status

### 8. Root Cause Summary

**Primary Cause:** Missing implementation of `product.rentedStock` decrement di return process.

**Secondary Causes:**
1. Extensive logging yang menutupi missing implementation
2. Verification logic yang mengasumsikan update terjadi
3. False positive error detection

### 9. Recommended Fix

#### 9.1. Immediate Fix (Critical)
Tambahkan product update di baris 816 (setelah line 815):

```typescript
// Update product rentedStock (MISSING IMPLEMENTATION)
const totalReturned = item.conditions.reduce((sum, c) => sum + c.jumlahKembali, 0)

await tx.product.update({
  where: { id: transactionItem.produkId },
  data: {
    rentedStock: {
      decrement: totalReturned,
    },
  },
})
```

#### 9.2. Verification Update
Update verification logic untuk memverifikasi update yang benar-benar terjadi.

### 10. Testing Strategy

#### 10.1. Test Cases
1. **Normal Return:** Return 2 item dari rentedStock -2 → expected 0
2. **Partial Return:** Return 1 item dari rentedStock -3 → expected -2
3. **Multi-Condition:** Multiple conditions dengan total quantity yang benar
4. **Transaction Rollback:** Verify rollback jika ada error

#### 10.2. Verification Points
- `rentedStock` terupdate dengan benar
- `availableStock` calculation tetap konsisten
- No false positive inconsistency alerts
- Transaction integrity maintained

## Timeline

- **Discovery:** 2025-10-27
- **Impact:** Production data inconsistency
- **Priority:** CRITICAL
- **Estimated Fix Time:** 30 minutes (implementation + testing)

## Conclusion

Bug ini terjadi karena implementasi stock update yang missing di return service. Solusinya straightforward: tambahkan `tx.product.update` dengan `decrement` operation sesuai pattern yang sudah ada di `transaksiService.ts`.