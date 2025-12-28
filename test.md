# Manual Testing Guide - Jas-Sarung Pairing System

## Overview
Panduan testing manual untuk fitur Jas-Sarung Pairing System yang memungkinkan pelanggan menyewa jas dengan sarung gratis sebagai paket lengkap. Sistem menggunakan modal-based approach untuk sarung selection dan terintegrasi dengan cart, payment, dan receipt systems.

## Implementation Status
- ✅ **Task 1-3:** Core Infrastructure & Components - COMPLETE
- ✅ **Task 4-6:** UI Components & Modal Integration - COMPLETE  
- ✅ **Task 7-10:** Cart Management & Receipt Service - COMPLETE
- ✅ **Task 11-13:** Error Handling, Validation & Code Quality - COMPLETE
- 🧪 **Task 14:** Manual Testing & Integration Validation - IN PROGRESS

## Testing Scope

### What's New
- **Jas Detection:** Automatic detection of jas products (jas-jaguar, jas-polos, jas-premium, jas-renda)
- **Sarung Selection Modal:** Modal interface for selecting sarung to pair with jas
- **Free Sarung Pricing:** Sarung is always free when paired with jas
- **Pairing Indicators:** Visual indicators showing jas-sarung relationships
- **Enhanced Receipt:** Professional receipts with "Kode Jas" and "Kode Sarung" columns
- **Comprehensive Error Handling:** User-friendly error messages in Indonesian
- **Input Validation:** Security measures and validation for all inputs

## Testing Checklist

### 1. Jas Product Detection & Button Behavior
**Location:** `/kasir/transaksi/buat` - Step 1 Product Selection

#### 1.1 Jas Product Identification ✅
- [x] Navigate to product selection page
- [x] Verify jas products show blue badge "Jas + Sarung Gratis"
- [x] Verify jas products have different button text: "Pilih dengan Sarung"
- [ ] Test all jas categories:
  - [x] **jas-jaguar** products detected correctly
  - [x] **jas-polos** products detected correctly
  - [x] **jas-premium** products detected correctly
  - [x] **jas-renda** products detected correctly
- [x] Non-jas products show normal "Tambah ke Keranjang" button
- [x] Visual indicators clear and consistent

#### 1.2 Button Behavior Validation ✅
- [x] Click "Pilih dengan Sarung" on jas product → Sarung selection modal opens
- [ ] Click "Tambah ke Keranjang" on non-jas product → Added directly to cart
- [ ] Jas products don't get added to cart until sarung selection is complete
- [ ] Button states update correctly based on product type

### 2. Sarung Selection Modal Functionality
**Location:** Sarung Selection Modal (triggered by jas product selection)

#### 2.1 Modal Opening & Display ✅
- [ ] Select jas product → Modal opens immediately
- [ ] Modal title shows: "Pilih Sarung untuk [Jas Name]"
- [ ] Modal description explains sarung is free
- [ ] Jas product info displayed in blue box with quantity
- [ ] Modal has proper z-index (50) and doesn't conflict with other modals
- [ ] Close button (X) works correctly

#### 2.2 Sarung Products Display ✅
- [ ] All available sarung products displayed in grid
- [ ] Only products with category "sarung" are shown
- [ ] Products with zero stock are disabled but visible
- [ ] Stock warnings shown for products with ≤2 stock
- [ ] ProductCard components work correctly within modal
- [ ] Responsive grid layout (1/2/3 columns based on screen size)

#### 2.3 Sarung Selection Process ✅
- [ ] Click on sarung product → Gets selected (blue ring indicator)
- [ ] Selected sarung shows "Terpilih" badge
- [ ] Selected sarung info appears in green box
- [ ] Can change selection by clicking different sarung
- [ ] Quantity selection works correctly (up to jas quantity)
- [ ] Size selection works for sarung with multiple sizes

#### 2.4 "Tanpa Sarung" Option ✅
- [ ] "Tanpa Sarung" button always available
- [ ] Click "Tanpa Sarung" → Jas added to cart without sarung
- [ ] Modal closes after "Tanpa Sarung" selection
- [ ] No sarung-related data stored for jas-only selection

