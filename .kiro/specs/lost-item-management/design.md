# Design Document - Lost Item Management System

## Overview

The Lost Item Management System implements a two-stage process for handling rental items reported as lost (HILANG). The design focuses on simplicity, data consistency, and minimal code changes while providing complete functionality for tracking lost items and managing security deposits.

**Key Design Principles:**
- **Keep It Simple**: Minimal new components, reuse existing patterns
- **Atomic Operations**: All critical operations within database transactions
- **Data Consistency**: Maintain inventory invariants at all times
- **Backward Compatible**: Existing functionality continues to work

**Performance Targets:**
- Lost item return processing: < 3s (same as current return service)
- Resolution processing: < 2s (simple stock update + payment)
- Zero data inconsistency between inventory and financial records

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  SimpleReturnForm (existing)                                 │
│  ActionButtonPanel (modified - add resolve button)           │
│  LostItemResolutionModal (new - simple 2-option form)        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  UnifiedReturnService (modified)                             │
│    - Fix getConditionPenalty() for HILANG                    │
│    - Add resolveLostItem() method                            │
│                                                              │
│  InventoryService (existing - reused)                        │
│    - updateStockOnReturn() for customer replacement          │
│    - updateStockOnLost() for deposit retention (new)         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
├─────────────────────────────────────────────────────────────┤
│  ProductSize (modified)                                      │
│    + lostQuantity: Int                                       │
│                                                              │
│  TransaksiItemReturn (modified)                              │
│    + resolutionStatus: String?                               │
│    + resolutionDate: DateTime?                               │
│    + resolutionNotes: String?                                │
│                                                              │
│  Pembayaran (existing - reused for refunds)                  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Stage 1: Initial Return (Existing Flow + Bug Fix)**
```
Customer returns items → SimpleReturnForm
  ↓
Item marked as HILANG
  ↓
UnifiedReturnService.processUnifiedReturn()
  ↓
getConditionPenalty() → Calculate modalAwal + late penalty ✅ FIX
  ↓
Create TransaksiItemReturn (resolutionStatus: null)
  ↓
Create Pembayaran (penalty payment)
  ↓
Stock: NO UPDATE (rentedQuantity unchanged)
  ↓
Transaction status: 'selesai'
```

**Stage 2: Lost Item Resolution (New Flow)**
```
Producer views transaction → ActionButtonPanel
  ↓
"Resolve Barang Hilang" button visible
  ↓
Click button → LostItemResolutionModal
  ↓
Select resolution option:
  ├─ Customer Beli Sendiri
  │    ↓
  │    UnifiedReturnService.resolveLostItem('customer_replaced')
  │    ↓
  │    BEGIN TRANSACTION
  │      - Create refund payment (negative amount)
  │      - Update stock: rentedQuantity--, availableQuantity++
  │      - Update resolutionStatus: 'resolved_replaced'
  │    COMMIT
  │
  └─ Ganti dengan Dana
       ↓
       UnifiedReturnService.resolveLostItem('deposit_kept')
       ↓
       BEGIN TRANSACTION
         - No payment (keep deposit)
         - Update stock: rentedQuantity--, lostQuantity++
         - Update resolutionStatus: 'resolved_lost'
       COMMIT
```

## Components and Interfaces

### 1. Modified: UnifiedReturnService

**New Method: resolveLostItem()**

```typescript
interface LostItemResolutionRequest {
  transaksiId: string
  returnRecordId: string  // TransaksiItemReturn.id
  resolutionType: 'customer_replaced' | 'deposit_kept'
  notes?: string
}

interface LostItemResolutionResult {
  success: boolean
  resolutionType: string
  refundAmount?: number  // Only for customer_replaced
  stockUpdates: {
    sizeId: string
    rentedQuantity: number
    availableQuantity: number
    lostQuantity: number
  }
  message: string
}

async resolveLostItem(
  request: LostItemResolutionRequest
): Promise<LostItemResolutionResult>
```

**Modified Method: getConditionPenalty()**

