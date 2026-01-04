# Manual Testing Guide - Payment Method Improvement

## Overview
Panduan testing manual untuk fitur Payment Method Improvement yang mengubah sistem pembayaran dari 3 opsi flat menjadi 2-level hierarchy dengan menghilangkan field referensi.

## Implementation Status
- ✅ **Phase 1:** Foundation Updates (Schema, Types, Config) - COMPLETE
- ✅ **Phase 2:** UI Component Updates (2-level selection) - COMPLETE  
- ✅ **Phase 3:** Service & Display Updates (Receipt mapping) - COMPLETE
- 🧪 **Phase 4:** Manual Testing & Integration - IN PROGRESS

## Testing Scope

### What Changed
- **Payment Methods:** `tunai | transfer | kartu` → `tunai | bca | bri | mandiri | qris`
- **UI Structure:** Flat selection → 2-level hierarchy (Primary → Bank sub-options)
- **Reference Field:** Completely removed from all forms
- **Receipt Display:** Bank methods show as "Transfer", cash as "Tunai"
- **Backward Compatibility:** Legacy data mapped automatically

## Testing Checklist

### 1. Transaction Creation Form (PaymentSummaryStep)
**Location:** `/kasir/transaksi/buat` - Step 3 Payment Summary

#### 1.1 Primary Level Selection ✅
- [x] Navigate to transaction creation form (Step 3)
- [x] Verify 2 primary options visible:
  - [x] 💵 **Tunai** (with cash icon and description)
  - [x] 🏦 **Bank/Transfer** (with bank icon and description)
- [x] Default selection is "Tunai"
- [x] Visual hierarchy clear (primary level prominent)
- [x] Responsive design works on mobile/desktop

#### 1.2 Bank Sub-Options (Conditional) ✅
- [x] Select "Bank/Transfer" → Bank options appear
- [x] Verify 4 bank sub-options visible:
  - [x] 🏦 **BCA** (with bank icon)
  - [x] 🏦 **BRI** (with bank icon)  
  - [x] 🏦 **Mandiri** (with bank icon)
  - [x] 📱 **QRIS** (with mobile icon)
- [x] Bank options have visual indentation/grouping
- [x] Bank options only visible when "Bank/Transfer" selected
- [x] Select "Tunai" → Bank options disappear

#### 1.3 Form Validation ✅
- [x] Select "Tunai" → Form allows submission
- [x] Select "Bank/Transfer" without bank option → Form prevents submission
- [x] Select "Bank/Transfer" + specific bank → Form allows submission
- [x] Form data correctly saves selected payment method
- [x] No reference field visible anywhere

#### 1.4 Transaction Creation Flow ✅
- [x] Complete transaction with "Tunai" → Success
- [x] Complete transaction with "BCA" → Success
- [x] Complete transaction with "BRI" → Success
- [x] Complete transaction with "Mandiri" → Success
- [x] Complete transaction with "QRIS" → Success
- [x] Verify transaction saved with correct payment method in database

### 2. Additional Payment Modal (PaymentForm)
**Location:** Transaction Detail → "Tambah Pembayaran" button

#### 2.1 Payment Modal UI ✅
- [x] Open existing transaction detail page
- [x] Click "Tambah Pembayaran" button
- [x] Modal opens with payment form
- [x] Verify 2-level payment method selection visible
- [x] Same UI structure as transaction creation form

#### 2.2 Primary Level Selection ✅
- [x] Verify 2 primary options:
  - [x] 💵 **Tunai** (cash option)
  - [x] 🏦 **Bank/Transfer** (bank option)
- [x] Default selection behavior correct
- [x] Visual design consistent with transaction form

#### 2.3 Bank Sub-Options ✅
- [x] Select "Bank/Transfer" → 4 bank options appear
- [x] All bank options (BCA, BRI, Mandiri, QRIS) visible
- [x] Icons and labels correct
- [x] Conditional rendering works properly

#### 2.4 Payment Processing ✅
- [x] Enter payment amount
- [x] Select "Tunai" → Process payment → Success
- [x] Select "BCA" → Process payment → Success
- [x] Select "BRI" → Process payment → Success
- [x] Select "Mandiri" → Process payment → Success
- [x] Select "QRIS" → Process payment → Success
- [x] No reference field input required
- [x] Payment history updates correctly

