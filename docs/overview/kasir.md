# Project Charter - Sistem Manajemen Rental Maguru

## 📋 Ringkasan Proyek

**Nama Proyek:** Maguru - Sistem Manajemen Rental  
**Versi:** 1.0  
**Tanggal:** Januari 2025  
**Platform:** Next.js 14, TypeScript, Prisma, Clerk Auth  

### Deskripsi Proyek
Maguru adalah sistem manajemen rental komprehensif yang dirancang untuk mengelola operasional bisnis rental dengan tiga level akses: Owner, Producer, dan Kasir. Sistem ini mengintegrasikan manajemen inventory, transaksi, pembayaran, dan keuangan dalam satu platform yang user-friendly.

---

## 🎯 Tujuan Proyek

### Tujuan Utama
1. **Digitalisasi Operasional Rental** - Mengotomatisasi proses manual menjadi sistem digital terintegrasi
2. **Kontrol Keuangan Real-time** - Tracking pendapatan, pengeluaran, dan cash flow harian
3. **Manajemen Inventory Efisien** - Monitoring stok, ketersediaan, dan kondisi produk
4. **Role-based Access Control** - Pembagian akses sesuai tanggung jawab masing-masing role
5. **Audit Trail Lengkap** - Pelacakan aktivitas dan perubahan data untuk akuntabilitas

### Manfaat Bisnis
- Mengurangi human error dalam pencatatan transaksi
- Meningkatkan efisiensi operasional harian
- Kontrol keuangan yang lebih ketat dan transparan
- Laporan real-time untuk pengambilan keputusan
- Skalabilitas untuk pertumbuhan bisnis

---

## 👥 Stakeholder & Role Definition

### 1. OWNER (Pemilik Bisnis)
**Tanggung Jawab:**
- Oversight keseluruhan operasional bisnis
- Manajemen staff dan karyawan
- Analisis keuangan dan profitabilitas
- Pengambilan keputusan strategis

**Akses Sistem:**
- Full access ke semua fitur dan data
- Dashboard analytics lengkap
- Export data untuk accounting
- Manajemen user dan permissions

### 2. PRODUCER (Manajer Produk)
**Tanggung Jawab:**
- Manajemen katalog produk
- Kontrol kualitas dan kondisi produk
- Pricing dan cost management
- Inventory planning

**Akses Sistem:**
- Manajemen produk dan kategori
- Cost item management
- View-only access ke data transaksi
- Dashboard operasional

### 3. KASIR (Cashier/Front Office)
**Tanggung Jawab:**
- Operasional transaksi harian
- Customer service dan registration
- Proses pickup dan return
- Manajemen kas harian

**Akses Sistem:**
- Transaction management
- Customer management
- Payment processing
- Dana kasir management

---

## 🏗️ Arsitektur Sistem

### Tech Stack
- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL
- **Authentication:** Clerk
- **Testing:** Jest, Playwright
- **Deployment:** Vercel/Custom Server

### Struktur Aplikasi
```
rental-software/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Kasir routes
│   ├── owner/             # Owner routes  
│   ├── producer/          # Producer routes
│   └── api/               # API endpoints
├── features/              # Feature-based modules
│   ├── kasir/            # Kasir functionality
│   ├── manage-product/   # Product management
│   ├── dana-kasir/       # Financial management
│   └── auth/             # Authentication
├── components/           # Shared UI components
├── lib/                  # Utilities & configurations
└── prisma/              # Database schema & migrations
```

---

## 🎭 DETAIL FITUR KASIR

### 🏪 Dashboard Kasir (`/dashboard`)

#### Komponen Utama
- **TransactionsDashboard** - Overview statistik dan metrics
- **TransactionsTable** - Daftar transaksi dengan pagination
- **TransactionTabs** - Navigasi berdasarkan status transaksi
- **QuickActions** - Tombol aksi cepat untuk operasi umum

#### Fitur Dashboard
1. **Real-time Statistics**
   - Total transaksi (aktif, selesai, terlambat, dibatalkan)
   - Revenue harian dan bulanan
   - Completion rate dan overdue rate
   - Customer metrics (total, baru, aktif)

2. **Transaction Overview**
   - Daftar transaksi dengan filter dan sorting
   - Status indicators dengan color coding
   - Quick preview informasi customer dan produk
   - Action buttons untuk setiap transaksi

