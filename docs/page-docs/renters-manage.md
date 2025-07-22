Terima kasih atas konfirmasinya bahwa Sprint 1 hanya mencakup **autentikasi admin**, **manajemen penyewa** (create, view, edit, delete profil penyewa), dan **pengujian E2E** dengan Playwright, tanpa fitur kasir penuh seperti penyewaan, pengambilan, dan pengembalian. Saya akan menjelaskan lebih lanjut tentang fitur **manajemen penyewa** yang dikembangkan di Sprint 1, termasuk gambaran halaman (_page_) manajemen penyewa yang akan mendukung fitur kasir di sprint berikutnya. Penjelasan ini akan mencakup detail fungsionalitas, alur kerja, desain halaman, dan bagaimana fitur ini terhubung dengan kebutuhan kasir berdasarkan Project Charter.

---

### **Penjelasan Fitur Manajemen Penyewa**

#### **Konteks dan Tujuan**

Fitur manajemen penyewa adalah bagian penting dari sistem manajemen penyewaan pakaian, khususnya untuk mendukung peran admin (yang juga berperan sebagai kasir). Berdasarkan klarifikasi Anda, penyewa tidak mendaftar sendiri melalui sistem (misalnya, via Clerk), melainkan didaftarkan dan dikelola oleh admin melalui dashboard admin. Fitur ini memungkinkan admin untuk:

- **Membuat** profil penyewa baru (misalnya, saat pelanggan baru datang untuk menyewa pakaian).
- **Melihat** daftar semua penyewa yang sudah terdaftar.
- **Mengedit** informasi penyewa untuk memperbarui data.
- **Menghapus** profil penyewa yang tidak aktif.

Fitur ini menjadi fondasi untuk fitur kasir di Sprint 2 (penyewaan, pengambilan, pengembalian), karena admin perlu memeriksa apakah penyewa sudah terdaftar sebelum memproses transaksi penyewaan. Data penyewa disimpan di Supabase, dan admin menggunakan dashboard untuk mengelola informasi ini.

#### **Alur Kerja Manajemen Penyewa**

Berdasarkan alur kerja yang Anda jelaskan dalam klarifikasi sebelumnya:

1. **Penyewa datang**: Seorang pelanggan datang untuk menyewa pakaian.
2. **Pemeriksaan daftar penyewa**: Admin memeriksa daftar penyewa di sistem untuk mengetahui apakah pelanggan sudah terdaftar (misalnya, berdasarkan nama atau nomor identitas).
3. **Pendaftaran penyewa baru**: Jika pelanggan belum terdaftar, admin membuat profil baru dengan mengisi data seperti nama, kontak, dan alamat.
4. **Lanjut ke proses penyewaan**: Jika penyewa sudah terdaftar, admin melanjutkan ke proses penyewaan (yang akan dikembangkan di Sprint 2).

Fitur manajemen penyewa di Sprint 1 hanya mencakup langkah-langkah untuk mengelola profil penyewa (create, view, edit, delete), bukan proses penyewaan itu sendiri.

#### **Fungsionalitas Fitur Manajemen Penyewa**

Berdasarkan Project Charter dan klarifikasi Anda, berikut adalah detail fungsionalitas fitur manajemen penyewa:

- **Create (Membuat Profil Penyewa)**:
  - Admin mengisi formulir dengan data penyewa, seperti nama, nomor telepon, alamat, dan nomor identitas (opsional, misalnya KTP untuk verifikasi).
  - Data disimpan di tabel `renters` di Supabase dengan kode unik untuk setiap penyewa.
  - Formulir menampilkan pesan sukses setelah penyimpanan.
- **View (Melihat Daftar Penyewa)**:
  - Admin melihat daftar semua penyewa dalam format tabel atau list.
  - Data yang ditampilkan mencakup nama, nomor telepon, dan kode unik penyewa.
  - Fitur pencarian atau filter (misalnya, berdasarkan nama) ditambahkan jika ada waktu dalam sprint.
- **Edit (Mengedit Profil Penyewa)**:
  - Admin dapat memilih penyewa dari daftar, lalu mengedit data seperti nama, kontak, atau alamat.
  - Perubahan disimpan ke Supabase dan menampilkan pesan sukses.
- **Delete (Menghapus Profil Penyewa)**:
  - Admin dapat menghapus profil penyewa yang tidak aktif.
  - Sistem menampilkan dialog konfirmasi sebelum menghapus untuk mencegah kesalahan.
  - Data dihapus dari Supabase.

#### **Kaitan dengan Fitur Kasir**

Fitur manajemen penyewa di Sprint 1 adalah langkah pendukung untuk fitur kasir di Sprint 2. Menurut Project Charter, fitur kasir mencakup:

