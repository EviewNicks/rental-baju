# Task Plan: Fix Size Validation Error in Product Creation Form

## Executive Summary

**Problem**: Users encounter "Produk harus memiliki setidaknya satu ukuran" error when creating products, even after correctly filling in size and quantity information using the new conditional fields system.

**Root Cause**: Data format mismatch between the new conditional fields system (stores data in `categoryFormData.sizes` + `categoryFormData.quantity_*`) and the legacy validation function (`validateSimplifiedSizes(formData.simplifiedSizes)`) that expects the old data format.

**Solution**: Create a bridge validation system that transforms new conditional fields data to the legacy format expected by validation, while maintaining backward compatibility and improving the overall form data flow.

---

## Current System Analysis

### Data Flow Architecture

```
User Interface (Conditional Fields)
    ↓
categoryFormData.sizes: ['S', 'M', 'L']
categoryFormData.quantity_S: 10
categoryFormData.quantity_M: 5
categoryFormData.quantity_L: 15
    ↓
[GAP: Data Transformation Missing]
    ↓
Legacy Validation Expects:
formData.simplifiedSizes: [
  { size: 'S', ageCategory: 'ADULT', quantity: 10 },
  { size: 'M', ageCategory: 'ADULT', quantity: 5 },
  { size: 'L', ageCategory: 'ADULT', quantity: 15 }
]
```

### Component Data Flow Analysis

#### ProductForm.tsx (Lines 254-329)
- **Manages**: `categoryFormData` state with new conditional fields format
- **Receives**: Size selections from DynamicFormField components
- **Transforms**: Data via `currentStrategy.transformToProductSizes(categoryFormData)`
- **Issue**: No sync back to `formData.simplifiedSizes` for validation

#### ProductFormPage.tsx (Lines 292-294)
- **Validates**: Using `validateSimplifiedSizes(formData.simplifiedSizes)`
- **Problem**: `formData.simplifiedSizes` is never populated from the new conditional fields system
- **Result**: Validation fails because array is empty/undefined

#### ClothingStrategy.ts (Lines 90-111)
- **Transforms**: `categoryFormData` → `CreateProductSizeRequest[]`
- **Working**: Correctly transforms conditional fields data to backend format
- **Missing**: Bridge to populate `formData.simplifiedSizes` for validation

---

## Technical Deep Dive

### Current Data Structures

#### New Conditional Fields Format
```typescript
interface CategoryFormData {
  categoryId: string
  sizes: string[]                    // ['S', 'M', 'L']
  quantity_S: number = 0            // Individual quantity fields
  quantity_M: number = 0
  quantity_L: number = 0
  // ... other quantity fields
}
```

#### Legacy Validation Format
```typescript
interface SimplifiedSizeEntry {
  id?: string
  size: SizeEnum                   // 'S', 'M', 'L'
  ageCategory: AgeCategory         // 'ADULT', 'CHILD'
  quantity: number
}
```

### Validation Function Analysis

#### validateSimplifiedSizes() (ProductFormPage.tsx Lines 177-209)
```typescript
const validateSimplifiedSizes = (simplifiedSizes?: SimplifiedSizeEntry[]): string | null => {
  if (!simplifiedSizes || simplifiedSizes.length === 0) {
    return 'Produk harus memiliki setidaknya satu ukuran'  // ← ERROR TRIGGERED
  }
  // ... validation logic
}
```

**Problem**: The function receives `undefined` or empty array because the data transformation from new to legacy format never happens.

---

## Solution Architecture

### Strategy: Bridge Validation Pattern

Create a validation bridge that:
1. **Transforms** new conditional fields data to legacy format at validation time
2. **Maintains** backward compatibility with existing simplified sizes system
3. **Centralizes** transformation logic for reusability
4. **Preserves** existing API contracts and component interfaces

### Implementation Pattern

```typescript
// New bridge validation function
const validateSizes = (formData: ProductFormData, categoryFormData?: CategoryFormData): string | null => {
  // Try legacy format first (backward compatibility)
  if (formData.simplifiedSizes && formData.simplifiedSizes.length > 0) {
    return validateSimplifiedSizes(formData.simplifiedSizes)
  }

  // Transform new conditional fields data to legacy format
  if (categoryFormData && categoryFormData.sizes) {
    const transformedSizes = transformCategoryFormDataToSimplifiedSizes(categoryFormData)
    return validateSimplifiedSizes(transformedSizes)
  }

  return 'Produk harus memiliki setidaknya satu ukuran'
}
```

