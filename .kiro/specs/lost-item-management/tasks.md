# Implementation Plan - Lost Item Management System

## Overview

This implementation plan breaks down the Lost Item Management System into discrete, manageable tasks. Each task builds incrementally on previous work, with checkpoints to ensure system stability.

**Approach**: Keep It Simple - Minimal changes, maximum value  
**Estimated Total Time**: 4-6 hours  
**Testing**: Property-based tests for core logic, unit tests for edge cases

---

## Task List

- [x] 1. Database Schema Updates
  - Add lostQuantity field to ProductSize ✅
  - Add resolution tracking fields to TransaksiItemReturn ✅
  - Run migrations and verify schema changes ✅
  - _Requirements: 2.1, 6.1, 10.1, 10.2_

- [x] 1.1 Create Prisma migration for lostQuantity
  - Add `lostQuantity Int @default(0)` to ProductSize model ✅
  - Generate migration file ✅
  - Test migration on development database ✅
  - _Requirements: 2.1, 10.1_

- [x] 1.2 Create Prisma Push for resolution tracking
  - Add `resolutionStatus String?` to TransaksiItemReturn ✅
  - Add `resolutionDate DateTime?` to TransaksiItemReturn ✅
  - Add `resolutionNotes String?` to TransaksiItemReturn ✅
  - Add index on resolutionStatus ✅
  - _Requirements: 6.1, 10.2_

- [x] 1.3 Run migrations and verify
  - Execute migrations on development database ✅
  - Verify all fields created with correct defaults ✅
  - Test backward compatibility with existing data ✅
  - _Requirements: 10.3, 10.4_
  - NOTE: Run `npx prisma generate` manually if needed

- [x] 2. Fix HILANG Penalty Calculation Bug
  - Modify getConditionPenalty() to handle HILANG correctly ✅
  - Add HILANG check before other conditions ✅
  - Return manualPrice multiplied by totalQuantity ✅
  - Test penalty calculation with various manualPrice values ✅
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  - **Status**: COMPLETED - All tests passing (9/9)

- [x] 2.1 Add HILANG condition check and modify function signature
  - Add `totalQuantity` parameter to getConditionPenalty function ✅
  - Add check for `condition.conditionCategory === 'HILANG'` at start of function ✅
  - Return `(condition.manualPrice || 0) * totalQuantity` for HILANG ✅
  - Update all call sites to pass totalQuantity parameter ✅
  - Place check before manual pricing and BAIK checks ✅
  - _Requirements: 9.1, 9.3_
  - **Implementation**: Modified returnService.ts line 650-677, 690-696

- [x] 2.2 Verify HILANG penalty logic with quantity multiplication
  - Ensure HILANG uses manualPrice from user input ✅
  - Ensure HILANG multiplies manualPrice by totalQuantity (not jumlahKembali) ✅
  - Ensure modalAwal is only used as UI reference ✅
  - Test with 1 lost item: manualPrice × 1 ✅
  - Test with 2 lost items: manualPrice × 2 ✅
  - _Requirements: 9.1, 9.2, 9.3_
  - **Tests**: Created returnService.hilang.test.ts with 9 passing tests

- [ ]* 2.3 Write property test for HILANG penalty calculation
  - **Property 1: HILANG Penalty Equals manualPrice**
  - **Validates: Requirements 1.1, 9.1, 9.2**
  - Generate random HILANG conditions with various manualPrice values
  - Verify penalty equals manualPrice (not multiplied by jumlahKembali)
  - Run 100 iterations minimum

- [ ]* 2.4 Write unit tests for getConditionPenalty
  - Test HILANG returns manualPrice
  - Test HILANG with missing manualPrice returns 0
  - Test BAIK returns 0
  - Test RUSAK with manual pricing (manualPrice * jumlahKembali)
  - _Requirements: 9.1, 9.2_

- [ ] 2.5 Verify penalty payment records
  - Test that penalty payment includes correct manualPrice
  - Verify penaltyAmount field in return record
  - Check modalAwalUsed field is populated (for audit/reference)
  - _Requirements: 9.4, 9.5_

- [ ] 3. Add Lost Item Resolution Service Method
  - Create resolveLostItem() method in UnifiedReturnService
  - Implement customer replacement logic
  - Implement deposit retention logic
  - Add validation and error handling
  - _Requirements: 4.1-4.7, 5.1-5.7, 7.1-7.5_

