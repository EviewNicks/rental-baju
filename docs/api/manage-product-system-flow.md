# Manage-Product Backend System Flow Documentation

## Overview

The manage-product backend system is a sophisticated product management solution designed for rental clothing management. It implements a 3-tier modular monolith architecture with advanced features including hybrid size management, file uploads, material tracking, rental history, and comprehensive business logic validation.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Presentation Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   API Routes    │  │  Middleware     │  │  Auth (Clerk)   │ │
│  │  /api/products  │  │  Error Handler  │  │  Role-based     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ ProductService  │  │ SizeAggregation │  │ FileUpload      │ │
│  │ CategoryService │  │ HistoryService  │  │ MaterialService │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Data Access Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Prisma ORM      │  │ Database Schema │  │ File Storage    │ │
│  │ Type Safety     │  │ Relationships   │  │ Supabase        │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. API Layer (`app/api/products/`)
- **Primary Endpoints**: CRUD operations with advanced features
- **Specialized Endpoints**: History, aggregation, validation
- **Authentication**: Clerk-based role verification
- **Error Handling**: Structured error responses with proper HTTP codes

#### 2. Service Layer (`features/manage-product/services/`)
- **ProductService**: Core business logic and CRUD operations
- **ProductSizeAggregationService**: Advanced size management system
- **FileUploadService**: Image upload and management
- **ProductHistoryService**: Rental history tracking (RPK-46)
- **Supporting Services**: Categories, colors, materials

#### 3. Data Layer
- **Prisma ORM**: Type-safe database operations
- **PostgreSQL**: Primary data storage via Supabase
- **File Storage**: Supabase storage for product images

## Request Flow Patterns

### Standard Request Flow

```
Client Request
     ↓
API Route Handler
     ↓
Authentication Check (Clerk)
     ↓
Input Validation (Zod Schemas)
     ↓
Service Layer Processing
     ↓
Business Logic Execution
     ↓
Database Operations (Prisma)
     ↓
Response Formatting
     ↓
Client Response
```

### Advanced Request Flow (with Aggregation)

```
Client Request (/api/products?includeAggregation=true)
     ↓
ProductService.getProducts()
     ↓
Basic Product Query
     ↓
ProductSizeAggregationService.getProductAggregation()
     ↓
Size Data Processing
     ↓
Combined Response with Aggregation
     ↓
Structured Response to Client
```

## Core API Endpoints

### Primary CRUD Operations

| Endpoint | Method | Purpose | Advanced Features |
|----------|--------|---------|-------------------|
| `/api/products` | GET | List products | Pagination, filtering, aggregation |
| `/api/products` | POST | Create product | File upload, size management |
| `/api/products/[id]` | GET | Get product details | Aggregation options |
| `/api/products/[id]` | PUT | Update product | Image replacement, size updates |
| `/api/products/[id]` | DELETE | Soft delete product | Cascade handling |

### Specialized Operations

| Endpoint | Method | Purpose | Features |
|----------|--------|---------|----------|
| `/api/products/[id]/history` | GET | Rental history | Role-based masking, pagination |
| `/api/products/[id]/sizes/aggregated` | GET | Size aggregation | Caching, breakdown options |
| `/api/products/[id]/validation` | GET | Business validation | Logic preservation checks |

## Authentication & Authorization

### Role-Based Access Control

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      Owner      │    │    Producer     │    │      Kasir      │
│  Full Access    │    │ Product + Kasir │    │ Transaction     │
│ All Operations  │    │   Operations    │    │   Operations    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Session Claims (Clerk)                       │
│  { metadata: { role: "owner|producer|kasir" } }                │
└─────────────────────────────────────────────────────────────────┘
```

### Authentication Flow

1. **Request Interception**: Clerk middleware validates session
2. **Role Extraction**: Custom session claims provide role information
3. **Authorization Check**: Service layer verifies permissions
4. **Data Masking**: Role-based data filtering (especially for history)

## Advanced Features

### 1. Hybrid Size Management System

**Legacy Mode**: Single size field for backward compatibility
**Advanced Mode**: Multiple sizes with age categories and quantities

```
Product with Sizes:
├── hasSizes: true
├── ProductSize[]
│   ├── ageCategory: "ANAK" | "DEWASA"
│   ├── size: "S" | "M" | "L" | "XL" | "XXL"
│   ├── quantity: number
│   └── isActive: boolean
└── Aggregation Views
    ├── totalQuantity
    ├── availableQuantity
    └── ageCategoryBreakdown
