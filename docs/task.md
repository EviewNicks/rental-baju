# Advanced Size Management System - FULL MIGRATION STRATEGY

Implementasi complete migration ke advanced size management untuk rental clothing system dengan eliminasi legacy approach.

**Strategic Decision**: Complete migration from legacy single-size to advanced multi-size system
**Approach**: Advanced-Only Architecture (Breaking Changes Accepted)
**Implementation Status**: Migration Phase - Legacy Cleanup Required

---

## 🎯 STRATEGIC OVERVIEW

### Core Decision Rationale

**Problems with Hybrid Approach:**
- Dual validation logic complexity
- Developer confusion between modes
- System integration difficulties (Kasir system)
- Technical debt accumulation
- Testing scenario multiplication

**Benefits of Advanced-Only:**
- Single source of truth for size data
- Clean architecture foundation
- Simplified system integration
- Future-proof scalability
- Reduced maintenance overhead

### Business Impact Assessment

**Acceptable Breaking Changes:**
- ✅ Legacy `quantity` and `size` fields removal
- ✅ API interface modifications
- ✅ Frontend component restructuring
- ✅ Data migration requirements

**Preserved Business Value:**
- ✅ Enhanced size tracking capabilities
- ✅ Age category business intelligence
- ✅ Rental operation precision
- ✅ Analytics and reporting depth

---

## 📋 TECHNICAL SPECIFICATIONS

### 1. Advanced Size Management Core Schema

```typescript
// PRIMARY: Advanced Size Structure (Single Source of Truth)
interface ProductSize {
  id: string
  productId: string
  ageCategory: 'ADULT' | 'CHILD' | 'UNIVERSAL'
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'
  quantity: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

// REMOVED: Legacy Fields (Breaking Change)
interface Product {
  // quantity: number ❌ REMOVED
  // size?: string ❌ REMOVED
  // hasSizes?: boolean ❌ REMOVED

  // NEW: Required Advanced Fields
  sizes: ProductSize[] // REQUIRED - minimum 1 size
}

// API Request Interface (Simplified)
interface CreateProductRequest {
  code: string
  name: string
  description?: string
  modalAwal: number
  currentPrice: number
  categoryId: string
  colorId?: string
  materialId?: string
  materialQuantity?: number
  sizes: CreateProductSizeRequest[] // REQUIRED - no fallback
  image?: File
}

interface CreateProductSizeRequest {
  ageCategory: 'ADULT' | 'CHILD' | 'UNIVERSAL'
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'
  quantity: number
  isActive?: boolean // default: true
}
```

### 2. Aggregation Service Layer

```typescript
// Enhanced Aggregation for User Display
class ProductSizeAggregationService {
  // Primary aggregation method
  async getAggregatedSizes(productId: string): Promise<AggregatedSizeView[]>

  // Total quantity calculation
  async getTotalQuantity(productId: string): Promise<number>

  // Business intelligence methods
  async getCategoryBreakdown(productId: string): Promise<CategoryBreakdown>
  async getAvailableStock(productId: string): Promise<StockBySize>
  async validateBusinessConsistency(productId: string): Promise<ValidationResult>
}

interface AggregatedSizeView {
  size: SizeEnum
  totalQuantity: number // M: 5 total
  breakdown: {
    adult?: number    // Dewasa: 2
    child?: number    // Anak: 3
    universal?: number
  }
  hasMultipleCategories: boolean
  availableForRental: number // considering rented stock
}

interface CategoryBreakdown {
  adult: number
  child: number
  universal: number
  total: number
  distribution: {
    adultPercentage: number
    childPercentage: number
    universalPercentage: number
  }
}
```

### 3. Migration Strategy Specifications

```typescript
// Legacy Data Migration Service
class LegacyMigrationService {
  // Main migration execution
  async migrateLegacyProducts(): Promise<MigrationResult>

  // Individual product migration
  async migrateProduct(productId: string): Promise<ProductMigrationResult>

  // Migration validation
  async validateMigration(): Promise<ValidationSummary>

  // Rollback capability (emergency)
  async rollbackMigration(migrationId: string): Promise<RollbackResult>
}

interface MigrationStrategy {
  // Default migration rules
  defaultAgeCategory: 'UNIVERSAL' // for products without age context
  defaultSize: 'M' // when legacy size is null/empty
  preserveQuantity: boolean // true - maintain total quantities

  // Custom migration rules
  categoryMappings: Record<string, 'ADULT' | 'CHILD' | 'UNIVERSAL'>
  sizeMappings: Record<string, SizeEnum>

  // Migration metadata
  migrationBatch: string
  timestamp: Date
  migratedBy: string
}

interface MigrationResult {
  totalProducts: number
  migratedSuccessfully: number
  migrationErrors: number
  validationWarnings: number
  executionTime: number
  errors: MigrationError[]
  summary: MigrationSummary
}
```

