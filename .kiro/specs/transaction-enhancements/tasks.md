# Implementation Tasks: Transaction Enhancements

## Overview

This document provides a step-by-step implementation plan for the transaction enhancements. Tasks are organized by priority and dependencies to ensure smooth development flow.

## Tasks

- [x] 1. Database Schema Updates
  - Update Prisma schema with new fields for discount (discountType, discountValue)
  - Apply database migration to add new columns
  - Leverage existing TransaksiItem.durasi field for duration functionality
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 2. Backend Service Layer Updates
  - [x] 2.1 Create price calculation utilities
    - Implement duration multiplier logic (4-day = 1x, 7-day = 1.5x)
    - Implement discount calculation (percent and nominal)
    - Create comprehensive price calculation method
    - _Requirements: 2.2, 2.3, 4.1, 4.2, 4.3_

  - [x] 2.2 Create date calculation utilities
    - Implement correct return date calculation (pickup + duration - 1)
    - Handle month boundary edge cases
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 2.3 Update validation schemas
    - Add discount type and value validation to Zod schemas
    - Add duration validation for UI (4 or 7 days only)
    - Add cross-field validation for discount consistency
    - Leverage existing TransaksiItem.durasi validation
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1_

- [ ]* 2.4 Write property tests for price calculations
  - **Property 1: Duration multiplier consistency**
  - **Validates: Requirements 2.2, 2.3**

- [ ]* 2.5 Write property tests for date calculations
  - **Property 2: Date calculation accuracy**
  - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 3. API Layer Updates
  - [x] 3.1 Update transaction creation endpoint
    - ✅ Enhanced existing `createTransaksiSizeAware` method (no duplicate code)
    - ✅ Accept new discount fields in request body
    - ✅ Integrate enhanced price calculation service
    - ✅ Store discount information in database
    - ✅ Use existing TransaksiItem.durasi for duration handling
    - ✅ Enhanced activity logging with discount details
    - _Requirements: 8.2, 8.3, 8.4, 1.6, 2.7_

  - [x] 3.2 Update transaction retrieval endpoints
    - ✅ Enhanced serializers to include discount information
    - ✅ Updated response formatter with discount fields
    - ✅ Maintain backward compatibility with existing API contracts
    - ✅ Calculate duration from existing TransaksiItem.durasi fields
    - _Requirements: 8.5, 8.7, 1.7, 9.2, 9.3_

- [ ]* 3.3 Write integration tests for API endpoints
  - Test transaction creation with discount and duration
  - Test transaction retrieval with new fields
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 4. Frontend UI Components
  - [x] 4.1 Create duration selector component
    - ✅ Added radio button group for 4-day vs 7-day packages
    - ✅ Display pricing information for each option (1x vs 1.5x multiplier)
    - ✅ Integrated with form state management
    - ✅ Real-time return date calculation
    - _Requirements: 2.1, 2.4, 6.1, 6.6_

  - [x] 4.2 Create discount input component
    - ✅ Added radio buttons for discount type selection (none/percent/nominal)
    - ✅ Added conditional input field based on discount type
    - ✅ Display discount savings calculation with real-time preview
    - ✅ Input validation with error messages
    - _Requirements: 1.1, 1.2, 1.3, 6.2, 6.3, 6.4_

  - [x] 4.3 Update payment summary display
    - ✅ Show price breakdown with subtotal and final total
    - ✅ Display duration multiplier effects on item prices
    - ✅ Show discount information when applied
    - ✅ Enhanced product list with duration-adjusted pricing
    - ✅ Real-time calculation updates
    - _Requirements: 1.4, 4.4, 6.5, 9.1, 9.4, 9.5_

- [ ]* 4.4 Write unit tests for UI components
  - Test duration selector interactions
  - Test discount input validation and calculations
  - Test payment summary display logic
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 5. Form Integration and State Management
  - [x] 5.1 Update form state structure
    - ✅ Added duration and discount fields to form data interface
    - ✅ Implemented state update handlers for new fields
    - ✅ Updated default values in initialFormData
    - _Requirements: 2.5, 2.6, 8.5_

  - [x] 5.2 Integrate real-time calculations
    - ✅ Recalculate prices when duration changes
    - ✅ Recalculate totals when discount changes
    - ✅ Update return date when pickup date or duration changes
    - ✅ Enhanced calculateTotal function with PriceCalculator
    - _Requirements: 2.5, 2.6, 4.5, 4.6, 3.5, 3.6_

  - [x] 5.3 Add form validation
    - ✅ Validate discount values (percent 0-100, nominal not exceeding subtotal)
    - ✅ Prevent negative final totals
    - ✅ Display clear error messages for invalid inputs
    - ✅ Real-time validation feedback
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 1.5, 4.7_

- [ ]* 5.4 Write property tests for form validation
  - **Property 3: Discount validation consistency**
  - **Validates: Requirements 7.1, 7.2, 7.3**

- [ ] 6. Integration and End-to-End Testing
  - [ ] 6.1 Wire all components together
    - Connect duration selector to price calculations
    - Connect discount input to total calculations
    - Ensure all form fields work together seamlessly
    - _Requirements: 2.7, 4.7, 6.7_

  - [ ] 6.2 Update transaction detail views
    - Display duration package information
    - Show discount details when applicable
    - Format all monetary values consistently
    - _Requirements: 9.1, 9.2, 9.3, 9.6, 9.7_

- [ ]* 6.3 Write end-to-end tests
  - Test complete transaction flow with discounts
  - Test complete transaction flow with different durations
  - Test edge cases and error scenarios
  - _Requirements: All requirements integration_

- [ ] 7. Final validation and cleanup
  - Ensure all tests pass and functionality works correctly
  - Verify backward compatibility with existing transactions
  - Ask user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Database changes should be applied first to avoid dependency issues
- Frontend components depend on backend service layer completion
- Integration testing should be done after all components are implemented