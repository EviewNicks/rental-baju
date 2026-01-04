# Manual Testing Guide: Jas-Sarung Pairing System

## Overview

Comprehensive manual testing guide untuk memvalidasi semua functionality jas-sarung pairing system setelah implementasi Tasks 1-24. Testing ini memastikan tidak ada error yang tersisa dan semua requirements terpenuhi dengan baik.

## Pre-Testing Setup

### 1. Environment Preparation
```bash
# Ensure development server is running
npm run dev

# Verify database is seeded with test data
# Check categories: jas-jaguar, jas-polos, jas-premium, jas-renda, sarung
# Check products: Multiple jas and sarung products available
```

### 2. Test Data Requirements
- **Jas Products**: Minimum 2 products each from jas-jaguar, jas-polos, jas-premium, jas-renda
- **Sarung Products**: Minimum 5 sarung products with different sizes (ADULT, CHILD)
- **Other Products**: anting, gelang, kalung, bando-besar, Dress (for backward compatibility)
- **Stock Levels**: Ensure adequate stock for testing (minimum 3-5 each)

### 3. Browser Setup
- Use Chrome/Firefox with Developer Tools open
- Monitor Console for any JavaScript errors
- Monitor Network tab for API request/response analysis
- Clear browser cache before testing

## Test Categories

## 1. Jas Product Detection & Button Behavior

### Test 1.1: Jas Product Badge Display
**Objective**: Verify jas products show "Jas + Sarung Gratis" badge

**Steps**:
1. Navigate to Kasir → Transaksi Baru
2. Go to Product Selection step
3. Locate jas products (jas-jaguar, jas-polos, jas-premium, jas-renda)

**Expected Results**:
- ✅ All jas products display blue badge "Jas + Sarung Gratis"
- ✅ Badge is clearly visible and properly styled
- ✅ Non-jas products do NOT show this badge

**Validation**:
- [x] jas-jaguar products show badge
- [x] jas-polos products show badge  
- [x] jas-premium products show badge
- [x] jas-renda products show badge
- [x] Non-jas products (anting, gelang) do NOT show badge

### Test 1.2: Jas Product Button Text
**Objective**: Verify jas products show "Pilih dengan Sarung" button text

**Steps**:
1. In Product Selection step
2. Examine button text on jas product cards

**Expected Results**:
- ✅ Jas products show "Pilih dengan Sarung" button text
- ✅ Non-jas products show "Tambah ke Keranjang" button text

**Validation**:
- [x] Jas product buttons show "Pilih dengan Sarung"
- [x] Non-jas product buttons show "Tambah ke Keranjang"

### Test 1.3: Non-Jas Product Addition (CRITICAL - Task 17 Fix)
**Objective**: Verify non-jas products can be added to cart normally

**Steps**:
1. Click "Tambah ke Keranjang" on anting product
2. Click "Tambah ke Keranjang" on gelang product
3. Click "Tambah ke Keranjang" on kalung product
4. Click "Tambah ke Keranjang" on bando-besar product

**Expected Results**:
- ✅ All non-jas products add to cart successfully
- ✅ NO error messages about "Kategori produk tidak diizinkan"
- ✅ Cart shows added products correctly

**Validation**:
- [x] anting adds to cart without errors
- [x] gelang adds to cart without errors
- [x] kalung adds to cart without errors
- [x] bando-besar adds to cart without errors
- [x] NO console errors in browser developer tools

## 2. Sarung Selection Modal Functionality

### Test 2.1: Modal Opening
**Objective**: Verify sarung selection modal opens when jas is selected

**Steps**:
1. Click "Pilih dengan Sarung" on any jas product
2. Observe modal behavior

**Expected Results**:
- ✅ SarungSelectionModal opens immediately
- ✅ Modal displays available sarung products
- ✅ Modal shows "Tanpa Sarung" option prominently
- ✅ Modal has proper z-index (appears above other content)

**Validation**:
- [x] Modal opens without delay
- [x] Sarung products are displayed in grid
- [x] "Tanpa Sarung" button is visible and prominent
- [x] Modal overlay blocks background interaction

### Test 2.2: Sarung Product Display
**Objective**: Verify sarung products display correctly in modal

**Steps**:
1. Open sarung selection modal
2. Examine sarung product cards

**Expected Results**:
- ✅ All available sarung products are shown
- ✅ Products show correct names, images, sizes
- ✅ Stock quantities are displayed
- ✅ Products with zero stock are disabled
- ✅ "GRATIS" badge is shown on all sarung products

