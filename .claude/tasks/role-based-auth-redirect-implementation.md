# 🎯 Task Plan: Implement Role-Based Authentication Redirect System

## 📋 Project Context
**Objective**: Streamline user flow from root (/) to role-specific dashboards after sign-in, eliminating intermediate homepage exposure.

**Current State**: Root → Homepage → Sign-in → Dashboard
**Target State**: Root → Sign-in → Role Dashboard (direct)

## 🏗️ Architecture Analysis

### Current Implementation Status
- ✅ Clerk authentication with custom session claims
- ✅ Role-based middleware protection (`middleware.ts`)
- ✅ Role navigation hook (`useRoleNavigation()` with `getDashboardUrl()`)
- ✅ Existing sign-in page (`app/sign-in/[[...sign-in]]/page.tsx`)
- ✅ Homepage at root (`app/page.tsx`)
- ✅ Navigation with role-based dashboard links

### Key Files Analysis
1. **middleware.ts**: Protects routes `/owner/*`, `/producer/*`, `/dashboard/*` with role validation
2. **app/sign-in/[[...sign-in]]/page.tsx**: Basic Clerk SignIn component without redirect logic
3. **app/page.tsx**: Homepage component requiring authentication bypass
4. **useRoleNavigation()**: Already implements `getDashboardUrl()` with role-specific paths
5. **lib/auth-middleware.ts**: Server-side auth utilities

## 🎯 Implementation Requirements

### Functional Requirements
1. **Root Route Handling**: Unauthenticated users accessing `/` → redirect to `/sign-in`
2. **Sign-in Redirect**: After successful sign-in → redirect to role-specific dashboard
3. **Role Mapping**:
   - `owner` → `/owner`
   - `producer` → `/producer/manage-product`
   - `kasir/admin` → `/dashboard`
4. **Deep Link Support**: Honor `redirect_url` parameter for post-auth redirects
5. **Homepage Preservation**: Move homepage to accessible route (e.g., `/home` or `/landing`)

### Technical Requirements
- Follow Clerk best practices for authentication flows
- Maintain TypeScript type safety
- Preserve existing RBAC middleware protection
- Support development environment role switching
- Ensure backward compatibility with existing API routes

## 🚀 Implementation Plan

### Phase 1: Foundation Setup
**Objective**: Create redirect utilities and update middleware logic

#### Task 1.1: Create Role-Based Redirect Utility
- **File**: `lib/auth-redirect.ts`
- **Purpose**: Centralized redirect logic for role-based navigation
- **Functions**:
  - `getRoleRedirectUrl(role: string, fallback?: string)`
  - `handleUnauthenticatedAccess(request: Request)`
  - `validateRedirectUrl(url: string)`

#### Task 1.2: Update Middleware for Root Route Protection
- **File**: `middleware.ts`
- **Changes**:
  - Add root route (`/`) handling for unauthenticated users
  - Integrate with new redirect utility
  - Preserve existing protected route logic
- **Logic**: Unauthenticated at `/` → redirect to `/sign-in?redirect_url=/`

#### Task 1.3: Create Enhanced Sign-in Page
- **File**: `app/sign-in/[[...sign-in]]/page.tsx`
- **Enhancements**:
  - Handle `redirect_url` query parameter
  - Post-sign-in redirect to role dashboard
  - Maintain existing styling and UX

### Phase 2: Homepage Reorganization
**Objective**: Move homepage while maintaining accessibility

#### Task 2.1: Relocate Homepage Component
- **Action**: Move `app/page.tsx` → `app/(public)/home/page.tsx`
- **Route**: Make homepage accessible at `/home`
- **Preserve**: All existing functionality and styling

#### Task 2.2: Create Public Route Group
- **Directory**: `app/(public)/`
- **Purpose**: Distinguish public routes from protected routes
- **Includes**: `/home`, `/sign-in`, `/sign-up`, `/unauthorized`

#### Task 2.3: Update Navigation Links
- **File**: `features/homepage/component/Navbars.tsx`
- **Changes**: Update logo link from `/` to `/home`
- **Preserve**: All navigation functionality

### Phase 3: Redirect Logic Implementation
**Objective**: Implement comprehensive redirect handling

#### Task 3.1: Enhanced Sign-in Component
- **File**: `app/sign-in/[[...sign-in]]/page.tsx`
- **Features**:
  - Parse `redirect_url` from query parameters
  - Set `afterSignInUrl` in Clerk configuration
  - Fallback to role-based dashboard redirect

