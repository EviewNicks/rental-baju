
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
  - [x] Kasir table created successfully
  - [x] Migration generated without errors
  - [x] TypeScript types updated

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
  - [x] kasirId field added successfully
  - [x] Foreign key relationship established
  - [x] Migration compatible dengan existing data

### **Task 1.3: Run Database Migration - TODO**

- **Action**: Execute migration untuk schema changes
- **Commands**:
  ```bash
  npx prisma migrate dev --name add-kasir-table
  npx prisma generate
  ```
- **Acceptance**:
  - [x] Migration executed successfully
  - [x] Prisma client updated
  - [x] Database schema verified

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
  - [x] POST endpoint working dengan validation
  - [x] GET endpoint dengan pagination
  - [x] Error handling implemented
  - [x] Rate limiting applied

### **Task 2.2: Implement KasirService - TODO**

- **File**: `features/kasir/services/kasirService.ts`
- **Action**: Create service layer untuk kasir operations
- **Methods**:
  - `createKasir(data: CreateKasirRequest): Promise<Kasir>`
  - `getKasirList(params: KasirQueryParams): Promise<KasirListResponse>`
  - `getKasirById(id: string): Promise<Kasir>`
- **Pattern**: Following PenyewaService implementation
- **Acceptance**:
  - [x] Service methods implemented
  - [x] Database operations working
  - [x] Error handling completed
  - [x] Input validation

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
  - [x] Create kasir schema validated
  - [x] Query parameter schema working
  - [x] Error messages in Indonesian

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
  - [x] All kasir types defined
  - [x] Consistent dengan existing type patterns
  - [x] Full type safety

---

## <🎨 **STORY 3: Kasir Management UI Implementation**

### **Task 3.1: Update OwnerSidebar dengan Kasir Menu - TODO**

- **File**: `components/layout/OwnerSidebar.tsx`
- **Action**: Tambah "Manage Kasir" menu ke sidebar
- **Changes**:
  - Add new menu item with appropriate icon
  - Link to `/owner/manage-kasir`
  - Follow existing menu pattern and styling
- **Pattern**: Consistent dengan existing "Manage Product" menu
- **Acceptance**:
  - [x] Menu item added successfully
  - [x] Navigation works correctly
  - [x] Styling consistent with existing menus
  - [x] Icon appropriate for kasir management

### **Task 3.2: Create Kasir Management Routes - TODO**

- **Files**:
  - `app/owner/manage-kasir/page.tsx` - List page
  - `app/owner/manage-kasir/add/page.tsx` - Add new kasir
  - `app/owner/manage-kasir/edit/[id]/page.tsx` - Edit kasir
- **Action**: Create route structure untuk kasir management
- **Pattern**: Following producer/manage-product route structure
- **Acceptance**:
  - [x] All routes created successfully
  - [x] Route protection working (owner role only)
  - [x] Loading states implemented
  - [x] Error boundaries in place

### **Task 3.3: Create KasirListPage Component - TODO**

- **File**: `features/kasir/components/management/KasirListPage.tsx`
- **Action**: Create comprehensive CRUD interface untuk kasir management
- **Features**:
  - Paginated kasir list dengan search
  - Add/Edit/Delete operations
  - Status toggle (active/inactive)
  - Bulk actions (optional)
  - Export functionality
- **Pattern**: Following ProductListPage implementation
- **Acceptance**:
  - [x] List renders with pagination
  - [x] Search functionality working
  - [x] CRUD operations functional
  - [x] Error handling implemented
  - [x] Loading states with skeleton

### **Task 3.4: Create KasirForm Component - TODO**

- **File**: `features/kasir/components/management/KasirForm.tsx`
- **Action**: Create form untuk add/edit kasir
- **Features**:
  - Form validation dengan Indonesian messages
  - File upload untuk profile photo (optional)
  - Role-based field visibility
  - Auto-save draft functionality
  - Form reset on success
- **Pattern**: Following ProductForm implementation
- **Acceptance**:
  - [x] Form validation working
  - [x] Submit functionality operational
  - [x] Edit form loads existing data
  - [x] Success/error notifications
  - [x] Mobile responsive design