**Validation**:
- [x] Sarung products display with correct information
- [x] Stock quantities are accurate
- [x] Out-of-stock products are disabled
- [x] "GRATIS" badge is visible on all sarung

### Test 2.3: Quantity Selection
**Objective**: Verify quantity selection works correctly

**Steps**:
1. Open sarung selection modal for jas (quantity 2)
2. Click on a sarung product
3. Test quantity selector

**Expected Results**:
- ✅ Quantity selector appears
- ✅ Maximum quantity equals jas quantity
- ✅ Quantity can be adjusted within limits
- ✅ Selected quantity is displayed correctly

**Validation**:
- [x] Quantity selector works properly
- [x] Maximum quantity is enforced
- [x] Selected quantity updates correctly

### Test 2.4: "Tanpa Sarung" Option
**Objective**: Verify "Tanpa Sarung" option works correctly

**Steps**:
1. Open sarung selection modal
2. Click "Tanpa Sarung" button

**Expected Results**:
- ✅ Modal closes immediately
- ✅ Only jas is added to cart (no sarung)
- ✅ Cart shows jas without pairing indicator

**Validation**:
- [x] Modal closes on "Tanpa Sarung" click
- [x] Only jas appears in cart
- [x] No pairing indicators shown

### Test 2.5: Modal Error Handling
**Objective**: Verify modal handles errors gracefully

**Steps**:
1. Open sarung selection modal
2. Simulate network error (disconnect internet briefly)
3. Try to select sarung

**Expected Results**:
- ✅ Error message is displayed in Indonesian
- ✅ Retry option is available
- ✅ Fallback to "Tanpa Sarung" is offered
- ✅ No JavaScript errors in console

**Validation**:
- [x] Error messages are user-friendly
- [x] Retry mechanisms work
- [x] Graceful degradation occurs

## 3. ProductHistoryPopup Dual Context Testing (CRITICAL)

### Test 3.1: History Popup from Main Grid
**Objective**: Verify ProductHistoryPopup works from main product grid

**Steps**:
1. In Product Selection step
2. Click history icon on any product card
3. Verify popup opens correctly

**Expected Results**:
- ✅ ProductHistoryPopup opens with correct data
- ✅ Popup has proper z-index (z-60)
- ✅ Popup displays transaction history
- ✅ Popup can be closed properly

**Validation**:
- [x] History popup opens from main grid
- [x] Data is displayed correctly
- [x] Popup closes properly

### Test 3.2: History Popup from Sarung Modal (CRITICAL)
**Objective**: Verify ProductHistoryPopup works from within SarungSelectionModal

**Steps**:
1. Open SarungSelectionModal
2. Click history icon on sarung product card
3. Verify both modals work together

**Expected Results**:
- ✅ ProductHistoryPopup opens above SarungSelectionModal
- ✅ Both modals are visible simultaneously
- ✅ History popup has higher z-index (z-60 > z-50)
- ✅ Closing history popup keeps sarung modal open
- ✅ Both modals function independently

**Validation**:
- [x] History popup opens from sarung modal
- [x] Both modals are visible together
- [x] Z-index layering is correct
- [x] Independent modal state management works

### Test 3.3: Modal Independence
**Objective**: Verify modals don't interfere with each other

**Steps**:
1. Open SarungSelectionModal
2. Open ProductHistoryPopup from sarung modal
3. Close ProductHistoryPopup
4. Verify SarungSelectionModal remains open
5. Select sarung and confirm

**Expected Results**:
- ✅ SarungSelectionModal remains functional after history popup closes
- ✅ Sarung selection works normally
- ✅ No state conflicts between modals

**Validation**:
- [ ] Modal state independence maintained
- [ ] No interference between modals
- [ ] Both modals function correctly

## 4. Cart Display & Management

### Test 4.1: Jas-Sarung Pairing Display
**Objective**: Verify jas-sarung pairings display correctly in cart

**Steps**:
1. Add jas with sarung to cart
2. Examine cart display

**Expected Results**:
- ✅ Jas shows with pairing indicator
- ✅ Sarung shows as "GRATIS" with crossed-out price
- ✅ Pairing relationship is visually clear
- ✅ Both items are listed in cart

**Validation**:
- [x] Pairing indicators are visible
- [x] Sarung shows "GRATIS" pricing
- [x] Visual relationship is clear

### Test 4.2: Linked Removal
**Objective**: Verify removing jas also removes linked sarung

**Steps**:
1. Add jas with sarung to cart
2. Remove jas from cart
3. Verify sarung is also removed