```typescript
// BEFORE (BROKEN)
private getConditionPenalty(condition: any): number {
  if (condition.useManualPricing && condition.manualPrice) {
    return condition.manualPrice * condition.jumlahKembali
  }
  if (condition.conditionCategory === 'BAIK') {
    return 0
  }
  return 0  // ❌ HILANG returns 0
}

// AFTER (FIXED)
private getConditionPenalty(
  condition: any, 
  transactionItem: any
): number {
  // ✅ HILANG: Use modalAwal as penalty
  if (condition.conditionCategory === 'HILANG') {
    return condition.modalAwal || Number(transactionItem.produk.modalAwal)
  }
  
  // Manual pricing for RUSAK
  if (condition.useManualPricing && condition.manualPrice) {
    return condition.manualPrice * condition.jumlahKembali
  }
  
  // BAIK: No penalty
  if (condition.conditionCategory === 'BAIK') {
    return 0
  }
  
  return 0
}
```

### 2. New: LostItemResolutionModal Component

```typescript
interface LostItemResolutionModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: TransactionDetail
  lostItems: Array<{
    returnRecordId: string
    itemId: string
    productName: string
    sizeInfo: string
    depositAmount: number
    modalAwal: number
  }>
}

// Simple modal with:
// - List of unresolved lost items
// - Two radio buttons: Customer Beli Sendiri / Ganti dengan Dana
// - Confirm button
// - Cancel button
```

### 3. Modified: ActionButtonPanel

```typescript
// Add new button condition
const hasUnresolvedLostItems = transaction.products?.some(
  (p) => p.conditionBreakdown?.some(
    (c) => c.kondisiAkhir.toLowerCase().includes('hilang') && 
           !c.resolutionStatus
  )
)

// Add button in render
{hasUnresolvedLostItems && (
  <Button onClick={() => setIsLostItemModalOpen(true)}>
    <Package className="h-4 w-4 mr-2" />
    Resolve Barang Hilang
  </Button>
)}
```

### 4. New: InventoryService Method

```typescript
// Add to existing InventoryService
async updateStockOnLost(
  sizeId: string,
  quantity: number
): Promise<void> {
  await this.prisma.productSize.update({
    where: { id: sizeId },
    data: {
      rentedQuantity: { decrement: quantity },
      lostQuantity: { increment: quantity },
    },
  })
}
```

## Data Models

### Modified: ProductSize Schema

```prisma
model ProductSize {
  id                String   @id @default(cuid())
  productId         String
  size              String
  ageCategory       String
  originalQuantity  Int
  rentedQuantity    Int      @default(0)
  lostQuantity      Int      @default(0)  // ✅ NEW
  availableQuantity Int
  
  product           Product  @relation(fields: [productId], references: [id])
  
  @@unique([productId, size, ageCategory])
  @@index([productId])
}
```

**Invariant**: `originalQuantity = rentedQuantity + lostQuantity + availableQuantity`

### Modified: TransaksiItemReturn Schema

```prisma
model TransaksiItemReturn {
  id                  String    @id @default(cuid())
  transaksiItemId     String
  kondisiAkhir        String
  conditionCategory   String    @default("BAIK")
  jumlahKembali       Int
  penaltyAmount       Decimal   @default(0)
  manualPrice         Decimal?
  useManualPricing    Boolean   @default(false)
  modalAwalUsed       Decimal?
  penaltyCalculation  Json?
  
  // ✅ NEW: Resolution tracking
  resolutionStatus    String?   // 'resolved_replaced' | 'resolved_lost'
  resolutionDate      DateTime?
  resolutionNotes     String?
  
  createdAt           DateTime  @default(now())
  createdBy           String
  
  transaksiItem       TransaksiItem @relation(fields: [transaksiItemId], references: [id])
  
  @@index([transaksiItemId])
  @@index([conditionCategory])
  @@index([resolutionStatus])  // ✅ NEW: For querying unresolved items
}
```

### Existing: Pembayaran (Reused for Refunds)