3. **Alerts & Notifications**
   - Transaksi yang mendekati deadline
   - Stok produk yang rendah
   - Pembayaran yang tertunda
   - Customer dengan riwayat bermasalah

### 💰 Manajemen Transaksi

#### 1. Pembuatan Transaksi Baru (`/dashboard/new`)

**Flow Pembuatan Transaksi:**

**Step 1: Cashier Selection**
- **CashierSelectionStep** - Pilih kasir yang bertugas
- Validasi shift dan availability kasir
- Assignment tracking untuk audit

**Step 2: Customer Information**
- **CustomerBiodataStep** - Input/pilih data customer
- **CustomerRegistrationModal** - Daftar customer baru jika diperlukan
- Validasi data customer (KTP, kontak, alamat)
- Customer history dan credit check

**Step 3: Product Selection**
- **ProductSelectionStep** - Pilih produk dan kuantitas
- Real-time availability checking
- Size dan age category selection
- Automatic pricing calculation
- Inventory reservation

**Step 4: Payment Summary**
- **PaymentSummaryStep** - Review dan konfirmasi
- Breakdown biaya (rental, deposit, tax)
- Payment method selection
- Terms and conditions agreement
- Final confirmation

#### 2. Detail Transaksi (`/dashboard/transaction/[kode]`)

**Komponen Detail:**
- **TransactionDetailPage** - Container utama
- **ProductDetailCard** - Info produk yang dirental
- **CustomerInfoCard** - Data lengkap customer
- **KasirInfoCard** - Info kasir yang menangani
- **PaymentSummaryCard** - Breakdown pembayaran
- **ActivityTimeline** - Riwayat aktivitas transaksi

**Informasi yang Ditampilkan:**
- Kode transaksi dan status
- Tanggal rental dan return
- Daftar produk dengan size dan kuantitas
- Customer information lengkap
- Payment history dan outstanding
- Activity log dengan timestamp

#### 3. Operasi Transaksi

**Pickup Operations:**
- **PickupModal** - Interface proses pengambilan
- Validasi ketersediaan barang
- Quantity confirmation
- Condition check sebelum pickup
- Update inventory otomatis
- Generate pickup receipt

**Payment Processing:**
- **PaymentModal** - Interface pembayaran
- Multiple payment methods support
- Partial payment handling
- Change calculation
- Payment receipt generation
- Outstanding balance tracking

**Transaction Cancellation:**
- **CancelModal** - Interface pembatalan
- Cancellation reason tracking
- Refund calculation
- Inventory restoration
- Cancellation fee handling

**Lost Item Resolution:**
- **LostItemResolutionModal** - Penanganan barang hilang
- Lost item penalty calculation
- Insurance claim processing
- Replacement item handling
- Customer liability agreement

### 📦 Sistem Pickup & Return

#### Pickup System
**Fitur Pickup:**
- **Pre-pickup Validation** - Cek ketersediaan dan kondisi
- **Quantity Verification** - Konfirmasi jumlah yang diambil
- **Condition Documentation** - Foto dan catatan kondisi
- **Inventory Update** - Update stok otomatis
- **Customer Confirmation** - Tanda terima pickup

**Error Handling:**
- Insufficient stock handling
- Damaged item replacement
- Customer no-show procedures
- System failure recovery

#### Return Processing
**Return Components:**
- **SimpleReturnForm** - Return standar
- **UnifiedConditionForm** - Assessment kondisi barang
- **ConditionPricingForm** - Kalkulasi biaya berdasarkan kondisi
- **TransactionLookup** - Pencarian transaksi untuk return

**Return Features:**
1. **Condition Assessment**
   - Visual inspection checklist
   - Damage documentation dengan foto
   - Condition scoring system
   - Repair cost estimation

2. **Penalty Calculation**
   - Late return penalty
   - Damage penalty berdasarkan kondisi
   - Lost item replacement cost
   - Cleaning fee calculation

3. **Refund Processing**
   - Deposit refund calculation
   - Penalty deduction
   - Refund method selection
   - Refund receipt generation

### 👥 Manajemen Customer

#### Customer Registration
- **CustomerRegistrationModal** - Form pendaftaran customer baru
- **Data Validation** - Validasi KTP, kontak, alamat
- **Credit Check** - Assessment kelayakan customer
- **Document Upload** - Upload KTP dan dokumen pendukung

