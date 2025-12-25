# Payment Method Improvement - Implementation Tasks

## Task Breakdown

### Phase 1: Foundation Updates (Day 1 - Morning)

#### Task 1.1: Update Validation Schemas
**Priority:** Critical
**Estimated Time:** 2 hours
**Files:** `features/kasir/lib/validation/kasirSchema.ts`

**Subtasks:**
- [x] Update `metodeBayar` enum to `['tunai', 'bca', 'bri', 'mandiri', 'qris']`
- [x] Update `metode` enum in `createPembayaranSchema`
- [x] Remove `referensi` field validation requirements
- [x] Update `createTransaksiSchema` payment method enum
- [x] Update `transactionFormSchema` for UI compatibility
- [x] Test schema validation with new values

**Acceptance Criteria:**
- All enum validations accept new payment method values
- Reference field validation is completely removed
- Existing validation logic for amounts and notes remains intact
- TypeScript compilation passes without errors

#### Task 1.2: Update Type Definitions
**Priority:** Critical  
**Estimated Time:** 1.5 hours
**Files:** `features/kasir/types.ts`, `features/kasir/types/index.ts`

**Subtasks:**
- [x] Update `PaymentMethod` type definition
- [x] Add `PrimaryPaymentMethod` and `BankPaymentMethod` types
- [x] Update `TransactionFormData` interface
- [x] Update payment-related interfaces in components
- [x] Remove reference-related type definitions
- [x] Update API response type mappings

**Acceptance Criteria:**
- All type definitions support new payment method structure
- UI-specific types support 2-level selection
- Backward compatibility types are maintained
- No TypeScript errors in existing code

#### Task 1.3: Update Configuration Files
**Priority:** High
**Estimated Time:** 1 hour
**Files:** `features/kasir/lib/constants/workflowConfig.ts`

