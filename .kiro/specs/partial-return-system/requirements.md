# Requirements Document

## Introduction

This document specifies the requirements for implementing a Partial Return System that allows customers to return rental items in multiple sessions over time, similar to the existing pickup system. The system enables flexible return workflows where customers can return items gradually rather than all at once.

## Glossary

- **Partial_Return**: The ability to return rental items in multiple sessions rather than all at once
- **Return_Session**: A single return transaction where customer returns some (not all) items
- **Remaining_Quantity**: The number of items still available to be returned (jumlahDiambil - totalReturned)
- **Return_Progress**: Visual indicator showing how many items have been returned vs total picked up
- **UnifiedReturnService**: Existing service that processes return operations
- **SimpleReturnForm**: Existing form component for processing returns
- **ActionButtonPanel**: Component that shows available transaction actions

## Requirements

### Requirement 1: Partial Return Processing

**User Story:** As a kasir, I want to process partial returns for customers, so that customers can return items flexibly over multiple visits.

#### Acceptance Criteria

1. WHEN a customer has picked up items but not returned all of them, THE System SHALL allow processing returns for any quantity up to the remaining amount
2. WHEN processing a partial return, THE System SHALL validate that return quantity does not exceed remaining returnable quantity
3. WHEN a partial return is processed, THE System SHALL update the item's return records while preserving existing return history
4. WHEN calculating penalties for partial returns, THE System SHALL apply penalties only to items being returned in the current session
5. WHEN a partial return creates penalty charges, THE System SHALL calculate late penalties based on current return date regardless of previous return sessions

### Requirement 2: Return Availability Detection

**User Story:** As a kasir, I want to see which transactions have items available for return, so that I can offer return services to appropriate customers.

#### Acceptance Criteria

1. WHEN viewing a transaction detail, THE System SHALL show return button only if items have remaining returnable quantity
2. WHEN calculating returnable quantity, THE System SHALL use formula: jumlahDiambil - totalAlreadyReturned
3. WHEN all items are fully returned, THE System SHALL hide the return button
4. WHEN transaction status is 'cancelled', THE System SHALL not show return button regardless of return status
5. WHEN items have unresolved lost item conditions, THE System SHALL still allow returns for non-lost quantities

### Requirement 3: Return Form Quantity Management

**User Story:** As a kasir, I want the return form to show only returnable quantities, so that I cannot accidentally process invalid return amounts.

#### Acceptance Criteria

1. WHEN opening the return form, THE System SHALL display only items with remaining returnable quantity greater than zero
2. WHEN initializing return conditions, THE System SHALL set default return quantity to remaining returnable quantity
3. WHEN user modifies return quantity, THE System SHALL validate it does not exceed remaining returnable quantity
4. WHEN calculating penalty preview, THE System SHALL use only the quantities being returned in current session
5. WHEN user submits return form, THE System SHALL validate all quantities are within acceptable limits

### Requirement 4: Return Progress Tracking

**User Story:** As a kasir, I want to see return progress for each item, so that I can track which items are fully returned and which still need attention.

#### Acceptance Criteria

1. WHEN viewing transaction details, THE System SHALL display return progress for each item in format "returned/total"
2. WHEN an item is fully returned, THE System SHALL mark it as complete in the progress display
3. WHEN an item is partially returned, THE System SHALL show partial progress indicator
4. WHEN no items have been returned, THE System SHALL show pending status for all items
5. WHEN calculating progress percentage, THE System SHALL use formula: (totalReturned / jumlahDiambil) * 100

### Requirement 5: Return Session Activity Logging

**User Story:** As a kasir, I want detailed activity logs for return sessions, so that I can track the history of partial returns for audit purposes.

#### Acceptance Criteria

1. WHEN processing a return session, THE System SHALL create activity log with session-specific details
2. WHEN logging return activities, THE System SHALL use format "Return Session X: Item A (returned/total), Item B (returned/total)"
3. WHEN multiple items are returned in one session, THE System SHALL list all items with their quantities in the activity description
4. WHEN return session includes notes, THE System SHALL append notes to the activity description
5. WHEN return session is completed, THE System SHALL store session data including kasir information and timestamp

### Requirement 6: Transaction Status Management

**User Story:** As a system administrator, I want transaction status to reflect return completion accurately, so that business processes can rely on status information.

#### Acceptance Criteria

1. WHEN all items are fully returned AND no unresolved lost items exist, THE System SHALL update transaction status to 'selesai'
2. WHEN some items are returned but others remain unreturned, THE System SHALL maintain current transaction status
3. WHEN lost items exist and require resolution, THE System SHALL not mark transaction as 'selesai' until lost items are resolved
4. WHEN partial returns are processed, THE System SHALL not create intermediate status changes
5. WHEN return processing fails, THE System SHALL maintain original transaction status

### Requirement 7: Penalty Calculation for Partial Returns

**User Story:** As a kasir, I want penalty calculations to be accurate for partial returns, so that customers are charged fairly for only the items being returned.

#### Acceptance Criteria

1. WHEN calculating condition penalties, THE System SHALL apply penalties only to quantities being returned in current session
2. WHEN calculating late penalties, THE System SHALL apply flat 20,000 IDR per item being returned if transaction is overdue
3. WHEN return session occurs after due date, THE System SHALL calculate late penalty based on current return date
4. WHEN items have different conditions in same session, THE System SHALL calculate penalties separately for each condition
5. WHEN generating penalty preview, THE System SHALL show real-time calculation based on current session quantities only

### Requirement 8: Data Consistency and Validation

**User Story:** As a system administrator, I want partial return data to be consistent and validated, so that the system maintains data integrity across multiple return sessions.

#### Acceptance Criteria

1. WHEN processing partial returns, THE System SHALL use existing database schema without requiring new fields
2. WHEN validating return requests, THE System SHALL check against current database state to prevent over-returns
3. WHEN concurrent return operations occur, THE System SHALL prevent data conflicts through proper transaction handling
4. WHEN return records are created, THE System SHALL maintain referential integrity with existing transaction data
5. WHEN calculating totals, THE System SHALL aggregate return records accurately to determine remaining quantities

## Critical Business Rules

### 1. Quantity Management Rules
- **Returnable Quantity**: jumlahDiambil - sum(existing return records)
- **Maximum Return**: Cannot exceed remaining returnable quantity per item
- **Minimum Return**: No minimum quantity required per session
- **Zero Quantity**: Items with zero remaining quantity should not appear in return form

### 2. Penalty Calculation Rules
- **Session-based**: Penalties calculated only for current session items
- **Late Penalty**: 20,000 IDR per item if return date > due date
- **Condition Penalty**: manualPrice × quantity for non-BAIK conditions
- **No Accumulation**: Previous session penalties do not affect current session

### 3. Status Transition Rules
- **Partial Completion**: Status unchanged until all items returned
- **Full Completion**: Status → 'selesai' when all items returned AND lost items resolved
- **Lost Item Dependency**: Cannot mark 'selesai' with unresolved lost items
- **Existing Status**: Use current transaction status logic without new intermediate states

### 4. Activity Logging Rules
- **Session Format**: "Return Session X: Item A (2/5), Item B (1/3)"
- **Detailed Tracking**: Include kasir info, timestamp, and item details
- **Notes Integration**: Append user notes to activity description
- **Audit Trail**: Maintain complete history of all return sessions

---

*This document provides comprehensive requirements for implementing a simple yet effective partial return system that integrates seamlessly with existing rental management workflows.*