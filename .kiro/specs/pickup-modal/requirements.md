# Requirements Document

## Introduction

This specification addresses performance and user experience issues in the pickup modal workflow for the rental management system. The current implementation suffers from race conditions causing slow modal closure (3-5 seconds), unclear activity logs that don't show product details or user names, and unnecessary cache invalidations. This enhancement will optimize the pickup flow to provide immediate feedback, clear activity tracking with product and size information, and proper user attribution.

## Glossary

- **Pickup Modal**: The dialog interface where kasir staff process item pickups for rental transactions
- **Activity Timeline**: The chronological log of transaction events displayed to users
- **Race Condition**: A software bug where multiple asynchronous operations interfere with each other causing unpredictable timing
- **Cache Synchronization**: The process of updating React Query cache after data mutations
- **Optimistic Update**: Immediately updating the UI before server confirmation for better perceived performance
- **TransaksiItem**: Database entity representing individual product items in a transaction
- **kondisiAwal**: Field storing size and condition information in format "sizeId|size|ageCategory|condition"
- **Kasir**: Cashier/staff user who processes transactions

## Requirements

### Requirement 1: Modal Performance Optimization

**User Story:** As a kasir, I want the pickup modal to close quickly after successful pickup, so that I can process multiple transactions efficiently without waiting.

#### Acceptance Criteria

1. WHEN a pickup operation completes successfully, THE Pickup Modal SHALL close within 2 seconds
2. WHEN the modal is closing, THE System SHALL NOT trigger unnecessary cache resets that cause additional network requests
3. WHEN multiple useEffect hooks monitor the same state, THE System SHALL prevent race conditions between timeout handlers
4. WHEN the success state is reached, THE System SHALL display success feedback for exactly 1.5 seconds before closing
5. WHEN the user clicks close during cache sync, THE System SHALL prevent premature closure until sync completes

### Requirement 2: Activity Log Enhancement

**User Story:** As a kasir, I want to see detailed pickup information in the activity timeline including product names and sizes, so that I can verify what was picked up at a glance.

#### Acceptance Criteria

1. WHEN a pickup activity is logged, THE System SHALL include the product name for each item
2. WHEN a pickup activity is logged, THE System SHALL parse and display size information from kondisiAwal field
3. WHEN a pickup activity is logged, THE System SHALL display age category (ADULT/CHILD) from kondisiAwal field
4. WHEN displaying pickup activities, THE System SHALL show quantity picked up for each product
5. WHEN multiple items are picked up, THE System SHALL list each item separately with its details

### Requirement 3: User Attribution

**User Story:** As a manager, I want to see which kasir performed each pickup action, so that I can track staff activity and accountability.

#### Acceptance Criteria

1. WHEN a pickup is processed, THE System SHALL store the kasir name in activity data
2. WHEN displaying pickup activities, THE System SHALL show the kasir name instead of user ID
3. WHEN kasir information is unavailable, THE System SHALL fall back to displaying the user ID
4. WHEN storing activity logs, THE System SHALL include both processedBy (user ID) and processedByName (kasir name)
5. WHEN fetching transaction data, THE System SHALL join kasir table to retrieve nama field

### Requirement 4: Activity Description Clarity

**User Story:** As a user viewing transaction history, I want clear and descriptive activity messages, so that I can understand what happened without technical knowledge.

#### Acceptance Criteria

1. WHEN generating pickup descriptions, THE System SHALL include product names instead of generic "item" labels
2. WHEN generating pickup descriptions, THE System SHALL format as "Pickup: [Product Name] ([quantity] unit)"
3. WHEN multiple products are picked up, THE System SHALL join descriptions with commas
4. WHEN a pickup note is provided, THE System SHALL append it to the description with a dash separator
5. WHEN displaying activities, THE System SHALL use human-readable language without technical jargon

### Requirement 5: Unnecessary Activity Log Removal

**User Story:** As a user viewing transaction history, I want to see only meaningful activities, so that the timeline is not cluttered with redundant information.

#### Acceptance Criteria

1. WHEN all items are fully picked up, THE System SHALL NOT create a separate "status_pickup" activity log
2. WHEN transaction status changes to "diambil", THE System SHALL NOT create a separate "status_changed" activity log
3. WHEN pickup is processed, THE System SHALL create only one primary activity log of type "diambil"
4. WHEN status updates occur, THE System SHALL update the transaction status field without additional logging
5. WHEN calculating pickup statistics, THE System SHALL perform calculations without creating monitoring logs

### Requirement 6: Cache Management Optimization

**User Story:** As a developer, I want efficient cache management that avoids unnecessary refetches, so that the application performs optimally.