---

## Detailed Implementation Plan

### Phase 1: Create Data Transformation Utilities

#### 1.1 Create CategoryFormStrategyHelper.ts
**Location**: `features/manage-product/lib/strategies/CategoryFormStrategyHelper.ts`

```typescript
/**
 * Helper utilities for CategoryFormStrategy data transformation
 * Bridges new conditional fields system with legacy validation
 */

import type { CategoryFormData } from './CategoryFormStrategy'
import type { SimplifiedSizeEntry, SizeEnum, AgeCategory } from '../../types'

export class CategoryFormStrategyHelper {
  /**
   * Transform category form data (new conditional fields) to simplified sizes format (legacy validation)
   */
  static transformToSimplifiedSizes(categoryFormData: CategoryFormData): SimplifiedSizeEntry[] {
    const sizes: SimplifiedSizeEntry[] = []
    const selectedSizes = Array.isArray(categoryFormData.sizes) ? categoryFormData.sizes : []

    selectedSizes.forEach((sizeValue: string) => {
      const quantityKey = `quantity_${sizeValue}`
      const quantity = this.ensureNumber(categoryFormData[quantityKey])

      if (quantity > 0) {
        sizes.push({
          size: sizeValue as SizeEnum,
          ageCategory: 'ADULT', // Default for clothing, can be enhanced later
          quantity
        })
      }
    })

    return sizes
  }

  /**
   * Transform simplified sizes back to category form data (for edit mode)
   */
  static transformFromSimplifiedSizes(simplifiedSizes: SimplifiedSizeEntry[]): CategoryFormData {
    const formData: CategoryFormData = {
      categoryId: '',
      sizes: []
    }

    simplifiedSizes.forEach(size => {
      if (!formData.sizes.includes(size.size)) {
        formData.sizes.push(size.size)
      }
      const quantityKey = `quantity_${size.size}`
      formData[quantityKey] = size.quantity
    })

    return formData
  }

  /**
   * Calculate total quantity from category form data
   */
  static calculateTotalQuantity(categoryFormData: CategoryFormData): number {
    const selectedSizes = Array.isArray(categoryFormData.sizes) ? categoryFormData.sizes : []
    return selectedSizes.reduce((total, sizeValue) => {
      const quantityKey = `quantity_${sizeValue}`
      return total + this.ensureNumber(categoryFormData[quantityKey])
    }, 0)
  }

  private static ensureNumber(value: unknown): number {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const parsed = Number(value)
      if (!isNaN(parsed)) return parsed
    }
    return 0
  }
}
```

### Phase 2: Enhanced ProductForm.tsx

#### 2.1 Add Category Form Data Sync
**File**: `features/manage-product/components/form-product/ProductForm.tsx`

**Add new props interface** (Lines 53-75):
```typescript
interface ProductFormProps {
  // ... existing props

  // NEW: Bridge validation props
  categoryFormData?: CategoryFormData
  onSyncSimplifiedSizes?: (sizes: SimplifiedSizeEntry[]) => void
}
```

**Add sync handler** (Lines 330-340):
```typescript
// Sync simplified sizes when category form data changes
useEffect(() => {
  if (categoryFormData && onSyncSimplifiedSizes && currentStrategy) {
    try {
      // Transform new conditional fields data to legacy format
      const transformedSizes = currentStrategy.transformToProductSizes(categoryFormData)

      // Convert to SimplifiedSizeEntry format for validation
      const simplifiedSizes: SimplifiedSizeEntry[] = transformedSizes.map(size => ({
        size: size.size as SizeEnum,
        ageCategory: size.ageCategory as AgeCategory,
        quantity: size.quantity
      }))

      onSyncSimplifiedSizes(simplifiedSizes)
    } catch (error) {
      formLogger.error('syncSimplifiedSizes', 'Failed to sync simplified sizes', error)
    }
  }
}, [categoryFormData, currentStrategy, onSyncSimplifiedSizes])
```

**Update form props** (Lines 77-89):
```typescript
export function ProductForm({
  formData,
  errors,
  touched,
  onInputChange,
  onBlur,
  formatCurrency,
  categories,
  product,
  onSimplifiedSizesChange,
  onCategoryFormDataChange,
  onStrategySizesChange,
  // NEW: Bridge validation props
  categoryFormData,
  onSyncSimplifiedSizes,
}: ProductFormProps)
```

