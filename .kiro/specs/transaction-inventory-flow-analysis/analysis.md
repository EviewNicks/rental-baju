# Transaction & Return System - Inventory Flow Analysis

## Executive Summary

This document provides a comprehensive analysis of the transaction and return system flow, focusing on how ProductSize quantities (`originalQuantity`, `rentedQuantity`, `availableQuantity`) are managed throughout the transaction lifecycle.

## System Architecture Overview

### Core Components

1. **TransaksiService** - Transaction creation and management
2. **ReturnService** - Return processing and penalty calculation
3. **InventoryService** - Centralized stock management (single source of truth)
4. **KondisiAwalParser** - Size information encoding/decoding

### Database Schema (ProductSize)

```prisma
model ProductSize {
  id                String      @id @default(uuid())
  productId         String
  ageCategory       AgeCategory
  size              SizeEnum
  quantity          Int         // Legacy field (deprecated)
  originalQuantity  Int         @default(0)  // Total stock owned
  rentedQuantity    Int         @default(0)  // Currently rented
  availableQuantity Int         @default(0)  // Available for rent
  isActive          Boolean     @default(true)
  // ... other fields
}
```

### Inventory Equation

**Core Principle:**
```
originalQuantity = rentedQuantity + availableQuantity
```

This equation MUST always hold true for data consistency.

## Transaction Creation Flow

### Entry Point: POST /api/kasir/transaksi

**File:** `app/api/kasir/transaksi/route.ts`

#### Step 1: Request Validation & Authentication

```typescript
// 1. Authentication check
const { userId } = await auth()

// 2. Parse request body
const body = await request.json()

// 3. Detect format (size-aware vs legacy)
const isSizeAwareRequest = body.items?.some(
  (item: { productSizeId?: string }) => item.productSizeId
)
```

#### Step 2: Service Layer Processing

**File:** `features/kasir/services/transaksiService.ts`

**Method:** `createTransaksiSizeAware()`

##### Phase 1: Pre-Validation (OUTSIDE Transaction)

```typescript
// 1. Validate customer exists
const penyewa = await this.prisma.penyewa.findUnique({
  where: { id: data.penyewaId }
})

// 2. Validate kasir if provided
if (data.kasirId) {
  await this.validateKasirExistsAndActive(data.kasirId)
}

// 3. CRITICAL: Pre-validate stock availability
await this.validateStockAvailability(data.items)
```

**Stock Validation Details:**

```typescript
private async validateStockAvailability(items: CreateTransaksiRequest['items']): Promise<void> {
  // 1. Batch fetch all ProductSize records
  const productSizes = await this.prisma.productSize.findMany({
    where: {
      id: { in: uniqueSizeIds },
      isActive: true
    },
    include: { product: true }
  })

  // 2. For each item, check availability using InventoryService
  for (const item of items) {
    const isAvailable = await inventoryService.checkAvailability(
      item.productSizeId, 
      item.jumlah
    )
    
    if (!isAvailable) {
      // Get detailed stock status for error message
      const stockStatus = await inventoryService.getStockStatus(item.productSizeId)
      throw new Error(
        `Insufficient stock. Available: ${stockStatus.availableQuantity}, Requested: ${item.jumlah}`
      )
    }
  }
}
```

##### Phase 2: Price Calculation

```typescript
// Calculate prices using size-specific data
const itemsWithPrices = data.items.map((item) => {
  const productSize = productSizes.find((ps) => ps.id === item.productSizeId)!
  return {
    produkId: item.produkId,
    productSizeId: item.productSizeId,
    jumlah: item.jumlah,
    durasi: 4, // Fixed 4-day package
    hargaSewa: productSize.product.currentPrice
  }
})

priceCalculation = PriceCalculator.calculateTransactionTotal(itemsWithPrices)
```

##### Phase 3: Transaction Creation (INSIDE Transaction)

