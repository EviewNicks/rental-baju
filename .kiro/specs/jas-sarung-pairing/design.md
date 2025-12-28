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

## Critical Issue Resolution: Validation System Blocking Non-Jas Products

### Problem Analysis (December 2024)

During manual testing, a critical issue was discovered where the validation system was blocking legitimate non-jas products from being added to cart:

**Error Message**: "Kategori produk tidak diizinkan: anting"

**Root Cause**: The `validateProductData()` function in `sarungValidation.ts` was being called for ALL products (including non-jas products) but only allowed categories eligible for pairing plus 'sarung'.

### Impact Assessment

**Blocked Categories**:
- Accessories Universal: anting, gelang, kalung, bando-besar, bando-kecil
- Clothing Categories: Dress, organic, Organza, gamis-anak, gamis-tanggung, gamis-dewasa
- Accessories Age Based: songket

**Allowed Categories** (Only):
- jas-jaguar, jas-polos, jas-premium, jas-renda, renda, renda-premium, sarung

### Design Flaw Analysis

#### 1. Context Confusion in Validation
```typescript
// PROBLEM: Function designed for pairing validation used for general validation
export function validateProductData(product: Product): ValidationResult {
  // Category validation using pairing-only categories
  const allowedCategories = getAllowedCategories() // Only pairing categories!
  // This blocks all non-pairing categories
}
```

#### 2. Violation of Single Responsibility Principle
The `validateProductData()` function mixed two responsibilities:
- General product data validation (ID, name, price, stock)
- Pairing-specific category validation

#### 3. Backward Compatibility Breach
The pairing system, designed to be **additive**, became **restrictive** to existing functionality.

### Solution Architecture

#### Context-Aware Validation Pattern
```typescript
// SOLUTION: Add context parameter to distinguish validation scenarios
export function validateProductData(
  product: Product, 
  validateCategoryForPairing: boolean = false
): ValidationResult {
  // General validation (always performed)
  validateBasicProductData(product)
  
  // Pairing-specific validation (only when needed)
  if (validateCategoryForPairing) {
    validatePairingCategories(product)
  }
}
```

#### Usage Pattern Update
```typescript
// For general product addition (non-pairing context)
const validation = validateProductData(product, false) // No category restriction

// For pairing operations (pairing context)
const validation = validateProductData(product, true) // Category restriction applied
```

### Implementation Strategy

#### Phase 1: Update Validation Function
1. Add `validateCategoryForPairing` parameter to `validateProductData()`
2. Make category validation conditional based on context
3. Maintain backward compatibility with existing calls

#### Phase 2: Update Function Calls
1. Update `handleAddProduct()` in `ProductSelectionStep.tsx` to use general validation
2. Update `validateSarungSelection()` to use pairing-specific validation
3. Update `validateSarungModalSubmission()` to use pairing-specific validation

#### Phase 3: Testing & Validation
1. Test all product categories can be added to cart normally
2. Test pairing validation still works for jas-sarung operations
3. Verify no regression in existing functionality

### Backward Compatibility Guarantee

**Non-Jas Products**: Must work exactly as before the pairing system implementation
**Jas Products**: Enhanced with pairing functionality while maintaining fallback options
**Existing Transactions**: No impact on historical data or existing workflows

### Quality Assurance

**Validation Requirements**:
- All product categories from `categories.json` must be addable to cart
- Pairing validation must still prevent invalid pairing combinations
- No breaking changes to existing API contracts
- Performance must remain optimal for general product operations

This design update ensures the pairing system enhances functionality without restricting existing capabilities, maintaining the principle of additive enhancement rather than restrictive modification.

## Enhanced Modal with Quantity Distribution (Task 18)

### Problem Analysis
The current modal implementation handles simple 1:1 pairing (1 jas → 1 sarung or no sarung). However, business scenarios often require more flexibility:

**Common Business Case**: User selects 3 jas and wants to distribute sarung in various ways:
- 3 jas with same sarung
- 2 jas with Sarung A, 1 jas with Sarung B  
- 2 jas with sarung, 1 jas without sarung
- 1 jas with sarung, 2 jas without sarung

### Solution Architecture: Enhanced Modal with Quantity Distribution

#### 1. Enhanced Modal State Management
```typescript
interface SarungDistribution {
  sarungSelections: Array<{
    product: Product
    quantity: number
    productSizeId?: string
    selectedSize?: ProductSize
  }>
  totalDistributed: number
  remainingJas: number
}

// Enhanced modal state
const [sarungDistribution, setSarungDistribution] = useState<SarungDistribution>({
  sarungSelections: [],
  totalDistributed: 0,
  remainingJas: jasQuantity
})
```

#### 2. Quantity Distribution UI Flow
```
1. User clicks jas product (quantity: 3)
2. Modal opens showing available sarung products
3. User clicks sarung → quantity selector appears (like existing ProductCard)
4. User selects quantity (max: remaining jas quantity)
5. Selected sarung appears in "Selected Sarung" section with quantity
6. User can select additional sarung types with remaining quantity
7. Distribution preview shows: "2 jas dengan sarung, 1 jas tanpa sarung"
8. User confirms → multiple cart items created
```

