# Design Document - Dana Kasir Management

## Overview

The Dana Kasir Management system is a simple, focused cash flow tracking feature that integrates with the existing rental transaction system. The design follows a "Keep It Simple" philosophy, providing essential functionality for daily income and expense tracking without unnecessary complexity.

**Key Design Principles:**
- **Simplicity First**: Minimal fields, straightforward workflows
- **Integration**: Seamless connection with existing transaction system
- **Consistency**: Follow established patterns from the codebase
- **Performance**: Fast queries with proper indexing
- **Auditability**: Track who did what and when

## Architecture

### System Architecture

The Dana Kasir feature follows the existing 3-tier architecture pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  - Dana Kasir Dashboard (app/(kasir)/dana-kasir/page.tsx)  │
│  - Expense Form Component                                    │
│  - Summary Cards Component                                   │
│  - Navigation Integration (Owner Sidebar + Kasir Dashboard) │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                    │
│  - PengeluaranService (CRUD operations)                     │
│  - DanaSummaryService (calculations)                        │
│  - CSV Export Service                                        │
│  - Validation Logic (Zod schemas)                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Data Access Layer                      │
│  - Prisma ORM                                               │
│  - PengeluaranKasir Model                                   │
│  - Transaksi Model (read-only for income)                  │
│  - PostgreSQL Database                                       │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Income Display Flow:**
```
Kasir Dashboard → API /dana-summary → DanaSummaryService
                                            ↓
                                    Query Transaksi table
                                    (filter by date, sum amounts)
                                            ↓
                                    Return income data
```

**Expense Management Flow:**
```
Expense Form → API /pengeluaran → PengeluaranService
                                        ↓
                                  Validate input
                                        ↓
                                  Save to PengeluaranKasir
                                        ↓
                                  Return success/error
```

## Components and Interfaces

### Database Models

#### PengeluaranKasir Model

```prisma
model PengeluaranKasir {
  id          String   @id @default(uuid())
  kasirId     String
  harga       Decimal  @db.Decimal(12, 2)
  kategori    String   // 'Operasional' | 'Maintenance' | 'Transport' | 'Lainnya'
  deskripsi   String?
  isActive    Boolean  @default(true)  // For soft delete
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String
  
  kasir       Kasir    @relation(fields: [kasirId], references: [id])
  
  @@index([kasirId, createdAt])
  @@index([isActive])
  @@index([createdAt])
  @@map("pengeluaran_kasir")
}
```

**Rationale:**
- `kasirId`: Links to Kasir table for audit trail
- `harga`: Decimal(12,2) for precise currency calculations
- `kategori`: String enum for fixed categories
- `isActive`: Boolean for soft delete (preserves audit trail)
- Indexes on `kasirId + createdAt` for efficient daily queries
- Index on `isActive` for filtering active records

### API Endpoints

#### Expense Management

**GET /api/kasir/pengeluaran**
- Query params: `date` (optional, defaults to today)
- Returns: List of expenses for the specified date
- Auth: Kasir (read), Owner (read)

**POST /api/kasir/pengeluaran**
- Body: `{ kasirId, harga, kategori, deskripsi }`
- Returns: Created expense record
- Auth: Kasir (write only)

**PUT /api/kasir/pengeluaran/[id]**
- Body: `{ kasirId?, harga?, kategori?, deskripsi? }`
- Returns: Updated expense record
- Auth: Kasir (write only)

**DELETE /api/kasir/pengeluaran/[id]**
- Performs soft delete (sets `isActive = false`)
- Returns: Success confirmation
- Auth: Kasir (write only)

#### Dashboard Data

**GET /api/kasir/dana-summary**
- Query params: `date` (optional, defaults to today)
- Returns: `{ totalIncome, totalExpense, netBalance, incomeList, expenseList }`
- Auth: Kasir (read), Owner (read)

#### Export

**GET /api/kasir/dana-export**
- Query params: `startDate`, `endDate`
- Returns: CSV file download
- Auth: Owner (read only)

### Service Layer

#### PengeluaranService

