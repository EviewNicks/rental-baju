# Design Document

## Overview

This document outlines the technical design for implementing a date filter feature in the transaction list system. The solution integrates seamlessly with the existing filtering architecture while maintaining performance and user experience standards.

## Architecture

### System Integration Points

The date filter feature integrates with the existing transaction list flow at multiple levels:

1. **Frontend Components**: Extends `TransactionTabs.tsx` with date picker functionality
2. **State Management**: Enhances `useTransactions.ts` hook with date filter state
3. **API Layer**: Updates `kasirApi` and route handlers to support date parameters
4. **Caching System**: Extends existing cache keys to include date parameters

### Component Hierarchy

```
TransactionsDashboard
├── TransactionTabs (Enhanced)
│   ├── Status Tabs (Existing)
│   ├── Date Filter (New)
│   ├── Search Input (Existing)
│   └── Reset Button (New)
└── TransactionTable (Existing)
```

## Components and Interfaces

### Enhanced TransactionTabs Component

**New Props Interface:**
```typescript
interface TransactionTabsProps {
  // Existing props
  activeTab: TransactionStatus | 'all'
  onTabChange: (tab: TransactionStatus | 'all') => void
  searchValue: string
  onSearchChange: (value: string) => void
  counts: TransactionCounts
  
  // New date filter props
  dateValue: string | null
  onDateChange: (date: string | null) => void
  onResetFilters: () => void
  hasActiveFilters: boolean
}
```

**New Components:**
```typescript
// Date picker component
interface DateFilterProps {
  value: string | null
  onChange: (date: string | null) => void
  placeholder?: string
  className?: string
}

// Reset button component
interface ResetButtonProps {
  onReset: () => void
  hasActiveFilters: boolean
  className?: string
}
```

### Enhanced useTransactions Hook

**Extended Filter State:**
```typescript
interface TransactionFilters {
  status?: TransactionStatus
  search?: string
  dateFilter?: string // New: ISO date string (YYYY-MM-DD)
}
```

**New Hook Returns:**
```typescript
interface UseTransactionsReturn {
  // Existing returns
  transactions: Transaction[]
  filters: TransactionFilters
  updateFilters: (filters: Partial<TransactionFilters>) => void
  isLoading: boolean
  error: Error | null
  counts: TransactionCounts
  
  // New date filter returns
  resetAllFilters: () => void
  hasActiveFilters: boolean
}
```

### API Layer Updates

**Enhanced Query Parameters:**
```typescript
interface TransaksiQueryParams {
  page?: number
  limit?: number
  status?: TransactionStatus
  search?: string
  penyewaId?: string
  dateStart?: string
  dateEnd?: string
  tglMulai?: string // New: Single date filter
}
```

**Route Handler Enhancement:**
```typescript
// Enhanced query parameter parsing
const queryParams = {
  page: searchParams.get('page') || '1',
  limit: searchParams.get('limit') || '10',
  status: searchParams.get('status') || undefined,
  search: searchParams.get('search') || undefined,
  penyewaId: searchParams.get('penyewaId') || undefined,
  dateStart: searchParams.get('dateStart') || undefined,
  dateEnd: searchParams.get('dateEnd') || undefined,
  tglMulai: searchParams.get('tglMulai') || undefined, // New
}
```

## Data Models

### Date Filter State Management

**Filter State Structure:**
```typescript
interface DateFilterState {
  selectedDate: string | null // ISO date string or null
  isValid: boolean
  error: string | null
}
```

**URL Parameter Mapping:**
```typescript
interface URLParams {
  status?: string
  search?: string
  tglMulai?: string // New: Format YYYY-MM-DD
  refresh?: string
}
```

### Cache Key Enhancement