### Phase 3: Enhanced ProductFormPage.tsx

#### 3.1 Add Bridge Validation
**File**: `features/manage-product/components/form-product/ProductFormPage.tsx`

**Add state management** (Lines 241-261):
```typescript
const [formData, setFormData] = useState<ProductFormData>({
  // ... existing fields

  // Simplified Size Management (will be synced from category form data)
  simplifiedSizes: mode === 'edit' && product?.sizes
    ? transformProductSizesToSimplifiedFormat(product.sizes)
    : [], // Will be populated by bridge validation
  aggregatedSizes: undefined,
})

// NEW: Track category form data for bridge validation
const [currentCategoryFormData, setCurrentCategoryFormData] = useState<CategoryFormData | undefined>()
```

**Add bridge validation function** (Lines 298-320):
```typescript
// Bridge validation function that handles both old and new data formats
const validateSizes = (): string | null => {
  // Try legacy format first (backward compatibility)
  if (formData.simplifiedSizes && formData.simplifiedSizes.length > 0) {
    return validateSimplifiedSizes(formData.simplifiedSizes)
  }

  // Transform new conditional fields data to legacy format
  if (currentCategoryFormData && currentCategoryFormData.sizes) {
    // Use the helper utility for transformation
    const transformedSizes = CategoryFormStrategyHelper.transformToSimplifiedSizes(currentCategoryFormData)

    // Update form data with transformed sizes for consistency
    setFormData(prev => ({ ...prev, simplifiedSizes: transformedSizes }))

    return validateSimplifiedSizes(transformedSizes)
  }

  return 'Produk harus memiliki setidaknya satu ukuran'
}
```

**Update main validation** (Lines 269-298):
```typescript
const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {}

  // ... existing validations

  // UPDATED: Use bridge validation for sizes
  const sizesError = validateSizes()
  if (sizesError) newErrors.sizes = sizesError

  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
}
```

**Add sync handler** (Lines 400-420):
```typescript
// Handler for syncing simplified sizes from category form data
const handleSyncSimplifiedSizes = (sizes: SimplifiedSizeEntry[]) => {
  console.log('[DEBUG] handleSyncSimplifiedSizes called with:', {
    sizesCount: sizes.length,
    sizes: sizes,
    totalQuantity: sizes.reduce((sum, size) => sum + size.quantity, 0)
  })

  setFormData((prev) => ({
    ...prev,
    simplifiedSizes: sizes,
    // Auto-calculate total quantity from sizes
    quantity: sizes.reduce((sum, size) => sum + size.quantity, 0),
  }))

  // Clear any existing sizes validation error
  if (errors.sizes) {
    setErrors((prev) => ({ ...prev, sizes: '' }))
  }
}

// Handler for category form data changes
const handleCategoryFormDataChange = (categoryFormData: CategoryFormData) => {
  setCurrentCategoryFormData(categoryFormData)
}
```

**Update ProductForm component** (Lines 728-740):
```tsx
<ProductForm
  formData={formData}
  errors={errors}
  touched={touched}
  onInputChange={handleInputChange}
  onBlur={handleBlur}
  formatCurrency={formatCurrency}
  categories={categories}
  product={product || undefined}
  onHasSizesChange={handleHasSizesChange}
  onAggregatedSizesChange={handleAggregatedSizesChange}
  onSimplifiedSizesChange={handleSimplifiedSizesChange}
  // NEW: Bridge validation props
  categoryFormData={currentCategoryFormData}
  onSyncSimplifiedSizes={handleSyncSimplifiedSizes}
  onCategoryFormDataChange={handleCategoryFormDataChange}
/>
```

### Phase 4: Enhanced Error Handling & UX

#### 4.1 Improved Error Messages
**File**: `ProductFormPage.tsx` (Lines 177-209)

```typescript
const validateSimplifiedSizes = (simplifiedSizes?: SimplifiedSizeEntry[]): string | null => {
  if (!simplifiedSizes || simplifiedSizes.length === 0) {
    return 'Pilih minimal satu ukuran dan masukkan jumlah stok untuk setiap ukuran yang dipilih'
  }

  // ... existing validation logic with improved messages
  for (const sizeEntry of simplifiedSizes) {
    if (!sizeEntry.size || !['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(sizeEntry.size)) {
      return `Ukuran "${sizeEntry.size}" tidak valid. Pilih ukuran yang tersedia.`
    }

    if (sizeEntry.quantity <= 0) {
      return `Jumlah stok untuk ukuran ${sizeEntry.size} harus lebih dari 0.`
    }

    if (sizeEntry.quantity > 999) {
      return `Jumlah stok untuk ukuran ${sizeEntry.size} tidak boleh lebih dari 999.`
    }
  }

  // ... rest of validation
}
```

