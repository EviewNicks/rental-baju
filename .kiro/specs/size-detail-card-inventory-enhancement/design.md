# Design Document - Size Detail Card Inventory Enhancement

## Overview

Enhancement untuk **Admin Product Detail Page** (`/producer/manage-product/[id]`) agar menampilkan informasi inventory yang lengkap dan akurat dengan membedakan antara `originalQuantity`, `rentedQuantity`, dan `availableQuantity`. 

**Scope**: Buat component baru `AdminSizeInventoryCard` untuk menggantikan `SizeDetailCard` yang sekarang di `ProductDetailPage.tsx`.

Design ini menggunakan data yang sudah tersedia dari API (`sizeDetails` dan `inventoryStatus`) dan mengimplementasikan display logic yang informatif dengan visual indicators.

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer (ADMIN)                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ProductDetailPage (/producer/manage-product/[id])          │
│         ↓                                                     │
│  useProduct(id) Hook (React Query)                           │
│         ↓                                                     │
│  AdminSizeInventoryCard (NEW Component)                      │
│         ↓                                                     │
│  Enhanced Display (UI)                                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                          ↑
                          │ API Call
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                     Backend Layer                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  /api/products/[id]?includeAggregation=true                  │
│         ↓                                                     │
│  ProductService.getProductById()                             │
│         ↓                                                     │
│  ProductSizeAggregationService                               │
│         ↓                                                     │
│  Database (ProductSize with Enhanced Fields)                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Key Insight

**Backend sudah CORRECT** ✅ - API endpoint `/api/products/[id]?includeAggregation=true` sudah menyediakan:
- `sizeDetails` array dengan enhanced inventory fields
- `inventoryStatus` object dengan overall statistics

**Frontend perlu NEW COMPONENT** ✅ - Buat `AdminSizeInventoryCard` baru untuk admin context.

## Components and Interfaces

### 1. API Response Structure (Existing - No Changes)

```typescript
// app/api/public/products/[id]/route.ts
// ✅ Already provides correct data structure

interface APIProductResponse {
  id: string
  name: string
  code: string
  // ... other product fields
  
  // Legacy array (for backward compatibility)
  sizes: Array<{
    id: string
    ageCategory: 'ADULT' | 'CHILD' | 'UNIVERSAL'
    size: string
    quantity: number // Legacy field
    originalQuantity: number
    rentedQuantity: number
    availableQuantity: number
  }>
  
  // Enhanced array (NEW - already provided by API)
  sizeDetails: Array<{
    id: string
    ageCategory: string
    size: string
    originalQuantity: number
    availableQuantity: number
    rentedQuantity: number
    utilizationRate: number
    isAvailable: boolean
  }>
  
  // Overall inventory status (NEW - already provided by API)
  inventoryStatus: {
    totalOriginal: number
    totalAvailable: number
    totalRented: number
    utilizationRate: number
    isHealthy: boolean
  }
}
```

### 2. Hook Integration (Already Available)

**File**: `features/manage-product/hooks/useProducts.ts`

Hook `useProduct(id)` sudah tersedia dan menggunakan endpoint `/api/products/[id]?includeAggregation=true`.

```typescript
// Already available - no changes needed
export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productApi.getProduct(id),
    enabled: !!id,
  })
}
```

API response sudah include `sizeDetails` dan `inventoryStatus` ketika `includeAggregation=true`.

### 3. New Component Interface (To Be Created)