#### 2.5 Confirmation Process ✅
- [ ] "Konfirmasi dengan Sarung" button disabled until sarung selected
- [ ] Click "Konfirmasi dengan Sarung" → Both jas and sarung added to cart
- [ ] Modal closes after successful confirmation
- [ ] Success toast message displayed
- [ ] Loading states shown during processing

### 3. ProductHistoryPopup Dual Context Testing
**Critical: Test modal interactions and z-index layering**

#### 3.1 History Popup from Main Grid ✅
- [ ] Click history icon on product in main grid → History popup opens
- [ ] History popup has z-index 60 (higher than sarung modal)
- [ ] History popup displays correctly with product data
- [ ] Close history popup → Returns to main grid view
- [ ] No conflicts with other UI elements

#### 3.2 History Popup from Sarung Modal ✅
- [ ] Open sarung selection modal
- [ ] Click history icon on sarung product → History popup opens
- [ ] Both modals visible simultaneously (sarung modal + history popup)
- [ ] History popup appears above sarung modal (z-index layering)
- [ ] Close history popup → Returns to sarung modal
- [ ] Close sarung modal → Both modals close correctly

#### 3.3 Modal State Independence ✅
- [ ] Open sarung modal → Open history popup → Close history → Sarung modal still open
- [ ] Open history popup → Open sarung modal → Close sarung → History popup still open
- [ ] Both modals can be opened and closed independently
- [ ] No state conflicts or UI glitches
- [ ] Proper focus management between modals

### 4. Cart Display & Management
**Location:** Cart sidebar in product selection step

#### 4.1 Jas-Sarung Pairing Display ✅
- [ ] Add jas with sarung → Both items appear in cart
- [ ] Jas shows with SarungPairingIndicator: "→ dengan Sarung [Name]"
- [ ] Sarung shows as "GRATIS" with original price crossed out
- [ ] Pairing relationship visually clear
- [ ] Individual quantities displayed correctly

#### 4.2 Pricing in Cart ✅
- [ ] Jas shows normal price per day
- [ ] Sarung shows "GRATIS" (price excluded from calculations)
- [ ] Cart total excludes sarung prices
- [ ] Total calculation correct for multiple jas-sarung pairs
- [ ] Non-jas products priced normally

#### 4.3 Quantity Management ✅
- [ ] Increase jas quantity → Sarung quantity can be adjusted independently
- [ ] Decrease jas quantity → Sarung quantity adjusts appropriately
- [ ] Remove jas → Linked sarung also removed automatically
- [ ] Remove sarung → Only sarung removed, jas remains
- [ ] Quantity controls work correctly for both items

#### 4.4 Cart Summary Calculations ✅
- [ ] Total items count includes both jas and sarung
- [ ] Total price excludes sarung amounts
- [ ] Duration shows "4 hari" correctly
- [ ] Summary updates in real-time with changes

### 5. Payment Summary Integration
**Location:** `/kasir/transaksi/buat` - Step 3 Payment Summary

#### 5.1 Pairing Display in Payment Summary ✅
- [ ] Navigate to payment summary step
- [ ] Jas-sarung pairs displayed with pairing indicators
- [ ] SarungPairingIndicator shows "→ dengan Sarung [Name]"
- [ ] Sarung listed as separate line item with "GRATIS"
- [ ] Visual hierarchy clear and professional

#### 5.2 Price Breakdown ✅
- [ ] Jas shows normal price in breakdown
- [ ] Sarung shows "GRATIS" with visual indication
- [ ] Subtotal excludes sarung prices
- [ ] Tax calculations (if any) exclude sarung amounts
- [ ] Final total correct and matches cart total

#### 5.3 Receipt Preview Accuracy ✅
- [ ] Receipt preview matches final receipt format
- [ ] Jas and sarung codes displayed correctly
- [ ] Pairing relationships preserved in preview
- [ ] Professional formatting maintained

### 6. Professional Receipt Generation
**Location:** Transaction Detail → "Cetak Struk Profesional"

#### 6.1 Receipt Table Structure ✅
- [ ] Create transaction with jas-sarung pairing
- [ ] Generate professional receipt
- [ ] Verify table has "Kode Jas" and "Kode Sarung" columns
- [ ] Column widths properly distributed
- [ ] Professional 14x20cm landscape format maintained

#### 6.2 Jas-Sarung Code Display ✅
- [ ] **Jas with Sarung Pairing:**
  - Jas code in "Kode Jas" column
  - Sarung code in "Kode Sarung" column
  - Both quantities match
