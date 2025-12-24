# Design Document: Transaction Enhancements

## Overview

This document outlines the technical design for implementing three key enhancements to the transaction system:
1. **Discount System**: Per-transaction discounts (percent or nominal)
2. **Flexible Duration Packages**: 4-day (normal) and 7-day (+50% for out-of-area) packages
3. **Date Calculation Fix**: Correct return date calculation (Pickup Date + Duration - 1)

## Architecture Overview

The enhancements follow the existing layered architecture:
- **Database Layer**: Prisma schema updates for new fields
- **Validation Layer**: Zod schema updates for discount and duration validation
- **Service Layer**: Business logic for price calculations and date handling
- **API Layer**: Route updates for new data handling
- **UI Layer**: Form enhancements for discount input and duration selection

## Database Schema Changes

### Transaksi Table Updates

```sql
-- Add new fields to existing Transaksi table
ALTER TABLE "Transaksi" ADD COLUMN "discountType" TEXT;
ALTER TABLE "Transaksi" ADD COLUMN "discountValue" DECIMAL(10,2);

-- Add check constraints
ALTER TABLE "Transaksi" ADD CONSTRAINT "Transaksi_discountType_check" 
  CHECK ("discountType" IN ('percent', 'nominal'));
```

### Field Specifications

- `discountType`: ENUM ('percent' | 'nominal' | null) - Type of discount applied
- `discountValue`: DECIMAL(10,2) nullable - Discount amount (percentage or nominal value)

**Note**: Duration information is already stored in `TransaksiItem.durasi` field and can be calculated from `Transaksi.tglMulai` and `Transaksi.tglSelesai`. No additional duration field needed at transaction level.

## Data Flow Design

### Price Calculation Flow

```
1. Base Item Price × Quantity = Item Subtotal
2. Duration Multiplier Application:
   - 4 days: multiplier = 1.0
   - 7 days: multiplier = 1.5
3. Item Total = Item Subtotal × Duration Multiplier
4. Transaction Subtotal = Sum of all Item Totals
5. Discount Calculation:
   - Percent: Discount Amount = Subtotal × (discountValue / 100)
   - Nominal: Discount Amount = discountValue
6. Final Total = Subtotal - Discount Amount
```

### Date Calculation Logic

```
Return Date = Pickup Date + (Duration - 1)

Examples:
- 4-day package, pickup on 27th → return on 30th (27 + 4 - 1 = 30)
- 7-day package, pickup on 27th → return on 2nd next month (27 + 7 - 1 = 33 → 2nd)
```

**Implementation Note**: Duration is managed at the TransaksiItem level (existing `durasi` field), and the transaction-level dates (`tglMulai`, `tglSelesai`) are calculated based on the selected duration package.

## Component Design

### 1. Duration Selector Component

**Location**: `PaymentSummaryStep.tsx` (before date selection section)

```typescript
interface DurationSelectorProps {
  selectedDuration: 4 | 7
  onDurationChange: (duration: 4 | 7) => void
}

const DurationSelector: React.FC<DurationSelectorProps> = ({
  selectedDuration,
  onDurationChange
}) => {
  return (
    <RadioGroup value={selectedDuration.toString()} onValueChange={(value) => onDurationChange(Number(value) as 4 | 7)}>
      <div className="flex items-center space-x-3">
        <RadioGroupItem value="4" id="duration-4" />
        <Label htmlFor="duration-4">Paket 4 Hari (Harga Normal)</Label>
      </div>
      <div className="flex items-center space-x-3">
        <RadioGroupItem value="7" id="duration-7" />
        <Label htmlFor="duration-7">Paket 7 Hari (+50% untuk luar kota)</Label>
      </div>
    </RadioGroup>
  )
}
```

### 2. Discount Input Component

**Location**: `PaymentSummaryStep.tsx` (before Notes section, around line 390)

