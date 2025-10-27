# Bug Fix: Manual Pricing Fields Stripped by Zod Validation

**Tanggal:** 2025-10-26
**Bug ID:** RPK-PENALTY-001
**Severity:** 🔴 **CRITICAL** - Manual pricing tidak berfungsi sama sekali
**Status:** ✅ **ROOT CAUSE IDENTIFIED** - Ready for implementation

---

## 🐛 Bug Report

### User Report Evidence:

**Input oleh Kasir:**
- Item 1 (Kotor): **8.000 IDR**
- Item 2 (Rusak Ringan): **17.000 IDR**

**Penalty Tercatat di Database:**
- Item 1 (Kotor): **5.000 IDR** ❌ (hardcoded default)
- Item 2 (Rusak Ringan): **15.000 IDR** ❌ (hardcoded default)

**Bukti dari API Log (`docs/api.log`):**
```json
{
  "kondisiAkhir": "Kotor",
  "totalReturnPenalty": 5000,  // ❌ Should be 8000!
  "penaltyAmount": 5000
}

{
  "kondisiAkhir": "Rusak Ringan",
  "totalReturnPenalty": 15000,  // ❌ Should be 17000!
  "penaltyAmount": 15000
}

"calculationMethod": "condition-based"  // ❌ Should be "manual_pricing"!
```

---

## 🔍 Root Cause Analysis (Sequential Thinking - 8 Steps)

### Step 1: Evidence Analysis
API log menunjukkan penalty menggunakan hardcoded values (5k, 15k) bukan manual input (8k, 17k). Ini berarti **legacy calculator** masih digunakan, bukan enhanced calculator.

### Step 2: Frontend Verification
**File:** `features/kasir/components/return/SimpleReturnForm.tsx`

Lines 338-352 menunjukkan UI **BENAR** mengirim manual pricing fields:
```typescript
const apiRequest = {
  items: Object.entries(formState.itemConditions).map(([itemId, condition]) => ({
    itemId,
    conditions: condition.conditions.map((c) => ({
      kondisiAkhir: c.kondisiAkhir,
      jumlahKembali: c.jumlahKembali,
      conditionCategory: c.conditionCategory,  // ✅ Sent
      useManualPricing: c.useManualPricing,    // ✅ Sent
      manualPrice: c.manualPrice,              // ✅ Sent (8000, 17000)
    })),
  })),
}
```

**Frontend calculation (lines 169-171) juga benar:**
```typescript
const effectivePrice = c.conditionCategory === 'BAIK' ? 0 : c.manualPrice || 0
itemPenalty += effectivePrice * c.jumlahKembali
```

✅ **Kesimpulan:** Frontend tidak bermasalah, mengirim data dengan lengkap.

### Step 3: API Route Verification
**File:** `app/api/kasir/transaksi/[kode]/pengembalian/route.ts`

Lines 108-133 menunjukkan format detection **BENAR**:
```typescript
if ('kondisiAkhir' in firstItem && !('conditions' in firstItem)) {
  isLegacyFormat = true
  validatedData = convertLegacyToUnified(legacyBody)
} else {
  // Unified format - direct cast
  validatedData = body as UnifiedReturnRequest  // ✅ Data intact
}
```

Data dari SimpleReturnForm masuk ke branch `else` (unified format) dan di-cast langsung. Semua field manual pricing **seharusnya** tetap ada.

✅ **Kesimpulan:** API route tidak bermasalah, data di-pass dengan benar.

### Step 4: Zod Validation - **SMOKING GUN!**
**File:** `features/kasir/lib/validation/ReturnSchema.ts`

Lines 38-71 menunjukkan schema **TIDAK LENGKAP**:
```typescript
export const unifiedConditionSchema = z.object({
  kondisiAkhir: z.string()...,
  jumlahKembali: z.number()...,
  modalAwal: z.number().optional(),
  // ❌ MISSING: conditionCategory
  // ❌ MISSING: manualPrice
  // ❌ MISSING: useManualPricing
})
```

