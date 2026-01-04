# Design Document

## Overview

The Partial Return System enables customers to return rental items in multiple sessions over time, similar to the existing pickup system. This design leverages the existing UnifiedReturnService architecture and SimpleReturnForm component, extending them to support partial returns without requiring database schema changes or creating duplicate functionality.

## Architecture

The system follows the established rental management architecture pattern, reusing existing components and services:

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[SimpleReturnForm] --> B[Enhanced Quantity Logic]
        B --> C[Return Progress Display]
        C --> D[Partial Return Validation]
    end
    
    subgraph "API Layer"
        D --> E[Existing PUT /api/kasir/transaksi/[kode]/pengembalian]
        E --> F[Enhanced Request Validation]
        F --> G[Existing Schema Validation]
    end
    
    subgraph "Service Layer"
        G --> H[Enhanced UnifiedReturnService]
        H --> I[Partial Return Validation]
        I --> J[Session-based Penalty Calculation]
        J --> K[Enhanced Transaction Processing]
        K --> L[Return Progress Tracking]
    end
    
    subgraph "Database Layer"
        L --> M[Existing Atomic Transaction]
        M --> N[Enhanced Return Records Creation]
        M --> O[Existing Stock Updates]
        M --> P[Session-based Activity Logging]
    end
    
    subgraph "UI Enhancements"
        Q[ActionButtonPanel] --> R[Enhanced Return Button Logic]
        R --> S[Return Progress Indicators]
        S --> T[Session History Display]
    end
```

## Components and Interfaces

### Enhanced SimpleReturnForm Component

**Key Modifications:**
- Calculate remaining returnable quantity per item
- Initialize form with remaining quantities instead of total picked up quantities
- Validate user input against remaining quantities
- Display return progress information

**New Logic:**
```typescript
interface PartialReturnState {
  remainingQuantities: Record<string, number> // itemId -> remaining quantity
  returnProgress: Record<string, ReturnProgress> // itemId -> progress info
  sessionNumber: number // Current return session number
}

