# Design Document: Product Break-Even Status Badge

## Overview

This document provides the technical design for implementing the Product Break-Even Status Badge feature. The feature calculates and displays whether rental products have recovered their initial capital investment (modal awal) through accumulated rental revenue.

The design follows existing architecture patterns in the manage-product feature, extending ProductHistoryService for revenue calculations and creating reusable badge components for consistent display across product views.

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  - ProductDetailPage (badge in header + progress)          │
│  - ProductListPage (badge in table)                         │
│  - ProductGrid (corner badge)                               │
│  - BreakEvenBadge Component (reusable)                      │
│  - BreakEvenProgress Component (detail page only)           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA FETCHING LAYER                       │
│  - Extend useProduct Hook (React Query)                     │
│  - Cache: 5min stale, refetch on focus                      │
│  - Retry logic for failed requests                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API CLIENT LAYER                        │
│  - productApi.getProductById(id, includeBreakEven=true)     │
│  - productApi.getProducts({ includeBreakEven: true })       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API ROUTE LAYER                         │
│  - GET /api/products/[id]?includeBreakEven=true            │
│  - GET /api/products?includeBreakEven=true                 │
│  - Role-based access control (Owner, Producer only)         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                      │
│  - ProductHistoryService.getBreakEvenStatus()               │
│  - Revenue calculation from TransaksiItem                   │
│  - Break-even status determination                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                          │
│  - Product (modalAwal field)                                │
│  - TransaksiItem (subtotal, totalReturnPenalty)            │
│  - Transaksi (status != 'cancelled')                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Components and Interfaces

### 1. BreakEvenBadge Component

**Purpose**: Reusable badge displaying break-even achievement

**Location**: `features/manage-product/components/shared/BreakEvenBadge.tsx`


**Props Interface**:
```typescript
interface BreakEvenBadgeProps {
  modalAwal: number
  totalRevenue: number
  transactionCount: number
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
  className?: string
}
```

**Visual Design**:
- Color: Soft yellow (`bg-yellow-100 text-yellow-800 border-yellow-300`)
- Icon: 🏆 Trophy emoji
- Text: "Modal Kembali"
- Only displays when `totalRevenue >= modalAwal`

**Tooltip Content**:
```
Modal Awal: Rp 10.000.000
Total Pendapatan: Rp 12.500.000
Keuntungan: Rp 2.500.000 (125%)
Dari 15 transaksi
```

---

### 2. BreakEvenProgress Component

**Purpose**: Progress bar showing break-even progress (ProductDetailPage header only)

**Location**: `features/manage-product/components/product-detail/BreakEvenProgress.tsx`

**Props Interface**:
```typescript
interface BreakEvenProgressProps {
  modalAwal: number
  totalRevenue: number
  transactionCount: number
  className?: string
}
```

**Visual Design**:
- Progress bar with gradient fill
- Percentage display: "Progress Modal: 75%"
- Currency breakdown: "Rp 7.5jt / Rp 10jt"
- Caps visual progress at 100% but shows actual percentage

**Edge Cases**:
- If `modalAwal === 0`: Hide component
- If `modalAwal === null`: Show "Modal awal tidak tersedia"
- If `totalRevenue > modalAwal`: Show 100% bar + actual percentage

---

## Data Models

### BreakEvenStatus Type

**Location**: `features/manage-product/types/index.ts`

```typescript
export interface BreakEvenStatus {
  modalAwal: number
  totalRevenue: number
  isBreakEven: boolean
  progressPercentage: number
  transactionCount: number
  profit?: number  // Only if isBreakEven = true
}
```

### Extended Product Type

```typescript
export interface Product {
  // ... existing fields
  breakEvenStatus?: BreakEvenStatus  // Optional, only when includeBreakEven=true
}
```

---

## Service Layer Extension

### ProductHistoryService.getBreakEvenStatus()

**Location**: `features/manage-product/services/productHistoryService.ts`

**Method Signature**:
```typescript
async getBreakEvenStatus(productId: string): Promise<BreakEvenStatus>
```

