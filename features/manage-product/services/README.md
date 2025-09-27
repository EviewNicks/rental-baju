# Product Management Services

## Service Files Overview

### Current Services

#### `productService.ts`
- Core product CRUD operations
- Hybrid size management support (legacy + advanced)
- File upload integration
- Business validation logic

#### `productSizeAggregationService.ts` (Current)
- Size aggregation and display logic
- Basic caching mechanism
- Business intelligence methods
- Rental tracking validation

### Enhanced Services (Phase 1)

#### `advancedProductSizeAggregationService.ts` (NEW)
**Enhanced aggregation service for advanced-only size management**

**Key Features:**
- Advanced-only TypeScript interface compatibility
- Enhanced performance monitoring with detailed metrics
- Improved caching with LRU eviction and memory management
- Real-time rental tracking integration capabilities
- Comprehensive business intelligence analytics
- Advanced error handling and validation

**Performance Improvements:**
- LRU cache eviction strategy
- Memory usage monitoring
- Performance threshold warnings
- Cache hit ratio tracking
- Automatic performance optimization

**Business Intelligence:**
- Product capability analysis
- Advanced business rule validation
- Complexity scoring system
- Recommendation engine
- Multi-tier business value assessment

**Usage Example:**
```typescript
const service = new AdvancedProductSizeAggregationService(prisma, {
  enableCaching: true,
  cacheExpiryMinutes: 10,
  includeRentalTracking: true,
  performanceThresholdMs: 50,
  maxCacheSize: 1000
})

// Get aggregated sizes with rental tracking
const result = await service.getAdvancedAggregatedSizes(productId, {
  includeBreakdown: true,
  includeRentalTracking: true
})

// Analyze business capabilities
const capabilities = await service.analyzeAdvancedProductCapabilities(productId)

// Get performance statistics
const stats = service.getPerformanceStats()
```

**Configuration Options:**
- `enableCaching`: Enable/disable caching mechanism
- `cacheExpiryMinutes`: Cache expiration time
- `includeBreakdown`: Include age category breakdown
- `includeRentalTracking`: Include real-time rental status
- `performanceThresholdMs`: Performance warning threshold
- `maxCacheSize`: Maximum number of cache entries

## Migration Strategy

### Phase 2 Implementation (COMPLETED)

#### `advancedProductService.ts` (NEW)
**Complete advanced-only service implementation without legacy baggage**

**Key Features:**
- `createProductAdvanced()` - Advanced-only product creation (REQUIRED sizes)
- `updateProductAdvanced()` - Advanced-only product updates
- `getProductAdvanced()` - Advanced-only product retrieval
- `getProductsAdvanced()` - Advanced-only product listing
- Enhanced validation and business logic enforcement
- Complete integration with advanced aggregation service
- Type-safe operations with advanced-only interfaces

**Requirements Enforced:**
- ALL products MUST have at least 1 size
- No duplicate size+ageCategory combinations
- No legacy `size` field support
- Enhanced validation and business logic
- Automatic quantity calculation from sizes

**Usage Example:**
```typescript
const service = new AdvancedProductService(prisma, userId)

// Create product (sizes are REQUIRED)
const product = await service.createProductAdvanced({
  code: 'SHIRT001',
  name: 'Cotton Shirt',
  modalAwal: 100000,
  currentPrice: 50000,
  categoryId: 'cat-1',
  sizes: [
    { ageCategory: 'ADULT', size: 'M', quantity: 5 },
    { ageCategory: 'ADULT', size: 'L', quantity: 3 }
  ]
})
```

#### `advancedProductSchema.ts` (NEW)
**Advanced-only validation schemas with enhanced business rules**

**Key Features:**
- Advanced enum validation (AgeCategory, SizeEnum, ProductStatus)
- Size array validation with duplicate prevention
- Business capability validation
- Bulk operation schemas
- Migration support schemas
- Export/import validation

### Phase 4 Plan
During Phase 4, consolidation will occur:
- Replace hybrid services with advanced-only versions
- Remove legacy method support
- Integrate enhanced aggregation service as primary

## Service Dependencies

```
productService.ts (Hybrid - Legacy + Advanced)
├── prisma (database access)
├── file upload services
└── validation schemas

advancedProductService.ts (Advanced-Only)
├── prisma (database access)
├── advancedProductSchema.ts (validation schemas)
├── advanced.ts (TypeScript interfaces)
├── advancedProductSizeAggregationService.ts
└── error handling utilities

advancedProductSizeAggregationService.ts (Enhanced)
├── prisma (database access)
├── advanced.ts (TypeScript interfaces)
├── LRU cache management
└── performance monitoring utilities
```

## Performance Guidelines

**Cache Configuration:**
- Development: 5-minute expiry, 100 max entries
- Production: 10-minute expiry, 1000 max entries
- High-traffic: 15-minute expiry, 5000 max entries

**Performance Thresholds:**
- Excellent: < 25ms
- Good: < 50ms
- Needs Attention: < 100ms
- Critical: > 100ms

**Memory Management:**
- LRU eviction when cache exceeds max size
- Monitor memory usage per operation
- Performance metrics retention (last 100 operations)

## Testing Strategy

### Unit Tests
- Aggregation algorithm accuracy
- Cache behavior validation
- Performance metric collection
- Business rule enforcement

### Integration Tests
- Database query optimization
- Real-world data aggregation
- Cache invalidation scenarios
- Performance under load

### Performance Tests
- Large dataset aggregation (1000+ sizes)
- Concurrent access patterns
- Memory usage validation
- Cache efficiency measurement