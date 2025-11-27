# Implementation Plan

## Overview
This implementation plan focuses on integrating transaction activity timeline and ProductSize information into the existing product history feature. The tasks are organized to build incrementally, starting with backend data layer enhancements, then service layer integration, and finally frontend component updates.

---

## Tasks

- [x] 1. Enhance backend types and interfaces for activity and size data
  - Add new TypeScript interfaces for ActivityInfo, ActivityMetadata, SizeInfo to productHistory types
  - Extend ProductHistoryItem interface with optional activities and sizeInfo fields
  - Extend ProductHistoryRawResult interface with kondisiAwal and activities fields
  - Update RawActivityData interface to match AktivitasTransaksi schema
  - _Requirements: 5.1, 5.2, 8.1, 8.3_

- [x] 2. Implement size information parsing utility
  - [x] 2.1 Create parseSizeInfo function in ProductHistoryService
    - Parse kondisiAwal format: "productSizeId|size|ageCategory|condition"
    - Handle invalid formats gracefully (return null)
    - Generate displayText: "Size: {size} ({ageCategory})"
    - Add error logging for malformed data
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 2.2 Write property test for size parsing
    - **Property 26: Size information parsing**
    - **Validates: Requirements 7.1, 7.2**
    - Generate random valid kondisiAwal strings
    - Verify all four components are extracted correctly
    - Test invalid formats return null
    - _Requirements: 7.1, 7.2_

  - [ ]* 2.3 Write unit tests for size parsing edge cases
    - Test null input
    - Test empty string
    - Test partial format (only 2 parts)
    - Test missing required fields
    - Test extra parts (more than 4)
    - _Requirements: 7.4_

- [x] 3. Enhance ProductHistoryService to query activities
  - [x] 3.1 Update executeHistoryQuery to join AktivitasTransaksi
    - Add aktivitas include to Prisma query
    - Order activities by createdAt DESC
    - Handle query failures gracefully (fallback to basic data)
    - Leverage existing indexes for performance
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

  - [x] 3.2 Add kondisiAwal to query selection
    - Include kondisiAwal field in TransaksiItem selection
    - Ensure field is available for size parsing
    - _Requirements: 7.1_

  - [ ]* 3.3 Write unit tests for enhanced query
    - Test activities are included in results
    - Test kondisiAwal is present
    - Test query handles missing activities
    - Test fallback behavior on query failure
    - _Requirements: 4.2, 5.3_

- [x] 4. Implement activity metadata filtering by role
  - [x] 4.1 Create maskActivityMetadata function
    - Filter customer-identifiable data for producer/kasir roles
    - Preserve all metadata for owner role
    - Handle null/undefined metadata gracefully
    - _Requirements: 1.5, 2.1, 3.1, 3.2_

  - [x] 4.2 Create activity type label mapping
    - Map 'dibuat' → 'Transaksi Dibuat'
    - Map 'dibatalkan' → 'Transaksi Dibatalkan'
    - Map 'dikembalikan' → 'Barang Dikembalikan'
    - Map 'terlambat' → 'Terlambat'
    - Map 'diperbarui' → 'Status Diperbarui'
    - _Requirements: 5.4, 8.1_

  - [ ]* 4.3 Write property test for producer role masking
    - **Property 2: Producer role customer data masking**
    - **Validates: Requirements 1.2**
    - Generate random customer data
    - Verify names are masked (first name + last initial)
    - Verify contacts are masked (first 3 + **** + last 3)
    - _Requirements: 1.2, 1.5_

  - [ ]* 4.4 Write property test for owner role unmasked data
    - **Property 11: Owner role unmasked data**
    - **Validates: Requirements 3.1**
    - Generate random customer data
    - Verify owner role sees unmasked data
    - _Requirements: 3.1_

  - [ ]* 4.5 Write unit tests for metadata filtering
    - Test producer role filters sensitive fields
    - Test kasir role filters sensitive fields
    - Test owner role preserves all fields
    - Test null metadata handling
    - _Requirements: 1.5, 2.1, 3.2_

- [x] 5. Transform activity data in ProductHistoryService
  - [x] 5.1 Create transformActivityData function
    - Transform RawActivityData to ActivityInfo
    - Apply role-based metadata filtering
    - Add typeLabel from mapping
    - Format timestamps as ISO 8601
    - _Requirements: 1.3, 8.1, 8.2, 8.5_

  - [x] 5.2 Update transformHistoryResults to include activities
    - Call transformActivityData for each activity
    - Call parseSizeInfo for kondisiAwal
    - Add activities and sizeInfo to ProductHistoryItem
    - Maintain backward compatibility (optional fields)
    - _Requirements: 5.1, 5.2, 7.3_

  - [x] 5.3 Implement synthetic activity generation for legacy data
    - Detect transactions without activities
    - Generate synthetic "dibuat" activity from transaction data
    - Use transaction createdAt as activity timestamp
    - _Requirements: 5.5_

  - [ ]* 5.4 Write property test for activity chronological ordering
    - **Property 4: Activity chronological ordering**
    - **Validates: Requirements 1.4**
    - Generate random activities with different timestamps
    - Verify activities are ordered by createdAt DESC
    - _Requirements: 1.4_

  - [ ]* 5.5 Write property test for activity structure completeness
    - **Property 3: Activity structure completeness**
    - **Validates: Requirements 1.3**
    - Generate random activities
    - Verify all required fields are present (type, description, createdAt, createdBy)
    - _Requirements: 1.3_

  - [ ]* 5.6 Write unit tests for activity transformation
    - Test activity type label mapping
    - Test ISO 8601 timestamp formatting
    - Test metadata filtering by role
    - Test synthetic activity generation
    - _Requirements: 5.4, 5.5, 8.1, 8.2_

