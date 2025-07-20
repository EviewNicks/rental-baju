# Adapter Layer - Manage Product Feature

## Overview

The Adapter Layer is the **Data Access Layer** in our 3-tier architecture that handles all communication between the frontend and backend APIs. It provides a clean, type-safe interface for making HTTP requests while handling errors, loading states, and data transformations.

## Architecture

```
┌─────────────────────┐
│ Business Logic      │  (Custom Hooks)
│ Layer              │
└─────────┬───────────┘
          │
┌─────────▼───────────┐
│ Data Access        │  (Adapters) ← YOU ARE HERE
│ Layer              │
└─────────┬───────────┘
          │
┌─────────▼───────────┐
│ API Layer          │  (Next.js API Routes)
└─────────────────────┘
```

## Folder Structure

```
adapters/
├── base/
│   ├── http-client.ts              # HTTP client with retry logic, error handling
│   └── http-client.test.ts         # Unit tests for HTTP client
├── types/
│   ├── requests.ts                 # Request type definitions
│   ├── responses.ts                # Response type definitions
│   └── errors.ts                   # Error classes and utilities
├── integration/
│   └── adapter.integration.test.ts # Integration tests with API
├── productAdapter.ts               # Product CRUD operations
├── productAdapter.test.ts          # Unit tests for product adapter
├── categoryAdapter.ts              # Category CRUD operations
├── categoryAdapter.test.ts         # Unit tests for category adapter
├── fileUploadAdapter.ts            # File upload operations
├── fileUploadAdapter.test.ts       # Unit tests for file upload adapter
├── index.ts                        # Main exports
└── README.md                       # This file
```

## Core Features

### 🚀 HTTP Client Features
- **Automatic Retries**: Exponential backoff for transient failures
- **Request Timeout**: Configurable timeout with AbortController
- **Error Handling**: Automatic error parsing and custom error types
- **Type Safety**: Full TypeScript support with generic types
- **Content Type Detection**: Automatic request/response parsing
- **FormData Support**: Seamless file upload handling

### 🛡️ Error Handling
- **Custom Error Classes**: Specific error types for different scenarios
- **HTTP Status Mapping**: Automatic error type detection from status codes
- **Error Recovery**: Graceful degradation and retry logic
- **User-Friendly Messages**: Translated error messages for UI

### 📝 Type Safety
- **Request/Response Types**: Complete TypeScript interfaces
- **Validation Helpers**: Built-in data validation methods
- **Generic Support**: Type-safe method signatures
- **Enum Constants**: Predefined status codes and error types

## API Reference

### Product Adapter

```typescript
import { productAdapter } from '@/features/manage-product/adapters'

// Get products with pagination and filtering
const products = await productAdapter.getProducts({
  page: 1,
  limit: 10,
  search: 'search term',
  categoryId: 'category-id',
  status: 'AVAILABLE'
})

// Get single product
const product = await productAdapter.getProduct('product-id')

// Create product
const newProduct = await productAdapter.createProduct({
  code: 'PROD001',
  name: 'Product Name',
  modalAwal: 100000,
  hargaSewa: 50000,
  quantity: 10,
  categoryId: 'category-id',
  image: fileObject // Optional
})

// Update product
const updated = await productAdapter.updateProduct('product-id', {
  name: 'New Name',
  hargaSewa: 75000
})

// Update product status
const statusUpdated = await productAdapter.updateProductStatus('product-id', {
  status: 'RENTED'
})

// Delete product (soft delete)
await productAdapter.deleteProduct('product-id')

// Search products
const searchResults = await productAdapter.searchProducts('query')

// Check if product code exists
const codeExists = await productAdapter.checkProductCode('PROD001')
```

### Category Adapter

```typescript
import { categoryAdapter } from '@/features/manage-product/adapters'

// Get all categories
const categories = await categoryAdapter.getCategories()

// Get single category
const category = await categoryAdapter.getCategory('category-id')

// Create category
const newCategory = await categoryAdapter.createCategory({
  name: 'Category Name',
  color: '#FF0000'
})

// Update category
const updated = await categoryAdapter.updateCategory('category-id', {
  name: 'New Name',
  color: '#00FF00'
})

// Delete category
await categoryAdapter.deleteCategory('category-id')

// Search categories
const searchResults = await categoryAdapter.searchCategories('query')

// Check if category name exists
const nameExists = await categoryAdapter.checkCategoryName('Category Name')

// Validate category data
const validation = categoryAdapter.validateCategoryData({
  name: 'Test',
  color: '#FF0000'
})
```