```typescript
const transaksi = await this.prisma.$transaction(async (tx) => {
  // 1. Create main transaction record
  const createdTransaksi = await tx.transaksi.create({
    data: {
      kode,
      penyewaId: data.penyewaId,
      kasirId: data.kasirId || null,
      status: 'active',
      totalHarga: priceCalculation!.totalHarga,
      // ... other fields
    }
  })

  // 2. Create transaction items (bulk insert)
  const itemsData = data.items.map((item, index) => ({
    transaksiId: createdTransaksi.id,
    produkId: item.produkId,
    jumlah: item.jumlah,
    // IMPORTANT: Encode size info in kondisiAwal
    kondisiAwal: `${item.productSizeId}|${productSize.size}|${productSize.ageCategory}|${item.kondisiAwal || ''}`
    // ... other fields
  }))
  
  await tx.transaksiItem.createMany({ data: itemsData })

  // 3. Update ProductSize quantities
  await this.updateProductSizeQuantities(tx, data.items)

  // 4. Create activity log
  await tx.aktivitasTransaksi.create({ /* ... */ })

  return createdTransaksi
}, { timeout: 30000 })
```

##### Phase 4: Stock Update (Critical Operation)

**File:** `features/kasir/services/inventoryService.ts`

**Method:** `updateStockOnCreate()`

```typescript
async updateStockOnCreate(sizeId: string, quantity: number): Promise<void> {
  // Atomic operation - both fields updated together
  await this.prisma.productSize.update({
    where: { id: sizeId },
    data: {
      rentedQuantity: { increment: quantity },      // +quantity
      availableQuantity: { decrement: quantity }    // -quantity
    }
  })
}
```

**Example:**
```
Before Transaction:
- originalQuantity: 10
- rentedQuantity: 3
- availableQuantity: 7

Rent 2 items:
- originalQuantity: 10 (unchanged)
- rentedQuantity: 5 (3 + 2)
- availableQuantity: 5 (7 - 2)

Equation Check: 10 = 5 + 5 ✓
```

### Transaction Creation Summary

**Flow Diagram:**
```
POST /api/kasir/transaksi
    ↓
[1] Authentication & Validation
    ↓
[2] Pre-validate Stock (OUTSIDE transaction)
    ├─ Batch fetch ProductSize records
    ├─ Check availability via InventoryService
    └─ Throw error if insufficient stock
    ↓
[3] Calculate Prices
    ↓
[4] Database Transaction (INSIDE transaction)
    ├─ Create Transaksi record
    ├─ Create TransaksiItem records (bulk)
    ├─ Update ProductSize quantities (atomic)
    │   ├─ rentedQuantity += quantity
    │   └─ availableQuantity -= quantity
    └─ Create activity log
    ↓
[5] Return success response
```

**Performance Optimizations:**
- Pre-validation outside transaction (prevents timeout)
- Batch operations (reduces DB round trips)
- Atomic stock updates (prevents race conditions)
- Single inventory system (no dual tracking)

## Return Processing Flow

### Entry Point: PUT /api/kasir/transaksi/[kode]/pengembalian

**File:** `app/api/kasir/transaksi/[kode]/pengembalian/route.ts`

#### Step 1: Request Processing

```typescript
// 1. Rate limiting & authentication
const rateLimitResult = await withRateLimit(`return-${clientIP}`, 10, 60000)
const authResult = await requirePermission('transaksi', 'update')

// 2. Parse transaction code/ID
const { kode } = await params
const paramType = TransactionCodeGenerator.detectParameterType(kode)

// 3. Parse and validate request body
const body = await request.json()

// 4. Auto-detect format (legacy vs unified)
if (body.items[0].kondisiAkhir && !body.items[0].conditions) {
  // Legacy format - convert to unified
  validatedData = convertLegacyToUnified(body)
} else {
  // Unified format
  validatedData = body
}
```

#### Step 2: Unified Return Processing

**File:** `features/kasir/services/returnService.ts`

**Method:** `processUnifiedReturn()`