#### Task 3.2: Create Redirect Handler Utility
- **File**: `lib/redirect-handler.ts`
- **Functions**:
  - `parseRedirectUrl(request: Request)`
  - `getSafeRedirectUrl(url: string, fallback: string)`
  - `buildSignInUrl(currentPath: string)`

#### Task 3.3: Update Middleware Redirect Logic
- **File**: `middleware.ts`
- **Enhancements**:
  - Handle authenticated users at root → redirect to dashboard
  - Preserve `redirect_url` parameter through auth flow
  - Handle edge cases (invalid URLs, malformed requests)

### Phase 4: Testing & Validation
**Objective**: Comprehensive testing across all roles and scenarios

#### Task 4.1: Role-Based Testing
- **Owner Role**: `/` → `/sign-in` → `/owner`
- **Producer Role**: `/` → `/sign-in` → `/producer/manage-product`
- **Kasir Role**: `/` → `/sign-in` → `/dashboard`
- **Unauthenticated**: `/` → `/sign-in` (no redirect)

#### Task 4.2: Deep Link Testing
- **Scenario**: `/owner/settings` (unauthenticated) → `/sign-in?redirect_url=/owner/settings` → `/owner/settings`
- **Validation**: Preserve original intended destination after auth

#### Task 4.3: Edge Case Testing
- **Invalid redirect URLs**: Malformed or external URLs → fallback to dashboard
- **Missing role**: Users without role → `/unauthorized`
- **Development role switching**: Ensure dev tools still work

## 🔧 Technical Implementation Details

### Middleware Logic Enhancement
```typescript
// Root route handling for unauthenticated users
if (req.nextUrl.pathname === '/' && !auth().userId) {
  const url = new URL('/sign-in', req.url)
  url.searchParams.set('redirect_url', '/')
  return Response.redirect(url)
}

// Authenticated user at root → dashboard redirect
if (req.nextUrl.pathname === '/' && auth().userId) {
  const dashboardUrl = getDashboardUrlForRole(userRole)
  return Response.redirect(new URL(dashboardUrl, req.url))
}
```

### Sign-in Component Enhancement
```typescript
// Extract redirect_url from query params
const redirectUrl = searchParams.get('redirect_url')
const safeRedirectUrl = getSafeRedirectUrl(redirectUrl, getDashboardUrlForRole(role))

// Clerk configuration
<SignIn
  afterSignInUrl={safeRedirectUrl}
  signUpUrl="/sign-up"
  // ... existing props
/>
```

### URL Validation Utility
```typescript
function getSafeRedirectUrl(url: string | null, fallback: string): string {
  if (!url) return fallback

  try {
    const parsed = new URL(url, window.location.origin)
    // Only allow same-origin URLs
    if (parsed.origin !== window.location.origin) return fallback
    // Disallow protocol-relative URLs
    if (url.startsWith('//')) return fallback
    return parsed.pathname + parsed.search
  } catch {
    return fallback
  }
}
```

## 🔒 Security Considerations

### Redirect URL Validation
- **Same-Origin Policy**: Only redirect to same-origin URLs
- **Protocol Validation**: Prevent `//evil.com` redirects
- **Path Traversal**: Validate against `../` attacks
- **URL Length**: Prevent excessively long redirect URLs

### Session Management
- **Clerk Integration**: Use Clerk's built-in redirect mechanisms
- **Session Validation**: Ensure session is active before redirect
- **Role Verification**: Validate role exists before dashboard redirect

## 🚨 Risk Assessment & Mitigation

### High-Risk Areas
1. **Root Route Changes**: Could break existing bookmarks/links
   - **Mitigation**: Create 301 redirects and update documentation

2. **Homepage Accessibility**: Users might lose access to homepage
   - **Mitigation**: Provide clear navigation to `/home` route

3. **Redirect Loops**: Potential infinite redirect scenarios
   - **Mitigation**: Implement loop detection and safe fallbacks

### Medium-Risk Areas
1. **Role Mapping Changes**: Break existing dashboard access
   - **Mitigation**: Thorough testing across all role types

2. **Clerk Configuration**: Authentication flow disruption
   - **Mitigation**: Follow Clerk documentation and best practices

### Low-Risk Areas
1. **Development Environment**: Role switching tools might be affected
   - **Mitigation**: Ensure dev utilities are preserved

