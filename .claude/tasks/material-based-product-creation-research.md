# Material-Based Product Creation Flow: Research & Design

## 📋 Executive Summary

Based on comprehensive research and analysis of the existing Maguru rental system, this document provides concrete recommendations for implementing a material-based product creation flow that transforms the current direct product creation into a hierarchical structure: **Material → ProductType → Product**.

## 🎯 Current System Analysis

### Current Architecture
- **Direct Product Creation**: Products are created with manually set `modalAwal` values
- **3-Tier Architecture**: Presentation → Business Logic → Data Access
- **Tech Stack**: Next.js 15, TypeScript, Prisma, Supabase, TailwindCSS
- **Feature-First Structure**: `/features/[feature-name]/` organization

### Current Product Schema
```prisma
model Product {
  modalAwal       Decimal       @db.Decimal(10, 2) // Manual cost entry
  currentPrice    Decimal       @db.Decimal(10, 2) // Manual pricing
  // ... other fields
}
```

## 🏗️ Recommended Database Schema Design

### 1. Material Entity
```prisma
model Material {
  id              String        @id @default(uuid())
  code            String        @unique // MAT001, FAB001, etc.
  name            String        // "Cotton Fabric", "Silk Thread", etc.
  type            MaterialType  // FABRIC, THREAD, BUTTON, ZIPPER, etc.
  pricePerUnit    Decimal       @db.Decimal(10, 4) // High precision for materials
  unit            String        // "meter", "piece", "gram", etc.
  supplier        String?       // Supplier information
  description     String?
  imageUrl        String?
  isActive        Boolean       @default(true)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  createdBy       String        // User ID from Clerk
  
  // Relations
  productTypes    ProductType[]
  priceHistory    MaterialPriceHistory[]
  
  @@index([type, isActive])
  @@index([code])
  @@index([createdBy])
  @@index([pricePerUnit]) // For cost calculations
}

enum MaterialType {
  FABRIC
  THREAD
  BUTTON
  ZIPPER
  ACCESSORY
  LINING
  PADDING
  OTHER
}

model MaterialPriceHistory {
  id          String   @id @default(uuid())
  materialId  String
  pricePerUnit Decimal @db.Decimal(10, 4)
  effectiveDate DateTime @default(now())
  reason      String?  // "Supplier increase", "Market adjustment", etc.
  createdBy   String
  createdAt   DateTime @default(now())
  
  material    Material @relation(fields: [materialId], references: [id])
  
  @@index([materialId, effectiveDate])
}
```

### 2. ProductType Entity (Material + Processing Template)
```prisma
model ProductType {
  id              String   @id @default(uuid())
  code            String   @unique // PT001, DRESS001, etc.
  name            String   // "Evening Dress Type A", "Casual Shirt Standard"
  description     String?
  materialId      String   // Primary material
  outputQuantity  Int      // How many products this recipe produces
  processingCost  Decimal  @db.Decimal(10, 2) // Labor + overhead per batch
  
  // Material requirements
  materialUsage   ProductTypeMaterial[] // Multiple materials per product type
  
  // Metadata
  estimatedHours  Decimal? @db.Decimal(5, 2) // Production time estimate
  difficulty      Difficulty @default(MEDIUM)
  categoryId      String?  // Optional default category
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdBy       String
  
  // Relations
  material        Material @relation(fields: [materialId], references: [id])
  category        Category? @relation(fields: [categoryId], references: [id])
  products        Product[]
  
  @@index([materialId])
  @@index([categoryId])
  @@index([isActive])
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
  EXPERT
}

// Junction table for complex material requirements
model ProductTypeMaterial {
  id            String      @id @default(uuid())
  productTypeId String
  materialId    String
  quantityNeeded Decimal    @db.Decimal(10, 4) // Amount needed per output unit
  isOptional    Boolean    @default(false)
  notes         String?    // "Primary fabric", "Alternative option", etc.
  
  productType   ProductType @relation(fields: [productTypeId], references: [id], onDelete: Cascade)
  material      Material    @relation(fields: [materialId], references: [id])
  
  @@unique([productTypeId, materialId])
  @@index([productTypeId])
  @@index([materialId])
}
```

