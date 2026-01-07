# Dana Kasir Income Flow Analysis

## Overview
Dana Kasir adalah sistem manajemen keuangan harian yang mengelola pendapatan dan pengeluaran kasir. Sistem ini mengintegrasikan data transaksi rental dengan pengeluaran operasional untuk memberikan gambaran lengkap cash flow harian.

## System Architecture

### Core Components
1. **DanaKasirDashboard** - Main orchestrator component
2. **API Route** - `/api/kasir/dana-summary` endpoint
3. **DanaSummaryService** - Business logic layer
4. **Database Layer** - Prisma ORM with PostgreSQL

## Data Flow Analysis

### 1. Dashboard Initialization Flow

```
User Access → DanaKasirDashboard → useDanaSummary Hook → API Call
                     ↓
            KasirFilter Component → Extract Kasir Options → Update Filter State
```

**Components:**
- `DanaKasirDashboard.tsx` - Main dashboard component with kasir filter state
- `useDanaSummary.ts` - React Query hook for data fetching with kasir parameter
- `/api/kasir/dana-summary/route.ts` - API endpoint with kasirId support
- `KasirFilter.tsx` - Dropdown filter component for kasir selection
- `DateNavigation.tsx` - Enhanced with kasir filter integration

**Process:**
1. Dashboard receives `initialDate` and `userRole` props
2. `useState` manages selected date and kasir filter state
3. `useDanaSummary` hook triggers API call with formatted date and optional kasirId
4. `KasirFilter` extracts unique kasir options from response data
5. React Query handles caching with separate keys for different kasir filters

### 2. API Request Processing Flow

```
GET /api/kasir/dana-summary?date=YYYY-MM-DD&kasirId=UUID (optional)
↓
Authentication Check (Clerk)
↓
Date & KasirId Validation & Parsing
↓
DanaSummaryService.getDailyData(date, kasirId?)
↓
Response Formatting
```

**Key Features:**
- **Authentication**: Clerk-based user authentication
- **Date Handling**: WITA timezone support with fallback to current date
- **Kasir Filtering**: Optional kasirId parameter for filtered results
- **Validation**: Zod schema validation for date and kasirId parameters
- **Error Handling**: Comprehensive error responses with specific codes

### 3. Income Calculation Flow

#### 3.1 Rental Income (Primary Source)

```
Transaksi Table Query
↓
Filter by createdAt (WITA day range)
↓
Optional: Filter by kasirId (if specified)
↓
Aggregate: SUM(jumlahBayar + flatLatePenalty)
```

**Data Sources:**
- `jumlahBayar` - Base rental amount
- `flatLatePenalty` - Late return penalty (flat 20,000 per item)

**Filtering Logic:**
```typescript
const incomeWhere = {
  createdAt: { gte: start, lte: end },
  ...(kasirId && { kasirId })
}
```

#### 3.2 Penalty Income (Secondary Source)

```
TransaksiItem Table Query
↓
Filter by transaksi.tglKembali (WITA day range)
↓
Optional: Filter by transaksi.kasirId (if specified)
↓
WHERE totalReturnPenalty > 0
↓
Aggregate: SUM(totalReturnPenalty)
```

**Data Sources:**
- `totalReturnPenalty` - Condition-based penalties from return process

**Filtering Logic:**
```typescript
const penaltyWhere = {
  transaksi: {
    tglKembali: { gte: start, lte: end },
    ...(kasirId && { kasirId })
  },
  totalReturnPenalty: { gt: 0 }
}
```

#### 3.3 Total Income Formula

```typescript
totalIncome = 
  SUM(transaksi.jumlahBayar) +           // Rental payments
  SUM(transaksi.flatLatePenalty) +       // Late penalties
  SUM(transaksiItem.totalReturnPenalty)  // Condition penalties
```

### 4. Income List Generation Flow

#### 4.1 Rental Transactions

```sql
SELECT t.*, p.nama, k.nama 
FROM transaksi t
JOIN penyewa p ON t.penyewaId = p.id
LEFT JOIN kasir k ON t.kasirId = k.id
WHERE t.createdAt BETWEEN start AND end
  AND (kasirId IS NULL OR t.kasirId = kasirId)
ORDER BY t.createdAt DESC
```

**Output Structure:**
```typescript
{
  type: 'rental',
  transaksiKode: string,
  customerName: string,
  rentalAmount: number,
  penaltyAmount: number, // flatLatePenalty
  status: string,
  kasirId: string,
  kasirName: string,
  createdAt: Date
}
```

