# Payment Method Improvement - Requirements

## Functional Requirements

### FR-1: Payment Method Structure
**Priority:** High
**Description:** Implement 2-level payment method selection

#### FR-1.1: Primary Categories
- **TUNAI**: Direct cash payment (no sub-options)
- **BANK**: Electronic payment methods (with sub-options)

#### FR-1.2: Bank Sub-Options
When user selects "BANK", show 4 sub-options:
- **BCA**: Bank Central Asia
- **BRI**: Bank Rakyat Indonesia  
- **MANDIRI**: Bank Mandiri
- **QRIS**: QR Code payment system

#### FR-1.3: Data Storage
- Store specific method in database: `tunai`, `bca`, `bri`, `mandiri`, `qris`
- Maintain backward compatibility with existing data

### FR-2: UI/UX Requirements
**Priority:** High
**Description:** Simplified payment form interface

#### FR-2.1: Transaction Creation Form
- Show 2-level radio button selection
- Primary level: Tunai vs Bank
- Secondary level: Bank sub-options (conditional)
- Remove reference number field completely

#### FR-2.2: Payment Modal (Additional Payments)
- Same 2-level selection structure
- Remove reference number input
- Maintain payment amount and notes fields

#### FR-2.3: Visual Design
- Clear visual hierarchy between primary and secondary options
- Consistent styling with existing form components
- Responsive design for mobile devices

### FR-3: Data Validation
**Priority:** High
**Description:** Update validation rules for new payment structure

#### FR-3.1: Schema Validation
- Update Zod schemas to accept new enum values
- Remove reference field validation requirements
- Maintain existing validation for amount and notes

#### FR-3.2: Business Logic Validation
- Ensure payment method is selected
- Validate payment amounts (existing logic)
- No additional validation needed for specific bank methods

### FR-4: Display and Receipt Logic
**Priority:** Medium
**Description:** Update display logic for receipts and UI

#### FR-4.1: Receipt Generation
- Map all bank methods to "Transfer" in receipts
- Keep "Tunai" as-is for cash payments
- Update both thermal and professional receipt services

#### FR-4.2: Transaction Display
- Show specific bank name in transaction details
- Map to generic "Transfer" in summary views
- Maintain consistency across all UI components

### FR-5: Backward Compatibility
**Priority:** High
**Description:** Ensure existing data remains functional

#### FR-5.1: Data Mapping
- Map existing `transfer` → `bca` (default bank)
- Map existing `kartu` → `qris`
- Handle display of legacy data appropriately

#### FR-5.2: API Compatibility
- Accept both old and new payment method values
- Return appropriate responses for both formats
- Maintain existing API contracts

## Non-Functional Requirements

### NFR-1: Performance
- Payment form rendering should remain under 100ms
- No impact on payment processing performance
- Maintain existing caching strategies

### NFR-2: Usability
- Reduce payment form completion time by 20%
- Eliminate user confusion about reference numbers
- Maintain accessibility standards (WCAG 2.1 AA)

### NFR-3: Reliability
- 100% backward compatibility with existing transactions
- No data loss during transition
- Maintain existing error handling robustness

### NFR-4: Maintainability
- Clear separation between UI and business logic
- Consistent naming conventions
- Comprehensive test coverage (>90%)

## Technical Requirements

### TR-1: Schema Updates
**Files:** `features/kasir/lib/validation/kasirSchema.ts`
- Update `metodeBayar` enum: `['tunai', 'bca', 'bri', 'mandiri', 'qris']`
- Update `metode` enum in payment schema
- Remove `referensi` field validation requirements

### TR-2: Type Definitions
**Files:** `features/kasir/types.ts`, `features/kasir/types/index.ts`
- Update `PaymentMethod` type definitions
- Update UI mapping types
- Maintain compatibility with existing interfaces

### TR-3: UI Components
**Files:** Multiple component files
- `PaymentForm.tsx`: Remove reference field, add 2-level selection
- `PaymentModal.tsx`: Update form interface
- `PaymentSummaryStep.tsx`: Update method selection UI

### TR-4: Configuration Updates
**Files:** `features/kasir/lib/constants/workflowConfig.ts`
- Update payment methods configuration
- Add bank-specific options with appropriate labels
- Update icons and visual elements

### TR-5: Service Layer Updates
**Files:** Receipt and display services
- Update `receiptService.ts` display mapping
- Update `professionalReceiptService.ts` display mapping
- Update `useTransactionDetail.ts` method mapping

### TR-6: Test Updates
**Files:** All test files using payment methods
- Update test data to use new payment method values
- Update UI test selectors and expectations
- Add tests for new 2-level selection behavior

## Acceptance Criteria

### AC-1: Payment Method Selection
- [ ] User can select "Tunai" for cash payments
- [ ] User can select "Bank" to see sub-options
- [ ] Bank sub-options show: BCA, BRI, Mandiri, QRIS
- [ ] Selection is saved correctly in database
- [ ] No reference field is shown or required

### AC-2: Transaction Creation
- [ ] New transactions can be created with new payment methods
- [ ] Payment amounts are calculated correctly
- [ ] Transaction status updates work as before
- [ ] All existing transaction features remain functional

### AC-3: Additional Payments
- [ ] Payment modal shows new method selection
- [ ] Additional payments can be processed successfully
- [ ] Payment history shows correct method names
- [ ] Payment summaries calculate correctly

### AC-4: Receipt Generation
- [ ] Thermal receipts show "Tunai" for cash
- [ ] Thermal receipts show "Transfer" for all bank methods
- [ ] Professional receipts follow same display logic
- [ ] Receipt generation performance is maintained

### AC-5: Backward Compatibility
- [ ] Existing transactions display correctly
- [ ] Legacy payment methods are mapped appropriately
- [ ] No existing functionality is broken
- [ ] Data integrity is maintained

### AC-6: Error Handling
- [ ] Form validation works correctly
- [ ] Error messages are clear and helpful
- [ ] Network errors are handled gracefully
- [ ] Recovery mechanisms function properly

## Dependencies

### Internal Dependencies
- Existing payment processing service
- Transaction management system
- Receipt generation services
- UI component library

### External Dependencies
- None (no new integrations required)

## Constraints

### Technical Constraints
- Must maintain existing database schema
- Cannot break existing API contracts
- Must preserve all existing transaction data
- Performance cannot degrade

### Business Constraints
- No downtime during implementation
- Must be backward compatible
- Cannot affect existing user workflows
- Must maintain audit trail integrity

## Risk Mitigation

### High Risk: Data Compatibility
**Mitigation:** Comprehensive mapping strategy and thorough testing

### Medium Risk: UI Complexity
**Mitigation:** Progressive enhancement and user testing

### Low Risk: Performance Impact
**Mitigation:** Performance monitoring and optimization