```

### 2. File Upload System

**Upload Flow**:
1. **Validation**: File type, size, format checks
2. **Processing**: Image optimization and resizing
3. **Storage**: Supabase storage with organized paths
4. **URL Generation**: Public accessible URLs
5. **Cleanup**: Old image deletion on updates

### 3. Material Management (RPK-45)

**Integration Points**:
- Product creation with material selection
- Quantity tracking per material
- Validation of material-quantity consistency
- Business rule enforcement

### 4. History Tracking (RPK-46)

**Capabilities**:
- Rental transaction history
- Role-based data masking
- Pagination and sorting
- Summary statistics
- Activity timeline

## Error Handling Strategy

### Error Classification

```
┌─────────────────────────────────────────────────────────────────┐
│                      Error Hierarchy                            │
├─────────────────┬─────────────────┬─────────────────────────────┤
│ Authentication  │ Validation      │ Business Logic              │
│ - Unauthorized  │ - Invalid Input │ - Not Found                 │
│ - Forbidden     │ - Schema Error  │ - Conflict                  │
├─────────────────┼─────────────────┼─────────────────────────────┤
│ Infrastructure  │ File Operations │ Database                    │
│ - Service Down  │ - Upload Failed │ - Connection Pool           │
│ - Timeout       │ - Invalid Format│ - Transaction Failed        │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

### Error Response Format

```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "MACHINE_READABLE_CODE",
    "details": "Additional context (optional)"
  }
}
```

## Performance Optimizations

### 1. Caching Strategy
- **Aggregation Results**: 5-minute cache with stale-while-revalidate
- **File URLs**: Long-term caching with cache busting
- **Query Optimization**: Efficient database indices

### 2. Database Optimization
- **Selective Loading**: Include only required relations
- **Pagination**: Limit query results with proper pagination
- **Connection Pooling**: Efficient database connection management

### 3. Request Optimization
- **Parallel Processing**: Independent operations run concurrently
- **Optional Features**: Aggregation and validation on-demand
- **Bulk Operations**: Efficient batch processing where applicable

## Integration Patterns

### Frontend Integration

```
Frontend Hook (useProducts)
     ↓
API Client (productApi.getProducts)
     ↓
Next.js API Route (/api/products)
     ↓
ProductService
     ↓
Database Query
     ↓
Formatted Response
```

### Service Communication

```
ProductService
├── Uses ProductSizeAggregationService for size data
├── Uses FileUploadService for image handling
├── Uses CategoryService for validation
└── Uses MaterialService for material management
```

## Business Logic Preservation

### Validation System

The system includes comprehensive validation to ensure business logic preservation:

1. **Data Consistency**: Aggregation matches detailed records
2. **Business Rules**: Size management rules enforcement
3. **Capability Checks**: All business capabilities remain functional
4. **Integration Verification**: Cross-service integration validation

### Monitoring Points

- **API Response Times**: Performance monitoring
- **Error Rates**: Quality assurance metrics
- **Business Logic Health**: Validation endpoint monitoring
- **Data Consistency**: Regular consistency checks

## Security Considerations

### Data Protection
- **Authentication Required**: All endpoints require valid session
- **Role-Based Access**: Operations limited by user role
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Prevention**: Prisma ORM type safety

### File Security
- **Upload Validation**: File type and size restrictions
- **Path Traversal Protection**: Secure file path handling
- **Access Control**: Public/private file separation

## Deployment Considerations

### Environment Configuration
- **Database Connections**: Prisma connection pooling
- **File Storage**: Supabase configuration
- **Authentication**: Clerk environment setup
- **Error Monitoring**: Structured logging implementation

### Scalability Factors
- **Service Separation**: Independent scaling capability
- **Database Optimization**: Query performance monitoring
- **File Storage**: CDN integration for image delivery
- **Caching Strategy**: Redis integration capability

---

*This document provides a comprehensive overview of the manage-product backend system architecture and flow. For detailed API specifications, see [manage-product-endpoints.md](./manage-product-endpoints.md).*