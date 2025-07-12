# Task TSK-33: Ambil Role dari Session Claims

## Daftar Isi

1. [Pendahuluan](#pendahuluan)
2. [Batasan dan Penyederhanaan](#batasan-dan-penyederhanaan)
3. [Spesifikasi Teknis](#spesifikasi-teknis)
4. [Implementasi Teknis](#implementasi-teknis)
5. [Test Plan](#test-plan)
6. [Pertanyaan untuk Diklarifikasi](#pertanyaan-untuk-diklarifikasi)

## Pendahuluan

Task ini bertujuan untuk mengimplementasikan sistem pengambilan dan pengelolaan role pengguna dari Clerk session claims dalam aplikasi Maguru. Setelah TSK-32 berhasil mengkonfigurasi custom claim "role" di Clerk Dashboard, sekarang aplikasi perlu dapat mengekstrak informasi role dari JWT token dan menyimpannya dalam state aplikasi untuk keperluan authorization.

Task ini merupakan lanjutan dari TSK-32 dan menjadi prerequisite untuk TSK-34 (Implementasi Middleware Otorisasi). Dengan implementasi ini, aplikasi dapat secara dinamis mengetahui peran pengguna dan menggunakannya untuk kontrol akses ke berbagai fitur.

**Nilai Bisnis**: Memungkinkan aplikasi untuk secara real-time mengetahui peran pengguna dan menyediakan experience yang sesuai dengan authorization level masing-masing pengguna.

## Batasan dan Penyederhanaan

1. **Batasan Teknis**:
   - Hanya mendukung single role per user (tidak multiple roles)
   - Role disimpan dalam React Context untuk state management sederhana
   - Tidak ada offline caching untuk role information pada phase ini

2. **Batasan Scope**:
   - Fokus pada client-side implementation (Next.js frontend)
   - Server-side role verification akan dihandle di TSK-34
   - Tidak termasuk role assignment interface (akan dibuat terpisah)

3. **Batasan Error Handling**:
   - Basic error handling untuk invalid tokens
   - Fallback ke role "user" jika terjadi error parsing
   - Tidak ada advanced retry mechanisms

## Spesifikasi Teknis

### Struktur Role Data

```typescript
// Role Types
type UserRole = 'admin' | 'creator' | 'user'

// User Role Context State
interface UserRoleState {
  role: UserRole | null
  isLoading: boolean
  error: string | null
}

// Role Context Actions
interface UserRoleActions {
  setRole: (role: UserRole) => void
  clearRole: () => void
  refreshRole: () => Promise<void>
}

// Combined Context Type
interface UserRoleContextType extends UserRoleState, UserRoleActions {}
```

### Flow Pengambilan Role

#### Alur Normal (Happy Path):

1. User berhasil login melalui Clerk
2. Aplikasi mendeteksi session change
3. Hook `useUserRole` mengambil session dari Clerk
4. Ekstrak custom claim "role" dari JWT token
5. Simpan role di React Context state
6. Komponen dapat mengakses role melalui context

**Happy Path**:

- Session tersedia dan valid
- JWT token mengandung custom claim "role"
- Role value valid ("admin", "creator", atau "user")
- State berhasil di-update dan komponen re-render

**Error Paths**:

- Session tidak tersedia → set role sebagai null
- JWT token invalid → fallback ke role "user" + log error
- Role claim tidak ada → gunakan default "user"
- Network error → retry dengan exponential backoff

## Implementasi Teknis

### Arsitektur Komponen

#### 1. Role Context Provider

**Lokasi**: `features/auth/context/UserRoleContext.tsx`

**Tanggung Jawab**:

- Mengelola global state untuk user role
- Menyediakan actions untuk update/clear role
- Handle error states dan loading states

#### 2. Custom Hook untuk Role Management

**Lokasi**: `features/auth/hooks/useUserRole.ts`

**Tanggung Jawab**:

- Mengambil session dari Clerk
- Parse JWT token untuk ekstrak role claim
- Update context state
- Handle error scenarios

#### 3. Utility Functions

**Lokasi**: `features/auth/utils/roleUtils.ts`

**Tanggung Jawab**:

- Validate role values
- Parse JWT tokens safely

#### 4. types auth & othorisation

**Lokasi**: `features/auth/types/roleTypes.ts`

**Tanggung Jawab**:

- Type guards untuk role checking

### API Integration

#### Clerk Session Management

```typescript
// Example implementation pattern
const getUserRole = async (): Promise<UserRole> => {
  try {
    const session = await window.Clerk.session
    if (!session) return 'user'

    const token = await session.getToken()
    const decoded = parseJWT(token)

    return validateRole(decoded.role) || 'user'
  } catch (error) {
    console.error('Error getting user role:', error)
    return 'user'
  }
}
```

### State Management Strategy

#### React Context Pattern

```typescript
// Context structure planning
const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined)

// Provider implementation akan mencakup:
// - Initial role fetch on mount
// - Sync dengan Clerk session changes
// - Error boundary untuk graceful failures
// - Loading states untuk better UX
```

### Integration Points

#### 1. Clerk Session Events

- Listen untuk `session.created` events
- Listen untuk `session.updated` events
- Handle `session.destroyed` events

#### 2. Route Level Integration

- Context tersedia di semua protected routes
- Automatic role refresh on route change
- Compatibility dengan Next.js App Router

## Test Plan

### 1. Unit Testing (TDD)

#### Pendekatan:

- Test-driven development untuk semua utility functions
- Mock Clerk session untuk consistent testing
- Struktur AAA (Arrange, Act, Assert)

#### Test Cases:

1. **parseJWT Function**:
   - Test case: Parse valid JWT dengan role claim
   - Expected: Return correct UserRole
   - Edge cases: Invalid JWT, missing role claim, malformed token

2. **validateRole Function**:
   - Test case: Validate berbagai role values
   - Expected: Return valid UserRole atau null
   - Edge cases: Invalid strings, null/undefined values, case sensitivity

3. **getUserRole Hook**:
   - Test case: Ambil role dari valid session
   - Expected: Return correct role dan update state
   - Edge cases: No session, invalid token, network errors

### 2. Integration Testing

#### Pendekatan:

- Test integrasi antara Clerk session dan React Context
- Mock service worker untuk simulate session states
- React Testing Library untuk test komponen

#### Test Cases:

1. **Context Provider Integration**:
   - Skenario: Provider mounts dengan valid session
   - Components: UserRoleProvider, useUserRole hook
   - Expected: Context state ter-update dengan correct role

2. **Session Change Handling**:
   - Skenario: User login/logout/role change
   - Components: Clerk session events, Context state updates
   - Expected: State sync dengan session changes

#### Test Scenarios:

1. **User Login dan Role Detection**:
   - **Given**: User dengan role "admin" melakukan login
   - **When**: Aplikasi load dan context initialize
   - **Then**: Context state shows role "admin"

2. **Role Change Handling**:
   - **Given**: User sudah login dengan role "user"
   - **When**: Admin mengubah role user menjadi "creator"
   - **Then**: Context state ter-update ke "creator" setelah session refresh

## Pertanyaan untuk Diklarifikasi

1. **State Persistence**: Apakah role perlu di-persist di localStorage untuk UX yang lebih baik, atau cukup re-fetch setiap session?
   **jawab**: Menggunakan React Context dengan sessionStorage sebagai backup. Role tidak di-persist di localStorage untuk security reasons, tetapi menggunakan session-based caching untuk menghindari frequent API calls.

2. **Error Boundaries**: Bagaimana strategy untuk handle errors di Context level? Apakah perlu global error boundary khusus untuk role management?
   **jawab**: Implementasi Error Boundary khusus untuk role management dengan graceful fallback ke role "user", retry mechanisms, dan logging untuk monitoring.

3. **Performance Considerations**: Apakah perlu implement caching atau debouncing untuk role fetching, terutama pada frequent session checks?
   **jawab**:Implementasi debouncing untuk role fetching, memoization pada Context provider, dan caching dengan TTL (Time To Live) untuk mengurangi unnecessary API calls.

4. **Development Mode**: Bagaimana handle role testing dalam development mode? Apakah perlu mock user selector untuk testing?
   **jawab**: Mock user selector dengan environment variable untuk testing different roles, plus development-only role switcher component.

5. **Concurrent Sessions**: Bagaimana handle scenario dimana user memiliki multiple tabs dengan different sessions?
   **jawab**:Event-driven sync menggunakan BroadcastChannel API untuk sync role changes across tabs, dengan conflict resolution strategy.

---

## Checklist Implementasi

### Pre-Implementation

- [ ] Verifikasi TSK-32 sudah selesai dan custom claims berfungsi
- [ ] Setup development environment dengan Clerk integration
- [ ] Buat test cases dan mock data untuk development

### Implementation Steps

- [ ] Buat UserRole types dan interfaces
- [ ] Implementasi utility functions (parseJWT, validateRole)
- [ ] Buat UserRoleContext dan Provider
- [ ] Implementasi useUserRole custom hook
- [ ] Integrasi dengan Clerk session events
- [ ] Add error handling dan loading states
- [ ] Implementasi fallback mechanisms

### Documentation & Handover

- [ ] Update TypeScript types documentation
- [ ] Buat usage examples untuk developers
- [ ] Document error scenarios dan solutions
- [ ] Coordinate dengan team untuk TSK-34

### Definition of Done

- [ ] Role berhasil diambil dari Clerk session claims
- [ ] Role tersimpan dan accessible melalui React Context
- [ ] Unit tests passing dengan coverage > 80%
- [ ] Error handling robust untuk semua edge cases
- [ ] Performance acceptable untuk production usage
- [ ] Documentation lengkap untuk developer reference
- [ ] Integration dengan existing authentication flow seamless

**Owner**: Bob  
**Story Points**: 2  
**Priority**: High (Prerequisite untuk TSK-34)  
**Dependencies**: TSK-32 (Custom Claims Configuration)

## Referensi

- [Clerk Session Tokens Documentation](https://clerk.com/docs/backend-requests/resources/session-tokens)
- [Clerk Custom Session Token Guide](https://clerk.com/docs/backend-requests/custom-session-token)
- [Next.js App Router Authentication Patterns](https://nextjs.org/docs/app/building-your-application/authentication)
- [React Context Best Practices](https://react.dev/learn/passing-data-deeply-with-context)