### File Upload Adapter

```typescript
import { fileUploadAdapter } from '@/features/manage-product/adapters'

// Upload single image
const uploadResult = await fileUploadAdapter.uploadProductImage(
  fileObject, 
  'PROD001'
)

// Upload multiple images
const results = await fileUploadAdapter.uploadProductImages(
  [file1, file2], 
  'PROD001'
)

// Upload with progress tracking
const result = await fileUploadAdapter.uploadImageWithProgress(
  fileObject,
  'PROD001',
  (progress) => console.log(`${progress}%`)
)

// Delete image
await fileUploadAdapter.deleteImage('image-url')

// Validate image file
fileUploadAdapter.validateImageFile(fileObject)

// Create preview URL
const previewUrl = fileUploadAdapter.createPreviewUrl(fileObject)

// Cleanup preview URL
fileUploadAdapter.revokePreviewUrl(previewUrl)

// Format file size
const sizeString = fileUploadAdapter.formatFileSize(1024) // "1 KB"

// Generate unique filename
const filename = fileUploadAdapter.generateFilename('original.jpg', 'PROD001')
```

## Error Handling

### Error Types

```typescript
import {
  AdapterError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ServerError,
  NetworkError
} from '@/features/manage-product/adapters'

try {
  await productAdapter.createProduct(data)
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors
    console.log('Validation failed:', error.message)
    console.log('Details:', error.details)
  } else if (error instanceof ConflictError) {
    // Handle conflicts (e.g., duplicate product code)
    console.log('Conflict:', error.message)
  } else if (error instanceof AuthenticationError) {
    // Handle auth errors
    redirect('/sign-in')
  } else if (error instanceof NetworkError) {
    // Handle network issues
    showToast('Network error, please try again')
  }
}
```

### Error Type Guards

```typescript
import { 
  isValidationError, 
  isNotFoundError, 
  isNetworkError 
} from '@/features/manage-product/adapters'

try {
  await productAdapter.getProduct('id')
} catch (error) {
  if (isValidationError(error)) {
    // TypeScript knows this is ValidationError
    console.log(error.details)
  } else if (isNotFoundError(error)) {
    // TypeScript knows this is NotFoundError
    showNotFound()
  } else if (isNetworkError(error)) {
    // TypeScript knows this is NetworkError
    showRetryButton()
  }
}
```

## Configuration

### HTTP Client Configuration

```typescript
import { HttpClient } from '@/features/manage-product/adapters'

// Create custom HTTP client
const customClient = new HttpClient('/api/v2', {
  'Authorization': 'Bearer token',
  'X-Custom-Header': 'value'
})

// Request with custom options
const result = await customClient.request('/endpoint', {
  timeout: 30000,    // 30 seconds
  retries: 5,        // 5 retry attempts
  retryDelay: 2000,  // 2 second base delay
  headers: {
    'Custom-Header': 'value'
  }
})
```

### File Upload Configuration

```typescript
// File validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']
```

## Testing

### Running Tests

```bash
# Unit tests only
yarn test features/manage-product/adapters

# Integration tests (requires API to be running)
RUN_INTEGRATION_TESTS=true yarn test features/manage-product/adapters/integration

# All tests with coverage
yarn test:coverage features/manage-product/adapters
```

### Test Structure

```typescript
// Unit test example
describe('productAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create product successfully', async () => {
    // Mock HTTP client
    mockedHttpClient.post.mockResolvedValue({ data: mockProduct })
    
    const result = await productAdapter.createProduct(createData)
    
    expect(result).toEqual(mockProduct)
    expect(mockedHttpClient.post).toHaveBeenCalledWith(
      '/api/products',
      expect.any(FormData),
      { headers: {} }
    )
  })
})
```

### Integration Test Helpers

```typescript
import { integrationTestHelpers } from './integration/adapter.integration.test'

// Create test data
const categoryId = await integrationTestHelpers.createTestCategory()
const productId = await integrationTestHelpers.createTestProduct(categoryId)

// Cleanup test data
await integrationTestHelpers.cleanup([productId], [categoryId])
```

## Performance Considerations

### Request Optimization
- **Parallel Requests**: Use Promise.all for independent operations
- **Request Cancellation**: AbortController for cleanup
- **Caching**: Built-in response caching for frequently accessed data
- **Pagination**: Efficient large dataset handling

