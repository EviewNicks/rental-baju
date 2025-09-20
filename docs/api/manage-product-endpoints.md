# Manage-Product API Endpoints Documentation

## Overview

This document provides comprehensive specifications for all manage-product API endpoints, including request/response schemas, query parameters, authentication requirements, and advanced features.

## Base Information

- **Base URL**: `/api/products`
- **Authentication**: Required (Clerk session)
- **Content-Type**: `multipart/form-data` for file uploads, `application/json` for others
- **Response Format**: JSON

## Core CRUD Endpoints

### 1. List Products

**Endpoint**: `GET /api/products`

**Description**: Retrieve paginated list of products with advanced filtering and optional aggregation.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 10 | Items per page (max 50) |
| `search` | string | - | Search term for product name/code |
| `categoryId` | string | - | Filter by category ID |
| `status` | string | - | Filter by product status |
| `isActive` | boolean | true | Include only active products |
| `size` | string[] | - | Filter by sizes (multiple values) |
| `colorId` | string[] | - | Filter by color IDs (multiple values) |
| `includeAggregation` | boolean | false | Include size aggregation data |
| `includeBreakdown` | boolean | true | Include age category breakdown |

#### Response Schema

```json
{
  "products": [
    {
      "id": "string",
      "code": "string",
      "name": "string",
      "description": "string",
      "modalAwal": number,
      "currentPrice": number,
      "quantity": number,
      "rentedStock": number,
      "status": "AVAILABLE|RENTED|MAINTENANCE",
      "imageUrl": "string",
      "isActive": boolean,
      "categoryId": "string",
      "colorId": "string",
      "size": "string",
      "hasSizes": boolean,
      "materialId": "string",
      "materialQuantity": number,
      "createdAt": "string",
      "updatedAt": "string",
      "category": {
        "id": "string",
        "name": "string",
        "color": "string"
      },
      "color": {
        "id": "string",
        "name": "string",
        "hexCode": "string"
      },
      "sizes": [
        {
          "id": "string",
          "ageCategory": "ANAK|DEWASA",
          "size": "S|M|L|XL|XXL",
          "quantity": number,
          "isActive": boolean
        }
      ],
      "aggregation": {
        "totalQuantity": number,
        "availableQuantity": number,
        "rentedQuantity": number,
        "ageCategoryBreakdown": [
          {
            "ageCategory": "ANAK|DEWASA",
            "sizes": [
              {
                "size": "S|M|L|XL|XXL",
                "totalQuantity": number,
                "availableQuantity": number
              }
            ]
          }
        ]
      }
    }
  ],
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number,
    "hasNext": boolean,
    "hasPrev": boolean
  },
  "summary": {
    "totalProducts": number,
    "activeProducts": number,
    "totalValue": number
  }
}
```

#### Example Request

```bash
GET /api/products?page=1&limit=10&search=dress&categoryId=cat123&includeAggregation=true
```

---

### 2. Create Product

**Endpoint**: `POST /api/products`

**Description**: Create a new product with optional image upload and size management.

#### Request Body (multipart/form-data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | ✅ | Unique product code |
| `name` | string | ✅ | Product name |
| `description` | string | ❌ | Product description |
| `modalAwal` | number | ✅ | Initial capital/cost |
| `currentPrice` | number | ✅ | Current rental price |
| `quantity` | number | ✅ | Total quantity |
| `rentedStock` | number | ❌ | Currently rented stock (default: 0) |
| `categoryId` | string | ✅ | Category ID |
| `size` | string | ❌ | Size (legacy mode) |
| `colorId` | string | ❌ | Color ID |
| `materialId` | string | ❌ | Material ID (RPK-45) |
| `materialQuantity` | number | ❌ | Material quantity required |
| `image` | File | ❌ | Product image file |
| `hasSizes` | boolean | ❌ | Enable advanced size management |
| `sizes` | JSON string | ❌ | Size configurations array |

#### Size Configuration Schema (when hasSizes=true)

```json
[
  {
    "ageCategory": "ANAK|DEWASA",
    "size": "S|M|L|XL|XXL",
    "quantity": number,
    "isActive": boolean
  }
]
```

#### Response Schema

```json
{
  "id": "string",
  "code": "string",
  "name": "string",
  "description": "string",
  "modalAwal": number,
  "currentPrice": number,
  "quantity": number,
  "rentedStock": number,
  "status": "AVAILABLE",
  "imageUrl": "string",
  "isActive": true,
  "categoryId": "string",
  "colorId": "string",
  "size": "string",
  "hasSizes": boolean,
  "materialId": "string",
  "materialQuantity": number,
  "createdAt": "string",
  "updatedAt": "string",
  "sizes": [
    {
      "id": "string",
      "ageCategory": "ANAK|DEWASA",
      "size": "S|M|L|XL|XXL",
      "quantity": number,
      "isActive": boolean
    }
  ]
}
```

