# Task Documentation: Receipt Display Improvement - Smart Grouping

## 📋 Task Overview

**Task ID**: RECEIPT-GROUPING-001  
**Date**: 17 Februari 2026  
**Priority**: High  
**Status**: Planning → Implementation  

## 🎯 Problem Statement

### Current Issue
Receipt (struk) tidak menampilkan semua transaksi ketika jumlah item terlalu banyak. Data terpotong karena keterbatasan tinggi kertas HVS 14×20cm (landscape).

### Example Case
Transaksi dengan 10 items (lihat `docs/api/api-test.md`):
- **OTK09** (Organza Tourqish) + ST23 (Sarung Turkish): 4 items dengan size berbeda
- **OPS02** (Organza Peach) + SP11 (Sarung Peach): 3 items dengan size berbeda  
- **JLK03** (Jas Polos Krem) + SM09 (Sarung Mocha): 3 items dengan size berbeda

**Result**: Receipt terpotong, tidak semua item tercetak.

### Root Cause
- Setiap kombinasi produk + size + sarung ditampilkan sebagai baris terpisah
- Format kertas landscape 200×140mm (20×14cm) memiliki keterbatasan tinggi
- Tidak ada grouping untuk produk yang sama dengan size berbeda

## 💡 Proposed Solution: Smart Grouping (Opsi 1)

### Concept
Mengelompokkan items berdasarkan **kombinasi Kode Produk + Kode Sarung yang sama**, kemudian menggabungkan size dan quantity dalam satu baris.

### Transformation Example

#### Before (10 rows):
```
No | Kode Product | Kode Sarung | Size | Qty | @Harga  | Total
1  | OTK09       | ST23        | M    | 1   | 112.500 | 112.500
2  | OPS02       | SP11        | L    | 1   | 112.500 | 112.500
3  | JLK03       | SM09        | XL   | 1   | 150.000 | 150.000
4  | OTK09       | ST23        | XL   | 1   | 112.500 | 112.500
5  | OPS02       | SP11        | M    | 1   | 112.500 | 112.500
6  | OTK09       | ST23        | L    | 2   | 112.500 | 225.000
7  | JLK03       | SM09        | M    | 3   | 150.000 | 450.000
8  | OPS02       | SP11        | XL   | 4   | 112.500 | 450.000
9  | OTK09       | ST23        | S    | 2   | 112.500 | 225.000
10 | JLK03       | SM09        | L    | 4   | 150.000 | 600.000
```

#### After (3 rows - 70% reduction):
```
No | Kode Product | Kode Sarung | Size & Qty              | @Harga  | Total
1  | OTK09       | ST23        | M(1), XL(1), L(2), S(2) | 112.500 | 675.000
2  | OPS02       | SP11        | L(1), M(1), XL(4)       | 112.500 | 675.000
3  | JLK03       | SM09        | XL(1), M(3), L(4)       | 150.000 | 1.200.000
```

### Benefits
✅ **Space Efficient**: 70% reduction in table rows  
✅ **Complete Information**: All size & quantity data preserved  
✅ **Better Readability**: Customer sees total per product at a glance  
✅ **No Truncation**: Fits within HVS 14×20cm paper  
✅ **Professional**: Similar to modern retail invoices  

## 🔧 Technical Implementation

### File to Modify
- `features/kasir/services/professionalReceiptService.ts`

### Key Changes

#### 1. Add Grouping Interface
```typescript
interface GroupedItem {
  productCode: string
  productName: string
  sarungCode: string
  sarungName: string
  sizeQuantities: Array<{ size: string; quantity: number }>
  unitPrice: number
  totalQuantity: number
  totalPrice: number
}
```

#### 2. Create Grouping Function
```typescript
private groupItemsByProductAndSarung(
  items: TransaksiWithDetails['items']
): GroupedItem[] {
  // Group by: productCode + sarungCode
  // Aggregate: sizes, quantities, totals
}
```

#### 3. Update Table Column Configuration
```typescript
private readonly TABLE_COLUMNS: TableColumn[] = [
  { header: 'No', width: 12, align: 'center' },
  { header: 'Kode Product', width: 30, align: 'left' },
  { header: 'Kode Sarung', width: 30, align: 'left' },
  { header: 'Size & Qty', width: 35, align: 'left' },      // CHANGED: wider for multiple sizes
  { header: '@Harga', width: 25, align: 'right' },
  { header: 'Total Harga', width: 28, align: 'right' }
]
```

