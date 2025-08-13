# BE-RPK-45: Backend Development - Material Management System

**Parent Task**: RPK-45  
**Phase**: 1 - Backend Development  
**Priority**: High  
**Sprint**: 1-2 (Week 1-4)  
**Story Points**: 10 *(Reduced from 13 - Simplified approach)*  
**Developer**: Backend Team  
**Created**: 2025-08-13  
**Updated**: 2025-08-13 *(Architecture evaluation completed)*  
**Status**: Ready for Implementation  

---

## 🎯 Phase Overview

**Focus**: Simple, incremental material management system aligned with existing architecture patterns.

**Objective**: **Keep It Simple** - Add material cost calculation capability to existing product management with minimal disruption.

**Key Principles**:
- ✅ **Backward Compatible**: Existing products continue working unchanged
- ✅ **Incremental**: New functionality optional, legacy flow preserved  
- ✅ **Architecture Aligned**: Follows existing service layer patterns
- ✅ **Performance Focused**: <2s response time targets with proper indexing

**Key Deliverables**:
- Simplified database schema with backward compatibility
- Clean API design following existing product patterns
- Basic cost calculation service (no complex formulas)
- Safe migration strategy with rollback capability
- Unit tests for new services only

---

## 📋 Simplified Sprint Breakdown

> **IMPORTANT**: This implementation follows "Keep It Simple" principle based on architecture evaluation. Focus on MVP functionality with clear backward compatibility.

### Sprint 1: Foundation & Basic Material Management (Week 1-2)  
**Story Points**: 6 *(Simplified)*

#### Phase 0: Architecture Alignment (CRITICAL - Must Complete First)
**Tasks**:
- [ ] **[BE-000]** Review and update existing ProductService to handle optional material fields
- [ ] **[BE-001]** Create backward-compatible migration strategy document
- [ ] **[BE-002]** Test existing transaction processing with new schema

**Acceptance Criteria**:
- ✅ Existing ProductService handles products with/without materials
- ✅ Current transaction system continues working unchanged
- ✅ Migration plan tested and verified safe

#### Database Schema - Simplified Approach
**Tasks**:
- [ ] **[BE-003]** Create simple Material table (minimal fields)
- [ ] **[BE-004]** Update Product table with NULLABLE material columns only
- [ ] **[BE-005]** Add essential indexes for performance  
- [ ] **[BE-006]** Create safe migration scripts with validation

**Acceptance Criteria**:
- Material table: id, name, pricePerUnit, unit, isActive, timestamps, createdBy (7 fields only)
- Product table: materialCost DECIMAL(10,2) NULL, materialQuantity INT NULL (2 fields only)
- All existing products remain functional (isCalculated NOT NULL check)
- Migration tested on copy of production data
- Rollback scripts validated

#### Material Management APIs - Simplified
**Tasks**:
- [ ] **[BE-007]** Create MaterialService following existing ProductService pattern
- [ ] **[BE-008]** Implement basic GET /api/materials (pagination + search)
- [ ] **[BE-009]** Add POST /api/materials with validation
- [ ] **[BE-010]** Add PUT /api/materials/[id] (basic update only)
- [ ] **[BE-011]** Add DELETE /api/materials/[id] with soft delete

**Acceptance Criteria**:
- MaterialService uses same constructor pattern as ProductService
- API follows existing /api/products response format exactly
- Basic CRUD operations only (no complex features)
- Validation using existing error handling patterns
- Consistent HTTP status codes and error messages

### Sprint 2: Basic Cost Calculation (Week 3-4)  
**Story Points**: 4 *(Simplified)*

#### Simple Cost Integration
**Tasks**:
- [ ] **[BE-012]** Add materialId field to existing Product creation/update APIs
- [ ] **[BE-013]** Create basic cost calculation: `materialCost = material.pricePerUnit * materialQuantity`
- [ ] **[BE-014]** Update ProductService to handle optional material cost calculation
- [ ] **[BE-015]** Add GET /api/products/[id]/material-cost endpoint