```prisma
model Pembayaran {
  id                String   @id @default(cuid())
  transaksiId       String
  jumlah            Decimal  // Negative for refunds
  metode            String   // 'refund' for lost item refunds
  catatan           String
  penaltyBreakdown  Json?
  createdAt         DateTime @default(now())
  createdBy         String
  
  transaksi         Transaksi @relation(fields: [transaksiId], references: [id])
  
  @@index([transaksiId])
  @@index([metode])
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: HILANG Penalty Equals modalAwal

*For any* lost item return with conditionCategory "HILANG", the calculated penalty amount should equal the modalAwal value of the product.

**Validates: Requirements 1.1, 9.1, 9.2**

**Test Strategy**: Generate random products with various modalAwal values, create HILANG conditions, verify penaltyAmount equals modalAwal.

### Property 2: Inventory Invariant Preservation

*For any* ProductSize record, at all times the following must hold: `originalQuantity = rentedQuantity + lostQuantity + availableQuantity`

**Validates: Requirements 2.5**

**Test Strategy**: Generate random stock operations (rent, return, lost resolution), verify invariant holds after each operation.

### Property 3: Lost Item Stock Immutability on Initial Return

*For any* lost item return processing, the rentedQuantity and availableQuantity should remain unchanged immediately after return is processed.

**Validates: Requirements 2.2**

**Test Strategy**: Record stock values before HILANG return, verify values unchanged after return processing.

### Property 4: Customer Replacement Stock Update

*For any* lost item resolved as "customer_replaced", rentedQuantity should decrease by 1 and availableQuantity should increase by 1, while lostQuantity remains unchanged.

**Validates: Requirements 4.2, 4.3, 4.4**

**Test Strategy**: Generate random lost items, resolve as customer_replaced, verify stock changes match expected deltas.

### Property 5: Deposit Retention Stock Update

*For any* lost item resolved as "deposit_kept", rentedQuantity should decrease by 1 and lostQuantity should increase by 1, while availableQuantity remains unchanged.

**Validates: Requirements 5.2, 5.3, 5.4**

**Test Strategy**: Generate random lost items, resolve as deposit_kept, verify stock changes match expected deltas.

### Property 6: Refund Amount Equals Original Deposit

*For any* lost item resolved as "customer_replaced", the refund payment amount should equal the negative of the original security deposit amount.

**Validates: Requirements 4.1**

**Test Strategy**: Generate random lost items with various deposit amounts, resolve as customer_replaced, verify refund equals -deposit.

### Property 7: Resolution Status Transition

*For any* lost item return record, resolutionStatus should transition from null to either "resolved_replaced" or "resolved_lost" exactly once, and never transition back to null.

**Validates: Requirements 6.2, 6.3, 6.5**

**Test Strategy**: Generate random lost items, attempt multiple resolutions, verify status transitions are valid and one-way.

### Property 8: Transaction Atomicity

*For any* lost item resolution operation, if any sub-operation fails (stock update, payment, status update), then all changes should be rolled back and no partial state should persist.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

**Test Strategy**: Inject failures at various points in resolution transaction, verify complete rollback occurs.

### Property 9: Unresolved Lost Items Query Accuracy

*For any* transaction, the query for unresolved lost items should return exactly those items where kondisiAkhir contains "hilang" AND resolutionStatus is null.

**Validates: Requirements 6.4**

**Test Strategy**: Generate transactions with mix of resolved/unresolved lost items, verify query returns correct subset.

### Property 10: Deposit Calculation Consistency

*For any* lost item return, the security deposit stored in penalty payment should equal modalAwal plus late penalty calculated from return date.

**Validates: Requirements 1.1, 1.2**

**Test Strategy**: Generate returns with various late days, verify deposit = modalAwal + (lateDays > 0 ? 20000 : 0).

## Error Handling

### Validation Errors

```typescript
// Lost item resolution validation
if (!returnRecord) {
  throw new Error('Return record not found')
}

if (returnRecord.conditionCategory !== 'HILANG') {
  throw new Error('Can only resolve HILANG items')
}

if (returnRecord.resolutionStatus) {
  throw new Error('Item already resolved')
}

if (!productSize) {
  throw new Error('Product size not found')
}