## 🔄 Rollback Procedures

### Immediate Rollback (< 5 minutes)
1. **Restore Original middleware.ts**: Remove root route handling
2. **Restore Homepage**: Move `app/page.tsx` back to original location
3. **Revert Sign-in Changes**: Remove redirect logic from sign-in page
4. **Clear Browser Cache**: Ensure no cached redirects persist

### Partial Rollback
1. **Homepage Only**: Keep middleware changes, restore homepage access
2. **Redirect Logic Only**: Keep homepage changes, revert redirect implementation
3. **Middleware Only**: Revert middleware to original state, keep other changes

## 📊 Success Metrics

### Primary Metrics
- **Authentication Success Rate**: ≥ 99.5% successful sign-ins
- **Redirect Accuracy**: 100% correct role-based redirects
- **Page Load Time**: < 2 seconds for auth redirects

### Secondary Metrics
- **User Experience**: No broken bookmarks or lost functionality
- **Error Rate**: < 0.1% redirect-related errors
- **Security**: Zero successful redirect attacks

## 🧪 Testing Strategy

### Unit Tests
- **Redirect Utilities**: `getSafeRedirectUrl()`, `getRoleRedirectUrl()`
- **URL Validation**: Malformed URL handling, same-origin validation
- **Role Mapping**: Correct dashboard URLs for each role

### Integration Tests
- **Middleware Flow**: Complete auth redirect pipeline
- **Clerk Integration**: Sign-in with redirect parameters
- **Route Protection**: Unauthorized access handling

### E2E Tests
- **User Journeys**: Complete flows for each role type
- **Deep Link Scenarios**: Complex redirect chains
- **Edge Cases**: Error handling and fallback behavior

### Performance Tests
- **Redirect Latency**: Time from sign-in to dashboard
- **Concurrent Users**: Multiple simultaneous authentications
- **Memory Usage**: Redirect utility performance under load

## 📝 Documentation Updates

### Technical Documentation
- **Architecture Guide**: Updated auth flow diagrams
- **API Documentation**: New redirect utilities
- **Deployment Guide**: Rollback procedures and monitoring

### User Documentation
- **User Guide**: Updated login flow instructions
- **Admin Guide**: Role management and redirect behavior
- **FAQ**: Common redirect scenarios and troubleshooting

## 🎯 Implementation Timeline

### Phase 1 (Days 1-2): Foundation
- Task 1.1: Create redirect utilities (0.5 day)
- Task 1.2: Update middleware (0.5 day)
- Task 1.3: Enhanced sign-in page (1 day)

### Phase 2 (Days 3-4): Homepage Reorganization
- Task 2.1: Relocate homepage (0.5 day)
- Task 2.2: Create public route group (0.5 day)
- Task 2.3: Update navigation (1 day)

### Phase 3 (Days 5-6): Redirect Logic
- Task 3.1: Enhanced sign-in component (1 day)
- Task 3.2: Redirect handler utility (0.5 day)
- Task 3.3: Middleware redirect logic (0.5 day)

### Phase 4 (Days 7-8): Testing & Validation
- Task 4.1: Role-based testing (1 day)
- Task 4.2: Deep link testing (0.5 day)
- Task 4.3: Edge case testing (0.5 day)

**Total Estimated Time**: 8 days

## ✅ Acceptance Criteria

### Functional Requirements
- [ ] Unauthenticated users accessing `/` are redirected to `/sign-in`
- [ ] After sign-in, users are redirected to correct role dashboard
- [ ] `redirect_url` parameter is preserved through auth flow
- [ ] Homepage remains accessible at `/home`
- [ ] All existing functionality is preserved

### Security Requirements
- [ ] Only same-origin redirects are allowed
- [ ] Malformed URLs fall back to safe defaults
- [ ] No redirect loops or security vulnerabilities
- [ ] All existing RBAC protections remain intact

### Performance Requirements
- [ ] Auth redirects complete within 2 seconds
- [ ] No performance degradation for existing routes
- [ ] Minimal memory overhead for redirect utilities

### Compatibility Requirements
- [ ] Backward compatibility with existing API routes
- [ ] Development environment role switching preserved
- [ ] All existing tests continue to pass
- [ ] No breaking changes to public APIs

---

**Status**: Ready for Implementation
**Risk Level**: Medium (Mitigated with comprehensive testing)
**Priority**: High (Core user experience improvement)