---

## 🚀 IMPLEMENTATION ROADMAP

### Phase 1: Legacy Cleanup & Migration (Week 1-2)

#### 1.1 Database Migration Preparation
**Duration**: 2-3 days

```sql
-- Migration Script Preview
BEGIN TRANSACTION;

-- Create temporary backup table
CREATE TABLE product_legacy_backup AS SELECT * FROM products;

-- Migrate products without sizes to default advanced structure
INSERT INTO product_sizes (product_id, age_category, size, quantity, is_active, created_by)
SELECT
    id,
    'UNIVERSAL' as age_category,
    COALESCE(size, 'M') as size,
    COALESCE(quantity, 1) as quantity,
    true as is_active,
    created_by
FROM products
WHERE id NOT IN (SELECT DISTINCT product_id FROM product_sizes);

-- Validation: Ensure all products have at least one size
-- Expected: 0 products without sizes after migration
SELECT COUNT(*) as products_without_sizes
FROM products p
LEFT JOIN product_sizes ps ON p.id = ps.product_id
WHERE ps.id IS NULL;

COMMIT;
```

#### 1.2 TypeScript Interface Updates
**Duration**: 1 day

```typescript
// FILE: features/manage-product/types/index.ts

// BEFORE (Remove completely)
export interface CreateProductRequest {
  // quantity: number ❌ REMOVED
  // size?: string ❌ REMOVED
  // hasSizes?: boolean ❌ REMOVED
}

// AFTER (Advanced-only)
export interface CreateProductRequest {
  code: string
  name: string
  description?: string
  modalAwal: number
  currentPrice: number
  categoryId: string
  colorId?: string
  materialId?: string
  materialQuantity?: number
  sizes: CreateProductSizeRequest[] // REQUIRED
  image?: File
}

// Remove separate hybrid interfaces
// ❌ CreateProductWithSizesRequest - not needed anymore
// ❌ UpdateProductWithSizesRequest - not needed anymore
```

#### 1.3 API Endpoint Simplification
**Duration**: 2 days

```typescript
// FILE: app/api/products/route.ts

export async function POST(request: NextRequest) {
  const formData = await request.formData()

  // REMOVED: Legacy field parsing
  // const quantityStr = formData.get('quantity') ❌
  // const size = formData.get('size') ❌
  // const hasSizes = formData.get('hasSizes') ❌

  // REQUIRED: Advanced fields only
  const sizesStr = formData.get('sizes') as string // REQUIRED

  if (!sizesStr) {
    return NextResponse.json(
      { error: { message: 'Sizes field is required', code: 'VALIDATION_ERROR' } },
      { status: 400 }
    )
  }

  let sizes: CreateProductSizeRequest[]
  try {
    sizes = JSON.parse(sizesStr)
    if (!Array.isArray(sizes) || sizes.length === 0) {
      throw new Error('Minimal 1 ukuran harus ditambahkan')
    }
  } catch {
    return NextResponse.json(
      { error: { message: 'Format data ukuran tidak valid', code: 'VALIDATION_ERROR' } },
      { status: 400 }
    )
  }

  // Single validation schema
  const validatedData = createProductAdvancedSchema.parse({
    ...otherFields,
    sizes
  })

  // Single service method
  const product = await productService.createProductAdvanced(validatedData)

  return NextResponse.json(product, { status: 201 })
}
```

### Phase 2: Service Layer Restructuring (Week 2-3)

#### 2.1 ProductService Simplification
**Duration**: 3 days

