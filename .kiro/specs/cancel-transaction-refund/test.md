# Manual Testing Guide: Cancel Transaction Refund

## Overview

Manual testing guide untuk memvalidasi automatic refund integration pada cancel transaction system. Testing ini memastikan semua Tasks 1-6 berfungsi dengan baik dan tidak ada error yang tersisa.

## Pre-Testing Setup

### 1. Environment Preparation
```bash
# Ensure development server is running
npm run dev

# Verify database has test data
# - Active transactions with payments
# - Active kasir users
# - Customer data
```

### 2. Test Data Requirements
- **Active Transactions**: Minimum 3 transactions dengan status 'active' atau 'diambil'
- **Paid Transactions**: Transactions dengan jumlahBayar > 0 (untuk refund testing)
- **Unpaid Transactions**: Transactions dengan jumlahBayar = 0 (untuk no-refund testing)
- **Active Kasir**: Minimum 1 kasir aktif untuk refund processing
- **User Account**: Login sebagai user yang terhubung dengan kasir

### 3. Browser Setup
- Use Chrome/Firefox dengan Developer Tools open
- Monitor Console untuk JavaScript errors
- Monitor Network tab untuk API requests
- Clear browser cache sebelum testing

## Test Categories

## 1. Refund Detection & Processing (Tasks 1-3)

### Test 1.1: Automatic Refund Detection - Paid Transaction
**Objective**: Verify system detects refund need for paid transactions

**Steps**:
1. Navigate to transaction detail dengan jumlahBayar > 0
2. Click "Batalkan Transaksi"
3. Enter cancellation reason
4. Submit cancellation

**Expected Results**:
- ✅ Transaction cancelled successfully
- ✅ Activity log shows refund processing status
- ✅ No JavaScript errors in console
- ✅ Success message displayed

**Validation**:
- [] Cancellation succeeds
- [] Refund processing triggered
- [] Activity log updated
- [] No console errors

### Test 1.2: No Refund for Unpaid Transaction
**Objective**: Verify system skips refund for unpaid transactions

**Steps**:
1. Navigate to transaction detail dengan jumlahBayar = 0
2. Click "Batalkan Transaksi"
3. Enter cancellation reason
4. Submit cancellation

**Expected Results**:
- ✅ Transaction cancelled successfully
- ✅ No refund processing attempted
- ✅ Activity log shows needsRefund = false
- ✅ No refund status displayed

**Validation**:
- [] Cancellation succeeds
- [] No refund processing
- [] Correct activity log
- [] No refund UI elements

### Test 1.3: Manual Kasir Selection
**Objective**: Verify kasir selection UI works correctly

**Steps**:
1. Click "Batalkan Transaksi" on paid transaction
2. Check kasir selection dropdown appears
3. Try to submit without selecting kasir
4. Select kasir and submit cancellation

**Expected Results**:
- ✅ Kasir dropdown loads active kasir list
- ✅ Validation prevents submission without kasir selection
- ✅ Cancellation succeeds with selected kasir
- ✅ Refund processing uses selected kasir

**Validation**:
- [] Kasir dropdown works
- [] Validation prevents empty submission
- [] Selected kasir used for refund
- [] UI follows LostItemResolution pattern

## 2. UI Display Enhancement (Task 4)

### Test 2.1: Completed Refund Display
**Objective**: Verify completed refund shows green status

**Steps**:
1. Cancel paid transaction (should trigger refund)
2. View transaction detail page
3. Check activity timeline

**Expected Results**:
- ✅ Activity shows "Status Refund: ✅ Selesai"
- ✅ Green color scheme used
- ✅ Refund amount displayed
- ✅ Expense record confirmation shown

**Validation**:
- [] Green status indicator
- [] Correct refund amount
- [] Professional display
- [] All information visible

### Test 2.2: Pending Refund Display
**Objective**: Verify pending refund shows orange status

**Steps**:
1. Find transaction with refund error (or simulate)
2. View transaction detail page
3. Check activity timeline

**Expected Results**:
- ✅ Activity shows "Status Refund: ⏳ Perlu Diproses"
- ✅ Orange color scheme used
- ✅ Payment amount displayed
- ✅ Error message shown (if applicable)

**Validation**:
- [] Orange status indicator
- [] Pending status clear
- [] Payment amount visible
- [] Error handling displayed

