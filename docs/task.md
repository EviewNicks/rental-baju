
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

**Implementation Strategy**: Dibagi menjadi 2 sesi untuk optimalisasi dependencies dan risk management

---

## <🔧 **STORY 4A: Backend Integration - Transaction Flow Enhancement**

**Focus**: Server-side kasirId integration ke existing transaction system
**Timeline**: 2-3 days
**Dependencies**: None (can start immediately after Story 2 & 3 completion)
**Risk**: Critical - Mengubah core transaction logic

### **Task 4A.1: Update TransaksiService - BACKEND PRIORITY**

- **File**: `features/kasir/services/transaksiService.ts`
- **Action**: Add kasirId support ke createTransaksiSizeAware method
- **Critical Changes**:
  - Update method signature untuk accept `kasirId?: string`
  - Add kasir validation logic (existence + active status)
  - Include kasir information dalam activity logging
  - Update transaction creation untuk include `kasirId`
- **Implementation Detail**:
  ```typescript
  // Validate kasir if provided
  if (data.kasirId) {
    const kasir = await this.prisma.kasir.findUnique({
      where: { id: data.kasirId, isActive: true }
    })

    if (!kasir) {
      throw new Error('Kasir tidak ditemukan atau tidak aktif')
    }
  }

  // Create transaction with kasirId
  const transaksi = await tx.transaksi.create({
    data: {
      // ... existing fields
      kasirId: data.kasirId, // NEW: Optional cashier assignment
      // ... existing fields
    }
  })

  // Enhanced activity logging
  await tx.aktivitasTransaksi.create({
    data: {
      transaksiId: createdTransaksi.id,
      tipe: 'dibuat',
      deskripsi: `Transaksi ${kode} dibuat${data.kasirId ? ' dengan kasir: ' + kasir.nama : ''}`,
      data: {
        // ... existing data
        kasirId: data.kasirId,
        kasirNama: kasir?.nama || null
      },
      createdBy: this.userId
    }
  })
  ```
- **Acceptance Criteria**:
  - [ ] kasirId validation implemented (exists + active)
  - [ ] Transaction creation includes kasirId (optional untuk backward compatibility)
  - [ ] Activity logging includes cashier information
  - [ ] Error handling untuk invalid kasir
  - [ ] Backward compatibility maintained (kasirId optional)
  - [ ] Type safety untuk CreateTransaksiRequest interface

### **Task 4A.2: Update API Validation Schema - BACKEND PRIORITY**

- **File**: `features/kasir/lib/validation/kasirSchema.ts`
- **Action**: Extend createTransaksiSchema untuk include kasirId
- **Changes**:
  ```typescript
  const createTransaksiSchema = z.object({
    // ... existing fields
    penyewaId: z.string().min(1, 'Penyewa harus dipilih'),
    items: z.array(z.object({
      produkId: z.string().min(1),
      productSizeId: z.string().min(1),
      jumlah: z.number().min(1),
      kondisiAwal: z.string().optional()
    })).min(1, 'Minimal satu produk harus dipilih'),
    kasirId: z.string().min(1, 'Kasir harus dipilih').optional(), // NEW: Optional for backward compatibility
    // ... existing fields
  })
  ```
- **Type Updates**:
  ```typescript
  export interface CreateTransaksiRequest {
    penyewaId: string
    items: Array<{
      produkId: string
      productSizeId: string
      jumlah: number
      kondisiAwal?: string
    }>
    kasirId?: string // NEW: Optional cashier assignment
    tglMulai: string
    tglSelesai?: string
    metodeBayar?: string
    catatan?: string
  }
  ```
- **Acceptance Criteria**:
  - [ ] kasirId field added ke validation schema
  - [ ] Field is optional untuk backward compatibility
  - [ ] Indonesian error messages for kasir validation
  - [ ] Type definitions updated
  - [ ] Zod validation working correctly

### **Task 4A.3: Update API Route Response - BACKEND PRIORITY**

- **File**: `app/api/kasir/transaksi/route.ts`
- **Action**: Update POST handler untuk include kasir information dalam response
- **Changes**:
  - Enhanced response data structure untuk include kasir info
  - Update error handling untuk kasir-specific errors
  - Maintain backward compatibility untuk existing responses
- **Response Enhancement**:
  ```typescript
  // Format response data with kasir information
  const formattedData = {
    // ... existing fields
    kasir: fullTransaksi.kasir ? {
      id: fullTransaksi.kasir.id,
      nama: fullTransaksi.kasir.nama
    } : null, // NEW: Include cashier info in response
    // ... existing fields
  }
  ```
