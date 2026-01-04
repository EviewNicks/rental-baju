# Requirements Document

## Introduction

Sistem integrasi antara jas-sarung pairing system dan return system untuk mengatasi konflik data format dan operasional yang menyebabkan kegagalan return setelah implementasi pairing system. Fitur ini memastikan bahwa transaksi dengan jas-sarung pairing dapat diproses return dengan benar tanpa error database atau item tidak ditemukan, dengan dukungan untuk dual stock restoration dan penalty calculation yang tepat.

## Glossary

- **Pairing_System**: Sistem yang menghubungkan jas dengan sarung gratis dalam satu transaksi
- **Return_System**: Sistem untuk mengembalikan item rental dengan penalty calculation dan stock restoration
- **kondisiAwal_Field**: Field yang menyimpan informasi size dan kondisi item dalam format tertentu
- **JSON_Format**: Format data kondisiAwal yang digunakan oleh pairing system dengan struktur JSON
- **Pipe_Format**: Format data kondisiAwal yang digunakan oleh return system dengan format "id|size|age|condition"
- **Linked_Sarung**: Sarung yang dipasangkan dengan jas dalam pairing system
- **Stock_Management**: Sistem pengelolaan stok inventory untuk item rental dengan dual restoration
- **Penalty_Calculation**: Sistem perhitungan penalty yang hanya berlaku untuk jas, bukan sarung
- **Return_Validation**: Proses validasi yang memastikan jas dan sarung dikembalikan bersamaan
- **Activity_Logging**: Sistem pencatatan aktivitas dengan informasi pairing
- **Auto_Selection**: Sistem otomatis memilih sarung ketika jas dipilih untuk return
- **Dual_Stock_Restoration**: Proses mengembalikan stock untuk jas dan sarung secara bersamaan

## Requirements

### Requirement 1: Data Format Compatibility for Return Processing

**User Story:** As a kasir, I want to return jas items with linked sarung without getting database errors, so that I can complete the return process smoothly.

#### Acceptance Criteria

1. WHEN parsing kondisiAwal field in return service, THE System SHALL support both JSON format and pipe-separated format
2. WHEN kondisiAwal contains JSON data with linkedSarung, THE System SHALL extract productSizeId correctly for both jas and sarung
3. WHEN kondisiAwal contains pipe-separated data, THE System SHALL parse it using existing logic
4. WHEN productSizeId extraction fails, THE System SHALL log warning and continue without stock restoration
5. THE System SHALL maintain backward compatibility with existing transactions using pipe format

### Requirement 2: Dual Stock Management Integration for Returns

**User Story:** As an inventory manager, I want stock to be managed correctly for both jas and sarung items during return, so that inventory remains accurate.

#### Acceptance Criteria

1. WHEN returning jas with linked sarung, THE System SHALL restore stock for BOTH the jas item AND the linked sarung item
2. WHEN processing jas-sarung pairing return, THE System SHALL restore stock using a 1:1 ratio (1 jas = 1 sarung)
3. WHEN returning regular (non-paired) items, THE System SHALL restore stock normally
4. THE System SHALL identify paired items using linkedSarung data in kondisiAwal JSON format
5. WHEN stock restoration fails for any reason, THE System SHALL log error but continue return process

### Requirement 3: Auto-Selection UI Behavior for Paired Items

**User Story:** As a kasir, I want sarung to be automatically selected when I select jas for return, so that I don't accidentally return only part of a pairing.

#### Acceptance Criteria

1. WHEN selecting jas item with linked sarung for return, THE System SHALL automatically select the linked sarung item
2. WHEN jas is selected, THE System SHALL disable the ability to uncheck the linked sarung
3. WHEN jas is deselected, THE System SHALL automatically deselect the linked sarung
4. THE System SHALL visually indicate which items are paired and cannot be separated
5. WHEN displaying paired items, THE System SHALL show clear visual connection between jas and sarung

### Requirement 4: Return UI Display and Pairing Information

**User Story:** As a kasir, I want to see clear pairing information when processing returns, so that I understand what items are being returned together.

#### Acceptance Criteria

1. WHEN displaying transaction items for return, THE System SHALL show pairing information clearly
2. WHEN an item is a jas with linked sarung, THE System SHALL display it as "Jas Name (Category Size) + Sarung Name (Category Size)" format in return UI
3. WHEN processing return form, THE System SHALL show linkedSarung information to indicate pairing
4. THE System SHALL prevent separate return attempts on paired sarung items by hiding them from selection
5. WHEN displaying return confirmation, THE System SHALL show complete pairing information
6. WHEN item display logic changes, THE System SHALL update both frontend and backend consistently

### Requirement 5: Penalty Calculation for Paired Items

**User Story:** As a kasir, I want penalty calculation to work correctly for jas-sarung pairings, so that customers are charged appropriately.

#### Acceptance Criteria

