# Dokumen Sprint Planning untuk Sprint 2

## 1. Header

| Informasi                      | Detail                             |
| ------------------------------ | ---------------------------------- |
| **Nama Proyek**                | Sistem Manajemen Penyewaan Pakaian |
| **Sprint #**                   | 2                                  |
| **Tanggal Sprint Planning**    | 22 Juli 2025                       |
| **Durasi (Timebox)**           | 2 minggu (10-14 hari kerja)        |
| **Facilitator (Scrum Master)** | [Nama Scrum Master]                |
| **Disusun oleh**               | [Nama Penulis Dokumen]             |

## 2. Tujuan Sprint (Sprint Goal)

**Deskripsi**: Mengimplementasikan fitur kasir termasuk penyewaan, pengambilan, pengembalian, dan manajemen inventaris dasar untuk mendukung operasional penyewaan pakaian.

## 3. Peserta dan Peran

| Peran                | Nama                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------- |
| **Product Owner**    | [Nama Product Owner]                                                                     |
| **Scrum Master**     | [Nama Scrum Master]                                                                      |
| **Development Team** | [Daftar nama anggota tim pengembang, misalnya: Pengembang 1, Pengembang 2, Pengembang 3] |

## 4. Input Planning

### Product Backlog Ter-refined

User stories untuk fitur kasir (penyewaan, pengambilan, pengembalian) dan manajemen inventaris dasar telah diprioritaskan berdasarkan kebutuhan bisnis.

### Velocity Tim

- **Sprint Pertama**: 18 story points
- **Asumsi**: 16-20 story points

### Capacity Tim

- **Total Kapasitas**: 3 pengembang × 6 jam/hari × 10 hari = 180 jam
- **Overhead**: Dikurangi 30% untuk overhead (rapat, koordinasi, dll.) = 126 jam
- **Buffer**: Cadangan 10% (12,6 jam) untuk pekerjaan tak terduga

### Definition of Done (DoD)

- [ ] Kode telah direview dan dimerge ke branch main
- [ ] Semua fitur telah diuji (unit test, API test, dan manual test) dan berfungsi sesuai harapan
- [ ] Dokumentasi teknis dan pengguna telah diperbarui
- [ ] Demo siap untuk Sprint Review
- [ ] Tes E2E telah ditulis dan berjalan dengan sukses

## 5. Agenda dan Langkah-langkah

| Durasi      | Aktivitas                                                                                          |
| ----------- | -------------------------------------------------------------------------------------------------- |
| 10-15 menit | **Opening dan konteks** oleh Product Owner: Menjelaskan prioritas dan kebutuhan bisnis             |
| 40-60 menit | **Pemilihan backlog item** dan penentuan Sprint Goal: Diskusi tim untuk memilih user stories       |
| 60-90 menit | **Task breakdown dan estimasi**: Memecah user stories menjadi tugas-tugas kecil dan estimasi usaha |
| 30 menit    | **Capacity check dan finalisasi Sprint Backlog**: Memastikan komitmen sesuai kapasitas tim         |
| 15 menit    | **Review dokumen dan action items**: Menyepakati dokumen dan menentukan tindakan lanjutan          |

## 6. Sprint Backlog

Berikut adalah daftar user story yang dipilih untuk Sprint 2, beserta estimasi story points:

| No.       | User Story                                                                                                                           | Story Points |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| **US4**   | Sebagai kasir, saya ingin mendaftarkan penyewa baru dan membuat transaksi penyewaan agar proses sewa dapat dimulai.                  | 5            |
| **US5**   | Sebagai kasir, saya ingin memproses pengambilan pakaian berdasarkan kode transaksi untuk memastikan pakaian diserahkan dengan benar. | 5            |
| **US6**   | Sebagai kasir, saya ingin memproses pengembalian pakaian, menghitung denda, dan mencatat status pakaian untuk menutup transaksi.     | 8            |
| **US7**   | Sebagai kasir, saya ingin melihat dan memperbarui status ketersediaan pakaian untuk menjaga akurasi inventaris.                      | 5            |
| **Total** |                                                                                                                                      | **23**       |

**Total Kapasitas**: 126 jam (asumsi 1 story point ≈ 6-8 jam untuk Sprint pertama)

## 7. Task Breakdown

Untuk setiap user story, tugas dibagi menjadi empat kategori: Desain UI, Implementasi Backend, Implementasi Frontend, dan E2E Test.

### User Story 4: Penyewaan