#### Customer Management
- **CustomerEditModal** - Edit data customer
- **Customer History** - Riwayat rental dan pembayaran
- **Customer Rating** - Rating berdasarkan track record
- **Blacklist Management** - Manajemen customer bermasalah

#### Customer Features
1. **Profile Management**
   - Personal information
   - Contact details
   - Emergency contact
   - Preferred payment method

2. **Rental History**
   - Transaction history
   - Payment history
   - Return history
   - Penalty history

3. **Customer Analytics**
   - Rental frequency
   - Average transaction value
   - Payment behavior
   - Customer lifetime value

### 💳 Sistem Pembayaran

#### Payment Processing
**Payment Features:**
1. **Multiple Payment Methods**
   - Cash payment
   - Bank transfer
   - E-wallet (GoPay, OVO, DANA)
   - Credit/Debit card
   - Installment payment

2. **Payment Tracking**
   - Payment status monitoring
   - Outstanding balance tracking
   - Payment reminder system
   - Late payment penalty

3. **Receipt Management**
   - Digital receipt generation
   - Print receipt option
   - Email receipt delivery
   - Receipt history

#### Financial Integration
- **Automatic Journal Entry** - Integration dengan accounting
- **Tax Calculation** - PPN dan tax handling
- **Revenue Recognition** - Proper revenue recording
- **Reconciliation** - Bank reconciliation support

### 📊 Dana Kasir (`/dashboard/dana-kasir`)

#### Financial Dashboard
**DanaKasirDashboard Components:**
- **Daily Summary Card** - Ringkasan kas harian
- **Income Tracking** - Pendapatan dari transaksi
- **Expense Management** - Pengeluaran operasional
- **Cash Flow Chart** - Grafik aliran kas

#### Income Management
**Automatic Income Tracking:**
- Transaction revenue recording
- Payment method breakdown
- Daily income summary
- Monthly income trends
- Revenue by product category

#### Expense Management
**Manual Expense Entry:**
1. **Expense Categories**
   - Operational expenses
   - Maintenance costs
   - Marketing expenses
   - Administrative costs
   - Miscellaneous expenses

2. **Expense Features**
   - **Create Expense** - Input pengeluaran baru
   - **Edit Own Expenses** - Edit pengeluaran sendiri
   - **Delete Own Expenses** - Hapus pengeluaran sendiri
   - **Expense Approval** - Workflow approval untuk expense besar
   - **Receipt Upload** - Upload bukti pengeluaran

#### Daily Cash Management
**Cash Summary Features:**
1. **Opening Balance** - Saldo awal kas
2. **Total Income** - Total pendapatan hari ini
3. **Total Expenses** - Total pengeluaran hari ini
4. **Closing Balance** - Saldo akhir kas
5. **Cash Variance** - Selisih kas fisik vs sistem

**Reconciliation Process:**
- Physical cash count
- System balance comparison
- Variance investigation
- Adjustment entry
- Daily closing report

### 📋 Inventory Management

#### Stock Tracking
**Real-time Inventory:**
1. **Product Availability**
   - Available quantity per size
   - Reserved quantity
   - Rented quantity
   - Lost/damaged quantity

2. **Size Management**
   - Age category (Infant, Child, Teen, Adult)
   - Size variants per category
   - Size-specific availability
   - Size conversion matrix

3. **Status Tracking**
   - Available for rent
   - Currently rented
   - Under maintenance
   - Lost/damaged
   - Retired/discontinued

#### Low Stock Management
**Alert System:**
- **Low Stock Alerts** - Notifikasi stok rendah
- **Reorder Points** - Automatic reorder suggestions
- **Stock Forecasting** - Prediksi kebutuhan stok
- **Seasonal Adjustments** - Penyesuaian stok musiman

### 🔍 Sistem Pencarian & Filter

#### Advanced Search
**Search Capabilities:**
1. **Transaction Search**
   - Search by transaction code
   - Search by customer name/phone
   - Search by product name
   - Search by date range

2. **Customer Search**
   - Search by name
   - Search by phone number
   - Search by ID number
   - Search by email

3. **Product Search**
   - Search by product name
   - Search by category
   - Search by size
   - Search by availability

#### Filtering System
**Filter Options:**
1. **Transaction Filters**
   - Status filter (Active, Completed, Overdue, Cancelled)
   - Date range filter
   - Customer filter
   - Kasir filter
   - Payment status filter

2. **Advanced Filters**
   - Amount range filter
   - Duration filter
   - Product category filter
   - Size filter
   - Condition filter

