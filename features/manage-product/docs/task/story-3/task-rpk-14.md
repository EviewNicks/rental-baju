# Task RPK-14: Implementasi Frontend Manage-Product

## Daftar Isi

1. [Pendahuluan](mdc:#pendahuluan)
2. [Batasan dan Penyederhanaan](mdc:#batasan-dan-penyederhanaan)
3. [Spesifikasi Teknis](mdc:#spesifikasi-teknis)
4. [Implementasi Teknis](mdc:#implementasi-teknis)
5. [Test Plan](mdc:#test-plan)
6. [Pertanyaan untuk Diklarifikasi](mdc:#pertanyaan-untuk-diklarifikasi)

## Pendahuluan

Task ini fokus pada implementasi frontend untuk fitur manajemen produk, termasuk komponen UI, state management, dan integrasi dengan backend API. Implementasi akan mengikuti arsitektur feature-first dengan pemisahan layer yang jelas antara Presentation, Business Logic, dan Data Access.

Frontend ini akan menyediakan antarmuka yang intuitif dan responsif untuk producer dalam mengelola inventaris produk, dengan pengalaman pengguna yang smooth dan error handling yang user-friendly.

## Batasan dan Penyederhanaan Implementasi

### Batasan Teknis

- **Framework**: Next.js dengan App Router
- **UI Library**: TailwindCSS + Shadcn/ui components
- **State Management**: React Query untuk server state, Context API untuk global state
- **Form Management**: React Hook Form + Zod validation
- **File Upload**: Custom implementation dengan drag & drop
- **Authentication**: Clerk integration untuk role-based access

### Penyederhanaan

- **Real-time Updates**: Tidak implementasi WebSocket untuk real-time
- **Offline Support**: Tidak implementasi offline functionality
- **Advanced Filtering**: Filter sederhana berdasarkan kategori dan status
- **Bulk Operations**: Tidak implementasi bulk actions pada tahap awal
- **Advanced Search**: Pencarian sederhana berdasarkan nama dan kode

## Spesifikasi Teknis

### Struktur Folder

```
features/product-manage/
├── components/
│   ├── ProductList/
│   │   ├── ProductTable.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductFilters.tsx
│   │   └── ProductPagination.tsx
│   ├── ProductForm/
│   │   ├── ProductForm.tsx
│   │   ├── ImageUpload.tsx
│   │   └── ProductFormModal.tsx
│   └── shared/
│       ├── LoadingSpinner.tsx
│       ├── ErrorMessage.tsx
│       └── ConfirmDialog.tsx
├── hooks/
│   ├── useProducts.ts
│   ├── useProduct.ts
│   ├── useProductForm.ts
│   └── useImageUpload.ts
├── adapters/
│   └── productAdapter.ts
├── types/
│   └── product.ts
├── utils/
│   ├── validation.ts
│   └── formatters.ts
└── page.tsx
```

### TypeScript Interfaces

```typescript
// Product types
interface Product {
  id: string
  code: string
  name: string
  description?: string
  price: number
  quantity: number
  imageUrl?: string
  category?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy?: string
}

// Form types
interface ProductFormData {
  code: string
  name: string
  description: string
  price: number
  quantity: number
  category: string
  image?: File
}

// API response types
interface ProductListResponse {
  products: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Component props
interface ProductTableProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  loading?: boolean
}

interface ProductFormProps {
  product?: Product
  onSubmit: (data: ProductFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}
```

### Validation Schemas

```typescript
import { z } from 'zod'

export const productFormSchema = z.object({
  code: z
    .string()
    .min(1, 'Kode produk wajib diisi')
    .max(20, 'Kode maksimal 20 karakter')
    .regex(/^[A-Z0-9]+$/, 'Kode hanya boleh huruf kapital dan angka'),
  name: z.string().min(1, 'Nama produk wajib diisi').max(100, 'Nama maksimal 100 karakter'),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional(),
  price: z.number().positive('Harga harus positif').max(999999, 'Harga maksimal 999,999'),
  quantity: z
    .number()
    .int('Jumlah harus bilangan bulat')
    .min(0, 'Jumlah minimal 0')
    .max(9999, 'Jumlah maksimal 9999'),
  category: z.string().max(50, 'Kategori maksimal 50 karakter').optional(),
  image: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'Ukuran file maksimal 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Format file harus JPG, PNG, atau WebP',
    )
    .optional(),
})

export type ProductFormData = z.infer<typeof productFormSchema>
```

## Implementasi Teknis

### Arsitektur Layer

Mengikuti arsitektur 3-tier Maguru:

```
Presentation Layer (Components)
    ↓
Business Logic Layer (Hooks)
    ↓
Data Access Layer (Adapters)
    ↓
API Backend
```

### Komponen Utama

#### 1. ProductList Component

```typescript
// features/product-manage/components/ProductList/ProductTable.tsx
interface ProductTableProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  loading?: boolean
}

export function ProductTable({ products, onEdit, onDelete, loading }: ProductTableProps) {
  // Implementation dengan responsive design
  // Desktop: Full table, Mobile: Card view
}
```

#### 2. ProductForm Component

```typescript
// features/product-manage/components/ProductForm/ProductForm.tsx
interface ProductFormProps {
  product?: Product
  onSubmit: (data: ProductFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function ProductForm({ product, onSubmit, onCancel, loading }: ProductFormProps) {
  // Implementation dengan React Hook Form + Zod validation
  // Real-time validation, image upload, responsive design
}
```

#### 3. ImageUpload Component

```typescript
// features/product-manage/components/ProductForm/ImageUpload.tsx
interface ImageUploadProps {
  value?: File | string
  onChange: (file?: File) => void
  error?: string
}

export function ImageUpload({ value, onChange, error }: ImageUploadProps) {
  // Implementation dengan drag & drop
  // Preview image, file validation, loading state
}
```

### Custom Hooks

#### 1. useProducts Hook

```typescript
// features/product-manage/hooks/useProducts.ts
export function useProducts(params: GetProductsParams) {
  // React Query untuk data fetching
  // Pagination, search, filter
  // Error handling, loading states
  return {
    products: data?.products ?? [],
    pagination: data?.pagination,
    isLoading,
    error,
    refetch,
  }
}
```

#### 2. useProduct Hook

```typescript
// features/product-manage/hooks/useProduct.ts
export function useProduct(id: string) {
  // React Query untuk single product
  // Mutations untuk create, update, delete
  return {
    product,
    isLoading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
  }
}
```

#### 3. useProductForm Hook

```typescript
// features/product-manage/hooks/useProductForm.ts
export function useProductForm(product?: Product) {
  // React Hook Form setup
  // Validation, error handling
  // Image upload handling
  return {
    form,
    handleSubmit,
    errors,
    isSubmitting,
    imageFile,
    setImageFile,
  }
}
```

### Adapter Layer

```typescript
// features/product-manage/adapters/productAdapter.ts
export const productAdapter = {
  // Get products with pagination and filters
  async getProducts(params: GetProductsParams): Promise<ProductListResponse> {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, String(value))
    })

    const response = await fetch(`/api/products?${queryParams}`)
    if (!response.ok) throw new Error('Failed to fetch products')
    return response.json()
  },

  // Get single product
  async getProduct(id: string): Promise<Product> {
    const response = await fetch(`/api/products/${id}`)
    if (!response.ok) throw new Error('Failed to fetch product')
    return response.json()
  },

  // Create product
  async createProduct(data: ProductFormData): Promise<Product> {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, value)
    })

    const response = await fetch('/api/products', {
      method: 'POST',
      body: formData,
    })
    if (!response.ok) throw new Error('Failed to create product')
    return response.json()
  },

  // Update product
  async updateProduct(id: string, data: Partial<ProductFormData>): Promise<Product> {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, value)
    })

    const response = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      body: formData,
    })
    if (!response.ok) throw new Error('Failed to update product')
    return response.json()
  },

  // Delete product
  async deleteProduct(id: string): Promise<void> {
    const response = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete product')
  },
}
```

### State Management Strategy

#### Global State (Context)

```typescript
// features/product-manage/context/ProductUIContext.tsx
interface ProductUIState {
  selectedProduct: Product | null
  isFormOpen: boolean
  isDeleteDialogOpen: boolean
  filters: ProductFilters
}

export const ProductUIContext = createContext<ProductUIContextType | null>(null)
```

#### Feature State (Hooks)

```typescript
// features/product-manage/hooks/useProductManagement.ts
export function useProductManagement() {
  // Combine multiple hooks for complex workflows
  // Handle form state, API calls, UI state
  return {
    products,
    pagination,
    filters,
    isLoading,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleSearch,
    handleFilter,
  }
}
```

### Error Handling

#### Error Boundaries

```typescript
// features/product-manage/components/ErrorBoundary.tsx
export class ProductErrorBoundary extends Component {
  // Handle component errors gracefully
  // Show user-friendly error messages
}
```

#### Toast Notifications

```typescript
// features/product-manage/utils/notifications.ts
export const showSuccess = (message: string) => {
  // Show success toast
}

export const showError = (message: string) => {
  // Show error toast
}
```

## Test Plan

### Unit Testing

- **Coverage Target**: 85% code coverage
- **Test Files**:
  - `ProductTable.test.tsx`
  - `ProductForm.test.tsx`
  - `ImageUpload.test.tsx`
  - `useProducts.test.ts`
  - `useProductForm.test.ts`

### Integration Testing

- **Component Integration**: Test interaksi antar komponen
- **API Integration**: Test dengan mock API responses
- **Form Integration**: Test form submission dan validation

### Test Scenarios

#### Component Tests

- [ ] ProductTable renders correctly with data
- [ ] ProductTable shows empty state when no data
- [ ] ProductForm validates input correctly
- [ ] ImageUpload handles file selection
- [ ] Modal opens and closes properly

#### Hook Tests

- [ ] useProducts fetches data correctly
- [ ] useProduct handles CRUD operations
- [ ] useProductForm manages form state
- [ ] Error handling works properly

#### Integration Tests

- [ ] Complete product creation flow
- [ ] Complete product update flow
- [ ] Complete product deletion flow
- [ ] Search and filter functionality

### Performance Testing

- [ ] Component rendering time < 100ms
- [ ] Form submission time < 2s
- [ ] Image upload time < 5s
- [ ] Memory usage optimization

## Pertanyaan untuk Diklarifikasi

1. **Real-time Updates**: Apakah perlu implementasi real-time untuk perubahan produk?
2. **Offline Support**: Apakah perlu cache data untuk offline viewing?
3. **Advanced Search**: Apakah perlu search dengan multiple criteria?
4. **Bulk Operations**: Apakah perlu select multiple products untuk bulk actions?
5. **Export Functionality**: Apakah perlu export data ke PDF/Excel?
6. **Image Gallery**: Apakah perlu multiple images per product?
7. **Product Variants**: Apakah perlu support untuk product variants (size, color)?
8. **Analytics Integration**: Apakah perlu tracking untuk user interactions?

## Dependensi

- **Internal**:
  - RPK-12 (UI Design) - untuk komponen dan styling
  - RPK-13 (Backend) - untuk API integration
- **External**:
  - Shadcn/ui components
  - React Query setup
  - Clerk authentication
  - TailwindCSS configuration

## Definition of Done

- [ ] Semua komponen UI berfungsi dengan baik
- [ ] Form validation robust dan user-friendly
- [ ] Image upload berfungsi dengan drag & drop
- [ ] Responsive design di semua device
- [ ] Unit tests mencapai coverage 85%
- [ ] Integration tests berhasil
- [ ] Error handling komprehensif
- [ ] Loading states dan feedback visual
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Performance sesuai standar
- [ ] Code review disetujui
