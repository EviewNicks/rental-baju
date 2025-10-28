# Task: Category Type Enhancement & Dynamic Form Implementation

## 🎯 **Overview**

Implement category-based dynamic form system untuk produk accessories (Sarung, Songket, dll) dengan field input yang berbeda dari produk clothing biasa. Solusi memanfaatkan existing Product + ProductSize system dengan minimal database changes.

## 🔍 **Problem Analysis**

### **Current Issues:**

- Form input generic, tidak sesuai kebutuhan berbeda per kategori
- Accessories (Sarung/Songket) butuh field: Jumlah Dewasa + Jumlah Anak
- Accessories (Anting/Gelang/Kalung) butuh field: Jumlah Total saja
- User experience tidak optimal untuk cross-category product management

### **Root Cause:**

Form system tidak _category-aware_ untuk menyesuaikan input fields berdasarkan tipe produk.

## 🏗️ **Solution Architecture**

### **Approach:** Category-Based Dynamic Form

- **Enhancement:** Tambahkan `type` field ke Category table
- **Logic:** Dynamic form rendering based on category type
- **Integration:** Leverage existing ProductSize & AgeCategory system
- **Compatibility:** Maintain backward compatibility dengan existing API

### **Category Types:**

```typescript
enum CategoryType {
  CLOTHING = 'clothing', // Baju, Celana → Size S/M/L/XL
  ACCESSORIES_AGE_BASED = 'accessories_age_based', // Sarung, Songket → Dewasa/Anak
  ACCESSORIES_UNIVERSAL = 'accessories_universal', // Anting, Gelang, Kalung → Total
}
```

## 📋 **Implementation Tasks**

### **Phase 1: Database Schema Enhancement**

**Timeline:** 0.5 day
**Priority:** HIGH

#### **Task 1.1: Update Category Table**

```sql
-- Add type column to Category table
ALTER TABLE Category ADD COLUMN type VARCHAR(50) DEFAULT 'clothing';

-- Update existing categories dengan type yang sesuai
UPDATE Category SET type = 'accessories_age_based'
WHERE name IN ('Sarung', 'Songket');

UPDATE Category SET type = 'accessories_universal'
WHERE name IN ('Anting', 'Bando', 'Gelang', 'Kalung');

UPDATE Category SET type = 'clothing'
WHERE name IN ('Baju', 'Celana', 'Kemeja'); -- atau nama kategori clothing lain
```

**Validation:**

- [ ] Verify column added successfully
- [ ] Test existing categories updated correctly
- [ ] Backup database sebelum migration

#### **Task 1.2: Update Prisma Schema**

```prisma
model Category {
  id        String    @id @default(uuid())
  name      String    @unique
  color     String
  type      String    @default("clothing") // NEW FIELD
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  createdBy String
  products  Product[]
}
```

**Validation:**

- [ ] Update schema.prisma file
- [ ] Run `npx prisma generate`
- [ ] Test database connection

### **Phase 2: API Layer Enhancement**

**Timeline:** 1 day
**Priority:** HIGH

#### **Task 2.1: Update Categories API**

**File:** `/app/api/categories/route.ts`

```typescript
// Enhanced category schema
interface CreateCategoryRequest {
  name: string
  color: string
  type?: 'clothing' | 'accessories_age_based' | 'accessories_universal'
}

// Update POST handler validation
const categorySchema = z.object({
  name: z.string().min(1),
  color: z.string().min(1),
  type: z.enum(['clothing', 'accessories_age_based', 'accessories_universal']).optional(),
})
```

**Tasks:**

- [ ] Update Zod validation schema
- [ ] Add type field to GET response
- [ ] Test POST dengan type field
- [ ] Test existing categories endpoint

#### **Task 2.2: Validate Products API Compatibility**

**File:** `/app/api/products/route.ts`

**Current Status:** ✅ ALREADY SUPPORTED

- ✅ Sizes JSON parsing sudah ada
- ✅ ProductSize creation sudah terimplementasi
- ✅ Advanced validation sudah ada
- ✅ Image upload sudah bekerja

**Tasks:**

- [ ] Verify no breaking changes needed
- [ ] Test dengan dynamic sizes JSON
- [ ] Confirm backward compatibility

### **Phase 3: Dynamic Form Component Development**

**Timeline:** 2-3 days
**Priority:** HIGH

#### **Task 3.1: Create Category Form Strategy**

**New File:** `/features/manage-product/lib/strategies/categoryFormStrategy.ts`

