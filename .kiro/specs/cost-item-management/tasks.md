# Implementation Plan: Cost Item Management System

## Overview

This implementation plan transforms the Material system into a flexible Cost Item Management system through three phases: foundation building, product integration, and cleanup. Each phase includes checkpoints for type checking and linting validation.

## Tasks

- [x] 1. Database Foundation and Models
  - Create CostItem and ProductCost Prisma models
  - Generate and run database migrations
  - Update database schema with proper indexes
  - _Requirements: 3.1, 3.5_

- [ ]* 1.1 Write property test for database model creation
  - **Property 1: Cost Item CRUD Operations Integrity**
  - **Validates: Requirements 1.1**

- [x] 2. Core Service Layer Implementation
  - [x] 2.1 Implement CostItemService with CRUD operations
    - Create, read, update, delete operations
    - Business logic for validation and constraints
    - _Requirements: 1.1, 1.2, 1.5_

  - [x] 2.2 Write property tests for CostItemService
    - **Property 2: Cost Item Creation with Name Only**
    - **Property 5: Deletion Prevention for Used Cost Items**
    - **Property 21: Cost Item Name Uniqueness**
    - **Validates: Requirements 1.2, 1.5, 6.1**

  - [x] 2.3 Implement ProductCostService for cost management
    - Add, update, remove product costs
    - Modal awal calculation logic
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 2.4 Write property tests for ProductCostService
    - **Property 9: Modal Awal Sum Calculation**
    - **Property 8: Modal Awal Automatic Recalculation**
    - **Validates: Requirements 2.4, 2.3, 2.5**

- [x] 3. Checkpoint - Core Services Validation
  - Run `yarn type-check` to ensure TypeScript compliance
  - Run `yarn lint` to validate code quality
  - Ensure all tests pass, ask the user if questions arise

- [x] 4. API Layer Implementation
  - [x] 4.1 Create cost item API endpoints
    - GET, POST, PUT, DELETE endpoints for cost items
    - Request/response validation schemas
    - _Requirements: 4.1, 4.2, 4.5_


  - [x] 4.3 Create product cost API endpoints
    - Endpoints for managing product-cost relationships
    - Modal awal calculation endpoints
    - _Requirements: 4.1, 4.3, 4.4_


- [x] 5. Validation and Schema Implementation
  - [x] 5.1 Create validation schemas for cost items
    - Zod schemas for create/update requests
    - Input validation and error handling
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

  - [ ]* 5.2 Write property tests for validation
    - **Property 22: Positive Amount Validation**
    - **Property 23: Name Content Validation**
    - **Property 24: Name Length Validation**
    - **Validates: Requirements 6.2, 6.4, 6.5**

- [x] 6. Checkpoint - API and Validation
  - Run `yarn type-check` to ensure TypeScript compliance
  - Run `yarn lint` to validate code quality
  - Ensure all tests pass, ask the user if questions arise

- [x] 7. UI Components Implementation
  - [x] 7.1 Create CostItemSelector component
    - Searchable dropdown for cost item selection
    - Add/remove multiple cost items functionality
    - Real-time modal awal calculation display
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

  - [ ]* 7.2 Write property tests for CostItemSelector
    - **Property 17: Cost Item Search in Dropdown**
    - **Property 20: Add/Remove Cost Item Operations**
    - **Validates: Requirements 5.2, 5.5**

  - [x] 7.3 Create cost item management pages
    - List page with pagination and search
    - Create/edit forms for cost items
    - Delete confirmation with usage checking
    - _Requirements: 1.3, 1.4, 5.1_

  - [ ]* 7.4 Write property tests for UI components
    - **Property 3: Case-Insensitive Search**
    - **Property 4: Pagination Consistency**
    - **Validates: Requirements 1.3, 1.4**

- [x] 8. Currency Formatting and Display
  - [x] 8.1 Implement currency formatting utilities
    - Consistent currency display across components
    - Real-time formatting for amount inputs
    - _Requirements: 5.3, 5.4_

  - [ ]* 8.2 Write property tests for currency formatting
    - **Property 18: Currency Formatting Consistency**
    - **Property 19: Real-time Modal Awal Display**
    - **Validates: Requirements 5.3, 5.4**

