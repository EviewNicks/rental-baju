# Design Document

## Overview

This design document outlines the migration of kasir (cashier) information retrieval from Clerk API to the internal database Kasir table. The current implementation uses an external API call to Clerk for every transaction detail request, which introduces unnecessary latency, external dependencies, and inconsistent data representation. This migration will improve performance, reduce external API dependencies, and provide a consistent data structure across the application.

The solution involves:
1. Modifying the Prisma query to include the kasir relation
2. Removing the `enrichTransactionWithKasirInfo` function that calls Clerk API
3. Updating the response formatter to use database kasir data
4. Ensuring graceful error handling for missing or invalid kasir references

## Architecture

### Current Architecture (Before Migration)

```
┌─────────────────┐
│  Frontend       │
│  Component      │
│  (KasirInfoCard)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Route      │
│  GET /api/kasir/│
│  transaksi/[kode]│
└────────┬────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌──────────────┐
│  Database       │  │  Clerk API   │
│  (Transaksi)    │  │  (User Info) │
└─────────────────┘  └──────────────┘
```

### Target Architecture (After Migration)

```
┌─────────────────┐
│  Frontend       │
│  Component      │
│  (KasirInfoCard)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Route      │
│  GET /api/kasir/│
│  transaksi/[kode]│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Database       │
│  (Transaksi +   │
│   Kasir join)   │
└─────────────────┘
```


## Components and Interfaces

### 1. API Route Handler (`app/api/kasir/transaksi/[kode]/route.ts`)

**Current Implementation Issues:**
- Calls `enrichTransactionWithKasirInfo()` which makes external Clerk API calls
- Adds ~200-500ms latency per request
- Creates external dependency that can fail independently
- Returns inconsistent data structure (Clerk user vs Kasir table)

**Target Implementation:**
- Remove `enrichTransactionWithKasirInfo()` function
- Remove `clerkClient` import
- Rely on Prisma query to include kasir relation
- Use `formatTransactionResponse()` to format kasir data directly

### 2. TransaksiService (`features/kasir/services/transaksiService.ts`)

**Methods to Update:**

```typescript
// getTransaksiByCode method
async getTransaksiByCode(kode: string) {
  const transaksi = await this.prisma.transaksi.findUnique({
    where: { kode },
    include: {
      penyewa: true,
      items: {
        include: {
          produk: {
            include: {
              category: true
            }
          },
          returnConditions: true
        }
      },
      pembayaran: true,
      aktivitas: {
        orderBy: { createdAt: 'desc' }
      },
      kasir: true  // ✅ ADD THIS: Include kasir relation
    }
  })
  
  if (!transaksi) {
    throw new Error(`Transaksi dengan kode ${kode} tidak ditemukan`)
  }
  
  return transaksi
}
```

**Error Handling:**
- If kasir relation fails to load, set kasir to null
- Log warning but don't throw error
- Continue processing transaction data

### 3. Response Formatter (`features/kasir/lib/utils/responseFormatter.ts`)

**Current Behavior:**
- Formats transaction data but expects kasir to be added later by `enrichTransactionWithKasirInfo()`

**Target Behavior:**
- Include kasir data directly from Prisma query result
- Transform kasir data to match KasirInfo interface
- Handle null kasir gracefully

```typescript
export function formatTransactionResponse(transaksi: TransaksiWithDetails) {
  return {
    id: transaksi.id,
    kode: transaksi.kode,
    penyewa: transaksi.penyewa,
    kasir: transaksi.kasir ? {
      id: transaksi.kasir.id,
      nama: transaksi.kasir.nama,
      isActive: transaksi.kasir.isActive,
      createdAt: transaksi.kasir.createdAt?.toISOString(),
      updatedAt: transaksi.kasir.updatedAt?.toISOString()
    } : null,  // ✅ Include kasir from database
    status: transaksi.status,
    // ... other fields
  }
}
```

**Changes:**
- Add kasir field mapping from Prisma query result
- Transform Date objects to ISO strings for JSON serialization
- Handle null kasir gracefully
- Remove dependency on Clerk API data

### 4. Frontend Type Interface (`features/kasir/types/index.ts`)

**Current KasirInfo Interface:**
```typescript
export interface KasirInfo {
  id: string
  nama: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string
}
```

**Status:** ✅ Already matches database structure - no changes needed

The frontend interface already expects the database structure, so no frontend type changes are required.

## Data Models

### Database Schema (Existing)

```prisma
model Kasir {
  id        String   @id @default(uuid())
  nama      String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?
  transaksi Transaksi[]

  @@index([nama])
  @@index([isActive])
  @@index([createdAt])
  @@map("kasir")
}

model Transaksi {
  id              String               @id @default(uuid())
  kode            String               @unique
  penyewaId       String
  kasirId         String?              // Foreign key to Kasir table
  // ... other fields
  kasir           Kasir?               @relation(fields: [kasirId], references: [id])
  // ... other relations
}
```

