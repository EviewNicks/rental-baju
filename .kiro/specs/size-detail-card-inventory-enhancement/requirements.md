# Requirements Document - Size Detail Card Inventory Enhancement

## Introduction

Saat ini SizeDetailCard pada ProductDetailPage tidak menampilkan informasi inventory yang lengkap dan akurat. Card hanya menampilkan `quantity` (legacy field) tanpa membedakan antara stok yang sedang disewa (`rentedQuantity`) dan stok yang tersedia (`availableQuantity`). Hal ini menyebabkan user tidak mendapatkan informasi yang jelas tentang ketersediaan produk.

**Contoh Masalah:**
- ProductSize: Dewasa XL
- originalQuantity: 6 pcs
- rentedQuantity: 2 pcs  
- availableQuantity: 4 pcs

**Current Display:** Hanya menampilkan "6 pcs" tanpa detail
**Expected Display:** Menampilkan "4 dari 6 pcs tersedia (2 sedang disewa)"

## Glossary

- **ProductSize**: Model database yang menyimpan informasi ukuran produk dengan age category
- **originalQuantity**: Total stok awal yang dimiliki (baseline inventory)
- **rentedQuantity**: Jumlah item yang sedang disewa/dipinjam
- **availableQuantity**: Jumlah item yang tersedia untuk disewa (originalQuantity - rentedQuantity)
- **SizeDetailCard**: Komponen React yang menampilkan detail ukuran dan ketersediaan produk
- **InventoryStatus**: Status kesehatan inventory dengan utilization rate
- **SizeDetails**: Array detail per ukuran dengan informasi inventory lengkap
- **Public Product API**: API endpoint `/api/public/products/[id]` yang menyediakan data produk untuk homepage
- **Enhanced ProductSize Schema**: Schema database yang menggunakan 3 field quantity (original, rented, available)

## Requirements

### Requirement 1: Display Enhanced Inventory Information

**User Story:** Sebagai pengunjung website, saya ingin melihat informasi ketersediaan produk yang detail dan akurat, sehingga saya dapat mengetahui berapa banyak item yang benar-benar tersedia untuk disewa.

#### Acceptance Criteria

1. WHEN a user views a product detail page THEN the SizeDetailCard SHALL display originalQuantity, rentedQuantity, and availableQuantity for each size
2. WHEN a size has rentedQuantity > 0 THEN the system SHALL show visual indicator (badge or icon) indicating items are currently rented
3. WHEN a size has availableQuantity = 0 THEN the system SHALL display "Habis - Semua sedang disewa" status
4. WHEN a size has availableQuantity > 0 THEN the system SHALL display "Tersedia X dari Y pcs" format
5. WHEN displaying size information THEN the system SHALL show utilization rate as percentage (rentedQuantity / originalQuantity * 100)

### Requirement 2: Integrate with Enhanced ProductSize API Response

**User Story:** Sebagai developer, saya ingin SizeDetailCard menggunakan data dari API response yang sudah menyediakan informasi inventory lengkap, sehingga tidak perlu melakukan kalkulasi manual di frontend.

#### Acceptance Criteria

1. WHEN fetching product detail THEN the API SHALL include `sizeDetails` array with enhanced inventory fields
2. WHEN API response includes `inventoryStatus` THEN the system SHALL display overall inventory health indicator
3. WHEN `sizeDetails` contains `utilizationRate` THEN the system SHALL display it as progress bar or percentage
4. WHEN API response includes `isAvailable` flag per size THEN the system SHALL use it for availability badge
5. WHEN transforming API data THEN the hook SHALL map `sizeDetails` to component props correctly

### Requirement 3: Visual Differentiation for Inventory Status

**User Story:** Sebagai pengunjung website, saya ingin dapat dengan mudah membedakan ukuran yang tersedia penuh, tersedia sebagian, dan habis, sehingga saya dapat dengan cepat memilih ukuran yang sesuai.

#### Acceptance Criteria

1. WHEN availableQuantity = originalQuantity THEN the system SHALL display green indicator (fully available)
2. WHEN 0 < availableQuantity < originalQuantity THEN the system SHALL display yellow/orange indicator (partially available)
3. WHEN availableQuantity = 0 THEN the system SHALL display red indicator (out of stock)
4. WHEN displaying utilization rate THEN the system SHALL use color-coded progress bar (green < 50%, yellow 50-80%, red > 80%)
5. WHEN a size is out of stock THEN the system SHALL apply opacity/disabled styling to the size card

### Requirement 4: Responsive Layout for Inventory Details

**User Story:** Sebagai pengunjung website menggunakan mobile device, saya ingin informasi inventory tetap mudah dibaca dan tidak terpotong, sehingga saya dapat melihat semua detail dengan nyaman.

#### Acceptance Criteria

1. WHEN viewing on mobile (< 640px) THEN the system SHALL stack inventory information vertically
2. WHEN viewing on tablet (640px - 1024px) THEN the system SHALL display inventory in 2-column grid
3. WHEN viewing on desktop (> 1024px) THEN the system SHALL display inventory in optimal layout with all details visible
4. WHEN displaying progress bars THEN the system SHALL maintain minimum height of 8px for touch targets
5. WHEN displaying badges THEN the system SHALL use responsive font sizes (text-xs on mobile, text-sm on desktop)

### Requirement 5: Admin Context Support

**User Story:** Sebagai admin yang melihat product detail, saya ingin melihat informasi inventory yang sama dengan public view tetapi dengan indikator tambahan untuk editing, sehingga saya tahu data ini dapat diubah.

#### Acceptance Criteria

