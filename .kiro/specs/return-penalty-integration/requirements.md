# Requirements Document: Return Penalty Integration & Activity Logging Enhancement

## Introduction

This specification addresses critical gaps in the return service system related to activity logging, penalty payment tracking, and penalty visibility across the application. The current implementation creates duplicate activity records, fails to integrate penalty payments with the dana kasir system, and doesn't display penalty information in product history.

## Glossary

- **Return Service**: The system component responsible for processing rental item returns
- **Activity Log**: Historical record of transaction events stored in AktivitasTransaksi table
- **Penalty Payment**: Financial charge applied for late returns or damaged/lost items
- **Dana Kasir**: Cash management system tracking daily income and expenses
- **Product History**: Timeline of rental transactions for a specific product
- **Condition Penalty**: Charge applied based on item condition (kotor, rusak, hilang)
- **Late Penalty**: Flat 20,000 IDR charge per item for late returns
- **Unified Activity**: Single comprehensive activity record containing all return details

## Requirements

### Requirement 1: Unified Activity Logging

**User Story:** As a kasir, I want to see a single comprehensive activity record for each return, so that I can quickly understand what happened without reading multiple duplicate entries.

#### Acceptance Criteria

1. WHEN a return is processed THEN the system SHALL create exactly one activity record of type 'dikembalikan'
2. WHEN creating the return activity THEN the system SHALL include summary data with totalItems, totalPenalty, totalLatePenalty, totalConditionPenalty, isLateReturn, lateDays, and returnDate
3. WHEN creating the return activity THEN the system SHALL include detailed breakdown for each returned item with itemId, productCode, productName, sizeInfo, totalItemPenalty, and conditions array
4. WHEN creating the return activity THEN the system SHALL include condition details with kondisiAkhir, jumlahKembali, conditionCategory, penaltyAmount, manualPrice, and useManualPricing for each condition
5. WHEN creating the return activity THEN the system SHALL include processing metadata with processingMode, processingTime, and statusChange information
6. WHEN a return is processed THEN the system SHALL NOT create separate 'penalty_added' or status change activities
7. WHEN the activity data exceeds 1KB THEN the system SHALL compress or truncate non-essential metadata while preserving critical penalty and item information

### Requirement 2: Penalty Payment Integration

**User Story:** As a kasir, I want penalty payments to be tracked in the dana kasir system, so that I can see accurate daily income including penalties.

#### Acceptance Criteria

1. WHEN a return with penalty is processed THEN the system SHALL create a Pembayaran record with metode 'penalty'
2. WHEN creating penalty payment record THEN the system SHALL store jumlah equal to totalPenalty from penalty calculation
3. WHEN creating penalty payment record THEN the system SHALL include penaltyBreakdown JSON with latePenalty, conditionPenalty, and itemPenalties array
4. WHEN creating penalty payment record THEN the system SHALL set catatan to describe penalty type and amount
5. WHEN a return has zero penalty THEN the system SHALL NOT create a penalty payment record
6. WHEN penalty payment is created THEN the system SHALL use the same transaction context to ensure atomicity with return processing
7. WHEN penalty payment creation fails THEN the system SHALL rollback the entire return transaction

### Requirement 3: Dana Summary Penalty Inclusion

**User Story:** As a kasir, I want to see penalty income in my daily summary, so that I know the complete income for the day.

#### Acceptance Criteria

1. WHEN calculating daily summary THEN the system SHALL include penalty payments in totalIncome calculation
2. WHEN calculating daily summary THEN the system SHALL sum jumlahBayar, flatLatePenalty from Transaksi, and totalReturnPenalty from TransaksiItem
3. WHEN retrieving income list THEN the system SHALL include penalty payment entries with type 'penalty'
4. WHEN displaying penalty income THEN the system SHALL show transaksiKode, customerName, amount, and penaltyBreakdown
5. WHEN filtering by date THEN the system SHALL use tglKembali for penalty payments instead of createdAt
6. WHEN penalty payment has breakdown THEN the system SHALL display latePenalty and conditionPenalty separately
7. WHEN calculating net balance THEN the system SHALL include penalty income in the income side of the equation

### Requirement 4: Product History Penalty Display

**User Story:** As a producer, I want to see penalty information in product rental history, so that I can track which rentals resulted in penalties.

#### Acceptance Criteria

1. WHEN retrieving product history THEN the system SHALL include penalty data for each transaction
2. WHEN a transaction has penalty THEN the system SHALL include penalty.total, penalty.late, and penalty.condition amounts
3. WHEN a transaction has penalty THEN the system SHALL include penalty.breakdown array with kondisiAkhir, jumlahKembali, and penaltyAmount for each condition
4. WHEN displaying product history THEN the system SHALL show penalty information in a visually distinct manner
5. WHEN a transaction has no penalty THEN the system SHALL NOT display penalty section
6. WHEN penalty breakdown exists THEN the system SHALL display condition-specific penalties with their amounts
7. WHEN penalty information is unavailable THEN the system SHALL gracefully handle missing data without errors

