# Task BE-RPK-3-1: Backend Size & Color Schema & API untuk Manage-Product

## Daftar Isi

1. [Pendahuluan](mdc:#pendahuluan)
2. [Perbandingan dengan Referensi](mdc:#perbandingan-dengan-referensi)
3. [Batasan dan Penyederhanaan](mdc:#batasan-dan-penyederhanaan)
4. [Spesifikasi Teknis BE](mdc:#spesifikasi-teknis-be)
5. [Implementasi Teknis](mdc:#implementasi-teknis)
6. [Security & Performance](mdc:#security--performance)
7. [Test Plan](mdc:#test-plan)

## Pendahuluan

Task ini mengimplementasikan backend support untuk field Size dan Color pada sistem manage-product dengan focus pada simplifikasi arsitektur sesuai docs/rules/architecture.md. Implementation mencakup database schema migration, API endpoint enhancements, dan data validation yang sesuai dengan kebutuhan rental pakaian.

Size akan menggunakan enum values untuk ukuran standar pakaian, sementara Color akan bersifat fleksibel seperti model categories dengan validation yang tepat untuk use case rental business.

> **  PENTING**: Dalam task docs jangan memberikan contoh pseudocode details

## Perbandingan dengan Referensi

| Fitur        | Categories Model | Size Implementation | Color Implementation |
| ------------ | --------------- | ------------------ | ------------------- |
| Data Type    | String with validation | Enum values | String with validation |
| Flexibility  | High (user-defined) | Low (preset only) | Medium (preset + custom) |
| Validation   | Name + color rules | Size enum validation | Color format validation |
| Storage      | Separate table | Product field | Product field |

## Batasan dan Penyederhanaan Implementasi

### Technical Constraints

- Menggunakan Prisma ORM untuk type safety dan migration management
- PostgreSQL database untuk production reliability
- Next.js API Routes untuk backend simplicity
- Minimal external dependencies untuk maintenance ease

### Performance Constraints

- Database indexing untuk size dan color fields untuk efficient filtering
- Response time target < 200ms untuk product queries
- Pagination support untuk large product datasets

### Security Constraints

- Input validation untuk size dan color fields
- SQL injection prevention via Prisma ORM
- Rate limiting untuk API endpoints
- Data sanitization untuk user inputs

## Spesifikasi Teknis BE

### Database Schema Changes

**Enhanced Product Model (Prisma)**:

```prisma
model Product {
  id              String   @id @default(uuid())
  code            String   @unique
  name            String
  description     String?
  category        String
  size            String?  // New field: S, M, L, XL, XXL, or custom
  color           String?  // New field: flexible like categories
  modalAwal       Float
  hargaSewa       Float
  status          ProductStatus
  image           String?
  quantity        Int      @default(1)
  totalPendapatan Float    @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([size])
  @@index([color])
  @@index([category, size, color])
}

enum ProductStatus {
  TERSEDIA
  DISEWA
  MAINTENANCE
}
```

**Migration Plan**:
- Add size and color fields sebagai optional untuk backward compatibility
- Create database indexes untuk efficient filtering
- Migrate existing products dengan default null values

### API Endpoints Design

#### Enhanced Existing Endpoints

**GET /api/products**:
- Add size dan color query parameters untuk filtering
- Support multiple size dan color values
- Maintain existing pagination dan sorting

**POST /api/products**:
- Accept size dan color in request body
- Validate size dan color values
- Return updated product dengan size/color information

**PUT /api/products/[id]**:
- Support partial updates including size dan color
- Validate field changes
- Return updated product data

#### New Endpoint (Optional)

**GET /api/products/options**:
- Return available size dan color options
- Cache-friendly for dropdown populations
- Include usage counts untuk popularity sorting

#### Request/Response Contracts

```typescript
// Enhanced Product interfaces
interface CreateProductRequest {
  code: string
  name: string
  description?: string
  category: string
  size?: string        // New field
  color?: string       // New field
  modalAwal: number
  hargaSewa: number
  status: ProductStatus
  image?: string
  quantity?: number
}

interface UpdateProductRequest {
  code?: string
  name?: string
  description?: string
  category?: string
  size?: string        // New field
  color?: string       // New field
  modalAwal?: number
  hargaSewa?: number
  status?: ProductStatus
  image?: string
  quantity?: number
}

interface ProductResponse {
  id: string
  code: string
  name: string
  description?: string
  category: string
  size?: string        // New field
  color?: string       // New field
  modalAwal: number
  hargaSewa: number
  status: ProductStatus
  image?: string
  quantity: number
  totalPendapatan: number
  createdAt: string
  updatedAt: string
}

interface ProductFilters {
  search?: string
  category?: string
  status?: ProductStatus
  size?: string[]      // New filter
  color?: string[]     // New filter
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
```

### Business Logic Requirements

#### Core Logic

**Size Validation**:
- Preset values: S, M, L, XL, XXL
- Allow custom sizes untuk special cases
- Case-insensitive validation
- Trim whitespace dari input

**Color Validation**:
- Accept hex color codes (#RRGGBB)
- Accept color names (Red, Blue, etc.)
- Allow custom color descriptions
- Validate color name length (max 50 chars)

#### Validation Rules

**Input Validation**:
- Size: Optional, max 10 characters
- Color: Optional, max 50 characters
- Both fields dapat null untuk backward compatibility

**Business Rule Validations**:
- Duplicate product codes prevention
- Size-color combination tracking untuk inventory
- Status changes validation dengan size/color context

## Implementasi Teknis

### API Route Implementation

#### Route Handler Structure

**Enhanced app/api/products/route.ts**:
- GET handler dengan size/color filtering
- POST handler dengan size/color validation
- Consistent error handling untuk new fields
- Response transformation untuk consistent format

**Enhanced app/api/products/[id]/route.ts**:
- GET handler untuk individual product dengan size/color
- PUT handler untuk updates including size/color
- DELETE handler (unchanged)

#### Middleware Integration

**Validation Middleware**:
- Zod schema validation untuk size dan color
- Request sanitization untuk security
- Error formatting untuk consistent responses

**Performance Middleware**:
- Response caching untuk product options
- Database query optimization
- Rate limiting untuk API protection

### Database Operations

#### Prisma ORM Usage

**Enhanced Query Patterns**:
- Filtering dengan size dan color parameters
- Complex where clauses untuk multiple filters
- Efficient indexing untuk performance
- Pagination dengan size/color filtering

**Data Processing**:
- Size normalization (case handling)
- Color validation dan formatting
- Bulk operations support untuk size/color updates

### Error Handling Strategy

#### HTTP Status Codes

- **400 Bad Request**: Invalid size atau color format
- **404 Not Found**: Product tidak ditemukan
- **422 Unprocessable Entity**: Validation errors untuk size/color
- **500 Internal Server Error**: Database atau system errors

#### Logging & Monitoring

- Structured logging untuk size/color operations
- Error tracking untuk validation failures
- Performance monitoring untuk filtered queries
- Audit trail untuk size/color changes

## Data Flow & Processing

### Request Processing Flow

1. Client mengirim request dengan size/color parameters
2. Validation middleware memvalidasi size dan color format
3. Route handler memproses business logic
4. Prisma ORM mengeksekusi database query dengan size/color filters
5. Response formatter mengembalikan data dengan consistent format

### Data Transformation

**Input Processing**:
- Size normalization (uppercase, trim)
- Color format validation dan normalization
- Default value handling untuk optional fields

**Output Formatting**:
- Consistent size/color representation
- Null handling untuk missing values
- API response standardization

### Caching Strategy

**Product Options Caching**:
- Cache available sizes dan colors untuk dropdown
- TTL 1 hour untuk option updates
- Cache invalidation pada product updates

**Query Result Caching**:
- Cache popular size/color filter combinations
- Redis untuk production caching
- Memory cache untuk development

## Security & Performance

### Authentication & Authorization

- Existing auth middleware unchanged
- Role-based access untuk product management
- API key validation untuk external integrations

### Data Validation

**Input Sanitization**:
- XSS prevention untuk color names
- SQL injection prevention via Prisma
- Input length limits untuk size/color

**Validation Schema**:
```typescript
const productSchema = z.object({
  // existing fields...
  size: z.string().max(10).optional(),
  color: z.string().max(50).optional(),
})
```

### Performance Optimization

**Database Optimization**:
- Composite indexes untuk (category, size, color)
- Query optimization untuk filtered results
- Connection pooling untuk concurrent requests

**API Optimization**:
- Response compression untuk large datasets
- Pagination untuk memory efficiency
- Selective field loading

## Test Plan

### Unit Testing

**Business Logic Testing**:
- Size validation dengan preset dan custom values
- Color validation dengan various formats
- Filter logic dengan size/color combinations
- Database query generation dengan new fields

**API Handler Testing**:
- Request validation dengan size/color data
- Response formatting untuk new fields
- Error handling untuk invalid size/color
- Pagination dengan size/color filters

### Integration Testing

**Database Integration**:
- Prisma model operations dengan size/color
- Migration testing untuk schema changes
- Index performance testing
- Data consistency validation

**API Integration**:
- End-to-end request/response dengan size/color
- Filter combination testing
- Performance testing dengan large datasets
- Concurrent request handling

### API Testing

**Endpoint Testing**:
- CRUD operations dengan size/color fields
- Filter parameter validation
- Error response consistency
- Response time benchmarking

**Load Testing**:
- Concurrent requests dengan size/color filtering
- Database performance dengan indexed queries
- Memory usage dengan large result sets
- Cache effectiveness testing

### Database Testing

**Schema Testing**:
- Migration execution dan rollback
- Index creation dan performance
- Data integrity dengan new fields
- Foreign key constraints (jika ada)

**Data Testing**:
- Size/color value validation dalam database
- Query performance dengan different filter combinations
- Data migration dari existing products
- Backup dan restore dengan new schema

## Acceptance Criteria

| Kriteria Backend                                     | Status | Keterangan |
| ---------------------------------------------------- | ------ | ---------- |
| Database schema updated dengan size dan color fields |        |            |
| Migration script untuk add fields tanpa data loss   |        |            |
| GET /api/products support size/color filtering      |        |            |
| POST /api/products accept size/color in request     |        |            |
| PUT /api/products support size/color updates        |        |            |
| Size validation dengan preset dan custom values     |        |            |
| Color validation dengan format checking             |        |            |
| Database indexes untuk efficient filtering          |        |            |
| Error handling konsisten untuk size/color           |        |            |
| API response time < 200ms untuk filtered queries    |        |            |
| Backward compatibility dengan existing products     |        |            |
| Security validation untuk injection prevention      |        |            |

---

## Related Tasks

- **Frontend Requirements**: [Task FE-RPK-3-1: Frontend Size & Color Implementation](../fe-rpk-3-1.md)
- **UI Design Reference**: [Task UI-RPK-3-1: Enhancement Desain UI Size & Color](../ui-rpk-3-1.md)
- **E2E Testing**: [Task E2E-RPK-3-1: E2E Testing Size & Color Features](../e2e-rpk-3-1.md)

## Architecture Compliance

- **Data Layer**: `app/api/products/route.ts`, `app/api/products/[id]/route.ts`
- **Database**: `prisma/schema.prisma`, `prisma/migrations/`
- **API Integration**: Simple fetchers di `features/manage-product/api.ts`
- **Alignment**: Sesuai docs/rules/architecture.md simplified 3-tier

## Implementation Order

### Phase 1: Database Foundation (Sprint 1)
1. Create Prisma migration untuk size dan color fields
2. Update Product model dengan new fields
3. Create database indexes untuk performance
4. Test migration pada development database

### Phase 2: API Enhancement (Sprint 1)
1. Update API route handlers untuk size/color support
2. Implement validation schemas untuk new fields
3. Enhance filtering logic dengan size/color parameters
4. Update error handling untuk new validation rules

### Phase 3: Business Logic (Sprint 2)
1. Implement size validation dengan preset values
2. Implement color validation dengan format checking
3. Add business rules untuk size/color combinations
4. Create API endpoint untuk size/color options

### Phase 4: Testing & Optimization (Sprint 2)
1. Comprehensive API testing dengan new fields
2. Database performance testing dengan indexes
3. Load testing untuk filtered queries
4. Security testing untuk injection prevention

## Migration Strategy

### Database Migration Plan

**Step 1: Schema Addition**
```sql
-- Add size and color columns
ALTER TABLE "Product" ADD COLUMN "size" TEXT;
ALTER TABLE "Product" ADD COLUMN "color" TEXT;

-- Create indexes
CREATE INDEX "Product_size_idx" ON "Product"("size");
CREATE INDEX "Product_color_idx" ON "Product"("color");
CREATE INDEX "Product_category_size_color_idx" ON "Product"("category", "size", "color");
```

**Step 2: Data Migration**
- All existing products akan memiliki size dan color NULL
- No data transformation needed untuk backward compatibility
- Optional: Set default values untuk specific products

**Step 3: Validation Implementation**
- Add application-level validation untuk new fields
- Update API contracts untuk include size/color
- Test dengan existing dan new data

### API Migration Plan

**Backward Compatibility**:
- Existing API calls akan tetap bekerja tanpa size/color
- New fields optional dalam request/response
- Graceful handling untuk clients yang belum update

**Feature Rollout**:
- Phase 1: Add fields dengan optional validation
- Phase 2: Enable filtering dan search
- Phase 3: Full feature implementation dengan UI integration