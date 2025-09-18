# Test Documentation for New Penalty System

## Overview

This directory contains comprehensive test scenarios for the new penalty system implementation, covering:
- Flat 20k late penalty calculation
- Manual pricing for condition statuses
- Integration between frontend components and backend services
- End-to-end testing with Playwright

## Test Structure

### Unit Tests (`unit/kasir/`)

#### `penalty-system.test.ts`
**Purpose**: Tests core penalty calculation logic and manual pricing functionality

**Test Categories**:
1. **Flat Late Penalty Calculation**
   - Validates 20k flat penalty for late returns regardless of item count
   - Tests on-time return scenarios (zero penalty)
   - Handles same-day and early returns correctly

2. **Enhanced Penalty Calculation**
   - Combines flat late penalty with condition penalties
   - Handles on-time returns with only condition penalties
   - Tests multiple penalty types simultaneously

3. **Manual Pricing System**
   - Manual price override functionality (`useManualPricing: true`)
   - Automatic suggested pricing (`useManualPricing: false`)
   - Lost item pricing with modal awal

4. **Condition Category Mapping**
   - Tests all condition categories: BAIK, KOTOR, RUSAK_RINGAN, RUSAK_BERAT, HILANG
   - Validates suggested prices for each category
   - Ensures proper category-to-price mapping

5. **Integration Scenarios**
   - Multi-condition returns with mixed pricing types
   - Complex scenarios with multiple lost items
   - Edge cases (zero quantity, negative prices, large values)

6. **Business Rules Validation**
   - Penalty caps and limits enforcement
   - Detailed penalty breakdown for transparency
   - Compliance with business logic requirements

7. **Performance and Reliability**
   - Large-scale condition processing efficiency
   - Deterministic calculations with consistent inputs
   - API compatibility testing

**Key Test Functions**:
```typescript
// Test flat penalty calculation
PenaltyCalculator.calculateFlatLatePenalty(expectedDate, actualDate)

// Test manual pricing
PenaltyCalculator.calculateManualPricingPenalty(condition)

// Test combined penalty calculation
PenaltyCalculator.calculateEnhancedPenalty(item, conditions, isLate)
```

### Integration Tests (`integration/kasir/`)

#### `return-flow-integration.test.ts`
**Purpose**: Tests complete return workflow from UI components to API calls

**Test Categories**:
1. **Hook Integration**
   - `useMultiConditionReturn` initialization with new penalty fields
   - Transaction setup and item condition initialization
   - Validation with manual pricing requirements

2. **Component Integration**
   - `ConditionPricingForm` rendering and functionality
   - Manual pricing toggle activation
   - Suggested price display for different categories

3. **Complete Return Flow**
   - End-to-end processing with mixed pricing types
   - Multi-condition items with different pricing strategies
   - API request format validation

4. **Error Handling**
   - Validation errors for incomplete manual pricing
   - API error handling during return processing
   - Graceful degradation scenarios

5. **Performance Testing**
   - Large transaction handling efficiency
   - Response time validation
   - Memory usage optimization

**Key Components Tested**:
- `useMultiConditionReturn` hook
- `ConditionPricingForm` component
- `UnifiedConditionForm` integration
- API request/response handling

### E2E Tests (`playwright/kasir/`)

#### `penalty-system-e2e.spec.ts` (Pending Implementation)
**Purpose**: Browser-based testing of complete user workflows

**Planned Test Scenarios**:
1. **Kasir Workflow**
   - Login as kasir user
   - Navigate to return processing page
   - Select transaction for return
   - Configure item conditions with manual pricing
   - Submit return and verify penalty calculation

2. **Manual Pricing Workflow**
   - Enable manual pricing for specific conditions
   - Input custom prices for different condition categories
   - Validate price calculations in real-time
   - Confirm penalty breakdown accuracy

3. **Multi-Condition Scenarios**
   - Add multiple conditions for single item
   - Mix automatic and manual pricing
   - Verify progressive disclosure functionality
   - Test condition removal and modification

4. **Validation and Error Scenarios**
   - Submit incomplete forms
   - Test validation error messages
   - Verify required field enforcement
   - Test network error handling

## Test Data and Mocks

### Mock Transaction Data
```typescript
const mockTransactionDetail: TransaksiDetail = {
  id: 'trans-123',
  kode: 'TR-2025-001',
  items: [
    {
      id: 'item-1',
      jumlahDiambil: 3,
      produk: {
        name: 'Kebaya Tradisional',
        modalAwal: 150000
      }
    }
  ],
  tglSelesai: '2025-09-10', // Expected return date
  status: 'active'
}
```

### Mock Condition Data
```typescript
const mockCondition: ConditionSplit = {
  kondisiAkhir: 'Kotor dengan noda khusus',
  jumlahKembali: 2,
  conditionCategory: 'KOTOR' as ConditionCategory,
  useManualPricing: true,
  manualPrice: 8000
}
```

### API Mocks
```typescript
// Mock penalty calculation API
mockCalculateEnhancedPenalties.mockResolvedValue({
  totalPenalty: 35000,
  flatLatePenalty: 20000,
  conditionPenalty: 15000,
  breakdown: []
})

// Mock return processing API
mockProcessEnhancedReturn.mockResolvedValue({
  success: true,
  processingMode: 'multi-condition',
  totalPenalty: 35000,
  itemsProcessed: 2
})
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
yarn test:unit

# Run penalty system specific tests
yarn test:unit __tests__/unit/kasir/penalty-system.test.ts

# Run with coverage
yarn test:unit --coverage
```

