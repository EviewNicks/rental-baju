# Audit Trail Cleanup Plan

## Files Requiring Cleanup

### 🔴 **HIGH PRIORITY - Frontend Components**
These files have extensive audit trail code that should be cleaned up:

1. **features/manage-product/components/form-product/ProductForm.tsx**
   - Remove `formLogger` imports and usage
   - Remove all `formLogger.info/debug/warn/error` calls
   - Remove "Frontend Audit Trail" comments
   - Remove audit-related useEffect hooks
   - Remove `auditFormSubmission` function and related code

2. **features/manage-product/components/form-product/ProductFormPage.tsx**
   - Remove all `[FRONTEND AUDIT]` console.log statements
   - Remove form data preparation audit logs
   - Clean up submission audit trails

### 🟡 **MEDIUM PRIORITY - Backend Services**
These files have backend audit trails that may need selective cleanup:

3. **features/manage-product/services/productService.ts**
   - Remove `[AUDIT]` console.log statements
   - Keep error logging but remove audit-specific formatting
   - Clean up product creation/update audit trails

4. **app/api/products/[id]/route.ts**
   - Remove `[BACKEND AUDIT]` console.log statements
   - Keep essential error logging
   - Clean up API request/response audit logging

### 🟢 **LOW PRIORITY - Other Components**
These may have less critical audit code:

5. **features/manage-product/components/material/MaterialForm.tsx**
   - Remove `formLogger` usage (if not needed for production)

6. **features/manage-product/components/advanced/AdvancedProductForm.tsx**
   - Remove `formLogger` usage (if not needed for production)

### ⚪ **SKIP - Intentional Audit Services**
These files should NOT be cleaned up as they're part of the audit system:

- `features/kasir/services/auditService.ts` - Keep (intentional audit service)
- `features/kasir/services/inventoryService.ts` - Review selectively
- Test files - Keep audit expectations for testing

## Cleanup Strategy

### Phase 1: Frontend Components
1. Clean ProductForm.tsx and ProductFormPage.tsx
2. Remove all temporary audit trail code
3. Keep essential error logging

### Phase 2: Backend Services  
1. Clean productService.ts and API routes
2. Replace audit console.logs with proper error logging
3. Keep business logic intact

### Phase 3: Verification
1. Test all cleaned components
2. Ensure no functionality is broken
3. Verify error handling still works

## Code Patterns to Remove

### Frontend Patterns:
```typescript
// Remove these patterns:
const formLogger = logger.child('ComponentName')
formLogger.info/debug/warn/error(...)
console.log('[FRONTEND AUDIT]', ...)
// Frontend Audit Trail comments
auditFormSubmission functions
```

### Backend Patterns:
```typescript
// Remove these patterns:
console.log('[AUDIT]', ...)
console.log('[BACKEND AUDIT]', ...)
// AUDIT TRAIL comments
```

### Keep These Patterns:
```typescript
// Keep essential error logging:
console.error('Error message', error)
logger.error('Error context', error)
```

## Git Status Context
Current modified files that may contain audit trails:
- features/manage-product/components/form-product/ProductForm.tsx ✅
- features/manage-product/components/form-product/ProductFormPage.tsx ✅  
- features/manage-product/services/productService.ts ✅
- app/api/products/[id]/route.ts ✅
- And others listed in git status

## Next Steps
1. Start with HIGH PRIORITY files
2. Remove audit trail code systematically
3. Test each component after cleanup
4. Commit changes incrementally