# Maguru - Rental Clothing Management System

## Project Overview

**Name:** Maguru  
**Type:** Rental Clothing Management System (Sistem Manajemen Penyewaan Pakaian)  
**Developer:** Ardiansyah Arifin  
**Version:** 0.1.0  
**Architecture:** Modular Monolith with Feature-First Organization

### Business Purpose

Maguru is a comprehensive web-based system for managing clothing rental operations. The system handles:
- Product catalog management with size-aware inventory
- Customer (Penyewa) management
- Transaction lifecycle (rental, pickup, return)
- Penalty calculation for late returns and damaged items
- Cashier operations and expense tracking
- Receipt generation and financial reporting

---

## Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 19
- **Language:** TypeScript (Strict Mode)
- **Styling:** TailwindCSS 4
- **Components:** Radix UI
- **State Management:** React Query (TanStack Query) + Custom Hooks
- **Icons:** Lucide React

### Backend
- **Runtime:** Next.js API Routes
- **ORM:** Prisma 6
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Clerk
- **File Storage:** Supabase Storage
- **Validation:** Zod 4

### Testing
- **Unit Tests:** Jest + React Testing Library
- **Integration Tests:** Jest + MSW (Mock Service Worker)
- **E2E Tests:** Playwright
- **Test Approach:** TDD (Red → Green → Refactor)

### Development Tools
- **Package Manager:** Yarn
- **Linting:** ESLint (Airbnb + Prettier + Tailwind)
- **Type Checking:** TypeScript Compiler
- **Build Tool:** Next.js (with Turbopack)
- **CI/CD:** GitHub Actions

---

## Architecture

### Design Principles

1. **Modular Monolith** - Feature-based organization within a single codebase
2. **3-Tier Architecture** - Presentation → Logic → Data
3. **Simple State Management** - Feature Context + Custom Hooks + useState
4. **Type Safety** - TypeScript strict mode throughout
5. **Separation of Concerns** - Clear boundaries between layers

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                      │
├─────────────────────────────────────────────────────────────┤
│  Presentation Layer (React Components)                       │
│  ├── features/[feature]/components/                         │
│  └── app/ (routes & layouts)                                │
├─────────────────────────────────────────────────────────────┤
│  Logic Layer (Custom Hooks & Services)                      │
│  ├── features/[feature]/hooks/                              │
│  ├── features/[feature]/services/                           │
│  └── features/[feature]/lib/                                │
├─────────────────────────────────────────────────────────────┤
│  Data Layer (API Routes & Database)                         │
│  ├── app/api/[feature]/route.ts                             │
│  └── Prisma ORM → PostgreSQL/Supabase                       │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
rental-software/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (backend)
│   ├── (kasir)/                  # Kasir routes
│   ├── owner/                    # Owner routes
│   ├── producer/                 # Producer routes
│   └── sign-in/, sign-up/        # Authentication pages
├── features/                     # Feature modules
│   ├── auth/                     # Authentication & authorization
│   ├── homepage/                 # Landing page & catalog
│   ├── kasir/                    # Transaction management
│   ├── manage-product/           # Product & category management
│   ├── dana-kasir/               # Cashier expense management
│   └── rentals-manage/           # Renter management
├── prisma/                       # Database schema & migrations
├── lib/                          # Shared utilities
├── components/                   # Shared UI components
├── __tests__/                    # Test suites
│   ├── integration/              # Integration tests
│   └── playwright/               # E2E tests
├── docs/                         # Documentation
└── middleware.ts                 # Route protection & RBAC
```

### Feature Module Structure

Each feature follows a consistent structure:

```
features/[feature-name]/
├── components/          # UI components (Presentation Layer)
├── hooks/              # Custom hooks (Logic Layer - client)
├── services/           # Business logic (Logic Layer - server)
├── api.ts              # API client/fetcher
├── types/              # TypeScript types & schemas
├── lib/                # Feature-specific utilities
│   ├── errors/         # Custom error classes
│   ├── validation/     # Zod schemas
│   ├── utils/          # Helper functions
│   └── serializers/    # Response formatters
└── docs/               # Feature documentation
```

---

## Database Schema

### Core Models

#### Product Management
```prisma
Product {
  id: UUID (PK)
  code: String (unique)
  name: String
  description: String?
  modalAwal: Decimal
  currentPrice: Decimal
  imageUrl: String?
  categoryId: String (FK)
  status: AVAILABLE | RENTED | MAINTENANCE
  isActive: Boolean
  size: String?
  materialId: String? (FK)
  materialCost: Decimal?
  materialQuantity: Int?
  
  relations: category, material, sizes, transaksiItems
}

