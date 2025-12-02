# Dana Kasir Services

This directory contains the service layer for Dana Kasir Management feature.

## Services

### PengeluaranService
Handles CRUD operations for expense (pengeluaran) records.

**Methods:**
- `create(data)` - Create new expense
- `update(id, data)` - Update existing expense
- `softDelete(id)` - Soft delete expense (sets isActive = false)
- `getByDate(date)` - Get expenses for specific date
- `getById(id)` - Get expense by ID

### DanaSummaryService
Handles daily summary calculations and data aggregation.

**Methods:**
- `getDailySummary(date)` - Calculate daily totals (income, expense, net balance)
- `getIncomeList(date)` - Get list of income items (rental transactions)
- `getExpenseList(date)` - Get list of expenses
- `getDailyData(date)` - Get complete daily data (summary + lists)

### CSVExportService
Handles CSV export functionality for income and expense data.

**Methods:**
- `generateCSV(startDate, endDate)` - Generate CSV content for date range
- `generateFilename(startDate, endDate)` - Generate filename for CSV export

**CSV Format:**
```csv
Tanggal,Tipe,Kode Transaksi,Nama Customer,Kategori,Deskripsi,Jumlah Rental,Jumlah Penalty,Total Jumlah,Kasir ID,Nama Kasir
2025-01-29,Pendapatan,TXN001,John Doe,,,200000,0,200000,kasir-1,Ahmad
2025-01-29,Pengeluaran,,,Operasional,Beli alat tulis,,,75000,kasir-1,Ahmad
```

## Usage Examples

### Export CSV
```typescript
import { CSVExportService } from '@/features/dana-kasir/services/csvExportService'
import { prisma } from '@/lib/prisma'

const csvService = new CSVExportService(prisma)
const startDate = new Date('2025-01-01')
const endDate = new Date('2025-01-31')

const csvContent = await csvService.generateCSV(startDate, endDate)
const filename = csvService.generateFilename(startDate, endDate)
// filename: "dana-kasir-2025-01-01-to-2025-01-31.csv"
```

### Get Daily Summary
```typescript
import { DanaSummaryService } from '@/features/dana-kasir/services/danaSummaryService'
import { prisma } from '@/lib/prisma'

const summaryService = new DanaSummaryService(prisma)
const today = new Date()

const summary = await summaryService.getDailySummary(today)
// {
//   totalIncome: 500000,
//   totalExpense: 150000,
//   netBalance: 350000,
//   date: "2025-01-29"
// }
```

### Create Expense
```typescript
import { PengeluaranService } from '@/features/dana-kasir/services/pengeluaranService'
import { prisma } from '@/lib/prisma'

const pengeluaranService = new PengeluaranService(prisma, 'user-id-123')

const expense = await pengeluaranService.create({
  harga: 75000,
  kategori: 'Operasional',
  deskripsi: 'Beli alat tulis'
})
```

## Authorization

All services assume authorization has been checked at the API layer:

- **PengeluaranService**: Requires Kasir role for write operations
- **DanaSummaryService**: Requires Kasir or Owner role for read operations
- **CSVExportService**: Requires Owner role for export operations

## Timezone Handling

All services use WITA timezone (Asia/Makassar, UTC+8) for date filtering and formatting.

See `features/dana-kasir/utils/timezone.ts` for timezone utilities.

## Error Handling

Services throw errors that should be caught and handled at the API layer:

- Validation errors (from Zod schemas)
- Database errors (from Prisma)
- Not found errors (when record doesn't exist)
- Authorization errors (when user lacks permissions)

## Testing

Services can be tested with:
- Unit tests for individual methods
- Integration tests with test database
- Property-based tests for calculations

See `.kiro/specs/dana-kasir-management/design.md` for testing strategy.
