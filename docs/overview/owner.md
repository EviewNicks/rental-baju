# Overview Fitur Owner - Sistem Rental Maguru

## 📋 Ringkasan Role Owner

**Role Owner** adalah pemilik bisnis dengan akses tertinggi dalam sistem rental Maguru. Owner memiliki kontrol penuh terhadap semua aspek operasional, mulai dari manajemen staff, analisis keuangan, hingga pengambilan keputusan strategis.

### Hierarki Akses
```
Owner (Level 3) → Akses Penuh Semua Fitur + Manajemen Staff
Producer (Level 2) → Manajemen Produk + Monitor Kasir  
Kasir (Level 1) → Operasional Transaksi Saja
```

---

## 🎯 Tanggung Jawab Owner

### Tanggung Jawab Utama
1. **Oversight Bisnis** - Pengawasan keseluruhan operasional rental
2. **Manajemen Staff** - Kelola kasir dan karyawan
3. **Analisis Keuangan** - Monitor profitabilitas dan cash flow
4. **Pengambilan Keputusan** - Keputusan strategis bisnis
5. **Export & Reporting** - Laporan untuk accounting dan pajak

### Akses Sistem Owner
- ✅ **Semua Fitur Kasir** - Full access dashboard kasir
- ✅ **Semua Fitur Producer** - Full access manajemen produk
- ✅ **Manajemen Staff** - CRUD kasir dan karyawan
- ✅ **Export Data Keuangan** - CSV export untuk accounting
- ✅ **Analytics Lengkap** - Semua metrics dan laporan
- ✅ **System Settings** - Konfigurasi sistem

---

## 🏗️ Struktur Menu Owner

### Dashboard Utama Owner
**Sidebar Navigation:**
- **Kasir** - Dashboard transaksi dan operasional
- **Dana Kasir** - Manajemen keuangan harian
- **Manage Kasir** - Kelola staff kasir
- **Manage Product** - Kelola katalog produk

### Navigasi Menu
```
Owner Dashboard
├── Kasir Dashboard (Full Access)
├── Dana Kasir (Full Access + Export)
├── Manage Kasir (Owner Only)
│   ├── Daftar Kasir
│   ├── Tambah Kasir
│   ├── Edit Kasir
│   └── Status Management
└── Manage Product (Full Access)
    ├── Kelola Produk
    ├── Cost Items
    └── Kategori
```

---

## 👥 MANAJEMEN STAFF (OWNER ONLY)

### 🧑‍💼 Kelola Kasir

#### 1. Daftar Kasir (`/owner/manage-kasir`)
**Fitur Utama:**
- **List Semua Kasir** - Daftar lengkap staff kasir
- **Search Kasir** - Cari berdasarkan nama
- **Filter Status** - Active/Inactive kasir
- **Summary Statistics** - Total, Active, Inactive count
- **Quick Actions** - Edit, Delete, Toggle Status per kasir

**Informasi yang Ditampilkan:**
- Nama kasir
- Status (Active/Inactive)
- Tanggal bergabung
- Tanggal update terakhir
- Action buttons (Edit, Delete, Toggle)

#### 2. Tambah Kasir Baru (`/owner/manage-kasir/add`)
**Form Tambah Kasir:**
- **Nama Kasir** - Nama lengkap kasir
- **Status** - Active/Inactive (default: Active)
- **Validasi** - Nama tidak boleh kosong
- **Auto-assign** - User ID dari sistem

#### 3. Edit Kasir (`/owner/manage-kasir/edit/[id]`)
**Fitur Edit:**
- **Update Nama** - Ubah nama kasir
- **Toggle Status** - Aktifkan/nonaktifkan kasir
- **Validasi Transaksi** - Cek transaksi aktif sebelum deaktivasi
- **Proteksi Data** - Tidak bisa hapus kasir dengan transaksi aktif

#### 4. Manajemen Status
**Status Control:**
- **Activate Kasir** - Aktifkan kasir untuk bertugas
- **Deactivate Kasir** - Nonaktifkan kasir (dengan validasi)
- **Delete Kasir** - Hapus kasir (jika tidak ada transaksi)
- **Business Logic** - Proteksi data transaksi

---

## 💰 MANAJEMEN KEUANGAN LENGKAP

### 📊 Dana Kasir Dashboard (Owner View)

#### Akses Keuangan Penuh
**Keunggulan Owner:**
- **Lihat Semua Expense** - Tidak ada filter, semua pengeluaran terlihat
- **Filter by Kasir** - Pilih kasir tertentu untuk analisis
- **Complete Visibility** - Akses ke semua data keuangan
- **Role-based Display** - Interface khusus owner

**vs Kasir View:**
- **Kasir**: Hanya lihat expense kasir lain (tidak termasuk owner)
- **Owner**: Lihat semua expense tanpa batasan