if (productSize.rentedQuantity < 1) {
  throw new Error('No rented quantity to resolve')
}
```

### Transaction Rollback

```typescript
try {
  await this.prisma.$transaction(async (tx) => {
    // All operations here
    // If any fails, entire transaction rolls back
  })
} catch (error) {
  kasirLogger.error('Lost item resolution failed', {
    returnRecordId,
    error: error.message,
  })
  throw new Error(`Resolution failed: ${error.message}`)
}
```

### Stock Update Failures

```typescript
// In resolveLostItem method
try {
  await txInventoryService.updateStockOnReturn(sizeId, 1)
} catch (error) {
  // Transaction will rollback automatically
  throw new Error(`Stock update failed: ${error.message}`)
}
```

## Testing Strategy

### Unit Tests

**Test Coverage:**
1. `getConditionPenalty()` returns modalAwal for HILANG
2. `getConditionPenalty()` returns 0 for BAIK
3. `getConditionPenalty()` returns manualPrice for RUSAK
4. `resolveLostItem()` creates refund for customer_replaced
5. `resolveLostItem()` updates stock correctly for both options
6. `resolveLostItem()` prevents duplicate resolution
7. Validation errors thrown for invalid inputs
8. Transaction rollback on failures

**Example Unit Test:**
```typescript
describe('getConditionPenalty', () => {
  it('should return modalAwal for HILANG condition', () => {
    const condition = {
      conditionCategory: 'HILANG',
      modalAwal: 500000,
      jumlahKembali: 0,
    }
    const transactionItem = {
      produk: { modalAwal: 500000 }
    }
    
    const penalty = service.getConditionPenalty(condition, transactionItem)
    
    expect(penalty).toBe(500000)
  })
})
```

### Property-Based Tests

**Framework**: fast-check (TypeScript property testing library)

**Test Configuration**: Minimum 100 iterations per property

**Property Test Example:**
```typescript
import * as fc from 'fast-check'

