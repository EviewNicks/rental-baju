# Dana Kasir Management

Sistem manajemen cash flow harian untuk operasional rental business.

## 📁 Struktur Folder

```
features/dana-kasir/
├── services/              # Business logic layer
│   ├── pengeluaranService.ts    # Expense CRUD operations
│   ├── danaSummaryService.ts    # Daily summary calculations
│   └── index.ts                 # Service exports
├── utils/                 # Utility functions
│   ├── timezone.ts              # WITA timezone handling
│   └── currency.ts              # Currency formatting
├── types.ts              # TypeScript type definitions
├── validation.ts         # Zod validation schemas
├── index.ts             # Main export file
└── README.md            # This file
```

## 🔐 Authorization

Authorization untuk Dana Kasir diintegrasikan ke dalam main auth middleware di `lib/auth-middleware.ts`.

### Permissions Matrix

| Operation | Kasir | Owner | Admin | Producer |
|-----------|-------|-------|-------|----------|
| View Income | ✅ | ✅ | ✅ | ✅ |
| View Expenses | ✅ | ✅ | ✅ | ✅ |
| Create Expense | ✅ | ❌ | ❌ | ❌ |
| Edit Expense | ✅ | ❌ | ❌ | ❌ |
| Delete Expense | ✅ | ❌ | ❌ | ❌ |
| Export CSV | ❌ | ✅ | ❌ | ❌ |

### Authorization Functions

```typescript
import {
  requireDanaKasirRead,
  requireDanaKasirWrite,
  requireDanaKasirExport,
  canModifyDanaKasirExpense,
} from '@/lib/auth-middleware'

// Read access (Kasir, Owner, Admin, Producer)
const authResult = await requireDanaKasirRead()

// Write access (Kasir only)
const authResult = await requireDanaKasirWrite()

// Export access (Owner only)
const authResult = await requireDanaKasirExport()

// Check expense ownership
const canModify = canModifyDanaKasirExpense(userRole, userId, expenseKasirId)
```

## 🌐 API Endpoints

### Expense Management

**GET /api/kasir/pengeluaran**
- Query: `date` (optional, defaults to today)
- Auth: Kasir, Owner, Admin, Producer (read)
- Returns: List of expenses for the date

**POST /api/kasir/pengeluaran**
- Body: `{ harga, kategori, deskripsi }`
- Auth: Kasir (write only)
- Returns: Created expense record

**PUT /api/kasir/pengeluaran/[id]**
- Body: `{ harga?, kategori?, deskripsi? }`
- Auth: Kasir (write only, own expenses)
- Returns: Updated expense record

**DELETE /api/kasir/pengeluaran/[id]**
- Auth: Kasir (write only, own expenses)
- Returns: Success confirmation
- Note: Soft delete (sets `isActive = false`)

### Dashboard Data

**GET /api/kasir/dana-summary**
- Query: `date` (optional, defaults to today)
- Auth: Kasir, Owner, Admin, Producer (read)
- Returns: `{ summary, income, expenses }`

## 📊 Services

### PengeluaranService

Handles expense CRUD operations:

```typescript
import { PengeluaranService } from '@/features/dana-kasir'

const service = new PengeluaranService(prisma, userId, kasirId)

// Create expense
const expense = await service.create({ harga, kategori, deskripsi })

// Update expense
const updated = await service.update(id, { harga, kategori })

// Soft delete
await service.softDelete(id)

// Get by date
const expenses = await service.getByDate(date)

// Get by ID
const expense = await service.getById(id)
```

### DanaSummaryService

Handles daily summary calculations:

```typescript
import { DanaSummaryService } from '@/features/dana-kasir'

const service = new DanaSummaryService(prisma)

// Get daily summary
const summary = await service.getDailySummary(date)

// Get income list
const income = await service.getIncomeList(date)

// Get expense list
const expenses = await service.getExpenseList(date)

// Get complete daily data
const dailyData = await service.getDailyData(date)
```

## ✅ Validation

Validation menggunakan Zod schemas:

```typescript
import {
  validateCreatePengeluaran,
  validateUpdatePengeluaran,
  validateDateQuery,
} from '@/features/dana-kasir'

// Validate create expense
const result = validateCreatePengeluaran({ harga, kategori, deskripsi })

// Validate update expense
const result = validateUpdatePengeluaran({ harga, kategori })

// Validate date query
const result = validateDateQuery({ date: '2025-01-29' })
```

## 🕐 Timezone

Semua operasi menggunakan WITA timezone (Asia/Makassar, UTC+8):

```typescript
import {
  getCurrentWITADate,
  getWITADayRange,
  formatWITADate,
  parseWITADate,
} from '@/features/dana-kasir'

// Get current date in WITA
const now = getCurrentWITADate()

// Get day range (00:00 - 23:59 WITA)
const { start, end } = getWITADayRange(date)

// Format date
const formatted = formatWITADate(date) // "2025-01-29"

// Parse date string
const parsed = parseWITADate('2025-01-29')
```

## 💰 Currency

Format dan parse currency dalam Rupiah:

```typescript
import { formatCurrency, parseCurrency } from '@/features/dana-kasir'

// Format to Rupiah
const formatted = formatCurrency(50000) // "Rp 50.000"

// Parse from string
const amount = parseCurrency('Rp 50.000') // 50000
```

## 📝 Types

```typescript
import type {
  ExpenseCategory,
  PengeluaranKasir,
  CreatePengeluaranRequest,
  UpdatePengeluaranRequest,
  DailySummary,
  IncomeItem,
  DanaSummaryResponse,
} from '@/features/dana-kasir'
```

## 🔧 Development

### Phase 1: Database & Services ✅
- Database schema
- Type definitions
- Validation schemas
- PengeluaranService
- DanaSummaryService

### Phase 2: API Layer ✅
- Expense CRUD endpoints
- Dana summary endpoint
- Authorization middleware

### Phase 3: UI Components (Next)
- Dashboard page
- Date navigation
- Summary cards
- Income/Expense lists
- Expense form
- Delete confirmation

### Phase 4: Integration & Polish (Next)
- React Query hooks
- Error handling
- Mobile responsive
- Performance optimization

## 📚 References

- Design Document: `.kiro/specs/dana-kasir-management/design.md`
- Requirements: `.kiro/specs/dana-kasir-management/requirements.md`
- Tasks: `.kiro/specs/dana-kasir-management/tasks.md`
