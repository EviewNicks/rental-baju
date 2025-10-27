# ProductSize Quantity Restoration Bug Fix

**Date:** 2025-10-27
**Issue:** Critical bug where `ProductSize.quantity` tidak dikembalikan saat return transaction
**Status:** ✅ FIXED
**Related:** Similar to `Product.rentedStock` bug (fixed in same session)

---

## 🚨 Problem Statement

### **Symptom**
Setelah rental transaction di-return, `ProductSize.quantity` tetap berkurang dan tidak dikembalikan, menyebabkan size-specific stock permanently incorrect.

### **Business Impact**
- ❌ Size-specific availability calculation salah
- ❌ Inventory management per size corrupted
- ❌ Cannot accurately track which sizes are available
- ❌ Long-term data corruption accumulating over time

---

## 🔍 Root Cause Analysis

### **1. Architectural Limitation**
```prisma
// TransaksiItem model TIDAK memiliki field productSizeId
model TransaksiItem {
  id            String  @id @default(uuid())
  transaksiId   String
  produkId      String  // ✅ HAS productId
  // ❌ MISSING: productSizeId field!
  kondisiAwal   String? // 🔧 Used as workaround
  // ...
}
```

### **2. Temporary Workaround**
Developer aware tentang limitation dan implement workaround di `transaksiService.ts`:

```typescript
// Line 444-450: Store productSizeId in kondisiAwal field
kondisiAwal: `${item.productSizeId}|${productSize.size}|${productSize.ageCategory}|${item.kondisiAwal || ''}`

// Format: "productSizeId|size|ageCategory|originalCondition"
// Example: "fd82db20-3067-41f8-80f7-de084477425d|M|ADULT|Baik"
```

### **3. Missing Return Logic**
```typescript
// CREATE TRANSACTION (transaksiService.ts line 520-530)
await tx.productSize.updateMany({
  data: {
    quantity: { decrement: item.jumlah } // ✅ CORRECTLY DECREMENTED
  }
})

// RETURN TRANSACTION (returnService.ts - BEFORE FIX)
// ❌ NO CODE TO RESTORE ProductSize.quantity!
```

---

## ✅ Solution Implementation

### **Implementation Location**
**File:** `features/kasir/services/returnService.ts`
**Line:** 833-917 (added after Product.rentedStock update)

### **Key Components**

#### **1. Parse kondisiAwal Field**
```typescript
// Use existing utility function
const parsedKondisi = parseKondisiAwal(transactionItem.kondisiAwal)

// Returns: { productSizeId, size, ageCategory, condition, isLegacyFormat }
```

#### **2. Restore ProductSize.quantity**
```typescript
if (parsedKondisi?.productSizeId && !parsedKondisi.isLegacyFormat) {
  // Verify ProductSize exists
  const productSizeBeforeRestore = await tx.productSize.findUnique({
    where: { id: parsedKondisi.productSizeId },
  })

  if (productSizeBeforeRestore) {
    // RESTORE size-specific stock
    await tx.productSize.update({
      where: { id: parsedKondisi.productSizeId },
      data: {
        quantity: { increment: totalReturned }
      }
    })
  }
}
```

#### **3. Comprehensive Logging**
```typescript
kasirLogger.returnProcess.info('processUnifiedReturn', 'ProductSize quantity restored successfully', {
  productSizeId,
  size,
  ageCategory,
  previousQuantity,
  quantityIncremented,
  newQuantity,
})
```