```typescript
// features/homepage/hooks/usePublicProducts.ts

interface TransformedProductDetail {
  // Existing fields
  id: string
  name: string
  code: string
  // ... other fields
  
  // NEW: Enhanced sizes mapped from sizeDetails
  enhancedSizes: EnhancedSizeItem[]
  
  // NEW: Inventory status
  inventoryStatus?: InventoryStatus
  
  // Enhanced availability info
  availabilityInfo: {
    status: string
    isInStock: boolean
    availableSizes: EnhancedSizeItem[]
    totalStock: number
    totalAvailable: number // NEW
    totalRented: number // NEW
  }
}

interface EnhancedSizeItem {
  id: string
  size: string
  ageCategory: string
  
  // Legacy support
  quantity: number
  
  // Enhanced fields (optional for backward compatibility)
  originalQuantity?: number
  rentedQuantity?: number
  availableQuantity?: number
  utilizationRate?: number
  isAvailable?: boolean
}

interface InventoryStatus {
  totalOriginal: number
  totalAvailable: number
  totalRented: number
  utilizationRate: number
  isHealthy: boolean
}
```

### 3. Component Interface (Needs Update)

```typescript
// features/homepage/components/SizeDetailCard.tsx

interface SizeDetailCardProps {
  // Enhanced sizes array
  sizes: EnhancedSizeItem[]
  
  // NEW: Overall inventory status
  inventoryStatus?: InventoryStatus
  
  // Existing props
  title?: string
  showStats?: boolean
  showProgress?: boolean
  context?: 'public' | 'admin'
  editable?: boolean
}

interface EnhancedSizeItem {
  size: string
  ageCategory: string
  
  // Legacy support
  quantity: number
  
  // Enhanced fields (optional)
  originalQuantity?: number
  rentedQuantity?: number
  availableQuantity?: number
  utilizationRate?: number
  isAvailable?: boolean
}

interface InventoryStatus {
  totalOriginal: number
  totalAvailable: number
  totalRented: number
  utilizationRate: number
  isHealthy: boolean
}
```

## Data Models

### Enhanced Size Item Model

```typescript
interface EnhancedSizeItem {
  // Identity
  id?: string
  size: string
  ageCategory: string
  
  // Inventory Fields
  quantity: number              // Legacy: Total quantity (for backward compatibility)
  originalQuantity?: number     // Enhanced: Total stock owned
  rentedQuantity?: number       // Enhanced: Currently rented
  availableQuantity?: number    // Enhanced: Available for rent
  
  // Computed Fields
  utilizationRate?: number      // Percentage: (rented / original) * 100
  isAvailable?: boolean         // Boolean: availableQuantity > 0
}
```

### Inventory Status Model

```typescript
interface InventoryStatus {
  // Aggregate Quantities
  totalOriginal: number         // Sum of all originalQuantity
  totalAvailable: number        // Sum of all availableQuantity
  totalRented: number           // Sum of all rentedQuantity
  
  // Computed Metrics
  utilizationRate: number       // Percentage: (totalRented / totalOriginal) * 100
  isHealthy: boolean            // Boolean: utilizationRate < 80%
}
```

### Statistics Model (Component Internal)

```typescript
interface SizeStatistics {
  // Counts
  totalSizes: number            // Total number of size variations
  availableSizes: number        // Number of sizes with availableQuantity > 0
  
  // Quantities
  totalQuantity: number         // Sum of originalQuantity
  totalAvailable: number        // Sum of availableQuantity
  totalRented: number           // Sum of rentedQuantity
  
  // Status
  isInStock: boolean            // totalAvailable > 0
  
  // Breakdown by Category
  byCategory: Record<string, {
    count: number               // Number of sizes in this category
    quantity: number            // Total originalQuantity in this category
    available: number           // Total availableQuantity in this category
    rented: number              // Total rentedQuantity in this category
    sizes: EnhancedSizeItem[]   // Array of sizes in this category
  }>
}
```

## Implementation Details

### Phase 1: Backend Verification (No Changes Needed)

**Status**: ✅ Already Complete

Backend API sudah menyediakan data yang benar:
- `sizeDetails` array dengan enhanced fields
- `inventoryStatus` object dengan aggregate data

**Verification Steps**:
1. Confirm API response includes `sizeDetails`
2. Confirm API response includes `inventoryStatus`
3. Validate data structure matches interface

### Phase 2: Frontend Implementation

#### 2.1 Hook Transformation Enhancement