```typescript
// FILE: features/manage-product/services/productService.ts

export class ProductService {
  // REMOVED: Legacy methods
  // createProduct() ❌
  // createProductWithSizes() ❌

  // SINGLE: Advanced method only
  async createProductAdvanced(request: CreateProductAdvancedRequest): Promise<Product> {
    const validatedData = createProductAdvancedSchema.parse(request)

    // Validate sizes array
    if (!validatedData.sizes || validatedData.sizes.length === 0) {
      throw new ValidationError('Minimal 1 ukuran harus ditambahkan')
    }

    // Business validation
    await this.validateSizeConsistency(validatedData.sizes)
    await this.validateUniqueAgeCategories(validatedData.sizes)

    // Create product with sizes in transaction
    return await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          ...productData,
          sizes: {
            create: validatedData.sizes.map(size => ({
              ageCategory: size.ageCategory,
              size: size.size,
              quantity: size.quantity,
              isActive: size.isActive ?? true,
              createdBy: this.userId
            }))
          }
        },
        include: {
          sizes: true,
          category: true,
          color: true,
          material: true
        }
      })

      return product
    })
  }

  // Enhanced business validation
  private async validateSizeConsistency(sizes: CreateProductSizeRequest[]): Promise<void> {
    // Check for duplicate size+ageCategory combinations
    const combinations = sizes.map(s => `${s.size}-${s.ageCategory}`)
    const uniqueCombinations = new Set(combinations)

    if (combinations.length !== uniqueCombinations.size) {
      throw new ValidationError('Duplikasi kombinasi ukuran dan kategori umur tidak diperbolehkan')
    }
  }

  private async validateUniqueAgeCategories(sizes: CreateProductSizeRequest[]): Promise<void> {
    // Business rule: Each size can appear max once per age category
    const sizeAgeMap = new Map<string, Set<string>>()

    for (const sizeData of sizes) {
      if (!sizeAgeMap.has(sizeData.size)) {
        sizeAgeMap.set(sizeData.size, new Set())
      }

      const ageCategories = sizeAgeMap.get(sizeData.size)!
      if (ageCategories.has(sizeData.ageCategory)) {
        throw new ValidationError(`Ukuran ${sizeData.size} sudah ada untuk kategori ${sizeData.ageCategory}`)
      }

      ageCategories.add(sizeData.ageCategory)
    }
  }
}
```

#### 2.2 Enhanced Aggregation Service
**Duration**: 2 days

```typescript
// FILE: features/manage-product/services/productSizeAggregationService.ts

export class ProductSizeAggregationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly config: AggregationConfig = {
      enableCaching: true,
      cacheExpiryMinutes: 5,
      includeBreakdown: true
    }
  ) {}

  async getProductAggregation(productId: string): Promise<ProductSizeAggregation> {
    const cacheKey = `agg:${productId}:${this.config.includeBreakdown}`

    // Try cache first
    if (this.config.enableCaching) {
      const cached = await this.getCachedAggregation(cacheKey)
      if (cached) return cached
    }

    const startTime = Date.now()

    // Get all sizes for product
    const sizes = await this.prisma.productSize.findMany({
      where: { productId, isActive: true },
      orderBy: [
        { size: 'asc' },
        { ageCategory: 'asc' }
      ]
    })

    if (sizes.length === 0) {
      throw new NotFoundError(`Tidak ada ukuran aktif untuk produk ${productId}`)
    }

    // Calculate aggregation
    const aggregatedSizes = this.calculateAggregatedSizes(sizes)
    const categoryBreakdown = this.calculateCategoryBreakdown(sizes)
    const totalQuantity = sizes.reduce((sum, size) => sum + size.quantity, 0)

    const result: ProductSizeAggregation = {
      productId,
      totalQuantity,
      aggregatedSizes,
      hasAdvancedSizing: true, // Always true in advanced-only mode
      categoryBreakdown,
      lastCalculated: new Date(),
      metadata: {
        calculatedAt: new Date(),
        fromCache: false,
        calculationTimeMs: Date.now() - startTime,
        performance: this.evaluatePerformance(Date.now() - startTime)
      }
    }

    // Cache result
    if (this.config.enableCaching) {
      await this.setCachedAggregation(cacheKey, result)
    }

    return result
  }

  private calculateAggregatedSizes(sizes: ProductSize[]): AggregatedSizeView[] {
    const sizeGroups = new Map<string, ProductSize[]>()

    // Group by size
    for (const size of sizes) {
      if (!sizeGroups.has(size.size)) {
        sizeGroups.set(size.size, [])
      }
      sizeGroups.get(size.size)!.push(size)
    }

    // Calculate aggregated view for each size
    return Array.from(sizeGroups.entries()).map(([sizeValue, sizeItems]) => {
      const totalQuantity = sizeItems.reduce((sum, item) => sum + item.quantity, 0)
      const breakdown = {
        adult: sizeItems.filter(s => s.ageCategory === 'ADULT').reduce((sum, s) => sum + s.quantity, 0) || undefined,
        child: sizeItems.filter(s => s.ageCategory === 'CHILD').reduce((sum, s) => sum + s.quantity, 0) || undefined,
        universal: sizeItems.filter(s => s.ageCategory === 'UNIVERSAL').reduce((sum, s) => sum + s.quantity, 0) || undefined
      }

      // Remove undefined values
      Object.keys(breakdown).forEach(key => {
        if (breakdown[key as keyof typeof breakdown] === undefined) {
          delete breakdown[key as keyof typeof breakdown]
        }
      })

      return {
        size: sizeValue as SizeEnum,
        totalQuantity,
        breakdown,
        hasMultipleCategories: sizeItems.length > 1,
        availableForRental: totalQuantity // TODO: subtract rented quantities
      }
    })
  }

  private evaluatePerformance(calculationTimeMs: number): 'excellent' | 'good' | 'needs_attention' {
    if (calculationTimeMs < 50) return 'excellent'
    if (calculationTimeMs < 100) return 'good'
    return 'needs_attention'
  }
}
```

