# Manual Price Adjustment Feature - Transaction Form

## 📋 Overview

Implementasi fitur manual price adjustment untuk item di transaction form, memungkinkan kasir untuk mengedit harga item secara manual untuk mengakomodasi item tambahan seperti songket, bando, gelang, songkok yang tidak ada di sistem inventory.

## 🎯 Business Requirements

### Problem Statement
- Sistem jas-sarung pairing sudah berjalan baik (jas + sarung = harga jas)
- Harga otomatis hanya berdasarkan harga produk utama
- Tidak ada cara untuk menambahkan item tambahan yang tidak ada di inventory
- Kasir perlu flexibility untuk adjust harga total per item

### Solution
Manual price adjustment dengan inline editing di Payment Summary Step untuk semua item di cart.

**Contoh Use Case:**
- Jas + Sarung = 200k (otomatis)
- Tambahan songket & bando = 55k (manual adjustment)
- Total item menjadi = 255k

## 🏗️ Technical Implementation Plan

### Phase 1: Data Structure Enhancement

#### 1.1 Update ProductSelection Type
**File:** `features/kasir/types.ts`

```typescript
interface ProductSelection {
  // ... existing fields
  manualPriceAdjustment?: {
    isManuallyAdjusted: boolean
    originalPrice: number
    adjustedPrice: number
    lastModified: string // ISO timestamp
  }
}
```

#### 1.2 Update TransactionFormData Type
**File:** `features/kasir/types.ts`

Ensure form persistence includes manual adjustments in localStorage.

### Phase 2: Price Calculator Enhancement

#### 2.1 Update PriceCalculator Logic
**File:** `features/kasir/lib/utils/priceCalculator.ts`

```typescript
// Priority logic:
// 1. Manual adjustment (if exists) -> use adjustedPrice
// 2. Automatic calculation (fallback)

calculateItemPrice(item: ProductSelection): number {
  if (item.manualPriceAdjustment?.isManuallyAdjusted) {
    return item.manualPriceAdjustment.adjustedPrice
  }
  
  // Fallback to automatic calculation
  return item.product.pricePerDay * item.quantity * durationMultiplier
}
```

#### 2.2 Discount Calculation Integration
- Discount calculation berdasarkan formatCurrency yang sudah di-adjust manual
- Manual adjustment mempengaruhi base amount untuk discount calculation

### Phase 3: UI Implementation

#### 3.1 Inline Price Editor Component
**File:** `features/kasir/components/form/PaymentSummary/InlinePriceEditor.tsx`

**Features:**
- Inline editing dengan +/- buttons
- Input field untuk direct entry
- Auto-format currency saat typing
- Validation (minimum = original price)
- Visual indicator jika harga sudah di-adjust

**UI Design:**
```
[Product Name]                    [Edit Mode: ON/OFF]
Size • Color • 50k/4 hari        [- 50,000 +] [Reset]
                                  ↑ Inline editor
```

#### 3.2 Update OrderSummarySection
**File:** `features/kasir/components/form/PaymentSummary/OrderSummarySection.tsx`

**Enhancements:**
- Integrate InlinePriceEditor untuk setiap item
- Show original vs adjusted price
- Visual indicator untuk manually adjusted items
- Handle quantity changes (reset manual adjustment atau proportional adjustment)

#### 3.3 Price Display Logic
```typescript
// Display priority:
// 1. Manual adjusted price (with indicator)
// 2. Automatic calculated price
// 3. Show "Adjusted from: Rp X" if manually adjusted
```

### Phase 4: Form State Management

#### 4.1 Update useTransactionForm Hook
**File:** `features/kasir/hooks/useTransactionForm.ts`

**New Functions:**
```typescript
const updateItemManualPrice = (itemIndex: number, newPrice: number) => {
  // Update specific item's manual price adjustment
}

const resetItemManualPrice = (itemIndex: number) => {
  // Reset to automatic calculation
}

const handleQuantityChangeWithManualPrice = (itemIndex: number, newQuantity: number) => {
  // Handle quantity change:
  // Option 1: Reset manual adjustment
  // Option 2: Proportional adjustment (recommended)
}
```

#### 4.2 Form Persistence Enhancement
**File:** `features/kasir/hooks/useTransactionFormPersistence.ts`

- Include manualPriceAdjustment in localStorage save/restore
- Validation saat restore (ensure data integrity)

