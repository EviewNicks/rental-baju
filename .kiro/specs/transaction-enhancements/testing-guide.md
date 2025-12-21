# Manual Testing Guide: Transaction Enhancements

## Overview

Panduan ini menyediakan skenario testing manual untuk memvalidasi fitur-fitur baru dalam transaction enhancements:
1. **Discount System** - Sistem diskon (persen dan nominal)
2. **Duration Packages** - Paket durasi (4 hari dan 7 hari)
3. **Date Calculation** - Perhitungan tanggal yang akurat

## Prerequisites

Sebelum memulai testing, pastikan:
- ✅ Development server berjalan (`yarn dev`)
- ✅ Database sudah di-migrate dengan schema terbaru
- ✅ Ada data penyewa dan produk untuk testing
- ✅ Browser developer tools terbuka untuk monitoring

## Test Scenarios

### 1. Duration Package Testing

#### Test Case 1.1: 4-Day Package (Normal Price)
**Objective**: Memvalidasi paket 4 hari menggunakan harga normal (multiplier 1.0x)

**Steps**:
1. Buka halaman kasir `/kasir`
2. Klik "Buat Transaksi Baru"
3. Pilih penyewa yang sudah ada
4. Tambahkan produk (contoh: Baju Anak, size M, qty: 2)
5. Di step "Payment Summary":
   - Pastikan "Paket 4 Hari" terpilih secara default
   - Verifikasi label menunjukkan "Harga Normal" dan "Multiplier: 1.0"
6. Set pickup date: 27 Desember 2024
7. Verifikasi return date otomatis: 30 Desember 2024

**Expected Results**:
- ✅ Duration selector menampilkan 2 opsi (4 hari dan 7 hari)
- ✅ Paket 4 hari terpilih secara default
- ✅ Harga produk tidak berubah (multiplier 1.0x)
- ✅ Return date = Pickup date + 3 hari (27 + 4 - 1 = 30)
- ✅ Subtotal = Base price × quantity

#### Test Case 1.2: 7-Day Package (1.5x Price)
**Objective**: Memvalidasi paket 7 hari menggunakan multiplier 1.5x

**Steps**:
1. Lanjutkan dari test case 1.1
2. Pilih "Paket 7 Hari (+50% untuk luar kota)"
3. Verifikasi perubahan harga secara real-time
4. Verifikasi return date berubah otomatis

**Expected Results**:
- ✅ Harga produk berubah menjadi 1.5x dari harga asli
- ✅ Label menunjukkan "+50%" dan "Multiplier: 1.5"
- ✅ Return date berubah menjadi 2 Januari 2025 (27 + 7 - 1 = 33 → 2 Jan)
- ✅ Subtotal meningkat 50% dari harga asli
- ✅ Indikator visual menunjukkan kenaikan harga

#### Test Case 1.3: Duration Change Impact
**Objective**: Memvalidasi dampak perubahan durasi terhadap semua kalkulasi

**Steps**:
1. Ganti-ganti antara paket 4 hari dan 7 hari beberapa kali
2. Perhatikan perubahan pada:
   - Harga per item
   - Subtotal
   - Return date
   - Payment amount (jika sudah diisi)

**Expected Results**:
- ✅ Semua kalkulasi update secara real-time
- ✅ Tidak ada delay atau error dalam perhitungan
- ✅ UI responsive dan smooth

### 2. Discount System Testing

#### Test Case 2.1: No Discount (Default)
**Objective**: Memvalidasi kondisi default tanpa diskon

**Steps**:
1. Pastikan "Tanpa Diskon" terpilih secara default
2. Verifikasi tidak ada field input diskon yang muncul
3. Verifikasi subtotal = final total

**Expected Results**:
- ✅ "Tanpa Diskon" terpilih secara default
- ✅ Tidak ada input field diskon
- ✅ Tidak ada informasi penghematan
- ✅ Final total = Subtotal

#### Test Case 2.2: Percentage Discount
**Objective**: Memvalidasi diskon persentase

**Steps**:
1. Pilih "Diskon Persentase (%)"
2. Input field muncul dengan placeholder yang sesuai
3. Masukkan nilai: 10
4. Verifikasi kalkulasi real-time
5. Test edge cases:
   - Input 0 (valid)
   - Input 100 (valid)
   - Input 101 (invalid - harus ada error)
   - Input -5 (invalid - harus ada error)

**Expected Results**:
- ✅ Input field muncul dengan icon persen
- ✅ Placeholder: "Masukkan persentase (0-100)"
- ✅ Diskon 10% = Subtotal × 10/100
- ✅ Preview menunjukkan: "💰 Hemat: Rp X"
- ✅ Final total = Subtotal - Discount amount
- ✅ Validasi error untuk nilai > 100 atau < 0

