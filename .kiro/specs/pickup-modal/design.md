# Design Document

## Overview

This design addresses critical performance and UX issues in the pickup modal workflow. The solution focuses on four main areas:

1. **Race Condition Resolution**: Simplify conflicting useEffect hooks and remove unnecessary cache resets
2. **Activity Log Enhancement**: Enrich activity data with product details, size information, and user names
3. **Performance Optimization**: Implement optimistic updates and efficient cache management
4. **Partial Pickup Support (CRITICAL)**: Fix status transition logic to support multiple pickup visits

The design maintains backward compatibility while significantly improving user experience through faster modal closure (from 3-5s to 1.5s), clearer activity descriptions, and proper support for partial pickups.

### Critical Bug Fix: Partial Pickup

**Current Issue:** When a customer picks up only some items, the transaction status incorrectly changes to "diambil", causing the pickup button to disappear even though items remain.

**Root Cause:** Status transition logic in `pickupService.ts` checks if ANY items are fully picked up instead of checking if ALL items are fully picked up.

**Solution:** Correct the status transition logic to only set status to "diambil" when every single item has `jumlahDiambil >= jumlah`.

## Architecture

### Component Structure

```
PickupModal (React Component)
├── State Management (React hooks)
├── usePickupProcess (TanStack Query mutation)
│   ├── onMutate (Optimistic updates)
│   ├── onSuccess (Cache invalidation)
│   └── onError (Rollback)
└── UI States
    ├── Selection State
    ├── Confirmation State
    └── Success State

PickupService (Backend)
├── validatePickupRequest()
├── processPickup()
│   ├── Update TransaksiItem
│   ├── Create Activity Log (Enhanced)
│   └── Update Transaction Status
└── getPickupSummary()

ActivityTimeline (React Component)
├── PickupActivityDisplay (Enhanced)
│   ├── Product Details Parser
│   ├── Size Information Display
│   └── User Name Display
└── Activity Deduplication
```

### Data Flow

```
User Action → PickupModal
  ↓
Optimistic Update (UI)
  ↓
API Call → PickupService
  ↓
Database Transaction
  ├── Update jumlahDiambil
  ├── Create Enhanced Activity Log
  └── Update Status (if complete)
  ↓
API Response
  ↓
Cache Invalidation
  ↓
UI Update (Server Data)
  ↓
Modal Close (1.5s delay)
```

## Components and Interfaces

### PickupModal Component

**State Management:**
```typescript
interface PickupModalState {
  pickupItems: PickupItemState[]
  showSuccess: boolean
  showConfirmation: boolean
  pickupNote: string
  isSyncingCache: boolean
}
```

**Key Changes:**
- Remove conflicting useEffect for 10-second timeout
- Simplify success handling to single useEffect
- Remove reset() call from handleClose
- Maintain isSyncingCache for preventing premature closure

### PickupService Enhancement

**Enhanced Activity Data Structure:**
```typescript
interface EnhancedActivityData {
  items: Array<{
    itemId: string
    jumlahDiambil: number
    productName: string      // NEW
    productCode: string      // NEW
    kondisiAwal: string      // NEW
  }>
  processedBy: string
  processedByName: string    // NEW
  timestamp: string
  catatan?: string
}
```

**Database Queries:**
- Fetch TransaksiItem with product join
- Fetch Transaksi with kasir join
- Include kondisiAwal field in queries

### ActivityTimeline Component

**PickupActivityDisplay Enhancement:**
```typescript
interface ParsedKondisiAwal {
  sizeId: string
  size: string
  ageCategory: string
  condition: string
}

function parseKondisiAwal(kondisiAwal: string): ParsedKondisiAwal
```

**Display Format:**
```
Item Diambil
Oleh: [Kasir Name]

Detail Pengambilan:
• [Product Name] ([Size] - [Age Category]) - [Quantity] unit diambil
• [Product Name] ([Size] - [Age Category]) - [Quantity] unit diambil

Catatan: [Optional Note]
```

## Data Models

### Activity Log Data Structure

**Current (Before):**
```json
{
  "items": [
    {
      "itemId": "uuid",
      "jumlahDiambil": 2
    }
  ],
  "processedBy": "user_id",
  "timestamp": "ISO-8601"
}
```