```typescript
class PengeluaranService {
  constructor(private prisma: PrismaClient, private userId: string) {}
  
  async create(data: CreatePengeluaranInput): Promise<PengeluaranKasir>
  async update(id: string, data: UpdatePengeluaranInput): Promise<PengeluaranKasir>
  async softDelete(id: string): Promise<void>
  async getByDate(date: Date): Promise<PengeluaranKasir[]>
  async getById(id: string): Promise<PengeluaranKasir | null>
  async getActiveKasirList(): Promise<Kasir[]>  // NEW: Get list of active kasir for dropdown
}
```

#### DanaSummaryService

```typescript
class DanaSummaryService {
  constructor(private prisma: PrismaClient) {}
  
  async getDailySummary(date: Date): Promise<DailySummary>
  async getIncomeList(date: Date): Promise<IncomeItem[]>
  async getExpenseList(date: Date): Promise<PengeluaranKasir[]>
}

interface DailySummary {
  totalIncome: number      // Sum of rental + penalty amounts
  totalExpense: number     // Sum of expense amounts
  netBalance: number       // totalIncome - totalExpense
  date: string
}

interface IncomeItem {
  transaksiKode: string
  customerName: string
  rentalAmount: number
  penaltyAmount: number
  status: string
  kasirId: string
  kasirName: string
  createdAt: Date
}
```

### UI Components

#### DanaKasirDashboard

```typescript
interface DanaKasirDashboardProps {
  initialDate?: Date
}

// Component structure:
// - Date navigation (DatePicker)
// - Summary cards (Income, Expense, Net Balance)
// - Income list (from Transaksi)
// - Expense list with CRUD actions
// - Add expense button (Kasir only)
// - Export button (Owner only)
```

#### PengeluaranForm

```typescript
interface PengeluaranFormProps {
  initialData?: PengeluaranKasir
  onSubmit: (data: PengeluaranFormData) => Promise<void>
  onCancel: () => void
}

interface PengeluaranFormData {
  kasirId: string  // NEW: Selected kasir from dropdown
  harga: number
  kategori: 'Operasional' | 'Maintenance' | 'Transport' | 'Lainnya'
  deskripsi?: string
}
```

## Data Models

### Type Definitions

```typescript
// Expense categories (fixed)
export const EXPENSE_CATEGORIES = [
  'Operasional',
  'Maintenance',
  'Transport',
  'Lainnya'
] as const

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]

// Expense record
export interface PengeluaranKasir {
  id: string
  kasirId: string
  harga: number
  kategori: ExpenseCategory
  deskripsi?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  kasir?: {
    id: string
    nama: string
  }
}

// API request/response types
export interface CreatePengeluaranRequest {
  kasirId: string  // NEW: Kasir ID selected from dropdown
  harga: number
  kategori: ExpenseCategory
  deskripsi?: string
}

export interface UpdatePengeluaranRequest {
  kasirId?: string  // NEW: Can update kasir assignment
  harga?: number
  kategori?: ExpenseCategory
  deskripsi?: string
}

export interface DanaSummaryResponse {
  summary: {
    totalIncome: number
    totalExpense: number
    netBalance: number
    date: string
  }
  income: IncomeItem[]
  expenses: PengeluaranKasir[]
}
```

### Validation Schemas