### 3. Enhanced Product Entity
```prisma
model Product {
  // ... existing fields ...
  
  // New material-based fields
  productTypeId   String?       // Optional link to product type
  materialCost    Decimal       @db.Decimal(10, 2) // Calculated from materials
  processingCost  Decimal       @db.Decimal(10, 2) // Labor + overhead
  calculatedModalAwal Decimal   @db.Decimal(10, 2) // Auto-calculated: materialCost + processingCost
  modalAwalOverride   Decimal?  @db.Decimal(10, 2) // Manual override if needed
  
  // Actual modalAwal used (computed field in application logic)
  // modalAwal = modalAwalOverride ?? calculatedModalAwal
  
  // Relations
  productType     ProductType? @relation(fields: [productTypeId], references: [id])
  
  @@index([productTypeId])
  @@index([materialCost])
  @@index([calculatedModalAwal])
}
```

## 🔗 API Design Patterns

### 1. Material Management APIs

#### RESTful Endpoint Structure
```typescript
// Material CRUD
GET    /api/materials              // List with filtering
POST   /api/materials              // Create new material
GET    /api/materials/[id]         // Get material details
PUT    /api/materials/[id]         // Update material
DELETE /api/materials/[id]         // Deactivate material

// Price management
GET    /api/materials/[id]/price-history
POST   /api/materials/[id]/price-updates
POST   /api/materials/bulk-price-update

// Cost calculation utilities
POST   /api/materials/calculate-cost // Calculate cost for given materials
GET    /api/materials/cost-analysis/[productTypeId]
```

#### API Response Patterns
```typescript
// GET /api/materials - Paginated list
{
  data: Material[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  },
  summary: {
    totalActiveMaterials: number,
    averagePricePerUnit: number,
    lastUpdated: string
  }
}

// POST /api/materials/calculate-cost - Cost calculation
{
  materials: Array<{
    materialId: string,
    quantity: number,
    currentPrice: number,
    subtotal: number
  }>,
  totalMaterialCost: number,
  processingCost: number,
  calculatedModalAwal: number,
  breakdown: {
    fabricCost: number,
    accessoryCost: number,
    laborCost: number,
    overheadCost: number
  }
}
```

### 2. ProductType Management APIs

```typescript
// ProductType CRUD
GET    /api/product-types
POST   /api/product-types
GET    /api/product-types/[id]
PUT    /api/product-types/[id]
DELETE /api/product-types/[id]

// Cost calculations
GET    /api/product-types/[id]/cost-breakdown
POST   /api/product-types/[id]/calculate-cost
POST   /api/product-types/batch-cost-update

// Material requirements
GET    /api/product-types/[id]/materials
POST   /api/product-types/[id]/materials
PUT    /api/product-types/[id]/materials/[materialId]
DELETE /api/product-types/[id]/materials/[materialId]
```

### 3. Enhanced Product APIs

```typescript
// Enhanced product creation with cost calculation
POST /api/products/create-from-type
{
  productTypeId: string,
  overrides?: {
    materialCost?: number,
    processingCost?: number,
    modalAwalOverride?: number
  },
  productDetails: {
    name: string,
    size?: string,
    colorId?: string,
    quantity: number,
    currentPrice: number
  }
}

// Bulk cost recalculation
POST /api/products/recalculate-costs
PUT  /api/products/[id]/sync-with-material-prices
```

## ⚙️ Business Logic Patterns

### 1. Cost Calculation Service

