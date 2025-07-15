User Story 2: TSK-02

Title: Sebagai producer, saya ingin mengelola produk (pakaian) yang tersedia untuk disewa, termasuk menambah, melihat, dan mengedit detail produk, agar saya dapat menjaga inventaris up-to-date.

Asumsi

Database Supabase sudah disiapkan dengan tabel untuk produk.

Admin sudah terautentikasi melalui Clerk.

Detail

producer dapat menambah produk baru dengan detail seperti kode, foto, jumlah, dan harga.

producer dapat melihat daftar produk dalam format tabel atau list.

producer dapat mengedit detail produk yang sudah ada.

Kriteria Penerimaan

Given saya adalah admin, when saya mengisi form untuk menambah produk dengan data valid, then produk tersimpan di database.

Given saya adalah admin, when saya membuka halaman daftar produk, then saya dapat melihat semua produk yang ada.

Given saya adalah admin, when saya mengedit detail produk, then perubahan tersimpan di database dan terlihat di daftar.

Flowchart

Start ->
[Tambah Produk] -> <Validasi Data> ->
[Simpan ke Database] -> [Tampilkan Daftar] ->
End

Start ->
[Lihat Daftar] -> [Tampilkan Daftar Produk] ->
End

Start ->
[Edit Produk] -> <Validasi Data> ->
[Update Database] -> [Tampilkan Daftar] ->
End

Evaluasi INVEST

Kriteria

Evaluasi

Independent

Bergantung pada TSK-01 untuk autentikasi, tetapi dapat diimplementasikan setelah autentikasi selesai.

Negotiable

Dapat didiskusikan (misalnya, tambahan fitur seperti hapus).

Valuable

Membantu admin mengelola inventaris.

Estimable

8 story points.

Small

Dapat diselesaikan dalam satu sprint.

Testable

Dapat diuji dengan skenario akses untuk berbagai peran.

Tasks untuk TSK-02

Task 2.1: Desain UI

Task ID: T:02.1

Kaitan User Story: US:02

Deskripsi Detail: Merancang antarmuka pengguna (UI) untuk fitur manajemen produk.

Checklist:

Form tambah produk (termasuk field untuk nama, deskripsi, harga, dan upload foto produk).

Daftar produk (tabel atau grid dengan kolom nama, harga, dan aksi edit/hapus).

Form edit produk (mirip form tambah produk, dengan data yang sudah terisi).

Validasi form (misalnya, pesan error jika field wajib kosong).

Tombol aksi (simpan, batal, hapus).

Estimasi Effort: 4 jam

Owner: [Nama Pengembang]

Definition of Done:

Desain UI berhasil dibuat

semua feature UI terinclude di dlaam wireframe

Dependensi: TSK-01 (autentikasi sudah diimplementasikan).

Catatan Tambahan: Fokus pada pembuatan mockup/wireframe atau implementasi desain di kode (tergantung kebutuhan tim).

Task 2.2: Implementasi Backend

Task ID: T:02.2

Kaitan User Story: US:02

Deskripsi Detail: Mengembangkan logika dan API di sisi backend untuk manajemen produk.

Checklist:

Membuat API CRUD (Create, Read, Update, Delete) untuk produk di Supabase.

Mengelola upload foto produk ke storage Supabase.

Memastikan keamanan API dengan Clerk Auth (hanya pengguna terautentikasi dengan role admin yang bisa mengakses).

unit tets dan integration test utama

Estimasi Effort: 6 jam

Owner: [Nama Pengembang]

Definition of Done:

Dependensi: T:02.1 (custom claims sudah dikonfigurasi).

Catatan Tambahan:

Task 2.3: Implementasi Frontend

Task ID: T:02.3

Kaitan User Story: US:02

Deskripsi Detail: Mengembangkan antarmuka pengguna di sisi frontend dan mengintegrasikannya dengan backend.

Checklist:

Membuat komponen UI seperti tabel produk, form tambah produk, dan form edit produk.

Mengintegrasikan API backend dengan React Query untuk operasi CRUD.

Menambahkan validasi form di sisi frontend (misalnya, cek field kosong sebelum submit).

React Query (untuk manajemen state dan fetching data dari API).

unit tets dan integration test utama

Estimasi Effort: 6 jam

Owner: [Nama Pengembang]

Definition of Done:

Dependensi: T:02.1 dan T:02.2 (claims dikonfigurasi dan dapat diambil).

Catatan Tambahan:

Task 2.4: Menulis Test E2E Case

Task ID: T:02.4

Kaitan User Story: US:02

Deskripsi Detail:Menulis skenario pengujian end-to-end untuk memastikan fitur bekerja dengan baik.

Checklist:

Menulis test case untuk skenario seperti:

Menambah produk baru (termasuk upload foto).

Mengedit produk yang ada.

Menghapus produk.

Memastikan hanya producer dan owner yang bisa mengakses fitur (autentikasi via Clerk Auth).

Menggunakan Playwright untuk pengujian E2E.

Estimasi Effort: 6 jam

Owner: [Nama Pengembang]

Definition of Done:

Dependensi: T:02.1 dan T:02.2 (claims dikonfigurasi dan dapat diambil).

Catatan Tambahan:
