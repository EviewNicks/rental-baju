# Design Document: Return Penalty Integration & Activity Logging Enhancement

## Overview

This design addresses three critical gaps in the return service system:
1. **Activity Logging Duplication** - Currently creates 3 separate activities with redundant information
2. **Penalty Payment Isolation** - Penalties not integrated with dana kasir income tracking
3. **Penalty Visibility Gap** - Product history doesn't display penalty information

The solution implements a unified activity logging system, integrates penalty payments into the financial tracking system, and enhances penalty visibility across all relevant interfaces.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Return Processing Flow                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  UnifiedReturnService.processUnifiedReturn()                │
│  ├─ Validation Phase                                        │
│  ├─ Penalty Calculation Phase                               │
│  └─ Transaction Phase                                        │
│      ├─ Create Return Records                               │
│      ├─ Update Item Status                                  │
│      ├─ Update Stock                                        │
│      ├─ Create Penalty Payment ◄─── NEW                    │
│      └─ Create Unified Activity ◄─── ENHANCED              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Storage Layer                        │
│  ├─ TransaksiItemReturn (condition details)                │
│  ├─ TransaksiItem (penalty totals)                         │
│  ├─ Pembayaran (penalty payment) ◄─── NEW                  │
│  └─ AktivitasTransaksi (unified activity) ◄─── ENHANCED    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Consumption Layer                         │
│  ├─ Dana Kasir Dashboard ◄─── ENHANCED                     │
│  ├─ Product History ◄─── ENHANCED                          │
│  ├─ Transaction Detail                                      │
│  └─ Penalty Reports ◄─── NEW                               │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Diagram

```
SimpleReturnForm
      │
      │ Submit Return
      ▼
API: /api/kasir/transaksi/[kode]/pengembalian
      │
      │ Process Return
      ▼
UnifiedReturnService
      │
      ├──► validateReturnRequest()
      │
      ├──► calculateBasicPenalties()
      │
      └──► $transaction {
            ├──► createReturnRecords()
            ├──► updateItemStatus()
            ├──► updateStock()
            ├──► createPenaltyPayment() ◄─── NEW
            └──► createUnifiedActivity() ◄─── ENHANCED
           }
      │
      ▼
Background Processing
      │
      └──► updateTransaksiStatus()
```

## Components and Interfaces

### 1. Enhanced Return Service

#### Interface: UnifiedActivityData

```typescript
interface UnifiedActivityData {
  summary: {
    totalItems: number
    totalPenalty: number
    totalLatePenalty: number
    totalConditionPenalty: number
    isLateReturn: boolean
    lateDays: number
    returnDate: string
  }
  items: Array<{
    itemId: string
    productCode: string
    productName: string
    sizeInfo: string
    totalItemPenalty: number
    conditions: Array<{
      kondisiAkhir: string
      jumlahKembali: number
      conditionCategory: ConditionCategory
      penaltyAmount: number
      manualPrice?: number
      useManualPricing: boolean
    }>
  }>
  metadata: {
    processingMode: 'unified'
    processingTime: number
    statusChange: {
      from: string
      to: string
    }
  }
}
```


#### Interface: PenaltyPaymentData

```typescript
interface PenaltyPaymentData {
  transaksiId: string
  jumlah: number
  metode: 'penalty'
  catatan: string
  penaltyBreakdown: {
    latePenalty: number
    conditionPenalty: number
    itemPenalties: Array<{
      itemId: string
      productName: string
      sizeInfo: string
      totalPenalty: number
      latePenalty: number
      conditionPenalty: number
      conditions: Array<{
        kondisiAkhir: string
        jumlahKembali: number
        penaltyAmount: number
      }>
    }>
  }
  createdBy: string
}
```

### 2. Enhanced Dana Summary Service

#### Interface: EnhancedIncomeItem