### Memory Management
- **File Upload Cleanup**: Automatic preview URL revocation
- **Request Cleanup**: Proper AbortController cleanup
- **Error Object Reuse**: Efficient error instance creation

## Usage in Hooks

```typescript
// Custom hook using product adapter
import { productAdapter } from '@/features/manage-product/adapters'
import { useQuery, useMutation } from '@tanstack/react-query'

export function useProducts(params: GetProductsParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productAdapter.getProducts(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useCreateProduct() {
  return useMutation({
    mutationFn: productAdapter.createProduct,
    onSuccess: () => {
      // Invalidate product queries
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
```

## Migration Guide

### From Direct API Calls

```typescript
// Before (direct fetch)
const response = await fetch('/api/products')
const products = await response.json()

// After (using adapter)
const products = await productAdapter.getProducts()
```

### From Custom HTTP Utils

```typescript
// Before (custom utils)
import { apiRequest } from '@/lib/api'
const products = await apiRequest.get('/products')

// After (using adapter)
import { productAdapter } from '@/features/manage-product/adapters'
const products = await productAdapter.getProducts()
```

## Best Practices

### 1. Error Handling
```typescript
// ✅ Good: Specific error handling
try {
  await productAdapter.createProduct(data)
} catch (error) {
  if (error instanceof ConflictError) {
    showError('Product code already exists')
  } else if (error instanceof ValidationError) {
    showValidationErrors(error.details)
  } else {
    showError('An unexpected error occurred')
  }
}

// ❌ Bad: Generic error handling
try {
  await productAdapter.createProduct(data)
} catch (error) {
  showError('Something went wrong')
}
```

### 2. Type Safety
```typescript
// ✅ Good: Use proper types
const params: GetProductsParams = {
  page: 1,
  limit: 10,
  status: 'AVAILABLE' // Type-safe enum
}

// ❌ Bad: Any or loose types
const params = {
  page: 1,
  limit: 10,
  status: 'available' // Not type-safe
}
```

### 3. Resource Cleanup
```typescript
// ✅ Good: Cleanup resources
const previewUrl = fileUploadAdapter.createPreviewUrl(file)
// ... use preview URL
fileUploadAdapter.revokePreviewUrl(previewUrl)

// ❌ Bad: Memory leak
const previewUrl = fileUploadAdapter.createPreviewUrl(file)
// No cleanup - causes memory leak
```

## Troubleshooting

### Common Issues

1. **Network Timeouts**
   ```typescript
   // Solution: Increase timeout
   await productAdapter.getProducts({}, { timeout: 60000 })
   ```

2. **File Upload Failures**
   ```typescript
   // Solution: Validate file before upload
   if (fileUploadAdapter.isValidImage(file)) {
     await fileUploadAdapter.uploadProductImage(file, code)
   }
   ```

3. **Type Errors**
   ```typescript
   // Solution: Use proper types
   const data: CreateProductRequest = {
     // All required fields with correct types
   }
   ```

### Debug Mode

```typescript
// Enable debug logging
process.env.DEBUG_ADAPTERS = 'true'
```

## Contributing

When adding new adapter methods:

1. **Add Type Definitions**: Update request/response types
2. **Implement Method**: Follow existing patterns
3. **Add Tests**: Both unit and integration tests
4. **Update Documentation**: Add to this README
5. **Error Handling**: Use appropriate error types

### Example New Method

```typescript
// 1. Add types
export interface GetProductStatsRequest {
  categoryId?: string
  dateFrom?: string
  dateTo?: string
}

export interface ProductStatsResponse {
  totalProducts: number
  totalRevenue: number
  averageRating: number
}

// 2. Implement method
async getProductStats(params: GetProductStatsRequest): Promise<ProductStatsResponse> {
  const queryString = createQueryString(params)
  const response = await httpClient.get<ProductStatsResponse>(
    `/api/products/stats${queryString ? `?${queryString}` : ''}`
  )
  return response.data
}

// 3. Add tests
it('should get product stats', async () => {
  const mockStats = { totalProducts: 10, totalRevenue: 500000, averageRating: 4.5 }
  mockedHttpClient.get.mockResolvedValue({ data: mockStats })
  
  const result = await productAdapter.getProductStats({ categoryId: 'cat1' })
  
  expect(result).toEqual(mockStats)
})
```

This adapter layer provides a robust, type-safe, and maintainable foundation for all API communications in the manage-product feature.