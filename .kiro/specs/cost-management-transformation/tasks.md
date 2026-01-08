# Cost Management Transformation - Implementation Tasks

## Phase 1: Database Schema & Types

### Task 1.1: Create Cost Category Enum and Types
**Objective**: Define new type system for cost management
**Files to create/modify**:
- `features/manage-product/types/costItem.ts` (new)
- Update existing material types for backward compatibility

**Implementation**:
```typescript


// New CostItem interface
interface CostItem {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
}
```

**Acceptance Criteria**:
- [ ] CostItem types defined with proper TypeScript interfaces
- [ ] CostCategory enum with 5 categories
- [ ] Request/Response types for CRUD operations
- [ ] Backward compatibility types for Material → CostItem mapping
- [ ] `yarn type-check` passes

### Task 1.2: Database Schema Update (Prisma Push)
**Objective**: Update Material table to CostItem structure using prisma push
**Files to modify**:
- `prisma/schema.prisma`

**Implementation**:
```sql
-- Add category column with default MATERIAL
ALTER TABLE Material ADD COLUMN category VARCHAR(20) DEFAULT 'MATERIAL';

-- Rename pricePerUnit to basePrice  
ALTER TABLE Material RENAME COLUMN pricePerUnit TO basePrice;

-- Remove unit column (no longer needed)
ALTER TABLE Material DROP COLUMN unit;

-- Rename table
ALTER TABLE Material RENAME TO CostItem;

-- Update indexes if needed
```

**Acceptance Criteria**:
- [ ] Migration script created and tested
- [ ] All existing material data preserved with MATERIAL category
- [ ] No data loss during migration
- [ ] Database schema matches new CostItem structure

## Phase 2: Service Layer Transformation

### Task 2.1: Create CostItemService
**Objective**: Replace MaterialService with CostItemService
**Files to create/modify**:
- `features/manage-product/services/costItemService.ts` (new)
- Keep `materialService.ts` temporarily for backward compatibility

**Implementation**:
```typescript
export class CostItemService {
  // Core CRUD operations
  async createCostItem(request: CreateCostItemRequest): Promise<CostItem>
  async updateCostItem(id: string, request: UpdateCostItemRequest): Promise<CostItem>
  async getCostItems(query: CostItemQueryParams): Promise<CostItemListResponse>
  async getCostItemById(id: string): Promise<CostItem>
  async deleteCostItem(id: string): Promise<boolean>
  
  // Category-specific operations
  async getCostItemsByCategory(category: CostCategory): Promise<CostItem[]>
  async getActiveCostItems(): Promise<CostItem[]>
}
```

**Acceptance Criteria**:
- [ ] CostItemService implements all MaterialService functionality
- [ ] Category-based filtering and search
- [ ] Proper error handling with NotFoundError, ConflictError
- [ ] Decimal precision maintained for basePrice
- [ ] Transaction support for complex operations
- [ ] `yarn type-check` passes
- [ ] `yarn lint` passes

### Task 2.2: Create Validation Schemas
**Objective**: Define Zod validation for cost item operations
**Files to create**:
- `features/manage-product/lib/validation/costItemSchema.ts` (new)

**Implementation**:
```typescript
export const createCostItemSchema = z.object({
  name: z.string().min(2).max(100),
  category: z.nativeEnum(CostCategory),
  basePrice: z.number().positive(),
  description: z.string().optional()
})

export const updateCostItemSchema = createCostItemSchema.partial()
export const costItemQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  category: z.nativeEnum(CostCategory).optional()
})
```

**Acceptance Criteria**:
- [ ] Validation schemas for create, update, query operations
- [ ] Category validation with enum
- [ ] Proper error messages in Indonesian
- [ ] `yarn type-check` passes

## Phase 3: UI Component Transformation

### Task 3.1: Create CostItemForm Component
**Objective**: Transform MaterialForm to CostItemForm
**Files to create/modify**:
- `features/manage-product/components/costItem/CostItemForm.tsx` (new)
- Keep MaterialForm temporarily for backward compatibility

**Implementation**:
- Remove unit field and related logic
- Add category selection dropdown
- Simplify price input (no unit calculations)
- Add optional description field
- Maintain currency formatting
- Keep validation and error handling

**Acceptance Criteria**:
- [ ] CostItemForm component created with category selection
- [ ] No unit field or unit-related logic
- [ ] Currency formatting maintained
- [ ] Form validation with error display
- [ ] Add/Edit modes supported
- [ ] `yarn type-check` passes
- [ ] `yarn lint` passes

### Task 3.2: Create CostItemList Component  
**Objective**: Transform MaterialList to CostItemList
**Files to create/modify**:
- `features/manage-product/components/costItem/CostItemList.tsx` (new)

**Implementation**:
- Display cost items with category badges
- Search functionality across name and category
- Category filtering dropdown
- Remove unit display
- Maintain edit/delete actions

**Acceptance Criteria**:
- [ ] CostItemList displays items with category badges
- [ ] Search and category filtering functional
- [ ] No unit-related display logic
- [ ] Edit/delete actions working
- [ ] Loading and empty states
- [ ] `yarn type-check` passes

### Task 3.3: Create CostSelector Component
**Objective**: Transform MaterialSelector to multi-cost selection
**Files to create/modify**:
- `features/manage-product/components/costItem/CostSelector.tsx` (new)

**Implementation**:
```typescript
interface CostSelectorProps {
  selectedCosts: ProductCost[]
  onCostChange: (costs: ProductCost[]) => void
}

// Support multiple cost selection with quantities
// Display total cost calculation
// Category-based grouping
```