#### 4.2 Real-time Validation Feedback
**File**: `ProductForm.tsx` (Lines 320-340)

```typescript
// Add real-time validation feedback when category form data changes
useEffect(() => {
  if (categoryFormData && onSyncSimplifiedSizes && currentStrategy) {
    try {
      const transformedSizes = currentStrategy.transformToProductSizes(categoryFormData)
      const simplifiedSizes: SimplifiedSizeEntry[] = transformedSizes.map(size => ({
        size: size.size as SizeEnum,
        ageCategory: size.ageCategory as AgeCategory,
        quantity: size.quantity
      }))

      onSyncSimplifiedSizes(simplifiedSizes)

      // Trigger real-time validation if sizes field has been touched
      if (touched.sizes) {
        const validationResult = validateSimplifiedSizes(simplifiedSizes)
        if (validationResult) {
          // This would need to be passed down from ProductFormPage
          onValidationError?.('sizes', validationResult)
        }
      }
    } catch (error) {
      formLogger.error('syncSimplifiedSizes', 'Failed to sync simplified sizes', error)
    }
  }
}, [categoryFormData, currentStrategy, onSyncSimplifiedSizes, touched.sizes])
```

---

## Testing Strategy

### 1. Unit Tests

#### CategoryFormStrategyHelper.test.ts
```typescript
describe('CategoryFormStrategyHelper', () => {
  describe('transformToSimplifiedSizes', () => {
    test('should transform category form data to simplified sizes correctly', () => {
      const categoryFormData: CategoryFormData = {
        categoryId: 'cat-1',
        sizes: ['S', 'M'],
        quantity_S: 10,
        quantity_M: 5,
        quantity_L: 0
      }

      const result = CategoryFormStrategyHelper.transformToSimplifiedSizes(categoryFormData)

      expect(result).toEqual([
        { size: 'S', ageCategory: 'ADULT', quantity: 10 },
        { size: 'M', ageCategory: 'ADULT', quantity: 5 }
      ])
    })

    test('should handle empty sizes array', () => {
      const categoryFormData: CategoryFormData = {
        categoryId: 'cat-1',
        sizes: [],
        quantity_S: 10
      }

      const result = CategoryFormStrategyHelper.transformToSimplifiedSizes(categoryFormData)
      expect(result).toEqual([])
    })

    test('should ignore zero quantities', () => {
      const categoryFormData: CategoryFormData = {
        categoryId: 'cat-1',
        sizes: ['S', 'M'],
        quantity_S: 0,
        quantity_M: 5
      }

      const result = CategoryFormStrategyHelper.transformToSimplifiedSizes(categoryFormData)
      expect(result).toEqual([
        { size: 'M', ageCategory: 'ADULT', quantity: 5 }
      ])
    })
  })

  describe('calculateTotalQuantity', () => {
    test('should calculate total quantity correctly', () => {
      const categoryFormData: CategoryFormData = {
        categoryId: 'cat-1',
        sizes: ['S', 'M', 'L'],
        quantity_S: 10,
        quantity_M: 5,
        quantity_L: 15
      }

      const result = CategoryFormStrategyHelper.calculateTotalQuantity(categoryFormData)
      expect(result).toBe(30)
    })
  })
})
```

### 2. Integration Tests

#### ProductForm.integration.test.ts
```typescript
describe('ProductForm Size Validation Integration', () => {
  test('should validate conditional fields data correctly', async () => {
    const mockOnSyncSimplifiedSizes = jest.fn()

    render(
      <ProductForm
        formData={mockFormData}
        errors={{}}
        touched={{}}
        onInputChange={jest.fn()}
        onBlur={jest.fn()}
        formatCurrency={jest.fn()}
        categories={mockCategories}
        categoryFormData={mockCategoryFormData}
        onSyncSimplifiedSizes={mockOnSyncSimplifiedSizes}
      />
    )

    // Simulate user selecting sizes and entering quantities
    const sizeCheckbox = screen.getByTestId('checkbox-sizes-S')
    fireEvent.click(sizeCheckbox)

    const quantityInput = screen.getByTestId('field-quantity_S')
    fireEvent.change(quantityInput, { target: { value: '10' } })

    // Verify sync function is called with transformed data
    await waitFor(() => {
      expect(mockOnSyncSimplifiedSizes).toHaveBeenCalledWith([
        { size: 'S', ageCategory: 'ADULT', quantity: 10 }
      ])
    })
  })
})
```