ProductSize {
  id: UUID (PK)
  productId: String (FK)
  ageCategory: ADULT | CHILD | UNIVERSAL
  size: XS | S | M | L | XL | XXL | UNIVERSAL
  originalQuantity: Int      // Total stock owned
  rentedQuantity: Int         // Currently rented
  lostQuantity: Int           // Lost items
  availableQuantity: Int      // Available for rent
  
  unique: [productId, ageCategory, size]
}

Category {
  id: UUID (PK)
  name: String (unique)
  color: String
  type: 'clothing' | 'accessories_age_based' | 'accessories_universal'
  
  relations: products
}

Material {
  id: UUID (PK)
  name: String (unique)
  pricePerUnit: Decimal
  unit: String (default: 'meter')
  
  relations: products
}
```

#### Transaction Management
```prisma
Penyewa {
  id: UUID (PK)
  nama: String
  telepon: String (unique)
  alamat: String
  email: String?
  nik: String?
  foto: String?
  catatan: String?
  
  relations: transaksi
}

Kasir {
  id: UUID (PK)
  nama: String
  isActive: Boolean
  
  relations: transaksi, pengeluaran
}

Transaksi {
  id: UUID (PK)
  kode: String (unique)
  penyewaId: String (FK)
  kasirId: String? (FK)
  status: String
  totalHarga: Decimal
  jumlahBayar: Decimal
  sisaBayar: Decimal
  tglMulai: DateTime
  tglSelesai: DateTime?
  tglKembali: DateTime?
  metodeBayar: String
  discountType: 'percent' | 'nominal' | null
  discountValue: Decimal?
  flatLatePenalty: Decimal
  isLateReturn: Boolean
  
  relations: penyewa, kasir, items, pembayaran, aktivitas
}

TransaksiItem {
  id: UUID (PK)
  transaksiId: String (FK)
  produkId: String (FK)
  jumlah: Int
  hargaSewa: Decimal
  durasi: Int
  subtotal: Decimal
  kondisiAwal: String?
  statusKembali: 'belum' | 'sebagian' | 'lengkap'
  jumlahDiambil: Int
  totalReturnPenalty: Decimal
  conditionCount: Int
  
  relations: produk, transaksi, returnConditions
}

TransaksiItemReturn {
  id: UUID (PK)
  transaksiItemId: String (FK)
  kondisiAkhir: String
  jumlahKembali: Int
  penaltyAmount: Decimal
  conditionCategory: BAIK | KOTOR | RUSAK_RINGAN | RUSAK_BERAT | HILANG
  manualPrice: Decimal?
  useManualPricing: Boolean
  resolutionStatus: 'resolved_replaced' | 'resolved_lost'
  
  relations: transaksiItem
}

Pembayaran {
  id: UUID (PK)
  transaksiId: String (FK)
  jumlah: Decimal
  metode: String
  referensi: String?
  catatan: String?
  penaltyBreakdown: Json?
  
  relations: transaksi
}
```

#### Audit & Tracking
```prisma
AktivitasTransaksi {
  id: UUID (PK)
  transaksiId: String (FK)
  tipe: String
  deskripsi: String
  data: Json?
  
  relations: transaksi
}

