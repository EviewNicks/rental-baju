# Task Plan: Conditional Quantity Fields for Clothing Size Management

## Problem Statement

In the Clothing category form, when users select size checkboxes (S, M, L, XL, XXL), ALL quantity input fields are displayed regardless of which sizes are selected. Users want only the quantity fields for checked sizes to be visible for a cleaner user experience.

## Current Implementation Analysis

### Architecture Overview
- **Strategy Pattern**: CategoryFormStrategy interface with ClothingStrategy implementation
- **Dynamic Form Rendering**: DynamicFormField.tsx renders form fields based on strategy configuration
- **Form State Management**: ProductForm.tsx manages form state and orchestrates strategy-based rendering

### Current Implementation Deep-Dive

#### 1. ClothingStrategy.getFormFields() (Lines 46-81)
```typescript
// Current implementation generates STATIC sections:
getFormFields(): FormSectionConfig[] {
  return [
    {
      title: 'Ukuran & Stok',
      fields: [
        {
          name: 'sizes',
          type: 'checkbox-group',
          // Size checkboxes for S, M, L, XL, XXL
        }
      ]
    },
    {
      title: 'Jumlah Stok per Ukuran',
      // PROBLEM: ALL quantity fields are generated regardless of selection
      fields: this.sizeOptions.map(size => ({
        name: `quantity_${size.value}`,
        type: 'number',
        // Static quantity field for each size
      }))
    }
  ]
}
```

**Issue**: Second section generates ALL quantity fields (quantity_XS, quantity_S, quantity_M, etc.) regardless of which sizes are selected in the first section.

#### 2. DynamicFormField.tsx Analysis
- **Functionality**: Renders individual form fields based on FormFieldConfig
- **Limitation**: No awareness of other field values or form state
- **Missing**: Conditional rendering logic based on form dependencies

#### 3. ProductForm.tsx Analysis (Lines 496-526)
```typescript
// Current rendering logic
{currentStrategy.getFormFields().map((section, sectionIndex) => (
  <FormSection key={sectionIndex}>
    {section.fields.map((field, fieldIndex) => (
      <DynamicFormField
        key={fieldIndex}
        field={field}
        value={categoryFormData[field.name]}
        onChange={(value) => handleCategoryFormDataChange(field.name, value)}
        // ISSUE: No form state context for condition evaluation
      />
    ))}
  </FormSection>
))}
```

**Issue**: Fields are rendered independently without access to complete form state for dependency evaluation.

#### 4. FormFieldConfig Interface (CategoryFormStrategy.ts)
```typescript
export interface FormFieldConfig {
  name: string
  type: 'number' | 'select' | 'checkbox-group' | 'text'
  label: string
  // ... other properties
  // MISSING: conditional rendering support
}
```

**Issue**: No support for field dependencies or conditional visibility.

## Technical Challenges & Considerations

### 1. State Management
- **Challenge**: Conditional fields need access to complete form state to evaluate conditions
- **Solution**: Pass form state context down to DynamicFormField components
- **Performance**: Ensure efficient re-rendering without excessive DOM updates

### 2. Type Safety
- **Challenge**: Conditional logic must maintain TypeScript type safety
- **Solution**: Create strongly-typed condition interfaces and evaluation utilities

### 3. Backward Compatibility
- **Challenge**: Existing strategies must continue working without modification
- **Solution**: Make conditional fields optional and default to always visible

### 4. Validation Strategy
- **Challenge**: Hidden fields should be excluded or have relaxed validation
- **Solution**: Adjust validation schema based on field visibility

### 5. Form Data Transformation
- **Challenge**: transformToProductSizes must handle both visible and hidden fields
- **Solution**: Maintain existing transformation logic with visibility awareness

## Implementation Strategy

### Phase 1: Extend Type System (CategoryFormStrategy.ts)

#### 1.1 Add Condition Interfaces
```typescript
// Condition operators for field dependencies
export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'includes'
  | 'excludes'
  | 'contains_any'
  | 'contains_all'
  | 'is_empty'
  | 'is_not_empty'

// Single condition definition
export interface FieldCondition {
  field: string           // Field name to check against
  operator: ConditionOperator
  value?: unknown        // Expected value (for operators that need it)
}

// Complex boolean conditions
export interface FieldConditionGroup {
  operator: 'AND' | 'OR'
  conditions: (FieldCondition | FieldConditionGroup)[]
}

// Extended FormFieldConfig with conditional support
export interface FormFieldConfig {
  name: string
  type: 'number' | 'select' | 'checkbox-group' | 'text'
  label: string
  // ... existing properties
  condition?: FieldCondition | FieldConditionGroup  // NEW: Conditional visibility
}
```

