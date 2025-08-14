# FE-RPK-45: Frontend Development - Material Management UI (Simplified)

**Parent Task**: RPK-45  
**Phase**: 2 - Frontend Development  
**Priority**: High  
**Sprint**: 2-3 (Week 3-6)  
**Story Points**: 6 (Reduced from 8)  
**Developer**: Frontend Team  
**Created**: 2025-08-13  
**Updated**: 2025-08-14 (Simplified & Navigation Pattern Revised)  
**Status**: Revised - Simplified for MVP  
**Dependencies**: BE-RPK-45 (Backend APIs must be completed)

---

## =� Simplification Summary

**Scope Reduction**: Advanced features removed to focus on MVP functionality  
**Navigation Pattern**: Unified Material/Category/Color management with tab-based navigation  
**Development Effort**: Reduced from 8 to 6 story points (25% reduction)  
**Architecture Compliance**: Consistent page-based pattern across all management features  
**Reference**: See `/docs/analyze.md` for detailed user flow analysis

---

## =� Phase Overview

**Focus**: Simplified Material Management System with unified navigation pattern for Material, Category, and Color management.

**Objective**: Build intuitive, consistent UI components that integrate seamlessly with backend APIs and provide excellent user experience with reduced complexity for MVP.

**Key Deliverables**:
- Unified Material/Category/Color management page with tab navigation
- Core Material CRUD operations (simplified scope)
- ProductType integration with basic cost calculation
- Enhanced Product creation form with material workflow
- Mobile-responsive design with accessibility compliance
- Focused E2E testing for core user workflows

**Removed from MVP Scope**:
- Price History Tracking functionality
- Bulk Import operations
- Advanced cost visualization and reporting
- Complex audit trail systems

---

## <� Sprint Breakdown

### Sprint 2: Unified Management Page & Core Material CRUD (Week 3-4)
**Story Points**: 3

#### Unified Management Page with Tab Navigation
**Tasks**:
- [ ] **[FE-001]** Create ProductManagementPage with Material/Category/Color tabs
- [ ] **[FE-002]** Implement tab navigation with URL hash routing
- [ ] **[FE-003]** Migrate existing Category and Color management to tabs
- [ ] **[FE-004]** Build MaterialTab component with core CRUD operations
- [ ] **[FE-005]** Create MaterialForm component (simplified, no price history)

**Acceptance Criteria**:
- Single page accessible at `/producer/manage-product/materials`
- Tab navigation between Material, Category, and Color management
- URL hash routing preserves tab state on refresh
- Consistent UI patterns across all three tabs
- Material CRUD operations work seamlessly with backend APIs
- Real-time search and filtering with debounce optimization
- Responsive design works on mobile, tablet, and desktop
- Loading states and error handling for all operations

#### Hook Development for Data Management
**Tasks**:
- [ ] **[FE-006]** Create useMaterials hook following useProducts.ts patterns
- [ ] **[FE-007]** Develop useCreateMaterial using standard mutation pattern
- [ ] **[FE-008]** Add useUpdateMaterial with cache invalidation
- [ ] **[FE-009]** Create useProductTypes with material relationships
- [ ] **[FE-010]** Implement MaterialSelector component with search functionality

**Acceptance Criteria**:
- Follow existing useProducts.ts hook patterns for consistency
- Use simple query key factory pattern (no complex hierarchical keys)
- Standard React Query caching (staleTime: 2min, placeholderData)
- Cache invalidation with queryKeys.all pattern
- Error handling delegated to UI layer (no optimistic updates for MVP)
- Conditional fetching with enabled: !!id pattern

### Sprint 3: ProductType Integration & Enhanced Product Creation (Week 5-6)
**Story Points**: 3

#### ProductType Management Components
**Tasks**:
- [ ] **[FE-011]** Create ProductTypeForm with material selection
- [ ] **[FE-012]** Build ProductTypeList with cost information display
- [ ] **[FE-013]** Add ProductType tab to unified management page
- [ ] **[FE-014]** Implement basic cost calculation for ProductTypes
- [ ] **[FE-015]** Create CostBreakdownDisplay component (simplified)

