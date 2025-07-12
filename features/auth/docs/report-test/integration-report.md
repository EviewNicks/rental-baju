# Integration Test Plan - TSK-15 Role-Based Access Control

## 1. Identifikasi Dokumen

- **Judul Dokumen:** Integration Test Plan - TSK-15 Role-Based Access Control
- **Identifikasi Versi dan Tanggal:**
  - Versi: 1.0
  - Tanggal: 2024-12-28
- **Author:** AI Assistant
- **Reviewer:** Pending

## 2. Pendahuluan

- **Tujuan:**  
  Mendokumentasikan rencana integration testing untuk User Story TSK-15 yang mencakup sistem Role-Based Access Control (RBAC) lengkap dengan authentication dan authorization menggunakan Clerk.

- **Ruang Lingkup:**  
  Integration testing mencakup interaksi antar komponen untuk:
  - TSK-33: Role Management System (Context, Hooks, Cache, Cross-tab Sync)
  - TSK-34: Middleware Authorization (Route Protection, Role Validation)
  - End-to-end authentication & authorization flow
  - Dashboard pages role-based access control

- **Instruksi :**  
    - Keep basic integration tests untuk component logic
    - Remove complex JWT mocking - fokus pada business logic
    - Use simple mock data untuk role testing

- **Referensi:**
  - User Story TSK-15: [story-tsk-15.md](../task-docs/story-tsk-15.md)
  - Task TSK-33: [task-tsk-33.md](../task-docs/story-15/task-tsk-33.md)
  - Task TSK-34: [task-tsk-34.md](../task-docs/story-15/task-tsk-34.md)
  - TSK-33 Test Plan: [test-tsk-33.md](test-story-15/test-tsk-33.md)

## 3. Integration Test Strategy

### 3.1 Test Environment Setup

```bash
# Integration test scripts
"test:integration": "jest --testPathPattern='.*\\.integration\\.test\\.(ts|tsx)$' --verbose"
"test:integration:auth": "jest __tests__/integration/auth/ --verbose"
"test:integration:watch": "jest __tests__/integration/auth/ --watch --verbose"
```

### 3.2 Metodologi

- **Tools**: Jest + React Testing Library + MSW (Mock Service Worker)
- **Approach**: Bottom-up integration testing
- **Mock Strategy**: Mock external dependencies (Clerk API), test real component interactions
- **Data Flow**: Test complete user journey dari authentication sampai authorization

## 4. Integration Test Cases

### 4.1 Authentication & Role Management Integration

#### 4.1.1 Context + Hooks Integration

**File**: `__tests__/integration/auth/role-management.integration.test.ts`

**Note**: Testing integrasi antara UserRoleContext dengan semua custom hooks untuk memastikan data flow dan state management berjalan dengan benar.

##### Test Cases:

- ✅ **should integrate context with all hooks seamlessly**
  - Setup UserRoleProvider dengan mock Clerk session
  - Test useUserRole, useRoleGuard, useRoleLoadingState hooks
  - Verifikasi data consistency across all hooks

- ✅ **should handle role changes across all hooks simultaneously**
  - Trigger role update via context action
  - Verify all hooks receive updated role immediately
  - Test computed values (isAdmin, isCreator, permissions) update correctly

- ✅ **should manage loading states across hook ecosystem**
  - Test loading state propagation saat role fetch
  - Verify shouldShowLoader consistency across hooks
  - Test error state handling across all hooks

- ✅ **should handle context provider unmounting gracefully**
  - Test cleanup saat component unmount
  - Verify no memory leaks atau lingering subscriptions
  - Test re-initialization saat remount

#### 4.1.2 Clerk Session Integration

**File**: `__tests__/integration/auth/clerk-session.integration.test.ts`

**Note**: Testing integrasi dengan Clerk authentication system untuk memastikan role extraction dan session management berfungsi dengan benar.

##### Test Cases:

- ✅ **should sync role with Clerk session lifecycle**
  - Mock Clerk useAuth dan useSession hooks
  - Test role extraction saat user login
  - Test role clearing saat user logout
  - Verify context state updates correctly

