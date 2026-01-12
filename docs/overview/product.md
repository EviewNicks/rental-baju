# Overview Fitur Producer - Sistem Rental Maguru

## 📋 Ringkasan Role Producer

**Role Producer** adalah manajer produk dalam sistem rental Maguru yang bertanggung jawab mengelola katalog produk, inventory, dan pricing. Producer memiliki akses menengah dengan fokus pada operasional produk dan dapat memonitor dashboard kasir.

### Hierarki Akses
```
Owner (Level 3) → Akses Penuh Semua Fitur
Producer (Level 2) → Manajemen Produk + Monitor Kasir  
Kasir (Level 1) → Operasional Transaksi Saja
```

---

## 🎯 Tanggung Jawab Producer

### Tanggung Jawab Utama
1. **Manajemen Katalog Produk** - Tambah, edit, hapus produk rental
2. **Kontrol Inventory** - Monitor stok, ketersediaan, dan kondisi produk
3. **Penetapan Harga** - Set harga sewa dan kelola biaya produksi
4. **Perencanaan Stok** - Analisis kebutuhan dan restock produk
5. **Quality Control** - Pastikan kualitas dan kondisi produk

### Akses Sistem
- ✅ **Kelola Produk** - CRUD produk lengkap dengan gambar
- ✅ **Kelola Cost Items** - Manajemen biaya produksi
- ✅ **Kelola Kategori** - Organisasi produk berdasarkan jenis
- ✅ **Monitor Dashboard Kasir** - Lihat transaksi dan revenue
- ✅ **Laporan Keuangan** - Akses ringkasan pendapatan
- ❌ **Fitur Owner** - Tidak dapat akses manajemen staff

---

## 🏗️ Struktur Menu Producer

### Dashboard Utama (`/producer/manage-product`)
- **Daftar Produk** - List semua produk dengan search dan filter
- **Tambah Produk** - Form untuk menambah produk baru
- **Edit Produk** - Ubah informasi produk existing
- **Detail Produk** - Lihat informasi lengkap produk
- **Kelola Data Master** - Manajemen cost items dan kategori

### Navigasi Menu
```
Producer Dashboard
├── Daftar Produk (List & Search)
├── Tambah Produk Baru
├── Edit Produk
├── Detail Produk
└── Kelola Data Master
    ├── Cost Items
    └── Kategori Produk
```

---

## 🛍️ FITUR MANAJEMEN PRODUK

### 📦 Kelola Produk

#### 1. Daftar Produk
**Fitur Utama:**
- **Pencarian Cerdas** - Cari berdasarkan nama, kode, atau deskripsi
- **Filter Multi-Kriteria** - Filter by kategori, status, ukuran
- **Tampilan Fleksibel** - Mode tabel atau grid view
- **Pagination** - Navigasi halaman dengan 20 item per halaman
- **Sorting** - Urutkan berdasarkan nama, tanggal, harga

**Informasi yang Ditampilkan:**
- Kode dan nama produk
- Kategori dan status
- Harga sewa saat ini
- Stok tersedia vs total
- Gambar produk (thumbnail)
- Action buttons (View, Edit, Delete)

#### 2. Tambah Produk Baru
**Form Dinamis Berdasarkan Kategori:**

**Informasi Dasar:**
- **Kode Produk** - 4-5 digit unik (contoh: PRD01)
- **Nama Produk** - Nama yang mudah diingat
- **Kategori** - Pilih dari dropdown (Baju, Sarung, Anting, dll)
- **Deskripsi** - Penjelasan detail produk (opsional)
- **Harga Sewa** - Harga per hari/periode

**Upload Gambar:**
- Support format JPEG, PNG, WebP
- Maksimal ukuran 5MB
- Drag & drop atau klik untuk upload
- Preview gambar sebelum save

**Manajemen Ukuran (Otomatis berdasarkan kategori):**

**Untuk Pakaian (Baju, Celana):**
- Pilih ukuran: XS, S, M, L, XL, XXL
- Input jumlah stok per ukuran
- Kategori umur: Dewasa, Anak

**Untuk Aksesoris Berdasarkan Umur (Sarung, Songket):**
- Input jumlah untuk Dewasa
- Input jumlah untuk Anak
- Sistem otomatis buat 2 varian

**Untuk Aksesoris Universal (Anting, Gelang):**
- Input total jumlah saja
- Tidak ada pembagian ukuran/umur

#### 3. Edit Produk
**Fitur Edit:**
- **Update Informasi** - Ubah nama, deskripsi, harga
- **Ganti Gambar** - Upload gambar baru atau hapus existing
- **Modifikasi Stok** - Tambah/kurangi jumlah (dengan validasi rental)
- **Update Cost Items** - Tambah/hapus biaya produksi
- **Proteksi Rental** - Tidak bisa kurangi stok di bawah yang sedang disewa

