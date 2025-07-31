# Task RPK-11: Mengimplementasikan Middleware Otorisasi Berdasarkan "role"

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

Task ini fokus pada implementasi middleware Next.js yang memeriksa peran pengguna dan membatasi akses ke rute atau fitur tertentu berdasarkan konfigurasi role yang diizinkan. Middleware ini akan menjadi komponen kunci dalam sistem keamanan aplikasi rental software.

Setelah role dapat diambil dari session claims (RPK-10), middleware akan memvalidasi akses pengguna ke berbagai route berdasarkan peran mereka dan mengarahkan mereka ke halaman yang sesuai atau menolak akses jika tidak diizinkan.

## Perbandingan dengan Referensi

| Fitur                | Referensi (Next.js Middleware) | Project Kita                         |
| -------------------- | ------------------------------ | ------------------------------------ |
| Route Protection     | Next.js middleware patterns    | Role-based route protection          |
| Authentication Check | Clerk middleware integration   | Session validation dengan role check |
| Authorization Logic  | Custom authorization rules     | Role hierarchy validation            |

## Batasan dan Penyederhanaan Implementasi

1. **Batasan Role Hierarchy**:
   - Owner: Akses ke semua route
   - Producer: Akses ke route Producer dan Kasir
   - Kasir: Akses terbatas hanya ke route Kasir

2. **Batasan Teknis**:
   - Implementasi menggunakan Next.js middleware
   - Validasi dilakukan di server-side
   - Redirect ke halaman unauthorized jika akses ditolak

3. **Batasan Route**:
   - Fokus pada route utama: `/admin`, `/creator`, `/kasir`
   - Belum ada fine-grained route protection
   - Tidak ada dynamic route protection

## Spesifikasi Teknis

### Struktur Data

```typescript
// Route Access Configuration
interface RouteAccess {
  path: string
  allowedRoles: UserRole[]
  redirectPath?: string
}

// Middleware Configuration
interface MiddlewareConfig {
  routes: RouteAccess[]
  defaultRedirect: string
  unauthorizedPath: string
}

// Role Hierarchy
const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  owner: ['owner', 'producer', 'kasir'],
  producer: ['producer', 'kasir'],
  kasir: ['kasir'],
}
```

### Flow Pengguna

#### Flow Middleware Authorization:

1. Pengguna mencoba mengakses route tertentu
2. Middleware memeriksa session dan mengambil role
3. Sistem memvalidasi apakah role diizinkan untuk route
4. Jika diizinkan, akses diberikan
5. Jika tidak diizinkan, redirect ke halaman unauthorized

**Happy Path**:

- Role valid untuk route yang diakses
- Akses diberikan tanpa gangguan
- Redirect otomatis ke halaman yang sesuai

**Error Paths**:

- Role tidak valid untuk route
- Session tidak ada atau expired
- Role tidak dikenali

## Implementasi Teknis

### Middleware Configuration

Implementasi akan membuat middleware Next.js yang:

- Memeriksa session Clerk
- Mengekstrak role dari claims
- Memvalidasi akses berdasarkan role hierarchy
- Melakukan redirect jika diperlukan

### Route Protection Strategy

1. **Admin Routes** (`/admin/*`): Hanya Owner
2. **Creator Routes** (`/creator/*`): Owner dan Producer
3. **Kasir Routes** (`/kasir/*`): Owner, Producer, dan Kasir

### API Endpoints

1. `GET /api/auth/validate-access` - Validasi akses untuk route tertentu
   - **Request Body**: `{ path: string, role: UserRole }`
   - **Response**: `{ hasAccess: boolean, redirectPath?: string }`
   - **Status Codes**: 200 OK, 403 Forbidden

## Peningkatan UX

### Seamless Navigation

- Redirect otomatis ke halaman yang sesuai dengan role
- Tidak ada flash content sebelum redirect
- Loading state yang smooth

### Error Feedback

- Halaman unauthorized yang informatif
- Pesan error yang jelas dan actionable
- Link untuk kembali ke halaman yang diizinkan

## Test Plan

### Unit Testing

- Test middleware logic untuk setiap role
- Test route validation functions
- Test error handling scenarios

### Integration Testing

- Test dengan session yang valid
- Test dengan session yang expired
- Test dengan role yang tidak valid

### E2E Testing

- [ ] Test akses Owner ke semua route
- [ ] Test akses Producer ke route yang diizinkan
- [ ] Test akses Kasir ke route yang diizinkan
- [ ] Test akses terlarang untuk setiap role
- [ ] Test redirect behavior

## Pertanyaan untuk Diklarifikasi

1. Bagaimana menangani kasus user tanpa role yang valid?
2. Apakah perlu audit log untuk akses yang ditolak?
3. Bagaimana menangani perubahan role real-time?
4. Apakah perlu fallback route untuk error scenarios?

## Definition of Done

- [ ] Middleware Next.js berhasil diimplementasikan
- [ ] Route protection untuk semua role berfungsi
- [ ] Redirect logic berfungsi dengan benar
- [ ] Error handling untuk berbagai skenario
- [ ] Unit tests berhasil dijalankan
- [ ] Integration tests berhasil dijalankan
- [ ] E2E tests berhasil dijalankan

## Estimasi Effort

**Total**: 6 jam

- Implementasi middleware: 3 jam
- Route configuration: 1 jam
- Testing dan debugging: 2 jam

## Dependensi

- RPK-9: Custom claims sudah dikonfigurasi
- RPK-10: Role dapat diambil dari session
- Next.js middleware setup
- Clerk middleware integration

## Catatan Tambahan

- Pastikan middleware tidak mempengaruhi performance
- Implementasikan proper caching untuk role validation
- Dokumentasikan semua route protection rules
- Siapkan monitoring untuk unauthorized access attempts

## Referensi

- [Clerk Custom Claims Documentation](https://clerk.com/docs/guides/authorization-checks)
- [Clerk Organizations Overview](https://clerk.com/docs/organizations/overview)
- [Clerk Session Management](https://clerk.com/docs/guides/authorization-checks)
