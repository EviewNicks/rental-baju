# Task FE-27: Frontend Implementation Pendaftaran Penyewa dan Transaksi Penyewaan

## Daftar Isi

1. [Pendahuluan](#pendahuluan)
2. [Batasan dan Penyederhanaan](#batasan-dan-penyederhanaan)
3. [Spesifikasi Teknis FE](#spesifikasi-teknis-fe)
4. [Implementasi Teknis](#implementasi-teknis)
5. [Flow Pengguna](#flow-pengguna)
6. [Peningkatan UX](#peningkatan-ux)
7. [Test Plan](#test-plan)
8. [Pertanyaan untuk Diklarifikasi](#pertanyaan-untuk-diklarifikasi)

## Pendahuluan

Task ini bertujuan untuk **mengubah UI mock-data menjadi API data** dengan mengintegrasikan UI components yang sudah diimplementasi dalam task-ui-25 dengan backend APIs dari task-be-26. Focus utama adalah pada data integration layer menggunakan React Query untuk efficient data fetching dan custom hooks untuk business logic management.

**✅ Dependencies Status:**
- **UI-25**: ✅ **COMPLETED** - 3 pages + 15+ components dengan glass morphism design
- **BE-26**: ✅ **COMPLETED** - 11 API endpoints dengan Indonesian field naming

**🎯 Implementation Focus:**
Implementation ini akan mengikuti arsitektur 3-layer project dengan fokus pada **Data Integration Layer** - menghubungkan existing UI components dengan real API endpoints, replacing mock data dengan server state management.

## Batasan dan Penyederhanaan Implementasi

### Technical Constraints

- **Next.js App Router**: Harus menggunakan App Router dengan Server Components dimana applicable
- **React Query**: Wajib menggunakan untuk data fetching dan caching
- **Existing UI Components**: Maksimalkan penggunaan komponen dari `components/ui/`
- **TypeScript**: Strict typing untuk semua components dan hooks
- **Tailwind CSS**: Styling harus konsisten dengan design system yang ada

### UI/UX Constraints

- **Design System Compliance**: Harus mengikuti design tokens dari `@styles/globals.css`
- **Responsive Design**: Support mobile, tablet, dan desktop dengan layout yang optimal
- **Performance**: Loading time < 3 detik untuk initial render
- **Accessibility**: Minimum WCAG AA compliance

### Performance Constraints

- **Bundle Size**: Komponen tidak boleh significantly increase bundle size
- **Re-renders**: Optimize untuk minimize unnecessary re-renders
- **API Calls**: Efficient API calling dengan proper caching strategy
- **Memory Usage**: Prevent memory leaks dari unclosed subscriptions

## Spesifikasi Teknis FE

### Struktur Data (TypeScript Interfaces)

```typescript
// features/kasir/types.ts - Updated to match BE-26 API contracts
interface Penyewa {
  id: string;
  nama: string;
  telepon: string;
  alamat: string;
  email?: string;
  nik?: string;
  foto?: string;
  catatan?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreatePenyewaData {
  nama: string;
  telepon: string;
  alamat: string;
  email?: string;
  nik?: string;
  foto?: string;
  catatan?: string;
}

interface Produk {
  id: string;
  code: string;
  name: string;
  hargaSewa: number;
  availableQuantity: number;
  category: {
    id: string;
    name: string;
  };
  imageUrl?: string;
  ukuran?: string;
  warna?: string;
}

interface TransaksiItem {
  produkId: string;
  jumlah: number; // quantity dalam bahasa Indonesia
  durasi: number; // dalam hari
  hargaSewa: number;
  subtotal: number;
}

interface CreateTransaksiData {
  penyewaId: string;
  items: TransaksiItem[];
  tglMulai: string;
  tglSelesai?: string;
  metodeBayar?: string;
  catatan?: string;
}

interface Transaksi {
  id: string;
  kode: string; // Format: TXN-YYYYMMDD-XXX
  penyewa: Pick<Penyewa, 'nama' | 'telepon' | 'alamat'>;
  items: Array<{
    produk: Pick<Produk, 'name' | 'code'>;
    jumlah: number;
    durasi: number;
    hargaSewa: number;
    subtotal: number;
  }>;
  totalHarga: number;
  jumlahBayar: number;
  sisaBayar: number;
  status: 'active' | 'selesai' | 'terlambat' | 'cancelled';
  tglMulai: string;
  tglSelesai?: string;
  tglKembali?: string;
  metodeBayar?: string;
  catatan?: string;
  createdAt: string;
  updatedAt: string;
}

// Additional interfaces from BE-26 implementation
interface Pembayaran {
  id: string;
  transaksiId: string;
  jumlah: number;
  metode: string;
  referensi?: string;
  catatan?: string;
  createdAt: string;
}

interface AktivitasTransaksi {
  id: string;
  transaksiId: string;
  jenis: string;
  deskripsi: string;
  createdBy: string;
  createdAt: string;
}

interface DashboardStats {
  transactions: {
    total: number;
    active: number;
    completed: number;
    completionRate: number;
  };
  customers: {
    total: number;
    thisMonth: number;
    growth: number;
  };
  payments: {
    totalRevenue: number;
    thisMonth: number;
    pendingAmount: number;
  };
  inventory: {
    totalProducts: number;
    availableProducts: number;
    rentedProducts: number;
  };
  alerts: {
    overdueTransactions: number;
    lowStock: number;
    paymentReminders: number;
  };
}
```

### Komponen yang Dibutuhkan

#### Presentation Layer Components

1. **`CustomerRegistrationModal`** (`features/kasir/components/form/`)
   - Props: `isOpen: boolean, onClose: () => void, onSubmit: (data: CreatePenyewaData) => void, isLoading: boolean`
   - State: Form data validation, field errors
   - Features: Modal dialog, real-time validation, two-column layout
   - Integration: Called from `CustomerBiodataStep` component

2. **`ProductSelectionStep`** (`features/kasir/components/form/`)
   - Props: `selectedProducts: ProductSelection[], onAddProduct: (product: Product, quantity: number) => void, onRemoveProduct: (productId: string) => void, onNext: () => void`
   - State: Search query, filters, selected products, cart state
   - Features: Product grid, quantity controls, real-time cart updates
   - Integration: Part of 3-step stepper workflow

3. **`PaymentSummaryStep`** (`features/kasir/components/form/`)
   - Props: `formData: TransactionFormData, totalAmount: number, onSubmit: () => Promise<boolean>, onPrev: () => void`
   - State: Payment method selection, final confirmation
   - Features: Transaction summary, payment method selection, submit functionality
   - Integration: Final step in transaction creation workflow

4. **`CustomerBiodataStep`** (`features/kasir/components/form/`)
   - Props: `selectedCustomer: Customer | null, onSelectCustomer: (customer: Customer) => void, onNext: () => void, onPrev: () => void`
   - State: Customer search, customer selection state
   - Features: Customer autocomplete, new customer registration trigger
   - Integration: Middle step in transaction workflow

4. **`TransactionFormPage`** (`app/(kasir)/dashboard/new/page.tsx`)
   - Main page component yang orchestrates all sub-components untuk create transaction
   - Implements 3-step stepper workflow (sesuai UI-25 implementation)
   - Handles overall state management dan navigation
   - Integrates dengan `useTransactionForm` hook

#### Existing UI Components

- **Button**: Primary (gold) untuk CTA, secondary untuk cancel actions
- **Input**: Form inputs dengan validation styling
- **Card**: Container untuk form sections dan product cards
- **Badge**: Status indicators untuk product availability
- **Table**: Optional untuk product list view
- **Modal**: Confirmation dialog untuk final transaction

### Custom Hooks yang Dibutuhkan

#### Logic Layer Hooks

1. **`usePenyewa`** (`features/kasir/hooks/`)
   - Functions: `createPenyewa, getPenyewaById, getPenyewaList, updatePenyewa`
   - State: Loading, error, success states untuk customer operations
   - Integration: React Query dengan proper cache keys
   - Features: Debounced search, optimistic updates

2. **`useTransaksi`** (`features/kasir/hooks/`)
   - Functions: `createTransaksi, getTransaksiByKode, getTransaksiList, updateTransaksi`
   - State: Transaction CRUD operations state
   - Integration: Optimistic updates, proper error handling
   - Features: Status filtering, pagination support

3. **`useTransactions`** (`features/kasir/hooks/`) - untuk Dashboard
   - Functions: `getTransactions, updateFilters, refreshData`
   - State: Dashboard transactions list, filters, search
   - Integration: Real-time filtering, tab-based status filtering
   - Features: Debounced search, automatic refetch

4. **`useProduk`** (`features/kasir/hooks/`)
   - Functions: `getAvailableProducts, searchProducts`
   - State: Product catalog, availability status, search filters
   - Integration: Real-time inventory checking
   - Features: Category filtering, availability checks

5. **`useTransactionForm`** (`features/kasir/hooks/`) - Orchestration Hook
   - Orchestration hook untuk manage entire 3-step transaction workflow
   - State: Current step, form data, selected products, customer selection
   - Functions: Step navigation, form validation, final submission
   - Integration: Coordinates all other hooks untuk complete workflow

6. **`useDashboard`** (`features/kasir/hooks/`)
   - Functions: `getDashboardStats, refreshStats`
   - State: Dashboard statistics, loading states
   - Integration: Real-time dashboard metrics
   - Features: Auto-refresh, error handling

7. **`usePembayaran`** (`features/kasir/hooks/`)
   - Functions: `createPembayaran, updatePembayaran`
   - State: Payment operations state
   - Integration: Transaction balance updates
   - Features: Payment method handling, receipt generation

#### State Management Strategy

- **Local State**: `useState` untuk component-specific state (form inputs, UI state)
- **Server State**: React Query untuk API data dengan proper caching
- **Global State**: Context minimal usage, mostly untuk user session
- **Form State**: React Hook Form untuk complex form handling dengan validation

### Routing & Layout Changes

#### App Router Changes

- **Main Pages** (sesuai UI-25 implementation):
  - `app/(kasir)/dashboard/page.tsx` - Dashboard dengan TransactionsDashboard component
  - `app/(kasir)/dashboard/new/page.tsx` - Transaction form dengan 3-step stepper
  - `app/(kasir)/dashboard/[id]/page.tsx` - Transaction detail page
- **Layout**: Gunakan existing kasir layout `app/(kasir)/layout.tsx`
- **Loading**: `loading.tsx` untuk show skeleton loading states di setiap route
- **Error**: `error.tsx` untuk handle dan display errors gracefully
- **Route Structure**: Follow UI-25 implementation dengan `/dashboard` sebagai base path

## Implementasi Teknis

### Component Architecture

**Hierarchical Structure** (Updated untuk UI-25 implementation):
```
TransactionFormPage (3-step stepper)
├── Stepper Component
├── Step 1: ProductSelectionStep
│   ├── ProductGrid
│   ├── ProductFilters  
│   ├── SelectedItemsCart
│   └── ProductCard components
├── Step 2: CustomerBiodataStep
│   ├── Customer Search/Autocomplete
│   ├── CustomerRegistrationModal (popup)
│   └── Selected Customer Display
└── Step 3: PaymentSummaryStep
    ├── CustomerInfo Summary
    ├── ItemsList Summary
    ├── PriceBreakdown
    ├── Payment Method Selection
    └── Final Submit Button

Dashboard Pages:
TransactionsDashboard
├── TransactionTabs (with status filtering)
├── Search Input
└── TransactionsTable (with action buttons)

TransactionDetailPage
├── CustomerInfoCard
├── ProductDetailCard
├── PaymentSummaryCard
├── ActivityTimeline
└── ActionButtonsPanel
```

**State Flow**: Parent component manages overall state, child components receive props dan emit events upward.

### Custom Hooks Implementation

**Implementation Strategies (Updated for BE-26 Integration):**

**`usePenyewa` Implementation**:
- React Query dengan cache keys: `["penyewa", { page, search }]`
- Optimistic updates untuk create operations dengan rollback on error
- Indonesian error messages: "Gagal menyimpan data penyewa"
- Debounced search (300ms delay) untuk performance
- Phone number uniqueness validation

**`useTransactionForm` Orchestration** (Renamed dari useRentalProcess):
- 3-step wizard state management (ProductSelection → CustomerBiodata → PaymentSummary)
- Form data persistence dalam localStorage dengan auto-cleanup
- Validation at each step dengan Indonesian error messages
- Final submission koordinasi dengan multiple API calls:
  1. Validate product availability
  2. Create/select customer 
  3. Create transaction dengan auto-generated code
  4. Update product inventory status

**`useTransactions` Dashboard Integration**:
- React Query dengan infinite query untuk pagination
- Tab-based filtering dengan status counts
- Real-time updates dengan background refetch
- Search dengan debounced input dan highlight results

**API Error Handling Strategy**:
- Network errors: Toast dengan retry button
- Validation errors: Field-level dengan Indonesian messages
- Server errors: Graceful fallback dengan support contact
- Loading states: Skeleton components dari UI-25

### API Integration

#### API Client/Fetcher

**File**: `features/kasir/api.ts` - Updated to match BE-26 endpoints
```typescript
class KasirApi {
  // Dashboard operations
  async getDashboardStats(): Promise<DashboardStats>
  
  // Penyewa operations
  async createPenyewa(data: CreatePenyewaData): Promise<Penyewa>
  async getPenyewaById(id: string): Promise<Penyewa>
  async getPenyewaList(params: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: Penyewa[]; total: number; }>
  async updatePenyewa(id: string, data: Partial<CreatePenyewaData>): Promise<Penyewa>
  
  // Transaksi operations
  async createTransaksi(data: CreateTransaksiData): Promise<Transaksi>
  async getTransaksiByKode(kode: string): Promise<Transaksi>
  async getTransaksiList(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{ data: Transaksi[]; total: number; }>
  async updateTransaksi(kode: string, data: Partial<CreateTransaksiData>): Promise<Transaksi>
  
  // Produk operations
  async getAvailableProducts(params?: {
    categoryId?: string;
    search?: string;
    available?: boolean;
  }): Promise<Produk[]>
  
  // Pembayaran operations
  async createPembayaran(data: {
    transaksiId: string;
    jumlah: number;
    metode: string;
    referensi?: string;
    catatan?: string;
  }): Promise<Pembayaran>
  async updatePembayaran(id: string, data: Partial<{
    jumlah: number;
    metode: string;
    referensi?: string;
    catatan?: string;
  }>): Promise<Pembayaran>
}
```

#### Error Handling (Updated untuk Indonesian UX)

**Network Errors:**
```typescript
// Toast notification dengan retry
"Koneksi bermasalah. Silakan coba lagi."
// Retry button: "Coba Lagi"
```

**Validation Errors (Indonesian Messages):**
```typescript
const errorMessages = {
  required: "Field ini wajib diisi",
  phone: "Format nomor telepon tidak valid",
  email: "Format email tidak valid",
  duplicate: "Nomor telepon sudah terdaftar"
}
```

**Server Errors:**
- Error boundaries dengan fallback UI
- "Terjadi kesalahan pada server. Hubungi tim support."
- Automatic error reporting untuk debugging

**Loading States (Sesuai UI-25):**
- Skeleton components untuk table dan cards
- Button loading dengan spinner dan disabled state
- Progressive loading untuk better perceived performance

### TypeScript Types

#### Type Definitions

**File**: `features/kasir/types.ts`
- Complete type definitions untuk all data structures
- API request/response types
- Component props types
- Hook return types
- Form validation schemas (Zod integration)

## Flow Pengguna

### User Interaction Flow

**Updated Flow (sesuai UI-25 dan BE-26 implementation):**

1. **Dashboard Access**: Kasir navigates ke `/dashboard`, views TransactionsDashboard
2. **Start New Transaction**: Click "Tambah Transaksi" → Navigate ke `/dashboard/new`
3. **Step 1 - Product Selection**: 
   - Browse available products dengan search/filter (via `useProduk` hook)
   - Add items ke cart dengan quantity controls
   - Real-time price calculation dan availability checking
   - Click "Next" untuk proceed ke Step 2
4. **Step 2 - Customer Data**:
   - Search existing customers atau register new customer
   - CustomerRegistrationModal untuk new customer registration
   - Select customer dan proceed ke Step 3
5. **Step 3 - Payment Summary**:
   - Review complete transaction summary
   - Select payment method
   - Add optional notes
   - Submit transaction (creates via BE-26 API)
6. **Success State**:
   - Display generated transaction code (format: TXN-YYYYMMDD-XXX)
   - Auto-redirect ke dashboard setelah 2 seconds
   - Transaction appears dalam dashboard table

### Happy Path

- Form validation passes → API calls succeed → User gets immediate feedback → Transaction created successfully → Clear success state dengan next action options

### Error Paths

- **Form Validation Errors**: Inline error messages, prevent submission
- **API Errors**: Toast notifications dengan specific error messages
- **Network Issues**: Retry mechanisms dengan offline indicators
- **Server Errors**: Graceful degradation dengan contact support options

## Peningkatan UX

### Loading States

- **Skeleton Loading**: Product grid shows skeleton cards during load
- **Button Loading**: Submit buttons show spinner dengan disabled state
- **Progressive Loading**: Load critical components first, less important ones after
- **Optimistic Updates**: Show success state immediately, rollback on error

### Error Handling UX

- **Inline Validation**: Real-time field validation dengan helpful error messages
- **Toast Notifications**: Non-intrusive error notifications dengan actions
- **Error Boundaries**: Catch JavaScript errors dengan fallback UI
- **Retry Mechanisms**: Easy retry buttons untuk failed operations

### Accessibility Improvements

- **Keyboard Navigation**: Full keyboard support dengan logical tab order
- **ARIA Labels**: Proper labeling untuk screen readers
- **Focus Management**: Manage focus during step transitions
- **Color Contrast**: Ensure proper contrast ratios untuk all text elements
- **Error Announcements**: Screen reader announcements untuk validation errors

## Test Plan

### Unit Testing

- **Component Testing**: React Testing Library untuk test component behavior
- **Hook Testing**: Test custom hooks dengan React Hooks Testing Library  
- **Utility Testing**: Test helper functions dan validation logic
- **API Client Testing**: Mock API responses untuk test data fetching logic

### Integration Testing

- **User Flow Testing**: Test complete customer registration → product selection → transaction creation flow
- **API Integration**: Test actual API calls dengan mock server responses
- **Form Integration**: Test form validation dan submission workflows
- **State Management**: Test React Query integration dan state updates

### E2E Testing

- **Complete User Journey**: Playwright tests untuk full rental process
- **Cross-browser Testing**: Test di Chrome, Firefox, Safari
- **Mobile Testing**: Test responsive behavior pada various devices
- **Performance Testing**: Lighthouse scores untuk load times dan UX metrics

### Accessibility Testing

- **Automated Testing**: axe-core integration untuk catch accessibility issues
- **Keyboard Testing**: Test all interactions dapat dilakukan dengan keyboard only
- **Screen Reader Testing**: Test dengan NVDA/VoiceOver untuk proper announcements
- **Color Blind Testing**: Test interface dengan color vision simulators

## Implementation Guidance (Updated from Evaluation)

### ✅ **Resolved from BE-26 & UI-25 Implementation**
1. **Transaction Code Format**: Confirmed as `TXN-YYYYMMDD-XXX` format
2. **Payment Methods**: Support `cash`, `transfer`, `credit_card` methods
3. **UI Layout**: 3-step stepper workflow dengan glass morphism design
4. **Routing Structure**: `/dashboard` base path dengan nested routes
5. **Status Values**: Use `active`, `selesai`, `terlambat`, `cancelled`
6. **Field Naming**: Indonesian field names (`nama`, `telepon`, `alamat`, etc.)

### ⚠️ **Clarifications Still Needed**
1. **Auto-save functionality**: Implement localStorage backup untuk form data?
2. **Real-time inventory**: Use polling interval atau WebSocket untuk live updates?
3. **Mobile experience priority**: Desktop-first atau mobile-first approach?
4. **Offline functionality**: Handle network interruptions gracefully?
5. **Form validation timing**: Real-time validation atau on-submit only?
6. **Error retry mechanisms**: Automatic retry untuk failed API calls?

## Acceptance Criteria

| Kriteria Frontend (Updated untuk Implementation Alignment) | Status | Keterangan |
| -------------------------------------------------------- | ------ | ---------- |
| TransactionFormPage dengan 3-step stepper workflow      |        | Sesuai UI-25 implementation |
| CustomerRegistrationModal dengan real-time validation   |        | Modal component dari UI-25 |
| ProductSelectionStep dengan search dan filter           |        | Grid layout dengan quantity controls |
| PaymentSummaryStep dengan accurate price calculation    |        | Indonesian rupiah formatting |
| Complete transaction flow dari product → customer → payment |        | 3-step guided workflow |
| React Query integration untuk efficient data fetching   |        | Proper cache keys dan optimistic updates |
| Dashboard integration dengan TransactionsDashboard      |        | Tab-based filtering sesuai UI-25 |
| API integration dengan BE-26 endpoints                  |        | 11 endpoints dengan proper error handling |
| Indonesian field naming consistency                      |        | Match BE-26 field names |
| Status field alignment (active/selesai/terlambat/cancelled) |        | BE-26 status values |
| Responsive design untuk mobile, tablet, desktop         |        | Glass morphism design system |
| Error handling dengan Indonesian error messages         |        | User-friendly localized messages |
| Loading states untuk all async operations               |        | Skeleton components dan loading spinners |
| Accessibility compliance (WCAG AA)                      |        | Keyboard navigation dan screen reader support |
| TypeScript strict typing untuk all components           |        | Updated interfaces dari BE-26 contracts |
| Performance targets: < 3s initial load, smooth interactions |        | Optimized dengan React Query caching |
| Transaction detail page integration                      |        | Sesuai UI-25 TransactionDetailPage |

---

**Task ID**: RPK-27  
**Story**: RPK-21 - Sebagai kasir, saya ingin mendaftarkan penyewa baru dan membuat transaksi penyewaan agar proses sewa dapat dimulai  
**Type**: Frontend Development Task - **Data Integration Focus**  
**Priority**: High  
**Estimated Effort**: 6 hours  
**Status**: ⚠️ **READY FOR IMPLEMENTATION** (Dependencies completed)  
**Last Updated**: 25 Juli 2025 (Post-evaluation alignment)  
**Dependencies**: 
- **UI Design**: [task-ui-25.md](task-ui-25.md) - ✅ **COMPLETED** - Design specifications dan component layout
- **Backend API**: [task-be-26.md](task-be-26.md) - ✅ **COMPLETED** - API endpoints dan data contracts
- **Result Documentation**:
  - [result-ui-25.md](../result-docs/result-ui-25.md) - UI implementation details
  - [result-be-26.md](../result-docs/result-be-26.md) - Backend API implementation details

**Integration Points Verified:**
- ✅ UI Components ready untuk API integration
- ✅ Backend APIs provide complete CRUD operations
- ✅ TypeScript interfaces aligned between layers
- ✅ Indonesian field naming consistency maintained