**Implementation Logic**:
```typescript
async getBreakEvenStatus(productId: string): Promise<BreakEvenStatus> {
  // 1. Get product modalAwal
  const product = await this.prisma.product.findUnique({
    where: { id: productId },
    select: { modalAwal: true }
  })
  
  if (!product) {
    throw new NotFoundError('Product not found')
  }
  
  // 2. Calculate total revenue (exclude cancelled)
  const revenueData = await this.prisma.transaksiItem.aggregate({
    where: {
      produkId: productId,
      transaksi: {
        status: { not: 'cancelled' }
      }
    },
    _sum: {
      subtotal: true,
      totalReturnPenalty: true
    },
    _count: {
      id: true
    }
  })
  
  const baseRevenue = revenueData._sum.subtotal?.toNumber() || 0
  const penalties = revenueData._sum.totalReturnPenalty?.toNumber() || 0
  const totalRevenue = baseRevenue + penalties
  const transactionCount = revenueData._count.id || 0
  
  const modalAwal = product.modalAwal.toNumber()
  const isBreakEven = totalRevenue >= modalAwal
  const progressPercentage = modalAwal > 0 
    ? (totalRevenue / modalAwal) * 100 
    : 0
  
  return {
    modalAwal,
    totalRevenue,
    isBreakEven,
    progressPercentage,
    transactionCount,
    profit: isBreakEven ? totalRevenue - modalAwal : undefined
  }
}
```

**Performance Optimization**:
- Single aggregate query (no N+1)
- Uses existing indexes on `produkId` and `status`
- Execution time: ~50-100ms

---

## API Route Modifications

### GET /api/products/[id]

**Location**: `app/api/products/[id]/route.ts`

**Query Parameter**: `includeBreakEven=true`

**Modified Implementation**:
```typescript
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const includeBreakEven = searchParams.get('includeBreakEven') === 'true'
    
    // Check role permissions
    const userRole = determineUserRole(sessionClaims)
    const canViewBreakEven = ['owner', 'producer'].includes(userRole)
    
    const productService = new ProductService(prisma, userId)
    const product = await productService.getProductById(id)
    
    // Add break-even status if requested and authorized
    if (includeBreakEven && canViewBreakEven) {
      const historyService = new ProductHistoryService(prisma, userId)
      const breakEvenStatus = await historyService.getBreakEvenStatus(id)
      
      return NextResponse.json({
        ...product,
        breakEvenStatus
      }, { status: 200 })
    }
    
    return NextResponse.json(product, { status: 200 })
  } catch (error) {
    // ... error handling
  }
}
```

---

### GET /api/products (Bulk)

**Location**: `app/api/products/route.ts`

**Query Parameter**: `includeBreakEven=true`

**Optimization Strategy**:
- Fetch all products first
- Batch query break-even status for all products
- Single aggregate query with GROUP BY

**Implementation**:
```typescript
// In ProductHistoryService
async getBulkBreakEvenStatus(
  productIds: string[]
): Promise<Map<string, BreakEvenStatus>> {
  // Get all modalAwal values
  const products = await this.prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, modalAwal: true }
  })
  
  // Aggregate revenue by product
  const revenueByProduct = await this.prisma.transaksiItem.groupBy({
    by: ['produkId'],
    where: {
      produkId: { in: productIds },
      transaksi: { status: { not: 'cancelled' } }
    },
    _sum: {
      subtotal: true,
      totalReturnPenalty: true
    },
    _count: {
      id: true
    }
  })
  
  // Build result map
  const resultMap = new Map<string, BreakEvenStatus>()
  
  products.forEach(product => {
    const revenue = revenueByProduct.find(r => r.produkId === product.id)
    const baseRevenue = revenue?._sum.subtotal?.toNumber() || 0
    const penalties = revenue?._sum.totalReturnPenalty?.toNumber() || 0
    const totalRevenue = baseRevenue + penalties
    const transactionCount = revenue?._count.id || 0
    
    const modalAwal = product.modalAwal.toNumber()
    const isBreakEven = totalRevenue >= modalAwal
    const progressPercentage = modalAwal > 0 ? (totalRevenue / modalAwal) * 100 : 0
    
    resultMap.set(product.id, {
      modalAwal,
      totalRevenue,
      isBreakEven,
      progressPercentage,
      transactionCount,
      profit: isBreakEven ? totalRevenue - modalAwal : undefined
    })
  })
  
  return resultMap
}
```

---

## Frontend Integration

### ProductDetailPage Integration

**Location**: `features/manage-product/components/product-detail/ProductDetailPage.tsx`

