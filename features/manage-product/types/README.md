# Product Management Types

## Files Overview

### `index.ts` (Current - Hybrid Interfaces)
- Contains legacy and hybrid interfaces for backward compatibility
- Includes both `CreateProductRequest` (legacy) and `CreateProductWithSizesRequest` (advanced)
- Will be consolidated during Phase 4 implementation

### `advanced.ts` (New - Advanced-Only Interfaces)
- Clean, advanced-only interfaces without legacy baggage
- All products MUST have sizes array (minimum 1 size required)
- Enhanced validation and business logic functions
- Designed for optimal developer experience

## Key Interface Groups

### Core Entity Interfaces
- `AdvancedProduct` - Product entity with required sizes
- `AdvancedProductSize` - Individual size records
- `AdvancedCategory`, `AdvancedColor`, `AdvancedMaterial` - Supporting entities

### API Interfaces
- `CreateAdvancedProductRequest` - Clean creation interface
- `UpdateAdvancedProductRequest` - Update operations
- `CreateAdvancedProductSizeRequest` - Size creation

### Aggregation Interfaces
- `AdvancedAggregatedSizeView` - Aggregated size display
- `AdvancedProductSizeAggregation` - Complete aggregation data
- `AdvancedCategoryBreakdown` - Age category analysis

### Business Logic Interfaces
- `AdvancedSizeValidationResult` - Validation responses
- `AdvancedBusinessValidationResult` - Business rule validation
- `AdvancedProductCapabilities` - Business intelligence

### Kasir Integration Interfaces
- `AdvancedKasirProductView` - Kasir system product view
- `AdvancedKasirAvailableSize` - Available size tracking
- `AdvancedRentalTransactionItem` - Rental transaction items

## Validation Functions

### `validateAdvancedSizeRequest()`
Validates individual size request with business rules:
- Valid age category (ADULT, CHILD, UNIVERSAL)
- Valid size enum (XS, S, M, L, XL, XXL)
- Minimum quantity validation

### `validateAdvancedSizeArray()`
Validates complete size array with enhanced rules:
- Minimum 1 size required
- No duplicate size+ageCategory combinations
- Individual size validation

## Type Guards

- `isValidAdvancedAgeCategory()` - Age category validation
- `isValidAdvancedSizeEnum()` - Size enum validation
- `isValidAdvancedProductStatus()` - Product status validation

## Migration Strategy

**Phase 1-3**: Use `advanced.ts` for new implementations
**Phase 4**: Consolidate by replacing `index.ts` content with `advanced.ts`
**Post-Migration**: Remove `advanced.ts`, keep only consolidated `index.ts`

## Usage Examples

```typescript
// Creating a product with advanced sizes
const productRequest: CreateAdvancedProductRequest = {
  code: 'SHIRT-001',
  name: 'Cotton Shirt',
  modalAwal: 100000,
  currentPrice: 50000,
  categoryId: 'cat-1',
  sizes: [
    { ageCategory: 'ADULT', size: 'M', quantity: 5 },
    { ageCategory: 'ADULT', size: 'L', quantity: 3 },
    { ageCategory: 'CHILD', size: 'M', quantity: 2 }
  ]
}

// Validating sizes
const validation = validateAdvancedSizeArray(productRequest.sizes)
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors)
}
```