- [ ] 3.1 Create resolveLostItem method structure
  - Define LostItemResolutionRequest interface
  - Define LostItemResolutionResult interface
  - Create method skeleton with validation
  - Add logging for resolution operations
  - _Requirements: 8.2_

- [ ] 3.2 Implement customer replacement resolution
  - Create refund payment (negative amount)
  - Update stock: rentedQuantity--, availableQuantity++
  - Update resolutionStatus to 'resolved_replaced'
  - Set resolutionDate to current timestamp
  - Wrap in transaction for atomicity
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ] 3.3 Implement deposit retention resolution
  - Keep deposit (no payment operation)
  - Update stock: rentedQuantity--, lostQuantity++
  - Update resolutionStatus to 'resolved_lost'
  - Set resolutionDate to current timestamp
  - Wrap in transaction for atomicity
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [ ] 3.4 Add validation logic
  - Validate return record exists
  - Validate conditionCategory is HILANG
  - Validate resolutionStatus is null (not already resolved)
  - Validate rentedQuantity >= 1
  - Throw descriptive errors for validation failures
  - _Requirements: 6.5_

- [ ]* 3.5 Write property test for customer replacement
  - **Property 4: Customer Replacement Stock Update**
  - **Validates: Requirements 4.2, 4.3, 4.4**
  - Generate random lost items
  - Resolve as customer_replaced
  - Verify rentedQuantity--, availableQuantity++, lostQuantity unchanged

- [ ]* 3.6 Write property test for deposit retention
  - **Property 5: Deposit Retention Stock Update**
  - **Validates: Requirements 5.2, 5.3, 5.4**
  - Generate random lost items
  - Resolve as deposit_kept
  - Verify rentedQuantity--, lostQuantity++, availableQuantity unchanged

- [ ]* 3.7 Write property test for refund amount
  - **Property 6: Refund Amount Equals Original Deposit**
  - **Validates: Requirements 4.1**
  - Generate random lost items with various deposits
  - Resolve as customer_replaced
  - Verify refund equals negative of original deposit

- [ ]* 3.8 Write property test for transaction atomicity
  - **Property 8: Transaction Atomicity**
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**
  - Inject failures at various transaction points
  - Verify complete rollback occurs
  - Verify no partial state persists

- [ ] 4. Checkpoint - Verify Core Service Logic
  - Ensure all tests pass
  - Verify HILANG penalty calculation works
  - Verify resolution methods work correctly
  - Test transaction rollback scenarios
  - Ask user if questions arise

- [ ] 5. Add InventoryService Method for Lost Items
  - Create updateStockOnLost() method
  - Implement stock update logic
  - Add error handling
  - _Requirements: 5.2, 5.3_

- [ ] 5.1 Create updateStockOnLost method
  - Add method to InventoryService
  - Update rentedQuantity (decrement)
  - Update lostQuantity (increment)
  - Use atomic Prisma operations
  - _Requirements: 5.2, 5.3_

- [ ]* 5.2 Write property test for inventory invariant
  - **Property 2: Inventory Invariant Preservation**
  - **Validates: Requirements 2.5**
  - Generate random stock operations
  - Verify originalQuantity = rented + lost + available always holds
  - Test with various operation sequences

- [ ]* 5.3 Write property test for lost item stock immutability
  - **Property 3: Lost Item Stock Immutability on Initial Return**
  - **Validates: Requirements 2.2**
  - Record stock before HILANG return
  - Process HILANG return
  - Verify rentedQuantity and availableQuantity unchanged

- [ ] 6. Create Lost Item Resolution Modal Component
  - Create LostItemResolutionModal.tsx
  - Implement simple 2-option form
  - Add confirmation dialog
  - Handle loading and error states
  - _Requirements: 3.2, 3.3, 3.4_

- [ ] 6.1 Create modal component structure
  - Create LostItemResolutionModal.tsx file
  - Define component props interface
  - Set up modal state management
  - Add modal open/close handlers
  - _Requirements: 3.2_

- [ ] 6.2 Implement lost items list display
  - Display list of unresolved lost items
  - Show product name, size info, deposit amount
  - Format currency values properly
  - Add item selection UI
  - _Requirements: 3.4_

