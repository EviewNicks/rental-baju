# Size Detail Card Inventory Enhancement - Problem Analysis

## Executive Summary

SizeDetailCard component saat ini tidak menampilkan informasi inventory yang lengkap dan akurat. Component hanya menggunakan field `quantity` (legacy) tanpa membedakan antara stok yang sedang disewa (`rentedQuantity`) dan stok yang tersedia (`availableQuantity`). Hal ini menyebabkan user tidak dapat mengetahui ketersediaan produk yang sebenarnya.

## Current State Analysis

### 1. Data Flow Issues

#### API Response (Correct)
File: `app/api/products/[id]/route.ts`

API sudah menyediakan data yang lengkap:

```json
{
  "sizeDetails": [
    {
      "id": "d0b09c4c-29ac-4730-8157-bf11e39aa935",
      "ageCategory": "ADULT",
      "size": "XL",
      "originalQuantity": 6,
      "availableQuantity": 4,
      "rentedQuantity": 2,
      "utilizationRate": 33.33,
      "isAvailable": true
    }
  ],
  "inventoryStatus": {
    "totalOriginal": 20,
    "totalAvailable": 16,
    "totalRented": 4,
    "utilizationRate": 20,
    "isHealthy": true
  }
}
```

✅ **API Response is CORRECT** - Contains all necessary inventory fields

#### Hook Transformation (PROBLEM)
File: `features/homepage/hooks/usePublicProducts.ts`

```typescript
export function useTransformedProductDetail(id: string) {
  const { data, isLoading, error, isError } = usePublicProductDetail(id)

  const transformedData = data ? {
    ...data,
    // ❌ PROBLEM: Only uses legacy 'sizes' array
    totalQuantity: data.sizes.reduce((sum, size) => sum + size.quantity, 0),
    
    // ❌ PROBLEM: Doesn't map 'sizeDetails' with enhanced fields
    // ❌ PROBLEM: Doesn't include 'inventoryStatus'
    
    availabilityInfo: {
      status: data.status,
      isInStock: data.sizes.some(size => size.quantity > 0),
      availableSizes: data.sizes.filter(size => size.quantity > 0),
      totalStock: data.sizes.reduce((sum, size) => sum + size.quantity, 0),
    }
  } : undefined
}
```

**Issues:**
1. ❌ Tidak menggunakan `sizeDetails` array yang sudah ada di API response
2. ❌ Tidak menyertakan `inventoryStatus` dalam transformed data
3. ❌ Hanya menggunakan `data.sizes` yang berisi legacy `quantity` field
4. ❌ `availabilityInfo` tidak akurat karena hanya melihat `quantity` bukan `availableQuantity`

#### Component Props (PROBLEM)
File: `features/homepage/components/SizeDetailCard.tsx`

```typescript
interface SizeItem {
  size: string
  ageCategory: string
  quantity: number  // ❌ Only legacy field
  // Missing: originalQuantity, rentedQuantity, availableQuantity
}

interface SizeDetailCardProps {
  sizes: SizeItem[]
  // ❌ No support for enhanced inventory fields
  // ❌ No inventoryStatus prop
}
```

**Issues:**
1. ❌ Interface hanya mendefinisikan `quantity` (legacy field)
2. ❌ Tidak ada field untuk `originalQuantity`, `rentedQuantity`, `availableQuantity`
3. ❌ Tidak ada prop untuk `inventoryStatus`
4. ❌ Tidak ada prop untuk `utilizationRate`

#### Component Display (PROBLEM)
File: `features/homepage/components/SizeDetailCard.tsx`

```typescript
// Current display logic
<Badge variant={size.quantity > 0 ? "secondary" : "outline"}>
  {size.quantity} pcs  {/* ❌ Only shows total quantity */}
</Badge>
```

**Issues:**
1. ❌ Hanya menampilkan total `quantity` tanpa breakdown
2. ❌ Tidak menampilkan berapa yang sedang disewa
3. ❌ Tidak menampilkan berapa yang tersedia
4. ❌ Tidak ada visual indicator untuk utilization rate

### 2. Visual Representation Issues