#### 4. Detail Produk
**Informasi Lengkap:**
- Data produk lengkap (kode, nama, kategori, harga)
- Breakdown stok per ukuran dan kategori umur
- Status inventory (tersedia, disewa, hilang)
- Daftar cost items dengan nominal
- Riwayat perubahan produk
- Metrics utilization rate

### 💰 Sistem Cost Items (Biaya Produksi)

#### Kelola Cost Items
**Fitur Cost Items:**
- **Daftar Cost Items** - List semua item biaya dengan search
- **Tambah Cost Item** - Buat item biaya baru (contoh: Kain, Jahit, Transport)
- **Edit Cost Item** - Ubah nama cost item
- **Hapus Cost Item** - Hapus jika tidak digunakan produk

#### Integrasi dengan Produk
**Producer Flow vs Owner Flow:**

**Mode Producer (Default):**
- Producer bisa buat produk tanpa cost items
- Modal awal otomatis = Rp0
- Tampil badge "Producer Mode"
- Cocok untuk producer yang fokus operasional

**Mode Owner (Dengan Cost Items):**
- Tambahkan cost items ke produk
- Modal awal = total semua cost items
- Kalkulasi otomatis real-time
- Cocok untuk analisis profitabilitas

**Cara Kerja Cost Item Selector:**
1. Ketik nama cost item di search box
2. Pilih dari dropdown atau buat baru
3. Input nominal biaya
4. Modal awal terupdate otomatis
5. Bisa tambah multiple cost items
6. Hapus dengan tombol X

---

## 🎨 SISTEM KATEGORI PRODUK

### 📋 Tiga Jenis Kategori

#### 1. Pakaian (Clothing)
**Contoh Produk:** Baju, Celana, Gaun, Dress

**Karakteristik:**
- Pilihan ukuran: XS, S, M, L, XL, XXL, UNIVERSAL
- Kategori umur: Dewasa, Anak
- Input stok per ukuran yang dipilih
- Cocok untuk produk dengan variasi ukuran banyak

#### 2. Aksesoris Berdasarkan Umur
**Contoh Produk:** Sarung, Songket

**Karakteristik:**
- Hanya 2 input: Jumlah Dewasa, Jumlah Anak
- Sistem otomatis buat 2 varian produk
- Cocok untuk produk yang dibedakan berdasarkan umur

#### 3. Aksesoris Universal
**Contoh Produk:** Anting, Gelang, Kalung

**Karakteristik:**
- Hanya 1 input: Total jumlah
- Tidak ada pembagian ukuran atau umur
- Cocok untuk produk one-size-fits-all

### 🔄 Form Dinamis
**Keunggulan Sistem:**
- Form berubah otomatis saat pilih kategori
- Validasi berbeda per jenis kategori
- User experience yang intuitif
- Mengurangi kesalahan input

---

## 📱 Interface Producer

### 🏪 Dashboard Produk

#### Tampilan Utama
**Header Dashboard:**
- Judul halaman dengan breadcrumb
- Tombol "Tambah Produk" yang prominent
- Search bar untuk pencarian cepat

**Filter & Search:**
- Search box dengan placeholder yang jelas
- Dropdown filter kategori
- Filter status (Tersedia, Disewa, Maintenance)
- Toggle view mode (Tabel/Grid)
- Tombol clear filters

**Tabel Produk:**
- Kolom sortable (klik header untuk sort)
- Thumbnail gambar produk
- Status dengan color coding
- Action buttons per row
- Pagination di bawah tabel

#### Mode Grid View
- Card layout untuk visual yang lebih menarik
- Gambar produk lebih besar
- Info penting di card
- Hover effects untuk interaksi

### 🎨 Form Produk

#### Layout Form
**Bagian Informasi Dasar:**
- Input kode produk dengan validasi
- Input nama produk
- Dropdown kategori dengan loading state
- Text area deskripsi (opsional)

**Bagian Upload Gambar:**
- Area drag & drop yang jelas
- Preview gambar yang diupload
- Tombol hapus gambar
- Progress bar saat upload

**Bagian Ukuran (Dinamis):**
- Berubah berdasarkan kategori yang dipilih
- Checkbox untuk ukuran (Pakaian)
- Input number untuk quantity
- Validasi minimal 1 ukuran

**Bagian Pricing:**
- Input harga sewa dengan format Rupiah
- Display modal awal (auto-calculated)
- Badge mode Producer/Owner

**Bagian Cost Items (Opsional):**
- Search box untuk cari cost items
- Dropdown dengan autocomplete
- Input amount per cost item
- List cost items yang sudah dipilih
- Total modal awal real-time