#### Acceptance Criteria

1. WHEN the modal closes, THE System SHALL NOT call reset() on the mutation hook
2. WHEN cache invalidation occurs, THE System SHALL invalidate only the specific transaction detail query
3. WHEN the modal is cancelled, THE System SHALL preserve the current cache state
4. WHEN optimistic updates are applied, THE System SHALL rollback on error
5. WHEN cache sync completes, THE System SHALL verify the query state before proceeding

### Requirement 7: Error Handling and Recovery

**User Story:** As a kasir, I want clear error messages and recovery options when pickup fails, so that I can resolve issues quickly.

#### Acceptance Criteria

1. WHEN a pickup operation fails, THE System SHALL display specific error messages based on error type
2. WHEN a database connection error occurs, THE System SHALL suggest retrying after a moment
3. WHEN a data conflict is detected, THE System SHALL suggest refreshing the page
4. WHEN an error occurs, THE System SHALL provide actionable recovery buttons
5. WHEN rolling back from errors, THE System SHALL restore the previous cache state

### Requirement 8: Optimistic UI Updates (Optional Enhancement)

**User Story:** As a kasir, I want to see immediate feedback when I process a pickup, so that the interface feels responsive.

#### Acceptance Criteria

1. WHEN a pickup is submitted, THE System SHALL immediately update the UI with expected changes
2. WHEN optimistic updates are applied, THE System SHALL update jumlahDiambil values in the cache
3. WHEN the server confirms the pickup, THE System SHALL replace optimistic data with server data
4. WHEN an error occurs, THE System SHALL revert optimistic updates and show the error
5. WHEN multiple items are picked up, THE System SHALL update all affected items optimistically

### Requirement 9: Partial Pickup Support (CRITICAL BUG FIX)

**User Story:** As a customer, I want to pick up rental items in multiple visits (partial pickup), so that I can collect items gradually based on my schedule and availability.

#### Acceptance Criteria

1. WHEN a customer picks up only some items from a transaction, THE System SHALL keep the pickup button available for remaining items
2. WHEN calculating transaction status, THE System SHALL set status to "diambil" ONLY when ALL items are fully picked up
3. WHEN some items are fully picked up but others are not, THE System SHALL maintain transaction status as "active" or "terlambat"
4. WHEN displaying pickup button, THE System SHALL show it for transactions with status "active", "terlambat", OR "diambil" that have remaining items
5. WHEN a partial pickup occurs, THE System SHALL correctly calculate remaining quantities for each product

### Requirement 10: Status Transition Logic Correction

**User Story:** As a system administrator, I want accurate transaction status transitions, so that the system correctly reflects the pickup state of each transaction.

#### Acceptance Criteria

1. WHEN checking if all items are picked up, THE System SHALL verify that EVERY product has jumlahDiambil equal to jumlah
2. WHEN any product has jumlahDiambil less than jumlah, THE System SHALL NOT change status to "diambil"
3. WHEN status is "diambil" but items remain, THE System SHALL allow additional pickup operations
4. WHEN calculating pickup completion, THE System SHALL use total quantity across all products, not count of products
5. WHEN a pickup operation completes, THE System SHALL recalculate status based on current pickup state

### Requirement 12: Status Consistency (CRITICAL BUG FIX)

**User Story:** As a kasir, I want the transaction status to be consistent between API response and frontend display, so that I can trust the system's status information.

#### Acceptance Criteria

1. WHEN the API returns transaction data, THE status field SHALL be calculated using enhanced status logic on the backend
2. WHEN the frontend receives transaction data, THE System SHALL use the backend-provided status directly without recalculation
3. WHEN comparing API response and UI display, THE status SHALL always match exactly
4. WHEN status calculation logic changes, THE System SHALL only need updates in one place (backend)
5. WHEN multiple clients access the same transaction, THE System SHALL return consistent status across all clients

### Requirement 11: Concurrent Pickup Prevention

**User Story:** As a kasir, I want to prevent data conflicts when multiple staff process pickups simultaneously, so that inventory remains accurate.

#### Acceptance Criteria

1. WHEN a pickup is being processed, THE System SHALL lock the transaction to prevent concurrent modifications
2. WHEN a concurrent pickup is detected, THE System SHALL display a clear error message suggesting refresh
3. WHEN pickup validation occurs, THE System SHALL verify current jumlahDiambil values from database
4. WHEN a pickup exceeds remaining quantity, THE System SHALL reject the operation with specific error
5. WHEN a conflict is resolved, THE System SHALL provide a retry button to attempt pickup again
