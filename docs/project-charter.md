# Proyek: Sistem Manajemen Penyewaan Pakaian

**By:** Ardiansyah Arifin  
**Reading Time:** 3 min

---

## Dokumentasi Spesifikasi

Dokumen ini menyajikan spesifikasi proyek untuk pengembangan aplikasi web manajemen penyewaan pakaian berdasarkan kebutuhan klien. Spesifikasi ini mencakup ringkasan kebutuhan, ruang lingkup, detail fungsionalitas, diagram alur kerja, jadwal, dan catatan teknis.

## 1. Ringkasan Kebutuhan Klien

### Tujuan Bisnis

Membangun sistem untuk mengelola operasional bisnis penyewaan pakaian, kemungkinan untuk acara atau produksi.

### Konteks Proyek

Aplikasi web ini akan digunakan oleh tiga jenis pengguna: admin, owner, dan produksi, dengan fitur yang disesuaikan untuk setiap peran.

### Requirement Utama

- Manajemen pengguna dengan peran berbeda (admin, owner, produksi)
- Fitur kasir untuk proses penyewaan, pengambilan, dan pengembalian pakaian
- Fitur owner yang mencakup semua fitur kasir dan produksi
- Fitur produksi (diasumsikan mencakup manajemen inventaris dan jadwal perawatan, menunggu klarifikasi)
- Manajemen inventaris pakaian dengan atribut: kode, foto, jumlah, dan harga

## 2. Scope & Deliverables

### In-Scope

- Pengembangan aplikasi web menggunakan Next.js dan TypeScript
- Integrasi dengan Supabase untuk manajemen database
- Autentikasi dan otorisasi menggunakan Clerk
- Pengujian dengan Jest (unit dan integration tests) dan Playwright (E2E tests)

### Fitur-fitur

- Manajemen pengguna (admin, owner, produksi)
- Fitur kasir: penyewaan, pengambilan, pengembalian
- Fitur produksi: manajemen inventaris dan jadwal perawatan (diasumsikan)
- Fitur owner: akses penuh ke fitur kasir dan produksi, serta dashboard laporan

### Out-of-Scope

- Fitur pembayaran online (kecuali diminta)
- Integrasi dengan sistem eksternal lain (kecuali diminta)
- Pengembangan aplikasi mobile

## 3. Detail Fungsionalitas

### Fitur Admin

| Fitur            | User Story                                                                                               | Acceptance Criteria                                                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Penyewaan**    | Sebagai kasir, saya ingin mendaftarkan penyewa baru dengan biodata mereka.                               | • Formulir untuk biodata penyewa (nama, kontak, alamat, dll.)<br>• Penyimpanan data di database<br>• Kode unik untuk setiap transaksi penyewaan                                  |
| **Pengambilan**  | Sebagai kasir, saya ingin memproses pengambilan pakaian berdasarkan kode transaksi.                      | • Pencarian berdasarkan kode transaksi<br>• Tampilan detail transaksi dan pakaian<br>• Update status menjadi "sudah diambil"<br>• Manajemen kuota pakaian                        |
| **Pengembalian** | Sebagai kasir, saya ingin memproses pengembalian pakaian, menghitung denda, dan mencatat status pakaian. | • Pencatatan tanggal pengembalian<br>• Perhitungan denda keterlambatan<br>• Update status pakaian (misalnya, "perlu dicuci")<br>• Update status transaksi menjadi "dikembalikan" |

### Fitur Produksi

| Fitur                             | User Story                                                     | Acceptance Criteria                                                                                                                              |
| --------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Manajemen Inventaris** (Asumsi) | Sebagai produksi, saya ingin mengelola inventaris pakaian.     | • Formulir untuk menambah pakaian (kode, foto, jumlah, harga)<br>• Fungsi edit dan hapus pakaian<br>• Daftar pakaian dengan filter dan pencarian |
| **Jadwal Perawatan** (Asumsi)     | Sebagai produksi, saya ingin melihat jadwal perawatan pakaian. | • Kalender atau daftar jadwal perawatan<br>• Fungsi tambah, edit, hapus jadwal                                                                   |

### Fitur Owner

| Fitur                       | User Story                                                          | Acceptance Criteria                                                                                                     |
| --------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Laporan Bisnis** (Asumsi) | Sebagai owner, saya ingin melihat laporan bisnis.                   | • Dashboard dengan ringkasan pendapatan, transaksi, dan inventaris<br>• Laporan detail yang dapat diekspor (PDF, Excel) |
| **Akses Penuh**             | Sebagai owner, saya ingin mengakses semua fitur kasir dan produksi. | • Akses tanpa batasan ke fungsi kasir dan produksi                                                                      |

## 4. Diagram & Alur Kerja

### Alur Kerja Penyewaan

Berikut adalah alur kerja untuk proses penyewaan pakaian:

