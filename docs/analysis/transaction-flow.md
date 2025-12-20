# Transaction System Flow Analysis

## Overview

This document provides a comprehensive analysis of the transaction system in the Kasir feature, covering the complete flow from frontend form submission to database persistence and response serialization.

## 📁 System Architecture

### File Structure & Responsibilities

```
Transaction System Components:
├── UI Layer
│   └── features/kasir/components/form/TransactionFormPage.tsx
├── Hook Layer  
│   ├── features/kasir/hooks/useTransactionForm.ts
│   └── features/kasir/hooks/useTransactions.ts
├── API Client Layer
│   └── features/kasir/api.ts
├── API Route Layer
│   └── app/api/kasir/transaksi/route.ts
├── Service Layer
│   └── features/kasir/services/transaksiService.ts
├── Serialization Layer
│   └── features/kasir/lib/serializers/transaksiSerializer.ts
└── Validation Layer
    └── features/kasir/lib/validation/kasirSchema.ts
```

## 🔄 Transaction Creation Flow

### Step 1: Frontend Form Management

**File**: `features/kasir/components/form/TransactionFormPage.tsx`

```typescript
// 4-Step Transaction Wizard
Step 1: Product Selection (with size-aware inventory)
Step 2: Customer Selection/Creation  
Step 3: Cashier Assignment
Step 4: Payment & Summary
```

**Key Features**:
- Form persistence to localStorage
- Step-by-step validation
- Data restoration on page reload
- Error handling with user-friendly messages

### Step 2: Form Hook Processing

**File**: `features/kasir/hooks/useTransactionForm.ts`

```typescript
submitTransaction() Flow:
1. Validate all form steps
2. Transform form data to API format
3. Handle size-aware vs legacy item format
4. Create transaction via API
5. Process payment with rollback mechanism
6. Reset form on success
```

**Key Features**:
- Fixed 4-day rental duration
- Payment rollback on failure
- Comprehensive error handling
- Form state persistence

### Step 3: API Client Layer

**File**: `features/kasir/api.ts`

```typescript
KasirApi.createTransaksi() Flow:
1. Input sanitization (XSS protection)
2. Circuit breaker protection
3. HTTP request with retry logic
4. Error mapping and handling
```

**Reliability Features**:
- Circuit breaker (5 failures, 10s timeout)
- Exponential backoff retry (max 3 attempts)
- Input sanitization for security
- Comprehensive error classification

### Step 4: API Route Handler

**File**: `app/api/kasir/transaksi/route.ts`

```typescript
POST /api/kasir/transaksi Flow:
1. Clerk authentication check
2. Request body parsing and validation (Zod)
3. Service layer delegation
4. Response serialization
5. Error handling with proper HTTP status codes
```

### Step 5: Service Layer Processing

**File**: `features/kasir/services/transaksiService.ts`

```typescript
createTransaksiSizeAware() Flow:
1. Customer validation
2. Kasir validation (optional)
3. Product size data retrieval
4. Price calculation
5. Transaction code generation
6. Database transaction execution
7. Async activity logging
```

**Optimization Pattern**:
```typescript
// 3-Phase Optimized Pattern
Phase 1: Pre-validation (outside transaction)
Phase 2: Core operations (inside transaction, 10s timeout)
Phase 3: Async logging (after transaction, non-blocking)
```

### Step 6: Database Transaction

```typescript
Database Operations (Atomic):
1. Stock validation (inside transaction)
2. Transaction record creation
3. Transaction items creation (bulk insert)
4. Stock quantity updates
5. Full data retrieval with relations
```

### Step 7: Response Serialization

**File**: `features/kasir/lib/serializers/transaksiSerializer.ts`

```typescript
serializeTransaksi() Flow:
1. Type conversion (Decimal → number)
2. Date formatting (ISO strings)
3. Nested object serialization
4. Multi-condition return data handling
```

## 📋 Transaction Listing Flow

### Query Processing

```typescript
useTransactions() → KasirApi.getTransaksiList() → 
GET /api/kasir/transaksi → TransaksiService.getTransaksiList() →
serializeTransaksiListItem()
```

**Features**:
- React Query integration with 30s auto-refresh
- Advanced filtering (status, search, date range)
- Enhanced status calculation
- Pagination support
- Summary statistics

### Enhanced Status Calculation

```typescript
calculateEnhancedStatus() Priority Order:
1. terlambat (overdue)
2. cancelled  
3. selesai (completed)
4. diambil (picked up - all items)
5. active (default)
```

**Business Rules**:
- Auto-completion when all items returned
- Pickup status based on ALL items picked up
- Overdue detection based on end date
- Server-side calculation for consistency

## 🏗️ Key Architecture Patterns

### 1. Size-Aware Inventory System (RPK-51)

```typescript
// Dual Format Support
Legacy Format: { produkId, jumlah, durasi }
Size-Aware Format: { produkId, productSizeId, jumlah, durasi }

// Stock Management
ProductSize entities for granular inventory
Optimized validation inside database transactions
```