### Phase 3: Frontend Component Restructuring (Week 3-4)

#### 3.1 Simplified Product Form
**Duration**: 3 days

```tsx
// FILE: features/manage-product/components/form-product/ProductForm.tsx

interface ProductFormProps {
  mode: 'create' | 'edit'
  initialData?: ClientProduct
  onSubmit: (data: CreateProductAdvancedRequest) => Promise<void>
}

export function ProductForm({ mode, initialData, onSubmit }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    code: '',
    name: '',
    description: '',
    modalAwal: 0,
    currentPrice: 0,
    categoryId: '',
    colorId: '',
    materialId: '',
    materialQuantity: 0,
    sizes: [] // REQUIRED - no legacy fallback
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (formData.sizes.length === 0) {
      toast.error('Minimal 1 ukuran harus ditambahkan')
      return
    }

    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic product fields */}
      <ProductBasicFields
        data={formData}
        onChange={setFormData}
      />

      {/* Advanced size management - REQUIRED */}
      <SizeManagementSection
        sizes={formData.sizes}
        onChange={(sizes) => setFormData(prev => ({ ...prev, sizes }))}
        required={true} // Always required in advanced-only mode
      />

      {/* Material management - optional */}
      <MaterialManagementSection
        materialId={formData.materialId}
        materialQuantity={formData.materialQuantity}
        onChange={(material) => setFormData(prev => ({ ...prev, ...material }))}
      />

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Batal
        </Button>
        <Button type="submit" disabled={formData.sizes.length === 0}>
          {mode === 'create' ? 'Buat Produk' : 'Update Produk'}
        </Button>
      </div>
    </form>
  )
}
```

#### 3.2 Enhanced Size Management Component
**Duration**: 2 days

```tsx
// FILE: features/manage-product/components/size-management/SizeManagementSection.tsx

interface SizeManagementSectionProps {
  sizes: CreateProductSizeRequest[]
  onChange: (sizes: CreateProductSizeRequest[]) => void
  required?: boolean
  showAggregation?: boolean
}

export function SizeManagementSection({
  sizes,
  onChange,
  required = true,
  showAggregation = true
}: SizeManagementSectionProps) {
  const [selectedSize, setSelectedSize] = useState<SizeEnum>('M')
  const [selectedAgeCategory, setSelectedAgeCategory] = useState<AgeCategory>('UNIVERSAL')
  const [quantity, setQuantity] = useState<number>(1)

  const addSize = () => {
    // Validate duplicate
    const existing = sizes.find(s =>
      s.size === selectedSize && s.ageCategory === selectedAgeCategory
    )

    if (existing) {
      toast.error(`Kombinasi ${selectedSize} - ${selectedAgeCategory} sudah ada`)
      return
    }

    const newSize: CreateProductSizeRequest = {
      size: selectedSize,
      ageCategory: selectedAgeCategory,
      quantity,
      isActive: true
    }

    onChange([...sizes, newSize])
    setQuantity(1) // Reset for next entry
  }

  const removeSize = (index: number) => {
    const newSizes = sizes.filter((_, i) => i !== index)
    onChange(newSizes)
  }

  const updateQuantity = (index: number, newQuantity: number) => {
    const newSizes = [...sizes]
    newSizes[index] = { ...newSizes[index], quantity: newQuantity }
    onChange(newSizes)
  }

  // Calculate aggregated display
  const aggregatedSizes = useMemo(() => {
    if (!showAggregation) return []

    const sizeGroups = new Map<SizeEnum, { total: number; breakdown: Record<AgeCategory, number> }>()

    sizes.forEach(size => {
      if (!sizeGroups.has(size.size)) {
        sizeGroups.set(size.size, {
          total: 0,
          breakdown: { ADULT: 0, CHILD: 0, UNIVERSAL: 0 }
        })
      }

      const group = sizeGroups.get(size.size)!
      group.total += size.quantity
      group.breakdown[size.ageCategory] += size.quantity
    })

    return Array.from(sizeGroups.entries()).map(([size, data]) => ({
      size,
      total: data.total,
      breakdown: data.breakdown
    }))
  }, [sizes, showAggregation])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Manajemen Ukuran {required && <span className="text-red-500">*</span>}
        </h3>
        <Badge variant="outline">
          {sizes.length} ukuran tersimpan
        </Badge>
      </div>

      {/* Size Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tambah Ukuran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="size">Ukuran</Label>
              <Select value={selectedSize} onValueChange={(value) => setSelectedSize(value as SizeEnum)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                    <SelectItem key={size} value={size}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="ageCategory">Kategori Umur</Label>
              <Select value={selectedAgeCategory} onValueChange={(value) => setSelectedAgeCategory(value as AgeCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNIVERSAL">Universal</SelectItem>
                  <SelectItem value="ADULT">Dewasa</SelectItem>
                  <SelectItem value="CHILD">Anak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity">Jumlah</Label>
              <Input
                type="number"
                min="1"
                max="999"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={addSize} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Tambah
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aggregated Display */}
      {showAggregation && aggregatedSizes.length > 0 && (
        <AggregatedSizeDisplay
          aggregatedSizes={aggregatedSizes}
          totalQuantity={sizes.reduce((sum, s) => sum + s.quantity, 0)}
        />
      )}

      {/* Size List */}
      {sizes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daftar Ukuran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sizes.map((size, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline">{size.size}</Badge>
                    <Badge variant="secondary">{size.ageCategory}</Badge>
                    <span className="font-medium">{size.quantity} pcs</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min="1"
                      max="999"
                      value={size.quantity}
                      onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeSize(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Message */}
      {required && sizes.length === 0 && (
        <div className="flex items-center space-x-2 text-amber-600">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Minimal 1 ukuran harus ditambahkan untuk melanjutkan</span>
        </div>
      )}
    </div>
  )
}
```

