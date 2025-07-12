# Task OPS-34: Implementasi Middleware Otorisasi

## Daftar Isi

1. [Pendahuluan](#pendahuluan)
2. [Perbandingan dengan Referensi](#perbandingan-dengan-referensi)
3. [Batasan dan Penyederhanaan](#batasan-dan-penyederhanaan)
4. [Spesifikasi Teknis](#spesifikasi-teknis)
5. [Implementasi Teknis](#implementasi-teknis)
6. [Peningkatan UX](#peningkatan-ux)
7. [Test Plan](#test-plan)

## Pendahuluan

Task ini bertujuan untuk mengimplementasikan middleware otorisasi yang memeriksa role pengguna sebelum mengizinkan akses ke rute terproteksi. Middleware ini akan membangun di atas sistem role management yang telah diimplementasikan di TSK-33, memberikan layer keamanan tambahan pada aplikasi dengan memastikan hanya pengguna dengan role yang sesuai yang dapat mengakses fitur-fitur tertentu.

Nilai bisnis dari implementasi ini adalah meningkatkan keamanan aplikasi, memastikan proper access control, dan memberikan pengalaman pengguna yang lebih aman dengan mencegah akses unauthorized ke area sensitif aplikasi.

## Perbandingan dengan Referensi

| Fitur                  | Clerk Documentation                      | Project Maguru                             |
| ---------------------- | ---------------------------------------- | ------------------------------------------ |
| Route Protection       | `createRouteMatcher()` dengan auth check | Custom role-based route matching           |
| Middleware Integration | Basic `clerkMiddleware()`                | Extended dengan role validation            |
| Error Handling         | Standard redirect                        | Graceful fallback dengan UX considerations |
| Route Patterns         | Simple pattern matching                  | Hierarchical role-based patterns           |
| Development Support    | Basic development mode                   | Enhanced dengan development tools          |

## Batasan dan Penyederhanaan Implementasi

1. **Role Hierarchy Sederhana**:
   - Hanya 3 level role: `admin` > `creator` > `user`
   - Tidak mendukung complex permission matrix
   - Role inheritance sederhana (admin dapat akses semua)

2. **Route Pattern Limitations**:
   - Menggunakan pattern matching sederhana
   - Tidak mendukung dynamic role requirements per route
   - Focus pada static route protection

3. **Error Handling Simplified**:
   - Single error page untuk unauthorized access
   - Tidak ada fine-grained error messages per role
   - Basic logging untuk security events

4. **Development vs Production**:
   - Development mode memiliki bypass options
   - Production mode strictly enforced
   - Tidak ada runtime role switching di production

## Spesifikasi Teknis

### Route Protection Schema

```typescript
// Route protection definitions
interface RouteProtection {
  pattern: string | string[]
  requiredRole: UserRole | UserRole[]
  allowBypass?: boolean // development only
  redirectTo?: string
}

// Role hierarchy definition
const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  creator: 2,
  admin: 3,
}
```

### Flow Pengguna

#### Happy Path (Authorized Access):

1. User mengakses protected route (e.g., `/dashboard/admin`)
2. Middleware intercepts request
3. Middleware check user session dari Clerk
4. Middleware extract role dari session token
5. Middleware validate role terhadap route requirements
6. User role sufficient → allow access
7. Route rendered normally

#### Error Path (Unauthorized Access):

1. User mengakses protected route tanpa proper role
2. Middleware intercepts dan detect insufficient permissions
3. Middleware redirect ke appropriate error/login page
4. User melihat friendly error message
5. User dapat redirect ke login atau contact admin

#### Edge Cases:

1. **No Session**: Redirect ke sign-in page
2. **Invalid Token**: Clear session dan redirect ke sign-in
3. **Network Error**: Graceful fallback dengan retry mechanism
4. **Role Loading**: Show loading state, allow access setelah role loaded

### Pseudocode Implementation

```
BEGIN middleware_authorization
  REQUEST incoming_request

  IF route_needs_protection(incoming_request.path) THEN
    SESSION user_session = get_clerk_session()

    IF user_session IS NULL THEN
      REDIRECT_TO sign_in_page
      RETURN
    ENDIF

    ROLE user_role = extract_role_from_session(user_session)
    ROLE required_role = get_required_role(incoming_request.path)

    IF NOT has_sufficient_role(user_role, required_role) THEN
      IF development_mode AND allow_bypass THEN
        LOG "Development bypass enabled"
        CONTINUE
      ELSE
        REDIRECT_TO unauthorized_page
        RETURN
      ENDIF
    ENDIF
  ENDIF

  CONTINUE_TO next_middleware_or_page
END
```

## Implementasi Teknis

### Middleware Architecture

Implementasi akan memperluas `middleware.ts` yang sudah ada dengan menambahkan role-based authorization logic di atas Clerk's authentication middleware.

### Core Components

1. **Route Matchers**: Definisi pattern untuk different protection levels
2. **Role Validator**: Logic untuk validate user role terhadap requirements
3. **Redirect Handler**: Intelligent redirect berdasarkan error type
4. **Development Tools**: Bypass dan debugging tools untuk development

### Integration Points

- **Clerk Middleware**: Leverage existing `clerkMiddleware()`
- **Role Management**: Integrate dengan `UserRoleProvider` dari TSK-33
- **Error Handling**: Consistent dengan designing-for-failure principles
- **Development Mode**: Support untuk development testing

### Route Protection Patterns

```typescript
// Example route protection definitions
const PROTECTED_ROUTES = {
  adminRoutes: {
    patterns: ['/dashboard/admin', '/dashboard/admin/(.*)'],
    requiredRole: 'admin',
    redirectTo: '/unauthorized',
  },
  creatorRoutes: {
    patterns: ['/dashboard/content', '/dashboard/content/(.*)'],
    requiredRole: ['admin', 'creator'],
    redirectTo: '/unauthorized',
  },
  userRoutes: {
    patterns: ['/dashboard', '/dashboard/profile'],
    requiredRole: ['admin', 'creator', 'user'],
    redirectTo: '/sign-in',
  },
}
```

## Peningkatan UX

### Smart Redirects

- Context-aware redirects berdasarkan user state
- Preserve intended destination setelah login
- Friendly error messages dengan actionable steps

### Loading States

- Graceful loading saat role sedang di-fetch
- Progressive enhancement untuk better perceived performance
- Skeleton loading untuk protected content

### Error Recovery

- Clear error messages dengan next steps
- Contact admin options untuk permission issues
- Retry mechanisms untuk transient errors

### Development Experience

- Visual indicators untuk protected routes di development
- Easy debugging dengan console logs
- Bypass options untuk testing different roles

## Test Plan

### 1. Unit Testing (TDD)

#### Pendekatan:

- Test route matching logic secara isolated
- Test role validation functions
- Test error handling scenarios
- Target: middleware utility functions

#### Test Cases:

1. **Route Matcher Functions**:
   - Test case: Pattern matching untuk different route types
   - Expected: Correct route identification
   - Edge cases: Nested routes, dynamic segments, trailing slashes

2. **Role Validation Logic**:
   - Test case: Role hierarchy validation
   - Expected: Proper role comparison (admin > creator > user)
   - Edge cases: Invalid roles, null roles, case sensitivity

3. **Redirect Logic**:
   - Test case: Appropriate redirect URLs berdasarkan context
   - Expected: Correct destination URLs
   - Edge cases: Development vs production, different error types

### 2. Integration Testing

#### Pendekatan:

- Test middleware integration dengan Clerk
- Test end-to-end authorization flow
- Mock Clerk session untuk predictable testing

#### Test Cases:

1. **Middleware Integration**:
   - Skenario: Full request cycle dengan role checking
   - Components: clerkMiddleware, role validation, route protection
   - Expected: Proper authorization decisions

2. **Error Handling Integration**:
   - Skenario: Various error scenarios (no session, invalid role, etc.)
   - Components: Error detection, redirect logic, user feedback
   - Expected: Graceful error handling dan appropriate redirects

## Referensi

1. [Clerk Middleware Documentation](https://clerk.com/docs/references/nextjs/clerk-middleware)
2. [Next.js Middleware Guide](https://nextjs.org/docs/app/building-your-application/routing/middleware)
3. [TSK-33: Role Management Implementation](./task-ops-33.md)
4. [Role-Based Access Control Best Practices](https://clerk.com/docs/guides/basic-rbac)