### Integration Tests
```bash
# Run all integration tests
yarn test:int

# Run return flow integration tests
yarn test:int __tests__/integration/kasir/return-flow-integration.test.ts

# Run in watch mode
yarn test:int --watch
```

### E2E Tests (Future Implementation)
```bash
# Run all E2E tests
yarn test:e2e

# Run penalty system E2E tests
yarn test:e2e __tests__/playwright/kasir/penalty-system-e2e.spec.ts

# Run with UI mode
yarn test:e2e:ui
```

## Test Coverage Requirements

### Minimum Coverage Targets
- **Unit Tests**: 90% coverage for penalty calculation logic
- **Integration Tests**: 80% coverage for return flow components
- **E2E Tests**: 70% coverage for critical user workflows

### Critical Code Paths
1. Penalty calculation with flat 20k late fee
2. Manual pricing activation and validation
3. Condition category selection and price mapping
4. Multi-condition item processing
5. API request/response handling
6. Error validation and user feedback

## Common Test Patterns

### Testing Manual Pricing Toggle
```typescript
it('should enable manual price input when toggle is activated', async () => {
  const user = userEvent.setup()
  const mockOnChange = jest.fn()

  render(<ConditionPricingForm condition={mockCondition} onChange={mockOnChange} />)

  const toggle = screen.getByRole('switch')
  await user.click(toggle)

  expect(mockOnChange).toHaveBeenCalledWith(
    expect.objectContaining({ useManualPricing: true })
  )
})
```

### Testing Penalty Calculation
```typescript
it('should calculate correct penalty for mixed conditions', () => {
  const conditions = [
    { conditionCategory: 'BAIK', useManualPricing: false, jumlahKembali: 1 },
    { conditionCategory: 'KOTOR', useManualPricing: true, manualPrice: 8000, jumlahKembali: 1 }
  ]

  const result = PenaltyCalculator.calculateEnhancedPenalty(item, conditions, true)

  expect(result.totalPenalty).toBe(28000) // 20k late + 0 + 8k manual
})
```

### Testing API Integration
```typescript
it('should call API with correct manual pricing data', async () => {
  const { result } = renderHook(() => useMultiConditionReturn())

  await act(async () => {
    await result.current.processEnhancedReturn()
  })

  expect(mockProcessEnhancedReturn).toHaveBeenCalledWith(
    'TR-2025-001',
    expect.objectContaining({
      items: expect.arrayContaining([
        expect.objectContaining({
          conditionCategory: 'KOTOR',
          useManualPricing: true,
          manualPrice: 8000
        })
      ])
    })
  )
})
```

## Known Test Issues and Limitations

### Current Limitations
1. **Database Integration**: Tests use mocked API calls rather than real database
2. **File Upload Testing**: Image upload scenarios not yet implemented
3. **Network Simulation**: Limited network error scenario coverage
4. **Browser Compatibility**: E2E tests only run on Chromium

### Future Enhancements
1. **Real Database Testing**: Integration with test database for true integration tests
2. **Performance Benchmarks**: Automated performance regression testing
3. **Accessibility Testing**: Screen reader and keyboard navigation validation
4. **Cross-Browser Testing**: Support for Firefox and Safari
5. **Load Testing**: High-volume transaction processing validation

## Debugging Test Failures

### Common Issues and Solutions

#### Manual Pricing Validation Failures
```bash
# Issue: Manual pricing toggle not working
# Solution: Check that Switch component is properly mocked
# Verify: useManualPricing state updates correctly
```

#### Penalty Calculation Mismatches
```bash
# Issue: Expected penalty doesn't match calculated penalty
# Solution: Verify condition category mapping
# Check: Manual vs automatic pricing logic
```

#### API Mock Failures
```bash
# Issue: API calls not being mocked correctly
# Solution: Ensure proper jest.mock() setup
# Verify: Mock return values match expected format
```

#### Component Rendering Issues
```bash
# Issue: Components not rendering in tests
# Solution: Check TestWrapper with QueryClient
# Verify: All required props are provided
```

### Debug Commands
```bash
# Run tests with detailed output
yarn test:unit --verbose

# Debug specific test file
yarn test:unit --testNamePattern="penalty calculation"

# Run with debugging breakpoints
yarn test:unit --detectOpenHandles
```

## Contributing to Tests

### Adding New Test Cases
1. **Identify Test Category**: Unit, Integration, or E2E
2. **Follow Naming Convention**: `feature-component.test.ts`
3. **Use Proper Test Structure**: Describe-It-Expect pattern
4. **Add Comprehensive Documentation**: Explain test purpose and expected behavior
5. **Include Edge Cases**: Test boundary conditions and error scenarios

### Test Review Checklist
- [ ] Tests cover both success and failure scenarios
- [ ] Manual pricing scenarios are thoroughly tested
- [ ] API integration is properly mocked
- [ ] Performance implications are considered
- [ ] Edge cases and error conditions are handled
- [ ] Test names clearly describe expected behavior
- [ ] Mock data is realistic and representative

## Maintenance Schedule

### Regular Updates
- **Weekly**: Review test coverage reports
- **Monthly**: Update mock data to reflect current business rules
- **Quarterly**: Performance benchmark validation
- **As Needed**: Update tests when business requirements change

### Test Data Management
- Keep mock transaction data current with production patterns
- Update penalty amounts when business rules change
- Maintain consistency between unit and integration test data
- Regular cleanup of outdated test scenarios