- **Error Handling Enhancement**:
  ```typescript
  // Kasir-specific error handling
  if (error.message.includes('Kasir tidak ditemukan')) {
    return NextResponse.json({
      success: false,
      error: {
        message: error.message,
        code: 'KASIR_NOT_FOUND'
      }
    }, { status: 404 })
  }
  ```
- **Acceptance Criteria**:
  - [ ] Response includes kasir information when available
  - [ ] Backward compatibility maintained (null kasir for old transactions)
  - [ ] Kasir-specific error handling implemented
  - [ ] API response format consistent with existing patterns


## <🎨 **STORY 4B: Frontend Integration - Cashier Selection UI**

**Focus**: Client-side cashier selection components dan form workflow integration
**Timeline**: 3-4 days
**Dependencies**: Story 4A completed (backend API ready)
**Risk**: Medium - UI/UX changes dengan existing form workflow

### **Task 4B.1: Create useKasir Hook - FRONTEND FOUNDATION**

- **File**: `features/kasir/hooks/useKasir.ts`
- **Action**: Create custom hook untuk kasir operations dengan caching
- **Features**:
  - Fetch kasir list untuk selection dropdown
  - Search functionality untuk large kasir lists
  - Loading states dan error handling
  - Caching untuk performance optimization
- **Implementation Pattern**:
  ```typescript
  export const useKasir = () => {
    const [kasirList, setKasirList] = useState<Array<{
      id: string
      nama: string
      isActive: boolean
    }>>([])

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchKasirForSelection = useCallback(async (search?: string) => {
      // Call /api/kasir/kasir/selection endpoint
      // Implement search functionality
      // Handle loading dan error states
    }, [])

    return {
      kasirList,
      loading,
      error,
      fetchKasirForSelection,
      searchKasir: (query: string) => fetchKasirForSelection(query)
    }
  }
  ```
- **Acceptance Criteria**:
  - [ ] Hook fetches kasir list from selection API
  - [ ] Search functionality working
  - [ ] Loading states implemented
  - [ ] Error handling with user-friendly messages
  - [ ] Caching untuk performance (5-minute cache)
  - [ ] TypeScript type safety

### **Task 4B.2: Create CashierSelectionStep Component - FRONTEND UI**

- **File**: `features/kasir/components/form/CashierSelectionStep.tsx`
- **Action**: Create component untuk cashier selection dengan search functionality
- **Features**:
  - Searchable dropdown/select component
  - Real-time search dengan debouncing
  - Validation untuk required field (when enabled)
  - Loading states dan error handling
  - Mobile responsive design
- **UI Implementation**:
  ```typescript
  interface CashierSelectionStepProps {
    selectedKasirId: string | undefined
    onKasirSelect: (kasirId: string | undefined) => void
    error?: string
    required?: boolean // For future mandatory cashier selection
  }

  export const CashierSelectionStep: React.FC<CashierSelectionStepProps> = ({
    selectedKasirId,
    onKasirSelect,
    error,
    required = false
  }) => {
    const { kasirList, loading, fetchKasirForSelection, searchKasir } = useKasir()

    // Component implementation dengan search, validation, error handling
  }
  ```
- **Acceptance Criteria**:
  - [ ] Component renders kasir selection dropdown
  - [ ] Search functionality with debouncing (300ms)
  - [ ] Loading states during search/data fetch
  - [ ] Error handling dengan user-friendly messages
  - [ ] Form validation integration
  - [ ] Mobile responsive design
  - [ ] Accessibility compliance (ARIA labels, keyboard navigation)

### **Task 4B.3: Update useTransactionForm Hook - FRONTEND STATE**

- **File**: `features/kasir/hooks/useTransactionForm.ts`
- **Action**: Integrate cashier state management ke existing form hook
- **Changes**:
  - Add `selectedKasirId` state
  - Add `setSelectedKasir` method
  - Update form validation logic
  - Update submission payload preparation
  - Add cashier step management