### Phase 4: System Integration Preparation (Week 4-5)

#### 4.1 Kasir System Integration Interface
**Duration**: 2 days

```typescript
// FILE: features/kasir/types/product-integration.ts

// Enhanced product interface for Kasir system
interface KasirProductView {
  id: string
  code: string
  name: string
  currentPrice: number
  category: { id: string; name: string; color: string }
  color?: { id: string; name: string; hexCode: string }

  // Advanced size information
  availableSizes: KasirAvailableSize[]
  totalAvailableStock: number
  hasMultipleSizes: boolean
  sizeMode: 'single' | 'multiple' // for UI display logic
}

interface KasirAvailableSize {
  size: SizeEnum
  ageCategory: AgeCategory
  availableQuantity: number // total - rented
  displayName: string // "M (Dewasa)" or "M (Anak)"
}

// Rental transaction interface
interface RentalTransactionItem {
  productId: string
  productCode: string
  productName: string

  // Enhanced size tracking
  selectedSize: SizeEnum
  selectedAgeCategory: AgeCategory
  sizeDisplayName: string

  quantity: number
  pricePerItem: number
  totalPrice: number

  // Tracking metadata
  sizeId: string // ProductSize.id for precise tracking
  reservedAt: Date
}
```

#### 4.2 Integration Service Layer
**Duration**: 3 days

