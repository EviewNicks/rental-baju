# Design Document

## Overview

This design document outlines the technical approach for integrating transaction activity timeline and ProductSize information into the existing product history feature. The integration will enhance `ProductHistoryService` to query and transform activity data from `AktivitasTransaksi` table, parse size information from `kondisiAwal` field, and update `ProductHistoryCard` component to display this enriched data.

**Key Design Goals:**
1. Extend existing `ProductHistoryService` without breaking current functionality
2. Efficiently join `AktivitasTransaksi` data with existing queries
3. Parse and expose ProductSize information (size, ageCategory) from `kondisiAwal`
4. Maintain role-based data masking for activities
5. Update frontend component to display activity timeline and size info

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ProductHistoryCard Component                          │ │
│  │  - Display activity timeline                           │ │
│  │  - Show size information                               │ │
│  │  - Render activity metadata                            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP GET /api/products/[id]/history
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  GET /api/products/[id]/history                        │ │
│  │  - Authentication & role detection                     │ │
│  │  - Query parameter validation                          │ │
│  │  - Response formatting                                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ProductHistoryService (ENHANCED)                      │ │
│  │  - executeHistoryQuery() - Add activities join        │ │
│  │  - transformHistoryResults() - Add activity transform │ │
│  │  - parseSizeInformation() - NEW method                │ │
│  │  - maskActivityMetadata() - NEW method                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database Layer                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Prisma Query                                          │ │
│  │  - TransaksiItem (existing)                           │ │
│  │  - Transaksi (existing)                               │ │
│  │  - AktivitasTransaksi (NEW join)                      │ │
│  │  - Penyewa (existing)                                 │ │
│  │  - ReturnConditions (existing)                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Request Flow:**
   - User views ProductHistoryCard → API call with productId, pagination, role
   - API validates auth & extracts user role from Clerk session
   - ProductHistoryService queries database with activity join
   - Service parses size info and transforms activities based on role
   - API returns enriched history data to frontend

2. **Activity Integration Flow:**
   - Query joins `AktivitasTransaksi` on `transaksiId`
   - Activities ordered by `createdAt` DESC
   - Activity metadata filtered based on user role
   - Most relevant activity selected for timeline display

3. **Size Parsing Flow:**
   - Extract `kondisiAwal` from `TransaksiItem`
   - Parse format: `"productSizeId|size|ageCategory|condition"`
   - Handle parsing errors gracefully
   - Return structured size object

## Components and Interfaces

### Backend Types (Enhanced)

```typescript
// features/manage-product/types/productHistory.ts

// EXISTING - No changes
export interface ProductHistoryItem {
  id: string
  transactionCode: string
  transactionDate: Date
  rentalStart: Date
  rentalEnd: Date | null
  customerName: string
  customerContact: string
  baseRevenue: number
  penaltyAmount: number
  totalRevenue: number
  status: string
  itemQuantity: number
  duration: number
  // NEW FIELDS - Added for activity and size
  activities?: ActivityInfo[]
  sizeInfo?: SizeInfo | null
}

// NEW - Activity information
export interface ActivityInfo {
  id: string
  type: string // 'dibuat', 'dibatalkan', 'dikembalikan', etc.
  typeLabel: string // Human-readable Indonesian label
  description: string
  createdAt: Date
  createdBy: string
  metadata?: ActivityMetadata
}

// NEW - Activity metadata (role-filtered)
export interface ActivityMetadata {
  itemsCount?: number
  totalAmount?: string
  kasirId?: string
  kasirName?: string
  previousStatus?: string
  newStatus?: string
  reason?: string
  stockRestored?: boolean
  needsRefund?: boolean
  // Performance metrics (owner only)
  transactionDuration?: number
  optimizedSystem?: boolean
}

// NEW - Size information parsed from kondisiAwal
export interface SizeInfo {
  productSizeId: string
  size: string // 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'UNIVERSAL'
  ageCategory: string // 'ADULT', 'CHILD', 'UNIVERSAL'
  condition?: string // Optional condition notes
  displayText: string // "Size: M (ADULT)"
}

// EXISTING - Enhanced with activities
export interface ProductHistoryRawResult {
  id: string
  transactionCode: string
  transactionDate: Date
  rentalStart: Date
  rentalEnd: Date | null
  customerName: string
  customerContact: string
  subtotal: number
  duration: number
  status: string
  itemQuantity: number
  penalties: PenaltyDetail[]
  kondisiAwal?: string | null // NEW - For size parsing
  activities?: RawActivityData[] // NEW - Raw activity data
}

// NEW - Raw activity data from database
export interface RawActivityData {
  id: string
  tipe: string
  deskripsi: string
  data: Record<string, unknown> | null
  createdBy: string
  createdAt: Date
}
```

