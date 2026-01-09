# Manual Testing Guide: Cost Item Management & Optional modalAwal

## Overview
Manual testing guide untuk memvalidasi implementasi Cost Item Management System dengan fokus pada optional modalAwal dan producer/owner flow yang baru diimplementasikan.

## Test Environment Setup
1. Pastikan database sudah ter-migrate dengan model CostItem dan ProductCost
2. Pastikan ada beberapa cost items yang sudah dibuat untuk testing
3. Akses halaman product management: `/producer/manage-product/kelola-data`

## Test Scenarios

### 1. Producer Flow - Create Product Without Cost Items

**Objective**: Memvalidasi bahwa producer dapat membuat produk tanpa informasi biaya (modalAwal = 0)

**Steps**:
1. Buka halaman "Tambah Produk"
2. Isi informasi dasar:
   - Kode: `PROD001`
   - Nama: `Test Product Producer`
   - Kategori: Pilih kategori yang tersedia
   - Ukuran: Tambahkan minimal 1 ukuran dengan quantity > 0
   - Harga Sewa: `100000`
3. **JANGAN** tambahkan cost items (biarkan kosong)
4. Klik "Simpan"

**Expected Results**:
- ✅ Produk berhasil dibuat
- ✅ Modal Awal = Rp0 (Producer Mode)
- ✅ UI menampilkan badge "Producer Mode"
- ✅ Help text: "Mode Producer: Tambahkan item biaya untuk menghitung modal awal secara otomatis"
- ✅ Console log menunjukkan audit trail "PRODUCER_FLOW"

### 2. Owner Flow - Add Cost Items to Existing Product

**Objective**: Memvalidasi transisi dari producer flow ke owner flow

**Steps**:
1. Edit produk yang dibuat di Test 1
2. Scroll ke bagian "Item Biaya (Opsional)"
3. Ketik nama cost item di search box (contoh: "kain")
4. Pilih cost item dari dropdown atau buat baru jika tidak ada
5. Input amount: `50000`
6. Tambah cost item kedua dengan amount: `30000`
7. Klik "Simpan"

**Expected Results**:
- [x] Modal Awal berubah menjadi Rp80.000 (50000 + 30000)
- [x] UI berubah dari "Producer Mode" ke tampilan normal
- [x] Badge "Producer Mode" hilang
- [x] Console log menunjukkan audit trail "PRODUCER_TO_OWNER"
- [x] Total modal awal display berubah dari biru ke hijau

### 3. Owner Flow - Create Product With Cost Items

**Objective**: Memvalidasi owner flow langsung saat create product

**Steps**:
1. Buka halaman "Tambah Produk"
2. Isi informasi dasar:
   - Kode: `PROD002`
   - Nama: `Test Product Owner`
   - Kategori: Pilih kategori yang tersedia
   - Ukuran: Tambahkan minimal 1 ukuran
   - Harga Sewa: `150000`
3. Tambahkan cost items:
   - Cost Item 1: `75000`
   - Cost Item 2: `25000`
4. Klik "Simpan"

**Expected Results**:
- [x] Produk berhasil dibuat
- [x] Modal Awal = Rp100.000 (75000 + 25000)
- [x] Tidak ada badge "Producer Mode"
- [x] Console log menunjukkan audit trail "OWNER_FLOW"

### 4. Reset to Producer Flow - Remove All Cost Items

**Objective**: Memvalidasi transisi dari owner flow kembali ke producer flow

**Steps**:
1. Edit produk yang dibuat di Test 3
2. Hapus semua cost items dengan klik tombol X pada setiap item
3. Klik "Simpan"

**Expected Results**:
- [x] Modal Awal berubah menjadi Rp0
- [x] UI menampilkan badge "Producer Mode" kembali
- [x] Help text berubah ke producer mode
- [x] Console log menunjukkan audit trail "RESET_TO_PRODUCER"
- [x] Total modal awal display berubah kembali ke biru

### 5. Cost Item Management - Create New Cost Item

**Objective**: Memvalidasi pembuatan cost item baru dari product form

**Steps**:
1. Edit produk apapun
2. Di bagian cost item selector, ketik nama cost item yang belum ada: `Transport Jakarta`
3. Klik tombol "+ Buat Transport Jakarta"
4. Input amount: `40000`
5. Klik "Simpan"

**Expected Results**:
- [x] Cost item baru berhasil dibuat
- [x] Cost item langsung ditambahkan ke produk
- [x] Modal awal terupdate dengan amount yang diinput
- [x] Toast notification "Cost item berhasil dibuat dan ditambahkan"