**CRITICAL BUG:** Zod schema TIDAK mendefinisikan manual pricing fields!

Route.ts line 136 melakukan validation:
```typescript
validatedData = unifiedReturnRequestSchema.parse(validatedData)
```

**Behavior Zod `.parse()`:**
- ✅ Validates defined fields
- ❌ **STRIPS all unknown/undefined fields by default!**

**Hasil setelah validation:**
```json
// BEFORE Zod validation (from SimpleReturnForm):
{
  "kondisiAkhir": "Kotor",
  "jumlahKembali": 1,
  "conditionCategory": "KOTOR",     // ✅ Sent
  "manualPrice": 8000,              // ✅ Sent
  "useManualPricing": true          // ✅ Sent
}

// AFTER Zod validation (fields stripped!):
{
  "kondisiAkhir": "Kotor",
  "jumlahKembali": 1
  // ❌ conditionCategory GONE
  // ❌ manualPrice GONE
  // ❌ useManualPricing GONE
}
```

🎯 **ROOT CAUSE CONFIRMED:** Zod validation menghapus manual pricing fields!

### Step 5: Service Layer Impact
**File:** `features/kasir/services/returnService.ts`

Lines 398-402 melakukan branch check:
```typescript
const hasManualPricing = request.items.some((item) =>
  item.conditions.some(
    (condition) => 'conditionCategory' in condition && 'manualPrice' in condition,
  ),
)
```

**Setelah Zod strips fields:**
- `'conditionCategory' in condition` → **FALSE** ❌
- `'manualPrice' in condition` → **FALSE** ❌
- `hasManualPricing` → **FALSE** ❌

**Result:**
```typescript
if (hasManualPricing) {
  // Enhanced calculator (manual pricing) ← NOT REACHED!
} else {
  // Legacy calculator (hardcoded values) ← EXECUTED!
}
```

**Legacy calculator dipanggil** dengan hardcoded values:
- Kotor: 5.000 IDR (hardcoded)
- Rusak Ringan: 15.000 IDR (hardcoded)

### Step 6-8: Solution Design & Verification
*(Covered in Solution section below)*

---

## 📊 Data Flow Diagram (Bug Path)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. SimpleReturnForm (UI)                                        │
│    ✅ manualPrice: 8000, 17000                                  │
│    ✅ conditionCategory: KOTOR, RUSAK_RINGAN                    │
│    ✅ useManualPricing: true                                    │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. API Route                                                     │
│    ✅ Detects unified format correctly                          │
│    ✅ Casts to UnifiedReturnRequest                             │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Zod Validation (ReturnSchema.ts)                             │
│    ❌ Schema doesn't define manual pricing fields               │
│    ❌ .parse() STRIPS unknown fields                            │
│    ❌ manualPrice: 8000 → REMOVED                               │
│    ❌ conditionCategory → REMOVED                               │
│    ❌ useManualPricing → REMOVED                                │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. ReturnService                                                 │
│    ❌ hasManualPricing check → FALSE                            │
│    ❌ Falls back to LEGACY calculator                           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Legacy Calculator                                             │
│    ❌ Uses HARDCODED values:                                    │
│       - Kotor: 5.000 IDR (not 8.000!)                          │
│       - Rusak Ringan: 15.000 IDR (not 17.000!)                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Solution Implementation

### Fix Location:
**File:** `features/kasir/lib/validation/ReturnSchema.ts`
**Lines:** 38-71 (unifiedConditionSchema)

### Required Changes:

```typescript
// BEFORE (Current - BUGGY):
export const unifiedConditionSchema = z.object({
  kondisiAkhir: z
    .string()
    .min(4, 'Kondisi akhir minimal 4 karakter')
    .max(500, 'Kondisi akhir maksimal 500 karakter')
    .regex(
      /^[a-zA-Z0-9\s.,;:()\-—–_!?'"\/]+$/,
      'Kondisi akhir hanya boleh mengandung huruf, angka, dan tanda baca',
    ),
  jumlahKembali: z
    .number()
    .int('Jumlah kembali harus berupa bilangan bulat')
    .min(0, 'Jumlah kembali tidak boleh negatif')
    .max(999, 'Jumlah kembali maksimal 999'),
  modalAwal: z.number().positive('Modal awal harus bernilai positif').optional(),
})
```

