# Implementation Plan: Cancel Transaction Refund

## Overview

Implementasi automatic refund integration untuk cancel transaction system menggunakan pattern yang sudah terbukti dari Lost Item Resolution. Fokus pada simplicity, consistency, dan backward compatibility.

## Tasks

- [x] 1. Enhance TransaksiService for Refund Processing
  - Add kasirId parameter to TransaksiService constructor
  - Implement processAutomaticRefund private method
  - Integrate refund processing into updateTransaksiStatus method
  - _Requirements: 1.1, 2.1-2.5, 3.1-3.5, 4.1-4.5, 5.1-5.4, 6.1-6.4_

- [x] 1.1 Write property test for refund detection
  - **Property 1: Refund Detection Accuracy**
  - **Validates: Requirements 1.1**

- [x] 1.2 Write property test for atomic processing
  - **Property 2: Atomic Refund Processing**
  - **Validates: Requirements 6.1, 6.2**

- [x] 1.3 Write property test for amount consistency
  - **Property 3: Refund Amount Consistency**
  - **Validates: Requirements 2.3, 3.3**

- [x] 2. Create Kasir Selection UI Components
  - Add kasir selection dropdown to CancelModal
  - Implement kasir list fetching from API
  - Add kasir validation before form submission
  - Follow same pattern as LostItemResolutionModal
  - _Requirements: 5.1-5.4_

- [x] 2.1 Write unit tests for kasir selection UI
  - Test kasir list fetching from API
  - Test kasir selection validation
  - Test error handling for API failures
  - _Requirements: 5.2, 5.3_

- [x] 3. Update API Route for Manual Kasir Selection
  - Modify PUT handler in transaksi/[kode]/route.ts
  - Accept kasirId from request body (frontend selection)
  - Remove automatic kasir lookup logic
  - Add validation for required kasirId parameter
  - _Requirements: 5.1-5.4_

- [ ]* 3.1 Write integration tests for API route
  - Test successful refund processing via API
  - Test kasir validation in API flow
  - Test error responses for missing kasir
  - _Requirements: 5.1-5.4_

- [x] 4. Enhance UI Components for Refund Status
  - Update CancelledActivityDisplay component
  - Add refund completion status display
  - Add backward compatibility for old activity logs
  - Implement conditional rendering for refund status
  - _Requirements: 7.1-7.5, 9.1-9.4_

- [ ]* 4.1 Write property test for activity log completeness
  - **Property 4: Activity Log Completeness**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [ ]* 4.2 Write property test for backward compatibility
  - **Property 7: Backward Compatibility**
  - **Validates: Requirements 9.1, 9.2, 9.4**

- [x] 5. Add Error Handling and Recovery
  - Implement comprehensive error logging
  - Add graceful degradation for refund failures
  - Ensure transaction cancellation succeeds even if refund fails
  - Add error information to activity logs
  - _Requirements: 8.1-8.5_

- [ ]* 5.1 Write property test for error recovery
  - **Property 6: Error Recovery**
  - **Validates: Requirements 8.4, 8.5**

- [ ]* 5.2 Write unit tests for error scenarios
  - Test kasir validation failures
  - Test database transaction rollback
  - Test error logging functionality
  - _Requirements: 8.1-8.3_

- [x] 6. Update Type Definitions
  - Add new fields to CancelActivityData interface
  - Update activity log type definitions
  - Add refund-related type exports
  - Ensure type safety across components
  - _Requirements: 4.1-4.5, 7.1-7.5_

- [ ] 7. Checkpoint - Core Functionality Complete
  - Ensure all refund processing tests pass
  - Verify UI displays refund status correctly
  - Test error handling and recovery
  - Ask the user if questions arise.

- [ ]* 7.1 Write integration tests for complete flow
  - Test end-to-end cancel transaction with refund
  - Test UI display of refund completion
  - Test database consistency across all tables
  - _Requirements: All requirements_

- [ ] 8. Add Expense Category Support
  - Ensure 'Refund Pembatalan Transaksi' category is supported
  - Update expense validation to accept new category
  - Test expense record creation with new category
  - _Requirements: 3.2_

- [ ]* 8.1 Write unit tests for expense category
  - Test expense record creation with refund category
  - Test category validation
  - Test expense record structure
  - _Requirements: 3.1-3.5_

- [ ] 9. Performance and Security Review
  - Review database transaction performance
  - Validate security of refund processing
  - Ensure proper audit trail logging
  - Test concurrent cancellation scenarios
  - _Requirements: 6.1-6.4, 8.1-8.5_

- [ ]* 9.1 Write property test for kasir validation
  - **Property 5: Kasir Validation**
  - **Validates: Requirements 5.2, 5.3**

- [ ] 10. Final Integration and Testing
  - Test complete cancel transaction flow with refund
  - Verify backward compatibility with existing data
  - Test error scenarios and recovery
  - Ensure UI displays correct refund status
  - _Requirements: All requirements_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests ensure end-to-end functionality
- Focus on reusing existing patterns from Lost Item Resolution system
- Maintain backward compatibility with existing cancelled transactions