**Subtasks:**
- [x] ✅ UPDATE existing `paymentMethods` configuration array (don't create new)
- [x] ❌ DON'T ADD separate `getPrimaryMethods()` helper function (use within hook)
- [x] ❌ DON'T ADD separate `getBankMethods()` helper function (use within hook)
- [x] ✅ UPDATE payment method icons and labels in existing array
- [x] ✅ ADD category field to existing payment method objects

**Acceptance Criteria:**
- Existing configuration array supports new payment method structure
- No duplicate helper functions created
- Icons and labels are user-friendly
- Configuration remains easily maintainable

### Phase 2: UI Component Updates (Day 1 - Afternoon)

#### Task 2.1: Update PaymentForm Component
**Priority:** Critical
**Estimated Time:** 3 hours
**Files:** `features/kasir/components/detail/PaymentForm.tsx`

**Subtasks:**
- [ ] Remove reference field from form schema
- [ ] Implement 2-level radio button selection
- [ ] Add primary method state management
- [ ] Add conditional bank method selection
- [ ] Update form validation logic
- [ ] Remove reference field UI components
- [ ] Update form submission handling
- [ ] Add proper accessibility attributes
- [ ] Test form interactions and validation

**Acceptance Criteria:**
- Form shows 2-level payment method selection
- Primary selection between Tunai and Bank works
- Bank sub-options appear conditionally
- Reference field is completely removed
- Form validation works correctly
- Accessibility standards are maintained

#### Task 2.2: Update PaymentModal Component
**Priority:** High
**Estimated Time:** 2 hours
**Files:** `features/kasir/components/detail/PaymentModal.tsx`

**Subtasks:**
- [ ] Update form interface to remove reference handling
- [ ] Integrate new PaymentForm component
- [ ] Update success/error state handling
- [ ] Update payment submission logic
- [ ] Test modal interactions

**Acceptance Criteria:**
- Modal uses updated PaymentForm component
- Payment submission works with new method structure
- Success/error states display correctly
- Modal UX remains smooth and intuitive

#### Task 2.3: Update PaymentSummaryStep Component
**Priority:** High
**Estimated Time:** 2.5 hours
**Files:** `features/kasir/components/form/PaymentSummaryStep.tsx`

**Subtasks:**
- [ ] Replace payment method selection UI
- [ ] Implement 2-level selection in transaction form
- [ ] Update form data handling
- [ ] Remove reference field from summary
- [ ] Update payment method display logic
- [ ] Test integration with transaction creation flow

**Acceptance Criteria:**
- Transaction creation form shows new payment method selection
- 2-level selection works in transaction context
- Form data is properly updated and validated
- Transaction creation flow remains functional

### Phase 3: Service and Display Updates (Day 2 - Morning)

#### Task 3.1: Update Receipt Services
**Priority:** High
**Estimated Time:** 2 hours
**Files:** `features/kasir/services/professionalReceiptService.ts`

**Subtasks:**
- [ ] Add payment method display mapping function
- [ ] Update thermal receipt payment method display
- [ ] Update professional receipt payment method display
- [ ] Map bank methods to "Transfer" in receipts
- [ ] Keep "Tunai" display for cash payments
- [ ] Test receipt generation with new methods

**Acceptance Criteria:**
- Receipts show "Tunai" for cash payments
- Receipts show "Transfer" for all bank methods
- Receipt generation performance is maintained
- Both thermal and professional receipts work correctly

#### Task 3.2: Update Hooks and Mapping Functions
**Priority:** High
**Estimated Time:** 2 hours
**Files:** `features/kasir/hooks/usePaymentProcessing.ts`, `features/kasir/hooks/useTransactionDetail.ts`

**Subtasks:**
- [ ] ✅ UPDATE existing `usePaymentMethods` hook (don't create new)
- [ ] ✅ REMOVE `requiresReference` logic from existing hook
- [ ] ✅ UPDATE existing `mapPaymentMethod()` function (don't create new)
- [ ] ✅ ADD backward compatibility mapping to existing function
- [ ] ✅ UPDATE existing UI payment method mapping
- [ ] ✅ ADD helper functions within existing hook (avoid separate exports)
- [ ] Test hook functionality

**Acceptance Criteria:**
- Existing hook returns new payment method configurations
- Reference requirement logic is removed from existing hook
- Backward compatibility mapping works in existing function
- UI mapping functions handle all method types
- No duplicate functions created

### Phase 4: Testing and Integration (Day 2 - Afternoon)

#### Task 4.1: Update Test Files
**Priority:** Medium
**Estimated Time:** 3 hours
**Files:** Multiple test files

**Subtasks:**
- [ ] Update `__tests__/playwright/fixtures/kasir-test-data.ts`
- [ ] Update `__tests__/features/kasir/services/stockManagementFlow.test.ts`
- [ ] Update `__tests__/playwright/kasir/transaction-creation.spec.ts`
- [ ] Update `__tests__/playwright/kasir/transaction-detail.spec.ts`
- [ ] Update component unit tests
- [ ] Update API integration tests
- [ ] Add tests for new 2-level selection behavior

**Acceptance Criteria:**
- All existing tests pass with new payment method structure
- New tests cover 2-level selection behavior
- Test data uses new payment method values
- Test coverage remains above 90%

#### Task 4.2: Integration Testing
**Priority:** High
**Estimated Time:** 2 hours

**Subtasks:**
- [ ] Test complete transaction creation flow
- [ ] Test additional payment processing
- [ ] Test receipt generation end-to-end
- [ ] Test backward compatibility with existing data
- [ ] Test error handling scenarios
- [ ] Performance testing for UI interactions

**Acceptance Criteria:**
- All payment flows work end-to-end
- Existing transactions display correctly
- Receipt generation works for all method types
- Error handling is robust
- Performance meets requirements

### Phase 5: Documentation and Deployment (Day 3)

#### Task 5.1: Update Documentation
**Priority:** Low
**Estimated Time:** 1 hour

**Subtasks:**
- [ ] Update API documentation
- [ ] Update component documentation
- [ ] Update user guide for new payment flow
- [ ] Document backward compatibility strategy

**Acceptance Criteria:**
- Documentation reflects new payment method structure
- User guides are updated and clear
- Technical documentation is comprehensive

#### Task 5.2: Deployment Preparation
**Priority:** Medium
**Estimated Time:** 1 hour

**Subtasks:**
- [ ] Create deployment checklist
- [ ] Prepare rollback strategy
- [ ] Set up monitoring for new payment methods
- [ ] Prepare user communication about changes

**Acceptance Criteria:**
- Deployment is well-planned and documented
- Rollback strategy is tested and ready
- Monitoring covers new functionality
- Users are informed about changes

## Risk Mitigation Tasks

### High Priority Risk Mitigation

#### RM-1: Backward Compatibility Testing
**Time:** 2 hours
- [ ] Test existing transaction display
- [ ] Test legacy payment method mapping
- [ ] Verify data integrity
- [ ] Test receipt generation for legacy data

#### RM-2: Performance Validation
**Time:** 1 hour
- [ ] Benchmark form rendering performance
- [ ] Test payment processing performance
- [ ] Validate receipt generation performance
- [ ] Monitor memory usage

#### RM-3: User Experience Validation
**Time:** 1.5 hours
- [ ] Test 2-level selection usability
- [ ] Validate form completion time
- [ ] Test accessibility compliance
- [ ] Gather internal user feedback

## Quality Assurance Checklist

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Code follows existing patterns
- [ ] Proper error handling implemented
- [ ] Performance optimizations applied

### Functionality
- [ ] All payment methods work correctly
- [ ] Form validation is comprehensive
- [ ] Receipt generation is accurate
- [ ] Backward compatibility is maintained
- [ ] Error scenarios are handled

### User Experience
- [ ] UI is intuitive and responsive
- [ ] Accessibility standards are met
- [ ] Performance meets requirements
- [ ] Error messages are helpful
- [ ] Visual design is consistent

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Performance tests pass
- [ ] Accessibility tests pass

## Dependencies and Blockers

### Internal Dependencies
- UI component library updates (if needed)
- Design system consistency
- Testing infrastructure

### External Dependencies
- None identified

### Potential Blockers
- Complex existing transaction data scenarios
- Performance requirements not met
- User acceptance issues

## Success Metrics

### Technical Metrics
- [ ] 0 TypeScript errors
- [ ] >90% test coverage maintained
- [ ] <100ms form rendering time
- [ ] 100% backward compatibility

### User Experience Metrics
- [ ] 20% reduction in form completion time
- [ ] 0 user-reported confusion about reference fields
- [ ] Maintained accessibility compliance
- [ ] Positive internal user feedback

### Business Metrics
- [ ] No payment processing errors
- [ ] No data integrity issues
- [ ] No customer complaints
- [ ] Successful deployment with no rollbacks