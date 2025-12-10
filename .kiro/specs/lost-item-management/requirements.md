# Requirements Document - Lost Item Management System

## Introduction

The Lost Item Management System provides a two-stage process for handling rental items that are reported as lost (HILANG). The system enables proper tracking of lost items, manages security deposits (dana jaminan), and provides resolution options for producers to handle lost item scenarios efficiently.

This feature addresses the current gap where lost items are not properly tracked in inventory, and security deposits are not correctly calculated. The system will maintain data consistency between return records, inventory stock, and financial transactions.

## Glossary

- **System**: The Lost Item Management System within the rental software
- **Producer**: The business owner or staff member managing rental transactions
- **Customer**: The person renting items from the producer
- **Lost Item (HILANG)**: A rental item that is not returned by the customer
- **Security Deposit (Dana Jaminan)**: The amount held from customer when item is reported lost, calculated as modalAwal + late penalty
- **modalAwal**: The original capital cost/purchase price of a product
- **Return Service**: The backend service handling item returns (returnService.ts)
- **ProductSize**: Database entity tracking inventory for specific product size and age category
- **rentedQuantity**: Number of items currently rented out
- **availableQuantity**: Number of items available for rent
- **lostQuantity**: Number of items permanently lost
- **Resolution**: The process of finalizing what happens to a lost item
- **TransaksiItemReturn**: Database entity storing return condition records

## Requirements

### Requirement 1: Lost Item Deposit Calculation

**User Story:** As a producer, I want the system to automatically calculate and hold security deposit when customer reports item as lost, so that I have financial protection for the lost item.

#### Acceptance Criteria

1. WHEN a producer processes return with kondisiAkhir marked as "HILANG" THEN the System SHALL calculate security deposit as modalAwal plus applicable late penalty
2. WHEN security deposit is calculated THEN the System SHALL create penalty payment record with metode "penalty" and store deposit amount
3. WHEN lost item return is processed THEN the System SHALL set jumlahKembali to zero for the lost item condition
4. WHEN lost item return is processed THEN the System SHALL store modalAwal value in modalAwalUsed field for audit purposes
5. WHEN lost item return is processed THEN the System SHALL set conditionCategory to "HILANG" in return record

### Requirement 2: Lost Item Inventory Tracking

**User Story:** As a producer, I want the system to track lost items separately from rented items, so that I have accurate inventory counts and can generate loss reports.

#### Acceptance Criteria

1. WHEN ProductSize schema is updated THEN the System SHALL include lostQuantity field with default value of zero
2. WHEN lost item return is initially processed THEN the System SHALL NOT modify rentedQuantity or availableQuantity
3. WHEN lost item is resolved as "deposit kept" THEN the System SHALL decrement rentedQuantity by one and increment lostQuantity by one
4. WHEN lost item is resolved as "customer replaced" THEN the System SHALL decrement rentedQuantity by one and increment availableQuantity by one
5. WHEN inventory calculations are performed THEN the System SHALL maintain invariant: originalQuantity equals rentedQuantity plus lostQuantity plus availableQuantity

### Requirement 3: Lost Item Resolution Interface

**User Story:** As a producer, I want a simple interface to resolve lost items, so that I can quickly finalize what happens with the lost item and update inventory accordingly.

#### Acceptance Criteria

1. WHEN transaction detail page is displayed AND transaction contains unresolved lost items THEN the System SHALL display "Resolve Barang Hilang" button
2. WHEN producer clicks "Resolve Barang Hilang" button THEN the System SHALL display modal with list of unresolved lost items
3. WHEN resolution modal is displayed THEN the System SHALL show two resolution options: "Customer Beli Sendiri" and "Ganti dengan Dana Jaminan"
4. WHEN resolution modal is displayed THEN the System SHALL display item details including product name, size info, and security deposit amount
5. WHEN producer selects resolution option and confirms THEN the System SHALL process resolution within atomic database transaction

### Requirement 4: Customer Replacement Resolution

**User Story:** As a producer, I want to process customer replacement when customer buys identical item to replace lost one, so that security deposit is refunded and inventory is restored.

#### Acceptance Criteria

1. WHEN producer selects "Customer Beli Sendiri" resolution THEN the System SHALL create negative penalty payment to refund security deposit
2. WHEN customer replacement is processed THEN the System SHALL decrement rentedQuantity by one for the product size
3. WHEN customer replacement is processed THEN the System SHALL increment availableQuantity by one for the product size
4. WHEN customer replacement is processed THEN the System SHALL NOT modify lostQuantity
5. WHEN customer replacement is processed THEN the System SHALL update TransaksiItemReturn record with resolutionStatus "resolved_replaced"
6. WHEN customer replacement is processed THEN the System SHALL record resolutionDate as current timestamp
7. WHEN customer replacement transaction fails THEN the System SHALL rollback all changes including stock updates and payment refund

### Requirement 5: Deposit Retention Resolution

**User Story:** As a producer, I want to keep security deposit when customer cannot replace lost item, so that I can use funds to purchase replacement and track item as permanently lost.

#### Acceptance Criteria

1. WHEN producer selects "Ganti dengan Dana Jaminan" resolution THEN the System SHALL NOT create refund payment
2. WHEN deposit retention is processed THEN the System SHALL decrement rentedQuantity by one for the product size
3. WHEN deposit retention is processed THEN the System SHALL increment lostQuantity by one for the product size
4. WHEN deposit retention is processed THEN the System SHALL NOT modify availableQuantity
5. WHEN deposit retention is processed THEN the System SHALL update TransaksiItemReturn record with resolutionStatus "resolved_lost"
6. WHEN deposit retention is processed THEN the System SHALL record resolutionDate as current timestamp
7. WHEN deposit retention transaction fails THEN the System SHALL rollback all changes including stock updates

