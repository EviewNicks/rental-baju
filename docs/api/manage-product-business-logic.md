# Manage-Product Business Logic Documentation

## Overview

This document details the sophisticated business logic implemented in the manage-product system, covering advanced features including hybrid size management, material integration, rental history tracking, file management, and comprehensive validation systems.

## Core Business Rules

### Product Management Rules

#### 1. Product Code Uniqueness
- **Rule**: Product codes must be unique across all active products
- **Implementation**: Database constraint + service-level validation
- **Error Handling**: ConflictError with descriptive message
- **Business Impact**: Prevents inventory confusion and duplicate tracking

#### 2. Category & Color Validation
- **Rule**: Referenced categories and colors must exist
- **Implementation**: Foreign key validation in service layer
- **Error Handling**: NotFoundError for missing references
- **Business Impact**: Maintains data integrity and prevents orphaned references

#### 3. Stock Management
- **Total Stock**: `quantity` field represents total available inventory
- **Rented Stock**: `rentedStock` field tracks currently rented items
- **Available Stock**: Calculated as `quantity - rentedStock`
- **Business Rule**: `rentedStock` cannot exceed `quantity`

## Hybrid Size Management System

### Architecture Overview

The system supports both legacy single-size products and advanced multi-size products with backward compatibility.

```
Product Size Architecture:
├── Legacy Mode (hasSizes: false)
│   ├── Single size field
│   ├── Direct quantity tracking
│   └── Simple inventory management
└── Advanced Mode (hasSizes: true)
    ├── Multiple ProductSize records
    ├── Age category segmentation
    ├── Size-specific quantities
    └── Aggregated views for UI
```

### Legacy Mode (Single Size)

**When Used**: Existing products or simple inventory requirements

**Data Structure**:
```json
{
  "hasSizes": false,
  "size": "M",           // Single size value
  "quantity": 10,        // Total quantity
  "rentedStock": 3       // Rented quantity
}
```

**Business Rules**:
- Size stored directly in product record
- Quantity management at product level
- Simplified rental tracking

### Advanced Mode (Multi-Size)

**When Used**: Complex inventory with multiple sizes and age categories

**Data Structure**:
```json
{
  "hasSizes": true,
  "quantity": 10,        // Aggregate quantity (auto-calculated)
  "rentedStock": 3,      // Aggregate rented stock
  "sizes": [
    {
      "ageCategory": "DEWASA",
      "size": "M",
      "quantity": 5,
      "isActive": true
    },
    {
      "ageCategory": "DEWASA",
      "size": "L",
      "quantity": 5,
      "isActive": true
    }
  ]
}
```

**Business Rules**:
1. **Quantity Consistency**: Product quantity = sum of all size quantities
2. **Active Size Management**: Only active sizes are included in aggregations
3. **Age Category Validation**: Must be valid enum value (ANAK/DEWASA)
4. **Size Validation**: Must be valid size enum (S/M/L/XL/XXL)

### Size Aggregation System

#### Purpose
Provides UI-friendly aggregated views while preserving detailed business logic tracking.

#### Aggregation Logic

```typescript
// Aggregation calculation flow
const totalQuantity = sizes
  .filter(size => size.isActive)
  .reduce((sum, size) => sum + size.quantity, 0)

const ageCategoryBreakdown = sizes
  .filter(size => size.isActive)
  .reduce((breakdown, size) => {
    // Group by age category
    // Calculate totals per category
    // Provide size-level details
  }, [])
```

#### Caching Strategy
- **Cache Duration**: 5 minutes with stale-while-revalidate
- **Cache Key**: Product ID + aggregation parameters
- **Invalidation**: On product or size updates
- **Performance**: Reduces database load for frequently accessed products

### Migration Between Modes

#### Legacy to Advanced Migration

**Trigger**: When `hasSizes` changes from false to true

**Process**:
1. **Data Preservation**: Convert existing size to ProductSize record
2. **Quantity Distribution**: Distribute quantity to new size record
3. **Validation**: Ensure data consistency
4. **Rollback Capability**: Maintain ability to revert if needed