FileUpload {
  id: UUID (PK)
  filename: String
  url: String
  mimetype: String
  size: Int
  entityType: String
  entityId: String
}
```

#### Cashier Expenses
```prisma
PengeluaranKasir {
  id: UUID (PK)
  kasirId: String (FK)
  harga: Decimal
  kategori: 'Operasional' | 'Maintenance' | 'Transport' | 'Lainnya'
  deskripsi: String?
  isActive: Boolean
  
  relations: kasir
}
```

---

## Authentication & Authorization

### Authentication Provider: Clerk

The system uses Clerk for authentication with role-based access control (RBAC).

### User Roles

1. **Owner** - Full access to all features
   - Routes: `/owner/*`, `/producer/*`, `/dashboard/*`
   - Permissions: All operations including break-even analysis

2. **Producer** - Product and inventory management
   - Routes: `/producer/*`, `/dashboard/*`
   - Permissions: Product CRUD, category management, material management

3. **Kasir** - Transaction management only
   - Routes: `/dashboard/*`
   - Permissions: Create transactions, process returns, handle payments

### Route Protection

Route protection is implemented in `middleware.ts` using Clerk's middleware:

```typescript
// Role-based route matchers
const isOwnerRoute = createRouteMatcher(['/owner(.*)'])
const isProducerRoute = createRouteMatcher(['/producer(.*)'])
const isKasirRoute = createRouteMatcher(['/dashboard(.*)'])

// Root path redirects to role-based dashboard
/ → /owner (for owner)
/ → /producer/manage-product (for producer)
/ → /dashboard (for kasir)
```

### Custom Session Claims

Roles are stored as custom session claims in Clerk:
- `metadata.role` - Primary role source
- Fallback: `sessionClaims.role` → `publicMetadata.role`

---

## API Structure

### API Organization

API routes are organized by feature domains following REST conventions:

```
/api
├── products/              # Product management
│   ├── /[id]             # GET, PATCH, DELETE
│   ├── /[id]/history     # Product history tracking
│   └── /[id]/sizes       # Size management
├── categories/           # Category CRUD
│   └── /[id]            # Category operations
├── materials/            # Material cost management
│   └── /[id]            # Material operations
└── kasir/                # Cashier operations
    ├── transaksi/        # Transaction CRUD
    │   ├── /[kode]      # Transaction details
    │   ├── /[kode]/ambil # Process pickup
    │   └── /[kode]/pengembalian # Process return
    ├── pembayaran/       # Payment processing
    │   └── /[id]        # Payment operations
    ├── penyewa/          # Customer management
    │   └── /[id]        # Customer operations
    ├── kasir/            # Cashier management
    │   ├── selection/   # Cashier selection
    │   └── /[id]        # Cashier operations
    ├── produk/           # Available products
    │   └── available    # Availability check
    ├── pengeluaran/      # Expense tracking
    │   └── /[id]        # Expense operations
    ├── dana-summary/     # Financial summaries
    ├── dana-export/      # CSV export
    ├── receipt/          # Receipt generation
    │   └── /[transaksiId]/pdf
    └── dashboard/        # Statistics
```

### API Implementation Pattern

All API routes follow a consistent pattern:

```typescript
export async function GET/POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const { userId } = await auth()
    if (!userId) return unauthorizedResponse()

    // 2. Parse and validate request
    const body = await request.json() // or request.formData()
    const validatedData = schema.parse(body)

    // 3. Business logic via service layer
    const service = new FeatureService(prisma, userId)
    const result = await service.operation(validatedData)

    // 4. Serialize response
    const formattedData = serializeResponse(result)
    return successResponse(formattedData)

  } catch (error) {
    // 5. Error handling
    return handleTransaksiError(error)
  }
}
```

### Response Format

Standardized response format across all endpoints:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation description",
  "data": { /* response data */ },
  "pagination": { /* optional pagination metadata */ },
  "summary": { /* optional summary statistics */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "field": "optional_field_name",
    "details": "Additional details"
  },
  "requestId": "req_timestamp_random"
}
```

---

## Feature Modules

### 1. Auth Module (`features/auth/`)

**Purpose:** Authentication and role management

**Components:**
- `AuthenticationControls` - Login/logout controls
- `RoleDisplay` - Current role display

**Hooks:**
- `useUserRole()` - Role detection and management

**Key Files:**
- `lib/roleUtils.ts` - Role validation helpers
- `context/UserRoleContext.tsx` - Global role state

### 2. Homepage Module (`features/homepage/`)

**Purpose:** Public-facing landing page and product catalog

**Components:**
- `HeroSection` - Landing page hero
- `CategoriesSection` - Category display
- `FeaturedItemsSection` - Featured products
- `ProductDetailPage` - Product detail view
- `SizeDetailCard` - Size information display

**API:**
- `api/publicProductApi.ts` - Public product catalog API

### 3. Kasir Module (`features/kasir/`)

**Purpose:** Transaction management (core business feature)

**Key Components:**

**Form Components:**
- `TransactionFormPage` - Multi-step transaction form
- `CashierSelectionStep` - Select cashier
- `CustomerBiodataStep` - Customer registration
- `ProductSelectionStep` - Product & size selection
- `PaymentSummaryStep` - Payment processing

**Detail Components:**
- `TransactionDetailPage` - Transaction details
- `ProductDetailCard` - Item details with history
- `ActivityTimeline` - Transaction activity log
- `PaymentForm` - Payment processing
- `CancelModal` - Transaction cancellation

**Return Components:**
- `SimpleReturnForm` - Basic return processing
- `UnifiedConditionForm` - Condition-based return with penalties
- `ConditionPricingForm` - Manual penalty pricing

**Dashboard Components:**
- `TransactionsDashboard` - Transaction list with tabs
- `TransactionsTable` - Paginated transaction table

**Hooks:**
- `useTransactionForm()` - Multi-step form state
- `useTransactionDetail()` - Transaction detail fetching
- `usePaymentProcessing()` - Payment handling
- `usePickupProcess()` - Pickup workflow
- `useCancelTransaction()` - Cancellation logic

**Services:**
- `transaksiService.ts` - Transaction CRUD
- `returnService.ts` - Return processing with penalty calculation
- `pickupService.ts` - Pickup processing
- `pembayaranService.ts` - Payment recording
- `penyewaService.ts` - Customer management
- `pairingService.ts` - Sarung pairing logic

**Key Utilities:**
- `utils/penaltyCalculator.ts` - Penalty calculation logic
- `utils/priceCalculator.ts` - Price calculations
- `utils/jasSarungUtils.ts` - Jas & Sarung specific logic

### 4. Manage Product Module (`features/manage-product/`)

**Purpose:** Product and inventory management

**Components:**

**Form Components:**
- `ProductFormPage` - Product creation/editing
- `AdvancedProductForm` - Enhanced form with size management
- `CategoryForm` - Category management
- `MaterialForm` - Material cost management

**Management Components:**
- `ProductManagementPage` - Product listing with filters
- `ProductDetailPage` - Detailed product view
- `CategoryManagement` - Category management interface
- `MaterialManagement` - Material cost interface

**Size Management:**
- `AdvancedSizeManagementSection` - Enhanced size management
- `AggregatedSizeDisplay` - Aggregated size view
- `InlineSizeManagement` - Compact size editor

**Hooks:**
- `useProducts()` - Product fetching with filters
- `useCategories()` - Category management
- `useMaterials()` - Material management
- `useProductFormStrategy()` - Dynamic form behavior
- `useAggregatedSizes()` - Size aggregation

**Services:**
- `productService.ts` - Product CRUD operations
- `categoryService.ts` - Category management
- `materialService.ts` - Material management
- `productHistoryService.ts` - History tracking
- `productSizeAggregationService.ts` - Size aggregation
- `fileUploadService.ts` - Image upload

**Strategies:**
- `ClothingStrategy.ts` - Clothing category logic
- `AccessoriesAgeBasedStrategy.ts` - Age-based accessories
- `AccessoriesUniversalStrategy.ts` - Universal accessories
- `StrategyFactory.ts` - Strategy selection

### 5. Dana Kasir Module (`features/dana-kasir/`)

**Purpose:** Cashier expense tracking

**Components:**
- `DanaKasirDashboard` - Expense dashboard
- `SummaryCards` - Income/expense summaries
- `ExpenseList` - Expense listing
- `PengeluaranForm` - Expense entry form
- `ExportDialog` - CSV export

**Hooks:**
- `useDanaSummary()` - Summary statistics
- `useCreatePengeluaran()` - Expense creation
- `useDeletePengeluaran()` - Expense deletion

**Services:**
- `danaSummaryService.ts` - Summary calculations
- `pengeluaranService.ts` - Expense management
- `csvExportService.ts` - CSV generation

### 6. Rentals Manage Module (`features/rentals-manage/`)

**Purpose:** Renter (penyewa) management

**Components:**
- `RentersTable` - Renter listing
- `RenterFormModal` - Renter registration
- `SearchActionBar` - Search and filter

---

## Testing Strategy

### Test Organization

```
__tests__/
├── integration/           # Integration tests (Jest + MSW)
│   ├── manage-product/
│   ├── kasir/
│   └── auth/
├── playwright/            # E2E tests (Playwright)
│   ├── kasir/
│   ├── manage-product/
│   ├── auth/
│   └── global.setup.ts
└── mocks/                # Mock data & handlers
```

### Unit Tests

**Framework:** Jest + React Testing Library  
**Location:** Co-located with implementation files  
**Pattern:** `*.test.ts` or `*.spec.ts`

Example: `features/kasir/services/transaksiService.test.ts`

```typescript
describe('TransaksiService', () => {
  it('should create transaction with auto-generated code', async () => {
    // Arrange
    const service = new TransaksiService(prisma, userId)
    const data = { /* test data */ }
    
    // Act
    const result = await service.createTransaksiSizeAware(data)
    
    // Assert
    expect(result.kode).toMatch(/^TRX-\d{10}-/)
  })
})
```

### Integration Tests

**Framework:** Jest + MSW (Mock Service Worker)  
**Location:** `__tests__/integration/[feature]/`  
**Pattern:** `*.int.test.ts`

Example: `__tests__/integration/kasir/transaction-flow.int.test.ts`

```typescript
describe('Transaction Flow Integration', () => {
  it('should complete full transaction lifecycle', async () => {
    // Mock API responses with MSW
    // Test: Create → Pickup → Return → Calculate Penalty
  })
})
```

### E2E Tests

**Framework:** Playwright  
**Location:** `__tests__/playwright/[feature]/`  
**Pattern:** `*.spec.ts` with BDD format (Given-When-Then)

Example: `__tests__/playwright/kasir/create-transaction.spec.ts`

```typescript
test('should create new transaction', async ({ page }) => {
  // Given
  await page.goto('/dashboard')
  await page.click('button:has-text("Buat Transaksi")')
  
  // When
  await page.fill('[data-testid="customer-phone"]', '08123456789')
  await page.click('button:has-text("Cari Pelanggan")')
  // ... complete form
  
  // Then
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
})
```

### Role-Based E2E Testing

Playwright configured for role-specific testing:

```typescript
projects: [
  {
    name: 'kasir tests',
    use: {
      storageState: '__tests__/playwright/.clerk/kasir.json'
    }
  },
  {
    name: 'producer tests',
    use: {
      storageState: '__tests__/playwright/.clerk/producer.json'
    }
  },
  {
    name: 'owner tests',
    use: {
      storageState: '__tests__/playwright/.clerk/owner.json'
    }
  }
]
```

### Test Commands

```bash
# Unit tests
yarn test:unit              # Test specific feature
yarn test:unit:all          # Test all features

