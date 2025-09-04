# RPK-47: Fix Owner Role 403 Errors - Implementation Plan

## Problem Analysis

### Root Cause
The KASIR_PERMISSIONS object in `lib/auth-middleware.ts` only defines permissions for `admin`, `kasir`, and `user` roles, but the actual system uses `owner`, `producer`, and `kasir` roles. When owner users access kasir APIs:

1. Authentication succeeds (Clerk validates user)
2. `requirePermission('produk', 'read')` is called
3. `hasPermission(userRole='owner', ...)` looks up `KASIR_PERMISSIONS["owner"]`
4. Returns `undefined` → empty array → `hasPermission()` returns `false`
5. Results in 403 Forbidden error

### Current Architecture Issues
- **Producer APIs** (`/api/products`): Simple Clerk auth - works for owner
- **Kasir APIs** (`/api/kasir/*`): Permission-based auth - fails for owner
- **Role Mismatch**: Permission system expects admin/kasir/user, but system uses owner/producer/kasir
- **No Hierarchy**: Missing role inheritance (owner should get all permissions)

## Solution Architecture

### 1. Hierarchical Role System Design

**Role Hierarchy** (from highest to lowest):
```
owner → Full access (all permissions)
  ↓
producer → Product management + kasir operations  
  ↓
kasir → Transaction management only
```

**Permission Inheritance**:
- Owner inherits: owner + producer + kasir permissions
- Producer inherits: producer + kasir permissions  
- Kasir inherits: kasir permissions only

### 2. Backward Compatibility Strategy

**Legacy Role Mapping**:
- `admin` → maps to `owner` level access (full permissions)
- `kasir` → remains as kasir level access
- `user` → minimal read-only access (unchanged)

**Migration Path**:
- Existing KASIR_PERMISSIONS structure maintained
- New roles added alongside existing ones
- No breaking changes to existing API contracts

### 3. Security Design Principles

- **Fail-Safe Defaults**: Unknown roles get no permissions
- **Explicit Inheritance**: Roles must explicitly inherit permissions
- **Principle of Least Privilege**: Each role gets minimum required permissions
- **Clear Boundaries**: Well-defined permission boundaries between roles

## Technical Implementation Plan

### Phase 1: TypeScript Interface Updates

**File**: `lib/auth-middleware.ts`

1. **Extend RolePermissions Interface**:
```typescript
export interface RolePermissions {
  admin: Permission[]      // Legacy - maps to owner level
  owner: Permission[]      // New - full access
  producer: Permission[]   // New - product + kasir access
  kasir: Permission[]      // Existing - transaction access only
  user: Permission[]       // Existing - minimal access
}
```

2. **Add Role Hierarchy Configuration**:
```typescript
export const ROLE_HIERARCHY: Record<string, string[]> = {
  owner: ['owner', 'producer', 'kasir', 'admin'],    // Inherits all roles
  producer: ['producer', 'kasir'],                   // Inherits kasir permissions
  kasir: ['kasir'],                                  // Own permissions only  
  admin: ['admin', 'kasir'],                        // Legacy mapping
  user: ['user']                                    // Minimal permissions
}
```

### Phase 2: Permission System Enhancement

**Update KASIR_PERMISSIONS Object**:

```typescript
export const KASIR_PERMISSIONS: RolePermissions = {
  // NEW: Owner - Full access to all resources
  owner: [
    { resource: 'penyewa', action: 'create' },
    { resource: 'penyewa', action: 'read' },
    { resource: 'penyewa', action: 'update' },
    { resource: 'penyewa', action: 'delete' },
    { resource: 'transaksi', action: 'create' },
    { resource: 'transaksi', action: 'read' },
    { resource: 'transaksi', action: 'update' },
    { resource: 'transaksi', action: 'delete' },
    { resource: 'pembayaran', action: 'create' },
    { resource: 'pembayaran', action: 'read' },
    { resource: 'pembayaran', action: 'update' },
    { resource: 'pembayaran', action: 'delete' },
    { resource: 'produk', action: 'create' },
    { resource: 'produk', action: 'read' },
    { resource: 'produk', action: 'update' },
    { resource: 'produk', action: 'delete' },
    { resource: 'audit', action: 'read' },
    { resource: 'audit', action: 'create' }
  ],
  
  // NEW: Producer - Product management + operational access
  producer: [
    { resource: 'penyewa', action: 'create' },
    { resource: 'penyewa', action: 'read' },
    { resource: 'penyewa', action: 'update' },
    { resource: 'transaksi', action: 'create' },
    { resource: 'transaksi', action: 'read' },
    { resource: 'transaksi', action: 'update' },
    { resource: 'pembayaran', action: 'create' },
    { resource: 'pembayaran', action: 'read' },
    { resource: 'produk', action: 'create' },
    { resource: 'produk', action: 'read' },
    { resource: 'produk', action: 'update' },
    { resource: 'produk', action: 'delete' }
  ],
  
  // EXISTING: Admin - Legacy role with full access
  admin: [ /* existing admin permissions */ ],
  
  // EXISTING: Kasir - Operational access only  
  kasir: [ /* existing kasir permissions */ ],
  
  // EXISTING: User - Minimal access
  user: [ /* existing user permissions */ ]
}
```

