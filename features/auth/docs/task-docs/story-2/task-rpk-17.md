# Task RPK-17: Menulis Test Case untuk Otorisasi Berbasis Peran

## Daftar Isi

1. [Pendahuluan](mdc:#pendahuluan)
2. [Perbandingan dengan Referensi](mdc:#perbandingan-dengan-referensi)
3. [Batasan dan Penyederhanaan](mdc:#batasan-dan-penyederhanaan)
4. [Spesifikasi Teknis](mdc:#spesifikasi-teknis)
5. [Implementasi Teknis](mdc:#implementasi-teknis)
6. [Peningkatan UX](mdc:#peningkatan-ux)
7. [Test Plan](mdc:#test-plan)
8. [Pertanyaan untuk Diklarifikasi](mdc:#pertanyaan-untuk-diklarifikasi)

## Pendahuluan

Task ini fokus pada penulisan test case yang komprehensif untuk sistem otorisasi berbasis peran. Test case ini akan memastikan bahwa semua komponen sistem otorisasi berfungsi dengan benar dan dapat menangani berbagai skenario akses dengan baik.

Setelah implementasi sistem otorisasi selesai (RPK-9, RPK-10, RPK-11), test case ini akan memvalidasi bahwa role-based access control berfungsi sesuai dengan spesifikasi dan dapat menangani edge cases dengan baik.

## Perbandingan dengan Referensi

| Fitur                | Referensi (Testing Best Practices) | Project Kita                      |
| -------------------- | ---------------------------------- | --------------------------------- |
| Unit Testing         | Jest + React Testing Library       | Test custom hooks dan utilities   |
| Integration Testing  | MSW + Jest                         | Test middleware dan API endpoints |
| E2E Testing          | Playwright                         | Test complete user flows          |
| Test Data Management | Test fixtures dan mocks            | Role-based test users             |

## Batasan dan Penyederhanaan Implementasi

1. **Batasan Testing Scope**:
   - Fokus pada role-based authorization
   - Test untuk 3 role: Kasir, Producer, Owner
   - Belum ada test untuk role management UI

2. **Batasan Teknis**:
   - Menggunakan Jest untuk unit dan integration tests
   - Menggunakan Playwright untuk E2E tests
   - Mock Clerk session untuk testing

3. **Batasan Test Data**:
   - Test users dengan role yang sudah ditentukan
   - Tidak ada dynamic role creation
   - Focus pada happy path dan error scenarios

## Spesifikasi Teknis

### Struktur Test

```typescript
// Test User Types
interface TestUser {
  id: string
  email: string
  role: UserRole
  sessionClaims: SessionClaims
}

// Test Scenarios
interface TestScenario {
  name: string
  user: TestUser
  route: string
  expectedResult: 'allow' | 'deny' | 'redirect'
  expectedRedirect?: string
}
```

### Test Categories

1. **Unit Tests**: Custom hooks, utility functions
2. **Integration Tests**: Middleware, API endpoints
3. **E2E Tests**: Complete user flows
4. **Error Handling Tests**: Invalid scenarios

## Implementasi Teknis

### Test Setup

Implementasi akan membuat:

- Test fixtures untuk setiap role
- Mock Clerk session
- Test utilities untuk role validation
- Test helpers untuk common scenarios

### Test Coverage

1. **Role Validation Tests**:
   - Valid role values
   - Invalid role values
   - Missing role claims

2. **Route Access Tests**:
   - Authorized access
   - Unauthorized access
   - Redirect scenarios

3. **Error Handling Tests**:
   - Session expired
   - Invalid session
   - Network errors

### API Endpoints Testing

1. `GET /api/user/role` - Test role retrieval
2. `GET /api/auth/validate-access` - Test access validation

## Peningkatan UX

### Test Documentation

- Clear test descriptions
- Visual test results
- Performance metrics

### Test Maintenance

- Reusable test utilities
- Easy test data management
- Automated test execution

## Test Plan

### Unit Testing

#### Custom Hook Tests

- [ ] Test `useUserRole` hook dengan valid session
- [ ] Test `useUserRole` hook dengan invalid session
- [ ] Test `useUserRole` hook dengan expired session
- [ ] Test role validation utilities

#### Utility Function Tests

- [ ] Test role hierarchy validation
- [ ] Test route access validation
- [ ] Test error handling functions

### Integration Testing

#### Middleware Tests

- [ ] Test middleware dengan valid role untuk authorized route
- [ ] Test middleware dengan invalid role untuk protected route
- [ ] Test middleware dengan expired session
- [ ] Test redirect logic

#### API Endpoint Tests

- [ ] Test `/api/user/role` dengan valid session
- [ ] Test `/api/user/role` dengan invalid session
- [ ] Test `/api/auth/validate-access` dengan valid data
- [ ] Test `/api/auth/validate-access` dengan invalid data

### E2E Testing

#### User Flow Tests

- [ ] Test login Owner dan akses ke semua route
- [ ] Test login Producer dan akses ke route yang diizinkan
- [ ] Test login Kasir dan akses ke route yang diizinkan
- [ ] Test akses terlarang untuk setiap role

#### Error Scenario Tests

- [ ] Test dengan session expired
- [ ] Test dengan invalid role
- [ ] Test dengan network errors
- [ ] Test unauthorized page display

### Performance Testing

#### Load Tests

- [ ] Test middleware performance dengan multiple requests
- [ ] Test role validation performance
- [ ] Test session retrieval performance

## Pertanyaan untuk Diklarifikasi

1. Apakah perlu test untuk concurrent user scenarios?
2. Bagaimana menangani test data cleanup?
3. Apakah perlu test untuk role switching?
4. Bagaimana menangani test environment setup?

## Definition of Done

- [ ] Unit tests untuk semua custom hooks dan utilities
- [ ] Integration tests untuk middleware dan API endpoints
- [ ] E2E tests untuk complete user flows
- [ ] Error handling tests untuk semua scenarios
- [ ] Test coverage minimum 80%
- [ ] All tests passing
- [ ] Test documentation lengkap

## Estimasi Effort

**Total**: 4 jam

- Unit tests: 1.5 jam
- Integration tests: 1.5 jam
- E2E tests: 1 jam

## Dependensi

- RPK-9: Custom claims sudah dikonfigurasi
- RPK-10: Role dapat diambil dari session
- RPK-11: Middleware otorisasi sudah diimplementasikan
- Jest dan Playwright setup
- Test environment configuration

## Catatan Tambahan

- Pastikan test data tidak mempengaruhi production
- Implementasikan proper test isolation
- Dokumentasikan semua test scenarios
- Siapkan CI/CD integration untuk automated testing

## Referensi

- [Clerk Custom Claims Documentation](https://clerk.com/docs/guides/authorization-checks)
- [Clerk Organizations Overview](https://clerk.com/docs/organizations/overview)
- [Clerk Session Management](https://clerk.com/docs/guides/authorization-checks)
