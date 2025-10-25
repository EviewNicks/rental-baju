# =� **Task Plan: Category Type Enhancement & Dynamic Form Implementation**

## =� **EPIC: Dynamic Product Form System**

**Objective**: Implement category-based dynamic form system untuk produk accessories dengan field input berbeda dari clothing biasa.

**Timeline**: 2-3 weeks
**Priority**: HIGH
**Team**: Frontend + Backend coordination

---

## <� **STORY 1: Database Schema Enhancement**

### **Task 1.1: Add Category Type Column - COMPLETED ✅**

- **File**: `prisma/schema.prisma`
- **Action**: Added `type String? @default("clothing")` ke Category model
- **Result**: Category.type field successfully added
- **Acceptance**:
  - [✓] Column added successfully
  - [✓] Default value: 'clothing'
  - [✓] Existing categories preserve current data

### **Task 1.2: Update Existing Categories - COMPLETED ✅**

- **File**: Manual database migration via `db execute`
- **Action**: Updated existing categories dengan appropriate type
- **Categories Updated**:
  - 'Sarung', 'Songket' → 'accessories_age_based'
  - 'Anting', 'Bando', 'Gelang', 'Kalung' → 'accessories_universal'
  - Other categories → 'clothing' (default)
- **Method**: Used `prisma db execute --file` manual migration
- **Acceptance**:
  - [✓] Sarung & Songket → accessories_age_based
  - [✓] Anting, Bando, Gelang, Kalung → accessories_universal
  - [✓] Other categories → clothing (default)

### **Task 1.3: Generate Prisma Client - COMPLETED ✅**

- **Action**: Generated Prisma client dengan new schema
- **Command**: `npx prisma generate`
- **Result**: Prisma Client v6.13.0 generated in 123ms
- **Acceptance**:
  - [✓] New types include Category.type field
  - [✓] No TypeScript errors
  - [✓] Prisma client updated

---

## <� **STORY 2: API Layer Enhancement**

### **Task 2.1: Update Categories API Validation**

- **File**: `app/api/categories/route.ts`
- **Action**: Add type field support ke validation schema
- **Changes**:
  ```typescript
  interface CreateCategoryRequest {
    name: string
    color: string
    type?: 'clothing' | 'accessories_age_based' | 'accessories_universal'
  }
  ```
- **Acceptance**:
  - [✓] POST supports type field
  - [✓] Zod validation for enum values
  - [✓] Backward compatibility maintained

### **Task 2.2: Update Categories API Response**

- **File**: `app/api/categories/route.ts`
- **Action**: Include type field di GET response
- **Changes**: Return category objects dengan type property
- **Acceptance**:
  - [✓] GET /api/categories includes type field
  - [✓] Existing categories show correct type
  - [✓] Consistent API response format

### **Task 2.3: Validate Products API Compatibility**

- **File**: `app/api/products/route.ts`
- **Action**: Verify existing API supports dynamic forms
- **Analysis**:
  - [✓] Sizes JSON parsing working 
  - [✓] ProductSize creation supported 
  - [✓] Advanced validation functional 
  - [✓] No breaking changes needed 

### **Task 2.4: ProductService Category Type Integration - COMPLETED ✅**

- **File**`features/manage-product/services/productService.ts`
- **Action**: Enhance ProductService dengan category type awareness
- **Changes**:

  ```typescript
  // ENHANCED: Get category dengan type information
  const category = await this.getCategoryWithTypes(validatedData.categoryId)

  // NEW: Category type-specific validation
  await this.validateSizesForCategoryType(validatedData.sizes, category.type)

  // NEW: Category type-specific business logic
  const processedSizes = this.processSizesByCategoryType(sizes, category.type)
  ```

- **Acceptance**:
  - [✓] ProductService dapat category type info
  - [✓] Category type-specific validation implemented
  - [✓] Size processing logic per category type
  - [✓] Backward compatibility maintained

### **Task 2.5: Category-Specific Size Validation - COMPLETED ✅**

- **File**: `features/manage-product/lib/validation/productSchema.ts`
- **Action**: Add category type-specific size validation schemas
- **Changes**:
  ```typescript
  // NEW: Category type size validators
  accessoriesAgeBasedSizeSchema // Dewasa/Anak fields
  accessoriesUniversalSizeSchema // Single Jumlah field
  clothingSizeSchema // S/M/L/XL fields
  createCategoryAwareSizeSchema() // Dynamic schema factory
  ```
- **Acceptance**:
  - [✓] accessories_age_based: Dewasa/Anak validation
  - [✓] accessories_universal: Single quantity validation
  - [✓] clothing: Size validation (S,M,L,XL,XXL)
  - [✓] CSV pattern mapping support