describe('Property: Inventory Invariant Preservation', () => {
  it('should maintain originalQuantity = rented + lost + available', () => {
    fc.assert(
      fc.property(
        fc.record({
          originalQuantity: fc.integer({ min: 1, max: 100 }),
          rentedQuantity: fc.integer({ min: 0, max: 50 }),
          lostQuantity: fc.integer({ min: 0, max: 50 }),
        }),
        async ({ originalQuantity, rentedQuantity, lostQuantity }) => {
          const availableQuantity = originalQuantity - rentedQuantity - lostQuantity
          
          // Assume availableQuantity >= 0 (valid state)
          fc.pre(availableQuantity >= 0)
          
          const productSize = await createTestProductSize({
            originalQuantity,
            rentedQuantity,
            lostQuantity,
            availableQuantity,
          })
          
          // Perform lost item resolution
          await service.resolveLostItem({
            sizeId: productSize.id,
            resolutionType: 'deposit_kept',
          })
          
          // Verify invariant still holds
          const updated = await prisma.productSize.findUnique({
            where: { id: productSize.id }
          })
          
          const sum = updated.rentedQuantity + updated.lostQuantity + updated.availableQuantity
          expect(sum).toBe(updated.originalQuantity)
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

**Property Test Tags:**
- Each property test MUST include comment: `// Feature: lost-item-management, Property X: [description]`
- Each property test MUST reference requirements: `// Validates: Requirements X.Y`

### Integration Tests

**Test Scenarios:**
1. Full flow: Return HILANG → Resolve customer_replaced → Verify refund + stock
2. Full flow: Return HILANG → Resolve deposit_kept → Verify no refund + lost stock
3. Multiple lost items in single transaction
4. Lost item with late penalty calculation
5. Concurrent resolution attempts (should fail)
6. Resolution after transaction already completed

### Edge Cases

1. **Lost item with zero modalAwal**: Should use product modalAwal
2. **Lost item with very large modalAwal**: Should handle Decimal precision
3. **Resolution of already resolved item**: Should throw error
4. **Resolution with insufficient rentedQuantity**: Should throw error
5. **Stock update failure mid-transaction**: Should rollback completely

## Migration Strategy

### Database Migration

```sql
-- Migration: Add lostQuantity to ProductSize
ALTER TABLE "ProductSize" ADD COLUMN "lostQuantity" INTEGER NOT NULL DEFAULT 0;

-- Migration: Add resolution tracking to TransaksiItemReturn
ALTER TABLE "TransaksiItemReturn" ADD COLUMN "resolutionStatus" TEXT;
ALTER TABLE "TransaksiItemReturn" ADD COLUMN "resolutionDate" TIMESTAMP(3);
ALTER TABLE "TransaksiItemReturn" ADD COLUMN "resolutionNotes" TEXT;

-- Add index for querying unresolved items
CREATE INDEX "TransaksiItemReturn_resolutionStatus_idx" ON "TransaksiItemReturn"("resolutionStatus");
```

### Rollback Plan

```sql
-- Rollback: Remove new fields
ALTER TABLE "ProductSize" DROP COLUMN "lostQuantity";
ALTER TABLE "TransaksiItemReturn" DROP COLUMN "resolutionStatus";
ALTER TABLE "TransaksiItemReturn" DROP COLUMN "resolutionDate";
ALTER TABLE "TransaksiItemReturn" DROP COLUMN "resolutionNotes";
DROP INDEX "TransaksiItemReturn_resolutionStatus_idx";
```

### Data Migration

**No data migration required** - all new fields have safe defaults:
- `lostQuantity`: defaults to 0 (correct for existing items)
- `resolutionStatus`: defaults to null (correct for existing returns)

## Performance Considerations

### Query Optimization

```typescript
// Efficient query for unresolved lost items
const unresolvedLostItems = await prisma.transaksiItemReturn.findMany({
  where: {
    conditionCategory: 'HILANG',
    resolutionStatus: null,
  },
  include: {
    transaksiItem: {
      include: {
        produk: true,
      },
    },
  },
})
```

**Index Usage**: `resolutionStatus` index ensures fast filtering

### Transaction Scope

**Minimal transaction scope** - only critical operations:
1. Stock update
2. Payment creation (if refund)
3. Status update

**Estimated duration**: < 2s for resolution transaction

### Caching Strategy

**No caching needed** - operations are infrequent and require real-time data

## Security Considerations

### Authorization

```typescript
// Only producers can resolve lost items
if (!user.role.includes('producer')) {
  throw new Error('Unauthorized: Only producers can resolve lost items')
}
```

### Audit Trail

```typescript
// Log all resolution operations
kasirLogger.info('Lost item resolved', {
  returnRecordId,
  resolutionType,
  userId,
  timestamp: new Date(),
  stockChanges: { rentedQuantity, lostQuantity, availableQuantity },
})
```

### Data Validation

```typescript
// Validate resolution type
const validResolutionTypes = ['customer_replaced', 'deposit_kept']
if (!validResolutionTypes.includes(resolutionType)) {
  throw new Error('Invalid resolution type')
}
```

## Monitoring and Observability

### Metrics to Track

1. **Lost Item Rate**: `lostItems / totalReturns`
2. **Resolution Time**: Time from return to resolution
3. **Resolution Type Distribution**: customer_replaced vs deposit_kept
4. **Average Deposit Amount**: Track financial impact
5. **Stock Accuracy**: Verify inventory invariant holds

### Logging Strategy

```typescript
// Log levels
kasirLogger.info('Lost item return processed', { ... })
kasirLogger.warn('Duplicate resolution attempt', { ... })
kasirLogger.error('Resolution transaction failed', { ... })
```

### Alerts

1. **High lost item rate**: Alert if > 5% of returns are HILANG
2. **Unresolved items aging**: Alert if items unresolved > 7 days
3. **Stock invariant violation**: Critical alert if invariant breaks

---

**Design Version**: 1.0  
**Date**: December 7, 2025  
**Status**: Ready for Implementation Planning  
**Complexity**: LOW  
**Estimated Implementation Time**: 4-6 hours
