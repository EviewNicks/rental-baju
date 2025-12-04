# Implementation Plan: Return Penalty Integration & Activity Logging Enhancement

## Overview

This implementation plan transforms the return service to use unified activity logging, integrates penalty payments with dana kasir, and enhances penalty visibility across the application. The plan is structured in 3 phases with incremental progress and proper testing at each stage.

---

## Phase 1: Core Service Layer Changes

- [x] 1. Database Schema Migration
  - Create Prisma migration for Pembayaran table extension
  - Add `penaltyBreakdown` JSONB column (nullable)
  - Add composite index on (metode, createdAt)
  - Test migration on development database
  - _Requirements: 5.1, 5.2, 5.4_

- [x] 1.1 Create migration file
  - Generate Prisma migration with `npx prisma push db `
  - Verify migration SQL includes column addition and index creation
  - _Requirements: 5.1, 5.2_

- [x] 1.2 Test migration rollback
  - Test migration down/rollback functionality
  - Verify data integrity after rollback
  - _Requirements: 5.5_

- [x] 2. Enhance Return Service - Unified Activity
  - Modify `processBackgroundActivities()` method in returnService.ts
  - Create `buildUnifiedActivityData()` helper method
  - Remove separate penalty_added activity creation
  - Remove separate status change activity creation
  - Include full item breakdown with conditions
  - Include processing metadata
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2.1 Create UnifiedActivityData builder
  - Implement `buildUnifiedActivityData()` method
  - Extract summary data from penalty calculation
  - Build items array with product info and size details
  - Build conditions array for each item
  - Add processing metadata
  - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [ ]* 2.2 Write property test for unified activity creation
  - **Property 1: Single Activity Creation**
  - **Validates: Requirements 1.1**
  - Generate random return requests
  - Process returns and verify exactly one activity created
  - Verify activity type is 'dikembalikan'

- [ ]* 2.3 Write property test for activity data completeness
  - **Property 2: Activity Data Completeness**
  - **Validates: Requirements 1.2**
  - Generate random returns with various penalties
  - Verify all summary fields present in activity.data
  - Verify field values match penalty calculation

- [ ]* 2.4 Write property test for item breakdown
  - **Property 3: Item Breakdown Completeness**
  - **Validates: Requirements 1.3**
  - Generate returns with multiple items
  - Verify items array length matches return items count
  - Verify each item has all required fields

- [ ]* 2.5 Write property test for no duplicate activities
  - **Property 6: No Duplicate Activities**
  - **Validates: Requirements 1.6**
  - Process returns and query for penalty_added activities
  - Verify zero penalty_added or status_changed activities exist

- [x] 3. Add Penalty Payment Creation
  - Add `createPenaltyPayment()` method to returnService.ts
  - Create Pembayaran record with metode='penalty'
  - Build penaltyBreakdown JSON structure
  - Include in main transaction scope for atomicity
  - Handle zero penalty case (skip payment creation)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 3.1 Implement penalty payment builder
  - Create `buildPenaltyPaymentData()` helper method
  - Extract late penalty and condition penalty from calculation
  - Build itemPenalties array with detailed breakdown
  - Format catatan with penalty summary
  - _Requirements: 2.2, 2.3, 2.4_

- [x] 3.2 Integrate payment creation in transaction
  - Add payment creation to main $transaction block
  - Place after stock updates but before activity logging
  - Add conditional check for totalPenalty > 0
  - _Requirements: 2.1, 2.5, 2.6_

- [ ]* 3.3 Write property test for penalty payment creation
  - **Property 7: Penalty Payment Creation**
  - **Validates: Requirements 2.1**
  - Generate returns with penalties > 0
  - Verify Pembayaran record created with metode='penalty'
  - Verify payment amount matches calculated penalty

- [ ]* 3.4 Write property test for payment amount accuracy
  - **Property 8: Payment Amount Accuracy**
  - **Validates: Requirements 2.2**
  - Generate returns with various penalty amounts
  - Verify payment.jumlah equals penaltyCalculation.totalPenalty

- [ ]* 3.5 Write property test for zero penalty no payment
  - **Property 10: Zero Penalty No Payment**
  - **Validates: Requirements 2.5**
  - Generate returns with zero penalty
  - Verify no Pembayaran record with metode='penalty' created

- [ ]* 3.6 Write property test for transaction atomicity
  - **Property 11: Transaction Atomicity**
  - **Validates: Requirements 2.6, 2.7**
  - Mock payment creation to fail
  - Verify entire transaction rolls back
  - Verify no return records or activities created

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 2: Dana Kasir Integration