### Phase 5: Integration & Testing

#### 5.1 PaymentSummaryStep Integration
**File:** `features/kasir/components/form/PaymentSummaryStep.tsx`

- Pass manual adjustment functions to child components
- Update total calculation logic
- Handle form submission dengan manual adjustments

#### 5.2 API Integration
**File:** `app/api/kasir/transaksi/route.ts`

- Ensure manual adjustments are properly sent to backend
- Validation di server side (optional, bisa di-skip untuk MVP)

## 🎨 UI/UX Specifications

### Inline Editor Design
```
┌─────────────────────────────────────────────────────────┐
│ [Product Image] Product Name                    [Edit]  │
│                 Size • Color • Details                  │
│                                                         │
│ Edit Mode (when active):                                │
│ ┌─────────────────────────────────────────────────────┐ │
│ │      [    255,000    ]   [Reset] [✓] [✗]           │ │
│ │     ↑ Currency formatted input                      │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Display Mode:                                           │
│ Rp 255,000 (Adjusted from: Rp 200,000) 🔧             │
└─────────────────────────────────────────────────────────┘
```

### Visual Indicators
- 🔧 Icon untuk manually adjusted items
- Different background color untuk adjusted items
- "Adjusted from: Rp X" text untuk transparency

## 📝 Implementation Checklist

### Phase 1: Foundation
- [ ] Update ProductSelection type dengan manualPriceAdjustment
- [ ] Update TransactionFormData type
- [ ] Update form persistence untuk include manual adjustments

### Phase 2: Price Logic
- [ ] Update PriceCalculator untuk handle manual adjustments
- [ ] Implement priority logic (manual > automatic)
- [ ] Update discount calculation integration
- [ ] Add validation logic (minimum price, etc.)

### Phase 3: UI Components
- [ ] Create InlinePriceEditor component
- [ ] Implement +/- buttons functionality
- [ ] Add currency formatting
- [ ] Add validation & error states
- [ ] Create visual indicators untuk adjusted items

### Phase 4: Integration
- [ ] Update OrderSummarySection dengan inline editor
- [ ] Update useTransactionForm hook dengan manual price functions
- [ ] Handle quantity changes dengan manual adjustments
- [ ] Update PaymentSummaryStep integration

### Phase 5: Testing & Polish
- [ ] Test form persistence (save/restore manual adjustments)
- [ ] Test discount calculation dengan manual prices
- [ ] Test quantity changes behavior
- [ ] Test edge cases (reset, validation, etc.)
- [ ] UI/UX polish dan accessibility

## 🔍 Technical Considerations

### Data Flow
```
User clicks [Edit] → InlinePriceEditor active → 
User adjusts price → updateItemManualPrice() → 
FormData updated → PriceCalculator recalculates → 
UI re-renders dengan new totals
```

### Validation Rules
- Minimum price = original calculated price (tidak boleh kurang)
- Maximum price = reasonable limit (misal 10x original price)
- Currency formatting validation
- Number input validation

### Edge Cases
1. **Quantity Change After Manual Adjustment:**
   - Proportional adjustment (recommended)
   - Reset to automatic (alternative)

2. **Discount Application:**
   - Apply discount to manually adjusted price
   - Clear indication di UI

3. **Form Persistence:**
   - Save manual adjustments di localStorage
   - Restore dengan validation
   - Handle corrupted data gracefully

## 🚀 Success Criteria

### Functional Requirements
- ✅ Kasir dapat edit harga item secara manual
- ✅ Manual adjustment mempengaruhi total calculation
- ✅ Discount calculation berdasarkan adjusted price
- ✅ Form persistence include manual adjustments
- ✅ Visual indication untuk adjusted items

### Non-Functional Requirements
- ✅ Responsive design (mobile-friendly)
- ✅ Accessible (keyboard navigation, screen readers)
- ✅ Performance (no lag saat editing)
- ✅ Data integrity (validation, error handling)

### User Experience
- ✅ Intuitive inline editing
- ✅ Clear visual feedback
- ✅ Easy reset functionality
- ✅ Transparent pricing (show original vs adjusted)

---

**Priority:** High
**Estimated Effort:** 2-3 days
**Dependencies:** Existing jas-sarung pairing system
**Risk Level:** Low (additive feature, tidak mengubah existing logic)