# FE-RPK-45: Frontend Development - Material Management UI

**Parent Task**: RPK-45  
**Phase**: 2 - Frontend Development  
**Priority**: High  
**Sprint**: 2-3 (Week 3-6)  
**Story Points**: 8  
**Developer**: Frontend Team  
**Created**: 2025-08-13  
**Status**: Planning  
**Dependencies**: BE-RPK-45 (Backend APIs must be completed)

---

## =Ë Phase Overview

**Focus**: User interface development for Material Management System with enhanced product creation workflow.

**Objective**: Build intuitive, responsive UI components that integrate seamlessly with backend APIs and provide excellent user experience for material-based product management.

**Key Deliverables**:
- Complete Material and ProductType management interfaces
- Enhanced Product creation form with cost calculation
- Cost breakdown displays and reporting components
- Mobile-responsive design with accessibility compliance
- Comprehensive E2E testing for user workflows

---

## <¯ Sprint Breakdown

### Sprint 2: Material & ProductType UI (Week 3-4)
**Story Points**: 5

#### Material Management Components
**Tasks**:
- [ ] **[FE-001]** Create MaterialForm component for CRUD operations
- [ ] **[FE-002]** Build MaterialList with search, filter, and pagination
- [ ] **[FE-003]** Develop MaterialManagement main page layout
- [ ] **[FE-004]** Add PriceHistoryModal for material price tracking
- [ ] **[FE-005]** Implement MaterialImportModal for bulk operations

**Acceptance Criteria**:
- Material CRUD operations work seamlessly with backend APIs
- Real-time search and filtering with debounce optimization
- Responsive design works on mobile, tablet, and desktop
- Price history display with clear change tracking
- Bulk import with CSV/Excel file validation
- Loading states and error handling for all operations

#### ProductType Management Components
**Tasks**:
- [ ] **[FE-006]** Create ProductTypeForm with material selection
- [ ] **[FE-007]** Build ProductTypeList with cost information display
- [ ] **[FE-008]** Develop ProductTypeManagement page
- [ ] **[FE-009]** Add CostCalculator for real-time cost preview
- [ ] **[FE-010]** Create MaterialSelector with search functionality

**Acceptance Criteria**:
- ProductType creation links materials with processing costs
- Real-time cost calculation preview as user inputs data
- Material selector with search and availability validation
- Cost breakdown visualization with percentage displays
- Form validation prevents invalid cost configurations
- Responsive design with mobile-first approach

#### Hook Development for Data Management
**Tasks**:
- [ ] **[FE-011]** Create useMaterials hook with caching and filtering
- [ ] **[FE-012]** Develop useCreateMaterial with optimistic updates
- [ ] **[FE-013]** Add useUpdateMaterial with price history tracking
- [ ] **[FE-014]** Implement useMaterialPriceHistory hook
- [ ] **[FE-015]** Create useProductTypes with material relationships

**Acceptance Criteria**:
- React Query integration with proper caching strategies
- Optimistic updates for better user experience
- Error handling with user-friendly messages
- Loading states management across all operations
- Data synchronization between related components

### Sprint 3: Enhanced Product Creation (Week 5-6)
**Story Points**: 3

#### Enhanced Product Form Components
**Tasks**:
- [ ] **[FE-016]** Update EnhancedProductForm with material workflow
- [ ] **[FE-017]** Build CostBreakdownDisplay component
- [ ] **[FE-018]** Create ProductTypeSelector with cost preview
- [ ] **[FE-019]** Add CostOverrideModal for admin users
- [ ] **[FE-020]** Implement quantity-based cost calculations

**Acceptance Criteria**:
- Product creation workflow guides user through material selection
- Cost breakdown shows material vs processing cost percentages
- Real-time cost updates as user changes quantity or product type
- Admin users can override calculated costs with audit logging
- Backward compatibility with existing manual product creation
- Form validation ensures data consistency

#### Cost Visualization & Reporting
**Tasks**:
- [ ] **[FE-021]** Create cost breakdown charts using Chart.js/Recharts
- [ ] **[FE-022]** Build cost comparison components
- [ ] **[FE-023]** Add profit margin calculation displays
- [ ] **[FE-024]** Implement cost history tracking visualization
- [ ] **[FE-025]** Create printable cost reports

