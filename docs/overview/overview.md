# Overview Sistem Rental Maguru

## 📋 Tentang Sistem

**Maguru** adalah sistem manajemen rental komprehensif yang dirancang untuk mengotomatisasi dan mengoptimalkan operasional bisnis rental. Sistem ini mengintegrasikan manajemen inventory, transaksi, pembayaran, dan keuangan dalam satu platform yang user-friendly dengan kontrol akses berbasis role.

### Informasi Proyek
- **Nama:** Maguru - Sistem Manajemen Rental
- **Platform:** Next.js 14, TypeScript, Prisma, Clerk Auth
- **Database:** PostgreSQL
- **Deployment:** Vercel/Custom Server

---

## 🎯 Tujuan Sistem

### Digitalisasi Operasional
- Mengotomatisasi proses manual menjadi sistem digital terintegrasi
- Mengurangi human error dalam pencatatan transaksi
- Meningkatkan efisiensi operasional harian

### Kontrol Keuangan Real-time
- Tracking pendapatan, pengeluaran, dan cash flow harian
- Kontrol keuangan yang lebih ketat dan transparan
- Laporan real-time untuk pengambilan keputusan

### Manajemen Inventory Efisien
- Monitoring stok, ketersediaan, dan kondisi produk
- Sistem sizing advanced dengan kategori umur
- Alert otomatis untuk stok rendah

---

## 👥 Struktur Role & Akses

### Hierarki Sistem
```
Owner (Level 3)
├── Akses penuh semua fitur
├── Manajemen staff dan karyawan
├── Export data keuangan
└── Analytics dan reporting lengkap

Producer (Level 2)
├── Manajemen produk dan inventory
├── Cost item management
├── Monitor dashboard kasir
└── Laporan operasional

Kasir (Level 1)
├── Operasional transaksi harian
├── Customer service
├── Proses pickup dan return
└── Manajemen kas harian
```

---

## 🏪 FITUR KASIR

### Ringkasan Fitur
**Role Kasir** adalah front office yang menangani operasional transaksi harian dengan customer. Kasir memiliki akses ke semua fitur yang dibutuhkan untuk melayani customer dan mengelola kas harian.

### Fitur Utama Kasir

#### 💰 Manajemen Transaksi
- **Dashboard Transaksi** - Overview statistik dan metrics real-time
- **Buat Transaksi Baru** - 4-step wizard untuk transaksi rental
- **Detail Transaksi** - View lengkap dengan timeline aktivitas
- **Operasi Transaksi** - Pickup, payment, cancellation, lost item resolution

#### 👥 Manajemen Customer
- **Registrasi Customer** - Daftar customer baru dengan validasi
- **Database Customer** - Kelola data customer dan riwayat rental
- **Customer Analytics** - Rental frequency, payment behavior, lifetime value

#### 📦 Sistem Pickup & Return
- **Pickup Processing** - Validasi ketersediaan dan condition check
- **Return Management** - Assessment kondisi, penalty calculation, refund processing
- **Inventory Update** - Update stok otomatis saat pickup/return

#### 💳 Sistem Pembayaran
- **Multiple Payment Methods** - Cash, transfer, e-wallet, credit card
- **Payment Tracking** - Monitor outstanding balance dan payment history
- **Receipt Management** - Digital receipt dengan print option

#### 📊 Dana Kasir
- **Daily Summary** - Ringkasan kas harian (income, expense, net balance)
- **Expense Management** - Input dan kelola pengeluaran operasional
- **Cash Reconciliation** - Rekonsiliasi kas fisik vs sistem

#### 🔍 Advanced Search & Filter
- **Transaction Search** - Cari berdasarkan kode, customer, produk
- **Multi-Filter** - Filter by status, date, amount, kasir
- **Real-time Data** - Auto-refresh dengan loading states

**📖 [Detail Lengkap Fitur Kasir →](kasir.md)**

---

## 🛍️ FITUR PRODUCER

### Ringkasan Fitur
**Role Producer** adalah manajer produk yang bertanggung jawab mengelola katalog produk, inventory, dan pricing. Producer fokus pada operasional produk dan dapat memonitor dashboard kasir.

### Fitur Utama Producer