**Acceptance Criteria**:
- Product creation/update APIs accept optional materialId and materialQuantity
- When materialId provided, automatically calculate and store materialCost
- Original modalAwal logic preserved for products without materials  
- Simple formula only: `materialCost = pricePerUnit * quantity` (no complex processing costs)
- Backward compatibility: products without materials work unchanged

#### Basic Material Integration
**Tasks**:
- [ ] **[BE-016]** Add material lookup to Product detail API responses
- [ ] **[BE-017]** Update product list to show materialCost when available
- [ ] **[BE-018]** Add material cost validation (prevent negative values)
- [ ] **[BE-019]** Create basic cost recalculation when material prices change

**Acceptance Criteria**:
- Product API responses include material information when available
- Material cost displayed alongside existing modalAwal
- Cost recalculation triggered only when material price updated
- Performance target: <2s for cost calculations on up to 100 products

---

## 🗄️ Simplified Database Schema

> **CRITICAL**: This schema follows "Keep It Simple" principle with **backward compatibility** as top priority.

### ⚠️ Migration Strategy 

**IMPORTANT**: Migration must be done in phases to avoid breaking existing functionality.

#### Phase 1: Add Material Table (Safe)
```sql
-- New Material table - simple structure
CREATE TABLE "Material" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "pricePerUnit" DECIMAL(10,2) NOT NULL,
  "unit" TEXT NOT NULL, -- meter, piece, kg, etc
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  
  CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- Essential index only
CREATE INDEX "idx_material_active" ON "Material"("isActive", "name");
```

#### Phase 2: Add Product Material Fields (NULLABLE - Critical)
```sql
-- Add NULLABLE columns to Product table
-- IMPORTANT: All columns must be NULLABLE for backward compatibility
ALTER TABLE "Product" 
ADD COLUMN "materialId" TEXT NULL,
ADD COLUMN "materialCost" DECIMAL(10,2) NULL,
ADD COLUMN "materialQuantity" INT NULL;

-- Add foreign key with ON DELETE SET NULL (safe deletion)
ALTER TABLE "Product" ADD CONSTRAINT "Product_materialId_fkey" 
FOREIGN KEY ("materialId") REFERENCES "Material"("id") 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Essential indexes for performance
CREATE INDEX "idx_product_material" ON "Product"("materialId");
CREATE INDEX "idx_product_material_cost" ON "Product"("materialCost") WHERE "materialCost" IS NOT NULL;
```

#### Phase 3: Validation & Rollback Scripts
```sql
-- Validation queries to ensure data integrity
SELECT COUNT(*) as existing_products FROM "Product" WHERE "materialId" IS NULL; -- Should match current count
SELECT COUNT(*) as material_products FROM "Product" WHERE "materialId" IS NOT NULL; -- Should be 0 initially

-- Rollback script (if needed)
-- ALTER TABLE "Product" DROP CONSTRAINT "Product_materialId_fkey";
-- ALTER TABLE "Product" DROP COLUMN "materialId";
-- ALTER TABLE "Product" DROP COLUMN "materialCost"; 
-- ALTER TABLE "Product" DROP COLUMN "materialQuantity";
-- DROP TABLE "Material";
```

---

## 🔌 Simplified API Design

> **IMPORTANT**: API design follows exact patterns from existing `/api/products` endpoints for consistency.

### Material Management Endpoints

#### GET /api/materials
**Purpose**: Retrieve materials with search and filtering (same pattern as products)
**Query Parameters**:
- `search` (string): Search by name
- `isActive` (boolean): Filter by active status (default: true)
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)

**Response** (matches existing product API format exactly):
```typescript
{
  materials: Material[], // Note: "materials" not "data"
  pagination: {
    page: number,
    limit: number, 
    total: number,
    totalPages: number
  }
}
```

#### POST /api/materials
**Purpose**: Create new material (simplified fields only)
**Request Body**:
```typescript
{
  name: string,
  pricePerUnit: number,
  unit: string
}
```

