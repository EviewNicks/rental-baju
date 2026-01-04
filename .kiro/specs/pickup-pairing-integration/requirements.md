# Requirements Document

## Introduction

Sistem integrasi antara jas-sarung pairing system dan pickup system untuk mengatasi konflik data format dan operasional yang menyebabkan kegagalan pickup setelah implementasi pairing system. Fitur ini memastikan bahwa transaksi dengan jas-sarung pairing dapat diproses pickup dengan benar tanpa error database atau item tidak ditemukan.

## Glossary

- **Pairing_System**: Sistem yang menghubungkan jas dengan sarung gratis dalam satu transaksi
- **Pickup_System**: Sistem untuk mengambil item rental dari transaksi yang sudah dibayar
- **kondisiAwal_Field**: Field yang menyimpan informasi size dan kondisi item dalam format tertentu
- **JSON_Format**: Format data kondisiAwal yang digunakan oleh pairing system dengan struktur JSON
- **Pipe_Format**: Format data kondisiAwal yang digunakan oleh pickup system dengan format "id|size|age|condition"
- **Linked_Sarung**: Sarung yang dipasangkan dengan jas dalam pairing system
- **Stock_Management**: Sistem pengelolaan stok inventory untuk item rental
- **Item_Filtering**: Proses penyaringan item yang ditampilkan dalam UI berdasarkan status pairing

## Requirements

### Requirement 1: Data Format Compatibility

**User Story:** As a kasir, I want to pickup jas items with linked sarung without getting database errors, so that I can complete the rental process smoothly.

#### Acceptance Criteria

1. WHEN parsing kondisiAwal field in pickup service, THE System SHALL support both JSON format and pipe-separated format
2. WHEN kondisiAwal contains JSON data with linkedSarung, THE System SHALL extract productSizeId correctly
3. WHEN kondisiAwal contains pipe-separated data, THE System SHALL parse it using existing logic
4. WHEN productSizeId extraction fails, THE System SHALL log warning and continue without stock deduction
5. THE System SHALL maintain backward compatibility with existing transactions using pipe format

### Requirement 2: Stock Management Integration

**User Story:** As an inventory manager, I want stock to be managed correctly for both jas and sarung items during pickup, so that inventory remains accurate.

#### Acceptance Criteria

1. WHEN picking up jas with linked sarung, THE System SHALL deduct stock for BOTH the jas item AND the linked sarung item
2. WHEN processing jas-sarung pairing pickup, THE System SHALL deduct stock using a 1:1 ratio (1 jas = 1 sarung)
3. WHEN picking up regular (non-paired) items, THE System SHALL deduct stock normally
4. THE System SHALL identify paired items using linkedSarung data in kondisiAwal JSON format
5. WHEN stock deduction fails for any reason, THE System SHALL log error but continue pickup process

### Requirement 3: Item Filtering and UI Display Compatibility

**User Story:** As a kasir, I want to pickup all available items from a transaction and see clear pairing information, so that customers can collect their rentals completely and understand what they're receiving.

#### Acceptance Criteria

1. WHEN displaying transaction items for pickup, THE System SHALL include all items that can be picked up
2. WHEN an item is a jas with linked sarung, THE System SHALL display it as "Jas Name + Sarung Name" format in pickup UI
3. WHEN filtering items for pickup, THE System SHALL use consistent logic between frontend and backend
4. THE System SHALL prevent pickup attempts on items that are filtered out
5. WHEN displaying pickup modal, THE System SHALL show linkedSarung information clearly to indicate pairing
6. WHEN item filtering logic changes, THE System SHALL update both display and processing logic

### Requirement 4: Error Handling Enhancement

**User Story:** As a kasir, I want clear error messages when pickup fails due to pairing conflicts, so that I can resolve issues quickly.

#### Acceptance Criteria