#### Example Request

```bash
POST /api/products
Content-Type: multipart/form-data

{
  "code": "DRESS001",
  "name": "Summer Dress",
  "description": "Beautiful summer dress",
  "modalAwal": 100000,
  "currentPrice": 25000,
  "quantity": 10,
  "categoryId": "cat123",
  "colorId": "color456",
  "hasSizes": true,
  "sizes": "[{\"ageCategory\":\"DEWASA\",\"size\":\"M\",\"quantity\":5,\"isActive\":true}]",
  "image": <file>
}
```

---

### 3. Get Product by ID

**Endpoint**: `GET /api/products/{id}`

**Description**: Retrieve detailed information for a specific product.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Product ID |

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `includeAggregation` | boolean | false | Include size aggregation data |
| `includeBreakdown` | boolean | true | Include age category breakdown |

#### Response Schema

Same as single product object from List Products endpoint.

#### Example Request

```bash
GET /api/products/prod123?includeAggregation=true
```

---

### 4. Update Product

**Endpoint**: `PUT /api/products/{id}`

**Description**: Update existing product with optional image replacement and size management.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Product ID |

#### Request Body (multipart/form-data)

All fields are optional. Only provided fields will be updated.

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Product name |
| `description` | string | Product description |
| `modalAwal` | number | Initial capital/cost |
| `currentPrice` | number | Current rental price |
| `quantity` | number | Total quantity |
| `rentedStock` | number | Currently rented stock |
| `categoryId` | string | Category ID |
| `size` | string | Size (legacy mode) |
| `colorId` | string | Color ID |
| `materialId` | string | Material ID |
| `materialQuantity` | number | Material quantity |
| `image` | File | New product image |
| `hasSizes` | boolean | Enable/disable advanced size management |
| `sizes` | JSON string | Updated size configurations |

#### Size Update Schema

```json
[
  {
    "id": "string",           // Optional: existing size ID for updates
    "ageCategory": "ANAK|DEWASA",
    "size": "S|M|L|XL|XXL",
    "quantity": number,
    "isActive": boolean
  }
]
```

#### Response Schema

Same as Create Product response.

#### Example Request

```bash
PUT /api/products/prod123
Content-Type: multipart/form-data

{
  "name": "Updated Summer Dress",
  "currentPrice": 30000,
  "image": <new_file>
}
```

---

### 5. Delete Product

**Endpoint**: `DELETE /api/products/{id}`

**Description**: Soft delete a product (sets isActive to false).

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Product ID |

#### Response Schema