**Enhanced (After):**
```json
{
  "items": [
    {
      "itemId": "uuid",
      "jumlahDiambil": 2,
      "productName": "Dress Pesta Merah",
      "productCode": "PRD01",
      "kondisiAwal": "uuid|XL|ADULT|baik"
    }
  ],
  "processedBy": "user_id",
  "processedByName": "Adelia",
  "timestamp": "ISO-8601",
  "catatan": "Optional note"
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework

1.1 WHEN a pickup operation completes successfully, THE Pickup Modal SHALL close within 2 seconds
Thoughts: This is a timing requirement that applies to all successful pickup operations. We can test this by measuring the time between success state and modal close across different pickup scenarios.
Testable: yes - property

1.2 WHEN the modal is closing, THE System SHALL NOT trigger unnecessary cache resets
Thoughts: This is about verifying that reset() is not called during modal close. We can test this by mocking the reset function and verifying it's never called.
Testable: yes - property

1.3 WHEN multiple useEffect hooks monitor the same state, THE System SHALL prevent race conditions
Thoughts: This is about code structure and preventing conflicting timeouts. We can verify by checking that only one useEffect handles success state.
Testable: yes - example

2.1 WHEN a pickup activity is logged, THE System SHALL include the product name for each item
Thoughts: This applies to all pickup activities. We can generate random pickup data and verify that all activity logs contain product names.
Testable: yes - property

2.2 WHEN a pickup activity is logged, THE System SHALL parse and display size information from kondisiAwal
Thoughts: This is about parsing logic that should work for all valid kondisiAwal formats. We can test with various kondisiAwal strings.
Testable: yes - property

3.1 WHEN a pickup is processed, THE System SHALL store the kasir name in activity data
Thoughts: This applies to all pickups. We can verify that processedByName field is always populated when kasir data exists.
Testable: yes - property

3.3 WHEN kasir information is unavailable, THE System SHALL fall back to displaying the user ID
Thoughts: This is an edge case for when kasir lookup fails. We should test this specific scenario.
Testable: yes - edge-case

4.1 WHEN generating pickup descriptions, THE System SHALL include product names instead of generic labels
Thoughts: This applies to all pickup descriptions. We can verify that descriptions never contain just "item" without product names.
Testable: yes - property

5.1 WHEN all items are fully picked up, THE System SHALL NOT create separate status_pickup activity log
Thoughts: This is about verifying absence of unwanted logs. We can check activity count after full pickup.
Testable: yes - property

6.1 WHEN the modal closes, THE System SHALL NOT call reset() on the mutation hook
Thoughts: This is verifying that a specific function is not called. We can mock and verify.
Testable: yes - property

6.4 WHEN optimistic updates are applied, THE System SHALL rollback on error
Thoughts: This is a critical error handling property. For any optimistic update followed by an error, the cache should return to previous state.
Testable: yes - property

7.1 WHEN a pickup operation fails, THE System SHALL display specific error messages based on error type
Thoughts: This applies to all error types. We can test that each error type produces a unique, helpful message.
Testable: yes - property

8.2 WHEN optimistic updates are applied, THE System SHALL update jumlahDiambil values in cache
Thoughts: This is about immediate cache updates. For any pickup request, the cache should reflect the change before server response.
Testable: yes - property

9.1 WHEN a customer picks up only some items, THE System SHALL keep the pickup button available
Thoughts: This is about button visibility logic. For any transaction with remaining items, the pickup button should be visible regardless of status.
Testable: yes - property

9.2 WHEN calculating transaction status, THE System SHALL set status to "diambil" ONLY when ALL items are fully picked up
Thoughts: This is the core status transition logic. We can test with various combinations of picked/unpicked items.
Testable: yes - property

10.1 WHEN checking if all items are picked up, THE System SHALL verify that EVERY product has jumlahDiambil equal to jumlah
Thoughts: This is about the correctness of the "all picked up" check. We need to verify it checks quantities, not just product count.
Testable: yes - property

11.1 WHEN a pickup exceeds remaining quantity, THE System SHALL reject the operation
Thoughts: This is validation logic that should apply to all pickup requests. We can test with various invalid quantities.
Testable: yes - property

### Property Reflection

After reviewing all properties, the following consolidations are identified:

- Properties 1.1 and 1.2 are related but test different aspects (timing vs. function calls) - keep both
- Properties 2.1 and 2.2 both validate activity data but test different fields - keep both
- Properties 5.1 and 6.1 both verify absence of unwanted behavior - keep both as they test different concerns
- Property 6.4 and 8.2 are related to optimistic updates but test different phases - keep both

No redundant properties identified. Each property provides unique validation value.

### Correctness Properties

Property 1: Modal closure timing
*For any* successful pickup operation, the time between success state and modal close should be between 1.5 and 2.5 seconds
**Validates: Requirements 1.1, 1.4**

Property 2: No unnecessary cache resets
*For any* modal close operation, the reset() function should not be invoked
**Validates: Requirements 1.2, 6.1**

Property 3: Activity data completeness
*For any* pickup activity log, all items should include productName, productCode, and kondisiAwal fields
**Validates: Requirements 2.1, 2.2, 2.3**

Property 4: Size information parsing
*For any* valid kondisiAwal string in format "id|size|age|condition", parsing should extract all four components correctly
**Validates: Requirements 2.2, 2.3**

Property 5: User attribution
*For any* pickup operation where kasir data exists, the activity log should contain processedByName field with kasir nama
**Validates: Requirements 3.1, 3.2, 3.4**

Property 6: Description clarity
*For any* pickup activity description, it should contain at least one product name and not use generic "item" labels alone
**Validates: Requirements 4.1, 4.2, 4.5**

Property 7: Activity log minimalism
*For any* pickup operation, the number of activity logs created should be exactly 1 (the "diambil" log)
**Validates: Requirements 5.1, 5.2, 5.3**

Property 8: Optimistic update rollback
*For any* pickup operation that fails after optimistic update, the cache state should match the pre-mutation snapshot
**Validates: Requirements 6.4, 8.4**

Property 9: Error message specificity
*For any* pickup error, the error message should be specific to the error type and not use generic "error occurred" messages
**Validates: Requirements 7.1, 7.2, 7.3**

Property 10: Optimistic cache updates
*For any* pickup request with items, the cache should immediately reflect updated jumlahDiambil values before server response
**Validates: Requirements 8.1, 8.2**

Property 11: Partial pickup button availability
*For any* transaction with at least one item having jumlahDiambil < jumlah, the pickup button should be visible regardless of transaction status being 'active', 'terlambat', or 'diambil'
**Validates: Requirements 9.1, 9.4**

Property 12: Status transition correctness
*For any* transaction, status should be set to 'diambil' if and only if ALL items satisfy jumlahDiambil >= jumlah
**Validates: Requirements 9.2, 10.1, 10.2**

Property 13: Quantity validation
*For any* pickup request, if any item's requested jumlahDiambil exceeds (jumlah - current jumlahDiambil), the operation should be rejected with a specific error
**Validates: Requirements 11.4**

## Error Handling

### Error Categories

1. **Network Errors**: Connection timeouts, network unavailable
   - Display: "Koneksi bermasalah. Silakan cek koneksi internet Anda."
   - Action: Retry button

2. **Database Errors**: Connection errors, transaction failures
   - Display: "Database sedang sibuk. Silakan coba lagi beberapa saat."
   - Action: Retry button, auto-retry with exponential backoff

3. **Conflict Errors**: Data modified by another process
   - Display: "Item mungkin telah diambil oleh proses lain. Silakan refresh dan coba lagi."
   - Action: Refresh page button

4. **Validation Errors**: Invalid pickup quantities, business rule violations
   - Display: Specific validation message from backend
   - Action: Fix input and retry

5. **Permission Errors**: User lacks authorization
   - Display: "Anda tidak memiliki izin untuk melakukan pickup pada transaksi ini."
   - Action: Contact administrator

### Error Recovery Flow

```
Error Occurs
  ↓