### **Edge Cases Handled**
- ✅ Missing `kondisiAwal` (legacy transactions)
- ✅ Invalid `productSizeId` format
- ✅ ProductSize deleted/not found
- ✅ Parse errors and exceptions
- ✅ Graceful degradation (doesn't block return process)

---

## 📊 Before vs After Fix

### **Before Fix:**
```
CREATE TRANSACTION (Rental 2x Size M):
├─ Product.rentedStock: 0 → -2 ✅
└─ ProductSize(M).quantity: 5 → 3 ✅

RETURN TRANSACTION:
├─ Product.rentedStock: -2 → 0 ✅ (fixed earlier today)
└─ ProductSize(M).quantity: 3 → 3 ❌ (NOT RESTORED - BUG!)

RESULT: Stock corruption! Size M permanently shows 3 instead of 5
```

### **After Fix:**
```
CREATE TRANSACTION (Rental 2x Size M):
├─ Product.rentedStock: 0 → -2 ✅
└─ ProductSize(M).quantity: 5 → 3 ✅

RETURN TRANSACTION:
├─ Product.rentedStock: -2 → 0 ✅
└─ ProductSize(M).quantity: 3 → 5 ✅ (RESTORED!)

RESULT: All stock values correct! ✅
```

---

## 🧪 Testing & Verification

### **SQL Verification Query**
```sql
SELECT
  p.id as product_id,
  p.code,
  p.name,
  p.quantity as product_total_quantity,
  p."rentedStock" as product_rented_stock,
  (p.quantity - p."rentedStock") as product_available,
  ps.id as size_id,
  ps.size,
  ps."ageCategory",
  ps.quantity as size_quantity,
  ps."isActive" as size_active
FROM "Product" p
LEFT JOIN "ProductSize" ps ON ps."productId" = p.id
WHERE p.code = 'JPH01'
ORDER BY ps.size;
```

### **Manual Test Scenario**
1. **Check Initial State:**
   - Product: `quantity=10, rentedStock=0`
   - Size M: `quantity=5`
   - Size L: `quantity=5`

2. **Create Rental Transaction (2x Size M):**
   - Expected: `rentedStock=-2`, Size M `quantity=3`

3. **Verify Decrement:**
   ```sql
   -- Should show: rentedStock=-2, Size M quantity=3
   ```

4. **Process Return Transaction:**
   - Return all 2 items

5. **Verify Restoration:**
   ```sql
   -- Should show: rentedStock=0, Size M quantity=5
   ```

### **Expected Log Output**
```
[INFO] ProductSize quantity restored successfully
{
  productSizeId: "fd82db20-...",
  size: "M",
  ageCategory: "ADULT",
  previousQuantity: 3,
  quantityIncremented: 2,
  newQuantity: 5
}
```

---

## 🔧 Code Changes Summary

### **Files Modified**
1. `features/kasir/services/returnService.ts`
   - Added ProductSize restoration logic (85 lines)
   - Comprehensive logging for debugging
   - Graceful error handling

### **Dependencies Used**
- ✅ `parseKondisiAwal()` - Existing utility (already implemented)
- ✅ `kasirLogger` - Existing logging service
- ✅ `tx.productSize.update()` - Prisma transaction API

### **Total Lines Changed**
- **Added:** ~85 lines (logic + logging + error handling)
- **Modified:** 0 lines (insertion only)
- **Deleted:** 0 lines

---

## ⚠️ Known Limitations & Future Work

### **Current Limitations**
1. **Schema Limitation:** TransaksiItem still doesn't have dedicated `productSizeId` field
2. **Encoding Dependency:** Relies on `kondisiAwal` encoding format
3. **Legacy Compatibility:** Old transactions without encoded productSizeId cannot restore size quantity

### **Recommended Future Improvements**
1. **Schema Migration:** Add `productSizeId` field to TransaksiItem model
   ```prisma
   model TransaksiItem {
     // ... existing fields
     productSizeId  String?  // Add proper field
     // ...
   }
   ```

2. **Data Migration Script:** Backfill productSizeId for existing transactions
3. **Remove Encoding:** Use direct field reference instead of parsing

---

## 📈 Impact Assessment

### **Risk Level:** 🟢 Low
- Isolated code change
- Defensive programming with error handling
- Doesn't break existing functionality
- Similar pattern to rentedStock fix (proven approach)

### **Performance Impact:** Negligible
- One additional `findUnique` query (with index)
- One `update` query per item returned
- Executes within existing transaction scope

### **Data Integrity:** ✅ Improved
- Fixes ongoing data corruption
- Prevents future size quantity inconsistencies
- Maintains historical transaction integrity

---

## 🎓 Lessons Learned

1. **Architectural Awareness:** Schema limitations require creative workarounds
2. **Dual Validation:** Both Product and ProductSize levels need consistent updates
3. **Defensive Programming:** Always verify entity existence before operations
4. **Comprehensive Logging:** Critical for debugging production issues
5. **Graceful Degradation:** Don't block entire process for non-critical failures

---

## 📚 Related Documentation

- **Similar Issue:** `docs/analysis/rentedstock-restoration-fix.md`
- **Parser Utility:** `features/kasir/lib/utils/kondisiAwalParser.ts`
- **Transaction Service:** `features/kasir/services/transaksiService.ts` (line 440-530)
- **Return Service:** `features/kasir/services/returnService.ts` (line 833-917)

---

**Fixed By:** Ardiansyah Arifin + Claude Code (Sonnet 4.5)
**Date:** 2025-10-27
**Session:** Critical Bug Fix Sprint - Stock Restoration Issues
