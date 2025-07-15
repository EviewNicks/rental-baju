# Task RPK-12: Desain UI Manage-Product

## Daftar Isi

1. [Pendahuluan](mdc:#pendahuluan)
2. [Referensi Visual & Inspirasi](mdc:#referensi-visual--inspirasi)
3. [Prinsip & Guideline UI/UX](mdc:#prinsip--guideline-uiux)
4. [Spesifikasi UI & Komponen](mdc:#spesifikasi-ui--komponen)
5. [Flow Pengguna & Interaksi](mdc:#flow-pengguna--interaksi)
6. [Layout, Responsive & Accessibility](mdc:#layout-responsive--accessibility)
7. [Acceptance Criteria](mdc:#acceptance-criteria)
8. [Test Plan](mdc:#test-plan)
9. [Lampiran: Wireframe/Mockup/Diagram](mdc:#lampiran-wireframemockupdiagram)

## Pendahuluan

Task ini bertujuan untuk merancang antarmuka pengguna (UI) yang intuitif dan efisien untuk fitur manajemen produk. Desain akan mengikuti prinsip flat modern minimalist dengan sentuhan soft neumorphism yang konsisten dengan guideline UI/UX project.

Fokus utama adalah menciptakan pengalaman yang smooth untuk producer dalam mengelola inventaris produk dengan operasi CRUD yang mudah dipahami dan digunakan.

## Referensi Visual & Inspirasi

### Aplikasi Referensi

- **Notion Database View**: Untuk layout tabel yang clean dan mudah di-scan
- **Airtable**: Untuk interaksi form yang intuitif
- **Shopify Admin**: Untuk manajemen produk yang efisien
- **Linear**: Untuk komponen UI yang modern dan minimalis

### Inspirasi Visual

- **Flat Design**: Menggunakan warna solid tanpa efek 3D berlebihan
- **Card-based Layout**: Setiap produk dalam card terpisah untuk mobile view
- **Micro-interactions**: Feedback visual yang subtle untuk user actions

## Prinsip & Guideline UI/UX

### Design System

- **Theme**: Flat Modern Minimalist dengan Soft Neumorphism
- **Color Palette**:
  - Primary: Gold (#FFD700) untuk CTA dan highlight
  - Background: Putih (#FFFFFF) dan abu-abu muda (#F8FAFC)
  - Text: Hitam (#111827) untuk kontras optimal
- **Typography**: Sans-serif modern (Inter/Poppins)
- **Spacing**: Konsisten menggunakan Tailwind spacing scale

### Komponen Guidelines

- **Cards**: Rounded corners (rounded-lg), subtle shadow (shadow-md)
- **Buttons**: Solid untuk primary actions, outline untuk secondary
- **Forms**: Large touch targets, clear labels, inline validation
- **Tables**: Zebra striping, hover states, sortable columns

## Spesifikasi UI & Komponen

### Halaman Utama: Daftar Produk

#### Kolom Tabel Produk Rental Baju

| Kolom          | Deskripsi                    | Format                                | Sortable | Filterable |
| -------------- | ---------------------------- | ------------------------------------- | -------- | ---------- |
| **No**         | Nomor urut                   | Number                                | ✅       | ❌         |
| **Image**      | Foto produk                  | Thumbnail 60x60px                     | ❌       | ❌         |
| **Code**       | Kode produk                  | Text (PRD1, DRES2)                    | ✅       | ✅         |
| **Name**       | Nama produk                  | Text                                  | ✅       | ✅         |
| **Category**   | Kategori pakaian             | Badge (Dress, Kemeja, Jas, dll)       | ❌       | ✅         |
| **Modal Awal** | Biaya pembuatan baju         | Currency (Rp 800.000)                 | ❌       | ✅         |
| **Harga Sewa** | Harga sewa per sekali        | Currency (Rp 150.000)                 | ❌       | ✅         |
| **Status**     | Status produk                | Badge (Tersedia, Disewa, Maintenance) | ❌       | ✅         |
| **Pendapatan** | Total pendapatan dari produk | Currency (Rp 2.500.000)               | ❌       | ✅         |

#### Layout Structure - Table View (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Header: "Manajemen Produk" + "Tambah Produk" Button                                                     │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Search Bar + Filter Dropdown + Sort Options                                                             │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Products Table                                                                                           │
│ ┌───┬─────────┬─────────┬─────────┬─────────┬─────────────┬─────────────┬─────────────┬─────────────┐ │
│ │No │ Image   │ Code    │ Name    │Category │Modal Awal   │Harga Sewa   │Status       │Pendapatan   │ │
│ ├───┼─────────┼─────────┼─────────┼─────────┼─────────────┼─────────────┼─────────────┼─────────────┤ │
│ │1  │ [IMG]   │ PRD1    │Dress    │Dress    │Rp 800.000   │Rp 150.000   │Tersedia     │Rp 2.500.000 │ │
│ │   │         │         │Pesta    │         │             │             │             │             │ │
│ └───┴─────────┴─────────┴─────────┴─────────┴─────────────┴─────────────┴─────────────┴─────────────┘ │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Pagination Controls + Bulk Actions                                                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Layout Structure - Card View (Mobile/Tablet)

```
┌─────────────────────────────────────────────────────────┐
│ Header: "Manajemen Produk" + "Tambah Produk" Button     │
├─────────────────────────────────────────────────────────┤
│ Search Bar + Filter Toggle                               │
├─────────────────────────────────────────────────────────┤
│ Products Grid                                            │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ [IMG]           │ │ [IMG]           │ │ [IMG]           │ │
│ │ PRD1            │ │ DRES2           │ │ JAS1            │ │
│ │ Dress Pesta     │ │ Kemeja Pria     │ │ Jas Formal      │ │
│ │ Dress           │ │ Kemeja          │ │ Jas             │ │
│ │ Rp 150.000      │ │ Rp 100.000      │ │ Rp 200.000      │ │
│ │ Tersedia        │ │ Disewa          │ │ Maintenance     │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Load More Button / Pagination                            │
└─────────────────────────────────────────────────────────┘
```

#### Komponen Utama - Table View

1. **ProductTable**: Tabel responsive dengan kolom sortable
   - Kolom: No, Image, Code, Name, Category, Modal Awal, Harga Sewa, Status, Pendapatan
   - Sortable: Name, Code (hanya 2 kolom yang bisa di-sort)
   - Click row untuk view detail
   - Bulk actions: Select all, Export selected

2. **ProductStatusBadge**: Badge untuk status produk
   - **Tersedia**: Green badge (#10B981) - Produk siap disewa
   - **Disewa**: Orange badge (#F59E0B) - Produk sedang disewa
   - **Maintenance**: Red badge (#EF4444) - Produk dalam perbaikan
   - **Habis**: Gray badge (#6B7280) - Produk habis/rusak

3. **ProductCategoryBadge**: Badge untuk kategori produk
   - **Dress**: Pink badge (#EC4899)
   - **Kemeja**: Blue badge (#3B82F6)
   - **Jas**: Purple badge (#8B5CF6)
   - **Celana**: Brown badge (#A16207)
   - **Aksesoris**: Gold badge (#FFD700)

4. **ProductTableHeader**: Header dengan sorting dan filtering
5. **ProductTableRow**: Row dengan hover effects dan action buttons
6. **ProductStatusBadge**: Badge untuk status (Tersedia, Disewa, Maintenance)
7. **ProductImage**: Thumbnail dengan lazy loading

#### Komponen Utama - Card View

1. **ProductGrid**: Grid layout untuk mobile/tablet
2. **ProductCard**: Card dengan informasi produk
   - Image dengan aspect ratio 4:3
   - Product info (code, name, category)
   - Pricing info (harga sewa)
   - Status badge
   - Click card untuk view detail
3. **ProductCardSkeleton**: Loading skeleton untuk card
4. **ProductCardActions**: Swipe actions untuk mobile

#### Komponen Shared

1. **SearchBar**: Pencarian real-time dengan debounce
2. **FilterDropdown**: Filter berdasarkan kategori/status
3. **SortDropdown**: Sort berdasarkan nama/kode produk
4. **Pagination**: Navigasi halaman dengan info total
5. **ViewToggle**: Toggle antara table dan card view
6. **CategoryManager**: Modal untuk mengelola kategori produk

### Form: Tambah/Edit Produk

#### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ Modal/Drawer: "Tambah Produk" / "Edit Produk"          │
├─────────────────────────────────────────────────────────┤
│ Form Fields:                                            │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Product Code: [___________] * (4 digit alfanumerik)  │ │
│ │ Product Name: [___________] *                        │ │
│ │ Description: [___________]                           │ │
│ │ Category: [Dropdown] *                               │ │
│ │ Modal Awal: [Rp___________] * (Biaya pembuatan)      │ │
│ │ Harga Sewa: [Rp___________] * (Per sekali sewa)      │ │
│ │ Quantity: [#___________] *                           │ │
│ │ Image: [Upload Area]                                 │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Action Buttons: [Cancel] [Save]                        │
└─────────────────────────────────────────────────────────┘
```

### Category Management

#### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ Modal: "Kelola Kategori"                               │
├─────────────────────────────────────────────────────────┤
│ Category List:                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Dress] [Pink] [Edit] [Delete]                      │
│ │ [Kemeja] [Blue] [Edit] [Delete]                     │
│ │ [Jas] [Purple] [Edit] [Delete]                      │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Add Category Form:                                      │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Category Name: [___________] *                       │
│ │ Color: [Color Picker] *                              │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Action Buttons: [Cancel] [Add Category]                │
└─────────────────────────────────────────────────────────┘
```

### Product Detail Modal

#### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ Modal: "Detail Produk"                                  │
├─────────────────────────────────────────────────────────┤
│ Product Information:                                    │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Large Image]                                        │
│ │ Code: PRD1                                           │
│ │ Name: Dress Pesta                                    │
│ │ Category: Dress                                       │
│ │ Description: Dress pesta untuk acara formal          │
│ │ Modal Awal: Rp 800.000                               │
│ │ Harga Sewa: Rp 150.000                               │
│ │ Status: Tersedia                                     │
│ │ Total Pendapatan: Rp 2.500.000                       │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Action Buttons: [Edit] [Delete] [Close]                │
└─────────────────────────────────────────────────────────┘
```

#### Komponen Utama

1. **ProductForm**: Form dengan validasi real-time
   - **Code**: Text input dengan format 4 digit alfanumerik uppercase (PRD1, DRES2)
   - **Name**: Text input dengan max 100 karakter
   - **Description**: Textarea dengan max 500 karakter
   - **Category**: Select dropdown dengan kategori yang sudah ada
   - **Modal Awal**: Number input dengan format currency (Rp) - biaya pembuatan
   - **Harga Sewa**: Number input dengan format currency (Rp) - per sekali sewa
   - **Quantity**: Number input dengan min 0, max 9999
   - **Image**: File upload dengan preview
   - Real-time validation untuk semua fields
   - Auto-save draft functionality

2. **CategoryForm**: Form untuk mengelola kategori
   - **Name**: Text input dengan max 50 karakter
   - **Color**: Color picker untuk badge color
   - **Validation**: Nama kategori harus unik

3. **ImageUpload**: Drag & drop area dengan preview
   - Support multiple image formats (JPG, PNG, WebP)
   - Image compression dan resizing
   - Preview dengan aspect ratio 4:3

4. **FormValidation**: Inline error messages
   - Field-specific error messages
   - Success indicators
   - Character counters untuk text fields

5. **Modal/Drawer**: Responsive container untuk form
   - Full-screen pada mobile
   - Centered modal pada desktop
   - Keyboard shortcuts (Esc to close, Ctrl+S to save)

6. **ProductDetailModal**: Modal untuk menampilkan detail produk
   - Large image display dengan zoom capability
   - Complete product information layout
   - Action buttons (Edit, Delete, Close)
   - Responsive design untuk semua screen sizes

7. **CategoryManagerModal**: Modal untuk mengelola kategori
   - Category list dengan color badges
   - Add/Edit/Delete category functionality
   - Color picker untuk badge customization
   - Validation untuk unique category names

### State Management

- **Loading States**: Skeleton loaders untuk tabel dan form
- **Error States**: Toast notifications untuk feedback
- **Success States**: Green checkmarks dan success messages
- **Empty States**: Illustrations untuk data kosong

## Flow Pengguna & Interaksi

### 1. Melihat Daftar Produk

1. **Landing**: Producer membuka halaman → Loading skeleton
2. **Data Loaded**: Tabel terisi → Producer dapat scroll/search
3. **Interaction**: Hover pada row → Highlight effect
4. **Action**: Klik tombol action → Tooltip/confirmation

### 2. Menambah Produk Baru

1. **Trigger**: Klik "Tambah Produk" → Modal opens
2. **Form Fill**: Producer mengisi form → Real-time validation
3. **Image Upload**: Drag & drop → Preview thumbnail
4. **Submit**: Klik "Simpan" → Loading state → Success feedback

### 3. Mengedit Produk

1. **Trigger**: Klik "Edit" → Modal opens dengan data terisi
2. **Modify**: Producer mengubah field → Validation updates
3. **Save**: Klik "Simpan" → Loading → Success → Table refresh

### 4. Melihat Detail Produk

1. **Trigger**: Klik pada row/card produk → Modal detail opens
2. **View**: Modal menampilkan semua informasi produk
3. **Actions**: Tombol Edit dan Delete di dalam modal detail

### 5. Mengedit Produk dari Detail

1. **Trigger**: Klik "Edit" di modal detail → Form edit opens
2. **Modify**: Producer mengubah data → Validation updates
3. **Save**: Klik "Simpan" → Loading → Success → Detail refresh

### 6. Menghapus Produk dari Detail

1. **Trigger**: Klik "Hapus" di modal detail → Confirmation dialog
2. **Confirm**: Klik "Ya" → Loading → Success → Modal close → Table refresh

### 7. Mengelola Kategori

1. **Trigger**: Klik "Kelola Kategori" → Modal kategori opens
2. **View**: Daftar kategori dengan color badges
3. **Add**: Klik "Tambah Kategori" → Form kategori opens
4. **Edit**: Klik "Edit" pada kategori → Form edit opens
5. **Delete**: Klik "Hapus" pada kategori → Confirmation dialog

## Layout, Responsive & Accessibility

### Breakpoints

- **Mobile**: < 768px - Card layout, stacked form, swipe actions
- **Tablet**: 768px - 1024px - Hybrid table/card, toggle view
- **Desktop**: > 1024px - Full table layout, bulk actions

### Responsive Behavior

- **Table View**:
  - Desktop: Full table dengan semua kolom
  - Tablet: Compact table dengan kolom penting
  - Mobile: Switch ke card view otomatis

- **Card View**:
  - Desktop: Grid 4 kolom
  - Tablet: Grid 3 kolom
  - Mobile: Grid 2 kolom dengan swipe actions

- **Form**:
  - Desktop: Centered modal 600px width
  - Tablet: Centered modal 90% width
  - Mobile: Full-screen drawer

- **Actions**:
  - Desktop: Click row untuk view detail
  - Tablet: Click row/card untuk view detail
  - Mobile: Click card untuk view detail, swipe untuk quick actions

### Accessibility Features

- **Keyboard Navigation**: Tab order yang logis
- **Screen Reader**: ARIA labels untuk semua interactive elements
- **Color Contrast**: Minimum 4.5:1 ratio
- **Focus Management**: Visible focus indicators
- **Error Handling**: Clear error messages dengan suggestions

## Acceptance Criteria

| Kriteria UI/UX                               | Status | Keterangan            |
| -------------------------------------------- | ------ | --------------------- |
| Layout responsive di semua device            | ⏳     | Menunggu implementasi |
| Form validation dengan feedback visual       | ⏳     | Menunggu implementasi |
| Loading states untuk semua async actions     | ⏳     | Menunggu implementasi |
| Error handling dengan user-friendly messages | ⏳     | Menunggu implementasi |
| Accessibility compliance (WCAG 2.1 AA)       | ⏳     | Menunggu implementasi |
| Consistent dengan design system              | ⏳     | Menunggu implementasi |
| Smooth micro-interactions                    | ⏳     | Menunggu implementasi |
| Mobile-first approach                        | ⏳     | Menunggu implementasi |
| Click row/card untuk view detail             | ⏳     | Menunggu implementasi |
| Category management functionality            | ⏳     | Menunggu implementasi |
| Product detail modal dengan actions          | ⏳     | Menunggu implementasi |

## Test Plan

### Visual Testing

- [ ] Screenshot comparison dengan design mockup
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari)
- [ ] Device testing (iPhone, Android, iPad, Desktop)

### Responsive Testing

- [ ] Breakpoint testing pada semua ukuran layar
- [ ] Touch interaction testing pada mobile
- [ ] Orientation change testing

### Accessibility Testing

- [ ] Screen reader compatibility (NVDA, VoiceOver)
- [ ] Keyboard navigation testing
- [ ] Color contrast validation
- [ ] Focus management testing

### Performance Testing

- [ ] Loading time measurement
- [ ] Animation smoothness (60fps)
- [ ] Memory usage monitoring

## Lampiran: Wireframe/Mockup/Diagram

### Referensi Website

- [Notion Database View](https://www.notion.so/product/databases)
- [Airtable Interface](https://airtable.com/product)
- [Shopify Admin](https://www.shopify.com/admin)
- [Linear Dashboard](https://linear.app/)

### Design Tokens

```css
/* Colors */
--primary-gold: #ffd700;
--background-white: #ffffff;
--background-gray: #f8fafc;
--text-black: #111827;
--border-gray: #e2e8f0;

/* Spacing */
--spacing-xs: 0.25rem;
--spacing-sm: 0.5rem;
--spacing-md: 1rem;
--spacing-lg: 1.5rem;
--spacing-xl: 2rem;

/* Border Radius */
--radius-sm: 0.375rem;
--radius-md: 0.5rem;
--radius-lg: 0.75rem;
--radius-full: 9999px;

/* Shadows */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
```

### Component Hierarchy

```
ProductManagementPage
├── ProductHeader
│   ├── Title
│   ├── AddProductButton
│   ├── ManageCategoryButton
│   └── ViewToggle (Table/Card)
├── ProductFilters
│   ├── SearchBar
│   ├── FilterDropdown (Category, Status)
│   ├── SortDropdown (Name, Code only)
│   └── BulkActions (Desktop only)
├── ProductTable (Desktop/Tablet)
│   ├── TableHeader (Sortable columns)
│   ├── TableRow[] (Click to view detail, Hover effects)
│   │   ├── ProductImage
│   │   ├── ProductInfo
│   │   ├── ProductStatusBadge
│   │   └── ProductCategoryBadge
│   └── TablePagination
├── ProductGrid (Mobile/Tablet)
│   ├── ProductCard[]
│   │   ├── ProductImage
│   │   ├── ProductInfo (Code, Name, Category)
│   │   ├── ProductStatusBadge
│   │   └── ProductPricing (Harga Sewa)
│   ├── ProductCardSkeleton[]
│   └── LoadMoreButton
├── ProductDetailModal
│   ├── ProductInfo (All details)
│   ├── ProductHistory
│   └── ActionButtons (Edit, Delete)
├── ProductForm (Modal/Drawer)
│   ├── FormFields
│   │   ├── TextInputs (Code: 4 digit alfanumerik)
│   │   ├── NumberInputs (Modal Awal, Harga Sewa)
│   │   ├── SelectDropdowns (Category)
│   │   └── ValidationMessages
│   ├── ImageUpload
│   │   ├── DragDropArea
│   │   ├── ImagePreview
│   │   └── UploadProgress
│   └── ActionButtons
│       ├── CancelButton
│       └── SaveButton
└── CategoryManagerModal
    ├── CategoryList
    ├── CategoryForm
    └── ActionButtons
```