# Integration tests
yarn test:int               # Test specific feature
yarn test:int:all           # Test all features

# E2E tests
yarn test:e2e               # Test specific feature
yarn test:e2e:all           # Test all features
yarn test:e2e:ui            # Run with UI
yarn test:e2e:debug         # Debug specific test

# Coverage
yarn test:coverage          # Run with coverage (target: 80%)
```

---

## Key Business Logic

### Transaction Lifecycle

1. **Creation**
   - Generate unique transaction code (TRX-timestamp-random)
   - Register customer (new or existing)
   - Select products with sizes
   - Calculate rental price based on duration
   - Apply discounts if applicable
   - Record initial payment

2. **Pickup (Pengambilan)**
   - Mark items as "diambil" (picked up)
   - Update inventory: rentedQuantity++
   - Record pickup activity
   - Update transaction status

3. **Return (Pengembalian)**
   - Process items individually or in batch
   - Assess condition: BAIK, KOTOR, RUSAK_RINGAN, RUSAK_BERAT, HILANG
   - Calculate penalties based on:
     - Late return (daily flat penalty)
     - Item condition (percentage of modalAwal)
     - Lost items (full modalAwal)
   - Update inventory: rentedQuantity--, lostQuantity++ if applicable
   - Record return activity

4. **Payment**
   - Record partial or full payments
   - Track remaining balance
   - Support multiple payment methods
   - Generate payment receipts

5. **Cancellation**
   - Soft delete transaction
   - Restore inventory if items picked up
   - Record cancellation reason

### Penalty Calculation

Penalties are calculated using a sophisticated system in `features/kasir/lib/utils/penaltyCalculator.ts`:

```typescript
// Late Return Penalty
flatLatePenalty = dailyLateRate × daysLate