#### 📦 Manajemen Produk
- **CRUD Produk Lengkap** - Create, read, update, delete produk dengan validasi
- **Dynamic Form Strategy** - Form berubah berdasarkan kategori produk
- **Image Management** - Upload gambar dengan drag & drop (JPEG, PNG, WebP)
- **Advanced Search** - Multi-criteria filtering dengan real-time results

#### 🎨 Sistem Kategori Produk
- **Pakaian (Clothing)** - Size XS-XXL dengan kategori umur
- **Aksesoris Age-Based** - Pembagian dewasa/anak (Sarung, Songket)
- **Aksesoris Universal** - One-size-fits-all (Anting, Gelang)

#### 💰 Cost Item Management
- **Master Data Cost Items** - Kelola item biaya produksi
- **Producer vs Owner Flow** - Mode Producer (modalAwal=0) vs Owner (calculated)
- **Smart Cost Selector** - Autocomplete dengan create-on-the-fly
- **Real-time Calculation** - Modal awal update otomatis

#### 📊 Inventory Tracking
- **Enhanced ProductSize** - Original, available, rented, lost quantities
- **Utilization Metrics** - Usage rate dan health status
- **Rental State Protection** - Validasi perubahan berdasarkan rental aktif

#### 📱 User Interface
- **Table/Grid View** - Switchable display modes
- **Responsive Design** - Mobile-friendly layout
- **Error Boundaries** - Graceful error handling
- **Loading States** - Skeleton loading untuk better UX

**📖 [Detail Lengkap Fitur Producer →](product.md)**

---

## 👑 FITUR OWNER

### Ringkasan Fitur
**Role Owner** adalah pemilik bisnis dengan akses tertinggi. Owner memiliki kontrol penuh terhadap semua aspek operasional, mulai dari manajemen staff, analisis keuangan, hingga pengambilan keputusan strategis.

### Fitur Utama Owner

#### 👥 Manajemen Staff (Owner Only)
- **Kelola Kasir** - CRUD kasir lengkap dengan status management
- **Staff Performance** - Monitor aktivitas dan performa kasir
- **Access Control** - Aktivasi/deaktivasi akun kasir
- **Business Logic Protection** - Validasi transaksi aktif sebelum perubahan

#### 💰 Financial Management Lengkap
- **Complete Visibility** - Akses ke semua data keuangan tanpa filter
- **Enhanced Dana Kasir** - Dashboard khusus owner dengan export capability
- **Role-based Filtering** - Optional kasir filter untuk analisis
- **Advanced Analytics** - Break-even analysis dan profitability metrics

#### 📋 Export & Reporting (Owner Only)
- **CSV Export** - Export data keuangan untuk accounting
- **Date Range Selection** - Flexible date range (max 1 tahun)
- **Comprehensive Data** - Income + expenses dalam satu file
- **Accounting Ready** - Format compatible dengan Excel dan accounting software

#### 🔐 System Control
- **Permission Management** - Kontrol akses dan user permissions
- **System Analytics** - Analytics level sistem
- **Audit Trail** - Log semua aktivitas untuk accountability
- **Security Features** - Rate limiting, role validation, data protection

#### 📊 Business Intelligence
- **Key Metrics** - Financial dan operational metrics untuk decision making
- **Performance Monitoring** - Monitor performa kasir dan sistem
- **Strategic Planning** - Tools untuk perencanaan strategis
- **Trend Analysis** - Analisis tren bisnis dan market intelligence

#### 🚀 Advanced Features
- **Multi-role Access** - Dapat mengakses semua fitur Producer dan Kasir
- **Owner Sidebar** - Navigation khusus dengan gradient theme
- **Integration Planning** - Roadmap integrasi dengan accounting software
- **Scalability Support** - Support untuk multi-location dan franchise

**📖 [Detail Lengkap Fitur Owner →](owner.md)**

---

## 🔄 Integrasi Antar Role

### Data Flow Sistem
```
Owner
├── Strategic decisions → Producer (product strategy)
├── Staff management → Kasir (performance monitoring)
└── Financial oversight → All roles (budget, targets)

Producer
├── Product data → Kasir (availability, pricing)
├── Inventory updates → Kasir (stock levels)
└── Cost analysis → Owner (profitability reports)

Kasir
├── Transaction data → Producer (product performance)
├── Customer insights → Producer (demand patterns)
└── Financial data → Owner (daily revenue, expenses)
```