```typescript
interface DiscountSectionProps {
  discountType: 'percent' | 'nominal' | null
  discountValue: number
  subtotal: number
  onDiscountChange: (type: 'percent' | 'nominal' | null, value: number) => void
}

const DiscountSection: React.FC<DiscountSectionProps> = ({
  discountType,
  discountValue,
  subtotal,
  onDiscountChange
}) => {
  const calculateDiscountAmount = () => {
    if (!discountType || !discountValue) return 0
    return discountType === 'percent' 
      ? (subtotal * discountValue) / 100 
      : discountValue
  }

  return (
    <div className="space-y-4">
      <Label>Diskon (Opsional)</Label>
      <RadioGroup value={discountType || 'none'} onValueChange={(value) => {
        if (value === 'none') {
          onDiscountChange(null, 0)
        } else {
          onDiscountChange(value as 'percent' | 'nominal', discountValue)
        }
      }}>
        <div className="flex items-center space-x-3">
          <RadioGroupItem value="none" id="no-discount" />
          <Label htmlFor="no-discount">Tanpa Diskon</Label>
        </div>
        <div className="flex items-center space-x-3">
          <RadioGroupItem value="percent" id="percent-discount" />
          <Label htmlFor="percent-discount">Diskon Persentase (%)</Label>
        </div>
        <div className="flex items-center space-x-3">
          <RadioGroupItem value="nominal" id="nominal-discount" />
          <Label htmlFor="nominal-discount">Diskon Nominal (Rp)</Label>
        </div>
      </RadioGroup>
      
      {discountType && (
        <Input
          type="number"
          placeholder={discountType === 'percent' ? 'Masukkan persentase (0-100)' : 'Masukkan nominal'}
          value={discountValue || ''}
          onChange={(e) => onDiscountChange(discountType, Number(e.target.value))}
          max={discountType === 'percent' ? 100 : subtotal}
          min={0}
        />
      )}
      
      {discountType && discountValue > 0 && (
        <div className="text-sm text-green-600">
          Hemat: {formatCurrency(calculateDiscountAmount())}
        </div>
      )}
    </div>
  )
}
```

## Service Layer Updates

### TransaksiService Enhancements

**File**: `features/kasir/services/transaksiService.ts`

#### Price Calculation Method

```typescript
interface PriceCalculationParams {
  items: Array<{
    product: { pricePerDay: number }
    quantity: number
  }>
  duration: 4 | 7
  discountType?: 'percent' | 'nominal' | null
  discountValue?: number
}

class PriceCalculator {
  static calculateTransactionTotalWithEnhancements(params: PriceCalculationParams) {
    const { items, duration, discountType, discountValue } = params
    
    // Duration multiplier
    const durationMultiplier = duration === 7 ? 1.5 : 1.0
    
    // Calculate item totals with duration
    const itemCalculations = items.map(item => {
      const basePrice = item.product.pricePerDay * item.quantity
      const adjustedPrice = basePrice * durationMultiplier
      return {
        basePrice,
        adjustedPrice,
        quantity: item.quantity,
        duration
      }
    })
    
    // Calculate subtotal
    const subtotal = itemCalculations.reduce((sum, item) => sum + item.adjustedPrice, 0)
    
    // Calculate discount
    let discountAmount = 0
    if (discountType && discountValue && discountValue > 0) {
      if (discountType === 'percent') {
        discountAmount = (subtotal * discountValue) / 100
      } else {
        discountAmount = Math.min(discountValue, subtotal) // Prevent negative totals
      }
    }
    
    // Final total
    const finalTotal = subtotal - discountAmount
    
    return {
      itemCalculations,
      subtotal,
      discountAmount,
      finalTotal,
      duration,
      durationMultiplier
    }
  }
}
```

#### Date Calculation Method

```typescript
class DateCalculator {
  static calculateReturnDate(pickupDate: string, duration: 4 | 7): string {
    const pickup = new Date(pickupDate)
    const returnDate = new Date(pickup)
    
    // Fixed calculation: Return Date = Pickup Date + (Duration - 1)
    returnDate.setDate(returnDate.getDate() + (duration - 1))
    
    return returnDate.toISOString().split('T')[0]
  }
  
  static validateDateRange(pickupDate: string, duration: 4 | 7): boolean {
    const pickup = new Date(pickupDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Pickup date must be today or future
    return pickup >= today
  }
}
```

## Validation Schema Updates

### Zod Schema Enhancements

**File**: `features/kasir/lib/validation/kasirSchema.ts`

```typescript
// Add to existing createTransaksiSchema
export const createTransaksiSchema = z.object({
  // ... existing fields ...
  
  // New fields for discount enhancements
  discountType: z.enum(['percent', 'nominal']).optional().nullable(),
  
  discountValue: z.number()
    .min(0, 'Nilai diskon tidak boleh negatif')
    .optional()
    .nullable(),
    
}).refine((data) => {
  // Validate discount consistency
  if (data.discountType && !data.discountValue) {
    return false
  }
  if (data.discountValue && !data.discountType) {
    return false
  }
  
  // Validate percent discount range
  if (data.discountType === 'percent' && data.discountValue) {
    return data.discountValue >= 0 && data.discountValue <= 100
  }
  
  return true
}, {
  message: 'Data diskon tidak valid',
  path: ['discountValue']
})

// Frontend form validation schema
export const transactionFormSchema = z.object({
  // ... existing fields ...
  
  duration: z.number().refine(val => val === 4 || val === 7).default(4), // Used for UI state only
  discountType: z.enum(['percent', 'nominal']).optional().nullable(),
  discountValue: z.number().min(0).optional().nullable(),
})
```