**Implementation**:
```typescript
async migrateLegacySizeToAdvanced(productId: string, newSizes: ProductSize[]) {
  // 1. Validate current state
  // 2. Create ProductSize records
  // 3. Update product hasSizes flag
  // 4. Verify aggregation consistency
}
```

## Material Management Integration (RPK-45)

### Business Context
Integration with material management system for tracking material consumption per product.

### Data Model
```json
{
  "materialId": "string",           // Foreign key to Material table
  "materialQuantity": number        // Required material quantity per product unit
}
```

### Business Rules

#### 1. Material Selection Validation
- **Rule**: MaterialId must reference existing active material
- **Implementation**: Foreign key validation in service layer
- **Error Handling**: NotFoundError for invalid material references

#### 2. Quantity Consistency
- **Rule**: If materialId is provided, materialQuantity is required
- **Rule**: MaterialQuantity must be positive number
- **Implementation**: Cross-field validation in schema and service

#### 3. Business Logic Flow
```
Product Creation with Material:
├── Material Existence Check
├── Quantity Validation (> 0)
├── Cost Calculation Impact (optional)
└── Inventory Planning Integration
```

### Integration Points

#### With Inventory System
- **Stock Calculation**: Material requirements for production planning
- **Cost Analysis**: Material cost impact on product pricing
- **Procurement Planning**: Material demand forecasting

#### With Reporting System
- **Material Usage Reports**: Track material consumption per product
- **Cost Analysis**: Material cost per rental transaction
- **Efficiency Metrics**: Material utilization optimization

## Rental History Tracking (RPK-46)

### Business Purpose
Comprehensive tracking of product rental lifecycle for business intelligence and customer service.

### Data Capture

#### Transaction Integration
```json
{
  "transactionCode": "TXN001",
  "date": "2024-01-15T10:30:00Z",
  "type": "RENTAL|RETURN",
  "status": "COMPLETED|PENDING|CANCELLED",
  "amount": 25000,
  "duration": 3,           // Days
  "customerInfo": {        // Role-based masking
    "name": "string",
    "phone": "string",
    "address": "string"
  },
  "notes": "string"
}
```

#### Business Events Tracked
1. **Rental Initiation**: Product reserved for customer
2. **Rental Confirmation**: Payment completed, product released
3. **Rental Extension**: Duration modified
4. **Return Process**: Product returned, condition verified
5. **Late Return**: Overdue product tracking
6. **Damage/Loss**: Incident documentation

### Role-Based Data Access

#### Owner Role
- **Access Level**: Full access to all data
- **Customer Data**: Complete customer information
- **Financial Data**: Full transaction details
- **Analytics**: Complete business intelligence

#### Producer Role
- **Access Level**: Operational data access
- **Customer Data**: Masked personal information
- **Financial Data**: Limited financial details
- **Analytics**: Product-focused insights

#### Kasir Role
- **Access Level**: Transaction-focused data
- **Customer Data**: Transaction-relevant information only
- **Financial Data**: Current transaction details
- **Analytics**: Basic operational metrics

### Data Masking Implementation

```typescript
function maskCustomerData(data: HistoryRecord, userRole: UserRole): HistoryRecord {
  switch (userRole) {
    case 'owner':
      return data // Full access

    case 'producer':
      return {
        ...data,
        customerName: maskName(data.customerName),
        customerPhone: maskPhone(data.customerPhone)
      }

    case 'kasir':
      return {
        ...data,
        customerName: data.customerName.substring(0, 3) + '***',
        customerPhone: '***-***-' + data.customerPhone.slice(-4)
      }
  }
}
```

### Analytics & Insights

#### Product Performance Metrics
- **Rental Frequency**: How often product is rented
- **Revenue Generation**: Total revenue per product
- **Average Rental Duration**: Typical rental period
- **Customer Retention**: Repeat rental patterns
- **Seasonal Trends**: Time-based rental patterns