#### 2.5 Success Message ✅
- [x] Payment success modal shows correct method name
- [x] No reference number displayed in success message
- [x] Payment timestamp correct
- [x] Modal closes properly after success

### 3. Receipt Generation Testing
**Location:** Transaction Detail → "Cetak Struk" / "Cetak Struk Profesional"

#### 3.1 Professional Receipt Display ✅
- [ ] Create transaction with "Tunai" → Generate professional receipt
- [ ] Verify "Pembayaran: Tunai" in transaction info table
- [ ] Create transaction with "BCA" → Generate professional receipt
- [ ] Verify "Pembayaran: Transfer" in transaction info table
- [ ] Test all bank methods (BRI, Mandiri, QRIS) → All show "Transfer"

#### 3.2 Thermal Receipt Display ✅
- [ ] Generate thermal receipt for cash payment
- [ ] Generate thermal receipt for bank payments
- [ ] Verify receipt generation performance maintained
- [ ] No errors in receipt generation process

#### 3.3 Receipt Content Validation ✅
- [ ] **Cash Payment Receipt:**
  - Payment method shows as "Tunai"
  - All other receipt content correct
- [ ] **Bank Payment Receipt:**
  - Payment method shows as "Transfer" (regardless of specific bank)
  - All other receipt content correct
- [ ] **Legacy Data Receipt:**
  - Old "transfer" payments show as "Transfer"
  - Old "kartu" payments show as "Transfer"

### 4. Backward Compatibility Testing
**Critical for existing data integrity**

#### 4.1 Legacy Transaction Display ✅
- [ ] Find existing transaction with `metodeBayar: "transfer"`
- [ ] Verify displays correctly in transaction detail
- [ ] Verify shows as "Transfer" in receipts
- [ ] Find existing transaction with `metodeBayar: "kartu"`
- [ ] Verify displays correctly in transaction detail
- [ ] Verify shows as "Transfer" in receipts

#### 4.2 Legacy Payment Processing ✅
- [ ] Existing transactions with old payment methods load correctly
- [ ] Payment history displays properly
- [ ] No errors in transaction detail pages
- [ ] All existing functionality works

#### 4.3 Data Migration Verification ✅
- [ ] Legacy "transfer" → mapped to "bca" in UI
- [ ] Legacy "kartu" → mapped to "qris" in UI
- [ ] Database values remain unchanged (no data migration needed)
- [ ] Display mapping works correctly

### 5. Form Validation & Error Handling

#### 5.1 Transaction Creation Validation ✅
- [ ] Try to submit without selecting payment method → Error message
- [ ] Select "Bank/Transfer" without bank option → Error message
- [ ] Error messages clear and helpful
- [ ] Form prevents submission until valid selection made

#### 5.2 Payment Modal Validation ✅
- [ ] Try to process payment without selecting method → Error
- [ ] Select "Bank/Transfer" without bank option → Error
- [ ] Validation messages user-friendly
- [ ] Form state management correct

#### 5.3 Network Error Handling ✅
- [ ] Disconnect network → Try to create transaction → Error handling
- [ ] Disconnect network → Try to add payment → Error handling
- [ ] Error messages informative
- [ ] UI recovers gracefully from errors

### 6. User Experience Testing

#### 6.1 Form Completion Time ✅
- [ ] Time how long it takes to select payment method (old vs new)
- [ ] Target: 20% reduction in completion time
- [ ] No confusion about reference numbers (eliminated)
- [ ] Intuitive 2-level selection flow

#### 6.2 Visual Design Consistency ✅
- [ ] Payment method selection matches app design system
- [ ] Icons appropriate and consistent
- [ ] Color scheme follows brand guidelines
- [ ] Typography consistent with other forms
- [ ] Spacing and alignment proper

#### 6.3 Accessibility Testing ✅
- [ ] Tab navigation works through payment options
- [ ] Screen reader announces options correctly
- [ ] Keyboard navigation functional
- [ ] Focus indicators visible
- [ ] ARIA labels appropriate

#### 6.4 Responsive Design ✅
- [ ] Test on mobile devices (320px+)
- [ ] Test on tablet (768px+)
- [ ] Test on desktop (1024px+)
- [ ] 2-level selection works on all screen sizes
- [ ] Touch targets appropriate size on mobile

