# Pengembalian (Return) System Flow Analysis

## Overview

This document analyzes the complete flow of the rental return system, from frontend user interaction to backend processing and database updates. The system has been optimized from a complex 1,396-line implementation to a streamlined ~300-line unified architecture with performance improvements from 20-32s to <3s processing time.

## Architecture Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[SimpleReturnForm] --> B[UnifiedConditionForm]
        B --> C[Real-time Penalty Preview]
        C --> D[Form Validation]
    end
    
    subgraph "API Layer"
        D --> E[PUT /api/kasir/transaksi/[kode]/pengembalian]
        E --> F[Request Format Detection]
        F --> G[Legacy/Unified Conversion]
        G --> H[Schema Validation]
    end
    
    subgraph "Service Layer"
        H --> I[UnifiedReturnService]
        I --> J[Pre-validation Phase]
        J --> K[Penalty Calculation]
        K --> L[Transaction Processing]
        L --> M[Post-processing Activities]
    end
    
    subgraph "Database Layer"
        L --> N[Atomic Transaction]
        N --> O[Return Records Creation]
        N --> P[Stock Updates]
        N --> Q[Penalty Payment Creation]
        N --> R[Status Updates]
    end
    
    subgraph "Lost Item Resolution"
        S[Lost Item Detection] --> T[Resolution Options]
        T --> U[Customer Replaced]
        T --> V[Deposit Kept]
        U --> W[Refund + Stock Restore]
        V --> X[Mark as Lost]
    end
```

## Detailed Flow Analysis

### 1. Frontend Layer (SimpleReturnForm.tsx)

#### 1.1 Component Initialization
- **Purpose**: Single-page form for processing rental returns
- **Key Features**:
  - Real-time penalty calculation (0ms latency)
  - Frontend-only preview without API calls
  - Simplified state management with `useState`
  - Support for multi-condition returns

#### 1.2 Data Loading Flow
```typescript
// Transaction data loading
useQuery({
  queryKey: ['transaction-detail', kode],
  queryFn: () => kasirApi.getTransactionByCode(kode)
})

