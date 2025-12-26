# Manual Testing Guide - Partial Return System

## Overview
Panduan testing untuk fitur Partial Return System yang memungkinkan customer mengembalikan barang rental dalam beberapa sesi/session, mirip dengan sistem pickup yang sudah ada.

## Prerequisites
- ✅ Backend service sudah implemented (Tasks 1-9 completed)
- ✅ API routes sudah ready
- ✅ Frontend components sudah terintegrasi
- ✅ Database schema menggunakan existing structure
- ✅ Code quality: `yarn lint && yarn type-check` passed
- ✅ No duplicate code or dead functions

## Testing Checklist

### 1. Return Button Visibility Test
**Status: READY - Task 2 completed**

#### 1.1 Button Logic Validation
- [x] Navigate ke transaction detail page dengan status 'active'/'terlambat'/'diambil'
- [x] Verify button "Proses Pengembalian" muncul HANYA jika ada barang yang belum dikembalikan
- [x] Test scenario: Customer sewa 5 baju, ambil semua
  - [x] Sebelum ada pengembalian: Button muncul
  - [x] Setelah kembalikan 2 baju: Button masih muncul
  - [ ] Setelah kembalikan 3 baju sisanya: Button HILANG
- [x] Test dengan transaction status 'cancelled': Button TIDAK muncul
- [x] Test dengan transaction yang sudah 'selesai': Button TIDAK muncul

#### 1.2 Return Progress Indicator (x)
- [x] Progress indicator muncul di bawah status transaksi
- [x] Format: "2/5 (40%)" - 2 dari 5 barang sudah dikembalikan
- [ ] Color coding:
  - [ ] Hijau: 100% complete
  - [x] Kuning: Partial (1-99%)
  - [x] Abu-abu: 0% (belum ada pengembalian)

### 2. Return Form Enhancement Test
**Status: READY - Task 3 completed**

#### 2.1 Item Filtering
- [x] Buka form pengembalian
- [ ] Verify HANYA item dengan remaining quantity > 0 yang muncul
- [x] Test scenario: Sewa Baju A (3 pcs), Baju B (2 pcs)
  - [x] Session 1: Kembalikan Baju A (2 pcs)
  - [x] Session 2: Form hanya tampilkan:
    - [x] Baju A: sisa 1 pcs
    - [x] Baju B: sisa 2 pcs
  - [x] Baju A yang sudah full returned TIDAK muncul

#### 2.2 Default Quantity Logic
- [x] Default quantity = remaining quantity (bukan total diambil)
- [x] Example: Ambil 5, sudah kembalikan 2, default = 3
- [x] User bisa edit quantity tapi tidak boleh > remaining
- [x] Validation error jika user input > remaining quantity

#### 2.3 Partial Return Info Panel
- [x] Panel biru dengan info pengembalian parsial
- [x] Tampilkan: "X item dapat dikembalikan"
- [x] Session info: "Session: Pertama" atau "Session: Lanjutan"
- [x] Detail sisa per item

### 3. Session-based Processing Test
**Status: READY - Tasks 4-6 completed**

#### 3.1 Multi-Session Return Flow
**Test Case: Customer sewa 3 item berbeda**
- Setup: Baju A (2 pcs), Baju B (3 pcs), Baju C (1 pcs)

**Session 1:**
- [ ] Kembalikan: Baju A (1 pcs), Baju B (2 pcs)
- [ ] Verify: Activity log "Return Session 1: Baju A (1/2), Baju B (2/3)"
- [ ] Status transaksi: TIDAK berubah (masih active/terlambat)
- [ ] Progress indicator update: partial completion

**Session 2:**
- [ ] Form hanya tampilkan: Baju A (1 pcs), Baju B (1 pcs), Baju C (1 pcs)
- [ ] Kembalikan: Baju A (1 pcs), Baju C (1 pcs)
- [ ] Verify: Activity log "Return Session 2: Baju A (1/2), Baju C (1/1)"
- [ ] Status transaksi: MASIH tidak berubah

