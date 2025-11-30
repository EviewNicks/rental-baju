# Implementation Plan

- [-] 1. Fix PickupModal race condition and performance issues
  - Remove conflicting useEffect hooks that cause race conditions
  - Simplify success state handling to single coordinated timeout
  - Remove unnecessary reset() call from handleClose to prevent cache invalidation
  - Ensure modal closes within 2 seconds of successful pickup
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 1.1 Write property test for modal closure timing
  - **Property 1: Modal closure timing**
  - **Validates: Requirements 1.1, 1.4**

- [ ]* 1.2 Write property test for no cache resets
  - **Property 2: No unnecessary cache resets**
  - **Validates: Requirements 1.2, 6.1**

- [ ] 2. Enhance PickupService activity data with product details
  - Fetch TransaksiItem with product join to get name and code
  - Fetch Transaksi with kasir join to get nama field
  - Include productName, productCode, and kondisiAwal in activity data
  - Add processedByName field with kasir nama to activity data
  - Update activity description to use product names instead of generic "item"
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.4, 4.1, 4.2, 4.3_

- [ ]* 2.1 Write property test for activity data completeness
  - **Property 3: Activity data completeness**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [ ]* 2.2 Write property test for user attribution
  - **Property 5: User attribution**
  - **Validates: Requirements 3.1, 3.2, 3.4**

- [ ]* 2.3 Write property test for description clarity
  - **Property 6: Description clarity**
  - **Validates: Requirements 4.1, 4.2, 4.5**

- [ ] 3. Remove unnecessary activity logs
  - Remove status_pickup activity log creation
  - Remove status_changed activity log creation (keep only status field update)
  - Ensure only one "diambil" activity log is created per pickup
  - Remove pickup statistics logging that clutters timeline
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 3.1 Write property test for activity log minimalism
  - **Property 7: Activity log minimalism**
  - **Validates: Requirements 5.1, 5.2, 5.3**

- [ ] 4. Enhance ActivityTimeline pickup display
  - Create parseKondisiAwal helper function to extract size, age category, and condition
  - Update PickupActivityDisplay to show product name with size and age category
  - Display kasir name (processedByName) instead of user ID when available
  - Format pickup items as "[Product Name] ([Size] - [Age Category]) - [Quantity] unit diambil"
  - Show pickup note in dedicated section if provided
  - _Requirements: 2.2, 2.3, 2.4, 3.2, 3.3, 4.5_

- [ ]* 4.1 Write property test for size parsing
  - **Property 4: Size information parsing**
  - **Validates: Requirements 2.2, 2.3**

- [ ]* 4.2 Write unit tests for PickupActivityDisplay component
  - Test product name display
  - Test size information display
  - Test kasir name display with fallback
  - Test pickup note display
  - _Requirements: 2.1, 2.2, 2.3, 3.2, 3.3_

- [ ] 5. Optimize cache management in usePickupProcess
  - Remove reset() call from modal close handler
  - Implement targeted cache invalidation for transaction detail only
  - Add cache state verification before proceeding after sync
  - Ensure cancelled operations preserve cache state
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [ ]* 5.1 Write unit tests for cache management
  - Test no reset() on modal close
  - Test targeted invalidation
  - Test cache preservation on cancel
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 6. Improve error handling and recovery
  - Implement error type classification (network, database, conflict, validation, permission)
  - Create specific error messages for each error type
  - Add actionable recovery buttons (retry, refresh, cancel)
  - Provide helpful tips for each error type
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 6.1 Write property test for error message specificity
  - **Property 9: Error message specificity**
  - **Validates: Requirements 7.1, 7.2, 7.3**

- [ ]* 6.2 Write unit tests for error handling
  - Test error classification
  - Test error message generation
  - Test recovery action display
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 8. Implement optimistic UI updates (optional enhancement)
  - Add onMutate handler to immediately update cache with expected changes
  - Update jumlahDiambil values optimistically for selected items
  - Implement onError rollback to restore previous cache state
  - Verify optimistic updates provide instant UI feedback
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 8.1 Write property test for optimistic updates
  - **Property 10: Optimistic cache updates**
  - **Validates: Requirements 8.1, 8.2**

- [ ]* 8.2 Write property test for rollback on error
  - **Property 8: Optimistic update rollback**
  - **Validates: Requirements 6.4, 8.4**

- [ ]* 8.3 Write integration tests for optimistic update flow
  - Test immediate cache update
  - Test server data replacement
  - Test error rollback
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 9. Final checkpoint - Verify complete pickup flow
  - Ensure all tests pass, ask the user if questions arise.
