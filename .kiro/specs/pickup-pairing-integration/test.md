# Manual Test Plan: Pickup-Pairing Integration

## Overview
Manual testing untuk memvalidasi implementasi Tasks 1-5 dari pickup-pairing integration spec. Testing fokus pada compatibility antara jas-sarung pairing system dan pickup system.

## Prerequisites
- [x] Development environment running
- [x] Database dengan data transaksi yang memiliki jas-sarung pairing
- [x] Access ke kasir interface untuk testing pickup
- [x] Browser developer tools untuk monitoring network requests

## Test Scenarios

### 1. Data Format Compatibility (Task 1)
**Objective**: Memastikan sistem dapat handle JSON format (pairing) dan pipe format (legacy)

#### Test 1.1: Pickup dengan JSON Format (Pairing Data) ✅ FIXED
- [x] Buka transaksi yang memiliki jas dengan linkedSarung (JSON format kondisiAwal)
- [x] Klik tombol "Pickup" 
- [x] Verifikasi tidak ada error parsing di console
- [x] Verifikasi pickup berhasil diproses
- [x] **Expected**: Pickup berhasil tanpa database error
- [x] **RESULT**: ✅ Status now correctly updates to 'diambil' after all pickupable items are picked up

#### Test 1.2: Pickup dengan Pipe Format (Legacy Data)
- [ ] Buka transaksi lama dengan format kondisiAwal pipe-separated
- [ ] Klik tombol "Pickup"
- [ ] Verifikasi pickup berhasil diproses
- [ ] **Expected**: Backward compatibility tetap berfungsi

#### Test 1.3: Pickup dengan Data Corrupted
- [ ] Buka transaksi dengan kondisiAwal yang invalid/corrupted
- [ ] Klik tombol "Pickup"
- [ ] Verifikasi sistem tidak crash
- [ ] **Expected**: Graceful fallback, pickup tetap bisa dilanjutkan

### 2. Stock Management Integration (Task 2)
**Objective**: Memastikan stock deduction benar untuk jas-sarung pairing

#### Test 2.1: Stock Deduction untuk Jas dengan Linked Sarung
- [ ] Catat stock awal jas dan sarung sebelum pickup
- [ ] Pickup jas yang memiliki linkedSarung
- [ ] Cek stock setelah pickup
- [ ] **Expected**: Stock jas DAN sarung berkurang (1:1 ratio)

#### Test 2.2: Stock Deduction untuk Item Regular
- [ ] Catat stock awal item non-paired
- [ ] Pickup item regular (tanpa pairing)
- [ ] Cek stock setelah pickup
- [ ] **Expected**: Hanya stock item tersebut yang berkurang

#### Test 2.3: Stock Error Handling
- [ ] Pickup item dengan productSizeId yang tidak valid
- [ ] Monitor console untuk error logs
- [ ] **Expected**: Error logged tapi pickup tetap berhasil

### 3. Enhanced PickupService Integration (Task 3) ✅ FIXED
**Objective**: Memastikan PickupService terintegrasi dengan pairing logic

#### Test 3.1: Status Update dengan Pairing Awareness ✅ FIXED
- [x] Pickup semua items yang visible di UI (jas + bando)
- [x] Verifikasi status transaksi berubah ke 'diambil'
- [x] Verifikasi paired sarung items tidak menghalangi status update
- [x] **Expected**: Status update ke 'diambil' meskipun paired sarung items tidak di-pickup
- [x] **RESULT**: ✅ Status correctly updates by filtering out paired sarung items from status check

#### Test 3.2: Activity Log dengan Pairing Info
- [ ] Pickup jas dengan linkedSarung
- [ ] Cek activity log di transaksi detail
- [ ] **Expected**: Activity log menampilkan "Jas Name + Sarung Name" format

#### Test 3.3: Pickup Validation dengan Pairing
- [ ] Coba pickup dengan quantity melebihi available
- [ ] **Expected**: Validation error yang jelas dan contextual

### 4. Contextual Error Handling (Task 4)
**Objective**: Memastikan error messages contextual dan actionable

#### Test 4.1: Error Message untuk Pairing Conflicts
- [ ] Simulasikan error dengan data pairing (disconnect network saat pickup)
- [ ] Perhatikan error message yang muncul
- [ ] **Expected**: Error message menyebutkan pairing context dan recovery steps