#### Current Display
```
Dewasa - Size XL
[✓] 6 pcs
```

**Problems:**
- User tidak tahu berapa yang tersedia untuk disewa
- User tidak tahu berapa yang sedang disewa
- Tidak ada indikator utilization rate

#### Expected Display
```
Dewasa - Size XL
[✓] 4 dari 6 pcs tersedia
    2 sedang disewa (33% utilization)
[Progress Bar: ████░░ 33%]
```

**Benefits:**
- ✅ Clear availability information
- ✅ Shows rented quantity
- ✅ Visual utilization indicator
- ✅ Better decision making for users

### 3. Data Mapping Issues

#### Current Flow (INCORRECT)
```
API Response (sizeDetails) 
    ↓ [IGNORED]
Hook (uses data.sizes with quantity only)
    ↓
Component (displays quantity only)
    ↓
User sees: "6 pcs" (misleading)
```

#### Expected Flow (CORRECT)
```
API Response (sizeDetails with enhanced fields)
    ↓
Hook (maps sizeDetails to component props)
    ↓
Component (displays original, rented, available)
    ↓
User sees: "4 dari 6 pcs tersedia (2 sedang disewa)"
```

## Root Cause Analysis

### Primary Issues

1. **Hook Transformation Gap**
   - `useTransformedProductDetail` tidak menggunakan `sizeDetails` dari API response
   - Hanya menggunakan `data.sizes` yang berisi legacy fields
   - Tidak menyertakan `inventoryStatus` dalam transformed data

2. **Component Interface Limitation**
   - `SizeItem` interface hanya mendefinisikan `quantity`
   - Tidak ada support untuk enhanced inventory fields
   - Props tidak menerima `inventoryStatus`

3. **Display Logic Incomplete**
   - Component hanya menampilkan total quantity
   - Tidak ada breakdown untuk rented vs available
   - Tidak ada visual indicator untuk utilization

### Secondary Issues

1. **Backward Compatibility Not Considered**
   - Tidak ada fallback logic untuk legacy data
   - Tidak ada handling untuk missing enhanced fields

2. **Performance Not Optimized**
   - Statistics calculation tidak menggunakan `useMemo`
   - Tidak ada memoization untuk size items

3. **Accessibility Not Implemented**
   - Tidak ada aria-labels untuk inventory status
   - Progress bars tidak memiliki accessibility attributes

## Impact Assessment

### User Impact

1. **Misleading Information** (HIGH)
   - User melihat "6 pcs" padahal hanya 4 yang tersedia
   - Dapat menyebabkan ekspektasi yang salah
   - Potensi customer disappointment

2. **Poor Decision Making** (MEDIUM)
   - User tidak dapat menilai ketersediaan dengan akurat
   - Tidak tahu apakah perlu booking segera atau bisa menunggu

3. **Reduced Trust** (MEDIUM)
   - Informasi yang tidak akurat mengurangi kepercayaan
   - User mungkin ragu untuk melakukan booking

### Business Impact

1. **Customer Service Load** (MEDIUM)
   - Lebih banyak pertanyaan tentang ketersediaan
   - Perlu konfirmasi manual untuk setiap inquiry

2. **Conversion Rate** (LOW-MEDIUM)
   - User mungkin tidak jadi booking karena informasi tidak jelas
   - Kehilangan potential revenue

3. **Operational Efficiency** (LOW)
   - Admin perlu manual checking untuk konfirmasi stock
   - Tidak efisien untuk scale

## Comparison: Current vs Expected

### Example: Dewasa XL (6 pcs total, 2 rented, 4 available)

#### Current Display
```
┌─────────────────────────────────────┐
│ Dewasa                              │
│ ┌─────────────────────────────────┐ │
│ │ Dewasa - Size XL          [✓]   │ │
│ │                         6 pcs   │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Problems:**
- ❌ Shows "6 pcs" but doesn't clarify availability
- ❌ No indication of rented items
- ❌ No utilization indicator

#### Expected Display
```
┌─────────────────────────────────────┐
│ Dewasa                       15 pcs │
│ ┌─────────────────────────────────┐ │
│ │ Dewasa - Size XL          [✓]   │ │
│ │ 4 dari 6 pcs tersedia           │ │
│ │ 2 sedang disewa                 │ │
│ │ [████░░░░░░] 33% utilization    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Benefits:**
- ✅ Clear availability: "4 dari 6 pcs tersedia"
- ✅ Shows rented quantity: "2 sedang disewa"
- ✅ Visual utilization: Progress bar at 33%
- ✅ Better user understanding

