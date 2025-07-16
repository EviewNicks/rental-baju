# User Story 3: RPK-3

**Title**: Sebagai producer, saya ingin mengelola produk (pakaian) yang tersedia untuk disewa, termasuk menambah, melihat, dan mengedit detail produk, agar saya dapat menjaga inventaris up-to-date.

## Daftar Isi

1. [Pendahuluan](mdc:#pendahuluan)
2. [Asumsi](mdc:#asumsi)
3. [Detail Fitur](mdc:#detail-fitur)
4. [Kriteria Penerimaan](mdc:#kriteria-penerimaan)
5. [Flow Pengguna](mdc:#flow-pengguna)
6. [Evaluasi INVEST](mdc:#evaluasi-invest)
7. [Task Breakdown](mdc:#task-breakdown)

## Pendahuluan

User Story ini fokus pada pengembangan fitur manajemen produk untuk producer dalam sistem rental pakaian. Fitur ini memungkinkan producer untuk mengelola inventaris produk secara efektif dengan kemampuan CRUD (Create, Read, Update, Delete) yang lengkap.

Fitur ini merupakan bagian penting dari sistem rental yang memastikan producer dapat menjaga data produk tetap akurat dan up-to-date, sehingga memudahkan proses penyewaan dan pengelolaan inventaris.

## Asumsi

- Database Supabase sudah disiapkan dengan tabel untuk produk
- Producer sudah terautentikasi melalui Clerk dengan role yang sesuai
- Sistem autentikasi dan otorisasi sudah diimplementasikan (US sebelumnya)
- Storage untuk foto produk perlu dikonfigurasi

## Detail Fitur

### Kemampuan Utama

1. **Menambah Produk Baru**
   - Form input untuk detail produk (kode, nama, deskripsi, harga, jumlah)
   - Upload dan preview foto produk
   - Validasi data sebelum penyimpanan

2. **Melihat Daftar Produk**
   - Tampilan tabel/grid dengan informasi produk
   - Pagination untuk daftar produk yang banyak
   - Filter dan pencarian produk
   - Sorting berdasarkan kolom tertentu

3. **Mengedit Detail Produk**
   - Form edit dengan data yang sudah terisi
   - Kemampuan mengubah semua field produk
   - Preview perubahan sebelum penyimpanan

4. **Menghapus Produk**
   - Konfirmasi sebelum penghapusan
   - Soft delete untuk menjaga integritas data

### Data Model

```prisma
model Product {
  id          String   @id @default(uuid())
  code        String   @unique // 4 digit alfanumerik uppercase (PRD1, DRES2, dll)
  name        String
  description String?
  modalAwal   Decimal  @db.Decimal(10, 2) // Biaya pembuatan baju
  hargaSewa   Decimal  @db.Decimal(10, 2) // Harga sewa per sekali
  quantity    Int
  imageUrl    String?
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  status      ProductStatus @default(AVAILABLE)
  totalPendapatan Decimal @db.Decimal(10, 2) @default(0) // Pendapatan kumulatif
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String   // User ID dari Clerk
}

model Category {
  id        String    @id @default(uuid())
  name      String    @unique
  color     String    // Hex color untuk badge
  products  Product[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  createdBy String    // User ID dari Clerk
}

enum ProductStatus {
  AVAILABLE    // Tersedia
  RENTED       // Disewa
  MAINTENANCE  // Maintenance
}
```

## Kriteria Penerimaan

| Kriteria                                                | Status | Keterangan                         |
| ------------------------------------------------------- | ------ | ---------------------------------- |
| Producer dapat menambah produk baru dengan data valid   | ✅     | UI selesai, backend pending        |
| Producer dapat melihat daftar produk dalam format tabel | ✅     | UI selesai, backend pending        |
| Producer dapat mengedit detail produk yang ada          | ✅     | UI selesai, backend pending        |
| Producer dapat menghapus produk dengan konfirmasi       | ✅     | UI selesai, backend pending        |
| Producer dapat mengelola kategori produk                | ✅     | UI selesai, backend pending        |
| Producer dapat melihat detail produk dengan click       | ✅     | UI selesai, backend pending        |
| Hanya producer yang dapat mengakses fitur ini           | ⏳     | Menunggu backend auth              |
| Validasi form berfungsi dengan baik                     | ✅     | UI validation selesai              |
| Upload foto produk berfungsi                            | ✅     | UI upload selesai, backend pending |

## Flow Pengguna

### 1. Menambah Produk Baru

```
BEGIN
  PRODUCER membuka halaman manage-product
  PRODUCER klik tombol "Tambah Produk"
  SISTEM menampilkan form tambah produk
  PRODUCER mengisi form (kode, nama, deskripsi, harga, jumlah)
  PRODUCER upload foto produk
  PRODUCER klik "Simpan"
  IF data valid THEN
    SISTEM simpan ke database
    SISTEM tampilkan pesan sukses
    SISTEM redirect ke daftar produk
  ELSE
    SISTEM tampilkan pesan error
  ENDIF
END
```

### 2. Melihat Daftar Produk

```
BEGIN
  PRODUCER membuka halaman manage-product
  SISTEM ambil data produk dari database
  SISTEM tampilkan dalam format tabel
  PRODUCER dapat melakukan pencarian/filter
  PRODUCER dapat mengubah halaman (pagination)
END
```

### 3. Mengedit Produk

```
BEGIN
  PRODUCER membuka halaman manage-product
  PRODUCER klik tombol "Edit" pada produk tertentu
  SISTEM tampilkan form edit dengan data terisi
  PRODUCER mengubah data yang diperlukan
  PRODUCER klik "Simpan"
  IF data valid THEN
    SISTEM update database
    SISTEM tampilkan pesan sukses
    SISTEM redirect ke daftar produk
  ELSE
    SISTEM tampilkan pesan error
  ENDIF
END
```

### 4. Melihat Detail Produk

```
BEGIN
  PRODUCER membuka halaman manage-product
  PRODUCER klik pada row produk tertentu
  SISTEM tampilkan modal detail produk
  MODAL menampilkan semua informasi produk
  MODAL menampilkan tombol Edit dan Delete
  PRODUCER dapat melihat history transaksi
END
```

### 5. Mengedit Produk dari Detail

```
BEGIN
  PRODUCER membuka detail produk
  PRODUCER klik tombol "Edit"
  SISTEM tampilkan form edit dengan data terisi
  PRODUCER mengubah data yang diperlukan
  PRODUCER klik "Simpan"
  IF data valid THEN
    SISTEM update database
    SISTEM tampilkan pesan sukses
    SISTEM refresh detail produk
  ELSE
    SISTEM tampilkan pesan error
  ENDIF
END
```

### 6. Menghapus Produk dari Detail

```
BEGIN
  PRODUCER membuka detail produk
  PRODUCER klik tombol "Hapus"
  SISTEM tampilkan dialog konfirmasi
  IF PRODUCER konfirmasi THEN
    SISTEM soft delete produk
    SISTEM tutup modal detail
    SISTEM tampilkan pesan sukses
    SISTEM refresh daftar produk
  ELSE
    SISTEM tutup dialog tanpa aksi
  ENDIF
END
```

### 7. Mengelola Kategori

```
BEGIN
  PRODUCER membuka halaman manage-product
  PRODUCER klik "Kelola Kategori"
  SISTEM tampilkan modal kategori management
  PRODUCER dapat melihat daftar kategori
  PRODUCER dapat menambah kategori baru
  PRODUCER dapat mengedit kategori yang ada
  PRODUCER dapat menghapus kategori (jika tidak digunakan)
END
```

## Evaluasi INVEST

| Kriteria        | Evaluasi | Penjelasan                                                                                                  |
| --------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| **Independent** | ⚠️       | Bergantung pada US sebelumnya untuk autentikasi, tetapi dapat diimplementasikan setelah autentikasi selesai |
| **Negotiable**  | ✅       | Dapat didiskusikan (misalnya, tambahan fitur seperti bulk import/export)                                    |
| **Valuable**    | ✅       | Membantu producer mengelola inventaris secara efektif                                                       |
| **Estimable**   | ✅       | 8 story points (2 hari kerja)                                                                               |
| **Small**       | ✅       | Dapat diselesaikan dalam satu sprint                                                                        |
| **Testable**    | ✅       | Dapat diuji dengan skenario akses untuk berbagai peran                                                      |

## Task Breakdown

### RPK-12: Desain UI Manage-Product

- **Estimasi**: 4 jam
- **Status**: ✅ Complete
- **Deskripsi**: Merancang antarmuka pengguna untuk fitur manajemen produk
- **Deliverables**: Wireframe, mockup, dan komponen UI
- **Hasil**: UI/UX berhasil diimplementasikan dengan 25+ komponen React, responsive design, dan form validation

### RPK-13: Implementasi Backend Manage-Product

- **Estimasi**: 6 jam
- **Deskripsi**: Mengembangkan API CRUD dan logika bisnis untuk produk
- **Deliverables**: API endpoints, services, dan unit tests

### RPK-14: Implementasi Frontend Manage-Product

- **Estimasi**: 6 jam
- **Deskripsi**: Mengembangkan komponen UI dan integrasi dengan backend
- **Deliverables**: React components, hooks, dan integration tests

### RPK-19: E2E Testing Manage-Product

- **Estimasi**: 4 jam
- **Deskripsi**: Menulis dan menjalankan test end-to-end
- **Deliverables**: E2E test scenarios dan test report

## Dependensi

- **Internal**: RPK-12 → RPK-13 → RPK-14 → RPK-19
- **Eksternal**: Sistem autentikasi (US sebelumnya), Database Supabase, Storage untuk foto

## Definition of Done

- [ ] Semua kriteria penerimaan terpenuhi
- [ ] Unit tests dan integration tests berhasil
- [ ] E2E tests berhasil
- [ ] Code review disetujui
- [ ] Dokumentasi lengkap
- [ ] Fitur dapat diakses oleh producer
- [ ] Performa sesuai standar (loading < 2 detik)