#### Business Intelligence
- **Popular Products**: Most frequently rented items
- **Revenue Analysis**: High-performing products by revenue
- **Customer Behavior**: Rental pattern analysis
- **Inventory Optimization**: Demand-based stock planning

## File Upload & Management System

### Business Requirements
- **Image Quality**: Professional product presentation
- **Storage Efficiency**: Optimized file sizes
- **Access Control**: Secure file access
- **Maintenance**: Old file cleanup

### Upload Workflow

#### 1. Validation Phase
```typescript
const validationRules = {
  fileTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxSize: 5 * 1024 * 1024, // 5MB
  dimensions: {
    minWidth: 200,
    minHeight: 200,
    maxWidth: 2000,
    maxHeight: 2000
  }
}
```

#### 2. Processing Phase
- **Image Optimization**: Automatic compression and resizing
- **Format Conversion**: Standardization to optimal format
- **Thumbnail Generation**: Multiple size variants
- **Metadata Extraction**: Image properties and EXIF data

#### 3. Storage Phase
- **Path Organization**: Structured storage hierarchy
- **Public Access**: CDN integration for fast delivery
- **Backup Strategy**: Redundant storage for reliability
- **Version Control**: Old image retention for rollback

### File Organization

```
Storage Structure:
products/
├── {product_code}/
│   ├── original/
│   │   └── image.jpg
│   ├── optimized/
│   │   ├── 800x600.webp
│   │   ├── 400x300.webp
│   │   └── 200x150.webp
│   └── thumbnails/
│       ├── 100x100.webp
│       └── 50x50.webp
```

### Update & Cleanup Logic

#### Image Replacement Process
1. **Validation**: New image validation
2. **Processing**: Image optimization
3. **Upload**: New image storage
4. **URL Update**: Database URL update
5. **Cleanup**: Old image deletion
6. **Verification**: Upload success confirmation

#### Cleanup Business Rules
- **Immediate Cleanup**: Failed uploads removed immediately
- **Scheduled Cleanup**: Orphaned files removed weekly
- **Retention Policy**: Old images retained for 30 days
- **Error Recovery**: Cleanup failure logging and retry

## Validation & Quality Assurance

### Business Logic Validation System

#### Validation Types

##### 1. Consistency Validation
**Purpose**: Ensure aggregated data matches detailed records

**Checks**:
- Product quantity = sum of size quantities
- Aggregation totals match database sums
- Active/inactive status consistency
- Cross-table reference integrity

##### 2. Capability Validation
**Purpose**: Verify all business capabilities remain functional

**Capabilities Tested**:
- **Rental Tracking**: Can track product rentals
- **Inventory Management**: Can manage stock levels
- **Size Management**: Can handle size variations
- **Reporting**: Can generate business reports
- **Financial Tracking**: Can calculate costs/revenue

##### 3. Business Logic Preservation
**Purpose**: Comprehensive system health check

**Areas Validated**:
- **Data Consistency**: All data relationships are valid
- **Business Rules**: All business rules are enforced
- **Integration Points**: All service integrations work
- **Performance**: System performs within acceptable limits

### Validation Implementation

#### Automated Validation Triggers
- **On Data Changes**: Immediate validation after updates
- **Scheduled Validation**: Daily comprehensive checks
- **On-Demand Validation**: Manual validation requests
- **Pre-Deployment**: Validation before system updates

#### Validation Response Format
```json
{
  "overallHealth": "excellent|good|warning|critical",
  "validationResults": {
    "consistency": {
      "passed": true,
      "issues": [],
      "warnings": []
    },
    "businessCapabilities": {
      "rentalTracking": true,
      "inventoryManagement": true,
      "sizeManagement": true,
      "reporting": true
    },
    "performanceMetrics": {
      "responseTime": 150,
      "queryEfficiency": 0.85,
      "cacheHitRate": 0.92
    }
  },
  "recommendations": [
    {
      "type": "performance",
      "priority": "medium",
      "message": "Consider adding index on category_id",
      "action": "Database optimization"
    }
  ]
}
```

