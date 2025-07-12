# Task TSK-40: Menulis Test Case untuk Otorisasi Berbasis Peran

## Daftar Isi

1. [Pendahuluan](#pendahuluan)
2. [Batasan dan Penyederhanaan](#batasan-dan-penyederhanaan)
3. [Spesifikasi Teknis](#spesifikasi-teknis)
4. [Implementasi Teknis](#implementasi-teknis)
5. [Test Plan](#test-plan)

## Pendahuluan

Task ini bertujuan untuk membuat comprehensive E2E test cases untuk sistem otorisasi berbasis peran (Role-Based Access Control) yang telah diimplementasikan dalam TSK-15. Test cases ini akan memvalidasi bahwa sistem RBAC berfungsi dengan benar dan user hanya dapat mengakses fitur sesuai dengan role mereka.

Tujuan utama task ini:

- Membuat test cases untuk memvalidasi akses berbasis peran (Admin, Creator, User)
- Memastikan unauthorized access diblokir dengan proper error handling
- Validasi role hierarchy dan permission inheritance
- Testing route-level authorization dan UI-level access control

Nilai bisnis yang dihasilkan adalah confidence bahwa sistem keamanan aplikasi bekerja dengan benar, memastikan data dan fitur hanya dapat diakses oleh user yang berwenang, dan mengurangi risiko security breach.

## Batasan dan Penyederhanaan

1. **Fokus Role-Based Authorization**:
   - Testing terbatas pada 3 role utama: Admin, Creator, User
   - Tidak mencakup granular permissions atau dynamic roles
   - Fokus pada route-level authorization

2. **Test Scope**:
   - Testing akses ke route utama (`/admin/*`, `/creator/*`, `/user/*`)
   - Tidak testing semua sub-routes secara detail
   - Fokus pada critical access control points

3. **Role Assignment**:
   - Menggunakan pre-configured test users dengan role yang sudah ditetapkan
   - Tidak testing dynamic role assignment atau role changes
   - Role management melalui Clerk custom claims

4. **Error Handling**:
   - Testing redirect ke `/unauthorized` page
   - Tidak testing semua possible error scenarios
   - Fokus pada user-facing error experience

## Spesifikasi Teknis

### Struktur Test Data

```typescript
// Role-based Test Users
interface RoleTestUser {
  email: string
  password: string
  role: 'admin' | 'creator' | 'user'
  allowedRoutes: string[]
  restrictedRoutes: string[]
  displayName: string
}

// Authorization Test Scenarios
interface AuthorizationTestScenario {
  role: string
  testUser: RoleTestUser
  accessTests: AccessTest[]
  restrictionTests: RestrictionTest[]
}

// Access Control Configuration
interface AccessControlConfig {
  admin: {
    allowedRoutes: string[]
    dashboardUrl: string
  }
  creator: {
    allowedRoutes: string[]
    restrictedRoutes: string[]
    dashboardUrl: string
  }
  user: {
    allowedRoutes: string[]
    restrictedRoutes: string[]
    dashboardUrl: string
  }
}
```

### Flow Pengguna

#### 1. Admin Authorization Flow:

1. Admin user login ke aplikasi
2. User mengakses berbagai routes (`/admin/*`, `/creator/*`, `/user/*`)
3. Sistem memvalidasi role dan memberikan akses penuh
4. Verifikasi admin dapat mengakses semua fitur
5. Verifikasi admin dashboard dan menu tersedia

**Happy Path**:

- Admin dapat mengakses semua routes tanpa restriction
- Admin dashboard menampilkan semua management features
- Admin menu items tersedia dan functional

#### 2. Creator Authorization Flow:

1. Creator user login ke aplikasi
2. User mengakses creator routes (`/creator/*`) - should succeed
3. User mengakses user routes (`/user/*`) - should succeed
4. User mencoba mengakses admin routes (`/admin/*`) - should be blocked
5. Verifikasi proper error handling untuk unauthorized access

**Happy Path**:

- Creator dapat mengakses creator dan user routes
- Creator dashboard menampilkan appropriate features
- Creator menu items sesuai dengan permissions

**Error Paths**:

- Admin routes diblokir dengan redirect ke `/unauthorized`
- Proper error message ditampilkan

#### 3. User Authorization Flow:

1. Regular user login ke aplikasi
2. User mengakses user routes (`/user/*`) - should succeed
3. User mencoba mengakses creator routes (`/creator/*`) - should be blocked
4. User mencoba mengakses admin routes (`/admin/*`) - should be blocked
5. Verifikasi consistent error handling

**Happy Path**:

- User dapat mengakses user routes
- User dashboard menampilkan basic features
- User menu items terbatas sesuai permissions

**Error Paths**:

- Creator dan admin routes diblokir
- Consistent redirect ke `/unauthorized` page
- Appropriate error messages

#### 4. Unauthorized Access Flow:

1. User dengan role tertentu mencoba mengakses restricted route
2. Middleware mendeteksi unauthorized access
3. User diarahkan ke `/unauthorized` page
4. Error message yang informatif ditampilkan
5. User dapat navigate kembali ke allowed routes

## Implementasi Teknis

### 1. Role-based Test Users Setup

Setup test users dengan role yang berbeda:

```typescript
// __tests__/playwright/fixtures/role-test-users.ts
export const roleTestUsers = {
  admin: {
    email: 'admin.test@maguru.test',
    password: 'AdminPassword123!',
    role: 'admin' as const,
    allowedRoutes: ['/admin', '/creator', '/user', '/dashboard'],
    restrictedRoutes: [],
    displayName: 'Admin Test User',
  },
  creator: {
    email: 'creator.test@maguru.test',
    password: 'CreatorPassword123!',
    role: 'creator' as const,
    allowedRoutes: ['/creator', '/user', '/dashboard'],
    restrictedRoutes: ['/admin'],
    displayName: 'Creator Test User',
  },
  user: {
    email: 'user.test@maguru.test',
    password: 'UserPassword123!',
    role: 'user' as const,
    allowedRoutes: ['/user', '/dashboard'],
    restrictedRoutes: ['/admin', '/creator'],
    displayName: 'Regular Test User',
  },
}
```


### API Endpoints

Test akan menggunakan existing application routes dan middleware:

1. **Application Routes dengan Authorization**:
   - `/admin/*` - Admin-only routes
   - `/creator/*` - Creator and Admin routes
   - `/user/*` - All authenticated users
   - `/unauthorized` - Error page untuk unauthorized access

2. **Middleware Authorization** - Route-level access control validation

## Test Plan

### 3. E2E Testing (BDD)

#### Pendekatan:

- Menggunakan format Given-When-Then (BDD)
- Testing dengan multiple user roles
- Comprehensive coverage untuk access control scenarios
- Validation of both positive and negative authorization cases

#### Test Scenarios:

**1. Admin Full Access Verification**:

- **Given**: User login sebagai admin
- **When**: User mengakses semua available routes
- **Then**: User dapat mengakses semua routes tanpa restriction

**2. Admin UI Elements Verification**:

- **Given**: Admin user sudah login
- **When**: User berada di dashboard
- **Then**: Admin-specific UI elements dan menu items tersedia

**3. Creator Allowed Access Verification**:

- **Given**: User login sebagai creator
- **When**: User mengakses creator dan user routes
- **Then**: User dapat mengakses routes tersebut dengan success

**4. Creator Restricted Access Verification**:

- **Given**: Creator user sudah login
- **When**: User mencoba mengakses admin routes
- **Then**: User diarahkan ke unauthorized page dengan error message

**5. Creator UI Elements Verification**:

- **Given**: Creator user sudah login
- **When**: User berada di dashboard
- **Then**: Creator-specific UI elements tersedia, admin elements tidak terlihat

**6. User Allowed Access Verification**:

- **Given**: User login sebagai regular user
- **When**: User mengakses user routes
- **Then**: User dapat mengakses routes dengan success

**7. User Restricted Access Verification**:

- **Given**: Regular user sudah login
- **When**: User mencoba mengakses admin atau creator routes
- **Then**: User diarahkan ke unauthorized page

**8. User UI Elements Verification**:

- **Given**: Regular user sudah login
- **When**: User berada di dashboard
- **Then**: Hanya user-level UI elements yang tersedia

**9. Unauthorized Page Functionality**:

- **Given**: User mengakses restricted route dan diarahkan ke unauthorized page
- **When**: User berada di unauthorized page
- **Then**: Appropriate error message ditampilkan dan user dapat navigate back

**10. Role Persistence Across Sessions**:

- **Given**: User login dengan role tertentu
- **When**: User refresh page atau navigate antar routes
- **Then**: Role permissions tetap konsisten

**11. Direct URL Access Testing**:

- **Given**: User dengan role tertentu
- **When**: User mencoba mengakses restricted route via direct URL
- **Then**: Authorization middleware mendeteksi dan memblokir akses

**12. Navigation Menu Role-Based Display**:

- **Given**: User login dengan role tertentu
- **When**: User melihat navigation menu
- **Then**: Hanya menu items yang sesuai dengan role yang ditampilkan

## Referensi

1. [Clerk Testing with Playwright - Overview](https://clerk.com/docs/testing/playwright/overview)
2. [Clerk Testing - Test Helpers](https://clerk.com/docs/testing/playwright/test-helpers)
3. [Clerk Testing - Authenticated Flows](https://clerk.com/docs/testing/playwright/test-authenticated-flows)
4. [Playwright Best Practices](https://playwright.dev/docs/best-practices)
5. [Next.js Middleware Testing](https://nextjs.org/docs/14/app/building-your-application)
6. [PR TSK-15: Role-Based Access Control Implementation](docs/PR/PR_TSK_15.md)
7. [RBAC Best Practices](https://auth0.com/docs/manage-users/access-control/rbac)
