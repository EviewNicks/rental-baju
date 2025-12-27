# Tasks Document: Jas-Sarung Pairing System Implementation

## Implementation Phases

### Phase 1: Core Infrastructure & Types (Tasks 1-3)

#### Task 1: Extend Type Definitions
**File:** `features/kasir/types/index.ts`
**Priority:** High
**Estimated Time:** 30 minutes

**Subtasks:**
1.1. Add linkedSarung field to ProductSelection interface
1.2. Create LinkedSarung type definition
1.3. Add jas detection utility types
1.4. Update existing type exports

**Acceptance Criteria:**
- ProductSelection interface includes optional linkedSarung field
- LinkedSarung type matches design specification
- TypeScript compilation passes without errors
- All existing type usage remains compatible

**Implementation Details:**
```typescript
interface LinkedSarung {
  productId: string
  productSizeId: string
  quantity: number
  selectedSize: ProductSize
}

interface ProductSelection {
  // ... existing fields
  linkedSarung?: LinkedSarung
}
```

#### Task 2: Create Utility Functions
**File:** `features/kasir/lib/utils/jasSarungUtils.ts` (new file)
**Priority:** High
**Estimated Time:** 45 minutes

**Subtasks:**
2.1. Create jas detection functions
2.2. Create sarung filtering functions
2.3. Create pairing validation functions
2.4. Add comprehensive unit tests

**Acceptance Criteria:**
- isJasProduct function correctly identifies jas categories
- getSarungProducts function filters sarung products properly
- Validation functions prevent invalid pairings
- All functions have 100% test coverage

**Implementation Details:**
```typescript
export const isJasProduct = (product: Product): boolean => {
  return product.category.toLowerCase().startsWith('jas-')
}

export const JAS_CATEGORIES = ['jas-jaguar', 'jas-polos', 'jas-premium', 'jas-renda']

export const getSarungProducts = (products: Product[]): Product[] => {
  return products.filter(product => 
    product.category === 'sarung' && 
    product.categoryType === 'accessories_age_based'
  )
}
```

#### Task 3: Update Price Calculator
**File:** `features/kasir/lib/utils/priceCalculator.ts`
**Priority:** High
**Estimated Time:** 30 minutes

**Subtasks:**
3.1. Add pairing-aware price calculation
3.2. Ensure sarung prices are excluded from totals
3.3. Update existing calculation methods
3.4. Add unit tests for pairing scenarios

**Acceptance Criteria:**
- Linked sarung prices are always 0 in calculations
- Jas prices calculated normally
- Existing price calculations remain unchanged
- All edge cases handled properly

### Phase 2: UI Components (Tasks 4-7)

#### Task 4: Create SarungSelectionModal Component
**File:** `features/kasir/components/ui/SarungSelectionModal.tsx` (new file)
**Priority:** High
**Estimated Time:** 1.5 hours

**Subtasks:**
4.1. Create modal component structure using existing Dialog components
4.2. Implement sarung product display using existing ProductCard components
4.3. Add "Tanpa Sarung" option as primary button
4.4. **MODAL STATE INDEPENDENCE**: Implement modal state management completely independent of ProductHistoryPopup
4.5. **SHARED HISTORY INTEGRATION**: Pass through onOpenHistory prop to ProductCard for seamless history integration
4.6. **Z-INDEX LAYERING**: Ensure proper z-index layering (sarung modal: z-50, history popup: z-60)
4.7. Add loading and error states
4.8. Style with existing design system for consistency

**Acceptance Criteria:**
- Modal displays available sarung products using ProductCard components
- **DUAL MODAL SUPPORT**: ProductHistoryPopup works within modal without conflicts or closing parent modal
- "Tanpa Sarung" option always available as primary action
- Modal can be closed without selection
- **LAYERED MODAL ARCHITECTURE**: Independent modal state prevents UI conflicts and supports simultaneous modals
- Responsive design works on all screen sizes
- Follows existing UI patterns and styling
- **CONSISTENT BEHAVIOR**: Reuses existing ProductCard for identical UX in both main grid and modal contexts

**Implementation Details:**
```typescript
interface SarungSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectSarung: (sarung: Product | null, quantity: number, productSizeId?: string) => void
  jasProduct: Product
  jasQuantity: number
  availableSarung: Product[]
  onOpenHistory: (productSizeId: string, productName: string, size: string, ageCategory: string) => void
}

// Modal uses existing ProductCard components in grid layout
// ProductHistoryPopup integration handled through shared onOpenHistory prop
// Independent modal state management prevents conflicts
// Z-index: 50 (allows ProductHistoryPopup at z-60 to appear above)
```