**Acceptance Criteria**:
- ProductType creation links materials with processing costs
- Basic cost calculation preview as user inputs data
- Material selector with search and availability validation
- Simple cost breakdown display (no complex charts)
- Form validation prevents invalid cost configurations
- Responsive design with mobile-first approach

#### Enhanced Product Form Components
**Tasks**:
- [ ] **[FE-016]** Update EnhancedProductForm with material workflow
- [ ] **[FE-017]** Create ProductTypeSelector with cost preview
- [ ] **[FE-018]** Implement quantity-based cost calculations
- [ ] **[FE-019]** Add basic cost override for admin users
- [ ] **[FE-020]** Ensure backward compatibility with existing manual product creation

**Acceptance Criteria**:
- Product creation workflow guides user through material selection
- Cost breakdown shows basic material vs processing cost information
- Real-time cost updates as user changes quantity or product type
- Admin users can override calculated costs (simple modal)
- Backward compatibility with existing manual product creation
- Form validation ensures data consistency

---

## 🎯 Tab-Based Navigation Architecture

### URL Structure & Routing
```
/producer/manage-product/materials
├── #material (default tab)
├── #category 
└── #color
```

### Component Architecture
```
ProductManagementPage.tsx
├── TabNavigation.tsx
├── MaterialTab.tsx
│   ├── MaterialList.tsx
│   ├── MaterialForm.tsx
│   └── MaterialSelector.tsx
├── CategoryTab.tsx (migrated from modal)
│   ├── CategoryList.tsx
│   ├── CategoryForm.tsx
│   └── CategoryManagement.tsx
└── ColorTab.tsx (migrated from modal)
    ├── ColorList.tsx
    ├── ColorForm.tsx
    └── ColorManagement.tsx
```

### Navigation Pattern Consistency
| **Feature** | **Previous Pattern** | **New Pattern** |
|-------------|---------------------|-----------------|
| **Material** | Not implemented | Page-based with tabs |
| **Category** | Modal overlay | Tab within page |
| **Color** | Modal overlay | Tab within page |
| **Product** | Page-based | Unchanged (remains page-based) |

### Hash Routing Implementation
```typescript
// useTabNavigation.ts
export function useTabNavigation() {
  const [activeTab, setActiveTab] = useState('material')
  
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (['material', 'category', 'color'].includes(hash)) {
      setActiveTab(hash)
    }
  }, [])
  
  const switchTab = (tab: string) => {
    setActiveTab(tab)
    window.location.hash = tab
  }
  
  return { activeTab, switchTab }
}
```

---

## = Type System Definition

Following the existing type conventions in `/features/manage-product/types/index.ts`, we'll add Material and ProductType types:

```typescript
// === MATERIAL TYPES ===

// Base material interface (server-side with Decimal)
export interface BaseMaterial {
  id: string
  name: string
  type: MaterialType
  supplier?: string
  description?: string
  unit: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pricePerUnit: any // Prisma Decimal (server-side only)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentPrice: any // Prisma Decimal (server-side only)
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

// Client-side material (frontend-safe with regular numbers)
export interface ClientMaterial {
  id: string
  name: string
  type: MaterialType
  supplier?: string
  description?: string
  unit: string
  pricePerUnit: number
  isActive: boolean
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string
}

// Material with relationships
export interface Material extends BaseMaterial {
  productTypes?: ProductType[]
}

// === PRODUCT TYPE TYPES ===

// Base product type interface (server-side with Decimal)
export interface BaseProductType {
  id: string
  name: string
  description?: string
  materialId: string
  materialQuantity: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  processingCost: any // Prisma Decimal (server-side only)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  laborCost: any // Prisma Decimal (server-side only)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  overheadCost: any // Prisma Decimal (server-side only)
  outputQuantity: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

// Client-side product type (frontend-safe with regular numbers)
export interface ClientProductType {
  id: string
  name: string
  description?: string
  materialId: string
  materialQuantity: number
  processingCost: number
  laborCost: number
  overheadCost: number
  outputQuantity: number
  isActive: boolean
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string
  material?: ClientMaterial
  products?: ClientProduct[]
  calculatedCost?: CostBreakdown
}

// Product type with relationships
export interface ProductType extends BaseProductType {
  material?: Material
  products?: Product[]
}

// === COST BREAKDOWN ===
export interface CostBreakdown {
  materialCost: number
  processingCost: number
  laborCost: number
  overheadCost: number
  totalCost: number
  materialPercentage: number
  processingPercentage: number
}

// === API REQUEST/RESPONSE TYPES ===

export interface MaterialFormData {
  name: string
  type: MaterialType
  supplier?: string
  description?: string
  unit: string
  pricePerUnit: number
}

export interface ProductTypeFormData {
  name: string
  description?: string
  materialId: string
  materialQuantity: number
  processingCost: number
  laborCost: number
  overheadCost: number
  outputQuantity: number
}

export interface MaterialFilters {
  search?: string
  type?: MaterialType
  supplier?: string
  isActive?: boolean
  priceMin?: number
  priceMax?: number
  page?: number
  limit?: number
}

export interface ProductTypeFilters {
  search?: string
  materialId?: string
  isActive?: boolean
  page?: number
  limit?: number
}

// === ENUMS ===
export type MaterialType = 'fabric' | 'accessory' | 'component' | 'consumable'
export type MaterialUnit = 'meter' | 'yard' | 'piece' | 'kg' | 'gram' | 'liter' | 'ml'

// Type guards
export function isValidMaterialType(type: string): type is MaterialType {
  return ['fabric', 'accessory', 'component', 'consumable'].includes(type)
}

// === ENHANCED PRODUCT FORM DATA ===
// Extends existing ProductFormData with material support
export interface EnhancedProductFormData extends ProductFormData {
  productTypeId?: string
  useCalculatedCost: boolean
  costOverride?: {
    reason: string
    overrideCost: number
  }
}
```

---

## <� Revised Component Architecture (Simplified & Tab-Based)

**Unified Structure**: Consolidating Material, Category, and Color management in single page with tab navigation

### Layer 1: Main Page Container
- **ProductManagementPage.tsx** - Main page with tab navigation for Material/Category/Color
- **TabNavigation.tsx** - Tab switching component with hash routing

### Layer 2: Tab Content Components (3 Tabs)
- **MaterialTab.tsx** - Material management content (new)
- **CategoryTab.tsx** - Migrated from CategoryManagement modal
- **ColorTab.tsx** - Migrated from ColorManagement modal

### Layer 3: Core CRUD Components (Per Tab)
- **MaterialList.tsx** & **MaterialForm.tsx** - Reuse ProductTable/ProductForm patterns
- **CategoryList.tsx** & **CategoryForm.tsx** - Existing components (keep as-is)
- **ColorList.tsx** & **ColorForm.tsx** - Existing components (keep as-is)

### Layer 4: Shared Utilities
- **MaterialSelector.tsx** - Simple dropdown for ProductType integration
- **CostDisplay.tsx** - Simple cost breakdown (no complex charts)

### Key Simplifications Applied
```typescript
// Removed: PriceHistoryModal, MaterialImportModal (advanced features)
// Removed: MaterialContext, ProductTypeContext (use React Query cache)
// Simplified: CostCalculator → CostDisplay (basic display only)
// Unified: All management features in single page with tabs
```

---

## =� Responsive Design Specifications

### Responsive Design with Tailwind
Following existing project Tailwind conventions and responsive patterns:

```typescript
// Use existing Tailwind responsive classes
const containerClasses = "p-4 md:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"

// Material card responsive classes
const materialCardClasses = "bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-200"

// Form responsive classes  
const formClasses = "space-y-4 md:space-y-6"
const formGridClasses = "grid grid-cols-1 md:grid-cols-2 gap-4"
```