### Requirement 5: Penalty Payment Schema Extension

**User Story:** As a system administrator, I want the database schema to support penalty payment tracking, so that penalty data is properly structured and queryable.

#### Acceptance Criteria

1. WHEN extending Pembayaran table THEN the system SHALL add optional penaltyBreakdown JSON field
2. WHEN storing penalty breakdown THEN the system SHALL include latePenalty, conditionPenalty, and itemPenalties structure
3. WHEN querying penalty payments THEN the system SHALL support filtering by metode = 'penalty'
4. WHEN indexing penalty data THEN the system SHALL create index on (metode, createdAt) for efficient queries
5. WHEN migrating existing data THEN the system SHALL preserve all existing payment records
6. WHEN penalty breakdown is stored THEN the system SHALL validate JSON structure matches expected schema
7. WHEN querying penalty statistics THEN the system SHALL support aggregation by date range and penalty type

### Requirement 6: Backward Compatibility

**User Story:** As a developer, I want the new penalty system to work with existing transactions, so that historical data remains accessible.

#### Acceptance Criteria

1. WHEN processing new returns THEN the system SHALL use the unified activity logging format
2. WHEN displaying old activities THEN the system SHALL gracefully handle legacy activity format
3. WHEN calculating dana summary THEN the system SHALL include both old flatLatePenalty and new penalty payments
4. WHEN querying product history THEN the system SHALL handle transactions with and without penalty breakdown
5. WHEN migrating to new system THEN the system SHALL NOT require data migration for existing transactions
6. WHEN displaying legacy activities THEN the system SHALL show available information without errors
7. WHEN new features are unavailable for old data THEN the system SHALL display appropriate fallback information

### Requirement 7: Performance Optimization

**User Story:** As a kasir, I want return processing to remain fast even with enhanced logging, so that I can process returns efficiently.

#### Acceptance Criteria

1. WHEN creating unified activity THEN the system SHALL complete within 100ms
2. WHEN creating penalty payment THEN the system SHALL execute within the same transaction as return processing
3. WHEN calculating dana summary THEN the system SHALL use optimized queries with proper indexes
4. WHEN retrieving product history THEN the system SHALL paginate results to limit data transfer
5. WHEN processing return with penalty THEN the system SHALL NOT increase total processing time by more than 10%
6. WHEN querying penalty statistics THEN the system SHALL use database aggregation instead of application-level calculation
7. WHEN displaying activity logs THEN the system SHALL lazy-load detailed breakdown on user request

### Requirement 8: Error Handling and Validation

**User Story:** As a kasir, I want clear error messages when penalty processing fails, so that I can understand and resolve issues.

#### Acceptance Criteria

1. WHEN penalty calculation fails THEN the system SHALL rollback return transaction and display specific error message
2. WHEN penalty payment creation fails THEN the system SHALL rollback entire return transaction
3. WHEN activity logging fails THEN the system SHALL log warning but NOT rollback return transaction
4. WHEN penalty breakdown is invalid THEN the system SHALL validate structure before storing
5. WHEN dana summary calculation fails THEN the system SHALL return partial data with error indicator
6. WHEN product history query fails THEN the system SHALL display error message with retry option
7. WHEN penalty data is corrupted THEN the system SHALL handle gracefully and display available information

### Requirement 9: Audit Trail and Compliance

**User Story:** As an owner, I want complete audit trail of penalty charges, so that I can verify accuracy and resolve disputes.

#### Acceptance Criteria

1. WHEN penalty is applied THEN the system SHALL record who processed the return (createdBy)
2. WHEN penalty is applied THEN the system SHALL record exact timestamp of penalty application
3. WHEN penalty calculation is performed THEN the system SHALL store calculation method and parameters
4. WHEN manual pricing is used THEN the system SHALL record useManualPricing flag and manualPrice value
5. WHEN penalty is queried THEN the system SHALL provide complete history including calculation details
6. WHEN penalty is disputed THEN the system SHALL provide all data needed for verification
7. WHEN audit is performed THEN the system SHALL support querying penalties by date range, kasir, and amount

### Requirement 10: Reporting and Analytics

**User Story:** As an owner, I want to analyze penalty trends, so that I can identify patterns and improve operations.

#### Acceptance Criteria

1. WHEN generating penalty report THEN the system SHALL show total penalties by date range
2. WHEN analyzing penalties THEN the system SHALL break down by late penalties vs condition penalties
3. WHEN reviewing penalty trends THEN the system SHALL show penalties by product category
4. WHEN identifying problem products THEN the system SHALL show products with highest penalty rates
5. WHEN evaluating kasir performance THEN the system SHALL show penalty processing by kasir
6. WHEN comparing periods THEN the system SHALL support date range comparison for penalty metrics
7. WHEN exporting penalty data THEN the system SHALL support CSV export with full breakdown