#### Test 4.2: Error Recovery Actions
- [ ] Trigger error saat pickup
- [ ] Cek tombol recovery yang tersedia (Coba Lagi, Refresh, dll)
- [ ] Test setiap tombol recovery
- [ ] **Expected**: Recovery actions sesuai dengan error type

#### Test 4.3: Error Classification
- [ ] Test berbagai jenis error (network, validation, data format)
- [ ] Verifikasi setiap error type mendapat handling yang tepat
- [ ] **Expected**: Error classification dan response yang konsisten

### 5. UI Display Formatting (Task 5)
**Objective**: Memastikan UI menampilkan pairing information dengan jelas

#### Test 5.1: Item Display dengan Pairing Badge
- [ ] Buka pickup modal untuk transaksi dengan jas-sarung pairing
- [ ] Verifikasi item display menunjukkan "Jas Name + Sarung Name"
- [ ] Verifikasi ada badge "Paket" untuk paired items
- [ ] **Expected**: Clear visual indication untuk paired items

#### Test 5.2: Pickup Button Text
- [ ] Pilih berbagai kombinasi items (paired dan non-paired)
- [ ] Perhatikan perubahan text pada pickup button
- [ ] **Expected**: Button text reflect pairing content (e.g., "Pickup 2 Paket")

#### Test 5.3: Confirmation Modal dengan Pairing Info
- [ ] Pilih items untuk pickup (termasuk paired items)
- [ ] Klik pickup button untuk masuk confirmation
- [ ] Verifikasi confirmation modal menampilkan pairing info
- [ ] **Expected**: Paired items ditampilkan dengan badge dan description

#### Test 5.4: Success Message dengan Pairing Description
- [ ] Complete pickup process untuk paired items
- [ ] Perhatikan success message
- [ ] **Expected**: Success message menggunakan pairing-aware description

## Integration Testing

### Test I.1: End-to-End Pickup Flow dengan Pairing
- [ ] Start dengan transaksi yang memiliki mix items (paired dan regular)
- [ ] Buka pickup modal
- [ ] Verifikasi display formatting correct
- [ ] Pilih items untuk pickup
- [ ] Verifikasi button text dan confirmation
- [ ] Complete pickup process
- [ ] Verifikasi stock deduction correct
- [ ] Verifikasi activity log correct
- [ ] **Expected**: Complete flow berjalan smooth tanpa error

### Test I.2: Error Recovery Flow
- [ ] Start pickup process
- [ ] Simulasikan network error (disconnect internet)
- [ ] Verifikasi error handling dan recovery options
- [ ] Reconnect internet dan retry
- [ ] **Expected**: Graceful error handling dan successful recovery

### Test I.3: Performance dengan Multiple Pairing Items
- [ ] Buat transaksi dengan 5+ paired items
- [ ] Pickup semua items sekaligus
- [ ] Monitor performance (should complete < 2 seconds)
- [ ] **Expected**: Performance tetap acceptable dengan pairing logic

## Browser Console Monitoring

### Console Logs to Check:
- [ ] No parsing errors untuk kondisiAwal
- [ ] Stock operation logs menunjukkan dual deduction
- [ ] Error logs dengan pairing context
- [ ] Performance metrics untuk pickup operations

### Network Tab Monitoring:
- [ ] Pickup API calls successful
- [ ] Response times acceptable
- [ ] No failed requests due to pairing data

## Test Data Requirements

### Required Transaction Types:
- [ ] Transaksi dengan jas + linkedSarung (JSON format)
- [ ] Transaksi dengan items regular (pipe format)
- [ ] Transaksi dengan mixed items (paired + regular)
- [ ] Transaksi dengan corrupted kondisiAwal data

## Success Criteria

### All tests pass if:
- [ ] No database errors during pickup dengan pairing data
- [ ] Stock deduction correct untuk both jas dan sarung
- [ ] UI clearly displays pairing information
- [ ] Error messages contextual dan actionable
- [ ] Performance acceptable (< 2s untuk 10 items)
- [ ] Backward compatibility maintained

## Notes
- Test di development environment dengan real data
- Monitor browser console untuk errors/warnings
- Document any issues found dengan screenshot
- Verify fix sebelum mark test sebagai passed

---

**Test Completion**: [ ] All manual tests passed
**Tested By**: ________________
**Date**: ________________
**Environment**: Development
**Notes**: ________________