- ✅ **should handle session token refresh**
  - Simulate token refresh dengan new role
  - Test role update propagation
  - Verify cache invalidation dan re-fetch

- ✅ **should handle invalid or expired tokens gracefully**
  - Mock expired JWT tokens
  - Test fallback to default role ("user")
  - Verify error handling dan user feedback

- ✅ **should integrate with Clerk session events**
  - Mock session.created, session.updated, session.destroyed events
  - Test automatic role sync pada session changes
  - Verify no duplicate API calls

#### 4.1.3 Cross-tab Synchronization Integration

**File**: `__tests__/integration/auth/cross-tab-sync.integration.test.ts`

**Note**: Testing cross-tab role synchronization menggunakan BroadcastChannel untuk memastikan consistency across browser tabs.

##### Test Cases:

- ✅ **should sync role changes across browser tabs**
  - Setup multiple UserRoleProvider instances (simulate tabs)
  - Mock BroadcastChannel untuk message passing
  - Test role update broadcast dan reception
  - Verify state consistency across all instances

- ✅ **should handle BroadcastChannel unavailability gracefully**
  - Mock BroadcastChannel not supported
  - Test fallback behavior (graceful degradation)
  - Verify no errors thrown

- ✅ **should prevent infinite message loops**
  - Test message filtering dengan tab IDs
  - Verify sender doesn't receive own messages
  - Test multiple rapid role changes

- ✅ **should handle tab communication errors**
  - Mock BroadcastChannel errors
  - Test error recovery mechanisms
  - Verify system continues functioning

#### 4.1.4 Cache Integration

**File**: `__tests__/integration/auth/cache-integration.integration.test.ts`

**Note**: Testing integrasi antara memory cache dan sessionStorage untuk role caching dengan TTL management.

##### Test Cases:

- ✅ **should integrate memory cache with sessionStorage backup**
  - Test cache hit/miss scenarios
  - Test sessionStorage backup on cache set
  - Test recovery from sessionStorage on cache miss
  - Mock sessionStorage untuk isolated testing

- ✅ **should handle cache TTL expiration correctly**
  - Mock Date.now() untuk time-based testing
  - Test cache expiration behavior
  - Verify automatic cleanup expired entries
  - Test fresh fetch after expiration

- ✅ **should handle sessionStorage errors gracefully**
  - Mock sessionStorage quota exceeded
  - Mock sessionStorage disabled
  - Test fallback to memory-only cache
  - Verify no application crashes

- ✅ **should sync cache across context instances**
  - Test cache consistency dengan multiple contexts
  - Test cache invalidation propagation
  - Verify singleton cache manager behavior

### 4.2 Authorization & Route Protection Integration

#### 4.2.1 Middleware Authorization Integration

**File**: `__tests__/integration/auth/middleware-authorization.integration.test.ts`

**Note**: Testing middleware authorization flow untuk route protection berdasarkan user roles.

##### Test Cases:

- ✅ **should protect admin routes correctly**
  - Mock user dengan role "user" accessing /admin/dashboard
  - Test middleware redirect to unauthorized page
  - Verify admin user can access admin routes
  - Test role hierarchy (admin > creator > user)

- ✅ **should protect creator routes correctly**
  - Test creator dan admin access to /creator/dashboard
  - Test user denial to creator routes
  - Verify proper redirect behavior

- ✅ **should allow public routes for all users**
  - Test /dashboard access for all roles
  - Test unauthenticated user redirect to sign-in
  - Verify no false positives

- ✅ **should handle middleware errors gracefully**
  - Mock Clerk session errors
  - Test fallback behavior
  - Verify no infinite redirects

#### 4.2.2 Dashboard Pages Authorization Integration

**File**: `__tests__/integration/auth/dashboard-authorization.integration.test.ts`

**Note**: Testing role-based access control pada dashboard pages dengan client-side authorization checks.

##### Test Cases:

- ✅ **should render appropriate dashboard content based on role**
  - Test admin dashboard dengan admin role
  - Test creator dashboard dengan creator role
  - Test user dashboard dengan user role
  - Verify role-specific content visibility

- ✅ **should handle unauthorized access attempts**
  - Mock user accessing admin dashboard
  - Test error page rendering
  - Verify proper error messages
  - Test redirect suggestions

- ✅ **should integrate with role hooks for permission checks**
  - Test useRoleGuard integration dalam pages
  - Test conditional rendering berdasarkan permissions
  - Verify real-time role updates affect page content

- ✅ **should handle loading states during role fetch**
  - Test loading skeleton rendering
  - Test transition dari loading ke content
  - Verify no flash of unauthorized content

<!-- ### 4.3 End-to-End Authentication Flow Integration

#### 4.3.1 Complete User Journey Integration

**File**: `__tests__/integration/auth/complete-user-journey.integration.test.ts`

**Note**: Testing complete user journey dari login sampai dashboard access dengan proper role assignment.

##### Test Cases:

- ✅ **should handle complete admin user journey**
  - Mock Clerk login dengan admin role
  - Test role extraction dan context update
  - Test navigation to admin dashboard
  - Verify admin-specific features accessible

- ✅ **should handle complete creator user journey**
  - Mock creator login flow
  - Test creator dashboard access
  - Test creator-specific tools visibility
  - Verify proper permission checks

- ✅ **should handle complete regular user journey**
  - Mock user login dengan user role
  - Test general dashboard access
  - Test restriction dari admin/creator areas
  - Verify user-appropriate content

- ✅ **should handle role change during session**
  - Mock role update dari admin (user → creator)
  - Test real-time role sync
  - Test permission updates
  - Verify UI updates without page refresh -->

## 5. Mock Strategy untuk Integration Testing

### 5.1 Clerk Authentication Mocks

```typescript
// Mock Clerk hooks untuk predictable testing
const mockUseAuth = jest.fn()
const mockUseSession = jest.fn()
const mockUseUser = jest.fn()

jest.mock('@clerk/nextjs', () => ({
  useAuth: mockUseAuth,
  useSession: mockUseSession,
  useUser: mockUseUser,
}))
```

### 5.2 BroadcastChannel Mock

```typescript
// Mock BroadcastChannel untuk cross-tab testing
global.BroadcastChannel = jest.fn().mockImplementation((channel) => ({
  postMessage: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  close: jest.fn(),
  name: channel,
}))
```

### 5.3 SessionStorage Mock

```typescript
// Mock sessionStorage dengan error simulation
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
})
```

### 5.4 MSW Handlers untuk Clerk API

```typescript
// Mock Clerk API responses
export const authHandlers = [
  rest.get('/clerk/session', (req, res, ctx) => {
    return res(
      ctx.json({
        token: 'mock.jwt.token.with.role.claim',
        user: { id: 'user_123', role: 'admin' },
      }),
    )
  }),
]
```

## 6. Test Data dan Scenarios

### 6.1 User Personas untuk Testing

```typescript
export const testUsers = {
  admin: {
    id: 'admin_123',
    role: 'admin',
    firstName: 'Admin',
    token: 'admin.jwt.token',
  },
  creator: {
    id: 'creator_123',
    role: 'creator',
    firstName: 'Creator',
    token: 'creator.jwt.token',
  },
  user: {
    id: 'user_123',
    role: 'user',
    firstName: 'User',
    token: 'user.jwt.token',
  },
}
```

### 6.2 Route Protection Scenarios

```typescript
export const routeScenarios = [
  {
    route: '/admin/dashboard',
    allowedRoles: ['admin'],
    deniedRoles: ['creator', 'user'],
    redirectTo: '/unauthorized',
  },
  {
    route: '/creator/dashboard',
    allowedRoles: ['admin', 'creator'],
    deniedRoles: ['user'],
    redirectTo: '/unauthorized',
  },
  {
    route: '/dashboard',
    allowedRoles: ['admin', 'creator', 'user'],
    deniedRoles: [],
    redirectTo: '/sign-in',
  },
]
```