## Technical Debt

### Current Technical Debt

1. **Legacy Field Usage**
   - Still using `quantity` field instead of enhanced fields
   - No migration path defined
   - Potential data inconsistency

2. **Missing Data Mapping**
   - API provides `sizeDetails` but hook doesn't use it
   - Wasted API bandwidth
   - Inefficient data flow

3. **Component Inflexibility**
   - Hard to extend for new inventory features
   - Tightly coupled to legacy data structure
   - Difficult to maintain

### Proposed Solutions

1. **Update Hook Transformation**
   ```typescript
   // Add sizeDetails mapping
   enhancedSizes: data.sizeDetails?.map(detail => ({
     ...detail,
     // Include all enhanced fields
   })) || data.sizes,
   
   // Add inventoryStatus
   inventoryStatus: data.inventoryStatus
   ```

2. **Extend Component Interface**
   ```typescript
   interface EnhancedSizeItem {
     size: string
     ageCategory: string
     quantity: number // Legacy support
     originalQuantity?: number
     rentedQuantity?: number
     availableQuantity?: number
     utilizationRate?: number
     isAvailable?: boolean
   }
   ```

3. **Implement Enhanced Display**
   ```typescript
   // Show breakdown
   <div className="space-y-1">
     <div className="font-medium">
       {availableQuantity} dari {originalQuantity} pcs tersedia
     </div>
     {rentedQuantity > 0 && (
       <div className="text-sm text-orange-600">
         {rentedQuantity} sedang disewa
       </div>
     )}
     <Progress value={utilizationRate} />
   </div>
   ```

## Recommendations

### Immediate Actions (Priority 1)

1. ✅ Update `useTransformedProductDetail` hook to map `sizeDetails`
2. ✅ Extend `SizeDetailCard` interface to support enhanced fields
3. ✅ Implement enhanced display with breakdown
4. ✅ Add backward compatibility for legacy data

### Short-term Actions (Priority 2)

1. ✅ Add visual indicators (progress bars, badges)
2. ✅ Implement responsive layout
3. ✅ Add accessibility attributes
4. ✅ Performance optimization with memoization

### Long-term Actions (Priority 3)

1. ⏳ Real-time inventory updates
2. ⏳ Inventory reservation system
3. ⏳ Historical tracking integration
4. ⏳ Multi-location support

## Success Criteria

### Functional Requirements
- ✅ Display originalQuantity, rentedQuantity, availableQuantity for each size
- ✅ Show utilization rate as percentage and progress bar
- ✅ Visual differentiation for availability status
- ✅ Backward compatibility with legacy data

### Non-Functional Requirements
- ✅ Component renders within 100ms
- ✅ WCAG 2.1 AA compliance
- ✅ Responsive on all screen sizes
- ✅ Zero breaking changes

### User Experience
- ✅ 90%+ users can identify availability within 3 seconds
- ✅ Clear visual hierarchy
- ✅ Intuitive color coding
- ✅ Accessible for screen readers

## Conclusion

SizeDetailCard memerlukan enhancement untuk menampilkan informasi inventory yang lengkap dan akurat. API sudah menyediakan data yang diperlukan (`sizeDetails` dan `inventoryStatus`), tetapi hook dan component belum menggunakannya dengan benar.

**Key Changes Needed:**
1. Update hook untuk map `sizeDetails` dari API response
2. Extend component interface untuk support enhanced fields
3. Implement display logic untuk show breakdown (original, rented, available)
4. Add visual indicators (progress bars, color coding)
5. Ensure backward compatibility dengan legacy data

**Expected Outcome:**
User dapat melihat dengan jelas berapa item yang tersedia untuk disewa, berapa yang sedang disewa, dan utilization rate dari setiap ukuran produk.
