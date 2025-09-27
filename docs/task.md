# Task Plan: Homepage Real Product Data Integration

## Project Overview

Mengganti dummy data di `FeaturedItemsSection.tsx` dengan real product data menggunakan public API baru.

## Strategy: UI Redesign untuk Rental Context (Option B) ✅

Membuat API public dengan data structure hampir sama dengan existing API, disesuaikan untuk rental business context.

---

## 🚀 TAHAP 1: BACKEND DEVELOPMENT

### 1.1 Create Public Product API

**Files:**

- `app/api/public/products/route.ts` (GET list)
- `app/api/public/products/[id]/route.ts` (GET detail)

**Approach:**

- Reuse existing ProductService logic
- Remove authentication requirement only
- Filter data untuk public consumption (remove sensitive business data)
- Keep all existing rental-appropriate fields

### 1.2 Public API Response Schema (Rental-Focused)

**Data Structure:**

```typescript
interface PublicProduct {
  id: string
  code: string
  name: string
  description?: string
  category: {
    name: string
    color: string
  }
  color?: {
    name: string
    hexCode?: string
  }
  currentPrice: number // Harga sewa (rental price)
  imageUrl: string
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE'
  sizes: Array<{
    size: string
    ageCategory: string
    quantity: number
  }>
  isActive: boolean
}
```

### 1.3 Data Filtering & Security

**Include (Public Data):**

- Basic product info: id, code, name, description
- Category & color info
- Pricing: currentPrice (rental), modalAwal (value)
- Availability: status, sizes, isActive
- Media: imageUrl

**Exclude (Sensitive Data):**

- `totalPendapatan` (business revenue)
- `createdBy` (internal user tracking)
- `materialCost` (cost information)
- `rentedStock` (detailed inventory)

### 1.4 Query Parameters Support

- `page` & `limit` - pagination
- `categoryId` - filter by category
- `status` - filter by status (default: AVAILABLE only)
- `search` - search by name/description

---

## 🎨 TAHAP 2: FRONTEND INTEGRATION

### 2.1 Create Homepage API Client

**File:** `features/homepage/api/publicProductApi.ts`

- Fetch functions untuk public product endpoints
- Error handling dan retry logic
- TypeScript types integration
- Same query patterns as existing ProductService

### 2.2 Create Custom Hook

**File:** `features/homepage/hooks/usePublicProducts.ts`

- React Query integration
- State management untuk loading/error states
- Data transformation dari API response
- Pagination support

### 2.3 Update Homepage Component (Rental-Focused UI)

**File:** `features/homepage/component/FeaturedItemsSection.tsx`

**UI Adaptations untuk Rental Context:**

```typescript
// Instead of rating/reviews (e-commerce)
<div className="rental-metrics">
  <Badge variant="outline" className={getStatusBadge(product.status)}>
    {product.status}
  </Badge>
  <span className="text-xs">
    Nilai: {formatCurrency(product.modalAwal)}
  </span>
</div>

// Rental price display
<div className="pricing">
  <span className="rental-price">
    {formatCurrency(product.currentPrice)}/hari
  </span>
</div>

// Size availability (like ProductGrid pattern)
{product.sizes.length > 0 && (
  <Badge variant="outline">
    {product.sizes.length === 1
      ? `${product.sizes[0].size} (${product.sizes[0].ageCategory})`
      : `${product.sizes.length} ukuran`}
  </Badge>
)}
```

---

## 📋 Implementation Checklist

### Backend Tasks

- [ ] Create /api/public/products GET endpoint (remove auth only)
- [ ] Create /api/public/products/[id] GET endpoint (remove auth only)
- [ ] Implement data filtering logic (remove sensitive fields)
- [ ] Add query parameter support (pagination, filters)
- [ ] Test API responses match schema
- [ ] Verify security (no sensitive data exposure)

### Frontend Tasks

- [ ] Create publicProductApi client
- [ ] Create usePublicProducts hook with React Query
- [ ] Update FeaturedItemsSection component for rental context
- [ ] Implement rental-appropriate UI patterns (like ProductGrid)
- [ ] Add loading and error states
- [ ] Test with real API data

### UI/UX Adaptations

- [ ] Replace e-commerce metrics with rental metrics
- [ ] Show rental price and item value
- [ ] Display availability status and sizes
- [ ] Use category color coding (like ProductGrid)
- [ ] Maintain responsive design

### Testing & Validation

- [ ] API unit tests
- [ ] Frontend component tests
- [ ] UI consistency with ProductGrid patterns
- [ ] Performance validation
- [ ] Security review (no sensitive data)

---

## 🎯 Success Criteria

1. Homepage displays real product data from public API
2. No authentication required for public access
3. UI adapted untuk rental business context (no fake e-commerce metrics)
4. Consistent design patterns with existing ProductGrid
5. API response time < 500ms
6. Proper error handling implemented
7. No sensitive business data exposed

---

## 📝 Notes

- **Simplified Approach**: Just remove auth + filter sensitive data from existing API
- **UI Consistency**: Follow ProductGrid.tsx patterns for rental-appropriate display
- **No New Service**: Reuse existing ProductService, just modify API routes
- **Security**: Filter out business-sensitive fields (revenue, costs, etc.)
- **Rental Context**: Focus on availability, pricing, and item value rather than e-commerce metrics