**File**: `features/homepage/hooks/usePublicProducts.ts`

**Changes**:

```typescript
export function useTransformedProductDetail(id: string) {
  const { data, isLoading, error, isError } = usePublicProductDetail(id)

  const transformedData = data ? {
    ...data,
    
    // NEW: Map sizeDetails to enhancedSizes
    enhancedSizes: data.sizeDetails?.map(detail => ({
      id: detail.id,
      size: detail.size,
      ageCategory: detail.ageCategory,
      originalQuantity: detail.originalQuantity,
      rentedQuantity: detail.rentedQuantity,
      availableQuantity: detail.availableQuantity,
      utilizationRate: detail.utilizationRate,
      isAvailable: detail.isAvailable,
      // Backward compatibility: map originalQuantity to quantity
      quantity: detail.originalQuantity
    })) || data.sizes.map(size => ({
      // Fallback to legacy sizes if sizeDetails not available
      id: size.id,
      size: size.size,
      ageCategory: size.ageCategory,
      quantity: size.quantity,
      originalQuantity: size.originalQuantity || size.quantity,
      rentedQuantity: size.rentedQuantity || 0,
      availableQuantity: size.availableQuantity || size.quantity,
      utilizationRate: size.originalQuantity 
        ? (size.rentedQuantity || 0) / size.originalQuantity * 100 
        : 0,
      isAvailable: (size.availableQuantity || size.quantity) > 0
    })),
    
    // NEW: Include inventoryStatus
    inventoryStatus: data.inventoryStatus,
    
    // ENHANCED: Update availabilityInfo to use enhanced fields
    availabilityInfo: {
      status: data.status,
      isInStock: data.inventoryStatus 
        ? data.inventoryStatus.totalAvailable > 0
        : data.sizes.some(size => size.quantity > 0),
      availableSizes: data.sizeDetails
        ? data.sizeDetails.filter(detail => detail.isAvailable)
        : data.sizes.filter(size => size.quantity > 0),
      totalStock: data.inventoryStatus?.totalOriginal || 
        data.sizes.reduce((sum, size) => sum + size.quantity, 0),
      totalAvailable: data.inventoryStatus?.totalAvailable || 
        data.sizes.reduce((sum, size) => sum + (size.availableQuantity || size.quantity), 0),
      totalRented: data.inventoryStatus?.totalRented || 
        data.sizes.reduce((sum, size) => sum + (size.rentedQuantity || 0), 0)
    }
  } : undefined

  return {
    data: transformedData,
    product: transformedData,
    isLoading,
    error,
    isError,
    isNotFound: isError && error?.message?.includes('tidak ditemukan'),
    isEmpty: !isLoading && !transformedData
  }
}
```

**Key Features**:
- Maps `sizeDetails` to `enhancedSizes`
- Includes `inventoryStatus`
- Backward compatibility with legacy data
- Fallback logic for missing fields

#### 2.2 Component Interface Extension

**File**: `features/homepage/components/SizeDetailCard.tsx`

**Interface Changes**:

```typescript
// Extended interface to support enhanced fields
interface EnhancedSizeItem {
  size: string
  ageCategory: string
  quantity: number // Legacy support
  originalQuantity?: number
  rentedQuantity?: number
  availableQuantity?: number
  utilizationRate?: number
  isAvailable?: boolean
}

// Extended props to include inventoryStatus
interface SizeDetailCardProps {
  sizes: EnhancedSizeItem[]
  inventoryStatus?: {
    totalOriginal: number
    totalAvailable: number
    totalRented: number
    utilizationRate: number
    isHealthy: boolean
  }
  title?: string
  showStats?: boolean
  showProgress?: boolean
  context?: 'public' | 'admin'
  editable?: boolean
}
```

#### 2.3 Statistics Calculation Enhancement

**File**: `features/homepage/components/SizeDetailCard.tsx`

**Enhanced Statistics**:

```typescript
const stats = React.useMemo(() => {
  // Use enhanced fields with fallback to legacy
  const totalQuantity = sizes.reduce((sum, size) => 
    sum + (size.originalQuantity ?? size.quantity), 0
  )
  
  const totalAvailable = sizes.reduce((sum, size) => 
    sum + (size.availableQuantity ?? size.quantity), 0
  )
  
  const totalRented = sizes.reduce((sum, size) => 
    sum + (size.rentedQuantity ?? 0), 0
  )
  
  const availableSizes = sizes.filter(size => 
    (size.availableQuantity ?? size.quantity) > 0
  )
  
  const totalSizes = sizes.length

  // Group by age category with enhanced fields
  const byCategory = sizes.reduce((acc, size) => {
    if (!acc[size.ageCategory]) {
      acc[size.ageCategory] = { 
        count: 0, 
        quantity: 0, 
        available: 0,
        rented: 0,
        sizes: [] 
      }
    }
    acc[size.ageCategory].count += 1
    acc[size.ageCategory].quantity += (size.originalQuantity ?? size.quantity)
    acc[size.ageCategory].available += (size.availableQuantity ?? size.quantity)
    acc[size.ageCategory].rented += (size.rentedQuantity ?? 0)
    acc[size.ageCategory].sizes.push(size)
    return acc
  }, {} as Record<string, { 
    count: number
    quantity: number
    available: number
    rented: number
    sizes: EnhancedSizeItem[] 
  }>)

  return {
    totalQuantity,
    totalAvailable,
    totalRented,
    availableSizes: availableSizes.length,
    totalSizes,
    byCategory,
    isInStock: totalAvailable > 0,
  }
}, [sizes])
```

#### 2.4 Enhanced Display Logic

**File**: `features/homepage/components/SizeDetailCard.tsx`

**Display Components**:

```typescript
// 1. Overall Statistics with Enhanced Info
{showStats && (
  <div className={`grid grid-cols-4 gap-4 p-4 ${statsBg}`}>
    <div className="text-center">
      <div className="text-xl font-bold text-blue-600">{stats.totalSizes}</div>
      <div className="text-xs text-neutral-600">Variasi</div>
    </div>
    <div className="text-center">
      <div className="text-xl font-bold text-green-600">{stats.totalAvailable}</div>
      <div className="text-xs text-neutral-600">Tersedia</div>
    </div>
    <div className="text-center">
      <div className="text-xl font-bold text-orange-600">{stats.totalRented}</div>
      <div className="text-xs text-neutral-600">Disewa</div>
    </div>
    <div className="text-center">
      <div className="text-xl font-bold text-purple-600">{stats.totalQuantity}</div>
      <div className="text-xs text-neutral-600">Total</div>
    </div>
  </div>
)}

// 2. Size Item Display with Breakdown
{data.sizes.map((size, index) => {
  const displayQuantity = size.availableQuantity ?? size.quantity
  const originalQty = size.originalQuantity ?? size.quantity
  const rentedQty = size.rentedQuantity ?? 0
  const utilization = size.utilizationRate ?? 0
  
  // Determine status badge
  const statusBadge = displayQuantity === 0 
    ? { variant: 'destructive', label: 'Habis', icon: XCircle }
    : displayQuantity < originalQty
    ? { variant: 'warning', label: 'Sebagian', icon: AlertCircle }
    : { variant: 'success', label: 'Tersedia', icon: CheckCircle }
  
  return (
    <div
      key={index}
      className={`p-4 rounded-lg border ${
        displayQuantity > 0
          ? config.bgColor + ' ' + config.borderColor
          : 'bg-gray-50 border-gray-200 opacity-60'
      }`}
    >
      {/* Header with Status Badge */}
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-sm">
          {config.label} - Size {size.size}
        </span>
        <Badge variant={statusBadge.variant}>
          <statusBadge.icon className="w-3 h-3 mr-1" />
          {statusBadge.label}
        </Badge>
      </div>
      
      {/* Availability Breakdown */}
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-600">Tersedia:</span>
          <span className="font-semibold text-green-600">
            {displayQuantity} dari {originalQty} pcs
          </span>
        </div>
        
        {rentedQty > 0 && (
          <div className="flex justify-between">
            <span className="text-neutral-600">Sedang disewa:</span>
            <span className="font-semibold text-orange-600">
              {rentedQty} pcs
            </span>
          </div>
        )}
      </div>
      
      {/* Utilization Progress Bar */}
      {showProgress && utilization > 0 && (
        <div className="mt-3 space-y-1">
          <Progress 
            value={utilization} 
            className={`h-2 ${
              utilization < 50 ? 'bg-green-200' :
              utilization < 80 ? 'bg-yellow-200' :
              'bg-red-200'
            }`}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Utilization</span>
            <span>{utilization.toFixed(0)}%</span>
          </div>
        </div>
      )}
    </div>
  )
})}
```