#### 4. Modify addItemsTable Method
```typescript
private addItemsTable(
  doc: jsPDF, 
  items: TransaksiWithDetails['items'], 
  transactionCode: string, 
  y: number
): number {
  // 1. Group items first
  const groupedItems = this.groupItemsByProductAndSarung(items)
  
  // 2. Format table data with grouped items
  const tableData = groupedItems.map((group, index) => [
    (index + 1).toString(),
    group.productCode,
    group.sarungCode,
    this.formatSizeQuantities(group.sizeQuantities), // "M(1), L(2), XL(3)"
    this.formatCurrency(group.unitPrice),
    this.formatCurrency(group.totalPrice)
  ])
  
  // 3. Render table
  return this.createBorderedTable(doc, this.TABLE_COLUMNS, tableData, startX, currentY)
}
```

#### 5. Add Helper Functions
```typescript
// Format size quantities: "M(1), L(2), XL(3)"
private formatSizeQuantities(
  sizeQuantities: Array<{ size: string; quantity: number }>
): string {
  // Sort alphabetically
  const sorted = sizeQuantities.sort((a, b) => a.size.localeCompare(b.size))
  
  // Format: "SIZE(QTY), SIZE(QTY), ..."
  return sorted.map(sq => `${sq.size}(${sq.quantity})`).join(', ')
}
```

### Implementation Details

#### Grouping Logic
```typescript
// Group key format: "PRODUCTCODE-SARUNGCODE"
const groupKey = `${item.produk.code}-${sarungCode}`

// Example groups:
// "OTK09-ST23" -> all OTK09 with ST23 sarung
// "OPS02-SP11" -> all OPS02 with SP11 sarung
// "JLK03-SM09" -> all JLK03 with SM09 sarung
```

#### Size Sorting
- **Alphabetical order**: L, M, S, XL, XXL
- Consistent and predictable for users

#### Quantity Calculation
```typescript
// Total quantity = sum of all quantities in group
totalQuantity = sizeQuantities.reduce((sum, sq) => sum + sq.quantity, 0)

// Total price = unitPrice × totalQuantity
totalPrice = unitPrice * totalQuantity
```

#### Text Wrapping
- If size list exceeds column width, auto-wrap to next line
- Maintain table cell alignment and borders

## 📊 Expected Results

### Metrics
- **Row Reduction**: ~60-80% fewer table rows
- **Space Saved**: ~40-50mm vertical space
- **Readability**: Improved (grouped by product)
- **Data Integrity**: 100% preserved (no data loss)

### Visual Comparison

#### Current Receipt (Truncated)
```
[Header]
[10 rows of items - TRUNCATED]
[Footer - NOT VISIBLE]
```

#### New Receipt (Complete)
```
[Header]
[3 rows of grouped items - COMPLETE]
[Footer - VISIBLE]
[Keterangan - VISIBLE]
```

## 🧪 Testing Plan

### Test Cases

1. **Single Item per Product**
   - Input: 1 OTK09-M, 1 OPS02-L
   - Expected: 2 rows, no grouping needed

2. **Multiple Sizes Same Product**
   - Input: OTK09-M(1), OTK09-L(2), OTK09-XL(1)
   - Expected: 1 row with "M(1), L(2), XL(1)"

3. **Many Items (10+)**
   - Input: 10 items like api-test.md
   - Expected: 3 grouped rows, all visible

4. **Edge Case: No Sarung**
   - Input: Product without linkedSarung
   - Expected: Sarung code shows "-"

5. **Edge Case: Very Long Size List**
   - Input: 8+ different sizes
   - Expected: Text wraps properly in cell

### Validation Checklist
- [ ] All items grouped correctly
- [ ] Size order is alphabetical
- [ ] Quantities summed correctly
- [ ] Total prices calculated correctly
- [ ] Table fits within paper dimensions
- [ ] No data truncation
- [ ] Text wrapping works properly
- [ ] PDF generates without errors

## 📝 Implementation Steps

1. ✅ **Documentation** (COMPLETED)
   - Document problem and solution in `docs/task.md`

2. ✅ **Implementation** (COMPLETED - 17 Feb 2026)
   - ✅ Add `GroupedItem` interface
   - ✅ Create `groupItemsByProductAndSarung()` function
   - ✅ Create `formatSizeQuantities()` helper
   - ✅ Update `TABLE_COLUMNS` configuration
   - ✅ Modify `addItemsTable()` method
   - ✅ Add text wrapping logic for long size lists (handled by existing `createBorderedTable`)

