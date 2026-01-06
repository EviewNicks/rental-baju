# Status Update Flow Analysis

## Overview
Analysis of transaction status updates in the rental system, focusing on the flow from "active" → "diambil" → "pending_resolution"/"selesai" based on pickup and return operations.

## Current Status Distribution
Based on API data from `docs/debug/api-product-list.md`:
- **Active**: 10 transactions (items not yet picked up)
- **Diambil**: 0 transactions (items picked up but not returned)
- **Selesai**: 7 transactions (completed returns)
- **Terlambat**: 8 transactions (overdue)
- **Cancelled**: 0 transactions

## Status Update Flow

### Phase 1: Active → Diambil (Pickup Process)

**Service**: `features/kasir/services/pickupService.ts`
**Method**: `processPickup()`

#### Trigger Conditions
```typescript
// ✅ UPDATED: Status update occurs when ANY pickupable item is picked up
const hasAnyPickup = pickupableItems.some(
  (item) => item.jumlahDiambil > 0,
)

if (hasAnyPickup) {
  await tx.transaksi.update({
    where: { id: transactionId },
    data: { status: 'diambil' },
  })
}
```

#### Key Logic Points
1. **Pairing Awareness**: Filters out paired sarung items since they follow their parent jas
2. **Partial Pickup Support**: Status changes to "diambil" when ANY item is picked up
3. **Atomic Operation**: Status update happens inside database transaction
4. **Stock Deduction**: Stock is deducted when items are actually picked up (not at transaction creation)

#### Status Update Decision Tree
```
Transaction Status: active/terlambat
├── Any pickupable item picked up?
│   ├── YES → Update status to "diambil"
│   └── NO → Maintain current status (active/terlambat)
└── Paired sarung items excluded from calculation
```

### Phase 2: Diambil → Pending_Resolution/Selesai (Return Process)

**Service**: `features/kasir/services/returnService.ts`
**Method**: `processBackgroundActivities()`

#### Trigger Conditions
```typescript
// Check for unresolved HILANG (lost) items
const hasUnresolvedLostItems = request.items.some((item) =>
  item.conditions.some(
    (condition) =>
      condition.conditionCategory === 'HILANG' ||
      condition.kondisiAkhir.toLowerCase().includes('hilang'),
  ),
)

// Check if all items are fully returned
const allItemsFullyReturned = Object.keys(currentRemainingQuantities).length > 0 && 
  Object.values(currentRemainingQuantities).every((qty) => qty === 0)

// Status determination logic
let newStatus
if (hasUnresolvedLostItems) {
  newStatus = 'pending_resolution'
} else if (allItemsFullyReturned) {
  newStatus = 'selesai'
} else {
  newStatus = freshTransaction.status // Maintain current status for partial returns
}
```

#### Status Update Decision Tree
```
Transaction Status: diambil
├── Has unresolved HILANG items?
│   ├── YES → Update status to "pending_resolution"
│   └── NO → Check completion status
│       ├── All items fully returned?
│       │   ├── YES → Update status to "selesai"
│       │   └── NO → Maintain status "diambil" (partial return)
│       └── Continue partial return process
```

#### Key Features
1. **Lost Item Handling**: Transactions with HILANG items go to "pending_resolution"
2. **Partial Return Support**: Status maintained for incomplete returns
3. **Fresh Data Validation**: Re-fetches transaction data to include newly created return records
4. **Concurrent Operation Protection**: Validates against current database state

## Data Consistency Mechanisms

### Pickup Service Protections
1. **Quantity Validation**: Prevents over-pickup beyond available quantities
2. **Concurrent Pickup Prevention**: Validates remaining quantities within transaction
3. **Pairing Validation**: Ensures jas-sarung pairs are handled correctly
4. **Stock Atomicity**: Stock deduction happens inside transaction

### Return Service Protections
1. **Enhanced Validation**: Multi-phase validation with data consistency checks
2. **Database State Validation**: Final validation against current database state within transaction
3. **Referential Integrity**: Validates all referenced entities exist and are active
4. **Concurrent Operation Protection**: Uses database locks to prevent race conditions

## Performance Optimizations

### Pickup Service
- **Cached Data Usage**: Eliminates redundant database queries
- **Batch Operations**: Updates multiple items in parallel
- **Optimized Queries**: Minimal field selection for better performance
- **Transaction Timeout**: 8000ms timeout for safety

### Return Service
- **Pre-validation Pattern**: All validation outside transaction scope
- **Batch Processing**: Parallel execution of database operations
- **Transaction Scoped Operations**: Only critical operations inside transaction
- **Performance Improvement**: 20-32s → <3s processing time

## Activity Logging

### Pickup Activities
```typescript
// Single comprehensive pickup activity
await tx.aktivitasTransaksi.create({
  data: {
    transaksiId: transactionId,
    tipe: 'diambil',
    deskripsi: `Pickup: ${itemsDescription}${catatan ? ` - ${catatan}` : ''}`,
    data: activityData,
    createdBy: this.userId,
  },
})
```

### Return Activities
```typescript
// Session-based return activity format
const sessionDescription = `Return Session ${sessionNumber}: ${itemDescriptions}${penaltyDesc}`

await this.createReturnActivity(transaksiId, {
  tipe: 'dikembalikan',
  deskripsi: sessionDescription,
  data: activityData,
})
```

## Error Handling

### Pickup Service
- **Validation Errors**: Comprehensive error messages with context
- **Database Errors**: Specific error handling for connection/timeout issues
- **Pairing Errors**: Enhanced error handling with pairing context
- **Graceful Degradation**: Non-critical operations don't break main flow

### Return Service
- **Multi-layer Validation**: Pre-validation, transaction validation, post-validation
- **Referential Integrity**: Validates entity existence and active status
- **Data Consistency**: Prevents over-returns and negative quantities
- **Transaction Rollback**: Atomic operations with full rollback on failure

## Status Transition Summary

```
Initial State: active/terlambat (items ordered, payment completed)
     ↓ (pickup process)
Pickup State: diambil (all items picked up by customer)
     ↓ (return process)
Final States:
├── selesai (all items returned, no lost items)
├── pending_resolution (has unresolved lost items)
└── diambil (partial return in progress)
```

## Current System State Analysis

Based on the API data:
- **No transactions in "diambil" status**: This should improve with the new logic that updates status when ANY item is picked up
- **High number of "active" transactions (10)**: With the updated logic, these should transition to "diambil" status more readily once pickup begins
- **Significant "terlambat" count (8)**: These will also transition to "diambil" status when pickup occurs

## Recommendations

1. **Monitor Pickup Flow**: Track time between transaction creation and pickup
2. **Return Processing**: Ensure efficient handling of "diambil" → final status transitions
3. **Lost Item Management**: Implement proactive tracking for "pending_resolution" status
4. **Performance Monitoring**: Continue optimizing return processing times
5. **Status Analytics**: Add dashboard metrics for status distribution trends