```typescript
// FILE: features/kasir/services/productIntegrationService.ts

export class ProductIntegrationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly userId: string
  ) {}

  async getAvailableProducts(filters?: KasirProductFilters): Promise<KasirProductView[]> {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        status: 'AVAILABLE',
        ...filters
      },
      include: {
        sizes: {
          where: { isActive: true },
          orderBy: [{ size: 'asc' }, { ageCategory: 'asc' }]
        },
        category: true,
        color: true
      }
    })

    return products.map(product => this.transformToKasirView(product))
  }

  async getProductAvailability(productId: string): Promise<KasirAvailableSize[]> {
    const sizes = await this.prisma.productSize.findMany({
      where: {
        productId,
        isActive: true
      },
      include: {
        _count: {
          select: {
            rentalItems: {
              where: {
                transaction: {
                  status: 'ACTIVE' // Currently rented
                }
              }
            }
          }
        }
      }
    })

    return sizes.map(size => ({
      size: size.size as SizeEnum,
      ageCategory: size.ageCategory as AgeCategory,
      availableQuantity: size.quantity - size._count.rentalItems,
      displayName: this.formatSizeDisplay(size.size, size.ageCategory)
    }))
  }

  async reserveProductSize(
    productId: string,
    sizeId: string,
    quantity: number,
    transactionId: string
  ): Promise<SizeReservationResult> {
    return await this.prisma.$transaction(async (tx) => {
      // Get current size availability
      const productSize = await tx.productSize.findUnique({
        where: { id: sizeId },
        include: {
          _count: {
            select: {
              rentalItems: {
                where: {
                  transaction: { status: 'ACTIVE' }
                }
              }
            }
          }
        }
      })

      if (!productSize) {
        throw new NotFoundError(`ProductSize dengan ID ${sizeId} tidak ditemukan`)
      }

      const availableQuantity = productSize.quantity - productSize._count.rentalItems

      if (availableQuantity < quantity) {
        throw new ConflictError(
          `Stok tidak mencukupi. Tersedia: ${availableQuantity}, Diminta: ${quantity}`
        )
      }

      // Create rental item with precise size tracking
      const rentalItem = await tx.rentalTransactionItem.create({
        data: {
          transactionId,
          productId,
          productSizeId: sizeId,
          quantity,
          pricePerItem: productSize.product.currentPrice,
          totalPrice: productSize.product.currentPrice.mul(quantity),
          reservedAt: new Date(),
          createdBy: this.userId
        }
      })

      return {
        success: true,
        rentalItem,
        remainingStock: availableQuantity - quantity
      }
    })
  }

  private transformToKasirView(product: any): KasirProductView {
    const availableSizes = product.sizes.map(size => ({
      size: size.size as SizeEnum,
      ageCategory: size.ageCategory as AgeCategory,
      availableQuantity: size.quantity, // TODO: subtract rented quantities
      displayName: this.formatSizeDisplay(size.size, size.ageCategory)
    }))

    const totalAvailableStock = availableSizes.reduce(
      (sum, size) => sum + size.availableQuantity,
      0
    )

    return {
      id: product.id,
      code: product.code,
      name: product.name,
      currentPrice: product.currentPrice.toNumber(),
      category: product.category,
      color: product.color,
      availableSizes,
      totalAvailableStock,
      hasMultipleSizes: product.sizes.length > 1,
      sizeMode: product.sizes.length > 1 ? 'multiple' : 'single'
    }
  }

  private formatSizeDisplay(size: string, ageCategory: string): string {
    const categoryMap = {
      'ADULT': 'Dewasa',
      'CHILD': 'Anak',
      'UNIVERSAL': 'Universal'
    }

    const categoryLabel = categoryMap[ageCategory] || ageCategory
    return `${size} (${categoryLabel})`
  }
}
```

---

## 🧪 TESTING STRATEGY

### 1. Migration Testing

```typescript
// Migration validation tests
describe('Legacy Migration Service', () => {
  it('should migrate all legacy products to advanced format', async () => {
    // Setup: Create legacy products
    const legacyProducts = await createLegacyTestProducts(5)

    // Execute migration
    const result = await migrationService.migrateLegacyProducts()

    // Validate results
    expect(result.migratedSuccessfully).toBe(5)
    expect(result.migrationErrors).toBe(0)

    // Verify each product has at least one size
    for (const product of legacyProducts) {
      const sizes = await prisma.productSize.findMany({
        where: { productId: product.id }
      })
      expect(sizes.length).toBeGreaterThan(0)
    }
  })

  it('should preserve total quantities during migration', async () => {
    const originalProduct = await createLegacyProduct({
      code: 'TEST',
      quantity: 10,
      size: 'L'
    })

    await migrationService.migrateProduct(originalProduct.id)

    const sizes = await prisma.productSize.findMany({
      where: { productId: originalProduct.id }
    })

    const totalQuantity = sizes.reduce((sum, size) => sum + size.quantity, 0)
    expect(totalQuantity).toBe(10)
  })
})
```

### 2. API Integration Testing

```typescript
describe('Advanced Product API', () => {
  it('should require sizes array for product creation', async () => {
    const response = await request(app)
      .post('/api/products')
      .field('code', 'TEST')
      .field('name', 'Test Product')
      .field('categoryId', categoryId)
      .field('modalAwal', '100000')
      .field('currentPrice', '50000')
      // Missing sizes field

    expect(response.status).toBe(400)
    expect(response.body.error.message).toContain('Sizes field is required')
  })

  it('should create product with advanced size management', async () => {
    const sizes = [
      { ageCategory: 'ADULT', size: 'M', quantity: 3 },
      { ageCategory: 'CHILD', size: 'M', quantity: 2 }
    ]

    const response = await request(app)
      .post('/api/products')
      .field('code', 'TEST')
      .field('name', 'Test Product')
      .field('categoryId', categoryId)
      .field('modalAwal', '100000')
      .field('currentPrice', '50000')
      .field('sizes', JSON.stringify(sizes))

    expect(response.status).toBe(201)
    expect(response.body.sizes).toHaveLength(2)

    // Verify aggregation
    const totalQuantity = response.body.sizes.reduce(
      (sum: number, size: any) => sum + size.quantity,
      0
    )
    expect(totalQuantity).toBe(5)
  })
})
```

### 3. Frontend Component Testing