### Frontend Types (Enhanced)

```typescript
// features/manage-product/components/product-detail/types.ts

// NEW - Timeline item props with activity and size
export interface TimelineItemProps {
  item: ProductHistoryItem // Already includes activities and sizeInfo
  isLast: boolean
  'data-testid'?: string
}

// NEW - Activity display component props
export interface ActivityBadgeProps {
  activity: ActivityInfo
  compact?: boolean
}

// NEW - Size display component props
export interface SizeDisplayProps {
  sizeInfo: SizeInfo
  compact?: boolean
}
```

## Data Models

### Database Schema (No Changes Required)

The existing schema already contains all necessary data:

```prisma
model TransaksiItem {
  id                     String                @id @default(uuid())
  transaksiId            String
  produkId               String
  jumlah                 Int                   @default(1)
  kondisiAwal            String?               // Contains: "productSizeId|size|ageCategory|condition"
  // ... other fields
  transaksi              Transaksi             @relation(...)
}

model AktivitasTransaksi {
  id          String    @id @default(uuid())
  transaksiId String
  tipe        String    // 'dibuat', 'dibatalkan', 'dikembalikan', etc.
  deskripsi   String
  data        Json?     // Activity metadata
  createdBy   String
  createdAt   DateTime  @default(now())
  transaksi   Transaksi @relation(...)
  
  @@index([transaksiId])
  @@index([tipe])
  @@index([createdAt])
}
```

### Size Information Format

The `kondisiAwal` field stores size information in pipe-separated format:

```
Format: "productSizeId|size|ageCategory|condition"
Example: "clx123abc|M|ADULT|Baik"
```

**Parsing Logic:**
```typescript
function parseSizeInfo(kondisiAwal: string | null): SizeInfo | null {
  if (!kondisiAwal) return null
  
  const parts = kondisiAwal.split('|')
  if (parts.length < 3) return null
  
  const [productSizeId, size, ageCategory, condition] = parts
  
  return {
    productSizeId,
    size,
    ageCategory,
    condition: condition || undefined,
    displayText: `Size: ${size} (${ageCategory})`
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Role-based activity display completeness
*For any* product history query by a producer role, all activity types (dibuat, diambil, dikembalikan, dibatalkan, terlambat) should be included in the response when they exist for that product
**Validates: Requirements 1.1**

### Property 2: Producer role customer data masking
*For any* product history query by a producer role, customer names and contact information in activities should be masked according to masking rules (name: "John D.", contact: "081****567")
**Validates: Requirements 1.2**

### Property 3: Activity structure completeness
*For any* returned activity, it should contain all required fields: type, description, timestamp (createdAt), and createdBy
**Validates: Requirements 1.3**

### Property 4: Activity chronological ordering
*For any* transaction with multiple activities, the activities should be ordered by createdAt in descending order (newest first)
**Validates: Requirements 1.4**

### Property 5: Producer role metadata filtering
*For any* activity metadata viewed by producer role, customer-identifiable fields (full names, full contact, NIK) should be filtered out
**Validates: Requirements 1.5**

### Property 6: Kasir role customer data masking
*For any* product history query by kasir role, customer data should be masked using the same masking rules as producer role
**Validates: Requirements 2.1**

### Property 7: Kasir assignment visibility
*For any* transaction with kasirId assigned, the activity data should include kasir information (id, nama, isActive)
**Validates: Requirements 2.2**

### Property 8: Pickup and return quantity inclusion
*For any* pickup or return activity, the activity metadata should include quantity details (jumlahDiambil, jumlahKembali)
**Validates: Requirements 2.3**

### Property 9: Payment activity data structure
*For any* payment-related activity, it should include payment method and amount but exclude sensitive customer details
**Validates: Requirements 2.4**

### Property 10: Cancellation activity metadata
*For any* cancelled transaction, the cancellation activity should include reason and stockRestored status in metadata
**Validates: Requirements 2.5**

### Property 11: Owner role unmasked data
*For any* product history query by owner role, customer names and contact information should be displayed without masking
**Validates: Requirements 3.1**

### Property 12: Owner role complete metadata
*For any* activity viewed by owner role, all metadata fields including performance metrics should be included
**Validates: Requirements 3.2**

### Property 13: Kasir assignment in activities
*For any* transaction with kasir assignment, owner role should see kasir information in activity data
**Validates: Requirements 3.3**

### Property 14: Penalty activity details
*For any* activity involving penalties, owner role should see detailed penalty calculations and conditions
**Validates: Requirements 3.4**

### Property 15: Status transition completeness
*For any* transaction with multiple status changes, all status change activities should be included with transition reasons
**Validates: Requirements 3.5**

### Property 16: Backward compatibility field preservation
*For any* API response, all existing fields (id, transactionCode, transactionDate, customerName, etc.) should be present
**Validates: Requirements 5.1**

### Property 17: Optional new fields
*For any* API response with new fields (activities, sizeInfo), these fields should be optional and not break existing clients
**Validates: Requirements 5.2**

### Property 18: Graceful degradation without activities
*For any* transaction without activities, the response should still include basic transaction information
**Validates: Requirements 5.3**

### Property 19: Activity type label mapping
*For any* activity type (dibuat, dibatalkan, dikembalikan, terlambat, diperbarui), there should be a corresponding Indonesian label
**Validates: Requirements 5.4**

### Property 20: Synthetic activity generation
*For any* legacy transaction without activities, a synthetic "dibuat" activity should be generated from transaction data
**Validates: Requirements 5.5**

### Property 21: Transaction creation activity logging
*For any* newly created transaction, an activity should be logged with transaction code, items count, total amount, and kasir assignment
**Validates: Requirements 6.1**

### Property 22: Status change activity logging
*For any* transaction status update, an activity should be logged with previousStatus, newStatus, and change reason
**Validates: Requirements 6.2**

### Property 23: Cancellation activity logging
*For any* cancelled transaction, an activity should be logged with cancellation reason, refund status, and stock restoration details
**Validates: Requirements 6.3**

### Property 24: Pickup activity logging
*For any* item pickup operation, an activity should be logged with pickup quantities and product size information
**Validates: Requirements 6.4**

### Property 25: Return activity logging
*For any* item return operation, an activity should be logged with return conditions, penalties, and stock updates
**Validates: Requirements 6.5**

### Property 26: Size information parsing
*For any* kondisiAwal field with valid format "productSizeId|size|ageCategory|condition", the parser should extract all four components correctly
**Validates: Requirements 7.1, 7.2**

### Property 27: Size display text formatting
*For any* valid size information, the displayText should be formatted as "Size: {size} ({ageCategory})"
**Validates: Requirements 7.3**

### Property 28: Per-item size information
*For any* transaction with multiple items, each item should have its own independent size information
**Validates: Requirements 7.5**

### Property 29: Activity type Indonesian labels
*For any* activity in the response, it should include a typeLabel field with Indonesian translation
**Validates: Requirements 8.1**

### Property 30: ISO 8601 timestamp format
*For any* timestamp field (createdAt, transactionDate, etc.), it should be formatted as ISO 8601 string
**Validates: Requirements 8.2**

### Property 31: Size data structure
*For any* size information in response, size and ageCategory should be separate string fields
**Validates: Requirements 8.3**

### Property 32: Monetary value number format
*For any* monetary value (baseRevenue, penaltyAmount, totalRevenue), it should be a plain number type, not Decimal
**Validates: Requirements 8.4**

### Property 33: Pre-formatted activity descriptions
*For any* activity description, it should be a ready-to-display string without requiring client-side formatting
**Validates: Requirements 8.5**

## Error Handling

### Size Parsing Errors

**Scenario:** Invalid kondisiAwal format
```typescript
// Input: "invalid-format" or "only-two|parts"
// Expected: Return null, log warning, continue processing
// UI: Hide size display gracefully

