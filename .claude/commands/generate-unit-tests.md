# Generate Unit Tests for Architecture Layers

Buat unit tests untuk architecture layers (Service, Hook, Adapter) dalam proyek ini, menggunakan pendekatan sederhana namun comprehensive. Test akan mencakup happy path, edge cases, error handling, dan best practices.kita menggunakan pendekatan TDD jadi buatlah  unit tets seelum mengerjakan file code nya 

## Instruksi

Untuk file yang diberikan:

1. **Analisis file target** - Pahami struktur, dependencies, dan functionality
2. **Buat unit test** dengan coverage:
   - ✅ Happy path scenarios
   - ✅ Edge cases (null, undefined, empty values)
   - ✅ Error handling dan exception scenarios
   - ✅ Async operations (jika ada)
   - ✅ Mocking external dependencies
   - ✅ State management (untuk hooks)

3. **Ikuti pattern proyek**:
   - Co-location: Test file di samping implementation file
   - AAA Pattern: Arrange-Act-Assert
   - Descriptive test names dalam bahasa Indonesia
   - Comprehensive mocking
   - Jest + React Testing Library

## Template Structure

```typescript
/**
 * Unit Tests untuk [filename]
 * Testing [description of what's being tested]
 * 
 * Coverage:
 * - Happy path scenarios
 * - Edge cases
 * - Error handling
 * - [Additional specific scenarios]
 */

import { [imports] } from '[paths]'

// Mocks
jest.mock('[external-deps]')

describe('[Component/Function Name]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset any singleton instances if needed
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('[Function/Method Group]', () => {
    it('should [expected behavior] - happy path', () => {
      // Arrange
      const mockData = { /* test data */ }
      
      // Act
      const result = functionUnderTest(mockData)
      
      // Assert
      expect(result).toBe(expected)
    })

    it('should handle [edge case] gracefully', () => {
      // Arrange
      const edgeCaseData = null
      
      // Act & Assert
      expect(() => functionUnderTest(edgeCaseData)).not.toThrow()
    })

    it('should throw error when [error condition]', () => {
      // Arrange
      const invalidData = { /* invalid data */ }
      
      // Act & Assert
      expect(() => functionUnderTest(invalidData)).toThrow('Expected error message')
    })
  })
})
```

## Specific Guidelines by Layer

### Service Layer Tests
- Mock database connections (Prisma)
- Mock external API calls
- Test data validation and sanitization
- Test error responses
- Test caching mechanisms (jika ada)

### Hook Tests
- Use `renderHook` dari React Testing Library
- Mock Context providers
- Test state changes
- Test side effects
- Test cleanup pada unmount

### Adapter Tests
- Mock HTTP clients
- Test request/response transformations
- Test error handling dan retry logic
- Test timeout scenarios
- Test data serialization/deserialization

## Mock Patterns

### Context Provider Mock
```typescript
const createMockContext = (overrides = {}) => ({
  defaultState: 'value',
  actions: jest.fn(),
  ...overrides,
})
```

### Service Mock
```typescript
jest.mock('./serviceFile', () => ({
  functionName: jest.fn(),
  asyncFunction: jest.fn().mockResolvedValue({}),
}))
```

### Async Operation Mock
```typescript
const mockAsyncFunction = jest.fn().mockImplementation(() => 
  Promise.resolve(mockData)
)
```

## Test Execution Commands

```bash
# Test specific file
yarn test path/to/file.test.ts

# Test feature
yarn test:unit features/[feature-name]/

# Test with coverage
yarn test:coverage
```

## Quality Checklist

- [ ] Semua public methods/functions tested
- [ ] Edge cases covered (null, undefined, empty)
- [ ] Error scenarios tested
- [ ] Async operations properly tested
- [ ] External dependencies mocked
- [ ] Test names descriptive dan clear
- [ ] No hardcoded values dalam tests
- [ ] Test isolation (no shared state)
- [ ] Proper cleanup dalam afterEach
- [ ] Indonesian comments untuk clarity