interface ReturnProgress {
  returned: number
  total: number
  percentage: number
  status: 'pending' | 'partial' | 'complete'
}
```

### Enhanced ActionButtonPanel Component

**Key Modifications:**
- Update return button visibility logic to check remaining quantities
- Add return progress indicators
- Display session history information

**Enhanced Logic:**
```typescript
const canReturn = (
  transaction.status === 'active' || 
  transaction.status === 'terlambat' || 
  transaction.status === 'diambil'
) && transaction.products?.some((p) => {
  const totalReturned = calculateTotalReturned(p.conditionBreakdown)
  const remainingToReturn = (p.jumlahDiambil || 0) - totalReturned
  return remainingToReturn > 0
})
```

### Enhanced UnifiedReturnService

**Key Enhancements:**
- Add partial return validation methods
- Implement session-based penalty calculation
- Enhanced activity logging with session information
- Return progress calculation utilities

**New Methods:**
```typescript
class EnhancedUnifiedReturnService {
  private calculateRemainingQuantities(transaction: TransactionDetail): Record<string, number>
  private validatePartialReturnQuantities(items: ReturnItem[], remainingQuantities: Record<string, number>): ValidationResult
  private calculateSessionNumber(transactionId: string): Promise<number>
  private generateSessionActivityDescription(items: ReturnItem[], sessionNumber: number): string
  private updateReturnProgress(transactionId: string): Promise<void>
}
```

## Data Models

### Existing Schema Utilization

The system uses existing database schema without modifications:

**TransaksiItem Table:**
- `jumlahDiambil`: Total quantity picked up by customer
- Existing return records in `TransaksiItemReturn` table

**TransaksiItemReturn Table:**
- `jumlahKembali`: Quantity returned in each session
- `kondisiAkhir`: Condition of returned items
- `penaltyAmount`: Penalty for this specific return record

**Calculated Fields:**
```typescript
interface CalculatedReturnData {
  totalReturned: number // Sum of all jumlahKembali for this item
  remainingToReturn: number // jumlahDiambil - totalReturned
  returnSessions: number // Count of return records for this item
  returnProgress: number // (totalReturned / jumlahDiambil) * 100
}
```

### Activity Logging Enhancement

**Enhanced Activity Data Structure:**
```typescript
interface PartialReturnActivityData {
  sessionNumber: number
  items: Array<{
    itemId: string
    productName: string
    returnedQuantity: number
    totalPickedUp: number
    remainingQuantity: number
    kondisiAkhir: string
    penaltyAmount: number
  }>
  sessionPenalty: number
  processedBy: string
  processedByName: string
  timestamp: string
  catatan?: string
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Partial Return Quantity Validation
*For any* return request and transaction state, the sum of requested return quantities should never exceed the remaining returnable quantities for each item
**Validates: Requirements 1.2, 3.3, 3.5**

### Property 2: Remaining Quantity Calculation Accuracy
*For any* transaction item with return history, the remaining quantity should always equal jumlahDiambil minus the sum of all existing return records
**Validates: Requirements 2.2, 8.5**

### Property 3: Session-based Penalty Calculation
*For any* return session, penalty calculations should only include items and quantities being returned in that specific session, not previous sessions
**Validates: Requirements 1.4, 7.1, 7.5**

### Property 4: Return Button Visibility Logic
*For any* transaction, the return button should be visible if and only if at least one item has remaining returnable quantity greater than zero and transaction status allows returns
**Validates: Requirements 2.1, 2.3, 2.4**

### Property 5: Return Progress Calculation
*For any* item with return history, the progress percentage should equal (totalReturned / jumlahDiambil) * 100 and status should reflect completion state
**Validates: Requirements 4.1, 4.5**

### Property 6: Activity Logging Format Consistency
*For any* return session, the activity log description should follow the format "Return Session X: Item A (returned/total), Item B (returned/total)" with all session items listed
**Validates: Requirements 5.2, 5.3**

### Property 7: Transaction Status Completion Logic
*For any* transaction, status should only change to 'selesai' when all items are fully returned AND no unresolved lost items exist
**Validates: Requirements 6.1, 6.3**

### Property 8: Late Penalty Calculation Accuracy
*For any* overdue return session, late penalties should be calculated as 20,000 IDR multiplied by the number of items being returned in the current session
**Validates: Requirements 7.2, 7.3**

### Property 9: Data Consistency During Partial Returns
*For any* partial return operation, the system should maintain referential integrity and prevent over-return scenarios through proper validation
**Validates: Requirements 8.2, 8.4**

### Property 10: Return Form Initialization Accuracy
*For any* transaction with partial return history, the return form should initialize with only items having remaining quantity > 0 and default quantities set to remaining amounts
**Validates: Requirements 3.1, 3.2**

## Error Handling

### Validation Errors
- **Over-return Prevention**: Validate quantities against current remaining amounts
- **Concurrent Operation Handling**: Use database transactions to prevent race conditions
- **Data Integrity Checks**: Verify transaction state before processing returns

### User Experience Errors
- **Clear Error Messages**: Provide specific feedback for quantity validation failures
- **Real-time Validation**: Show immediate feedback for invalid quantity inputs
- **Graceful Degradation**: Handle partial failures without corrupting existing data

### System Errors
- **Transaction Rollback**: Ensure atomic operations for partial return processing
- **Activity Logging Failures**: Continue operation even if activity logging fails
- **Performance Monitoring**: Track processing times for partial return operations

## Testing Strategy

### Dual Testing Approach
The system requires both unit testing and property-based testing for comprehensive coverage:

**Unit Tests:**
- Specific examples of partial return scenarios
- Edge cases like zero quantities and boundary conditions
- Integration points between enhanced and existing components
- Error conditions and rollback scenarios

**Property-Based Tests:**
- Universal properties across all partial return scenarios
- Comprehensive input coverage through randomization
- Validation of mathematical calculations and business rules
- Concurrency and data consistency verification

**Property Test Configuration:**
- Minimum 100 iterations per property test
- Each property test references its design document property
- Tag format: **Feature: partial-return-system, Property {number}: {property_text}**

### Testing Focus Areas

**Quantity Management Testing:**
- Validate remaining quantity calculations
- Test over-return prevention
- Verify quantity aggregation accuracy

**Session Management Testing:**
- Test session numbering logic
- Validate activity logging format
- Verify penalty calculation per session

**UI Integration Testing:**
- Test return button visibility logic
- Validate form initialization with partial data
- Verify progress indicator accuracy

**Data Consistency Testing:**
- Test concurrent partial return operations
- Validate transaction rollback scenarios
- Verify referential integrity maintenance

---

*This design document provides a comprehensive blueprint for implementing partial return functionality while maintaining system simplicity and avoiding code duplication.*