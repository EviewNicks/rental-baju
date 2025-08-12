# API Testing Guide - Product Management (RPK-43)

## Overview

This document provides comprehensive instructions for testing the Product Management API using Postman. The API includes endpoints for managing products, categories, and colors with enhanced features like size filtering and color management.

## Prerequisites

### 1. Environment Setup
- **Base URL**: `http://localhost:3000` (development)
- **Authentication**: Clerk session cookie required
- **Postman Collection**: Import `docs/api/product-api.json`

### 2. Authentication Setup
1. Login to the application at `http://localhost:3000`
2. Open browser Developer Tools ’ Application ’ Cookies
3. Copy the `__session` cookie value
4. In Postman:
   - Go to Collection Settings ’ Variables
   - Set `clerk_session_token` to the copied cookie value
   - Set `base_url` to `http://localhost:3000`

### 3. Database Preparation
Ensure your local database is running and seeded with test data:
```bash
yarn test:db
npx prisma db seed
```

## API Endpoints Overview

### Products API
- `GET /api/products` - List products with filtering
- `GET /api/products/{id}` - Get product details
- `POST /api/products` - Create product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Soft delete product

### Categories API
- `GET /api/categories` - List categories
- `GET /api/categories/{id}` - Get category details
- `POST /api/categories` - Create category
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category

### Colors API
- `GET /api/colors` - List colors
- `GET /api/colors/{id}` - Get color details
- `POST /api/colors` - Create color
- `PUT /api/colors/{id}` - Update color
- `DELETE /api/colors/{id}` - Soft delete color

## Testing Scenarios

### Scenario 1: Basic Product Management Flow

#### Step 1: Create Test Category
```http
POST /api/categories
Content-Type: application/json

{
  "name": "Test Dresses",
  "color": "#FF6B6B"
}
```

**Expected Response (201)**:
```json
{
  "id": "cat-uuid-...",
  "name": "Test Dresses",
  "color": "#FF6B6B",
  "createdAt": "2024-...",
  "updatedAt": "2024-...",
  "createdBy": "user123"
}
```

**Test Validations**:
-  Status code is 201
-  Response contains all required fields
-  `category_id` variable is automatically set

#### Step 2: Create Test Color
```http
POST /api/colors
Content-Type: application/json

{
  "name": "Test Red",
  "hexCode": "#DC143C",
  "description": "Deep red color for testing"
}
```

**Expected Response (201)**:
```json
{
  "id": "color-uuid-...",
  "name": "Test Red",
  "hexCode": "#DC143C",
  "description": "Deep red color for testing",
  "isActive": true,
  "products": [],
  "createdAt": "2024-...",
  "updatedAt": "2024-...",
  "createdBy": "user123"
}
```

**Test Validations**:
-  Status code is 201
-  Response contains color details
-  `color_id` variable is automatically set
-  `isActive` defaults to true

#### Step 3: Create Product with Size & Color
```http
POST /api/products
Content-Type: multipart/form-data

code: TEST001
name: Test Product Red Dress
description: Red dress for API testing
modalAwal: 200000
currentPrice: 75000
quantity: 5
rentedStock: 0
categoryId: {{category_id}}
size: M
colorId: {{color_id}}
image: [Optional file upload]
```

**Expected Response (201)**:
```json
{
  "id": "product-uuid-...",
  "code": "TEST001",
  "name": "Test Product Red Dress",
  "description": "Red dress for API testing",
  "categoryId": "{{category_id}}",
  "size": "M",
  "colorId": "{{color_id}}",
  "modalAwal": "200000.00",
  "currentPrice": "75000.00",
  "quantity": 5,
  "rentedStock": 0,
  "status": "AVAILABLE",
  "imageUrl": "products/...",
  "totalPendapatan": "0.00",
  "isActive": true,
  "category": {
    "id": "{{category_id}}",
    "name": "Test Dresses",
    "color": "#FF6B6B"
  },
  "color": {
    "id": "{{color_id}}",
    "name": "Test Red",
    "hexCode": "#DC143C",
    "description": "Deep red color for testing",
    "isActive": true
  }
}
```

**Test Validations**:
-  Status code is 201
-  Product includes category and color relations
-  Size field is properly set
-  `product_id` variable is automatically set

### Scenario 2: Advanced Filtering Tests

#### Test Size Filtering
```http
GET /api/products?size=M,L&page=1&limit=10
```

**Test Validations**:
-  Returns only products with size M or L
-  Pagination works correctly
-  Response includes size in each product

#### Test Color Filtering
```http
GET /api/products?colorId={{color_id}}&isActive=true
```

**Test Validations**:
-  Returns only products with specified color
-  Only active products are returned
-  Color details are included in response

#### Test Combined Filtering
```http
GET /api/products?size=M&colorId={{color_id}}&categoryId={{category_id}}&status=AVAILABLE
```

**Test Validations**:
-  All filters work together correctly
-  Results match all specified criteria
-  Response structure is consistent

### Scenario 3: Product Update Operations

#### Update Product Size and Color
```http
PUT /api/products/{{product_id}}
Content-Type: multipart/form-data

name: Updated Test Product
currentPrice: 85000
size: L
colorId: {{color_id}}
rentedStock: 1
```

**Expected Response (200)**:
-  Product details are updated
-  Size change is reflected
-  Price update is applied
-  `rentedStock` is updated

#### Test Product Status Change
```http
PUT /api/products/{{product_id}}
Content-Type: multipart/form-data

quantity: 3
rentedStock: 2
```

**Test Validations**:
-  Available stock calculation: quantity - rentedStock = 1
-  Status remains AVAILABLE if available stock > 0

### Scenario 4: Error Handling Tests