- [x] 6. Update API response formatting
  - [x] 6.1 Enhance response formatter in route handler
    - Include activities array in response
    - Include sizeInfo in response
    - Ensure backward compatibility (existing fields preserved)
    - Format monetary values as numbers
    - _Requirements: 5.1, 5.2, 8.4_

  - [ ]* 6.2 Write integration tests for API endpoint
    - Test response includes activities for owner role
    - Test response includes sizeInfo when available
    - Test backward compatibility (existing fields present)
    - Test role-based data masking
    - _Requirements: 5.1, 5.2, 1.2, 3.1_

- [x] 7. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Update frontend types for activity and size display
  - [ ] 8.1 Add ActivityInfo and SizeInfo to frontend types
    - Import types from backend productHistory types
    - Create TimelineItemProps with enhanced ProductHistoryItem
    - Create ActivityBadgeProps for activity display component
    - Create SizeDisplayProps for size display component
    - _Requirements: 9.1, 9.2_

  - [ ] 8.2 Update ProductHistoryCard component imports
    - Import new types
    - Update TimelineItem props interface
    - _Requirements: 9.1_

- [ ] 9. Create ActivityBadge component for timeline
  - [ ] 9.1 Implement ActivityBadge component
    - Display activity typeLabel with icon
    - Show activity description
    - Format timestamp in user-friendly format
    - Support compact mode for inline display
    - _Requirements: 9.1, 9.3, 9.4_

  - [ ] 9.2 Add activity type icon mapping
    - 'dibuat' → Plus icon
    - 'dibatalkan' → X icon
    - 'dikembalikan' → CheckCircle icon
    - 'terlambat' → AlertCircle icon
    - 'diperbarui' → RefreshCw icon
    - _Requirements: 9.4_

  - [ ]* 9.3 Write component tests for ActivityBadge
    - Test renders activity type label
    - Test renders activity description
    - Test renders formatted timestamp
    - Test compact mode styling
    - _Requirements: 9.1, 9.4_

- [ ] 10. Create SizeDisplay component for timeline
  - [ ] 10.1 Implement SizeDisplay component
    - Display size information using displayText
    - Show size badge with appropriate styling
    - Handle missing sizeInfo gracefully (hide component)
    - Support compact mode for inline display
    - _Requirements: 9.2, 9.5_

  - [ ]* 10.2 Write component tests for SizeDisplay
    - Test renders size displayText
    - Test hides when sizeInfo is null
    - Test compact mode styling
    - _Requirements: 9.2, 9.5_

- [ ] 11. Update TimelineItem component to display activities and size
  - [ ] 11.1 Enhance TimelineItem to show activity information
    - Display most relevant activity using ActivityBadge
    - Show activity metadata in expandable section
    - Maintain existing transaction data display
    - _Requirements: 9.1, 9.3, 9.4_

  - [ ] 11.2 Add size information display to TimelineItem
    - Display SizeDisplay component when sizeInfo is available
    - Position size info near item quantity
    - Handle missing size info gracefully
    - _Requirements: 9.2, 9.5_

  - [ ]* 11.3 Write component tests for enhanced TimelineItem
    - Test displays activity badge
    - Test displays size information
    - Test handles missing activities gracefully
    - Test handles missing size info gracefully
    - _Requirements: 9.1, 9.2, 9.5_

- [ ] 12. Update ProductHistoryCard to handle new data structure
  - [ ] 12.1 Update data mapping in ProductHistoryCard
    - Pass activities to TimelineItem
    - Pass sizeInfo to TimelineItem
    - Maintain existing functionality
    - _Requirements: 9.1, 9.2_

  - [ ]* 12.2 Write integration tests for ProductHistoryCard
    - Test renders timeline with activities
    - Test renders timeline with size info
    - Test handles missing activities
    - Test handles missing size info
    - _Requirements: 9.1, 9.2, 9.5_

- [ ] 13. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Manual testing and validation
  - [ ] 14.1 Test with producer role
    - Verify customer data is masked
    - Verify activities are displayed
    - Verify size info is shown
    - _Requirements: 1.1, 1.2, 7.3_

  - [ ] 14.2 Test with kasir role
    - Verify customer data is masked
    - Verify kasir assignment is shown
    - Verify activities are displayed
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 14.3 Test with owner role
    - Verify customer data is unmasked
    - Verify all metadata is shown
    - Verify complete activity timeline
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 14.4 Test backward compatibility
    - Verify existing API clients still work
    - Verify optional fields don't break UI
    - Verify graceful degradation without activities
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 14.5 Test performance with large datasets
    - Verify query performance with 100+ transactions
    - Verify pagination works correctly
    - Verify no N+1 query issues
    - _Requirements: 4.1, 4.2, 4.4_