### **Task 3.5: Create useKasirManagement Hook - TODO**

- **File**: `features/kasir/hooks/useKasirManagement.ts`
- **Action**: Create custom hook untuk kasir management operations
- **Features**:
  - CRUD operations dengan optimistic updates
  - Pagination dan search state management
  - Bulk operations support
  - Caching untuk performance
  - Error retry logic
- **Pattern**: Following useProductManagement hook
- **Acceptance**:
  - [x] All CRUD operations working
  - [x] Pagination state managed
  - [x] Search functionality integrated
  - [x] Optimistic updates implemented
  - [x] Error handling with retry

---

## <⚙️ **STORY 4: Transaction Flow Integration**

### **Task 4.1: Create CashierSelectionStep Component - TODO**

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

### **Task 4.2: Create useKasir Hook - TODO**

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

### **Task 4.3: Update TransactionFormPage - TODO**

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

### **Task 4.4: Update useTransactionForm Hook - TODO**

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

### **Task 4.5: Update Transaction Workflow Config - TODO**

- **File**: `features/kasir/lib/constants/workflowConfig.ts`
- **Action**: Update workflow steps config
- **Changes**:
  ```typescript
  export const transactionFormSteps = [
    { id: 1, title: 'Pilih Produk' },
    { id: 2, title: 'Data Penyewa' },
    { id: 3, title: 'Pilih Kasir' },     // NEW
    { id: 4, title: 'Ringkasan' }       // Renumbered
  ]
  ```
- **Acceptance**:
  - [ ] 4 steps configured correctly
  - [ ] Step order logical
  - [ ] All step validations updated

### **Task 4.6: Update TransaksiService - TODO**

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

### **Task 4.7: Update API Validation - TODO**

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

### **Task 5.1: Kasir Management Unit Testing - TODO**

- **Files**:
  - `features/kasir/services/kasirService.test.ts`
  - `features/kasir/hooks/useKasirManagement.test.ts`
  - `features/kasir/components/management/KasirListPage.test.tsx`
  - `features/kasir/components/management/KasirForm.test.tsx`
- **Action**: Create comprehensive unit tests untuk management UI
- **Coverage**: Minimum 80%
- **Acceptance**:
  - [ ] Service layer tests
  - [ ] Hook functionality tests
  - [ ] Component rendering tests
  - [ ] Form validation tests

### **Task 5.2: Transaction Flow Unit Testing - TODO**

- **Files**:
  - `features/kasir/hooks/useKasir.test.ts`
  - `features/kasir/components/form/CashierSelectionStep.test.tsx`
  - `features/kasir/hooks/useTransactionForm.test.ts`
- **Action**: Create unit tests untuk transaction flow integration
- **Coverage**: Minimum 80%
- **Acceptance**:
  - [ ] Kasir selection component tests
  - [ ] Transaction form hook tests
  - [ ] Integration workflow tests
  - [ ] Coverage requirements met

### **Task 5.3: Integration Testing - TODO**

- **Files**: `__tests__/integration/kasir/`
- **Action**: Test complete cashier flow
- **Scenarios**:
  - Create kasir → Manage kasir → Select in transaction → Complete transaction
  - Invalid kasir handling
  - Concurrent transaction scenarios
  - Role-based access testing
- **Acceptance**:
  - [ ] End-to-end cashier flow working
  - [ ] Error scenarios handled
  - [ ] Database integrity maintained
  - [ ] Role permissions enforced

### **Task 5.4: E2E Testing - TODO**

- **Files**: `__tests__/playwright/kasir/`
- **Action**: User journey testing
- **Scenarios**:
  - Owner: Create/manage kasir → View in dashboard
  - Kasir: Login → Process transaction with cashier selection
  - Mobile responsiveness
  - Accessibility compliance
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
  - Image optimization untuk kasir photos
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
  - Audit trail untuk kasir operations
- **Acceptance**:
  - [ ] Rate limiting active
  - [ ] All inputs sanitized
  - [ ] Proper authorization checks
  - [ ] Audit logging functional

---

## <🎯 **CRITICAL PATH ANALYSIS**

### **Week 1: Foundation**