**Extended Cache Key Generation:**
```typescript
function generateTransactionCacheKey(params: {
  search?: string
  status?: TransactionStatus
  page?: number
  limit?: number
  tglMulai?: string // New
}): string {
  return `transactions:${JSON.stringify(params)}`
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Date Filter Accuracy
*For any* valid date input, the filtered transaction list should contain only transactions where tglMulai matches the selected date exactly
**Validates: Requirements 1.2, 4.2**

### Property 2: Filter Combination Consistency
*For any* combination of active filters (status, search, date), the result set should satisfy all filter conditions simultaneously
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Reset Functionality Completeness
*For any* active filter state, triggering reset should clear all filters and return the complete transaction list
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 4: URL State Persistence
*For any* valid date filter state, the URL should accurately represent the filter and restore the same state on page load
**Validates: Requirements 7.1, 7.2, 7.3**

### Property 5: Input Validation Safety
*For any* date input (valid or invalid), the system should handle it safely without causing errors or security vulnerabilities
**Validates: Requirements 6.1, 6.2, 6.4**

### Property 6: Performance Debouncing
*For any* sequence of rapid date changes, only the final value should trigger an API call after the debounce period
**Validates: Requirements 4.3, 8.1**

### Property 7: Cache Consistency
*For any* date filter query, cached results should match fresh API results for the same parameters
**Validates: Requirements 4.4, 8.2**

### Property 8: Accessibility Compliance
*For any* user interaction method (mouse, keyboard, screen reader), the date filter should be fully accessible and functional
**Validates: Requirements 5.2, 5.3, 5.4**

## Error Handling

### Date Validation Strategy

**Input Validation:**
```typescript
function validateDateInput(dateString: string): {
  isValid: boolean
  error?: string
  normalizedDate?: string
} {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return { isValid: false, error: 'Invalid date format' }
    }
    
    // Normalize to YYYY-MM-DD format
    const normalizedDate = date.toISOString().split('T')[0]
    return { isValid: true, normalizedDate }
  } catch (error) {
    return { isValid: false, error: 'Date parsing failed' }
  }
}
```

**Error Recovery:**
```typescript
// Graceful fallback for date filter errors
function handleDateFilterError(error: Error): void {
  console.warn('Date filter error:', error.message)
  // Clear invalid date filter
  updateFilters({ dateFilter: undefined })
  // Show user-friendly message
  toast.warning('Filter tanggal tidak valid, menampilkan semua transaksi')
}
```

### API Error Handling

**Backend Validation:**
```typescript
// Enhanced query validation schema
const transaksiQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.enum(['active', 'diambil', 'selesai', 'terlambat', 'cancelled']).optional(),
  search: z.string().optional(),
  penyewaId: z.string().uuid().optional(),
  dateStart: z.string().datetime().optional(),
  dateEnd: z.string().datetime().optional(),
  tglMulai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // New: YYYY-MM-DD format
})
```

## Testing Strategy

### Unit Testing Approach

**Component Testing:**
- Date picker component rendering and interaction
- Reset button visibility and functionality
- Filter state management in useTransactions hook
- URL parameter parsing and serialization

**Integration Testing:**
- Complete filter flow from UI to API
- Cache invalidation with date parameters
- Error handling across all layers
- Accessibility compliance testing

### Property-Based Testing Configuration

**Test Framework:** Jest with @fast-check/jest for property-based testing
**Minimum Iterations:** 100 per property test
**Test Tags:** Each property test tagged with feature name and property number

**Example Property Test:**
```typescript
// Feature: transaction-date-filter, Property 1: Date Filter Accuracy
test('date filter returns only matching transactions', () => {
  fc.assert(fc.property(
    fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
    fc.array(mockTransactionGenerator),
    (filterDate, transactions) => {
      const filtered = applyDateFilter(transactions, filterDate.toISOString().split('T')[0])
      return filtered.every(t => t.tglMulai.startsWith(filterDate.toISOString().split('T')[0]))
    }
  ))
})
```

### Performance Testing

**Metrics to Monitor:**
- Date filter response time (target: <200ms)
- Cache hit rate with date parameters
- Debounce effectiveness (API call reduction)
- Memory usage with extended cache keys

**Load Testing Scenarios:**
- Rapid date filter changes
- Large transaction datasets with date filtering
- Concurrent users with different date filters
- Cache performance under date filter load

## Implementation Phases

### Phase 1: Core Date Filter (MVP)
- Basic date picker component
- Single date filtering functionality
- API parameter integration
- Basic error handling

### Phase 2: Enhanced UX
- Reset button implementation
- URL state persistence
- Loading states and feedback
- Accessibility improvements

### Phase 3: Performance Optimization
- Debouncing implementation
- Cache key enhancement
- Auto-refresh integration
- Performance monitoring

### Phase 4: Polish and Testing
- Comprehensive test coverage
- Error handling refinement
- Documentation updates
- User acceptance testing

This design provides a solid foundation for implementing the date filter feature while maintaining the existing system's performance and reliability characteristics.