#### Test Case 2.3: Nominal Discount
**Objective**: Memvalidasi diskon nominal

**Steps**:
1. Pilih "Diskon Nominal (Rp)"
2. Input field muncul dengan prefix "Rp"
3. Masukkan nilai: 50000
4. Verifikasi kalkulasi real-time
5. Test edge cases:
   - Input 0 (valid)
   - Input = subtotal (valid, final total = 0)
   - Input > subtotal (invalid - harus ada error)

**Expected Results**:
- ✅ Input field muncul dengan prefix "Rp"
- ✅ Placeholder: "Masukkan nominal"
- ✅ Diskon langsung dikurangi dari subtotal
- ✅ Preview menunjukkan: "💰 Hemat: Rp 50.000"
- ✅ Final total = Subtotal - 50000
- ✅ Validasi error jika nominal > subtotal

#### Test Case 2.4: Discount with Duration Change
**Objective**: Memvalidasi interaksi antara diskon dan perubahan durasi

**Steps**:
1. Set paket 4 hari, subtotal Rp 200.000
2. Apply diskon 10%
3. Verifikasi: Diskon = Rp 20.000, Final = Rp 180.000
4. Ganti ke paket 7 hari
5. Verifikasi: Subtotal naik jadi Rp 300.000, Diskon = Rp 30.000, Final = Rp 270.000

**Expected Results**:
- ✅ Diskon persentase recalculate otomatis saat subtotal berubah
- ✅ Diskon nominal tetap sama saat durasi berubah
- ✅ Final total selalu akurat

### 3. Date Calculation Testing

#### Test Case 3.1: Normal Date Range
**Objective**: Memvalidasi perhitungan tanggal dalam bulan yang sama

**Steps**:
1. Set pickup date: 15 Januari 2025
2. Test dengan paket 4 hari: Return = 18 Januari 2025
3. Test dengan paket 7 hari: Return = 21 Januari 2025

**Expected Results**:
- ✅ 4 hari: 15 + 4 - 1 = 18
- ✅ 7 hari: 15 + 7 - 1 = 21
- ✅ Format tanggal konsisten

#### Test Case 3.2: Month Boundary
**Objective**: Memvalidasi perhitungan tanggal lintas bulan

**Steps**:
1. Set pickup date: 29 Januari 2025
2. Test dengan paket 4 hari: Return = 1 Februari 2025
3. Test dengan paket 7 hari: Return = 4 Februari 2025

**Expected Results**:
- ✅ 4 hari: 29 + 4 - 1 = 32 → 1 Feb
- ✅ 7 hari: 29 + 7 - 1 = 35 → 4 Feb
- ✅ Transisi bulan benar

#### Test Case 3.3: Year Boundary
**Objective**: Memvalidasi perhitungan tanggal lintas tahun

**Steps**:
1. Set pickup date: 30 Desember 2024
2. Test dengan paket 4 hari: Return = 2 Januari 2025
3. Test dengan paket 7 hari: Return = 5 Januari 2025

**Expected Results**:
- ✅ 4 hari: 30 + 4 - 1 = 33 → 2 Jan 2025
- ✅ 7 hari: 30 + 7 - 1 = 36 → 5 Jan 2025
- ✅ Transisi tahun benar

### 4. Payment Summary Testing

#### Test Case 4.1: Price Breakdown Display
**Objective**: Memvalidasi tampilan breakdown harga yang detail

**Steps**:
1. Tambahkan 2 produk berbeda dengan quantity berbeda
2. Set paket 7 hari
3. Apply diskon 15%
4. Verifikasi semua informasi ditampilkan dengan jelas

**Expected Results**:
- ✅ Setiap item menunjukkan: nama, size, quantity, harga base, harga adjusted
- ✅ Subtotal calculation benar
- ✅ Duration multiplier effect terlihat jelas
- ✅ Discount information lengkap
- ✅ Final total prominent dan akurat

#### Test Case 4.2: Real-time Updates
**Objective**: Memvalidasi update real-time semua kalkulasi

**Steps**:
1. Mulai dengan setup dasar
2. Ubah duration → verifikasi semua harga update
3. Ubah discount type → verifikasi calculation update
4. Ubah discount value → verifikasi preview update
5. Ubah pickup date → verifikasi return date update

**Expected Results**:
- ✅ Semua perubahan reflected immediately
- ✅ Tidak ada flickering atau delay
- ✅ Konsistensi data di semua section

### 5. Form Validation Testing

#### Test Case 5.1: Required Field Validation
**Objective**: Memvalidasi validasi field yang wajib diisi

**Steps**:
1. Coba submit form tanpa mengisi pickup date
2. Coba submit dengan discount type tapi tanpa value
3. Verifikasi error messages