- [x] 5. Update Dana Summary Service
  - Modify `getDailySummary()` to include penalty payments
  - Add penalty payment aggregation query
  - Update totalIncome calculation formula
  - _Requirements: 3.1, 3.2, 3.7_

- [x] 5.1 Add penalty payment aggregation
  - Query TransaksiItem.totalReturnPenalty sum for date range
  - Use tglKembali for date filtering instead of createdAt
  - Add to existing income calculation
  - _Requirements: 3.2, 3.5_

- [ ]* 5.2 Write property test for dana summary includes penalties
  - **Property 12: Dana Summary Includes Penalties**
  - **Validates: Requirements 3.1**
  - Create test data with penalty payments
  - Calculate summary for date
  - Verify totalIncome includes penalty amounts

- [ ]* 5.3 Write property test for income calculation formula
  - **Property 13: Income Calculation Formula**
  - **Validates: Requirements 3.2**
  - Create test data with known values
  - Verify totalIncome = sum(jumlahBayar) + sum(flatLatePenalty) + sum(totalReturnPenalty)

- [ ]* 5.4 Write property test for net balance calculation
  - **Property 16: Net Balance Calculation**
  - **Validates: Requirements 3.7**
  - Create test data with income and expenses
  - Verify netBalance = (rental + penalty) - expenses

- [x] 6. Enhance Income List with Penalty Entries
  - Modify `getIncomeList()` to query penalty payments
  - Add penalty payment entries to income list
  - Include penaltyBreakdown in response
  - Sort combined list by date
  - _Requirements: 3.3, 3.4, 3.6_

- [x] 6.1 Query penalty payments
  - Add Pembayaran query with metode='penalty' filter
  - Include transaction and penyewa relations
  - Filter by date range using tglKembali
  - _Requirements: 3.3, 3.5_

- [x] 6.2 Build penalty income entries
  - Map penalty payments to EnhancedIncomeItem format
  - Set type='penalty'
  - Extract penaltyBreakdown from payment
  - Include latePenalty and conditionPenalty
  - _Requirements: 3.4, 3.6_

- [ ]* 6.3 Write property test for penalty income list inclusion
  - **Property 14: Penalty Income List Inclusion**
  - **Validates: Requirements 3.3**
  - Create test data with penalty payments
  - Query income list for date
  - Verify entries with type='penalty' exist

- [ ]* 6.4 Write property test for penalty income fields
  - **Property 15: Penalty Income Fields**
  - **Validates: Requirements 3.4**
  - Query income list with penalty entries
  - Verify each penalty entry has required fields
  - Verify penaltyBreakdown structure

- [x] 7. Update Dana Kasir Dashboard UI
  - Modify DanaKasirDashboard component to display penalty income
  - Add penalty income section in income list
  - Show penalty breakdown on expand/hover
  - Add visual distinction for penalty entries
  - _Requirements: 3.6_

- [x] 7.1 Add penalty income display
  - Create PenaltyIncomeItem component
  - Display penalty icon and amount
  - Show latePenalty and conditionPenalty breakdown
  - Add tooltip with detailed breakdown
  - _Requirements: 3.6_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 3: Product History Enhancement

- [ ] 9. Update Product History API
  - Modify product history query to include penalty data
  - Extract penalty information from TransaksiItem
  - Build penalty breakdown from TransaksiItemReturn
  - Handle transactions without penalty gracefully
  - _Requirements: 4.1, 4.2, 4.3, 4.7_

- [ ] 9.1 Enhance product history query
  - Include TransaksiItem.totalReturnPenalty in query
  - Include TransaksiItemReturn records with conditions
  - Calculate late penalty from transaction dates
  - _Requirements: 4.1, 4.2_

- [ ] 9.2 Build penalty data structure
  - Create `buildPenaltyData()` helper method
  - Calculate penalty.total, penalty.late, penalty.condition
  - Build penalty.breakdown array from return conditions
  - Handle null/missing data gracefully
  - _Requirements: 4.2, 4.3, 4.7_

- [ ]* 9.3 Write property test for product history penalty inclusion
  - **Property 17: Product History Penalty Inclusion**
  - **Validates: Requirements 4.1, 4.2**
  - Create test transactions with penalties
  - Query product history
  - Verify penalty data included with correct amounts

- [ ]* 9.4 Write property test for penalty breakdown in history
  - **Property 18: Penalty Breakdown in History**
  - **Validates: Requirements 4.3**
  - Create test transactions with multiple conditions
  - Query product history
  - Verify breakdown array has all conditions