##### Phase 1: Pre-Validation (OUTSIDE Transaction)

```typescript
async validateReturnRequest(
  transaksiId: string,
  request: UnifiedReturnRequest
): Promise<ValidationResult> {
  
  // 1. Single query to get transaction with minimal data
  const transaction = await this.transaksiService.getTransaksiForValidation(transaksiId)

  // 2. Check transaction status eligibility
  if (transaction.status !== 'active' && 
      transaction.status !== 'terlambat' && 
      transaction.status !== 'diambil') {
    return { isValid: false, error: 'Invalid status' }
  }

  // 3. Check if there are unreturned items
  const hasUnreturnedItems = transaction.items.some(
    item => item.jumlahDiambil > 0 && item.statusKembali !== 'lengkap'
  )

  // 4. Batch fetch product and size data
  const [products, productSizes] = await Promise.all([
    this.prisma.product.findMany({ where: { id: { in: productIds } } }),
    this.prisma.productSize.findMany({ where: { id: { in: productSizeIds } } })
  ])

  // 5. Validate each return item
  for (const returnItem of request.items) {
    // Validate quantities
    // Validate conditions
    // Check total return quantity
  }

  return { isValid: true, transaction, products, productSizes }
}
```

##### Phase 2: Penalty Calculation (OUTSIDE Transaction)

```typescript
async calculateBasicPenalties(
  transaksiId: string,
  request: UnifiedReturnRequest,
  actualReturnDate: Date,
  cachedTransaction?: TransaksiForValidation
): Promise<PenaltyCalculationResult> {
  
  // Use cached transaction from validation phase
  const transaction = cachedTransaction || 
    await this.transaksiService.getTransaksiForPenaltyCalculation(transaksiId)

  // Check for manual pricing or HILANG conditions
  const hasManualPricing = request.items.some(/* ... */)
  const hasHilangConditions = request.items.some(/* ... */)

  if (hasManualPricing && !hasHilangConditions) {
    // Enhanced penalty calculation
    return PenaltyCalculator.calculateEnhancedTransactionPenalties(/* ... */)
  } else {
    // Standard penalty calculation
    return PenaltyCalculator.calculateTransactionPenalties(/* ... */)
  }
}
```

##### Phase 3: Return Transaction (INSIDE Transaction)

```typescript
const result = await this.prisma.$transaction(async (tx) => {
  const processedItems = []
  const returnRecords = []
  const itemUpdates = []
  const sizeUpdates = new Map<string, number>()

  // 1. Prepare all operations (collections defined outside)
  for (const item of request.items) {
    // Calculate penalties
    // Prepare return records
    // Prepare item updates
    // Prepare size updates
    
    // Parse kondisiAwal to get productSizeId
    const parsedKondisi = parseKondisiAwal(transactionItem.kondisiAwal)
    if (parsedKondisi?.productSizeId && !parsedKondisi.isLegacyFormat) {
      const currentSizeStock = sizeUpdates.get(parsedKondisi.productSizeId) || 0
      sizeUpdates.set(parsedKondisi.productSizeId, currentSizeStock + totalReturned)
    }
  }

  // 2. Execute batch operations in parallel
  await Promise.all([
    // Create return records
    tx.transaksiItemReturn.createMany({ data: returnRecords }),
    
    // Update transaction items
    Promise.all(itemUpdates.map(update => 
      tx.transaksiItem.update({ where: { id: update.id }, data: update })
    ))
  ])

  return { success: true, processedItems, /* ... */ }
}, { timeout: 15000 })
```

##### Phase 4: Stock Restoration (OUTSIDE Transaction)

```typescript
// Update stock using InventoryService after transaction completion
if (sizeUpdates.size > 0) {
  await Promise.all(
    Array.from(sizeUpdates.entries()).map(async ([sizeId, quantity]) => {
      await inventoryService.updateStockOnReturn(sizeId, quantity)
    })
  )
}
```

**InventoryService Method:**

