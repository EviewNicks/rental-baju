# Implementation Plan: Role-based Expense Management

## Overview

This implementation plan converts the role-based expense management design into discrete coding tasks. The approach focuses on incremental development using kasirId-based filtering for visibility (kasir users see kasirId != "owner-system", owner users see all) and createdBy-based permissions for edit/delete operations. The system leverages a special "Owner" kasir account (kasirId: "owner-system") for owner expenses.

## Tasks

- [ ] 1. Set up role detection utilities and API enhancements
  - Create role detection utilities for Clerk integration
  - Enhance API route to support kasirId-based filtering
  - Update DanaSummaryService with kasirId-based methods
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 1.1 Create role detection utilities
  - Write `utils/roleDetection.ts` with getUserRole and getUsersByRole functions
  - Implement Clerk user metadata extraction and validation
  - Add error handling for invalid or missing roles
  - _Requirements: 6.1, 6.4_

- [ ]* 1.2 Write property test for role detection
  - **Property 11: API Role Detection**
  - **Validates: Requirements 6.1, 6.4**

- [ ] 1.3 Enhance API route with kasirId-based parameters
  - Update `/api/kasir/dana-summary/route.ts` to extract user role from Clerk
  - Add optional roleFilter query parameter validation
  - Implement kasirId-based authorization checks
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ]* 1.4 Write property test for API data filtering
  - **Property 12: API Data Filtering**
  - **Validates: Requirements 6.2, 6.3**

- [ ] 1.5 Update DanaSummaryService with kasirId-based methods
  - Add role-based parameters to getDailySummary, getExpenseList, and getDailyData
  - Implement buildKasirIdBasedWhereClause private method for kasirId filtering
  - Add isOwnerExpense utility method to check kasirId = "owner-system"
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 1.6 Write property test for role-based summary calculations
  - **Property 9: Role-based Summary Calculations**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [ ] 2. Checkpoint - Ensure backend role functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Create RoleFilter component and enhance ExpenseList
  - Build new RoleFilter dropdown component
  - Update ExpenseList component with kasirId-based functionality
  - Implement role-based permission logic for edit/delete buttons
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.3_

- [ ] 3.1 Create RoleFilter component
  - Write `components/RoleFilter.tsx` with dropdown for Semua/Kasir/Owner options
  - Implement proper styling and accessibility features
  - Add loading and disabled states
  - _Requirements: 4.3, 4.4, 4.5_

- [ ]* 3.2 Write property test for role filter functionality
  - **Property 7: Owner Role Filter Functionality**
  - **Validates: Requirements 4.3, 4.4, 4.5**

- [ ] 3.3 Enhance ExpenseList component with kasirId-based features
  - Add userRole, onRoleFilterChange, and selectedRoleFilter props
  - Integrate RoleFilter component in header (owner only)
  - Update expense count display to reflect filtered results
  - Implement role-based edit/delete button visibility using kasirId and createdBy checks
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 7.1, 7.3_

- [ ]* 3.4 Write property test for role-based permissions
  - **Property 6: Role-based Edit Permissions**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

- [ ]* 3.5 Write property test for UI count consistency
  - **Property 13: UI Count Consistency**
  - **Validates: Requirements 7.3**

- [ ] 4. Update DanaKasirDashboard with role-based state management
  - Add role detection and role filter state to dashboard
  - Implement role filter persistence logic
  - Update useDanaSummary hook calls with role parameters
  - _Requirements: 4.7, 2.1, 2.2_

- [ ] 4.1 Enhance DanaKasirDashboard with role state
  - Add selectedRoleFilter state and role detection logic
  - Implement handleRoleFilterChange with persistence rules
  - Update data fetching calls to include role parameters
  - _Requirements: 4.7, 2.1, 2.2_

- [ ]* 4.2 Write property test for role filter state persistence
  - **Property 8: Role Filter State Persistence**
  - **Validates: Requirements 4.7**

- [ ]* 4.3 Write property test for role-based expense visibility
  - **Property 3: Role-based Expense Visibility**
  - **Validates: Requirements 2.1, 2.2**