**Note**: Duration validation remains at the TransaksiItem level where `durasi` field already exists. The form-level duration is used for UI state and calculating `tglSelesai` from `tglMulai`.

## API Layer Updates

### Route Handler Enhancements

**File**: `app/api/kasir/transaksi/route.ts`

```typescript
// POST /api/kasir/transaksi
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate with enhanced schema
    const validatedData = createTransaksiSchema.parse(body)
    
    // Calculate prices with enhancements
    const priceCalculation = PriceCalculator.calculateTransactionTotalWithEnhancements({
      items: validatedData.items,
      duration: validatedData.durasi,
      discountType: validatedData.discountType,
      discountValue: validatedData.discountValue
    })
    
    // Calculate return date
    const returnDate = DateCalculator.calculateReturnDate(
      validatedData.tglMulai, 
      validatedData.durasi
    )
    
    // Create transaction with enhanced data
    const transaksi = await transaksiService.createTransaksiWithEnhancements({
      ...validatedData,
      tglSelesai: returnDate,
      totalHarga: priceCalculation.finalTotal,
      subtotalHarga: priceCalculation.subtotal,
      discountAmount: priceCalculation.discountAmount
    })
    
    return NextResponse.json(transaksi)
  } catch (error) {
    // Error handling
  }
}
```

## State Management

### Form State Structure

```typescript
interface TransactionFormData {
  // ... existing fields ...
  
  // New fields
  duration: 4 | 7
  discountType: 'percent' | 'nominal' | null
  discountValue: number | null
  
  // Calculated fields (derived state)
  subtotal: number
  discountAmount: number
  finalTotal: number
}

// State update handlers
const handleDurationChange = (newDuration: 4 | 7) => {
  const returnDate = DateCalculator.calculateReturnDate(formData.pickupDate, newDuration)
  
  onUpdateFormData({
    duration: newDuration,
    returnDate: returnDate
  })
  
  // Trigger price recalculation
  recalculatePrices()
}

const handleDiscountChange = (type: 'percent' | 'nominal' | null, value: number) => {
  onUpdateFormData({
    discountType: type,
    discountValue: value
  })
  
  // Trigger price recalculation
  recalculatePrices()
}
```

## Error Handling

### Validation Errors

```typescript
const validateDiscount = (type: string, value: number, subtotal: number) => {
  if (type === 'percent' && (value < 0 || value > 100)) {
    throw new Error('Diskon persentase harus antara 0-100%')
  }
  
  if (type === 'nominal' && value > subtotal) {
    throw new Error('Diskon nominal tidak boleh melebihi subtotal')
  }
  
  if (value < 0) {
    throw new Error('Nilai diskon tidak boleh negatif')
  }
}

const validateDuration = (duration: number) => {
  if (![4, 7].includes(duration)) {
    throw new Error('Durasi harus 4 atau 7 hari')
  }
}
```

## Performance Considerations

### Calculation Optimization

1. **Memoized Calculations**: Use React.useMemo for price calculations
2. **Debounced Updates**: Debounce discount input changes to prevent excessive recalculations
3. **Batch State Updates**: Update multiple form fields in single state update

### Database Optimization

1. **Index Creation**: Add indexes on new fields for query performance
2. **Backward Compatibility**: Default values ensure existing data remains valid
3. **Migration Strategy**: Use `npx prisma push` for schema updates

## Testing Strategy

### Unit Tests

1. **Price Calculation Tests**: Test all duration and discount combinations
2. **Date Calculation Tests**: Test edge cases (month boundaries, leap years)
3. **Validation Tests**: Test all validation rules and error cases

### Integration Tests

1. **Form Interaction Tests**: Test UI component interactions
2. **API Endpoint Tests**: Test complete request/response flow
3. **Database Tests**: Test schema changes and data integrity

## Migration Plan

### Phase 1: Database Schema
1. Add new fields to Transaksi table
2. Set default values for existing records
3. Add constraints and indexes

### Phase 2: Backend Updates
1. Update validation schemas
2. Update service layer methods
3. Update API routes

### Phase 3: Frontend Updates
1. Add duration selector component
2. Add discount input component
3. Update price calculation logic
4. Update form state management

### Phase 4: Testing & Deployment
1. Run comprehensive tests
2. Deploy to staging environment
3. User acceptance testing
4. Production deployment

## Backward Compatibility

### Data Migration
- Existing transactions will have `durasi = 4` (default)
- Existing transactions will have `discountType = null` and `discountValue = null`
- All existing functionality remains unchanged

### API Compatibility
- New fields are optional in API requests
- Existing API responses include new fields with default/null values
- No breaking changes to existing endpoints

This design ensures a smooth implementation of the transaction enhancements while maintaining system integrity and user experience.