- [ ] **Jas without Sarung:**
  - Jas code in "Kode Jas" column
  - "-" in "Kode Sarung" column
- [ ] **Non-Jas Products:**
  - Product code in appropriate column
  - "-" in both jas and sarung columns

#### 6.3 Receipt Content Validation ✅
- [ ] All product information accurate
- [ ] Pricing shows sarung as free
- [ ] Transaction totals correct
- [ ] Professional appearance maintained
- [ ] No layout issues or overlapping text

### 7. Error Handling & Validation Testing
**Critical: Test all error scenarios with Indonesian messages**

#### 7.1 Sarung Availability Errors ✅
- [ ] Select jas when no sarung available → Clear error message in Indonesian
- [ ] Select sarung that becomes unavailable → Real-time error with refresh option
- [ ] Select quantity exceeding sarung stock → Quantity validation error
- [ ] Network timeout during sarung loading → Timeout error with retry option

#### 7.2 Modal Loading Failures ✅
- [ ] Simulate modal loading failure → Fallback to add jas without sarung
- [ ] Modal timeout → Retry mechanism with exponential backoff
- [ ] Multiple retry attempts → Final fallback with clear messaging
- [ ] All error messages in user-friendly Indonesian

#### 7.3 Input Validation Errors ✅
- [ ] Invalid quantity input → Validation error with limits shown
- [ ] Invalid product data → Data validation error
- [ ] Invalid size selection → Size validation error
- [ ] Rate limiting triggered → Rate limit warning with remaining count

#### 7.4 Graceful Degradation ✅
- [ ] Modal fails to open → Jas added without sarung with warning message
- [ ] Sarung selection fails → Option to retry or proceed with jas only
- [ ] Network issues → Offline-friendly error messages
- [ ] System maintains functionality despite pairing failures

### 8. Input Validation & Security Testing

#### 8.1 Quantity Validation ✅
- [ ] Enter quantity below minimum (1) → Validation error
- [ ] Enter quantity above maximum (50) → Validation error
- [ ] Enter quantity exceeding stock → Stock validation error
- [ ] Enter non-numeric quantity → Input validation error

#### 8.2 Rate Limiting ✅
- [ ] Rapid successive selections → Rate limiting kicks in after 10 attempts/minute
- [ ] Rate limit warning shows remaining attempts
- [ ] Rate limit resets after time window
- [ ] Session limits prevent excessive operations (100 selections/session)

#### 8.3 Security Measures ✅
- [ ] Product category validation prevents invalid selections
- [ ] Input sanitization prevents XSS attacks
- [ ] Server-side validation for all critical operations
- [ ] Form submission blocked for invalid data

### 9. Backward Compatibility Testing
**Critical: Ensure existing functionality unchanged**

#### 9.1 Non-Jas Product Workflow ✅
- [ ] Non-jas products work exactly as before
- [ ] Cart functionality unchanged for regular products
- [ ] Payment process identical for non-jas items
- [ ] Receipt generation unchanged for regular transactions

#### 9.2 Existing Transaction Display ✅
- [ ] Old transactions without pairing display correctly
- [ ] Receipt generation works for legacy transactions
- [ ] No errors in transaction history
- [ ] All existing functionality preserved

#### 9.3 API Compatibility ✅
- [ ] Existing API endpoints work unchanged
- [ ] New pairing data stored without breaking existing schema
- [ ] Database queries efficient and compatible
- [ ] No performance degradation for existing features

### 10. End-to-End Workflow Testing

#### 10.1 Complete Jas-Sarung Transaction ✅
- [ ] **Step 1:** Select jas product → Sarung modal opens
- [ ] **Step 2:** Select sarung → Confirm pairing → Added to cart
- [ ] **Step 3:** Proceed to customer data → Fill customer information
- [ ] **Step 4:** Proceed to payment summary → Verify pairing display
- [ ] **Step 5:** Complete transaction → Success confirmation
- [ ] **Step 6:** Generate receipt → Verify jas-sarung codes

#### 10.2 Multiple Pairing Scenarios ✅
- [ ] **Scenario 1:** Multiple jas with different sarung
- [ ] **Scenario 2:** Mix of jas-sarung pairs and regular products
- [ ] **Scenario 3:** Jas without sarung + regular products
- [ ] **Scenario 4:** Multiple quantities of same jas-sarung pair

