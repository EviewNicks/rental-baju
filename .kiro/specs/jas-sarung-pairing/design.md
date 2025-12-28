# Design Document: Jas-Sarung Pairing System

## Architecture Overview

The jas-sarung pairing system extends the existing kasir workflow with minimal schema changes by leveraging the existing ProductSelection interface and transaction structure. The system uses a modal-based approach for sarung selection and integrates seamlessly with the current cart, payment, and receipt systems.

## Technical Architecture

### 1. Data Structure Extensions

#### ProductSelection Interface Extension
```typescript
interface ProductSelection {
  product: Product
  quantity: number
  productSizeId?: string
  selectedSize?: ProductSize
  // NEW: Linked sarung information
  linkedSarung?: {
    productId: string
    productSizeId: string
    quantity: number
    selectedSize: ProductSize
  }
}
```

#### Jas Detection Logic
```typescript
const isJasProduct = (product: Product): boolean => {
  return product.category.toLowerCase().startsWith('jas-')
}

const JAS_CATEGORIES = ['jas-jaguar', 'jas-polos', 'jas-premium', 'jas-renda']
```

#### Sarung Filtering Logic
```typescript
const getSarungProducts = (products: Product[]): Product[] => {
  return products.filter(product => 
    product.category === 'sarung' && 
    product.categoryType === 'accessories_age_based'
  )
}
```

### 2. Component Architecture

#### New Components

**SarungSelectionModal.tsx**
- Modal component for sarung selection using existing ProductCard components
- Reuses ProductCard for consistent UX and ProductHistoryPopup integration
- Displays available sarung products in grid layout
- Handles quantity selection up to jas quantity
- Provides "Tanpa Sarung" option as primary button
- **MODAL CONFLICT RESOLUTION**: Uses independent modal state management to prevent conflicts with ProductHistoryPopup
- **LAYERED MODAL SUPPORT**: Supports ProductHistoryPopup opening within sarung modal without closing the parent modal
- **SHARED HISTORY HANDLER**: Uses the same onOpenHistory prop pattern as main grid for consistent behavior

**SarungPairingIndicator.tsx**
- Visual indicator for jas-sarung pairings in cart
- Shows pairing relationship with "→ dengan Sarung [Name]" format
- Displays sarung as "GRATIS" with crossed-out original price

#### Modified Components

**ProductCard.tsx**
- Add jas detection logic to ProductCard
- Modify "Add to Cart" button behavior for jas products
- Trigger sarung selection modal instead of direct cart addition
- **CONTEXT AWARENESS**: Maintain existing ProductHistoryPopup integration in all contexts
- **DUAL CONTEXT SUPPORT**: Support usage within both main grid and SarungSelectionModal
- **CONSISTENT BEHAVIOR**: Ensure ProductHistoryPopup works identically in both contexts
- Ensure backward compatibility for non-jas products

**ProductSelectionStep.tsx**
- Integrate SarungSelectionModal with independent modal state
- **MODAL STATE SEPARATION**: Handle modal state management without conflicts with ProductHistoryPopup
- **DUAL MODAL SUPPORT**: Support both SarungSelectionModal and ProductHistoryPopup simultaneously
- **SHARED HISTORY INTEGRATION**: Provide shared onOpenHistory handler for both main grid and sarung modal contexts
- Process jas-sarung pairing data from modal selection
- Maintain existing ProductHistoryPopup functionality
- Support both main grid and modal ProductHistoryPopup usage
- Update cart addition logic for pairings
- Add error handling for modal failures

**PaymentSummaryStep.tsx**
- Display jas-sarung pairings with visual indicators
- Show sarung as "GRATIS" in item breakdown
- Exclude sarung prices from total calculations

### 3. Business Logic Implementation

#### Pricing Logic
```typescript
const calculatePairingPrice = (jasItem: ProductSelection): number => {
  // Jas price is charged normally
  const jasPrice = jasItem.product.pricePerDay * jasItem.quantity
  
  // Linked sarung is always free (price = 0)
  const sarungPrice = 0
  
  return jasPrice + sarungPrice
}
```