### **Task 2.6: Size Processing Logic Implementation - COMPLETED ✅**

- **File**: `features/manage-product/services/productService.ts`
- **Action**: Implement size transformation logic per category type
- **CSV Pattern Support**:
  - `sarung.csv` → accessories_age_based (Dewasa/Anak columns)
  - `anting.csv` → accessories_universal (Single Jumlah column)
  - `organze.csv` → clothing (Size columns)
- **Acceptance**:
  - [✓] CSV data pattern mapping
  - [✓] Size transformation per category type
  - [✓] Bulk import with category type detection
  - [✓] Error handling for invalid patterns
- **Result**: IMPLEMENTATION COMPLETED - Full category type support

---

## <� **STORY 3: Dynamic Form Strategy Pattern**

### **Task 3.1: Create Category Form Strategy Interface**

- **File**: `features/manage-product/lib/strategies/categoryFormStrategy.ts`
- **Action**: Define strategy pattern untuk dynamic forms
- **Interface**:
  ```typescript
  interface CategoryFormStrategy {
    type: CategoryType
    getFormFields(): FormFieldConfig[]
    transformToProductSizes(formData: FormData): CreateProductSizeRequest[]
    getValidationSchema(): ZodSchema
  }
  ```
- **Acceptance**:
  - [✓] TypeScript interface defined
  - [✓] Form field configuration structure
  - [✓] Data transformation methods
  - [✓] Validation schema integration

### **Task 3.2: Implement Category Strategy Classes**

- **File**: `features/manage-product/lib/strategies/strategies.ts`
- **Classes**:
  - `AccessoriesAgeBasedStrategy` (Sarung, Songket)
  - `AccessoriesUniversalStrategy` (Anting, Gelang, Kalung)
  - `ClothingStrategy` (Baju, Celana)
- **Acceptance**:
  - [✓] All 3 strategies implemented
  - [✓] Form field definitions correct
  - [✓] Data transformation working
  - [✓] Validation schemas defined

### **Task 3.3: Create Strategy Factory**

- **File**: `features/manage-product/lib/strategies/strategyFactory.ts`
- **Action**: Factory untuk strategy selection
- **Implementation**:
  ```typescript
  class FormStrategyFactory {
    static create(categoryType: string): CategoryFormStrategy {
      switch (categoryType) {
        case 'accessories_age_based':
          return new AccessoriesAgeBasedStrategy()
        case 'accessories_universal':
          return new AccessoriesUniversalStrategy()
        default:
          return new ClothingStrategy()
      }
    }
  }
  ```
- **Acceptance**:
  - [✓] Factory pattern implemented
  - [✓] Correct strategy selection
  - [✓] Fallback to default strategy
  - [✓] Error handling for invalid types

---

## <� **STORY 4: Dynamic Form Components**

### **Task 4.1: Create Category-Specific Field Components**

- **Files**:
  - `features/manage-product/components/dynamic-form/AccessoriesAgeBasedFields.tsx`
  - `features/manage-product/components/dynamic-form/AccessoriesUniversalFields.tsx`
  - `features/manage-product/components/dynamic-form/ClothingFields.tsx`
- **Acceptance**:
  - [✓] Age-based fields: Jumlah Dewasa + Jumlah Anak
  - [✓] Universal fields: Jumlah Total
  - [✓] Clothing fields: Size management (S/M/L/XL)
  - [✓] Consistent styling dengan existing forms

### **Task 4.2: Update ProductForm Component**

- **File**: `features/manage-product/components/form-product/ProductForm.tsx`
- **Action**: Integrate dynamic field rendering
- **Changes**:
  - Add category type detection
  - Implement strategy selection
  - Dynamic field rendering based on strategy
  - Form data transformation before API submission
- **Acceptance**:
  - [✓] Category selection triggers form change
  - [✓] Correct fields displayed per category type
  - [✓] Form validation working per strategy
  - [✓] Data transformation to ProductSize format

### **Task 4.3: Integrate dengan Existing Form Structure**

- **Action**: Ensure compatibility dengan existing ProductFormPage
- **Files**: `ProductFormPage.tsx`, related components
- **Acceptance**:
  - [✓] No breaking changes to existing workflows
  - [✓] Backward compatibility dengan existing products
  - [✓] Consistent navigation and breadcrumbs
  - [✓] Error handling preserved

---

## <� **STORY 5: Integration & Testing**

### **Task 5.1: Database Migration Testing**

- **Action**: Execute database changes safely
- **Steps**:
  - [✓] Create database backup
  - [✓] Execute ALTER TABLE statement
  - [✓] Run UPDATE statements for existing categories
  - [✓] Verify data integrity
  - [✓] Test database connections

