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