## 7. Coverage Targets

### 7.1 Integration Coverage Goals

| Test Suite                  | Scenarios | Success Rate | Components Covered |
| --------------------------- | --------- | ------------ | ------------------ |
| Role Management Integration | 12        | 95%+         | Context, All Hooks |
| Clerk Session Integration   | 8         | 90%+         | Clerk + Context    |
| Cross-tab Sync Integration  | 8         | 90%+         | BroadcastChannel   |
| Cache Integration           | 8         | 95%+         | Cache + Storage    |
| Middleware Authorization    | 10        | 95%+         | Middleware + Pages |
| Dashboard Authorization     | 12        | 90%+         | Pages + Hooks      |
| Complete User Journey       | 8         | 90%+         | End-to-end Flow    |

### 7.2 Overall Integration Metrics

- **Total Integration Test Cases:** 66
- **Target Success Rate:** 92%+
- **Coverage:** Focus on component interactions, not code coverage
- **Performance:** Each test suite < 30 seconds execution time

## 8. Success Criteria

### 8.1 Functional Success

- [ ] All role-based access control scenarios working
- [ ] Clerk integration seamless dan error-free
- [ ] Cross-tab synchronization reliable
- [ ] Cache integration efficient dan consistent
- [ ] Middleware authorization protecting routes correctly
- [ ] Dashboard pages showing appropriate content per role

### 8.2 Technical Success

- [ ] No memory leaks dalam component interactions
- [ ] Proper cleanup pada component unmounting
- [ ] Error boundaries handling integration failures
- [ ] Performance acceptable untuk production usage

### 8.3 Quality Gates

- [ ] All integration tests passing consistently
- [ ] No flaky tests (intermittent failures)
- [ ] Clear error messages untuk failed scenarios
- [ ] Documentation updated dengan integration patterns

## 9. Implementation Timeline

### Phase 1: Core Integration Tests (Week 1)

- [ ] Setup integration test environment
- [ ] Implement role management integration tests
- [ ] Implement Clerk session integration tests
- [ ] Implement cache integration tests

### Phase 2: Authorization Integration Tests (Week 2)

- [ ] Implement middleware authorization tests
- [ ] Implement dashboard authorization tests
- [ ] Implement cross-tab sync integration tests

### Phase 3: End-to-End Integration Tests (Week 3)

- [ ] Implement complete user journey tests
- [ ] Performance testing untuk integration scenarios
- [ ] Documentation dan optimization

## 10. Risk Mitigation

### 10.1 High Risk Areas

1. **Async State Management** - Race conditions dalam role updates
2. **Mock Complexity** - Over-mocking dapat hide real integration issues
3. **Browser API Dependencies** - BroadcastChannel, sessionStorage compatibility
4. **Clerk API Changes** - External dependency updates

### 10.2 Mitigation Strategies

1. **Careful Async Testing** - Use proper async/await patterns, waitFor utilities
2. **Balanced Mocking** - Mock external APIs, test real component interactions
3. **Progressive Enhancement** - Graceful fallbacks untuk unsupported APIs
4. **Version Pinning** - Lock Clerk SDK versions, monitor for breaking changes

## 11. Appendix

### 11.1 File Structure

```
__tests__/integration/auth/
├── role-management.integration.test.ts
├── clerk-session.integration.test.ts
├── cross-tab-sync.integration.test.ts
├── cache-integration.integration.test.ts
├── middleware-authorization.integration.test.ts
├── dashboard-authorization.integration.test.ts
├── complete-user-journey.integration.test.ts
├── __mocks__/
│   ├── auth-mocks.ts
│   ├── clerk-mocks.ts
│   └── test-users.ts
└── utils/
    ├── test-helpers.ts
    └── integration-utils.ts
```

### 11.2 Reference Links

- [Jest Integration Testing Guide](https://jestjs.io/docs/testing-frameworks)
- [React Testing Library Integration](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Integration Testing](https://mswjs.io/docs/getting-started/integrate)
- [Clerk Testing Documentation](https://clerk.com/docs/testing)
