# Manual Test Plan: Return-Pairing Integration

## Overview

Manual test untuk memvalidasi bahwa return-pairing integration telah berfungsi dengan benar dan mengatasi masalah kompatibilitas antara jas-sarung pairing system dan return system.

## Test Environment Setup

### Prerequisites
1. Database dengan transaksi yang memiliki jas-sarung pairing
2. Access ke kasir dashboard untuk return operations
3. Browser developer tools untuk monitoring network requests dan console logs
4. Access ke application logs untuk audit trail verification

### Test Data Requirements
- Transaksi dengan jas-sarung pairing (JSON format kondisiAwal)
- Transaksi dengan item regular (pipe format kondisiAwal)
- Transaksi dengan mixed format items

## Core Problem Validation Tests

### Test Case 1: Database Error Fix - Jas-Sarung Pairing Return
**Problem**: Return gagal dengan database error karena productSizeId tidak bisa di-extract dari JSON format kondisiAwal
**Objective**: Verify that jas-sarung pairing can be returned successfully without database errors

**Steps**:
1. Navigate to kasir dashboard
2. Search for transaction with jas-sarung pairing (look for items with JSON kondisiAwal)
3. Click "Return" button
4. **CRITICAL**: Verify auto-selection behavior:
   - Select jas item
   - Verify sarung is automatically selected
   - Try to deselect sarung (should be disabled)
   - Deselect jas
   - Verify sarung is automatically deselected
5. Select jas item again (sarung should auto-select)
6. Set return conditions for both items
7. Submit return

**Expected Results**:
- ✅ **NO DATABASE ERRORS** during return process (main problem fix)
- ✅ Auto-selection works correctly
- ✅ Both jas and sarung stock are restored (dual restoration)
- ✅ Penalty only applied to jas item (sarung penalty = 0)
- ✅ Return completes successfully

**Audit Trail Verification** (Check browser console/logs):
```
🔍 AUDIT: Pairing validation initiated
🔄 AUDIT: Format conversion and pairing detection completed
✅ AUDIT: Pairing validation results detailed analysis
📦 AUDIT: Stock restoration process initiated
✅ AUDIT: Stock restoration process completed successfully
🎯 AUDIT: Return validation process completed
```

### Test Case 2: Format Compatibility Test
**Problem**: System tidak bisa handle mixed format (JSON + pipe) dalam satu transaksi
**Objective**: Verify system handles both JSON and pipe format kondisiAwal

**Steps**:
1. Find transaction with mixed format items:
   - Some items with JSON format (pairing data)
   - Some items with pipe format (legacy)
2. Attempt return on both types of items
3. Monitor console logs for format detection

**Expected Results**:
- ✅ JSON format items parsed correctly (pairing detected)
- ✅ Pipe format items parsed correctly (no pairing)
- ✅ No parsing errors in logs
- ✅ Stock restoration works for both formats

**Audit Trail Verification**:
```json
{
  "formatDistribution": {
    "json": 1,
    "pipe": 1,
    "null": 0
  }
}
```

### Test Case 3: Pairing Validation Error Handling
**Problem**: User bisa return jas tanpa sarung, menyebabkan inconsistency
**Objective**: Verify proper error handling when pairing rules are violated