- **State Management Updates**:
  ```typescript
  export const useTransactionForm = () => {
    // ... existing states

    // NEW: Cashier state management
    const [selectedKasirId, setSelectedKasirId] = useState<string | undefined>()

    // Update form validation
    const validateCurrentStep = useCallback((step: number) => {
      // ... existing validation logic

      if (step === 3) { // New cashier step
        // For now, cashier is optional (future: add required validation)
        return true
      }

      // ... existing validation logic
    }, [/* existing dependencies */, selectedKasirId])

    // Update submission payload
    const createTransactionPayload = useCallback(() => {
      return {
        // ... existing payload data
        kasirId: selectedKasirId, // NEW: Include selected cashier
        // ... existing payload data
      }
    }, [/* existing dependencies */, selectedKasirId])

    return {
      // ... existing returns
      selectedKasirId,
      setSelectedKasirId,
      // ... existing returns
    }
  }
  ```
- **Acceptance Criteria**:
  - [ ] Cashier state management integrated
  - [ ] Form validation includes cashier step
  - [ ] Submission payload includes kasirId
  - [ ] Backward compatibility maintained
  - [ ] TypeScript type safety
  - [ ] Form navigation logic updated

### **Task 4B.4: Update TransactionFormPage - FRONTEND INTEGRATION**

- **File**: `features/kasir/components/form/TransactionFormPage.tsx`
- **Action**: Integrate CashierSelectionStep ke existing form workflow
- **Changes**:
  - Add CashierSelectionStep import dan usage
  - Update form steps dari 3 ke 4
  - Add step 3 (Cashier Selection) rendering logic
  - Update navigation dan validation flow
  - Add conditional rendering untuk cashier step
- **Form Workflow Updates**:
  ```typescript
  // Add to step rendering logic
  const renderStepContent = (step: number) => {
    switch (step) {
      case 1:
        return <ProductSelectionStep /* ... props */ />
      case 2:
        return <CustomerBiodataStep /* ... props */ />
      case 3: // NEW: Cashier Selection Step
        return (
          <CashierSelectionStep
            selectedKasirId={selectedKasirId}
            onKasirSelect={setSelectedKasirId}
            error={formErrors.kasirId}
          />
        )
      case 4: // Renumbered from 3
        return <TransactionSummary /* ... props */ />
      default:
        return null
    }
  }
  ```
- **Acceptance Criteria**:
  - [ ] CashierSelectionStep integrated into form workflow
  - [ ] Form steps updated dari 3 ke 4
  - [ ] Step navigation working correctly
  - [ ] Form validation flow includes cashier step
  - [ ] Progress indicators updated
  - [ ] Mobile responsiveness maintained

### **Task 4B.5: Update Transaction Workflow Configuration - FRONTEND CONFIG**

- **File**: `features/kasir/lib/constants/workflowConfig.ts`
- **Action**: Update workflow steps configuration
- **Changes**:
  ```typescript
  export const transactionFormSteps = [
    { id: 1, title: 'Pilih Produk', icon: '📦' },
    { id: 2, title: 'Data Penyewa', icon: '👤' },
    { id: 3, title: 'Pilih Kasir', icon: '💼', description: 'Pilih kasir yang melayani' }, // NEW
    { id: 4, title: 'Ringkasan', icon: '📋' } // Renumbered
  ]

  export const transactionStepValidation = {
    1: ['hasProducts'], // Product validation
    2: ['hasCustomer'], // Customer validation
    3: [], // Cashier validation (optional for now)
    4: ['readyToSubmit'] // Final validation
  }
  ```
- **Acceptance Criteria**:
  - [ ] 4 steps configured correctly
  - [ ] Step order logical (Products → Customer → Kasir → Summary)
  - [ ] Icons dan descriptions added
  - [ ] Validation rules updated
  - [ ] Progress indicators configured



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

- **Day 1-2**: Backend Integration - Transaction Flow Enhancement (STORY 4A)
  - Critical path: Update TransaksiService, API validation, response handling
  - Backend testing untuk kasirId integration
- **Day 3**: Frontend Foundation - Cashier UI Components (STORY 4B.1-4B.2)
  - Create useKasir hook dan CashierSelectionStep component
- **Day 4**: Frontend Integration - Form Workflow (STORY 4B.3-4B.5)
  - Update TransactionFormPage, hooks, dan workflow configuration
- **Day 5**: Integration Testing & Validation (STORY 4B.6 + STORY 5.1-5.2)
  - End-to-end testing dari backend ke frontend
  - Cross-session integration validation

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

## <🔗 **SESSION DEPENDENCIES MATRIX**

### **Backend-to-Frontend Dependencies**

