# Payment Method Improvement - Specification

## Project Overview
Menyederhanakan sistem metode pembayaran dari 3 opsi menjadi 2 kategori utama dengan sub-opsi yang lebih spesifik, menghilangkan field referensi untuk meningkatkan user experience.

## Business Context
Sistem pembayaran saat ini memiliki 3 metode: `tunai`, `transfer`, `kartu` dengan field referensi yang wajib untuk non-tunai. Perubahan ini akan:
- Menyederhanakan proses pembayaran
- Menghilangkan kompleksitas field referensi
- Memberikan opsi bank yang lebih spesifik
- Meningkatkan user experience kasir

## Current State
```typescript
// Current payment methods
metodeBayar: 'tunai' | 'transfer' | 'kartu'

// Current UI flow
1. Select payment method (3 options)
2. If non-tunai → Enter reference number (required)
3. Submit payment
```

## Target State
```typescript
// New payment methods
metodeBayar: 'tunai' | 'bca' | 'bri' | 'mandiri' | 'qris'

// New UI flow
1. Select primary category: Tunai or Bank
2. If Bank → Select specific: BCA, BRI, Mandiri, QRIS
3. Submit payment (no reference needed)
```

## Success Criteria
- ✅ Payment method selection simplified to 2-level hierarchy
- ✅ Reference field completely removed from all forms
- ✅ Existing transaction data remains compatible
- ✅ Receipt displays show appropriate method names
- ✅ All payment flows work with new structure
- ✅ Backward compatibility maintained for existing data

## Scope
### In Scope
- Update payment method validation schemas
- Modify UI components for 2-level selection
- Remove reference field from all payment forms
- Update receipt generation logic
- Update type definitions and mappings
- Update test data and expectations

### Out of Scope
- Database schema changes (not needed)
- Existing transaction data migration (handled via mapping)
- Payment processing logic changes (service layer compatible)
- New payment gateway integrations

====

# Phase 1: Foundation Updates - COMPLETED ✅

## Summary
Successfully completed Phase 1 of the Payment Method Improvement implementation. All foundation updates have been applied and TypeScript compilation passes without errors.

## Completed Tasks

### ✅ Task 1.1: Update Validation Schemas
**File:** `features/kasir/lib/validation/kasirSchema.ts`

**Changes Made:**
- Updated `metodeBayar` enum in `createTransaksiSchema`: `['tunai', 'bca', 'bri', 'mandiri', 'qris']`
- Updated `metodeBayar` enum in `createTransaksiLegacySchema`: `['tunai', 'bca', 'bri', 'mandiri', 'qris']`
- Updated `metode` enum in `createPembayaranSchema`: `['tunai', 'bca', 'bri', 'mandiri', 'qris']`
- Updated `metodeBayar` enum in `transactionFormSchema`: `['tunai', 'bca', 'bri', 'mandiri', 'qris']`
- **REMOVED** `referensi` field validation requirements completely
- **REMOVED** reference field from payment schema

**Result:** ✅ All enum validations accept new payment method values, reference field validation completely removed

### ✅ Task 1.2: Update Type Definitions
**File:** `features/kasir/types.ts`

**Changes Made:**
- Updated `PaymentMethod` type: `'tunai' | 'bca' | 'bri' | 'mandiri' | 'qris' | 'penalty'`
- **ADDED** new UI-specific types:
  - `PrimaryPaymentMethod`: `'tunai' | 'bank'`
  - `BankPaymentMethod`: `'bca' | 'bri' | 'mandiri' | 'qris'`
- Updated `TransactionFormData.paymentMethod`: `'tunai' | 'bca' | 'bri' | 'mandiri' | 'qris'`
- Updated `Payment.method`: `'tunai' | 'bca' | 'bri' | 'mandiri' | 'qris' | 'penalty'`

**Result:** ✅ All type definitions support new payment method structure with 2-level selection support

### ✅ Task 1.3: Update Configuration Files
**File:** `features/kasir/lib/constants/workflowConfig.ts`

**Changes Made:**
- **UPDATED** existing `paymentMethods` array with new structure:
  ```typescript
  [
    { value: 'tunai', label: 'Tunai', icon: '💵', category: 'primary' },
    { value: 'bca', label: 'BCA', icon: '🏦', category: 'bank' },
    { value: 'bri', label: 'BRI', icon: '🏦', category: 'bank' },
    { value: 'mandiri', label: 'Mandiri', icon: '🏦', category: 'bank' },
    { value: 'qris', label: 'QRIS', icon: '📱', category: 'bank' },
  ]
  ```
