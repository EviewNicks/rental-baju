# Task RPK-43: Manage Product Field Migration & Compatibility Fix

**Task ID:** RPK-43  
**Epic:** Manage Product System Enhancement  
**Priority:** Critical  
**Created:** 2025-08-07  
**Estimated Effort:** 6-8 hours  
**Risk Level:** Medium

## =Ë Task Overview

Melakukan migrasi field naming dari `hargaSewa` ke `currentPrice` untuk memastikan kompatibilitas penuh antara frontend dan backend setelah Prisma schema reset. Task ini dibagi menjadi 2 fase utama: Backend/Server-side dan Frontend/Client-side.

**Root Issue:** Field mismatch antara ekspektasi frontend (`hargaSewa`) dengan database schema aktual (`currentPrice`) menyebabkan potensi runtime errors dan API failures.

## <¯ Success Criteria

- [ ] Field naming consistency 100% antara frontend dan backend
- [ ] Zero runtime errors terkait field mismatch
- [ ] Full functionality `rentedStock` tracking
- [ ] API compatibility 100%
- [ ] All tests passing
- [ ] Documentation updated

## =Ê Current State Analysis

### Compatibility Matrix
| Layer | Status | Compatibility | Action Required |
|-------|--------|---------------|-----------------|
| Database |  Ready | 100% | None |
| Types |   Critical | 60% | Field rename |
| Services |   Critical | 60% | Field rename |
| API Routes |   Critical | 60% | Field rename |
| Frontend | =6 Partial | 80% | Labels update |

---

## =' PHASE 1: Backend/Server-side Implementation

**Duration:** 3-4 hours  
**Priority:** Critical (Must complete before Phase 2)

### 1.1 Database Layer Verification
**Status:**  Already Complete  
**Time:** 0 hours

- [x] Prisma schema updated with `currentPrice` field
- [x] Migration applied successfully
- [x] Seed data loaded (Categories: 5, Colors: 10)
- [x] Performance indexes implemented

### 1.2 TypeScript Types Update
**Status:**   Critical  
**Estimated Time:** 30 minutes

**Files to Update:**
- `features/manage-product/types/index.ts`

**Changes Required:**
```typescript
// BEFORE (Current - Broken)
interface BaseProduct {
  hargaSewa: any // L Field mismatch
}

// AFTER (Target - Fixed)
interface BaseProduct {
  currentPrice: Decimal //  Matches database
  rentedStock: number   //  New field support
}
```

**Tasks:**
- [ ] Update `BaseProduct` interface
- [ ] Update `CreateProductRequest` interface  
- [ ] Update `UpdateProductRequest` interface
- [ ] Add `rentedStock` field to all relevant types
- [ ] Update validation schemas

### 1.3 Service Layer Migration
**Status:**   Critical  
**Estimated Time:** 1 hour

**Files to Update:**
- `features/manage-product/services/productService.ts`

**Changes Required:**
```typescript
// Update all references from hargaSewa to currentPrice
// Add rentedStock handling in CRUD operations
// Update availability calculation: quantity - rentedStock
```

**Tasks:**
- [ ] Replace `hargaSewa` with `currentPrice` in all service methods
- [ ] Add `rentedStock` field handling
- [ ] Implement availability calculation logic
- [ ] Update error messages and validation
- [ ] Add proper type casting for Decimal fields

### 1.4 API Routes Update
**Status:**   Critical  
**Estimated Time:** 1 hour

**Files to Update:**
- `app/api/products/route.ts`
- `app/api/products/[id]/route.ts`

**Critical Fix:**
```typescript
// BEFORE (Broken)
const hargaSewaStr = formData.get('hargaSewa')

// AFTER (Fixed)
const currentPriceStr = formData.get('currentPrice')
```

**Tasks:**
- [ ] Update form data parsing for `currentPrice`
- [ ] Update response formatting
- [ ] Add `rentedStock` field in API responses
- [ ] Update error handling for new field names
- [ ] Ensure proper Decimal serialization

### 1.5 Database Integration Testing
**Status:** =6 Pending  
**Estimated Time:** 30 minutes

**Tasks:**
- [ ] Test all CRUD operations with new field names
- [ ] Verify data integrity after migration
- [ ] Test Kasir integration compatibility
- [ ] Validate index performance
- [ ] Test edge cases (null values, validation)

### 1.6 Backend Quality Assurance
**Estimated Time:** 1 hour

**Tasks:**
- [ ] Run integration tests
- [ ] API endpoint testing via Postman/Thunder Client
- [ ] Performance testing for new indexes
- [ ] Error handling validation
- [ ] Database query optimization verification

---

## <¨ PHASE 2: Frontend/Client-side Implementation

**Duration:** 2-3 hours  
**Priority:** High (Depends on Phase 1 completion)

### 2.1 Component Form Updates
**Status:** =6 Partial  
**Estimated Time:** 1 hour

**Files to Update:**
- `features/manage-product/components/forms/*`
- Form field labels and validation