```typescript
interface EnhancedIncomeItem {
  type: 'rental' | 'penalty'
  transaksiKode: string
  customerName: string
  amount: number
  status: string
  kasirId: string
  kasirName: string
  createdAt: Date
  
  // Penalty-specific fields
  penaltyBreakdown?: {
    latePenalty: number
    conditionPenalty: number
    itemCount: number
  }
}
```

### 3. Enhanced Product History Service

#### Interface: ProductHistoryWithPenalty

```typescript
interface ProductHistoryWithPenalty {
  id: string
  transactionCode: string
  customerName: string
  rentalDate: Date
  returnDate: Date | null
  status: string
  quantity: number
  sizeInfo: string
  
  // Penalty information
  penalty?: {
    total: number
    late: number
    condition: number
    breakdown: Array<{
      kondisiAkhir: string
      jumlahKembali: number
      penaltyAmount: number
    }>
  }
}
```

## Data Models

### Database Schema Changes

#### 1. Extend Pembayaran Table

```prisma
model Pembayaran {
  id          String    @id @default(uuid())
  transaksiId String
  jumlah      Decimal   @db.Decimal(10, 2)
  metode      String    // Add 'penalty' as valid value
  referensi   String?
  catatan     String?
  createdBy   String
  createdAt   DateTime  @default(now())
  
  // NEW: Penalty breakdown
  penaltyBreakdown Json?  // Stores detailed penalty information
  
  transaksi   Transaksi @relation(fields: [transaksiId], references: [id], onDelete: Cascade)

  @@index([transaksiId])
  @@index([createdAt])
  @@index([metode, createdAt])  // NEW: For penalty queries
  @@map("pembayaran")
}
```

#### 2. Enhanced AktivitasTransaksi Usage

```prisma
// No schema changes needed, but data structure enhanced
model AktivitasTransaksi {
  id          String    @id @default(uuid())
  transaksiId String
  tipe        String    // 'dikembalikan' for unified activity
  deskripsi   String    // Summary description
  data        Json?     // Enhanced with UnifiedActivityData structure
  createdBy   String
  createdAt   DateTime  @default(now())
  transaksi   Transaksi @relation(fields: [transaksiId], references: [id], onDelete: Cascade)

  @@index([transaksiId])
  @@index([tipe])
  @@index([createdAt])
  @@map("aktivitas_transaksi")
}
```

### Migration Strategy

