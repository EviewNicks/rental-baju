# Implementation Plan: Jas-Sarung Pairing System

## Overview

This implementation plan creates a jas-sarung pairing system that allows customers to rent jas (jacket) products with free sarung accessories. The system uses a modal-based approach for sarung selection and integrates seamlessly with existing cart, payment, and receipt systems while maintaining full backward compatibility.

## Tasks

- [x] 1. Extend type definitions and create utility functions
  - Add linkedSarung field to ProductSelection interface
  - Create LinkedSarung type definition and jas detection utility types
  - Implement jas detection and sarung filtering functions
  - Add pairing validation functions and comprehensive unit tests
  - _Requirements: 8.1, 8.2, 1.1, 1.3_
  - **Checkpoint**: Run `yarn lint && yarn type-check` to ensure code quality

- [ ]* 1.1 Write property test for jas detection logic
  - **Property 1: Jas Product Detection Accuracy**
  - **Validates: Requirements 1.1, 1.3**

- [ ]* 1.2 Write property test for sarung filtering logic
  - **Property 2: Sarung Product Filtering**
  - **Validates: Requirements 2.2, 2.3**

- [x] 2. Update price calculator for pairing logic
  - Add pairing-aware price calculation methods
  - Ensure linked sarung prices are always excluded from totals
  - Update existing calculation methods to handle pairings
  - Add unit tests for pairing price scenarios
  - _Requirements: 3.1, 3.3, 3.5_
  - **Checkpoint**: Run `yarn lint && yarn type-check` to ensure code quality

- [ ]* 2.1 Write property test for pairing price calculation
  - **Property 3: Free Sarung Pricing Logic**
  - **Validates: Requirements 3.1, 3.3**

- [x] 3. Create SarungSelectionModal component
  - Create modal component structure using existing Dialog components
  - Implement sarung product display using existing ProductCard components
  - Add "Tanpa Sarung" option as primary button
  - Implement independent modal state management (z-index: 50)
  - Pass through onOpenHistory prop for ProductHistoryPopup integration (z-index: 60)
  - Add loading and error states with existing design system styling
  - _Requirements: 2.1, 2.2, 2.4, 2.7_
  - **Checkpoint**: Run `yarn lint && yarn type-check` to ensure code quality

- [ ]* 3.1 Write property test for modal state independence
  - **Property 4: Modal State Independence**
  - **Validates: Requirements 2.1, 2.7**

- [x] 4. Create SarungPairingIndicator component
  - Create pairing display component with "→ dengan Sarung [Name]" format
  - Add "GRATIS" price display with strikethrough original price
  - Style for cart and payment summary contexts
  - Ensure accessible design with proper ARIA labels
  - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2_
  - **Checkpoint**: Run `yarn lint && yarn type-check` to ensure code quality

- [x] 5. Modify ProductCard component for jas detection
  - Add jas detection logic and modify "Add to Cart" button behavior
  - Update button text for jas products ("Pilih dengan Sarung")
  - Ensure backward compatibility for non-jas products
  - Maintain existing ProductHistoryPopup integration in all contexts
  - Support usage within both main grid and SarungSelectionModal
  - _Requirements: 1.1, 1.2, 1.4, 2.1_
  - **Checkpoint**: Run `yarn lint && yarn type-check` to ensure code quality

- [ ]* 5.1 Write property test for button behavior
  - **Property 5: Jas Product Button Behavior**
  - **Validates: Requirements 1.1, 1.2**

- [x] 6. Update ProductSelectionStep for modal integration
  - Integrate SarungSelectionModal with independent modal state management
  - Implement unified onOpenHistory handler for both main grid and modal contexts
  - Add sarung selection handler and update cart addition logic for pairings
  - Add error handling for modal failures with fallback options
  - Update cart display for pairings with visual indicators
  - _Requirements: 2.1, 2.7, 4.1, 4.5, 9.1, 9.4_
  - **Checkpoint**: Run `yarn lint && yarn type-check` to ensure code quality

- [ ]* 6.1 Write property test for pairing relationship creation
  - **Property 6: Pairing Relationship Creation**
  - **Validates: Requirements 2.7, 4.1**

- [x] 7. Update cart management for pairings
  - Update cart item display to show pairing relationships clearly
  - Implement linked removal (removing jas removes sarung)
  - Handle quantity adjustments for paired items
  - Update cart summary calculations to exclude sarung prices
  - Add pairing indicators to cart UI
  - _Requirements: 4.1, 4.2, 4.4, 4.5, 3.3_
  - **Checkpoint**: Run `yarn lint && yarn type-check` to ensure code quality