### **Task 5.2: API Integration Testing**

- **Action**: Test complete API flow
- **Tests**:
  - [ ] GET /api/categories returns type field
  - [ ] POST /api/categories supports type parameter
  - [ ] POST /api/products accepts dynamic sizes JSON
  - [ ] Product creation successful untuk semua category types

### **Task 5.3: Form Integration Testing**

- **Action**: End-to-end form testing
- **Scenarios**:
  - [ ] Create Sarung produk dengan Dewasa/Anak fields
  - [ ] Create Anting produk dengan single Jumlah field
  - [ ] Create Baju produk dengan size management
  - [ ] Form validation dan error handling
  - [ ] Image upload integration

### **Task 5.4: User Acceptance Testing**

- **Action**: Real-world usage testing
- **Test Cases**:
  - [ ] Complete product creation flow untuk semua category types
  - [ ] Form performance dan responsiveness
  - [ ] Error message clarity dan helpfulness
  - [ ] Mobile responsiveness testing
  - [ ] Accessibility compliance

---

## =' **CRITICAL PATH ANALYSIS**

### **Week 1: Foundation**

- **Day 1-2**: Database schema update + API enhancement
- **Day 3-5**: Strategy pattern implementation

### **Week 2: Development**

- **Day 1-3**: Dynamic form component development
- **Day 4-5**: Component integration + basic testing

### **Week 3: Testing & Refinement**

- **Day 1-2**: Comprehensive integration testing
- **Day 3**: User acceptance testing
- **Day 4-5**: Bug fixes + refinements

---

## =� **SUCCESS METRICS**

### **Functional Requirements**

- [ ] Form dynamically adjusts fields based on selected category type
- [ ] Data correctly transforms ke ProductSize format
- [ ] All category types supported (clothing, accessories_age_based, accessories_universal)
- [ ] Backward compatibility maintained dengan existing products
- [ ] No data migration required untuk existing products

### **Performance Requirements**

- [ ] Form render time < 200ms
- [ ] Zero breaking changes kepada existing API
- [ ] Full TypeScript type safety
- [ ] Consistent UI/UX dengan existing design system

### **Business Requirements**

- [ ] User can create all accessories types dengan appropriate fields
- [ ] Data entry time reduced oleh 40% untuk accessories
- [ ] Zero training required untuk existing users
- [ ] Support untuk future category types

---

## � **RISK ASSESSMENT**

### **High Priority Risks**

1. **Database Migration Issues**
   - **Mitigation**: Backup database + test migration on staging
   - **Owner**: Backend Developer

2. **Form Complexity Impact**
   - **Mitigation**: Incremental development + user testing
   - **Owner**: Frontend Developer

### **Medium Priority Risks**

1. **Performance Impact**
   - **Mitigation**: Memoization + efficient rendering
   - **Owner**: Frontend Developer

2. **User Adoption Resistance**
   - **Mitigation**: Gradual rollout + user training
   - **Owner**: Product Manager

---

## =� **TASK STATUS TRACKING**

### **Progress Board**

```
EPIC: Dynamic Product Form System [ACTIVE]

   STORY 1: Database Schema Enhancement [TODO]
      Task 1.1: Add Category Type Column [TODO]
      Task 1.2: Update Existing Categories [TODO]
      Task 1.3: Generate Prisma Client [TODO]

   STORY 2: API Layer Enhancement [TODO]
      Task 2.1: Update Categories API Validation [TODO]
      Task 2.2: Update Categories API Response [TODO]
      Task 2.3: Validate Products API Compatibility [DONE]

   STORY 3: Dynamic Form Strategy Pattern [TODO]
      Task 3.1: Create Category Form Strategy Interface [TODO]
      Task 3.2: Implement Category Strategy Classes [TODO]
      Task 3.3: Create Strategy Factory [TODO]

   STORY 4: Dynamic Form Components [TODO]
      Task 4.1: Create Category-Specific Field Components [TODO]
      Task 4.2: Update ProductForm Component [TODO]
      Task 4.3: Integrate dengan Existing Form Structure [TODO]

   STORY 5: Integration & Testing [TODO]
       Task 5.1: Database Migration Testing [TODO]
       Task 5.2: API Integration Testing [TODO]
       Task 5.3: Form Integration Testing [TODO]
       Task 5.4: User Acceptance Testing [TODO]
```

---

## =� **READY TO START**

**First Task**: Task 1.1 - Add Category Type Column
**Prerequisites**: Database backup, access to production-like environment
**Dependencies**: None (blocking all subsequent tasks)

---

**Created**: 2025-10-22
**Last Updated**: 2025-10-22
**Status**: READY FOR EXECUTION
**Next Review**: After Task 1.1 completion
