# Implementation Plan: Pickup-Pairing Integration

## Overview

This implementation plan addresses the critical compatibility issues between the jas-sarung pairing system and pickup system by creating a robust integration layer that handles data format differences, stock management conflicts, and item filtering inconsistencies.

## Tasks

- [x] 1. Create core integration utilities
  - Create KondisiAwalParser utility class for dual format support
  - Implement format detection and parsing logic for both JSON and pipe formats
  - Add comprehensive error handling and logging for parsing operations
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 1.1 Write property tests for KondisiAwalParser
  - **Property 1: Format compatibility parsing**
  - **Validates: Requirements 1.1, 1.2, 1.3**

- [x] 1.2 Write property tests for parsing failure handling
  - **Property 2: Graceful parsing failure handling**
  - **Validates: Requirements 1.4, 5.1, 5.4**

- [x] 2. Implement pairing-aware stock management
  - Create PairingAwareStockManager class for dual stock deduction (jas + sarung)
  - Implement logic to deduct stock for BOTH jas and linked sarung items using 1:1 ratio
  - Add comprehensive logging for stock operation decisions
  - Integrate with existing InventoryService for stock operations
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2.1 Write property tests for dual stock management
  - **Property 3: Dual stock management for pairings**
  - **Validates: Requirements 2.1, 2.2**

- [x] 2.2 Write property tests for backward compatibility
  - **Property 4: Backward compatibility stock management**
  - **Validates: Requirements 2.3, 9.1**

- [x] 3. Enhance PickupService with integration layer
  - Update processPickup method to use KondisiAwalParser
  - Replace direct kondisiAwal parsing with new integration utilities
  - Integrate PairingAwareStockManager for stock operations
  - Add enhanced error handling with pairing context
  - **COMPLETED**: Fixed status update issue by filtering paired sarung items from status check
  - **FIXED**: Status now updates to 'diambil' when all pickupable items are picked up
  - _Requirements: 1.1, 2.1, 4.1, 5.4_

- [x]* 3.1 Write property tests for pickup service integration
  - **Property 10: Dual format support**
  - **Validates: Requirements 9.1, 9.2**

- [x] 4. Implement contextual error handling
  - Create PairingErrorHandler for error classification and recovery
  - Implement contextual error messages with pairing information
  - Add error recovery strategies for different failure types
  - Update error logging to include pairing context
  - _Requirements: 4.1, 4.4, 5.1, 5.4_

- [x]* 4.1 Write property tests for error handling
  - **Property 6: Contextual error messaging**
  - **Validates: Requirements 4.1, 4.4**

- [x] 5. Update item filtering logic and UI display for pickup
  - Create PairingDisplayFormatter for "Jas Name + Sarung Name" format display
  - Update frontend item display to show pairing information clearly
  - Ensure consistent filtering logic between frontend and backend
  - Update pickup availability calculations to consider only pickupable items
  - Add validation to prevent pickup attempts on filtered items
  - Implement linkedSarung display in pickup modal
  - _Requirements: 3.1, 3.2, 3.5, 6.1, 6.2_

- [x]* 5.1 Write property tests for UI display formatting
  - **Property 5: Item filtering consistency and display formatting**
  - **Validates: Requirements 3.1, 3.2, 3.5**

- [x]* 5.2 Write property tests for pickup availability
  - **Property 7: Pickup availability calculation**
  - **Validates: Requirements 6.1, 6.2**

- [x] 6. Enhance audit logging and monitoring
  - Add comprehensive logging for pairing-related pickup operations
  - Implement data format detection logging
  - Add stock operation decision logging with reasons
  - Create performance monitoring for pickup operations with pairing data
  - **COMPLETED**: Added 2 additional audit trail points for transaction context debugging
  - **FIXED**: Resolved nested transaction error by using sequential updates in dual deduction
  - _Requirements: 7.1, 7.2, 8.1, 8.5_

- [ ]* 6.1 Write property tests for audit logging
  - **Property 8: Comprehensive audit logging**
  - **Validates: Requirements 7.1, 7.2**

- [ ]* 6.2 Write property tests for performance maintenance
  - **Property 9: Performance maintenance**
  - **Validates: Requirements 8.1, 8.5**

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Integration testing and validation
  - Create end-to-end tests for pickup with jas-sarung pairing
  - Test error scenarios with corrupted or missing pairing data
  - Validate backward compatibility with existing transactions
  - Test performance with various transaction sizes and pairing configurations
  - _Requirements: 9.1, 9.2, 10.1, 10.4_

- [ ]* 8.1 Write integration tests for pickup flow
  - Test complete pickup flow with pairing data
  - Test error recovery and contextual messages
  - Test backward compatibility with old data

- [ ] 9. Performance optimization and monitoring
  - Implement performance monitoring and metrics collection
  - Add caching for parsed kondisiAwal data within request scope
  - Optimize database queries for pairing-related operations
  - Create performance regression testing
  - _Requirements: 8.1, 8.5_

- [ ]* 9.1 Write performance tests
  - Test pickup performance with various transaction sizes
  - Validate 2-second completion time for 10-item transactions

- [ ] 10. Documentation and deployment preparation
  - Update API documentation with pairing integration details
  - Create troubleshooting guide for pairing-related pickup issues
  - Add monitoring dashboard configuration for integration metrics
  - Prepare deployment checklist and rollback procedures
  - _Requirements: 7.1, 7.2_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Integration tests validate end-to-end functionality
- Performance tests ensure system remains responsive with pairing logic