#### 3. Enhanced ProductCard Integration
```typescript
// Reuse existing ProductCard with enhanced quantity handling
<ProductCard
  product={sarungProduct}
  onAddToCart={(product, quantity, productSizeId) => {
    handleSarungDistribution(product, quantity, productSizeId)
  }}
  selectedQuantity={getSelectedSarungQuantity(sarungProduct.id)}
  maxQuantity={sarungDistribution.remainingJas} // Dynamic max based on remaining
  onOpenHistory={onOpenHistory}
  context="sarung-modal"
  buttonTextOverride="Pilih"
  showCustomBadge={{
    text: "GRATIS",
    className: "bg-green-500 text-white text-xs px-2 py-1 shadow-md"
  }}
/>
```

#### 4. Distribution Preview Component
```typescript
interface DistributionPreviewProps {
  jasProduct: Product
  jasQuantity: number
  sarungSelections: SarungDistribution['sarungSelections']
  totalDistributed: number
}

// Shows clear breakdown of distribution
function DistributionPreview({ jasProduct, jasQuantity, sarungSelections, totalDistributed }: DistributionPreviewProps) {
  const remainingJas = jasQuantity - totalDistributed
  
  return (
    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
      <h4 className="font-medium text-blue-900 mb-2">Distribusi Sarung:</h4>
      
      {/* Selected sarung breakdown */}
      {sarungSelections.map((selection, index) => (
        <div key={index} className="flex justify-between text-sm text-blue-800">
          <span>{selection.quantity}x {jasProduct.name}</span>
          <span>→ dengan {selection.product.name}</span>
        </div>
      ))}
      
      {/* Remaining jas without sarung */}
      {remainingJas > 0 && (
        <div className="flex justify-between text-sm text-gray-600">
          <span>{remainingJas}x {jasProduct.name}</span>
          <span>→ tanpa sarung</span>
        </div>
      )}
      
      {/* Total summary */}
      <div className="border-t border-blue-200 mt-2 pt-2 font-medium text-blue-900">
        Total: {jasQuantity}x {jasProduct.name}
      </div>
    </div>
  )
}
```

#### 5. Enhanced Confirmation Logic
```typescript
const handleConfirmDistribution = () => {
  const cartAdditions: Array<{
    product: Product
    quantity: number
    productSizeId?: string
    linkedSarung?: ProductSelection['linkedSarung']
  }> = []

  // Add jas with sarung for each sarung selection
  sarungDistribution.sarungSelections.forEach(selection => {
    const linkedSarungData: ProductSelection['linkedSarung'] = {
      productId: selection.product.id,
      productSizeId: selection.productSizeId || '',
      quantity: selection.quantity,
      selectedSize: selection.selectedSize!
    }
    
    cartAdditions.push({
      product: jasProduct,
      quantity: selection.quantity,
      productSizeId: jasProductSizeId,
      linkedSarung: linkedSarungData
    })
  })

  // Add remaining jas without sarung (if any)
  const remainingJas = jasQuantity - sarungDistribution.totalDistributed
  if (remainingJas > 0) {
    cartAdditions.push({
      product: jasProduct,
      quantity: remainingJas,
      productSizeId: jasProductSizeId
      // No linkedSarung = tanpa sarung
    })
  }

  // Process all cart additions
  onConfirmSelection(cartAdditions)
}
```

#### 6. Cart Result Examples
After confirmation, cart will contain separate items:

**Example 1**: 3 jas, user selects 2 Sarung A + 1 Sarung B
- Cart Item 1: "Jas Jaguar + Sarung A (2x)" 
- Cart Item 2: "Jas Jaguar + Sarung B (1x)"

**Example 2**: 3 jas, user selects 2 Sarung A only  
- Cart Item 1: "Jas Jaguar + Sarung A (2x)"
- Cart Item 2: "Jas Jaguar (1x)" // tanpa sarung

**Example 3**: 3 jas, user selects "Tanpa Sarung"
- Cart Item 1: "Jas Jaguar (3x)" // tanpa sarung

### Implementation Benefits

#### 1. **Flexible Business Logic**
- Supports all common business scenarios
- User has full control over sarung distribution
- Clear preview before confirmation

#### 2. **Code Reuse & Maintainability**
- Reuses existing ProductCard component
- Enhances existing modal instead of creating new one
- No duplicate functionality or dead code

#### 3. **Clear User Experience**
- Intuitive quantity selection (same as existing UI)
- Clear distribution preview
- Separate cart items for easy management

#### 4. **Backward Compatibility**
- Existing simple pairing still works (1 jas → 1 sarung)
- Enhanced functionality for complex scenarios
- No breaking changes to existing code

### Technical Implementation Strategy

#### Phase 1: Enhanced Modal State
1. Add `SarungDistribution` interface and state management
2. Update modal to track multiple sarung selections
3. Add distribution preview component

#### Phase 2: Enhanced ProductCard Integration  
1. Update `handleSarungSelection` to support quantity distribution
2. Add dynamic max quantity based on remaining jas
3. Update selected quantity display for multiple selections

#### Phase 3: Enhanced Confirmation Logic
1. Update `handleConfirmDistribution` to process multiple cart additions
2. Update `handleSarungSelection` in ProductSelectionStep to handle arrays
3. Add validation for total quantity limits

#### Phase 4: UI/UX Enhancements
1. Add distribution preview component
2. Update modal layout for better quantity distribution display
3. Add clear visual indicators for selected vs remaining quantities

This enhanced modal approach provides the flexibility needed for complex business scenarios while maintaining code quality and user experience consistency.

This design ensures minimal disruption to existing functionality while providing a robust, user-friendly jas-sarung pairing system that integrates seamlessly with the current kasir workflow.