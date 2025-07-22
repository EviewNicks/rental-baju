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

Task ini bertujuan untuk mengimplementasikan antarmuka pengguna yang memungkinkan kasir untuk mendaftarkan penyewa baru dan membuat transaksi penyewaan dengan efisien. Frontend akan mengintegrasikan desain UI dari task-ui-25 dengan API backend dari task-be-26, menggunakan React components, custom hooks, dan React Query untuk state management yang optimal.

Implementation ini akan mengikuti arsitektur 3-layer project dengan fokus pada Presentation Layer (React components) dan Logic Layer (custom hooks) untuk memastikan separation of concerns yang baik dan maintainability code yang tinggi.

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
// features/kasir/types.ts
interface Penyewa {
  id: string;
  nama: string;
  telepon: string;
  alamat: string;
  email?: string;
  nik?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreatePenyewaData {
  nama: string;
  telepon: string;
  alamat: string;
  email?: string;
  nik?: string;
}

interface Produk {
  id: string;
  nama: string;
  kategori: string;
  hargaSewa: number;
  status: 'available' | 'rented' | 'maintenance';
  imageUrl?: string;
  ukuran?: string;
}

interface TransaksiItem {
  produkId: string;
  quantity: number;
  durasi: number; // dalam hari
}

interface CreateTransaksiData {
  penyewaId: string;
  items: TransaksiItem[];
  tglMulai: string;
  tglSelesai?: string;
}

interface Transaksi {
  id: string;
  kode: string;
  penyewa: Pick<Penyewa, 'nama' | 'telepon'>;
  items: Array<{
    produk: Pick<Produk, 'nama'>;
    quantity: number;
    hargaSewa: number;
  }>;
  totalHarga: number;
  status: string;
  createdAt: string;
}
```

### Komponen yang Dibutuhkan

#### Presentation Layer Components

1. **`CustomerRegistrationForm`** (`features/kasir/components/`)
   - Props: `onSubmit: (data: CreatePenyewaData) => void, isLoading: boolean`
   - State: Form data validation, field errors
   - Features: Real-time validation, responsive layout

2. **`ProductSelector`** (`features/kasir/components/`)
   - Props: `onProductSelect: (items: TransaksiItem[]) => void, selectedItems: TransaksiItem[]`
   - State: Search query, filters, selected products
   - Features: Grid layout, search, category filters

3. **`TransactionSummary`** (`features/kasir/components/`)
   - Props: `penyewa: Penyewa, items: TransaksiItem[], onConfirm: () => void`
   - State: Final confirmation state
   - Features: Price calculation, transaction preview

4. **`RentalProcessPage`** (`app/kasir/rental/page.tsx`)
   - Main page component yang orchestrates all sub-components
   - Handles overall state management dan navigation

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
   - Functions: `createPenyewa, getPenyewa, searchPenyewa`
   - State: Loading, error, success states
   - Integration: React Query untuk caching

2. **`useTransaksi`** (`features/kasir/hooks/`)
   - Functions: `createTransaksi, getTransaksi`
   - State: Transaction creation state
   - Integration: Optimistic updates

3. **`useProduk`** (`features/kasir/hooks/`)
   - Functions: `getAvailableProducts, searchProducts`
   - State: Product list, filters, search
   - Integration: Real-time filtering

4. **`useRentalProcess`** (`features/kasir/hooks/`)
   - Orchestration hook untuk manage entire rental flow
   - State: Current step, form data, selected products
   - Functions: Step navigation, form validation, final submission

#### State Management Strategy

- **Local State**: `useState` untuk component-specific state (form inputs, UI state)
- **Server State**: React Query untuk API data dengan proper caching
- **Global State**: Context minimal usage, mostly untuk user session
- **Form State**: React Hook Form untuk complex form handling dengan validation

### Routing & Layout Changes

#### App Router Changes

- **New Page**: `app/kasir/rental/page.tsx` - Main rental process page
- **Layout**: Extend existing kasir layout untuk include navigation
- **Loading**: `loading.tsx` untuk show skeleton loading states
- **Error**: `error.tsx` untuk handle dan display errors gracefully

## Implementasi Teknis

### Component Architecture

**Hierarchical Structure**:
```
RentalProcessPage
├── CustomerRegistrationForm
├── ProductSelector
│   ├── ProductGrid
│   ├── ProductFilters
│   └── SelectedItemsCart
└── TransactionSummary
    ├── CustomerInfo
    ├── ItemsList
    └── PriceBreakdown
```

**State Flow**: Parent component manages overall state, child components receive props dan emit events upward.

### Custom Hooks Implementation

**`usePenyewa` Implementation Strategy**:
- React Query queries dengan proper cache keys
- Optimistic updates untuk create operations  
- Error handling dengan user-friendly messages
- Debounced search untuk performance

**`useRentalProcess` Orchestration**:
- Multi-step wizard state management
- Form data persistence across steps
- Validation at each step transition
- Final submission dengan transaction coordination

### API Integration

#### API Client/Fetcher

**File**: `features/kasir/api.ts`
```typescript
class KasirApi {
  // Penyewa operations
  async createPenyewa(data: CreatePenyewaData): Promise<Penyewa>
  async searchPenyewa(query: string): Promise<Penyewa[]>
  