Classify Error Type
  ↓
Rollback Optimistic Updates (if any)
  ↓
Display Specific Error Message
  ↓
Provide Recovery Actions
  ├── Retry (for transient errors)
  ├── Refresh (for conflict errors)
  └── Cancel (for validation/permission errors)
```

## Testing Strategy

### Unit Testing

**PickupModal Component:**
- Test state transitions (selection → confirmation → success)
- Test handleClose does not call reset()
- Test success state auto-closes after 1.5s
- Test error display and recovery actions
- Mock usePickupProcess hook

**PickupService:**
- Test activity data includes product details
- Test kasir name lookup and fallback
- Test description generation with product names
- Test single activity log creation
- Mock Prisma client

**ActivityTimeline:**
- Test kondisiAwal parsing with various formats
- Test display of product name and size
- Test user name display with fallback
- Test activity deduplication
- Mock activity data

### Integration Testing

**Pickup Flow:**
- Test complete pickup from modal open to close
- Verify cache updates correctly
- Verify activity log appears in timeline
- Test error scenarios with rollback

**Cache Management:**
- Test optimistic updates apply immediately
- Test cache invalidation after success
- Test rollback on error
- Test no unnecessary refetches

### Property-Based Testing

Using **fast-check** library for TypeScript:

**Property Tests:**
1. Modal timing property (1.5-2.5s closure)
2. Activity data completeness property
3. kondisiAwal parsing property
4. Description clarity property
5. Optimistic update rollback property

**Configuration:**
- Minimum 100 iterations per property test
- Use realistic data generators for TransaksiItem, Kasir, etc.
- Test edge cases: empty strings, missing fields, null values

**Test Tagging:**
Each property test must include a comment:
```typescript
// Feature: pickup-modal, Property 3: Activity data completeness
```

### Manual Testing Checklist

- [ ] Pickup modal opens and displays items correctly
- [ ] Selecting items updates quantities
- [ ] Confirmation shows correct summary
- [ ] Success message appears for 1.5s
- [ ] Modal closes smoothly without delay
- [ ] Activity timeline shows detailed pickup info
- [ ] Product names and sizes display correctly
- [ ] Kasir name appears (not user ID)
- [ ] Error messages are clear and actionable
- [ ] Retry/refresh buttons work correctly
- [ ] Optimistic updates feel instant
- [ ] Cache rollback works on error

## Performance Considerations

### Before Optimization

- Modal close time: 3-5 seconds
- Multiple conflicting timeouts
- Unnecessary cache resets on close
- Generic activity descriptions
- User IDs instead of names

### After Optimization

- Modal close time: 1.5 seconds (67% improvement)
- Single coordinated timeout
- No cache resets on close
- Detailed activity descriptions with product info
- Human-readable kasir names

### Metrics to Monitor

- Average modal close time
- Cache invalidation count per pickup
- Activity log size and detail level
- User satisfaction with pickup flow
- Error rate and recovery success rate

## Implementation Notes

### Critical Changes

1. **Remove conflicting useEffect** in PickupModal (lines ~70-80)
2. **Simplify success handling** to single useEffect (lines ~82-98)
3. **Remove reset() call** from handleClose (line ~67)
4. **Enhance activity data** in pickupService.processPickup (lines ~120-150)
5. **Add product details** to activity log creation (lines ~140-160)
6. **Remove unwanted logs** (status_pickup, status_changed) (lines ~160-180)
7. **Update ActivityTimeline** with parseKondisiAwal helper
8. **Add optimistic updates** to usePickupProcess (optional)
9. **🔴 FIX CRITICAL BUG: Correct status transition logic** in pickupService.processPickup (lines ~140-160)
10. **🔴 FIX CRITICAL BUG: Update button visibility logic** in ActionButtonPanel.tsx to include 'diambil' status

### Critical Bug Fix Details

#### Issue: Partial Pickup Status Transition

**Current Buggy Code (pickupService.ts ~line 140):**
```typescript
// ❌ WRONG: This checks if ANY items are fully picked up
if (pickupStats.fullyPickedUp === pickupStats.totalItems && pickupStats.notPickedUp === 0) {
  await tx.transaksi.update({
    where: { id: transactionId },
    data: { status: 'diambil' },
  })
}
```

**Problem:** `pickupStats.totalItems` is the COUNT of products, not total quantity. If you have:
- Product A: 2 items, 2 picked up (fully picked)
- Product B: 2 items, 0 picked up (not picked)

Then: `fullyPickedUp = 1`, `totalItems = 2`, `notPickedUp = 1`
Condition is FALSE, but it should be FALSE because not all QUANTITIES are picked up!

**Correct Fix:**
```typescript
// ✅ CORRECT: Check if ALL quantities are picked up
const allItemsPickedUp = allTransactionItems.every(item => 
  item.jumlahDiambil >= item.jumlah
)

if (allItemsPickedUp) {
  await tx.transaksi.update({
    where: { id: transactionId },
    data: { status: 'diambil' },
  })
}
```

#### Issue: Button Visibility Logic

**Current Code (ActionButtonPanel.tsx ~line 72):**
```typescript
// ❌ WRONG: Excludes 'diambil' status
const canPickup = (transaction.status === 'active' || transaction.status === 'terlambat') && isPickupAvailable(transaction)
```

**Correct Fix:**
```typescript
// ✅ CORRECT: Include 'diambil' status for partial pickups
const canPickup = (
  transaction.status === 'active' || 
  transaction.status === 'terlambat' || 
  transaction.status === 'diambil'
) && isPickupAvailable(transaction)
```

**Rationale:** Even if status is 'diambil', there might still be items with remaining quantities. The `isPickupAvailable()` function already checks for remaining items, so we just need to allow the status.

### Backward Compatibility

- Existing activity logs without product details will still display
- Fallback to user ID if kasir name unavailable
- Graceful handling of missing kondisiAwal data
- No database schema changes required

### Future Enhancements

- Real-time activity updates via WebSocket
- Bulk pickup operations
- Pickup history analytics
- Mobile-optimized pickup interface