```sql
-- Add index for penalty payment queries
CREATE INDEX "pembayaran_metode_createdAt_idx" 
ON "pembayaran"("metode", "createdAt");

-- Add penaltyBreakdown column (nullable for backward compatibility)
ALTER TABLE "pembayaran" 
ADD COLUMN "penaltyBreakdown" JSONB;

-- No data migration needed - new structure applies to new records only
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Single Activity Creation
*For any* return processing operation, exactly one activity record of type 'dikembalikan' should be created
**Validates: Requirements 1.1**

### Property 2: Activity Data Completeness
*For any* return activity, the activity.data JSON should contain all required summary fields (totalItems, totalPenalty, totalLatePenalty, totalConditionPenalty, isLateReturn, lateDays, returnDate)
**Validates: Requirements 1.2**

### Property 3: Item Breakdown Completeness
*For any* return with N items, the activity.data.items array should have length N and each item should contain itemId, productCode, productName, sizeInfo, totalItemPenalty, and conditions array
**Validates: Requirements 1.3**

### Property 4: Condition Detail Structure
*For any* condition in any item in the activity data, it should contain kondisiAkhir, jumlahKembali, conditionCategory, penaltyAmount, and useManualPricing fields
**Validates: Requirements 1.4**

### Property 5: Metadata Presence
*For any* return activity, the activity.data.metadata should contain processingMode, processingTime, and statusChange fields
**Validates: Requirements 1.5**

### Property 6: No Duplicate Activities
*For any* return processing operation, there should be zero activity records of type 'penalty_added' or 'status_changed' created
**Validates: Requirements 1.6**

### Property 7: Penalty Payment Creation
*For any* return with totalPenalty > 0, a Pembayaran record with metode='penalty' should be created
**Validates: Requirements 2.1**

### Property 8: Payment Amount Accuracy
*For any* penalty payment record, the payment.jumlah should equal the penaltyCalculation.totalPenalty
**Validates: Requirements 2.2**

### Property 9: Payment Breakdown Structure
*For any* penalty payment record, the penaltyBreakdown JSON should contain latePenalty, conditionPenalty, and itemPenalties array
**Validates: Requirements 2.3**

### Property 10: Zero Penalty No Payment
*For any* return with totalPenalty = 0, no Pembayaran record with metode='penalty' should be created
**Validates: Requirements 2.5**

### Property 11: Transaction Atomicity
*For any* return processing operation, if penalty payment creation fails, all return records should be rolled back
**Validates: Requirements 2.6, 2.7**

### Property 12: Dana Summary Includes Penalties
*For any* date with penalty payments, the totalIncome calculation should include those penalty amounts
**Validates: Requirements 3.1**

### Property 13: Income Calculation Formula
*For any* date range, totalIncome should equal sum(jumlahBayar) + sum(flatLatePenalty) + sum(totalReturnPenalty)
**Validates: Requirements 3.2**

### Property 14: Penalty Income List Inclusion
*For any* date with penalty payments, the income list should contain entries with type='penalty'
**Validates: Requirements 3.3**

### Property 15: Penalty Income Fields
*For any* penalty income entry, it should contain transaksiKode, customerName, amount, and penaltyBreakdown
**Validates: Requirements 3.4**

### Property 16: Net Balance Calculation
*For any* date, netBalance should equal (rentalIncome + penaltyIncome) - expenses
**Validates: Requirements 3.7**

### Property 17: Product History Penalty Inclusion
*For any* product with transactions that have penalties, the history should include penalty data with total, late, and condition amounts
**Validates: Requirements 4.1, 4.2**

### Property 18: Penalty Breakdown in History
*For any* transaction with penalty in product history, the penalty.breakdown array should contain kondisiAkhir, jumlahKembali, and penaltyAmount for each condition
**Validates: Requirements 4.3**

### Property 19: Graceful Null Handling
*For any* transaction without penalty data, querying product history should not throw errors
**Validates: Requirements 4.7**

### Property 20: Backward Compatibility
*For any* old activity record, displaying it should not throw errors and should show available information
**Validates: Requirements 6.2**

### Property 21: Mixed Data Calculation
*For any* date range with both old flatLatePenalty and new penalty payments, dana summary should include both
**Validates: Requirements 6.3**

### Property 22: Activity Creation Performance
*For any* return processing operation, creating the unified activity should complete within 100ms
**Validates: Requirements 7.1**

### Property 23: Performance Regression Limit
*For any* return with penalty, total processing time should not increase by more than 10% compared to returns without penalty
**Validates: Requirements 7.5**

### Property 24: Error Rollback
*For any* return processing operation where penalty calculation fails, the entire transaction should be rolled back
**Validates: Requirements 8.1**

### Property 25: Non-Fatal Activity Logging
*For any* return processing operation where activity logging fails, the return transaction should still complete successfully
**Validates: Requirements 8.3**

### Property 26: Penalty Breakdown Validation
*For any* penalty payment, the penaltyBreakdown JSON structure should be validated before storage
**Validates: Requirements 8.4**

### Property 27: Graceful Degradation
*For any* dana summary calculation failure, the system should return partial data with an error indicator
**Validates: Requirements 8.5**

### Property 28: Corrupted Data Handling
*For any* corrupted penalty data, the system should handle gracefully and display available information without crashing
**Validates: Requirements 8.7**


## Error Handling

### Error Categories

#### 1. Validation Errors (HTTP 400)
- Invalid penalty breakdown structure
- Missing required fields in activity data
- Invalid payment method for penalty

**Handling Strategy:**
- Validate data structure before processing
- Return detailed error messages with field-level information
- Do not persist any data on validation failure

#### 2. Transaction Errors (HTTP 500)
- Database transaction rollback
- Penalty payment creation failure
- Stock update failure

**Handling Strategy:**
- Rollback entire transaction on any critical failure
- Log detailed error information for debugging
- Return generic error message to user with retry option

#### 3. Non-Critical Errors (Warning)
- Activity logging failure
- Background processing failure
- Audit trail creation failure

**Handling Strategy:**
- Log warning but continue processing
- Do not rollback main transaction
- Retry in background if possible

### Error Response Format

```typescript
interface ErrorResponse {
  success: false
  error: {
    message: string
    code: string
    details?: Array<{
      field: string
      message: string
      code: string
    }>
  }
}
```

### Rollback Strategy

```typescript
// Transaction scope ensures atomicity
await prisma.$transaction(async (tx) => {
  // 1. Create return records
  await tx.transaksiItemReturn.createMany(...)
  
  // 2. Update item status
  await tx.transaksiItem.update(...)
  
  // 3. Update stock
  await inventoryService.updateStockOnReturn(...)
  
  // 4. Create penalty payment (if fails, entire transaction rolls back)
  if (totalPenalty > 0) {
    await tx.pembayaran.create(...)
  }
  
  // 5. Create unified activity (if fails, log warning but don't rollback)
  try {
    await tx.aktivitasTransaksi.create(...)
  } catch (error) {
    logger.warn('Activity creation failed', error)
    // Continue - activity is non-critical
  }
})
```

## Testing Strategy

### Unit Testing

**Test Coverage:**
- Activity data structure validation
- Penalty payment data structure validation
- Dana summary calculation logic
- Product history penalty extraction

**Testing Framework:** Jest with Prisma mock

**Example Test:**
```typescript
describe('UnifiedActivityData', () => {
  it('should include all required summary fields', () => {
    const activityData = createUnifiedActivityData(returnResult, penaltyCalc)
    
    expect(activityData.summary).toHaveProperty('totalItems')
    expect(activityData.summary).toHaveProperty('totalPenalty')
    expect(activityData.summary).toHaveProperty('totalLatePenalty')
    expect(activityData.summary).toHaveProperty('totalConditionPenalty')
    expect(activityData.summary).toHaveProperty('isLateReturn')
    expect(activityData.summary).toHaveProperty('lateDays')
    expect(activityData.summary).toHaveProperty('returnDate')
  })
})
```

### Property-Based Testing

**Property Testing Library:** fast-check (JavaScript/TypeScript)

**Configuration:** Minimum 100 iterations per property test

**Test Tags:** Each property test must include comment with format:
```typescript
// Feature: return-penalty-integration, Property 1: Single Activity Creation
```

**Example Property Test:**
```typescript
import fc from 'fast-check'