```typescript
import { z } from 'zod'

export const createPengeluaranSchema = z.object({
  kasirId: z.string()
    .uuid('Kasir ID tidak valid')
    .min(1, 'Kasir harus dipilih'),  // NEW: Validate kasir selection
  harga: z.number()
    .positive('Jumlah harus lebih besar dari 0')
    .max(999999999.99, 'Jumlah terlalu besar'),
  kategori: z.enum(['Operasional', 'Maintenance', 'Transport', 'Lainnya'], {
    errorMap: () => ({ message: 'Kategori harus dipilih' })
  }),
  deskripsi: z.string()
    .max(500, 'Deskripsi maksimal 500 karakter')
    .optional()
})

export const updatePengeluaranSchema = z.object({
  kasirId: z.string()
    .uuid('Kasir ID tidak valid')
    .optional(),  // NEW: Can update kasir assignment
  harga: z.number()
    .positive('Jumlah harus lebih besar dari 0')
    .max(999999999.99, 'Jumlah terlalu besar')
    .optional(),
  kategori: z.enum(['Operasional', 'Maintenance', 'Transport', 'Lainnya'])
    .optional(),
  deskripsi: z.string()
    .max(500, 'Deskripsi maksimal 500 karakter')
    .optional()
})
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Date-based income filtering
*For any* date in WITA timezone, when querying income for that date, all returned transactions should have createdAt timestamps within the date range 00:00:00 to 23:59:59 of that date in WITA timezone.
**Validates: Requirements 1.1**

### Property 2: Income display completeness
*For any* rental transaction displayed as income, the response should include transaction code, customer name, rental amount, penalty amount (if applicable), transaction status, and kasirId fields.
**Validates: Requirements 1.2**

### Property 3: Penalty separation
*For any* transaction with a non-zero penalty amount, the penalty should be displayed as a separate field distinct from the rental amount.
**Validates: Requirements 1.3**

### Property 4: Income calculation correctness
*For any* set of transactions on a given date, the total income should equal the sum of all rental amounts plus the sum of all penalty amounts.
**Validates: Requirements 1.4**

### Property 5: Expense validation
*For any* expense submission, if the amount is not a positive number or the category is not one of the predefined values, the system should reject the submission with an appropriate error message.
**Validates: Requirements 2.2**

### Property 6: Expense audit trail
*For any* successfully created expense, the record should contain the kasirId of the creator and a timestamp in WITA timezone.
**Validates: Requirements 2.3**

### Property 7: Expense display completeness
*For any* expense record displayed, the response should include amount, description, category, creation timestamp, and kasirId fields.
**Validates: Requirements 2.4**

### Property 8: Expense field modification restriction
*For any* expense update operation, only the kasirId, harga, deskripsi, and kategori fields should be modifiable; createdBy, createdAt, and id should remain unchanged.
**Validates: Requirements 2.5**

### Property 9: Update timestamp preservation
*For any* expense update, the createdAt timestamp should remain unchanged while updatedAt should be set to the current timestamp.
**Validates: Requirements 3.3**

### Property 10: Soft delete behavior
*For any* expense deletion, the record should remain in the database with isActive set to false rather than being removed.
**Validates: Requirements 3.5**

### Property 11: Summary calculation - income
*For any* date, the total income in the summary should equal the sum of all rental amounts and penalty amounts from transactions created on that date.
**Validates: Requirements 4.2**

### Property 12: Summary calculation - expenses
*For any* date, the total expenses in the summary should equal the sum of all active (isActive=true) expense amounts recorded on that date.
**Validates: Requirements 4.3**

### Property 13: Net balance calculation
*For any* date, the net balance should equal total income minus total expenses.
**Validates: Requirements 4.4**

### Property 14: Historical date filtering
*For any* selected date, the system should return only income and expense records where the createdAt date matches the selected date.
**Validates: Requirements 5.2**

### Property 15: Kasir role write permissions
*For any* user with Kasir role, create, update, and delete operations on expenses should be permitted.
**Validates: Requirements 6.2**

### Property 16: Owner role read-only enforcement
*For any* user with Owner role, attempts to create, update, or delete expenses should be denied with an appropriate error response.
**Validates: Requirements 6.4**

### Property 17: CSV export completeness
*For any* date range export, the generated CSV should contain all income and expense records where createdAt falls within the specified range.
**Validates: Requirements 8.3**

### Property 18: CSV format correctness
*For any* generated CSV file, it should include columns for date, type, transaction code (for income), description, category (for expenses), amount, and kasirId.
**Validates: Requirements 8.4**

### Property 19: Amount validation
*For any* expense submission with amount ≤ 0, the system should reject it with error message "Jumlah harus lebih besar dari 0".
**Validates: Requirements 9.2**

### Property 20: Description length validation
*For any* expense submission with description exceeding 500 characters, the system should reject it with error message "Deskripsi maksimal 500 karakter".
**Validates: Requirements 9.4**

### Property 21: Creator audit trail
*For any* created expense, the createdBy field should contain the authenticated user's Clerk ID who performed the creation, while kasirId should contain the selected kasir from the dropdown.
**Validates: Requirements 12.1**

### Property 22: Soft delete filtering
*For any* query for expenses, records with isActive=false should be excluded from results and calculations.
**Validates: Requirements 12.5**

## Error Handling

### Validation Errors

```typescript
interface ValidationError {
  field: string
  message: string
  code: string
}

// Example validation errors:
{
  field: 'harga',
  message: 'Jumlah harus lebih besar dari 0',
  code: 'INVALID_AMOUNT'
}