- [ ] 5. Update useDanaSummary hook with role-based parameters
  - Modify hook to accept and pass role-based parameters
  - Update React Query cache keys to include role information
  - Ensure proper cache invalidation for role changes
  - _Requirements: 2.1, 2.2, 4.3, 4.4, 4.5_

- [ ] 5.1 Enhance useDanaSummary hook
  - Add roleFilter parameter to hook signature
  - Update API call to include role-based query parameters
  - Modify React Query cache keys for role-specific caching
  - _Requirements: 2.1, 2.2, 4.3, 4.4, 4.5_

- [ ]* 5.2 Write property test for combined filter behavior
  - **Property 5: Combined Filter Behavior**
  - **Validates: Requirements 2.5**

- [ ] 6. Checkpoint - Ensure frontend integration works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement expense creation role tracking
  - Update PengeluaranForm to track creator role
  - Ensure createdBy field is properly set during expense creation
  - Add visual role indicator to expense form
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6_

- [ ] 7.1 Update expense creation with kasirId-based role tracking
  - Modify expense creation API to set createdBy with current user's Clerk ID
  - Ensure Owner users automatically use kasirId = "owner-system" for their expenses
  - Ensure Kasir users can select from available kasir accounts (excluding "owner-system")
  - Add simple role indicator to PengeluaranForm component
  - Ensure all expense categories remain available to both roles
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6_

- [ ]* 7.2 Write property test for expense creation integrity
  - **Property 1: Expense Creation Integrity**
  - **Validates: Requirements 1.1, 1.2, 1.6**

- [ ]* 7.3 Write property test for category access equality
  - **Property 2: Category Access Equality**
  - **Validates: Requirements 1.5**

- [ ] 8. Implement backward compatibility and legacy data handling
  - Add graceful handling for existing expenses without clear role attribution
  - Ensure existing API endpoints maintain their response formats
  - Preserve existing kasir filter functionality for income data
  - _Requirements: 8.1, 8.2, 8.3, 2.4, 5.5_

- [ ] 8.1 Implement legacy data handling with kasirId-based approach
  - Add graceful handling for existing expenses by treating kasirId != "owner-system" as kasir expenses
  - Implement graceful error handling for role detection failures
  - Ensure backward compatibility with existing API contracts
  - Verify Owner_Kasir_Account ("owner-system") exists in kasir table
  - _Requirements: 8.1, 8.2, 8.6_

- [ ]* 8.2 Write property test for graceful legacy handling
  - **Property 15: Graceful Legacy Handling**
  - **Validates: Requirements 8.1**

- [ ]* 8.3 Write property test for API backward compatibility
  - **Property 16: API Backward Compatibility**
  - **Validates: Requirements 8.2**

- [ ]* 8.4 Write property test for income filter preservation
  - **Property 4: Income Filter Preservation**
  - **Validates: Requirements 2.4, 8.3**

- [ ]* 8.5 Write property test for income calculation preservation
  - **Property 10: Income Calculation Preservation**
  - **Validates: Requirements 5.5**

- [ ]* 8.6 Write property test for feature preservation
  - **Property 14: Feature Preservation**
  - **Validates: Requirements 7.4**

- [ ] 9. Final integration and testing
  - Wire all components together for end-to-end functionality
  - Test complete user workflows for both kasir and owner roles
  - Verify role-based permissions across all operations
  - _Requirements: All requirements integration_

- [ ] 9.1 Complete system integration
  - Ensure all components work together seamlessly
  - Test role transitions and filter interactions
  - Verify permission enforcement across all user actions
  - _Requirements: All requirements_

- [ ] 9.2 End-to-end workflow testing with kasirId-based system
  - Test complete kasir user workflow (create with regular kasirId, view only kasirId != "owner-system", edit/delete own expenses)
  - Test complete owner user workflow (create with kasirId = "owner-system", view all expenses, filter by role, edit/delete own expenses)
  - Verify role-based summary calculations exclude/include owner expenses correctly
  - Test Owner_Kasir_Account integration and visibility
  - _Requirements: All requirements_

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript throughout for type safety
- Role detection leverages existing Clerk authentication infrastructure
- No database schema changes are required - uses existing kasirId and createdBy fields
- System uses kasirId-based filtering for visibility and createdBy for ownership/permissions
- Owner expenses use special kasirId = "owner-system" from Owner_Kasir_Account