---

ini adlaha list table nya, tetapi mungkin ini terlalu banyak jadi mungkin di bagian list table kita bisa mengambil yang intinya saja dan di penyewaan detail abru kita masukkan semua datanya 

## Contoh Data Transaksi Penyewaan

| No | Nama Penyewa | Kontak (No. KTP) | Alamat      | Status Penyewa   | Status Sewa      | Produk (Kode)                | Quantity | Jenis Pembayaran      | Total Pembayaran | Status Pembayaran | Tanggal Pengambilan | Tanggal Pengembalian | Catatan                |
|----|--------------|------------------|-------------|------------------|------------------|------------------------------|----------|----------------------|------------------|-------------------|---------------------|----------------------|------------------------|
| 1  | Ardi         | 089657           | Jl. Jendral | Belum Diambil    | Sedang Disewa    | Baju (kode produk), Sarung Batik (kode unik) | 1 dari 5 | QRIS, Cash, Transfer | [input angka]    | Belum Bayar / Sudah Bayar | DD-MM-YY            | Otomatis 4 hari       | (Status: lewat batas waktu +1 hari = denda 20K) |

**Catatan:**
- Pada kolom Produk, gunakan dropdown untuk memilih lebih dari satu produk (misal: Baju dan Sarung).
- Quantity dapat diatur sesuai stok (misal: 1 dari 5 tersedia).
- Jenis pembayaran berupa dropdown: QRIS, Cash, Transfer.
- Status pembayaran: Belum Bayar / Sudah Bayar.
- Tanggal pengembalian otomatis 4 hari setelah pengambilan.

---

## Logic Perhitungan Denda

- Jika status melewati batas waktu (jam 10 hari ke-4), sistem akan menghitung hari keterlambatan dan denda.
- Contoh: Jika pengembalian lewat 1 hari, denda = 20.000.
- Status pembayaran dan denda akan otomatis terupdate di sistem.

---