**Expected Results**:
- ✅ Removing jas removes linked sarung automatically
- ✅ Cart updates correctly
- ✅ No orphaned sarung items remain

**Validation**:
- [x] Linked removal works correctly
- [x] Cart state is consistent
- [x] No orphaned items

### Test 4.3: Quantity Adjustment
**Objective**: Verify quantity adjustments work for paired items

**Steps**:
1. Add jas (qty 2) with sarung (qty 2) to cart
2. Adjust jas quantity to 3
3. Verify sarung quantity updates

**Expected Results**:
- ✅ Sarung quantity adjusts with jas quantity
- ✅ Pairing relationship is maintained
- ✅ Pricing calculations are correct

**Validation**:
- [x] Quantity synchronization works
- [x] Pairing relationship maintained
- [x] Calculations are accurate

## 5. Payment Summary Integration

### Test 5.1: Pairing Display in Payment Summary
**Objective**: Verify payment summary shows pairings correctly

**Steps**:
1. Add jas with sarung to cart
2. Proceed to Payment Summary step
3. Examine item breakdown

**Expected Results**:
- ✅ Jas and sarung are listed separately
- ✅ Sarung shows "GRATIS" pricing
- ✅ Pairing indicators are visible
- ✅ Total calculation excludes sarung price

**Validation**:
- [x] Items are listed separately
- [x] Sarung pricing shows "GRATIS"
- [x] Total calculation is correct

### Test 5.2: Price Calculation Accuracy
**Objective**: Verify price calculations exclude sarung prices

**Steps**:
1. Add jas (Rp 100,000) with sarung to cart
2. Check subtotal and total calculations

**Expected Results**:
- ✅ Subtotal shows only jas price (Rp 100,000)
- ✅ Sarung price is excluded from calculations
- ✅ Final total is accurate

**Validation**:
- [x] Subtotal excludes sarung price
- [x] Final total is correct
- [x] No sarung charges applied

## 6. Professional Receipt Generation

### Test 6.1: Receipt Column Structure
**Objective**: Verify receipt has correct column structure

**Steps**:
1. Complete transaction with jas-sarung pairing
2. Generate and view receipt

**Expected Results**:
- ✅ Receipt has "Kode Jas" column
- ✅ Receipt has "Kode Sarung" column
- ✅ Column widths are properly distributed
- ✅ Professional appearance is maintained

**Validation**:
- [ ] New columns are present
- [ ] Column layout is professional
- [ ] All data fits properly

### Test 6.2: Jas-Sarung Code Display
**Objective**: Verify jas and sarung codes display correctly

**Steps**:
1. Create transaction with jas-sarung pairing
2. Check receipt content

**Expected Results**:
- ✅ Jas code appears in "Kode Jas" column
- ✅ Sarung code appears in "Kode Sarung" column
- ✅ Non-jas products show "-" in both columns
- ✅ Pairing relationships are clear

**Validation**:
- [ ] Jas codes are correct
- [ ] Sarung codes are correct
- [ ] Non-jas products show "-"

## 7. Error Handling & Validation Testing

### Test 7.1: Sarung Availability Errors
**Objective**: Verify system handles sarung availability issues

**Steps**:
1. Reduce sarung stock to 0 in database
2. Try to select that sarung for pairing

**Expected Results**:
- ✅ Error message in Indonesian
- ✅ Alternative sarung options shown
- ✅ "Tanpa Sarung" option remains available
- ✅ Graceful degradation occurs

**Validation**:
- [x] Error messages are user-friendly
- [x] Alternative options provided
- [x] System remains functional

### Test 7.2: Modal Loading Failures
**Objective**: Verify system handles modal loading failures

**Steps**:
1. Simulate network issues
2. Try to open sarung selection modal

**Expected Results**:
- ✅ Error message is displayed
- ✅ Retry option is available
- ✅ Fallback to direct jas addition works
- ✅ No system crashes

**Validation**:
- [x] Error handling works
- [x] Retry mechanisms function
- [x] Fallback options available

### Test 7.3: Validation Error Messages
**Objective**: Verify validation errors are user-friendly

**Steps**:
1. Try various invalid operations
2. Check error message quality

**Expected Results**:
- ✅ All error messages in Indonesian
- ✅ Messages are clear and actionable
- ✅ No technical jargon for users
- ✅ Proper error recovery options

**Validation**:
- [x] Error messages are user-friendly
- [x] Language is appropriate for kasir users
- [x] Recovery options are clear