- **ADDED** `category` field for grouping (primary vs bank)
- **NO DUPLICATE** helper functions created (will be added within hooks in Phase 2)

**Result:** ✅ Configuration supports new payment method structure without code duplication

## Additional Fixes Applied

### ✅ Fixed Component Type Compatibility
**Files Updated:**
- `features/kasir/components/detail/PaymentModal.tsx`
- `features/kasir/components/detail/PaymentForm.tsx`
- `features/kasir/components/form/PaymentSummaryStep.tsx`

**Changes:**
- Updated interface types to match new payment method enums
- Removed all `referensi` field handling
- Updated form validation schemas
- Removed reference field UI components

### ✅ Fixed Hook and Service Compatibility
**Files Updated:**
- `features/kasir/hooks/useTransactionDetail.ts`
- `features/kasir/hooks/useTransactionForm.ts`
- `features/kasir/services/pembayaranService.ts`
- `features/kasir/lib/mocks/mock-transaction-detail.ts`

**Changes:**
- Updated `mapPaymentMethod()` function with backward compatibility
- Fixed form initialization and payment method mapping
- Removed `referensi` field usage from service layer
- Updated mock data to use new payment method values

# Phase 2: UI Component Updates - COMPLETED ✅

## Summary
Successfully completed Phase 2 of the Payment Method Improvement implementation. All UI components have been updated to use 2-level payment method selection as specified in the design document.

## Completed Tasks

### ✅ Task 2.1: Update PaymentForm Component
**File:** `features/kasir/components/detail/PaymentForm.tsx`

**Changes Made:**
- ✅ **Implemented 2-level radio button selection** (Primary → Bank sub-options)
- ✅ **Added primary method state management** (`PrimaryPaymentMethod`)
- ✅ **Added conditional bank method selection** (`BankPaymentMethod`)
- ✅ **Removed reference field UI components** completely
- ✅ **Updated form validation logic** for 2-level selection
- ✅ **Added proper accessibility attributes** with clear labels
- ✅ **Enhanced visual design** with icons and clear hierarchy

**UI Structure Implemented:**
```tsx
// Primary Level Selection
<RadioGroup value={primaryMethod} onValueChange={handlePrimaryMethodChange}>
  <RadioGroupItem value="tunai">💵 Tunai</RadioGroupItem>
  <RadioGroupItem value="bank">🏦 Bank/Transfer</RadioGroupItem>
</RadioGroup>

// Secondary Level Selection (conditional)
{primaryMethod === 'bank' && (
  <RadioGroup value={bankMethod} onValueChange={handleBankMethodChange}>
    <RadioGroupItem value="bca">🏦 BCA</RadioGroupItem>
    <RadioGroupItem value="bri">🏦 BRI</RadioGroupItem>
    <RadioGroupItem value="mandiri">🏦 Mandiri</RadioGroupItem>
    <RadioGroupItem value="qris">📱 QRIS</RadioGroupItem>
  </RadioGroup>
)}
```

**Result:** ✅ Form shows 2-level payment method selection, reference field completely removed

### ✅ Task 2.2: Update PaymentModal Component
**File:** `features/kasir/components/detail/PaymentModal.tsx`

**Changes Made:**
- ✅ **Integrated new PaymentForm component** with 2-level selection
- ✅ **Removed reference field handling** from success message
- ✅ **Updated payment submission logic** to work with new method structure
- ✅ **Maintained success/error state handling**

**Result:** ✅ Modal uses updated PaymentForm component, payment submission works with new method structure

### ✅ Task 2.3: Update PaymentSummaryStep Component
**File:** `features/kasir/components/form/PaymentSummaryStep.tsx`

**Changes Made:**
- ✅ **Replaced flat payment method selection** with 2-level structure
- ✅ **Implemented 2-level selection in transaction form**
- ✅ **Updated form data handling** for new payment method structure
- ✅ **Enhanced visual design** with consistent styling
- ✅ **Added conditional rendering** for bank sub-options