**Modification**:
```typescript
export function ProductDetailPage({ productId }: ProductDetailPageProps) {
  // Fetch product with break-even status
  const { data: product, isLoading } = useProduct(productId, {
    includeBreakEven: true
  })
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* ... breadcrumb ... */}
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 bg-yellow-400 rounded-full"></div>
            <h1 className="text-3xl font-bold text-gray-900">Detail Produk</h1>
            
            {/* Break-Even Badge in Header */}
            {product?.breakEvenStatus && (
              <BreakEvenBadge
                modalAwal={product.breakEvenStatus.modalAwal}
                totalRevenue={product.breakEvenStatus.totalRevenue}
                transactionCount={product.breakEvenStatus.transactionCount}
                size="lg"
              />
            )}
          </div>
          
          <p className="text-lg text-gray-600">Informasi lengkap tentang produk</p>
          <p className="text-xl font-semibold text-gray-900 mt-1">{product?.name}</p>
          
          {/* Break-Even Progress in Header */}
          {product?.breakEvenStatus && (
            <div className="mt-4 max-w-md">
              <BreakEvenProgress
                modalAwal={product.breakEvenStatus.modalAwal}
                totalRevenue={product.breakEvenStatus.totalRevenue}
                transactionCount={product.breakEvenStatus.transactionCount}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* ... rest of content ... */}
    </div>
  )
}
```

---

### ProductListPage Integration

**Location**: `features/manage-product/components/products/ProductTable.tsx`

**Modification**: Add badge column

```typescript
<TableCell>
  <div className="flex items-center gap-2">
    <Badge variant="outline" className={getStatusBadge(product.status)}>
      {product.status}
    </Badge>
    
    {/* Break-Even Badge */}
    {product.breakEvenStatus?.isBreakEven && (
      <BreakEvenBadge
        modalAwal={product.breakEvenStatus.modalAwal}
        totalRevenue={product.breakEvenStatus.totalRevenue}
        transactionCount={product.breakEvenStatus.transactionCount}
        size="sm"
        showTooltip={true}
      />
    )}
  </div>
</TableCell>
```

---

### ProductGrid Integration

**Location**: `features/manage-product/components/products/ProductGrid.tsx`

**Modification**: Add corner badge

```typescript
<Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer relative">
  {/* Corner Badge */}
  {product.breakEvenStatus?.isBreakEven && (
    <div className="absolute top-2 right-2 z-10">
      <BreakEvenBadge
        modalAwal={product.breakEvenStatus.modalAwal}
        totalRevenue={product.breakEvenStatus.totalRevenue}
        transactionCount={product.breakEvenStatus.transactionCount}
        size="sm"
        showTooltip={true}
      />
    </div>
  )}
  
  {/* ... rest of card content ... */}
</Card>
```

---

## React Query Integration

### Hook Modification

**Location**: `features/manage-product/hooks/useProducts.ts`

**Modified useProduct Hook**:
```typescript
export function useProduct(
  productId: string,
  options?: {
    includeAggregation?: boolean
    includeBreakEven?: boolean
  }
) {
  return useQuery({
    queryKey: ['products', productId, options],
    queryFn: () => productApi.getProductById(
      productId,
      options?.includeAggregation ?? true,
      options?.includeBreakEven ?? false
    ),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,  // Refetch on focus for fresh data
    retry: 2
  })
}
```

**Modified useProducts Hook**:
```typescript
export function useProducts(params?: {
  search?: string
  category?: string
  status?: string
  page?: number
  limit?: number
  includeBreakEven?: boolean
}) {
  return useQuery({
    queryKey: ['products', 'list', params],
    queryFn: () => productApi.getProducts(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData
  })
}
```

---

## API Client Modifications

**Location**: `features/manage-product/api.ts`

```typescript
export const productApi = {
  // Modified getProductById
  getProductById: async (
    id: string,
    includeAggregation = true,
    includeBreakEven = false
  ) => {
    const params = new URLSearchParams()
    if (includeAggregation) params.append('includeAggregation', 'true')
    if (includeBreakEven) params.append('includeBreakEven', 'true')
    
    const queryString = params.toString()
    const url = `${API_BASE_URL}/products/${id}${queryString ? `?${queryString}` : ''}`
    const response = await fetch(url)
    return handleResponse(response)
  },
  
  // Modified getProducts
  getProducts: async (params?: {
    search?: string
    category?: string
    status?: string
    page?: number
    limit?: number
    includeBreakEven?: boolean
  }) => {
    const queryString = params ? buildQueryParams(params) : ''
    const url = `${API_BASE_URL}/products${queryString ? `?${queryString}` : ''}`
    const response = await fetch(url)
    return handleResponse(response)
  }
}
```

---

## Error Handling