#### ProductFormPage.integration.test.ts
```typescript
describe('ProductFormPage Bridge Validation', () => {
  test('should validate using bridge validation when category form data is provided', () => {
    const mockCategoryFormData: CategoryFormData = {
      categoryId: 'clothing-1',
      sizes: ['S', 'M'],
      quantity_S: 10,
      quantity_M: 5
    }

    const { result } = renderHook(() =>
      useProductFormPage({ mode: 'add' }),
      { wrapper: TestWrapper }
    )

    act(() => {
      result.current.handleCategoryFormDataChange(mockCategoryFormData)
    })

    const isValid = result.current.validateForm()
    expect(isValid).toBe(true)
  })

  test('should show validation error when no sizes selected', () => {
    const mockCategoryFormData: CategoryFormData = {
      categoryId: 'clothing-1',
      sizes: [],
      quantity_S: 0
    }

    const { result } = renderHook(() =>
      useProductFormPage({ mode: 'add' }),
      { wrapper: TestWrapper }
    )

    act(() => {
      result.current.handleCategoryFormDataChange(mockCategoryFormData)
    })

    const isValid = result.current.validateForm()
    expect(isValid).toBe(false)
    expect(result.current.errors.sizes).toBe('Produk harus memiliki setidaknya satu ukuran')
  })
})
```

### 3. E2E Tests (Playwright)

#### ProductCreation.spec.ts
```typescript
test.describe('Product Size Validation', () => {
  test('should create product successfully with conditional fields', async ({ page }) => {
    await page.goto('/producer/manage-product/add')

    // Fill basic product information
    await page.fill('[data-testid="product-code-field"] input', 'TEST001')
    await page.fill('[data-testid="product-name-field"] input', 'Test Product')
    await page.selectOption('[data-testid="product-category-field"] select', 'Clothing')

    // Wait for conditional fields to load
    await page.waitForSelector('[data-testid="checkbox-sizes-S"]')

    // Select sizes and enter quantities
    await page.click('[data-testid="checkbox-sizes-S"]')
    await page.fill('[data-testid="field-quantity_S"] input', '10')

    await page.click('[data-testid="checkbox-sizes-M"]')
    await page.fill('[data-testid="field-quantity_M"] input', '5')

    // Fill price information
    await page.fill('[data-testid="product-modal-field"] input', '100000')
    await page.fill('[data-testid="product-price-field"] input', '50000')

    // Submit form
    await page.click('[data-testid="submit-button"]')

    // Verify success - should redirect to product list
    await expect(page).toHaveURL('/producer/manage-product')
  })

  test('should show validation error when submitting without sizes', async ({ page }) => {
    await page.goto('/producer/manage-product/add')

    // Fill basic product information but no sizes
    await page.fill('[data-testid="product-code-field"] input', 'TEST002')
    await page.fill('[data-testid="product-name-field"] input', 'Test Product 2')
    await page.selectOption('[data-testid="product-category-field"] select', 'Clothing')

    // Try to submit without selecting sizes
    await page.click('[data-testid="submit-button"]')

    // Should show validation error
    await expect(page.locator('text=Produk harus memiliki setidaknya satu ukuran')).toBeVisible()
  })

  test('should handle size selection changes dynamically', async ({ page }) => {
    await page.goto('/producer/manage-product/add')

    // Fill basic information
    await page.fill('[data-testid="product-code-field"] input', 'TEST003')
    await page.selectOption('[data-testid="product-category-field"] select', 'Clothing')

    // Select S size
    await page.click('[data-testid="checkbox-sizes-S"]')
    await expect(page.locator('[data-testid="field-quantity_S"]')).toBeVisible()

    // Deselect S size
    await page.click('[data-testid="checkbox-sizes-S"]')
    await expect(page.locator('[data-testid="field-quantity_S"]')).not.toBeVisible()

    // Select M size
    await page.click('[data-testid="checkbox-sizes-M"]')
    await expect(page.locator('[data-testid="field-quantity_M"]')).toBeVisible()
  })
})
```