## 8. Input Validation & Security Testing

### Test 8.1: Quantity Limits
**Objective**: Verify quantity limits are enforced

**Steps**:
1. Try to select sarung quantity > jas quantity
2. Try to select quantity > available stock
3. Try negative quantities

**Expected Results**:
- ✅ Quantity limits are enforced
- ✅ Error messages explain limits
- ✅ Invalid inputs are prevented
- ✅ System remains stable

**Validation**:
- [x] Quantity limits work correctly
- [x] Error messages are helpful
- [x] System prevents invalid inputs

### Test 8.2: Rate Limiting
**Objective**: Verify rate limiting prevents spam

**Steps**:
1. Rapidly click sarung selection multiple times
2. Try to submit multiple times quickly

**Expected Results**:
- ✅ Rate limiting prevents spam submissions
- ✅ User is notified of rate limits
- ✅ System remains responsive
- ✅ No duplicate transactions created

**Validation**:
- [x] Rate limiting functions correctly
- [x] User feedback is appropriate
- [x] No duplicate operations

## 9. Backward Compatibility Testing

### Test 9.1: Existing Transactions
**Objective**: Verify existing transactions display correctly

**Steps**:
1. View transactions created before pairing system
2. Check transaction detail pages

**Expected Results**:
- ✅ Old transactions display normally
- ✅ No pairing indicators for old transactions
- ✅ No errors or broken displays
- ✅ All existing functionality works

**Validation**:
- [x] Old transactions work correctly
- [x] No regression in existing features
- [x] Display is consistent

### Test 9.2: Non-Jas Workflows
**Objective**: Verify non-jas workflows are unchanged

**Steps**:
1. Create transaction with only non-jas products
2. Complete full workflow

**Expected Results**:
- ✅ Workflow is identical to before
- ✅ No pairing-related UI elements
- ✅ Performance is unchanged
- ✅ All features work normally

**Validation**:
- [ ] Non-jas workflows unchanged
- [ ] No performance regression
- [ ] All features functional

## 10. End-to-End Workflow Testing

### Test 10.1: Complete Jas-Sarung Transaction
**Objective**: Test complete workflow from selection to receipt

**Steps**:
1. Select jas product (quantity 2)
2. Choose sarung in modal (quantity 2)
3. Add to cart
4. Proceed through payment
5. Complete transaction
6. Generate receipt
7. View transaction detail

**Expected Results**:
- ✅ Smooth workflow without errors
- ✅ Pairing maintained throughout
- ✅ Correct pricing at all stages
- ✅ Professional receipt generated
- ✅ Transaction detail shows pairing

**Validation**:
- [x] Complete workflow works
- [x] No errors at any stage
- [x] Data consistency maintained

### Test 10.2: Mixed Transaction (Jas + Non-Jas)
**Objective**: Test transaction with both jas and non-jas products

**Steps**:
1. Add jas with sarung
2. Add anting (non-jas)
3. Add gelang (non-jas)
4. Complete transaction

**Expected Results**:
- ✅ All products handled correctly
- ✅ Pairing only applies to jas
- ✅ Non-jas products charged normally
- ✅ Receipt shows correct codes

**Validation**:
- [x] Mixed transactions work
- [x] Pairing logic is selective
- [x] All products handled correctly

### Test 10.3: Multiple Pairing Transaction
**Objective**: Test transaction with multiple jas-sarung pairings

**Steps**:
1. Add jas-jaguar with sarung A
2. Add jas-premium with sarung B
3. Add jas-polos without sarung
4. Complete transaction

**Expected Results**:
- ✅ Multiple pairings handled correctly
- ✅ Each pairing is independent
- ✅ Mixed scenarios work (with/without sarung)
- ✅ Receipt shows all codes correctly

**Validation**:
- [x] Multiple pairings work
- [x] Independence maintained
- [x] Complex scenarios handled

## Performance Testing

### Test 11.1: Modal Loading Performance
**Objective**: Verify modal loads quickly

**Steps**:
1. Click "Pilih dengan Sarung" on jas
2. Measure modal loading time

**Expected Results**:
- ✅ Modal opens within 1 second
- ✅ Sarung products load quickly
- ✅ No performance degradation
- ✅ Smooth user experience

**Validation**:
- [x] Modal loads quickly
- [x] No performance issues
- [x] User experience is smooth

### Test 11.2: Transaction Processing Performance
**Objective**: Verify transaction processing is not slower