```typescript
async updateStockOnReturn(sizeId: string, quantity: number): Promise<void> {
  // Atomic operation - both fields updated together
  await this.prisma.productSize.update({
    where: { id: sizeId },
    data: {
      rentedQuantity: { decrement: quantity },      // -quantity
      availableQuantity: { increment: quantity }    // +quantity
    }
  })
}
```

**Example:**
```
Before Return:
- originalQuantity: 10
- rentedQuantity: 5
- availableQuantity: 5

Return 2 items:
- originalQuantity: 10 (unchanged)
- rentedQuantity: 3 (5 - 2)
- availableQuantity: 7 (5 + 2)

Equation Check: 10 = 3 + 7 ✓
```

##### Phase 5: Post-Processing (Background)

```typescript
// Moved to background using setImmediate
setImmediate(async () => {
  // Update transaction status to 'selesai'
  await this.transaksiService.updateTransaksiStatus(transaksiId, {
    status: 'selesai',
    tglKembali: request.tglKembali || new Date().toISOString()
  })

  // Create return activity
  await this.createReturnActivity(/* ... */)

  // Create penalty activity if applicable
  if (penaltyCalculation.totalPenalty > 0) {
    await this.createReturnActivity(/* ... */)
  }
})
```

### Return Processing Summary

**Flow Diagram:**
```
PUT /api/kasir/transaksi/[kode]/pengembalian
    ↓
[1] Authentication & Rate Limiting
    ↓
[2] Format Detection & Conversion
    ├─ Legacy format → Unified format
    └─ Unified format → Direct processing
    ↓
[3] Pre-Validation (OUTSIDE transaction)
    ├─ Validate transaction status
    ├─ Batch fetch product/size data
    ├─ Validate return quantities
    └─ Cache data for next phases
    ↓
[4] Penalty Calculation (OUTSIDE transaction)
    ├─ Use cached transaction data
    ├─ Calculate penalties per condition
    └─ Return penalty breakdown
    ↓
[5] Database Transaction (INSIDE transaction)
    ├─ Prepare all operations
    ├─ Create return records (bulk)
    ├─ Update transaction items (parallel)
    └─ Collect size updates
    ↓
[6] Stock Restoration (OUTSIDE transaction)
    ├─ For each size update:
    │   ├─ rentedQuantity -= quantity
    │   └─ availableQuantity += quantity
    └─ Atomic operations via InventoryService
    ↓
[7] Background Post-Processing
    ├─ Update transaction status
    ├─ Create activity logs
    └─ Non-blocking operations
    ↓
[8] Return success response
```

**Performance Optimizations:**
- Pre-validation with data caching (20-32s → <3s)
- Minimal transaction scope (4-6 operations)
- Batch operations (reduces DB round trips)
- Background post-processing (non-blocking)
- Atomic stock updates (prevents race conditions)

## KondisiAwal Encoding System

### Purpose
Encode ProductSize information in TransaksiItem.kondisiAwal field for size-aware tracking.

### Format
```
productSizeId|size|ageCategory|condition
```

### Example
```
85a7a3b8-4e13-45bf-b413-ff24ffdf1af9|M|ADULT|baik
```

### Parsing

**File:** `features/kasir/lib/utils/kondisiAwalParser.ts`

```typescript
export function parseKondisiAwal(kondisiAwal?: string | null): ParsedKondisiAwal {
  if (!kondisiAwal) {
    return { isLegacyFormat: true }
  }

  const parts = kondisiAwal.split('|')

  // New format: productSizeId|size|ageCategory|condition
  if (parts.length >= 4 && isValidUUID(parts[0])) {
    return {
      productSizeId: parts[0],
      size: parts[1],
      ageCategory: parts[2],
      condition: parts.slice(3).join('|'),
      isLegacyFormat: false
    }
  }

  // Legacy format: plain text condition
  return {
    condition: kondisiAwal,
    isLegacyFormat: true
  }
}
```