- [ ]* 7.1 Write property test for linked removal logic
  - **Property 7: Linked Item Removal**
  - **Validates: Requirements 4.4, 4.5**

- [x] 8. Update PaymentSummaryStep component
  - Add pairing display in product list with visual indicators
  - Show sarung as "GRATIS" in breakdown with visual indication
  - Update price calculation display to exclude sarung amounts
  - Ensure receipt preview accuracy matches final receipt format
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - **Checkpoint**: Run `yarn lint && yarn type-check` to ensure code quality

- [ ]* 8.1 Write property test for payment summary calculations
  - **Property 8: Payment Summary Price Exclusion**
  - **Validates: Requirements 5.3, 5.5**

- [x] 9. Implement inventory management for pairings
  - Update transaction creation to handle both jas and sarung items
  - Ensure both jas and sarung inventory are properly reduced
  - Handle atomic transaction processing with rollback mechanisms
  - Update transaction item creation for pairing relationships
  - _Requirements: 7.1, 7.2, 7.3, 7.5, 8.4_
  - **Checkpoint**: Run `yarn lint && yarn type-check` to ensure code quality

- [ ]* 9.1 Write property test for inventory reduction
  - **Property 9: Dual Inventory Management**
  - **Validates: Requirements 7.1, 7.2**

- [x] 10. Update Professional Receipt Service
  - Add "Kode Jas" and "Kode Sarung" columns to table structure
  - Update table column widths for new layout (reduce other columns proportionally)
  - Implement receipt data processing for pairings
  - Add jas/sarung code extraction logic with various pairing scenarios
  - Test receipt generation and validate professional appearance
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - **Checkpoint**: Run `yarn lint && yarn type-check` to ensure code quality

- [ ]* 10.1 Write property test for receipt data processing
  - **Property 10: Receipt Code Extraction Accuracy**
  - **Validates: Requirements 6.2, 6.3**

- [x] 11. Implement comprehensive error handling
  - Add sarung availability validation and modal failure handling
  - Create inventory validation checks and user-friendly error messages untuk non-it
  - Implement retry mechanisms and graceful degradation
  - Add error logging for debugging and fallback options
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  - **Checkpoint**: Run `yarn lint && yarn type-check` to ensure code quality

- [ ]* 11.1 Write property test for error handling scenarios
  - **Property 11: Error Recovery Mechanisms**
  - **Validates: Requirements 9.1, 9.4**

- [x] 12. Add input validation and security measures
  - Validate sarung selection inputs and enforce quantity limits
  - Verify product categories and add client-side validation
  - Implement server-side validation for security considerations
  - Ensure form submission blocked for invalid data
  - _Requirements: 9.2, 9.3, 10.1, 10.2_
  - **Checkpoint**: Run `yarn lint && yarn type-check` to ensure code quality

- [x] 13. Final code quality assurance and cleanup
  - Run yarn lint and fix all issues, resolve yarn type-check errors
  - Remove any dead code or unused functions created during development
  - Optimize imports and dependencies, ensure consistent code formatting
  - Verify no duplicate functionality and optimal performance maintained
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  - **Checkpoint**: Run `yarn lint && yarn type-check` for final validation

- [x] 14. Manual testing and integration validation
  - Test complete jas-sarung selection workflow end-to-end
  - Verify ProductHistoryPopup works from both main grid and sarung modal
  - Test various pairing scenarios (with/without sarung)
  - Validate receipt generation accuracy and professional appearance
  - Ensure all requirements are met through comprehensive testing
  - **Final Checkpoint**: Ensure all tests pass, ask the user if questions arise

- [x] 16. Implement configurable category system for future-proof pairing
  - ✅ Create configuration file for eligible categories management
  - ✅ Implement generic pairing service with extension points
  - ✅ Replace hardcoded category arrays with configurable system
  - ✅ Add support for future categories (gamis, etc.) without code changes
  - ✅ Update all detection logic to use configuration-driven approach
  - ✅ Update TransaksiService.ts to use configurable jas detection
  - ✅ Update professionalReceiptService.ts to use configurable system
  - ✅ Update sarungValidation.ts to use dynamic category validation
  - ✅ Update sarungPairingErrors.ts to use configurable detection
  - ✅ Remove all hardcoded category detection logic
  - ✅ Pass yarn lint and yarn type-check validation
  - _Requirements: 10.1, 10.2 (Maintainability & Future-proof)_
  - **Checkpoint**: ✅ Run `yarn lint && yarn type-check` to ensure code quality