- **Day 1-2**: Database schema (STORY 1) ✅ **COMPLETED**
- **Day 3-4**: API layer implementation (STORY 2) ✅ **COMPLETED**
- **Day 5**: Kasir Management UI foundation (STORY 3.1-3.3) **NEW**

### **Week 2: Integration**

- **Day 1-2**: Kasir Management completion + Transaction flow integration (STORY 3.4-3.5 + STORY 4)
- **Day 3**: Testing setup and basic tests (STORY 5.1-5.2)
- **Day 4-5**: Integration testing and bug fixes (STORY 5.3-5.4 + optimization)

---

## <✅ **SUCCESS METRICS**

### **Functional Requirements**

- [ ] Users can manage kasir (CRUD) via owner dashboard
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
EPIC: Kasir Management System [ACTIVE - STORY 4]

├── STORY 1: Database Schema Enhancement [COMPLETED ✅]
│   ├── Task 1.1: Create Kasir Table [COMPLETED ✅]
│   ├── Task 1.2: Update Transaksi Table [COMPLETED ✅]
│   └── Task 1.3: Run Database Migration [PENDING ⏳]

├── STORY 2: API Layer Implementation [COMPLETED ✅]
│   ├── Task 2.1: Create Kasir API Route [COMPLETED ✅]
│   ├── Task 2.2: Implement KasirService [COMPLETED ✅]
│   ├── Task 2.3: Update Validation Schema [COMPLETED ✅]
│   ├── Task 2.4: Update Kasir Types [COMPLETED ✅]
│   ├── Task 2.5: Create API Documentation [COMPLETED ✅]
│   ├── Task 2.6: Role-based Permissions [COMPLETED ✅]
│   └── Task 2.7: Kasir Selection Workflow [COMPLETED ✅]

├── STORY 3: Kasir Management UI Implementation [COMPLETED ✅]
│   ├── Task 3.1: Update OwnerSidebar dengan Kasir Menu [COMPLETED ✅]
│   ├── Task 3.2: Create Kasir Management Routes [COMPLETED ✅]
│   ├── Task 3.3: Create KasirListPage Component [COMPLETED ✅]
│   ├── Task 3.4: Create KasirForm Component [COMPLETED ✅]
│   └── Task 3.5: Create useKasirManagement Hook [COMPLETED ✅]

├── STORY 4: Transaction Flow Integration [TODO]
│   ├── Task 4.1: Create CashierSelectionStep Component [TODO]
│   ├── Task 4.2: Create useKasir Hook [TODO]
│   ├── Task 4.3: Update TransactionFormPage [TODO]
│   ├── Task 4.4: Update useTransactionForm Hook [TODO]
│   ├── Task 4.5: Update Transaction Workflow Config [TODO]
│   ├── Task 4.6: Update TransaksiService [TODO]
│   └── Task 4.7: Update API Validation [TODO]

├── STORY 5: Testing & Integration [TODO]
│   ├── Task 5.1: Kasir Management Unit Testing [TODO]
│   ├── Task 5.2: Transaction Flow Unit Testing [TODO]
│   ├── Task 5.3: Integration Testing [TODO]
│   └── Task 5.4: E2E Testing [TODO]

└── STORY 6: Performance & Security [TODO]
    ├── Task 6.1: Performance Optimization [TODO]
    └── Task 6.2: Security Enhancement [TODO]
```

---

## <🚀 **READY TO START**

**Current Task**: Task 3.1 - Update OwnerSidebar dengan Kasir Menu
**Prerequisites**: Access to development environment, API testing complete
**Dependencies**: Story 1 & 2 completed ✅
**Estimated Timeline**: 2 weeks total (Week 2 beginning)

**Next Immediate Tasks**:
1. Task 3.1: Update OwnerSidebar dengan Kasir Menu
2. Task 3.2: Create Kasir Management Routes
3. Task 3.3: Create KasirListPage Component

---

**EPIC: Dynamic Product Form System [ACTIVE]**

**Created**: 2025-10-22
**Last Updated**: 2025-11-15
**Status**: READY FOR EXECUTION
**Next Review**: After Kasir EPIC Story 1 completion
