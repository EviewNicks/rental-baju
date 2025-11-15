
# =🚀 **EPIC: Kasir Management System**

**Objective**: Implement kasir selection feature dalam transaksi flow untuk tracking kasir yang melayani transaksi.

**Timeline**: 1-2 weeks
**Priority**: HIGH
**Team**: Frontend + Backend coordination

---

## <🎯 **STORY 1: Database Schema Enhancement**

### **Task 1.1: Create Kasir Table - TODO**

- **File**: `prisma/schema.prisma`
- **Action**: Add Kasir model dengan basic fields
- **Schema**:
  ```prisma
  model Kasir {
    id        String   @id @default(cuid())
    nama      String
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    createdBy String?

    // Relations
    transaksi Transaksi[]
  }
  ```
- **Acceptance**:
  - [ ] Kasir table created successfully
  - [ ] Migration generated without errors
  - [ ] TypeScript types updated

### **Task 1.2: Update Transaksi Table - TODO**

- **File**: `prisma/schema.prisma`
- **Action**: Add kasirId field ke Transaksi model
- **Schema**:
  ```prisma
  model Transaksi {
    // ... existing fields
    kasirId String?
    kasir   Kasir? @relation(fields: [kasirId], references: [id])
  }
  ```
- **Acceptance**:
  - [ ] kasirId field added successfully
  - [ ] Foreign key relationship established
  - [ ] Migration compatible dengan existing data

### **Task 1.3: Run Database Migration - TODO**

- **Action**: Execute migration untuk schema changes
- **Commands**:
  ```bash
  npx prisma migrate dev --name add-kasir-table
  npx prisma generate
  ```
- **Acceptance**:
  - [ ] Migration executed successfully
  - [ ] Prisma client updated
  - [ ] Database schema verified

---

## <🔧 **STORY 2: API Layer Implementation**

### **Task 2.1: Create Kasir API Route - TODO**

- **File**: `app/api/kasir/kasir/route.ts`
- **Action**: Create CRUD API untuk kasir management
- **Endpoints**:
  - POST /api/kasir/kasir - Create new kasir
  - GET /api/kasir/kasir - Get paginated kasir list
  - GET /api/kasir/kasir/[id] - Get kasir by ID
- **Pattern**: Following exact pattern of penyewa route.ts
- **Acceptance**:
  - [ ] POST endpoint working dengan validation
  - [ ] GET endpoint dengan pagination
  - [ ] Error handling implemented
  - [ ] Rate limiting applied

### **Task 2.2: Implement KasirService - TODO**

- **File**: `features/kasir/services/kasirService.ts`
- **Action**: Create service layer untuk kasir operations
- **Methods**:
  - `createKasir(data: CreateKasirRequest): Promise<Kasir>`
  - `getKasirList(params: KasirQueryParams): Promise<KasirListResponse>`
  - `getKasirById(id: string): Promise<Kasir>`
- **Pattern**: Following PenyewaService implementation
- **Acceptance**:
  - [ ] Service methods implemented
  - [ ] Database operations working
  - [ ] Error handling completed
  - [ ] Input validation

### **Task 2.3: Update Validation Schema - TODO**

- **File**: `features/kasir/lib/validation/kasirSchema.ts`
- **Action**: Add kasir validation schemas
- **Schemas**:
  ```typescript
  const createKasirSchema = z.object({
    nama: z.string().min(1, 'Nama kasir harus diisi').max(255)
  })

  const kasirQuerySchema = z.object({
    page: z.string().transform(Number),
    limit: z.string().transform(Number),
    search: z.string().optional()
  })
  ```
- **Acceptance**:
  - [ ] Create kasir schema validated
  - [ ] Query parameter schema working
  - [ ] Error messages in Indonesian

### **Task 2.4: Update Kasir Types - TODO**

- **File**: `features/kasir/types/index.ts`
- **Action**: Add kasir-related TypeScript types
- **Types**:
  ```typescript
  export interface CreateKasirRequest {
    nama: string
  }

  export interface Kasir {
    id: string
    nama: string
    createdAt: Date
    updatedAt: Date
    createdBy?: string
  }
  ```
- **Acceptance**:
  - [ ] All kasir types defined
  - [ ] Consistent dengan existing type patterns
  - [ ] Full type safety

---

## <🎨 **STORY 3: UI Components Implementation**

### **Task 3.1: Create CashierSelectionStep Component - TODO**

- **File**: `features/kasir/components/form/CashierSelectionStep.tsx`
- **Action**: Create component untuk kasir selection
- **Features**:
  - Search/filter kasir list
  - Select kasir dari dropdown
  - Validation untuk required field
  - Integration dengan form workflow
- **Pattern**: Following CustomerBiodataStep pattern
- **Acceptance**:
  - [ ] Component renders correctly
  - [ ] Search functionality working
  - [ ] Kasir selection functional
  - [ ] Form validation integrated