#### 10.3 Edge Case Workflows ✅
- [ ] Add jas → Remove before sarung selection → No orphaned data
- [ ] Add jas with sarung → Change sarung selection → Previous selection cleared
- [ ] Add multiple jas → Select different sarung for each → All pairings correct
- [ ] Network interruption during pairing → Recovery mechanisms work

## Test Data Scenarios

### Jas Products to Test
```typescript
const jasCategories = [
  'jas-jaguar',    // Premium jas category
  'jas-polos',     // Plain jas category  
  'jas-premium',   // Premium jas category
  'jas-renda'      // Lace jas category
]
```

### Sarung Products to Test
```typescript
const sarungScenarios = [
  { category: 'sarung', stock: 10 },     // Normal stock
  { category: 'sarung', stock: 2 },      // Low stock warning
  { category: 'sarung', stock: 0 },      // Out of stock
  { category: 'sarung', sizes: ['S', 'M', 'L'] }  // Multiple sizes
]
```

### Error Scenarios
- Network timeouts during modal loading
- Sarung becoming unavailable during selection
- Invalid quantity inputs (negative, zero, exceeding stock)
- Rate limiting scenarios (rapid selections)
- Modal conflicts with other popups
- Database connection issues

## Success Criteria

### ✅ Functional Requirements
- [ ] All jas products detected correctly
- [ ] Sarung selection modal works flawlessly
- [ ] Free sarung pricing implemented correctly
- [ ] Cart displays pairing relationships clearly
- [ ] Professional receipts show jas-sarung codes
- [ ] Error handling comprehensive and user-friendly

### ✅ Non-Functional Requirements
- [ ] Modal loading < 500ms
- [ ] No UI conflicts between modals
- [ ] Error messages in Indonesian for non-IT users
- [ ] Graceful degradation for all failure scenarios
- [ ] 100% backward compatibility maintained

### ✅ Technical Requirements
- [ ] 0 TypeScript errors (`yarn type-check`)
- [ ] 0 ESLint errors (`yarn lint`)
- [ ] All diagnostics clean
- [ ] No code duplication
- [ ] Performance targets met

## Bug Reporting Template

```markdown
**Bug Title:** [Brief description]

**Environment:**
- Browser: [Chrome/Firefox/Safari/Edge]
- Device: [Desktop/Mobile/Tablet]
- Screen Size: [1920x1080/375x667/etc]

**Steps to Reproduce:**
1. Navigate to [specific page]
2. Select [specific jas product]
3. [Additional steps]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots:**
[Attach if applicable]

**Priority:** [High/Medium/Low]
**Component:** [SarungModal/ProductCard/Receipt/etc]
**Error Type:** [Functional/UI/Performance/Validation]
```

## Testing Schedule

### Day 1: Core Functionality
- Jas detection and button behavior
- Sarung selection modal functionality
- Basic pairing workflow testing

### Day 2: Integration & Error Handling
- Cart display and management
- Payment summary integration
- Error handling scenarios
- Input validation testing

### Day 3: Advanced Features & Polish
- ProductHistoryPopup dual context testing
- Professional receipt generation
- End-to-end workflow testing
- Performance and compatibility testing

## Notes for Testers

### Important Features to Verify
1. **Modal Independence:** SarungSelectionModal and ProductHistoryPopup work independently
2. **Free Pricing:** Sarung is always free when paired with jas
3. **Error Messages:** All errors in Indonesian, user-friendly for non-IT users
4. **Graceful Degradation:** System works even when pairing fails
5. **Backward Compatibility:** Existing functionality unchanged

### Common Issues to Watch For
- Modal conflicts or z-index issues
- Sarung prices not excluded from totals
- Error messages in English instead of Indonesian
- Pairing relationships not preserved in cart/receipt
- Performance issues with modal loading
- Validation errors not user-friendly

### Testing Tips
- Test with real product data when possible
- Verify both UI behavior and data persistence
- Check browser console for JavaScript errors
- Test on different screen sizes and devices
- Pay attention to loading states and error recovery
- Verify receipt generation accuracy

**Testing Status: READY FOR COMPREHENSIVE MANUAL TESTING**
**All implementation complete - focus on validation and integration testing**