#### Inventory Management
```typescript
const processJasSarungTransaction = (jasItem: ProductSelection) => {
  // Reduce jas inventory normally
  reduceInventory(jasItem.product.id, jasItem.productSizeId, jasItem.quantity)
  
  // Reduce sarung inventory even though it's free
  if (jasItem.linkedSarung) {
    reduceInventory(
      jasItem.linkedSarung.productId, 
      jasItem.linkedSarung.productSizeId, 
      jasItem.linkedSarung.quantity
    )
  }
}
```

### 4. Receipt System Integration

#### Professional Receipt Enhancement
The existing `professionalReceiptService.ts` will be extended to support the new "Kode Sarung" column:

```typescript
// Updated table column configuration
private readonly TABLE_COLUMNS: TableColumn[] = [
  { header: 'No', width: 12, align: 'center' },
  { header: 'Kode Jas', width: 20, align: 'left' },        // NEW
  { header: 'Kode Sarung', width: 20, align: 'left' },     // NEW
  { header: 'Nama Barang', width: 50, align: 'left' },     // Reduced width
  { header: 'Size', width: 20, align: 'center' },          // Reduced width
  { header: 'Qty', width: 10, align: 'center' },
  { header: '@Harga', width: 18, align: 'right' },         // Reduced width
  { header: 'Total Harga', width: 20, align: 'right' }     // Reduced width
]
```

#### Receipt Data Processing
```typescript
const processReceiptItems = (items: TransactionItem[]): ReceiptRow[] => {
  return items.map((item, index) => {
    const jasCode = isJasProduct(item.product) ? item.product.code : '-'
    const sarungCode = item.linkedSarung ? item.linkedSarung.product.code : '-'
    
    return [
      (index + 1).toString(),           // No
      jasCode,                          // Kode Jas
      sarungCode,                       // Kode Sarung
      item.product.name,                // Nama Barang
      formatSize(item),                 // Size
      item.quantity.toString(),         // Qty
      formatCurrency(item.unitPrice),   // @Harga
      formatCurrency(item.totalPrice)   // Total Harga
    ]
  })
}
```

## Modal Conflict Resolution Strategy

### Problem Analysis
The original concern was about potential conflicts between SarungSelectionModal and ProductHistoryPopup when both modals need to be accessible simultaneously. The user wanted to ensure that opening ProductHistoryPopup from within the sarung selection modal wouldn't close the parent modal or cause UI conflicts.

### Solution Architecture

#### 1. Independent Modal State Management
```typescript
// In ProductSelectionStep.tsx - Separate state for each modal
const [sarungModal, setSarungModal] = useState({
  isOpen: false,
  jasProduct: null,
  jasQuantity: 0,
  jasProductSizeId: undefined
})

const [historyPopup, setHistoryPopup] = useState({
  isOpen: false,
  productSizeId: '',
  productName: '',
  size: '',
  ageCategory: '',
})
```

#### 2. Shared History Handler Pattern
```typescript
// Single handler used by both main grid and sarung modal
const openHistoryPopup = (productSizeId: string, productName: string, size: string, ageCategory: string) => {
  setHistoryPopup({
    isOpen: true,
    productSizeId,
    productName,
    size,
    ageCategory,
  })
}

// Passed to both contexts
<ProductCard onOpenHistory={openHistoryPopup} />
<SarungSelectionModal onOpenHistory={openHistoryPopup} />
```

#### 3. Modal Layering and Z-Index Management
- SarungSelectionModal: z-index 50 (standard modal layer)
- ProductHistoryPopup: z-index 60 (overlay layer, appears above sarung modal)
- Both modals can be open simultaneously without conflicts
- ProductHistoryPopup can be opened from either main grid or sarung modal

#### 4. Component Reusability
- ProductCard component works identically in both main grid and sarung modal
- Same onOpenHistory prop pattern ensures consistent behavior
- No special handling needed for different contexts
- ProductHistoryPopup functionality preserved in all scenarios

### Implementation Benefits
1. **No Modal Conflicts**: Independent state management prevents interference
2. **Consistent UX**: ProductCard behaves identically in all contexts
3. **Layered Modals**: Both modals can be open simultaneously when needed
4. **Code Reuse**: Maximum reuse of existing ProductCard and ProductHistoryPopup components
5. **Maintainable**: Simple, clear separation of concerns

## Implementation Strategy
1. Extend ProductSelection interface with linkedSarung field
2. Create jas detection utility functions
3. Create sarung filtering utility functions
4. Implement basic pairing data structure