1. WHEN calculating penalty for jas-sarung pairing, THE System SHALL apply penalty only to the jas item
2. WHEN sarung is part of pairing, THE System SHALL not calculate separate penalty for sarung (sarung is free)
3. WHEN processing return with pairing, THE System SHALL use jas modalAwal for penalty calculation
4. THE System SHALL maintain existing penalty calculation logic for non-paired items
5. WHEN displaying penalty breakdown, THE System SHALL show that penalty applies only to jas in pairing

### Requirement 6: Return Validation for Paired Items

**User Story:** As a kasir, I want the system to validate that paired items are returned together, so that inventory and business logic remain consistent.

#### Acceptance Criteria

1. WHEN attempting to return jas from pairing, THE System SHALL require both jas and sarung to be returned together
2. WHEN validating return quantities, THE System SHALL ensure paired items maintain 1:1 ratio
3. WHEN processing partial returns, THE System SHALL handle paired items as a single unit
4. THE System SHALL prevent return of sarung without corresponding jas from same pairing
5. WHEN validation fails for paired items, THE System SHALL provide clear error messages about pairing requirements

### Requirement 7: Enhanced Error Handling for Pairing Conflicts

**User Story:** As a kasir, I want clear error messages when return fails due to pairing conflicts, so that I can resolve issues quickly.

#### Acceptance Criteria

1. WHEN kondisiAwal parsing fails for paired items, THE System SHALL provide specific error message about pairing data format
2. WHEN productSizeId is not found for paired items, THE System SHALL show clear error about inventory mismatch
3. WHEN trying to return only part of a pairing, THE System SHALL explain that items must be returned together
4. THE System SHALL distinguish between pairing-related errors and general return errors
5. WHEN errors occur, THE System SHALL provide actionable recovery suggestions specific to pairing issues

### Requirement 8: Return Service Robustness with Pairing Data

**User Story:** As a system administrator, I want the return service to handle pairing data gracefully, so that the system remains stable under various data conditions.

#### Acceptance Criteria

1. WHEN encountering invalid JSON in kondisiAwal, THE System SHALL fall back to pipe format parsing
2. WHEN linkedSarung data is malformed, THE System SHALL continue return without dual stock restoration
3. WHEN productSizeId is missing or invalid for paired items, THE System SHALL log warning and skip stock operation
4. THE System SHALL never fail return operations due to stock management issues alone
5. WHEN data inconsistencies are detected in pairing, THE System SHALL create audit logs for investigation

### Requirement 9: Activity Logging Enhancement for Pairings

**User Story:** As a system administrator, I want detailed logging of pairing-related return operations, so that I can troubleshoot issues effectively.

#### Acceptance Criteria

1. WHEN processing return with pairing data, THE System SHALL log the pairing information in activity records
2. WHEN performing dual stock restoration, THE System SHALL log both jas and sarung stock changes
3. WHEN kondisiAwal parsing encounters pairing issues, THE System SHALL log the original data and error
4. THE System SHALL include pairing context in all return-related activity logs
5. WHEN debugging return issues, THE System SHALL provide sufficient information to identify pairing-related root causes

### Requirement 10: Performance Optimization for Paired Returns

**User Story:** As a kasir, I want return operations to complete quickly even with pairing data processing, so that I can serve customers efficiently.

#### Acceptance Criteria

1. WHEN parsing kondisiAwal data with pairing information, THE System SHALL use efficient JSON parsing with error handling
2. WHEN processing dual stock restoration, THE System SHALL batch operations where possible
3. THE System SHALL cache parsed kondisiAwal data within the same request to avoid re-parsing
4. WHEN stock operations are skipped for paired items, THE System SHALL avoid unnecessary database queries
5. THE System SHALL maintain return performance within 3 seconds for transactions with up to 10 paired items

### Requirement 11: Data Migration Support for Pairing Integration

**User Story:** As a developer, I want to handle existing transactions with different kondisiAwal formats, so that the system works with historical data.

#### Acceptance Criteria

1. WHEN encountering old transactions with pipe format, THE System SHALL process them normally
2. WHEN encountering new transactions with JSON format and pairing data, THE System SHALL extract data correctly
3. THE System SHALL not require data migration for existing transactions
4. WHEN data format detection fails, THE System SHALL use safe fallback behavior
5. THE System SHALL support gradual transition from pipe format to JSON format with pairing support

### Requirement 12: Integration Testing Support for Return-Pairing

**User Story:** As a developer, I want comprehensive testing coverage for pairing-return integration, so that regressions can be prevented.

#### Acceptance Criteria

1. THE System SHALL provide test utilities for creating transactions with pairing data for return testing
2. THE System SHALL support testing both successful and failed return scenarios with pairings
3. THE System SHALL include test cases for all kondisiAwal format combinations in return context
4. THE System SHALL validate that return operations work correctly with various pairing configurations
5. THE System SHALL ensure test coverage includes error handling and edge cases specific to return-pairing integration