# Integration Tests Command

Create integration tests focused on 2-layer architecture relations, Buat integration test untuk architecture layers (Service, Hook, Adapter) dalam proyek ini, menggunakan pendekatan sederhana namun comprehensive. foksu pada fungsi utama 

## Test Focus Areas

- **Data Layer + Service Layer**: Test database operations through service methods
- **Service Layer + API Layer**: Test API endpoints calling service methods
- **API Layer + Adapter Layer**: Test client-side API calls to server endpoints
- **Adapter Layer + Hook Layer**: Test React hooks consuming adapter methods

## Test Creation Guidelines

- Keep tests simple and focused on successful interactions
- Test actual communication between layers
- Use realistic data and scenarios
- Follow existing test patterns in the codebase
- Ensure tests can run with `yarn test:int`

## Test Structure

```typescript
// Example: Data Layer + Service Layer
describe('ProductService Integration', () => {
  it('should create product in database', async () => {
    const productData = { name: 'Test Product', price: 100 }
    const result = await productService.createProduct(productData)
    expect(result).toBeDefined()
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

Focus on making tests pass rather than comprehensive coverage. The goal is to verify layer communication works correctly.