{
  field: 'kategori',
  message: 'Kategori harus dipilih',
  code: 'MISSING_CATEGORY'
}

{
  field: 'deskripsi',
  message: 'Deskripsi maksimal 500 karakter',
  code: 'DESCRIPTION_TOO_LONG'
}
```

### API Error Responses

```typescript
interface ApiErrorResponse {
  success: false
  error: {
    message: string
    code: string
    details?: ValidationError[]
  }
}

// Common error codes:
- VALIDATION_ERROR: Input validation failed
- UNAUTHORIZED: User not authenticated
- FORBIDDEN: User lacks required permissions
- NOT_FOUND: Resource not found
- INTERNAL_ERROR: Server error
```

### Error Handling Strategy

1. **Input Validation**: Use Zod schemas at API boundary
2. **Authentication**: Check user session before processing
3. **Authorization**: Verify role permissions for write operations
4. **Database Errors**: Catch and log, return generic error to client
5. **Network Errors**: Provide retry mechanism in UI

## Testing Strategy

### Unit Testing

**Service Layer Tests:**
- PengeluaranService CRUD operations
- DanaSummaryService calculations
- Validation schema tests
- Date/timezone handling tests

**Test Coverage Goals:**
- Service layer: 80%+
- Validation logic: 100%
- Calculation functions: 100%

### Property-Based Testing

We will use **fast-check** (JavaScript/TypeScript property-based testing library) to implement the correctness properties defined above.

**Configuration:**
```typescript
import fc from 'fast-check'

// Run each property test with minimum 100 iterations
const testConfig = {
  numRuns: 100,
  verbose: true
}
```

**Example Property Test:**

```typescript
// Property 4: Income calculation correctness
describe('Dana Kasir - Property 4: Income calculation', () => {
  it('total income equals sum of rental + penalty amounts', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          rentalAmount: fc.float({ min: 0, max: 10000000 }),
          penaltyAmount: fc.float({ min: 0, max: 1000000 })
        })),
        (transactions) => {
          const expectedTotal = transactions.reduce(
            (sum, t) => sum + t.rentalAmount + t.penaltyAmount,
            0
          )
          const calculatedTotal = calculateTotalIncome(transactions)
          return Math.abs(expectedTotal - calculatedTotal) < 0.01 // Float precision
        }
      ),
      testConfig
    )
  })
})
```

**Property Test Implementation Plan:**
- Property 1-4: Income display and calculation
- Property 5-10: Expense CRUD and validation
- Property 11-14: Summary calculations
- Property 15-16: Role-based access control
- Property 17-20: Export and validation
- Property 21-22: Audit trail

### Integration Testing

**API Endpoint Tests:**
- Test each endpoint with valid/invalid inputs
- Test authentication/authorization
- Test error responses

**Database Integration:**
- Test Prisma queries
- Test soft delete behavior
- Test date filtering with WITA timezone

### End-to-End Testing

**User Workflows:**
1. Kasir creates expense → verify in database → verify in dashboard
2. Kasir edits expense → verify changes → verify audit trail
3. Kasir deletes expense → verify soft delete → verify not in list
4. Owner views dashboard → verify read-only → verify all kasir data visible
5. Owner exports CSV → verify file download → verify data completeness

## Performance Considerations

### Database Optimization

**Indexes:**
```sql
CREATE INDEX idx_pengeluaran_kasir_date ON pengeluaran_kasir(kasirId, createdAt DESC);
CREATE INDEX idx_pengeluaran_kasir_active ON pengeluaran_kasir(isActive);
CREATE INDEX idx_transaksi_date ON transaksi(createdAt);
```

**Query Optimization:**
- Use date range queries with indexes
- Limit result sets with pagination
- Use `SELECT` specific columns, avoid `SELECT *`
- Aggregate calculations at database level

### Caching Strategy

**React Query Configuration:**
```typescript
const queryConfig = {
  staleTime: 5 * 60 * 1000,      // 5 minutes
  cacheTime: 10 * 60 * 1000,     // 10 minutes
  refetchOnWindowFocus: false,
  refetchOnReconnect: true
}
```

**Cache Keys:**
- `dana-summary-${date}`: Daily summary data
- `pengeluaran-${date}`: Expense list for date
- `income-${date}`: Income list for date

### Performance Targets

- API response time: < 2 seconds
- Database query time: < 100ms
- Dashboard initial load: < 2 seconds
- CSV export (30 days): < 5 seconds

## Security Considerations

### Authentication

- Use existing Clerk authentication
- Verify JWT token on every API request
- Extract user ID and role from token claims

### Authorization

**Role-Based Access Matrix:**

| Operation | Kasir | Owner |
|-----------|-------|-------|
| View Income | ✅ | ✅ |
| View Expenses | ✅ | ✅ |
| Create Expense | ✅ | ❌ |
| Edit Expense | ✅ | ❌ |
| Delete Expense | ✅ | ❌ |
| Export CSV | ❌ | ✅ |

**Implementation:**
```typescript
// Middleware for role checking
async function requireKasirWrite(req: Request) {
  const user = await getAuthUser(req)
  if (user.role !== 'kasir') {
    throw new ForbiddenError('Only Kasir can perform this action')
  }
  return user
}