#### Task 5: Create SarungPairingIndicator Component
**File:** `features/kasir/components/ui/SarungPairingIndicator.tsx` (new file)
**Priority:** Medium
**Estimated Time:** 45 minutes

**Subtasks:**
5.1. Create pairing display component
5.2. Implement "→ dengan Sarung [Name]" format
5.3. Add "GRATIS" price display with strikethrough
5.4. Style for cart and payment summary contexts

**Acceptance Criteria:**
- Clear visual indication of jas-sarung pairing
- Sarung shown as free with original price crossed out
- Consistent styling across different contexts
- Accessible design with proper ARIA labels

#### Task 6: Modify ProductCard Component
**File:** `features/kasir/components/ui/product-card.tsx`
**Priority:** High
**Estimated Time:** 45 minutes

**Subtasks:**
6.1. Add jas detection logic to ProductCard
6.2. Modify "Add to Cart" button behavior for jas products
6.3. Update button text for jas products to indicate sarung selection
6.4. Ensure backward compatibility for non-jas products
6.5. **CONTEXT AGNOSTIC DESIGN**: Maintain existing ProductHistoryPopup integration in all contexts
6.6. **DUAL CONTEXT SUPPORT**: Support usage within both main grid and SarungSelectionModal without special handling
6.7. **CONSISTENT BEHAVIOR**: Ensure ProductHistoryPopup works identically in both contexts
6.8. Add proper TypeScript types

**Acceptance Criteria:**
- Jas products trigger sarung selection modal instead of direct cart addition
- Button text indicates sarung selection for jas products ("Pilih dengan Sarung")
- Non-jas products work exactly as before
- **UNIVERSAL HISTORY ACCESS**: ProductHistoryPopup functionality preserved in all contexts (main grid and sarung modal)
- **SEAMLESS INTEGRATION**: Works correctly both in main grid and within SarungSelectionModal
- **NO CONTEXT AWARENESS NEEDED**: Component doesn't need to know which context it's in
- No breaking changes to existing functionality
- TypeScript compilation passes

**Implementation Details:**
```typescript
// In ProductCard component
const handleAddToCart = () => {
  if (isJasProduct(product)) {
    onTriggerSarungSelection(product, quantity, selectedSize?.id)
  } else {
    onAddToCart(product, quantity, selectedSize?.id)
  }
}

// Button text changes based on product type
const buttonText = isJasProduct(product) 
  ? `Pilih ${quantity > 0 ? quantity : ''} dengan Sarung`
  : `Tambah ${quantity > 0 ? quantity : ''} ke Keranjang`

// ProductHistoryPopup integration remains unchanged
// Works identically in main grid and sarung modal contexts
```

#### Task 7: Update ProductSelectionStep Component
**File:** `features/kasir/components/form/ProductSelectionStep.tsx`
**Priority:** High
**Estimated Time:** 2 hours

**Subtasks:**
7.1. **INDEPENDENT MODAL STATES**: Integrate SarungSelectionModal with completely independent modal state from ProductHistoryPopup
7.2. **DUAL MODAL ARCHITECTURE**: Add modal state management that supports both modals simultaneously
7.3. **SHARED HISTORY HANDLER**: Implement unified onOpenHistory handler for both main grid and sarung modal contexts
7.4. Implement sarung selection handler for jas products
7.5. Update cart addition logic for pairings
7.6. **LAYERED ERROR HANDLING**: Add error handling for modal failures with fallback options
7.7. Update cart display for pairings with visual indicators
7.8. **SEAMLESS MODAL INTEGRATION**: Ensure ProductHistoryPopup works from both main grid and modal contexts
7.9. Add sarung product filtering and loading logic

**Acceptance Criteria:**
- SarungSelectionModal opens when jas product "Add to Cart" is clicked
- **SIMULTANEOUS MODAL SUPPORT**: Modal state completely independent of ProductHistoryPopup (no conflicts)
- **UNIVERSAL HISTORY ACCESS**: ProductHistoryPopup works from both main grid and sarung modal
- **LAYERED MODAL EXPERIENCE**: Both modals can be open simultaneously without issues
- Sarung selection properly creates pairing relationship
- Cart displays pairings with clear indicators
- **GRACEFUL DEGRADATION**: Error handling provides fallback options (direct jas addition)
- Existing functionality remains unchanged for non-jas products
- **CONSISTENT UX**: ProductHistoryPopup behaves identically in all contexts