### Phase 3: Core Logic Updates

**Enhanced hasPermission() Function**:
```typescript
export function hasPermission(
  userRole: string,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete'
): boolean {
  // Get role hierarchy for the user
  const inheritedRoles = ROLE_HIERARCHY[userRole] || []
  
  // Check permissions across all inherited roles
  for (const role of inheritedRoles) {
    const rolePermissions = KASIR_PERMISSIONS[role as keyof RolePermissions] || []
    const hasAccess = rolePermissions.some(p => p.resource === resource && p.action === action)
    if (hasAccess) {
      return true
    }
  }
  
  return false // Fail-safe default
}
```

**New Utility Functions**:
```typescript
export function getRoleHierarchy(userRole: string): string[] {
  return ROLE_HIERARCHY[userRole] || []
}

export function hasRoleAccess(userRole: string, requiredRole: string): boolean {
  const hierarchy = getRoleHierarchy(userRole)
  return hierarchy.includes(requiredRole)
}

export function isOwnerRole(userRole: string): boolean {
  return userRole === 'owner' || userRole === 'admin' // Legacy admin = owner
}

export function isProducerRole(userRole: string): boolean {
  return hasRoleAccess(userRole, 'producer')
}

export function isKasirRole(userRole: string): boolean {
  return hasRoleAccess(userRole, 'kasir')
}
```

### Phase 4: Enhanced Authorization Functions

**Updated Role-Specific Functions**:
```typescript
// Owner-specific access (replaces requireAdminAccess)
export async function requireOwnerAccess() {
  const authResult = await requireAuth()
  if (authResult.error) return authResult
  
  if (!isOwnerRole(authResult.user.role)) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Owner access required' },
        { status: 403 }
      )
    }
  }
  
  return authResult
}

// Producer-level access (product management + kasir)
export async function requireProducerAccess() {
  const authResult = await requireAuth()
  if (authResult.error) return authResult
  
  if (!isProducerRole(authResult.user.role)) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Producer access required' },
        { status: 403 }
      )
    }
  }
  
  return authResult
}

// Updated kasir access to use hierarchy
export async function requireKasirAccess() {
  const authResult = await requireAuth()
  if (authResult.error) return authResult
  
  if (!isKasirRole(authResult.user.role)) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Kasir access required' },
        { status: 403 }
      )
    }
  }
  
  return authResult
}
```

## Testing Strategy

### 1. Unit Tests
**File**: `lib/__tests__/auth-middleware.test.ts`

- Test role hierarchy inheritance
- Test permission lookup across inherited roles  
- Test backward compatibility with admin/kasir/user
- Test fail-safe defaults for unknown roles
- Test utility functions (isOwnerRole, hasRoleAccess, etc.)

### 2. Integration Tests  
**File**: `__tests__/integration/auth/role-permissions.test.ts`

- Test owner accessing kasir APIs (should succeed)
- Test producer accessing kasir APIs (should succeed)
- Test kasir accessing owner APIs (should fail)
- Test legacy admin role still works
- Test API endpoints with different role combinations

### 3. E2E Tests
**File**: `__tests__/playwright/auth/role-hierarchy.spec.ts`

- Test complete user flows with different roles
- Test UI permission enforcement
- Test route-level authorization
- Test error handling and messaging

### 4. Manual Validation Checklist