```mermaid
graph TD
    A[Penyewa datang] --> B[Mendaftarkan penyewa]
    B --> C[Membuat transaksi penyewaan]
    C --> D[Penyewa memilih pakaian]
    D --> E[Transaksi disimpan "menunggu pengambilan"]
    E --> F[Pengambilan: cari transaksi]
    F --> G[Verifikasi dan update status "sudah diambil"]
    G --> H[Pengembalian: catat tanggal kembali]
    H --> I[Hitung denda jika terlambat]
    I --> J[Update status pakaian dan transaksi]
```

### Penjelasan Alur Kerja

1. **Pendaftaran Penyewa**: Penyewa diminta mengisi biodata lengkap dan menunjukkan dokumen identitas resmi untuk verifikasi.

2. **Pembuatan Transaksi**: Detail seperti tanggal sewa dan durasi dicatat untuk kejelasan.

3. **Pemilihan Pakaian**: Penyewa melihat katalog, memilih pakaian, dan sistem memeriksa ketersediaan. Jika tidak tersedia, ada opsi untuk memilih ulang atau reservasi.

4. **Pengambilan**: Transaksi dicari dengan kode unik, diverifikasi, lalu pakaian diserahkan.

5. **Pengembalian**: Kondisi pakaian diperiksa. Jika rusak/kotor, ditentukan tindakan perawatan; jika baik, proses dilanjutkan. Denda dihitung jika terlambat.

6. **Pembaruan Status**: Status pakaian dan transaksi diperbarui untuk menutup proses.

### Arsitektur High-Level

- **Frontend**: Next.js dengan TypeScript untuk antarmuka pengguna
- **Backend**: Supabase untuk database PostgreSQL dan API
- **Autentikasi**: Clerk untuk login dan otorisasi
- **Pengujian**: Jest untuk unit dan integration tests, Playwright untuk E2E tests

## 5. Timeline & Milestone

| Sprint       | Durasi   | Deliverable                                                                              |
| ------------ | -------- | ---------------------------------------------------------------------------------------- |
| **Sprint 0** | 1 minggu | Setup proyek (Next.js, Supabase, Clerk), desain schema database, klarifikasi requirement |
| **Sprint 1** | 1 minggu | Autentikasi dengan Clerk, fitur admin untuk manajemen pengguna                           |
| **Sprint 2** | 2 minggu | Fitur kasir (penyewaan, pengambilan, pengembalian), manajemen inventaris dasar           |
| **Sprint 3** | 2 minggu | Fitur produksi (inventaris lengkap, jadwal perawatan), fitur owner (dashboard, laporan)  |
| **Sprint 4** | 1 minggu | Deployment, pelatihan pengguna                                                           |

**Total Perkiraan**: 7 minggu (dapat disesuaikan berdasarkan tim dan kompleksitas)

## 6. Dependensi & Catatan Teknis

### Dependensi

- Next.js
- TypeScript
- Supabase
- Clerk
- Jest
- Playwright

### Catatan Teknis

- Sistem harus menangani akses bersamaan untuk manajemen inventaris
- Implementasi error handling dan logging yang robust
- Pertimbangkan skalabilitas untuk pertumbuhan bisnis
- Keamanan: lindungi data sensitif pengguna
- Schema database harus mencakup atribut pakaian: kode, foto, jumlah, harga
- Fitur produksi memerlukan klarifikasi lebih lanjut dari klien

## 7. Pertanyaan Klarifikasi untuk Klien

Berikut adalah pertanyaan untuk memastikan kebutuhan klien terpenuhi:

1. Apa saja fitur spesifik untuk pengguna "produksi"? Apakah hanya manajemen inventaris, atau juga mencakup jadwal produksi/perawatan pakaian?

2. Apakah sistem ini hanya untuk pengguna internal (kasir, produksi, owner, admin), atau juga menyediakan portal pelanggan untuk reservasi online?

3. Apakah fitur pembayaran online diperlukan untuk transaksi penyewaan?

4. Bagaimana cara menentukan "kuota on demand" pada fitur pengambilan? Apakah ada batasan jumlah pakaian per transaksi?

5. Apakah ada kebutuhan untuk laporan atau analitik bisnis, seperti pendapatan atau performa inventaris?

## 8. Catatan Tambahan

- Fitur produksi diasumsikan mencakup manajemen inventaris dan jadwal perawatan berdasarkan praktik umum sistem penyewaan pakaian (sumber: Booqable, Trueline Solution)

- Jika diperlukan, sistem dapat diperluas untuk mendukung portal pelanggan, tetapi ini memerlukan konfirmasi dari klien

- Teknologi yang dipilih (Next.js, Supabase, Clerk) mendukung pengembangan cepat dan skalabilitas

---

**Catatan**: Dokumen ini akan menjadi panduan utama bagi tim developer untuk memulai pengembangan. Setelah menerima klarifikasi dari klien, dokumen dapat diperbarui untuk memastikan semua kebutuhan terpenuhi.