1. WHEN context = 'admin' THEN the system SHALL display "(Editable)" indicator in card title
2. WHEN context = 'admin' THEN the system SHALL show additional admin hints in statistics section
3. WHEN context = 'admin' THEN the system SHALL use admin-specific styling (gray tones instead of neutral)
4. WHEN context = 'public' THEN the system SHALL hide all admin-specific indicators
5. WHEN editable = true AND context = 'admin' THEN the system SHALL display edit icon or button

### Requirement 6: Backward Compatibility with Legacy Data

**User Story:** Sebagai system administrator, saya ingin SizeDetailCard tetap berfungsi dengan data legacy yang hanya memiliki `quantity` field, sehingga tidak ada breaking changes saat migration.

#### Acceptance Criteria

1. WHEN API response only includes `quantity` field THEN the system SHALL treat it as originalQuantity
2. WHEN rentedQuantity is undefined or null THEN the system SHALL default to 0
3. WHEN availableQuantity is undefined or null THEN the system SHALL calculate it as (quantity - rentedQuantity)
4. WHEN sizeDetails array is empty THEN the system SHALL fallback to using `sizes` array from product
5. WHEN both legacy and enhanced fields exist THEN the system SHALL prioritize enhanced fields (originalQuantity, rentedQuantity, availableQuantity)

### Requirement 7: Performance Optimization

**User Story:** Sebagai pengunjung website, saya ingin product detail page loading dengan cepat tanpa lag, sehingga saya dapat segera melihat informasi produk.

#### Acceptance Criteria

1. WHEN calculating statistics THEN the system SHALL use React.useMemo to prevent unnecessary recalculations
2. WHEN rendering size list THEN the system SHALL use React.memo for individual size items
3. WHEN API response is large (> 20 sizes) THEN the system SHALL implement virtualization or pagination
4. WHEN displaying progress bars THEN the system SHALL use CSS transforms instead of width animations
5. WHEN component mounts THEN the system SHALL complete initial render within 100ms

### Requirement 8: Accessibility Compliance

**User Story:** Sebagai pengunjung website dengan screen reader, saya ingin dapat memahami informasi inventory melalui audio description, sehingga saya dapat membuat keputusan sewa yang informed.

#### Acceptance Criteria

1. WHEN displaying inventory status THEN the system SHALL include aria-label with full description
2. WHEN showing progress bars THEN the system SHALL include aria-valuenow, aria-valuemin, aria-valuemax attributes
3. WHEN displaying badges THEN the system SHALL use semantic HTML with proper role attributes
4. WHEN size is out of stock THEN the system SHALL include aria-disabled="true" attribute
5. WHEN displaying icons THEN the system SHALL include aria-hidden="true" for decorative icons and alt text for meaningful icons

## Data Flow

### API Response Structure (from `/api/products/[id]`)

```typescript
{
  id: string
  name: string
  sizes: Array<{
    id: string
    ageCategory: 'ADULT' | 'CHILD' | 'UNIVERSAL'
    size: string
    quantity: number // Legacy field
    originalQuantity: number
    rentedQuantity: number
    availableQuantity: number
  }>
  inventoryStatus: {
    totalOriginal: number
    totalAvailable: number
    totalRented: number
    utilizationRate: number
    isHealthy: boolean
  }
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
}
```

### Component Props Structure

```typescript
interface SizeDetailCardProps {
  sizes: Array<{
    size: string
    ageCategory: string
    quantity: number // Legacy support
    originalQuantity?: number
    rentedQuantity?: number
    availableQuantity?: number
    utilizationRate?: number
    isAvailable?: boolean
  }>
  title?: string
  showStats?: boolean
  showProgress?: boolean
  context?: 'public' | 'admin'
  editable?: boolean
}
```

## Success Metrics

1. **Information Completeness**: 100% of size entries display all 3 quantity fields (original, rented, available)
2. **Visual Clarity**: User testing shows 90%+ users can identify available vs rented stock within 3 seconds
3. **Performance**: Component renders within 100ms for products with up to 50 size variations
4. **Accessibility**: WCAG 2.1 AA compliance score of 100% on automated testing tools
5. **Backward Compatibility**: 0 breaking changes for existing product data

## Out of Scope

1. Real-time inventory updates (will be handled by separate WebSocket feature)
2. Inventory reservation system (handled by transaction service)
3. Historical inventory tracking (handled by product history feature)
4. Multi-location inventory (future enhancement)
5. Inventory alerts and notifications (separate feature)

## Dependencies

1. Enhanced ProductSize schema with originalQuantity, rentedQuantity, availableQuantity fields
2. Public Product API endpoint with sizeDetails and inventoryStatus in response
3. InventoryService for consistent stock calculations
4. React Query for data fetching and caching
5. Tailwind CSS for responsive styling
6. shadcn/ui components (Badge, Progress, Card)

## Migration Strategy

### Phase 1: Add Enhanced Fields Support (Non-Breaking)
- Update SizeDetailCard to accept both legacy and enhanced fields
- Add fallback logic for missing enhanced fields
- Test with existing data

### Phase 2: Update API Integration
- Modify useTransformedProductDetail hook to map sizeDetails
- Add inventoryStatus to transformed data
- Ensure backward compatibility

### Phase 3: Update UI Components
- Implement new inventory display layout
- Add progress bars and utilization indicators
- Apply responsive styling

### Phase 4: Testing & Validation
- Test with various data scenarios (full stock, partial, out of stock)
- Validate accessibility compliance
- Performance testing with large datasets

### Phase 5: Deployment
- Deploy to staging environment
- Monitor for issues
- Gradual rollout to production