- [x] 17. Fix validation system context confusion (CRITICAL BUG FIX)
  - ✅ Identify root cause of "Kategori produk tidak diizinkan: anting" error
  - ✅ Analyze validation system blocking non-jas products from cart
  - ✅ Implement context-aware validation with validateCategoryForPairing parameter
  - ✅ Update validateProductData() to support both general and pairing validation
  - ✅ Update function calls to use appropriate validation context
  - ✅ Ensure backward compatibility for all existing product categories
  - ✅ Maintain security for pairing operations while allowing general operations
  - ✅ Test all product categories can be added to cart normally
  - ✅ Verify pairing validation still works for jas-sarung operations
  - ✅ Pass yarn lint and yarn type-check validation
  - _Requirements: 9.2, 9.3, 10.1 (Backward Compatibility & Validation)_
  - **Checkpoint**: ✅ Run `yarn lint && yarn type-check` to ensure code quality
  - **Critical**: This fixes blocking issue preventing normal product workflow

- [x] 18. Implement Enhanced Modal with Quantity Distribution
  - ✅ Enhance existing SarungSelectionModal with quantity distribution capability
  - ✅ Add SarungDistribution interface and state management for multiple sarung selections
  - ✅ Update ProductCard integration to support dynamic quantity selection
  - ✅ Create DistributionPreview component showing breakdown of jas-sarung distribution
  - ✅ Update handleSarungSelection to support quantity distribution logic
  - ✅ Enhance confirmation logic to process multiple cart additions in one action
  - ✅ Add validation for total quantity limits and distribution consistency
  - ✅ Update modal UI/UX for better quantity distribution display
  - ✅ Ensure backward compatibility with existing simple pairing (1:1) scenarios
  - ✅ Update ProductSelectionStep to handle array of cart additions
  - ✅ Pass yarn lint and yarn type-check validation
  - _Requirements: 2.6, 4.1, 4.5, 9.2, 10.1, 10.2_
  - **Checkpoint**: ✅ Run `yarn lint && yarn type-check` to ensure code quality

- [ ]* 18.1 Write property test for quantity distribution logic
  - **Property 12: Quantity Distribution Consistency**
  - **Validates: Requirements 2.6, 4.1**

- [ ]* 18.2 Write property test for multiple cart addition logic
  - **Property 13: Multiple Cart Addition Accuracy**
  - **Validates: Requirements 4.1, 4.5**

- [x] 19. Implement Transaction Detail Pairing Display Enhancement
  - ✅ Update API response structure to include linkedSarung data in transaction items
  - ✅ Enhance TransactionDetailPage to display jas-sarung pairing relationships
  - ✅ Update ProductDetailCard component to show pairing indicators
  - ✅ Add SarungPairingIndicator integration in transaction detail view
  - ✅ Update response formatter to handle pairing data transformation
  - ✅ Ensure consistency between cart, payment summary, and transaction detail displays
  - ✅ Add pairing information to public ProductDetailPage for jas eligibility
  - ✅ Update transaction service to include pairing data in queries
  - ✅ Test API response includes correct linkedSarung structure
  - ✅ Verify transaction detail shows pairing relationships correctly
  - _Requirements: 4.1, 4.2, 5.1, 6.2, 8.4_
  - **Checkpoint**: ✅ Run `yarn lint && yarn type-check` to ensure code quality

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and code quality
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
- Focus on reusing existing components (ProductCard, Dialog) for consistency
- Maintain 100% backward compatibility with existing functionality

## Implementation Guidelines

### Modal Conflict Resolution
- Use completely independent state management for SarungSelectionModal and ProductHistoryPopup
- Implement proper z-index layering (sarung modal: z-50, history popup: z-60)
- Use single onOpenHistory handler for both main grid and modal contexts
- Test modal interactions thoroughly to ensure both can be open simultaneously
- Provide graceful fallback mechanisms (direct jas addition) if modal conflicts occur

### Code Quality Requirements
- Run `yarn lint && yarn type-check` after each task completion
- Fix all linting and type errors before proceeding to next task
- Remove any dead code or unused functions immediately after creation
- Ensure no duplicate functionality is created
- Follow existing code patterns and architectural decisions

### Integration Points
- Reuse existing ProductCard component for consistent UX
- Extend existing ProductSelection interface without breaking changes
- Maintain compatibility with current cart and payment workflows
- Follow established transaction item structure for both jas and sarung
- Preserve existing receipt format for non-jas items

### Testing Strategy
- Write property tests for universal business rules (pairing logic, pricing)
- Write unit tests for specific edge cases and examples
- Test integration points between new and existing components
- Verify modal interactions and state management
- Test receipt generation accuracy with various scenarios