| Task ID             | Task Title                                                                                     | Estimasi (Jam) |
| ------------------- | ---------------------------------------------------------------------------------------------- | -------------- |
| T1.1                | Merancang antarmuka pengguna untuk pendaftaran penyewa dan pembuatan transaksi penyewaan.      | 4              |
| T1.2                | Mengembangkan API untuk pendaftaran penyewa dan transaksi penyewaan, dengan autentikasi Clerk. | 6              |
| T1.3                | Mengembangkan antarmuka pengguna dan menghubungkannya dengan backend.                          | 6              |
| T1.4                | Menulis skenario pengujian E2E menggunakan Playwright.                                         | 4              |
| **Total Usaha US4** |                                                                                                | **~20 jam**    |

### User Story 5: Pengambilan

| Task ID             | Task Title                                                                    | Estimasi (Jam) |
| ------------------- | ----------------------------------------------------------------------------- | -------------- |
| T2.1                | Merancang antarmuka untuk pencarian dan konfirmasi pengambilan pakaian.       | 3              |
| T2.2                | Mengembangkan API untuk pencarian transaksi dan pembaruan status pengambilan. | 5              |
| T2.3                | Mengembangkan antarmuka pengguna untuk pencarian dan konfirmasi pengambilan.  | 5              |
| T2.4                | Menulis skenario pengujian E2E menggunakan Playwright.                        | 3              |
| **Total Usaha US5** |                                                                               | **~16 jam**    |

### User Story 6: Pengembalian

| Task ID             | Task Title                                                            | Estimasi (Jam) |
| ------------------- | --------------------------------------------------------------------- | -------------- |
| T3.1                | Merancang antarmuka untuk mencatat pengembalian dan menghitung denda. | 4              |
| T3.2                | Mengembangkan API untuk pengembalian dan perhitungan denda.           | 4              |
| T3.3                | Mengembangkan antarmuka pengguna untuk pengembalian dan denda.        | 6              |
| T3.4                | Menulis skenario pengujian E2E menggunakan Playwright.                | 4              |
| **Total Usaha US6** |                                                                       | **~18 jam**    |

**Total Estimasi Usaha Keseluruhan**: ~54 jam (dari total kapasitas 126 jam)

## 8. Risks & Dependencies

### Ketergantungan

- Fitur autentikasi dan manajemen produk dari Sprint 1 harus sudah selesai dan berfungsi dengan baik
- Database Supabase harus memiliki skema untuk penyewa, transaksi, dan pakaian
- Integrasi Clerk untuk autentikasi admin harus berfungsi

### Risiko

- Kompleksitas logika perhitungan denda keterlambatan pada fitur pengembalian
- Ambiguitas dalam manajemen kuota pakaian (misalnya, batasan jumlah pakaian per transaksi)
- Potensi masalah sinkronisasi status pakaian antara transaksi dan inventaris

## 9. Definition of Done (DoD)

- [ ] Semua kode telah direview dan dimerge ke branch main
- [ ] Semua fitur telah diuji (unit test, API test, dan manual test) dan berfungsi sesuai harapan
- [ ] Dokumentasi teknis dan pengguna telah diperbarui
- [ ] Demo siap untuk Sprint Review
- [ ] Tes E2E telah ditulis dan berjalan dengan sukses

## 10. Action Items Pasca Sprint Planning

| Tindakan                                                           | Penanggung Jawab | Tanggal Target |
| ------------------------------------------------------------------ | ---------------- | -------------- |
| Setup akun Clerk dan dapatkan API keys                             | [Nama]           | 14 Juli 2025   |
| Buat pengguna admin awal di dashboard Clerk                        | [Nama]           | 14 Juli 2025   |
| Siapkan lingkungan pengembangan untuk integrasi Clerk dan Supabase | [Nama]           | 15 Juli 2025   |

## Catatan

- Total story points (23) sedikit di atas velocity tim (18), tetapi dengan durasi sprint 2 minggu dan kapasitas 126 jam, ini realistis dengan manajemen waktu yang baik
- Prioritas dapat diberikan pada US4 (Penyewaan) dan US5 (Pengambilan) jika waktu terbatas, karena merupakan alur kerja utama kasir
- Manajemen kuota pakaian memerlukan klarifikasi lebih lanjut dari Product Owner untuk memastikan implementasi yang tepat
- Dokumentasi teknis harus mencakup detail API dan skema database untuk referensi di sprint berikutnya