**Acceptance Criteria**:
- Interactive charts show cost distribution and trends
- Cost comparison helps users make informed decisions
- Profit margin calculations based on selling price
- Historical cost data displayed in timeline format
- Export functionality for reports and accounting
- Mobile-optimized chart displays

#### State Management & Context
**Tasks**:
- [ ] **[FE-026]** Implement MaterialContext for global state
- [ ] **[FE-027]** Create ProductTypeContext for template management
- [ ] **[FE-028]** Add cost calculation hooks integration
- [ ] **[FE-029]** Implement cache invalidation strategies
- [ ] **[FE-030]** Add global error handling and notifications

**Acceptance Criteria**:
- Global state maintains data consistency across components
- Context providers optimize re-renders with proper memoization
- Cache invalidation ensures data freshness
- Error boundaries handle component failures gracefully
- Toast notifications provide user feedback for all actions

---

## <¨ Component Architecture

### Material Management Components

#### MaterialForm.tsx
```typescript
interface MaterialFormProps {
  material?: Material;
  onSubmit: (data: MaterialFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// Features:
// - Form validation with Zod schema
// - Price change reason input for updates
// - Material type selection with icons
// - Supplier autocomplete from existing data
// - Unit selection with common options
// - Image upload for material reference
```

#### MaterialList.tsx
```typescript
interface MaterialListProps {
  filters: MaterialFilters;
  onFiltersChange: (filters: MaterialFilters) => void;
  onMaterialSelect?: (material: Material) => void;
  selectionMode?: boolean;
}

// Features:
// - Server-side pagination with virtual scrolling
// - Advanced filtering (type, supplier, price range)
// - Bulk selection with actions (activate/deactivate)
// - Price history quick preview
// - Export functionality (CSV/Excel)
// - Mobile-optimized card layout
```

#### PriceHistoryModal.tsx
```typescript
interface PriceHistoryModalProps {
  materialId: string;
  materialName: string;
  isOpen: boolean;
  onClose: () => void;
}

// Features:
// - Timeline visualization of price changes
// - Change reason display with user information
// - Price trend charts and statistics
// - Export price history data
// - Mobile-responsive modal design
```

### ProductType Management Components

#### ProductTypeForm.tsx
```typescript
interface ProductTypeFormProps {
  productType?: ProductType;
  onSubmit: (data: ProductTypeFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// Features:
// - Material selection with search and filtering
// - Real-time cost calculation preview
// - Processing cost breakdown (labor, overhead)
// - Output quantity configuration
// - Cost validation and warnings
// - Template cloning functionality
```

#### CostCalculator.tsx
```typescript
interface CostCalculatorProps {
  materialId?: string;
  quantity: number;
  processingCost: number;
  laborCost?: number;
  overheadCost?: number;
  onChange: (calculation: CostBreakdown) => void;
}

// Features:
// - Real-time calculation as user types
// - Visual cost breakdown with percentages
// - Profit margin calculation helper
// - Cost comparison with similar products
// - Mobile-friendly input controls
```

### Enhanced Product Form Components

#### EnhancedProductForm.tsx
```typescript
interface EnhancedProductFormProps {
  product?: Product;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  mode: 'create' | 'edit';
}

// Features:
// - ProductType selection with cost preview
// - Manual vs calculated cost toggle
// - Quantity-based cost calculations
// - Stock level warnings
// - Image upload with material reference
// - Backward compatibility with manual input
```

#### CostBreakdownDisplay.tsx
```typescript
interface CostBreakdownDisplayProps {
  costBreakdown: CostBreakdown;
  showPercentages?: boolean;
  interactive?: boolean;
  size?: 'small' | 'medium' | 'large';
}

// Features:
// - Interactive donut/pie charts
// - Percentage and absolute value displays
// - Hover tooltips with detailed information
// - Responsive sizing for different contexts
// - Export functionality for reports
```

---

## =ñ Responsive Design Specifications

### Breakpoints
```css
/* Mobile First Approach */
.container {
  /* Mobile (default): 320px - 767px */
  padding: 1rem;
  
  /* Tablet: 768px - 1023px */
  @media (min-width: 768px) {
    padding: 1.5rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  /* Desktop: 1024px+ */
  @media (min-width: 1024px) {
    padding: 2rem;
    grid-template-columns: 1fr 2fr 1fr;
    gap: 2rem;
  }
}
```