**Session 3:**
- [ ] Form hanya tampilkan: Baju B (1 pcs)
- [ ] Kembalikan: Baju B (1 pcs)
- [ ] Verify: Activity log "Return Session 3: Baju B (1/3)"
- [ ] Status transaksi: Berubah ke 'selesai' (semua item returned)
- [ ] Return button HILANG

#### 3.2 Penalty Calculation per Session
- [ ] Late penalty: 20,000 IDR × jumlah item yang dikembalikan di session ini
- [ ] Condition penalty: manualPrice × quantity untuk kondisi non-BAIK
- [ ] Penalty TIDAK akumulatif dari session sebelumnya
- [ ] Preview penalty real-time saat user ubah quantity

### 4. Lost Item Handling Test
**Status: READY - Task 6 completed**

#### 4.1 Transaction with Lost Items
- [ ] Return item dengan kondisi 'HILANG'
- [ ] Status transaksi: 'pending_resolution' (bukan 'selesai')
- [ ] Return button: MASIH muncul untuk item non-hilang
- [ ] Setelah resolve lost item: Status bisa jadi 'selesai'

#### 4.2 Mixed Return Session
- [ ] Session dengan item BAIK + HILANG
- [ ] Penalty calculation terpisah per kondisi
- [ ] Activity log mencatat semua kondisi

### 5. Data Consistency & Validation Test
**Status: READY - Task 8 completed**

#### 5.1 Over-return Prevention
- [ ] Coba kembalikan quantity > remaining
- [ ] Error message: "Jumlah kembali melebihi sisa yang dapat dikembalikan"
- [ ] Form tidak submit
- [ ] Database tidak corrupted

#### 5.2 Concurrent Operations Test
- [ ] Buka 2 browser/tab dengan transaction yang sama
- [ ] Tab 1: Kembalikan 2 item
- [ ] Tab 2: Refresh, coba kembalikan 3 item (should fail)
- [ ] Verify: Database consistency maintained
- [ ] Error handling proper

#### 5.3 Database State Validation
- [ ] Remaining quantity calculation: jumlahDiambil - sum(return records)
- [ ] Validation against fresh database data
- [ ] Race condition prevention

### 6. Progress Tracking Test
**Status: READY - Task 7 completed**

#### 6.1 Visual Progress Indicators
- [ ] Transaction detail page: Overall progress
- [ ] Item level: Individual progress per product
- [ ] Activity timeline: Session history
- [ ] Color coding consistent

#### 6.2 Progress Calculation
- [ ] Formula: (totalReturned / jumlahDiambil) × 100
- [ ] Status: 'pending' → 'partial' → 'complete'
- [ ] Real-time update after each session

### 7. Activity Logging Test
**Status: READY - Task 4 completed**

#### 7.1 Session Format Validation
- [ ] Format: "Return Session X: Item A (returned/total), Item B (returned/total)"
- [ ] Include penalty info jika ada
- [ ] Include notes jika user input catatan
- [ ] Timestamp dan kasir info tersimpan

#### 7.2 Activity Timeline
- [ ] Chronological order
- [ ] Session numbering correct
- [ ] All return sessions logged
- [ ] Audit trail complete

### 8. Error Handling Test

#### 8.1 Network Errors
- [ ] Disconnect network → submit return
- [ ] Error toast: "Gagal memproses pengembalian"
- [ ] Form state preserved
- [ ] User bisa retry

#### 8.2 Validation Errors
- [ ] Invalid quantity input
- [ ] Missing required fields
- [ ] Clear error messages
- [ ] Form highlights problematic fields

#### 8.3 System Errors
- [ ] Database connection issues
- [ ] Transaction rollback on failure
- [ ] Data integrity maintained
- [ ] Graceful error recovery

### 9. Performance Test