**Test 3a: Return Jas Without Sarung**
1. Find transaction with jas-sarung pairing
2. Try to return only jas item (don't select sarung)
3. Submit return

**Expected Results**:
- ❌ Return should fail with clear error message
- ❌ Error: "Jas tidak dapat dikembalikan tanpa sarung pasangannya"
- ✅ No database changes made

**Test 3b: Quantity Mismatch**
1. Find transaction with jas-sarung pairing
2. Select both jas and sarung
3. Set different quantities (e.g., jas=2, sarung=1)
4. Submit return

**Expected Results**:
- ❌ Return should fail with quantity mismatch error
- ❌ Error: "Jumlah pengembalian tidak sesuai untuk pairing jas-sarung"
- ✅ No database changes made

### Test Case 4: Stock Consistency Verification
**Problem**: Stock tidak ter-update dengan benar untuk dual restoration
**Objective**: Verify stock levels are correctly updated for both jas and sarung

**Before Return**:
1. Note current stock levels for jas and sarung items
2. Record `availableQuantity` and `rentedQuantity`

**After Return**:
1. Verify stock changes:
   - Jas: `rentedQuantity` decreased by return quantity
   - Jas: `availableQuantity` increased by return quantity
   - Sarung: `rentedQuantity` decreased by return quantity  
   - Sarung: `availableQuantity` increased by return quantity

**Expected Results**:
- ✅ Both jas and sarung stock updated correctly
- ✅ 1:1 ratio maintained
- ✅ No stock inconsistencies

**Audit Trail Verification**:
```
🔄 AUDIT: Executing dual stock restoration for jas-sarung pairing
✅ AUDIT: Stock restoration process completed successfully
```

### Test Case 5: Penalty Calculation Fix
**Problem**: Penalty di-calculate untuk both jas dan sarung, padahal sarung gratis
**Objective**: Verify penalty calculation only applies to jas items

**Steps**:
1. Find transaction with jas-sarung pairing
2. Return both items with "rusak" condition
3. Check penalty breakdown

**Expected Results**:
- ✅ Penalty only calculated for jas item
- ✅ Sarung penalty = 0 (sarung is free in pairing)
- ✅ Total penalty = jas penalty only

**Audit Trail Verification**:
Check activity log for penalty breakdown showing jas-only penalty.

## Performance Test

### Test Case 6: Performance Validation
**Problem**: Return process menjadi lambat karena additional processing
**Objective**: Verify return performance remains acceptable

**Steps**:
1. Find transaction with 3+ paired items (6+ total items)
2. Return all items at once
3. Monitor processing time

**Expected Results**:
- ✅ Return completes within 3 seconds
- ✅ No timeout errors
- ✅ All audit trails logged properly

## Backward Compatibility Test

### Test Case 7: Legacy Transaction Support
**Problem**: Existing transactions dengan pipe format mungkin broken
**Objective**: Verify existing transactions with pipe format still work

**Steps**:
1. Find old transaction with pipe format kondisiAwal
2. Attempt return on these items
3. Verify normal return process works

**Expected Results**:
- ✅ Return works normally for pipe format
- ✅ No pairing validation applied
- ✅ Single stock restoration (not dual)
- ✅ Normal penalty calculation

## Success Criteria

### ✅ Core Problem Resolution
- [ ] **Database errors eliminated** - Main problem fixed
- [ ] Auto-selection behavior works correctly
- [ ] Dual stock restoration functions properly
- [ ] Penalty calculation applies only to jas items
- [ ] Format compatibility maintained (JSON + pipe)

### ✅ Error Handling
- [ ] Pairing validation prevents invalid returns
- [ ] Clear error messages for pairing violations
- [ ] Graceful handling of corrupted data
- [ ] No system crashes or data corruption

### ✅ Performance & Compatibility
- [ ] Return processing completes within 3 seconds
- [ ] Existing pipe format transactions still work
- [ ] No breaking changes to existing functionality
- [ ] Mixed format transactions handled correctly

### ✅ Data Integrity
- [ ] Stock levels updated correctly for both items
- [ ] Activity logs contain complete pairing information
- [ ] Transaction status updated appropriately
- [ ] No orphaned or inconsistent data

## Troubleshooting Guide

### Common Issues

**Issue**: Return fails with "productSizeId not found"
**Solution**: Check kondisiAwal format and database consistency

**Issue**: Auto-selection not working
**Solution**: Verify pairing data in kondisiAwal JSON format

**Issue**: Stock not restored for sarung
**Solution**: Check audit logs for dual restoration process

**Issue**: Penalty applied to both jas and sarung
**Solution**: Verify pairing penalty calculation logic

### Log Analysis

**Search for audit trails**:
```bash
grep "AUDIT:" application.log | grep "return-pairing"
```

**Check pairing validation**:
```bash
grep "Pairing validation" application.log
```

**Monitor stock restoration**:
```bash
grep "Stock restoration" application.log
```

## Test Completion Checklist

- [ ] All core problem validation tests passed
- [ ] Error scenarios handled properly
- [ ] Performance requirements met
- [ ] Audit trails verified
- [ ] Stock consistency confirmed
- [ ] Penalty calculation validated
- [ ] Backward compatibility verified
- [ ] No regression issues found

## Notes

- Focus on the main problem: **database errors during return of jas-sarung pairing**
- Test with real production-like data when possible
- Monitor browser console for audit trails
- Keep detailed logs of any issues found
- Verify fixes don't break existing functionality

---

**Test Status**: Ready for execution
**Primary Focus**: Database error elimination and pairing integration
**Last Updated**: January 2025
**Tested By**: [To be filled during testing]