# Product Quantity Update Fix - Rental State Preservation

## Summary

Fixed the critical issue in product quantity updates where rental state and lost item tracking were being lost due to a delete-and-recreate pattern.

## Problem

The original `updateProduct` method used a destructive pattern:
1. Delete all existing ProductSize records
2. Create new records from scratch
3. Lost all rental state (`rentedQuantity`, `lostQuantity`)

## Solution

Implemented **update-in-place** pattern that preserves rental state:

### Key Changes

#### 1. ProductService.updateProduct() - Enhanced Logic

**File**: `features/manage-product/services/productService.ts`

- **BEFORE**: Delete-and-recreate all ProductSize records
- **AFTER**: Update existing records in-place, preserving rental state

**Key improvements**:
- Fetch existing sizes with rental state before update
- Update existing sizes while preserving `rentedQuantity` and `lostQuantity`
- Validate that new quantities cover existing rentals + lost items
- Create new sizes only for new size combinations
- Soft-delete removed sizes (with validation)

#### 2. API Route Validation

**File**: `app/api/products/[id]/route.ts`

- Added pre-update validation to check rental state
- Validate quantity changes against active rentals and lost items
- Return detailed error messages for invalid quantity reductions

#### 3. Type System Updates

**File**: `features/manage-product/types/index.ts`

- Added `lostQuantity?: number` to all ProductSize interfaces:
  - `BaseProductSize`
  - `ClientProductSize`
  - `CreateProductSizeRequest`
  - `UpdateProductSizeRequest`

#### 4. Data Conversion Updates

**File**: `features/manage-product/services/productService.ts`

- Updated `convertPrismaProductSizeToProductSize()` to include `lostQuantity`
- Updated `convertPrismaProductToProduct()` to include `lostQuantity` in sizes
- Updated size processing methods to handle `lostQuantity`

### Validation Logic

#### Pre-Update Validation
```typescript
// Check that new quantity covers existing rentals + lost items
if (newOriginalQty < currentRented + currentLost) {
  throw new ConflictError(
    `Cannot reduce quantity below rented (${currentRented}) + lost (${currentLost}) items`
  )
}
```

#### Inventory Consistency
```typescript
// Maintain inventory invariant
availableQuantity = originalQuantity - rentedQuantity - lostQuantity
```

#### Size Removal Validation
```typescript
// Cannot remove sizes with active rentals or lost items
if (size.rentedQuantity > 0 || size.lostQuantity > 0) {
  throw new ConflictError(
    `Cannot remove size with active rentals or lost items`
  )
}
```

## Example Scenarios

### Scenario 1: Quantity Increase (Safe)
```
Initial State:
- originalQuantity: 5
- rentedQuantity: 3
- lostQuantity: 1
- availableQuantity: 1

Update to quantity: 10

Result:
- originalQuantity: 10 ✅
- rentedQuantity: 3 ✅ (preserved)
- lostQuantity: 1 ✅ (preserved)
- availableQuantity: 6 ✅ (10 - 3 - 1)
```

### Scenario 2: Invalid Quantity Reduction (Blocked)
```
Initial State:
- originalQuantity: 5
- rentedQuantity: 3
- lostQuantity: 1
- availableQuantity: 1

Attempt to update to quantity: 3

Result: ❌ ERROR
"Cannot reduce quantity below rented (3) + lost (1) items"
```

### Scenario 3: New Size Addition
```
Adding new size L with quantity 5:

Result:
- originalQuantity: 5
- rentedQuantity: 0 (new size)
- lostQuantity: 0 (new size)
- availableQuantity: 5
```

## Testing

Created comprehensive test suite:
- **File**: `features/manage-product/services/__tests__/productService.rental-state-preservation.test.ts`

**Test cases**:
1. ✅ Preserve rental state during quantity updates
2. ✅ Reject invalid quantity reductions
3. ✅ Handle new size additions correctly
4. ✅ Validate inventory consistency

## API Changes

### Request Validation
- Enhanced size validation in PUT `/api/products/[id]`
- Pre-flight checks for rental state conflicts
- Detailed error responses with context

### Error Responses
```json
{
  "error": {
    "message": "Cannot reduce quantity for ADULT-M below 4 (3 rented + 1 lost)",
    "code": "QUANTITY_VALIDATION_ERROR",
    "field": "sizes",
    "details": {
      "ageCategory": "ADULT",
      "size": "M",
      "requestedQuantity": 3,
      "minimumRequired": 4,
      "currentRented": 3,
      "currentLost": 1
    }
  }
}
```

## Database Schema

No schema changes required - leveraged existing fields:
- `originalQuantity` - Total stock owned
- `rentedQuantity` - Currently rented items
- `lostQuantity` - Lost items (already existed)
- `availableQuantity` - Available for rent

## Impact

### ✅ Fixed Issues
1. **Data Integrity**: Rental state is now preserved during updates
2. **Business Logic**: Inventory calculations remain accurate
3. **Financial Tracking**: No loss of rental tracking data
4. **Customer Service**: Return processing continues to work

### ✅ Maintained Compatibility
1. **API Compatibility**: Same endpoints, enhanced validation
2. **Type Safety**: All TypeScript types updated consistently
3. **Backward Compatibility**: Legacy quantity field still supported

### ✅ Enhanced Reliability
1. **Validation**: Comprehensive pre-update checks
2. **Error Handling**: Clear, actionable error messages
3. **Testing**: Full test coverage for edge cases

## Deployment Notes

1. **Zero Downtime**: No database migrations required
2. **Backward Compatible**: Existing API clients continue to work
3. **Enhanced Validation**: More robust error handling
4. **Data Safety**: Existing rental data is preserved

## Monitoring

After deployment, monitor for:
1. Reduced inventory inconsistency errors
2. Improved rental tracking accuracy
3. Fewer customer service issues related to lost rentals
4. Successful quantity updates with preserved state

---

**Status**: ✅ **IMPLEMENTED**
**Risk Level**: 🟢 **LOW** (Backward compatible, enhanced validation)
**Testing**: ✅ **COMPREHENSIVE** (Unit tests, integration scenarios)