```typescript
// AFTER (Fixed - with manual pricing fields):
export const unifiedConditionSchema = z.object({
  kondisiAkhir: z
    .string()
    .min(4, 'Kondisi akhir minimal 4 karakter')
    .max(500, 'Kondisi akhir maksimal 500 karakter')
    .regex(
      /^[a-zA-Z0-9\s.,;:()\-—–_!?'"\/]+$/,
      'Kondisi akhir hanya boleh mengandung huruf, angka, dan tanda baca',
    ),
  jumlahKembali: z
    .number()
    .int('Jumlah kembali harus berupa bilangan bulat')
    .min(0, 'Jumlah kembali tidak boleh negatif')
    .max(999, 'Jumlah kembali maksimal 999'),
  modalAwal: z.number().positive('Modal awal harus bernilai positif').optional(),

  // ✅ ADDED: Manual pricing fields (RPK-PENALTY-001 fix)
  conditionCategory: z
    .enum(['BAIK', 'KOTOR', 'RUSAK_RINGAN', 'RUSAK_BERAT', 'HILANG'])
    .optional(),
  manualPrice: z
    .number()
    .min(0, 'Manual price tidak boleh negatif')
    .optional(),
  useManualPricing: z.boolean().optional(),
})
```

### Type Safety:
TypeScript type akan otomatis di-update (line 164):
```typescript
export type UnifiedReturnCondition = z.infer<typeof unifiedConditionSchema>
// Now includes: conditionCategory?, manualPrice?, useManualPricing?
```

### Why This Fix Works:

1. **Zod Preserves Fields:**
   - Dengan field didefinisikan di schema, Zod tidak akan strip fields
   - Manual pricing data akan lolos validation

2. **Branch Logic Works:**
   ```typescript
   const hasManualPricing = request.items.some((item) =>
     item.conditions.some(
       (condition) => 'conditionCategory' in condition && 'manualPrice' in condition,
     ),
   )
   // Now returns TRUE! ✅
   ```

3. **Enhanced Calculator Used:**
   - Branch akan masuk ke enhanced calculator
   - `calculateManualPricingPenalty()` akan menggunakan kasir-defined values
   - Penalty calculation: `manualPrice × quantity`

4. **Backward Compatible:**
   - Semua field OPTIONAL (`.optional()`)
   - Legacy format tetap work (tidak punya field ini)
   - Zero breaking changes

---

## 🧪 Testing Strategy

### 1. Unit Test (Schema Validation)
```typescript
// Test: Schema accepts manual pricing fields
const validCondition = {
  kondisiAkhir: 'Kotor',
  jumlahKembali: 1,
  conditionCategory: 'KOTOR',
  manualPrice: 8000,
  useManualPricing: true,
}

const result = unifiedConditionSchema.safeParse(validCondition)
expect(result.success).toBe(true)
expect(result.data.manualPrice).toBe(8000) // ✅ Not stripped!
```

### 2. Integration Test (Complete Flow)
```typescript
// Test: End-to-end manual pricing flow
const returnRequest = {
  items: [{
    itemId: 'test-id',
    conditions: [{
      kondisiAkhir: 'Kotor',
      jumlahKembali: 1,
      conditionCategory: 'KOTOR',
      manualPrice: 8000,
      useManualPricing: true,
    }],
  }],
  catatan: 'Test manual pricing',
  tglKembali: new Date().toISOString(),
}

const response = await fetch('/api/kasir/transaksi/TXN-TEST/pengembalian', {
  method: 'PUT',
  body: JSON.stringify(returnRequest),
})

const result = await response.json()
expect(result.data.totalPenalty).toBe(8000) // ✅ Uses manual price!
```

### 3. Manual Testing Checklist

