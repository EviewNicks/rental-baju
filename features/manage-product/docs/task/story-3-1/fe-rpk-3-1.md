# Task FE-RPK-3-1: Frontend Size & Color Implementation untuk Manage-Product

## Daftar Isi

1. [Pendahuluan](mdc:#pendahuluan)
2. [Perbandingan dengan Referensi](mdc:#perbandingan-dengan-referensi)
3. [Batasan dan Penyederhanaan](mdc:#batasan-dan-penyederhanaan)
4. [Spesifikasi Teknis FE](mdc:#spesifikasi-teknis-fe)
5. [Implementasi Teknis](mdc:#implementasi-teknis)
6. [Test Plan](mdc:#test-plan)

## Pendahuluan

Task ini mengimplementasikan field Size dan Color pada frontend manage-product dengan focus pada simplifikasi arsitektur dari struktur 2-tier hooks menjadi 3-tier sederhana sesuai docs/rules/architecture.md. Implementation mencakup enhancement pada semua komponen React untuk mendukung Size dan Color, update custom hooks untuk state management yang lebih sederhana, dan integrasi API yang streamlined.

Nilai bisnis utama adalah meningkatkan user experience dalam pengelolaan inventori pakaian rental dengan informasi yang lebih spesifik dan filtering yang lebih efektif.

> **  PENTING**: Dalam task docs jangan memberikan contoh pseudocode details

## Perbandingan dengan Referensi

| Fitur        | Current Implementation | Target Implementation |
| ------------ | --------------------- | -------------------- |
| Architecture | 2-tier complex hooks  | 3-tier simplified    |
| Size Field   | Not implemented       | Dropdown with presets |
| Color Field  | Not implemented       | Flexible like categories |
| API Layer    | Complex adapters      | Simple fetchers      |
| State Mgmt   | Over-engineered       | useState/useReducer  |

## Batasan dan Penyederhanaan Implementasi

### Technical Constraints

- Simplifikasi dari enterprise-level architecture ke business-appropriate
- Menghilangkan over-abstraction dalam adapter layers
- Fokus pada rental business needs, bukan general e-commerce

### UI/UX Constraints

- Konsistensi dengan existing design system (@styles/globals.css)
- Mobile-first responsive approach
- Accessibility compliance (WCAG AA)

### Performance Constraints

- Bundle size optimization dengan component lazy loading
- Efficient state updates untuk large product lists
- Optimized filtering dan search performance

## Spesifikasi Teknis FE

### Struktur Data (TypeScript Interfaces)

```typescript
// Enhanced Product interface
interface Product {
  id: string
  code: string
  name: string
  description?: string
  category: string
  size?: string          // New field
  color?: string         // New field
  modalAwal: number
  hargaSewa: number
  status: 'Tersedia' | 'Disewa' | 'Maintenance'
  image?: string
  quantity: number
  totalPendapatan: number
}

// Enhanced form data interface
interface ProductFormData {
  code: string
  name: string
  description: string
  category: string
  size: string           // New field
  color: string          // New field
  modalAwal: number
  hargaSewa: number
  status: string
  image?: File
}

// Enhanced filter interface
interface ProductFilters {
  search: string
  category: string
  status: string
  size?: string          // New filter
  color?: string         // New filter
}
```

### Komponen yang Dibutuhkan

#### Presentation Layer Components

**Enhanced Existing Components**:
- `ProductTable.tsx` - Add Size dan Color columns
- `ProductGrid.tsx` - Add Size dan Color badges  
- `ProductForm.tsx` - Add Size dan Color form fields
- `SearchFilterBar.tsx` - Add Size dan Color filters
- `ProductInfoSection.tsx` - Display Size dan Color in detail

**New Components**:
- `SizeSelector.tsx` - Dropdown for size selection
- `ColorSelector.tsx` - Color picker/input component
- `SizeColorBadge.tsx` - Display badge for size/color combination

#### Existing UI Components to Use

- `components/ui/select.tsx` - For size dropdown
- `components/ui/input.tsx` - For color input
- `components/ui/badge.tsx` - For size/color badges
- `components/ui/button.tsx` - For filter toggles

### Custom Hooks yang Dibutuhkan

#### Logic Layer Hooks (Simplified)

**Enhanced Existing Hooks**:
- `useProduct.ts` - Consolidated product operations (replace complex 2-tier)
- `useProductFilters.ts` - Enhanced with size/color filtering

**New Hooks**:
- `useSizeOptions.ts` - Manage size presets and validation
- `useColorOptions.ts` - Manage color selection and validation

#### State Management Strategy

- **Local State**: useState untuk form fields dan UI state
- **Feature Context**: Hanya untuk truly shared state (product list)
- **No Complex Adapters**: Direct API calls via simple fetchers

### Routing & Layout Changes

#### App Router Changes

- No major routing changes needed
- Enhanced existing pages dengan Size/Color support
- Form validation updates untuk new fields

## Implementasi Teknis

### Component Architecture

**3-Tier Simplified Approach**:
1. **Presentation**: React components dengan props drilling minimal
2. **Logic**: Custom hooks untuk business logic dan state
3. **Data**: Simple API fetchers di `features/manage-product/api.ts`

**Component Enhancement Strategy**:
- Enhance existing components instead of rewriting
- Add size/color props dengan backward compatibility
- Maintain existing component APIs where possible

### Custom Hooks Implementation

**Consolidated useProduct Hook**:
- Merge existing complex hooks into single useProduct
- Handle CRUD operations dengan Size/Color
- Simplified state management dengan useReducer

**Enhanced useProductFilters Hook**:
- Add size dan color filter logic
- Maintain existing filter functionality
- Optimize performance dengan useMemo untuk large lists

### API Integration

#### API Client/Fetcher

**Enhanced features/manage-product/api.ts**:
- Update createProduct untuk handle size/color
- Update updateProduct untuk handle new fields
- Update getProducts untuk support size/color filtering
- Simple error handling dengan consistent format

#### Error Handling

- Consistent error format across all API calls
- User-friendly error messages untuk Size/Color validation
- Loading states untuk Size/Color operations

### TypeScript Types

#### Type Definitions

**Enhanced features/manage-product/types.ts**:
- Update Product interface dengan size/color
- Add SizeOption dan ColorOption types
- Add validation schemas untuk new fields

## Flow Pengguna

### User Interaction Flow

1. User membuka halaman manage product
2. Enhanced ProductTable/Grid menampilkan size/color
3. User dapat filter berdasarkan size/color di SearchFilterBar
4. User membuka form add/edit product
5. User memilih size dari dropdown preset
6. User memilih/input color dengan ColorSelector
7. Form validation mencakup size/color validation
8. Data tersimpan dengan size/color information

### Happy Path

- User berhasil menambah produk dengan size/color
- Filtering berdasarkan size/color bekerja dengan baik
- Display size/color konsisten di semua views

### Error Paths

- Validation error untuk invalid size/color ditampilkan dengan jelas
- API error untuk size/color operations di-handle gracefully
- Empty state untuk filtered results dengan size/color

## Test Plan

### Unit Testing

**Component Testing**:
- SizeSelector dropdown functionality
- ColorSelector input validation
- Enhanced ProductForm dengan size/color fields
- Enhanced filtering logic di useProductFilters

**Hook Testing**:
- useProduct CRUD operations dengan size/color
- useSizeOptions preset management
- useColorOptions validation logic

### Integration Testing

**Component Integration**:
- ProductForm submission dengan size/color data
- SearchFilterBar filtering dengan multiple criteria
- ProductTable/Grid display dengan size/color columns

**API Integration**:
- Product creation dengan size/color fields
- Product updates termasuk size/color changes
- Product filtering berdasarkan size/color

### Accessibility Testing

- Keyboard navigation untuk SizeSelector dan ColorSelector
- Screen reader compatibility untuk size/color information
- Color contrast testing untuk ColorSelector
- ARIA labels untuk new form fields

## Acceptance Criteria

| Kriteria Frontend                                     | Status | Keterangan |
| ----------------------------------------------------- | ------ | ---------- |
| ProductForm memiliki fields Size dan Color           |        |            |
| ProductTable menampilkan kolom Size dan Color        |        |            |
| ProductGrid menampilkan badge Size dan Color         |        |            |
| SearchFilterBar support filtering Size dan Color     |        |            |
| Size dropdown dengan preset values (S,M,L,XL,XXL)    |        |            |
| Color input/selector dengan validation               |        |            |
| Form validation mencakup Size dan Color              |        |            |
| API integration untuk Size dan Color fields          |        |            |
| Error handling user-friendly untuk Size/Color        |        |            |
| Responsive design untuk semua device                 |        |            |
| Accessibility compliance (WCAG AA)                   |        |            |
| Performance optimization untuk filtering             |        |            |

---

## Related Tasks

- **UI Design Reference**: [Task UI-RPK-3-1: Enhancement Desain UI Size & Color](../ui-rpk-3-1.md)
- **Backend API Requirements**: [Task BE-RPK-3-1: Backend Size & Color Schema & API](../be-rpk-3-1.md)
- **E2E Testing**: [Task E2E-RPK-3-1: E2E Testing Size & Color Features](../e2e-rpk-3-1.md)

## Architecture Compliance

- **Presentation Layer**: `features/manage-product/components/`
- **Logic Layer**: `features/manage-product/hooks/`
- **Data Layer**: `features/manage-product/api.ts`
- **Alignment**: Sesuai docs/rules/architecture.md simplified 3-tier

## Implementation Order

### Phase 1: Core Enhancement (Sprint 1)
1. Update TypeScript interfaces untuk Size dan Color
2. Enhance ProductForm dengan Size dan Color fields
3. Update API fetcher untuk handle new fields
4. Basic validation untuk Size dan Color

### Phase 2: Display Enhancement (Sprint 1)  
1. Enhance ProductTable dengan Size dan Color columns
2. Enhance ProductGrid dengan Size dan Color badges
3. Update ProductInfoSection untuk detail view
4. Styling consistency dengan design system

### Phase 3: Filtering & Search (Sprint 2)
1. Enhance SearchFilterBar dengan Size dan Color filters
2. Update useProductFilters hook
3. Implement filtering logic dan performance optimization
4. Add sort functionality untuk Size dan Color

### Phase 4: Testing & Polish (Sprint 2)
1. Comprehensive unit dan integration testing
2. Accessibility compliance testing
3. Performance optimization
4. Bug fixes dan UX improvements

## Architecture Migration Strategy

### From Current 2-Tier to 3-Tier

**Phase 1: Simplification**
- Consolidate existing hook layers
- Remove unnecessary adapter abstractions
- Streamline type definitions

**Phase 2: Enhancement**
- Add Size dan Color functionality
- Implement simplified state management
- Update API integration

**Phase 3: Optimization**
- Performance tuning
- Bundle size optimization
- Final testing dan validation