#### 1.2 Create Condition Evaluator Utility
```typescript
export class ConditionEvaluator {
  static evaluate(
    condition: FieldCondition | FieldConditionGroup,
    formData: CategoryFormData
  ): boolean {
    // Implementation for condition evaluation logic
  }
}
```

### Phase 2: Modify ClothingStrategy.ts

#### 2.1 Update getFormFields() Method
```typescript
getFormFields(): FormSectionConfig[] {
  return [
    {
      title: 'Ukuran & Stok',
      description: 'Pilih ukuran yang tersedia dan masukkan jumlah stok untuk setiap ukuran',
      fields: [
        {
          name: 'sizes',
          type: 'checkbox-group',
          label: 'Ukuran Tersedia',
          required: true,
          validation: z.array(z.string()).min(1, 'Pilih minimal satu ukuran'),
          options: this.sizeOptions,
          defaultValue: [],
          helpText: 'Pilih semua ukuran yang tersedia untuk produk ini'
        }
      ]
    },
    {
      title: 'Jumlah Stok per Ukuran',
      description: 'Masukkan jumlah stok untuk setiap ukuran yang dipilih',
      // NEW: Conditional quantity fields
      fields: this.sizeOptions.map(size => ({
        name: `quantity_${size.value}`,
        type: 'number' as const,
        label: `Jumlah ${size.label}`,
        placeholder: '0',
        required: false,  // Optional since field might be hidden
        validation: z.number().min(0, 'Jumlah minimal 0').max(9999, 'Maksimal 9999').optional(),
        min: 0,
        max: 9999,
        defaultValue: 0,
        helpText: `Stok untuk ukuran ${size.value}`,
        // NEW: Condition - only show if this size is selected
        condition: {
          field: 'sizes',
          operator: 'includes',
          value: size.value
        }
      }))
    }
  ]
}
```

#### 2.2 Update Validation Schema
```typescript
getValidationSchema(): z.ZodSchema {
  return z.object({
    sizes: z.array(z.string()).min(1, 'Pilih minimal satu ukuran'),
    // Make quantity fields optional or conditional
    ...this.sizeOptions.reduce((acc, size) => {
      acc[`quantity_${size.value}`] = z.number().min(0, 'Jumlah minimal 0').max(9999, 'Maksimal 9999').optional()
      return acc
    }, {} as Record<string, z.ZodNumber>)
  }).refine(
    (data) => {
      const selectedSizes = data.sizes || []
      return selectedSizes.some((size: string) => {
        const quantityKey = `quantity_${size}`
        const quantity = (data as Record<string, unknown>)[quantityKey] as number
        return quantity && quantity > 0
      })
    },
    {
      message: 'Minimal satu ukuran yang dipilih harus memiliki stok',
      path: ['sizes']
    }
  )
}
```

### Phase 3: Update DynamicFormField.tsx

#### 3.1 Add Form State Props
```typescript
interface DynamicFormFieldProps {
  field: FormFieldConfig
  value: unknown
  onChange: (value: unknown) => void
  onBlur: (value: unknown) => void
  error?: string | null
  touched?: boolean
  formDescription?: string
  // NEW: Form state for condition evaluation
  formData?: CategoryFormData
}
```

#### 3.2 Add Condition Evaluation Logic
```typescript
import { ConditionEvaluator } from '../../lib/strategies/CategoryFormStrategy'

export function DynamicFormField({
  field,
  value,
  onChange,
  onBlur,
  error,
  touched,
  formData // NEW: Form state context
}: DynamicFormFieldProps) {
  // NEW: Evaluate field visibility condition
  const isFieldVisible = React.useMemo(() => {
    if (!field.condition || !formData) return true
    return ConditionEvaluator.evaluate(field.condition, formData)
  }, [field.condition, formData])

  // NEW: Return null if condition is not met
  if (!isFieldVisible) {
    return null
  }

  // ... existing field rendering logic
}
```

### Phase 4: Enhance ProductForm.tsx