### Service Layer

```typescript
async getBreakEvenStatus(productId: string): Promise<BreakEvenStatus> {
  try {
    // ... implementation
  } catch (error) {
    console.error('[ProductHistoryService] getBreakEvenStatus error:', error)
    
    // Return safe fallback
    return {
      modalAwal: 0,
      totalRevenue: 0,
      isBreakEven: false,
      progressPercentage: 0,
      transactionCount: 0
    }
  }
}
```

### Frontend

```typescript
// In components
{product?.breakEvenStatus ? (
  <BreakEvenBadge {...product.breakEvenStatus} />
) : null}

// Graceful degradation - no error UI needed
```

---

## Testing Strategy

### Unit Tests

**Service Layer**:
```typescript
describe('ProductHistoryService.getBreakEvenStatus', () => {
  it('should calculate break-even correctly when revenue >= modalAwal', async () => {
    // Test implementation
  })
  
  it('should exclude cancelled transactions from revenue', async () => {
    // Test implementation
  })
  
  it('should handle zero modalAwal gracefully', async () => {
    // Test implementation
  })
  
  it('should include penalties in total revenue', async () => {
    // Test implementation
  })
})
```

**Component Tests**:
```typescript
describe('BreakEvenBadge', () => {
  it('should render badge when isBreakEven is true', () => {
    // Test implementation
  })
  
  it('should not render when isBreakEven is false', () => {
    // Test implementation
  })
  
  it('should show tooltip with correct data on hover', () => {
    // Test implementation
  })
})
```

### Integration Tests

**API Route Tests**:
```typescript
describe('GET /api/products/[id]?includeBreakEven=true', () => {
  it('should return break-even status for owner role', async () => {
    // Test implementation
  })
  
  it('should return break-even status for producer role', async () => {
    // Test implementation
  })
  
  it('should NOT return break-even status for kasir role', async () => {
    // Test implementation
  })
})
```

---

## Performance Considerations

### Database Optimization

1. **Single Aggregate Query**: Use `aggregate` with `_sum` and `_count`
2. **Existing Indexes**: Leverage `idx_transaksi_item_product_join`
3. **Bulk Queries**: Use `groupBy` for multiple products
4. **Query Time**: Target <100ms for single product, <500ms for bulk

### Frontend Optimization

1. **React Query Caching**: 5-minute stale time
2. **Conditional Fetching**: Only fetch when `includeBreakEven=true`
3. **Lazy Loading**: Badge components are lightweight
4. **No Layout Shift**: Badge has fixed dimensions

---

## Security Considerations

### Role-Based Access Control

```typescript
function determineUserRole(sessionClaims: Record<string, unknown> | null): string {
  if (!sessionClaims) return 'guest'
  
  const metadata = sessionClaims.metadata as Record<string, unknown> | undefined
  const role = metadata?.role || sessionClaims.role || 'guest'
  
  return String(role).toLowerCase()
}

// In API route
const userRole = determineUserRole(sessionClaims)
const canViewBreakEven = ['owner', 'producer'].includes(userRole)

if (includeBreakEven && !canViewBreakEven) {
  // Don't include break-even data
}
```

### Data Validation

- Product ID: UUID format validation
- Modal Awal: Non-negative number
- Revenue: Calculated server-side (no client manipulation)

---

## Migration Strategy

### Phase 1: Backend Implementation
1. Add `getBreakEvenStatus()` to ProductHistoryService
2. Modify API routes to support `includeBreakEven` parameter
3. Add type definitions

### Phase 2: Component Development
1. Create `BreakEvenBadge` component
2. Create `BreakEvenProgress` component
3. Write component tests

### Phase 3: Integration
1. Integrate badge into ProductDetailPage header
2. Integrate badge into ProductListPage table
3. Integrate badge into ProductGrid cards

### Phase 4: Testing & Optimization
1. Run integration tests
2. Performance testing with large datasets
3. User acceptance testing

---

## Dependencies

- Existing ProductHistoryService
- Clerk authentication system
- React Query (TanStack Query)
- Shadcn UI components (Badge, Tooltip, Progress)
- Lucide React icons

---

## Assumptions

1. `modalAwal` field exists and is populated in Product table
2. Transaction status values are consistent
3. Revenue data is accurate and up-to-date
4. User roles are properly configured in Clerk
5. Existing product pages can accommodate new components

---

**Document Version**: 1.0  
**Created**: 2025-11-29  
**Status**: Ready for Implementation