- **Penyewaan**: Admin mendaftarkan transaksi penyewaan, yang memerlukan profil penyewa yang sudah ada di sistem.
- **Pengambilan**: Admin memverifikasi transaksi berdasarkan kode transaksi dan profil penyewa.
- **Pengembalian**: Admin mencatat pengembalian pakaian dan memperbarui status.

Fitur manajemen penyewa memastikan bahwa admin memiliki daftar penyewa yang lengkap dan terorganisir, sehingga saat fitur kasir dikembangkan, admin dapat:

- Mengidentifikasi penyewa dengan cepat melalui pencarian di daftar.
- Menghubungkan transaksi penyewaan dengan profil penyewa yang sudah ada.
- Menjaga data pelanggan tetap akurat dan terkini untuk keperluan pelaporan atau verifikasi.

#### **Gambaran Halaman Manajemen Penyewa**

Berikut adalah gambaran desain halaman (_page_) untuk fitur manajemen penyewa di dashboard admin, yang dibangun menggunakan Next.js dan terintegrasi dengan Supabase:

1. **Halaman Dashboard Penyewa (`/admin/renters`)**:
   - **Tampilan**:
     - Header dengan nama aplikasi dan tombol sign-out (menggunakan `UserButton` dari Clerk).
     - Menu navigasi sederhana (misalnya, tab untuk "Manajemen Penyewa" dan placeholder untuk fitur kasir di masa depan).
     - Bagian utama menampilkan tabel daftar penyewa.
   - **Komponen Tabel Penyewa**:
     - Kolom: Kode Unik, Nama, Nomor Telepon, Alamat (opsional), Aksi (Edit, Hapus).
     - Baris mewakili setiap penyewa, dengan tombol "Edit" dan "Hapus" di kolom Aksi.
     - Kotak pencarian di atas tabel untuk mencari penyewa berdasarkan nama atau kode unik (opsional, jika ada waktu).
     - Tombol "Tambah Penyewa Baru" yang mengarah ke halaman formulir.
   - **Fungsionalitas**:
     - Tabel diisi dengan data dari API route `/api/renters` yang mengambil data dari Supabase.
     - Pencarian/filter menggunakan query sederhana di frontend (atau backend jika kompleks).

2. **Halaman Tambah Penyewa (`/admin/renters/new`)**:
   - **Tampilan**:
     - Formulir dengan input untuk:
       - Nama (wajib)
       - Nomor Telepon (wajib)
       - Alamat (opsional)
       - Nomor Identitas (opsional, misalnya KTP untuk verifikasi)
     - Tombol "Simpan" untuk mengirim data ke API backend.
     - Tombol "Kembali" untuk kembali ke daftar penyewa.
   - **Fungsionalitas**:
     - Formulir dikirim ke API route `/api/renters` untuk membuat record baru di Supabase.
     - Validasi sederhana (misalnya, nama dan nomor telepon tidak boleh kosong).
     - Menampilkan pesan sukses atau error setelah pengiriman.

3. **Halaman Edit Penyewa (`/admin/renters/[id]/edit`)**:
   - **Tampilan**:
     - Formulir serupa dengan halaman tambah, tetapi sudah diisi dengan data penyewa yang dipilih.
     - Tombol "Simpan Perubahan" dan "Kembali".
   - **Fungsionalitas**:
     - Data awal diambil dari API route `/api/renters/[id]`.
     - Perubahan disimpan melalui API route `/api/renters/[id]` menggunakan metode `PATCH` atau `PUT`.
     - Menampilkan pesan sukses atau error.

4. **Fitur Hapus Penyewa**:
   - **Tampilan**:
     - Tombol "Hapus" di tabel daftar penyewa.
     - Dialog konfirmasi muncul saat tombol diklik (misalnya, "Apakah Anda yakin ingin menghapus penyewa ini?").
   - **Fungsionalitas**:
     - Pengiriman permintaan hapus ke API route `/api/renters/[id]` dengan metode `DELETE`.
     - Tabel diperbarui secara otomatis setelah penghapusan berhasil.

#### **Desain Teknis**

- **Frontend**: Dibangun dengan Next.js dan TypeScript, menggunakan komponen UI sederhana (misalnya, Tailwind CSS untuk styling).
- **Backend**: Supabase digunakan untuk menyimpan data penyewa dalam tabel `renters` dengan kolom seperti `id`, `unique_code`, `name`, `phone`, `address`, `identity_number` (opsional).
- **API Routes**:
  - `GET /api/renters`: Mengambil daftar penyewa.
  - `POST /api/renters`: Membuat penyewa baru.
  - `GET /api/renters/[id]`: Mengambil detail penyewa.
  - `PATCH /api/renters/[id]`: Memperbarui penyewa.
  - `DELETE /api/renters/[id]`: Menghapus penyewa.
