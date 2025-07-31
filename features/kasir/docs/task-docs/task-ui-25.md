# Task UI-25: Desain Interface Pendaftaran Penyewa dan Transaksi Penyewaan

## Daftar Isi

1. [Pendahuluan](#pendahuluan)
2. [Referensi Visual & Inspirasi](#referensi-visual--inspirasi)
3. [Prinsip & Guideline UI/UX](#prinsip--guideline-uiux)
4. [Spesifikasi UI & Komponen](#spesifikasi-ui--komponen)
5. [Flow Pengguna & Interaksi](#flow-pengguna--interaksi)
6. [Layout, Responsive & Accessibility](#layout-responsive--accessibility)
7. [Design Rationale & Constraints](#design-rationale--constraints)
8. [Handoff Requirements](#handoff-requirements)
9. [Acceptance Criteria](#acceptance-criteria)
10. [Test Plan](#test-plan)
11. [Lampiran](#lampiran)

## Pendahuluan

Task ini bertujuan untuk merancang antarmuka pengguna yang intuitif dan efisien untuk fitur pendaftaran penyewa baru dan pembuatan transaksi penyewaan. Interface ini akan menjadi titik awal proses bisnis rental pakaian, sehingga harus memberikan pengalaman yang mudah dan cepat bagi kasir untuk mengelola data penyewa dan memulai transaksi penyewaan dengan kode unik yang otomatis dibuat sistem.

Desain ini akan meningkatkan efisiensi operasional kasir dan memastikan data penyewa tercatat dengan akurat untuk mendukung proses bisnis rental yang terintegrasi.

## Referensi Visual & Inspirasi

### Wireframe & Mockup

- Form pendaftaran penyewa dengan layout 2 kolom untuk efisiensi input data
- Interface pemilihan produk dengan grid view dan filter yang mudah diakses
- Dashboard transaksi dengan highlight pada kode transaksi yang baru dibuat
- Modal confirmation untuk validasi data sebelum menyimpan

### Inspirasi & Referensi

- **POS Systems**: Interface kasir modern dengan workflow yang jelas dan efisien
- **CRM Forms**: Layout form yang user-friendly dengan validasi real-time
- **E-commerce Checkout**: Flow pemilihan produk yang intuitif dengan summary yang jelas

### Existing Components

- Referensi ke komponen dari `components/ui/` yang sudah ada:
  - `Button` dengan variant primary (gold) dan secondary
  - `Input` dengan validasi visual
  - `Card` untuk grouping informasi
  - `Table` untuk display produk
  - `Badge` untuk status dan kategori
- Komponen baru yang perlu dibuat:
  - `CustomerForm` untuk pendaftaran penyewa
  - `ProductSelector` untuk pemilihan produk rental
  - `TransactionSummary` untuk ringkasan transaksi

## Prinsip & Guideline UI/UX

### Design System

- Mengikuti design tokens dari `@styles/globals.css`:
  - Primary color: Gold (`--color-gold-500: #FFD700`) untuk CTA utama
  - Neutral colors untuk background dan text
  - Consistent spacing dengan `--radius-lg: 0.5rem`
  - Shadow system: `--shadow-md` untuk elevated components
- Font system: Poppins untuk headings, Inter untuk body text
- Component consistency dengan existing UI library

### Brand Consistency

- Gold accent sebagai primary color untuk action buttons
- Neutral palette untuk professional appearance
- Consistent card styling dengan rounded corners dan subtle shadows
- Typography hierarchy yang jelas dengan proper contrast ratios

### User Experience Principles

- **Efisiensi Workflow**: Minimize steps untuk complete task penyewaan
- **Clear Visual Hierarchy**: Important information highlighted dengan proper spacing
- **Immediate Feedback**: Real-time validation dan success indicators
- **Error Prevention**: Clear labels dan helpful placeholder text

## Spesifikasi UI & Komponen

### Komponen Utama

1. **Customer Registration Form**:
   - Two-column layout untuk desktop
   - Required fields: Nama Lengkap, No. Telepon, Alamat
   - Optional fields: Email, NIK/KTP
   - Real-time validation dengan error messages

2. **Product Selection Interface**:
   - Grid layout produk dengan image, nama, dan status availability
   - Filter by kategori dan size
   - Search functionality
   - Quick add to rental basket

3. **Transaction Summary**:
   - Customer info preview
   - Selected products list
   - Auto-generated transaction code (format: TXN-YYYYMMDD-XXX)
   - Total calculation dan rental duration selector

### State Management

- **Loading States**: Skeleton loading untuk product grid, spinner pada form submission
- **Success States**: Green checkmark dengan confirmation message
- **Error States**: Red border pada invalid fields dengan descriptive error text
- **Empty States**: Friendly illustration untuk empty product list atau search results

### Visual Elements

- **Colors**: Gold primary (`var(--color-gold-500)`), neutral grays, status colors (green, red, yellow)
- **Icons**: Lucide icons untuk consistency - User, Package, ShoppingCart, Check, X
- **Spacing**: Consistent 1rem (16px) base unit dengan multiples untuk larger gaps
- **Typography**: Poppins semibold untuk section headers, regular weight untuk body text

## Flow Pengguna & Interaksi

### User Journey

1. **Akses Form**: Kasir mengklik "Tambah Penyewa Baru" dari dashboard
2. **Input Data**: Mengisi form pendaftaran dengan validasi real-time
3. **Pilih Produk**: Browse/search produk available untuk disewa
4. **Review Transaksi**: Melihat summary sebelum confirm
5. **Konfirmasi**: Submit data dan dapatkan kode transaksi unik

### Interaction Patterns

- **Form Validation**: Real-time validation dengan debounced input
- **Product Selection**: Click to add, visual feedback dengan quantity badge
- **Navigation**: Clear breadcrumb atau step indicator
- **Confirmation**: Modal dialog untuk final confirmation sebelum save

### Error States

- **Form Errors**: Inline error messages dengan red border dan icon
- **API Errors**: Toast notification untuk server errors
- **Network Errors**: Retry mechanism dengan clear action button
- **Validation Errors**: Field-level errors dengan helpful suggestions

## Layout, Responsive & Accessibility

### Layout Structure

- **Desktop**: Two-column layout - form di kiri, product selection di kanan
- **Tablet**: Single column dengan collapsible sections
- **Mobile**: Stack layout dengan tabbed navigation antara form dan products
- **Grid System**: 12-column grid dengan 24px gutters

### Responsive Design

- **Breakpoints**: Mobile (< 768px), Tablet (768px-1024px), Desktop (> 1024px)
- **Mobile-first approach** dengan progressive enhancement
- **Touch-friendly**: Minimum 44px touch targets untuk mobile interaction
- **Flexible typography**: Responsive font sizes dengan clamp() function

### Accessibility Standards

- **WCAG AA Compliance**: Minimum 4.5:1 contrast ratio untuk text
- **Keyboard Navigation**: Tab order yang logical, focus indicators yang visible
- **ARIA Labels**: Proper labeling untuk form fields dan interactive elements  
- **Screen Reader**: Semantic HTML dengan proper heading hierarchy
- **Form Accessibility**: Associated labels, error announcements, required field indicators

## Design Rationale & Constraints

### Design Decisions

- **Two-column layout**: Memaksimalkan screen real estate dan workflow efficiency
- **Real-time validation**: Reduce errors dan improve user confidence
- **Auto-generated transaction codes**: Eliminate manual input errors dan ensure uniqueness
- **Product grid vs list**: Grid lebih visual untuk product identification

### Technical Constraints

- **Next.js App Router**: Design harus compatible dengan server components
- **Existing UI library**: Harus menggunakan komponen yang sudah ada di `components/ui/`
- **Performance**: Lazy loading untuk product images, optimized untuk mobile networks
- **Browser Support**: Modern browsers dengan graceful fallback untuk older versions

### Business Constraints

- **Workflow Speed**: Interface harus support high-volume rental periods
- **Data Accuracy**: Validation harus prevent common input mistakes
- **Audit Trail**: UI harus clearly show yang fields required untuk compliance
- **Multi-user**: Design harus consistent ketika multiple kasir menggunakan sistem

## Handoff Requirements

### Assets & Resources

- **Design Files**: Figma file dengan organized layers dan components
- **Icon Set**: Lucide icons dengan specified sizes (16px, 20px, 24px)
- **Color Tokens**: CSS custom properties sudah defined di `@styles/globals.css`
- **Typography Scale**: Font sizes dan line heights untuk different screen sizes

### Documentation

- **Component Specs**: Detailed specs untuk new components (CustomerForm, ProductSelector, TransactionSummary)
- **Interaction States**: Hover, active, focus, disabled states untuk semua interactive elements
- **Animation Guidelines**: Micro-interactions untuk form validation dan transitions
- **Responsive Behavior**: Breakpoint behaviors dan layout changes

### Collaboration Points

- **Design Review**: Scheduled review dengan FE developer sebelum implementation
- **Prototype Testing**: Interactive prototype untuk validate user flow
- **Implementation Support**: Available untuk clarify design details during development
- **Final Review**: Design QA setelah FE implementation untuk ensure pixel-perfect result

## Acceptance Criteria

| Kriteria UI/UX                                          | Status | Keterangan |
| ------------------------------------------------------- | ------ | ---------- |
| Form pendaftaran penyewa dengan layout 2 kolom         |        |            |
| Real-time validation untuk required fields             |        |            |
| Product selection interface dengan grid layout         |        |            |
| Filter dan search functionality untuk produk           |        |            |
| Auto-generated transaction code dengan format TXN-XXX  |        |            |
| Transaction summary dengan customer dan product info   |        |            |
| Responsive design untuk mobile, tablet, desktop        |        |            |
| Accessibility compliance (WCAG AA)                     |        |            |
| Consistent dengan existing design system               |        |            |
| Loading, success, dan error states yang clear          |        |            |
| Touch-friendly interface untuk tablet usage            |        |            |

## Test Plan

### Visual Testing

- **Cross-browser testing**: Chrome, Firefox, Safari, Edge
- **Responsive testing**: Test di various screen sizes dan orientations
- **Visual regression**: Screenshot comparison dengan approved designs
- **Color accessibility**: Contrast ratio testing untuk all text/background combinations

### Accessibility Testing

- **Keyboard navigation**: Tab through all interactive elements
- **Screen reader testing**: Test dengan NVDA/VoiceOver untuk proper announcements
- **ARIA implementation**: Validate proper labeling dan roles
- **Color blindness**: Test interface dengan color vision simulators

### User Testing

- **Usability testing**: Test dengan actual kasir untuk workflow efficiency
- **A/B testing**: Compare form layouts untuk optimal completion rates
- **Performance perception**: Measure perceived loading times dan user satisfaction
- **Error scenario testing**: How users handle dan recover dari various error states

## Lampiran

### Wireframe/Mockup/Diagram

- **User Flow Diagram**: Complete journey dari customer registration sampai transaction creation
- **Component Hierarchy**: Visual breakdown of all UI components dan their relationships
- **State Diagram**: Visual representation dari different UI states (loading, success, error, empty)
- **Responsive Layouts**: Mockups untuk mobile, tablet, dan desktop versions

### Design Files

- **Figma File**: [Link ke Figma workspace dengan organised components]
- **Asset Library**: Exported icons, images, dan other visual assets
- **Style Guide**: Comprehensive guide dengan colors, typography, spacing, dan component usage
- **Prototype**: Interactive prototype demonstrating user flow dan interactions

### Related Tasks

- **Frontend Implementation**: [task-fe-27.md](task-fe-27.md) - React components implementation
- **Backend Requirements**: [task-be-26.md](task-be-26.md) - API endpoints untuk customer registration dan transaction creation
- **E2E Testing**: [task-e2e-28.md](task-e2e-28.md) - Complete user flow testing

---

**Task ID**: RPK-25  
**Story**: RPK-21 - Sebagai kasir, saya ingin mendaftarkan penyewa baru dan membuat transaksi penyewaan agar proses sewa dapat dimulai  
**Type**: UI Design Task  
**Priority**: High  
**Estimated Effort**: 4 hours