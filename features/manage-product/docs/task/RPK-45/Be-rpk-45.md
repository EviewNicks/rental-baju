# BE-RPK-45: Backend Development - Material Management System

**Parent Task**: RPK-45  
**Phase**: 1 - Backend Development  
**Priority**: High  
**Sprint**: 1-2 (Week 1-4)  
**Story Points**: 13  
**Developer**: Backend Team  
**Created**: 2025-08-13  
**Status**: Planning  

---

## =Ë Phase Overview

**Focus**: Database schema design, API development, and business logic implementation for Material Management System.

**Objective**: Create robust backend infrastructure supporting Material ’ ProductType ’ Product hierarchy with automated cost calculation capabilities.

**Key Deliverables**:
- Complete database schema for Material and ProductType models
- RESTful APIs for material and product type management  
- Cost calculation business logic services
- Database migration scripts with data integrity
- Comprehensive unit and integration tests

---

## <¯ Sprint Breakdown

### Sprint 1: Database Foundation & Material APIs (Week 1-2)
**Story Points**: 8

#### Database Schema Implementation
**Tasks**:
- [ ] **[BE-001]** Create Material table schema with proper constraints
- [ ] **[BE-002]** Create ProductType table schema with material relationships  
- [ ] **[BE-003]** Update Product table with material tracking columns
- [ ] **[BE-004]** Add foreign key constraints and performance indexes
- [ ] **[BE-005]** Create database migration scripts with rollback capability

**Acceptance Criteria**:
- Material table supports: name, type, pricePerUnit, unit, supplier, description
- ProductType table links materials with processing costs
- Product table enhanced with materialId, productTypeId, materialCost fields
- All foreign key constraints properly configured
- Performance indexes created for query optimization
- Migration scripts tested on staging environment

#### Material Management APIs
**Tasks**:
- [ ] **[BE-006]** Implement GET /api/materials with search and filtering
- [ ] **[BE-007]** Create POST /api/materials with validation
- [ ] **[BE-008]** Implement PUT /api/materials/[id] for updates
- [ ] **[BE-009]** Create DELETE /api/materials/[id] with soft delete
- [ ] **[BE-010]** Add GET /api/materials/price-history/[id] endpoint

**Acceptance Criteria**:
- All CRUD operations working with proper HTTP status codes
- Request validation with detailed error messages
- Pagination support for material listings
- Search functionality by name, type, and supplier
- Price history tracking with audit trail
- Soft delete maintaining referential integrity

#### MaterialService Business Logic
**Tasks**:
- [ ] **[BE-011]** Create MaterialService class with CRUD methods
- [ ] **[BE-012]** Implement material filtering and search logic
- [ ] **[BE-013]** Add price update functionality with history tracking
- [ ] **[BE-014]** Create material validation rules
- [ ] **[BE-015]** Add error handling and logging

**Acceptance Criteria**:
- Service layer abstracts database operations from controllers
- Comprehensive validation for material data integrity
- Price history automatically tracked on updates  
- Error handling with meaningful messages
- Logging for audit and debugging purposes

### Sprint 2: ProductType & Cost Calculation (Week 3-4)  
**Story Points**: 5

#### ProductType Management APIs
**Tasks**:
- [ ] **[BE-016]** Implement GET /api/product-types with filtering
- [ ] **[BE-017]** Create POST /api/product-types with material validation
- [ ] **[BE-018]** Add PUT /api/product-types/[id] for updates
- [ ] **[BE-019]** Implement DELETE /api/product-types/[id] with checks
- [ ] **[BE-020]** Create POST /api/product-types/calculate-cost endpoint

**Acceptance Criteria**:
- ProductType CRUD operations fully functional
- Material availability validation before saving
- Cost calculation endpoint with real-time processing
- Dependency checking before deletion
- Performance optimization for cost calculations

#### Cost Calculation Services  
**Tasks**:
- [ ] **[BE-021]** Create CostCalculationService class
- [ ] **[BE-022]** Implement calculateModalAwal method
- [ ] **[BE-023]** Add calculateTotalCost with breakdown
- [ ] **[BE-024]** Create recalculateProductCosts for price changes
- [ ] **[BE-025]** Add cost validation and error handling

**Acceptance Criteria**:
- Formula: `modalAwal = (material.pricePerUnit × quantity) + processingCost`
- Cost breakdown includes: material cost, processing cost, labor cost, overhead
- Bulk recalculation when material prices change
- Validation prevents negative costs and invalid calculations
- Performance target: cost calculations complete within 500ms

#### Enhanced Product APIs
**Tasks**:
- [ ] **[BE-026]** Add POST /api/products/calculate-modal-awal endpoint
- [ ] **[BE-027]** Create GET /api/products/cost-breakdown/[id]
- [ ] **[BE-028]** Implement PUT /api/products/recalculate-costs
- [ ] **[BE-029]** Update product creation with cost calculation
- [ ] **[BE-030]** Add cost override functionality for admin users

**Acceptance Criteria**:
- Product creation automatically calculates costs when productTypeId provided
- Cost breakdown API returns detailed material and processing costs
- Bulk recalculation endpoint for administrative use
- Admin override capability with audit logging
- Backward compatibility with existing product creation flow

---

## =Ê Database Schema Details

### New Tables

#### Material Table
```sql
CREATE TABLE "Material" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL, -- fabric, accessory, component
  "pricePerUnit" DECIMAL(10,2) NOT NULL,
  "unit" TEXT NOT NULL, -- meter, piece, kg
  "supplier" TEXT,
  "description" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  
  CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);
```