// Condition-Based Penalty
conditionPenalty = modalAwal × conditionRate
- BAIK: 0%
- KOTOR: 5-10%
- RUSAK_RINGAN: 20-30%
- RUSAK_BERAT: 50-70%
- HILANG: 100%

// Total Penalty
totalPenalty = flatLatePenalty + Σ(conditionPenalties)
```

### Sarung Pairing Logic

Special logic for "Jas Sarung" (formal wear sets):

```typescript
// In features/kasir/lib/utils/jasSarungUtils.ts
- Automatically pairs Jas (coat) with Sarung
- Validates size compatibility
- Ensures both items are available
- Handles partial returns with penalties
```

### Inventory Management

Size-aware inventory tracking:

```typescript
// ProductSize model tracks:
originalQuantity  // Total owned
rentedQuantity    // Currently out
lostQuantity      // Lost/damaged
availableQuantity = originalQuantity - rentedQuantity - lostQuantity

// Real-time updates:
- Create transaction: rentedQuantity++
- Return items: rentedQuantity--
- Lost items: lostQuantity++
```

### Break-Even Analysis

Track when rental income covers initial investment:

```typescript
// In ProductHistoryService
breakEvenStatus = {
  isBreakEven: totalRentalIncome >= modalAwal,
  breakEvenDate: date when threshold reached,
  rentalCount: number of rentals,
  totalIncome: sum of all rental income
}
```

---

## Development Workflow

### Feature Development Pattern

1. **API Layer** → Create/update API routes in `app/api/[feature]/route.ts`
2. **Service Layer** → Implement business logic in `features/[feature]/services/`
3. **Data Layer** → Use Prisma for database operations
4. **Hook Layer** → Create custom hooks in `features/[feature]/hooks/`
5. **Component Layer** → Build UI components in `features/[feature]/components/`
6. **Integration** → Wire everything together via `features/[feature]/api.ts`

### Testing Approach

**TDD Cycle:**
1. Write failing test (Red)
2. Implement minimum code to pass (Green)
3. Refactor for quality (Refactor)

**Test Priority:**
1. Unit tests for business logic (services, utilities)
2. Integration tests for API endpoints
3. E2E tests for critical user journeys

### Code Quality

**Linting:**
```bash
yarn lint          # Check for issues
yarn lint:fix      # Auto-fix issues
```

**Type Checking:**
```bash
yarn type-check    # TypeScript validation
```

**Standards:**
- Zero ESLint warnings policy
- TypeScript strict mode
- Prettier for code formatting

### Git Workflow

**Branch Strategy:**
- `main` - Production code
- `update/*` - Feature branches (e.g., `update/transaksi`)
- Pull requests required for merging

**Commit Standards:**
- Conventional commits: `feat:`, `fix:`, `docs:`, etc.
- Descriptive messages explaining "why" not "what"
- Link to task/story in commit body

---

## Deployment & DevOps

### CI/CD Pipeline

**GitHub Actions Workflow:**

```yaml
# .github/workflows/ci-cd.yml
on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]
  schedule:
    - cron: '0 0 * * *'  # Daily at 00:00 UTC

jobs:
  lint:
    - Run ESLint
    - Check TypeScript types
  
  test:
    - Run unit tests
    - Run integration tests
    - Generate coverage report
  
  build:
    - Build Next.js application
    - Verify production build
  
  deploy:
    - Deploy to Vercel (staging)
```

### Environment Variables

**Required Variables:**
```bash
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Application
NODE_ENV=development|production
NEXT_PUBLIC_APP_URL=...
```

### Deployment Platforms

**Production:** Vercel (recommended for Next.js)  
**Database:** Supabase PostgreSQL  
**Storage:** Supabase Storage  
**Authentication:** Clerk

---

## Performance Optimizations

### React Query Optimizations

- Automatic refetching on window focus
- Stale-time configuration for data freshness
- Cache management for reduced API calls
- Optimistic updates for better UX

### Image Optimization

- Next.js Image component for automatic optimization
- WebP format support
- Lazy loading for product images
- Supabase CDN for image delivery

### Database Optimizations

- Comprehensive indexing on frequently queried fields
- Aggregated queries to reduce round trips
- Bulk operations for batch updates
- Connection pooling for high concurrency

---

## Security Considerations

### Authentication & Authorization

- Clerk middleware for route protection
- Role-based access control (RBAC)
- Custom session claims for role management
- Secure token handling

### API Security

- Input validation with Zod schemas
- SQL injection prevention via Prisma ORM
- XSS protection through React defaults
- CSRF protection via same-site cookies

### Data Protection

- Environment variables for sensitive data
- No hardcoded credentials
- Secure file upload validation
- Rate limiting considerations

---

## Known Issues & Solutions

### Transaction Display Bug (Fixed 2025-07-26)

**Problem:** Dashboard showing "no transactions" despite API returning data.

**Root Cause:** Backend returns `itemCount` but frontend expected `items` array.

**Solution:** Added fallback in `useTransactions.ts`:
```typescript
items: transaction?.items?.map(/*...*/) ||
       [`${transaction.itemCount} item(s)`]