### Test 2.3: Backward Compatibility
**Objective**: Verify old cancelled transactions display correctly

**Steps**:
1. View old cancelled transaction (before refund system)
2. Check activity timeline display

**Expected Results**:
- ✅ Old transactions display normally
- ✅ No refund status for old cancellations
- ✅ No JavaScript errors
- ✅ Consistent UI appearance

**Validation**:
- [] Old transactions work
- [] No refund UI for old data
- [] No errors
- [] Consistent display

## 3. Error Handling & Recovery (Task 5)

### Test 3.1: Kasir Not Found Error
**Objective**: Verify system handles missing kasir gracefully

**Steps**:
1. Login as user without kasir
2. Cancel paid transaction
3. Check error handling

**Expected Results**:
- ✅ Transaction cancellation succeeds
- ✅ Refund processing fails gracefully
- ✅ Error logged with context
- ✅ Activity shows refund error

**Validation**:
- [x] Cancellation succeeds
- [x] Error logged properly
- [x] Activity includes error
- [x] System remains stable

### Test 3.2: Database Error Simulation
**Objective**: Verify atomic transaction handling

**Steps**:
1. Simulate database error during refund
2. Check transaction state
3. Verify rollback behavior

**Expected Results**:
- ✅ Transaction cancellation succeeds
- ✅ Partial refund data rolled back
- ✅ needsRefund remains true
- ✅ Error information logged

**Validation**:
- [x] Atomic behavior works
- [x] No partial data
- [x] Consistent state
- [x] Error tracking

## 4. API Integration Testing (Task 3)

### Test 4.1: API Route Kasir Lookup
**Objective**: Verify API route handles kasir lookup

**Steps**:
1. Open browser Developer Tools → Network tab
2. Cancel paid transaction
3. Monitor API request/response

**Expected Results**:
- ✅ PUT request to /api/kasir/transaksi/[kode] succeeds
- ✅ Response includes success message
- ✅ No 400/500 errors
- ✅ Kasir lookup works in background

**Validation**:
- [x] API request succeeds
- [x] Response is correct
- [x] No HTTP errors
- [x] Kasir integration works

### Test 4.2: Error Response Handling
**Objective**: Verify API error responses are handled

**Steps**:
1. Simulate kasir error scenario
2. Check API response
3. Verify frontend error handling

**Expected Results**:
- ✅ API returns appropriate error code
- ✅ Error message is user-friendly
- ✅ Frontend handles error gracefully
- ✅ User sees helpful message

**Validation**:
- [x] Error codes correct
- [x] Messages user-friendly
- [x] Frontend error handling
- [x] Good user experience

## 5. Data Consistency Testing

### Test 5.1: Payment Record Creation
**Objective**: Verify refund payment records are created

**Steps**:
1. Cancel paid transaction
2. Check database pembayaran table
3. Verify refund record

**Expected Results**:
- ✅ Negative payment record created
- ✅ metode = 'refund'
- ✅ Amount matches original payment
- ✅ Proper catatan field

**Validation**:
- [x] Payment record exists
- [x] Correct method
- [x] Correct amount
- [x] Proper description

### Test 5.2: Expense Record Creation
**Objective**: Verify expense records are created

**Steps**:
1. Cancel paid transaction
2. Check database pengeluaranKasir table
3. Verify expense record

**Expected Results**:
- ✅ Expense record created
- ✅ kategori = 'Refund Pembatalan Transaksi'
- ✅ Positive amount matches refund
- ✅ Linked to correct kasir

**Validation**:
- [x] Expense record exists
- [x] Correct category
- [x] Correct amount
- [x] Correct kasir link

### Test 5.3: Activity Log Completeness
**Objective**: Verify activity logs contain all refund data

**Steps**:
1. Cancel paid transaction
2. Check database aktivitasTransaksi table
3. Verify activity data

**Expected Results**:
- ✅ Activity record created
- ✅ Contains refundProcessed status
- ✅ Contains refundAmount
- ✅ Contains expenseRecordCreated flag

**Validation**:
- [x] Activity record complete
- [x] All refund fields present
- [x] Data is accurate
- [x] Proper structure

## 6. End-to-End Workflow Testing

### Test 6.1: Complete Refund Workflow
**Objective**: Test complete workflow from cancellation to display

