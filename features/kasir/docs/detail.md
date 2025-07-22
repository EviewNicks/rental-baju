# User Story 4: Penyewaan

**Deskripsi:**
Sebagai kasir, saya ingin mendaftarkan penyewa baru dan membuat transaksi penyewaan agar proses sewa dapat dimulai.

---

## Asumsi

- Sistem sudah terintegrasi dengan database untuk menyimpan data penyewa dan transaksi.
- Kasir sudah terautentikasi dan memiliki akses ke dashboard.
- Pengguna memiliki akses internet.

---

## Detail Fitur

- Kasir dapat mengisi form untuk mendaftarkan penyewa baru dengan biodata (nama, kontak, alamat).
- Setelah pendaftaran, sistem secara otomatis membuat transaksi penyewaan dengan kode unik.
- Data penyewa dan transaksi disimpan di database.

---

## Kriteria Penerimaan (Acceptance Criteria)

- **Given** saya adalah kasir yang terautentikasi, **when** saya mengisi form pendaftaran penyewa dengan data valid, **then** sistem menyimpan data penyewa dan membuat transaksi penyewaan dengan kode unik.
- **Given** saya adalah kasir, **when** saya mencoba mendaftarkan penyewa dengan data yang tidak lengkap, **then** sistem menampilkan pesan error dan tidak menyimpan data.

---

## Flowchart

```
Start
  |
[Isi Form Penyewa]
  |
<Validasi Data>
  |
[Simpan Penyewa]
  |
[Buat Transaksi]
  |
[Tampilkan Kode Transaksi]
  |
End
```

---

## Evaluasi INVEST

| Kriteria    | Penjelasan                                            |
| ----------- | ----------------------------------------------------- |
| Independent | Ya, dapat dikerjakan secara terpisah.                 |
| Negotiable  | Dapat didiskusikan (misal: tambahan field pada form). |
| Valuable    | Memungkinkan proses penyewaan dimulai.                |
| Estimable   | 5 story points.                                       |
| Small       | Dapat diselesaikan dalam satu sprint.                 |
| Testable    | Dapat diuji dengan kriteria penerimaan.               |

---

# Task Breakdown untuk US4

## T1.1: Desain UI

- **Kaitan User Story:** US4
- **Deskripsi:** Merancang antarmuka pengguna untuk pendaftaran penyewa dan pembuatan transaksi penyewaan.
- **Fitur UI yang Termasuk:**
  - Form pendaftaran penyewa (nama, kontak, alamat)
  - Antarmuka pemilihan pakaian (tabel/grid dengan filter)
  - Form pembuatan transaksi dengan tampilan kode unik
- **Estimasi Effort:** 4 jam
- **Owner:** [Nama Designer/Developer]
- **Definisi Selesai:** Mockup atau implementasi desain UI selesai dan disetujui
- **Dependensi:** Tidak ada
- **Catatan:** Pastikan desain responsif dan sesuai kebutuhan bisnis

---

## T1.2: Implementasi Backend

- **Kaitan User Story:** US4
- **Deskripsi:** Mengembangkan API untuk pendaftaran penyewa dan transaksi penyewaan, dengan autentikasi Clerk.
- **Dependencies:** Clerk Auth (hanya admin yang dapat mengakses)
- **Detail Tugas:**
  - Buat API endpoint untuk menyimpan data penyewa di Supabase (tabel penyewa)
  - Buat API endpoint untuk membuat transaksi penyewaan, termasuk kode unik
  - Tulis unit test untuk API endpoint menggunakan Jest
- **Estimasi Effort:** 6 jam
- **Owner:** [Nama Developer]
- **Definisi Selesai:** API berfungsi, data tersimpan dengan benar, dan unit test lulus
- **Dependensi:** T1 (untuk kebutuhan UI)
- **Catatan:** Pastikan kode transaksi unik dihasilkan secara otomatis

---

## T1.3: Implementasi Front-end

- **Kaitan User Story:** US4
- **Deskripsi:** Mengembangkan antarmuka pengguna dan menghubungkannya dengan backend.
- **Dependencies:** React Query (untuk manajemen state dan fetching data)
- **Detail Tugas:**
  - Implementasikan form pendaftaran penyewa
  - Implementasikan antarmuka pemilihan pakaian dengan filter
  - Integrasikan dengan API backend untuk menyimpan data dan membuat transaksi
- **Estimasi Effort:** 6 jam
- **Owner:** [Nama Developer]
- **Definisi Selesai:** Antarmuka berfungsi dan terintegrasi dengan backend
- **Dependensi:** T2
- **Catatan:** Gunakan React Query untuk efisiensi fetching data

---

## T1.4: E2E Test

- **Kaitan User Story:** US4
- **Deskripsi:** Menulis skenario pengujian E2E menggunakan Playwright.
- **Detail Tugas:**
  - Test case: Pendaftaran penyewa baru berhasil
  - Test case: Pembuatan transaksi penyewaan dengan pakaian yang dipilih
  - Test case: Verifikasi kode transaksi unik dihasilkan
- **Estimasi Effort:** 4 jam
- **Owner:** [Nama QA/Developer]
- **Definisi Selesai:** Tes E2E berjalan sukses dan mencakup semua skenario
- **Dependensi:** T3
- **Catatan:** Bersihkan data tes setelah pengujian selesai