**Acceptance Criteria**:
- [ ] Multi-cost selection with quantities
- [ ] Total cost calculation display
- [ ] Category-based organization
- [ ] Add/remove cost functionality
- [ ] `yarn type-check` passes

## Phase 4: ProductForm Integration

### Task 4.1: Update ProductForm Cost Integration
**Objective**: Replace MaterialSelector with CostSelector in ProductForm
**Files to modify**:
- `features/manage-product/components/form-product/ProductForm.tsx`

**Implementation**:
- Replace MaterialSelector with CostSelector
- Update form data structure for multiple costs
- Add total production cost calculation
- Maintain backward compatibility during transition

**Acceptance Criteria**:
- [ ] CostSelector integrated in ProductForm
- [ ] Multiple cost selection working
- [ ] Total cost calculation functional
- [ ] Form validation updated
- [ ] `yarn type-check` passes

### Task 4.2: Update Product Types and Handlers
**Objective**: Update product-related types for cost integration
**Files to modify**:
- `features/manage-product/types/product.ts`
- `features/manage-product/utils/MaterialHandlers.ts` → `CostHandlers.ts`

**Implementation**:
```typescript
interface ProductCost {
  id: string
  productId: string
  costItemId: string
  quantity: number
  totalCost: number
  notes?: string
}

// Update ProductFormData to include productCosts array
```

**Acceptance Criteria**:
- [ ] Product types updated for cost management
- [ ] Cost handlers created and functional
- [ ] Type safety maintained throughout
- [ ] `yarn type-check` passes

## Phase 5: API Routes and Integration

### Task 5.1: Create Cost Item API Routes
**Objective**: Create API endpoints for cost item management
**Files to create**:
- `app/api/cost-items/route.ts` (new)
- `app/api/cost-items/[id]/route.ts` (new)

**Implementation**:
- GET /api/cost-items (list with pagination and filtering)
- POST /api/cost-items (create new cost item)
- GET /api/cost-items/[id] (get single cost item)
- PUT /api/cost-items/[id] (update cost item)
- DELETE /api/cost-items/[id] (delete cost item)

**Acceptance Criteria**:
- [ ] All CRUD API endpoints implemented
- [ ] Proper error handling and validation
- [ ] Category filtering support
- [ ] Pagination support
- [ ] `yarn type-check` passes

### Task 5.2: Update Product API for Cost Integration
**Objective**: Update product APIs to handle multiple costs
**Files to modify**:
- `app/api/products/route.ts`
- `app/api/products/[id]/route.ts`

**Implementation**:
- Update product creation/update to handle productCosts array
- Maintain backward compatibility with materialId/materialQuantity
- Add cost calculation logic

**Acceptance Criteria**:
- [ ] Product APIs handle multiple costs
- [ ] Backward compatibility maintained
- [ ] Cost calculations working
- [ ] `yarn type-check` passes

## Phase 6: Testing and Cleanup

### Task 6.1: Create Cost Management Page
**Objective**: Create main page for cost item management
**Files to create**:
- `app/cost-management/page.tsx` (new)

**Implementation**:
- Integrate CostItemList and CostItemForm
- Add category filtering and search
- Maintain similar UX to existing material management

**Acceptance Criteria**:
- [ ] Cost management page functional
- [ ] All CRUD operations working
- [ ] Category filtering and search working
- [ ] Responsive design
- [ ] `yarn type-check` passes

### Task 6.2: Update Navigation and Routes
**Objective**: Update app navigation for cost management
**Files to modify**:
- Navigation components
- Route configurations

**Implementation**:
- Add "Cost Management" menu item
- Update existing "Material" references
- Maintain backward compatibility links

**Acceptance Criteria**:
- [ ] Navigation updated with cost management
- [ ] All routes working correctly
- [ ] No broken links
- [ ] `yarn type-check` passes

### Task 6.3: Final Testing and Validation
**Objective**: Comprehensive testing of the transformation
**Testing checklist**:
- [ ] All existing material data accessible as MATERIAL category
- [ ] New cost categories (TRANSPORT, TAILOR, CATERING, OTHER) functional
- [ ] Product creation with multiple costs working
- [ ] Search and filtering across all categories
- [ ] Edit/delete operations for all cost types
- [ ] Total cost calculations accurate
- [ ] No TypeScript errors (`yarn type-check`)
- [ ] No linting errors (`yarn lint`)
- [ ] No runtime errors in development
- [ ] Backward compatibility maintained

### Task 6.4: Documentation Update
**Objective**: Update documentation for new cost management system
**Files to create/modify**:
- `docs/cost-management-flow.md` (new)
- Update existing material documentation

**Implementation**:
- Document new cost management flow
- Update API documentation
- Create user guide for cost categories
- Migration guide for existing users

**Acceptance Criteria**:
- [ ] Comprehensive documentation created
- [ ] API documentation updated
- [ ] User guide available
- [ ] Migration notes documented

## Implementation Notes

### Development Guidelines
1. **No Overengineering**: Keep solutions simple and focused
2. **Type Safety**: Maintain strict TypeScript compliance
3. **Backward Compatibility**: Ensure existing functionality continues working
4. **Testing**: Run `yarn type-check` and `yarn lint` after each task
5. **Incremental**: Implement in phases to minimize risk

### Risk Mitigation
- Keep original MaterialService during transition
- Maintain database backup before migration
- Test thoroughly in development environment
- Gradual rollout with feature flags if needed

### Success Metrics
- Zero data loss during migration
- All type checks passing
- No linting errors
- Functional cost management for all categories
- Smooth user experience transition