3. ⏳ **Testing** (NEXT STEP)
   - Test with api-test.md data
   - Test edge cases
   - Verify PDF output
   - Check print quality

4. ⏳ **Deployment**
   - Code review
   - Merge to main branch
   - Deploy to production

## 🔗 Related Files

- **Service**: `features/kasir/services/professionalReceiptService.ts`
- **Test Data**: `docs/api/api-test.md`
- **Screenshot**: `docs/image.png` (current issue)
- **Types**: Uses `TransaksiWithDetails` from `transaksiService.ts`

## 🎉 Implementation Summary

### Changes Made (17 Feb 2026)

#### 1. Added GroupedItem Interface
```typescript
interface GroupedItem {
  productCode: string
  productName: string
  sarungCode: string
  sarungName: string
  sizeQuantities: Array<{ size: string; quantity: number }>
  unitPrice: number
  totalQuantity: number
  totalPrice: number
  categoryType: string
}
```

#### 2. Created Grouping Function
- `groupItemsByProductAndSarung()`: Groups items by productCode + sarungCode
- Aggregates sizes and quantities for same product-sarung combinations
- Sorts sizes alphabetically within each group
- Calculates total quantity and total price per group

#### 3. Created Formatting Helper
- `formatSizeQuantities()`: Formats size-quantity pairs as "M(1), L(2), XL(3)"
- Handles empty arrays gracefully
- Uses comma-space separator for readability

#### 4. Updated Table Configuration
- Changed "Size" + "Qty" columns → "Size & Qty" (combined)
- Adjusted column widths: Size & Qty now 35mm (was 30mm + 20mm = 50mm)
- Saved 15mm horizontal space for better layout

#### 5. Modified addItemsTable Method
- Now uses `groupItemsByProductAndSarung()` before rendering
- Processes grouped items instead of raw items
- Maintains all existing formatting and styling

#### 6. Enhanced Logging
- Added `groupedItemCount` to success log
- Helps track grouping efficiency (e.g., 10 items → 3 groups)

### Expected Behavior

**Input**: 10 transaction items
- OTK09 + ST23: M(1), XL(1), L(2), S(2) = 4 items
- OPS02 + SP11: L(1), M(1), XL(4) = 3 items  
- JLK03 + SM09: XL(1), M(3), L(4) = 3 items

**Output**: 3 table rows
```
1 | OTK09 | ST23 | L(2), M(1), S(2), XL(1) | 112.500 | 675.000
2 | OPS02 | SP11 | L(1), M(1), XL(4)       | 112.500 | 675.000
3 | JLK03 | SM09 | L(4), M(3), XL(1)       | 150.000 | 1.200.000
```

### Code Quality
- ✅ No TypeScript errors
- ✅ Maintains existing code style
- ✅ Backward compatible (no breaking changes)
- ✅ Well-documented with JSDoc comments
- ✅ Handles edge cases (empty arrays, missing data)

### Performance Impact
- Minimal: O(n) grouping operation where n = number of items
- Typical transaction: 10-20 items → negligible performance impact
- Memory: Small overhead for groupMap (cleared after use)

## 📌 Notes

### Design Decisions
- **Grouping Key**: ProductCode + SarungCode (not just ProductCode)
  - Reason: Same product might have different sarung pairings
- **Size Format**: "SIZE(QTY)" with comma separator
  - Reason: Most readable and space-efficient
- **Sort Order**: Alphabetical
  - Reason: Predictable and professional

### Future Enhancements
- [ ] Option to toggle grouping on/off
- [ ] Custom size sort order (S, M, L, XL instead of alphabetical)
- [ ] Multi-page support for extremely large orders (20+ unique products)
- [ ] Summary line: "Total Items: X pcs across Y products"

## ✅ Acceptance Criteria

- [ ] Receipt displays all items without truncation
- [ ] Items grouped by product + sarung combination
- [ ] Size and quantity information preserved and readable
- [ ] Total calculations remain accurate
- [ ] Receipt fits within 14×20cm paper (landscape)
- [ ] Professional appearance maintained
- [ ] No breaking changes to existing functionality
- [ ] Code is well-documented and maintainable

---

**Last Updated**: 17 Februari 2026  
**Author**: Kiro AI Assistant  
**Reviewer**: [Pending]