#### 4.1 Pass Form State to DynamicFormField
```typescript
// Update DynamicFormField rendering in ProductForm.tsx (lines 507-521)
<DynamicFormField
  key={fieldIndex}
  field={field}
  value={
    categoryFormData[field.name as keyof CategoryFormData] ||
    field.defaultValue ||
    ''
  }
  onChange={(value) => handleCategoryFormDataChange(field.name, value)}
  onBlur={(value) => onBlur(field.name, value)}
  error={errors[field.name]}
  touched={touched[field.name]}
  formDescription={currentStrategy.getFormDescription()}
  // NEW: Pass complete form state for condition evaluation
  formData={categoryFormData}
/>
```

#### 4.2 Ensure Re-evaluation on Form Changes
```typescript
// The existing handleCategoryFormDataChange already updates categoryFormData
// which will trigger re-render and condition re-evaluation
const handleCategoryFormDataChange = useCallback(
  (fieldName: string, value: unknown) => {
    const updatedData = {
      ...categoryFormData,
      [fieldName]: value,
    }
    setCategoryFormData(updatedData)
    // ... existing logic
  },
  [categoryFormData, /* ... other dependencies */]
)
```

### Phase 5: Condition Evaluator Implementation

#### 5.1 Create Condition Evaluation Logic
```typescript
export class ConditionEvaluator {
  static evaluate(
    condition: FieldCondition | FieldConditionGroup,
    formData: CategoryFormData
  ): boolean {
    if ('operator' in condition && (condition.operator === 'AND' || condition.operator === 'OR')) {
      // Handle group conditions
      return this.evaluateGroup(condition as FieldConditionGroup, formData)
    } else {
      // Handle single condition
      return this.evaluateSingle(condition as FieldCondition, formData)
    }
  }

  private static evaluateSingle(
    condition: FieldCondition,
    formData: CategoryFormData
  ): boolean {
    const fieldValue = formData[condition.field]
    const { operator, value } = condition

    switch (operator) {
      case 'equals':
        return fieldValue === value
      case 'not_equals':
        return fieldValue !== value
      case 'includes':
        return Array.isArray(fieldValue) && fieldValue.includes(value)
      case 'excludes':
        return Array.isArray(fieldValue) && !fieldValue.includes(value)
      case 'contains_any':
        return Array.isArray(fieldValue) && Array.isArray(value) &&
               fieldValue.some(item => value.includes(item))
      case 'contains_all':
        return Array.isArray(fieldValue) && Array.isArray(value) &&
               value.every(item => fieldValue.includes(item))
      case 'is_empty':
        return !fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0)
      case 'is_not_empty':
        return fieldValue && (!Array.isArray(fieldValue) || fieldValue.length > 0)
      default:
        return false
    }
  }

  private static evaluateGroup(
    group: FieldConditionGroup,
    formData: CategoryFormData
  ): boolean {
    const { operator, conditions } = group
    const results = conditions.map(condition => this.evaluate(condition, formData))

    return operator === 'AND' ? results.every(result => result)
                              : results.some(result => result)
  }
}
```

## Testing Strategy

### 1. Unit Tests
- **ConditionEvaluator.test.ts**: Test all condition operators and edge cases
- **ClothingStrategy.test.ts**: Test conditional field generation
- **DynamicFormField.test.ts**: Test conditional rendering logic

### 2. Integration Tests
- **ProductForm.integration.test.ts**: Test form state changes and field visibility
- **Form validation tests**: Test validation with visible/hidden fields

### 3. E2E Tests (Playwright)
- **User interaction flows**: Test checkbox selection/deselection behavior
- **Form submission**: Test with different size combinations
- **Accessibility**: Test keyboard navigation and screen reader behavior

### 4. Test Scenarios
```typescript
describe('Conditional Quantity Fields', () => {
  test('should only show quantity fields for selected sizes', () => {
    // Select only S and M sizes
    // Verify only quantity_S and quantity_M fields are visible
  })

  test('should update visibility when size selection changes', () => {
    // Select S, then deselect S, then select XL
    // Verify quantity fields show/hide accordingly
  })

  test('should validate only visible quantity fields', () => {
    // Select S and M
    // Fill only quantity_S
    // Should pass validation if quantity_S > 0
  })

  test('should handle edit mode with existing data', () => {
    // Load product with existing sizes and quantities
    // Verify correct fields are visible and populated
  })
})
```

