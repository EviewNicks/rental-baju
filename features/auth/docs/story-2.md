# User Story 2: Sistem Otorisasi Berbasis Peran

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

Sebagai admin, saya ingin dapat mengontrol akses fitur berdasarkan peran pengguna (Kasir, Producer, Owner) agar aplikasi aman. User Story ini fokus pada implementasi sistem otorisasi yang memungkinkan kontrol akses yang granular berdasarkan peran pengguna dalam aplikasi rental software.

Sistem ini akan memastikan bahwa setiap pengguna hanya dapat mengakses fitur yang sesuai dengan peran mereka, meningkatkan keamanan aplikasi dan memudahkan manajemen akses. Implementasi ini menggunakan Clerk sebagai provider autentikasi dengan custom claims untuk menyimpan informasi peran pengguna.

## Perbandingan dengan Referensi

| Fitur                    | Referensi (Clerk Documentation)         | Project Kita                            |
| ------------------------ | --------------------------------------- | --------------------------------------- |
| Custom Claims            | Clerk custom claims untuk metadata user | Implementasi role-based access control  |
| Role-based Authorization | Clerk session management                | Middleware otorisasi berbasis peran     |
| Route Protection         | Clerk middleware patterns               | Next.js middleware dengan role checking |

## Batasan dan Penyederhanaan Implementasi

1. **Batasan Role Hierarchy**:
   - Role Owner dapat mengakses semua fitur (Kasir + Producer + Owner features)
   - Role Producer dapat mengakses fitur Producer dan Kasir
   - Role Kasir hanya dapat mengakses fitur Kasir
   - Tidak ada role Admin (diganti dengan Kasir sesuai instruksi)

2. **Batasan Teknis**:
   - Menggunakan Clerk sebagai provider autentikasi
   - Implementasi terbatas pada Next.js middleware
   - Custom claims disimpan di Clerk Dashboard
   - Tidak ada implementasi role management UI di sprint ini

3. **Batasan Fitur**:
   - Fokus pada route protection
   - Belum ada UI untuk manajemen peran
   - Belum ada audit log untuk akses

## Spesifikasi Teknis

### Struktur Data

```typescript
// User Role Types
type UserRole = 'kasir' | 'producer' | 'owner'

// Session Claims Structure
interface SessionClaims {
  role: UserRole
  userId: string
  email: string
}

// Route Access Configuration
interface RouteAccess {
  path: string
  allowedRoles: UserRole[]
  redirectPath?: string
}
```

### Flow Pengguna

#### Flow Login dan Role Assignment:

1. Pengguna melakukan login melalui Clerk
2. Sistem mengambil custom claims dari session
3. Middleware memvalidasi role pengguna
4. Pengguna diarahkan ke dashboard sesuai peran

**Happy Path**:

- Pengguna dengan role valid dapat mengakses fitur sesuai peran
- Redirect otomatis ke halaman yang sesuai

**Error Paths**:

- Pengguna tanpa role valid diarahkan ke halaman unauthorized
- Pengguna mencoba akses fitur terlarang mendapat error 403

#### Flow Akses Fitur:

1. Pengguna mencoba mengakses route tertentu
2. Middleware memeriksa role dari session
3. Sistem memvalidasi apakah role diizinkan
4. Akses diberikan atau ditolak sesuai validasi

## Implementasi Teknis

### Konfigurasi Clerk Custom Claims

Implementasi akan menggunakan Clerk custom claims untuk menyimpan informasi peran pengguna. Claims ini akan dikonfigurasi melalui Clerk Dashboard dan diakses melalui session.

### Middleware Otorisasi

Middleware Next.js akan memeriksa role pengguna dari session claims dan memvalidasi akses ke route tertentu berdasarkan konfigurasi role yang diizinkan.

### API Endpoints

1. `GET /api/user/role` - Mengambil informasi peran pengguna
   - **Response**: `{ role: UserRole, userId: string }`
   - **Status Codes**: 200 OK, 401 Unauthorized

2. `GET /api/auth/validate-role` - Validasi peran untuk route tertentu
   - **Request Body**: `{ path: string }`
   - **Response**: `{ hasAccess: boolean, role: UserRole }`
   - **Status Codes**: 200 OK, 403 Forbidden

## Peningkatan UX

### Feedback Visual

- Tampilkan peran pengguna di header/navbar
- Berikan feedback jelas saat akses ditolak
- Redirect otomatis ke halaman yang sesuai

### Error Handling

- Halaman unauthorized yang informatif
- Pesan error yang jelas dan actionable
- Fallback ke halaman default jika terjadi error

## Test Plan

### Unit Testing

- Test custom hooks untuk role management
- Test utility functions untuk role validation
- Test middleware logic

### Integration Testing

- Test flow login dengan berbagai peran
- Test akses ke route yang berbeda
- Test error handling

### E2E Testing

- Test complete user journey dengan role berbeda
- Test unauthorized access scenarios
- Test role switching (jika ada)

## Pertanyaan untuk Diklarifikasi

1. Apakah perlu implementasi role management UI di sprint ini?
2. Bagaimana menangani kasus pengguna tanpa role yang valid?
3. Apakah perlu audit log untuk tracking akses?
4. Bagaimana menangani perubahan role real-time?

## Task Breakdown

- **RPK-9**: Mengonfigurasi Custom Claims di Clerk Dashboard
- **RPK-10**: Mengambil "role" dari Session Claims di Aplikasi
- **RPK-11**: Mengimplementasikan Middleware Otorisasi Berdasarkan "role"
- **RPK-17**: Menulis Test Case untuk Otorisasi Berbasis Peran

## Acceptance Criteria

- [ ] Custom claims untuk peran Kasir, Producer, dan Owner dikonfigurasi di Clerk
- [ ] Aplikasi dapat mengambil dan memvalidasi peran dari session
- [ ] Middleware berhasil membatasi akses berdasarkan peran
- [ ] Pengguna dengan role tidak valid mendapat feedback yang jelas
- [ ] Semua test case berhasil dijalankan
- [ ] Dokumentasi implementasi lengkap