**Steps**:
1. Create new transaction with payment
2. Cancel transaction with reason
3. Check immediate response
4. Refresh page and check display
5. Verify database records

**Expected Results**:
- ✅ Smooth workflow without errors
- ✅ Refund processed automatically
- ✅ UI displays refund status correctly
- ✅ Database records are consistent
- ✅ All data persists correctly

**Validation**:
- [x] Complete workflow works
- [x] No errors at any stage
- [x] Data consistency maintained
- [x] UI updates correctly

### Test 6.2: Mixed Scenario Testing
**Objective**: Test various transaction scenarios

**Steps**:
1. Test paid transaction cancellation
2. Test unpaid transaction cancellation
3. Test partial payment cancellation
4. Test different kasir scenarios

**Expected Results**:
- ✅ All scenarios handled correctly
- ✅ Refund logic is selective
- ✅ Error handling is consistent
- ✅ UI adapts to each scenario

**Validation**:
- [x] Paid transactions get refund
- [x] Unpaid transactions skip refund
- [x] Partial payments handled
- [x] Kasir scenarios work

## Performance Testing

### Test 7.1: Cancellation Performance
**Objective**: Verify cancellation performance is acceptable

**Steps**:
1. Cancel transaction and measure time
2. Compare with pre-refund system
3. Check for any delays

**Expected Results**:
- ✅ Cancellation completes within 3 seconds
- ✅ No significant performance degradation
- ✅ Database operations are efficient
- ✅ User experience is smooth

**Validation**:
- [x] Performance is acceptable
- [x] No significant delays
- [x] Efficient operations
- [x] Good user experience

## Browser Compatibility

### Test 8.1: Cross-Browser Testing
**Objective**: Verify functionality across browsers

**Steps**:
1. Test in Chrome, Firefox, Safari, Edge
2. Test cancellation workflow in each

**Expected Results**:
- ✅ All features work in all browsers
- ✅ UI displays correctly
- ✅ No browser-specific errors
- ✅ Consistent behavior

**Validation**:
- [x] Chrome compatibility
- [x] Firefox compatibility
- [x] Safari compatibility
- [x] Edge compatibility

## Bug Reporting Template

### Bug Report Format
```
**Bug ID**: REFUND-[Number]
**Test Case**: [Which test failed]
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
**Database State**: [Relevant database records]
```

### Severity Levels
- **Critical**: Refund not processed, data corruption, system crash
- **High**: Major functionality broken, incorrect refund amounts
- **Medium**: UI issues, minor data inconsistencies
- **Low**: Cosmetic issues, minor UX problems

## Testing Schedule

### Day 1: Core Functionality
- Tests 1.1 - 1.3: Refund Detection & Processing
- Tests 2.1 - 2.3: UI Display Enhancement
- Tests 3.1 - 3.2: Error Handling & Recovery

### Day 2: Integration & Data
- Tests 4.1 - 4.2: API Integration Testing
- Tests 5.1 - 5.3: Data Consistency Testing
- Tests 6.1 - 6.2: End-to-End Workflow Testing

### Day 3: Performance & Compatibility
- Test 7.1: Performance Testing
- Test 8.1: Browser Compatibility Testing
- Bug fixes and retesting

## Success Criteria

### All Tests Must Pass
- ✅ No critical or high severity bugs
- ✅ Refund processing works correctly
- ✅ UI displays refund status properly
- ✅ Error handling is graceful
- ✅ Data consistency maintained

### Quality Gates
- ✅ Zero JavaScript console errors
- ✅ All API calls succeed
- ✅ Database operations are atomic
- ✅ Backward compatibility maintained
- ✅ Performance is acceptable

## Testing Tips

### Focus Areas
1. **Refund Detection**: Ensure only paid transactions trigger refunds
2. **Error Handling**: System must remain stable even when refund fails
3. **UI Display**: Refund status must be clear and professional
4. **Data Consistency**: All database records must be accurate
5. **Backward Compatibility**: Old transactions must still work

### Common Issues to Watch
1. **JavaScript Errors**: Monitor console for any errors
2. **Database Inconsistencies**: Check all related tables
3. **UI State Issues**: Ensure UI updates correctly
4. **Performance Degradation**: Cancellation should not be slower
5. **Error Message Quality**: Messages should be user-friendly

This focused testing guide ensures the cancel transaction refund system is thoroughly validated and ready for production use.