// Feature: return-penalty-integration, Property 1: Single Activity Creation
describe('Property 1: Single Activity Creation', () => {
  it('should create exactly one activity for any return', async () => {
    await fc.assert(
      fc.asyncProperty(
        returnRequestArbitrary(),
        async (returnRequest) => {
          // Process return
          await returnService.processUnifiedReturn(transaksiId, returnRequest)
          
          // Query activities
          const activities = await prisma.aktivitasTransaksi.findMany({
            where: {
              transaksiId,
              tipe: 'dikembalikan'
            }
          })
          
          // Verify exactly one activity
          expect(activities).toHaveLength(1)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: return-penalty-integration, Property 7: Penalty Payment Creation
describe('Property 7: Penalty Payment Creation', () => {
  it('should create penalty payment for any return with penalty > 0', async () => {
    await fc.assert(
      fc.asyncProperty(
        returnRequestWithPenaltyArbitrary(),
        async (returnRequest) => {
          // Process return
          const result = await returnService.processUnifiedReturn(transaksiId, returnRequest)
          
          // Verify penalty > 0
          expect(result.penalty).toBeGreaterThan(0)
          
          // Query penalty payment
          const payment = await prisma.pembayaran.findFirst({
            where: {
              transaksiId,
              metode: 'penalty'
            }
          })
          
          // Verify payment exists
          expect(payment).not.toBeNull()
          expect(payment!.jumlah.toNumber()).toBe(result.penalty)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: return-penalty-integration, Property 11: Transaction Atomicity
describe('Property 11: Transaction Atomicity', () => {
  it('should rollback all changes if penalty payment fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        returnRequestArbitrary(),
        async (returnRequest) => {
          // Mock payment creation to fail
          jest.spyOn(prisma.pembayaran, 'create').mockRejectedValueOnce(new Error('Payment failed'))
          
          // Attempt to process return
          await expect(
            returnService.processUnifiedReturn(transaksiId, returnRequest)
          ).rejects.toThrow()
          
          // Verify no return records created
          const returnRecords = await prisma.transaksiItemReturn.findMany({
            where: { transaksiItem: { transaksiId } }
          })
          expect(returnRecords).toHaveLength(0)
          
          // Verify no activity created
          const activities = await prisma.aktivitasTransaksi.findMany({
            where: { transaksiId, tipe: 'dikembalikan' }
          })
          expect(activities).toHaveLength(0)
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Integration Testing

**Test Scenarios:**
1. Complete return flow with penalty payment creation
2. Dana summary calculation with penalty income
3. Product history query with penalty data
4. Backward compatibility with old activity format

**Testing Framework:** Playwright for E2E, Jest for API integration

### Performance Testing

**Metrics to Track:**
- Activity creation time (target: < 100ms)
- Total return processing time with penalty (target: < 10% increase)
- Dana summary query time (target: < 500ms)
- Product history query time (target: < 1s)

**Testing Tool:** Artillery or k6 for load testing

## Implementation Notes

### Phase 1: Core Changes (Week 1)

1. **Update returnService.ts**
   - Modify `processBackgroundActivities()` to create unified activity
   - Add `createPenaltyPayment()` method
   - Update activity data structure

2. **Database Migration**
   - Add `penaltyBreakdown` column to Pembayaran
   - Add index on (metode, createdAt)

3. **Update danaSummaryService.ts**
   - Modify `getDailySummary()` to include penalty payments
   - Update `getIncomeList()` to include penalty entries

### Phase 2: UI Updates (Week 2)

4. **Update DanaKasirDashboard.tsx**
   - Display penalty income separately
   - Show penalty breakdown on hover/click

5. **Update ProductHistoryCard.tsx**
   - Add penalty display section
   - Show penalty breakdown

### Phase 3: Testing & Optimization (Week 3)

6. **Write Property Tests**
   - Implement all 28 correctness properties
   - Achieve 100% property test coverage

7. **Performance Optimization**
   - Optimize dana summary queries
   - Add caching where appropriate

### Backward Compatibility Considerations

1. **Old Activity Format**
   - Display component should handle both old and new formats
   - Gracefully degrade if new fields are missing

2. **Old Penalty Data**
   - Dana summary should include both flatLatePenalty and new penalty payments
   - Product history should work with transactions that don't have penalty breakdown

3. **Migration Path**
   - No data migration required
   - New structure applies to new records only
   - Old records remain unchanged

### Security Considerations

1. **Data Validation**
   - Validate penalty breakdown structure before storage
   - Sanitize user input in activity descriptions
   - Prevent JSON injection in penalty breakdown

2. **Access Control**
   - Only kasir and owner can view penalty details
   - Audit trail for penalty modifications
   - Log all penalty-related operations

3. **Data Integrity**
   - Use database transactions for atomicity
   - Validate penalty calculations match stored values
   - Prevent manual manipulation of penalty records

