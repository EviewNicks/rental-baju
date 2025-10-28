# Fix Clerk Session Role Extraction - Implementation Plan

## Problem Analysis

Producer users are being redirected to `/unauthorized` instead of `/producer/manage-product` due to incorrect role extraction pattern in `middleware.ts`.

### Root Cause
- **middleware.ts line 82**: `const role = sessionClaims?.metadata?.role as string` (WRONG - returns undefined)
- **middleware.ts line 97**: `const userRole = sessionClaims?.metadata?.role as string` (WRONG - returns undefined)
- **lib/auth-middleware.ts line 25**: `const role = (user.publicMetadata.role as string) || 'user'` (CORRECT)
- **API routes**: `metadata?.role || sessionClaims.role || 'producer'` (CORRECT with fallback)

### Current Implementation Issues
1. Inconsistent role extraction patterns between middleware and API routes
2. Missing fallback mechanisms in middleware.ts
3. No robust error handling for undefined roles
4. Using wrong session claim structure (`metadata.role` vs `publicMetadata.role`)

## Implementation Plan

### Phase 1: Research & Analysis ✅
- [x] Analyze current auth patterns across codebase
- [x] Identify session claims structure differences
- [x] Understand fallback mechanisms in API routes

### Phase 2: Fix middleware.ts Role Extraction
**Target Lines: 82 and 97**

**Current (WRONG):**
```typescript
const role = sessionClaims?.metadata?.role as string
const userRole = sessionClaims?.metadata?.role as string
```

**New Implementation (CORRECT):**
```typescript
// Extract role with proper fallback chain
const extractRole = (claims: any) => {
  // Try multiple sources in order of preference
  return claims?.metadata?.role ||
         claims?.role ||
         claims?.publicMetadata?.role ||
         'user' // fallback
}

const role = extractRole(sessionClaims)
const userRole = extractRole(sessionClaims)
```

### Phase 3: Add Helper Function
Create centralized role extraction utility:
```typescript
// Add at top of middleware.ts
const extractUserRole = (sessionClaims: any): string => {
  // Fallback chain for role extraction
  return sessionClaims?.metadata?.role ||
         sessionClaims?.role ||
         sessionClaims?.publicMetadata?.role ||
         'user' // safe fallback
}
```

### Phase 4: Update Role Validation Logic
- Update all role checks to use the new helper function
- Add null/undefined checks before role comparisons
- Ensure consistent role string handling

### Phase 5: Add Debug Logging (Temporary)
- Add console logs to track role extraction during testing
- Monitor role values for different user types
- Remove logs after verification

### Phase 6: Testing Strategy
**Test Scenarios:**
1. **Owner user**: Should redirect to `/owner`
2. **Producer user**: Should redirect to `/producer/manage-product`
3. **Kasir user**: Should redirect to `/dashboard`
4. **Admin user**: Should redirect to `/dashboard`
5. **Unknown role**: Should redirect to `/unauthorized`
6. **Undefined role**: Should use fallback and redirect appropriately

**Test Method:**
- Use Next.js dev server with console logs
- Test each role type through browser
- Verify redirect URLs
- Check middleware logs for role extraction values

### Phase 7: Validation & Cleanup
- Remove debug logging
- Verify no regressions in API routes
- Test all protected routes still work
- Confirm lib/auth-middleware.ts still functions correctly

## Technical Implementation Details

### Files to Modify:
1. **middleware.ts** (Primary fix)
   - Lines 82, 97: Role extraction
   - Add helper function
   - Add debug logging (temporary)

### Files to Verify (No Changes):
1. **lib/auth-middleware.ts** - Should remain unchanged
2. **API routes** - Should continue working with existing patterns
3. **Auth components** - Should not be affected

### Risk Mitigation:
- **Low Risk**: Changes are isolated to middleware.ts
- **Fallback Pattern**: Multiple fallback sources prevent failures
- **Backward Compatibility**: Existing API patterns preserved
- **Rollback**: Simple changes, easy to revert if issues

## Success Criteria
1. ✅ Producer users redirect to `/producer/manage-product`
2. ✅ All other roles redirect to correct dashboards
3. ✅ No regressions in existing API routes
4. ✅ No errors in browser console
5. ✅ Consistent role extraction across middleware

## Implementation Timeline
- **Phase 2-3**: Code changes (15 minutes)
- **Phase 6**: Testing (20 minutes)
- **Phase 7**: Validation & cleanup (10 minutes)
- **Total**: ~45 minutes

## Notes
- This is a minimal, targeted fix
- Preserves existing auth infrastructure
- Follows fallback patterns from API routes
- No breaking changes expected