### Component Adaptations

#### Component Responsive Adaptations

**MaterialList Component:**
- Follow existing ProductTable/ProductGrid pattern
- Mobile: Card view using existing card components
- Desktop: Table view with responsive table classes
- Use existing SearchFilterBar responsive patterns

**ProductTypeForm Component:**
- Use existing ProductFormPage responsive structure
- Form fields use existing FormField component patterns
- Follow existing form validation and error display patterns

**Cost Display Components:**
- Simple responsive cards for MVP
- Use existing component spacing and typography scales
- Follow existing color scheme from Tailwind config

---

##  Accessibility Implementation

### WCAG 2.1 AA Compliance

#### Keyboard Navigation
```typescript
// All interactive elements support keyboard navigation
const MaterialCard = ({ material }: { material: Material }) => {
  return (
    <div 
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleMaterialSelect(material);
        }
      }}
      aria-label={`Select material: ${material.name}, Price: ${material.pricePerUnit} per ${material.unit}`}
    >
      {/* Material content */}
    </div>
  );
};
```

#### Screen Reader Support
- Semantic HTML structure with proper headings (h1-h6)
- ARIA labels for complex interactions
- Live regions for dynamic content updates
- Skip links for main content navigation

#### Visual Accessibility
- Color contrast ratios >4.5:1 for normal text, >3:1 for large text
- Focus indicators with 2px outline and sufficient color contrast
- Text sizing supports up to 200% zoom without horizontal scrolling
- Icons paired with text labels

---

## = API Integration Patterns

### React Query Configuration
```typescript
// Use existing project configuration - no custom query client needed
// Follow existing patterns from useProducts.ts:
// - staleTime: 2 * 60 * 1000 (2 minutes)
// - placeholderData for smooth transitions
// - Simple error delegation to components
// - Standard invalidation patterns
```

### Extended API Client (api.ts)
Following the existing api.ts pattern, we'll add Material and ProductType APIs to the same file:

```typescript
// === MATERIAL API === (Add to existing api.ts)
export const materialApi = {
  // Get all materials with filtering
  getMaterials: async (params?: {
    search?: string
    type?: string
    supplier?: string
    isActive?: boolean
    priceMin?: number
    priceMax?: number
    page?: number
    limit?: number
  }) => {
    const queryString = params ? buildQueryParams(params) : ''
    const url = `${API_BASE_URL}/materials${queryString ? `?${queryString}` : ''}`
    const response = await fetch(url)
    return handleResponse(response)
  },

  // Get single material by ID
  getMaterialById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/materials/${id}`)
    return handleResponse(response)
  },

  // Create new material
  createMaterial: async (data: MaterialFormData) => {
    const response = await fetch(`${API_BASE_URL}/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  // Update existing material
  updateMaterial: async (id: string, data: MaterialFormData) => {
    const response = await fetch(`${API_BASE_URL}/materials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  // Get material price history
  getMaterialPriceHistory: async (materialId: string) => {
    const response = await fetch(`${API_BASE_URL}/materials/${materialId}/price-history`)
    return handleResponse(response)
  }
}

// === PRODUCT TYPE API === (Add to existing api.ts)
export const productTypeApi = {
  // Get all product types
  getProductTypes: async (params?: {
    search?: string
    materialId?: string
    isActive?: boolean
    page?: number
    limit?: number
  }) => {
    const queryString = params ? buildQueryParams(params) : ''
    const url = `${API_BASE_URL}/product-types${queryString ? `?${queryString}` : ''}`
    const response = await fetch(url)
    return handleResponse(response)
  },

  // Create product type
  createProductType: async (data: ProductTypeFormData) => {
    const response = await fetch(`${API_BASE_URL}/product-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  // Update product type
  updateProductType: async (id: string, data: ProductTypeFormData) => {
    const response = await fetch(`${API_BASE_URL}/product-types/${id}`, {
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  }
}
```

### Custom Hooks Implementation

#### useMaterials Hook
```typescript
// Simple query key factory following existing pattern
const queryKeys = {
  materials: {
    all: ['materials'] as const,
    list: (params: MaterialFilters | undefined) => ['materials', 'list', params] as const,
    detail: (id: string) => ['materials', 'detail', id] as const,
    priceHistory: (id: string) => ['materials', 'priceHistory', id] as const,
  }
}

export function useMaterials(filters?: MaterialFilters) {
  return useQuery({
    queryKey: queryKeys.materials.list(filters),
    queryFn: () => materialApi.getMaterials(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 2 * 60 * 1000, // 2 minutes like useProducts
  })
}
```

#### useCreateMaterial Hook
```typescript
// Simplified mutation following useProducts pattern
export function useCreateMaterial() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: materialApi.createMaterial,
    onSuccess: () => {
      // Simple cache invalidation like useCreateProduct
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.all })
    },
  })
}

// Update material mutation
export function useUpdateMaterial() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MaterialFormData }) =>
      materialApi.updateMaterial(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.detail(id) })
    },
  })
}

// Material price history hook
export function useMaterialPriceHistory(materialId: string) {
  return useQuery({
    queryKey: queryKeys.materials.priceHistory(materialId),
    queryFn: () => materialApi.getMaterialPriceHistory(materialId),
    enabled: !!materialId, // Conditional fetching pattern
  })
}
```

### Error Handling Strategy
```typescript
// Simplified error handling following existing api.ts pattern
// Error handling is delegated to UI components, not in hooks
// API client uses simple Error throwing, UI catches and displays

// Example in component:
const createMaterialMutation = useCreateMaterial()

const handleSubmit = async (data: MaterialFormData) => {
  try {
    await createMaterialMutation.mutateAsync(data)
    toast.success('Material berhasil ditambahkan')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan')
  }
}
```

---



## <� Design System Integration

### Design System Integration
Using existing Tailwind configuration and component patterns:

```typescript
// Use existing color scheme from project
const materialTypeColors = {
  fabric: 'bg-blue-100 text-blue-800',
  accessory: 'bg-purple-100 text-purple-800',
  component: 'bg-green-100 text-green-800',
  consumable: 'bg-yellow-100 text-yellow-800',
}

// Cost breakdown color mapping using existing theme
const costColors = {
  material: 'bg-red-100 text-red-800',
  processing: 'bg-amber-100 text-amber-800', 
  labor: 'bg-purple-100 text-purple-800',
  overhead: 'bg-gray-100 text-gray-800',
}

// Follow existing badge component patterns
const BadgeComponent = ({ type, children }: { type: MaterialType, children: React.ReactNode }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium $
    {materialTypeColors[type]}`}>
    {children}
  </span>
)
```

### Component Style Implementation
Using existing component library patterns:

```typescript
// Follow existing card component patterns from components/ui/
const MaterialCard = ({ material }: { material: ClientMaterial }) => (
  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
    {/* Material content following existing patterns */}
  </div>
)

// Cost breakdown using existing layout patterns
const CostBreakdownGrid = ({ breakdown }: { breakdown: CostBreakdown }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div className="text-center p-3 rounded-lg border bg-red-50 border-red-200 text-red-800">
      <span className="block text-sm font-medium">Material</span>
      <span className="text-lg font-semibold">Rp {breakdown.materialCost.toLocaleString()}</span>
    </div>
    {/* Other cost items following same pattern */}
  </div>
)
```

---

##  Definition of Done

### Sprint 2 Completion Criteria
- [ ] All Material management components functional and tested
- [ ] ProductType components with real-time cost calculation
- [ ] React Query hooks implemented with proper caching
- [ ] Mobile-responsive design tested across devices
- [ ] Unit tests achieving >90% coverage
- [ ] Integration tests for CRUD workflows
- [ ] Accessibility compliance verified with automated tools

### Sprint 3 Completion Criteria
- [ ] Enhanced Product form with material workflow complete
- [ ] Cost visualization components with charts
- [ ] Global state management working correctly
- [ ] Error handling and loading states implemented
- [ ] E2E tests covering complete user workflows
- [ ] Performance optimization (bundle size, load times)
- [ ] Documentation for component usage

### Overall Phase 2 Success Criteria
- [ ] Complete UI for Material � ProductType � Product workflow
- [ ] All components responsive and accessible (WCAG 2.1 AA)
- [ ] Real-time cost calculations working accurately
- [ ] Seamless integration with backend APIs
- [ ] Comprehensive test coverage (>90% unit, 100% E2E critical paths)
- [ ] Performance targets met (<3s load time, <100ms interactions)
- [ ] User feedback collected and incorporated
- [ ] Documentation complete for handoff to QA


---

## = Simplification & Navigation Pattern Summary

**Document Updated**: 2025-08-14 | **Scope**: ⚠️ **SIMPLIFIED FOR MVP + TAB-BASED NAVIGATION**

### ✅ **Major Changes Applied**

#### **1. Feature Scope Reduction (MVP Focus)**
- **Removed**: Price History Tracking, Bulk Import functionality
- **Removed**: Advanced cost visualization and complex reporting
- **Removed**: Complex audit trail systems and price change tracking
- **Retained**: Core Material CRUD, ProductType integration, Enhanced Product creation
- **Result**: 25% reduction in development effort (8 → 6 story points)

#### **2. Navigation Pattern Unification (Consistency)**
- **Changed**: Material management from page-based to tab-based
- **Changed**: Category and Color management from modal-based to tab-based
- **Created**: Single unified page `/producer/manage-product/materials` with 3 tabs
- **Added**: Hash routing for tab state preservation
- **Result**: Consistent UI patterns across all management features

#### **3. Component Architecture Simplification**
- **Unified**: Material/Category/Color management in single page
- **Simplified**: Material components follow existing ProductTable/ProductForm patterns
- **Migrated**: Existing Category/Color modal components to tab containers
- **Consolidated**: Shared navigation and validation patterns
- **Result**: Better code maintainability and user experience consistency

### 📊 **Before vs After Comparison**

| **Aspect** | **Before (Original Scope)** | **After (Simplified MVP)** |
|------------|---------------------------|---------------------------|
| **Story Points** | 8 points | 6 points (25% reduction) |
| **Advanced Features** | Price History + Bulk Import | Core CRUD only |
| **Navigation Pattern** | Mixed (page + modal) | Unified (tab-based) |
| **Component Count** | 12+ components | 8 components |
| **Testing Complexity** | Complex multi-flow | Focused core workflows |
| **Development Risk** | High (complex features) | Low (proven patterns) |

### 🎯 **Development Benefits**

- **Faster Implementation**: 25% reduction in development time
- **Consistent UX**: All management features use same navigation pattern  
- **Lower Risk**: Removed complex features that could delay MVP
- **Better Maintainability**: Unified architecture across all management features
- **Easier Testing**: Focused test coverage on core functionality

### 📋 **Implementation Roadmap**

#### **Phase 1: Tab Infrastructure (Week 1)**
1. Create ProductManagementPage with tab navigation
2. Implement hash routing for tab switching
3. Migrate Category/Color management to tab containers

#### **Phase 2: Material CRUD (Week 2-3)**
1. Build MaterialTab with core CRUD operations
2. Implement useMaterials hooks following existing patterns
3. Create MaterialForm and MaterialList components

#### **Phase 3: ProductType Integration (Week 4-5)**
1. Add ProductType management with basic cost calculation
2. Integrate material selection in ProductType creation
3. Update Enhanced Product form with material workflow

#### **Phase 4: Testing & Polish (Week 6)**
1. Comprehensive E2E testing for core workflows
2. Performance optimization and accessibility compliance
3. Documentation and handoff preparation

---

*This document now provides a realistic, simplified scope for MVP development with consistent navigation patterns across all management features.*