#### Test Invalid Product Code
```http
POST /api/products
Content-Type: multipart/form-data

code: INVALID_CODE_TOO_LONG
name: Test Product
categoryId: {{category_id}}
modalAwal: 100000
currentPrice: 50000
quantity: 1
```

**Expected Response (400)**:
```json
{
  "error": {
    "message": "Validation error...",
    "code": "VALIDATION_ERROR"
  }
}
```

#### Test Duplicate Product Code
Create a product with the same code as existing product:

**Expected Response (409)**:
```json
{
  "error": {
    "message": "Product code already exists",
    "code": "CONFLICT"
  }
}
```

#### Test Invalid Color Reference
```http
POST /api/products
Content-Type: multipart/form-data

code: TEST002
name: Test Product
categoryId: {{category_id}}
colorId: invalid-color-id
modalAwal: 100000
currentPrice: 50000
quantity: 1
```

**Expected Response (400)**:
-  Validation error for invalid colorId reference

### Scenario 5: Image Upload Testing

#### Test Image Upload
```http
POST /api/products
Content-Type: multipart/form-data

code: IMG001
name: Product with Image
categoryId: {{category_id}}
modalAwal: 150000
currentPrice: 60000
quantity: 2
size: M
colorId: {{color_id}}
image: [Select image file from computer]
```

**Test Validations**:
-  Image upload succeeds
-  `imageUrl` contains valid URL
-  Product is created with image reference

#### Test Image Update
```http
PUT /api/products/{{product_id}}
Content-Type: multipart/form-data

image: [Select new image file]
```

**Test Validations**:
-  Old image is replaced
-  New `imageUrl` is generated
-  Product update succeeds

## Postman Collection Variables

The following variables are automatically managed by the collection:

| Variable | Purpose | Auto-Set |
|----------|---------|----------|
| `base_url` | API base URL | Manual |
| `clerk_session_token` | Authentication | Manual |
| `product_id` | Latest product ID |  |
| `category_id` | Latest category ID |  |
| `color_id` | Latest color ID |  |

## Test Execution Checklist

### Pre-Testing Setup
- [ ] Local development server running (`yarn app`)
- [ ] Database connected and seeded
- [ ] Postman collection imported
- [ ] Authentication cookie configured
- [ ] Environment variables set

### Basic Flow Testing
- [ ] Create category successfully
- [ ] Create color successfully
- [ ] Create product with size & color
- [ ] Retrieve product details
- [ ] Update product information
- [ ] Delete product (soft delete)

### Advanced Feature Testing
- [ ] Size filtering works correctly
- [ ] Color filtering works correctly
- [ ] Combined filters work together
- [ ] Pagination functions properly
- [ ] Search functionality works

### Error Handling Testing
- [ ] Invalid data rejected with proper errors
- [ ] Duplicate codes prevented
- [ ] Missing required fields handled
- [ ] Invalid references rejected
- [ ] Authentication failures handled

### Image Upload Testing
- [ ] Image upload during creation
- [ ] Image update operations
- [ ] File validation works
- [ ] Old images are cleaned up

## Performance Testing

### Load Testing Scenarios
1. **Bulk Product Creation**: Create 100 products sequentially
2. **Heavy Filtering**: Filter products with multiple criteria
3. **Image Upload**: Upload large images (up to 5MB)
4. **Concurrent Requests**: Multiple simultaneous API calls

### Expected Performance
- **Product List API**: < 200ms response time
- **Product Creation**: < 500ms (without image), < 2s (with image)
- **Image Upload**: < 5s for files up to 5MB
- **Filter Queries**: < 300ms with moderate dataset

## Troubleshooting

### Common Issues

#### Authentication Errors
**Error**: `401 Unauthorized`
**Solution**: 
1. Re-login to application
2. Copy fresh `__session` cookie
3. Update `clerk_session_token` variable

#### Database Connection Errors
**Error**: `503 Service Unavailable` with connection pool message
**Solution**:
1. Check database server is running
2. Verify connection string in `.env.local`
3. Restart development server

#### Image Upload Failures
**Error**: `400 Upload Error`
**Solution**:
1. Check file size (max 5MB)
2. Verify file format (jpg, png, webp)
3. Check Supabase storage configuration

#### Validation Errors
**Error**: `400 Validation Error`
**Solution**:
1. Check required fields are provided
2. Verify data types and formats
3. Ensure referenced IDs exist

### Debug Mode
Enable detailed logging by setting environment variable:
```bash
DEBUG=true yarn app
```

## Automated Testing Integration

### Newman CLI Testing
Run entire collection via command line:
```bash
newman run docs/api/product-api.json \
  --environment postman-environment.json \
  --reporters cli,json \
  --reporter-json-export results.json
```

### CI/CD Integration
Add to your CI pipeline:
```yaml
- name: API Testing
  run: |
    newman run docs/api/product-api.json \
      --env-var "base_url=${{ env.BASE_URL }}" \
      --env-var "clerk_session_token=${{ env.TEST_TOKEN }}" \
      --bail
```

## Success Criteria

### Functional Testing
- [ ] All CRUD operations work correctly
- [ ] Filtering and pagination function properly
- [ ] Image upload/update operations succeed
- [ ] Error handling provides meaningful messages
- [ ] Data validation prevents invalid entries

### Performance Testing
- [ ] Response times meet performance targets
- [ ] API handles concurrent requests properly
- [ ] Image uploads complete within timeout limits
- [ ] Database queries are optimized

### Integration Testing
- [ ] API responses match frontend expectations
- [ ] Database state changes are correct
- [ ] File storage operations work properly
- [ ] Authentication and authorization function

---

**Last Updated**: 2025-01-07  
**Version**: 1.0  
**Test Environment**: Development (localhost:3000)  
**API Version**: 2.0.0 (Enhanced with Size & Color Management)