#### 4.2 Penalty Payments

```sql
SELECT t.*, p.nama, k.nama, ti.totalReturnPenalty
FROM transaksi t
JOIN penyewa p ON t.penyewaId = p.id
LEFT JOIN kasir k ON t.kasirId = k.id
JOIN transaksiItem ti ON t.id = ti.transaksiId
WHERE t.tglKembali BETWEEN start AND end
  AND (kasirId IS NULL OR t.kasirId = kasirId)
  AND ti.totalReturnPenalty > 0
ORDER BY t.tglKembali DESC
```

**Output Structure:**
```typescript
{
  type: 'penalty',
  transaksiKode: string,
  customerName: string,
  rentalAmount: 0,
  penaltyAmount: number, // totalReturnPenalty
  status: string,
  kasirId: string,
  kasirName: string,
  createdAt: Date, // tglKembali
  penaltyBreakdown: {
    latePenalty: number,
    conditionPenalty: number,
    itemCount: number
  }
}
```

### 5. Expense Calculation Flow

```
PengeluaranKasir Table Query
↓
Filter by createdAt (WITA day range)
↓
Optional: Filter by kasirId (if specified)
↓
WHERE isActive = true
↓
Aggregate: SUM(harga)
```

**Categories:**
- Operasional
- Maintenance
- Transport
- Refund Dana Jaminan
- Lainnya

**Filtering Logic:**
```typescript
const expenseWhere = {
  isActive: true,
  createdAt: { gte: start, lte: end },
  ...(kasirId && { kasirId })
}
```

### 6. Net Balance Calculation

```typescript
netBalance = totalIncome - totalExpense
```

Where:
- `totalIncome` = Rental + Late Penalties + Condition Penalties
- `totalExpense` = Sum of active expenses

## Data Structures

### DailySummary
```typescript
interface DailySummary {
  totalIncome: number      // Combined rental + penalty income
  totalExpense: number     // Sum of active expenses
  netBalance: number       // totalIncome - totalExpense
  date: string            // WITA formatted date
}
```

### IncomeItem
```typescript
interface IncomeItem {
  type: 'rental' | 'penalty'
  transaksiKode: string
  customerName: string
  rentalAmount: number
  penaltyAmount: number
  status: string
  kasirId: string
  kasirName: string
  createdAt: Date
  penaltyBreakdown?: {
    latePenalty: number
    conditionPenalty: number
    itemCount: number
  }
}
```

### PengeluaranKasir
```typescript
interface PengeluaranKasir {
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
```

### KasirOption (NEW)
```typescript
interface KasirOption {
  id: string
  nama: string
}
```

### DanaSummaryResponse
```typescript
interface DanaSummaryResponse {
  summary: DailySummary
  income: IncomeItem[]
  expenses: PengeluaranKasir[]
}
```

## Key Features

### 1. Timezone Handling
- **WITA Support**: All date operations use WITA timezone
- **Day Range Calculation**: Proper start/end of day in WITA
- **Date Formatting**: Consistent YYYY-MM-DD format

### 3. Income Segregation
- **Rental Income**: Base rental payments + flat late penalties
- **Penalty Income**: Condition-based penalties from returns
- **Separate Tracking**: Different date filters for different income types

### 4. Kasir-based Filtering (NEW)
- **Dynamic Options**: Kasir dropdown populated from actual data
- **Conditional Queries**: Database queries include optional kasir filter
- **UI Context**: Visual indicators show which kasir is selected
- **Performance Optimized**: Separate React Query cache keys per kasir

### 5. Kasir Filtering System (NEW)
- **Filter Options**: Extract unique kasir from income and expense data
- **Default State**: "Semua Kasir" shows all data
- **Filtered State**: Show only data from selected kasir
- **Filter Persistence**: Kasir selection persists when changing dates
- **Empty State Handling**: Contextual messages when no data for selected kasir

### 6. Real-time Updates
- **React Query**: Automatic caching and background updates
- **Optimistic Updates**: Immediate UI updates on mutations
- **Error Recovery**: Automatic retry on network failures

### 4. Role-based Access
- **Kasir Role**: Full read/write access to expenses + kasir filtering
- **Owner Role**: Read-only access with export capabilities + kasir filtering
- **Filter Access**: All roles can filter by any kasir (no restrictions)

## Error Handling