```typescript
// features/material-management/services/costCalculationService.ts
export class CostCalculationService {
  constructor(
    private prisma: PrismaClient,
    private userId: string
  ) {}

  async calculateProductCost(productTypeId: string): Promise<CostBreakdown> {
    // 1. Get product type with materials
    const productType = await this.prisma.productType.findUnique({
      where: { id: productTypeId },
      include: {
        materialUsage: {
          include: { material: true }
        }
      }
    })

    // 2. Calculate material costs
    const materialCost = await this.calculateMaterialCost(productType.materialUsage)
    
    // 3. Add processing cost
    const processingCost = productType.processingCost
    
    // 4. Calculate final modalAwal
    const calculatedModalAwal = materialCost + processingCost

    return {
      materialCost: new Decimal(materialCost),
      processingCost: new Decimal(processingCost),
      calculatedModalAwal: new Decimal(calculatedModalAwal),
      breakdown: await this.getDetailedBreakdown(productType.materialUsage)
    }
  }

  private async calculateMaterialCost(
    materialUsage: ProductTypeMaterialWithMaterial[]
  ): Promise<number> {
    return materialUsage.reduce((total, usage) => {
      const cost = Number(usage.material.pricePerUnit) * Number(usage.quantityNeeded)
      return total + cost
    }, 0)
  }

  // Price dependency management
  async updatePricesForMaterialChange(materialId: string): Promise<void> {
    // 1. Find all product types using this material
    const affectedProductTypes = await this.prisma.productType.findMany({
      where: {
        materialUsage: {
          some: { materialId }
        }
      }
    })

    // 2. Recalculate costs for all affected products
    for (const productType of affectedProductTypes) {
      await this.recalculateProductsForType(productType.id)
    }
  }
}
```

### 2. Price Dependency Management Pattern

```typescript
// features/material-management/services/priceDependencyService.ts
export class PriceDependencyService {
  // When material price changes, update all dependent products
  async cascadeUpdates(materialId: string, newPrice: Decimal): Promise<void> {
    const transaction = await this.prisma.$transaction(async (tx) => {
      // 1. Update material price
      await tx.material.update({
        where: { id: materialId },
        data: { pricePerUnit: newPrice }
      })

      // 2. Log price history
      await tx.materialPriceHistory.create({
        data: {
          materialId,
          pricePerUnit: newPrice,
          reason: 'Price update cascade',
          createdBy: this.userId
        }
      })

      // 3. Find and update affected products
      const affectedProducts = await this.findAffectedProducts(materialId, tx)
      
      // 4. Bulk update calculated costs
      await this.bulkUpdateCalculatedCosts(affectedProducts, tx)

      return affectedProducts.length
    })

    return transaction
  }

  // Validation before price changes
  async validatePriceChange(materialId: string, newPrice: Decimal): Promise<ValidationResult> {
    const impact = await this.assessPriceChangeImpact(materialId, newPrice)
    
    return {
      isValid: impact.affectedProducts < 100, // Example threshold
      warnings: impact.warnings,
      affectedProductCount: impact.affectedProducts,
      estimatedPriceIncrease: impact.averagePriceIncrease
    }
  }
}
```

### 3. Transaction Handling Pattern

```typescript
// Multi-step product creation with rollback capability
export class ProductCreationService {
  async createProductFromMaterials(request: CreateProductFromMaterialsRequest): Promise<Product> {
    return await this.prisma.$transaction(async (tx) => {
      try {
        // 1. Validate materials availability
        await this.validateMaterialsAvailability(request.materials, tx)
        
        // 2. Calculate costs
        const costBreakdown = await this.calculateCosts(request, tx)
        
        // 3. Create or use product type
        const productType = await this.ensureProductType(request, tx)
        
        // 4. Create product with calculated modalAwal
        const product = await tx.product.create({
          data: {
            ...request.productDetails,
            productTypeId: productType.id,
            materialCost: costBreakdown.materialCost,
            processingCost: costBreakdown.processingCost,
            calculatedModalAwal: costBreakdown.calculatedModalAwal,
            modalAwalOverride: request.modalAwalOverride,
            createdBy: this.userId
          }
        })

        // 5. Log cost calculation for audit
        await this.logCostCalculation(product.id, costBreakdown, tx)

        return product
      } catch (error) {
        // Transaction will auto-rollback
        throw new ProductCreationError(`Failed to create product: ${error.message}`)
      }
    })
  }
}
```

## 🔄 Integration with Current System

### 1. Migration Strategy

