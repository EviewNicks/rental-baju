# Phase 3 Implementation Plan: Backend Service Transformation

**Project**: Maguru - Rental Clothing Management System
**Date**: 2025-01-16
**Focus**: Backend Service Layer Transformation for Enhanced ProductSize Schema

## Executive Summary

**Objective**: Transform backend services to use Enhanced ProductSize schema as single source of truth for inventory management.

**Current Status**: Database migration `20251115091028_add_rented_stock` completed successfully with new fields:
- `originalQuantity` - Total stock owned
- `rentedQuantity` - Currently rented items  
- `availableQuantity` - Available for rent (calculated: original - rented)

**Total Estimated Time**: 22 hours across 6 systematic tasks
**Risk Level**: Medium (with comprehensive rollback procedures)

## Current State Analysis

### Services Requiring Updates:
1. **TransaksiService** (features/kasir/services/transaksiService.ts)
   - Lines 408-411: updateProductSizeQuantities method uses legacy `quantity`
   - Lines 491-508: Stock update logic needs new fields
   - Lines 516-568: validateStockAvailability uses legacy `quantity`
   
2. **ReturnService** (features/kasir/services/returnService.ts)
   - Lines 692-710: Stock restoration logic needs new fields
   - Uses legacy Product.rentedStock updates (to be removed)
   
3. **PickupService** - ✅ CONFIRMED CORRECT
   - Only handles status tracking, no inventory changes needed
   - No modifications required

### Database Schema Status:
```sql
ProductSize Model (Enhanced):
- originalQuantity: Int @default(0)  -- Total stock owned
- rentedQuantity: Int @default(0)   -- Currently rented  
- availableQuantity: Int @default(0) -- Available for rent
- quantity: Int (legacy field - will be deprecated)
```

## Detailed Implementation Plan


### Task 3.2: Update TransaksiService (4 hours)
**File**: features/kasir/services/transaksiService.ts
**Key Changes Required**:

1. **Add InventoryService Integration** (line 16):
```typescript
import { InventoryService } from './inventoryService'
```

2. **Update Constructor** (line 212):
```typescript
export class TransaksiService {
  private codeGenerator: TransactionCodeGenerator
  private availabilityService: AvailabilityService
  private inventoryService: InventoryService  // NEW

  constructor(
    private prisma: PrismaClient,
    private userId: string,
  ) {
    this.codeGenerator = new TransactionCodeGenerator(prisma)
    this.availabilityService = createAvailabilityService(prisma)
    this.inventoryService = new InventoryService(prisma) // NEW
  }
}
```

3. **Replace updateProductSizeQuantities Method** (lines 458-509):
```typescript
private async updateProductSizeQuantities(
  tx: any, 
  items: CreateTransaksiRequest['items']
): Promise<void> {
  for (const item of items) {
    // Get current product size state for validation
    const currentProductSize = await tx.productSize.findUnique({
      where: { id: item.productSizeId },
      select: {
        id: true,
        availableQuantity: true,  // NEW: Use availableQuantity instead of quantity
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!currentProductSize) {
      throw new Error(`ProductSize ${item.productSizeId} not found during stock update`)
    }

    // Double-check availability (race condition protection)
    if (currentProductSize.availableQuantity < item.jumlah) {
      throw new Error(
        `Insufficient stock for product size. Available: ${currentProductSize.availableQuantity}, Requested: ${item.jumlah}`
      )
    }

    // Update ProductSize with new fields
    const updateResult = await tx.productSize.updateMany({
      where: {
        id: item.productSizeId,
        availableQuantity: { gte: item.jumlah }, // NEW: Check availableQuantity
      },
      data: {
        rentedQuantity: { increment: item.jumlah },    // NEW: Increment rented
        availableQuantity: { decrement: item.jumlah }, // NEW: Decrement available
      },
    })

    // Verify the update was successful
    if (updateResult.count === 0) {
      throw new Error(
        `Failed to update quantity for product size. The size may have been modified by another transaction.`
      )
    }
  }
}
```

4. **Update validateStockAvailability Method** (lines 516-568):
```typescript
private async validateStockAvailability(items: CreateTransaksiRequest['items']): Promise<void> {
  // ... existing validation code ...

  // Validate each item has sufficient stock
  for (const item of items) {
    const productSize = productSizes.find((ps) => ps.id === item.productSizeId)

    if (!productSize) {
      throw new Error(`Ukuran produk tidak ditemukan untuk item ${item.productSizeId}`)
    }

    // Validate stock availability using NEW field
    if (productSize.availableQuantity < item.jumlah) {
      throw new Error(
        `Size ${productSize.size} (${productSize.ageCategory}) untuk ${productSize.product.name} tidak mencukupi. Tersedia: ${productSize.availableQuantity}, Diminta: ${item.jumlah}`
      )
    }
  }
}
```

### Task 3.3: Update ReturnService (3 hours)
**File**: features/kasir/services/returnService.ts
**Key Changes Required**:

1. **Add InventoryService Integration** (line 23):
```typescript
import { InventoryService } from './inventoryService'
```

2. **Update Constructor** (line 89):
```typescript
export class UnifiedReturnService {
  private transaksiService: TransaksiService
  private auditService: AuditService
  private inventoryService: InventoryService  // NEW

  constructor(
    private prisma: PrismaClient,
    private userId: string,
  ) {
    this.transaksiService = new TransaksiService(prisma, userId)
    this.auditService = createAuditService(prisma, userId)
    this.inventoryService = new InventoryService(prisma) // NEW
  }
}
```