**Changes Required:**
```tsx
// BEFORE
<Input name="hargaSewa" label="Harga Sewa" />

// AFTER  
<Input name="currentPrice" label="Harga Sewa" />
```

**Tasks:**
- [ ] Update all form field names from `hargaSewa` to `currentPrice`
- [ ] Keep user-facing labels as "Harga Sewa" (Indonesian)
- [ ] Add `rentedStock` field display where needed
- [ ] Update form validation schemas
- [ ] Test form submission and data binding

### 2.2 Display Components Update
**Status:**  Mostly Compatible  
**Estimated Time:** 30 minutes

**Files to Check:**
- Product list components
- Product detail views  
- Price display components

**Tasks:**
- [ ] Verify prop-based components still work
- [ ] Update any hardcoded field references
- [ ] Add availability display (quantity - rentedStock)
- [ ] Update TypeScript interfaces usage

### 2.3 API Client Integration
**Status:** =6 Needs Update  
**Estimated Time:** 30 minutes

**Files to Update:**
- `features/manage-product/api.ts`
- Hook files that use product data

**Tasks:**
- [ ] Update API client to use `currentPrice`
- [ ] Update response data transformation
- [ ] Test data fetching and caching
- [ ] Verify React Query integration
- [ ] Update error handling for new field names

### 2.4 Frontend Validation & Testing
**Estimated Time:** 1 hour

**Tasks:**
- [ ] End-to-end testing of product CRUD operations
- [ ] Form validation testing
- [ ] User interface regression testing  
- [ ] Mobile responsiveness verification
- [ ] Accessibility testing for updated forms

---

## =€ Implementation Plan

### Phase 1 Execution Order
1. **Types Update** ’ **Service Migration** ’ **API Routes** ’ **Testing**
2. Critical path: Cannot proceed to Phase 2 without Phase 1 completion
3. Database rollback plan ready if issues occur

### Phase 2 Execution Order  
1. **Forms** ’ **API Client** ’ **Components** ’ **Testing**
2. Incremental deployment possible
3. User-facing changes minimal (only backend field names change)

## >ê Testing Strategy

### Backend Testing
- [ ] Unit tests for service layer
- [ ] Integration tests for API endpoints
- [ ] Database query performance tests
- [ ] Kasir integration compatibility tests

### Frontend Testing  
- [ ] Component rendering tests
- [ ] Form submission tests
- [ ] Data fetching tests
- [ ] E2E user workflow tests

### Regression Testing
- [ ] Full product lifecycle testing
- [ ] Cross-browser compatibility
- [ ] Mobile device testing
- [ ] Performance benchmarking

##   Risk Assessment

### High Risk
- **Data corruption** if field mapping is incorrect
- **Production downtime** if API breaks during deployment
- **Kasir integration failure** if relationships break

### Mitigation Strategies
- [ ] Database backup before any changes
- [ ] Staged deployment (backend first, then frontend)
- [ ] Rollback scripts prepared
- [ ] Production monitoring during deployment

## =Ú Documentation Updates Required

### Technical Documentation
- [ ] API documentation with new field names
- [ ] Database schema documentation
- [ ] Integration guide updates

### User Documentation  
- [ ] No user-facing changes (labels remain the same)
- [ ] Admin guide updates if needed

## = Deployment Strategy

### Stage 1: Backend Deployment
1. Deploy backend changes with field mapping
2. Verify API compatibility
3. Test with existing frontend (should work due to backward compatibility)

### Stage 2: Frontend Deployment  
1. Deploy frontend updates
2. Verify end-to-end functionality
3. Monitor for errors and performance

### Stage 3: Cleanup
1. Remove any temporary backward compatibility code
2. Update monitoring and alerting
3. Performance optimization if needed

---

## =Ë Acceptance Criteria

### Backend Completion Criteria
- [ ] All API endpoints return `currentPrice` field
- [ ] `rentedStock` field properly handled
- [ ] No runtime errors in API responses
- [ ] Integration tests passing
- [ ] Performance benchmarks met

### Frontend Completion Criteria
- [ ] All forms submit with correct field names
- [ ] Product data displays correctly
- [ ] No JavaScript errors in console
- [ ] User workflow tests passing
- [ ] Cross-browser compatibility verified

### Overall Success Criteria
- [ ] Zero production errors post-deployment
- [ ] Full feature functionality restored
- [ ] Kasir integration compatibility maintained
- [ ] Performance impact minimal (<5% degradation)
- [ ] User experience unchanged

---

**Next Actions:**
1. Begin Phase 1 immediately (backend critical fixes)
2. Create backup of current production data  
3. Prepare rollback strategy
4. Schedule deployment window
5. Coordinate with team for testing support

**Dependencies:**
- Database backup completion
- Testing environment availability  
- Team coordination for deployment window

**Success Metrics:**
- Zero field mismatch errors
- API response time <200ms maintained
- User workflow completion rate 100%
- Production stability post-deployment