**Expected Results**:
- ✅ Error message jelas dan helpful
- ✅ Form tidak submit jika ada error
- ✅ Focus ke field yang error

#### Test Case 5.2: Business Logic Validation
**Objective**: Memvalidasi validasi business logic

**Steps**:
1. Set pickup date di masa lalu → harus error
2. Set discount nominal > subtotal → harus error
3. Set discount percentage > 100 → harus error

**Expected Results**:
- ✅ Validasi mencegah data invalid
- ✅ Error messages informatif
- ✅ User guidance jelas

### 6. End-to-End Transaction Flow

#### Test Case 6.1: Complete Transaction with Enhancements
**Objective**: Memvalidasi flow lengkap dari awal sampai selesai

**Steps**:
1. **Customer Selection**: Pilih/buat penyewa
2. **Product Selection**: Tambahkan beberapa produk
3. **Duration & Dates**: 
   - Pilih paket 7 hari
   - Set pickup date
   - Verifikasi return date
4. **Discount Application**:
   - Apply diskon 20%
   - Verifikasi semua kalkulasi
5. **Payment**:
   - Set payment method
   - Input payment amount
   - Verifikasi payment status
6. **Notes**: Tambahkan catatan
7. **Submit**: Submit transaksi
8. **Verification**: Verifikasi data tersimpan dengan benar

**Expected Results**:
- ✅ Semua data tersimpan sesuai input
- ✅ Discount information tersimpan
- ✅ Duration information tersimpan
- ✅ Date calculation akurat
- ✅ Transaction code generated
- ✅ Activity log created

#### Test Case 6.2: Transaction Detail View
**Objective**: Memvalidasi tampilan detail transaksi

**Steps**:
1. Setelah create transaksi, buka detail transaksi
2. Verifikasi semua informasi enhancement ditampilkan:
   - Duration package info
   - Discount details
   - Price breakdown
   - Date information

**Expected Results**:
- ✅ Duration package terlihat jelas
- ✅ Discount info (jika ada) ditampilkan
- ✅ Original subtotal dan final total terpisah
- ✅ Pickup dan return date dengan label duration

## Edge Cases & Error Scenarios

### Edge Case 1: Network Issues
**Steps**:
1. Disconnect network saat submit
2. Reconnect dan coba lagi
3. Verifikasi tidak ada duplicate transaction

### Edge Case 2: Browser Refresh
**Steps**:
1. Fill form dengan data lengkap
2. Refresh browser
3. Verifikasi form state (should reset)

### Edge Case 3: Multiple Products with Different Durations
**Steps**:
1. Verifikasi semua items menggunakan duration yang sama
2. Tidak boleh ada inconsistency

## Performance Testing

### Performance Test 1: Calculation Speed
**Steps**:
1. Tambahkan 10+ produk
2. Ubah duration dan discount berkali-kali
3. Verifikasi tidak ada lag

### Performance Test 2: Memory Usage
**Steps**:
1. Monitor memory usage di browser dev tools
2. Lakukan banyak perubahan form
3. Verifikasi tidak ada memory leak

## Browser Compatibility

Test di browser berikut:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (if available)
- ✅ Edge (latest)

## Mobile Responsiveness

Test di device mobile:
- ✅ Form elements accessible
- ✅ Touch interactions work
- ✅ Layout tidak broken

## Checklist Summary

### ✅ Duration Package System
- [ ] 4-day package (1.0x multiplier)
- [ ] 7-day package (1.5x multiplier)
- [ ] Real-time price updates
- [ ] Duration change impacts

### ✅ Discount System
- [ ] No discount (default)
- [ ] Percentage discount (0-100%)
- [ ] Nominal discount (not exceeding subtotal)
- [ ] Real-time discount preview
- [ ] Validation and error handling

### ✅ Date Calculation
- [ ] Normal date ranges
- [ ] Month boundaries
- [ ] Year boundaries
- [ ] Automatic return date calculation

### ✅ UI/UX
- [ ] Clear visual hierarchy
- [ ] Real-time updates
- [ ] Error messages
- [ ] Responsive design

### ✅ Data Persistence
- [ ] Transaction creation
- [ ] Data retrieval
- [ ] Backward compatibility

### ✅ Integration
- [ ] All components work together
- [ ] No conflicts between features
- [ ] Performance acceptable

## Reporting Issues

Jika menemukan bug, catat:
1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Browser/device info**
5. **Screenshots/videos**
6. **Console errors**

## Success Criteria

Testing dianggap berhasil jika:
- ✅ Semua test cases pass
- ✅ Tidak ada critical bugs
- ✅ Performance acceptable
- ✅ User experience smooth
- ✅ Data integrity maintained