### Usage in Return Processing

```typescript
// Extract productSizeId from kondisiAwal
const parsedKondisi = parseKondisiAwal(transactionItem.kondisiAwal)

if (parsedKondisi?.productSizeId && !parsedKondisi.isLegacyFormat) {
  // Size-aware return processing
  await inventoryService.updateStockOnReturn(
    parsedKondisi.productSizeId, 
    quantity
  )
}
```

## Data Consistency & Validation

### InventoryService Consistency Check

```typescript
async validateConsistency(sizeId: string): Promise<ConsistencyValidation> {
  const productSize = await this.prisma.productSize.findUnique({
    where: { id: sizeId },
    select: {
      originalQuantity: true,
      availableQuantity: true,
      rentedQuantity: true
    }
  })

  const calculatedTotal = availableQuantity + rentedQuantity
  const difference = originalQuantity - calculatedTotal

  return {
    isConsistent: difference === 0,
    originalQuantity,
    calculatedTotal,
    difference
  }
}
```

### Batch Validation

```typescript
async validateBatchConsistency(sizeIds: string[]): Promise<ConsistencyValidation[]> {
  const results = await Promise.all(
    sizeIds.map(sizeId => this.validateConsistency(sizeId))
  )

  const inconsistentCount = results.filter(r => !r.isConsistent).length
  
  if (inconsistentCount > 0) {
    console.warn('Batch consistency validation completed with issues', {
      totalSizes: sizeIds.length,
      inconsistentCount
    })
  }

  return results
}
```

## Key Design Principles

### 1. Single Source of Truth
- **InventoryService** is the ONLY service that modifies ProductSize quantities
- All stock operations go through InventoryService methods
- Prevents inconsistencies from multiple update paths

### 2. Atomic Operations
- Stock updates use Prisma's `increment`/`decrement` operators
- Both `rentedQuantity` and `availableQuantity` updated in single operation
- Prevents race conditions in concurrent transactions

### 3. Pre-Validation Pattern
- Validate stock availability BEFORE starting transaction
- Reduces transaction scope and prevents timeouts
- Improves performance (20-32s → <3s for returns)

### 4. Batch Operations
- Fetch all required data in single/parallel queries
- Bulk insert/update operations where possible
- Reduces database round trips

### 5. Background Processing
- Non-critical operations (activity logs) moved to background
- Uses `setImmediate()` for async processing
- Improves response time for API endpoints

### 6. Error Handling
- Detailed error messages with stock status
- Graceful degradation for non-critical failures
- Comprehensive logging for debugging

## Performance Metrics

### Transaction Creation
- **Pre-optimization:** 5-10s
- **Post-optimization:** <2s
- **Key improvement:** Pre-validation outside transaction

### Return Processing
- **Pre-optimization:** 20-32s
- **Post-optimization:** <3s
- **Key improvements:**
  - Pre-validation with data caching
  - Minimal transaction scope (4-6 operations)
  - Background post-processing

### Stock Validation
- **Single check:** <100ms
- **Batch check (10 items):** <500ms
- **Key improvement:** Parallel queries

## Common Scenarios

### Scenario 1: Create Transaction (Rent 3 items)

```
Initial State:
ProductSize A: original=10, rented=2, available=8
ProductSize B: original=5, rented=1, available=4

Transaction: Rent 2 of A, 1 of B

After Transaction:
ProductSize A: original=10, rented=4, available=6
ProductSize B: original=5, rented=2, available=3

Validation:
A: 10 = 4 + 6 ✓
B: 5 = 2 + 3 ✓
```

### Scenario 2: Return All Items

```
Initial State:
ProductSize A: original=10, rented=4, available=6
ProductSize B: original=5, rented=2, available=3

Return: 2 of A, 1 of B

After Return:
ProductSize A: original=10, rented=2, available=8
ProductSize B: original=5, rented=1, available=4

Validation:
A: 10 = 2 + 8 ✓
B: 5 = 1 + 4 ✓
```