```typescript
interface CategoryFormStrategy {
  type: CategoryType
  getFormFields(): FormFieldConfig[]
  transformToProductSizes(formData: FormData): ProductSizeRequest[]
  getValidationSchema(): ZodSchema
}

class AccessoriesAgeBasedStrategy implements CategoryFormStrategy {
  getFormFields() {
    return [
      { name: 'jumlahDewasa', label: 'Jumlah Dewasa', type: 'number', required: true },
      { name: 'jumlahAnak', label: 'Jumlah Anak', type: 'number', required: false },
    ]
  }

  transformToProductSizes(formData) {
    const sizes = []
    if (formData.jumlahDewasa > 0) {
      sizes.push({
        ageCategory: 'ADULT',
        size: 'UNIVERSAL',
        quantity: formData.jumlahDewasa,
      })
    }
    if (formData.jumlahAnak > 0) {
      sizes.push({
        ageCategory: 'CHILD',
        size: 'UNIVERSAL',
        quantity: formData.jumlahAnak,
      })
    }
    return sizes
  }
}
```

#### **Task 3.2: Update ProductForm Component**

**File:** `/features/manage-product/components/form-product/ProductForm.tsx`

```typescript
const DynamicProductForm = ({ mode, initialData }) => {
  const { selectedCategory } = useFormContext()
  const [strategy, setStrategy] = useState<CategoryFormStrategy>()

  useEffect(() => {
    if (selectedCategory?.type) {
      setStrategy(FormStrategyFactory.create(selectedCategory.type))
    }
  }, [selectedCategory])

  return (
    <Form validationSchema={strategy?.getValidationSchema()}>
      <BasicProductFields />
      {strategy && <CategorySpecificFields strategy={strategy} />}
      <AdvancedSizeManagement mode={mode} />
    </Form>
  )
}
```

**Tasks:**

- [ ] Create strategy factory pattern
- [ ] Implement 3 category strategies (clothing, accessories_age_based, accessories_universal)
- [ ] Update ProductForm dengan dynamic rendering
- [ ] Add category type detection
- [ ] Implement form data transformation

#### **Task 3.3: Create Category-Specific Field Components**

**New Files:**

- `/components/dynamic-form/AccessoriesAgeBasedFields.tsx`
- `/components/dynamic-form/AccessoriesUniversalFields.tsx`
- `/components/dynamic-form/ClothingFields.tsx`

```typescript
// AccessoriesAgeBasedFields.tsx
export const AccessoriesAgeBasedFields = () => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField name="jumlahDewasa" label="Jumlah Dewasa" type="number" min={0} />
      <FormField name="jumlahAnak" label="Jumlah Anak" type="number" min={0} />
    </div>
  )
}
```

**Tasks:**

- [ ] Create 3 field components
- [ ] Implement validation untuk setiap type
- [ ] Add proper TypeScript types
- [ ] Style consistency dengan existing design

### **Phase 4: Integration & Testing**

**Timeline:** 1-2 days
**Priority:** MEDIUM

#### **Task 4.1: Integration Testing**

**Tasks:**

- [ ] Test complete flow untuk setiap category type
- [ ] Verify form data transformation ke ProductSize format
- [ ] Test API integration dengan dynamic forms
- [ ] Validate data consistency di database

#### **Task 4.2: User Acceptance Testing**

**Tasks:**

- [ ] Test user experience untuk setiap flow
- [ ] Verify error handling dan validation messages
- [ ] Test performance dengan various data sizes
- [ ] Get feedback dari actual users

## 🔧 **Technical Specifications**

### **Form Data Flow:**

```
User Input → Category Detection → Strategy Selection → Form Rendering → Data Transformation → ProductSize API → Database
```

### **Data Transformation Examples:**

#### **Accessories Age-Based (Sarung):**

```typescript
// Input: { jumlahDewasa: 10, jumlahAnak: 5 }
// Transformation:
const sizes = [
  { ageCategory: 'ADULT', size: 'UNIVERSAL', quantity: 10 },
  { ageCategory: 'CHILD', size: 'UNIVERSAL', quantity: 5 },
]
// API Payload: { sizes: JSON.stringify(sizes) }
```

#### **Accessories Universal (Anting):**

```typescript
// Input: { jumlah: 3 }
// Transformation:
const sizes = [{ ageCategory: 'UNIVERSAL', size: 'UNIVERSAL', quantity: 3 }]
// API Payload: { sizes: JSON.stringify(sizes) }
```

#### **Clothing (Baju):**

```typescript
// Input: { size_S: 2, size_M: 5, size_L: 3 }
// Transformation:
const sizes = [
  { ageCategory: 'UNIVERSAL', size: 'S', quantity: 2 },
  { ageCategory: 'UNIVERSAL', size: 'M', quantity: 5 },
  { ageCategory: 'UNIVERSAL', size: 'L', quantity: 3 },
]
// API Payload: { sizes: JSON.stringify(sizes) }
```