- [ ]* 9.5 Write property test for graceful null handling
  - **Property 19: Graceful Null Handling**
  - **Validates: Requirements 4.7**
  - Query history for transactions without penalty
  - Verify no errors thrown
  - Verify penalty field is null or undefined

- [ ] 10. Update Product History UI
  - Modify ProductHistoryCard component to display penalty
  - Add penalty section in TimelineItem
  - Show penalty breakdown on expand
  - Add visual indicator for transactions with penalty
  - _Requirements: 4.4, 4.5, 4.6_

- [ ] 10.1 Create penalty display component
  - Create PenaltyBadge component for timeline
  - Show total penalty amount
  - Add red/orange color coding
  - Display breakdown on hover/click
  - _Requirements: 4.4, 4.6_

- [ ] 10.2 Update TimelineItem component
  - Add conditional penalty section
  - Display penalty badge if penalty exists
  - Show late penalty and condition penalty separately
  - List condition-specific penalties
  - _Requirements: 4.5, 4.6_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 4: Backward Compatibility & Testing

- [ ] 12. Implement Backward Compatibility
  - Add legacy activity format handler
  - Update dana summary to include old flatLatePenalty
  - Handle product history for old transactions
  - Test with existing production data
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 12.1 Create legacy activity display handler
  - Detect old activity format
  - Extract available information
  - Display with appropriate fallbacks
  - _Requirements: 6.2_

- [ ]* 12.2 Write property test for backward compatibility
  - **Property 20: Backward Compatibility**
  - **Validates: Requirements 6.2**
  - Create test data with old activity format
  - Display activities
  - Verify no errors thrown

- [ ]* 12.3 Write property test for mixed data calculation
  - **Property 21: Mixed Data Calculation**
  - **Validates: Requirements 6.3**
  - Create test data with old and new penalty formats
  - Calculate dana summary
  - Verify both included in totalIncome

- [ ] 13. Performance Optimization
  - Add database indexes for penalty queries
  - Optimize dana summary aggregation
  - Add caching for product history
  - Measure and verify performance targets
  - _Requirements: 7.1, 7.3, 7.4, 7.5_

- [ ] 13.1 Add query optimization
  - Create composite indexes for common queries
  - Use database aggregation instead of application logic
  - Add pagination to product history
  - _Requirements: 7.3, 7.4_

- [ ]* 13.2 Write property test for activity creation performance
  - **Property 22: Activity Creation Performance**
  - **Validates: Requirements 7.1**
  - Measure activity creation time
  - Verify completion within 100ms

- [ ]* 13.3 Write property test for performance regression
  - **Property 23: Performance Regression Limit**
  - **Validates: Requirements 7.5**
  - Measure processing time with and without penalty
  - Verify increase is less than 10%

- [ ] 14. Error Handling Enhancement
  - Implement proper rollback for penalty failures
  - Add non-fatal activity logging
  - Validate penalty breakdown structure
  - Add graceful degradation for dana summary
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.7_

- [ ]* 14.1 Write property test for error rollback
  - **Property 24: Error Rollback**
  - **Validates: Requirements 8.1**
  - Simulate penalty calculation failure
  - Verify entire transaction rolled back

- [ ]* 14.2 Write property test for non-fatal activity logging
  - **Property 25: Non-Fatal Activity Logging**
  - **Validates: Requirements 8.3**
  - Simulate activity logging failure
  - Verify return transaction completes successfully

- [ ]* 14.3 Write property test for penalty breakdown validation
  - **Property 26: Penalty Breakdown Validation**
  - **Validates: Requirements 8.4**
  - Attempt to store invalid penalty breakdown
  - Verify validation error thrown

- [ ]* 14.4 Write property test for graceful degradation
  - **Property 27: Graceful Degradation**
  - **Validates: Requirements 8.5**
  - Simulate dana summary calculation failure
  - Verify partial data returned with error indicator

- [ ]* 14.5 Write property test for corrupted data handling
  - **Property 28: Corrupted Data Handling**
  - **Validates: Requirements 8.7**
  - Create corrupted penalty data
  - Verify system handles gracefully without crashing

- [ ] 15. Final Checkpoint - Comprehensive Testing
  - Run all unit tests
  - Run all property tests (100 iterations each)
  - Run integration tests
  - Perform manual testing on staging
  - Verify all 28 correctness properties pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Each phase builds incrementally on the previous phase
- Property tests marked with * are optional but highly recommended
- All property tests should run 100 iterations minimum
- Each property test must include comment tag with property number
- Checkpoint tasks ensure stability before moving to next phase
- Backward compatibility is critical - no data migration required
- Performance targets must be met before production deployment