### **Task 3.2: Create useKasir Hook - TODO**

- **File**: `features/kasir/hooks/useKasir.ts`
- **Action**: Create custom hook untuk kasir operations
- **Features**:
  - Fetch kasir list dengan pagination
  - Create new kasir
  - Search kasir by name
  - Error handling
- **Pattern**: Following usePenyewa hook pattern
- **Acceptance**:
  - [ ] Hook provides kasir list
  - [ ] Create kasir functionality
  - [ ] Search capabilities
  - [ ] Loading states

### **Task 3.3: Update TransactionFormPage - TODO**

- **File**: `features/kasir/components/form/TransactionFormPage.tsx`
- **Action**: Integrate CashierSelectionStep ke form workflow
- **Changes**:
  - Add CashierSelectionStep import
  - Update form steps dari 3 ke 4
  - Add cashier state management
  - Add new step rendering logic
- **Acceptance**:
  - [ ] CashierSelectionStep integrated
  - [ ] Form workflow updated ke 4 steps
  - [ ] Navigation between steps working
  - [ ] State management correct

### **Task 3.4: Update useTransactionForm Hook - TODO**

- **File**: `features/kasir/hooks/useTransactionForm.ts`
- **Action**: Add kasir management ke form state
- **Changes**:
  - Add cashier state
  - Add setCashier method
  - Update validation logic
  - Update submission payload
- **Acceptance**:
  - [ ] Cashier state managed
  - [ ] Form validation includes cashier
  - [ ] Submission payload includes kasirId
  - [ ] Backward compatibility maintained

---

## <⚙️ **STORY 4: Transaction Flow Integration**

### **Task 4.1: Update Transaction Workflow Config - TODO**

- **File**: `features/kasir/lib/constants/workflowConfig.ts`
- **Action**: Update workflow steps config
- **Changes**:
  ```typescript
  export const transactionFormSteps = [
    { id: 1, title: 'Pilih Produk' },
    { id: 2, title: 'Pilih Kasir' },     // NEW
    { id: 3, title: 'Data Penyewa' },   // Renumbered
    { id: 4, title: 'Ringkasan' }       // Renumbered
  ]
  ```
- **Acceptance**:
  - [ ] 4 steps configured correctly
  - [ ] Step order logical
  - [ ] All step validations updated

### **Task 4.2: Update TransaksiService - TODO**

- **File**: `features/kasir/services/transaksiService.ts`
- **Action**: Add kasirId ke transaction creation
- **Changes**:
  - Update createTransaksiSizeAware method
  - Add kasirId parameter
  - Validate kasir existence
  - Include kasir in activity logging
- **Acceptance**:
  - [ ] kasirId included dalam transaction creation
  - [ ] Kasir validation implemented
  - [ ] Activity logging includes cashier info
  - [ ] Error handling for invalid kasir

### **Task 4.3: Update API Validation - TODO**

- **File**: `app/api/kasir/transaksi/route.ts`
- **Action**: Update transaction creation schema
- **Changes**:
  ```typescript
  const createTransaksiSchema = z.object({
    // ... existing fields
    kasirId: z.string().min(1, 'Kasir harus dipilih')
  })
  ```
- **Acceptance**:
  - [ ] kasirId field validated
  - [ ] Required field validation
  - [ ] Error message in Indonesian

---

## <✅ **STORY 5: Testing & Integration**

### **Task 5.1: Unit Testing - TODO**

- **Files**:
  - `features/kasir/services/kasirService.test.ts`
  - `features/kasir/hooks/useKasir.test.ts`
  - `features/kasir/components/form/CashierSelectionStep.test.tsx`
- **Action**: Create comprehensive unit tests
- **Coverage**: Minimum 80%
- **Acceptance**:
  - [ ] Service layer tests
  - [ ] Hook functionality tests
  - [ ] Component rendering tests
  - [ ] Coverage requirements met

### **Task 5.2: Integration Testing - TODO**

- **Files**: `__tests__/integration/kasir/`
- **Action**: Test complete cashier flow
- **Scenarios**:
  - Create kasir → Select in transaction → Complete transaction
  - Invalid kasir handling
  - Concurrent transaction scenarios
- **Acceptance**:
  - [ ] End-to-end cashier flow working
  - [ ] Error scenarios handled
  - [ ] Database integrity maintained

### **Task 5.3: E2E Testing - TODO**

- **Files**: `__tests__/playwright/kasir/`
- **Action**: User journey testing
- **Scenarios**:
  - Complete transaction dengan cashier selection
  - Form validation scenarios
  - Mobile responsiveness
- **Acceptance**:
  - [ ] User journey smooth
  - [ ] Mobile friendly
  - [ ] Accessibility compliant

---

## <📊 **STORY 6: Performance & Security**