#### ProductType Table  
```sql
CREATE TABLE "ProductType" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "materialId" TEXT NOT NULL,
  "outputQuantity" INTEGER NOT NULL DEFAULT 1,
  "processingCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "laborCost" DECIMAL(10,2) DEFAULT 0,
  "overheadCost" DECIMAL(10,2) DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  
  CONSTRAINT "ProductType_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductType_materialId_fkey" 
    FOREIGN KEY ("materialId") REFERENCES "Material"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE
);
```

### Product Table Updates
```sql
ALTER TABLE "Product" 
ADD COLUMN "materialId" TEXT,
ADD COLUMN "productTypeId" TEXT,
ADD COLUMN "materialCost" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN "processingCost" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN "isCalculated" BOOLEAN DEFAULT false;

-- Foreign key constraints (nullable for backward compatibility)
ALTER TABLE "Product" ADD CONSTRAINT "Product_materialId_fkey" 
FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Product" ADD CONSTRAINT "Product_productTypeId_fkey" 
FOREIGN KEY ("productTypeId") REFERENCES "ProductType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

### Performance Indexes
```sql
CREATE INDEX "idx_material_active_type" ON "Material"("isActive", "type");
CREATE INDEX "idx_product_type_material" ON "ProductType"("materialId", "isActive");
CREATE INDEX "idx_product_material_calculated" ON "Product"("materialId", "isCalculated");
CREATE INDEX "idx_material_supplier" ON "Material"("supplier", "isActive");
CREATE INDEX "idx_product_type_cost" ON "ProductType"("processingCost", "isActive");
```

---

## =' API Specifications

### Material Management Endpoints

#### GET /api/materials
**Purpose**: Retrieve materials with search and filtering
**Query Parameters**:
- `search` (string): Search by name or supplier
- `type` (string): Filter by material type
- `isActive` (boolean): Filter by active status
- `page` (number): Page number for pagination
- `limit` (number): Items per page (default: 10)

**Response**:
```typescript
{
  data: Material[],
  pagination: {
    page: number,
    limit: number, 
    total: number,
    totalPages: number
  },
  summary: {
    activeCount: number,
    inactiveCount: number,
    typeBreakdown: Record<string, number>
  }
}
```

#### POST /api/materials
**Purpose**: Create new material
**Request Body**:
```typescript
{
  name: string,
  type: 'fabric' | 'accessory' | 'component',
  pricePerUnit: number,
  unit: string,
  supplier?: string,
  description?: string
}
```

#### PUT /api/materials/[id]
**Purpose**: Update material information
**Special Handling**:
- Price updates automatically create price history entry
- Type changes require validation against existing ProductTypes
- Name changes propagate to related ProductTypes

#### GET /api/materials/price-history/[id]
**Purpose**: Retrieve material price change history
**Response**:
```typescript
{
  materialId: string,
  materialName: string,
  history: Array<{
    id: string,
    previousPrice: number,
    newPrice: number,
    changeDate: string,
    changedBy: string,
    reason?: string
  }>
}
```

### ProductType Management Endpoints

#### GET /api/product-types
**Purpose**: Retrieve product types with cost information
**Query Parameters**:
- `materialId` (string): Filter by material
- `isActive` (boolean): Filter by active status
- `includeCalculations` (boolean): Include cost breakdowns

#### POST /api/product-types/calculate-cost
**Purpose**: Calculate costs for given material and quantities
**Request Body**:
```typescript
{
  materialId: string,
  quantity: number,
  processingCost: number,
  laborCost?: number,
  overheadCost?: number
}
```

**Response**:
```typescript
{
  materialCost: number,
  processingCost: number,
  laborCost: number,
  overheadCost: number,
  totalCost: number,
  costPerUnit: number,
  breakdown: {
    materialPercentage: number,
    processingPercentage: number,
    laborPercentage: number,
    overheadPercentage: number
  }
}
```

---

##  Definition of Done

### Sprint 1 Completion Criteria
- [ ] All Material table operations (CRUD) working correctly
- [ ] Material price history tracking functional
- [ ] Database migration scripts tested on staging
- [ ] Material APIs documented in OpenAPI format
- [ ] Unit tests achieving >95% coverage for MaterialService
- [ ] Integration tests passing for all Material endpoints
- [ ] Performance benchmarks met (<500ms for queries)

### Sprint 2 Completion Criteria  
- [ ] ProductType CRUD operations fully functional
- [ ] Cost calculation formulas working correctly
- [ ] Product APIs enhanced with cost calculation
- [ ] All backend services properly tested
- [ ] API documentation complete and accurate
- [ ] Migration scripts ready for production deployment
- [ ] Performance targets met for cost calculations (<2s)

### Overall Phase 1 Success Criteria
- [ ] Database schema supports complete Material ’ ProductType ’ Product hierarchy
- [ ] All APIs functional with proper validation and error handling
- [ ] Cost calculation accuracy verified with test cases
- [ ] Migration strategy tested and documented
- [ ] Code coverage >95% for all new services
- [ ] Performance benchmarks met across all operations
- [ ] Security review completed for new endpoints
- [ ] Documentation complete for handoff to frontend team

---

*This document defines the complete backend implementation scope for RPK-45 Phase 1. All acceptance criteria must be met before progressing to Frontend Development phase.*