### Real-time Synchronization
- **Inventory Updates** - Pickup/return langsung update availability
- **Financial Data** - Transaction revenue otomatis masuk dana kasir
- **Performance Metrics** - Real-time tracking untuk semua role
- **Notification System** - Alert untuk low stock, overdue, dll

---

## 🛡️ Keamanan & Kontrol Akses

### Authentication & Authorization
- **Clerk Authentication** - Modern auth dengan session management
- **Role-based Access Control** - Middleware level protection
- **Route Protection** - Automatic redirect berdasarkan role
- **Permission Matrix** - Granular permissions per feature

### Data Protection
- **Input Validation** - Comprehensive validation di semua level
- **SQL Injection Prevention** - Parameterized queries dengan Prisma
- **Rate Limiting** - Prevent abuse dan spam
- **Audit Logging** - Complete activity tracking

### Business Logic Protection
- **Rental State Validation** - Protect data integrity
- **Transaction Consistency** - Atomic operations
- **Inventory Constraints** - Prevent overselling
- **Financial Reconciliation** - Balance validation

---

## 📊 Teknologi & Arsitektur

### Tech Stack
- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL dengan proper indexing
- **Authentication:** Clerk dengan custom role claims
- **File Storage:** Local storage dengan validation
- **Testing:** Jest (unit), Playwright (E2E)

### Performance Features
- **Debounced Search** - Reduce API calls
- **Lazy Loading** - Load components on demand
- **Caching Strategy** - React Query untuk client-side caching
- **Image Optimization** - Compress dan resize otomatis
- **Pagination** - Handle large datasets efficiently

### Scalability
- **Modular Architecture** - Feature-based organization
- **API Design** - RESTful dengan proper status codes
- **Database Design** - Normalized dengan proper relationships
- **Error Handling** - Structured error responses
- **Monitoring** - Performance dan error tracking

---

## 🚀 Roadmap & Future Enhancements

### Phase 1: Core Features (Completed)
- ✅ Role-based authentication dan authorization
- ✅ Transaction management lengkap
- ✅ Product management dengan dynamic forms
- ✅ Financial management dan dana kasir
- ✅ Staff management untuk owner

### Phase 2: Advanced Features (In Progress)
- 🔄 Advanced reporting dan analytics
- 🔄 Mobile app support
- 🔄 Integration dengan accounting systems
- 🔄 Advanced notification system

### Phase 3: Enterprise Features (Planned)
- 📋 Multi-location support
- 📋 Franchise management
- 📋 API untuk integrasi eksternal
- 📋 AI-powered demand forecasting
- 📋 Customer behavior analytics
- 📋 Automated marketing campaigns

---

## 📖 Dokumentasi Detail

### Panduan Per Role
- **[📊 Fitur Kasir Lengkap](kasir.md)** - Operasional transaksi dan customer service
- **[🛍️ Fitur Producer Lengkap](product.md)** - Manajemen produk dan inventory
- **[👑 Fitur Owner Lengkap](owner.md)** - Manajemen bisnis dan strategic control

### Dokumentasi Teknis
- **API Documentation** - Endpoint reference dan examples
- **Database Schema** - ERD dan relationship documentation
- **Deployment Guide** - Setup dan configuration
- **Testing Guide** - Unit, integration, dan E2E testing

---

## 💡 Mengapa Memilih Maguru?

### Keunggulan Sistem
- **User-Friendly** - Interface intuitif untuk semua level user
- **Comprehensive** - All-in-one solution untuk rental business
- **Scalable** - Dapat berkembang seiring pertumbuhan bisnis
- **Secure** - Enterprise-level security dan data protection
- **Modern** - Built dengan teknologi terkini dan best practices

### Business Value
- **Efisiensi Operasional** - Reduce manual work hingga 70%
- **Akurasi Data** - Minimize human error dengan validation
- **Real-time Insights** - Data-driven decision making
- **Customer Satisfaction** - Faster service dan better experience
- **Cost Reduction** - Optimize resource allocation

---

*Sistem Rental Maguru - Solusi lengkap untuk digitalisasi bisnis rental Anda.*