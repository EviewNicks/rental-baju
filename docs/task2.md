🧪 Test Scenarios
# 1. Transaction History Popup (Task 6)
✅ Test Case 1.1: Basic History Display
Steps:

Buka halaman Kasir → Transaksi Baru
Pilih produk yang memiliki size variants
Klik tombol History (ikon) pada size button
Popup history muncul
Expected Results:

✅ Popup menampilkan riwayat transaksi
✅ Format: "TXN-001 (2 item) untuk 4-7 Feb"
✅ Status badge: Aktif (biru), Diambil (hijau)
✅ Sorting berdasarkan tanggal terdekat
✅ Test Case 1.2: Empty State
Steps:

Pilih produk yang belum pernah disewa
Klik History button
Expected Results:

✅ Tampil pesan: "Belum Ada Transaksi"
✅ Icon package dengan penjelasan
✅ Test Case 1.3: Error Handling
Steps:

Matikan internet/simulasi network error
Klik History button
Expected Results:

✅ Error message user-friendly dalam bahasa Indonesia
✅ Tombol "Coba Lagi" dengan retry counter
✅ Suggestions dan help text muncul


# 2. Date-Aware Availability (Task 4 & 5)
✅ Test Case 2.1: Stock Management Flow
Steps:

Cek stock produk A (misal: 10 unit)
Buat transaksi baru untuk 5 unit produk A
Cek stock setelah transaksi dibuat
Lakukan pickup untuk transaksi tersebut
Cek stock setelah pickup
Expected Results:

✅ Setelah buat transaksi: Stock tetap 10 (tidak berkurang)
✅ Setelah pickup: Stock jadi 5 (berkurang saat pickup)

##  Test Case 2.2: Date Overlap Detection
Steps:

Buat transaksi A: 3 unit untuk 24-30 Des 2024
Coba buat transaksi B: 5 unit untuk 25-28 Des 2024 (overlap)
Expected Results:

✅ Transaksi B ditolak dengan error message
✅ Pesan: "Produk sudah dibooking untuk periode ini: TXN-XXX"
✅ Informasi available quantity

## ✅ Test Case 2.3: Non-Overlapping Dates
Steps:

Buat transaksi A: 3 unit untuk 24-30 Des 2024
Buat transaksi B: 5 unit untuk 31 Des - 6 Jan 2025 (tidak overlap)
Expected Results:

✅ Kedua transaksi berhasil dibuat
✅ Stock tidak berkurang sampai pickup
3. API & Caching (Task 2)
✅ Test Case 3.1: API Response
Steps:

Buka Developer Tools → Network tab
Klik History button pada produk
Lihat request ke /api/kasir/transaksi/product-history
Expected Results:

✅ Response status 200
✅ Data format sesuai: {success: true, data: [...], cached: false}
✅ Metadata berisi cacheExpiresAt
✅ Test Case 3.2: Caching Behavior
Steps:

Klik History button (request pertama)
Tutup popup, buka lagi dalam 5 menit
Tunggu > 5 menit, buka lagi
Expected Results:

✅ Request ke-2: cached: true di response
✅ Request ke-3: cached: false (cache expired)
✅ Badge "Cache 5 menit" muncul di popup
4. Error Handling (Task 7)
✅ Test Case 4.1: Network Errors
Steps:

Disconnect internet
Klik History button
Klik "Coba Lagi"
Expected Results:

✅ Error message: "Koneksi terlalu lambat atau server tidak merespons"
✅ Suggestions list muncul
✅ Help text dengan emoji 💡
✅ Retry dengan exponential backoff
✅ Test Case 4.2: Product Not Found
Steps:

Manipulasi URL/productSizeId yang tidak valid
Trigger API call
Expected Results:

✅ Error: "Produk yang Anda cari tidak tersedia"
✅ Suggestions: "Periksa kembali produk yang dipilih"
✅ Non-retryable error (no retry button)
5. UI Integration (Task 8)
✅ Test Case 5.1: ProductSelectionStep Integration
Steps:

Buka halaman transaksi
Coba add produk yang conflict
Lihat error display di ProductSelectionStep
Expected Results:

✅ Orange warning box muncul
✅ "Peringatan Ketersediaan" header
✅ Error message per produk
✅ Tombol "Tutup" untuk dismiss error
✅ Test Case 5.2: Responsive Design
Steps:

Test di desktop (1920x1080)
Test di tablet (768px)
Test di mobile (375px)
Expected Results:

✅ Popup responsive di semua ukuran
✅ History button visible dan clickable
✅ Text tidak terpotong