```

---

## Future Enhancements

### Planned Features

1. **Advanced Analytics**
   - Revenue forecasting
   - Customer analytics
   - Product performance metrics

2. **Mobile Application**
   - React Native mobile app
   - Offline mode support
   - Barcode scanning

3. **Advanced Inventory**
   - Automated stock alerts
   - Predictive restocking
   - Maintenance scheduling

4. **Integration Features**
   - Accounting system integration
   - SMS/WhatsApp notifications
   - Online booking portal

---

## Contributing Guidelines

### For Developers

1. **Setup**
   ```bash
   yarn install
   cp .env.example .env.local
   yarn prisma generate
   yarn dev
   ```

2. **Development**
   - Create feature branch: `git checkout -b update/feature-name`
   - Follow feature development pattern
   - Write tests before implementation (TDD)
   - Ensure zero linting errors
   - Update documentation

3. **Testing**
   - Run unit tests: `yarn test:unit`
   - Run integration tests: `yarn test:int`
   - Run E2E tests: `yarn test:e2e`
   - Check coverage: `yarn test:coverage`

4. **Pull Request**
   - Descriptive title and description
   - Link to related issue/task
   - All tests passing
   - Code review approval required

### Code Style Guidelines

- **TypeScript:** Strict mode, no `any` types
- **Components:** Functional components with hooks
- **Styling:** TailwindCSS utility classes
- **Naming:** kebab-case for files, PascalCase for components
- **Comments:** JSDoc for functions, inline for complex logic

---

## Support & Contact

**Project Lead:** Ardiansyah Arifin  
**Documentation:** See `/docs` folder for detailed guides  
**Issues:** Track via project management system  
**Emergency:** Contact through official channels

---

*Last Updated: 2025-12-29*  
*Documentation Version: 1.0.0*