- **Autentikasi**: Clerk digunakan untuk memastikan hanya admin yang dapat mengakses rute `/admin/*` melalui middleware.
- **Pengujian E2E**: Playwright menguji flow seperti login admin, membuat penyewa baru, mengedit penyewa, dan menghapus penyewa.

#### **Hubungan dengan Fitur Kasir di Sprint 2**

Fitur manajemen penyewa di Sprint 1 mendukung fitur kasir di Sprint 2 dengan cara berikut:

- **Identifikasi Penyewa**: Admin dapat mencari penyewa di daftar untuk memverifikasi identitas sebelum membuat transaksi penyewaan.
- **Data Akurat**: Profil penyewa yang terkelola dengan baik memastikan data seperti nama dan kontak tersedia untuk transaksi.
- **Efisiensi Proses**: Dengan penyewa sudah terdaftar, admin dapat langsung memproses penyewaan tanpa perlu mendaftarkan ulang pelanggan.

Contoh alur di Sprint 2:

- Penyewa datang → Admin mencari nama di daftar penyewa → Jika tidak ada, admin membuat profil baru (menggunakan fitur Sprint 1) → Admin membuat transaksi penyewaan (fitur Sprint 2).

#### **Gambaran Visual Halaman (Mockup Sederhana)**

Berikut adalah deskripsi visual untuk membantu tim desain dan pengembangan:

```
[Header: Nama Aplikasi | UserButton (Sign Out)]
[Navigasi: Manajemen Penyewa | (Placeholder untuk Penyewaan, Pengambilan, Pengembalian)]
[Judul: Manajemen Penyewa]
[Kotak Pencarian: Cari berdasarkan nama atau kode unik]
[Tabel Penyewa]
| Kode Unik | Nama         | Nomor Telepon | Alamat         | Aksi          |
|-----------|--------------|---------------|----------------|---------------|
| R001      | Budi Santoso | 08123456789   | Jl. Sudirman   | [Edit] [Hapus]|
| R002      | Ani Wijaya   | 0876543210    | Jl. Thamrin    | [Edit] [Hapus]|
[Tombol: Tambah Penyewa Baru]
```

**Halaman Tambah/Edit Penyewa**:

```
[Header: Tambah Penyewa Baru / Edit Penyewa]
[Formulir]
- Nama: [Input Text]
- Nomor Telepon: [Input Text]
- Alamat: [Input Text, opsional]
- Nomor Identitas: [Input Text, opsional]
[Tombol: Simpan | Kembali]
```

#### **Catatan untuk Pengembangan**

- **UI/UX**: Gunakan desain sederhana dan fungsional untuk dashboard admin, fokus pada kemudahan penggunaan oleh kasir (admin).
- **Validasi Data**: Pastikan validasi untuk nama dan nomor telepon (wajib) di frontend dan backend.
- **Keamanan**: Lindungi API routes dengan autentikasi Clerk untuk memastikan hanya admin yang dapat mengakses data penyewa.
- **Skalabilitas**: Schema database harus dirancang untuk mendukung fitur kasir di masa depan (misalnya, kolom untuk menghubungkan penyewa dengan transaksi).

#### **Pengujian E2E**

Tes E2E dengan Playwright akan mencakup:

- Login admin menggunakan Clerk.
- Membuat penyewa baru dan memverifikasi data tersimpan.
- Melihat daftar penyewa dan memastikan data ditampilkan dengan benar.
- Mengedit penyewa dan memverifikasi perubahan.
- Menghapus penyewa dan memastikan data hilang dari daftar.

#### **Kesimpulan**

Fitur manajemen penyewa di Sprint 1 adalah langkah kunci untuk mendukung fitur kasir di Sprint 2. Halaman manajemen penyewa dirancang sebagai bagian dari dashboard admin, dengan tabel untuk melihat daftar, formulir untuk menambah/mengedit, dan fungsi hapus dengan konfirmasi. Fitur ini memungkinkan admin untuk mengelola data penyewa secara efisien, mempersiapkan sistem untuk proses penyewaan, pengambilan, dan pengembalian di sprint berikutnya. Dokumen Sprint Planning yang telah direvisi sudah mencakup semua aspek ini, dan gambaran halaman di atas dapat digunakan sebagai panduan untuk tim desain dan pengembangan.

Jika Anda memerlukan mockup visual lebih detail (misalnya, sketsa di Figma) atau penyesuaian lebih lanjut pada fitur manajemen penyewa (misalnya, kolom tambahan seperti email atau catatan khusus), silakan beri tahu saya. Terima kasih atas kerja sama dan masukan Anda!