### **Task 6.1: Performance Optimization - TODO**

- **Action**: Optimize kasir loading and caching
- **Optimizations**:
  - Implement caching untuk kasir list
  - Optimize database queries
  - Lazy loading untuk large kasir lists
- **Acceptance**:
  - [ ] Kasir list loads < 500ms
  - [ ] Caching implemented
  - [ ] Memory usage optimized

### **Task 6.2: Security Enhancement - TODO**

- **Action**: Add security measures
- **Security**:
  - Rate limiting untuk kasir creation
  - Input sanitization
  - Permission validation
- **Acceptance**:
  - [ ] Rate limiting active
  - [ ] All inputs sanitized
  - [ ] Proper authorization checks

---

## <🎯 **CRITICAL PATH ANALYSIS**

### **Week 1: Foundation**

- **Day 1-2**: Database schema (STORY 1)
- **Day 3-4**: API layer implementation (STORY 2)
- **Day 5**: Basic UI components (STORY 3.1-3.2)

### **Week 2: Integration**

- **Day 1-2**: Form integration (STORY 3.3-3.4 + STORY 4)
- **Day 3**: Testing setup and basic tests (STORY 5.1)
- **Day 4-5**: Integration testing and bug fixes (STORY 5.2 + optimization)

---

## <✅ **SUCCESS METRICS**

### **Functional Requirements**

- [ ] Users can select kasir dalam transaksi flow
- [ ] Kasir management CRUD operations working
- [ ] Form validation includes cashier selection
- [ ] Transaction includes kasir information
- [ ] 4-step workflow implemented smoothly

### **Performance Requirements**

- [ ] Kasir list loads < 500ms
- [ ] Form renders < 200ms
- [ ] Zero breaking changes kepada existing features
- [ ] Full TypeScript type safety

### **User Experience Requirements**

- [ ] Intuitive cashier selection interface
- [ ] Search functionality for kasir
- [ ] Clear error messages
- [ ] Mobile responsive design
- [ ] Accessibility compliance

---

## <⚠️ **RISK ASSESSMENT**

### **High Priority Risks**

1. **Database Migration Issues**
   - **Mitigation**: Backup database + test migration on staging
   - **Owner**: Backend Developer

2. **Form Complexity Impact**
   - **Mitigation**: Progressive enhancement + user testing
   - **Owner**: Frontend Developer

### **Medium Priority Risks**

1. **Performance Impact**
   - **Mitigation**: Caching + query optimization
   - **Owner**: Backend Developer

2. **User Adoption**
   - **Mitigation**: Intuitive UI + minimal training required
   - **Owner**: UX Designer

---

## <📋 **TASK STATUS TRACKING**

### **Progress Board**

```
EPIC: Kasir Management System [PLANNED]

├── STORY 1: Database Schema Enhancement [TODO]
│   ├── Task 1.1: Create Kasir Table [TODO]
│   ├── Task 1.2: Update Transaksi Table [TODO]
│   └── Task 1.3: Run Database Migration [TODO]

├── STORY 2: API Layer Implementation [TODO]
│   ├── Task 2.1: Create Kasir API Route [TODO]
│   ├── Task 2.2: Implement KasirService [TODO]
│   ├── Task 2.3: Update Validation Schema [TODO]
│   └── Task 2.4: Update Kasir Types [TODO]

├── STORY 3: UI Components Implementation [TODO]
│   ├── Task 3.1: Create CashierSelectionStep Component [TODO]
│   ├── Task 3.2: Create useKasir Hook [TODO]
│   ├── Task 3.3: Update TransactionFormPage [TODO]
│   └── Task 3.4: Update useTransactionForm Hook [TODO]

├── STORY 4: Transaction Flow Integration [TODO]
│   ├── Task 4.1: Update Transaction Workflow Config [TODO]
│   ├── Task 4.2: Update TransaksiService [TODO]
│   └── Task 4.3: Update API Validation [TODO]

├── STORY 5: Testing & Integration [TODO]
│   ├── Task 5.1: Unit Testing [TODO]
│   ├── Task 5.2: Integration Testing [TODO]
│   └── Task 5.3: E2E Testing [TODO]

└── STORY 6: Performance & Security [TODO]
    ├── Task 6.1: Performance Optimization [TODO]
    └── Task 6.2: Security Enhancement [TODO]
```

---

## <🚀 **READY TO START**

**First Task**: Task 1.1 - Create Kasir Table
**Prerequisites**: Database backup, access to development environment
**Dependencies**: None (blocking all subsequent tasks)
**Estimated Timeline**: 2 weeks total

---

**EPIC: Dynamic Product Form System [ACTIVE]**

**Created**: 2025-10-22
**Last Updated**: 2025-11-15
**Status**: READY FOR EXECUTION
**Next Review**: After Kasir EPIC Story 1 completion