### Phase 2: UI Components
1. Create SarungSelectionModal component
2. Create SarungPairingIndicator component
3. Modify ProductCard for jas detection
4. Update ProductSelectionStep with modal integration

### Phase 3: Business Logic Integration
1. Implement pairing pricing logic
2. Update cart management for linked items
3. Integrate with payment summary display
4. Handle inventory management for both items

### Phase 4: Receipt System
1. Update professionalReceiptService table structure
2. Implement receipt data processing for pairings
3. Add pairing indicators to receipt display
4. Test receipt generation with various pairing scenarios

### Phase 5: Error Handling & Validation
1. Implement sarung availability validation
2. Add error handling for modal failures
3. Create fallback mechanisms for pairing failures
4. Add comprehensive error messages

### Phase 6: Configurable Category System (NEW)
1. Create configuration file for eligible categories
2. Implement generic pairing service architecture
3. Replace hardcoded category detection with configurable system
4. Add support for future pairing types (gamis, kebaya, etc.)
5. Ensure easy category management without code changes

## Data Flow

### Jas Product Selection Flow
```
1. User clicks "Add to Cart" on jas product
2. System detects jas category
3. SarungSelectionModal opens with available sarung
4. User selects sarung and quantity (or "Tanpa Sarung")
5. System creates ProductSelection with linkedSarung data
6. Both jas and sarung added to cart with pairing relationship
```

### Cart Management Flow
```
1. Cart displays jas with pairing indicator
2. Sarung shown as "GRATIS" with original price crossed out
3. Removing jas also removes linked sarung
4. Quantity adjustments maintain pairing relationship
```

### Transaction Processing Flow
```
1. Payment summary shows pairing with visual indicators
2. Sarung price excluded from total calculation
3. Transaction created with both jas and sarung items
4. Inventory reduced for both products
5. Receipt generated with separate jas/sarung codes
```

## Error Handling Strategy

### Sarung Availability Errors
- Real-time stock checking during selection
- Graceful degradation when sarung becomes unavailable
- Clear error messages with alternative options

### Modal Failure Handling
- Fallback to direct jas addition without sarung
- Retry mechanisms for modal loading failures
- User-friendly error messages

### Inventory Validation
- Pre-transaction inventory validation
- Atomic transaction processing for both items
- Rollback mechanisms for partial failures

## Performance Considerations

### Minimal Database Impact
- No schema changes required
- Uses existing transaction item structure
- Leverages current inventory management system

### Efficient Data Loading
- Sarung products loaded once and cached
- Modal renders only when needed
- Optimized product filtering queries

### Memory Management
- Modal components unmounted when closed
- Efficient state management for pairing data
- Minimal impact on existing cart performance

## Testing Strategy

### Unit Tests
- Jas detection logic
- Sarung filtering functions
- Pairing price calculations
- Receipt data processing

### Integration Tests
- Modal workflow end-to-end
- Cart management with pairings
- Transaction processing with both items
- Receipt generation accuracy

### User Acceptance Tests
- Complete jas-sarung selection workflow
- Various pairing scenarios (with/without sarung)
- Error handling user experience
- Receipt format validation

## Backward Compatibility

### Existing Functionality
- All current kasir workflows remain unchanged
- Non-jas products work exactly as before
- Existing transaction data structure preserved
- Current receipt format maintained for non-jas items

### Migration Strategy
- No database migrations required
- Feature can be deployed incrementally
- Existing transactions unaffected
- Gradual rollout possible

## Security Considerations

### Input Validation
- Sarung selection validation
- Quantity limits enforcement
- Product category verification
- Price calculation validation

### Data Integrity
- Atomic transaction processing
- Inventory consistency checks
- Pairing relationship validation
- Receipt data accuracy verification

## Monitoring & Analytics

### Key Metrics
- Jas-sarung pairing adoption rate
- Sarung selection patterns
- Error rates in pairing workflow
- Receipt generation success rate

### Logging Strategy
- Pairing selection events
- Modal interaction tracking
- Error occurrence logging
- Performance metrics collection

This design ensures minimal disruption to existing functionality while providing a robust, user-friendly jas-sarung pairing system that integrates seamlessly with the current kasir workflow.