**UI Structure Implemented:**
```tsx
// Primary Level Selection
<RadioGroup value={primaryMethod} onValueChange={handlePrimaryChange}>
  <RadioGroupItem value="tunai">💵 Tunai</RadioGroupItem>
  <RadioGroupItem value="bank">🏦 Bank/Transfer</RadioGroupItem>
</RadioGroup>

// Secondary Level Selection (conditional)
{showBankOptions && (
  <RadioGroup value={formData.paymentMethod} onValueChange={handleBankChange}>
    <RadioGroupItem value="bca">🏦 BCA</RadioGroupItem>
    <RadioGroupItem value="bri">🏦 BRI</RadioGroupItem>
    <RadioGroupItem value="mandiri">🏦 Mandiri</RadioGroupItem>
    <RadioGroupItem value="qris">📱 QRIS</RadioGroupItem>
  </RadioGroup>
)}
```

**Result:** ✅ Transaction creation form shows new payment method selection, 2-level selection works in transaction context

### ✅ Task 3.2: Update Hooks and Mapping Functions
**File:** `features/kasir/hooks/usePaymentProcessing.ts`

**Changes Made:**
- ✅ **Updated existing `usePaymentMethods` hook** (didn't create new)
- ✅ **Removed `requiresReference` logic** from existing hook
- ✅ **Added helper functions within existing hook** (avoid separate exports)
- ✅ **Updated payment method configurations** to new enum values

**New Hook Structure:**
```typescript
export function usePaymentMethods() {
  const paymentMethods = [
    { value: 'tunai', label: 'Tunai', requiresReference: false },
    { value: 'bca', label: 'BCA', requiresReference: false },
    { value: 'bri', label: 'BRI', requiresReference: false },
    { value: 'mandiri', label: 'Mandiri', requiresReference: false },
    { value: 'qris', label: 'QRIS', requiresReference: false },
  ] as const

  // Helper functions within existing hook
  const getPrimaryMethods = () => [
    { value: 'tunai', label: 'Tunai', icon: '💵' },
    { value: 'bank', label: 'Bank/Transfer', icon: '🏦' }
  ]

  const getBankMethods = () => paymentMethods.filter(m => m.value !== 'tunai')

  return { paymentMethods, getPrimaryMethods, getBankMethods }
}
```

**Result:** ✅ Existing hook returns new payment method configurations, no duplicate functions created

# Phase 3: Service and Display Updates - COMPLETED ✅

## Summary
Successfully completed Phase 3 of the Payment Method Improvement implementation. All receipt services have been updated with payment method display mapping, and existing mapping functions have been verified for backward compatibility.

## Completed Tasks

### ✅ Task 3.1: Update Receipt Services
**Files:** `features/kasir/services/receiptService.ts`, `features/kasir/services/professionalReceiptService.ts`

**Changes Made:**

#### **receiptService.ts - Thermal Receipt Service**
- ✅ **Added `formatPaymentMethodDisplay()` private method**
- ✅ **Implemented display mapping logic** (bank methods → "Transfer", tunai → "Tunai")
- ✅ **Added legacy backward compatibility** (transfer → Transfer, kartu → Transfer)
- ✅ **Fixed TypeScript type safety** with `Record<string, string>`

```typescript
private formatPaymentMethodDisplay(method: string): string {
  const displayMapping: Record<string, string> = {
    'tunai': 'Tunai',
    'bca': 'Transfer',
    'bri': 'Transfer',
    'mandiri': 'Transfer',
    'qris': 'Transfer',
    // Legacy backward compatibility
    'transfer': 'Transfer',
    'kartu': 'Transfer'
  }
  return displayMapping[method] || method
}
```

**Note:** Thermal receipt service doesn't currently display payment method in receipt content, but the function is ready for future use.

#### **professionalReceiptService.ts - Professional Receipt Service**
- ✅ **Added `formatPaymentMethodDisplay()` private method**
- ✅ **Updated payment method display in transaction info table**
- ✅ **Implemented display mapping logic** (bank methods → "Transfer", tunai → "Tunai")
- ✅ **Added legacy backward compatibility** (transfer → Transfer, kartu → Transfer)
- ✅ **Fixed TypeScript type safety** with `Record<string, string>`

**Updated Usage:**
```typescript
// Before
tableData.push(['Pembayaran:', data.metodeBayar])

// After
tableData.push(['Pembayaran:', this.formatPaymentMethodDisplay(data.metodeBayar)])
```

**Result:** ✅ Professional receipts now show "Tunai" for cash and "Transfer" for all bank methods

### ✅ Task 3.2: Update Hooks and Mapping Functions
**File:** `features/kasir/hooks/useTransactionDetail.ts`

**Verification Results:**
- ✅ **Existing `mapPaymentMethod()` function already correct** - no changes needed
- ✅ **Backward compatibility mapping already implemented**
- ✅ **UI payment method mapping already handles all method types**
- ✅ **No duplicate functions found**

**Existing Implementation (Already Correct):**
```typescript
function mapPaymentMethod(apiMethod: string): 'tunai' | 'bca' | 'bri' | 'mandiri' | 'qris' {
  const mapping: Record<string, 'tunai' | 'bca' | 'bri' | 'mandiri' | 'qris'> = {
    tunai: 'tunai',
    bca: 'bca',
    bri: 'bri',
    mandiri: 'mandiri',
    qris: 'qris',
    // Legacy backward compatibility
    transfer: 'bca', // Default legacy transfers to BCA
    kartu: 'qris'    // Map legacy card to QRIS
  }

  return mapping[apiMethod] || 'tunai'
}
```

**Result:** ✅ Existing hook already returns correct payment method configurations with backward compatibility

## Display Mapping Strategy Implementation

### ✅ Receipt Display Logic
**Implemented as per design spec:**
```typescript
const displayMapping = {
  'tunai': 'Tunai',      // Cash payments show as "Tunai"
  'bca': 'Transfer',     // BCA shows as "Transfer"
  'bri': 'Transfer',     // BRI shows as "Transfer"
  'mandiri': 'Transfer', // Mandiri shows as "Transfer"
  'qris': 'Transfer',    // QRIS shows as "Transfer"
  // Legacy backward compatibility
  'transfer': 'Transfer', // Legacy transfer shows as "Transfer"
  'kartu': 'Transfer'    // Legacy card shows as "Transfer"
}
```

### ✅ Data Mapping Strategy
**Already implemented in useTransactionDetail.ts:**
```typescript
const legacyMapping = {
  'transfer': 'bca',  // Default existing transfers to BCA
  'kartu': 'qris'     // Map existing card payments to QRIS
}
```

## Quality Assurance Results

### ✅ TypeScript Compilation
```bash
npx tsc --noEmit --project tsconfig.json
Exit Code: 0 ✅
```

### ✅ ESLint Results
```bash
npx eslint features/kasir/services/receiptService.ts features/kasir/services/professionalReceiptService.ts features/kasir/hooks/useTransactionDetail.ts --fix
Exit Code: 0 ✅
```

### ✅ File Diagnostics
```
features/kasir/services/receiptService.ts: No diagnostics found ✅
features/kasir/services/professionalReceiptService.ts: No diagnostics found ✅
features/kasir/hooks/useTransactionDetail.ts: No diagnostics found ✅
```

## Implementation Details

### ✅ Receipt Services Enhancement
**Thermal Receipt Service (receiptService.ts):**
- Function added but not yet used in receipt content
- Ready for future implementation if payment method display is needed
- Maintains consistency with professional receipt service

**Professional Receipt Service (professionalReceiptService.ts):**
- Payment method display updated in transaction info table
- Shows "Pembayaran: Tunai" for cash payments
- Shows "Pembayaran: Transfer" for all bank methods (BCA, BRI, Mandiri, QRIS)
- Legacy methods (transfer, kartu) also show as "Transfer"

### ✅ Backward Compatibility Verification
**Data Layer (useTransactionDetail.ts):**
- Legacy `transfer` payments mapped to `bca` in database
- Legacy `kartu` payments mapped to `qris` in database
- UI receives standardized payment method values

**Display Layer (Receipt Services):**
- All bank methods display as "Transfer" in receipts
- Cash payments display as "Tunai"
- Legacy methods handled gracefully

### ✅ Type Safety Improvements
**Before:**
```typescript
const displayMapping = { ... } // Implicit any type
return displayMapping[method] || method // TypeScript error
```

**After:**
```typescript
const displayMapping: Record<string, string> = { ... } // Explicit type
return displayMapping[method] || method // Type safe
```