### 2. Multi-Condition Return System (TSK-24)

```typescript
// Flexible Return Processing
Single Condition: Traditional one-condition-per-item
Multi-Condition: Multiple conditions per item with quantity splits

// Penalty Structure
Flat Late Penalty: 20,000 IDR for late returns
Condition Penalties: Manual pricing based on damage category
```

### 3. Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  states: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  failureThreshold: 5
  recoveryTimeout: 10000ms
}
```

### 4. Form Persistence Strategy

```typescript
// Auto-save on form changes
useEffect(() => {
  if (hasFormData) {
    saveFormData(formData, currentStep)
  }
}, [formData, currentStep])

// Restore on component mount
useEffect(() => {
  const persistedData = loadFormData()
  if (persistedData) {
    setFormData(persistedData)
    setIsDataRestored(true)
  }
}, [])
```

## 🔧 Performance Optimizations

### Database Transaction Optimization

```typescript
// Before: 8-12 seconds (dual validation)
// After: 2-3 seconds (single validation inside transaction)

Optimization Techniques:
1. Single stock validation inside transaction
2. Bulk insert for transaction items
3. Async activity logging
4. Selective field loading for different use cases
```

### Query Optimization

```typescript
// Different query strategies for different needs
getTransaksiForValidation(): Ultra-lean query (70% faster)
getTransaksiForPenaltyCalculation(): Penalty-specific fields only
getTransaksiByIdentifier(): Full details with relations
```

### Caching Strategy

```typescript
// React Query Configuration
staleTime: 5 minutes
gcTime: 10 minutes  
refetchInterval: 30 seconds (for real-time updates)
```

## 🛡️ Error Handling & Resilience

### Error Classification

```typescript
Error Types:
1. VALIDATION_ERROR - Input validation failures
2. AVAILABILITY_ERROR - Stock insufficient
3. NETWORK_ERROR - Connection issues
4. PAYMENT_ROLLBACK_FAILURE - Critical payment issues
5. CIRCUIT_BREAKER_OPEN - Service temporarily unavailable
```

### Rollback Mechanisms

```typescript
Payment Failure Rollback:
1. Attempt payment creation (max 3 retries)
2. On failure: Mark transaction as cancelled
3. Restore stock quantities
4. Log detailed error information
5. Provide user-friendly error message
```

### Input Sanitization

```typescript
Security Measures:
1. HTML tag removal
2. XSS character filtering  
3. Length limitations
4. Phone number normalization
5. Email format standardization
```

## 📊 Data Flow Diagrams

### Transaction Creation Data Flow

```
User Form Input
    ↓
Form Validation & Persistence
    ↓
API Client (Circuit Breaker + Retry)
    ↓
API Route (Auth + Validation)
    ↓
Service Layer (Business Logic)
    ↓
Database Transaction (Atomic Operations)
    ↓
Response Serialization
    ↓
UI Update & Success Handling
```

### Status Enhancement Flow

```
Database Status
    ↓
Item Pickup Analysis
    ↓
Return Status Check
    ↓
Overdue Date Validation
    ↓
Enhanced Status Calculation
    ↓
Frontend Display
```

## 🔍 Monitoring & Logging

### Transaction Logging

```typescript
TransactionLogger Features:
1. API payload logging (development only)
2. Form data logging for debugging
3. Kasir assignment tracking
4. Performance timing
5. Error context capture
```

### Performance Metrics

```typescript
Key Metrics Tracked:
1. Transaction creation time
2. Database operation duration
3. API response times
4. Circuit breaker state changes
5. Retry attempt counts
```

## 🚀 Future Enhancements

### Planned Improvements

1. **Real-time Updates**: WebSocket integration for live transaction updates
2. **Batch Operations**: Support for bulk transaction processing
3. **Advanced Analytics**: Transaction pattern analysis and reporting
4. **Mobile Optimization**: Progressive Web App features
5. **Offline Support**: Local storage with sync capabilities

### Scalability Considerations

1. **Database Sharding**: Partition transactions by date/region
2. **Caching Layer**: Redis for frequently accessed data
3. **Queue System**: Background processing for heavy operations
4. **CDN Integration**: Static asset optimization
5. **Microservices**: Split into domain-specific services

## 📝 Development Guidelines

### Adding New Transaction Features

1. **Service Layer First**: Implement business logic in TransaksiService
2. **API Route**: Add endpoint with proper validation
3. **Client Integration**: Update KasirApi with new methods
4. **Hook Integration**: Create/update React hooks
5. **UI Components**: Build user interface components
6. **Serialization**: Update serializers for new data structures

### Testing Strategy

1. **Unit Tests**: Service layer business logic
2. **Integration Tests**: API endpoints with database
3. **E2E Tests**: Complete user workflows
4. **Performance Tests**: Load testing for critical paths
5. **Error Scenarios**: Failure mode testing

---

*Last Updated: December 2024*
*Document Version: 1.0*
*System Version: RPK-26 with TSK-24 enhancements*