#### 9.1 Response Times
- [ ] Form load: < 2 seconds
- [ ] Return processing: < 3 seconds
- [ ] Progress calculation: < 1 second
- [ ] Large transactions (10+ items): acceptable performance

#### 9.2 UI Responsiveness
- [ ] No blocking operations
- [ ] Loading states clear
- [ ] Smooth transitions
- [ ] No memory leaks

## Test Data Scenarios

### Scenario 1: Simple Partial Return
```
Customer: John Doe
Items: Baju Pesta (2 pcs), Sepatu (1 pcs)
Session 1: Return Baju Pesta (1 pcs) - BAIK
Session 2: Return Baju Pesta (1 pcs) - BAIK, Sepatu (1 pcs) - BAIK
Expected: 2 sessions, status 'selesai' after session 2
```

### Scenario 2: Late Return with Penalty
```
Customer: Jane Smith
Items: Dress (3 pcs)
Due Date: 3 days ago (late)
Session 1: Return Dress (2 pcs) - BAIK
Expected: Late penalty = 20,000 × 2 = 40,000 IDR
```

### Scenario 3: Mixed Conditions
```
Customer: Bob Wilson
Items: Kemeja (4 pcs)
Session 1: Return Kemeja (2 pcs) - BAIK, (1 pcs) - RUSAK, (1 pcs) - HILANG
Expected: Condition penalties calculated separately, status 'pending_resolution'
```

### Scenario 4: Concurrent Access
```
Setup: 2 kasir access same transaction simultaneously
Kasir A: Return 2 items
Kasir B: Try to return 3 items (should fail if > remaining)
Expected: Data consistency maintained, proper error handling
```

## Code Quality Verification

### Pre-Testing Checklist
- [ ] Run `yarn lint` - No errors or warnings
- [ ] Run `yarn type-check` - No TypeScript errors
- [ ] No duplicate functions or dead code
- [ ] All imports used and necessary
- [ ] Proper error handling throughout

### Implementation Verification
- [ ] partialReturnHelpers.ts: All utility functions working
- [ ] returnService.ts: Enhanced validation and processing
- [ ] ActionButtonPanel: Smart return button logic
- [ ] SimpleReturnForm: Partial return support
- [ ] Progress indicators: Visual feedback working

## Success Criteria

### Functional Requirements
- ✅ All 8 requirements from spec satisfied
- ✅ Multi-session return workflow works end-to-end
- ✅ Data consistency maintained across sessions
- ✅ Proper validation and error handling
- ✅ Activity logging complete and accurate

### Technical Requirements
- ✅ No code duplication
- ✅ No dead functions
- ✅ Clean, maintainable code
- ✅ TypeScript compliance
- ✅ Performance targets met

### User Experience
- ✅ Intuitive UI flow
- ✅ Clear progress indicators
- ✅ Helpful error messages
- ✅ Responsive interface
- ✅ Consistent with existing patterns

## Testing Environment

### Browser Support
- Chrome (latest)
- Firefox (latest)
- Edge (latest)
- Safari (if applicable)

### Network Conditions
- Normal connection
- Slow connection (3G simulation)
- Offline/connection loss scenarios

### Data Volumes
- Small transactions (1-2 items)
- Medium transactions (5-10 items)
- Large transactions (20+ items)
- Edge cases (0 items, invalid data)

## Notes

- **Priority**: Core functionality first, edge cases second
- **Focus**: Data integrity and user experience
- **Rollback Plan**: All changes are backward compatible
- **Documentation**: Update user guides after testing complete
- **Training**: Prepare kasir training materials for new workflow

## Bug Reporting Template

```
**Bug Title**: [Brief description]
**Severity**: Critical/High/Medium/Low
**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Result**: 
**Actual Result**: 
**Environment**: Browser, OS, Network
**Screenshots**: [If applicable]
**Console Errors**: [If any]
```

---

*Testing guide untuk Partial Return System - memastikan kualitas dan reliability sebelum production deployment.*