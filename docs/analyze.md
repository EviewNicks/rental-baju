# Dokumentasi Analisis Flow System - Create & Edit Product

## Daftar Isi

1. [Executive Summary](#executive-summary)
2. [Create Product Flow](#create-product-flow)
3. [Edit Product Flow](#edit-product-flow)
4. [Layer Architecture Analysis](#layer-architecture-analysis)
5. [Dependency Mapping](#dependency-mapping)
6. [Data Flow Analysis](#data-flow-analysis)
7. [Error Handling Patterns](#error-handling-patterns)
8. [Key Findings & Rekomendasi](#key-findings--rekomendasi)

---

## Executive Summary

Sistem manajemen produk Maguru menggunakan **Feature-First Architecture** dengan **3-Tier Modular Monolith** pattern. Implementasi mengikuti principle separation of concerns dengan clear layer boundaries:

- **Presentation Layer**: React components dengan TypeScript strict mode
- **Business Logic Layer**: Custom hooks dengan React Query untuk state management
- **Data Access Layer**: API routes dengan Prisma ORM untuk database operations

**Tech Stack Implementation:**

- **Frontend**: Next.js App Router, React 19, TailwindCSS, Radix UI
- **State Management**: React Query + Custom Hooks pattern
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL (Supabase)
- **Authentication**: Clerk dengan role-based access control
- **File Storage**: Supabase Storage untuk product images

**Key Architecture Decisions:**

- Feature-based code organization (`features/manage-product/`)
- Type-safe data flow dengan comprehensive TypeScript types
- Client-server type separation untuk Decimal handling
- Form state management menggunakan controlled components
- Error boundary pattern dengan graceful fallbacks

---

## Create Product Flow

### 1. Entry Point - Add Product Page

**File**: `app/producer/manage-product/add/page.tsx`

```typescript
export default function AddProductPage() {
  return (
    <ProductFormPage
      mode="add"
      breadcrumbItems={breadcrumbItems}
      title="Tambah Produk Baru"
      subtitle="Lengkapi informasi produk untuk menambah ke inventaris"
    />
  )
}
```

**Responsibility**:

- Route definition untuk halaman tambah produk
- Props configuration untuk ProductFormPage component
- Breadcrumb navigation setup

### 2. Presentation Layer - ProductFormPage

**File**: `features/manage-product/components/form-product/ProductFormPage.tsx`

**Key Responsibilities:**

- Form state management dengan useState
- Client-side validation dengan inline feedback
- Integration dengan hooks layer untuk data fetching & mutations
- Loading states dan error handling
- File upload handling

**State Management:**

```typescript
// Form data dengan client-safe types (number instead of Decimal)
const [formData, setFormData] = useState<ProductFormData>({
  code: '',
  name: '',
  categoryId: '',
  quantity: 1,
  modalAwal: 0,
  currentPrice: 0,
  description: '',
  imageUrl: null,
})

// Error dan validation states
const [errors, setErrors] = useState<Record<string, string>>({})
const [touched, setTouched] = useState<Record<string, boolean>>({})
```

**Validation Functions:**

- `validateProductCode()`: 4 digit alfanumerik uppercase format
- `validateProductName()`: 3-100 karakter requirement
- `validateCategoryId()`: Required category selection
- `validateNumber()`: Min/max validation dengan type safety
- `validateDescription()`: Maximum 500 karakter limit

**Hook Integrations:**

```typescript
// Data fetching hooks
const {
  data: categoriesData,
  isLoading: isLoadingCategories,
  error: categoriesError,
} = useCategories({ isActive: true })

// Mutation hooks
const createProductMutation = useCreateProduct()
const updateProductMutation = useUpdateProduct()
```

### 3. Business Logic Layer - useCreateProduct Hook

**File**: `features/manage-product/hooks/useProducts.ts`

```typescript
export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: productApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
    },
  })
}
```

**Responsibility**:

- React Query mutation wrapper untuk create operation
- Cache invalidation strategy untuk data consistency
- Error handling delegation ke UI layer
- Success callback untuk cache management

### 4. API Client Layer - productApi

**File**: `features/manage-product/api.ts`

```typescript
createProduct: async (data: FormData | Record<string, string | number | boolean | File | null>) => {
  // Always convert to FormData for multipart/form-data handling
  const formData = data instanceof FormData ? data : new FormData()

  if (!(data instanceof FormData)) {
    // Convert object to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (value instanceof File) {
          formData.append(key, value)
        } else {
          formData.append(key, value.toString())
        }
      }
    })
  }

  const response = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    body: formData,
  })
  return handleResponse(response)
}
```

**Key Features**:

- Smart FormData conversion untuk multipart uploads
- File handling dengan proper content-type detection
- Unified error handling dengan handleResponse helper
- RESTful API pattern compliance

### 5. API Route Handler

**File**: `app/api/products/route.ts`

**Authentication & Authorization:**

```typescript
// Clerk authentication check
const { userId } = await auth()
if (!userId) {
  return NextResponse.json(
    { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
    { status: 401 },
  )
}
```

**Form Data Processing:**

```typescript
// Parse multipart form data
const formData = await request.formData()

// Extract dan convert fields
const code = formData.get('code') as string
const modalAwal = parseFloat(formData.get('modalAwal') as string)
const currentPrice = parseFloat(formData.get('currentPrice') as string)
const quantity = parseInt(formData.get('quantity') as string)
const image = formData.get('image') as File | null
```

**Validation & Processing:**

- Zod schema validation dengan `createProductSchema`
- Number conversion dengan NaN checking
- File upload handling dengan FileUploadService
- Default image fallback strategy

### 6. Business Logic Service - ProductService

**File**: `features/manage-product/services/productService.ts`

**Core Business Logic:**

```typescript
async createProduct(request: CreateProductRequest): Promise<Product> {
  // 1. Input validation dengan Zod schema
  const validatedData = createProductSchema.parse(request)

  // 2. Business rule validation - unique code check
  const existingProduct = await this.prisma.product.findFirst({
    where: { code: validatedData.code, isActive: true }
  })
  if (existingProduct) {
    throw new ConflictError(`Kode produk ${validatedData.code} sudah digunakan`)
  }

  // 3. Referential integrity checks
  const categoryExists = await this.prisma.category.findUnique({
    where: { id: validatedData.categoryId }
  })
  if (!categoryExists) {
    throw new NotFoundError(`Category dengan ID ${validatedData.categoryId} tidak ditemukan`)
  }

  // 4. Database operation dengan proper type conversion
  const prismaProduct = await this.prisma.product.create({
    data: {
      ...validatedData,
      modalAwal: new Decimal(validatedData.modalAwal),
      currentPrice: new Decimal(validatedData.currentPrice),
      rentedStock: 0,
      status: 'AVAILABLE',
      isActive: true,
      createdBy: this.userId,
    },
    include: { category: true, color: true }
  })

  // 5. Type conversion untuk client response
  return this.convertPrismaProductToProduct(prismaProduct)
}
```

**Key Responsibilities:**

- Business rule enforcement (unique codes, referential integrity)
- Type conversion antara client types (number) dan Prisma types (Decimal)
- Error handling dengan custom error classes
- Transaction management dan data consistency
- Audit trail dengan createdBy tracking

### 7. Type System Integration

**File**: `features/manage-product/types/index.ts`

**Client-Server Type Separation:**

```typescript
// Client-side form interface (numbers untuk UI)
interface ProductFormData {
  code: string
  name: string
  modalAwal: number
  currentPrice: number
  // ... other fields
}

// API request interface (numbers untuk transport)
interface CreateProductRequest {
  code: string
  name: string
  modalAwal: number
  currentPrice: number
  // ... other fields
}

// Server-side interface (Decimal untuk database)
interface BaseProduct {
  id: string
  code: string
  modalAwal: any // Prisma Decimal
  currentPrice: any // Prisma Decimal
  // ... other fields
}
```

**Type Safety Benefits:**

- Compile-time error detection
- IntelliSense support untuk developer experience
- Runtime validation dengan Zod integration
- Clear separation antara presentation dan persistence concerns

---

## Edit Product Flow

### 1. Entry Point - Edit Product Page

**File**: `app/producer/manage-product/edit/[id]/page.tsx`

```typescript
export default function EditProductPage() {
  const params = useParams()
  const productId = String(params.id)

  return <ProductEditPageWrapper productId={productId} />
}
```

**Responsibility**:

- Dynamic route parameter extraction
- Props delegation ke wrapper component

### 2. Data Loading Wrapper - ProductEditPageWrapper

**File**: `features/manage-product/components/form-product/ProductEditPageWrapper.tsx`

```typescript
export function ProductEditPageWrapper({ productId }: ProductEditPageWrapperProps) {
  // Data fetching dengan error boundary pattern
  const {
    data: product,
    isLoading: loading,
    error
  } = useProduct(productId)

  // Loading state handling
  if (loading) {
    return <LoadingSpinner message="Memuat data produk..." />
  }

  // Error state handling
  if (error) {
    return <ErrorDisplay error={error} />
  }

  // Not found state handling
  if (!product) {
    return <NotFoundDisplay message="Produk tidak ditemukan" />
  }

  // Success state - render form dengan pre-populated data
  return (
    <ProductFormPage
      mode="edit"
      product={product}
      breadcrumbItems={breadcrumbItems}
      title={`Edit Produk: ${product.name}`}
      subtitle="Ubah informasi produk sesuai kebutuhan"
    />
  )
}
```

**Key Design Patterns:**

- **Wrapper Pattern**: Separation of data loading dari form presentation
- **Error Boundary**: Graceful error handling dengan user-friendly messages
- **Loading States**: Progressive loading dengan skeleton UI
- **State-Based Rendering**: Conditional rendering berdasarkan data state

### 3. Business Logic - useProduct Hook

**File**: `features/manage-product/hooks/useProducts.ts`

```typescript
export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productApi.getProductById(id),
    enabled: !!id, // Conditional fetching
  })
}
```

**Features:**

- **Query Key Management**: Hierarchical key structure untuk cache organization
- **Conditional Fetching**: Query hanya execute jika ID valid
- **Cache Management**: Integration dengan global query cache
- **Type Safety**: Full TypeScript support untuk response data

### 4. Form Pre-population Logic

**File**: `features/manage-product/components/form-product/ProductFormPage.tsx`

```typescript
// Form initialization dengan existing product data
const [formData, setFormData] = useState<ProductFormData>({
  code: product?.code || '',
  name: product?.name || '',
  categoryId: product?.categoryId || '',
  quantity: product?.quantity || 1,
  modalAwal: product?.modalAwal ? Number(product.modalAwal) : 0,
  currentPrice: product?.currentPrice ? Number(product.currentPrice) : 0,
  description: product?.description || '',
  imageUrl: product?.imageUrl || null,
})
```

**Type Conversion Considerations:**

- **Decimal � Number**: Server Decimal types di-convert ke client number types
- **Null Safety**: Default values untuk optional fields
- **Type Assertion**: Safe type casting dengan runtime checks

---

## Layer Architecture Analysis

### 1. Presentation Layer (Components)

**Location**: `features/manage-product/components/`

**Responsibilities:**

- UI rendering dan user interaction handling
- Form state management dan validation
- Loading states dan error boundaries
- Event handling dan user feedback

**Key Components:**

```
ProductFormPage.tsx          # Main form container dengan business logic

```