function parseSizeInfo(kondisiAwal: string | null): SizeInfo | null {
  try {
    if (!kondisiAwal) return null
    
    const parts = kondisiAwal.split('|')
    if (parts.length < 3) {
      console.warn(`Invalid kondisiAwal format: ${kondisiAwal}`)
      return null
    }
    
    // Parse and validate
    const [productSizeId, size, ageCategory, condition] = parts
    
    if (!productSizeId || !size || !ageCategory) {
      console.warn(`Missing required size fields: ${kondisiAwal}`)
      return null
    }
    
    return {
      productSizeId,
      size,
      ageCategory,
      condition: condition || undefined,
      displayText: `Size: ${size} (${ageCategory})`
    }
  } catch (error) {
    console.error('Size parsing error:', error)
    return null
  }
}
```

### Activity Data Errors

**Scenario:** Missing or malformed activity metadata
```typescript
// Input: Activity with null or invalid JSON in data field
// Expected: Return activity with empty metadata, log warning
// UI: Display activity without metadata details

function parseActivityMetadata(
  data: Record<string, unknown> | null,
  userRole: UserRole
): ActivityMetadata {
  try {
    if (!data) return {}
    
    // Filter based on role
    const filtered = filterMetadataByRole(data, userRole)
    
    return filtered
  } catch (error) {
    console.error('Activity metadata parsing error:', error)
    return {}
  }
}
```

### Database Query Errors

**Scenario:** Activity join fails or times out
```typescript
// Expected: Gracefully degrade to basic transaction data
// Log error for monitoring
// Return partial data with success: true

