# Requirements Document

## Introduction

Sistem automatic refund integration untuk cancel transaction yang memungkinkan pemrosesan refund secara otomatis ketika transaksi dibatalkan dan customer sudah melakukan pembayaran. Sistem ini akan mengintegrasikan dengan existing expense management system untuk tracking dana keluar.

## Glossary

- **Cancel_Transaction_System**: Sistem pembatalan transaksi yang sudah ada
- **Refund_Payment**: Record pembayaran negatif untuk refund customer
- **Expense_Record**: Record pengeluaran kasir untuk tracking dana keluar
- **Activity_Log**: Log aktivitas transaksi dengan status refund
- **Kasir**: Staff yang memproses refund (diperlukan untuk expense tracking)

## Requirements

### Requirement 1: Automatic Refund Detection

**User Story:** As a kasir, I want the system to automatically detect when a cancelled transaction needs refund, so that no manual checking is required.

#### Acceptance Criteria

1. WHEN a transaction is cancelled AND has payment amount > 0, THE Cancel_Transaction_System SHALL automatically trigger refund processing
2. WHEN a transaction is cancelled AND has no payment, THE Cancel_Transaction_System SHALL skip refund processing
3. THE Cancel_Transaction_System SHALL validate kasir information before processing refund

### Requirement 2: Automatic Refund Payment Creation

**User Story:** As a system administrator, I want refund payments to be automatically recorded, so that transaction payment history is complete and accurate.

#### Acceptance Criteria

1. WHEN refund is triggered, THE Cancel_Transaction_System SHALL create a negative payment record in pembayaran table
2. THE Refund_Payment SHALL have metode = 'refund'
3. THE Refund_Payment SHALL have jumlah = negative of original payment amount
4. THE Refund_Payment SHALL include descriptive catatan with cancellation reason
5. THE Refund_Payment SHALL be linked to the original transaction

### Requirement 3: Automatic Expense Record Creation

**User Story:** As a kasir, I want refund expenses to be automatically tracked in dana kasir system, so that cash flow is properly recorded.

#### Acceptance Criteria

1. WHEN refund payment is created, THE Cancel_Transaction_System SHALL create expense record in pengeluaranKasir table
2. THE Expense_Record SHALL have kategori = 'Refund Pembatalan Transaksi'
3. THE Expense_Record SHALL have harga = positive refund amount
4. THE Expense_Record SHALL include customer name and transaction code in deskripsi
5. THE Expense_Record SHALL be linked to the processing kasir
6. THE Expense_Record SHALL have isActive = true

### Requirement 4: Enhanced Activity Logging

**User Story:** As a system administrator, I want complete audit trail of refund processing, so that all refund activities are traceable.

#### Acceptance Criteria

1. WHEN refund processing is completed, THE Cancel_Transaction_System SHALL update activity log with refund completion status
2. THE Activity_Log SHALL include refundProcessed = true
3. THE Activity_Log SHALL include refundAmount with actual refund value
4. THE Activity_Log SHALL include expenseRecordCreated = true
5. THE Activity_Log SHALL replace needsRefund = false (was true before processing)

### Requirement 5: Manual Kasir Selection

**User Story:** As a kasir, I want to manually select which kasir processes the refund, so that expense tracking is accurate and accountable.

#### Acceptance Criteria

1. THE Cancel_Transaction_System SHALL provide kasir selection UI in cancellation modal
2. THE Cancel_Transaction_System SHALL fetch active kasir list from API
3. THE Cancel_Transaction_System SHALL require kasir selection before processing cancellation
4. THE Cancel_Transaction_System SHALL validate selected kasir exists and is active
5. THE Expense_Record SHALL be linked to the manually selected kasir

### Requirement 6: Transaction Atomicity

**User Story:** As a system administrator, I want refund processing to be atomic, so that partial failures don't leave inconsistent data.

#### Acceptance Criteria

1. THE Cancel_Transaction_System SHALL process refund payment and expense record in single database transaction
2. WHEN any refund step fails, THE Cancel_Transaction_System SHALL rollback all refund changes
3. WHEN refund processing fails, THE Cancel_Transaction_System SHALL maintain original needsRefund = true status
4. THE Cancel_Transaction_System SHALL log refund processing errors for debugging

### Requirement 7: UI Status Display Enhancement

**User Story:** As a kasir, I want to see clear refund completion status in transaction history, so that I know if refund was processed successfully.

#### Acceptance Criteria

1. WHEN refund is completed, THE Activity_Timeline SHALL display "Status Refund: ✅ Selesai"
2. WHEN refund is pending, THE Activity_Timeline SHALL display "Status Refund: ⏳ Perlu Diproses"
3. THE Activity_Timeline SHALL show refund amount when refund is completed
4. THE Activity_Timeline SHALL use green color scheme for completed refunds
5. THE Activity_Timeline SHALL use orange color scheme for pending refunds

### Requirement 8: Error Handling and Recovery

**User Story:** As a system administrator, I want robust error handling for refund failures, so that system remains stable and issues are traceable.

#### Acceptance Criteria

1. WHEN kasir validation fails, THE Cancel_Transaction_System SHALL return descriptive error message
2. WHEN expense record creation fails, THE Cancel_Transaction_System SHALL rollback payment record
3. WHEN refund processing fails, THE Cancel_Transaction_System SHALL log error details with transaction context
4. THE Cancel_Transaction_System SHALL preserve original transaction cancellation even if refund fails
5. WHEN refund fails, THE Activity_Log SHALL include refund error information

### Requirement 9: Backward Compatibility

**User Story:** As a system administrator, I want existing cancelled transactions to remain functional, so that historical data is not affected.

#### Acceptance Criteria

1. THE Activity_Timeline SHALL handle both old format (needsRefund only) and new format (refundProcessed)
2. WHEN displaying old cancelled transactions, THE Activity_Timeline SHALL show "Perlu Diproses" status
3. THE Cancel_Transaction_System SHALL not modify existing cancelled transaction records
4. THE Activity_Timeline SHALL gracefully handle missing refund status fields

### Requirement 10: Integration Consistency

**User Story:** As a developer, I want refund processing to follow existing patterns, so that system architecture remains consistent.

#### Acceptance Criteria

1. THE Cancel_Transaction_System SHALL use same refund pattern as Lost Item Resolution system
2. THE Expense_Record creation SHALL follow same validation rules as manual expense creation
3. THE Refund_Payment creation SHALL follow same structure as existing payment records
4. THE Cancel_Transaction_System SHALL maintain existing TransaksiService interface compatibility