## Error Handling & Recovery

### Error Classification System

#### 1. Validation Errors
- **Type**: User input errors
- **Response**: 400 Bad Request
- **Recovery**: User correction required
- **Examples**: Invalid product code, missing required fields

#### 2. Business Logic Errors
- **Type**: Business rule violations
- **Response**: 409 Conflict or 422 Unprocessable Entity
- **Recovery**: Business process adjustment
- **Examples**: Duplicate product code, insufficient stock

#### 3. System Errors
- **Type**: Infrastructure failures
- **Response**: 500 Internal Server Error
- **Recovery**: System intervention required
- **Examples**: Database connection failure, file storage issues

#### 4. Authorization Errors
- **Type**: Access control violations
- **Response**: 401 Unauthorized or 403 Forbidden
- **Recovery**: Permission adjustment required
- **Examples**: Invalid session, insufficient role privileges

### Recovery Strategies

#### Graceful Degradation
- **Size Aggregation Failure**: Return basic product data without aggregation
- **Image Upload Failure**: Use default image, continue with product creation
- **History Retrieval Failure**: Return product data without history
- **Validation Failure**: Continue operation with warning flags

#### Retry Mechanisms
- **Database Operations**: Exponential backoff retry for transient failures
- **File Operations**: Immediate retry with fallback options
- **External Service Calls**: Circuit breaker pattern implementation
- **Cache Operations**: Fallback to direct database queries

### Monitoring & Alerting

#### Key Performance Indicators
- **Response Time**: API endpoint performance
- **Error Rate**: Failure frequency monitoring
- **Data Consistency**: Validation check results
- **Resource Usage**: System resource consumption

#### Alert Thresholds
- **Critical**: Error rate > 5%, Response time > 5 seconds
- **Warning**: Error rate > 2%, Response time > 2 seconds
- **Info**: Unusual traffic patterns, cache miss rate > 50%

## Integration Patterns

### Frontend Integration

#### Data Flow Pattern
```
Frontend Component
├── useProducts Hook
├── ProductAPI Client
├── API Route Handler
├── ProductService
└── Database Layer
```

#### State Management
- **React Query**: Cache management and synchronization
- **Optimistic Updates**: Immediate UI feedback
- **Error Boundaries**: Graceful error handling
- **Loading States**: Progressive data loading

### Service Integration

#### Internal Service Communication
```
ProductService
├── Uses CategoryService for validation
├── Uses ColorService for validation
├── Uses MaterialService for integration
├── Uses FileUploadService for images
└── Uses HistoryService for tracking
```

#### External Service Integration
- **Authentication**: Clerk session validation
- **File Storage**: Supabase storage integration
- **Database**: Prisma ORM operations
- **Caching**: Redis integration (optional)

## Performance Optimization

### Database Optimization

#### Query Optimization
- **Selective Loading**: Include only required fields and relations
- **Pagination**: Efficient pagination with cursor-based approach
- **Indexing**: Strategic database indices for common queries
- **Connection Pooling**: Efficient database connection management

#### Caching Strategy
- **Application Cache**: In-memory caching for frequently accessed data
- **Database Cache**: Query result caching
- **CDN Cache**: Static asset caching
- **Browser Cache**: Client-side caching directives

### Business Logic Optimization

#### Batch Operations
- **Bulk Validation**: Process multiple validations simultaneously
- **Aggregation Batching**: Calculate multiple aggregations in single query
- **File Processing**: Batch image optimization operations
- **History Processing**: Bulk history data updates

#### Lazy Loading
- **Aggregation Data**: Load only when requested
- **History Data**: Paginated loading on demand
- **File Data**: Progressive image loading
- **Validation Results**: On-demand validation execution

---

*This document covers the comprehensive business logic of the manage-product system. For API specifications, see [manage-product-endpoints.md](./manage-product-endpoints.md). For system architecture, see [manage-product-system-flow.md](./manage-product-system-flow.md).*