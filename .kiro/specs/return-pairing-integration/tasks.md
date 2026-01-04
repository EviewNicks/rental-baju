# Implementation Plan: Return-Pairing Integration

## Overview

This implementation plan addresses the critical compatibility issues between the jas-sarung pairing system and return system by creating a robust integration layer that handles data format differences, dual stock restoration, auto-selection UI behavior, penalty calculation adjustments, and return validation inconsistencies.

## Tasks

- [x] 1. Enhance InventoryService with return support for pairing
  - Add updateStockOnReturn method with dual restoration support (jas + sarung)
  - Implement logic to restore stock for BOTH jas and linked sarung items using 1:1 ratio
  - Add comprehensive logging for stock restoration decisions
  - Integrate with existing InventoryService for stock operations
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 1.1 Write property tests for dual stock restoration
  - **Property 3: Dual stock restoration for pairings**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [x] 2. Create pairing-aware stock manager for returns
  - Create PairingAwareStockManager class for return operations
  - Implement processStockForReturn method using enhanced kondisiAwal parser
  - Add comprehensive logging for stock restoration operation decisions
  - Integrate with enhanced InventoryService for dual restoration
  - _Requirements: 2.1, 2.2, 2.5_
  - **IMPLEMENTATION NOTE: Integrated directly into InventoryService instead of separate class to avoid duplication**

- [x] 2.1 Write property tests for graceful parsing failure handling
  - **Property 2: Graceful parsing failure handling**
  - **Validates: Requirements 1.4, 8.1, 8.3**

- [x] 2.2 Write property tests for system resilience
  - **Property 11: System resilience with pairing data**
  - **Validates: Requirements 2.5, 8.2, 8.4, 8.5**

- [x] 3. Implement pairing return validator
  - Create PairingReturnValidator class for validation logic
  - Implement validatePairedReturn method to ensure items returned together
  - Add quantity ratio validation (1:1) for paired items
  - Create comprehensive error messages for pairing validation failures
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 3.1 Write property tests for pairing validation
  - **Property 8: Pairing validation requirements**
  - **Validates: Requirements 6.1, 6.2, 6.4**

- [x] 3.2 Write property tests for partial return atomicity
  - **Property 9: Partial return pairing atomicity**
  - **Validates: Requirements 6.3**

- [x] 3.3 Write property tests for validation error messages
  - **Property 10: Pairing validation error messages**
  - **Validates: Requirements 6.5, 7.1, 7.2, 7.3, 7.4**

- [x] 4. Create pairing penalty calculator
  - Create PairingPenaltyCalculator class for jas-only penalty calculation
  - Implement calculatePairingPenalty method to apply penalty only to jas items
  - Ensure sarung penalty is always zero in pairings
  - Maintain existing penalty calculation logic for non-paired items
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 4.1 Write property tests for penalty calculation
  - **Property 7: Penalty calculation for pairings**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

- [x] 5. Implement auto-selection manager for UI
  - Create AutoSelectionManager class for paired item selection behavior
  - Implement auto-selection of sarung when jas is selected
  - Implement auto-deselection of sarung when jas is deselected
  - Prevent manual deselection of sarung when jas is selected
  - Add visual indicators for paired items that cannot be separated
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 5.1 Write property tests for auto-selection behavior
  - **Property 4: Auto-selection behavior for paired items**
  - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 6. Update return UI components with pairing support
  - Update SimpleReturnForm component to use AutoSelectionManager
  - Implement pairing display formatting "Jas Name (Category Size) + Sarung Name (Category Size)"
  - Add visual connection indicators between jas and sarung items
  - Filter out paired sarung items from direct selection
  - Update return confirmation to show complete pairing information
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  - **COMPLETED: Updated SimpleReturnForm and UnifiedConditionForm to use new AutoSelectionManager interface with linkedSarungData. Simplified implementation since sarung is metadata, not separate items. All type checking and linting passes.**

- [ ]* 6.1 Write property tests for pairing display format
  - **Property 5: Pairing display format consistency**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.5**

- [ ]* 6.2 Write property tests for sarung filtering
  - **Property 6: Paired sarung filtering**
  - **Validates: Requirements 4.4**

- [x] 7. Enhance ReturnService with pairing integration
  - Update processUnifiedReturn method to use PairingReturnValidator
  - Integrate PairingAwareStockManager for stock restoration operations
  - Add PairingPenaltyCalculator for jas-only penalty calculation
  - Add enhanced error handling with pairing context
  - Update activity logging to include pairing information
  - _Requirements: 1.1, 2.1, 5.1, 7.1, 8.4, 9.1_

- [x] 7.1 Write property tests for format compatibility
  - **Property 1: Format compatibility and backward compatibility**
  - **Validates: Requirements 1.1, 1.3, 1.5, 11.1, 11.2**

- [ ]* 7.2 Write property tests for fallback behavior
  - **Property 12: Fallback behavior for invalid data**
  - **Validates: Requirements 8.1, 8.2, 11.4**

- [x] 8. Enhance audit logging for pairing operations
  - Update activity logging to include pairing context in return operations
  - Add logging for dual stock restoration (both jas and sarung changes)
  - Include kondisiAwal parsing decisions and pairing data in logs
  - Add comprehensive audit trails for pairing-related return operations
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ]* 8.1 Write property tests for audit logging
  - **Property 13: Comprehensive audit logging for pairings**
  - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Integration testing and validation
  - Create end-to-end tests for return with jas-sarung pairing
  - Test auto-selection behavior in return UI
  - Test dual stock restoration functionality
  - Test penalty calculation (jas only, sarung zero)
  - Test error scenarios with corrupted or missing pairing data
  - Validate backward compatibility with existing transactions
  - _Requirements: 11.1, 11.2, 12.1, 12.4_

- [ ]* 10.1 Write integration tests for return flow
  - Test complete return flow with pairing data and auto-selection
  - Test dual stock restoration and jas-only penalty calculation
  - Test error recovery and contextual messages
  - Test backward compatibility with old data

- [ ] 11. Performance optimization and monitoring
  - Implement performance monitoring for return operations with pairing data
  - Add caching for parsed kondisiAwal data within request scope
  - Optimize database queries for pairing-related return operations
  - Ensure return performance within 3 seconds for 10 paired items
  - Create performance regression testing
  - _Requirements: 10.1, 10.5_

- [ ]* 11.1 Write performance tests
  - Test return performance with various transaction sizes including pairings
  - Validate 3-second completion time for 10-item transactions with pairings

- [ ] 12. Documentation and deployment preparation
  - Update API documentation with pairing integration details for returns
  - Create troubleshooting guide for pairing-related return issues
  - Add monitoring dashboard configuration for return integration metrics
  - Document auto-selection behavior and UI changes
  - Prepare deployment checklist and rollback procedures
  - _Requirements: 9.1, 9.4_

- [ ] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Integration tests validate end-to-end functionality including auto-selection
- Performance tests ensure system remains responsive with pairing logic and dual restoration
- This implementation reuses enhanced kondisiAwal parser from pickup-pairing integration
- Auto-selection behavior is a key differentiator from pickup integration
- Penalty calculation ensures only jas items are charged, sarung remains free
- Dual stock restoration maintains 1:1 ratio consistency with pickup operations