**Test Case 1: Manual Pricing - Kotor**
```
✅ Input: 8.000 IDR untuk kondisi Kotor
✅ Expected: Penalty = 8.000 IDR
✅ Verify: API log shows 8000 (not 5000)
✅ Verify: calculationMethod = "manual_pricing"
```

**Test Case 2: Manual Pricing - Rusak Ringan**
```
✅ Input: 17.000 IDR untuk kondisi Rusak Ringan
✅ Expected: Penalty = 17.000 IDR
✅ Verify: API log shows 17000 (not 15000)
✅ Verify: calculationMethod = "manual_pricing"
```

**Test Case 3: BAIK Condition (Auto 0)**
```
✅ Input: Kondisi BAIK (no manual price needed)
✅ Expected: Penalty = 0 IDR
✅ Verify: useManualPricing = false
✅ Verify: manualPrice = 0
```

**Test Case 4: Multiple Conditions**
```
✅ Input: Item 1 (Kotor 8k) + Item 2 (Rusak Ringan 17k)
✅ Expected: Total penalty = 25.000 IDR
✅ Verify: Both use manual pricing
✅ Verify: Breakdown correct for each item
```

**Test Case 5: Legacy Format Compatibility**
```
✅ Send old format (no manual pricing fields)
✅ Expected: Falls back to legacy calculator
✅ Verify: No errors, backward compatible
✅ Verify: Uses default values (5k, 15k, etc.)
```

### 4. Verification Queries

```sql
-- Verify manual pricing is saved correctly
SELECT
  ti.kondisiAkhir,
  ti.totalReturnPenalty,
  cb.penaltyAmount,
  cb.modalAwalUsed,
  t.kode
FROM transaksi_item ti
JOIN condition_breakdown cb ON cb.transaksi_item_id = ti.id
JOIN transaksi t ON t.id = ti.transaksiId
WHERE t.kode = 'TXN-20251026-001'
  AND ti.statusKembali = 'lengkap'
ORDER BY ti.updatedAt DESC;

-- Verify activity log shows manual pricing method
SELECT
  a.tipe,
  a.deskripsi,
  a.data->>'calculationMethod' as calculation_method,
  a.data->'penaltyBreakdown' as breakdown
FROM aktivitas_transaksi a
JOIN transaksi t ON t.id = a.transaksiId
WHERE t.kode = 'TXN-20251026-001'
  AND a.tipe = 'penalty_added'
ORDER BY a.createdAt DESC;
```

---

## 📋 Implementation Checklist

### Phase 1: Schema Fix (CRITICAL - Do First!)
- [ ] Update `unifiedConditionSchema` in `ReturnSchema.ts`
- [ ] Add `conditionCategory` field (optional enum)
- [ ] Add `manualPrice` field (optional number, min 0)
- [ ] Add `useManualPricing` field (optional boolean)
- [ ] Run `yarn type-check` to verify types

### Phase 2: Testing
- [ ] Write unit test for schema validation
- [ ] Run existing tests: `yarn test:unit`
- [ ] Manual test with SimpleReturnForm
- [ ] Verify API log shows correct values
- [ ] Check activity log for `manual_pricing` method

### Phase 3: Verification
- [ ] Create test transaction in dev
- [ ] Process return with manual prices (8k, 17k)
- [ ] Verify database shows correct penalties
- [ ] Run SQL verification queries
- [ ] Document results

### Phase 4: Documentation & Cleanup
- [ ] Update return-penalty-analysis.md with bug fix
- [ ] Create migration notes if needed
- [ ] Update CLAUDE.md with fix documentation
- [ ] Git commit with detailed message

---

## 📊 Impact Assessment

### Before Fix:
- ❌ Manual pricing completely non-functional
- ❌ Always uses hardcoded legacy values
- ❌ Kasir input ignored (8k → 5k, 17k → 15k)
- ❌ No flexibility in penalty pricing
- ❌ Calculation method shows "condition-based"

### After Fix:
- ✅ Manual pricing fully functional
- ✅ Uses kasir-defined values exactly
- ✅ Complete flexibility for penalty amounts
- ✅ Calculation method shows "manual_pricing"
- ✅ Backward compatible with legacy format