**Key Points:**
- `kasirId` is nullable - transactions can exist without assigned kasir
- Relation is already defined in schema
- No schema changes needed for this migration

### API Response Format

**Before Migration (Clerk-based):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "kode": "TXN-20251126-001",
    "kasir": {
      "id": "user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH",  // Clerk user ID
      "name": "owner+clerk_test@example.com",     // From Clerk
      "email": "owner+clerk_test@example.com",    // From Clerk
      "avatar": "https://img.clerk.com/..."       // From Clerk
    }
  }
}
```

**After Migration (Database-based):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "kode": "TXN-20251126-001",
    "kasir": {
      "id": "87b1808d-f6cc-4e55-8749-24903cccc3b4",  // Database UUID
      "nama": "John Doe",                             // From Kasir table
      "isActive": true,                               // From Kasir table
      "createdAt": "2025-01-15T10:30:00.000Z",       // From Kasir table
      "updatedAt": "2025-01-15T10:30:00.000Z"        // From Kasir table
    }
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Database-only kasir retrieval
*For any* transaction detail request, the system should fetch kasir information exclusively from the database Kasir table without making any Clerk API calls
**Validates: Requirements 1.1, 2.1**

### Property 2: Complete kasir data structure
*For any* transaction with an assigned kasir, the API response should include all required kasir fields (id, nama, isActive, createdAt, updatedAt) matching the KasirInfo interface
**Validates: Requirements 1.2, 3.1**

### Property 3: Graceful null handling
*For any* transaction without an assigned kasir or with invalid kasir reference, the system should return null for the kasir field without throwing errors
**Validates: Requirements 1.3, 4.1**

### Property 4: Error recovery with graceful degradation
*For any* database query failure when fetching kasir information, the system should log the error and return the transaction data with kasir set to null
**Validates: Requirements 1.4, 4.2**

### Property 5: Consistent response formatting
*For any* kasir data returned from the database, the formatTransactionResponse function should transform it to match the KasirInfo interface structure without additional API calls
**Validates: Requirements 1.5, 2.3, 5.3**

### Property 6: Prisma query includes kasir relation
*For any* transaction retrieval operation, the Prisma query should include the kasir relation using the include clause
**Validates: Requirements 2.2**

### Property 7: No Clerk API fallback on errors
*For any* database connection error or query failure, the system should return appropriate error responses without attempting to call Clerk API as a fallback
**Validates: Requirements 2.5**

### Property 8: Frontend compatibility without transformation
*For any* kasir data in the API response, the frontend KasirInfoCard component should be able to display it directly without requiring additional data transformation or mapping
**Validates: Requirements 3.2**

### Property 9: Comprehensive error logging
*For any* error encountered during kasir information retrieval, the system should log the transaction code, kasirId, and error details for debugging
**Validates: Requirements 4.5**

### Property 10: No Clerk dependencies in code
*For any* transaction-related API route, the code should not import or use clerkClient from @clerk/nextjs/server for kasir information retrieval
**Validates: Requirements 5.2**

### Property 11: Backward compatibility maintained
*For any* existing frontend component expecting KasirInfo structure, the refactored API response should maintain 100% compatibility with the expected interface
**Validates: Requirements 5.5**

## Error Handling

### Error Scenarios and Responses

1. **Missing Kasir Reference (kasirId is null)**
   - Behavior: Return transaction with `kasir: null`
   - HTTP Status: 200 OK
   - No error thrown
   - Example: Legacy transactions created before kasir assignment feature

2. **Invalid Kasir Reference (kasirId points to non-existent record)**
   - Behavior: Return transaction with `kasir: null`
   - HTTP Status: 200 OK
   - Log warning: `"Kasir with ID {kasirId} not found for transaction {transactionCode}"`
   - Graceful degradation - transaction data still returned

3. **Database Query Failure**
   - Behavior: Catch error, return transaction with `kasir: null`
   - HTTP Status: 200 OK (for transaction) or 503 (if entire query fails)
   - Log error with full context
   - No Clerk API fallback attempted

4. **Database Connection Timeout**
   - Behavior: Return error response
   - HTTP Status: 503 Service Unavailable
   - Error code: `CONNECTION_ERROR`
   - Message: "Database connection timeout. Please try again."

5. **Transaction Not Found**
   - Behavior: Return error response
   - HTTP Status: 404 Not Found
   - Error code: `NOT_FOUND`
   - Message: "Transaksi tidak ditemukan"

### Error Logging Strategy

```typescript
// Example error log format
{
  level: 'warn',
  message: 'Kasir information not found',
  context: {
    transactionCode: 'TXN-20251126-001',
    transactionId: 'uuid',
    kasirId: 'invalid-uuid',
    timestamp: '2025-01-15T10:30:00.000Z',
    source: 'TransaksiService.getTransaksiByCode'
  }
}
```

## Testing Strategy

### Unit Tests

**API Route Tests (`app/api/kasir/transaksi/[kode]/route.test.ts`):**
- Test GET request returns kasir data from database
- Test GET request with null kasirId returns null kasir
- Test GET request with invalid kasirId returns null kasir with warning
- Test enrichTransactionWithKasirInfo function is removed
- Test no Clerk API imports exist in the file

**Service Layer Tests (`features/kasir/services/transaksiService.test.ts`):**
- Test getTransaksiByCode includes kasir relation in Prisma query
- Test getTransaksiById includes kasir relation in Prisma query
- Test kasir data is properly included in response
- Test null kasir handling doesn't break transaction retrieval

**Response Formatter Tests (`features/kasir/lib/utils/responseFormatter.test.ts`):**
- Test formatTransactionResponse includes kasir data
- Test formatTransactionResponse handles null kasir
- Test kasir Date fields are converted to ISO strings
- Test response structure matches KasirInfo interface

**Frontend Component Tests (`features/kasir/components/detail/KasirInfoCard.test.tsx`):**
- Test component renders kasir data correctly
- Test component displays "Tidak Ada Data" when kasir is null
- Test component doesn't break with missing kasir fields

### Integration Tests

**End-to-End API Tests:**
- Test full transaction retrieval flow with kasir data
- Test transaction retrieval with null kasir
- Test transaction retrieval with invalid kasir reference
- Verify no Clerk API calls are made during transaction retrieval
- Measure response time improvement (should be ~200ms faster)

### Property-Based Tests

Property-based tests will be implemented using `fast-check` library for TypeScript. Each test will run a minimum of 100 iterations with randomly generated data.

**Test Configuration:**
```typescript
import fc from 'fast-check'