```tsx
describe('SizeManagementSection', () => {
  it('should require at least one size', () => {
    render(
      <SizeManagementSection
        sizes={[]}
        onChange={mockOnChange}
        required={true}
      />
    )

    expect(screen.getByText(/minimal 1 ukuran harus ditambahkan/i)).toBeInTheDocument()
  })

  it('should prevent duplicate size+ageCategory combinations', async () => {
    const user = userEvent.setup()

    render(
      <SizeManagementSection
        sizes={[{ size: 'M', ageCategory: 'ADULT', quantity: 2, isActive: true }]}
        onChange={mockOnChange}
      />
    )

    // Try to add duplicate
    await user.selectOptions(screen.getByLabelText(/ukuran/i), 'M')
    await user.selectOptions(screen.getByLabelText(/kategori umur/i), 'ADULT')
    await user.click(screen.getByRole('button', { name: /tambah/i }))

    expect(screen.getByText(/kombinasi .* sudah ada/i)).toBeInTheDocument()
  })
})
```

---

## 📊 PERFORMANCE BENCHMARKS

### Target Metrics

```typescript
interface PerformanceBenchmarks {
  // API Response Times
  productCreation: '<500ms' // Including size creation
  productListing: '<200ms' // With aggregation
  sizeAggregation: '<50ms'  // Individual product

  // Database Operations
  migrationExecution: '<5min' // For 1000 products
  bulkSizeInsert: '<100ms'   // For 10 sizes

  // Frontend Performance
  formRender: '<300ms'       // Size management section
  aggregationDisplay: '<100ms' // Real-time calculations

  // Memory Usage
  aggregationMemory: '<10MB' // Per 1000 products
  migrationMemory: '<50MB'   // During full migration
}
```

### Monitoring Setup

```typescript
// Performance monitoring for aggregation service
class AggregationPerformanceMonitor {
  async measureAggregationPerformance(productId: string): Promise<PerformanceMetrics> {
    const startTime = process.hrtime.bigint()
    const startMemory = process.memoryUsage()

    try {
      const result = await aggregationService.getProductAggregation(productId)

      const endTime = process.hrtime.bigint()
      const endMemory = process.memoryUsage()

      const executionTimeMs = Number(endTime - startTime) / 1_000_000
      const memoryUsageMB = (endMemory.heapUsed - startMemory.heapUsed) / 1_024_/ 1_024

      return {
        executionTimeMs,
        memoryUsageMB,
        cacheHit: result.metadata.fromCache,
        performance: this.evaluatePerformance(executionTimeMs),
        recommendation: this.getOptimizationRecommendation(executionTimeMs, memoryUsageMB)
      }
    } catch (error) {
      return {
        executionTimeMs: -1,
        memoryUsageMB: -1,
        error: error.message,
        performance: 'failed'
      }
    }
  }

  private evaluatePerformance(timeMs: number): 'excellent' | 'good' | 'needs_attention' | 'critical' {
    if (timeMs < 50) return 'excellent'
    if (timeMs < 100) return 'good'
    if (timeMs < 200) return 'needs_attention'
    return 'critical'
  }
}
```

---

## 🔒 BUSINESS RULES & VALIDATION

### Advanced Size Management Rules