#### PUT /api/materials/[id]  
**Purpose**: Update material (basic update only)
#### DELETE /api/materials/[id]
**Purpose**: Soft delete material (set isActive = false)

### Enhanced Product Endpoints

#### GET /api/products (Updated)
**New Response** (extends existing response):
```typescript
{
  products: Product[], // Existing structure
  pagination: { ... } // Existing structure
}

// Extended Product interface:
interface Product {
  // ... existing fields
  materialId?: string | null,
  materialCost?: number | null, // Converted from Decimal
  materialQuantity?: number | null,
  material?: { // Included when materialId exists
    id: string,
    name: string,
    pricePerUnit: number,
    unit: string
  }
}
```

#### POST/PUT /api/products (Updated)
**New Request Body** (extends existing):
```typescript
{
  // ... existing product fields
  materialId?: string | null,
  materialQuantity?: number | null
  // materialCost calculated automatically from materialId + materialQuantity
}
```

#### GET /api/products/[id]/material-cost
**Purpose**: Get detailed material cost calculation for a product
**Response**:
```typescript
{
  productId: string,
  materialCost: number | null,
  calculation: {
    materialId: string,
    materialName: string,
    pricePerUnit: number,
    quantity: number,
    totalCost: number // pricePerUnit * quantity
  } | null
}
```

---

##  Definition of Done

### Sprint 1 Completion Criteria
- [ ] **CRITICAL**: Existing product functionality unchanged (backward compatibility test)
- [ ] **CRITICAL**: Migration tested on copy of production data  
- [ ] Material table created with basic CRUD operations
- [ ] MaterialService follows existing ProductService pattern exactly
- [ ] GET/POST/PUT/DELETE /api/materials endpoints working
- [ ] Basic unit tests for MaterialService (minimum 80% coverage)

### Sprint 2 Completion Criteria  
- [ ] **CRITICAL**: Product APIs handle materialId/materialQuantity fields
- [ ] **CRITICAL**: Simple cost calculation working: `materialCost = pricePerUnit * quantity`
- [ ] Product detail APIs include material information when available
- [ ] Cost recalculation when material price changes (basic version)
- [ ] Performance test: <2s for cost calculations on 100 products

### Overall Success Criteria (MVP Ready)
- [ ] **CRITICAL**: No breaking changes to existing product management  
- [ ] **CRITICAL**: All existing transaction processing works unchanged
- [ ] Database migration safe and reversible
- [ ] Material management functional with basic features
- [ ] Cost calculation integrated with product creation/updates
- [ ] API documentation updated (basic level)
- [ ] Handoff documentation for frontend team

### 🚫 **OUT OF SCOPE** (Future Enhancements)
- Complex ProductType modeling
- Advanced cost breakdown calculations  
- Price history tracking
- Bulk recalculation utilities
- Material supplier management
- Complex business rules and validations
- Advanced reporting features

---

## 💡 Implementation Guidance

### Service Integration Pattern
```typescript
// Follow existing ProductService pattern exactly
export class MaterialService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly userId: string,
  ) {}
  
  // Use same error handling patterns
  // Use same validation patterns
  // Use same type conversion patterns
}
```

### Cost Calculation Example
```typescript
// Simple calculation in ProductService
if (materialId && materialQuantity) {
  const material = await this.prisma.material.findUnique({ where: { id: materialId } })
  if (material) {
    updateData.materialCost = new Decimal(material.pricePerUnit).mul(materialQuantity)
  }
}
```

### Migration Safety Checklist
- [ ] Test on staging environment first
- [ ] All new columns are NULLABLE
- [ ] Foreign keys use ON DELETE SET NULL  
- [ ] Rollback scripts prepared and tested
- [ ] Existing queries validated to work with new schema
- [ ] Transaction processing tested with new fields

---

*This simplified document focuses on MVP implementation with backward compatibility as the top priority. Complex features deferred to future iterations.*