// Configure property tests to run 100 iterations
const propertyTestConfig = { numRuns: 100 }
```

## Performance Considerations

### Expected Improvements

1. **Latency Reduction:**
   - Before: ~200-500ms for Clerk API call
   - After: ~0ms (database join is part of main query)
   - Expected improvement: 200-500ms per request

2. **Reduced External Dependencies:**
   - Before: Depends on Clerk API availability
   - After: Only depends on database (already required)
   - Improved reliability and reduced failure points

3. **Simplified Error Handling:**
   - Before: Handle both database and Clerk API errors
   - After: Only handle database errors
   - Reduced complexity in error recovery logic

### Database Query Optimization

The kasir relation is included in the main Prisma query, so there's no additional database round-trip:

```typescript
// Single query with join - no performance penalty
const transaksi = await prisma.transaksi.findUnique({
  where: { kode },
  include: {
    penyewa: true,
    kasir: true,  // ✅ Joined in same query
    items: { /* ... */ },
    pembayaran: true,
    aktivitas: true
  }
})
```

## Migration Strategy

### Phase 1: Code Refactoring (This Spec)
1. Update TransaksiService to include kasir relation
2. Update formatTransactionResponse to use database kasir
3. Remove enrichTransactionWithKasirInfo function
4. Remove Clerk API imports from transaction routes
5. Update tests to verify database-only kasir retrieval

### Phase 2: Verification (Post-Deployment)
1. Monitor API response times (should improve by ~200ms)
2. Verify no Clerk API errors in logs
3. Check frontend displays kasir information correctly
4. Validate error handling for null/invalid kasir references

### Backward Compatibility

**No Breaking Changes:**
- Frontend KasirInfo interface already matches database structure
- API response format remains the same
- Null kasir handling already exists in frontend components
- Legacy transactions with null kasirId will continue to work

**Data Migration:**
- No database migration needed
- Existing kasirId foreign keys are already in place
- Transactions without kasirId will return null kasir (expected behavior)

## Security Considerations

### Reduced Attack Surface
- Removing Clerk API dependency reduces external attack vectors
- No sensitive Clerk API keys needed in transaction retrieval
- Kasir information is now controlled entirely by internal database

### Data Privacy
- Kasir information stored in database is under our control
- No external service has access to kasir data during transaction retrieval
- Audit logs for kasir access are internal only

### Access Control
- Existing authentication and authorization remain unchanged
- Kasir data access controlled by transaction permissions
- No new security vulnerabilities introduced

## Deployment Checklist

- [ ] Update TransaksiService.getTransaksiByIdentifier to include kasir relation
- [ ] Update formatTransactionResponse to map kasir data
- [ ] Remove enrichTransactionWithKasirInfo function from API route
- [ ] Remove clerkClient import from transaction API routes
- [ ] Update unit tests for service layer
- [ ] Update unit tests for API routes
- [ ] Update unit tests for response formatter
- [ ] Update integration tests
- [ ] Verify frontend KasirInfoCard displays database kasir correctly
- [ ] Test null kasir handling in frontend
- [ ] Monitor API response times post-deployment
- [ ] Verify no Clerk API errors in production logs
- [ ] Update API documentation with new kasir data structure
