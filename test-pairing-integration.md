# Jas-Sarung Pairing Integration Test

## Issue Fixed
The cart was only showing jas products after sarung selection because the `handleSarungSelection` function wasn't properly passing the `linkedSarung` data to the cart.

## Root Cause
1. The `handleSarungSelection` function was trying to modify the product object directly by adding a `linkedSarung` property
2. The `onAddProduct` function signature didn't support the `linkedSarung` parameter
3. The pairing data was lost during the cart addition process

## Solution Implemented
1. **Updated `onAddProduct` function signature** in `TransactionFormPage.tsx`:
   - Added optional `linkedSarung` parameter: `(product, quantity, productSizeId?, linkedSarung?)`
   - Modified `ProductSelection` creation to include `linkedSarung` field

2. **Fixed `handleSarungSelection` function** in `ProductSelectionStep.tsx`:
   - Creates proper `linkedSarung` data structure from selected sarung
   - Passes `linkedSarung` data to `onAddProduct` function
   - Maintains proper typing with `ProductSelection['linkedSarung']`

3. **Updated interface** in `ProductSelectionStep.tsx`:
   - Modified `ProductSelectionStepProps.onAddProduct` to accept `linkedSarung` parameter

4. **Enhanced cart display**:
   - Improved sarung name display in `SarungPairingIndicator`
   - Shows actual sarung size instead of product ID

## Expected Behavior After Fix
1. User selects jas product → SarungSelectionModal opens
2. User selects sarung → Both jas and sarung data are captured
3. `handleSarungSelection` creates `linkedSarung` data structure
4. `onAddProduct` receives both jas product and `linkedSarung` data
5. Cart shows jas with pairing indicator: "Jas Name → dengan Sarung Size"
6. Sarung is marked as "GRATIS" in the cart
7. Both products are properly stored in `selectedProducts` array

## Data Structure
```typescript
// ProductSelection with linkedSarung
{
  product: jasProduct,
  quantity: jasQuantity,
  duration: 4,
  productSizeId?: jasProductSizeId,
  selectedSize?: jasSelectedSize,
  linkedSarung: {
    productId: sarungProduct.id,
    productSizeId: sarungProductSizeId,
    quantity: sarungQuantity,
    selectedSize: sarungSelectedSize
  }
}
```

## Files Modified
1. `features/kasir/components/form/TransactionFormPage.tsx` - Updated `handleAddProduct`
2. `features/kasir/components/form/ProductSelectionStep.tsx` - Fixed `handleSarungSelection` and interface
3. Cart display logic already supported `linkedSarung` via `SarungPairingIndicator`

## Test Verification
To verify the fix works:
1. Select a jas product (should open sarung modal)
2. Select a sarung and quantity
3. Click "Konfirmasi dengan Sarung"
4. Check cart shows both jas and sarung with pairing indicator
5. Verify sarung is marked as "GRATIS"
6. Proceed to payment summary to confirm both items appear

The fix ensures that the pairing relationship is properly maintained throughout the transaction flow.