async function requireOwnerRead(req: Request) {
  const user = await getAuthUser(req)
  if (user.role !== 'owner' && user.role !== 'kasir') {
    throw new ForbiddenError('Insufficient permissions')
  }
  return user
}
```

### Data Validation

- Validate all inputs at API boundary using Zod
- Sanitize user inputs to prevent injection attacks
- Use parameterized queries (Prisma handles this)
- Validate file uploads (CSV export)

### Audit Trail

- Record `createdBy` (user ID) on all expense records
- Record `updatedAt` timestamp on updates
- Preserve soft-deleted records for audit purposes
- Log all write operations (create, update, delete)

## Deployment Considerations

### Database Migration

**Migration File: `001_add_pengeluaran_kasir.sql`**
```sql
-- Create PengeluaranKasir table
CREATE TABLE pengeluaran_kasir (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kasir_id UUID NOT NULL REFERENCES kasir(id) ON DELETE CASCADE,
  harga DECIMAL(12,2) NOT NULL CHECK (harga > 0),
  kategori VARCHAR(50) NOT NULL,
  deskripsi TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL
);

-- Create indexes
CREATE INDEX idx_pengeluaran_kasir_date ON pengeluaran_kasir(kasir_id, created_at DESC);
CREATE INDEX idx_pengeluaran_kasir_active ON pengeluaran_kasir(is_active);
CREATE INDEX idx_pengeluaran_kasir_created ON pengeluaran_kasir(created_at);

-- Add constraint for kategori
ALTER TABLE pengeluaran_kasir
ADD CONSTRAINT chk_kategori CHECK (kategori IN ('Operasional', 'Maintenance', 'Transport', 'Lainnya'));
```

**Rollback Plan:**
```sql
DROP TABLE IF EXISTS pengeluaran_kasir CASCADE;
```

### Environment Variables

```env
# Timezone configuration
TZ=Asia/Makassar  # WITA timezone

# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Authentication
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
```

### Monitoring

**Metrics to Track:**
- API response times
- Database query performance
- Error rates by endpoint
- User activity (creates, updates, deletes per day)
- CSV export frequency and size

**Logging:**
- Log all write operations with user ID and timestamp
- Log validation errors
- Log authorization failures
- Log performance metrics

## Future Enhancements

While keeping the initial implementation simple, these enhancements could be considered based on user feedback:

1. **Advanced Filtering**: Filter expenses by category, date range, kasir
2. **Expense Categories Management**: Allow admin to add custom categories
3. **Approval Workflow**: Require approval for expenses above threshold
4. **Recurring Expenses**: Support for recurring operational costs
5. **Budget Tracking**: Set and track monthly budgets by category
6. **Analytics Dashboard**: Charts and graphs for cash flow trends
7. **Mobile App**: Native mobile app for on-the-go expense entry
8. **Receipt Attachments**: Upload receipt images for expenses
9. **Multi-currency Support**: Handle different currencies
10. **Automated Reports**: Scheduled email reports for owners

**Note**: These enhancements should only be implemented if there is clear user demand and business value. The initial implementation focuses on core functionality.

---

**Document Version:** 1.0  
**Created:** 2025-01-29  
**Last Updated:** 2025-01-29  
**Status:** Ready for Implementation  
**Next Phase:** Task List Creation