#### 2.5 Page Integration

**File**: `features/homepage/components/ProductDetailPage.tsx`

**Integration Changes**:

```typescript
export function PublicProductDetailPage({ productId }: PublicProductDetailPageProps) {
  const { product, isLoading, isError } = useTransformedProductDetail(productId)

  // ... loading and error states

  return (
    <div>
      {/* ... other content */}
      
      {/* Size Availability - Enhanced */}
      <SizeDetailCard
        sizes={product.enhancedSizes} // Use enhanced sizes
        inventoryStatus={product.inventoryStatus} // Pass inventory status
        title="Detail Ketersediaan Ukuran"
        showStats={true}
        showProgress={true}
        context="public"
      />
      
      {/* ... other content */}
    </div>
  )
}
```

## Error Handling

### Backward Compatibility Strategy

```typescript
// Fallback logic for missing enhanced fields
const displayQuantity = size.availableQuantity ?? size.quantity
const originalQty = size.originalQuantity ?? size.quantity
const rentedQty = size.rentedQuantity ?? 0
const utilization = size.utilizationRate ?? 
  (originalQty > 0 ? (rentedQty / originalQty * 100) : 0)
```

### Null/Undefined Handling

```typescript
// Safe access with optional chaining and nullish coalescing
const enhancedSizes = data.sizeDetails?.map(...) || data.sizes.map(...)
const inventoryStatus = data.inventoryStatus
const isInStock = inventoryStatus?.totalAvailable > 0 || 
  sizes.some(size => size.quantity > 0)
```

### Empty State Handling

```typescript
if (sizes.length === 0) {
  return (
    <Card>
      <CardContent>
        <Alert>
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Tidak ada informasi ukuran tersedia untuk produk ini.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
```

## Testing Strategy

### Unit Tests

**Hook Tests** (`usePublicProducts.test.ts`):
```typescript
describe('useTransformedProductDetail', () => {
  it('should map sizeDetails to enhancedSizes', () => {
    // Test sizeDetails mapping
  })
  
  it('should fallback to legacy sizes if sizeDetails not available', () => {
    // Test backward compatibility
  })
  
  it('should include inventoryStatus', () => {
    // Test inventoryStatus inclusion
  })
  
  it('should calculate availabilityInfo correctly', () => {
    // Test availability calculations
  })
})
```

**Component Tests** (`SizeDetailCard.test.tsx`):
```typescript
describe('SizeDetailCard', () => {
  it('should display enhanced inventory information', () => {
    // Test enhanced display
  })
  
  it('should show utilization progress bar', () => {
    // Test progress bar rendering
  })
  
  it('should handle legacy data correctly', () => {
    // Test backward compatibility
  })
  
  it('should display correct status badges', () => {
    // Test status badge logic
  })
})
```

### Integration Tests

```typescript
describe('ProductDetailPage Integration', () => {
  it('should fetch and display enhanced inventory data', () => {
    // Test full data flow
  })
  
  it('should handle API errors gracefully', () => {
    // Test error handling
  })
  
  it('should work with legacy API response', () => {
    // Test backward compatibility
  })
})
```