**Steps**:
1. Create transaction with jas-sarung pairing
2. Compare processing time to non-pairing transaction

**Expected Results**:
- ✅ Processing time is comparable
- ✅ No significant delays
- ✅ Database operations are efficient
- ✅ User experience is maintained

**Validation**:
- [x] Processing time is acceptable
- [x] No performance regression
- [x] Efficient operations

## Browser Compatibility Testing

### Test 12.1: Cross-Browser Testing
**Objective**: Verify functionality across browsers

**Steps**:
1. Test in Chrome, Firefox, Safari, Edge
2. Test all major functionality

**Expected Results**:
- ✅ All features work in all browsers
- ✅ UI displays correctly
- ✅ No browser-specific errors
- ✅ Consistent user experience

**Validation**:
- [ ] Chrome compatibility
- [ ] Firefox compatibility
- [ ] Safari compatibility
- [ ] Edge compatibility

### Test 12.2: Mobile Responsiveness
**Objective**: Verify mobile compatibility

**Steps**:
1. Test on mobile devices/responsive mode
2. Test modal functionality on mobile

**Expected Results**:
- ✅ Modals work on mobile
- ✅ Touch interactions work
- ✅ Layout is responsive
- ✅ All features accessible

**Validation**:
- [ ] Mobile functionality works
- [ ] Touch interactions responsive
- [ ] Layout adapts correctly

## Bug Reporting Template

### Bug Report Format
```
**Bug ID**: [Unique identifier]
**Test Case**: [Which test case failed]
**Severity**: [Critical/High/Medium/Low]
**Browser**: [Browser and version]
**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result**: [What should happen]
**Actual Result**: [What actually happened]
**Screenshots**: [If applicable]
**Console Errors**: [Any JavaScript errors]
**Additional Notes**: [Any other relevant information]
```

### Severity Levels
- **Critical**: System crashes, data loss, security issues
- **High**: Major functionality broken, blocking workflows
- **Medium**: Minor functionality issues, workarounds available
- **Low**: Cosmetic issues, minor inconveniences

## Testing Schedule

### Day 1: Core Functionality
- Tests 1.1 - 1.3: Jas Product Detection
- Tests 2.1 - 2.5: Sarung Selection Modal
- Tests 3.1 - 3.3: ProductHistoryPopup Dual Context

### Day 2: Integration Testing
- Tests 4.1 - 4.3: Cart Display & Management
- Tests 5.1 - 5.2: Payment Summary Integration
- Tests 6.1 - 6.2: Professional Receipt Generation

### Day 3: Error Handling & Compatibility
- Tests 7.1 - 7.3: Error Handling & Validation
- Tests 8.1 - 8.2: Input Validation & Security
- Tests 9.1 - 9.2: Backward Compatibility
- Tests 10.1 - 10.3: End-to-End Workflow
- Tests 11.1 - 11.2: Performance Testing
- Tests 12.1 - 12.2: Browser Compatibility

## Testing Tips

### Important Features to Focus On
1. **Modal Independence**: Critical that both SarungSelectionModal and ProductHistoryPopup work together
2. **Data Flow**: Ensure pairing data flows correctly from selection to receipt
3. **Backward Compatibility**: Existing functionality must remain unchanged
4. **Error Handling**: All error scenarios should be graceful and user-friendly
5. **Performance**: No significant performance degradation

### Common Issues to Watch For
1. **JavaScript Errors**: Monitor console for any errors
2. **Modal Conflicts**: Ensure modals don't interfere with each other
3. **Data Loss**: Verify pairing data persists through entire workflow
4. **UI Inconsistencies**: Check for layout issues or broken styling
5. **Validation Failures**: Ensure all validation works correctly

### Testing Best Practices
1. **Clear Browser Cache**: Before each testing session
2. **Use Fresh Data**: Reset test data between major test runs
3. **Document Everything**: Record all issues found
4. **Test Edge Cases**: Try unusual combinations and scenarios
5. **Verify Fixes**: Re-test after any bug fixes

## Success Criteria

### All Tests Must Pass
- ✅ No critical or high severity bugs
- ✅ All major functionality works correctly
- ✅ Backward compatibility maintained
- ✅ Performance is acceptable
- ✅ User experience is smooth

### Quality Gates
- ✅ Zero JavaScript console errors
- ✅ All API calls succeed
- ✅ Database operations are correct
- ✅ Receipt generation is accurate
- ✅ Cross-browser compatibility confirmed

This comprehensive testing guide ensures that the jas-sarung pairing system is thoroughly validated and ready for production use.