  // Transaksi operations
  async createTransaksi(data: CreateTransaksiData): Promise<Transaksi>
  
  // Produk operations
  async getAvailableProducts(filters?: ProductFilters): Promise<Produk[]>
}
```

#### Error Handling

- **Network Errors**: Toast notifications dengan retry options
- **Validation Errors**: Field-level error display
- **Server Errors**: Graceful fallback dengan error boundaries
- **Loading States**: Skeleton components dan loading spinners

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

1. **Page Load**: Kasir navigates ke rental page, components load dengan skeleton states
2. **Customer Registration**: 
   - Fill form dengan real-time validation
   - Submit creates penyewa via API
   - Success transitions ke product selection
3. **Product Selection**:
   - Browse available products dengan search/filter
   - Add items ke rental cart dengan quantity/duration
   - Real-time price calculation
4. **Transaction Review**:
   - Review customer info dan selected items
   - Confirm total price dan rental terms
5. **Final Submission**:
   - Create transaction via API
   - Display transaction code dan success message

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

## Pertanyaan untuk Diklarifikasi

1. **Apakah perlu implement auto-save functionality** untuk draft transactions jika user navigates away?
2. **Bagaimana handle case dimana product becomes unavailable** while user is in selection process?
3. **Apakah perlu implement bulk product selection** atau individual selection sufficient?
4. **Real-time inventory updates** - apakah perlu websocket connection atau polling cukup?
5. **Mobile-first approach** - apakah mobile experience adalah priority atau desktop?
6. **Data persistence** - berapa lama form data should persist di browser sebelum cleared?

## Acceptance Criteria

| Kriteria Frontend                                        | Status | Keterangan |
| -------------------------------------------------------- | ------ | ---------- |
| CustomerRegistrationForm dengan real-time validation    |        |            |
| ProductSelector dengan search dan filter functionality  |        |            |
| TransactionSummary dengan accurate price calculation    |        |            |
| Complete rental flow dari registration sampai transaction |        |            |
| React Query integration untuk efficient data fetching   |        |            |
| Responsive design untuk mobile, tablet, desktop         |        |            |
| Error handling dengan user-friendly messages            |        |            |
| Loading states untuk all async operations               |        |            |
| Accessibility compliance (WCAG AA)                      |        |            |
| TypeScript strict typing untuk all components           |        |            |
| Integration dengan backend APIs successful              |        |            |
| Performance targets: < 3s initial load, smooth interactions |        |            |

---

**Task ID**: RPK-27  
**Story**: RPK-21 - Sebagai kasir, saya ingin mendaftarkan penyewa baru dan membuat transaksi penyewaan agar proses sewa dapat dimulai  
**Type**: Frontend Development Task  
**Priority**: High  
**Estimated Effort**: 6 hours  
**Dependencies**: 
- **UI Design**: [task-ui-25.md](task-ui-25.md) - Design specifications dan component layout
- **Backend API**: [task-be-26.md](task-be-26.md) - API endpoints dan data contracts