#### Sorting & Pagination
**Data Management:**
- Multi-column sorting
- Configurable page size
- Infinite scroll option
- Export filtered results
- Saved filter presets

### 🔐 Security & Audit

#### Access Control
**Kasir Permissions:**
- Create and manage own transactions
- View assigned customer data
- Process payments and returns
- Manage own expenses
- View inventory data (read-only)

#### Audit Trail
**Activity Logging:**
1. **Transaction Activities**
   - Transaction creation
   - Status changes
   - Payment processing
   - Pickup/return activities
   - Cancellations

2. **Financial Activities**
   - Payment entries
   - Expense entries
   - Cash adjustments
   - Refund processing

3. **System Activities**
   - Login/logout
   - Data modifications
   - Error occurrences
   - System access

#### Data Protection
**Security Measures:**
- Role-based access control
- Data encryption at rest
- Secure API endpoints
- Session management
- Input validation and sanitization

---

## 📈 Metrics & KPI

### Operational Metrics
1. **Transaction Metrics**
   - Transaction volume per day/month
   - Average transaction value
   - Completion rate
   - Cancellation rate
   - Overdue rate

2. **Customer Metrics**
   - New customer acquisition
   - Customer retention rate
   - Customer satisfaction score
   - Average customer lifetime value

3. **Inventory Metrics**
   - Inventory turnover rate
   - Product utilization rate
   - Lost/damaged item rate
   - Maintenance frequency

### Financial Metrics
1. **Revenue Metrics**
   - Daily/monthly revenue
   - Revenue per product category
   - Revenue per kasir
   - Payment method distribution

2. **Cost Metrics**
   - Operational expense ratio
   - Cost per transaction
   - Maintenance cost ratio
   - Lost item cost impact

3. **Profitability Metrics**
   - Gross profit margin
   - Net profit margin
   - ROI per product
   - Break-even analysis

---

## 🚀 Implementation Roadmap

### Phase 1: Core Kasir Features (Completed)
- ✅ Transaction management
- ✅ Customer management
- ✅ Payment processing
- ✅ Basic inventory tracking
- ✅ Dana kasir management

### Phase 2: Advanced Features (In Progress)
- 🔄 Advanced reporting
- 🔄 Mobile app support
- 🔄 Integration with accounting systems
- 🔄 Advanced analytics dashboard

### Phase 3: Future Enhancements
- 📋 AI-powered demand forecasting
- 📋 Customer behavior analytics
- 📋 Automated marketing campaigns
- 📋 Multi-location support

---

## 📋 Success Criteria

### Technical Success Criteria
- ✅ System uptime > 99.5%
- ✅ Response time < 2 seconds
- ✅ Zero data loss incidents
- ✅ Complete audit trail coverage

### Business Success Criteria
- 📈 Reduce transaction processing time by 50%
- 📈 Improve inventory accuracy to 99%+
- 📈 Increase customer satisfaction score
- 📈 Reduce operational costs by 20%

### User Adoption Criteria
- 👥 100% kasir staff trained and active
- 👥 Daily active usage > 90%
- 👥 User satisfaction score > 4.5/5
- 👥 Reduced training time for new staff

---

## 🔧 Technical Specifications

### Performance Requirements
- **Response Time:** < 2 seconds for all operations
- **Throughput:** Support 100+ concurrent users
- **Availability:** 99.5% uptime
- **Scalability:** Handle 10,000+ transactions per month

### Security Requirements
- **Authentication:** Multi-factor authentication
- **Authorization:** Role-based access control
- **Data Encryption:** AES-256 encryption
- **Audit Logging:** Complete activity tracking

### Integration Requirements
- **Payment Gateways:** Multiple payment method support
- **Accounting Systems:** Export to popular accounting software
- **Notification Systems:** SMS, Email, WhatsApp integration
- **Reporting Tools:** Export to Excel, PDF, CSV

---

## 📞 Support & Maintenance

### Support Structure
- **Level 1:** Basic user support and training
- **Level 2:** Technical issue resolution
- **Level 3:** System administration and development

### Maintenance Schedule
- **Daily:** System monitoring and backup
- **Weekly:** Performance optimization
- **Monthly:** Security updates and patches
- **Quarterly:** Feature updates and enhancements

---

*Dokumen ini akan diupdate secara berkala seiring dengan perkembangan proyek dan feedback dari stakeholder.*