```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

#### Example Request

```bash
DELETE /api/products/prod123
```

---

## Specialized Endpoints

### 1. Product History

**Endpoint**: `GET /api/products/{id}/history`

**Description**: Retrieve rental history for a specific product with role-based data masking.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Product ID |

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 25 | Items per page (max 250) |
| `sortBy` | string | date | Sort field: `date`, `status`, `amount` |
| `sortOrder` | string | desc | Sort order: `asc`, `desc` |

#### Response Schema

```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "transactionCode": "string",
      "date": "string",
      "type": "RENTAL|RETURN",
      "status": "COMPLETED|PENDING|CANCELLED",
      "amount": number,
      "duration": number,
      "customerName": "string",        // Masked based on role
      "customerPhone": "string",       // Masked based on role
      "notes": "string"
    }
  ],
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number,
    "hasNext": boolean,
    "hasPrev": boolean
  },
  "summary": {
    "totalRentals": number,
    "totalRevenue": number,
    "averageRentalDuration": number,
    "mostFrequentCustomer": "string"
  }
}
```

#### Role-Based Data Masking

| Role | Customer Name | Customer Phone | Full Access |
|------|---------------|----------------|-------------|
| Owner | Full | Full | ✅ |
| Producer | Masked | Masked | ❌ |
| Kasir | Partial | Partial | ❌ |

#### Example Request

```bash
GET /api/products/prod123/history?page=1&limit=10&sortBy=date&sortOrder=desc
```

---

### 2. Aggregated Sizes

**Endpoint**: `GET /api/products/{id}/sizes/aggregated`

**Description**: Get aggregated size data for advanced size management.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Product ID |

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `includeBreakdown` | boolean | true | Include age category breakdown |
| `includeMetadata` | boolean | false | Include aggregation metadata |
| `cacheBypass` | boolean | false | Bypass caching |

#### Response Schema

```json
{
  "productId": "string",
  "productName": "string",
  "aggregatedSizes": {
    "totalQuantity": number,
    "availableQuantity": number,
    "rentedQuantity": number,
    "ageCategoryBreakdown": [
      {
        "ageCategory": "ANAK|DEWASA",
        "totalQuantity": number,
        "availableQuantity": number,
        "sizes": [
          {
            "size": "S|M|L|XL|XXL",
            "totalQuantity": number,
            "availableQuantity": number,
            "rentedQuantity": number
          }
        ]
      }
    ]
  },
  "metadata": {
    "lastUpdated": "string",
    "cacheStatus": "HIT|MISS|BYPASS",
    "aggregationTime": number
  }
}
```

#### Example Request

```bash
GET /api/products/prod123/sizes/aggregated?includeBreakdown=true&includeMetadata=true
```

---

### 3. Business Logic Validation

**Endpoint**: `GET /api/products/{id}/validation`

**Description**: Validate business logic preservation and data consistency.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Product ID |

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | full | Validation type: `full`, `consistency`, `capabilities` |
| `format` | string | detailed | Response format: `detailed`, `summary` |

#### Response Schema (Detailed)

```json
{
  "productId": "string",
  "productName": "string",
  "validationType": "full|consistency|capabilities",
  "validationResult": {
    "overallHealth": "excellent|good|warning|critical",
    "isConsistent": boolean,
    "aggregationConsistency": {
      "isValid": boolean,
      "errors": ["string"],
      "warnings": ["string"]
    },
    "businessCapabilities": {
      "rentalTracking": boolean,
      "inventoryManagement": boolean,
      "sizeManagement": boolean,
      "reportingCapability": boolean
    },
    "recommendations": [
      {
        "type": "performance|data|business",
        "priority": "high|medium|low",
        "message": "string",
        "action": "string"
      }
    ]
  },
  "metadata": {
    "timestamp": "string",
    "version": "string",
    "systemInfo": {
      "aggregationEnabled": boolean,
      "businessLogicPreserved": boolean,
      "hybridArchitecture": boolean
    }
  }
}
```

#### Response Schema (Summary)

```json
{
  "productId": "string",
  "productName": "string",
  "validationType": "full|consistency|capabilities",
  "isHealthy": boolean,
  "keyMetrics": {
    "overallHealth": "string",
    "recommendationCount": number,
    "businessCapabilities": number
  },
  "timestamp": "string"
}
```

#### Example Request

```bash
GET /api/products/prod123/validation?type=full&format=detailed
```

---

## Supporting Endpoints

### Categories

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/categories` | GET | List all categories |
| `POST /api/categories` | POST | Create new category |
| `GET /api/categories/{id}` | GET | Get category by ID |
| `PUT /api/categories/{id}` | PUT | Update category |
| `DELETE /api/categories/{id}` | DELETE | Delete category |

### Colors

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/colors` | GET | List all colors |
| `POST /api/colors` | POST | Create new color |
| `GET /api/colors/{id}` | GET | Get color by ID |
| `PUT /api/colors/{id}` | PUT | Update color |
| `DELETE /api/colors/{id}` | DELETE | Delete color |

---

## Error Responses

### Standard Error Format

```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "MACHINE_READABLE_CODE",
    "details": "Additional context (optional)"
  }
}
```

### Common Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid input data |
| 401 | `UNAUTHORIZED` | Authentication required |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource conflict (e.g., duplicate code) |
| 413 | `UPLOAD_ERROR` | File upload failed |
| 500 | `INTERNAL_ERROR` | Server error |
| 503 | `CONNECTION_ERROR` | Database connection timeout |

### Example Error Response

```json
{
  "error": {
    "message": "Kode produk DRESS001 sudah digunakan",
    "code": "CONFLICT"
  }
}
```

---

## Authentication & Authorization

### Required Headers

```
Authorization: Bearer <clerk_session_token>
```

### Role-Based Access

| Endpoint | Owner | Producer | Kasir |
|----------|-------|----------|-------|
| List Products | ✅ | ✅ | ✅ |
| Create Product | ✅ | ✅ | ❌ |
| Update Product | ✅ | ✅ | ❌ |
| Delete Product | ✅ | ✅ | ❌ |
| Product History | ✅ Full | ✅ Masked | ✅ Partial |
| Aggregated Sizes | ✅ | ✅ | ✅ |
| Validation | ✅ | ✅ | ❌ |

---

## Rate Limiting & Performance

### Rate Limits
- **Standard Operations**: 100 requests/minute
- **File Uploads**: 10 requests/minute
- **Validation Endpoints**: 20 requests/minute

### Performance Optimizations
- **Caching**: Aggregation data cached for 5 minutes
- **Pagination**: Maximum 50 items per page
- **Image Optimization**: Automatic resizing and compression
- **Database Optimization**: Selective field loading and efficient queries

### Response Headers

```
Cache-Control: public, max-age=300, stale-while-revalidate=60
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

*For system architecture overview, see [manage-product-system-flow.md](./manage-product-system-flow.md). For business logic details, see [manage-product-business-logic.md](./manage-product-business-logic.md).*