---

## Risk Assessment & Mitigation

### High Risk Areas

#### 1. Data Transformation Edge Cases
**Risk**: Malformed data during transformation causing runtime errors
**Mitigation**:
- Comprehensive input validation in transformation functions
- Fallback mechanisms for edge cases
- Extensive unit testing for all data scenarios

#### 2. Form State Synchronization
**Risk**: Race conditions between form state updates and validation
**Mitigation**:
- UseEffect dependencies properly configured
- Debounced validation triggers
- Atomic state updates

#### 3. Backward Compatibility
**Risk**: Breaking existing edit mode functionality
**Mitigation**:
- Maintain all existing interfaces
- Feature flags for gradual rollout
- Comprehensive regression testing

### Medium Risk Areas

#### 1. Performance Impact
**Risk**: Additional transformation logic affecting form performance
**Mitigation**:
- Memoize transformation functions
- Lazy validation (only on submit/blur)
- Performance monitoring

#### 2. User Experience Consistency
**Risk**: Confusing validation messages or timing
**Mitigation**:
- Clear, actionable error messages
- Consistent validation timing
- User testing and feedback

### Low Risk Areas

#### 1. Code Maintainability
**Risk**: Increased complexity making code harder to maintain
**Mitigation**:
- Clear documentation and comments
- Separation of concerns
- Code review processes

---

## Implementation Timeline

### Day 1: Foundation & Utilities
- **Morning**: Create `CategoryFormStrategyHelper.ts` with transformation utilities
- **Afternoon**: Write comprehensive unit tests for helper functions
- **EOD**: Code review and refinement of transformation logic

### Day 2: Component Integration
- **Morning**: Update `ProductForm.tsx` with bridge validation props and sync logic
- **Afternoon**: Update `ProductFormPage.tsx` with bridge validation implementation
- **EOD**: Integration testing and debugging

### Day 3: Error Handling & UX
- **Morning**: Implement improved error messages and real-time validation
- **Afternoon**: Add comprehensive error handling and edge case coverage
- **EOD**: User experience testing and refinement

### Day 4: Testing & Validation
- **Morning**: Complete unit and integration test coverage
- **Afternoon**: E2E testing with Playwright
- **EOD**: Performance testing and optimization

### Day 5: Documentation & Deployment
- **Morning**: Code documentation and implementation notes
- **Afternoon**: Final regression testing and deployment preparation
- **EOD**: Production deployment and monitoring

---

## Success Criteria

### Functional Requirements ✅
- [ ] Users can create products using conditional fields without validation errors
- [ ] Form validation correctly recognizes size selections and quantities
- [ ] Edit mode works seamlessly with existing product data
- [ ] Backward compatibility maintained for legacy workflows
- [ ] Real-time validation feedback provides clear guidance

### Technical Requirements ✅
- [ ] No runtime errors in transformation logic
- [ ] Form state synchronization works reliably
- [ ] Performance impact is minimal (<100ms additional processing)
- [ ] Test coverage exceeds 90% for new code
- [ ] Type safety maintained throughout implementation

### User Experience Requirements ✅
- [ ] Error messages are clear and actionable
- [ ] Validation timing is appropriate (not intrusive)
- [ ] Dynamic field behavior works smoothly
- [ ] Accessibility compliance maintained
- [ ] Mobile responsiveness preserved

---

## Monitoring & Rollback Strategy

### Production Monitoring
- **Error Tracking**: Monitor for transformation-related errors
- **Performance Metrics**: Track form submission success rates and processing time
- **User Feedback**: Collect feedback on validation experience

### Rollback Plan
- **Feature Flags**: Implement feature flags for quick rollback
- **Database Compatibility**: Ensure backward compatibility for data format
- **User Communication**: Prepare user notifications for any changes

---

## Conclusion

This comprehensive plan addresses the size validation error through a bridge validation pattern that seamlessly integrates the new conditional fields system with the existing validation framework. The solution maintains backward compatibility while providing a foundation for future enhancements.

The phased implementation approach ensures manageable development with continuous testing and validation. By focusing on data transformation bridges and maintaining existing contracts, we minimize risk while delivering immediate user value.

Success will be measured by the elimination of the "Produk harus memiliki setidaknya satu ukuran" error and improved user experience in the product creation workflow.