#### Phase 1: Schema Addition (Non-breaking)
```sql
-- Add new tables without affecting existing Product table
CREATE TABLE Material (...);
CREATE TABLE ProductType (...);
CREATE TABLE ProductTypeMaterial (...);
CREATE TABLE MaterialPriceHistory (...);

-- Add new optional columns to Product
ALTER TABLE Product ADD COLUMN productTypeId UUID REFERENCES ProductType(id);
ALTER TABLE Product ADD COLUMN materialCost DECIMAL(10,2);
ALTER TABLE Product ADD COLUMN processingCost DECIMAL(10,2);
ALTER TABLE Product ADD COLUMN calculatedModalAwal DECIMAL(10,2);
ALTER TABLE Product ADD COLUMN modalAwalOverride DECIMAL(10,2);
```

#### Phase 2: Data Migration
```typescript
// Migration script to populate default materials and product types
async function migrateExistingProducts() {
  const existingProducts = await prisma.product.findMany()
  
  // Create default materials based on categories
  const materialMap = await createDefaultMaterials()
  
  // Create product types for existing products
  for (const product of existingProducts) {
    const productType = await createProductTypeFromProduct(product, materialMap)
    
    // Update product with calculated costs
    await prisma.product.update({
      where: { id: product.id },
      data: {
        productTypeId: productType.id,
        materialCost: calculateMaterialCost(productType),
        processingCost: product.modalAwal.mul(0.3), // 30% assumed processing
        calculatedModalAwal: product.modalAwal, // Keep current value
        modalAwalOverride: null // No override initially
      }
    })
  }
}
```

#### Phase 3: Backward Compatibility Layer
```typescript
// Maintain compatibility with existing Product API
export class ProductService {
  // Computed property for backward compatibility
  getModalAwal(product: Product): Decimal {
    // Use override if available, otherwise use calculated value
    return product.modalAwalOverride ?? product.calculatedModalAwal ?? product.modalAwal
  }

  // Enhanced product creation supporting both old and new flows
  async createProduct(data: CreateProductRequest): Promise<Product> {
    if (data.productTypeId) {
      // New material-based flow
      return this.createFromProductType(data)
    } else {
      // Legacy direct creation flow
      return this.createDirectProduct(data)
    }
  }
}
```

### 2. Type System Integration

#### Enhanced TypeScript Types
```typescript
// features/material-management/types/index.ts
export interface Material {
  id: string
  code: string
  name: string
  type: MaterialType
  pricePerUnit: number // Client-side number (converted from Decimal)
  unit: string
  supplier?: string
  description?: string
  imageUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface ProductType {
  id: string
  code: string
  name: string
  description?: string
  materialId: string
  outputQuantity: number
  processingCost: number
  materialUsage: ProductTypeMaterial[]
  estimatedHours?: number
  difficulty: Difficulty
  categoryId?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  
  // Relations
  material: Material
  category?: Category
}

export interface CostBreakdown {
  materialCost: number
  processingCost: number
  calculatedModalAwal: number
  breakdown: {
    fabricCost: number
    accessoryCost: number
    laborCost: number
    overheadCost: number
  }
}

// Enhanced Product interface
export interface EnhancedProduct extends Product {
  productTypeId?: string
  materialCost: number
  processingCost: number
  calculatedModalAwal: number
  modalAwalOverride?: number
  
  // Computed properties
  effectiveModalAwal: number // modalAwalOverride ?? calculatedModalAwal
  
  // Relations
  productType?: ProductType
}
```

#### Client-Server Type Conversion
```typescript
// features/material-management/lib/utils/typeConverters.ts
export class MaterialTypeConverter {
  static toClient(serverMaterial: PrismaMaterial): Material {
    return {
      ...serverMaterial,
      pricePerUnit: Number(serverMaterial.pricePerUnit), // Decimal → number
      createdAt: serverMaterial.createdAt.toISOString(),
      updatedAt: serverMaterial.updatedAt.toISOString()
    }
  }

  static toServer(clientMaterial: Partial<Material>): Partial<PrismaMaterial> {
    return {
      ...clientMaterial,
      pricePerUnit: clientMaterial.pricePerUnit ? new Decimal(clientMaterial.pricePerUnit) : undefined
    }
  }
}
```