- [x] 9. Checkpoint - UI Implementation
  - Run `yarn type-check` to ensure TypeScript compliance
  - Run `yarn lint` to validate code quality
  - Ensure all tests pass, ask the user if questions arise

- [x] 9.1 Replace Material Management with Cost Item Management
  - [x] Update TabNavigation to use 'cost-item' instead of 'material' tab
  - [x] Create CostItemManagement wrapper component
  - [x] Update ProductManagementPage to use CostItemManagement
  - [x] Create new route for cost-items management
  - [x] Improve UX with modal-based create/edit instead of separate pages
  - [x] Update route structure to use generic 'kelola-data' path
  - _Requirements: 3.3, 3.4_

- [x] 10. Product Form Integration
  - [x] 10.1 Update ProductForm to use CostItemSelector
    - Replace MaterialSelector with CostItemSelector
    - Integrate modal awal auto-calculation
    - Update form validation and submission
    - _Requirements: 2.3, 2.4, 2.5_

  - [ ]* 10.2 Write property tests for product form integration
    - **Property 6: Multiple Cost Items Per Product**
    - **Property 7: Decimal Amount Acceptance**
    - **Validates: Requirements 2.1, 2.2**

  - [x] 10.3 Update ProductService integration
    - Modify product creation/update to handle cost items
    - Ensure modal awal calculation in product operations
    - _Requirements: 2.1, 2.4_

- [ ] 11. Migration Implementation
  - [ ] 11.1 Create Material to CostItem migration script
    - Migrate existing Material data to CostItem
    - Preserve material names and relationships
    - _Requirements: 3.1, 3.2_

  - [ ]* 11.2 Write property tests for migration
    - **Property 10: Material to Cost Item Migration Integrity**
    - **Property 11: Material Name Preservation**
    - **Property 12: Migration Data Integrity**
    - **Validates: Requirements 3.1, 3.2, 3.5**

  - [ ] 11.3 Execute migration and verify data integrity
    - Run migration script on development database
    - Verify all data migrated correctly
    - _Requirements: 3.5_

- [ ] 12. Checkpoint - Migration Validation
  - Run `yarn type-check` to ensure TypeScript compliance
  - Run `yarn lint` to validate code quality
  - Ensure all tests pass, ask the user if questions arise

- [ ] 13. Cleanup and Code Removal
  - [ ] 13.1 Remove Material model and related code
    - Delete Material Prisma model
    - Remove MaterialService and related files
    - Clean up unused imports and references
    - _Requirements: 3.3, 3.4_

  - [ ] 13.2 Remove MaterialSelector component
    - Delete MaterialSelector component file
    - Remove material-related utilities
    - Update any remaining references
    - _Requirements: 3.3, 3.4_

  - [ ] 13.3 Clean up database schema
    - Remove material-related columns from Product model
    - Drop material table and indexes
    - _Requirements: 3.3_

- [ ] 14. Error Handling and Logging
  - [ ] 14.1 Implement comprehensive error handling
    - Add proper error logging throughout system
    - Ensure consistent error response formats
    - _Requirements: 4.3, 4.4, 7.5_

  - [ ]* 14.2 Write property tests for error handling
    - **Property 25: Error Logging Consistency**
    - **Validates: Requirements 7.5**

- [ ] 15. Final Validation and Testing
  - [ ] 15.1 Run comprehensive test suite
    - Execute all unit and property tests
    - Verify integration between all components
    - _Requirements: 7.1, 7.2_

  - [ ] 15.2 Perform end-to-end validation
    - Test complete cost item management workflow
    - Verify modal awal calculation accuracy
    - Test product form integration

- [ ] 16. Final Checkpoint - Complete System Validation
  - Run `yarn type-check` to ensure TypeScript compliance
  - Run `yarn lint` to validate code quality
  - Ensure all tests pass and system is fully functional
  - Verify no dead functions or duplicate code remain

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and code quality
- Property tests validate universal correctness properties
- Migration preserves existing data while enabling new functionality
- Cleanup phase removes all Material-related code to prevent confusion