### Component Adaptations

#### MaterialList Responsive Layout
- **Mobile**: Stack cards vertically with compact information
- **Tablet**: 2-column grid with expanded card content
- **Desktop**: Table view with all columns and advanced filtering

#### ProductTypeForm Responsive Design
- **Mobile**: Single column form with collapsible sections
- **Tablet**: Two-column layout with material selector sidebar
- **Desktop**: Three-column with live cost preview panel

#### Cost Visualization Adaptations
- **Mobile**: Simple bar charts with swipe navigation
- **Tablet**: Interactive donut charts with tap interactions
- **Desktop**: Full dashboard with multiple chart types

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
// Query client setup with optimistic updates
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: (failureCount, error) => {
        // Retry logic based on error type
        return failureCount < 3 && !isAuthError(error);
      },
    },
    mutations: {
      onError: (error) => {
        toast.error(getErrorMessage(error));
      },
    },
  },
});
```

### Custom Hooks Implementation

#### useMaterials Hook
```typescript
export function useMaterials(filters: MaterialFilters = {}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['materials', filters],
    queryFn: () => materialApi.getMaterials(filters),
    keepPreviousData: true,
  });

  return {
    materials: data?.data || [],
    pagination: data?.pagination,
    summary: data?.summary,
    isLoading,
    error,
    refetch,
  };
}
```

#### useCreateMaterial Hook
```typescript
export function useCreateMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: materialApi.createMaterial,
    onMutate: async (newMaterial) => {
      // Optimistic update
      await queryClient.cancelQueries(['materials']);
      
      const previousMaterials = queryClient.getQueryData(['materials']);
      
      queryClient.setQueryData(['materials'], (old: any) => ({
        ...old,
        data: [{ ...newMaterial, id: 'temp-' + Date.now() }, ...old.data],
      }));
      
      return { previousMaterials };
    },
    onError: (err, newMaterial, context) => {
      // Rollback optimistic update
      queryClient.setQueryData(['materials'], context?.previousMaterials);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['materials']);
    },
  });
}
```

### Error Handling Strategy
```typescript
// Global error handling with user-friendly messages
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response?.status === 400) {
      return error.response.data.message || 'Invalid input data';
    }
    if (error.response?.status === 409) {
      return 'This item already exists';
    }
    if (error.response?.status >= 500) {
      return 'Server error. Please try again later';
    }
  }
  
  return 'An unexpected error occurred';
}
```

---

## >ê Testing Strategy

### Unit Testing (Target: >90% Coverage)

#### Component Tests with Testing Library
```typescript
// MaterialForm.test.tsx
describe('MaterialForm', () => {
  it('should validate required fields', async () => {
    render(<MaterialForm onSubmit={jest.fn()} onCancel={jest.fn()} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Price per unit is required')).toBeInTheDocument();
    });
  });
  
  it('should show price change reason field when updating price', async () => {
    const material = mockMaterial({ pricePerUnit: 10000 });
    
    render(
      <MaterialForm 
        material={material}
        onSubmit={jest.fn()} 
        onCancel={jest.fn()} 
      />
    );
    
    fireEvent.change(screen.getByLabelText('Price per unit'), {
      target: { value: '15000' }
    });
    
    await waitFor(() => {
      expect(screen.getByLabelText('Price change reason')).toBeInTheDocument();
    });
  });
});
```

#### Hook Tests
```typescript
// useMaterials.test.tsx
describe('useMaterials', () => {
  it('should fetch materials with filters', async () => {
    const mockData = {
      data: [mockMaterial()],
      pagination: { page: 1, total: 1 }
    };
    
    jest.spyOn(materialApi, 'getMaterials').mockResolvedValue(mockData);
    
    const { result } = renderHook(() => 
      useMaterials({ type: 'fabric', isActive: true })
    );
    
    await waitFor(() => {
      expect(result.current.materials).toEqual(mockData.data);
    });
    
    expect(materialApi.getMaterials).toHaveBeenCalledWith({
      type: 'fabric',
      isActive: true
    });
  });
});
```

### Integration Tests

#### User Workflow Tests
```typescript
// material-management.integration.test.tsx
describe('Material Management Integration', () => {
  beforeEach(() => {
    setupMSWHandlers();
  });
  
  it('should complete create material workflow', async () => {
    render(<MaterialManagement />);
    
    // Click create button
    fireEvent.click(screen.getByRole('button', { name: 'Add Material' }));
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Material name'), {
      target: { value: 'Cotton Fabric' }
    });
    fireEvent.change(screen.getByLabelText('Price per unit'), {
      target: { value: '15000' }
    });
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    
    // Verify success
    await waitFor(() => {
      expect(screen.getByText('Material created successfully')).toBeInTheDocument();
      expect(screen.getByText('Cotton Fabric')).toBeInTheDocument();
    });
  });
});
```

### E2E Testing with Playwright

#### Complete User Workflows
```typescript
// material-to-product.e2e.test.ts
test.describe('Material to Product Creation Flow', () => {
  test('should create material, product type, and product', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'admin@test.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to materials
    await page.goto('/producer/materials');
    
    // Create material
    await page.click('[data-testid="add-material"]');
    await page.fill('[data-testid="material-name"]', 'Test Fabric');
    await page.fill('[data-testid="price-per-unit"]', '20000');
    await page.selectOption('[data-testid="material-type"]', 'fabric');
    await page.click('[data-testid="save-material"]');
    
    // Verify material creation
    await expect(page.locator('text=Test Fabric')).toBeVisible();
    
    // Create product type
    await page.goto('/producer/product-types');
    await page.click('[data-testid="add-product-type"]');
    await page.fill('[data-testid="product-type-name"]', 'Test Product Type');
    await page.click('[data-testid="material-selector"]');
    await page.click('text=Test Fabric');
    await page.fill('[data-testid="processing-cost"]', '5000');
    await page.click('[data-testid="save-product-type"]');
    
    // Create product
    await page.goto('/producer/products');
    await page.click('[data-testid="add-product"]');
    await page.click('[data-testid="product-type-selector"]');
    await page.click('text=Test Product Type');
    
    // Verify cost calculation
    await expect(page.locator('[data-testid="calculated-cost"]')).toContainText('25000');
    
    await page.fill('[data-testid="product-name"]', 'Test Product');
    await page.click('[data-testid="save-product"]');
    
    // Verify product creation
    await expect(page.locator('text=Test Product')).toBeVisible();
    await expect(page.locator('text=25000')).toBeVisible();
  });
});
```

---

## <¨ Design System Integration

### Tailwind CSS Configuration
```typescript
// tailwind.config.js extensions for Material Management
module.exports = {
  extend: {
    colors: {
      material: {
        fabric: '#3B82F6',
        accessory: '#8B5CF6', 
        component: '#10B981',
      },
      cost: {
        material: '#EF4444',
        processing: '#F59E0B',
        labor: '#8B5CF6',
        overhead: '#6B7280',
      }
    },
    animation: {
      'cost-update': 'pulse 0.5s ease-in-out',
      'price-change': 'bounce 0.3s ease-in-out',
    }
  }
};
```

### Component Style Standards
```css
/* Material Card Component */
.material-card {
  @apply bg-white border border-gray-200 rounded-lg shadow-sm;
  @apply hover:shadow-md transition-shadow duration-200;
  @apply focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

/* Cost Breakdown Visual */
.cost-breakdown {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4;
}

.cost-item {
  @apply text-center p-3 rounded-lg border;
}

.cost-item--material {
  @apply bg-red-50 border-red-200 text-red-800;
}

.cost-item--processing {
  @apply bg-amber-50 border-amber-200 text-amber-800;
}
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
- [ ] Complete UI for Material ’ ProductType ’ Product workflow
- [ ] All components responsive and accessible (WCAG 2.1 AA)
- [ ] Real-time cost calculations working accurately
- [ ] Seamless integration with backend APIs
- [ ] Comprehensive test coverage (>90% unit, 100% E2E critical paths)
- [ ] Performance targets met (<3s load time, <100ms interactions)
- [ ] User feedback collected and incorporated
- [ ] Documentation complete for handoff to QA

---

*This document defines the complete frontend implementation scope for RPK-45 Phase 2. All acceptance criteria must be met before progressing to Validation & Cleanup phase.*