**Implementation Details:**
```typescript
// Independent modal states - NO SHARED STATE
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

// Shared history handler for both contexts - SINGLE SOURCE OF TRUTH
const openHistoryPopup = (productSizeId: string, productName: string, size: string, ageCategory: string) => {
  setHistoryPopup({
    isOpen: true,
    productSizeId,
    productName,
    size,
    ageCategory,
  })
}

// Used by both main grid and sarung modal
<ProductCard onOpenHistory={openHistoryPopup} />
<SarungSelectionModal onOpenHistory={openHistoryPopup} />
```

### Phase 3: Business Logic Integration (Tasks 8-10)

#### Task 8: Update Cart Management
**File:** `features/kasir/components/form/ProductSelectionStep.tsx`
**Priority:** High
**Estimated Time:** 1 hour

**Subtasks:**
8.1. Update cart item display for pairings
8.2. Implement linked removal (removing jas removes sarung)
8.3. Handle quantity adjustments for paired items
8.4. Update cart summary calculations
8.5. Add pairing indicators to cart UI

**Acceptance Criteria:**
- Paired items display relationship clearly
- Removing jas automatically removes linked sarung
- Quantity changes maintain pairing relationship
- Cart totals exclude sarung prices
- Visual indicators show pairing status

#### Task 9: Update PaymentSummaryStep Component
**File:** `features/kasir/components/form/PaymentSummaryStep.tsx`
**Priority:** High
**Estimated Time:** 1 hour

**Subtasks:**
9.1. Add pairing display in product list
9.2. Show sarung as "GRATIS" in breakdown
9.3. Update price calculation display
9.4. Add pairing indicators to summary
9.5. Ensure receipt preview accuracy

**Acceptance Criteria:**
- Pairings clearly shown in payment summary
- Sarung displayed as free with visual indication
- Price calculations exclude sarung amounts
- Summary matches final receipt format
- All pairing information visible to user

#### Task 10: Implement Inventory Management
**File:** `features/kasir/services/transaksiService.ts`
**Priority:** High
**Estimated Time:** 45 minutes

**Subtasks:**
10.1. Update transaction creation for pairings
10.2. Ensure both jas and sarung inventory reduced
10.3. Handle atomic transaction processing
10.4. Add rollback mechanisms for failures
10.5. Update transaction item creation

**Acceptance Criteria:**
- Both jas and sarung inventory properly reduced
- Transaction creation is atomic (all or nothing)
- Failure rollback prevents partial inventory reduction
- Transaction items created for both products
- Existing transaction logic remains unchanged

### Phase 4: Receipt System Enhancement (Tasks 11-12)

#### Task 11: Update Professional Receipt Service
**File:** `features/kasir/services/professionalReceiptService.ts`
**Priority:** High
**Estimated Time:** 2 hours

**Subtasks:**
11.1. Add "Kode Sarung" column to table structure
11.2. Update table column widths for new layout
11.3. Implement receipt data processing for pairings
11.4. Add jas/sarung code extraction logic
11.5. Update receipt generation method
11.6. Test with various pairing scenarios

**Acceptance Criteria:**
- Receipt table includes "Kode Jas" and "Kode Sarung" columns
- Jas products show code in "Kode Jas" column
- Sarung products show code in "Kode Sarung" column
- Non-jas products show "-" in "Kode Sarung" column
- Table layout remains professional and readable
- All existing receipt functionality preserved

**Implementation Details:**
```typescript
// Updated table columns
private readonly TABLE_COLUMNS: TableColumn[] = [
  { header: 'No', width: 12, align: 'center' },
  { header: 'Kode Jas', width: 20, align: 'left' },
  { header: 'Kode Sarung', width: 20, align: 'left' },
  { header: 'Nama Barang', width: 50, align: 'left' },
  { header: 'Size', width: 20, align: 'center' },
  { header: 'Qty', width: 10, align: 'center' },
  { header: '@Harga', width: 18, align: 'right' },
  { header: 'Total Harga', width: 20, align: 'right' }
]
```

#### Task 12: Update Receipt Data Processing
**File:** `features/kasir/services/professionalReceiptService.ts`
**Priority:** Medium
**Estimated Time:** 1 hour