### Manual Testing Scenarios

1. **Full Stock**: availableQuantity = originalQuantity
2. **Partial Stock**: 0 < availableQuantity < originalQuantity
3. **Out of Stock**: availableQuantity = 0
4. **Legacy Data**: Only quantity field present
5. **Mixed Data**: Some sizes with enhanced fields, some without

## Performance Considerations

### Memoization Strategy

```typescript
// Statistics calculation
const stats = React.useMemo(() => {
  // Expensive calculations here
}, [sizes])

// Individual size items
const SizeItem = React.memo(({ size, config }) => {
  // Render logic
})
```

### Optimization Techniques

1. **Lazy Calculation**: Calculate utilization only when needed
2. **Conditional Rendering**: Only render progress bars if showProgress=true
3. **Virtual Scrolling**: For products with > 20 sizes (future enhancement)
4. **Image Lazy Loading**: Defer non-critical assets

## Accessibility

### ARIA Attributes

```typescript
// Progress bar
<Progress 
  value={utilization}
  aria-label={`Utilization rate: ${utilization}%`}
  aria-valuenow={utilization}
  aria-valuemin={0}
  aria-valuemax={100}
/>

// Status badge
<Badge 
  variant={statusBadge.variant}
  role="status"
  aria-label={`Availability status: ${statusBadge.label}`}
>
  {statusBadge.label}
</Badge>

// Size item
<div
  role="article"
  aria-label={`Size ${size.size} for ${config.label}: ${displayQuantity} available out of ${originalQty}`}
>
  {/* Content */}
</div>
```

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Tab order follows logical flow
- Focus indicators are visible

### Screen Reader Support

- Descriptive labels for all elements
- Status updates announced
- Progress values communicated

## Security Considerations

### Data Validation

```typescript
// Validate numeric values
const safeQuantity = Math.max(0, size.availableQuantity ?? 0)
const safeOriginal = Math.max(0, size.originalQuantity ?? 0)
const safeRented = Math.max(0, size.rentedQuantity ?? 0)

// Validate utilization rate
const safeUtilization = Math.min(100, Math.max(0, utilization))
```

### XSS Prevention

- All user-generated content is sanitized
- React's built-in XSS protection is utilized
- No dangerouslySetInnerHTML usage

## Deployment Strategy

### Phase 1: Backend Verification (Day 1)
- ✅ Verify API response structure
- ✅ Confirm sizeDetails availability
- ✅ Validate inventoryStatus data

### Phase 2: Frontend Implementation (Day 2-3)
- Update hook transformation
- Extend component interface
- Implement enhanced display
- Add tests

### Phase 3: Testing & QA (Day 4)
- Unit tests
- Integration tests
- Manual testing
- Accessibility audit

### Phase 4: Deployment (Day 5)
- Deploy to staging
- Smoke testing
- Production deployment
- Monitoring

## Monitoring & Metrics

### Performance Metrics
- Component render time < 100ms
- Hook transformation time < 50ms
- API response time < 500ms

### User Metrics
- Time to understand availability < 3 seconds
- Bounce rate on product detail page
- Conversion rate improvement

### Error Metrics
- API error rate
- Component error boundary triggers
- Fallback usage frequency

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live inventory
2. **Reservation System**: Temporary hold on items during checkout
3. **Historical Tracking**: Show inventory trends over time
4. **Multi-location**: Support for multiple warehouse locations
5. **Predictive Analytics**: Forecast demand and suggest restocking

## Conclusion

This design provides a comprehensive solution for enhancing SizeDetailCard to display complete and accurate inventory information. The implementation leverages existing API data, maintains backward compatibility, and follows best practices for performance, accessibility, and user experience.

**Key Benefits**:
- Clear availability information for users
- Reduced customer service inquiries
- Improved trust and conversion rates
- Better inventory visibility for business
- Scalable architecture for future enhancements