### Scenario 3: Partial Return with Lost Item

```
Initial State:
ProductSize A: original=10, rented=4, available=6

Return: 1 good, 1 lost (total 2 items)

After Return:
ProductSize A: original=10, rented=2, available=8

Note: Lost items still restore stock (business rule)
Penalty applied separately

Validation:
A: 10 = 2 + 8 ✓
```

## Error Scenarios & Handling

### Insufficient Stock

```typescript
// Pre-validation catches this BEFORE transaction
const isAvailable = await inventoryService.checkAvailability(sizeId, quantity)

if (!isAvailable) {
  const stockStatus = await inventoryService.getStockStatus(sizeId)
  throw new Error(
    `Insufficient stock. Available: ${stockStatus.availableQuantity}, Requested: ${quantity}`
  )
}
```

### Invalid Transaction Status

```typescript
// Return validation checks status
if (transaction.status !== 'active' && 
    transaction.status !== 'terlambat' && 
    transaction.status !== 'diambil') {
  return {
    success: false,
    details: {
      statusCode: 'INVALID_STATUS',
      message: `Transaction status '${transaction.status}' cannot be returned`,
      currentStatus: transaction.status
    }
  }
}
```

### Consistency Violation

```typescript
// Periodic consistency checks
const validation = await inventoryService.validateConsistency(sizeId)

if (!validation.isConsistent) {
  console.warn('Inventory consistency issue detected', {
    sizeId,
    originalQuantity: validation.originalQuantity,
    calculatedTotal: validation.calculatedTotal,
    difference: validation.difference
  })
  
  // Trigger reconciliation process
  await reconcileInventory(sizeId)
}
```

## Monitoring & Observability

### Key Metrics to Track

1. **Stock Consistency Rate**
   - Percentage of ProductSize records with valid equation
   - Target: >99.9%

2. **Transaction Creation Time**
   - Average time to create transaction
   - Target: <2s

3. **Return Processing Time**
   - Average time to process return
   - Target: <3s

4. **Stock Availability Accuracy**
   - False positives (showed available but wasn't)
   - Target: 0%

### Logging Points

```typescript
// Transaction creation
kasirLogger.returnProcess.info('createTransaksiSizeAware', 'Transaction created', {
  transactionId,
  itemCount,
  totalAmount,
  processingTime
})

// Return processing
kasirLogger.returnProcess.info('processUnifiedReturn', 'Return completed', {
  transactionId,
  itemsProcessed,
  totalPenalty,
  processingTime
})

// Stock updates
console.info('Stock updated successfully', {
  sizeId,
  operation: 'create|return',
  quantity,
  newRented,
  newAvailable
})
```

## Recommendations

### 1. Add Consistency Monitoring
- Periodic batch validation of all ProductSize records
- Alert on inconsistencies
- Automated reconciliation process

### 2. Implement Stock Reservation
- Reserve stock during transaction creation
- Release reservation on timeout/cancellation
- Prevents overselling in high-concurrency scenarios

### 3. Add Audit Trail
- Track all stock changes with timestamps
- Link to transaction/return operations
- Enable forensic analysis

### 4. Performance Monitoring
- Track transaction/return processing times
- Alert on performance degradation
- Identify bottlenecks

### 5. Data Migration Strategy
- Migrate legacy transactions to new format
- Backfill kondisiAwal with productSizeId
- Validate data integrity post-migration

## Conclusion

The transaction and return system implements a robust, performant inventory management flow with:

- **Single source of truth** (InventoryService)
- **Atomic operations** (prevents race conditions)
- **Pre-validation pattern** (prevents timeouts)
- **Batch operations** (reduces DB load)
- **Background processing** (improves response time)

The system maintains data consistency through the core equation:
```
originalQuantity = rentedQuantity + availableQuantity
```

All stock operations are atomic and go through InventoryService, ensuring consistency and preventing race conditions in concurrent scenarios.