**Subtasks:**
12.1. Create receipt row processing for pairings
12.2. Implement jas/sarung code extraction
12.3. Handle various pairing scenarios
12.4. Add comprehensive testing
12.5. Validate receipt accuracy

**Acceptance Criteria:**
- Receipt rows correctly show jas and sarung codes
- Pairing relationships clear in receipt format
- Various scenarios handled (with/without sarung)
- Receipt data matches transaction data
- Professional appearance maintained

### Phase 5: Error Handling & Validation (Tasks 13-15)

#### Task 13: Implement Comprehensive Error Handling
**Files:** Multiple components
**Priority:** Medium
**Estimated Time:** 1.5 hours

**Subtasks:**
13.1. Add sarung availability validation
13.2. Implement modal failure handling
13.3. Create inventory validation checks
13.4. Add user-friendly error messages
13.5. Implement retry mechanisms

**Acceptance Criteria:**
- Clear error messages for all failure scenarios
- Graceful degradation when sarung unavailable
- Fallback options always available
- User can recover from any error state
- Error logging for debugging

#### Task 14: Add Input Validation
**Files:** Modal and form components
**Priority:** Medium
**Estimated Time:** 45 minutes

**Subtasks:**
14.1. Validate sarung selection inputs
14.2. Enforce quantity limits
14.3. Verify product categories
14.4. Add client-side validation
14.5. Implement server-side validation

**Acceptance Criteria:**
- Invalid inputs prevented at UI level
- Server validation catches edge cases
- Clear validation error messages
- Form submission blocked for invalid data
- Security considerations addressed

#### Task 15: Implement Comprehensive Testing
**Files:** Test files for all components
**Priority:** High
**Estimated Time:** 3 hours

**Subtasks:**
15.1. Create unit tests for utility functions
15.2. Add component tests for modal and indicators
15.3. Create integration tests for full workflow
15.4. Add end-to-end tests for user scenarios
15.5. Test error handling and edge cases
15.6. Validate receipt generation accuracy

**Acceptance Criteria:**
- 100% test coverage for new utility functions
- Component tests cover all user interactions
- Integration tests validate complete workflows
- E2E tests cover real user scenarios
- Error cases thoroughly tested
- Receipt accuracy validated

### Phase 6: Code Quality & Documentation (Tasks 16-17)

#### Task 16: Code Quality Assurance
**Files:** All modified files
**Priority:** High
**Estimated Time:** 1 hour

**Subtasks:**
16.1. Run yarn lint and fix all issues
16.2. Run yarn type-check and resolve errors
16.3. Remove any dead code or unused functions
16.4. Optimize imports and dependencies
16.5. Ensure consistent code formatting

**Acceptance Criteria:**
- yarn lint passes without warnings
- yarn type-check passes without errors
- No dead code or unused functions
- Consistent code style throughout
- Optimal performance maintained

#### Task 17: Documentation & Comments
**Files:** All new and modified files
**Priority:** Medium
**Estimated Time:** 45 minutes

**Subtasks:**
17.1. Add comprehensive JSDoc comments
17.2. Document complex business logic
17.3. Update component prop documentation
17.4. Add inline comments for clarity
17.5. Create usage examples

**Acceptance Criteria:**
- All public functions have JSDoc comments
- Complex logic is well-documented
- Component props clearly documented
- Code is self-documenting with good comments
- Examples provided for key functions

## Implementation Order

### Sprint 1 (Core Foundation)
- Task 1: Extend Type Definitions
- Task 2: Create Utility Functions
- Task 3: Update Price Calculator
- Task 15: Basic Unit Tests

### Sprint 2 (UI Components)
- Task 4: Create SarungSelectionModal Component
- Task 5: Create SarungPairingIndicator Component
- Task 6: Modify ProductCard Component
- Task 7: Update ProductSelectionStep Component

### Sprint 3 (Business Logic)
- Task 8: Update Cart Management
- Task 9: Update PaymentSummaryStep Component
- Task 10: Implement Inventory Management
- Task 13: Error Handling (Basic)

### Sprint 4 (Receipt & Polish)
- Task 11: Update Professional Receipt Service
- Task 12: Update Receipt Data Processing
- Task 14: Input Validation
- Task 16: Code Quality Assurance

### Sprint 5 (Testing & Documentation)
- Task 15: Comprehensive Testing (Complete)
- Task 13: Error Handling (Complete)
- Task 17: Documentation & Comments

## Risk Mitigation