### API Level
- **Authentication Errors**: 401 Unauthorized
- **Validation Errors**: 400 Bad Request with field details
- **Database Errors**: 503 Service Unavailable
- **Generic Errors**: 500 Internal Server Error

### Client Level
- **Network Errors**: Automatic retry with exponential backoff
- **Data Errors**: Graceful fallback to cached data
- **UI Errors**: User-friendly error messages with retry options

## Performance Considerations

### Database Optimization
- **Indexed Queries**: Proper indexes on date and foreign key columns
- **Kasir Index Optimization**: Combined indexes for (kasirId, createdAt) and (kasirId, tglKembali)
- **Aggregation**: Database-level SUM operations with conditional filtering
- **Selective Joins**: Only fetch required fields
- **Conditional WHERE Clauses**: Efficient kasir filtering with spread operator

### Caching Strategy
- **React Query**: 5-minute stale time, 10-minute garbage collection
- **Kasir-specific Caching**: Separate cache keys for different kasir filters
- **Query Key Structure**: `['dana-summary', dateStr, kasirId?]`
- **API Response**: Structured for efficient caching
- **Background Updates**: Automatic refresh on window focus

## Security Measures

### Authentication
- **Clerk Integration**: Secure user authentication
- **Role Validation**: Server-side role checking
- **Session Management**: Automatic token refresh

### Data Protection
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Prisma ORM parameterized queries
- **XSS Protection**: Sanitized output rendering

## Future Enhancements

### Planned Features
1. **Export Functionality**: CSV/PDF export for date ranges with kasir filtering
2. **Advanced Filtering**: Category-based expense filtering combined with kasir filter
3. **Reporting Dashboard**: Monthly/yearly summaries per kasir
4. **Audit Trail**: Change tracking for expenses with kasir attribution
5. **Kasir Performance Analytics**: Individual kasir performance metrics

### Technical Improvements
1. **Real-time Updates**: WebSocket integration
2. **Offline Support**: Service worker caching
3. **Mobile Optimization**: Responsive design improvements
4. **Performance Monitoring**: Error tracking and analytics

## Kasir Filter Implementation (NEW)

### Filter Flow Architecture

```
User Selects Kasir → State Update → API Call with kasirId → Filtered Results
                                        ↓
                              React Query Cache (per kasir)
                                        ↓
                              UI Updates with Context Banner
```

### Component Integration

1. **KasirFilter Component**
   - Extracts unique kasir from income/expense data
   - Provides dropdown with "Semua Kasir" default
   - Handles loading states during filter changes

2. **DateNavigation Enhancement**
   - Integrates kasir filter alongside date picker
   - Responsive layout for mobile compatibility
   - Maintains existing date functionality

3. **Dashboard State Management**
   - Manages `selectedKasirId` state independently from date
   - Kasir filter persists across date changes
   - Proper kasir name extraction for UI context

4. **Empty State Handling**
   - Contextual messages when no data for selected kasir
   - Visual distinction between "no data today" vs "no data for kasir"
   - Maintains user-friendly experience

### API Parameter Flow

```typescript
// Request URL examples:
GET /api/kasir/dana-summary?date=2026-01-05                    // All kasir
GET /api/kasir/dana-summary?date=2026-01-05&kasirId=uuid-123   // Specific kasir

// Service layer filtering:
const whereClause = {
  createdAt: { gte: start, lte: end },
  ...(kasirId && { kasirId })  // Conditional kasir filter
}
```

### Performance Optimizations

1. **Database Level**
   - Conditional WHERE clauses prevent unnecessary filtering
   - Proper indexing on kasirId + date combinations
   - Efficient aggregation queries

2. **Frontend Level**
   - Separate React Query cache keys per kasir
   - Optimistic UI updates during filter changes
   - Debounced filter operations

3. **UX Enhancements**
   - Loading states during filter transitions
   - Visual feedback for active filters
   - Responsive design for all screen sizes

## Conclusion

Dana Kasir system provides comprehensive daily financial management with:
- **Accurate Income Tracking**: Multiple income sources with proper segregation
- **Expense Management**: Categorized expense tracking with audit trail
- **Kasir-based Filtering**: Granular data filtering by individual kasir performance
- **Real-time Dashboard**: Live updates with caching optimization per kasir
- **Role-based Security**: Appropriate access controls for different user types
- **Performance Optimized**: Efficient database queries and frontend caching

The system successfully integrates rental transaction data with operational expenses to provide clear daily financial insights for business management, now enhanced with individual kasir performance tracking and filtering capabilities.