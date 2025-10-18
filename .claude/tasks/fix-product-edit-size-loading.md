# TASK: Fix Product Edit Form Size Data Loading

## 🎯 Objective
Transform existing `product.sizes[]` to `simplifiedSizes[]` for edit mode display in ProductFormPage

## 🔍 Problem Analysis
**Root Cause**: `ProductFormPage.tsx:248` initializes `simplifiedSizes: []` instead of transforming existing size data

**Current Issue**:
- API returns 5 sizes correctly (S, M, L, XL(2), XXL)
- Form shows empty state: "Belum ada ukuran ditambahkan"
- `InlineSizeManagement` receives empty array

**Reference Data** (`services/client.log:27-88`):
```json
"sizes": [
  {"ageCategory": "ADULT", "size": "S", "quantity": 1},
  {"ageCategory": "ADULT", "size": "M", "quantity": 1},
  {"ageCategory": "ADULT", "size": "L", "quantity": 1},
  {"ageCategory": "ADULT", "size": "XL", "quantity": 2},
  {"ageCategory": "ADULT", "size": "XXL", "quantity": 1}
]
```

## 📋 Implementation Tasks

### Phase 1: Code Analysis
- [ ] Examine `ProductFormPage.tsx` form initialization logic (line 248)
- [ ] Review `SimplifiedSizeEntry` type interface
- [ ] Analyze current `product.sizes[]` structure

### Phase 2: Transformation Logic
- [ ] Create size transformation function:
  ```typescript
  // Transform ProductSize[] → SimplifiedSizeEntry[]
  const transformSizes = (sizes: ProductSize[]): SimplifiedSizeEntry[] => {
    return sizes.map(size => ({
      id: size.id,
      size: size.size as SizeEnum,
      ageCategory: size.ageCategory as AgeCategory,
      quantity: size.quantity
    }))
  }
  ```

### Phase 3: Form Integration
- [ ] Update form initialization in edit mode:
  ```typescript
  // Replace: simplifiedSizes: []
  // With: simplifiedSizes: mode === 'edit' ? transformSizes(product.sizes || []) : []
  ```

### Phase 4: Testing & Validation
- [ ] Test edit form loads existing size data
- [ ] Verify `InlineSizeManagement` displays sizes correctly
- [ ] Confirm size editing functionality works
- [ ] Validate form submission with modified sizes

## 🎯 Success Criteria
- ✅ Edit form displays existing size data instead of empty state
- ✅ All 5 sizes (S, M, L, XL(2), XXL) visible in form
- ✅ Size data is editable and formable
- ✅ No regression in create new product functionality

## 📁 Files to Modify
- `features/manage-product/components/form-product/ProductFormPage.tsx`

## 🔗 Dependencies
- `SimplifiedSizeEntry` type interface
- `ProductSize` API response structure
- `InlineSizeManagement` component interface

## ⚠️ Risk Assessment
- **Complexity**: Low (single transformation function)
- **Risk Level**: Minimal (backwards compatible change)
- **Test Required**: Basic form functionality verification

## 📊 Expected Outcome
Users can edit existing product sizes instead of seeing empty form, improving edit UX significantly.