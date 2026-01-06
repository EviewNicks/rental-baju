# Status Button Flow Analysis

## Overview
Analysis of button visibility logic in ActionButtonPanel component based on transaction status and conditions.

## Button Visibility Matrix

| Status | Pickup | Return | Cancel | Payment | Lost Item Resolution |
|--------|--------|--------|--------|---------|---------------------|
| `active` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `terlambat` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `diambil` | ✅* | ✅ | ❌ | ✅ | ✅* |
| `pending_resolution` | ❌ | ✅ | ❌ | ✅ | ✅ |
| `selesai` | ❌ | ❌ | ❌ | ✅ | ✅* |
| `cancelled` | ❌ | ❌ | ❌ | ❌ | ❌ |

*Conditional visibility based on additional criteria

## Button Logic Details

### 1. Pickup Button (`canPickup`)
```typescript
const canPickup = (
  transaction.status === 'active' || 
  transaction.status === 'terlambat' ||
  transaction.status === 'diambil'  // Support partial pickups
) && isPickupAvailable(transaction)
```

**Conditions:**
- Status: `active`, `terlambat`, or `diambil`
- Has remaining items to pickup (`quantity > jumlahDiambil`)

**Utility Function:** `isPickupAvailable()`
- Checks if any product has `remainingQuantity > 0`

### 2. Return Button (`canReturn`)
```typescript
const canReturn = (
  transaction.status === 'active' || 
  transaction.status === 'terlambat' || 
  transaction.status === 'diambil' ||
  transaction.status === 'pending_resolution'
) && hasReturnableItemsForActionButton(transaction)
```

**Conditions:**
- Status: `active`, `terlambat`, `diambil`, or `pending_resolution`
- Has returnable items (`jumlahDiambil > totalReturned`)

**Utility Function:** `hasReturnableItemsForActionButton()`
- Calculates `remainingToReturn = jumlahDiambil - totalReturned`
- Returns true if any item has `remainingToReturn > 0`

### 3. Cancel Button (`canCancel`)
```typescript
const canCancel = (
  transaction.status === 'active' || 
  transaction.status === 'terlambat'
) && transaction.products?.every((p) => (p.jumlahDiambil || 0) === 0)
```

**Conditions:**
- Status: `active` or `terlambat` only
- No items picked up yet (`jumlahDiambil === 0` for all items)

### 4. Payment Button (`needsPayment`)
```typescript
const needsPayment = 
  transaction.amountPaid < transaction.totalAmount ||
  (transaction.penalties && transaction.penalties.some((p) => p.status === 'pending'))
```

**Conditions:**
- Outstanding balance (`amountPaid < totalAmount`)
- OR pending penalties exist

### 5. Lost Item Resolution Button (`canResolveLostItems`)
```typescript
const canResolveLostItems = 
  hasUnresolvedLostItems && 
  transaction.status !== 'cancelled'
```

**Conditions:**
- Has unresolved lost items (`kondisiAkhir.includes('hilang')` && `!resolutionStatus`)
- Status is not `cancelled`

## Key Files

### Core Component
- `features/kasir/components/detail/ActionButtonPanel.tsx` - Main button logic

### Utility Functions
- `features/kasir/lib/utils/pickupUtils.ts` - Pickup availability logic
- `features/kasir/lib/utils/partialReturnHelpers.ts` - Return availability logic

### Modal Components
- `features/kasir/components/detail/PickupModal.tsx`
- `features/kasir/components/detail/PaymentModal.tsx`
- `features/kasir/components/detail/CancelModal.tsx`
- `features/kasir/components/detail/LostItemResolutionModal.tsx`

## Status Flow Impact

### Active → Diambil
- **Pickup**: Available until all items picked up
- **Return**: Not available (no items picked up yet)
- **Cancel**: Available if no items picked up

### Diambil → Final States
- **Return**: Available for picked up items
- **Lost Item Resolution**: Available if lost items exist
- **Pickup**: Still available for partial pickups

### Special Cases

#### Partial Operations
- **Partial Pickup**: Button remains visible even with status `diambil`
- **Partial Return**: Button available across multiple return sessions

#### Lost Items
- Triggers `pending_resolution` status
- Enables Lost Item Resolution button
- Return button remains available for other items

## Button Priorities

1. **Primary Actions** (Full width, colored)
   - Pickup (Blue)
   - Return (Green)
   - Lost Item Resolution (Orange)

2. **Secondary Actions** (Outline style)
   - Payment (Blue outline)
   - Cancel (Red outline)

## Error Prevention

- **Concurrent Operations**: Query invalidation after modal close
- **State Consistency**: Real-time status checks
- **Data Refresh**: Automatic transaction data reload
- **Validation**: Pre-action validation in utility functions