### 3. Error Handling Patterns

```typescript
// features/material-management/lib/errors/MaterialError.ts
export class MaterialError extends AppError {
  constructor(message: string, code: string = 'MATERIAL_ERROR') {
    super(message, code)
  }
}

export class CostCalculationError extends MaterialError {
  constructor(message: string) {
    super(message, 'COST_CALCULATION_ERROR')
  }
}

export class PriceDependencyError extends MaterialError {
  constructor(message: string, public readonly affectedProducts: string[]) {
    super(message, 'PRICE_DEPENDENCY_ERROR')
  }
}

// Usage in services
try {
  const cost = await this.costCalculationService.calculateProductCost(productTypeId)
} catch (error) {
  if (error instanceof CostCalculationError) {
    // Handle cost calculation specific errors
    throw new BadRequestError(`Cannot calculate cost: ${error.message}`)
  }
  throw error
}
```

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Create Material and ProductType database schemas
- [ ] Implement basic Material CRUD APIs
- [ ] Create Material management UI components
- [ ] Add cost calculation service foundation

### Phase 2: Product Type Management (Week 3-4)
- [ ] Implement ProductType CRUD APIs
- [ ] Create ProductType management UI
- [ ] Add material usage configuration
- [ ] Implement cost calculation endpoints

### Phase 3: Enhanced Product Creation (Week 5-6)
- [ ] Add material-based product creation flow
- [ ] Implement cost calculation integration
- [ ] Add price dependency management
- [ ] Create migration scripts for existing data

### Phase 4: UI Integration & Testing (Week 7-8)
- [ ] Update product creation forms
- [ ] Add cost breakdown displays
- [ ] Implement price change impact analysis
- [ ] Comprehensive testing and debugging

## 🎯 Key Benefits

### Business Benefits
- **Accurate Cost Tracking**: Real-time material cost integration
- **Price Consistency**: Automated cost updates when material prices change
- **Inventory Insights**: Better understanding of material usage patterns
- **Profit Margin Analysis**: Clear separation of material vs. processing costs

### Technical Benefits
- **Maintainable Architecture**: Clean separation of concerns following existing patterns
- **Type Safety**: Full TypeScript integration with proper type conversions
- **Backward Compatibility**: Existing products continue to work during migration
- **Scalable Design**: Supports complex product hierarchies and material relationships

### Operational Benefits
- **Reduced Manual Entry**: Automated cost calculations reduce human error
- **Consistent Pricing**: Material price changes automatically propagate
- **Audit Trail**: Complete history of cost calculations and price changes
- **Data-Driven Decisions**: Rich analytics on material costs and product profitability

## 📊 Performance Considerations

### Database Optimization
- **Strategic Indexing**: Indexes on cost calculation fields and material relationships
- **Query Optimization**: Efficient joins for cost calculation queries
- **Caching Strategy**: Cache frequent cost calculations and material lookups
- **Batch Operations**: Bulk updates for price changes affecting multiple products

### API Performance
- **Response Caching**: Cache cost calculations for unchanged materials
- **Pagination**: Large material lists with efficient filtering
- **Background Jobs**: Async processing for bulk price updates
- **Rate Limiting**: Protect cost calculation endpoints from abuse

## 🔐 Security Considerations

### Data Protection
- **Price Information**: Sensitive cost data requires proper access control
- **Audit Logging**: All cost changes logged with user attribution
- **Input Validation**: Strict validation on price and quantity inputs
- **Role-Based Access**: Material management restricted to appropriate roles

### Business Logic Security
- **Cost Calculation Integrity**: Validate all cost calculation inputs
- **Price Change Controls**: Approval workflows for significant price changes
- **Data Consistency**: Transactional updates prevent inconsistent states
- **Backup and Recovery**: Material and cost data backup strategies

---

**Document Status**: Research Complete | Ready for Implementation Planning
**Author**: Claude Code Assistant
**Last Updated**: 2025-01-13
**Next Steps**: Review recommendations and create detailed implementation plan