- [ ] 6.3 Add resolution option selection
  - Add radio buttons for two options
  - Option 1: "Customer Beli Sendiri" (customer_replaced)
  - Option 2: "Ganti dengan Dana Jaminan" (deposit_kept)
  - Show description for each option
  - _Requirements: 3.3_

- [ ] 6.4 Implement resolution submission
  - Add confirm button
  - Call resolveLostItem API endpoint
  - Handle loading state during submission
  - Handle success and error responses
  - Show success/error toast messages
  - Close modal on success
  - _Requirements: 3.5_

- [ ] 6.5 Add cancel functionality
  - Add cancel button
  - Close modal without changes
  - Confirm cancellation if form is dirty
  - _Requirements: 3.2_

- [ ] 7. Update ActionButtonPanel Component
  - Add "Resolve Barang Hilang" button
  - Implement button visibility logic
  - Connect to LostItemResolutionModal
  - _Requirements: 3.1, 6.4_

- [ ] 7.1 Add unresolved lost items detection
  - Query transaction products for HILANG items
  - Check resolutionStatus is null
  - Set hasUnresolvedLostItems flag
  - _Requirements: 6.4_

- [ ]* 7.2 Write property test for unresolved items query
  - **Property 9: Unresolved Lost Items Query Accuracy**
  - **Validates: Requirements 6.4**
  - Generate transactions with mix of resolved/unresolved items
  - Verify query returns correct subset

- [ ] 7.3 Add resolve button to UI
  - Add button with Package icon
  - Show only when hasUnresolvedLostItems is true
  - Add click handler to open modal
  - Style consistently with other buttons
  - _Requirements: 3.1_

- [ ] 7.4 Connect modal to button
  - Add modal state management
  - Pass transaction and lost items to modal
  - Handle modal close and refresh data
  - _Requirements: 3.1_

- [ ] 8. Create API Endpoint for Lost Item Resolution
  - Create /api/kasir/transaksi/[id]/resolve-lost-item route
  - Implement POST handler
  - Add request validation
  - Call resolveLostItem service method
  - Return appropriate responses
  - _Requirements: 3.5, 7.1-7.5_

- [ ] 8.1 Create API route file
  - Create route.ts in appropriate directory
  - Set up POST handler
  - Add authentication check
  - Add request body validation
  - _Requirements: 3.5_

- [ ] 8.2 Implement resolution logic
  - Extract request parameters
  - Call UnifiedReturnService.resolveLostItem()
  - Handle success response
  - Handle error responses
  - Return appropriate HTTP status codes
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 8.3 Add error handling
  - Catch validation errors
  - Catch transaction errors
  - Return descriptive error messages
  - Log errors for debugging
  - _Requirements: 7.4, 7.5, 8.4_

- [ ] 9. Update Transaction Detail Hook
  - Modify useTransactionDetail to include resolution data
  - Add conditionBreakdown to product type
  - Add resolutionStatus to breakdown items
  - Ensure data transformation includes new fields
  - _Requirements: 6.4_

- [ ] 9.1 Update API response transformation
  - Include resolutionStatus in conditionBreakdown
  - Include resolutionDate if present
  - Map resolution data correctly
  - _Requirements: 6.4_

- [ ] 9.2 Update TypeScript interfaces
  - Add resolutionStatus to ConditionBreakdown type
  - Add resolutionDate to ConditionBreakdown type
  - Update TransactionDetail type
  - Ensure type safety throughout
  - _Requirements: 6.1_

- [ ] 10. Checkpoint - Verify UI Integration
  - Ensure all tests pass
  - Test button visibility logic
  - Test modal open/close
  - Test resolution submission
  - Verify data refresh after resolution
  - Ask user if questions arise

- [ ] 11. Add Activity Logging for Resolutions
  - Create activity records for resolution operations
  - Log resolution type and details
  - Include stock changes in activity data
  - _Requirements: 8.2, 8.3_

- [ ] 11.1 Create resolution activity record
  - Call createReturnActivity with resolution data
  - Include resolution type in description
  - Store stock changes in activity data
  - Log refund amount if applicable
  - _Requirements: 8.2_

- [ ] 11.2 Add comprehensive logging
  - Log resolution start
  - Log stock updates
  - Log payment operations
  - Log resolution completion
  - Log errors with context
  - _Requirements: 8.4, 8.5_