#### Daily Summary (Enhanced)
**Komponen Summary:**
- **Total Income** - Pendapatan dari rental + penalty
- **Total Expenses** - Semua pengeluaran kasir
- **Net Balance** - Income - Expenses
- **Breakdown Detail** - Per kasir dan kategori

**Income Sources:**
- Rental transactions (jumlahBayar)
- Late penalties (flatLatePenalty)
- Condition penalties (totalReturnPenalty)
- Return penalties

**Expense Categories:**
- Operational expenses
- Maintenance costs
- Marketing expenses
- Administrative costs
- Miscellaneous expenses

### 📈 Financial Analytics
**Metrics yang Tersedia:**
- **Daily Revenue** - Pendapatan harian
- **Monthly Trends** - Tren bulanan
- **Kasir Performance** - Performa per kasir
- **Expense Analysis** - Analisis pengeluaran
- **Profit Margins** - Margin keuntungan

---

## 📋 EXPORT & REPORTING (OWNER ONLY)

### 💾 CSV Export Feature

#### Export Data Keuangan
**Fitur Export:**
- **Date Range Selection** - Pilih rentang tanggal (max 1 tahun)
- **Complete Data** - Income + Expenses dalam satu file
- **CSV Format** - Compatible dengan Excel dan accounting software
- **Automatic Filename** - `dana-kasir-YYYY-MM-DD-to-YYYY-MM-DD.csv`

**Data yang Di-export:**
- **Income Entries**: Transaksi rental dan penalty
- **Expense Entries**: Semua pengeluaran kasir
- **Detailed Columns**:
  - Tanggal
  - Tipe (Income/Expense)
  - Kode Transaksi
  - Nama Customer
  - Kategori
  - Deskripsi
  - Jumlah Rental
  - Jumlah Penalty
  - Total Jumlah
  - Kasir ID
  - Nama Kasir

#### Export Dialog
**User Experience:**
- **Date Picker** - Pilih start dan end date
- **Validation** - Validasi rentang tanggal
- **Progress Indicator** - Loading saat generate CSV
- **Download Automatic** - File langsung terdownload
- **Error Handling** - Clear error messages

### 📊 Reporting Capabilities
**Laporan yang Tersedia:**
- **Daily Financial Report** - Laporan harian
- **Monthly Summary** - Ringkasan bulanan
- **Kasir Performance Report** - Performa kasir
- **Product Profitability** - Profitabilitas produk
- **Expense Analysis** - Analisis pengeluaran

---

## 🔐 KONTROL AKSES & KEAMANAN

### 🛡️ Owner-Only Features

#### Fitur Eksklusif Owner
**Yang HANYA Owner Bisa Lakukan:**
1. **Create/Edit/Delete Kasir** - Manajemen staff lengkap
2. **Export Financial Data** - CSV export untuk accounting
3. **View All Expenses** - Tanpa filter atau batasan
4. **System Analytics** - Analytics level sistem
5. **Break-even Analysis** - Analisis profitabilitas produk
6. **User Management** - Invite dan manage users
7. **System Settings** - Konfigurasi sistem
8. **Content Moderation** - Moderasi konten sistem

#### Permission Matrix
```
Feature                 | Owner | Producer | Kasir
------------------------|-------|----------|-------
Manage Kasir           |   ✅   |    ❌     |   ❌
Export Financial Data  |   ✅   |    ❌     |   ❌
View All Expenses      |   ✅   |    ❌     |   ❌
System Analytics       |   ✅   |    ❌     |   ❌
Break-even Analysis    |   ✅   |    ✅     |   ❌
Manage Products        |   ✅   |    ✅     |   ❌
Process Transactions   |   ✅   |    ✅     |   ✅
```

### 🔒 Security Features
**Proteksi Keamanan:**
- **Role Validation** - Setiap request divalidasi role
- **Route Protection** - Middleware level protection
- **Rate Limiting** - Prevent abuse
- **Session Management** - Clerk authentication
- **Data Validation** - Input validation di semua level
- **Audit Trail** - Log semua aktivitas owner

---

## 📱 Interface Owner

### 🏪 Owner Dashboard

#### Layout Khusus Owner
**Owner Sidebar:**
- **Gradient Background** - Red-pink gradient theme
- **Logo Erlima Mode** - Branding konsisten
- **Navigation Menu** - 4 main sections
- **Footer Info** - Version dan copyright

**Main Content Area:**
- **Full Width** - Margin left 64 (sidebar width)
- **Responsive Design** - Mobile overlay untuk sidebar
- **Consistent Styling** - Theme merah-pink

#### Dashboard Components
**KasirListPage (Owner View):**
- **Enhanced Table** - Sortable columns
- **Action Buttons** - Edit, Delete, Toggle per row
- **Status Indicators** - Color-coded status
- **Search & Filter** - Real-time search
- **Pagination** - Handle large kasir lists