---

## 🔐 Keamanan & Validasi

### 🛡️ Kontrol Akses
**Proteksi Route:**
- Hanya Owner dan Producer yang bisa akses `/producer/*`
- Redirect ke `/unauthorized` jika tidak punya akses
- Session validation dengan Clerk

**Proteksi Data:**
- Tidak bisa kurangi stok di bawah yang sedang disewa
- Tidak bisa hapus produk dengan rental aktif
- Validasi input di frontend dan backend

### ✅ Validasi Input
**Validasi Produk:**
- Kode produk: 4-5 karakter alphanumeric
- Nama produk: 3-100 karakter
- Harga: harus angka positif
- Minimal 1 ukuran dengan stok > 0

**Validasi Gambar:**
- Format: JPEG, PNG, WebP saja
- Ukuran maksimal: 5MB
- Error message yang jelas

**Validasi Cost Items:**
- Nama cost item: tidak boleh kosong
- Amount: harus angka non-negatif
- Nama harus unik

---

## 📊 Monitoring & Laporan

### 📈 Metrics Produk
**Informasi yang Bisa Dimonitor:**
- **Utilization Rate** - Persentase produk yang sedang disewa
- **Revenue per Product** - Pendapatan per produk
- **Rental Frequency** - Seberapa sering produk disewa
- **Stock Health** - Status kesehatan inventory
- **Popular Products** - Produk paling laris

### 📋 Dashboard Kasir (View-Only)
**Akses Monitoring:**
- Lihat transaksi harian
- Monitor revenue dan pembayaran
- Cek status rental produk
- Lihat customer activity
- Tidak bisa edit data transaksi

---

## 🚀 Workflow Producer

### 📝 Alur Kerja Harian

#### 1. Morning Check
```
1. Login → Masuk dashboard produk
2. Cek notifikasi stok rendah
3. Review produk yang akan dikembalikan hari ini
4. Update status produk jika ada maintenance
```

#### 2. Manajemen Produk
```
1. Tambah produk baru jika ada
2. Update harga berdasarkan demand
3. Upload foto produk yang lebih baik
4. Tambah cost items untuk analisis profit
```

#### 3. Monitoring Operasional
```
1. Cek dashboard kasir untuk melihat transaksi
2. Monitor utilization rate produk
3. Identifikasi produk yang jarang disewa
4. Planning restock atau retirement produk
```

### 🔄 Integrasi dengan Kasir

#### Data yang Digunakan Kasir
- **Daftar Produk** - Untuk pilihan customer
- **Harga Sewa** - Untuk kalkulasi transaksi
- **Stok Tersedia** - Untuk validasi ketersediaan
- **Gambar Produk** - Untuk preview customer
- **Ukuran Available** - Untuk pilihan size

#### Update Real-time
- **Pickup** - Stok berkurang otomatis
- **Return** - Stok bertambah sesuai kondisi
- **Lost Items** - Update stok hilang
- **Damage** - Update status maintenance

---

## 💡 Tips & Best Practices

### 📋 Manajemen Produk Efektif

#### Penamaan Produk
- Gunakan nama yang deskriptif dan mudah dicari
- Konsisten dengan konvensi penamaan
- Hindari singkatan yang membingungkan

#### Manajemen Stok
- Set reorder point untuk setiap produk
- Monitor utilization rate secara berkala
- Retire produk yang jarang disewa

#### Pricing Strategy
- Review harga secara berkala
- Pertimbangkan seasonal demand
- Gunakan cost items untuk analisis profitabilitas

#### Quality Control
- Upload foto produk yang berkualitas
- Update deskripsi produk secara detail
- Maintain kondisi produk dengan baik

### 🎯 Optimasi Operasional

#### Kategorisasi yang Baik
- Gunakan kategori yang konsisten
- Buat kategori berdasarkan usage pattern
- Jangan terlalu banyak kategori

#### Cost Item Management
- Buat cost items yang spesifik
- Update cost secara berkala
- Gunakan untuk analisis ROI

---

## 🔮 Fitur Mendatang

### 📋 Enhancement yang Direncanakan

#### Advanced Analytics
- Predictive demand forecasting
- Seasonal trend analysis
- Customer preference insights
- Profitability analysis per produk

#### Bulk Operations
- Bulk edit multiple produk
- Bulk price updates
- Bulk status changes
- Import/export produk via CSV

#### Integration Features
- Sync dengan accounting software
- Integration dengan supplier
- Mobile app untuk producer
- Real-time notifications

---

*Dokumentasi ini memberikan overview lengkap fitur Producer dalam sistem rental Maguru dengan fokus pada kemudahan penggunaan dan efisiensi operasional.*