**Owner Role Testing**:
- [ ] Can access `/api/kasir/produk/available`
- [ ] Can access `/api/kasir/transaksi`
- [ ] Can access `/api/products`
- [ ] Can access all dashboard features
- [ ] No 403 errors in kasir operations

**Producer Role Testing**:
- [ ] Can access kasir APIs for transactions
- [ ] Can manage products
- [ ] Cannot access owner-only features
- [ ] Proper permission boundaries maintained

**Kasir Role Testing**:
- [ ] Can access transaction management
- [ ] Cannot access product management
- [ ] Cannot access owner features
- [ ] Existing functionality unchanged

**Backward Compatibility**:
- [ ] Existing admin users still work
- [ ] Existing kasir users unchanged
- [ ] No breaking changes to API responses

## Risk Assessment & Mitigation

### Risk Level: MEDIUM

**Potential Risks**:
1. **Logic Errors**: Incorrect permission inheritance could grant unauthorized access
2. **Performance Impact**: Role hierarchy lookups could slow down auth checks
3. **Backward Compatibility**: Breaking existing admin/kasir role behavior

**Mitigation Strategies**:
1. **Comprehensive Testing**: Unit + Integration + E2E test coverage
2. **Gradual Rollout**: Deploy to staging first, monitor logs carefully
3. **Rollback Plan**: Single file change - easy to revert via git
4. **Monitoring**: Add logging to track role assignments and permission checks

### Security Considerations

**Secure by Default**:
- Unknown roles get no permissions (fail-safe)
- Explicit permission inheritance (no implicit access)
- Clear audit trail of role hierarchy decisions

**Security Testing**:
- Test privilege escalation scenarios
- Verify role boundaries are maintained
- Test edge cases (empty roles, malformed data)

## Deployment Plan

### Phase 1: Implementation (Day 1)
1. Implement TypeScript interface updates
2. Add role hierarchy configuration
3. Update KASIR_PERMISSIONS with new roles
4. Enhance hasPermission() function
5. Add utility functions

### Phase 2: Testing (Day 1-2)
1. Write and run unit tests
2. Create integration tests
3. Manual testing of core scenarios
4. Performance testing of permission checks

### Phase 3: Deployment (Day 2)
1. Deploy to staging environment
2. Run full test suite in staging
3. Manual validation of user flows
4. Monitor logs for permission errors

### Phase 4: Production (Day 3)
1. Deploy to production with monitoring
2. Watch for 403 errors in logs
3. Verify owner role access works
4. Monitor performance metrics

## Success Criteria

**Primary Goals**:
- [ ] Owner users can access kasir APIs without 403 errors
- [ ] Role hierarchy properly enforced (owner > producer > kasir)
- [ ] Backward compatibility maintained for existing roles
- [ ] No security vulnerabilities introduced

**Performance Goals**:
- [ ] Permission checks complete in <10ms
- [ ] No noticeable impact on API response times
- [ ] Memory usage remains stable

**Quality Goals**:
- [ ] 95%+ test coverage for auth middleware changes
- [ ] All E2E tests pass
- [ ] Zero critical security issues in code review

## Monitoring & Maintenance

**Key Metrics to Monitor**:
- 403 error rates on kasir APIs
- Authentication success/failure rates  
- Permission check latency
- Role distribution across users

**Alerting**:
- Alert on unusual 403 error spikes
- Monitor permission check performance
- Track any authentication failures

**Documentation Updates**:
- Update API documentation with new role hierarchy
- Update developer onboarding materials
- Create troubleshooting guide for permission issues

## Rollback Plan

**Immediate Rollback** (if critical issues):
1. Revert `lib/auth-middleware.ts` to previous version
2. Deploy immediately to production
3. Monitor for restoration of service

**Partial Rollback** (if specific issues):
1. Disable new roles by commenting out hierarchy config
2. Fall back to original admin/kasir/user roles
3. Address issues and re-enable gradually

**Recovery Procedure**:
1. Identify specific failing scenarios
2. Fix permission logic in development
3. Test thoroughly in staging
4. Redeploy with fixes

---

## Conclusion

This implementation provides a robust, secure, and backward-compatible solution to the owner role 403 errors. The hierarchical permission system establishes proper role inheritance while maintaining all existing functionality. With comprehensive testing and careful deployment, this change will resolve the authentication issues and provide a foundation for future role-based access control enhancements.