### Requirement 6: Resolution Status Tracking

**User Story:** As a producer, I want to track resolution status of lost items, so that I know which lost items are pending resolution and which are finalized.

#### Acceptance Criteria

1. WHEN TransaksiItemReturn schema is updated THEN the System SHALL include optional resolutionStatus field
2. WHEN lost item return is initially created THEN the System SHALL set resolutionStatus to null indicating pending resolution
3. WHEN lost item is resolved THEN the System SHALL set resolutionStatus to either "resolved_replaced" or "resolved_lost"
4. WHEN checking for unresolved lost items THEN the System SHALL identify items with kondisiAkhir containing "hilang" AND resolutionStatus is null
5. WHEN resolution is completed THEN the System SHALL prevent duplicate resolution attempts for same lost item

### Requirement 7: Data Consistency and Atomicity

**User Story:** As a producer, I want all lost item operations to be atomic, so that data remains consistent even if errors occur during processing.

#### Acceptance Criteria

1. WHEN lost item return is processed THEN the System SHALL execute all database operations within single transaction
2. WHEN lost item resolution is processed THEN the System SHALL execute stock updates, payment operations, and status updates within single transaction
3. WHEN any operation within transaction fails THEN the System SHALL rollback all changes and return error message
4. WHEN stock update fails during resolution THEN the System SHALL rollback payment operations and status updates
5. WHEN payment operation fails during resolution THEN the System SHALL rollback stock updates and status updates

### Requirement 8: Audit Trail and Logging

**User Story:** As a producer, I want complete audit trail of lost item operations, so that I can review history and troubleshoot issues.

#### Acceptance Criteria

1. WHEN lost item return is processed THEN the System SHALL log operation with transaction ID, item details, and deposit amount
2. WHEN lost item resolution is processed THEN the System SHALL log resolution type, stock changes, and payment operations
3. WHEN resolution is completed THEN the System SHALL create activity record with resolution details
4. WHEN errors occur during processing THEN the System SHALL log error details including transaction ID and error message
5. WHEN audit trail is queried THEN the System SHALL provide complete history of lost item from initial return through resolution

### Requirement 9: Bug Fix - HILANG Penalty Calculation

**User Story:** As a producer, I want lost item penalty to be correctly calculated from user input, so that security deposit accurately reflects item replacement cost.

#### Acceptance Criteria

1. WHEN getConditionPenalty function processes HILANG condition THEN the System SHALL return manualPrice multiplied by totalQuantity as penalty amount
2. WHEN HILANG condition has no manualPrice value THEN the System SHALL return 0 as penalty
3. WHEN HILANG penalty is calculated THEN the System SHALL multiply manualPrice by totalQuantity (NOT by jumlahKembali which is 0)
4. WHEN return record is created for HILANG item THEN the System SHALL store calculated penalty in penaltyAmount field
5. WHEN penalty payment is created for HILANG item THEN the System SHALL include total penalty (manualPrice × totalQuantity) in payment breakdown

**Note:** modalAwal from product is used as reference/default value in UI form only, not in penalty calculation

**Example:** If 2 items are lost with manualPrice = Rp 500,000 per item, penalty = Rp 500,000 × 2 = Rp 1,000,000

### Requirement 10: Migration and Backward Compatibility

**User Story:** As a producer, I want schema changes to be applied safely without affecting existing data, so that system continues working during and after migration.

#### Acceptance Criteria

1. WHEN lostQuantity field is added to ProductSize THEN the System SHALL set default value to zero for all existing records
2. WHEN resolutionStatus field is added to TransaksiItemReturn THEN the System SHALL allow null values for existing records
3. WHEN migration is executed THEN the System SHALL NOT require data transformation for existing records
4. WHEN new fields are queried THEN the System SHALL handle null values gracefully without errors
5. WHEN existing return processing is executed THEN the System SHALL continue working with new schema fields

### Requirement 11: Refund Expense Tracking

**User Story:** As a producer, I want refund payments to be automatically recorded as expenses in Dana Kasir, so that I can track cash outflow and maintain accurate financial records.

#### Acceptance Criteria

1. WHEN customer replacement resolution is processed THEN the System SHALL create expense record in PengeluaranKasir table
2. WHEN refund expense is created THEN the System SHALL use kategori "Refund Dana Jaminan"
3. WHEN refund expense is created THEN the System SHALL set harga equal to refund amount (positive value)
4. WHEN refund expense is created THEN the System SHALL set kasirId from user selection in resolution modal
5. WHEN refund expense is created THEN the System SHALL generate deskripsi with format "Refund dana jaminan - [Product Name] - [Customer Name] - Transaksi #[Transaction Code]"
6. WHEN refund expense creation fails THEN the System SHALL rollback entire resolution transaction including payment and stock updates
7. WHEN refund expense is created THEN the System SHALL appear in Dana Summary expense list for the current date

### Requirement 12: Kasir Selection in Resolution

**User Story:** As a producer, I want to select which kasir handles the refund, so that expense is properly attributed to the correct kasir account.

#### Acceptance Criteria

1. WHEN resolution modal is displayed THEN the System SHALL show kasir selection dropdown
2. WHEN kasir dropdown is displayed THEN the System SHALL list all active kasir ordered by name
3. WHEN resolution is submitted without kasir selection THEN the System SHALL show validation error
4. WHEN resolution is submitted with kasir selection THEN the System SHALL use selected kasirId for expense record
5. WHEN kasir list is loading THEN the System SHALL show loading indicator in dropdown

---

**Requirements Version**: 1.1  
**Date**: December 9, 2025  
**Approach**: Keep It Simple - Minimal Changes, Maximum Value  
**Status**: Updated with Refund Expense Tracking
