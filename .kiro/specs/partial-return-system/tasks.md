# Implementation Plan: Partial Return System

## Overview

This implementation plan extends the existing return system to support partial returns without creating duplicate code or dead functions. Each task builds incrementally on existing components, following the established patterns from the pickup system.

## Tasks

- [x] 1. Enhance return quantity calculation utilities
  - Create utility functions for calculating remaining returnable quantities
  - Add return progress calculation helpers
  - Implement session numbering logic
  - _Requirements: 2.2, 4.5, 5.2_
  - **Checkpoint**: Run `yarn lint && yarn type-check` to ensure code quality

- [ ]* 1.1 Write property test for quantity calculation utilities
  - **Property 2: Remaining Quantity Calculation Accuracy**
  - **Validates: Requirements 2.2, 8.5**

- [x] 2. Enhance ActionButtonPanel return button logic
  - Modify `canReturn` logic to check remaining quantities instead of total quantities
  - Add return progress indicators to transaction detail view
  - Update button visibility for partial return scenarios
  - _Requirements: 2.1, 2.3, 2.4, 4.1_
  - **Checkpoint**: Run `yarn lint && yarn type-check` to ensure code quality

- [ ]* 2.1 Write property test for return button visibility
  - **Property 4: Return Button Visibility Logic**
  - **Validates: Requirements 2.1, 2.3, 2.4**

- [x] 3. Enhance SimpleReturnForm for partial returns
  - Modify item filtering to show only items with remaining quantities
  - Update form initialization to use remaining quantities instead of total picked up
  - Add validation for partial return quantities
  - Enhance penalty preview calculation for session-based penalties
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - **Checkpoint**: Run `yarn lint && yarn type-check` to ensure code quality

- [ ]* 3.1 Write property test for form initialization
  - **Property 10: Return Form Initialization Accuracy**
  - **Validates: Requirements 3.1, 3.2**

- [ ]* 3.2 Write property test for quantity validation
  - **Property 1: Partial Return Quantity Validation**
  - **Validates: Requirements 1.2, 3.3, 3.5**

- [ ] 4. Enhance UnifiedReturnService for partial returns
  - Add partial return validation methods to existing service
  - Implement session-based penalty calculation logic
  - Enhance activity logging with session information and progress tracking
  - Update transaction status logic for partial completion scenarios
  - _Requirements: 1.1, 1.3, 5.1, 6.1, 6.2_
  - **Checkpoint**: Run `yarn lint && yarn type-check` to ensure code quality

- [ ]* 4.1 Write property test for session penalty calculation
  - **Property 3: Session-based Penalty Calculation**
  - **Validates: Requirements 1.4, 7.1, 7.5**

- [ ]* 4.2 Write property test for activity logging format
  - **Property 6: Activity Logging Format Consistency**
  - **Validates: Requirements 5.2, 5.3**

- [ ] 5. Implement late penalty calculation for partial returns
  - Enhance penalty calculator to handle session-based late penalties
  - Update penalty preview to show session-specific penalties
  - Ensure late penalty calculation uses current return date
  - _Requirements: 7.2, 7.3, 7.4_
  - **Checkpoint**: Run `yarn lint && yarn type-check` to ensure code quality

- [ ]* 5.1 Write property test for late penalty calculation
  - **Property 8: Late Penalty Calculation Accuracy**
  - **Validates: Requirements 7.2, 7.3**

- [ ] 6. Enhance transaction status management
  - Update status transition logic to handle partial returns
  - Implement completion detection for all items + lost item resolution
  - Ensure status stability during partial operations
  - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - **Checkpoint**: Run `yarn lint && yarn type-check` to ensure code quality

- [ ]* 6.1 Write property test for transaction status logic
  - **Property 7: Transaction Status Completion Logic**
  - **Validates: Requirements 6.1, 6.3**

- [ ] 7. Add return progress tracking to transaction details
  - Implement progress calculation and display components
  - Add progress indicators to transaction item lists
  - Show return session history in activity timeline
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - **Checkpoint**: Run `yarn lint && yarn type-check` to ensure code quality

- [ ]* 7.1 Write property test for progress calculation
  - **Property 5: Return Progress Calculation**
  - **Validates: Requirements 4.1, 4.5**

- [ ] 8. Enhance data validation and consistency
  - Add concurrent operation protection for partial returns
  - Implement comprehensive validation against current database state
  - Ensure referential integrity during partial return operations
  - _Requirements: 8.2, 8.3, 8.4_
  - **Checkpoint**: Run `yarn lint && yarn type-check` to ensure code quality

- [ ]* 8.1 Write property test for data consistency
  - **Property 9: Data Consistency During Partial Returns**
  - **Validates: Requirements 8.2, 8.4**

- [ ] 9. Manual testing and cleanup
  - Test complete partial return workflows end-to-end
  - Remove any unused code or dead functions created during development
  - Verify integration with existing lost item resolution system
  - _Requirements: All requirements integration_
  - **Checkpoint**: Run `yarn lint && yarn type-check` to ensure code quality

- [ ]* 9.1 Write integration tests for complete workflows
  - Test multi-session return scenarios
  - Verify integration with pickup and lost item systems
  - Test concurrent partial return operations

- [ ] 10. Final validation and documentation
  - Ensure all tests pass, ask the user if questions arise
  - Verify no duplicate code or dead functions remain
  - Confirm all requirements are met through testing
  - **Final Checkpoint**: Run `yarn lint && yarn type-check` for final validation

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and code quality
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Focus on enhancing existing components rather than creating new ones
- Maintain compatibility with existing pickup and lost item resolution systems

## Implementation Guidelines

### Code Quality Requirements
- Run `yarn lint && yarn type-check` after each major task completion
- Fix all linting and type errors before proceeding to next task
- Remove any dead code or unused functions immediately after creation
- Ensure no duplicate functionality is created

### Integration Points
- Reuse existing UnifiedReturnService architecture
- Extend SimpleReturnForm without breaking existing functionality
- Maintain compatibility with ActionButtonPanel patterns
- Follow established activity logging patterns from pickup system

### Testing Strategy
- Write property tests for universal business rules
- Write unit tests for specific edge cases and examples
- Test integration points between enhanced and existing components
- Verify data consistency and concurrent operation handling