### **Validation Rules:**

- **Required Field Validation:** Category-specific required fields
- **Type Validation:** Number only untuk quantity fields
- **Range Validation:** Min 0 untuk semua quantities
- **Business Logic:** At least 1 size harus diisi

## 📊 **Success Criteria**

### **Functional Requirements:**

- [ ] Form dynamically adjusts fields based on selected category type
- [ ] Data correctly transforms ke ProductSize format
- [ ] All category types supported (clothing, accessories_age_based, accessories_universal)
- [ ] Backward compatibility maintained dengan existing products
- [ ] No data migration required untuk existing products

### **Non-Functional Requirements:**

- [ ] Form performance < 200ms render time
- [ ] Zero breaking changes kepada existing API
- [ ] Full TypeScript type safety
- [ ] Consistent UI/UX dengan existing design system
- [ ] Proper error handling dan validation feedback

### **Business Requirements:**

- [ ] User can create all accessories types dengan appropriate fields
- [ ] Data entry time reduced oleh 40% untuk accessories
- [ ] Zero training required untuk existing users
- [ ] Support untuk future category types

## ⚠️ **Risk Assessment**

### **Technical Risks:**

| **Risk**                  | **Probability** | **Impact** | **Mitigation**                          |
| ------------------------- | --------------- | ---------- | --------------------------------------- |
| Form complexity increases | Medium          | Low        | Incremental development, proper testing |
| Performance impact        | Low             | Medium     | Memoization, efficient rendering        |
| Type safety issues        | Low             | High       | Comprehensive TypeScript testing        |

### **Business Risks:**

| **Risk**                 | **Probability** | **Impact** | **Mitigation**                 |
| ------------------------ | --------------- | ---------- | ------------------------------ |
| User adoption resistance | Medium          | Medium     | User training, gradual rollout |
| Category expansion needs | High            | Low        | Flexible strategy pattern      |

## 📈 **Benefits Analysis**

### **User Experience Benefits:**

- ✅ **Contextual Forms:** Field yang relevan sesuai kategori
- ✅ **Reduced Friction:** Tidak perlu manual workarounds
- ✅ **Faster Data Entry:** Field yang sesuai kebutuhan
- ✅ **Error Prevention:** Validasi yang spesifik per tipe

### **Technical Benefits:**

- ✅ **Leverage Existing:** ProductSize system sudah robust
- ✅ **Minimal Changes:** Hanya 1 database column
- ✅ **Scalable:** Mudah tambah strategy baru
- ✅ **Type Safe:** Full TypeScript support

### **Business Benefits:**

- ✅ **Faster Onboarding:** New categories mudah ditambah
- ✅ **Data Quality:** Structured input per category
- ✅ **Cost Effective:** Minimal development effort
- ✅ **Future Proof:** Flexible untuk ekspansi

## 📅 **Implementation Timeline**

### **Week 1: Foundation**

- **Day 1-2:** Database schema update + API enhancement
- **Day 3-5:** Core strategy pattern implementation

### **Week 2: Development**

- **Day 1-3:** Dynamic form component development
- **Day 4-5:** Component integration + basic testing

### **Week 3: Testing & Refinement**

- **Day 1-2:** Comprehensive integration testing
- **Day 3:** User acceptance testing
- **Day 4-5:** Bug fixes + refinements

## 🎯 **MVP Definition**

### **Minimum Viable Product:**

1. ✅ Category type field added to database
2. ✅ Dynamic form rendering untuk 3 category types
3. ✅ Data transformation ke ProductSize format
4. ✅ Basic validation dan error handling
5. ✅ Integration dengan existing products API

### **Post-MVP Enhancements:**

- Advanced validation rules
- Business intelligence integration
- Performance optimization
- Additional category types

---

## 📝 **Notes & Considerations**

### **Dependencies:**

- ✅ Existing ProductSize system (no changes needed)
- ✅ Existing API routes (minimal enhancement)
- ✅ Current UI components (extend, not replace)

### **Assumptions:**

- Existing Product + ProductSize schema sufficient
- Current validation patterns can be extended
- No need untuk database migration selain column addition
- Users comfortable dengan dynamic form behavior

### **Success Metrics:**

- 📊 Data entry time reduction: 40%
- 🎯 User satisfaction: >90%
- 🔧 Zero breaking changes: 100%
- 📈 Category adoption rate: >80%

---

_Created: 2025-10-22_
_Priority: HIGH - Improve user experience untuk accessories management_
_Estimated Duration: 2-3 weeks_
_Team: Frontend + Backend coordination required_