## Edge Cases & Handling

### 1. Initial Render State
- **Scenario**: Form loads with empty state
- **Handling**: All quantity fields hidden until sizes are selected
- **Validation**: Size selection required before any quantity validation

### 2. Form Reset
- **Scenario**: User clears all size selections
- **Handling**: Hide all quantity fields, clear quantity values
- **Validation**: Require at least one size selection

### 3. Edit Mode
- **Scenario**: Loading existing product data
- **Handling**: Show quantity fields only for existing sizes
- **Validation**: Maintain existing validation rules

### 4. Partial Data
- **Scenario**: Form has size selection but missing quantity data
- **Handling**: Show quantity fields with default values
- **Validation**: Require quantity for selected sizes

### 5. Performance Optimization
- **Scenario**: Rapid checkbox selections/deselections
- **Handling**: Debounce condition evaluation, memoize results
- **Optimization**: Use React.memo for DynamicFormField components

## Code Modification Requirements

### Files to Modify
1. **CategoryFormStrategy.ts**: Add condition interfaces and types
2. **ClothingStrategy.ts**: Implement conditional quantity fields
3. **DynamicFormField.tsx**: Add conditional rendering logic
4. **ProductForm.tsx**: Pass form state context
5. **ConditionEvaluator.ts**: New utility class (create)

### Files to Create
1. **ConditionEvaluator.ts**: Utility for condition evaluation
2. **Test files**: Comprehensive test coverage

### Backward Compatibility
- All existing FormFieldConfig properties remain unchanged
- Condition property is optional
- Existing strategies without conditions continue to work
- No breaking changes to public APIs

## Implementation Timeline

### Day 1: Type System & Utilities
- Extend CategoryFormStrategy.ts with condition interfaces
- Implement ConditionEvaluator utility class
- Add basic unit tests

### Day 2: Strategy Updates
- Modify ClothingStrategy.ts to use conditional fields
- Update validation schema
- Add strategy unit tests

### Day 3: Component Updates
- Update DynamicFormField.tsx with conditional rendering
- Modify ProductForm.tsx to pass form state
- Add component unit tests

### Day 4: Integration & Testing
- Integration tests for form state management
- E2E tests for user interaction flows
- Accessibility testing

### Day 5: Validation & Polish
- Comprehensive validation testing
- Performance optimization
- Code review and documentation

## Success Criteria

### Functional Requirements
✅ Only quantity fields for selected sizes are visible
✅ Fields show/hide immediately when size selection changes
✅ Form validation works correctly with visible/hidden fields
✅ Edit mode works with existing product data
✅ Backward compatibility maintained

### Non-Functional Requirements
✅ No performance degradation
✅ Type safety maintained throughout
✅ Accessibility compliance (WCAG 2.1 AA)
✅ Comprehensive test coverage (>90%)
✅ Clean, maintainable code structure

### User Experience
✅ Intuitive and responsive interface
✅ Clear visual feedback
✅ Consistent with existing design patterns
✅ Smooth transitions and interactions

## Risk Mitigation

### Technical Risks
- **Complexity**: Condition evaluation logic complexity
  - *Mitigation*: Start with simple conditions, comprehensive testing
- **Performance**: Excessive re-renders
  - *Mitigation*: Memoization, React.memo, debouncing
- **Type Safety**: Runtime type errors in conditions
  - *Mitigation*: Strong TypeScript types, runtime validation

### User Experience Risks
- **Confusion**: Fields appearing/disappearing unexpectedly
  - *Mitigation*: Smooth transitions, clear visual hierarchy
- **Accessibility**: Screen reader compatibility
  - *Mitigation*: ARIA attributes, keyboard navigation testing

### Integration Risks
- **Breaking Changes**: Existing functionality affected
  - *Mitigation*: Optional properties, backward compatibility testing
- **Form Validation**: Complex validation scenarios
  - *Mitigation*: Comprehensive test coverage, edge case handling

## Conclusion

This implementation plan provides a systematic approach to adding conditional quantity fields to the Clothing size management system. The solution extends the existing strategy pattern without breaking changes, maintains type safety, and provides a clean user experience.

The phased approach ensures manageable development with continuous testing and validation. The comprehensive test strategy covers all aspects from unit tests to E2E scenarios, ensuring robust functionality and user experience.