3. **Replace Stock Updates in Transaction** (lines 702-710):
```typescript
// REPLACE: Product stock updates (remove legacy rentedStock)
// DELETE: lines 692-700 (Product.rentedStock updates)

// KEEP: ProductSize updates with NEW fields
Promise.all(
  Array.from(sizeUpdates.entries()).map(([sizeId, quantity]) =>
    tx.productSize.update({
      where: { id: sizeId },
      data: {
        rentedQuantity: { decrement: quantity },   // NEW: Decrement rented
        availableQuantity: { increment: quantity }, // NEW: Increment available
      }
    })
  ),
)
```

### Task 3.5: Update Product API (2 hours)
**File**: app/api/products/[id]/route.ts
**Purpose**: Enhance response to include new inventory fields

```typescript
// In the GET method, enhance sizes response
sizes: product.sizes.map(size => ({
  id: size.id,
  size: size.size,
  ageCategory: size.ageCategory,
  originalQuantity: size.originalQuantity,      // NEW
  availableQuantity: size.availableQuantity,    // NEW
  rentedQuantity: size.rentedQuantity,          // NEW
  isActive: size.isActive,
  // Optional: Calculate utilization percentage
  utilizationRate: size.originalQuantity > 0 
    ? Math.round((size.rentedQuantity / size.originalQuantity) * 100)
    : 0
}))
```


## Implementation Sequence

### Phase 3.1: Core Infrastructure (Hours 1-6)
- Create InventoryService with all 4 core methods
- Add comprehensive error handling and logging
- Create basic unit tests for InventoryService methods
- Validate integration with existing database schema

### Phase 3.2: Service Integration (Hours 7-13)
- Update TransaksiService to use new inventory fields
- Replace legacy quantity references with availableQuantity
- Update ReturnService stock restoration logic
- Remove legacy Product.rentedStock updates
- Create integration tests for service layer interactions
- Validate transaction flow integrity

### Phase 3.3: API Enhancement (Hours 14-19)
- Create new inventory availability endpoint
- Update existing product API responses with new fields
- Add enhanced error handling and validation
- Create API tests for new endpoints
- Validate backward compatibility

### Phase 3.4: Testing & Validation (Hours 20-22)
- End-to-end testing of complete transaction flows
- Performance testing with new inventory system
- Data consistency validation across all operations
- Documentation updates for new inventory system
- Final validation before production deployment

## Technical Implementation Details

### New Data Flow:
```
CREATE TRANSACTION → InventoryService.updateStockOnCreate()
  - rentedQuantity: +1 (increment)
  - availableQuantity: -1 (decrement)
  - originalQuantity: unchanged (baseline)

PROCESS RETURN → InventoryService.updateStockOnReturn()
  - rentedQuantity: -1 (decrement)
  - availableQuantity: +1 (increment)
  - originalQuantity: unchanged (baseline)

VALIDATION: availableQuantity = originalQuantity - rentedQuantity
```

### Database Query Optimization:
- Leverage new indexes on rentedQuantity and availableQuantity fields
- Batch operations for multiple size updates in single transaction
- Maintain transaction performance with optimized queries
- Use atomic operations to prevent race conditions

### Error Handling Strategy:
- Comprehensive validation before stock operations
- Graceful fallback for concurrent transaction conflicts
- Detailed logging for debugging inventory issues
- User-friendly error messages for insufficient stock scenarios

## Risk Mitigation

### Rollback Strategy:
- Feature flags for gradual rollout of new inventory system
- Keep legacy field validation during transition period
- Database transaction rollback capability for failed operations
- Comprehensive monitoring and alerting for inventory inconsistencies

### Data Integrity Measures:
- Atomic operations for all inventory updates
- Validation of available = original - rented consistency
- Concurrent transaction handling with proper database locking
- Regular data consistency checks and validation scripts

### Performance Considerations:
- Monitor query performance with new inventory fields
- Optimize database queries using new indexes
- Cache frequently accessed inventory data
- Batch operations for multiple inventory updates

## Success Metrics

### Technical Metrics:
- ✅ 100% inventory operations use new ProductSize fields
- ✅ Real-time stock accuracy: available = original - rented formula
- ✅ No performance degradation (>5% threshold acceptable)
- ✅ Zero inventory-related bugs in production environment
- ✅ Complete test coverage (>90% for new inventory logic)

### Business Metrics:
- Accurate real-time inventory visibility
- Improved transaction processing reliability
- Enhanced reporting capabilities with detailed stock tracking
- Reduced customer complaints about stock availability

## Monitoring & Validation

### Production Monitoring:
- Real-time inventory accuracy validation
- Performance monitoring for inventory operations
- Error tracking for inventory-related failures
- Automated alerts for data consistency issues

### Validation Scripts:
- Daily consistency checks: SUM(available) + SUM(rented) = SUM(original)
- Transaction flow validation across all inventory operations
- Performance benchmarking for new inventory system
- User acceptance testing with production data

## Next Steps

Upon plan approval, implementation will proceed with:
1. Creating InventoryService as foundational component
2. Systematically updating existing services (TransaksiService, ReturnService)
3. Adding enhanced API endpoints for inventory visibility
4. Comprehensive testing before production deployment
5. Gradual rollout with monitoring and validation

This plan ensures systematic transformation to single source of truth inventory system while maintaining system integrity, performance, and data consistency.

**Created by**: Claude Code Assistant  
**Last Updated**: 2025-01-16  
**Version**: 1.0  
**Next Review**: After Phase 3 completion