### High-Risk Tasks
- Task 4 (SarungSelectionModal): Complex UI component with multiple states and ProductHistoryPopup integration
- Task 7 (ProductSelectionStep): Modal state management and preventing conflicts
- Task 11 (Receipt Service): Critical business document formatting
- Task 10 (Inventory Management): Data integrity concerns

### Mitigation Strategies
- Incremental development with frequent testing
- Thorough code review for critical components
- Backup and rollback plans for each deployment
- Feature flags for gradual rollout

### Modal Conflict Prevention
- **INDEPENDENT STATE ARCHITECTURE**: Use completely separate state management for SarungSelectionModal and ProductHistoryPopup
- **LAYERED MODAL SYSTEM**: Implement proper z-index layering for modal stacking (sarung: z-50, history: z-60)
- **SHARED HANDLER PATTERN**: Use single onOpenHistory handler for both main grid and modal contexts
- **SIMULTANEOUS MODAL SUPPORT**: Test modal interactions thoroughly in all scenarios to ensure both can be open
- **GRACEFUL FALLBACK**: Provide fallback mechanisms if modal conflicts occur (direct jas addition)
- **CONSISTENT BEHAVIOR**: Ensure ProductHistoryPopup works identically from both main grid and sarung modal

## Modal Conflict Resolution Summary

### Problem Addressed
The user was concerned about potential conflicts between SarungSelectionModal and ProductHistoryPopup when both need to be accessible simultaneously. Specifically:
- Opening ProductHistoryPopup from within sarung modal shouldn't close the parent modal
- Both modals should be able to coexist without UI conflicts
- ProductCard should work identically in both main grid and sarung modal contexts

### Solution Implemented
1. **Independent Modal States**: Completely separate useState hooks for each modal
2. **Shared History Handler**: Single onOpenHistory function used by both contexts
3. **Z-Index Layering**: Proper modal stacking (sarung: z-50, history: z-60)
4. **Component Reusability**: ProductCard works identically in all contexts
5. **No Context Awareness**: Components don't need special handling for different contexts

### Key Benefits
- ✅ Both modals can be open simultaneously
- ✅ ProductHistoryPopup accessible from both main grid and sarung modal
- ✅ No modal conflicts or unexpected closures
- ✅ Maximum code reuse and consistency
- ✅ Simple, maintainable architecture

## Potential Issues & Clarifications

### 1. Modal State Management
**Issue**: Potential conflicts between SarungSelectionModal and ProductHistoryPopup
**Solution**: Independent state management with proper modal layering
**Implementation**: Separate useState hooks for each modal, shared onOpenHistory handler

### 2. ProductCard Context Awareness
**Issue**: ProductCard needs to behave differently in main grid vs sarung modal
**Solution**: Use existing props and context, no special handling needed
**Implementation**: Same ProductCard component works in both contexts

### 3. Sarung Category Type Discrepancy
**Issue**: Requirements mention "accessories_universal" but data shows "accessories_age_based"
**Solution**: Use actual data structure (accessories_age_based) and update requirements if needed
**Implementation**: Filter sarung products by category="sarung" AND type="accessories_age_based"

### 4. Receipt Column Layout
**Issue**: Adding two new columns may affect receipt formatting
**Solution**: Adjust existing column widths proportionally
**Implementation**: Reduce other column widths to accommodate new jas/sarung code columns

### 5. Inventory Management Complexity
**Issue**: Managing inventory for both jas and sarung in single transaction
**Solution**: Use existing transaction item structure, create separate items for each
**Implementation**: Two transaction items with pairing relationship in ProductSelection

## Success Criteria

### Functional Requirements
- All jas products trigger sarung selection modal
- ProductHistoryPopup works from both main grid and sarung modal
- Sarung selection creates proper pairing relationship
- Cart displays pairings with clear indicators
- Payment summary shows sarung as free
- Receipt includes separate jas/sarung code columns
- Inventory properly managed for both products

### Technical Requirements
- yarn lint passes without warnings
- yarn type-check passes without errors
- No dead code or unused functions
- 100% backward compatibility maintained
- Performance impact minimal
- No modal conflicts or UI issues

### User Experience Requirements
- Intuitive sarung selection workflow
- Clear visual indicators for pairings
- Graceful error handling and recovery
- Professional receipt appearance
- Consistent with existing UI patterns
- ProductHistoryPopup accessible from all contexts

This implementation plan ensures systematic development of the jas-sarung pairing feature while maintaining code quality, system stability, and excellent user experience.