| Backend Task | Frontend Dependencies | Status |
|-------------|-------------------|---------|
| **4A.1: TransaksiService Update** | 4B.3 (useTransactionForm), 4B.4 (TransactionFormPage) | 🔴 CRITICAL PATH |
| **4A.2: API Validation Schema** | 4B.3 (useTransactionForm), 4B.6 (Frontend Testing) | 🔴 CRITICAL PATH |
| **4A.3: API Route Response** | 4B.6 (Frontend Testing), 4B.2 (CashierSelectionStep) | 🟡 MEDIUM PRIORITY |
| **4A.4: Backend Testing** | 4B.6 (Frontend Integration Testing) | 🟡 VALIDATION |

### **Cross-Session Risk Assessment**

| Risk | Impact | Mitigation Strategy |
|------|--------|-------------------|
| Backend API changes break existing functionality | 🔴 HIGH | Comprehensive backward compatibility testing |
| Frontend components depend on backend field changes | 🟡 MEDIUM | Mock backend responses during frontend development |
| Database schema migration conflicts | 🔴 HIGH | Staged deployment with rollback plan |
| Integration testing coverage gaps | 🟡 MEDIUM | Parallel test development with backend implementation |

### **Session Rollout Strategy**

**Phase 1: Backend Integration (Story 4A)**
- Timeline: 2-3 days
- Risk Level: 🔴 HIGH (Core transaction logic changes)
- Success Criteria: API accepts kasirId, maintains backward compatibility
- Rollback Plan: Feature flag for kasirId functionality

**Phase 2: Frontend Integration (Story 4B)**
- Timeline: 3-4 days (after Story 4A completion)
- Risk Level: 🟡 MEDIUM (UI/UX workflow changes)
- Success Criteria: 4-step form working, kasir selection functional
- Rollback Plan: Revert to 3-step workflow via configuration

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

├── STORY 4: Transaction Flow Integration [TODO - REORGANIZED]
│   ├── STORY 4A: Backend Integration - Transaction Flow Enhancement [BACKEND PRIORITY]
│   │   ├── Task 4A.1: Update TransaksiService [BACKEND PRIORITY]
│   │   ├── Task 4A.2: Update API Validation Schema [BACKEND PRIORITY]
│   │   ├── Task 4A.3: Update API Route Response [BACKEND PRIORITY]
│   │   └── Task 4A.4: Backend Integration Testing [BACKEND PRIORITY]
│   └── STORY 4B: Frontend Integration - Cashier Selection UI [FRONTEND DEPENDS ON 4A]
│       ├── Task 4B.1: Create useKasir Hook [FRONTEND FOUNDATION]
│       ├── Task 4B.2: Create CashierSelectionStep Component [FRONTEND UI]
│       ├── Task 4B.3: Update useTransactionForm Hook [FRONTEND STATE]
│       ├── Task 4B.4: Update TransactionFormPage [FRONTEND INTEGRATION]
│       ├── Task 4B.5: Update Transaction Workflow Config [FRONTEND CONFIG]
│       └── Task 4B.6: Frontend Integration Testing [FRONTEND TESTING]

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

**Current Phase**: Story 4 - Transaction Flow Integration (Backend Session Priority)
**Current Session**: STORY 4A - Backend Integration
**Prerequisites**: Stories 1, 2, & 3 completed ✅
**Dependencies**: Backend API ready, kasir management UI completed
**Estimated Timeline**: 2 weeks total (Story 4A: 2-3 days, Story 4B: 3-4 days)

**Next Immediate Tasks (BACKEND PRIORITY)**:
1. **Task 4A.1**: Update TransaksiService dengan kasirId support
2. **Task 4A.2**: Update API validation schema
3. **Task 4A.3**: Update API route response format
4. **Task 4A.4**: Backend integration testing

**Following Session (FRONTEND - DEPENDS ON BACKEND)**:
1. **Task 4B.1**: Create useKasir hook (foundation)
2. **Task 4B.2**: Create CashierSelectionStep component
3. **Task 4B.3**: Update useTransactionForm hook
4. **Task 4B.4**: Update TransactionFormPage workflow
5. **Task 4B.5**: Update workflow configuration
6. **Task 4B.6**: Frontend integration testing

---

**EPIC: Dynamic Product Form System [ACTIVE]**

**Created**: 2025-10-22
**Last Updated**: 2025-11-15
**Status**: READY FOR EXECUTION
**Next Review**: After Kasir EPIC Story 1 completion