// Initialize item conditions for returnable items
const returnableItems = transaction.items.filter(
  (item) => item.jumlahDiambil > 0 && item.statusKembali !== 'lengkap'
)
```

#### 1.3 Real-time Penalty Calculation
```typescript
const calculatePenaltyPreview = useCallback(() => {
  // Local calculation using existing condition data
  let totalPenalty = 0
  
  Object.entries(formState.itemConditions).forEach(([itemId, condition]) => {
    condition.conditions.forEach((c) => {
      // BAIK category: 0 penalty
      // Other categories: manualPrice × quantity
      const effectivePrice = c.conditionCategory === 'BAIK' ? 0 : c.manualPrice || 0
      const quantity = c.jumlahKembali || 0
      itemPenalty += effectivePrice * quantity
    })
  })
  
  // Late return calculation (flat 20k per item)
  if (isLateReturn) {
    totalPenalty += flatLatePenalty * returnableItemsCount
  }
}, [transaction, formState.itemConditions])
```

#### 1.4 Form Submission
```typescript
const apiRequest = {
  items: Object.entries(formState.itemConditions).map(([itemId, condition]) => ({
    itemId,
    conditions: condition.conditions.map((c) => ({
      kondisiAkhir: c.kondisiAkhir,
      jumlahKembali: c.jumlahKembali,
      conditionCategory: c.conditionCategory,
      useManualPricing: c.useManualPricing,
      manualPrice: c.manualPrice,
    })),
  })),
  catatan: formState.catatan || undefined,
  tglKembali: new Date().toISOString(),
}
```

### 2. API Layer (route.ts)

#### 2.1 Request Processing Pipeline
```typescript
export async function PUT(request: NextRequest, { params }: RouteParams) {
  // 1. Rate limiting and authentication
  const rateLimitResult = await withRateLimit(`return-${clientIP}`, 10, 60000)
  const authResult = await requirePermission('transaksi', 'update')
  
  // 2. Parameter validation
  const paramType = TransactionCodeGenerator.detectParameterType(kode)
  
  // 3. Format detection and conversion
  if (isLegacyFormat) {
    validatedData = convertLegacyToUnified(legacyBody)
  } else {
    validatedData = body as UnifiedReturnRequest
  }
  
  // 4. Schema validation
  validatedData = unifiedReturnRequestSchema.parse(validatedData)
  
  // 5. Service processing
  const result = await unifiedReturnService.processUnifiedReturn(transaksiId, validatedData)
}
```

#### 2.2 Error Handling Strategy
```typescript
// Structured error responses with proper HTTP codes
if (statusCode === 'ALREADY_RETURNED') {
  return NextResponse.json({ /* 409 Conflict */ }, { status: 409 })
}
if (statusCode === 'VALIDATION_ERROR') {
  return NextResponse.json({ /* 400 Bad Request */ }, { status: 400 })
}
```

### 3. Service Layer (UnifiedReturnService)

#### 3.1 Pre-validation Pattern
The service uses a three-phase approach to optimize performance:

**Phase 1: Pre-validation (Outside Transaction)**
```typescript
private async validateReturnRequest(
  transaksiId: string,
  request: UnifiedReturnRequest,
): Promise<ValidationResult> {
  // Single query to get transaction and related data
  const transaction = await this.transaksiService.getTransaksiForValidation(transaksiId)
  
  // Batch fetch all required data in parallel
  const [products, productSizes] = await Promise.all([
    this.prisma.product.findMany({ where: { id: { in: productIds } } }),
    this.prisma.productSize.findMany({ where: { id: { in: productSizeIds } } })
  ])
  
  // Validate transaction status, items, and quantities
  // Return cached data for use in transaction phase
}
```

**Phase 2: Transaction Processing (Atomic Operations)**
```typescript
const result = await this.prisma.$transaction(async (tx) => {
  // 1. Create return records
  await tx.transaksiItemReturn.createMany({ data: returnRecords })
  
  // 2. Update transaction items
  await Promise.all(itemUpdates.map(update => 
    tx.transaksiItem.update({ where: { id: update.id }, data: update })
  ))
  
  // 3. Update stock atomically (CRITICAL FIX)
  if (sizeUpdates.size > 0) {
    const txInventoryService = createInventoryService(tx)
    await Promise.all(Array.from(sizeUpdates.entries()).map(([sizeId, quantity]) =>
      txInventoryService.updateStockOnReturn(sizeId, quantity)
    ))
  }
  
  // 4. Create penalty payment record
  if (penaltyCalculation.totalPenalty > 0) {
    await tx.pembayaran.create({ data: penaltyPaymentData })
  }
}, { timeout: 30000 })
```

**Phase 3: Post-processing (Background Activities)**
```typescript
private async processBackgroundActivities(): Promise<void> {
  // 1. Determine transaction status based on lost items
  const hasUnresolvedLostItems = request.items.some(item =>
    item.conditions.some(condition => 
      condition.conditionCategory === 'HILANG'
    )
  )
  const newStatus = hasUnresolvedLostItems ? 'pending_resolution' : 'selesai'
  
  // 2. Update transaction status
  await this.transaksiService.updateTransaksiStatus(transaksiId, { status: newStatus })
  
  // 3. Create unified activity record
  await this.createReturnActivity(transaksiId, activityData)
}
```

#### 3.2 Penalty Calculation Logic

**Condition-based Penalties:**
```typescript
const getConditionPenalty = (condition: any) => {
  // BAIK: No penalty
  if (condition.conditionCategory === 'BAIK') {
    return 0
  }
  
  // All other categories: manualPrice × quantity
  const manualPrice = condition.manualPrice || 0
  const quantity = condition.jumlahKembali || 0
  return manualPrice * quantity
}
```

**Late Return Penalties:**
```typescript
// Flat 20,000 IDR penalty per item for late returns
const latePenaltyResult = PenaltyCalculator.calculateFlatLatePenalty(dueDate, actualDate)
if (latePenaltyResult.isLate) {
  totalPenalty += 20000 * returnableItemsCount
}
```

#### 3.3 Stock Management Strategy

**Non-HILANG Items (Immediate Stock Update):**
```typescript
// Only count non-HILANG items for immediate stock update
const nonHilangReturned = item.conditions
  .filter((c) => c.conditionCategory !== 'HILANG')
  .reduce((sum, c) => sum + c.jumlahKembali, 0)

if (nonHilangReturned > 0) {
  // rentedQuantity--, availableQuantity++
  await txInventoryService.updateStockOnReturn(sizeId, nonHilangReturned)
}
```

**HILANG Items (Deferred Stock Update):**
```typescript
// HILANG items skip stock update until resolution
// Stock remains in 'rented' state until manual resolution
```

### 4. Lost Item Resolution Flow

#### 4.1 Resolution Options

**Option 1: Customer Replaced**
```typescript
if (request.resolutionType === 'customer_replaced') {
  // 1. Create refund payment (negative amount)
  await tx.pembayaran.create({
    data: {
      jumlah: new Decimal(-refundAmount),
      metode: 'refund',
      catatan: `Refund dana jaminan barang hilang - Customer beli sendiri`
    }
  })
  
  // 2. Create expense record for tracking
  await tx.pengeluaranKasir.create({
    data: {
      kasirId: request.kasirId,
      harga: new Decimal(refundAmount),
      kategori: 'Refund Dana Jaminan'
    }
  })
  
  // 3. Restore stock (rentedQuantity--, availableQuantity++)
  await txInventoryService.updateStockOnReturn(sizeId, 1)
}
```

**Option 2: Deposit Kept**
```typescript
if (request.resolutionType === 'deposit_kept') {
  // Mark as lost (rentedQuantity--, lostQuantity++)
  await tx.productSize.update({
    where: { id: sizeId },
    data: {
      rentedQuantity: { decrement: 1 },
      lostQuantity: { increment: 1 }
    }
  })
}
```

#### 4.2 Resolution Status Management
```typescript
// Update resolution status
await tx.transaksiItemReturn.update({
  where: { id: request.returnRecordId },
  data: {
    resolutionStatus: resolutionType === 'customer_replaced' 
      ? 'resolved_replaced' 
      : 'resolved_lost',
    resolutionDate: new Date(),
    resolutionNotes: request.notes
  }
})