```typescript
class AdvancedSizeBusinessRules {
  // Rule 1: Unique Size-AgeCategory Combinations
  static validateUniqueSeriesCombinations(sizes: CreateProductSizeRequest[]): ValidationResult {
    const combinations = sizes.map(s => `${s.size}-${s.ageCategory}`)
    const uniqueCombinations = new Set(combinations)

    if (combinations.length !== uniqueCombinations.size) {
      return {
        isValid: false,
        errors: ['Duplikasi kombinasi ukuran dan kategori umur tidak diperbolehkan']
      }
    }

    return { isValid: true, errors: [] }
  }

  // Rule 2: Minimum Quantity Requirements
  static validateMinimumQuantities(sizes: CreateProductSizeRequest[]): ValidationResult {
    const invalidSizes = sizes.filter(s => s.quantity < 1)

    if (invalidSizes.length > 0) {
      return {
        isValid: false,
        errors: [`Jumlah minimal 1 untuk setiap ukuran`]
      }
    }

    return { isValid: true, errors: [] }
  }

  // Rule 3: Size Array Not Empty
  static validateSizeArrayNotEmpty(sizes: CreateProductSizeRequest[]): ValidationResult {
    if (!sizes || sizes.length === 0) {
      return {
        isValid: false,
        errors: ['Minimal 1 ukuran harus ditambahkan']
      }
    }

    return { isValid: true, errors: [] }
  }

  // Rule 4: Valid Size Enum Values
  static validateSizeEnumValues(sizes: CreateProductSizeRequest[]): ValidationResult {
    const validSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    const invalidSizes = sizes.filter(s => !validSizes.includes(s.size))

    if (invalidSizes.length > 0) {
      return {
        isValid: false,
        errors: [`Ukuran tidak valid: ${invalidSizes.map(s => s.size).join(', ')}`]
      }
    }

    return { isValid: true, errors: [] }
  }

  // Rule 5: Valid Age Category Values
  static validateAgeCategoryValues(sizes: CreateProductSizeRequest[]): ValidationResult {
    const validCategories = ['ADULT', 'CHILD', 'UNIVERSAL']
    const invalidCategories = sizes.filter(s => !validCategories.includes(s.ageCategory))

    if (invalidCategories.length > 0) {
      return {
        isValid: false,
        errors: [`Kategori umur tidak valid: ${invalidCategories.map(s => s.ageCategory).join(', ')}`]
      }
    }

    return { isValid: true, errors: [] }
  }

  // Comprehensive validation
  static validateAdvancedSizes(sizes: CreateProductSizeRequest[]): ValidationResult {
    const validations = [
      this.validateSizeArrayNotEmpty(sizes),
      this.validateUniqueSeriesCombinations(sizes),
      this.validateMinimumQuantities(sizes),
      this.validateSizeEnumValues(sizes),
      this.validateAgeCategoryValues(sizes)
    ]

    const errors = validations.flatMap(v => v.errors)

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}
```

---

## 📈 SUCCESS METRICS

### Implementation Success Criteria

```typescript
interface SuccessMetrics {
  // Technical Metrics
  migration: {
    dataIntegrity: '100%'        // All legacy data preserved
    zeroDowntime: true           // No service interruption
    performanceRegression: '<5%' // Minimal performance impact
  }

  // Development Metrics
  codeComplexity: {
    reducedValidationLogic: '>50%'   // Simplified validation
    eliminatedDualPaths: '100%'      // No more mode switching
    improvedTypeScript: '100%'       // Single interface clarity
  }

  // Business Metrics
  functionality: {
    sizeTrackingAccuracy: '100%'     // Precise size inventory
    rentalPrecision: '100%'          // Age category tracking
    reportingDepth: 'enhanced'       // Detailed analytics
  }

  // User Experience
  interface: {
    workflowSimplification: 'significant' // Single clear workflow
    learningCurve: 'minimal'             // Intuitive interface
    errorReduction: '>80%'               // Fewer validation errors
  }
}
```

### Post-Implementation Validation

```typescript
class SuccessValidationService {
  async validateMigrationSuccess(): Promise<MigrationSuccessReport> {
    // Data integrity checks
    const dataIntegrity = await this.validateDataIntegrity()

    // Performance benchmarks
    const performance = await this.validatePerformance()

    // Business logic verification
    const businessLogic = await this.validateBusinessLogic()

    // User interface testing
    const userInterface = await this.validateUserInterface()

    return {
      dataIntegrity,
      performance,
      businessLogic,
      userInterface,
      overallSuccess: this.calculateOverallSuccess([
        dataIntegrity,
        performance,
        businessLogic,
        userInterface
      ])
    }
  }

  private async validateDataIntegrity(): Promise<IntegrityReport> {
    // Verify all products have sizes
    const productsWithoutSizes = await this.prisma.product.count({
      where: {
        sizes: { none: {} }
      }
    })

    // Verify quantity consistency
    const quantityMismatches = await this.findQuantityMismatches()

    // Verify no orphaned size records
    const orphanedSizes = await this.findOrphanedSizes()

    return {
      productsWithoutSizes,
      quantityMismatches: quantityMismatches.length,
      orphanedSizes: orphanedSizes.length,
      integrity: productsWithoutSizes === 0 && quantityMismatches.length === 0 && orphanedSizes.length === 0
    }
  }
}
```

---

## 🎯 CONCLUSION

This advanced-only approach provides:

1. **Clean Architecture**: Single source of truth for size management
2. **Simplified Development**: No dual validation or mode switching complexity
3. **Future-Proof Foundation**: Ready for Kasir system integration
4. **Enhanced Business Intelligence**: Detailed size and age category tracking
5. **Scalable Design**: Built for rental business growth and complexity

**Next Actions:**
1. ✅ Execute Phase 1 (Migration preparation)
2. ✅ Update TypeScript interfaces
3. ✅ Simplify API endpoints
4. ✅ Restructure frontend components
5. ✅ Prepare Kasir system integration

**Success Definition:**
Zero legacy fields remaining + Single clear workflow + Enhanced business capabilities + System integration readiness.