### Risk Assessment:

**Risk Level:** 🟢 **LOW**

**Why Low Risk:**
1. ✅ Fields are optional (backward compatible)
2. ✅ Only adds fields to schema (no removal)
3. ✅ No database migration needed
4. ✅ No breaking changes to existing code
5. ✅ Legacy format still works
6. ✅ Single file change (ReturnSchema.ts)

**Rollback Plan:**
- Simply revert the 3-line addition to schema
- No data corruption risk
- No migration to reverse

---

## 🎯 Expected Results

### Test Transaction:

**Input:**
```json
{
  "items": [{
    "itemId": "9be46ea5-c5cd-4fd7-9b75-1d2f7a550b5a",
    "conditions": [{
      "kondisiAkhir": "Kotor",
      "jumlahKembali": 1,
      "conditionCategory": "KOTOR",
      "manualPrice": 8000,
      "useManualPricing": true
    }]
  }, {
    "itemId": "1e95b1bf-a4c8-41e4-b7fb-3e036b95a924",
    "conditions": [{
      "kondisiAkhir": "Rusak Ringan",
      "jumlahKembali": 1,
      "conditionCategory": "RUSAK_RINGAN",
      "manualPrice": 17000,
      "useManualPricing": true
    }]
  }]
}
```

**Expected API Response:**
```json
{
  "success": true,
  "data": {
    "totalPenalty": 25000,  // ✅ 8000 + 17000
    "processedItems": [
      {
        "itemId": "9be46ea5-c5cd-4fd7-9b75-1d2f7a550b5a",
        "penalty": 8000,  // ✅ Uses manual price!
        "kondisiAkhir": "Kotor"
      },
      {
        "itemId": "1e95b1bf-a4c8-41e4-b7fb-3e036b95a924",
        "penalty": 17000,  // ✅ Uses manual price!
        "kondisiAkhir": "Rusak Ringan"
      }
    ],
    "processingMode": "unified"
  }
}
```

**Expected Activity Log:**
```json
{
  "tipe": "penalty_added",
  "data": {
    "calculationMethod": "manual_pricing",  // ✅ Not "condition-based"!
    "totalPenalty": 25000,
    "penaltyBreakdown": [
      {
        "produkName": "Baju Biru Wardah",
        "conditions": [{
          "kondisiAkhir": "Kotor",
          "penaltyAmount": 8000  // ✅ Correct!
        }]
      },
      {
        "produkName": "Bando Bunga Lengkung",
        "conditions": [{
          "kondisiAkhir": "Rusak Ringan",
          "penaltyAmount": 17000  // ✅ Correct!
        }]
      }
    ]
  }
}
```

---

## 🚀 Next Steps

1. **Immediate Action:**
   - [ ] Apply schema fix to `ReturnSchema.ts`
   - [ ] Test dengan SimpleReturnForm
   - [ ] Verify penalty amounts correct

2. **Short Term:**
   - [ ] Add comprehensive unit tests
   - [ ] Update documentation
   - [ ] Monitor production usage

3. **Long Term:**
   - [ ] Consider making flat late penalty also configurable
   - [ ] Add admin settings for default penalty values
   - [ ] Implement penalty history tracking

---

## 📝 Related Documentation

- **Previous Analysis:** `features/kasir/docs/return-penalty-analysis.md`
- **Architecture:** `features/kasir/docs/unified-return-architecture.md`
- **Schema Documentation:** `features/kasir/lib/validation/ReturnSchema.ts`
- **Service Layer:** `features/kasir/services/returnService.ts`
- **Calculator Logic:** `features/kasir/lib/utils/penaltyCalculator.ts`

---

**Status:** ✅ **ROOT CAUSE IDENTIFIED** - Ready for Implementation
**Priority:** 🔴 **CRITICAL** - Fix ASAP
**Estimated Fix Time:** 15 minutes (schema update + testing)
**Risk Level:** 🟢 **LOW** (backward compatible, single file change)

