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
```

**Components:**
- `DanaKasirDashboard.tsx` - Main dashboard component
- `useDanaSummary.ts` - React Query hook for data fetching
- `/api/kasir/dana-summary/route.ts` - API endpoint

**Process:**
1. Dashboard receives `initialDate` and `userRole` props
2. `useState` manages selected date state
3. `useDanaSummary` hook triggers API call with formatted date
4. React Query handles caching and refetching

### 2. API Request Processing Flow

```
GET /api/kasir/dana-summary?date=YYYY-MM-DD
↓
Authentication Check (Clerk)
↓
Date Validation & Parsing
↓
DanaSummaryService.getDailyData()
↓
Response Formatting
```

**Key Features:**
- **Authentication**: Clerk-based user authentication
- **Date Handling**: WITA timezone support with fallback to current date
- **Validation**: Zod schema validation for date parameters
- **Error Handling**: Comprehensive error responses with specific codes

### 3. Income Calculation Flow

#### 3.1 Rental Income (Primary Source)

```
Transaksi Table Query
↓
Filter by createdAt (WITA day range)
↓
Aggregate: SUM(jumlahBayar + flatLatePenalty)
```

**Data Sources:**
- `jumlahBayar` - Base rental amount
- `flatLatePenalty` - Late return penalty (flat 20,000 per item)

#### 3.2 Penalty Income (Secondary Source)

```
TransaksiItem Table Query
↓
Filter by transaksi.tglKembali (WITA day range)
↓
WHERE totalReturnPenalty > 0
↓
Aggregate: SUM(totalReturnPenalty)
```

**Data Sources:**
- `totalReturnPenalty` - Condition-based penalties from return process

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

## Key Features

### 1. Timezone Handling
- **WITA Support**: All date operations use WITA timezone
- **Day Range Calculation**: Proper start/end of day in WITA
- **Date Formatting**: Consistent YYYY-MM-DD format

### 2. Income Segregation
- **Rental Income**: Base rental payments + flat late penalties
- **Penalty Income**: Condition-based penalties from returns
- **Separate Tracking**: Different date filters for different income types

### 3. Real-time Updates
- **React Query**: Automatic caching and background updates
- **Optimistic Updates**: Immediate UI updates on mutations
- **Error Recovery**: Automatic retry on network failures

### 4. Role-based Access
- **Kasir Role**: Full read/write access to expenses
- **Owner Role**: Read-only access with export capabilities

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
- **Aggregation**: Database-level SUM operations
- **Selective Joins**: Only fetch required fields

### Caching Strategy
- **React Query**: 5-minute stale time, 10-minute garbage collection
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
1. **Export Functionality**: CSV/PDF export for date ranges
2. **Advanced Filtering**: Category-based expense filtering
3. **Reporting Dashboard**: Monthly/yearly summaries
4. **Audit Trail**: Change tracking for expenses

### Technical Improvements
1. **Real-time Updates**: WebSocket integration
2. **Offline Support**: Service worker caching
3. **Mobile Optimization**: Responsive design improvements
4. **Performance Monitoring**: Error tracking and analytics

## Conclusion

Dana Kasir system provides comprehensive daily financial management with:
- **Accurate Income Tracking**: Multiple income sources with proper segregation
- **Expense Management**: Categorized expense tracking with audit trail
- **Real-time Dashboard**: Live updates with caching optimization
- **Role-based Security**: Appropriate access controls for different user types

The system successfully integrates rental transaction data with operational expenses to provide clear daily financial insights for business management.