- [ ]* 12. Write Integration Tests
  - Test full flow: Return HILANG → Resolve
  - Test both resolution options
  - Test error scenarios
  - Verify data consistency

- [ ]* 12.1 Test customer replacement flow
  - Create transaction with HILANG item
  - Process return
  - Resolve as customer_replaced
  - Verify refund created
  - Verify stock updated correctly
  - _Requirements: 4.1-4.7_

- [ ]* 12.2 Test deposit retention flow
  - Create transaction with HILANG item
  - Process return
  - Resolve as deposit_kept
  - Verify no refund created
  - Verify lostQuantity incremented
  - _Requirements: 5.1-5.7_

- [ ]* 12.3 Test error scenarios
  - Test duplicate resolution attempt
  - Test resolution of non-HILANG item
  - Test resolution with insufficient stock
  - Verify appropriate errors returned
  - _Requirements: 6.5, 7.3, 7.4, 7.5_

- [ ]* 12.4 Test concurrent resolution attempts
  - Attempt to resolve same item twice simultaneously
  - Verify only one succeeds
  - Verify data consistency maintained
  - _Requirements: 6.5, 7.1_

- [ ]* 13. Write Property Test for Resolution Status Transition
  - **Property 7: Resolution Status Transition**
  - **Validates: Requirements 6.2, 6.3, 6.5**
  - Generate random lost items
  - Attempt multiple resolutions
  - Verify status transitions are valid and one-way

- [ ]* 14. Write Property Test for Deposit Calculation
  - **Property 10: Deposit Calculation Consistency**
  - **Validates: Requirements 1.1, 1.2**
  - Generate returns with various late days
  - Verify deposit = modalAwal + (lateDays > 0 ? 20000 : 0)

- [ ] 15. Final Checkpoint - Complete System Test
  - Run all unit tests
  - Run all property tests (100+ iterations each)
  - Run all integration tests
  - Test full user flow in development environment
  - Verify no regressions in existing functionality
  - Ensure all tests pass
  - Ask user if questions arise

- [ ] 16. Documentation and Cleanup
  - Update API documentation
  - Add JSDoc comments to new methods
  - Update README if needed
  - Clean up console.logs and debug code
  - _Requirements: 8.5_

- [ ] 16.1 Add JSDoc comments
  - Document resolveLostItem method
  - Document updateStockOnLost method
  - Document LostItemResolutionModal props
  - Include parameter descriptions and return types
  - _Requirements: 8.5_

- [ ] 16.2 Update API documentation
  - Document /api/kasir/transaksi/[id]/resolve-lost-item endpoint
  - Include request/response examples
  - Document error codes
  - _Requirements: 8.5_

---

## Task Execution Notes

### Testing Approach
- **Property-based tests** (marked with *) use fast-check library
- Each property test runs minimum 100 iterations
- Property tests tagged with feature name and property number
- Unit tests focus on specific examples and edge cases

### Checkpoint Strategy
- Checkpoint after core service logic (Task 4)
- Checkpoint after UI integration (Task 10)
- Final checkpoint before completion (Task 15)
- At each checkpoint: run all tests, verify functionality, ask user for feedback

### Optional Tasks
- Tasks marked with * are optional but recommended
- Property tests provide high confidence in correctness
- Integration tests catch real-world issues
- Can be skipped for faster MVP delivery

### Task Dependencies
- Tasks 1-2 can be done in parallel
- Task 3 depends on Task 2 (needs fixed penalty calculation)
- Tasks 6-7 depend on Task 3 (need service method)
- Task 8 depends on Task 3 (calls service method)
- Task 9 depends on Task 8 (needs API endpoint)
- Tasks 11-14 can be done in parallel after Task 10

### Estimated Time per Phase
- Phase 1 (Schema + Bug Fix): 1-2 hours
- Phase 2 (Service Layer): 1-2 hours
- Phase 3 (UI Layer): 1-2 hours
- Phase 4 (Testing + Docs): 1 hour

**Total**: 4-6 hours

---

**Implementation Plan Version**: 1.0  
**Date**: December 7, 2025  
**Status**: Ready for Execution  
**Approach**: Keep It Simple - Incremental, tested, production-ready