**DanaKasirDashboard (Owner View):**
- **Role-based Display** - Owner-specific features
- **Export Button** - Prominent export access
- **Complete Data** - No filtered data
- **Kasir Filter** - Optional kasir selection

---

## 🚀 Workflow Owner

### 📝 Alur Kerja Harian

#### 1. Morning Review
```
1. Login → Owner dashboard
2. Cek dana kasir summary hari sebelumnya
3. Review transaksi dan revenue
4. Monitor kasir performance
5. Cek expense yang perlu approval
```

#### 2. Staff Management
```
1. Review kasir activity
2. Handle kasir issues jika ada
3. Update kasir status jika diperlukan
4. Add new kasir jika butuh staff tambahan
```

#### 3. Financial Analysis
```
1. Analyze daily/weekly trends
2. Compare dengan target revenue
3. Review expense patterns
4. Export data untuk accounting (bulanan)
```

#### 4. Strategic Planning
```
1. Review product performance
2. Analyze customer trends
3. Plan inventory adjustments
4. Make pricing decisions
```

### 🔄 Integration dengan Role Lain

#### Owner → Producer
- **Product Strategy** - Guidance untuk product management
- **Cost Analysis** - Review cost items dan profitability
- **Inventory Planning** - Strategic inventory decisions

#### Owner → Kasir
- **Performance Monitoring** - Track kasir metrics
- **Training Needs** - Identify training requirements
- **Operational Support** - Support untuk daily operations

---

## 📊 ANALYTICS & INSIGHTS

### 📈 Business Intelligence

#### Key Metrics untuk Owner
**Financial Metrics:**
- **Daily Revenue** - Pendapatan harian
- **Monthly Growth** - Pertumbuhan bulanan
- **Profit Margins** - Margin keuntungan
- **Cost Ratio** - Rasio biaya operasional
- **ROI per Product** - Return on investment produk

**Operational Metrics:**
- **Transaction Volume** - Volume transaksi
- **Customer Retention** - Retensi customer
- **Kasir Performance** - Performa kasir
- **Product Utilization** - Utilisasi produk
- **Inventory Turnover** - Perputaran inventory

#### Break-even Analysis
**Product Profitability:**
- **Modal Awal vs Revenue** - Analisis break-even
- **Cost Item Efficiency** - Efisiensi biaya produksi
- **Rental Frequency** - Frekuensi rental untuk BEP
- **Profit per Category** - Profit per kategori produk

---

## 💡 Tips & Best Practices

### 📋 Manajemen Bisnis Efektif

#### Staff Management
- **Regular Performance Review** - Review performa kasir berkala
- **Clear Role Definition** - Definisi role yang jelas
- **Training Program** - Program training untuk kasir baru
- **Incentive System** - Sistem insentif berdasarkan performa

#### Financial Management
- **Daily Monitoring** - Monitor keuangan harian
- **Monthly Export** - Export data bulanan untuk accounting
- **Expense Control** - Kontrol pengeluaran dengan approval
- **Profit Analysis** - Analisis profit per produk/kategori

#### Strategic Planning
- **Data-Driven Decisions** - Keputusan berdasarkan data
- **Market Analysis** - Analisis pasar dan kompetitor
- **Seasonal Planning** - Perencanaan berdasarkan musim
- **Growth Strategy** - Strategi pertumbuhan bisnis

### 🎯 Optimasi Operasional

#### System Usage
- **Regular Data Export** - Export data secara berkala
- **Monitor System Health** - Monitor kesehatan sistem
- **User Training** - Training untuk staff baru
- **Backup Strategy** - Strategi backup data

#### Performance Monitoring
- **KPI Tracking** - Track KPI bisnis
- **Trend Analysis** - Analisis tren bisnis
- **Benchmark Setting** - Set benchmark performa
- **Continuous Improvement** - Perbaikan berkelanjutan

---

## 🔮 Fitur Mendatang

### 📋 Enhancement yang Direncanakan

#### Advanced Analytics
- **Predictive Analytics** - Prediksi demand dan revenue
- **Customer Segmentation** - Segmentasi customer
- **Market Intelligence** - Intelligence pasar
- **Automated Reporting** - Laporan otomatis

#### System Integration
- **Accounting Software** - Integrasi dengan software akuntansi
- **Payment Gateway** - Integrasi payment gateway
- **CRM Integration** - Integrasi dengan CRM
- **Mobile App** - Mobile app untuk owner

#### Advanced Features
- **Multi-location Support** - Support multiple lokasi
- **Franchise Management** - Manajemen franchise
- **Advanced Permissions** - Permission yang lebih granular
- **API Access** - API untuk integrasi eksternal

---

*Dokumentasi ini memberikan overview lengkap fitur Owner dalam sistem rental Maguru dengan fokus pada kontrol bisnis dan pengambilan keputusan strategis.*