async function executeHistoryQuery(query: ProductHistoryQuery) {
  try {
    // Attempt full query with activities
    const results = await prisma.transaksiItem.findMany({
      include: {
        transaksi: {
          include: {
            aktivitas: true // May fail
          }
        }
      }
    })
    
    return results
  } catch (error) {
    console.error('Activity query failed, falling back to basic data:', error)
    
    // Fallback: Query without activities
    const basicResults = await prisma.transaksiItem.findMany({
      include: {
        transaksi: true // No activities
      }
    })
    
    return basicResults
  }
}
```

### Role Permission Errors

**Scenario:** Invalid or missing role in session
```typescript
// Expected: Default to most restrictive role (producer)
// Log warning for security monitoring

function determineUserRole(sessionClaims: Record<string, unknown> | null): UserRole {
  if (!sessionClaims) {
    console.warn('Missing session claims, defaulting to producer role')
    return 'producer'
  }
  
  const role = extractRole(sessionClaims)
  
  if (!isValidRole(role)) {
    console.warn(`Invalid role: ${role}, defaulting to producer`)
    return 'producer'
  }
  
  return role
}
```

## Testing Strategy

### Unit Testing

**ProductHistoryService Tests:**
```typescript
describe('ProductHistoryService', () => {
  describe('parseSizeInfo', () => {
    it('should parse valid kondisiAwal format', () => {
      const result = service.parseSizeInfo('clx123|M|ADULT|Baik')
      expect(result).toEqual({
        productSizeId: 'clx123',
        size: 'M',
        ageCategory: 'ADULT',
        condition: 'Baik',
        displayText: 'Size: M (ADULT)'
      })
    })
    
    it('should return null for invalid format', () => {
      expect(service.parseSizeInfo('invalid')).toBeNull()
      expect(service.parseSizeInfo('only|two')).toBeNull()
      expect(service.parseSizeInfo(null)).toBeNull()
    })
  })
  
  describe('transformActivityData', () => {
    it('should mask customer data for producer role', () => {
      const activity = createMockActivity({ customerName: 'John Doe' })
      const result = service.transformActivityData(activity, 'producer')
      expect(result.metadata.customerName).toBe('John D.')
    })
    
    it('should include all metadata for owner role', () => {
      const activity = createMockActivity({ performanceMetrics: true })
      const result = service.transformActivityData(activity, 'owner')
      expect(result.metadata.transactionDuration).toBeDefined()
    })
  })
  
  describe('executeHistoryQuery', () => {
    it('should join activities with transactions', async () => {
      const result = await service.executeHistoryQuery(mockQuery)
      expect(result[0].activities).toBeDefined()
      expect(result[0].activities.length).toBeGreaterThan(0)
    })
    
    it('should handle missing activities gracefully', async () => {
      const result = await service.executeHistoryQuery(mockQueryNoActivities)
      expect(result[0].activities).toEqual([])
    })
  })
})
```

### Property-Based Testing

We will use **fast-check** library for property-based testing in TypeScript.

**Configuration:**
- Minimum 100 iterations per property test
- Use shrinking to find minimal failing examples
- Tag each test with property number from design doc



**Property Test Examples:**

```typescript
import * as fc from 'fast-check'

/**
 * Feature: product-transaction-history-integration, Property 2: Producer role customer data masking
 * Validates: Requirements 1.2
 */
describe('Property 2: Producer role customer data masking', () => {
  it('should mask customer names and contacts for producer role', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 5, maxLength: 50 }),
          contact: fc.string({ minLength: 10, maxLength: 15 })
        }),
        (customerData) => {
          const masked = service.maskCustomerData(customerData, 'producer')
          
          // Name should be masked (first name + last initial)
          expect(masked.name).not.toBe(customerData.name)
          expect(masked.name).toMatch(/^.+ .$/)
          
          // Contact should be masked (first 3 + **** + last 3)
          expect(masked.contact).not.toBe(customerData.contact)
          expect(masked.contact).toMatch(/^\d{3}\*{4}\d{3}$/)
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Feature: product-transaction-history-integration, Property 26: Size information parsing
 * Validates: Requirements 7.1, 7.2
 */
describe('Property 26: Size information parsing', () => {
  it('should correctly parse valid kondisiAwal format', () => {
    fc.assert(
      fc.property(
        fc.record({
          productSizeId: fc.uuid(),
          size: fc.constantFrom('XS', 'S', 'M', 'L', 'XL', 'XXL', 'UNIVERSAL'),
          ageCategory: fc.constantFrom('ADULT', 'CHILD', 'UNIVERSAL'),
          condition: fc.option(fc.string({ maxLength: 50 }))
        }),
        (sizeData) => {
          const kondisiAwal = [
            sizeData.productSizeId,
            sizeData.size,
            sizeData.ageCategory,
            sizeData.condition || ''
          ].join('|')
          