// Check if all lost items are resolved
const unresolvedLostItems = await this.prisma.transaksiItemReturn.count({
  where: {
    transaksiItem: { transaksiId: request.transaksiId },
    conditionCategory: 'HILANG',
    resolutionStatus: null
  }
})

// Update transaction status to 'selesai' if all resolved
if (unresolvedLostItems === 0) {
  await this.transaksiService.updateTransaksiStatus(request.transaksiId, {
    status: 'selesai'
  })
}
```

## Performance Optimizations

### 1. Database Query Optimization
- **Before**: 5-6 separate database queries for validation
- **After**: 1-2 batch queries with parallel execution
- **Result**: Reduced validation time by ~70%

### 2. Transaction Scope Minimization
- **Before**: Long-running transactions with validation inside
- **After**: Pre-validation outside, only critical operations inside
- **Result**: Transaction time reduced from 20-32s to <3s

### 3. Stock Update Atomicity
- **Critical Fix**: Moved stock updates inside transaction
- **Benefit**: Prevents data inconsistency between return records and inventory
- **Trade-off**: Slightly longer transaction time for data integrity

### 4. Frontend Penalty Preview
- **Before**: API calls for penalty calculation preview
- **After**: Frontend-only calculation with 0ms latency
- **Result**: Immediate user feedback without network dependency

## Data Flow Summary

### 1. Normal Return Flow
```
User Input → Form Validation → API Request → Service Validation → 
Transaction Processing → Stock Updates → Penalty Payment → 
Status Update → Activity Logging → Response
```

### 2. Lost Item Flow
```
Return Processing → HILANG Detection → Status: pending_resolution → 
Manual Resolution → Stock Update/Refund → Status: selesai
```

### 3. Error Handling Flow
```
Validation Error → Structured Response (400) →
Already Returned → Idempotent Response (409) →
Processing Error → Rollback → Error Response (500)
```

## Key Interfaces and Data Structures

### UnifiedReturnRequest
```typescript
interface UnifiedReturnRequest {
  items: Array<{
    itemId: string
    conditions: Array<{
      kondisiAkhir: string
      jumlahKembali: number
      conditionCategory?: ConditionCategory
      manualPrice?: number
      useManualPricing?: boolean
    }>
  }>
  catatan?: string
  tglKembali?: string
}
```

### UnifiedReturnProcessingResult
```typescript
interface UnifiedReturnProcessingResult {
  success: boolean
  transactionId: string
  returnedAt: Date
  penalty: number
  processedItems: Array<{
    itemId: string
    penalty: number
    kondisiAkhir: string
    statusKembali: 'lengkap'
    conditionBreakdown?: Array<{
      kondisiAkhir: string
      jumlahKembali: number
      penaltyAmount: number
    }>
  }>
  processingMode: 'unified'
}
```

## Critical Business Rules

### 1. Stock Management Rules
- **BAIK/RUSAK/KOTOR**: Immediate stock return (rentedQuantity--, availableQuantity++)
- **HILANG**: Deferred stock update until manual resolution
- **Atomic Updates**: All stock changes must be within database transaction

### 2. Penalty Calculation Rules
- **BAIK**: No penalty (0 IDR)
- **Other Conditions**: manualPrice × quantity
- **Late Return**: Flat 20,000 IDR per item
- **Total**: Condition penalties + Late penalties

### 3. Status Transition Rules
- **Normal Return**: active/terlambat/diambil → selesai
- **With Lost Items**: active/terlambat/diambil → pending_resolution → selesai
- **Invalid Status**: Cannot process returns from 'selesai', 'dibatalkan', etc.

### 4. Lost Item Resolution Rules
- **Customer Replaced**: Refund deposit + Create expense + Restore stock
- **Deposit Kept**: Keep deposit + Mark as lost in inventory
- **Auto-completion**: Transaction status → 'selesai' when all lost items resolved

## Monitoring and Logging

### 1. Performance Metrics
- Validation time tracking
- Transaction processing time
- Total request processing time
- Database query performance

### 2. Business Metrics
- Return success/failure rates
- Penalty amounts and breakdowns
- Lost item resolution statistics
- Stock update accuracy

### 3. Error Tracking
- Validation failures with detailed reasons
- Transaction rollback causes
- Stock update failures
- Activity logging failures (non-critical)

## Future Enhancements

### 1. Potential Optimizations
- Implement caching for frequently accessed transaction data
- Add batch processing for multiple returns
- Optimize penalty calculation algorithms
- Implement async activity logging

### 2. Feature Extensions
- Support for partial returns
- Advanced penalty calculation rules
- Integration with external inventory systems
- Real-time notifications for lost item resolutions

### 3. Monitoring Improvements
- Add performance dashboards
- Implement alerting for critical failures
- Enhanced audit trails
- Business intelligence reporting

---

*This document provides a comprehensive analysis of the rental return system flow, covering all aspects from frontend user interaction to backend data processing and business rule enforcement.*