### 6. Real-time Modal Awal Calculation

**Objective**: Memvalidasi perhitungan modal awal real-time

**Steps**:
1. Edit produk apapun
2. Tambahkan cost item dengan amount `10000`
3. **Tanpa save**, ubah amount menjadi `20000`
4. Tambahkan cost item kedua dengan amount `15000`
5. Hapus cost item pertama
6. Perhatikan perubahan total modal awal

**Expected Results**:
- [x] Modal awal berubah real-time setiap kali ada perubahan
- [x] Setelah step 2: Modal awal = Rp10.000
- [x] Setelah step 3: Modal awal = Rp20.000
- [x] Setelah step 4: Modal awal = Rp35.000
- [x] Setelah step 5: Modal awal = Rp15.000

### 7. Validation Testing

**Objective**: Memvalidasi validasi input dan error handling

**Steps**:
1. Coba buat produk dengan kode yang sudah ada
2. Coba input amount negatif di cost item
3. Coba input amount 0 di cost item
4. Coba buat cost item dengan nama kosong

**Expected Results**:
- [] Error "Kode produk sudah digunakan"
- [] Amount negatif tidak diterima atau diubah ke 0
- [] Amount 0 tidak diterima
- [] Cost item dengan nama kosong tidak bisa dibuat

### 8. UI/UX Validation

**Objective**: Memvalidasi tampilan dan user experience

**Steps**:
1. Perhatikan tampilan producer mode vs owner mode
2. Test search functionality di cost item selector
3. Test currency formatting di input amount
4. Test responsive design di mobile/tablet

**Expected Results**:
- [] Producer mode: Badge biru, help text yang sesuai
- [] Owner mode: Tampilan normal, total hijau
- [] Search case-insensitive dan menampilkan hasil yang relevan
- [] Currency formatting: "Rp20.000" format
- [] UI responsive di berbagai ukuran layar

## Test Data Preparation

### Sample Cost Items
Buat cost items berikut untuk testing:
```
1. Kain Katun Premium
2. Transport Jakarta
3. Penjahit Budi
4. Catering Lunch
5. Packaging Material
```

### Sample Products
Test dengan berbagai jenis produk:
- Clothing (Dress, Kemeja)
- Accessories Age-based (Sarung, Songket)
- Accessories Universal (Anting, Gelang)

## Success Criteria

### ✅ Producer Flow
- [x] Dapat membuat produk tanpa cost items (modalAwal = 0)
- [x] UI menampilkan indikator "Producer Mode"
- [x] Help text yang sesuai dengan mode

### ✅ Owner Flow
- [x] Dapat menambahkan cost items ke produk
- [x] Modal awal dihitung otomatis dari sum cost items
- [x] UI menampilkan total dengan styling yang sesuai

### ✅ Flow Transitions
- [x] Producer → Owner: Smooth transition saat menambah cost items
- [x] Owner → Producer: Smooth transition saat menghapus semua cost items
- [x] Real-time calculation tanpa perlu save

### ✅ Cost Item Management
- [x] Search dan select cost items yang ada
- [x] Create cost item baru dari product form
- [x] Input amount dengan currency formatting

### ✅ Validation & Error Handling
- [x] Validasi input yang proper
- [x] Error messages yang informatif
- [x] Prevent invalid operations

## Troubleshooting

### Common Issues
1. **Modal awal tidak update**: Check console untuk error, pastikan onModalAwalChange dipanggil
2. **Cost item tidak muncul di search**: Check API endpoint `/api/cost-items`
3. **Producer mode tidak muncul**: Check modalAwal value, harus exactly 0
4. **Currency formatting error**: Check formatRupiah function

### Debug Tips
1. Buka Developer Tools → Console untuk melihat audit trails
2. Check Network tab untuk API calls
3. Inspect React components untuk state changes
4. Check database untuk data consistency

## Completion Checklist

- [ ] All 8 test scenarios passed
- [ ] Producer flow working correctly
- [ ] Owner flow working correctly
- [ ] Flow transitions smooth
- [ ] Real-time calculations accurate
- [ ] UI/UX meets requirements
- [ ] Validation working properly
- [ ] No console errors
- [ ] Responsive design working
- [ ] Performance acceptable

## Notes
- Test di berbagai browser (Chrome, Firefox, Safari)
- Test dengan data yang bervariasi (banyak cost items, amount besar, dll)
- Perhatikan performance saat banyak cost items
- Dokumentasikan bug atau improvement yang ditemukan