### 7. Performance Testing

#### 7.1 Form Rendering Performance ✅
- [ ] Payment form loads < 100ms
- [ ] No lag when switching between primary options
- [ ] Bank options appear/disappear smoothly
- [ ] No performance degradation vs old form

#### 7.2 Payment Processing Performance ✅
- [ ] Payment processing time unchanged
- [ ] Receipt generation performance maintained
- [ ] No memory leaks with repeated use
- [ ] Database queries efficient

### 8. Integration Testing

#### 8.1 End-to-End Transaction Flow ✅
- [ ] **Complete Flow Test:**
  1. Create new transaction
  2. Select products and customer
  3. Choose payment method (2-level selection)
  4. Submit transaction
  5. Add additional payment
  6. Generate receipt
  7. Verify all data correct

#### 8.2 Cross-Browser Testing ✅
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

#### 8.3 Database Integration ✅
- [ ] New payment methods save correctly
- [ ] Legacy data displays correctly
- [ ] No database errors
- [ ] Data integrity maintained

## Test Data Scenarios

### New Payment Methods
```typescript
// Test with each new payment method
const testMethods = [
  'tunai',    // Cash payment
  'bca',      // BCA bank
  'bri',      // BRI bank
  'mandiri',  // Mandiri bank
  'qris'      // QRIS payment
]
```

### Legacy Data Scenarios
```typescript
// Test backward compatibility
const legacyMethods = [
  'transfer', // Should map to 'bca' and display as 'Transfer'
  'kartu'     // Should map to 'qris' and display as 'Transfer'
]
```

### Edge Cases
- Empty/null payment method values
- Invalid payment method strings
- Network timeouts during payment processing
- Large transaction amounts
- Special characters in transaction data

## Success Criteria

### ✅ Functional Requirements
- [ ] All payment methods work correctly
- [ ] 2-level selection UI functional
- [ ] Reference field completely removed
- [ ] Receipt display mapping correct
- [ ] Backward compatibility maintained

### ✅ Non-Functional Requirements
- [ ] Form rendering < 100ms
- [ ] 20% reduction in form completion time
- [ ] No user confusion about reference fields
- [ ] Accessibility standards maintained (WCAG 2.1 AA)
- [ ] 100% backward compatibility

### ✅ Technical Requirements
- [ ] 0 TypeScript errors
- [ ] 0 ESLint errors
- [ ] All diagnostics clean
- [ ] Performance targets met
- [ ] Error handling robust

## Bug Reporting Template

```markdown
**Bug Title:** [Brief description]

**Environment:**
- Browser: [Chrome/Firefox/Safari/Edge]
- Device: [Desktop/Mobile/Tablet]
- Screen Size: [1920x1080/375x667/etc]

**Steps to Reproduce:**
1. Navigate to [specific page]
2. Select [specific payment method]
3. [Additional steps]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots:**
[Attach if applicable]

**Priority:** [High/Medium/Low]
**Component:** [PaymentForm/PaymentModal/Receipt/etc]
```

## Testing Schedule

### Day 1: Core Functionality
- Transaction creation form testing
- Payment modal testing
- Basic validation testing

### Day 2: Integration & Compatibility
- Receipt generation testing
- Backward compatibility testing
- End-to-end flow testing

### Day 3: Polish & Performance
- User experience testing
- Performance testing
- Cross-browser testing
- Bug fixes

## Notes for Testers

### Important Changes to Verify
1. **No Reference Field:** Ensure no reference number input appears anywhere
2. **2-Level Selection:** Primary choice first, then bank options conditionally
3. **Receipt Display:** All bank methods show as "Transfer" in receipts
4. **Legacy Data:** Old transactions still work and display correctly

### Common Issues to Watch For
- Bank options not appearing when "Bank/Transfer" selected
- Form allowing submission without complete selection
- Reference field accidentally visible
- Receipt showing specific bank names instead of "Transfer"
- Legacy transactions not displaying correctly

### Testing Tips
- Test with real transaction data when possible
- Verify both UI behavior and database storage
- Check console for any JavaScript errors
- Test on different screen sizes and devices
- Pay attention to loading states and error messages

**Testing Status: READY FOR MANUAL TESTING**
**All implementation phases complete - focus on validation and bug detection**