1. WHEN kondisiAwal parsing fails, THE System SHALL provide specific error message about data format
2. WHEN productSizeId is not found in database, THE System SHALL show clear error about inventory mismatch
3. WHEN trying to pickup filtered items, THE System SHALL explain that item is part of a pairing
4. THE System SHALL distinguish between pairing-related errors and general pickup errors
5. WHEN errors occur, THE System SHALL provide actionable recovery suggestions

### Requirement 5: Pickup Service Robustness

**User Story:** As a system administrator, I want the pickup service to handle pairing data gracefully, so that the system remains stable under various data conditions.

#### Acceptance Criteria

1. WHEN encountering invalid JSON in kondisiAwal, THE System SHALL fall back to pipe format parsing
2. WHEN linkedSarung data is malformed, THE System SHALL continue pickup without stock deduction
3. WHEN productSizeId is missing or invalid, THE System SHALL log warning and skip stock operation
4. THE System SHALL never fail pickup operations due to stock management issues alone
5. WHEN data inconsistencies are detected, THE System SHALL create audit logs for investigation

### Requirement 6: Transaction Status Consistency

**User Story:** As a kasir, I want transaction status to be calculated correctly for transactions with jas-sarung pairings, so that pickup availability is accurate.

#### Acceptance Criteria

1. WHEN calculating pickup availability, THE System SHALL consider only items that can actually be picked up
2. WHEN all pickupable items are collected, THE System SHALL update transaction status to "diambil"
3. WHEN paired sarung items exist, THE System SHALL exclude them from pickup completion calculations
4. THE System SHALL maintain consistent status logic between transaction display and pickup processing
5. WHEN status updates occur, THE System SHALL reflect changes immediately in the UI

### Requirement 7: Audit Trail Enhancement

**User Story:** As a system administrator, I want detailed logging of pairing-related pickup operations, so that I can troubleshoot issues effectively.

#### Acceptance Criteria

1. WHEN processing pickup with pairing data, THE System SHALL log the data format detected
2. WHEN skipping stock deduction for paired items, THE System SHALL log the reason and item details
3. WHEN kondisiAwal parsing encounters issues, THE System SHALL log the original data and error
4. THE System SHALL include pairing context in all pickup-related activity logs
5. WHEN debugging pickup issues, THE System SHALL provide sufficient information to identify root causes

### Requirement 8: Performance Optimization

**User Story:** As a kasir, I want pickup operations to complete quickly even with pairing data processing, so that I can serve customers efficiently.

#### Acceptance Criteria

1. WHEN parsing kondisiAwal data, THE System SHALL use efficient JSON parsing with error handling
2. WHEN processing multiple items with pairing data, THE System SHALL batch operations where possible
3. THE System SHALL cache parsed kondisiAwal data within the same request to avoid re-parsing
4. WHEN stock operations are skipped, THE System SHALL avoid unnecessary database queries
5. THE System SHALL maintain pickup performance within 2 seconds for transactions with up to 10 items

### Requirement 9: Data Migration Support

**User Story:** As a developer, I want to handle existing transactions with different kondisiAwal formats, so that the system works with historical data.

#### Acceptance Criteria

1. WHEN encountering old transactions with pipe format, THE System SHALL process them normally
2. WHEN encountering new transactions with JSON format, THE System SHALL extract data correctly
3. THE System SHALL not require data migration for existing transactions
4. WHEN data format detection fails, THE System SHALL use safe fallback behavior
5. THE System SHALL support gradual transition from pipe format to JSON format

### Requirement 10: Integration Testing Support

**User Story:** As a developer, I want comprehensive testing coverage for pairing-pickup integration, so that regressions can be prevented.

#### Acceptance Criteria

1. THE System SHALL provide test utilities for creating transactions with pairing data
2. THE System SHALL support testing both successful and failed pickup scenarios with pairings
3. THE System SHALL include test cases for all kondisiAwal format combinations
4. THE System SHALL validate that pickup operations work correctly with various pairing configurations
5. THE System SHALL ensure test coverage includes error handling and edge cases